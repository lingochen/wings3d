/*
*  hold onto a WingedEdgeTopology. adds index, texture, etc....
*  bounding box, picking.
* 
*  previewCage. Internal representation rewrote many times.
*  Finally decided to trade space for ease of implementation and 
#  no worst case non linear runtimes.
* 
*/
"use strict";
import {gl, ShaderData} from './wings3d_gl'; 
import {BoundingSphere} from './wings3d_boundingvolume';
import {WingedTopology} from './wings3d_wingededge';
import * as View from './wings3d_view';
import * as Wings3D from './wings3d';
import {EditCommand} from './wings3d_undo';
import {DraftBench} from './wings3d_draftbench';


const PreviewCage = function(bench) {
   this.geometry = new WingedTopology(bench.allocMesh);
   this.bench = bench;

   // selecte(Vertex,Edge,Face)here
   this.selectedSet = new Set;
   this.groupSelection = false;
   // default no name
   this.name = "";
};


// act as destructor
PreviewCage.prototype.freeBuffer = function() {
   this.geometry.free();
};


PreviewCage.duplicate = function(originalCage) {
   // copy geometry.
   const indexMap = new Map;
   const previewCage = new PreviewCage(originalCage.bench);
   const geometry = previewCage.geometry;
   for (let vertex of originalCage.geometry.vertices) {
      const copy = geometry.addVertex(vertex.vertex);
      indexMap.set(vertex.index, copy.index);
   }
   for (let polygon of originalCage.geometry.faces) {
      let index = [];
      polygon.eachVertex( function(vertex) {
         index.push( indexMap.get(vertex.index) );
      });
      geometry.addPolygon(index);
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
}


PreviewCage.prototype.hide = function() {
   this.bench.hide(this.geometry.faces);
};

PreviewCage.prototype.show = function() {
   this.bench.show(this.geometry.faces);
};


PreviewCage.prototype._getGeometrySize = function() {
   return { face: this.geometry.faces.size,
            edge: this.geometry.edges.size,
            vertex: this.geometry.vertices.size
          };
};


PreviewCage.prototype._updatePreviewAll = function() {
   this.bench.updatePreview();
};


// todo: octree optimization.
PreviewCage.prototype.rayPick = function(ray) {
   var that = this;
   // return the closest face (triangle) that intersect ray.
   var intersect = {polygon: [], pt: []};
   var hitSphere = [];
   for (let polygon of this.geometry.faces) {
      const sphere = this.bench.boundingSpheres[polygon.index];
      if (sphere.isIntersect(ray)){
         hitSphere.push( sphere );
      }
   }
   // check for triangle intersection, select the hit Face, hit Edge(closest), and hit Vertex (closest).
   var hitEdge = null;
   var center;
   var hitT = 10000000;   // z_far is the furthest possible intersection
   for (let i = 0; i < hitSphere.length; ++i) {
      // walk the face, build a triangle on centroid + edge's 2 point. check for intersection
      var sphere = hitSphere[i];
      sphere.polygon.eachEdge( function(edge) {
         // now check the triangle is ok?
         var t = that.intersectTriangle(ray, [sphere.center, edge.origin.vertex, edge.destination().vertex]);
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


// body selection.
PreviewCage.prototype.changeFromBodyToFaceSelect = function() {
   // do nothing, already selected or deselected.
};

PreviewCage.prototype.changeFromBodyToEdgeSelect = function() {
   if (this.hasSelection()) {
      this._resetBody();
      this.groupSelection = true;
      // select all edge
      for (let wingedEdge of this.geometry.edges) {
         this.selectedSet.add(wingedEdge);
         this.setEdgeColor(wingedEdge, 0.25);
      }
      // update previewLine
      this.groupSelection = false;
      this.bench.uploadEdgePreview();
   }
};

PreviewCage.prototype.changeFromBodyToVertexSelect = function() {
   if (this.hasSelection()) {
      this._resetBody();
      this.groupSelection = true;
      // select all vertex
      for (let vertex of this.geometry.vertices) {
         this.selectedSet.add(vertex);
         this.setVertexColor(vertex, 0.25);
      }
      // update previewVertex
      this.groupSelection = false;
      this.bench.uploadVertexPreview();
   }
};

PreviewCage.prototype.restoreFaceSelection = function(snapshot) {
   for (let polygon of snapshot.selectedFaces) {
      this.selectFace(polygon.halfEdge);
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
      this._resetBody();
      this.restoreFaceSelection(snapshot);
   } else {
      this.changeFromBodyToFaceSelect();
   }
};

PreviewCage.prototype.restoreFromBodyToEdgeSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetBody();
      this.restoreEdgeSelection(snapshot);
   } else {
      this.changeFromBodyToEdgeSelect();  // choose compute over storage, use the same code as going forward.
   }
};

PreviewCage.prototype.restoreFromBodyToVertexSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetBody();
      // and selected using the snapshots.
      this.restoreVertexSelection(snapshot);
   } else {
      this.changeFromBodyToVertexSelect();  // compute vs storage. currently lean toward compute.
   }
};

PreviewCage.prototype._resetBody = function() {
   const oldSet = this.selectedSet;
   this.selectedSet = new Set();
   this.bench.resetBody(oldSet);
   return oldSet;
};

PreviewCage.prototype._selectBodyLess = function() {
   const snapshot = new Set(this.selectedSet);
   if (this.hasSelection()) {
      this.selectBody();
   }
   return snapshot;
}

PreviewCage.prototype._selectBodyAll = function() {
   const snapshot = new Set(this.selectedSet);
   if (!this.hasSelection()) {
      this.selectBody();
   }
   return snapshot;
}

PreviewCage.prototype._selectBodyInvert = function() {
   const snapshot = new Set(this.selectedSet);
   this.selectBody();
   return snapshot;
}

PreviewCage.prototype.selectBody = function() {
   let faceColor;
   // we change interior color to show the selection
   if (this.hasSelection()) {
      this.bench.selectGroup(this.selectedSet, false);
      this.selectedSet = new Set;
         //faceColor = [0.0, 1.0, 0.0];   // hilite and unselected         
         //faceColor = [0.5, 0.5, 0.5];   // unselected
   } else {
      this.selectedSet = new Set(this.geometry.faces);
      this.bench.selectGroup(this.selectedSet, true);
         //faceColor = [1.0, 1.0, 0.0];   // selected and hilite
         //faceColor = [1.0, 0.0, 0.0];   // selected.
      geometryStatus("Object " + this.name + " has " + this.geometry.faces.size + " polygons");
   }
   return this.hasSelection();
};

PreviewCage.prototype.hiliteBody = function(hilite) {
   this.bench.hiliteBody(this.geometry.faces, hilite); 
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

PreviewCage.prototype.setVertexColor = function(vertex, color) {
   // selected color
   this.bench.setVertexColor(vertex, color, this.groupSelection);
};

PreviewCage.prototype.hiliteVertex = function(vertex, show) {
   // select polygon set color,
   var color;
   if (show) {
      color = 0.5;
   } else {
      color = -0.5;
   }
   this.setVertexColor(vertex, color);
};

PreviewCage.prototype.dragSelectVertex = function(vertex, onOff) {
   var color;
   if (this.selectedSet.has(vertex)) {
      if (onOff === false) {
         this.selectedSet.delete(vertex);
         this.setVertexColor(vertex, -0.25);
         return true;
      }
   } else {
      if (onOff === true) {
         this.selectedSet.add(vertex);
         this.setVertexColor(vertex, 0.25);
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
      color = -0.25;
      onOff = false;
   } else {
      this.selectedSet.add(vertex);
      color = 0.25;
      onOff = true;
      geometryStatus("select vertex: " + vertex.index);
   }
   // selected color
   this.setVertexColor(vertex, color);
   return onOff;
};


PreviewCage.prototype._resetSelectVertex = function() {
   var oldSelected = this.selectedSet;
   this.selectedSet = new Set;
   // zeroout the edge seleciton.
   this.bench.resetSelectVertex();
   return oldSelected;
};

PreviewCage.prototype._selectVertexMore = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   const self = this;
   for (let vertex of oldSelection) {
      vertex.eachInEdge( function(inEdge) {
         if (!self.selectedSet.has(inEdge.origin)) {
            self.selectVertex(inEdge.origin);
         }
      });
   }

   return oldSelection;
};

PreviewCage.prototype._selectVertexLess = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   for (let vertex of oldSelection) {
      for (let ringV of vertex.oneRing()) {
         if (!oldSelection.has(ringV)) {
            this.selectVertex(vertex);
            break;
         }
      }
   }

   return oldSelection;
};

PreviewCage.prototype._selectVertexAll = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   for (let vertex of this.geometry.vertices) {
      if (vertex.isLive() && !oldSelection.has(vertex)) {
         this.selectVertex(vertex);
      }
   }

   return oldSelection;
};

