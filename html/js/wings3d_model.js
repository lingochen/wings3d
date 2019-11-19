/*
*  hold onto a WingedEdgeTopology. adds index, texture, etc....
*  bounding box, picking.
* 
*  previewCage. Internal representation rewrote many times.
*  Finally decided to trade space for ease of implementation and 
*  no worst case non linear runtimes.
* 
*  Add PreviewGroup. simple grouping without transform.
*/
"use strict";
import {LooseOctree, Plane} from './wings3d_boundingvolume.js';
import {WingedTopology, Vertex} from './wings3d_wingededge.js';
import {Material} from './wings3d_material.js';
import * as View from './wings3d_view.js';
import * as Wings3D from './wings3d.js';
import {EditCommand} from './wings3d_undo.js';
import * as Util from './wings3d_util.js';
import {i18n} from './wings3d_i18n.js';
import { ByteBuffer } from './wings3d_gl.js';


/**
 * PreviewGroup constructor.
 * 
 */
const PreviewGroup = function() {
   this.group = [];
   this.parent = null;
   this.uuid = Util.get_uuidv4();
   this.guiStatus = {};
   this.status = {locked: false, visible: true, wireMode: false};

   // default to no name
   this._name = "";
   // how about bvh?

};

/**
 * registration for handling setting of names.
 */
PreviewGroup.nameSetters = [];

PreviewGroup.prototype.checkIntegrity = function() {
   for (let child of this.group) {
      child.checkIntegrity();
   }
}

/**
 * getter/setter for (name) attribute - no needs to create new functions for each object, safter but...
 */
Object.defineProperty(PreviewGroup.prototype ,"name",{
   get: function() { return this._name; },
   set: function(value) {  
      if (value === '') {  // cannot assign empty string?
         return;
      }
      this._name = value; 
      for (let setter of PreviewGroup.nameSetters) {
         setter.call(this, value);
      }
    }
 });

/**
 * empty all child including all mesh data
 * return all childs with deleted mesh data for undo purpose.
 */
PreviewGroup.prototype.empty = function() {
   const children = [];
   for (const child of this.group) {
      children.push( {child: child, restore: child.empty() } );
      this.remove(child);
   }
   return children;
};

/**
 * 
 */
PreviewGroup.prototype.emptyUndo = function(children) {
   for (const {child, restore} of children) {
      child.emptyUndo(restore);
      this.insert(child);
   }
}


// prototype method.
PreviewGroup.prototype.insert = function(obj) {
   if (obj.parent) {
      obj.parent.remove(obj);
   }
   this.group.push( obj );
   obj.parent = this;
};


PreviewGroup.prototype.remove = function(obj) {
   if (obj.parent === this) {
      const index = this.group.indexOf(obj);
      if (index >= 0) {
         this.group.splice(index, 1);
         obj.parent = null;
         return obj;
      }
   }
   // console log
   console.log('remove() integrity error');
   return null;
};

function countCage(acc, preview) {
   return acc+preview.numberOfCage();
};
PreviewGroup.prototype.numberOfCage = function() {
   let count = this.group.reduce(countCage, 0);
   return count;
};

PreviewGroup.prototype.getCage = function* () {
   for (let cage of this.group) {
      for (let subCage of cage.getCage()) {
         yield subCage;
      }
   }
};


class MeshAllocatorProxy { // we could use Proxy, but ....
   constructor(preview) {
      this.preview = preview;
   }

   allocVertex(...args) { return this.preview.bench.allocVertex(...args); }

   allocEdge(...args) { return this.preview.bench.allocEdge(...args); }

   allocPolygon(...args) {
      const face = this.preview.bench.allocPolygon(...args);
      this.preview.insertFace(face);
      return face;
   }

   freeAll(polygons, wEdges, vertices) { this.preview.bench.freeAll(polygons, wEdges, vertices); }

   freeVertex(vertex) { 
      this.preview.bench.freeVertex(vertex); 
   }

   freeHEdge(hEdge) { this.preview.bench.freeHEdge(hEdge); }

   freePolygon(polygon) {
      this.preview.removeFace(polygon);
      this.preview.bench.freePolygon(polygon);
   }

   getVertices(index) { return this.preview.bench.getVertices(index); }

   clearAffected() { this.preview.bench.clearAffected(); }

   addAffectedEdgeAndFace(...args) { this.preview.bench.addAffectedEdgeAndFace(...args); }
   addAffectedWEdge(wEdge) {this.preview.bench.addAffectedWEdge(wEdge);}
   addAffectedFace(polygon) {this.preview.bench.addAffectedFace(polygon);}
   addAffectedVertex(vertex) {this.preview.bench.addAffectedVertex(vertex);}
   addAffectedVertexFace(vertex) {this.preview.bench.addAffectedVertexFace(vertex);}
}


/**
 * Model constructor.
 * 
 * @param {DraftBench} bench - drawing workbench. 
 */
const PreviewCage = function(bench) {
   this.parent = null;
   this.uuid = Util.get_uuidv4();
   this.geometry = new WingedTopology(new MeshAllocatorProxy(this));
   this.bench = bench;
   this.guiStatus = {};
   this.status = {locked: false, visible: true, wireMode: false};

   // index
   this.edge = {size: 0, index: null};

   // selecte(Vertex,Edge,Face)here
   this.selectedSet = new Set;
   // default no name
   this._name = "";

   // bvh
   this.bvh = {root: null, queue: new Set};       // queue is for lazy evaluation.1
};

/**
 * registration for handling setting of names.
 */
PreviewCage.nameSetters = [];

PreviewCage.prototype.checkIntegrity = function() {
   this.geometry.checkIntegrity();
};

/**
 * getter/setter for (name) attribute - no needs to create new functions for each object, safter but...
 */
Object.defineProperty(PreviewCage.prototype, "name", {
   get: function() { return this._name; },
   set: function(value) {  
      this._name = value; 
      for (let handler of PreviewCage.nameSetters) {
         handler.call(this, value);
      }
    }
 });

/** 
 * delete mesh, edge, vertex data
 * return the deletion
*/
PreviewCage.prototype.empty = function() {
   return this.geometry.empty();
};

PreviewCage.prototype.emptyUndo = function(restore) {
   this.geometry.emptyUndo(restore);
};


 PreviewCage.prototype.numberOfCage = function() {
    return 1;
 }

 PreviewCage.prototype.getCage = function* () {
    yield this;
 }

 PreviewCage.prototype.removeFromParent = function() {
   if (this.parent) {
      return this.parent.remove(this);
   }
   return false;
 };

// act as destructor
PreviewCage.prototype.freeBuffer = function() {
   if (this.bvh.root) {
      this.bvh.root.free();
      this.bvh.root = null;
   }
   this.geometry.free();
};


//-- bvh -----

PreviewCage.prototype.initBVH = function() {
   const faceSet = this.geometry.faces;

   let max, min;
   const center = vec3.create();
   // first compute midPoint.
   const spheres = [];
   for (let sphere of faceSet) {
      spheres.push(sphere);
      vec3.add(center, center, sphere.center);
      if (!max) {
         max = vec3.fromValues(sphere.center[0]+sphere.radius, sphere.center[1]+sphere.radius, sphere.center[2]+sphere.radius);
         min = vec3.fromValues(sphere.center[0]-sphere.radius, sphere.center[1]-sphere.radius, sphere.center[2]-sphere.radius);
      } else {
         for (let axis = 0; axis < 3; ++axis) {
            if (max[axis] < (sphere.center[axis]+sphere.radius)) {
               max[axis] = sphere.center[axis]+sphere.radius;
            } else if (min[axis] > (sphere.center[axis]-sphere.radius)) {
               min[axis] = sphere.center[axis] - sphere.radius;
            }
         }
      }
   }
   vec3.scale(center, center, 1/spheres.length);
   // mid point of a bunch of spheres will likely split more evently.
   const bound = {center: center, 
                  halfSize: vec3.fromValues(Math.max(max[0]-center[0], center[0]-min[0]), 
                                            Math.max(max[1]-center[1], center[1]-min[1]), 
                                            Math.max(max[2]-center[2], center[2]-min[2]) )};
   if (this.bvh.root) {
      this.bvh.root.free();
   }
   this.bvh.queue.clear();
   this.bvh.root = new LooseOctree(this, bound, 0);
   // now insert every spheres onto the root
   for (let sphere of spheres) {
      this.bvh.root.getBound(bound);
      this.bvh.root.insert(sphere, bound);
   }
   //this.bvh.root.check(new Set);
}

PreviewCage.prototype.insertFace = function(faceSphere) {
   if (!faceSphere.octree) {
      this.bvh.queue.add(faceSphere);
   } else {
      console.log("octree insert duplicated");
   }
   //this.bvh.root.insert(sphere);
}

PreviewCage.prototype.moveSphere = function(sphere) { // lazy evaluation.
   this.bvh.queue.add(sphere);
}

PreviewCage.prototype.removeFace = function(faceSphere) { 
   if (faceSphere.octree) { // octree should exist, or 
      faceSphere.octree._remove(faceSphere);                     
   } else {
      this.bvh.queue.delete(faceSphere);
   }
}

// check if we needs to resize, if yes then might as well rebuild.
PreviewCage.prototype.updateBVH = function() {
   // check if any sphere is outside of original bound.
   for (let sphere of this.bvh.queue) {
      if (!this.bvh.root.isInside(sphere)) {
         this.bvh.queue.clear();
         this.initBVH();
         return;
      }
   }
   
   // now insert the queue moved polygons
   const bound = {center: vec3.create(), halfSize: vec3.create()};
   for (let sphere of this.bvh.queue) {
      this.bvh.root.getBound(bound);
      this.bvh.root.insert(sphere, bound);
   }
   this.bvh.root.check(new Set);
   this.bvh.queue.clear();
}

//-- end of bvh

PreviewCage.prototype.rayPick = function(ray) {
   if (this.bvh.root === null) {
      this.initBVH();
   } else {
      this.updateBVH();
   }
   // return the closest face (triangle) that intersect ray.
   // check for triangle intersection, select the hit Face, hit Edge(closest), and hit Vertex (closest).
   var hitEdge = null;
   var center;
   var hitT = Number.POSITIVE_INFINITY;   // z_far is the furthest possible intersection

   for (let sphere of this.bvh.root.intersectExtent(ray)) {
      sphere.eachEdge( function(edge) {
         // now check the triangle is ok?
         var t = Util.intersectTriangle(ray, [sphere.center, edge.origin, edge.destination()]);
         if ((t != 0.0) && (t < hitT)) {
            // intersection, check for smallest t, closest intersection
            hitT = t;
            hitEdge = edge;
            center = sphere.center;
         }
      });
   }
   // yes, we have an hit
   if (hitEdge) {
      return {t: hitT, model: this, center: center, edge: hitEdge};
      // p = o + td; intersection point.
   } else {
      return null;
   }
};


PreviewCage.prototype.getSelectedSorted = function() {
   let selectedSort = Array.from(this.selectedSet);
   selectedSort.sort((a, b) => {return a.index - b.index;});  // iterated selectedFaces in index order.
   return selectedSort;
}


PreviewCage.duplicate = function(originalCage) {
   // copy geometry.
   const indexMap = new Map;
   const previewCage = new PreviewCage(originalCage.bench);
   const geometry = previewCage.geometry;
   for (let vertex of originalCage.geometry.vertices) {
      const copy = geometry.addVertex(vertex);
      indexMap.set(vertex.index, copy.index);
   }
   for (let polygon of originalCage.geometry.faces) {
      let index = [];
      for (let vertex of polygon.eachVertex()) {
         index.push( indexMap.get(vertex.index) );
      };
      geometry.addPolygon(index, polygon.material);
   }
   //geometry.clearAffected();
   previewCage._updatePreviewAll();
   // new PreviewCage, and new name
   previewCage.name = originalCage.name + "_copy1";

   return previewCage;
};


PreviewCage.prototype.merge = function(mergeSelection) {
   // copy geometry.
   this.geometry.merge(function* (){for (let cage of mergeSelection) {yield cage.geometry;}});
   // copy selection
   this.selectedSet = new Set(function* (){for (let cage of mergeSelection) {yield* cage.selectedSet;}}());
   // clear out all ?
/*   for (let cage of mergeSelection) {
      cage.geometry.faces = new Set;
      cage.geometry.vertices = new Set;
      cage.geometry.edges = new Set;
      cage.selectedSet = new Set;
   } */
};

PreviewCage.prototype.separate = function() {
   const separatePreview = [];
   const separateGeometry = this.geometry.separateOut();
   let sep = 0;
   for (let geometry of separateGeometry) {
      const cage = new PreviewCage(this.bench);
      cage.geometry = geometry;     // copy back
      if (sep > 0) {
         cage.name = this.name + "_sep" + sep.toString();
      } else {
         cage.name = this.name;
      }
      sep++;
      separatePreview.push(cage);
   }
   return separatePreview;    // snapshot.
};


PreviewCage.prototype.detachFace = function(detachFaces, number) {
   const detach = this.geometry.detachFace(detachFaces);
   const separate = new PreviewCage(this.bench);   // should only happened once for each partition.
   separate.geometry.faces = detachFaces;
   separate.geometry.edges = detach.edges;
   separate.geometry.vertices = detach.vertices;
   separate.name = this.name + "_cut" + number.toString();

   return separate;
};


PreviewCage.prototype.setVisible = function(on) {
   //this.bench.updateAffected();
   if (on) {
      if (!this.status.visible) {
         this.status.visible = true;
         this.geometry.show();
         return (!on);
      }
   } else {
      if (this.status.visible) {
         this.status.visible = false;
         this.geometry.hide();
         return (!on);
      }
   }
   return null;
};


/**
 * lock/unlock Preview to further operation.
 * @param {bool} toggle - lock/ unlock
 */
PreviewCage.prototype.toggleLock = function(toggle) {
   if (toggle) {
      if (!this.status.locked) {
         this.status.locked = true;
         return !toggle;
      }
   } else {
      if (this.status.locked) {
         this.status.locked = false;
         return !toggle;
      }
   }
   return null;
};


/**
 * 
 */
PreviewCage.prototype.toggleWireMode = function(on) {
   if (on) {
      if (!this.status.wireMode) {
         this.status.wireMode = true;
         this.geometry.setTransparency(true);
         return (!on);
      }
   } else {
      if (this.status.wireMode) {
         this.status.wireMode = false;
         this.geometry.setTransparency(false);
         return (!on);
      }
   }
   return null;
};


PreviewCage.prototype.isLock = function() {
   return this.status.locked;
}

PreviewCage.prototype.isVisible = function() {
   return this.status.visible;
}

PreviewCage.prototype.isWireMode = function() {
   return this.status.wireMode;
}

//-----------------------------------------------
// material, color, texture, edge type.


/**
 * change selectedEdge's state
 * @param {number} operand - 0=soft, 1=hard, 2=invert 
 */
PreviewCage.prototype.hardnessEdge = function(operand) {
   let ret = {operand: operand, selection: []};

   for (let wEdge of this.selectedSet) {
      if (wEdge.setHardness(operand)) {   // check set successfully
         ret.selection.push(wEdge);
      }
   }
   // return ret
   if (ret.selection.length > 0) {
      return ret;
   } else {
      return null;
   }
};

/**
 * restore selection's edge state
 * @param {number} operand - 0=soft, 1=hard, 2=invert
 * @param {array} selection - the edges that needs to restore
 */
PreviewCage.prototype.undoHardnessEdge = function(result) {
   let operand = result.operand;
   if (operand === 0) { // soft restore to hard
      operand = 1;
   } else if (operand === 1) {   // hard restore to soft
      operand = 0;
   }
   for (let wEdge of result.selection) {   // restore edges state
      wEdge.setHardness(operand);
   }
};


/**
 * assign given material to the current selected Face
 * @param {Material} - the material that will assigned to the selected set.
 */
PreviewCage.prototype.assignFaceMaterial = function(material) {
   const savedMaterials = new Map;

   for (let polygon of this.selectedSet) {   // don't need to sorted.
      if (material !== polygon.material) {
         let array = savedMaterials.get(polygon.material);
         if (!array) {
            savedMaterials.set(polygon.material, [polygon]);
         } else {
            array.push(polygon);
         }
         // now assign Material
         polygon.assignMaterial(material);
      }
   }
   if (savedMaterials.size > 0) {
      return savedMaterials;
   } else {
      return undefined;
   }
};
/**
 * restore original material
 * @param {map} - the original material to polygons array mapping
 */
