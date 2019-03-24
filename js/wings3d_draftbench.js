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
import {MeshAllocator, WingedEdge, Vertex} from './wings3d_wingededge.js';
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
  
   this.lastPreviewSize = { vertices: 0, edges: 0, faces: 0};
   this.boundingSpheres = [];
   this.hilite = {index: null, indexLength: 0, numberOfTriangles: 0};  // the hilite index triangle list.
   this.numberOfTriangles = 0;

   this.preview = {centroid: {}, indexLength: 0, visibleLength: 0, isAltered: false};
   this.preview.material = {set: new Set, isAltered: false};
   this.preview.shaderData = gl.createShaderData();
   //this.preview.shaderData.setUniform4fv("faceColor", [0.5, 0.5, 0.5, 1.0]);
   //this.preview.shaderData.setUniform4fv("selectedColor", [1.0, 0.0, 0.0, 1.0]);
   var layoutVec = ShaderData.attribLayout();
   var layoutFloat = ShaderData.attribLayout(1);
   this.preview.shaderData.createAttribute('position', layoutVec, gl.STREAM_DRAW);
   this.preview.shaderData.createAttribute('barycentric', layoutVec, gl.STREAM_DRAW);
   this.preview.shaderData.createSampler('positionBuffer', 0, 3, gl.FLOAT);
   this._resizeBoundingSphere(0);
   this._resizePreview(0, 0);
   this.setTheme(theme, prop);

   // previewFace selected
   this.preview.face = {};
   this.preview.face.isAltered = false;
   this.preview.face.indexLength = 0;
   this.preview.face.visibleLength = 0;
   this.preview.face.selected = null;
   //this.preview.face.hilite = {index: null, indexLength: 0, numberOfTriangles: 0};  // the hilite index triangle list.;

   // previewEdge selected
   this.preview.edge = {};
   this.preview.edge.isAltered = false;
   this.preview.edge.indexLength = 0;
   this.preview.edge.hilite = {indexLength: 0, wEdge: null};
   this.preview.edge.hardness = {isAltered: false, indexLength: 0};
   this.preview.edge.wireOnly = {isAltered: false, indexLength: 0};
   this.preview.shaderData.createAttribute('indexBuffer', layoutVec, gl.STREAM_DRAW);
   this.edgeIndex = new Float32Array(6*3);  // every wEdge has 2 triangle (6) and (vertex, state, barycentric); 
   this.preview.shaderData.createSampler("edgeState", 1, 1, gl.UNSIGNED_BYTE);

   // previewVertex
   this.preview.vertex = {isModified: false, isAltered: false, 
                          min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER};
   this.preview.shaderData.createAttribute('vertexState', layoutFloat, gl.DYNAMIC_DRAW);
   this._resizePreviewVertex();
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
DraftBench.theme = {edgeColor: [0.0, 0.0, 0.0, 1.0],
                    hardEdgeColor: [1.0, 0.5, 0.0, 1.0],
                    selectedColor: [0.65, 0.0, 0.0, 1.0],
                    selectedHilite: [0.7, 0.7, 0.0, 1.0],
                    unselectedHilite: [0.0, 0.65, 0.0, 1.0],
                    vertexColor: [0.0, 0.0, 0.0, 1.0],
                    maskedVertexColor: [0.5, 1.0, 0.0, 0.8],
                    faceColor: [0.7898538076923077, 0.8133333333333334, 0.6940444444444445],
                    sculptMagnetColor: [0.0, 0.0, 1.0, 0.1],
                    tweakMagnetColor: [0.0, 0.0, 1.0, 0.06],
                    tweakVectorColor: [1.0, 0.5, 0.0],
                  };
DraftBench.pref = {vertexSize: 4.0,
                   selectedVertexSize: 5.0,
                   maskedVertexSize: 8.0,
                   edgeWidth: 2.0,
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
};

// free webgl buffer.
DraftBench.prototype.freeBuffer = function() {
   this.preview.shaderData.freeAllAttributes();
   this.preview.shaderData =  null;
   this.previewEdge.shaderData.freeAllAttributes();
   this.previewEdge.shaderData = null;
};

/**
 * vertex.isAltered = true; needs to recompute index.
 */
DraftBench.prototype.alterVertex = function() {
   this.preview.vertex.isAltered = true;
}

/** 
 * visiblility change. update vertex/edge/polygon state.
 */
DraftBench.prototype.alterPreview = function() {
   this.preview.isAltered = true;
   this.preview.face.isAltered = true;
   this.preview.edge.isAltered = true;
   this.preview.edge.wireOnly.isAltered = true;
   this.preview.vertex.isAltered = true;
}