PreviewCage.prototype._selectVertexInvert = function() {
   const snapshot = new Set(this.selectedSet);

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
   const snapshot = new Set(this.selectedSet);
   const similarVertex = new SimilarVertex(snapshot);

   for (let vertex of this.geometry.vertices) {
      if (vertex.isLive() && !snapshot.has(vertex) && similarVertex.find(vertex)) {
         this.selectVertex(vertex);
      }
   }

   return snapshot;
};

PreviewCage.prototype.changeFromVertexToFaceSelect = function() {
   var self = this;
   var oldSelected = this._resetSelectVertex();
   //
   for (let vertex of oldSelected) { 
      // select all face that is connected to the vertex.
      vertex.eachOutEdge(function(edge) {
         if (!self.selectedSet.has(edge.face)) {
            self.selectFace(edge);
         }
      });
   }
};

PreviewCage.prototype.changeFromVertexToEdgeSelect = function() {
   var self = this;
   var oldSelected = this._resetSelectVertex();
   //
   for (let vertex of oldSelected) { 
      // select all edge that is connected to the vertex.
      vertex.eachOutEdge(function(edge) {
         if (!self.selectedSet.has(edge.wingedEdge)) {
            self.selectEdge(edge);
         }
      });
   }
};

PreviewCage.prototype.changeFromVertexToBodySelect = function() {
   if (this.hasSelection()) {
      // select whole body,
      this._resetSelectVertex();
      this.selectBody();
   }
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


PreviewCage.prototype.setEdgeColor = function(wingedEdge, color) {
   // selected color
   this.bench.setEdgeColor(wingedEdge, color, this.groupSelection);
};

PreviewCage.prototype.hiliteEdge = function(selectEdge, show) {
   // select polygon set color,
   var color;
   var wingedEdge = selectEdge.wingedEdge;
   if (show) {
      color = 0.5;
   } else {
      color = -0.5;
   }
   this.setEdgeColor(wingedEdge, color);
};

PreviewCage.prototype.dragSelectEdge = function(selectEdge, dragOn) {
   var wingedEdge = selectEdge.wingedEdge;

   if (this.selectedSet.has(wingedEdge)) { 
      if (dragOn === false) { // turn from on to off
         this.selectedSet.delete(wingedEdge);
         this.setEdgeColor(wingedEdge, -0.25);
         return true;   // new off selection
      }
   } else {
      if (dragOn === true) {   // turn from off to on.
         this.selectedSet.add(wingedEdge);
         this.setEdgeColor(wingedEdge, 0.25);
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
   var color;
   if (this.selectedSet.has(wingedEdge)) {
      this.selectedSet.delete(wingedEdge);
      color = -0.25;
      onOff = false;
   } else {
      this.selectedSet.add(wingedEdge);
      color = 0.25;
      onOff = true;
      geometryStatus("select edge: " + wingedEdge.index);
   }
   // selected color
   this.setEdgeColor(wingedEdge, color);
   return onOff;
};

PreviewCage.prototype.computeSnapshot = function(snapshot) {
   // update all affected polygon(use sphere). copy and recompute vertex.
   for (let polygon of snapshot.faces) {
      const sphere = this.bench.boundingSpheres[polygon.index];
      // recompute sphere center. and normal
      polygon.computeNormal();
      sphere.setSphere( BoundingSphere.computeSphere(polygon, sphere.center) );
   }
   this.bench.updateCentroid();
   // update edges vertices.
   this.bench.updateWEdges(snapshot.wingedEdges);
};


PreviewCage.prototype.restoreMoveSelection = function(snapshot) {
   // restore to the snapshot position.
   let i = 0;
   for (let vertex of snapshot.vertices) {
      vec3.copy(vertex.vertex, snapshot.position.subarray(i, i+3));
      i += 3;
   }
   this.bench.updatePosition();
   this.computeSnapshot(snapshot);
};

PreviewCage.prototype.moveSelectionNew = function(snapshot, movement) {
   this.moveSelection(movement, snapshot);
}
// 3-15 - add limit to movement.
PreviewCage.prototype.moveSelection = function(movement, snapshot) {
   // first move geometry's position
   if (snapshot.direction) {
      let i = 0; 
      for (let vertex of snapshot.vertices) {
         vec3.scaleAndAdd(vertex.vertex, vertex.vertex, snapshot.direction.subarray(i, i+3), movement);  // movement is magnitude
         i+=3;
      }
   } else {
      for (let vertex of snapshot.vertices) {
         vec3.add(vertex.vertex, vertex.vertex, movement);
      }
   }
   this.bench.updatePosition();
   this.computeSnapshot(snapshot);
};

//
// rotate selection, with a center
//
PreviewCage.prototype.rotateSelection = function(snapshot, quatRotate) {
   const translate = vec3.create();
   const scale = vec3.fromValues(1, 1, 1);
   this.transformSelection(snapshot, (transform, origin) => {
      mat4.fromRotationTranslationScaleOrigin(transform, quatRotate, translate, scale, origin);   
    });
};

//
// scale selection, by moving vertices
//
PreviewCage.prototype.scaleSelection = function(snapshot, scale) {
   const scaleV = vec3.fromValues(scale, scale, scale);
   this.transformSelection(snapshot, (transform, origin) => {
      mat4.fromScaling(transform, scaleV);   
    });
};

//
// transform selection,
//
PreviewCage.prototype.transformSelection = function(snapshot, transformFn) {
   // construct the matrix
   const transform = mat4.create();

   const vArry = snapshot.vertices[Symbol.iterator]();
   for (let group of snapshot.matrixGroup) {
      //mat4.fromRotationTranslationScaleOrigin(transform, quatRotation, translate, scale, group.center); // origin should not be modified by scale, glmatrix seems to get the order wrong.
      transformFn(transform, group.center);
      for (let index = 0; index < group.count; index++) {
         const vertex = vArry.next().value;
         vec3.transformMat4(vertex.vertex, vertex.vertex, transform);
      }
   }

   this.bench.updatePosition();
   this.computeSnapshot(snapshot);
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
   ret.position = new Float32Array(ret.vertices.size*3);
   // use the vertex to collect the affected polygon and the affected edge.
   let i = 0;
   for (let vertex of ret.vertices) {
      vertex.eachOutEdge(function(edge) {
         if (edge.isNotBoundary() && !ret.faces.has(edge.face)) {
            ret.faces.add(edge.face);
         }
         if (!ret.wingedEdges.has(edge.wingedEdge)) {
            ret.wingedEdges.add(edge.wingedEdge);
         }
      });
      // save position data
      ret.position.set(vertex.vertex, i);
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
      polygon.eachVertex( function(vertex) {
         if (!vertices.has(vertex)) {
            vertices.add(vertex);
         }
      });
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
   // first collect all the vertex
   for (let polygon of this.selectedSet) {
      polygon.eachVertex( function(vertex) {
         if (!vertices.has(vertex)) {
            vertices.add(vertex);
            const normal = [polygon.normal[0], polygon.normal[1], polygon.normal[2]];
            normalMap.set(vertex, normal);
         } else {
            const normal = normalMap.get(vertex);
            if (vec3.dot(normal, polygon.normal) < 0.98) {  // check for nearly same normal, or only added if hard edge?
               vec3.add(normal, normal, polygon.normal);
            } 
         }
      });
   }
   // copy normal;
   const normalArray = new Float32Array(vertices.size*3);
   let i = 0;
   for (let [_vert, normal] of normalMap) {
      let inputNormal = normalArray.subarray(i, i+3);
      vec3.copy(inputNormal, normal);
      i+=3;
   }
   return this.snapshotPosition(vertices, normalArray);
};

PreviewCage.prototype.snapshotVertexPositionAndNormal = function() {
   const vertices = new Set(this.selectedSet);
   const array = new Float32Array(vertices.size*3);
   array.fill(0.0);
   // copy normal
   let i = 0;
   for (let vertex of vertices) {
      let normal = array.subarray(i, i+3);
      vertex.eachOutEdge( function(outEdge) {
         if (outEdge.isNotBoundary()) {
            vec3.add(normal, normal, outEdge.face.normal);
         }
      });
      vec3.normalize(normal, normal);        // finally, we can safely normalized?
      i +=3;
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
   normalArray.fill(0.0);
   let i = 0;
   for (let [_vert, normal] of normalMap) {
      let inputNormal = normalArray.subarray(i, i+3);
      for (let poly of normal) {
         vec3.add(inputNormal, inputNormal, poly.normal);
      }
      i+=3;
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
               vec3.add(center, center, vertex.vertex);
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
   let faceGroup = this.geometry.findFaceGroup(this.selectedSet);
   // compute center of loop, gather all the vertices, create the scaling matrix
   for (let group of faceGroup) {
      let count = 0;
      const center = vec3.create();
      for (let face of group) {
         face.eachVertex(function(vertex) {
            if (!vertices.has(vertex)){
               vertices.add(vertex);
               count++;
               vec3.add(center, center, vertex.vertex);
            }
          });
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
            vec3.add(center, center, vertex.vertex);
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
         vec3.add(center, center, vertex.vertex);
      }
      vec3.scale(center, center, 1.0/vertices.size);
   }

   const ret = this.snapshotPosition(vertices);
   ret.matrixGroup = [{center: center, count: vertices.size}];
   return ret;
};


PreviewCage.prototype._resetSelectEdge = function() {
   const oldSelected = this.selectedSet;
   this.selectedSet = new Set;
   this.bench.resetSelectEdge();
   return oldSelected;
};

PreviewCage.prototype._selectEdgeMore = function() {
   const oldSelection = new Set(this.selectedSet);

   const self = this;
   for (let wingedEdge of oldSelection) {
      for (let halfEdge of wingedEdge) {
         halfEdge.eachEdge( function(edge) {
            if (!self.selectedSet.has(edge.wingedEdge)) {
               self.selectEdge(edge);
            }
         });
      }
   }

   return oldSelection;
};

PreviewCage.prototype._selectEdgeLess = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   const self = this;
   for (let selectedWinged of oldSelection) {
      for (let wingedEdge of selectedWinged.oneRing()) {
         if (!oldSelection.has(wingedEdge)) {
            this.selectEdge(selectedWinged.left);
            break;
         }
      }
   }

   return oldSelection;
}

PreviewCage.prototype._selectEdgeAll = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   for (let wingedEdge of this.geometry.edges) {
      if (wingedEdge.isLive() && !oldSelection.has(wingedEdge)) {
         this.selectEdge(wingedEdge.left);
      }
   }

   return oldSelection;
}

PreviewCage.prototype._selectEdgeInvert = function() {
   const snapshot = new Set(this.selectedSet);

   for (let wingedEdge of this.geometry.edges) {
      if (wingedEdge.isLive()) {
         this.selectEdge(wingedEdge.left);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectEdgeAdjacent = function() {
   const oldSelection = new Set(this.selectedSet);

   for (let wingedEdge of oldSelection) {
      for (let adjacent of wingedEdge.adjacent()) {
         if (!this.selectedSet.has(adjacent)) {
            this.selectEdge(adjacent.left);
         }
      }
   }

   return oldSelection;
};


PreviewCage.prototype._selectEdgeSimilar = function() {
   const snapshot = new Set(this.selectedSet);
   const similarEdge = new SimilarWingedEdge(snapshot);

   for (let wingedEdge of this.geometry.edges) {
      if (wingedEdge.isLive && !snapshot.has(wingedEdge) && similarEdge.find(wingedEdge)) {
         this.selectEdge(wingedEdge.left);
      }
   }

   return snapshot;
};


PreviewCage.prototype.changeFromEdgeToFaceSelect = function() {
   const oldSelected = this._resetSelectEdge();
   //
   for (let wingedEdge of oldSelected) {
      // for each WingedEdge, select both it face.
      for (let halfEdge of wingedEdge) {
         if (!this.selectedSet.has(halfEdge.face)) {
            this.selectFace(halfEdge);
         }
      }
   }
};

PreviewCage.prototype.changeFromEdgeToVertexSelect = function() {
   const oldSelected = this._resetSelectEdge();
   //
   for (let wingedEdge of oldSelected) {
      // for each WingedEdge, select both it face.
      for (let halfEdge of wingedEdge) {
         if (!this.selectedSet.has(halfEdge.origin)) {
            this.selectVertex(halfEdge.origin);
         }
      }
   } 
};

PreviewCage.prototype.changeFromEdgeToBodySelect = function() {
   if (this.hasSelection()) {
      this._resetSelectEdge();
      this.selectBody();
   }
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

PreviewCage.prototype.setFaceSelectionOff = function(polygon) {
   this.bench.setFaceSelectionOff(polygon, this.selectedSet);
   this.selectedSet.delete(polygon);
};
PreviewCage.prototype.setFaceSelectionOn = function(polygon) {
   this.bench.setFaceSelectionOn(polygon);
   this.selectedSet.add(polygon);
};

PreviewCage.prototype.dragSelectFace = function(selectEdge, onOff) {
   // select polygon set color,
   var polygon = selectEdge.face;
   if (this.selectedSet.has(polygon)) {
      if (onOff === false) {
         this.setFaceSelectionOff(polygon);
         return true;
      }
   } else {
      if (onOff === true) {
         this.setFaceSelectionOn(polygon);
         return true;
      }
   }
   geometryStatus("polygon face # " + polygon.index);
   return false;
};

/**
 * 
 */
PreviewCage.prototype.selectFace = function(selectEdge) {
   var onOff;
   var polygon = selectEdge.face;
   if (this.selectedSet.has(polygon)) {
      this.setFaceSelectionOff(polygon);
      Wings3D.log("faceSelectOff", polygon.index);
      onOff = false;
   } else {
      this.setFaceSelectionOn(polygon);
      Wings3D.log("faceSelectOn", polygon.index);
      onOff = true;
   }
   geometryStatus("polygon face # " + polygon.index);
   return onOff;
};


PreviewCage.prototype._resetSelectFace = function() {
   var oldSelected = this.selectedSet;
   this.selectedSet = new Set;
   this.bench.resetSelectFace();
   return oldSelected;
}

PreviewCage.prototype._selectFaceMore = function() {
   const oldSelected = this.selectedSet;
   this.selectedSet = new Set(oldSelected);
   // seleceted selectedFace's vertex's all faces.
   for (let polygon of oldSelected) {
      for (let face of polygon.oneRing()) {
         // check if face is not selected.
         if ( (face !== null) && !this.selectedSet.has(face) ) {
            this.selectFace(face.halfEdge);
         }
      }
   }

   return oldSelected;
};

PreviewCage.prototype._selectFaceLess = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   for (let selected of oldSelection) {
      for (let polygon of selected.adjacent()) {
         if (!oldSelection.has(polygon)) {      // selected is a boundary polygon
            this.selectFace(selected.halfEdge); // now removed.
            break;
         }
      }
   }

   return oldSelection;
};

PreviewCage.prototype._selectFaceAll = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   for (let polygon of this.geometry.faces) {
      if (polygon.isLive && !oldSelection.has(polygon)) {
         this.selectFace(polygon.halfEdge);
      }
   }

   return oldSelection;
};

PreviewCage.prototype._selectFaceInvert = function() {
   const snapshot = new Set(this.selectedSet);

   for (let polygon of this.geometry.faces) {
      if (polygon.isLive()) {
         this.selectFace(polygon.halfEdge);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectFaceAdjacent = function() {
   const snapshot = new Set(this.selectedSet);

   // seleceted selectedFace's vertex's all faces.
   for (let polygon of snapshot) {
      for (let face of polygon.adjacent()) {
         // check if face is not selected.
         if ( (face !== null) && !this.selectedSet.has(face) ) {
            this.selectFace(face.halfEdge);
         }
      }
   }
   
   return snapshot;
};

PreviewCage.prototype._selectFaceSimilar = function() {
   const snapshot = new Set(this.selectedSet);
   const similarFace = new SimilarFace(snapshot);

   for (let polygon of this.geometry.faces) {
      if (polygon.isLive && !snapshot.has(polygon) && similarFace.find(polygon)) {
         this.selectFace(polygon.halfEdge);
      }
   }

   return snapshot;
};


PreviewCage.prototype.changeFromFaceToEdgeSelect = function() {
   var self = this;
   var oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected) {
      // for eachFace, selected all it edge.
      polygon.eachEdge(function(edge) {
         if (!self.selectedSet.has(edge.wingedEdge)) {
            self.selectEdge(edge);
         }
      });
   }
};

PreviewCage.prototype.changeFromFaceToVertexSelect = function() {
   var self = this
   var oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected) {
      // for eachFace, selected all it vertex.
      polygon.eachVertex(function(vertex) {
         if (!self.selectedSet.has(vertex)) {
            self.selectVertex(vertex);
         }
      });
   }
};

PreviewCage.prototype.changeFromFaceToBodySelect = function() {
   if (this.hasSelection()) {
      this._resetSelectFace();
      this.selectBody();
   }
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
PreviewCage.prototype.extrudeEdge = function(creaseFlag = false) {
   const oldSize = this._getGeometrySize();

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
   const pt = vec3.create();
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
                     vec3.lerp(pt, current.origin.vertex, current.destination().vertex, 0.2);
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
                     vec3.lerp(pt, start.origin.vertex, start.destination().vertex, 0.8);
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
      vec3.lerp(pt, end.origin.vertex, pt, 0.2);
      const destVert = this.geometry.addVertex(pt);
      end = this.geometry._liftDanglingEdge(end.prev(), destVert);
      liftEdges.push(end.pair);
      fence.end = end;
   }
   for (let fence of adjustStart) {
      let start = fence.start;
      start.face.getCentroid(pt);
      vec3.lerp(pt, start.destination().vertex, pt, 0.2);
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
                  vec3.lerp(pt, currentOut.origin.vertex, currentOut.destination().vertex, 0.5);
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
            vec3.lerp(pt, hIn.destination().vertex, hIn.origin.vertex, 0.2);
            let newOut = this.geometry.splitEdge(hIn.pair, pt);
            hIn = newOut.pair;
            liftEdges.push( hIn );
            let connect = this.geometry.insertEdge(newOut, hOut.pair);
            collapsibleWings.add(connect.wingedEdge);
         }
         hOut = hIn.pair;  // move to current
      } while (true);   // walk until we hit the other pair
   }
   
   this._updatePreviewAll(oldSize, this.geometry.affected);

   return {collapsibleWings: collapsibleWings, liftEdges: liftEdges};
};
PreviewCage.prototype.undoExtrudeEdge = function(extrude) {
   const oldSize = this._getGeometrySize();

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
 
   this._updatePreviewAll(oldSize, this.geometry.affected);
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
         vec3.lerp(pt, hEdge.origin.vertex, hEdge.destination().vertex, 0.25);
         let newOut = this.geometry.splitEdge(hEdge, pt);   // pt is the split point.
         splitEdges.push( newOut );
         hEdge = newOut.pair.next;                          // move to next
         // connect vertex
         if (prevHalf) {
            let outConnect = this.geometry.insertEdge(prevHalf, newOut.next);
            extrudeLoops.push( outConnect );
            prevHalf = outConnect.next.pair;
         } else {
            firstHalf = newOut;   // remember to save the first one
            prevHalf = newOut.next.pair;
         }
      } while (hEdge !== firstHalf);   // firstHalf is the new vertex.outEdge;
      // connect last to first loop.
      let outConnect = this.geometry.insertEdge(prevHalf, firstHalf.next);
      extrudeLoops.push( outConnect );
   }

   this._updatePreviewAll(oldSize, this.geometry.affected);

   return {insertEdges: extrudeLoops, splitEdges: splitEdges};
};
PreviewCage.prototype.undoExtrudeVertex = function(extrude) {
   const oldSize = this._getGeometrySize();

   for (let hEdge of extrude.insertEdges) {
      this.geometry.removeEdge(hEdge.pair);
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
      contours.edgeLoops = this.geometry.findContours(this.selectedSet); 
   }
   contours.edgeLoops = this.geometry.liftContours(contours.edgeLoops);
   contours.extrudeEdges = this.geometry.extrudeContours(contours.edgeLoops);
   //const edgeLoops = this.geometry.extrudePolygon(this.selectedSet);
   // add the new Faces. and new vertices to the preview
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // reselect face
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected) {
      this.selectFace(polygon.halfEdge);
   }

   return contours; //edgeLoops;
};


// collapse list of edges
PreviewCage.prototype.collapseExtrudeEdge = function(edges) {
   const affectedPolygon = new Set;
   const oldSize = this._getGeometrySize();
   for (let edge of edges) {
      edge.origin.eachOutEdge( function(edge) {
         affectedPolygon.add(edge.face);
      });
      this.geometry.collapseEdge(edge);
   }
   // recompute the smaller size
   this._updatePreviewAll(oldSize,  this.geometry.affected);
   // reselect face
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected) {
      this.selectFace(polygon.halfEdge);
   }

   // update all affected polygon(use sphere). recompute centroid.
   for (let polygon of affectedPolygon) {
      if (polygon.isLive()) {
         const sphere = this.bench.boundingSpheres[polygon.index];
         // recompute sphere center.
         sphere.setSphere( BoundingSphere.computeSphere(polygon, sphere.center) );
      }
   }
   // done, update shader data, should we update each vertex individually?
   this.bench.updateCentroid();
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
      dissolveEdges.add(connectOut.pair); // make sure it gone.
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
                  vec3.lerp(pt, current.origin.vertex, current.destination().vertex, 0.5);
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
      vec3.sub(diff, edge.origin.vertex, edge.destination().vertex); // todo: we could use vec3.lerp?
      for (let i = 1; i < numberOfSegments; ++i) {
         const scaler = (numberOfSegments-i)/numberOfSegments;
         vec3.scale(vertex, diff, scaler);                  
         vec3.add(vertex, edge.destination().vertex, vertex);
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
PreviewCage.prototype.dissolveConnect = function(insertEdges) {
   const oldSize = this._getGeometrySize();

   // dissolve in reverse direction
   for (let i = insertEdges.length-1; i >= 0; --i) {
      const halfEdge = insertEdges[i];
      this.geometry.removeEdge(halfEdge.pair);
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
      dissolve.undo();
      this.selectEdge(dissolve.halfEdge);
   }
   this._updatePreviewAll(oldSize, this.geometry.affected);
};


PreviewCage.prototype.collapseSelectedEdge = function() {
   const restoreVertex = [];
   const collapseEdges = [];
   const oldSize = this._getGeometrySize();
   const selected = new Map();
   for (let edge of this.selectedSet) {
      let undo = null;
      if (edge.isLive()){
      let vertex = edge.left.origin;
      let pt;
      if (selected.has(vertex)) {
         pt = selected.get(vertex);    
         selected.delete(vertex);   // going to be freed, so we can safely remove it.
         vec3.add(pt.pt, pt.pt, vertex.vertex);
         pt.count++;
      } else {
         pt = {pt: new Float32Array(3), count: 1};
         vec3.copy(pt.pt, vertex.vertex);
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
      const savePt = new Float32Array(3);
      vec3.copy(savePt, vertex.vertex);
      restoreVertex.push({vertex: vertex, savePt: savePt});
      vec3.add(pt.pt, pt.pt, savePt);
      vec3.scale(pt.pt, pt.pt, 1.0/(pt.count+1)); 
      vec3.copy(vertex.vertex, pt.pt);
      this.geometry.addAffectedEdgeAndFace(vertex);
   }
   // after deletion of
   this._updatePreviewAll(oldSize, this.geometry.affected);
   return { collapse: {edges: collapseEdges, vertices: restoreVertex}, vertices: selectedVertex };
};

PreviewCage.prototype.restoreCollapseEdge = function(data) {
   const collapse = data.collapse;
   const oldSize = this._getGeometrySize();
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
      vec3.copy(restore.vertex.vertex, restore.savePt);
      this.geometry.addAffectedEdgeAndFace(restore.vertex);
   }
   // 
   this._updatePreviewAll(oldSize, this.geometry.affected);
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
   const contourLoops = this.geometry.findContours(this.selectedSet);
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
      substract.unshift( this.geometry.dissolveEdge(edge.left) );   // add in reverse order
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
   for (let dissolveUndo of dissolve.edges) {
      dissolveUndo();
   }
   this.selectedSet.clear();
   // reselected the polygon in order.
   for (let polygon of dissolve.selection) {
      this.selectFace(polygon.halfEdge);
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
};


PreviewCage.prototype.dissolveSelectedVertex = function() {
   const oldSize = this._getGeometrySize();
   const undoArray = {array: [], selectedFaces: []};
   for (let vertex of this.selectedSet) {
      let result = this.geometry.dissolveVertex(vertex);
      undoArray.array.unshift( result.undo );
      undoArray.selectedFaces.push( result.polygon );
   }
   this._resetSelectVertex();
   // update previewBox.
   this._updatePreviewAll(oldSize, this.geometry.affected);
   return undoArray;
};
PreviewCage.prototype.undoDissolveVertex = function(undoArray) {
   const oldSize = this._getGeometrySize();
   for (let undo of undoArray) {
      let vertex = undo();
      this.selectVertex(vertex);
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
   for (let polygon of oldSelected) {
      this.selectFace(polygon.halfEdge);
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

// bridge, and unbridge
PreviewCage.prototype.bridge = function(targetFace, sourceFace) {
   if (this.selectedSet.size === 2) {  // make sure. it really target, source
      const oldSize = this._getGeometrySize();

      const targetSphere = this.bench.boundingSpheres[targetFace.index];
      const sourceSphere = this.bench.boundingSpheres[sourceFace.index];
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
   
   contours.edgeLoops = this.geometry.liftContours(contours.edgeLoops);
   contours.extrudeEdges = this.geometry.extrudeContours(contours.edgeLoops);
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
   contours.direction = new Float32Array(vertexCount*3);    // also add direction.
   contours.vertexLimit = Number.MAX_SAFE_INTEGER;  // really should call moveLimit.
   let count = 0;
   for (let polygon of this.selectedSet) {
      let prev = null;
      contours.faces.add(polygon);
      for (let hEdge of polygon.hEdges()) {
         contours.vertices.push(hEdge.origin);
         contours.faces.add(hEdge.pair.face);
         contours.wingedEdges.add( hEdge.wingedEdge );
         contours.wingedEdges.add( hEdge.pair.next.wingedEdge );  // the extrude edge 
         let position = contours.position.subarray(count, count+3);
         let direction = contours.direction.subarray(count, count+3);
         count += 3;
         vec3.copy(position, hEdge.origin.vertex);
         if (!prev) {
            prev = hEdge.prev();
         }
         vec3.scale(direction, hEdge.destination().vertex, 1.0/2);            // compute the sliding middle point
         vec3.scaleAndAdd(direction, direction, prev.origin.vertex, 1.0/2);
         vec3.sub(direction, direction, hEdge.origin.vertex);
         // get length and normalized.
         const len = vec3.length(direction);
         if (len < contours.vertexLimit) {
            contours.vertexLimit = len;
         }
         vec3.normalize(direction, direction);
         // 
         prev = hEdge;
      }
   }

   // add the new Faces. and new vertices to the preview
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // reselect face, or it won't show up. a limitation.
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected) {
      this.selectFace(polygon.halfEdge);
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
      vec3.add(pt, pt, vertex.vertex);
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



//----------------------------------------------------------------------------------------------------------

PreviewCage.prototype.EPSILON = 0.000001;
// Möller–Trumbore ray-triangle intersection algorithm
// should I use float64array? 
PreviewCage.prototype.intersectTriangle = function(ray, triangle) {
   var edge1 = vec3.create(), edge2 = vec3.create();
   /* find vectors for two edges sharing vert0 */
   vec3.sub(edge1, triangle[1], triangle[0]);
   vec3.sub(edge2, triangle[2], triangle[0]);

   /* begin calculating determinant - also used to calculate U parameter */
   var pvec = vec3.create();
   vec3.cross(pvec, ray.direction, edge2);

   /* if determinant is near zero, ray lies in plane of triangle */
   var det = vec3.dot(edge1, pvec);

   if (det < this.EPSILON) { // cull backface, and nearly parallel ray
      return 0.0;
   }
   //if (det > -this.EPSILON && det < this.EPSILON), nearly parallel
   //  return 0;

   var inv_det = 1.0 / det;

   /* calculate distance from vert0 to ray origin */
   var tvec = vec3.create();
   vec3.sub(tvec, ray.origin, triangle[0]);

   /* calculate U parameter and test bounds */
   var u = vec3.dot(tvec, pvec) * inv_det;
   if (u < 0.0 || u > 1.0) {
     return 0.0;
   }

   /* prepare to test V parameter */
   var qvec = vec3.create();
   vec3.cross(qvec, tvec, edge1);

   /* calculate V parameter and test bounds */
   var v = vec3.dot(ray.direction, qvec) * inv_det;
   if (v < 0.0 || u + v > 1.0) {
     return 0.0;
   }

   /* calculate t, ray intersects triangle */
   var t = vec3.dot(edge2, qvec) * inv_det;
   return t;
};



class CreatePreviewCageCommand extends EditCommand {
   constructor(previewCage) {
      super();
      this.previewCage = previewCage;
   }

   doIt() {
      View.addToWorld(this.previewCage);
   }

   undo() {
      View.removeFromWorld(this.previewCage);
   }
}


export {
   PreviewCage,
   CreatePreviewCageCommand,
}