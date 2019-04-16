//
// strategy:
//    use GPU as much as possible. multiple passes for drawing. we have more than enough GPU power.
//
//    update as little as possible on cpu side. 
//
// drawing pass:
//    first pass: draw line (select, unselected) first (using triangles). 
//
//    second pass: draw polygon (selected, unseleced(sort by material)) using slightly optimized index. 
//
//    third pass?: draw vertex.
//
//    last pass: draw hilite (line, polygon, or vertex).
//
"use strict";
import {gl, ShaderData} from './wings3d_gl.js';
import * as ShaderProg from './wings3d_shaderprog.js';
import * as Util from './wings3d_util.js';
import {BoundingSphere} from './wings3d_boundingvolume.js';
import {MeshAllocator, WingedEdge, HalfEdge, Polygon, Vertex} from './wings3d_wingededge.js';
import {EditCommand} from './wings3d_undo.js';




/**
 * 
 * @param {*} theme 
 * @param {*} prop 
 * @param {*} defaultSize
 * 
 * internal data. isAltered (index rebuilt). isModified(reupload data to gpu) 
 */
const DraftBench = function(theme, prop, materialList, defaultSize = 2048) {  // should only be created by View
   MeshAllocator.call(this, defaultSize); // constructor.
   this.materialList = materialList;

   this.preview = {centroid: {}, indexLength: 0, visibleLength: 0, isAltered: false};
   this.preview.shaderData = gl.createShaderData();
   var layoutVec = ShaderData.attribLayout();
   var layoutVec4 = ShaderData.attribLayout(4);
   var layoutFloat = ShaderData.attribLayout(1);
   this.preview.shaderData.createAttribute('polygonIndex', layoutVec4, gl.STATIC_DRAW);
   this.preview.shaderData.createSampler("faceState", 2, 1, gl.UNSIGNED_BYTE);
   this.preview.shaderData.createSampler('positionBuffer', 0, 3, gl.FLOAT);
   this.preview.shaderData.createSampler('centerBuffer', 1, 3, gl.FLOAT);
   this.preview.shaderData.createIndex('triangleList');
   //this._resizePreview(0, 0);
   this.setTheme(theme, prop);

   // previewFace selected
   this.preview.face = {};
   //this.preview.face.hilite = {index: null, indexLength: 0, numberOfTriangles: 0};  // the hilite index triangle list.;

   // previewEdge selected
   this.preview.edge = {};
   this.preview.shaderData.createAttribute('indexBuffer', layoutVec, gl.STATIC_DRAW);
   this.preview.shaderData.createSampler("edgeState", 1, 1, gl.UNSIGNED_BYTE);

   // previewVertex
   this.preview.vertex = {};
   this.preview.shaderData.createAttribute('vertexIndex', layoutFloat, gl.DYNAMIC_DRAW);
   this.preview.shaderData.createAttribute('vertexState', layoutFloat, gl.DYNAMIC_DRAW);

   // body state.
   this.previewBody = {hilite: false};
   // shown plane normal
   this.previewPlane = {};
   this.previewPlane.shaderData = gl.createShaderData();
   this.previewPlane.shaderData.setUniform4fv("faceColor", [1.0, 0.0, 0.0, 1.0]);
   this.previewPlane.shaderData.createAttribute('position', layoutVec, gl.STATIC_DRAW);
   this.previewPlane.rectangle = new Float32Array(3*4);  // 
   this.previewPlane.shaderData.resizeAttribute('position', Float32Array.BYTES_PER_ELEMENT*3*4);
   this.previewPlane.pts = [];
   for (let i = 0; i < 4; ++i) {
      this.previewPlane.pts[i] = this.previewPlane.rectangle.subarray(i*3, (i+1)*3);
   }
};
// draftBench inherited from MeshAllocator, so we canintercept freeXXX and allocXXX call easier. It also makes logical sense.
DraftBench.prototype = Object.create(MeshAllocator.prototype);
Object.defineProperty(DraftBench.prototype, 'constructor', { 
   value: DraftBench,
   enumerable: false, // so that it does not appear in 'for in' loop
   writable: true });