DraftBench.prototype.updatePreview = function() {
   this._resizeBoundingSphere();
   this._resizePreview();
   this._resizePreviewVertex();
   this._updatePreviewSize();
   this._updateAffected(this.affected);
   // compute index
   //this._computePreviewIndex();
};


DraftBench.prototype._resizeBoundingSphere = function() {
   let oldSize = this.lastPreviewSize.faces
   let size = this.faces.length - oldSize;
   if (size > 0) {   // we only care about growth for now
      if (oldSize > 0) {
         if (this.preview.centroid.buf.data.length < (this.preview.centroid.buf.len+(size*3))) {
            // needs to resize, and copy
            const buf = new ArrayBuffer(this.faces.length * 3 * Float32Array.BYTES_PER_ELEMENT * 2);
            const centroid = {buf: {buffer: buf, data: new Float32Array(buf), len: 0} };
            // 
            centroid.buf.data.set(this.preview.centroid.buf.data);  // copy old data
            for (let sphere of this.boundingSpheres) {
               sphere.center = new Float32Array(centroid.buf.buffer, Float32Array.BYTES_PER_ELEMENT*centroid.buf.len, 3); 
               centroid.buf.len += 3;             
            }
            this.preview.centroid.buf = centroid.buf;
         }
      } else {
         const buf = new ArrayBuffer(this.faces.length * 3 * Float32Array.BYTES_PER_ELEMENT * 2); // twice the current size
         this.preview.centroid.buf = {buffer: buf, data: new Float32Array(buf), len: 0};
         // assign a boundingsphere for each polygon.
         //this.boundingSpheres = new Array(this.faces.length);
         //this.boundingSpheres.length = 0;
      }
      // create New, should not have deleted sphere to mess up things
      const centroid = this.preview.centroid;   // 
      for (let i = oldSize; i < this.faces.length; ++i) {
         const polygon = this.faces[i];
         const sphere = this.boundingSpheres[i];
         let center = sphere.center;
         if (!center) {
            center = new Float32Array(centroid.buf.buffer, Float32Array.BYTES_PER_ELEMENT*centroid.buf.len, 3);
            centroid.buf.len += 3;
         }
         //polygon.index = i; // recalibrate index for free.
         //this.boundingSpheres.push( BoundingSphere.create(polygon, center) );
         sphere.setSphere( BoundingSphere.computeSphere(polygon, center) );
      }
      // vertices is geometry data + centroid data.
   }
};

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
};


DraftBench.prototype._resizePreviewVertex = function() {
   const oldSize = this.lastPreviewSize.vertices;
   const length = this.vertices.length;
   const size = length - oldSize;
   if (size > 0) {
      const preview = this.preview.vertex;
      const color = new Float32Array(length);
      if (oldSize > 0) {
         color.set(preview.color);
      }
      //color.fill(0.0, oldSize);   // already initialized.
      preview.color = color;
      //this.preview.vertex.isModified = true;
      this.preview.vertex.isAltered = true;
      // 
      this.preview.shaderData.resizeAttribute('vertexState', length*4);
      this.preview.shaderData.uploadAttribute('vertexState', 0, preview.color);
   }

};


DraftBench.prototype._updatePreviewSize = function() {
   this.lastPreviewSize.vertices = this.vertices.length;
   this.lastPreviewSize.faces = this.faces.length;
};


DraftBench.prototype._updateAffected = function(affected) {
   if (affected.vertices.size > 0) {
      for (let vertex of affected.vertices) {
         this._updateVertex(vertex, affected);
      }
   }
   if (affected.faces.size > 0) {
      for (let face of affected.faces) {
         this._updatePreviewFace(face);
      }
      // update index

   }

   this.clearAffected();
};

DraftBench.prototype._updateVertex = function(vertex, affected) {
   if (vertex.isLive()) {
      // first the simple case, update the vertexPreview,
      this.preview.shaderData.uploadAttribute('position', vertex.vertex.byteOffset, vertex.vertex);
   }
};

DraftBench.prototype._updatePreviewFace = function(polygon) {
   // recompute boundingSphere centroid, and if numberOfVertex changed, needs to recompute index.
   if ((polygon.index < this.boundingSpheres.length) && polygon.isLive()) { // will be get recompute on resize
      polygon.update();
      const sphere = this.boundingSpheres[ polygon.index ];
      sphere.setSphere( BoundingSphere.computeSphere(sphere.polygon, sphere.center) ); 
      // update center
      const index = this.vertices.length+polygon.index;
      this.preview.shaderData.uploadAttribute('position', index*3*4, sphere.center);
   }
};



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
};