PreviewCage.prototype.undoAssignFaceMaterial = function(savedMaterials) {
   for (const [material, array] of savedMaterials.entries()) {
      for (const polygon of array) {
         polygon.assignMaterial(material);
      }
   }
};


/** 
 * select polygon that has the input material.
 * @param (Material) - checking material.
*/
PreviewCage.prototype.selectFaceMaterial = function(material) {
   const snapshot = this._resetSelectFace();

   for (let polygon of this.geometry.faces) {
      if (polygon.material === material) {
         this.selectFace(polygon);
      }
   }

   return snapshot;
};

/**
 * select line that has polygon with the same input material.
 * @param (Material) - input checking material 
 */
PreviewCage.prototype.selectEdgeMaterial = function(material) {
   const snapshot = this._resetSelectEdge();

   for (let wEdge of this.geometry.edges) {
      for (let hEdge of wEdge) {
         if (hEdge.face && (hEdge.face.material === material)) {
            this.selectEdge(hEdge);
            break;
         }
      }
   }

   return snapshot;
};

/**
 * select vertext that has adjacent polygon with the same input material
 * @param (Material) - input checking material.
 */
PreviewCage.prototype.selectVertexMaterial = function(material) {
   const snapshot = this._resetSelectVertex();

   for (let vertex of this.geometry.vertices) {
      for (let outEdge of vertex.edgeRing()) {
         if (outEdge.face && (outEdge.face.material === material)) {
            this.selectVertex(vertex);
            break;
         }
      }
   }

   return snapshot;
};

/** 
 * select body that contain polygon with the same input material
*/
PreviewCage.prototype.selectBodyMaterial = function(material) {
   const snapshot = this._resetSelectBody();

   for (let polygon of this.geometry.faces) {
      if (polygon.material === material) {
         this.selectBody();
         break;
      }
   }

   return snapshot;
};


/**
 * 
 */
PreviewCage.prototype.setVertexColor = function(color) {
   const overSize = this.selectedSet.size * 3 * 5;       // should be slight Overize;
   const snapshot = {hEdges: [], vertexColor: new Util.Vec3View(new Uint8Array(overSize))};
   const affected = new Set;

   for (let vertex of this.selectedSet) {
      for (let hEdge of vertex.edgeRing()) { // get all outEdge
         // snapshot vertexColor
         snapshot.hEdges.push( hEdge );
         snapshot.vertexColor.alloc(Util.Vec3View.uint8resize);
         hEdge.getVertexColor(snapshot.vertexColor);
         snapshot.vertexColor.inc();
         // set new color.
         hEdge.setVertexColor(color);
         affected.add(hEdge.face);
      }
   }
   snapshot.vertexColor.reset();

   // now recompute the affected face centroid.
   for (let polygon of affected) {
      polygon.updateCentroidColor();
   }
   return snapshot;
};

/**
 * undo of setVertexColor
 */
PreviewCage.prototype.undoVertexColor = function(snapshot) {
   const affected = new Set;

   snapshot.vertexColor.reset();
   for (let hEdge of snapshot.hEdges) {
      hEdge.setVertexColor(snapshot.vertexColor);  // restore color
      affected.add(hEdge.face);
   }

   // now restore affected face centroid
   for (let polygon of affected) {
      polygon.updateCentroidColor();
   }
};


/**
 * 
 */
PreviewCage.prototype.setFaceColor = function(color) {
   const overSize = this.selectedSet.size * 3 * 5;       // should be slight Overize;
   const snapshot = {hEdges: [], vertexColor: new Util.Vec3View(new Uint8Array(overSize))};

   for (let polygon of this.selectedSet) {
      for (let hEdge of polygon.hEdges()) {
         // snapshot vertexColor
         snapshot.hEdges.push( hEdge );
         snapshot.vertexColor.alloc(Util.Vec3View.uint8resize);
         hEdge.getVertexColor(snapshot.vertexColor);
         snapshot.vertexColor.inc();
         // set new color.
         hEdge.setVertexColor(color);
      }
      polygon._setColor(color);
   }

   // let _setVertexColor do the work.
   return snapshot;
};


/**
 * 
 */
PreviewCage.prototype.setBodyColor = function(color) {
   const overSize = this.geometry.edges.size * 3 * 2;       // should be slight Overize;
   const snapshot = {hEdges: [], vertexColor: new Util.Vec3View(new Uint8Array(overSize))};

   for (let polygon of this.geometry.faces) {
      if (polygon.isLive()) {
         for (let hEdge of polygon.hEdges()) {
            // snapshot vertexColor
            snapshot.hEdges.push( hEdge );
            snapshot.vertexColor.alloc(Util.Vec3View.uint8resize);
            hEdge.getVertexColor(snapshot.vertexColor);
            snapshot.vertexColor.inc();
            // set new color.
            hEdge.setVertexColor(color);
         }
         polygon._setColor(color);
      }
   }

   // let _setVertexColor do the work.
   return snapshot;
};


PreviewCage.prototype._getGeometrySize = function() {
   return { face: this.geometry.faces.size,
            edge: this.geometry.edges.size,
            vertex: this.geometry.vertices.size
          };
};


PreviewCage.prototype._updatePreviewAll = function() {
   //this.bench.updateAffected();
};

PreviewCage.prototype.updateAffected = function() {
   this.bench.updateAffected();
};

/**
 * param {array/set} faces - updatePosition for all containers.
 */
PreviewCage.prototype._updatePosition = function(faces) {
   for (let polygon of faces) {
      polygon.updatePosition();
   }
};



//------------------------------------------------
// selection (body, face, edge, vertex) operation
//


// body selection.
PreviewCage.prototype.changeFromBodyToFaceSelect = function() {
   // do nothing, already selected or deselected.
   const snapshot = this.snapshotSelectionBody();
   if (this.hasSelection()) {
      this._resetSelectBody();
      // select all face
      for (let polygon of this.geometry.faces) {
         this._setFaceSelectionOn(polygon);
      }
   }
   return snapshot;
};

PreviewCage.prototype.changeFromBodyToEdgeSelect = function() {
   const snapshot = this.snapshotSelectionBody();

   if (this.hasSelection()) {
      this._resetSelectBody();
      // select all edge
      for (let wingedEdge of this.geometry.edges) {
         this.selectedSet.add(wingedEdge);
         wingedEdge.selectEdge(true);
      }
   }

   return snapshot;
};

PreviewCage.prototype.changeFromBodyToVertexSelect = function() {
   const snapshot = this.snapshotSelectionBody();

   if (this.hasSelection()) {
      this._resetSelectBody();
      // select all vertex
      for (let vertex of this.geometry.vertices) {
         this.selectedSet.add(vertex);
         vertex.setSelect(true);
      }
   }

   return snapshot;
};

PreviewCage.prototype.changeFromBodyToMultiSelect = function() {
   const snapshot = this.snapshotSelectionBody();
   if (this.hasSelection()) {
      this._resetSelectBody();
   }

   return snapshot;
}

// hack for calling restoerXXXSelection. double dispatch?
PreviewCage.prototype.restoreSelection = function(snapshot, madsor) {
   madsor._restoreSelection(this, snapshot);
}

PreviewCage.prototype.restoreFaceSelection = function(snapshot) {
   for (let polygon of snapshot.selectedFaces) {
      this.selectFace(polygon);
   }
};

PreviewCage.prototype.restoreEdgeSelection = function(snapshot) {
   for (let wingedEdge of snapshot.wingedEdges) {
      this.selectEdge(wingedEdge.left);
   }
};

PreviewCage.prototype.restoreVertexSelection = function(snapshot) {
   for (let vertex of snapshot.vertices) {
      this.selectVertex(vertex);
   }
};

PreviewCage.prototype.restoreBodySelection = function(snapshot) {
   if (snapshot.body.size > 0) {
      this.selectBody();
   }
};

PreviewCage.prototype.restoreFromBodyToFaceSelect = function(snapshot) {
   if (snapshot) {
      this._resetSelectBody();
      this.restoreFaceSelection(snapshot);
   } else {
      this.changeFromBodyToFaceSelect();
   }
};

PreviewCage.prototype.restoreFromBodyToEdgeSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectBody();
      this.restoreEdgeSelection(snapshot);
   } else {
      this.changeFromBodyToEdgeSelect();  // choose compute over storage, use the same code as going forward.
   }
};

PreviewCage.prototype.restoreFromBodyToVertexSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectBody();
      // and selected using the snapshots.
      this.restoreVertexSelection(snapshot);
   } else {
      this.changeFromBodyToVertexSelect();  // compute vs storage. currently lean toward compute.
   }
};

PreviewCage.prototype.restoreFromBodyToMultiSelect = function(_snapshot) {
   this.changeFromBodyToMutliSelect();
};

PreviewCage.prototype._resetSelectBody = function() {
   const oldSet = this.snapshotSelectionBody();
   this.selectedSet.delete(this.geometry);
   this.geometry.setSelect(false);
   //this.geometry.setHilite(false);
   return oldSet;
};

PreviewCage.prototype._selectBodyLess = function() {
   const snapshot = this.snapshotSelectionBody();
   if (this.hasSelection()) {
      this.selectBody();
   }
   return snapshot;
}

PreviewCage.prototype._selectBodyAll = function() {
   const snapshot = this.snapshotSelectionBody();
   if (!this.hasSelection()) {
      this.selectBody();
   }
   return snapshot;
}

PreviewCage.prototype._selectBodyInverse = function() {
   const snapshot = this.snapshotSelectionBody();
   this.selectBody();
   return snapshot;
}

PreviewCage.prototype.selectBody = function() {
   //let faceColor;
   // we change interior color to show the selection
   if (this.hasSelection()) {
      this.geometry.setSelect(false);
      this.selectedSet.delete(this.geometry);
   } else {
      this.selectedSet.add(this.geometry);
      this.geometry.setSelect(true);
      geometryStatus(i18n("body_status", {name: this.name, polygonSize: this.geometry.faces.size, edgeSize: this.geometry.edges.size, vertexSize: this.geometry.vertices.size}));
   }
   return this.hasSelection();
};

PreviewCage.prototype.hiliteBody = function(hilite) {
   this.geometry.setHilite(hilite);
}

PreviewCage.prototype.hasSelection = function() {
   return (this.selectedSet.size > 0);
};

PreviewCage.prototype.selectionSize = function() {
   return this.selectedSet.size;
}

PreviewCage.prototype.snapshotSelection = function() {
   return new Set(this.selectedSet);
};

PreviewCage.prototype.snapshotSelectionFace = function() {
   return {selectedFaces: new Set(this.selectedSet)};
}

PreviewCage.prototype.snapshotSelectionEdge = function() {
   return {wingedEdges: new Set(this.selectedSet)};
}

PreviewCage.prototype.snapshotSelectionVertex = function() {
   return {vertices: new Set(this.selectedSet)};
}

PreviewCage.prototype.snapshotSelectionBody = function() {
   return {body: new Set(this.selectedSet)};
}

PreviewCage.prototype.dragSelectVertex = function(vertex, onOff) {
   if (this.selectedSet.has(vertex)) {
      if (onOff === false) {
         this.selectedSet.delete(vertex);
         vertex.setSelect(false);
         return true;
      }
   } else {
      if (onOff === true) {
         this.selectedSet.add(vertex);
         vertex.setSelect(true);
         geometryStatus("select vertex: " + vertex.index);
         return true;
      }
   }
   return false;
};

PreviewCage.prototype.selectVertex = function(vertex) {
   var onOff;
   var color;
   if (this.selectedSet.has(vertex)) {
      this.selectedSet.delete(vertex);
      onOff = false;
   } else {
      this.selectedSet.add(vertex);
      onOff = true;
      geometryStatus("select vertex: " + vertex.index);
   }
   // selected color
   vertex.setSelect(onOff);
   return onOff;
};


PreviewCage.prototype._resetSelectVertex = function() {
   var snapshot = this.snapshotSelectionVertex();
   for (let vertex of this.selectedSet) {
      vertex.resetState();    // zero out the vertex state
   }
   this.selectedSet = new Set;
   return snapshot;
};

PreviewCage.prototype._selectVertexMore = function() {
   const snapshot = this.snapshotSelectionVertex();

   for (let vertex of snapshot.vertices) {
      for (let inEdge of vertex.eachInEdge()) {
         if (!this.selectedSet.has(inEdge.origin)) {
            this.selectVertex(inEdge.origin);
         }
      };
   }

   return snapshot;
};