// temp structure
DraftBench.theme = {unselectedEdgeColor: [0.0, 0.0, 0.0, 1.0],
                    hardEdgeColor: [1.0, 0.5, 0.0, 1.0],
                    selectedColor: [0.65, 0.0, 0.0, 1.0],
                    selectedHilite: [0.7, 0.7, 0.0, 1.0],
                    unselectedHilite: [0.0, 0.65, 0.0, 1.0],
                    unselectedVertexColor: [0.0, 0.0, 0.0, 1.0],
                    maskedVertexColor: [0.5, 1.0, 0.0, 0.8],
                    faceColor: [0.7898538076923077, 0.8133333333333334, 0.6940444444444445, 1.0],
                    sculptMagnetColor: [0.0, 0.0, 1.0, 0.1],
                    tweakMagnetColor: [0.0, 0.0, 1.0, 0.06],
                    tweakVectorColor: [1.0, 0.5, 0.0],
                  };
DraftBench.pref = {unselectedVertexSize: 4.0,
                   selectedVertexSize: 5.0,
                   maskedVertexSize: 8.0,
                   unselectedEdgeWidth: 2.0,
                   selectedEdgeWidth: 2.0,
                   hardEdgeWidth: 2.0,
                  };
// temp structure for 
DraftBench.CONST = (function() {
   const constant = {};

   constant.EDGEWIDTH = 1.1;
   constant.BARYCENTRIC = new Float32Array(3);
   constant.BARYCENTRIC[0] = 1.0;
   constant.BARYCENTRIC[1] = 0.0;
   constant.BARYCENTRIC[2] = 1.0;
   return constant;
}());

function getEdgeColor(theme) {
   const buffer = new Float32Array(4*8);
   const color = new Util.Vec4View(buffer);
   color.set(theme.unselectedEdgeColor).inc();  // 0 (none)
   color.set(theme.hardEdgeColor).inc();        // 1 (hardEdge)
   color.set(theme.selectedColor).inc();        // 2 (selected)
   color.set(theme.selectedColor).inc();        // 3 (select+hardEdge)
   color.set(theme.unselectedHilite).inc();     // 4 (hilite)
   color.set(theme.unselectedHilite).inc();     // 5 (hilite + hardEdge)
   color.set(theme.selectedHilite).inc();       // 6 (hilite + select)
   color.set(theme.selectedHilite);             // 7 (hilite + select + hardEdged)
   return buffer;
};
function getEdgeWidth(pref) {
   const size = new Float32Array(8);
   size[0] = pref.unselectedEdgeWidth;
   size[1] = pref.unselectedEdgeWidth;
   size[2] = pref.selectedEdgeWidth;
   size[3] = pref.selectedEdgeWidth;
   size[4] = pref.unselectedEdgeWidth;
   size[5] = pref.unselectedEdgeWidth;
   size[6] = pref.selectedEdgeWidth;
   size[7] = pref.selectedEdgeWidth;
   return size;
};
function getVertexColor(theme) {
   const buffer = new Float32Array(4*8);
   const color = new Util.Vec4View(buffer);
   color.set(theme.unselectedVertexColor).inc();   // 0 (none)
   color.set(theme.selectedColor).inc();          // 1 (select)
   color.set(theme.maskedVertexColor).inc();      // 2 (masked)
   color.set(theme.maskedVertexColor).inc();      // 3 (masked+select)
   color.set(theme.unselectedHilite).inc();       // 4 (hilite)
   color.set(theme.selectedHilite).inc();         // 5 (hilite + select)
   color.set(theme.unselectedHilite).inc();       // 6 (hilite + masked)
   color.set(theme.selectedHilite);               // 7 (hilite + masked + select)
   return buffer;
};
function getVertexSize(pref) {
   const size = new Float32Array(8);
   size[0] = pref.unselectedVertexSize;
   size[1] = pref.selectedVertexSize * 1.5;
   size[2] = pref.maskedVertexSize * 1.5;
   size[3] = pref.maskedVertexSize * 1.5;
   size[4] = pref.selectedVertexSize * 1.5;
   size[5] = pref.selectedVertexSize * 1.5;
   size[6] = pref.maskedVertexSize * 1.5;
   size[7] = pref.maskedVertexSize * 1.5;
   return size;
};
function getFaceColor(theme) {
   const buffer = new Float32Array(4*4);
   const color = new Util.Vec4View(buffer);
   color.set(theme.faceColor).inc();         // 0 (none), wont get used!
   color.set(theme.selectedColor).inc();     // 1 (selected)
   color.set(theme.unselectedHilite).inc();  // 2 (hilite)
   color.set(theme.selectedColor);           // 3 (hilite+selected)
   return buffer;
};