/**
 * polygon drawing routines. draw unselected one (sorted by material)
 * 
 * @param {gl} - drawing context.
 */
DraftBench.prototype.draw = function(gl, madsor) {
   // check material modification
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
   this.preview.shaderData.setUniform4fv('color', DraftBench.theme.edgeColor);
   this.preview.shaderData.setUniform1f('lineWidth', DraftBench.pref.edgeWidth);
   gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
   for (let material of this.materialList) {  // draw normal polygon
      if (material.indexLength > 0) {
         const diffuse = material.pbr.baseColor;
         this.preview.shaderData.setUniform4fv('faceColor', [diffuse[0], diffuse[1], diffuse[2], 1.0]);
         gl.bindUniform(this.preview.shaderData, ['faceColor']);
         gl.bindIndex(this.preview.shaderData, material.uuid);
         gl.drawElements(gl.TRIANGLES, material.indexLength, gl.UNSIGNED_INT, 0);
      }
   }
};


// draw hilite polygon then selected polygon.
DraftBench.prototype.drawHilite = function(gl, madsor) {
   if (this.hilite.indexLength > 0) {
      try {
         // set hilite color and hilite index
         gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
         this.preview.shaderData.setUniform4fv('color', DraftBench.theme.edgeColor);
         this.preview.shaderData.setUniform1f('lineWidth', DraftBench.pref.edgeWidth);
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
      this.preview.shaderData.setUniform4fv('color', DraftBench.theme.edgeColor);
      this.preview.shaderData.setUniform1f('lineWidth', DraftBench.pref.edgeWidth);
      this.preview.shaderData.setUniform4fv('faceColor', DraftBench.theme.selectedColor);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'selectedFace');
      gl.drawElements(gl.TRIANGLES, this.preview.face.visibleLength, gl.UNSIGNED_INT, 0);
   }   
};

// draw vertex, select color, 
DraftBench.prototype.drawVertex = function(gl, madsor) {
   // indexBuffer upload if needed, 
   if (Vertex.index.isAltered()) {
      
   }

   // stateBuffer upload if needed

   // position texture already upload?

   // drawing using vertex array
   try {
      if (this.preview.vertex.isModified) {  // upload min  - max
         this.preview.vertex.isModified = false;
         if (this.preview.vertex.min <= this.preview.vertex.max) {
            const i = this.preview.vertex.min;
            const j = this.preview.vertex.max;
            const points = this.preview.vertex.color.subarray(i, j+1);
            this.preview.shaderData.uploadAttribute('vertexState', i*Float32Array.BYTES_PER_ELEMENT, points);
            this.preview.vertex.max = -1;
            this.preview.vertex.min = Number.MAX_SAFE_INTEGER;
         }
      }
      // rebuild index.
      if (this.preview.vertex.isAltered) {
         const length = this.vertices.length;
         const index = new Uint32Array(length);
         let j = 0;
         for (let cage of madsor.visibleCage()) {
            for (let vertex of cage.geometry.vertices) {
               index[j++] = vertex.index;
            }
         }
         this.preview.shaderData.setIndex('vertex', index);
         this.preview.vertex.indexLength = j;
      }
      // 
      gl.bindAttribute(this.preview.shaderData, ['position', 'vertexState']);
      gl.bindUniform(this.preview.shaderData, ['vertexSize', 'selectedVertexSize', 'maskedVertexSize',
                                               'vertexColor', 'selectedColor', 'unselectedHilite', 'selectedHilite', 'maskedVertexColor']);
      gl.bindIndex(this.preview.shaderData, 'vertex');
      gl.drawElements(gl.POINTS, this.preview.vertex.indexLength, gl.UNSIGNED_INT, 0);
   } catch (e) {
      console.log(e);
   }
};

/**
 * draw hardEdge, and wireframe only edge
 */