PreviewCage.prototype._selectVertexLess = function() {
   const snapshot = this.snapshotSelectionVertex();

   for (let vertex of snapshot.vertices) {
      for (let ringV of vertex.oneRing()) {
         if (!snapshot.vertices.has(ringV)) {
            this.selectVertex(vertex);
            break;
         }
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectVertexAll = function() {
   const snapshot = this.snapshotSelectionVertex();

   for (let vertex of this.geometry.vertices) {
      if (vertex.isLive() && !snapshot.vertices.has(vertex)) {
         this.selectVertex(vertex);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectVertexInverse = function() {
   const snapshot = this.snapshotSelectionVertex();

   for (let vertex of this.geometry.vertices) {
      if (vertex.isLive()) {
         this.selectVertex(vertex);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectVertexAdjacent = function() {
   return this._selectVertexMore();
};

PreviewCage.prototype._selectVertexSimilar = function() {
   const snapshot = this.snapshotSelectionVertex();
   const similarVertex = new SimilarVertex(snapshot.vertices);

   for (let vertex of this.geometry.vertices) {
      if (vertex.isLive() && !snapshot.vertices.has(vertex) && similarVertex.find(vertex)) {
         this.selectVertex(vertex);
      }
   }

   return snapshot;
};

PreviewCage.prototype.changeFromVertexToFaceSelect = function() {
   const snapshot = this.snapshotSelectionVertex();

   var oldSelected = this._resetSelectVertex();
   //
   for (let vertex of oldSelected.vertices) { 
      // select all face that is connected to the vertex.
      for (let outEdge of vertex.eachOutEdge()) {
         if (outEdge.face && !this.selectedSet.has(outEdge.face)) {
            this.selectFace(outEdge.face);
         }
      };
   }

   return snapshot;
};

PreviewCage.prototype.changeFromVertexToEdgeSelect = function() {
   const snapshot = this.snapshotSelectionVertex();

   var oldSelected = this._resetSelectVertex();
   //
   for (let vertex of oldSelected.vertices) { 
      // select all edge that is connected to the vertex.
      for (let outEdge of vertex.eachOutEdge()) {
         if (!this.selectedSet.has(outEdge.wingedEdge)) {
            this.selectEdge(outEdge);
         }
      }
   }

   return snapshot;
};

PreviewCage.prototype.changeFromVertexToBodySelect = function() {
   const snapshot = this.snapshotSelectionVertex();

   if (this.hasSelection()) {
      // select whole body,
      this._resetSelectVertex();
      this.selectBody();
   }

   return snapshot;
};

PreviewCage.prototype.changeFromVertexToMultiSelect = function() {
   const snapshot = this.snapshotSelectionVertex();

   // clear all selection.
   this._resetSelectVertex();

   return snapshot;
};

PreviewCage.prototype.restoreFromVertexToFaceSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectVertex();
      this.restoreFaceSelection(snapshot);
   } else {
      this.changeFromVertexToFaceSelect();  // choose compute over storage, use the same code as going forward.
   }
};

PreviewCage.prototype.restoreFromVertexToEdgeSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectVertex();
      this.restoreEdgeSelection(snapshot);
   } else {
      this.changeFromVertexToEdgeSelect();  // choose compute over storage, use the same code as going forward.
   }
};

PreviewCage.prototype.restoreFromVertexToBodySelect = function(snapshot) {
   if (snapshot) {
      this._resetSelectVertex();
      this.restoreBodySelection(snapshot);
   } else {
      this.changeFromVertexToBodySelect();
   }
};

PreviewCage.prototype.restoreFromVertexToMultiSelect = function(_snapshot) {
   this.changeFromVertexToMultiSelect();
};


PreviewCage.prototype.changeFromMultiToEdgeSelect = function() {
   return {}; // nothing todo
};
PreviewCage.prototype.changeFromMultiToFaceSelect = function() {
   return {}; // nothing todo
};
PreviewCage.prototype.changeFromMultiToVertexSelect = function() {
   return {}; // nothing todo
};
PreviewCage.prototype.changeFromMultiToBodySelect = function() {
   return {}; // nothing todo
};
PreviewCage.prototype.restoreFromMultiToEdgeSelect = function(snapshot) {
   if (snapshot) {   // restore all edge from snapshot
      this.restoreEdgeSelection(snapshot);
   }
};
PreviewCage.prototype.restoreFromMultiToFaceSelect = function(snapshot) {
   if (snapshot) {   // restore all face from snapshot
      this.restoreFaceSelection(snapshot);
   }
};
PreviewCage.prototype.restoreFromMultiToVertexSelect = function(snapshot) {
   if (snapshot) {// reselect all vertex
      this.restoreVertexSelection(snapshot);
   }
};
PreviewCage.prototype.restoreFromMultiToBodySelect = function(snapshot) {
   if (snapshot) {   // select body
      this.restoreBodySelection(snapshot);
   }
};


PreviewCage.prototype.dragSelectEdge = function(selectEdge, dragOn) {
   var wingedEdge = selectEdge.wingedEdge;

   if (this.selectedSet.has(wingedEdge)) { 
      if (dragOn === false) { // turn from on to off
         this.selectedSet.delete(wingedEdge);
         wingedEdge.selectEdge(false);
         return true;   // new off selection
      }
   } else {
      if (dragOn === true) {   // turn from off to on.
         this.selectedSet.add(wingedEdge);
         wingedEdge.selectEdge(true);
         return true;
      }
   }
   // edge already on the correct state.
   return false;
}

PreviewCage.prototype.selectEdge = function(selectEdge) {
   // select polygon set color,
   var wingedEdge = selectEdge.wingedEdge;

   var onOff;
   if (this.selectedSet.has(wingedEdge)) {
      this.selectedSet.delete(wingedEdge);5;
      onOff = false;
   } else {
      this.selectedSet.add(wingedEdge);
      onOff = true;
      geometryStatus("select edge: " + wingedEdge.index);
   }
   // selected color
   wingedEdge.selectEdge(onOff);
   return onOff;
};


/**
 * clear all selected edge, and select all edge that has boundary
 */
PreviewCage.prototype.selectBoundaryEdge = function() {
   const snapshot = this._resetSelectEdge();
   for (let wEdge of this.geometry.edges) {
      for (let hEdge of wEdge) {
         if (hEdge.isBoundary()) {
            this.selectEdge(hEdge);
            break;
         }
      }
   }
   return snapshot;
};


PreviewCage.prototype._resetSelectEdge = function() {
   const snapshot = this.snapshotSelectionEdge();
   for (let wEdge of this.selectedSet) {
      wEdge.selectEdge(false);
   }
   this.selectedSet = new Set;
   return snapshot;
};

PreviewCage.prototype._selectEdgeMore = function() {
   const snapshot = this.snapshotSelectionEdge();

   for (let wingedEdge of snapshot.wingedEdges) {
      for (let halfEdge of wingedEdge) {
         for (let edge of halfEdge.eachEdge()) {
            if (!this.selectedSet.has(edge.wingedEdge)) {
               this.selectEdge(edge);
            }
         }
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectEdgeLess = function() {
   const snapshot = this.snapshotSelectionEdge();

   const self = this;
   for (let selectedWinged of snapshot.wingedEdges) {
      for (let wingedEdge of selectedWinged.oneRing()) {
         if (!snapshot.wingedEdges.has(wingedEdge)) {
            this.selectEdge(selectedWinged.left);
            break;
         }
      }
   }

   return snapshot;
}

PreviewCage.prototype._selectEdgeAll = function() {
   const snapshot = this.snapshotSelectionEdge();

   for (let wingedEdge of this.geometry.edges) {
      if (wingedEdge.isLive() && !snapshot.wingedEdges.has(wingedEdge)) {
         this.selectEdge(wingedEdge.left);
      }
   }

   return snapshot;
}

PreviewCage.prototype._selectEdgeInverse = function() {
   const snapshot = this.snapshotSelectionEdge();

   for (let wingedEdge of this.geometry.edges) {
      if (wingedEdge.isLive()) {
         this.selectEdge(wingedEdge.left);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectEdgeAdjacent = function() {
   const snapshot = this.snapshotSelectionEdge();

   for (let wingedEdge of snapshot.wingedEdges) {
      for (let adjacent of wingedEdge.adjacent()) {
         if (!this.selectedSet.has(adjacent)) {
            this.selectEdge(adjacent.left);
         }
      }
   }

   return snapshot;
};


PreviewCage.prototype._selectEdgeSimilar = function() {
   const snapshot = this.snapshotSelectionEdge();
   const similarEdge = new SimilarWingedEdge(snapshot.wingedEdges);

   for (let wingedEdge of this.geometry.edges) {
      if (wingedEdge.isLive && !snapshot.wingedEdges.has(wingedEdge) && similarEdge.find(wingedEdge)) {
         this.selectEdge(wingedEdge.left);
      }
   }

   return snapshot;
};


PreviewCage.prototype.changeFromEdgeToFaceSelect = function() {
   const snapshot = this.snapshotSelectionEdge();

   const oldSelected = this._resetSelectEdge();
   for (let wingedEdge of oldSelected.wingedEdges) {
      // for each WingedEdge, select both it face.
      for (let halfEdge of wingedEdge) {
         if (halfEdge.face && !this.selectedSet.has(halfEdge.face)) {
            this.selectFace(halfEdge.face);
         }
      }
   }

   return snapshot;
};

PreviewCage.prototype.changeFromEdgeToVertexSelect = function() {
   const snapshot = this.snapshotSelectionEdge();

   const oldSelected = this._resetSelectEdge();
   for (let wingedEdge of oldSelected.wingedEdges) {
      // for each WingedEdge, select both it face.
      for (let halfEdge of wingedEdge) {
         if (!this.selectedSet.has(halfEdge.origin)) {
            this.selectVertex(halfEdge.origin);
         }
      }
   }
   return snapshot;
};

PreviewCage.prototype.changeFromEdgeToBodySelect = function() {
   const snapshot = this.snapshotSelectionEdge();

   if (this.hasSelection()) {
      this._resetSelectEdge();
      this.selectBody();
   }

   return snapshot;
};

PreviewCage.prototype.changeFromEdgeToMultiSelect = function() {
   const snapshot = this.snapshotSelectionEdge();

   if (this.hasSelection()) {
      this._resetSelectEdge();
   }

   return snapshot;
};

PreviewCage.prototype.restoreFromEdgeToFaceSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectEdge();
      this.restoreFaceSelection(snapshot);
   } else {
      this.changeFromEdgeToFaceSelect();  // we cheat, use the same code as going forward.
   }
};

PreviewCage.prototype.restoreFromEdgeToVertexSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectEdge();
      this.restoreVertexSelection(snapshot);
   } else {
      this.changeFromEdgeToVertexSelect();  // we cheat, use the same code as going forward.
   }
};

PreviewCage.prototype.restoreFromEdgeToBodySelect = function(snapshot) {
   if (snapshot) {
      this._resetSelectEdge();
      this.restoreBodySelection(snapshot);
   } else {
      this.changeFromEdgeToBodySelect();
   }
};

PreviewCage.prototype.restoreFromEdgeToMultiSelect = function(_snapshot) {
   this.changeFromEdgeToMultiSelect();
};

PreviewCage.prototype._setFaceSelectionOff = function(polygon) {
   polygon.setSelect(false);
   this.selectedSet.delete(polygon);
};
PreviewCage.prototype._setFaceSelectionOn = function(polygon) {
   polygon.setSelect(true);
   this.selectedSet.add(polygon);
};

PreviewCage.prototype.dragSelectFace = function(polygon, onOff) {
   // select polygon set color,
   if (this.selectedSet.has(polygon)) {
      if (onOff === false) {
         this._setFaceSelectionOff(polygon);
         return true;
      }
   } else {
      if (onOff === true) {
         this._setFaceSelectionOn(polygon);
         return true;
      }
   }
   geometryStatus("polygon face # " + polygon.index);
   return false;
};

/**
 * 
 */
PreviewCage.prototype.selectFace = function(polygon) {
   var onOff;
   if (this.selectedSet.has(polygon)) {
      this._setFaceSelectionOff(polygon);
      Wings3D.log("faceSelectOff", polygon.index);
      onOff = false;
   } else {
      this._setFaceSelectionOn(polygon);
      Wings3D.log("faceSelectOn", polygon.index);
      onOff = true;
   }
   geometryStatus("polygon face # " + polygon.index);
   return onOff;
};


PreviewCage.prototype._resetSelectFace = function() {
   const snapshot = this.snapshotSelectionFace();
   this.selectedSet = new Set;
   for (let polygon of snapshot.selectedFaces) {
      polygon.setSelect(false);
   }
   return snapshot;
}

PreviewCage.prototype._selectFaceMore = function() {
   const snapshot = this.snapshotSelectionFace();
   // seleceted selectedFace's vertex's all faces.
   for (let polygon of snapshot.selectedFaces) {
      for (let face of polygon.oneRing()) {
         // check if face is not selected.
         if ( (face !== null) && !this.selectedSet.has(face) ) {
            this.selectFace(face);
         }
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectFaceLess = function() {
   const snapshot = this.snapshotSelectionFace();

   for (let selected of snapshot.selectedFaces) {
      for (let polygon of selected.adjacent()) {
         if (!snapshot.selectedFaces.has(polygon)) {      // selected is a boundary polygon
            this.selectFace(selected); // now removed.
            break;
         }
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectFaceAll = function() {
   const snapshot = this.snapshotSelectionFace();

   for (let polygon of this.geometry.faces) {
      if (polygon.isLive() && !snapshot.selectedFaces.has(polygon)) {
         this.selectFace(polygon);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectFaceInverse = function() {
   const snapshot = this.snapshotSelectionFace();;

   for (let polygon of this.geometry.faces) {
      if (polygon.isLive()) {
         this.selectFace(polygon);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectFaceAdjacent = function() {
   const snapshot = this.snapshotSelectionFace();;

   // seleceted selectedFace's vertex's all faces.
   for (let polygon of snapshot.selectedFaces) {
      for (let face of polygon.adjacent()) {
         // check if face is not selected.
         if ( (face !== null) && !this.selectedSet.has(face) ) {
            this.selectFace(face);
         }
      }
   }
   
   return snapshot;
};

PreviewCage.prototype._selectFaceSimilar = function() {
   const snapshot = this.snapshotSelectionFace();;
   const similarFace = new SimilarFace(snapshot.selectedFaces);

   for (let polygon of this.geometry.faces) {
      if (polygon.isLive() && !snapshot.selectedFaces.has(polygon) && similarFace.find(polygon)) {
         this.selectFace(polygon);
      }
   }

   return snapshot;
};


PreviewCage.prototype.changeFromFaceToEdgeSelect = function() {
   const snapshot = this.snapshotSelectionFace();

   var self = this;
   var oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      // for eachFace, selected all it edge.
      polygon.eachEdge(function(edge) {
         if (!self.selectedSet.has(edge.wingedEdge)) {
            self.selectEdge(edge);
         }
      });
   }

   return snapshot;
};

PreviewCage.prototype.changeFromFaceToVertexSelect = function() {
   const snapshot = this.snapshotSelectionFace();

   var self = this
   var oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      // for eachFace, selected all it vertex.
      for (let vertex of polygon.eachVertex()) {
         if (!self.selectedSet.has(vertex)) {
            self.selectVertex(vertex);
         }
      };
   }

   return snapshot;
};

PreviewCage.prototype.changeFromFaceToBodySelect = function() {
   const snapshot = this.snapshotSelectionFace();

   if (this.hasSelection()) {
      this._resetSelectFace();
      this.selectBody();
   }

   return snapshot;
};

PreviewCage.prototype.changeFromFaceToMultiSelect = function() {
   const snapshot = this.snapshotSelectionFace();

   if (this.hasSelection()) {
      this._resetSelectFace();
   }

   return snapshot;
};

PreviewCage.prototype.restoreFromFaceToEdgeSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectFace();
      // and selected using the snapshots.
      this.restoreEdgeSelection(snapshot);
   } else {
      this.changeFromFaceToEdgeSelect();  // compute vs storage. currently lean toward compute.
   }
}

PreviewCage.prototype.restoreFromFaceToVertexSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectFace();
      // and selected using the snapshots.
      this.restoreVertexSelection(snapshot);
   } else {
      this.changeFromFaceToVertexSelect();  // compute vs storage. currently lean toward compute.
   }
};

PreviewCage.prototype.restoreFromFaceToBodySelect = function(snapshot) {
   if (snapshot) {
      this._resetSelectFace();
      this.restoreBodySelection(snapshot);
   } else {
      this.changeFromFaceToBodySelect();
   }
};

PreviewCage.prototype.restoreFromFaceToMultiSelect = function(_snapshot) {
   this.changeFromFaceToMultiSelect();
};


//
// iterated through selectedEdge, and expand it along the edges, edge loop only possible on 4 edges vertex
//
PreviewCage.prototype.edgeLoop = function(nth) {
   let count = 0;
   const selection = new Set(this.selectedSet);
   const ret = [];
   for (let wingedEdge of selection) {
      // walk forward, then backward.
      for (let hEdge of wingedEdge) {
         const end = hEdge;
         // walking along the loop
         while (hEdge = hEdge.next.pair.next) { // next edge
            if (this.selectedSet.has(hEdge.wingedEdge) || (hEdge.destination().numberOfEdge() !== 4) ) {
               break;   // already at end, or non-4 edge vertex.
            }
            ++count;
            if ((count % nth) === 0) {
               this.selectEdge(hEdge);
               ret.push(hEdge);
            }
         }
      }
   }
   return ret;
};

//
// iterated through selectedEdge, and expand it along 2 side of loop, edge Ring only possible on 4 edges face
//
PreviewCage.prototype.edgeRing = function(nth) {
   let count = 0;
   const selection = new Set(this.selectedSet);
   const ret = [];
   for (let wingedEdge of selection) {
      // walk forward, then backward.
      for (let hEdge of wingedEdge) {
         const end = hEdge;
         // walking along the loop
         while (hEdge = hEdge.pair.next.next) { // next edge
            if (this.selectedSet.has(hEdge.wingedEdge) || (hEdge.next.next.next.next !== hEdge) ) {
               break;   // already at end, or non-4 edge face.
            }
            ++count;
            if ((count % nth) === 0) {
               this.selectEdge(hEdge);
               ret.push(hEdge);
            }
         }
      }
   }
   return ret;
};


//-----------------------------------------------------------------------------------------------------
// move selection functions
//

PreviewCage.prototype.restoreMoveSelection = function(snapshot) {
   // restore to the snapshot position.
   let i = new Util.Vec3View(snapshot.position);
   for (let vertex of snapshot.vertices) {
      vec3.copy(vertex, i);
      i.inc();
   }
};


// 3-15 - add limit to movement.
PreviewCage.prototype.moveSelection = function(snapshot, movement) {
   // first move geometry's position
   if (snapshot.direction) {
      let i = new Util.Vec3View(snapshot.direction);
      for (let vertex of snapshot.vertices) {
         vec3.scaleAndAdd(vertex, vertex, i, movement);  // movement is magnitude
         i.inc();
      }
   } else {
      for (let vertex of snapshot.vertices) {
         vec3.add(vertex, vertex, movement);
      }
   }
};

//
// rotate selection, with a center
//
PreviewCage.prototype.rotateSelection = function(snapshot, quatRotate, center) {
   const translate = [0, 0, 0];
   const scale = [1, 1, 1];
   this.transformSelection(snapshot, (transform, origin) => {
      mat4.fromRotationTranslationScaleOrigin(transform, quatRotate, translate, scale, (center ? center : origin));   
    });
};

//
// scale selection, by moving vertices
//
PreviewCage.prototype.scaleSelection = function(snapshot, scale, axis) {
   const quatRotate = quat.create();
   const translate = [0, 0, 0];
   const scaleV = [axis[0] ? scale * axis[0] : 1, 
                   axis[1] ? scale * axis[1] : 1, 
                   axis[2] ? scale * axis[2] : 1];
   this.transformSelection(snapshot, (transform, origin) => {
      //mat4.fromScaling(transform, scaleV);   
      mat4.fromRotationTranslationScaleOrigin(transform, quatRotate, translate, scaleV, origin);   
    });
};

//
// transform selection,
//
PreviewCage.prototype.transformSelection = function(snapshot, transformFn) {
   // construct the matrix
   const transform = mat4.create();

   const pArry = new Util.Vec3View(snapshot.position);
   const vArry = snapshot.vertices[Symbol.iterator]();
   for (let group of snapshot.matrixGroup) {
      //mat4.fromRotationTranslationScaleOrigin(transform, quatRotation, translate, scale, group.center); // origin should not be modified by scale, glmatrix seems to get the order wrong.
      transformFn(transform, group.center);
      for (let index = 0; index < group.count; index++) {
         const vertex = vArry.next().value;
         vec3.transformMat4(vertex, pArry, transform);
         pArry.inc();
      }
   }
};


PreviewCage.prototype.snapshotPositionAll = function() {
   return this.snapshotPosition(this.geometry.vertices);
};

PreviewCage.prototype.snapshotPosition = function(vertices, normalArray) {
   var ret = {
      faces: new Set,
      vertices: null,
      wingedEdges: new Set,
      position: null,
      direction: normalArray,
   };
   ret.vertices = vertices;
   // allocated save position data.
   const length = vertices.length ? vertices.length : vertices.size; // could be array or set
   ret.position = new Float32Array(length*3);
   // use the vertex to collect the affected polygon and the affected edge.
   let i = 0;
   for (let vertex of ret.vertices) {
      for (let outEdge of vertex.eachOutEdge()) {
         if (outEdge.isNotBoundary() && !ret.faces.has(outEdge.face)) {
            ret.faces.add(outEdge.face);
         }
         if (!ret.wingedEdges.has(outEdge.wingedEdge)) {
            ret.wingedEdges.add(outEdge.wingedEdge);
         }
      }
      // save position data
      ret.position.set(vertex, i);
      i += 3;
   }
   return ret;
};

PreviewCage.prototype.snapshotEdgePosition = function() {
   var vertices = new Set;
   // first collect all the vertex
   for (let wingedEdge of this.selectedSet) {
      for (let edge of wingedEdge) {
         var vertex = edge.origin;
         if (!vertices.has(vertex)) {
            vertices.add(vertex);
         }
      }
   }
   return this.snapshotPosition(vertices);
};


PreviewCage.prototype.snapshotFacePosition = function() {
   var vertices = new Set;
   // first collect all the vertex
   for (let polygon of this.selectedSet) {
      for (let vertex of polygon.eachVertex()) {
         if (!vertices.has(vertex)) {
            vertices.add(vertex);
         }
      };
   }
   return this.snapshotPosition(vertices);
};

PreviewCage.prototype.snapshotVertexPosition = function() {
   const vertices = new Set(this.selectedSet);
   return this.snapshotPosition(vertices);
};

PreviewCage.prototype.snapshotBodyPosition = function() {
   let vertices = new Set;
   if (this.hasSelection()) {
      vertices = new Set(this.geometry.vertices);
   }
   return this.snapshotPosition(vertices);
};


PreviewCage.prototype.snapshotFacePositionAndNormal = function() {
   const vertices = new Set;
   let normalMap = new Map;
   const polygonNormal = [0,0,0];
   // first collect all the vertex
   for (let polygon of this.selectedSet) {
      for (let vertex of polygon.eachVertex()) {
         if (!vertices.has(vertex)) {
            vertices.add(vertex);
            const normal = [0,0,0];
            polygon.getNormal(normal);
            normalMap.set(vertex, normal);
         } else {
            const normal = normalMap.get(vertex);
            polygon.getNormal(polygonNormal);
            if (vec3.dot(normal, polygonNormal) < 0.999) {  // check for nearly same normal, or only added if hard edge?
               vec3.add(normal, normal, polygonNormal);
            } 
         }
      };
   }
   // copy normal;
   const normalArray = new Float32Array(vertices.size*3);
   let i = 0;
   for (let [_vert, normal] of normalMap) {
      normalArray[i++] = normal[0];
      normalArray[i++] = normal[1];
      normalArray[i++] = normal[2];
   }
   return this.snapshotPosition(vertices, normalArray);
};

PreviewCage.prototype.snapshotVertexPositionAndNormal = function() {
   const vertices = new Set(this.selectedSet);
   const array = new Float32Array(vertices.size*3);
   // copy normal
   const normal = new Util.Vec3View(array);
   for (let vertex of vertices) {
      for (let outEdge of vertex.eachOutEdge()) {
         if (outEdge.isNotBoundary()) {
            vec3.add(normal, normal, outEdge.face.normal);
         }
      }
      vec3.normalize(normal, normal);        // finally, we can safely normalized?
      normal.inc();
   }

   return this.snapshotPosition(vertices, array);
};

PreviewCage.prototype.snapshotEdgePositionAndNormal = function() {
   const vertices = new Set;
   const normalMap = new Map; 
   // first collect all the vertex
   const tempNorm = vec3.create();
   for (let wingedEdge of this.selectedSet) {
      const p0 = wingedEdge.left.face;
      const p1 = wingedEdge.right.face;
      //vec3.normalize(tempNorm, tempNorm);
      for (let edge of wingedEdge) {
         let vertex = edge.origin;
         let normal;
         if (!vertices.has(vertex)) {
            vertices.add(vertex);
            normal = new Set;
            normalMap.set(vertex, normal);
         } else {
            normal = normalMap.get(vertex);
         }
         if (p0 !== null) {
            normal.add( p0 );
         }
         if (p1 !== null) {
            normal.add( p1 );
         }
      }
   }
   // copy normal
   const normalArray = new Float32Array(vertices.size*3);
   const inputNormal = new Util.Vec3View(normalArray);
   for (let [_vert, normal] of normalMap) {
      for (let poly of normal) {
         vec3.add(inputNormal, inputNormal, poly.normal);
      }
      vec3.normalize(inputNormal, inputNormal);    // 2019-08-19
      inputNormal.inc();
   }
   return this.snapshotPosition(vertices, normalArray);
};

PreviewCage.prototype.snapshotTransformEdgeGroup = function() {
   const vertices = new Set;
   const matrixGroup = [];
   // array of edgeLoop. 
   let edgeGroup = this.geometry.findEdgeGroup(this.selectedSet);
   // compute center of loop, gather all the vertices, create the scaling matrix
   for (let group of edgeGroup) {
      let count = 0;
      const center = vec3.create();
      for (let wEdge of group) {
         for (let vertex of wEdge.eachVertex()) {
            if (!vertices.has(vertex)){
               vertices.add(vertex);
               count++;
               vec3.add(center, center, vertex);
            }
          };
      }
      vec3.scale(center, center, 1.0/count); // get the center
      // now construct the group
      matrixGroup.push( {center: center, count: count});
   }

   // now construct all the effected data and save position.
   const ret = this.snapshotPosition(vertices);
   ret.matrixGroup = matrixGroup;
   return ret;
};

PreviewCage.prototype.snapshotTransformFaceGroup = function() {
   const vertices = new Set;
   const matrixGroup = [];
   // array of edgeLoop. 
   let faceGroup = WingedTopology.findFaceGroup(this.getSelectedSorted());
   // compute center of loop, gather all the vertices, create the scaling matrix
   const center = vec3.create();
   for (let group of faceGroup) {
      let count = 0;
      vec3.set(center, 0, 0, 0);
      for (let face of group) {
         for (let vertex of face.eachVertex()) {
            if (!vertices.has(vertex)){
               vertices.add(vertex);
               count++;
               vec3.add(center, center, vertex);
            }
          };
      }
      vec3.scale(center, center, 1.0/count); // get the center
      // now construct the group
      matrixGroup.push( {center: center, count: count});
   }

   // now construct all the effected data and save position.
   const ret = this.snapshotPosition(vertices);
   ret.matrixGroup = matrixGroup;
   return ret;
};

PreviewCage.prototype.snapshotTransformBodyGroup = function() {
   let vertices = new Set;
   const center = vec3.create();
   if (this.hasSelection()) {
      for (let vertex of this.geometry.vertices) {
         if (vertex.isLive()) {
            vertices.add(vertex);
            vec3.add(center, center, vertex);
         }
      }
      vec3.scale(center, center, 1.0/vertices.size);
   }

   const ret = this.snapshotPosition(vertices);
   ret.matrixGroup = [{center: center, count: vertices.size}];
   return ret;
};

//
// no separate group. needs to have 2 vertex to see rotation.
//
PreviewCage.prototype.snapshotTransformVertexGroup = function() {
   let vertices = new Set;
   const center = vec3.create();
   if (this.hasSelection()) {
      for (let vertex of this.selectedSet) {
         vertices.add(vertex);
         vec3.add(center, center, vertex);
      }
      vec3.scale(center, center, 1.0/vertices.size);
   }

   const ret = this.snapshotPosition(vertices);
   ret.matrixGroup = [{center: center, count: vertices.size}];
   return ret;
};


/**
 * update all affected faces. snapshot.faces contains all affected faces.
 * also update edge and vertex's normal?
 */
PreviewCage.prototype.updatePosition = function(snapshot) {
   for (let face of snapshot.faces) {
      face.updatePosition();
   }
};


// the real workhorse.
PreviewCage.prototype._putOn = function(target) {
   let fromFace = this.selectedSet.values().next().value; // must be true

   const center = fromFace.center;
   const normal = vec3.create();
   vec3.copy(normal, fromFace.normal);
   vec3.negate(normal, normal);

   const rotAxis = mat4.create();
   Util.rotationFromToVec3(rotAxis, normal, target.normal);
   
   const transform = mat4.create();
   mat4.fromTranslation(transform, target.center);
   mat4.mul(transform, transform, rotAxis);
   vec3.negate(center, center);
   const centerTransform = mat4.create();
   mat4.fromTranslation(centerTransform, center);
   mat4.mul(transform, transform, centerTransform);

   // now transform all vertex
   for (let vertex of this.geometry.vertices) {
      vec3.transformMat4(vertex, vertex, transform);
   }

   // recompute bb, normal...
   this._updatePosition(this.geometry.faces);   //vec3.transformMat4(face.normal, face.normal, rotAxis);
};


PreviewCage.prototype.putOnVertex = function(vertex) {
   const normal = vec3.create();
   vertex.getNormal(normal);

   this._putOn({normal: normal, center: vertex});
};

PreviewCage.prototype.putOnEdge = function(hEdge) {
   const normal = vec3.create();
   hEdge.wingedEdge.getNormal(normal);
   const center = vec3.create();
   vec3.add(center, hEdge.origin, hEdge.destination());
   vec3.scale(center, center, 0.5);

   this._putOn({normal: normal, center: center});
};

PreviewCage.prototype.putOnFace = function(polygon) {   
   this._putOn({normal: polygon.normal, center: polygon.center});
};


// flatten
PreviewCage.prototype.flattenEdge = function(axis) {
   // first snapshot original position
   const ret = this.snapshotEdgePosition();

   // project onto axis.
   const center = vec3.create();
   const vertices = new Set;
   const edgeGroups = this.geometry.findEdgeGroup(this.getSelectedSorted());
   for (let group of edgeGroups) {
      // compute center of a plane
      vertices.clear();
      vec3.set(center, 0, 0, 0);
      for (let wEdge of group) { // compute center.
         for (let hEdge of wEdge) {
            if (!vertices.has(hEdge.origin)) {
               vec3.add(center, center, hEdge.origin);
               vertices.add(hEdge.origin);
               //this.geometry.addAffectedEdgeAndFace(hEdge.origin);
            }
         }
      }
      vec3.scale(center, center, 1/vertices.size);
      // now project all vertex to (axis, center) plane.
      Util.projectVec3(vertices, axis, center);
   }

   this._updatePosition(ret.faces);
   return ret;
};


// add group normal if planeNormal not present.
PreviewCage.prototype.flattenFace = function(planeNormal) {
   // first snapshot original position.
   const ret = this.snapshotFacePosition();

   const faceGroups = WingedTopology.findFaceGroup(this.getSelectedSorted());
   const center = vec3.create();
   const vertices = new Set;
   let normal = planeNormal;
   if (!planeNormal) {
      normal = vec3.create();
   }
   for (let group of faceGroups) {
      vertices.clear();
      vec3.set(center, 0, 0, 0);
      for (let face of group) {
         for (let hEdge of face.hEdges()) {
            if (!vertices.has(hEdge.origin)) {
               vertices.add(hEdge.origin);
               vec3.add(center, center, hEdge.origin);
               //this.geometry.addAffectedEdgeAndFace(hEdge.origin);
            }
         }
         if (!planeNormal) {
            vec3.add(normal, normal, face.normal);
         }
      }
      vec3.scale(center, center, 1/vertices.size);
      if (!planeNormal) {
         vec3.normalize(normal, normal);
      }
      Util.projectVec3(vertices, normal, center);
   }

   this._updatePosition(ret.faces);
   return ret;
};


PreviewCage.prototype.flattenVertex = function(planeNormal) {
   if (this.selectedSet.size > 1) { // needs at least 2 vertex to get a center.
      const selectedVertices = this.getSelectedSorted();
      const ret = this.snapshotVertexPosition();

      const center = vec3.create();
      for (let vertex of selectedVertices) {
         vec3.add(center, center, vertex);
         //this.geometry.addAffectedEdgeAndFace(vertex);
      }
      vec3.scale(center, center, 1/selectedVertices.length);
      Util.projectVec3(selectedVertices, planeNormal, center);

      this._updatePosition(ret.faces);
      return ret;
   }
   return null;
};


//--------------------------------------------------------------------------------------------------
// topology changing --


PreviewCage.prototype.extractFace = function() {
   var vertexSize = this.geometry.vertices.size;
   var edgeSize = this.geometry.edges.size;
   var faceSize = this.geometry.faces.size;
   // array of edgeLoop. 
   var edgeLoops = this.geometry.extractPolygon(this.selectedSet);
   // adjust preview to the new vertices, edges and faces.
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   //this._resizeEdges();

   return edgeLoops;
};


PreviewCage.prototype.creaseEdge = function() {
   return this.extrudeEdge(true);
}
//
// extrudeEdge - add 1/5 vertex to non-selected next/prev hEdges.
// or to extrude corner if next/prev hEdges are selected. 
// creaseFlag = crease endCap is different.
//
// use geometry functions.
//    lifeCornerEdge, extrudeEdge, splitEdge, _liftDanglingEdge, extrudeEdge, insertEdge
//
PreviewCage.prototype.extrudeEdge = function(creaseFlag = false) {
   // return value
   let collapsibleWings = new Set;
   let liftEdges = [];
   function undoExtrudeAccounting(result) {  // for undo Purpose.
      for (let hEdge of result.extrude) {
         collapsibleWings.add(hEdge.wingedEdge);
      }
      for (let hEdge of result.lift) {
         liftEdges.push(hEdge);
      }
   };
   // temp for accounting purpose.
   const pt = [0, 0, 0];
   let extrudeOut  = new Set;    // fFence
   let extrudeIn = new Set;       // sFence
   let fences = [];
   let adjustEnd = [];
   let adjustStart = [];
   let traversedEdges = new Set;
   for (let wEdge of this.selectedSet) {
      for (let hEdge of wEdge) {
         if (traversedEdges.has(hEdge)) {  
            continue;   // already processed.
         }
         let current = hEdge.next;
         while (current !== hEdge) {
            if (!this.selectedSet.has(current.wingedEdge)) {
               while (!this.selectedSet.has(current.next.wingedEdge)) { current = current.next; }
               break;   // found the last of the first contiguous non-selected hEdge.
            } 
            // this is selected, so keep going.
            current = current.next;
         }
         if (current === hEdge) {   // all inner edges of polygon selected. 
            for (let current of hEdge.face.hEdges()) {
               traversedEdges.add(current);
            }  
            // liftCorner, and extrudeTheLooop.
            let danglingOut = this.geometry.liftCornerEdge(current);
            liftEdges.push(danglingOut.pair);
            let result = this.geometry.extrudeEdge(danglingOut.pair, danglingOut);    
            undoExtrudeAccounting(result);
         } else { // now we have a starting non-selected hEdge. restart from here. this is the heart of the algorithm.
            //let fences = [];
            hEdge = current;     // reset the starting edge.
            do {
               let start = current; // now find contiguous selected.
               current = current.next;
               while (this.selectedSet.has(current.wingedEdge)) {
                  traversedEdges.add(current);
                  current = current.next; // go until not selected.
               }
               let endAdjust = false;
               let startAdjust = false;
               let end = current;
               // we have start, we have end. now split new Edge if not already split by neighbor edges.
               if (!extrudeIn.has(current.pair)) {
                  if (end === end.pair.next.pair.next) { // special case of -- edge. lift Edge.
                     endAdjust = true;
                  } else { // split it out.
                     vec3.lerp(pt, current.origin, current.destination(), 0.2);
                     current = this.geometry.splitEdge(current, pt); // current newly create edge
                     end = current;
                     extrudeOut.add(current);
                     liftEdges.push(current.pair);
                  }
               } else {
                  extrudeIn.delete(current.pair);   // yes, already create, now connect together, can savely remove
               }
               if (!extrudeOut.has(start.pair)) {  // we have end, check if already split by neighbor edges.
                  if (start === start.next.pair.next.pair) { // special case of -- edge. lift Edge
                     startAdjust = true;
                  } else { // split it out, start stay in the front.
                     vec3.lerp(pt, start.origin, start.destination(), 0.8);
                     let newOut = this.geometry.splitEdge(start.pair, pt).pair;
                     extrudeIn.add(newOut);
                     liftEdges.push(newOut);
                     if (start === hEdge) {
                        hEdge = newOut;               // adjust endEdge.
                     }
                     start = newOut;
                  }
               } else {
                  extrudeOut.delete(start.pair);   // yes, already create, now connect together, can savely remove
               }
               let fence = {start: start, end: end};
               fences.push(fence);
               if (endAdjust) { adjustEnd.push(fence);}
               if (startAdjust) { adjustStart.push(fence);}
               // non-selected edge
               while (!this.selectedSet.has(current.next.wingedEdge)) { 
                  current = current.next;
               }
            } while (current !== hEdge);  // check if we have reach starting point.
         }
      }
   }
   // before loop the extrudeEdge, check if we needs to adjust {start, end}
   for (let fence of adjustEnd) {
      let end = fence.end;
      end.face.getCentroid(pt);
      vec3.lerp(pt, end.origin, pt, 0.2);
      const destVert = this.geometry.addVertex(pt);
      end = this.geometry._liftDanglingEdge(end.prev(), destVert);
      liftEdges.push(end.pair);
      fence.end = end;
   }
   for (let fence of adjustStart) {
      let start = fence.start;
      start.face.getCentroid(pt);
      vec3.lerp(pt, start.destination(), pt, 0.2);
      const destVert = this.geometry.addVertex(pt);
      start = this.geometry._liftDanglingEdge(start, destVert);
      liftEdges.push(start.pair);
      fence.start = start.pair;
   }
   // now loop the extrudeEdge. we could not (splitEdge and extrudeEdge) because it will become very hard to find the beginning again.
   for (let fence of fences) {
      // now extrude the contiguous selected edge.
      let result = this.geometry.extrudeEdge(fence.start, fence.end);
      undoExtrudeAccounting(result);
   }

   // connected the extrudeEdge corner together if any.
   for (let hOut of extrudeOut) {
      let hIn = hOut.pair;
      // if (extrudeIn.has(hIn)) { continue; } // this is special case of -- edges. already connected. 
      if (creaseFlag) {  // special case of creasing
         let currentOut = hIn.next;
         const endIn = currentOut.pair.next.pair;
         if (extrudeIn.has(endIn))  { // yes the special pair
            if ((currentOut.face.numberOfVertex > 3) && (currentOut.pair.face.numberOfVertex > 3)) {  // could not do diagonal with triangle.
               // check if we have to splitEdge because we share the edge with other selected edge.
               if (extrudeIn.has(currentOut.next.pair) && extrudeOut.has(currentOut.pair.prev().pair)) {
                  vec3.lerp(pt, currentOut.origin, currentOut.destination(), 0.5);
                  let newOut = this.geometry.splitEdge(currentOut, pt);
                  liftEdges.push(newOut.pair);
                  currentOut = newOut;
               }
               // insert diagonal edge.
               let diagonalOut = this.geometry.insertEdge(currentOut, hIn);
               collapsibleWings.add(diagonalOut.wingedEdge);
               // slide currentOut Edge to diagonal.
               this.geometry.slideToNext(currentOut.pair);  // will collapse back, due to edge's contraction.
               continue;   // done th end cap
            }
         }
      }
      do {
         hIn = hIn.next.pair;   // move to next In
         if (extrudeIn.has(hIn)) {  // just connect, then exit
            let connect = this.geometry.insertEdge(hIn.pair, hOut.pair);
            collapsibleWings.add(connect.wingedEdge);
            break;
         } else { // split edge and connect
            vec3.lerp(pt, hIn.destination(), hIn.origin, 0.2);
            let newOut = this.geometry.splitEdge(hIn.pair, pt);
            hIn = newOut.pair;
            liftEdges.push( hIn );
            let connect = this.geometry.insertEdge(newOut, hOut.pair);
            collapsibleWings.add(connect.wingedEdge);
         }
         hOut = hIn.pair;  // move to current
      } while (true);   // walk until we hit the other pair
   }

   this.updateAffected();  // update all affected polygon.

   return {collapsibleWings: collapsibleWings, liftEdges: liftEdges};
};
/**
 * use: dissolvEdge, collapseEdge
 */
PreviewCage.prototype.undoExtrudeEdge = function(extrude) {
   if (extrude.dissolveEdges) {
      for (let hEdge of extrude.dissolveEdges) {
         if (hEdge.wingedEdge.isLive()) {
            this.geometry.dissolveEdge(hEdge, extrude.collapsibleWings);
         }
      }
   }

   for (let hEdge of extrude.liftEdges) {
      this.geometry.collapseEdge(hEdge, extrude.collapsibleWings);
   }
 
   this.updateAffected();
};


//
// extrudeVertex - add 1/4 vertex to every edge then connect all together.
PreviewCage.prototype.extrudeVertex = function() {
   const oldSize = this._getGeometrySize();

   const splitEdges = [];
   const extrudeLoops = [];
   const pt = vec3.create();
   for (let vertex of this.selectedSet) {
      let firstHalf;
      let prevHalf = null;
      let hEdge = vertex.outEdge;
      do {
         vec3.lerp(pt, hEdge.origin, hEdge.destination(), 0.25);
         let newOut = this.geometry.splitEdge(hEdge, pt);   // pt is the split point.
         splitEdges.push( newOut );
         hEdge = newOut.pair.next;                          // move to next
         // connect vertex
         if (prevHalf) {
            let outConnect = this.geometry.insertEdge(newOut, prevHalf);
            extrudeLoops.push( outConnect );
            prevHalf = newOut.pair;
         } else {
            firstHalf = newOut;   // remember to save the first one
            prevHalf = newOut.pair;
         }
      } while (hEdge !== firstHalf);   // firstHalf is the new vertex.outEdge;
      // connect last to first loop.
      let outConnect = this.geometry.insertEdge(firstHalf, prevHalf);
      extrudeLoops.push( outConnect );
   }

   this._updatePreviewAll(oldSize, this.geometry.affected);

   return {insertEdges: extrudeLoops, splitEdges: splitEdges};
};
PreviewCage.prototype.undoExtrudeVertex = function(extrude) {
   const oldSize = this._getGeometrySize();

   for (let hEdge of extrude.insertEdges) {
      this.geometry.removeEdge(hEdge);
   }
   for (let hEdge of extrude.splitEdges) {
      this.geometry.collapseEdge(hEdge.pair);
   }
 
   this._updatePreviewAll(oldSize, this.geometry.affected);
}


//
// extrudeFace - will create a list of 
PreviewCage.prototype.extrudeFace = function(contours) {
   const oldSize = this._getGeometrySize();
   // array of edgeLoop. 
   if (!contours) {
      contours = {};
      contours.edgeLoops = WingedTopology.findContours(this.selectedSet); 
   }
   contours.extrudeEdges = this.geometry.liftAndExtrudeContours(contours.edgeLoops);
   //const edgeLoops = this.geometry.extrudePolygon(this.selectedSet);
   // add the new Faces. and new vertices to the preview
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // reselect face
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      this.selectFace(polygon);
   }

   return contours; //edgeLoops;
};


// collapse list of edges
PreviewCage.prototype.collapseExtrudeEdge = function(undo) {
   const edges = undo.extrudeEdges;
   const affectedPolygon = new Set;
   const oldSize = this._getGeometrySize();
   for (let edge of edges) {
      for (let outEdge of edge.origin.eachOutEdge()) {
         affectedPolygon.add(outEdge.face);
      }
      this.geometry.collapseEdge(edge);
   }
   // recompute the smaller size
   this._updatePreviewAll(oldSize,  this.geometry.affected);
   // reselect face
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      this.selectFace(polygon);
   }

   // update all affected polygon(use sphere). recompute centroid.
   for (let polygon of affectedPolygon) {
      if (polygon.isLive()) {
         polygon.update();
      }
   }
};

//
// selectable polygon - find exterior edges loop of selected polygon
//
PreviewCage.prototype.findExtFaceContours = function() {
   const contourEdges = new Set;
   const cornerFaces = new Set;
   const edgeLoops = [];
   // find all contourEdges to extrude
   for (let polygon of this.selectedSet) {
      for (let outEdge of polygon.hEdges()) {
         let extEdge = outEdge.pair;
         if (!contourEdges.has(extEdge) && !this.selectedSet.has(extEdge.face)) {   // yes, this exterior edge has not been processed yet
            const edgeLoop = [];
            let current = extEdge;
            do {
               edgeLoop.push( current );
               contourEdges.add(current);       // checkIn the contour edge.
               let corner = true;
               while (!this.selectedSet.has(current.next.pair.face)) {  // walk to the next exterior edge
                  current = current.next.pair;
                  corner = false;
               }
               if (corner) {
                  cornerFaces.add(current.face);
               }
               current = current.next;          // the next exterior Edge
            } while (current !== extEdge);      // check if we come full circle
            edgeLoops.push( edgeLoop );
         }
      }
   }

   return {contourLoops: edgeLoops, cornerFaces: cornerFaces};
};


PreviewCage.prototype.bumpFace = function() {
   const oldSize = this._getGeometrySize();

   // find contourEdge
   const result = this.findExtFaceContours();
   const contours = result.contourLoops;

   const pt = vec3.create();
   const cornerFaces = new Map;
   let collapsibleWings = new Set;
   let dissolveEdges = new Set;
   let liftEdges = new Set;
   let self = this;
   function bumpEdge(next, prev) {
      let connectOut = self.geometry.insertEdge(next, prev);
      collapsibleWings.add(connectOut.wingedEdge);
      dissolveEdges.add(connectOut); // make sure it gone.
   };
   // split and connect the exterior edges.
   for (let loop of contours) {
      let firstLift = null;
      let prevLift = null;
      let prevH = loop[loop.length-1]; // get the last exterior edge
      for (let hEdge of loop) {
         let current = prevH.next;
         if (current !== hEdge) {   // skip corner
            do {  // at lease one splitEdge
               let splitOut = current;
               if (collapsibleWings.has(current.next.wingedEdge) || liftEdges.has(current.next)) {  // yep, already split,
                  // check if neighbor face already bump it
                  if (prevLift) {
                     if (current.next.next !== prevLift) {  // no, not bump yet.
                        bumpEdge(splitOut, prevLift);
                     }
                  } else if (firstLift === null) { // first time through
                     firstLift = current;
                  } else { // exit cornerFace
                     const fans = cornerFaces.get(current.face);
                     fans.add(current);
                  }
               } else { // split edge, and connect to prevLift
                  vec3.lerp(pt, current.origin, current.destination(), 0.5);
                  splitOut = this.geometry.splitEdge(current, pt);   // pt is the split point.
                  liftEdges.add(splitOut.pair);
                  if (prevLift) {   // connect to prevLift
                     bumpEdge(splitOut, prevLift);
                  } else if (firstLift === null) { // first time through
                     firstLift = splitOut;
                  } else { // exit cornerFace
                     const fans = cornerFaces.get(splitOut.face);
                     fans.add(splitOut);
                  }
               }

               prevLift = splitOut.pair;
               current = splitOut.pair.next;
            } while (current !== hEdge);
         } else { // inner corner, reset prevLift
            if (!cornerFaces.has(current.face)) {
               cornerFaces.set(current.face, new Set);
            }
            const fans = cornerFaces.get(current.face);
            if (prevLift) {
               fans.add( prevLift.prev() );
               prevLift = null;
            }
            fans.add( prevH );   // all inEdge.
            if (firstLift === null) {  // firstLift is a corner, so no worry. undefined it
               firstLift = undefined;
            }
         }
         prevH = hEdge;
      }
      if (prevLift) {
         if (cornerFaces.has(prevLift.face)) {
            const fans = cornerFaces.get(prevLift.face);
            fans.add( prevLift.prev() );
         }

         if (firstLift && (firstLift.next.next !== prevLift)) {   // no bumped by other loop
            // connect last to first.
            bumpEdge(firstLift, prevLift);
         }
      }
   }
   // now do polygon fans on the cornerFace.
   for (let [polygon, fans] of cornerFaces) {   // fan is error
      const fan = this.geometry.insertFan(polygon, fans);
      // add fan to dissolveEdges, and collapsibleWings
      //liftEdges.add(liftEdge);
      //collapsibleWings.add(liftEdge.wingedEdge);
      for (let hEdge of fan) {
         collapsibleWings.add(hEdge.wingedEdge);
         dissolveEdges.add(hEdge);
      }
   }

 
   this._updatePreviewAll(oldSize, this.geometry.affected);

   return {liftEdges: liftEdges, collapsibleWings: collapsibleWings, dissolveEdges: dissolveEdges};
};


PreviewCage.prototype.cutEdge = function(numberOfSegments) {
   const edges = this.selectedSet;

   const oldSize = this._getGeometrySize();
   const vertices = [];
   const splitEdges = [];              // added edges list
   // cut edge by numberOfCuts
   let diff = vec3.create();
   let vertex = vec3.create();
   for (let wingedEdge of edges) {
      let edge = wingedEdge.left;
      vec3.sub(diff, edge.origin, edge.destination()); // todo: we could use vec3.lerp?
      for (let i = 1; i < numberOfSegments; ++i) {
         const scaler = (numberOfSegments-i)/numberOfSegments;
         vec3.scale(vertex, diff, scaler);                  
         vec3.add(vertex, edge.destination(), vertex);
         const newEdge = this.geometry.splitEdge(edge, vertex);       // input edge will take the new vertex as origin.
         vertices.push( edge.origin );
         splitEdges.push( newEdge.pair );
      }
      // update previewEdge position.
      //this._updatePreviewEdge(edge, true);
   }
      // after deletion of faces and edges. update
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // returns created vertices.
   return {vertices: vertices, halfEdges: splitEdges};
};

// collapse list of edges, pair with CutEdge, bevelEdge.
PreviewCage.prototype.collapseSplitOrBevelEdge = function(collapse) {
   const oldSize = this._getGeometrySize();
   for (let halfEdge of collapse.halfEdges) {
      if (halfEdge.wingedEdge.isLive()) { // checked for already collapse edge
         this.geometry.collapseEdge(halfEdge, collapse.collapsibleWings);
      }
   }
   // recompute the smaller size
   this._updatePreviewAll(oldSize, this.geometry.affected);
};


// connect selected Vertex,
PreviewCage.prototype.connectVertex = function() {
   const oldSize = this._getGeometrySize();
   
   //this.geometry.clearAffected();
   const edgeList = this.geometry.connectVertex(this.selectedSet);
   const wingedEdgeList = [];
   for (let edge of edgeList) {
      wingedEdgeList.push( edge.wingedEdge );
   }

   // updatePreviewbox
   this._updatePreviewAll(oldSize, this.geometry.affected);

   return {halfEdges: edgeList, wingedEdges: wingedEdgeList};
};
// pair with connectVertex.
PreviewCage.prototype.dissolveConnect = function(connect) {
   const insertEdges = connect.halfEdges;
   const oldSize = this._getGeometrySize();

   // dissolve in reverse direction
   for (let i = insertEdges.length-1; i >= 0; --i) {
      const halfEdge = insertEdges[i];
      this.geometry.removeEdge(halfEdge); // 2019-08-16 change it to halfEdge instead of halfEdge.pair
   }

   this._updatePreviewAll(oldSize, this.geometry.affected);
};


//
PreviewCage.prototype.dissolveSelectedEdge = function() {
   const dissolveEdges = [];
   const oldSize = this._getGeometrySize();
   for (let edge of this.selectedSet) {
      let undo = this.geometry.dissolveEdge(edge.left);
      let dissolve = { halfEdge: edge.left, undo: undo};
      dissolveEdges.push(dissolve);
   }
   this.selectedSet.clear();
   // after deletion of faces and edges. update
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // return affected.
   return dissolveEdges;
};
PreviewCage.prototype.reinsertDissolveEdge = function(dissolveEdges) {
   const oldSize = this._getGeometrySize();
   // walk form last to first.
   for (let i = (dissolveEdges.length-1); i >= 0; --i) {
      let dissolve = dissolveEdges[i];
      this.geometry.restoreDissolveEdge(dissolve.undo);
      this.selectEdge(dissolve.halfEdge);
   }
   this._updatePreviewAll(oldSize, this.geometry.affected);
};


PreviewCage.prototype.collapseSelectedEdge = function() {
   const restoreVertex = [];
   const collapseEdges = [];

   const selected = new Map();
   for (let edge of this.selectedSet) {
      let undo = null;
      if (edge.isLive()){
      let vertex = edge.left.origin;
      let pt;
      if (selected.has(vertex)) {
         pt = selected.get(vertex);
         selected.delete(vertex);   // going to be freed, so we can safely remove it.
         vec3.add(pt.pt, pt.pt, vertex);
         pt.count++;
      } else {
         pt = {pt: new Float32Array(3), count: 1};
         vec3.copy(pt.pt, vertex);
      }
      let keep = edge.right.origin;
      if (selected.has(keep)) {
         const keepPt = selected.get(keep);
         vec3.add(keepPt.pt, pt.pt, keepPt.pt);
         keepPt.count += pt.count;
      } else {
         selected.set(keep, pt);
      }
         undo = this.geometry.collapseEdge(edge.left);
      }
      let collapse = {halfEdge: edge.left, undo: undo};
      collapseEdges.push(collapse);
   }
   this.selectedSet.clear();

   // the selected is the remaining Vertex
   const selectedVertex = [];
   for (let [vertex, pt] of selected) {
      selectedVertex.push( vertex );
      // save and move the position
      const savePt = [0, 0, 0];
      vec3.copy(savePt, vertex);
      restoreVertex.push({vertex: vertex, savePt: savePt});
      vec3.add(pt.pt, pt.pt, savePt);
      vec3.scale(pt.pt, pt.pt, 1.0/(pt.count+1)); 
      vertex.set(pt.pt);
      this.geometry.addAffectedVertexFace(vertex);
   }
   // after deletion of
   this.updateAffected();

   return { collapse: {edges: collapseEdges, vertices: restoreVertex}, vertices: selectedVertex };
};

PreviewCage.prototype.restoreCollapseEdge = function(data) {
   const collapse = data.collapse;
   // walk form last to first.
   this.selectedSet.clear();

   const collapseEdges = collapse.edges;
   for (let i = (collapseEdges.length-1); i >= 0; --i) {
      let collapseEdge = collapseEdges[i];
      if (collapseEdge.undo) {
         this.geometry.restoreCollapseEdge(collapseEdge.undo);
      }
   }
   for (let collapseEdge of collapseEdges) { // selectedge should be in order
      this.selectEdge(collapseEdge.halfEdge);
   }
   const restoreVertex = collapse.vertices;
   for (let restore of restoreVertex) {   // restore position
      restore.vertex.set(restore.savePt);
      this.geometry.addAffectedVertexFace(restore.vertex);
   }
   // 
   this.updateAffected();
};


PreviewCage.prototype.dissolveSelectedFace = function() {
   const oldSize = this._getGeometrySize();
   const selectedEdges = new Set;
   // the all the selectedFace's edge.
   for (let polygon of this.selectedSet) {
      polygon.eachEdge( function(outEdge) {
         selectedEdges.add(outEdge.wingedEdge);
      });
   }
   // get the outline edge
   const contourLoops = WingedTopology.findContours(this.selectedSet);
   // subtract outline edges from all selected edge.
   for (let loop of contourLoops) {
      for (let edge of loop) {
         let outEdge = edge.outer;
         if (selectedEdges.has(outEdge.wingedEdge)) {
            selectedEdges.delete(outEdge.wingedEdge);
         }
      }
   }
   // the reemaining edges is the remove Edge.
   const substract = [];
   for (let edge of selectedEdges) {
      if (edge.isLive()) { // check if not already dissolve due to collapse. 2019-08-17
         substract.unshift( this.geometry.dissolveEdge(edge.left) );   // add in reverse order
      }
   }
   // update the remaining selectedSet.
   const selectedFace = this.selectedSet;
   const selectedSet = new Set;
   for (let polygon of this.selectedSet) {
      if (polygon.isLive()) {
         selectedSet.add(polygon);
      }
   }
   this.selectedSet = selectedSet;
   // update previewBox.
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // return undo function
   return {edges: substract, selection: selectedFace};
};
PreviewCage.prototype.undoDissolveFace = function(dissolve) {
   const oldSize = this._getGeometrySize();
   for (let undoDissolve of dissolve.edges) {
      this.geometry.restoreDissolveEdge(undoDissolve);
   }
   this.selectedSet.clear();
   // reselected the polygon in order.
   for (let polygon of dissolve.selection) {
      this.selectFace(polygon);
   }
   // update previewBox.
   this._updatePreviewAll(oldSize, this.geometry.affected);
}


// the original wings3D collapse quite strangely. collapse by edge index order? such a weird algorithm.
// we change it to collapse to middle.
PreviewCage.prototype.collapseSelectedFace = function() {
   const saveSet = this.selectedSet;
   // reuse edgeSelect().
   this.changeFromFaceToEdgeSelect();
   // reuse collapseEdge
   const collapse = this.collapseSelectedEdge();
   collapse.selectedFaces = saveSet;
   return collapse;
};
PreviewCage.prototype.undoCollapseFace = function(collapse) {
   this.restoreCollapseEdge(collapse);
   this._resetSelectEdge();
};


PreviewCage.prototype.dissolveSelectedVertex = function() {
   const oldSize = this._getGeometrySize();
   const undoArray = {array: [], selectedFaces: []};
   for (let vertex of this.selectedSet) {
      let result = this.geometry.dissolveVertex(vertex);
      undoArray.array.unshift( result );
      undoArray.selectedFaces.push( result.polygon );
   }
   this._resetSelectVertex();
   // update previewBox.
   this._updatePreviewAll(oldSize, this.geometry.affected);
   return undoArray;
};
PreviewCage.prototype.undoDissolveVertex = function(undoArray) {
   const oldSize = this._getGeometrySize();
   for (let undo of undoArray.array) {
      this.geometry.restoreDissolveVertex(undo);
      this.selectVertex(undo.vertex);
   }
   // update previewBox.
   this._updatePreviewAll(oldSize, this.geometry.affected);
};


// Bevelling of edge.
PreviewCage.prototype.bevelEdge = function() {
   const oldSize = this._getGeometrySize();
   const wingedEdges = this.selectedSet;

   // bevelEdge
   const result = this.geometry.bevelEdge(wingedEdges);       // input edge will take the new vertex as origin.
   // get all effected wingedEdge
   result.wingedEdges = new Set;
   result.faces = new Set;
   for (let vertex of result.vertices) {
      for (let hEdge of vertex.edgeRing()) {
         result.wingedEdges.add( hEdge.wingedEdge );
         result.faces.add( hEdge.face );
      }
   };

   // add the new Faces, new edges and new vertices to the preview
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // update vertices created vertices.
   return result;
   //let ret = {
   //   faces: [],
   //   vertices: [],
   //   wingedEdge: new set,
   //   halfEdges: [],
   //   position: float32array,
   //   direction: float32array,
   //   vertexLimit: magnitude,
   //};
};
// 
// bevel face, same as edge but with differnt hilite faces
//
PreviewCage.prototype.bevelFace = function() {
   const oldSize = this._getGeometrySize();
   const faces = this.selectedSet;

   let wingedEdges = new Set;
   for (let polygon of faces) {  // select all polygon's edges
      for (let hEdge of polygon.hEdges()) {
         wingedEdges.add( hEdge.wingedEdge );
      }
   }
   // bevelEdge
   const result = this.geometry.bevelEdge(wingedEdges);       // input edge will take the new vertex as origin.
   // get all effected wingedEdge
   result.wingedEdges = new Set;
   result.faces = new Set;
   for (let vertex of result.vertices) {
      for (let hEdge of vertex.edgeRing()) {
         result.wingedEdges.add( hEdge.wingedEdge );
         result.faces.add( hEdge.face );
      }
   };

   // add the new Faces, new edges and new vertices to the preview
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // reselect faces again. because polygon's edges were changed.
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      this.selectFace(polygon);
   }

   return result;
};
//
// bevel vertex
//
PreviewCage.prototype.bevelVertex = function() {
   const oldSize = this._getGeometrySize();
   const vertices = this.selectedSet;

   // bevelVertex
   const result = this.geometry.bevelVertex(vertices);       // input vertices, out new vertex, edges, and faces.
   // get all effected wingedEdge
   result.wingedEdges = new Set;
   result.faces = new Set;
   for (let vertex of result.vertices) {
      for (let hEdge of vertex.edgeRing()) {
         result.wingedEdges.add( hEdge.wingedEdge );
         result.faces.add( hEdge.face );
      }
   };

   // add the new Faces, new edges and new vertices to the preview
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // update vertices created vertices.
   return result;
   //let ret = {
   //   faces: [],
   //   vertices: [],
   //   wingedEdge: new set,
   //   halfEdges: [],
   //   position: float32array,
   //   direction: float32array,
   //   vertexLimit: magnitude,
   //};
};



// bridge, and unbridge
PreviewCage.prototype.bridge = function(targetFace, sourceFace) {
   if (this.selectedSet.size === 2) {  // make sure. it really target, source
      for (let polygon of targetFace.oneRing()) {  // make sure they are not neighbor
         if (polygon === sourceFace) {
            return null;
         }
      }

      const oldSize = this._getGeometrySize();

      const deltaCenter = vec3.create();
      //vec3.sub(deltaCenter, targetSphere.center, sourceSphere.center);   // what if we don't move the center, would it work better? so far, no
      const result = this.geometry.bridgeFace(targetFace, sourceFace, deltaCenter);
      // clear selection
      result.selectedFaces = this.selectedSet;
      this._resetSelectFace();


      // update previewBox.
      this._updatePreviewAll(oldSize, this.geometry.affected);  
      return result;
   }
   // should not happened, throw?
   return null;
};
PreviewCage.prototype.undoBridge = function(bridge) {
   if (bridge) {
      const oldSize = this._getGeometrySize();

      this.geometry.undoBridgeFace(bridge);

      // update previewBox.
      this._updatePreviewAll(oldSize, this.geometry.affected);  
   }
};

// 
// Inset face, reuse extrude face code.
//
PreviewCage.prototype.insetFace = function() {
   const oldSize = this._getGeometrySize();

   // array of edgeLoop.
   const contours = {};
   contours.edgeLoops = this.geometry.findInsetContours(this.selectedSet); 
   
   contours.extrudeEdges = this.geometry.liftAndExtrudeContours(contours.edgeLoops);
   // now get all the effected vertices, and moving direction.
   let vertexCount = 0;
   for (let polygon of this.selectedSet) {
      vertexCount += polygon.numberOfVertex;
   }
   // compute direction, and moveLimit.
   contours.vertices = [];
   contours.faces = new Set;
   contours.wingedEdges = new Set;
   contours.position = new Float32Array(vertexCount*3);     // saved the original position
   const position = new Util.Vec3View(contours.position);
   contours.direction = new Float32Array(vertexCount*3);    // also add direction.
   const direction = new Util.Vec3View(contours.direction);
   contours.vertexLimit = Number.MAX_SAFE_INTEGER;  // really should call moveLimit.
   for (let polygon of this.selectedSet) {
      let prev = null;
      contours.faces.add(polygon);
      for (let hEdge of polygon.hEdges()) {
         contours.vertices.push(hEdge.origin);
         contours.faces.add(hEdge.pair.face);
         contours.wingedEdges.add( hEdge.wingedEdge );
         contours.wingedEdges.add( hEdge.pair.next.wingedEdge );  // the extrude edge 
         vec3.copy(position, hEdge.origin);
         position.inc();
         if (!prev) {
            prev = hEdge.prev();
         }
         vec3.scale(direction, hEdge.destination(), 1.0/2);            // compute the sliding middle point
         vec3.scaleAndAdd(direction, direction, prev.origin, 1.0/2);
         vec3.sub(direction, direction, hEdge.origin);
         // get length and normalized.
         const len = vec3.length(direction);
         if (len < contours.vertexLimit) {
            contours.vertexLimit = len;
         }
         vec3.normalize(direction, direction);
         direction.inc();
         // 
         prev = hEdge;
      }
   }

   // add the new Faces. and new vertices to the preview
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // reselect face, or it won't show up. a limitation.
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      this.selectFace(polygon);
   }


   return contours;
};

PreviewCage.prototype.invertBody = function() {
   this.geometry.invert();
};

PreviewCage.prototype.flipBodyAxis = function(pivot, axis) {
   // first flip, then invert.
   this.geometry.flip(pivot, axis);
   this.geometry.invert();
};

// todo: current implementation is wrong. we should not average vertex, instead we should average using area of polygon
PreviewCage.prototype.bodyCentroid = function() {
   // 
   const pt = vec3.create();
   let count = 0;
   for (let vertex of this.geometry.vertices) {
      vec3.add(pt, pt, vertex);
      ++count;
   }
   if (count > 0) {
      vec3.scale(pt, pt, 1/count);
   }
   return pt;
};

PreviewCage.prototype.weldableVertex = function(vertex) {
   if (this.selectedSet.size == 1) {
      let it = this.selectedSet.values();
      let selectedVertex = it.next().value;     // get the selectedVertex
      const end = selectedVertex.outEdge;
      let current = end;
      do {
         if (current.destination() === vertex) {
            return current;
         }
         current = current.pair.next;
      } while (current !== end);
   }
   return false;
};

PreviewCage.prototype.weldVertex = function(halfEdge) {
   this.selectVertex(halfEdge.origin);
   this.selectVertex(halfEdge.destination());   // select the weld Vertex as new Selection.
   let ret = this.geometry.collapseEdge(halfEdge);
   this._updatePreviewAll();
   return ret;
};

PreviewCage.prototype.undoWeldVertex = function(undo) {
   this.geometry.restoreCollapseEdge(undo);
   this.selectVertex(undo.hEdge.destination())  // unselect
   this.selectVertex(undo.hEdge.origin);
   this._updatePreviewAll();
};


PreviewCage.prototype.intrudeFace = function() {
   const ret = {};
   if (this.selectedSet.size == 0) {
      return ret;   // no hole to intrude through.
   }

   // first merge adjacent faces
   ret.dissolve = this.dissolveSelectedFace();

   // duplicate connectivity info(invert), and vertex
   const uniqueVertex = new Map;
   const addVertex = (vertex) => {
      let pt = uniqueVertex.get(vertex);
      if (!pt) {
         pt = this.geometry.addVertex(vertex);
         uniqueVertex.set(vertex, pt);
      }
      return pt.index;
   };
   const newPolygons = [];
   const connectLoops = [];
   const originalFaces = Array.from(this.geometry.faces);
   for (let polygon of originalFaces) {
      const ptsLoop = [];
      for (let hEdge of polygon.hEdges()) {
         ptsLoop.push( addVertex(hEdge.origin) );
      }
      if (this.selectedSet.has(polygon)) {   // save hole's connect loop.
         let i = 0;
         let lastFront, lastBack;
         for (let hEdge of polygon.hEdges()) {
            const currentF = hEdge.origin.index;
            const currentB = ptsLoop[i];
            if (i > 0) {
               connectLoops.push( [lastFront, currentF, currentB, lastBack] );
            }
            ++i;
            lastFront = currentF;
            lastBack = currentB;
         }
         // add the last loop
         connectLoops.push( [lastFront, polygon.halfEdge.origin.index, ptsLoop[0], lastBack]);
      } else { // add the invert polygon.
         ptsLoop.reverse();
         newPolygons.push( this.geometry.addPolygon(ptsLoop, Material.default) );   // todo: copy the invert polygon
      }
   }

   // now holed the remaining selected Face
   this._updatePreviewAll();  // temp Fix: needs to update Preview before holeSelectedFace
   ret.holed = this.holeSelectedFace();
   // select all newly created polygon
   for (let polygon of newPolygons) {
      this.selectFace(polygon);
   }
   ret.invert = newPolygons;

   // connect to the front polygons.
   ret.connect = [];
   for (let loop of connectLoops) {
      ret.connect.push( this.geometry.addPolygon(loop, Material.default) );   // todo: copy the connection polygon
   }

   this._updatePreviewAll();
   // return restoration params.
   return ret;
};

PreviewCage.prototype.undoIntrudeFace = function(intrude) {
   for (let polygon of intrude.connect) { // first remove the connect face
      this.geometry.makeHole(polygon);
   }

   // now deselect inverts, and remove all polygon' and it edges and vertex
   for (let polygon of intrude.invert) {
      this.selectFace(polygon);
   }
   const wEdges = new Set();
   for (let polygon of intrude.invert) {
      for (let hEdge of polygon.hEdges()) {
         this.geometry._freeVertex(hEdge.origin);
         wEdges.add( hEdge.wingedEdge );
      }
      this.geometry._freePolygon(polygon);
   }
   for (let wEdge of wEdges) {
      this.geometry._freeEdge(wEdge.left);
   }

   // now restore hole facce
   this.undoHoleSelectedFace(intrude.holed);

   // undo merge face
   this.undoDissolveFace(intrude.dissolve);
};


PreviewCage.prototype.holeSelectedFace = function() {
   // remove the selected Face, and free it.
   const holes = new Set(this.selectedSet);
   const ret = [];
   for (let polygon of holes) {
      this.selectFace(polygon);
      ret.push( this.geometry.makeHole(polygon) );
   }

   return ret;
};
PreviewCage.prototype.undoHoleSelectedFace = function(holes) {
   for (let hole of holes) {
      const polygon = this.geometry.undoHole(hole);
      this.selectFace(polygon);
   }
};


// edgeMode - cut out selected contours.
PreviewCage.prototype.loopCut = function() {
   const allFaces = new Set(this.geometry.faces);
   let partition;

   const partitionFace = (polygon) => {
      partition.add(polygon);
      allFaces.delete(polygon);
      for (let hEdge of polygon.hEdges()) {
         if (!this.selectedSet.has(hEdge.wingedEdge) && allFaces.has(hEdge.pair.face)) {
            partitionFace(hEdge.pair.face);
         }
      }      
   };

   let partitionGroup = [];
   for (let wEdge of this.selectedSet) {
      for (let hEdge of wEdge) {
         if (allFaces.has(hEdge.face)) {
            partition = new Set;
            partitionFace(hEdge.face);
            // go the partition, now save it
            partitionGroup.push( partition );
         }
      }
   }

   if (partitionGroup.length < 2) {   // make sure, there is at least 2 partition.
      geometryStatus("less than 2 partitions");
      return null;
   }

   // we have to separate from smallest to largest, so that separation can gel into single face correctly.
   partitionGroup = partitionGroup.sort((a,b) => { return a.size - b.size;});
   // reset selected set
   const selected = new Set(this.selectedSet);
   for (let wEdge of selected) {
      this.selectEdge(wEdge.left);
   }

   const ret = {separateCages: [], fillFaces: [], contourLoops: [], selectedSet: selected};
   const fillFaces = new Set;
   // detach smaller groups from the largest, by finding the contour.
   for (let i = 0; i < partitionGroup.length; ++i) {
      const partition = partitionGroup[i];
      let newFills = [];
      let separate = this;
      if (i !== (partitionGroup.length-1)) { 
         let contours = WingedTopology.findContours(partition); // detach faceGroups from main
         for (let edgeLoop of contours) {
            if ((edgeLoop.length > 0) && !fillFaces.has(edgeLoop[0].outer.face)) { // not already separated.
               this.geometry.liftContour(edgeLoop);
               const fillFace = this.geometry._createPolygon(edgeLoop[0].outer, edgeLoop.size); // fill hole.
               newFills.push(fillFace);
               separate = this.detachFace(partition, i);
               ret.contourLoops.push( edgeLoop );
            }
         }
      }
      // merge/delete add fillFaces
      for (let polygon of fillFaces) {
         if (separate.geometry.faces.has(polygon)) {
            separate.selectedSet.add(polygon);
            fillFaces.delete(polygon);
         }
      }
      separate.dissolveSelectedFace(); // merge if possible.
      ret.fillFaces = ret.fillFaces.concat( Array.from(separate.selectedSet) );
      separate.selectedSet = new Set;
      for (let polygon of newFills) {  // newFills should be always 0th, or 1th length. 
         fillFaces.add(polygon);
      }

      // separation will be selected.
      if (separate !== this) {
         ret.separateCages.push( separate );
      }
   }

   return ret;
};

PreviewCage.prototype.undoLoopCut = function(undo) {
   // merge back to this
   this.merge(undo.separateCages);

   // remove fillFaces
   for (let polygon of undo.fillFaces) {
      this.geometry.removePolygon(polygon);
   }

   // weldContour back
   for (let edgeLoop of undo.contourLoops) {
      this.geometry.weldContour(edgeLoop);
   }

   // reSelect edges.
   for (let wEdge of undo.selectedSet) {
      this.selectEdge(wEdge.left);
   }
};


PreviewCage.prototype.getSelectedFaceContours = function() {
   let contours = {};
   contours.edgeLoops = WingedTopology.findContours(this.selectedSet);

   contours.edges = new Set;
   // copy to a set, so searching is easier.
   for (let edgeLoop of contours.edgeLoops) {
      for (let edge of edgeLoop) {
         contours.edges.add(edge.outer.wingedEdge);
      }
   }

   return contours;
};

PreviewCage.prototype.liftFace = function(contours, hingeHEdge) {
   // extrude edges
   contours.extrudeEdges = this.geometry.liftAndExtrudeContours(contours.edgeLoops);
   
   this._updatePreviewAll();
   // collapse hEdgeHinge
   const length = contours.extrudeEdges.length
   for (let i = 0; i < length; ++i) {
      const hEdge = contours.extrudeEdges[i];
      if (hEdge.next.wingedEdge === hingeHEdge.wingedEdge) {
         this.geometry.collapseEdge(hEdge);
         if (i === length-1) {
            this.geometry.collapseEdge(contours.extrudeEdges[0]);
            contours.extrudeEdges = contours.extrudeEdges.slice(1, length-1); // remove collapseEdges
         } else {
            this.geometry.collapseEdge(contours.extrudeEdges[i+1]);
            contours.extrudeEdges.splice(i, 2);     // remove collapseEdges
         }
         break;
      }
   }

   // reselect face, due to rendering requirement
   this._updatePreviewAll();
   // reselect face
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      this.selectFace(polygon);
   }

   return contours;
};


//
// mirror object, select polygon will become hole and connect the mirror object to original object
//
PreviewCage.prototype.mirrorFace = function() {
   const selectedPolygons = this.getSelectedSorted();

   const mirrorMat = mat4.create();
   const protectVertex = new Set;
   const protectWEdge = new Set;
   const uniqueVertex = new Map;
   function resetAddVertex(targetFace) {
      uniqueVertex.clear();
      for (let hEdge of targetFace.hEdges()) {
         uniqueVertex.set(hEdge.origin, hEdge.origin);   // targetFace's pts are shared to the newly mirror faces.
         protectVertex.add(hEdge.origin);
         protectWEdge.add(hEdge.wingedEdge);
      }
      Util.reflectionMat4(mirrorMat, targetFace.normal, targetFace.halfEdge.origin);
   };
   const addVertex = (vertex) => {
      let pt = uniqueVertex.get(vertex);
      if (!pt) {
         pt = this.geometry.addVertex(vertex);
         vec3.transformMat4(pt, pt, mirrorMat);
         uniqueVertex.set(vertex, pt);
      }
      return pt.index;
   };

   const originalFaces = Array.from(this.geometry.faces);
   const newGroups = [];
   for (let target of selectedPolygons) {
      resetAddVertex(target);
      const newPolygons = [];
      for (let polygon of originalFaces) {
         if (polygon !== target) {  // add polygon
            const ptsLoop = [];
            for (let hEdge of polygon.hEdges()) {
               ptsLoop.push( addVertex(hEdge.origin) );
            }
            ptsLoop.reverse();   // new face is invert
            newPolygons.push( ptsLoop );
         }
      }
      newGroups.push( newPolygons );
   }

         
   this._updatePreviewAll();  // temp Fix: needs to update Preview before holeSelectedFace
   // now we can safely create new polygons to connect everything together
   const mirrorGroups = [];
   for (let i = 0; i < selectedPolygons.length; ++i) {
      const polygon = selectedPolygons[i];
      this.selectFace(polygon);
      const holed = this.geometry.makeHole(polygon);   // remove selected polygon so mirror face connect through
      const newPolygons = newGroups[i];
      const newMirrors = [];
      for (let ptsLoop of newPolygons) {
         newMirrors.push( this.geometry.addPolygon(ptsLoop, Material.default) ); // todo: copy the mirror polygon's material
      }
      mirrorGroups.push( {holed: holed, newMirrors: newMirrors} );
   }

   this._updatePreviewAll();

   return {mirrorGroups: mirrorGroups, protectVertex: protectVertex, protectWEdge: protectWEdge};
}

PreviewCage.prototype.undoMirrorFace = function(undoMirror) {
   for (let undo of undoMirror.mirrorGroups) {
      const wEdges = new Set();
      for (let polygon of undo.newMirrors) {
         for (let hEdge of polygon.hEdges()) {
            if (!undoMirror.protectVertex.has(hEdge.origin)) {
               this.geometry._freeVertex(hEdge.origin);
            }
            if (undoMirror.protectWEdge.has(hEdge.wingedEdge)) {
               hEdge.next = hEdge.next.pair.next;     // hacky: restore to original connection.
            } else {
               wEdges.add( hEdge.wingedEdge );
            }
         }
         this.geometry._freePolygon(polygon);
      }
      for (let wEdge of wEdges) {
         this.geometry._freeEdge(wEdge.left);
      }
      // restore hole
      this.undoHoleSelectedFace([undo.holed]);
   }
   this._updatePreviewAll();
};


PreviewCage.prototype.cornerEdge = function() {
   const selectedEdge = this.getSelectedSorted();

   const faces = [];
   const vertices = [];
   const splitEdges = [];
   const dissolveEdges = [];
   const vertex = vec3.create();
   for (let wEdge of selectedEdge) {
      let three;
      let five = wEdge.left;
      if (five.face) {
         if (five.face.numberOfVertex == 5) {
            three = wEdge.right;
            if (three.face && (three.face.numberOfVertex !== 3)) {
               three = null;
            }
         } else if (five.face.numberOfVertex === 3) {
            three = five;
            five = wEdge.right;
            if (five.face && (five.face.numberOfVertex !== 5)) {
               five = null;
            }
         }
      }
      if (three && five) {
         faces.push( three.face );
         faces.push( five.face );
         // insert mid point at wEdge.
         vec3.add(vertex, three.origin, five.origin);
         vec3.scale(vertex, vertex, 0.5);
         let outEdge = this.geometry.splitEdge(five, vertex);
         vertices.push(five.origin);
         splitEdges.push(outEdge.pair);
         // insert edge from mid-pt to five's diagonal point.
         let connectOut = this.geometry.insertEdge(outEdge, five.next.next.next);
         dissolveEdges.push(connectOut.pair);
         faces.push(connectOut.face);
      }
   }
   // compute direction, and copy position.
   let direction = new Float32Array(dissolveEdges.length*3);
   const dir = new Util.Vec3View(direction);
   for (let connect of dissolveEdges) {
      vec3.sub(dir, connect.origin, connect.destination());
      vec3.normalize(dir, dir);
      dir.inc();
   }
   const ret = this.snapshotPosition(vertices, direction);
   this._updatePreviewAll();
   // reselect splitEdges
   for (let hEdge of splitEdges) {
      this.selectEdge(hEdge);
   }

   // undo stuff
   ret.splitEdges = splitEdges;
   ret.dissolveEdges = dissolveEdges;
   return ret; 
};
PreviewCage.prototype.undoCornerEdge = function(undo) {
   // dissolveEdges first
   for (let hEdge of undo.dissolveEdges) {
      this.geometry.removeEdge(hEdge);
   }

   // unselect the splitEdges then restore to original situation
   for (let hEdge of undo.splitEdges) {
      this.selectEdge(hEdge);
      this.geometry.collapseEdge(hEdge);
   }
   this._updatePreviewAll();
}

PreviewCage.prototype.slideEdge = function() {
   const selection = this.snapshotSelectionEdge();

   const sixAxis = [[0, 0, 1], [0, 1, 0], [1, 0, 0], [0, 0, -1], [0, -1, 0], [-1, 0, 0]];
   const vertices = new Map;
   const pt = vec3.create();
   for (let wEdge of selection.wingedEdges) {
      for (let hEdge of wEdge) {
         // compute the direction
         let dir = vertices.get(hEdge.origin);
         if (!dir) {
            dir = {positive: vec3.create(), negative: vec3.create()};
            vertices.set(hEdge.origin, dir);
         }
         const prev = hEdge.prev();
         const next = hEdge.pair.next;
         // compute which quadrant, pt(normal) is normalized.
         Util.computeEdgeNormal(pt, next, prev.pair);
         let max;
         let index;
         for (let i = 0; i < 6; ++i) {
            let axis = sixAxis[i];
            let angle =  vec3.dot(axis, pt);
            if (i === 0) {
               max = angle;
               index = 0;
            } else if (max < angle) {
               max = angle;
               index = i;
            }
         }
         // now compute the dir
         if (index > 2) {   // check if needs to reverse negative and positive.
            vec3.sub(pt, hEdge.origin, prev.origin);
            vec3.add(dir.negative, dir.negative, pt);
            vec3.sub(pt, next.destination(), next.origin);
            vec3.add(dir.positive, dir.positive, pt);
         } else {
            vec3.sub(pt, prev.origin, hEdge.origin);
            vec3.add(dir.positive, dir.positive, pt);
            vec3.sub(pt, next.origin, next.destination());
            vec3.add(dir.negative, dir.negative, pt);
         }
      }
   }

   // copy to array and normalize.
   const retVertices = [];
   const positiveDir = new Float32Array(vertices.size*3);
   const positive = new Util.Vec3View(positiveDir);
   const negativeDir = new Float32Array(vertices.size*3);
   const negative = new Util.Vec3View(negativeDir);
   for (const [vertex, dir] of vertices) {
      retVertices.push( vertex );
      vec3.copy(positive, dir.positive);
      vec3.normalize(positive, positive);
      positive.inc();
      vec3.copy(negative, dir.negative);
      vec3.normalize(negative, negative);
      negative.inc();
   }

   const ret = this.snapshotPosition(retVertices, positiveDir);
   ret.directionPositive = positiveDir;
   ret.directionNegative = negativeDir;

   return ret;
};
PreviewCage.prototype.positiveDirection = function(snapshot) {
   snapshot.direction = snapshot.directionPositive;
};
PreviewCage.prototype.negativeDirection = function(snapshot) {
   snapshot.direction = snapshot.directionNegative;
};


// check if given plane can cut selected face. coplanar does not count.
PreviewCage.prototype.planeCuttableFace = function(plane) {
   for (let spherePolygon of this.bvh.root.intersectBound(plane)) {
      if (this.selectedSet.has(spherePolygon)) {
         // now, check hEdge against plane.
         for (let hEdge of spherePolygon.hEdges()) {
            const t = Util.intersectPlaneHEdge(null, plane, hEdge);
            if ((t>0) && (t<1)) {   // intersection at begin or end don't count
               return true;
            }
         }
      }
   }
   return false;
};

// cut the selected by the given plane, and reconnect
PreviewCage.prototype._planeCutFace = function(cutPlanes) {
   const selectedVertex = new Set;
   const splitEdges = [];
   const pt = vec3.create();
   for (let plane of cutPlanes) {
      const cutList = [];
      for (let spherePolygon of this.bvh.root.intersectBound(plane)) {
         if (this.selectedSet.has(spherePolygon)) {
            cutList.push(spherePolygon);
         }
      }

      // sort cutList, guarantee ordering.
      cutList.sort( (a,b)=> { return a.index - b.index;} );

      // now cut, and select vertex for later connect phase.
      const cuthEdgeList = [];
      const wEdgeList = new Set;
      for (let polygon of cutList) {
         for (let hEdge of polygon.hEdges()) {
            if (!wEdgeList.has(hEdge.wingedEdge)) {
               cuthEdgeList.push(hEdge);
               wEdgeList.add(hEdge.wingedEdge);
            }
         }
      }
      for (let hEdge of cuthEdgeList) {   // only iterate once for every potentail edges
         const t = Util.intersectPlaneHEdge(pt, plane, hEdge);
         if (t == 0) {  // select origin
            selectedVertex.add( hEdge.origin );
         } else if ( (t>0) && (t<1)) { // spliEdge, and select
            let newOut = this.geometry.splitEdge(hEdge, pt);   // pt is the split point.
            splitEdges.push( newOut.pair );
            selectedVertex.add( hEdge.origin );
         }
      }
   }
   this._updatePreviewAll();  // update drawing buffer.
   return {selectedFaces: this.selectedSet, vertices: selectedVertex, halfEdges: splitEdges};
};

PreviewCage.prototype.planeCutFace = function(plane) {
   return this._planeCutFace([plane]);
};

PreviewCage.prototype.planeCutBody = function(plane) {
   const result = this._planeCutFace([plane]);

   // adjust result to body
   return {body: result.selectedFaces, vertices: result.vertices, halfEdges: result.halfEdges};
};


PreviewCage.prototype.sliceBody = function(planeNormal, numberOfPart) {
   // first get tight bounding box.
   const min = vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
   const max = vec3.fromValues(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
   this.geometry.getExtent(min, max);
   const size = vec3.create();
   vec3.sub(size, max, min);
   // find the number of cuts.
   const cutPlanes = [];
   const center = vec3.create();
   const numberOfCuts = numberOfPart-1;
   for (let i = 1; i <= numberOfCuts; ++i) {
      vec3.lerp(center, min, max, i/(numberOfCuts+1));
      cutPlanes.push( new Plane(planeNormal, center) );
   }

   // iterate through the cut
   const result = this._planeCutFace(cutPlanes);

   // adjust result to body
   return {body: result.selectedFaces, vertices: result.vertices, halfEdges: result.halfEdges};
};


PreviewCage.prototype.getBodySelection = function(selection, extent) {
   // first get extent size
   this.geometry.getExtent(extent.min, extent.max);
   // now push all faces's sphere.
   for (let polygon of this.selectedSet) {
      selection.push( polygon );
   }
};


/**
 * Make a group of holes, one by one.
 */
PreviewCage.prototype.makeHolesFromBB = function(selection) {
  const restore = [];
   for (let spherePolygon of selection) {
      this.selectedSet.delete(spherePolygon);              // remove from selection. also selection off(not done)?
      if (spherePolygon.isLive()) { // guard for complex interaction.
         restore.push( this.geometry.makeHole(spherePolygon) );
      }
   }

   this._updatePreviewAll();
   return restore; 
};


// the real workhorse
PreviewCage.findWeldContours = function(overlap) {
   // combinedCages
   const combinedCages = new Map;
   const combines = [];
   function combineCage(source, target) {
      let cages;
      if (source.cage === target.cage) {  // same cage
         if (combinedCages.has(source.cage)) {
            cages = combinedCages.get(source.cage);
         } else {
            cages = [];
            combines.push( cages );
            cages.push(source.cage);
            combines.set(source.cage, cages);
            combines.set(target.cage, cages);             
         }
      } else {
         if (combinedCages.has(source.cage)) {
            cages = combinedCages.get(source.cage);
            if (!combinedCages.has(target.cage)) {
               combinedCages.set(target.cage, cages);
               cages.push( target.cage );
            }
         } else if (combinedCages.has(target.cage)) {
            cages = combinedCages.get(target.cage);
            combinedCages.set(source.cage, cages);
            cages.push( source.cages );
            loopUse.push();
         } else {
            cages = [];
            combines.push( cages );
            cages.push(source.cage, target.cage);
            combinedCages.set(source.cage, cages);
            combinedCages.set(target.cage, cages);
         }
      }     
      return cages;
   };
   // find edgeLoops
   const loopUsed = [];
   const hEdge2Loop = new Map;
   const edgeLoops = WingedTopology.findContours(overlap.selection);
   // find inner, outer, then combined.
   for (let edgeLoop of edgeLoops) {
      const source = overlap.pair.get(edgeLoop[0].outer);
      const target = overlap.pair.get(source.hEdge)
      if (hEdge2Loop.has(source.hEdge)) { // now check if matching hEdge already saved
         const result = hEdge2Loop.get(source.hEdge);
         if (result.length === edgeLoop.length) {   // move hEdge to match and checked.
            for (let i = 0; i < edgeLoop.length; ++i) {  // could not just loop both because they are in reverse order.
               let inner = overlap.pair.get(edgeLoop[i].outer);  
               if (!overlap.pair.has(inner.hEdge)) {// no matching not possible, bad
                  return false;
               }
               edgeLoop[i].inner = inner.hEdge.pair;
            } // ok, done
            // now combined Cage
            loopUsed.push( {combine: combineCage(source, target), edgeLoop: edgeLoop} );
         } else { // bad match, could be 3+ cage involvement, don't handle it now.
            return false;
         }
      } else { // save all to hEdge2Loop
         for (let i = 0; i < edgeLoop.length; ++i) {
            const outer = edgeLoop[i].outer;
            hEdge2Loop.set(outer, edgeLoop);
         }
      } // also won't handle self weld contours.
   }

   return {combineCages: combines, edgeLoops: loopUsed};
};


PreviewCage.weldableFace = function(target, compare, tolerance) {
   // check number of vertex
   if (target.polygon.numberOfVertex !== compare.polygon.numberOfVertex) {
      return false;
   }
   // check direction
   if (vec3.dot(target.polygon.normal, compare.polygon.normal) > 0) {
      return false;
   }
   // check center distance and radisu
   const toleranceSquare = tolerance * tolerance;
   if (vec3.sqrDist(target.center, compare.center) > toleranceSquare) {
      return false;
   }
   if (Math.abs(target.radius - compare.radius) > tolerance) {
      return false;
   }
   // check all vertex distance
   const reverse2 = []; 
   for (let current2 of compare.polygon.hEdges()) {  // get reverse order
      reverse2.unshift(current2);
   }
   for (let hEdge of target.polygon.hEdges()) {  // find the closest pair first
      for (let i = 0; i < reverse2.length; ++i) {
         let current = hEdge;
         let current2 = reverse2[i];
         let match = [];
         let j = i;
         do {  // iterated through the loop
            if (vec3.sqrDist(current.origin, current2.destination()) > toleranceSquare) {
               match = undefined;
               break;
            }
            match.push( {target: current, source: current2} );
            current = current.next;
            j = (++j)%reverse2.length;
            current2 = reverse2[j];
         } while (current !== hEdge);
         if (match) {
            return match;
         }
      }
   }

   return false;
};

PreviewCage.findOverlapFace = function(order, selection, tolerance) {
   const merged = new Set;
   const retSelection = new Set;
   const pair = new Map;
   for (let i = 0; i < selection.length; ++i) {  // walk through the whole list
      const target = selection[i];
      if (!merged.has(target)) {
         for (let j = i+1; j < selection.length; j++) {// walk till the end, or 
            const compare = selection[j];
            if (compare.isLive() && !merged.has(compare)) {
               if (Math.abs(target.center[order[0]]-compare.center[order[0]]) > tolerance) {  // out of bounds
                  break;
               }
                // weld compare to target if possibled
               const weld = PreviewCage.weldableFace(target, compare, tolerance);  // weldable
               if (weld) {
                  merged.add(compare);
                  merged.add(target);
                  retSelection.add(compare.polygon);
                  retSelection.add(target.polygon);
                  for (let match of weld) {                     
                     pair.set(match.target, {hEdge: match.source, cage: compare.octree.bvh});
                     pair.set(match.source, {hEdge: match.target, cage: target.octree.bvh});
                  }
               }
            }
         }
      }
   }
   return {pair: pair, merged: merged, selection: retSelection};
};

// get the merged sphere, and remove the polygon.
PreviewCage.weldHole = function(merged) {
   const holesOfCages = new Map;
   for (let sphere of merged.merged) { // sort holes to cages.
      let holes = holesOfCages.get(sphere.octree.bvh);
      if (holes === undefined) {
         holes = [];
         holesOfCages.set(sphere.octree.bvh, holes);
      }
      holes.push(sphere);
   }

   // now remove holes from each cages.
   const result = [];
   for (let [cage, holes] of holesOfCages) {
      result.push( [cage, cage.makeHolesFromBB(holes)] );
      cage._updatePreviewAll();
   }
   return result;
};
PreviewCage.undoWeldHole = function(weldHoles) {
   for (let [cage, holes] of weldHoles) {
      for (let restore of holes) {
         cage.geometry.undoHole(restore);
      }
      cage._updatePreviewAll();
   }
};

PreviewCage.weldBody = function(combines, weldContours) {
   const result = [];
   // then weld contour.
   for (let {combine, edgeLoop} of weldContours.edgeLoops) {
      const cage = combines.get(combine);
      cage.combine.geometry.weldContour(edgeLoop);
      cage.combine._updatePreviewAll();
      // compute snapshot
      cage.preview = cage.combine;  // smuglling snapshot. should we rename (combine to preview)?
      if (!cage.snapshot) {
         cage.snapshot = {vertices: new Set};
      }
      for (let edge of edgeLoop) {
         cage.snapshot.vertices.add(edge.outer.origin);
      }
      // weldContour saved restore info
      result.push( [cage.preview, edgeLoop] );
   }
   return result;
};
PreviewCage.undoWeldBody = function(weldContours) {
   for (let [cage, edgeLoop] of weldContours) {
      cage.geometry.restoreContour(edgeLoop);   // liftContour will restore innerLoop for us
      cage._updatePreviewAll();
   }
};


/**
 * undo closeCrack. restore to original position.
 * 
 */
PreviewCage.prototype.undoCloseCrack = function(undo) {
   // first release newMesh
   this.makeHolesFromBB(undo.mesh);

   // restore borderPolygon
   for (let restore of undo.borderPolygon) {
      this.geometry.undoHole(restore);
   }
   this._updatePreviewAll();
};

/**
 * get all selected boundary edges and repolygon the boundary edge
 */
PreviewCage.prototype.closeCrack = function() {
   const snapshot = this._resetSelectEdge();
   let vertices = new Set;
   // min, max? and sort the maximum direction?
   // check all selected edge is boundary edge then try to stitch.
   for (let wEdge of snapshot.wingedEdges) {
      vertices.add(wEdge.left.origin);
      vertices.add(wEdge.right.origin);
   }
   // sort
   vertices = Array.from(vertices).sort(function(x,y) {
      for (let i = 0; i < 3; ++i) { // todo: sort by major axis first
         if (x[i] < y[i] ) {
            return -1;
         } else if (x[i] > y[i]) {
            return 1;
         }
      }
      return 0;// must be equal.
    });

   const merged = new Map;
   const remap = [];
   // merge and catalog vertices
   let target;
   while (target = vertices.pop()) {
      const targetRemap = {pt: [target[0], target[1], target[2]], count: 1, vert: target};
      remap.push( targetRemap );
      merged.set(target, targetRemap);
      for (let i = vertices.length-1; i >= 0; --i) {
         const a = vertices[i];
         const result = Vertex.isOverlap(a, target)
         if (result > 0) {
            merged.set(a, targetRemap);
            vec3.add(targetRemap.pt, targetRemap.pt, a); // prepare to average it
            targetRemap.count++;
            vertices.splice(i, 1);
         } else if (result < 0) {
            break;
         }
      }
   }

   // get borderPoly from weld vertices.
   let borderPoly = new Set;
   for (let [vertex, remap] of merged) {
      if (remap.count > 1) {
         for (let hEdge of vertex.edgeRing()) {
            if (hEdge.face) {
               borderPoly.add( hEdge.face );
            }
         }
      }
   }

   const newMesh = [];
   // get the new vertices Index for all the border polygon
   for (let polygon of borderPoly) {
      let index = [];
      for (let outEdge of polygon.hEdges()) {
         let target = merged.get(outEdge.origin);
         if (target) {
            index.push( target.vert.index );  // remap back 
         } else {
            index.push( outEdge.origin.index );
         }
      }
      newMesh.push( index );
   }
   
   const undo = {mesh: []};
   // remove all border polygon. restore from last to first.
   undo.borderPolygon = this.makeHolesFromBB(borderPoly).reverse();

   // adjust vertices and readd vertices if deleted
   for (let i = 0; i < remap.length; ++i) {
      const target = remap[i];
      vec3.scale(target.pt, target.pt, 1/target.count);
      if (!target.vert.isLive()) {
         this.geometry.addVertex(target.pt, target.vert);
      }
   }
   // now readd all border polygon with merged vertices
   for (let poly of newMesh) {
      let face = this.geometry.addPolygon(poly);
      if (face) { // how do we handle failure?
         undo.mesh.push( face );
      }
   }

   this._updatePreviewAll();
   return undo;
};
/*PreviewCage.prototype.closeCrack = function() {
   function getFreeInEdgeAll(vertex) {   // remove boundary that already overlap self.
      const group = vertex.findFreeInEdgeAll();
      const ret = [];
      for (const inEdge of group) {   // check inEdge not overlap with outEdge
         const outEdge = inEdge.next;
         if (Vertex.isOverlap(inEdge.origin, outEdge.destination()) <= 0) {
            ret.push(inEdge);
         }
      }
      // split into free edge group.
      if (ret.length > 1) {
         const firstOut = ret[0].next;
         for (let i = 0; i < ret.length; ++i) {
            let j = (i+1)%ret.length;
            if (j===0) {
               ret[i].next = firstOut;
            } else {
               ret[i].next = ret[j].next;
            }
         }
      }
      return ret;
   };
   function restoreFreeEdgeAll(group) {
      let target;
      while (target = group.pop()) {
         if (group.length > 0) {
            let out = group[group.length-1].next;
            group[group.length-1].next = target.next;
            target.next = out;
         }
      }
   };

   const snapshot = this._resetSelectEdge();
   let vertices = new Set;
   // min, max? and sort the maximum direction?
   // check all selected edge is boundary edge then try to stitch.
   for (let wEdge of snapshot.wingedEdges) {
      if (wEdge.left.isBoundary() || wEdge.right.isBoundary()) {  // make sure it boundary
         vertices.add(wEdge.left.origin);
         vertices.add(wEdge.right.origin);
      }
   }
   // sort
   vertices = Array.from(vertices).sort(function(x,y) {
      for (let i = 0; i < 3; ++i) { // todo: sort by major axis first
         if (x[i] < y[i] ) {
            return -1;
         } else if (x[i] > y[i]) {
            return 1;
         }
      }
      return 0;// must be equal.
    });
   // prune and stitch
   let target;
   let merge = [];
   while (target = vertices.pop()) {
      // walk from back
      let bGroup = getFreeInEdgeAll(target); // split to free Edge group
      for (let i = vertices.length-1; i >= 0; --i) {
         let a = vertices[i];
         let result = Vertex.isOverlap(a, target);
         if (result !== 0) {
            if (result > 0) {
               let aGroup = getFreeInEdgeAll(a);   // split to free edge group.
               if (aGroup.length > 0 && bGroup.length > 0) {
                  let undo = this.geometry.stitchVertex(aGroup, bGroup);
                  if (undo) {
                     merge.push( undo  );
                  }
               }
               // restore aGroup's connection.
               if (aGroup.length>0){
                  restoreFreeEdgeAll(aGroup);
                  a.reorient();
               } else {
                  vertices.splice(i, 1);
               }
               continue;   // try if anymore vertices to merge for target.
            }
            // nay, looking for new vertices and restore vertex connection
            restoreFreeEdgeAll(bGroup);
            target.reorient();
            break;
         }
      }
      // restore current bGroup connection.
   }   
   //this._updatePreviewAll();
   // now collapse loop.
   let count = 0;
   for (let wEdge of snapshot.wingedEdges) {
      if (wEdge.isLive()) {
         if (wEdge.left.isBoundary()) {
            if (wEdge.left.next.next === wEdge.left) {
               this.geometry._collapseLoop(wEdge.left);
               count++;
            }
         } else if (wEdge.right.isBoundary()) {
            if (wEdge.right.next.next === wEdge.right) {
               this.geometry._collapseLoop(wEdge.right);
               count++;
            }
         }
      }
   }
   this._updatePreviewAll();
   return snapshot;
};*/


//----------------------------------------------------------------------------------------------------------



class CreatePreviewCageCommand extends EditCommand {
   constructor(previewCage) {
      super();
      this.previewCage = previewCage;
   }

   free() {
      this.previewCage.freeBuffer();
   }

   doIt() {
      // check if we have been undone?
      if (this.undoEmpty) {  // now copy all data back to cage
         this.previewCage.emptyUndo(this.undoEmpty);
         this.undoEmpty = null;    // release undo data
      }
      View.addToWorld(this.previewCage);
   }

   undo() {
      View.removeFromWorld(this.previewCage);
      // copy data to undo and free previewCage data.
      this.undoEmpty = this.previewCage.empty();  //freeBuffer();
   }
}


export {
   PreviewCage,
   CreatePreviewCageCommand,
   PreviewGroup,
}