/**
 * 
 */
DraftBench.prototype.setTheme = function(theme, pref) {
   Object.entries(theme).forEach(([key, value]) => {
      // put the hex value to shader
      this.preview.shaderData.setUniform4fv(key, Util.hexToRGBA(value));
      DraftBench.theme[key] = Util.hexToRGBA(value);     // to be deleted
    });
   // set pref
   Object.entries(pref).forEach(([key, value]) => {
      DraftBench.pref[key] = value;
      this.preview.shaderData.setUniform1f(key, value);
    });

   // update shaderData
   this.preview.shaderData.setUniform4fv('edgeColor', getEdgeColor(DraftBench.theme));
   this.preview.shaderData.setUniform1fv('edgeWidth', getEdgeWidth(DraftBench.pref));
   this.preview.shaderData.setUniform4fv('vertexColor', getVertexColor(DraftBench.theme));
   this.preview.shaderData.setUniform1fv('sizeOfVertex', getVertexSize(DraftBench.pref));
   this.preview.shaderData.setUniform4fv('faceColor', getFaceColor(DraftBench.theme));
};

// free webgl buffer.
DraftBench.prototype.freeBuffer = function() {
   this.preview.shaderData.freeAllAttributes();
   this.preview.shaderData =  null;
   this.previewEdge.shaderData.freeAllAttributes();
   this.previewEdge.shaderData = null;
};