/*DraftBench.prototype.drawHardEdgeEtc = function(gl, isEdgeMode, madsor) {
   let isBinded = false;
   // draw hard edge if applicable.
   if (this.preview.edge.hardness.indexLength > 0) {
      if (this.preview.edge.hardness.isAltered) {
         const index = new Uint32Array(this.preview.edge.hardness.indexLength);
         let j = 0;
         for (let cage of madsor.visibleCage()) {
            for (let wEdge of cage.geometry.edges) {
               if (wEdge.state & 4) {  // yes, hardEdge
                  j = wEdge.buildIndex(index, j, this.vertices.length);
               }
            }
         }
         this.preview.shaderData.setIndex('hardEdge', index);
         this.preview.edge.hardness.realIndexCount = j;
         this.preview.edge.hardness.isAltered = false;
      }
      if (this.preview.edge.hardness.realIndexCount > 0) {
      isBinded = true;
      // draw HardEdge
      gl.useShader(ShaderProg.selectedColorLine);
      gl.bindTransform();
      gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
      let lineWidth = DraftBench.CONST.EDGEWIDTH;
      if (isEdgeMode) {
         lineWidth = DraftBench.pref.hardEdgeWidth;
      }
      this.preview.shaderData.setUniform1f("lineWidth", lineWidth);
      this.preview.shaderData.setUniform4fv("color", DraftBench.theme.hardEdgeColor);
      this.preview.shaderData.setUniform4fv('faceColor', DraftBench.theme.faceColor);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'hardEdge');
      gl.drawElements(gl.TRIANGLES, this.preview.edge.hardness.realIndexCount, gl.UNSIGNED_INT, 0);  // draw 1 line.
      }
   }
   // recompute wireMode edge index if applicable
   if (this.preview.edge.wireOnly.isAltered) {
      let indexCount = 0 ;
      for (let cage of madsor.visibleWireCage(true)) { // looking for wireMode cage only
         indexCount += cage.geometry.edges.size;
      }
      this.preview.edge.wireOnly.indexLength = indexCount * 6;  // draw 2 triangle for each edge.
      if (indexCount > 0) {
         // now compute the wireOnly polygon
         const index = new Uint32Array(this.preview.edge.wireOnly.indexLength);
         let j = 0;
         for (let cage of madsor.visibleWireCage(true)) {
            for (let wEdge of cage.geometry.edges) {
               if (wEdge.state === 0) {  // we only draw normal edge
                  j = wEdge.buildIndex(index, j, this.vertices.length);
               }
            }
         }
         // wireOnly Edge
         this.preview.shaderData.setIndex('wireEdge', index);
         this.preview.edge.wireOnly.indexLength = j;
      }
      this.preview.edge.wireOnly.isAltered = false;
   }
   // draw wireMode edge if applicable
   if (this.preview.edge.wireOnly.indexLength > 0) {
      if (!isBinded) {  // bind program and data
         gl.useShader(ShaderProg.selectedColorLine);
         gl.bindTransform();
         gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
         this.preview.shaderData.setUniform4fv('faceColor', DraftBench.theme.faceColor);
      }
      this.preview.shaderData.setUniform4fv("color", DraftBench.theme.edgeColor);
      this.preview.shaderData.setUniform1f("lineWidth", DraftBench.CONST.EDGEWIDTH);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'wireEdge');
      gl.drawElements(gl.TRIANGLES, this.preview.edge.wireOnly.indexLength, gl.UNSIGNED_INT, 0);  // draw 1 line.
   }
} */

/** 
 * draw select, hilite, hard and normal edge
 * @param {gl} - drawing context
 */