DraftBench.prototype.updatePreview = function() {
//   this._resizePreview();
//   this._updatePreviewSize();
   this._updateAffected(this.affected);
   // compute index
   //this._computePreviewIndex();
};
/*
DraftBench.prototype._resizePreview = function() {
   let oldSize = this.lastPreviewSize.vertices;
   let oldCentroidSize = this.lastPreviewSize.faces;

   const size = this.vertices.length - oldSize;
   const centroidSize = this.faces.length - oldCentroidSize;
   if ((size > 0) || (centroidSize > 0)) {
      let length = this.position.usedSize;
      let centroidLength = this.preview.centroid.buf.data.length;
      if (oldSize > 0) {
         if (length > this.preview.barycentric.length) {
            // create new length
            this.preview.barycentric = new Float32Array(length);
            let selected = new Uint8Array(length/3);
            selected.set(this.preview.face.selected);
            this.preview.face.selected = selected;
         }
         if (centroidLength > this.preview.centroid.barycentric.length) {
            this.preview.centroid.barycentric = new Float32Array(centroidLength);
         }
      } else { // brand new
         // created array
         this.preview.barycentric = new Float32Array(length);
         this.preview.face.selected = new Uint8Array(length/3);
         this.preview.face.indexLenth = 0;
         this.preview.face.visibleLength = 0;
      
         this.preview.centroid.barycentric = new Float32Array(centroidLength);
      }
      this.preview.barycentric.set(DraftBench.CONST.BARYCENTRIC);
      this.preview.face.selected.fill(0, oldSize);
      this.preview.centroid.barycentric.fill(1.0);
      // upload the data to webgl
      length = this.position.usedSize;
      centroidLength = this.preview.centroid.buf.len;
      this.preview.shaderData.resizeAttribute('position', (length+centroidLength)*4);
      this.preview.shaderData.uploadAttribute('position', 0, this.position.buffer.subarray(0, length));
      this.preview.shaderData.uploadAttribute('position', length*4, this.preview.centroid.buf.data.subarray(0, centroidLength));
      this.preview.shaderData.resizeAttribute('barycentric', (length+centroidLength)*4);
      this.preview.shaderData.uploadAttribute('barycentric', 0, this.preview.barycentric.subarray(0, length));
      this.preview.shaderData.uploadAttribute('barycentric', length*4, this.preview.centroid.barycentric.subarray(0, centroidLength));
      // invalidate hilite
      this.hilite.indexLength = 0;
      this.preview.isAltered = true;
   }
      
   // compute index
   if (this.preview.isAltered) {
      this._computePreviewIndex();
   }
};


DraftBench.prototype._computePreviewIndex = function() {
   this.numberOfTriangles = this.faces.reduce( function(acc, element) {
      return acc + element.numberOfVertex; // -2; for half the vertex
   }, 0);
   this.preview.indexLength = this.numberOfTriangles * 3;
   this.preview.visibleLength = this.preview.indexLength;
};
*/
/*
DraftBench.prototype._computeFaceHiliteIndex = function(polygon, offset) {
   if (this.hilite.numberOfTriangles < polygon.numberOfVertex) {
      this.hilite.numberOfTriangles = polygon.numberOfVertex;
      this.hilite.index = new Uint32Array(this.hilite.numberOfTriangles*3);
   }
   if (offset === undefined) {
      offset = 0;
   }
   let indicesLength = 0;
   let barycentric = this.vertices.length + polygon.index;
   for (let hEdge of polygon.hEdges()) {
      const vertex = hEdge.origin;
      if (indicesLength > 0) {
         this.hilite.index[offset+indicesLength++] = vertex.index;
         this.hilite.index[offset+indicesLength++] = barycentric;
      }
      this.hilite.index[offset+indicesLength++] = vertex.index;
   }
   // last triangle using the first vertices
   this.hilite.index[offset+indicesLength++] = this.hilite.index[offset];
   this.hilite.index[offset+indicesLength++] = barycentric;

   this.hilite.indexLength = offset+indicesLength;
   // copy to gpu
   this.preview.shaderData.setIndex('faceHilite', this.hilite.index);
};

DraftBench.prototype._computeGroupHiliteIndex = function(faceGroup) {
   let numberOfTriangles = 0;
   for (let polygon of faceGroup) {
      numberOfTriangles += polygon.numberOfVertex;
   }
   if (this.hilite.numberOfTriangles < numberOfTriangles) {
      this.hilite.numberOfTriangles = numberOfTriangles;
      this.hilite.index = new Uint32Array(this.hilite.numberOfTriangles*3);
   }
   this.hilite.indexLength = 0;
   for (let polygon of faceGroup) {
      this._computeFaceHiliteIndex(polygon, this.hilite.indexLength);
   }
};*/


DraftBench.prototype._updateAffected = function(affected) {
/*   if (affected.vertices.size > 0) {
      for (let vertex of affected.vertices) {
         this._updateVertex(vertex, affected);
      }
   } */
   if (affected.faces.size > 0) {
      for (let face of affected.faces) {
         this._updatePreviewFace(face);
      }
      // update index

   }

   this.clearAffected();
};

/*
DraftBench.prototype._updateVertex = function(vertex, affected) {
   if (vertex.isLive()) {
      // first the simple case, update the vertexPreview,
      this.preview.shaderData.uploadAttribute('position', vertex.vertex.byteOffset, vertex.vertex);
   }
}; */

DraftBench.prototype._updatePreviewFace = function(polygon) {
   // recompute boundingSphere centroid, and if numberOfVertex changed, needs to recompute index.
 /*  if ((polygon.index < this.boundingSpheres.length) && polygon.isLive()) { // will be get recompute on resize
      polygon.update();
      const sphere = this.boundingSpheres[ polygon.index ];
      sphere.setSphere( BoundingSphere.computeSphere(sphere.polygon, sphere.center) ); 
      // update center
      const index = this.vertices.length+polygon.index;
      this.preview.shaderData.uploadAttribute('position', index*3*4, sphere.center);
   } */
};


/*
DraftBench.prototype.hiliteFace = function(polygon, isHilite) {
   if (isHilite) {   // show
      this.hilite.color = DraftBench.theme.unselectedHilite;
      if ((this.preview.face.selected[polygon.index] & 1) === 1) {
         this.hilite.color = DraftBench.theme.selectedHilite;
      }
      this.preview.face.selected[polygon.index] |= 2;
      this._computeFaceHiliteIndex(polygon);
   } else { // hide
      this.hilite.indexLength = 0;
      this.preview.face.selected[polygon.index] &= ~2;
   }
};

DraftBench.prototype.hiliteBody = function(faceGroup, isHilite) {
   if (isHilite) { // show
      let checkColor = true;
      this.hilite.color = DraftBench.theme.unselectedHilite;
      for (let polygon of faceGroup) {
         if (checkColor && ((this.preview.face.selected[polygon.index] & 1) === 1)) {
            this.hilite.color = DraftBench.theme.selectedHilite;  // unnecessary assignment
            checkColor = false;
         }
         this.preview.face.selected[polygon.index] |= 2;
      }
      this._computeGroupHiliteIndex(faceGroup);
   } else { // hide 
      this.hilite.indexLength = 0;
      for (let polygon of faceGroup) { // clear flag
         this.preview.face.selected[polygon.index] &= ~2;
      }
   }
}; */


/**
 * polygon drawing routines.
 * 
 * @param {gl} - drawing context.
 */
DraftBench.prototype.draw = function(gl, madsor) {
   try {
      // update polygon(including center) index if needed.
      this.preview.shaderData.updateAttributeEx("polygonIndex", HalfEdge.index, Polygon.centerIndex);
      

      // update positionBuffer texture if modified
      this.preview.shaderData.updateSampler("positionBuffer", Vertex.position); // this.position === Vertex.position
      // update centroid if needed
      this.preview.shaderData.updateSampler("centerBuffer", BoundingSphere.center);

      // update vertex color if needed (it per hEdge)

      // update polygon, group state if needed
      this.preview.shaderData.updateSampler("faceState", Polygon.state);
      // this.preview.shaderData.updateSampler("groupState", WingedTopology.state);

      // update material if needed

      // update index if needed,
      this.preview.shaderData.updateIndex("triangleList", HalfEdge.triangleList, HalfEdge.index.usedSize/4, gl.STATIC_DRAW);

      // bind polygonIndex
      gl.bindAttribute(this.preview.shaderData, ['polygonIndex']);

      // bindUniform all
      gl.bindUniform(this.preview.shaderData, ['faceColor', 'faceState', 'faceStateHeight',
                                               'positionBuffer', 'positionBufferHeight', 'centerBuffer', 'centerBufferHeight']);

      gl.bindIndex(this.preview.shaderData, 'triangleList');
      gl.drawElements(gl.TRIANGLES, HalfEdge.triangleList.usedSize, gl.UNSIGNED_INT, 0);                                       
      //gl.drawArrays(gl.TRIANGLES,  0, HalfEdge.index.usedSize/4);
   } catch (e) {
      console.log(e);
   }
/*
   if (this.preview.isAltered) { // rebuild all
      for (let material of this.materialList) {
         //if (material.usageCount > 0) {
         material.indexLength = 0;
         material.index = new Uint32Array(this.preview.indexLength);    // give the maximum index
         //}
      }
      for (let cage of madsor.visibleWireCage(false)) {  // wire only cage was drawn before.
         for (let polygon of cage.geometry.faces) {
            if (polygon.isVisible()) {
               const material = polygon.material;
               const center = polygon.index + this.vertices.length;
               material.indexLength = polygon.buildIndex(material.index, material.indexLength, center);
            }
         }
      }
      for (let material of this.materialList) {
         if (material.indexLength > 0) {
            this.preview.shaderData.setIndex(material.uuid, material.index);
         }
         material.isAltered = false;
         delete material.index;   // release memory
      }
      this.preview.isAltered = false;
   } else { // rebuild only altered materials list.
      let isAltered = false;
      for (let material of this.materialList) {
         if (material.isAltered) {
            isAltered = true;
            material.indexLength = 0;
            material.index = new Uint32Array(this.preview.indexLength);    // give the maximum index
         }
      }
      if (isAltered) {  // rebuild altered Material index
         for (let cage of madsor.visibleWireCage(false)) {
            for (let polygon of cage.geometry.faces) {
               if (polygon.isVisible() && polygon.material.isAltered) {
                  const material = polygon.material;
                  const center = polygon.index + this.vertices.length;
                  material.indexLength = polygon.buildIndex(material.index, material.indexLength, center);
               }
            }
         }
         // rebuild altered material
         for (let material of this.materialList) {
            if (material.isAltered) {
               if (material.indexLength > 0) {
                  this.preview.shaderData.setIndex(material.uuid, material.index);
               }
               delete material.index;
               material.isAltered = false;
            }
         }
      }
   }
   
   // draw all polygon sorted by material
   gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
   this.preview.shaderData.setUniform4fv('color', DraftBench.theme.unselectedEdgeColor);
   this.preview.shaderData.setUniform1f('lineWidth', DraftBench.pref.unselectedEdgeWidth);
   gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
   for (let material of this.materialList) {  // draw normal polygon
      if (material.indexLength > 0) {
         const diffuse = material.pbr.baseColor;
         this.preview.shaderData.setUniform4fv('faceColor', [diffuse[0], diffuse[1], diffuse[2], 1.0]);
         gl.bindUniform(this.preview.shaderData, ['faceColor']);
         gl.bindIndex(this.preview.shaderData, material.uuid);
         gl.drawElements(gl.TRIANGLES, material.indexLength, gl.UNSIGNED_INT, 0);
      }
   } */
};