DraftBench.prototype.drawEdge = function(gl, madsor) {
   // indexBuffer upload if needed
   if (this.lastPreviewSize.edges !== WingedEdge.index.usedSize) { // needs to resize?
      this.lastPreviewSize.edges = WingedEdge.index.usedSize;
      this.preview.shaderData.resizeAttribute('indexBuffer', WingedEdge.index.usedSize*4);
      this.preview.shaderData.uploadAttribute('indexBuffer', 0, WingedEdge.index.buffer.subarray(0, WingedEdge.index.usedSize));
      WingedEdge.index.submitted(); // clear altered buffer.
   } else if (WingedEdge.index.isAltered()) {   // needs partial update?
      this.preview.shaderData.uploadAttribute('indexBuffer', WingedEdge.index.alterdMin*4, WingedEdge.index.buffer.subarray(WingedEdge.index.alterdMin, WingedEdge.index.alteredMax+1));
      WingedEdge.index.submitted();
   } // now bind attribute
   gl.bindAttribute(this.preview.shaderData, ['indexBuffer']);

   // update positionBuffer texture if modified
   this.preview.shaderData.updateSampler("positionBuffer", this.position);

   // update edgeState. should refactored.
   this.preview.shaderData.updateSampler("edgeState", WingedEdge.state);

   // bindUniform all
   gl.bindUniform(this.preview.shaderData, ['edgeColor', 'hardEdgeColor', 'selectedColor', 'selectedHilite', 'unselectedHilite',
                                            'edgeWidth', 'selectedEdgeWidth', 'hardEdgeWidth',
                                            'positionBuffer', 'positionBufferHeight', 'edgeState', 'edgeStateHeight']);

   gl.drawArrays(gl.TRIANGLES,  0, WingedEdge.index.usedSize/3);

/*   this.preview.shaderData.setUniform1f("lineWidth", DraftBench.pref.selectedEdgeWidth);

   // draw hilite first
   if (this.preview.edge.hilite.wEdge) {
      let hiliteColor = DraftBench.theme.unselectedHilite;
      const wEdge = this.preview.edge.hilite.wEdge;
      if (wEdge.state & 1) { // selected?
         hiliteColor = DraftBench.theme.selectedHilite;
      }
      this.preview.shaderData.setUniform4fv("color", hiliteColor);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'edgeHilite');
      gl.drawElements(gl.TRIANGLES, this.preview.edge.hilite.indexLength, gl.UNSIGNED_INT, 0);  // draw 1 line.
   }

   // 2nd) draw selected
   if (this.preview.edge.indexLength > 0) { // draw selected edge
      if (this.preview.edge.isAltered) {  // rebuild selected index, might as well rebuilt hardEdge.
         const selected = new Uint32Array( this.preview.edge.indexLength );
         const hard = new Uint32Array( this.preview.edge.hardness.indexLength );
         let j = 0;
         let k = 0;
         for (let cage of madsor.visibleCage()) {
            for (let wEdge of cage.geometry.edges) {
               if (wEdge.state & 1) {   // selected, draw both side
                  j = wEdge.buildIndex(selected, j, this.vertices.length);
               } else if (wEdge.state & 4) { // might as well check for hardEdge simultaneously
                  k = wEdge.buildIndex(hard, k, this.vertices.length);
               }
            }
         }
         // set the new selected.
         this.preview.shaderData.setIndex('edgeSelected', selected);
         this.preview.edge.realIndexCount = j;
         this.preview.edge.isAltered = false;
         if (this.preview.edge.hardness.isAltered) {
            this.preview.shaderData.setIndex('hardEdge', hard);
            this.preview.edge.hardness.realIndexCount = k;
            this.preview.edge.hardness.isAltered = false;
         }
      }
      // now draw
      if (this.preview.edge.realIndexCount > 0) {
         this.preview.shaderData.setUniform4fv('color', DraftBench.theme.selectedColor);
         gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
         gl.bindIndex(this.preview.shaderData, 'edgeSelected');
         gl.drawElements(gl.TRIANGLES, this.preview.edge.realIndexCount, gl.UNSIGNED_INT, 0);  // draw selected lines
      }
   } */
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



DraftBench.prototype.updateCentroid = function(snapshot) {
   // done, update shader data, should we update each vertex individually?
   const centroids = this.preview.centroid.buf.data.subarray(0, this.preview.centroid.buf.len)
   this.preview.shaderData.uploadAttribute('position', this.position.usedSize*4, centroids);
};


/*DraftBench.prototype.updatePosition = function() {
   // todo: we really should update as little as possible.
   const vertices = this.position.buffer.subarray(0, this.position.usedSize);
   this.preview.shaderData.uploadAttribute('position', 0, vertices);
};*/


DraftBench.prototype.selectFace = function(polygon, toggleOn) {
   if (toggleOn) {
      if ((this.preview.face.selected[polygon.index] & 1) === 0) {
         this.preview.face.indexLenth += polygon.numberOfVertex * 3;
         this.preview.face.selected[polygon.index] |= 1;
         this.preview.face.isAltered = true;
         if (this.preview.face.selected[polygon.index] & 2) { // now we are both hilite and selected
            this.hilite.color = DraftBench.theme.selectedHilite;
         }
      }
   } else {
      if ((this.preview.face.selected[polygon.index] & 1) === 1) {
         this.preview.face.indexLenth -= polygon.numberOfVertex * 3;
         this.preview.face.selected[polygon.index] &= ~1;
         this.preview.face.isAltered = true;
         if (this.preview.face.selected[polygon.index] & 2) { // now we are both hilite and unselected
            this.hilite.color = DraftBench.theme.unselectedHilite;
         }
      }
   }
};

DraftBench.prototype.resetSelectFace = function() {
   this.preview.face.selected.fill(0);            // reset all polygon to non-selected 
   this.preview.face.indexLenth = 0;
   this.preview.face.visibleLength = 0;
   this.preview.face.isAltered = true;
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