// draw hilite polygon then selected polygon.
/*DraftBench.prototype.drawHilite = function(gl, madsor) {
   if (this.hilite.indexLength > 0) {
      try {
         // set hilite color and hilite index
         gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
         this.preview.shaderData.setUniform4fv('color', DraftBench.theme.unselectedEdgeColor);
         this.preview.shaderData.setUniform1f('lineWidth', DraftBench.pref.unselectedEdgeWidth);
         this.preview.shaderData.setUniform4fv("faceColor", this.hilite.color);
         gl.bindUniform(this.preview.shaderData, ['color', 'lineWidth', 'faceColor']);
         gl.bindIndex(this.preview.shaderData, 'faceHilite');
         gl.drawElements(gl.TRIANGLES, this.hilite.indexLength, gl.UNSIGNED_INT, 0);
         // restore color
         this.preview.shaderData.setUniform4fv("faceColor", DraftBench.theme.faceColor);
      } catch (e) {
         console.log(e);
      }
   }
   // draw selected polygon
   // first check index modification
   if (this.preview.face.isAltered) {
      const selection = new Uint32Array(this.preview.face.indexLenth);
      let k = 0;
      for (let cage of madsor.visibleWireCage(false)) {  // wire only cage was drawn before.
         for (let polygon of cage.geometry.faces) {
            if (polygon.isVisible()) {
               const i = polygon.index;
               const center = i + this.vertices.length;
               if (this.preview.face.selected[i] & 1) {
                  k = polygon.buildIndex(selection, k, center);
               }
            }
         }
      }
      this.preview.face.visibleLength = k;
      this.preview.shaderData.setIndex('selectedFace', selection);
      this.preview.face.isAltered = false;
   }
   // draw faceSelected if not empty
   if (this.preview.face.visibleLength > 0) {
      gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
      this.preview.shaderData.setUniform4fv('color', DraftBench.theme.unselectedEdgeColor);
      this.preview.shaderData.setUniform1f('lineWidth', DraftBench.pref.unselectedEdgeWidth);
      this.preview.shaderData.setUniform4fv('faceColor', DraftBench.theme.selectedColor);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'selectedFace');
      gl.drawElements(gl.TRIANGLES, this.preview.face.visibleLength, gl.UNSIGNED_INT, 0);
   }   
}; */

// draw vertex, select color, 
DraftBench.prototype.drawVertex = function(gl, madsor) {
   try {
      // indexBuffer upload if needed, 
      this.preview.shaderData.updateAttribute("vertexIndex", Vertex.index);

      // stateBuffer upload if needed
      this.preview.shaderData.updateAttribute("vertexState", Vertex.state);
      gl.bindAttribute(this.preview.shaderData, ['vertexIndex', 'vertexState']);

      // update positionBuffer texture if modified
      this.preview.shaderData.updateSampler("positionBuffer", Vertex.position); // this.position === Vertex.position

      // bindUniform all
      gl.bindUniform(this.preview.shaderData, ['vertexColor', 'sizeOfVertex',
                                               'positionBuffer', 'positionBufferHeight']);

      gl.drawArrays(gl.POINTS,  0, Vertex.index.usedSize);
   } catch (e) {
      console.log(e);
   }
};


/** 
 * draw selected, hilite, hard and normal edges.
 * @param {gl} - drawing context
 */
DraftBench.prototype.drawEdge = function(gl, madsor) {
   try {
      // indexBuffer upload if needed
      this.preview.shaderData.updateAttribute('indexBuffer', WingedEdge.index);
      // now bind attribute
      gl.bindAttribute(this.preview.shaderData, ['indexBuffer']);

      // update positionBuffer texture if modified
      this.preview.shaderData.updateSampler("positionBuffer", this.position);

      // update edgeState. should refactored.
      this.preview.shaderData.updateSampler("edgeState", WingedEdge.state);

      // bindUniform all
      gl.bindUniform(this.preview.shaderData, ['edgeColor', 'edgeWidth',
                                               'positionBuffer', 'positionBufferHeight', 'edgeState', 'edgeStateHeight']);

      gl.drawArrays(gl.TRIANGLES,  0, WingedEdge.index.usedSize/3);
   } catch (e) {
      console.log(e);
   }
};

DraftBench.prototype.drawPlane = (function() {
   const diagonal = vec3.create();   // a diagonal [1,0,1] normalize vector
   const up = vec3.fromValues(0, 1, 0);
   const rotate = quat.create();
   const transform = mat4.create();
   const halfSize = vec3.create();
   
   return function(gl, plane) {   // the real function
      vec3.copy(halfSize, plane.halfSize);
      vec3.normalize(halfSize, halfSize);
      vec3.cross(diagonal, halfSize, up);
      vec3.normalize(diagonal, diagonal);
      // find rotation between planeNormal and Axis alignment
      quat.rotationTo(rotate, diagonal, plane.normal);//, diagonal);
      mat4.fromQuat(transform, rotate);
      //vec3.transformMat4(halfSize, plane.halfSize, transform);
      vec3.copy(halfSize, plane.halfSize);
      // setup halfSize, 
      vec3.negate(this.previewPlane.pts[0], halfSize);
      let pt = this.previewPlane.pts[1];
      pt[0] = halfSize[0];
      pt[1] = -halfSize[1];
      pt[2] = halfSize[2];
      vec3.copy(this.previewPlane.pts[2], halfSize);
      vec3.negate(this.previewPlane.pts[3], pt);
      // update position.
      for (let i = 0; i < 4; ++i) {
         const pt = this.previewPlane.pts[i];
         vec3.transformMat4(pt, pt, transform);
         vec3.add(pt, plane.center, pt);
      }
      // upload result
      this.previewPlane.shaderData.uploadAttribute('position', 0, this.previewPlane.rectangle);
      if (plane.hilite) {  // set color
         this.previewPlane.shaderData.setUniform4fv("faceColor", [0.0, 1.0, 0.0, 1.0]);
      } else {
         this.previewPlane.shaderData.setUniform4fv("faceColor", [0.1, 0.1, 0.1, 1.0]);
      }
      // draw the rectangle plane
      gl.disable(gl.CULL_FACE);
      gl.useShader(ShaderProg.solidColor);
      gl.bindTransform();
      gl.bindAttribute(this.previewPlane.shaderData, ['position']);
      gl.bindUniform(this.previewPlane.shaderData, ['faceColor']);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      gl.disableShader();
      gl.enable(gl.CULL_FACE);
   };
})();


DraftBench.prototype.selectGroup = function(selection, isOn) {
   for (let polygon of selection) {
      this.selectFace(polygon, isOn);
   }
};


DraftBench.prototype.resetBody = function(bodyGroup) {
   this.selectGroup(bodyGroup, false);    // turn group off.
};


/*
DraftBench.prototype.resetSelectEdge = function() {
   // zeroout the edge selection,
   for (let i = 0; i < this.edgeState.buffer.length; ++i) {
      this.edgeState.buffer[i] &= ~2;
   }
   // gpu needs to update all.
   this.edgeState.alteredMin = 0 ;
   this.edgeState.alteredMax = this.edgeState.buffer.length-1;
};
*/


DraftBench.prototype.resetSelectFace = function() {
   for (let polygon of this.faces) {
      polygon.setSelect(false);           // reset all polygon to non-selected
   }
};


class CheckPoint extends EditCommand { // do we really needs to inherited form EditCommand?
   CheckPoint(draftBench, editCommand) {
      this.command = editCommand;
      this.draftBench = draftBench;
      // map the (vertices, edges, faces) value.
      this.vertices = [];
      for (let vertex of draftBench.vertices) {
         // outEdge index, need real pt?
         if (vertex.isLive()) {
            this.vertices.push( vertex.outEdge.wingedEdge.index );
         } else {
            this.vertices.push( -1 );
         }
      }
      this.edges = [];
      for (let wEdge of draftBench.edges) {
         // left->next index, right->next index, origin index, dest index.
         if (wEdge.isLive()) {
            this.edges.push( wEdge.left.next.index, wEdge.right.next.index, wEdge.left.origin.index, wEdge.right.origin.index);
         } else {
            this.edges.push( -1, -1, -1, -1 );
         }
      }
      this.faces = [];
      for (let polygon of draftBench.faces) {
         // halfEdge index.
         if (polygon.isLive()) {
            this.faces.push( polygon.halfEdge.index );
         } else {
            this.faces.push( -1 );
         }
      }
   }

   doIt() {
      return this.command.doIt();
   }

   undo() {
      this.command.undo();
      // now check draftBench and our saved value.
      // use index because draftBench could have more faces(all dead) than our Saved one due to expansion.
      for (let i = 0; i < this.faces.length; ++i) {   // check polygon first, most like to have problems
         const polygon = this.draftBench.faces[i];
         if (polygon.isLive()) {
            if (polygon.halfEdge.index != this.faces[i]) {
               geometryStatus("CheckPoint failed. non matching polygon halfEdge");
               return;
            }
         } else {
            if (this.faces[i] != -1) {
               geometryStatus("CheckPoint failed. extra face");
               return
            }
         }
      }
      for (let i = 0; i < this.vertices.lenth; ++i ) {   // check vertex next because of simplicity.
         const vertex = this.draftBench.vertices[i];
         if (vertex.isLive()) {
            if (vertex.outEdge.wingedEdge.index != this.vertices[i]) {
               geometryStatus("CheckPoint failed. non-matching vertex outEdge");
               return;
            }
         } else {
            if (this.vertices[i] != -1) {
               geometryStatus("CheckPoint failed. extra vertex");
               return;
            }
         }
      }
      // check edges
      for (let i = 0; i < this.edges.length; i+=4) {
         const wEdge = this.draftBench.edges[i];
         if (wEdge.isAlive()) {
            if (wEdge.left.next.index != this.edges[i] || wEdge.right.next.index != [i+1] ||
                 wEdge.left.origin.index != this.edges[i+2] || wEdge.right.origin.index != this.edges[i+3]) {
               geometryStatus("CheckPoint failed. non matching wEdge");
               return;
            }
         } else {
            if (this.edges[i] != -1) {
               geometryStatus("CheckPoint failed. extra wEdge");
               return;
            }
         }
      }
   }
};


export {
   DraftBench, 
   CheckPoint
};