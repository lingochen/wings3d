//
// strategy:
//    use GPU as much as possible. multiple passes for drawing. we have more than enough GPU power.
//
//    update as little as possible on cpu side. 
//
// todo:
//    first pass: draw line (select, unselected) first (using triangles). 
//
//    second pass: draw polygon (selected, unseleced) using slightly optimized index.
//
//    third pass?: draw vertex.
//
//    last pass: draw hilite (line, polygon, or vertex).
//
"use strict";
import {gl, ShaderData} from './wings3d_gl';
import * as ShaderProg from './wings3d_shaderprog';
import * as Util from './wings3d_util';
import {BoundingSphere} from './wings3d_boundingvolume';
import {MeshAllocator} from './wings3d_wingededge';
import {EditCommand} from './wings3d_undo';


const DraftBench = function(theme, prop, defaultSize = 2048) {  // should only be created by View
   MeshAllocator.call(this, defaultSize); // constructor.
  
   this.lastPreviewSize = { vertices: 0, edges: 0, faces: 0};
   this.boundingSpheres = [];
   this.hilite = {index: null, indexLength: 0, numberOfTriangles: 0};  // the hilite index triangle list.
   this.numberOfTriangles = 0;

   this.preview = {centroid: {},};
   this.preview.shaderData = gl.createShaderData();
   //this.preview.shaderData.setUniform4fv("faceColor", [0.5, 0.5, 0.5, 1.0]);
   //this.preview.shaderData.setUniform4fv("selectedColor", [1.0, 0.0, 0.0, 1.0]);
   var layoutVec = ShaderData.attribLayout();
   var layoutFloat = ShaderData.attribLayout(1);
   this.preview.shaderData.createAttribute('position', layoutVec, gl.STATIC_DRAW);
   this.preview.shaderData.createAttribute('barycentric', layoutVec, gl.STATIC_DRAW);
   this._resizeBoundingSphere(0);
   this._resizePreview(0, 0);
   this.setTheme(theme, prop);

   // previewEdge
   this.preview.edge = {};
   this.preview.edge.isModified = false;
   this.preview.edge.indexCount = 0;
   this.preview.edge.hilite = {indexCount: 0, wEdge: null};
   this.preview.edge.hardness = {isModified: false, indexCount: 0};
   this._resizePreviewEdge(0);

   // previewVertex
   this.preview.vertex = {isModified: false, min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER};
   this.preview.shaderData.createAttribute('color', layoutFloat, gl.DYNAMIC_DRAW);
   this._resizePreviewVertex(0);
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

   constant.SELECTON  = new Float32Array(1);
   constant.SELECTON[0] = 1.0;
   constant.SELECTOFF = new Float32Array(1);
   constant.SELECTOFF[0] = 0.0;
   constant.BARYCENTRIC = new Float32Array(3);
   constant.BARYCENTRIC[0] = 1.0;
   constant.BARYCENTRIC[1] = 0.0;
   constant.BARYCENTRIC[2] = 1.0;
   return constant;
}());


// draftBench inherited from MeshAllocator, so we canintercept freeXXX and allocXXX call easier. It also makes logical sense.
DraftBench.prototype = Object.create(MeshAllocator.prototype);


/**
 * 
 */
DraftBench.prototype.setTheme = function(theme, pref) {
   Object.entries(theme).forEach(([key, value]) => {
      // put the hext value to shader
      this.preview.shaderData.setUniform4fv(key, Util.hexToRGBA(value));
      DraftBench.theme[key] = Util.hexToRGBA(value);     // to be deleted
    });
   // set pref
   Object.entries(pref).forEach(([key, value]) => {
      DraftBench.pref[key] = value;
    });
   // manual update
   const manualKeys = ['vertexSize', 'selectedVertexSize', 'maskedVertexSize'];
   for (let key of manualKeys) {
      this.preview.shaderData.setUniform1f(key, pref[key]);
   }
};

// free webgl buffer.
DraftBench.prototype.freeBuffer = function() {
   this.preview.shaderData.freeAllAttributes();
   this.preview.shaderData =  null;
   this.previewEdge.shaderData.freeAllAttributes();
   this.previewEdge.shaderData = null;
};

DraftBench.prototype.updatePreview = function() {
   this._resizeBoundingSphere();
   this._resizePreview();
   this._resizePreviewEdge();
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
      const model = this;
      let length = model.buf.data.length;
      let centroidLength = model.preview.centroid.buf.data.length;
      if (oldSize > 0) {
         if (length > model.preview.barycentric.length) {
            // create new length
            model.preview.barycentric = new Float32Array(length);
            let selected = new Uint8Array(length/3);
            selected.set(model.preview.selected);
            model.preview.selected = selected;
         }
         if (centroidLength > model.preview.centroid.barycentric.length) {
            model.preview.centroid.barycentric = new Float32Array(centroidLength);
         }
      } else { // brand new
         // created array
         model.preview.barycentric = new Float32Array(length);
         model.preview.selected = new Uint8Array(length/3);
         model.preview.selectedCount = 0;
      
         model.preview.centroid.barycentric = new Float32Array(centroidLength);
      }
      model.preview.barycentric.set(DraftBench.CONST.BARYCENTRIC);
      model.preview.selected.fill(0, oldSize);
      model.preview.centroid.barycentric.fill(1.0);
      // upload the data to webgl
      length = this.buf.len;
      centroidLength = this.preview.centroid.buf.len;
      model.preview.shaderData.resizeAttribute('position', (length+centroidLength)*4);
      model.preview.shaderData.uploadAttribute('position', 0, this.buf.data.subarray(0, length));
      model.preview.shaderData.uploadAttribute('position', length*4, this.preview.centroid.buf.data.subarray(0, centroidLength));
      model.preview.shaderData.resizeAttribute('barycentric', (length+centroidLength)*4);
      model.preview.shaderData.uploadAttribute('barycentric', 0, this.preview.barycentric.subarray(0, length));
      model.preview.shaderData.uploadAttribute('barycentric', length*4, this.preview.centroid.barycentric.subarray(0, centroidLength));
      // invalidate hilite
      model.hilite.indexLength = 0;
      this.preview.isModified = true;
   }
      
   // compute index
   if (this.preview.isModified) {
      this._computePreviewIndex();
   }
};

DraftBench.prototype._computePreviewIndex = function() {
   this.numberOfTriangles = this.faces.reduce( function(acc, element) {
      return acc + element.numberOfVertex; // -2; for half the vertex
   }, 0);
   this.preview.indexLength = this.numberOfTriangles * 3;
};

DraftBench.prototype._computeFaceHiliteIndex = function(polygon, offset) {
   if (this.hilite.numberOfTriangles < polygon.numberOfVertex) {
      this.hilite.numberOfTriangles = polygon.numberOfVertex;
      this.hilite.index = new Uint32Array(this.hilite.numberOfTriangles*3);
   }
   if (offset === undefined) {
      offset = 0;
   }
   let index = polygon.index;
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


DraftBench.prototype._resizePreviewEdge = function() {
   let oldSize = this.lastPreviewSize.edges;

   const size = this.edges.length - oldSize;
   if (size > 0) {
      let color = new Uint8Array(this.edges.length);
      if (oldSize > 0) {    
         color.set(this.preview.edge.color);
      }
      this.preview.edge.color = color;
      // fill with nothing
      this.preview.edge.color.fill(0.0, oldSize);
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
      color.fill(0.0, oldSize);
      preview.color = color;
      // 
      this.preview.shaderData.resizeAttribute('color', length*4);
      this.preview.shaderData.uploadAttribute('color', 0, preview.color);
   }
   // rebuild index.
   const index = new Uint32Array(length);
   let j = 0;
   for (let i = 0; i < length; ++i) {
      if (this.vertices[i].isLive()) {
         index[j++] = i;
      }
   }
   // 
   this.preview.shaderData.setIndex('vertex', index);
   this.preview.vertex.indexLength = j;
};


DraftBench.prototype._updatePreviewSize = function() {
   this.lastPreviewSize.vertices = this.vertices.length;
   this.lastPreviewSize.edges = this.edges.length;
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
      if ((this.preview.selected[polygon.index] & 1) === 1) {
         this.hilite.color = DraftBench.theme.selectedHilite;
      }
      this.preview.selected[polygon.index] |= 2;
      this._computeFaceHiliteIndex(polygon);
   } else { // hide
      this.hilite.indexLength = 0;
      this.preview.selected[polygon.index] &= ~2;
   }
};

DraftBench.prototype.hiliteBody = function(faceGroup, isHilite) {
   if (isHilite) { // show
      let checkColor = true;
      this.hilite.color = DraftBench.theme.unselectedHilite;
      for (let polygon of faceGroup) {
         if (checkColor && ((this.preview.selected[polygon.index] & 1) === 1)) {
            this.hilite.color = DraftBench.theme.selectedHilite;  // unnecessary assignment
            checkColor = false;
         }
         this.preview.selected[polygon.index] |= 2;
      }
      this._computeGroupHiliteIndex(faceGroup);
   } else { // hide 
      this.hilite.indexLength = 0;
      for (let polygon of faceGroup) { // clear flag
         this.preview.selected[polygon.index] &= ~2;
      }
   }
};


/**
 * polygon drawing routines. draw selected polygon first then draw unselected one. 
 * 
 * @param {gl} - drawing context.
 * 
 */
DraftBench.prototype.draw = function(gl) {
   // draw selected polygon first if application
   const indexLength = this.preview.indexLength - this.preview.selectedCount;
   // first check index modification
   if (this.preview.isModified) {
      const selection = new Uint32Array(this.preview.selectedCount);
      let k = 0;
      const index = new Uint32Array(indexLength);
      let j = 0;
      for (let i = 0; i < this.faces.length; ++i) {
         const polygon = this.faces[i];
         if (polygon.isLive()) {
            const center = i + this.vertices.length;
            if (this.preview.selected[i] & 1) {
               k = polygon.buildIndex(selection, k, center);
            } else {
               j = polygon.buildIndex(index, j, center);
            }
         }
      }
      // check(k === selection.length);
      // check(j === index.length);
      this.preview.shaderData.setIndex('face', index);
      this.preview.shaderData.setIndex('selectedFace', selection);
      this.preview.isModified = false;
   }
   
   // draw faceSelected if not empty
   let bindPosition = false;
   if (this.preview.selectedCount > 0) {
      gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
      this.preview.shaderData.setUniform4fv('color', DraftBench.theme.edgeColor);
      this.preview.shaderData.setUniform1f('lineWidth', DraftBench.pref.edgeWidth);
      bindPosition = true;
      this.preview.shaderData.setUniform4fv('faceColor', DraftBench.theme.selectedColor);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'selectedFace');
      gl.drawElements(gl.TRIANGLES, this.preview.selectedCount, gl.UNSIGNED_INT, 0);
   }
   if (indexLength > 0) {  // draw normal
      if (!bindPosition) {
         gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
         this.preview.shaderData.setUniform4fv('color', DraftBench.theme.edgeColor);
         this.preview.shaderData.setUniform1f('lineWidth', DraftBench.pref.edgeWidth);
         bindPosition = true;
      }
      this.preview.shaderData.setUniform4fv('faceColor', DraftBench.theme.faceColor);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'face');
      gl.drawElements(gl.TRIANGLES, indexLength, gl.UNSIGNED_INT, 0);
   }
};
/*
// drawing routines -- draw selected polygon first, then draw unselected one, this is offseted
DraftBench.prototype.draw = function(gl) {
   // draw using index
   try {
      gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric', 'selected']);
      gl.bindUniform(this.preview.shaderData, ['faceColor', 'selectedColor']);
      gl.bindIndex(this.preview.shaderData, 'face');
      gl.drawElements(gl.TRIANGLES, this.preview.indexLength, gl.UNSIGNED_INT, 0);
   } catch (e) {
      console.log(e);
   }
};*/

// draw hilite polygon. not offset
DraftBench.prototype.drawHilite = function(gl) {
   if (this.hilite.indexLength == 0) {
      return;
   }
   // set hilite color and hilite index
   this.preview.shaderData.setUniform4fv("faceColor", this.hilite.color);
   gl.bindAttribute(this.preview.shaderData, ['position']);
   gl.bindUniform(this.preview.shaderData, ['faceColor']);
   gl.bindIndex(this.preview.shaderData, 'faceHilite');
   gl.drawElements(gl.TRIANGLES, this.hilite.indexLength, gl.UNSIGNED_INT, 0);
   // restore color
   this.preview.shaderData.setUniform4fv("faceColor", DraftBench.theme.faceColor);
};

// draw vertex, select color, 
DraftBench.prototype.drawVertex = function(gl) {
   // drawing using vertex array
   try {
      if (this.preview.vertex.isModified) {  // upload min  - max
         this.preview.vertex.isModified = false;
         const i = this.preview.vertex.min;
         const j = this.preview.vertex.max;
         const points = this.preview.vertex.color.subarray(i, j+1);
         this.preview.shaderData.uploadAttribute('color', i*Float32Array.BYTES_PER_ELEMENT, points);
      }
      gl.bindAttribute(this.preview.shaderData, ['position', 'color']);
      gl.bindUniform(this.preview.shaderData, ['vertexSize', 'selectedVertexSize', 'maskedVertexSize',
                                               'vertexColor', 'selectedColor', 'unselectedHilite', 'selectedHilite', 'maskedVertexColor']);
      gl.bindIndex(this.preview.shaderData, 'vertex');
      gl.drawElements(gl.POINTS, this.preview.vertex.indexLength, gl.UNSIGNED_INT, 0);
   } catch (e) {
      console.log(e);
   }
};

/**
 * 
 */
DraftBench.prototype.drawHardEdge = function(gl, isEdgeMode) {
   // draw hard edge if applicable.
   if (this.preview.edge.hardness.indexCount > 0) {
      if (this.preview.edge.hardness.isModified) {
         const index = new Uint32Array(this.preview.edge.hardness.indexCount);
         let j = 0;
         for (let i = 0; i < this.edges.length; ++i) {
            if (this.preview.edge.color[i] & 4) {  // yes, hardEdge
               j = this.edges[i].buildIndex(index, j, this.vertices.length);
            }
         }
         this.preview.shaderData.setIndex('hardEdge', index);
         this.preview.edge.hardness.isModified = false;
      }
      // draw HardEdge
      gl.useShader(ShaderProg.selectedColorLine);
      gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
      let lineWidth = 1.1;
      if (isEdgeMode) {
         lineWidth = DraftBench.pref.hardEdgeWidth;
      }
      this.preview.shaderData.setUniform1f("lineWidth", lineWidth);
      this.preview.shaderData.setUniform4fv("color", DraftBench.theme.hardEdgeColor);
      this.preview.shaderData.setUniform4fv('faceColor', DraftBench.theme.faceColor);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'hardEdge');
      gl.drawElements(gl.TRIANGLES, this.preview.edge.hardness.indexCount, gl.UNSIGNED_INT, 0);  // draw 1 line.
   }
}

/** 
 * draw select, hilite, and (normal) edge
 * @param {gl} - drawing context
 */
DraftBench.prototype.drawEdge = function(gl) {
   gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
   this.preview.shaderData.setUniform1f("lineWidth", DraftBench.pref.selectedEdgeWidth);

   // draw hilite first
   if (this.preview.edge.hilite.wEdge) {
      let hiliteColor = DraftBench.theme.unselectedHilite;
      const wEdge = this.preview.edge.hilite.wEdge;
      if (this.preview.edge.color[wEdge.index] & 1) { // selected?
         hiliteColor = DraftBench.theme.selectedHilite;
      }
      this.preview.shaderData.setUniform4fv("color", hiliteColor);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'edgeHilite');
      gl.drawElements(gl.TRIANGLES, this.preview.edge.hilite.indexCount, gl.UNSIGNED_INT, 0);  // draw 1 line.
   }

   // 2nd) draw selected
   if (this.preview.edge.indexCount > 0) { // draw selected edge
      if (this.preview.edge.isModified) {
         const selected = new Uint32Array( this.preview.edge.indexCount );
         let j = 0;
         for (let i = 0; i < this.edges.length; ++i) {
            const byte = this.preview.edge.color[i];
            if (byte & 1) {   // selected, draw both side
               j = this.edges[i].buildIndex(selected, j, this.vertices.length);
            }
         }
         // set the new selected.
         this.preview.shaderData.setIndex('edgeSelected', selected);
         this.preview.edge.isModified = false;
      }
      // now draw
      this.preview.shaderData.setUniform4fv('color', DraftBench.theme.selectedColor);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'edgeSelected');
      gl.drawElements(gl.TRIANGLES, this.preview.edge.indexCount, gl.UNSIGNED_INT, 0);  // draw selected lines
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



DraftBench.prototype.hiliteVertex = function(vertex, show) {
   // select polygon set color,
   if (show) {
      this.setVertexColor(vertex, 0.5);
   } else {
      this.setVertexColor(vertex, -0.5);
   }
};

DraftBench.prototype.setVertexColor = function(vertex, color) {
   // selected color
   const j = vertex.index;  
   this.preview.vertex.color[j] += color;
   if (this.preview.vertex.isModified) {
      if (j < this.preview.vertex.min) {
         this.preview.vertex.min = j;
      } else if (j > this.preview.vertex.max) {
         this.preview.vertex.max = j;
      }
   } else {
      this.preview.vertex.isModified = true;
      this.preview.vertex.min = this.preview.vertex.max = j;
   }
};

DraftBench.prototype.resetSelectVertex = function() {
   // zeroout the edge seleciton.
   this.preview.vertex.isModified = false;
   this.preview.vertex.color.fill(0.0);
   this.preview.shaderData.uploadAttribute('color', 0, this.preview.vertex.color);
};

DraftBench.prototype.hiliteEdge = function(hEdge, onOff) {
   // select polygon set color,
   if (onOff) {
      const wEdge = hEdge.wingedEdge;
      this.preview.edge.hilite.wEdge = wEdge;
      const index = new Uint32Array( 6 ); // both edge. max 2 triangle.
      wEdge.buildIndex(index, 0, this.vertices.length);
      this.preview.shaderData.setIndex('edgeHilite', index);   // update index.
      this.preview.edge.hilite.indexCount = 6;
   } else {
      this.preview.edge.hilite.wEdge = null;
      this.preview.edge.hilite.indexCount = 0;
   }
}

/**
 * toggle selection of wEdge
 * @param {WingedEdge} wEdge - target wEdge
 * @param {boolean} onOff - on/off toggle.
 */
DraftBench.prototype.selectEdge = function(wEdge, onOff) {
   if (onOff) {
      if ((this.preview.edge.color[wEdge.index] & 1) === 0) {
         this.preview.edge.color[wEdge.index] |= 1;
         this.preview.edge.indexCount += 6;
      }
   } else {
      if ((this.preview.edge.color[wEdge.index] & 1) === 1) {
         this.preview.edge.color[wEdge.index] &= ~1;
         this.preview.edge.indexCount -= 6;
      }
   }
   this.preview.edge.isModified = true;
};


DraftBench.prototype.resetSelectEdge = function() {
   // zeroout the edge seleciton.
   this.preview.edge.color.fill(0.0);
   this.preview.edge.isModified = false;
   this.preview.edge.indexCount = 0;
};


DraftBench.prototype.updateCentroid = function(snapshot) {
   // done, update shader data, should we update each vertex individually?
   const centroids = this.preview.centroid.buf.data.subarray(0, this.preview.centroid.buf.len)
   this.preview.shaderData.uploadAttribute('position', this.buf.len*4, centroids);
};


DraftBench.prototype.updatePosition = function() {
   // todo: we really should update as little as possible.
   const vertices = this.buf.data.subarray(0, this.buf.len);
   this.preview.shaderData.uploadAttribute('position', 0, vertices);
};


DraftBench.prototype.selectFace = function(polygon, toggleOn) {
   if (toggleOn) {
      if ((this.preview.selected[polygon.index] & 1) === 0) {
         this.preview.selectedCount += polygon.numberOfVertex * 3;
         this.preview.selected[polygon.index] |= 1;
         this.preview.isModified = true;
         if (this.preview.selected[polygon.index] & 2) { // now we are both hilite and selected
            this.hilite.color = DraftBench.theme.selectedHilite;
         }
      }
   } else {
      if ((this.preview.selected[polygon.index] & 1) === 1) {
         this.preview.selectedCount -= polygon.numberOfVertex * 3;
         this.preview.selected[polygon.index] &= ~1;
         this.preview.isModified = true;
         if (this.preview.selected[polygon.index] & 2) { // now we are both hilite and unselected
            this.hilite.color = DraftBench.theme.unselectedHilite;
         }
      }
   }
};

DraftBench.prototype.resetSelectFace = function() {
   this.preview.selected.fill(0);            // reset all polygon to non-selected 
   this.preview.selectedCount = 0;
   this.preview.isModified = true;
};


DraftBench.prototype.hide = function(faceGroup) {
   for (let polygon of faceGroup) {
      polygon.isVisible = false;
   }
};

DraftBench.prototype.show = function(faceGroup) {
   for (let polygon of faceGroup) {
      polygon.isVisible = true;
   }
};


/**
 * set bitmask on 3rd position. off meant soft, on meant hard
 * @param {WingedEdge} wEdge - target edge
 * @param {number} operand - 0=soft, 1=hard, 2=invert.
 */
DraftBench.prototype.setHardness = function(wEdge, operand) {
   if (operand === 0)  {   // set soft
      if (this.preview.edge.color[wEdge.index] & 4) { // make sure it hard
         this.preview.edge.color[wEdge.index] &= ~4;  // clear hardness bit
         this.preview.edge.hardness.isModified = true;
         this.preview.edge.hardness.indexCount -= 6;
         return true;
      }
   } else if (operand === 1) {   // set hard
      if ((this.preview.edge.color[wEdge.index] & 4) === 0) { // make sure it soft
         this.preview.edge.color[wEdge.index] |= 4;   // set hardness bit
         this.preview.edge.hardness.isModified = true;
         this.preview.edge.hardness.indexCount += 6;
         return true;
      }
   } else { // invert
      if (this.preview.edge.color[wEdge.index] & 4) { // it hard, turn to soft
         return this.setHardness(wEdge, 0);
      } else { // wEdge is soft turn to hard
         return this.setHardness(wEdge, 1);
      }
   }
   return false;
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
         if (polygon.isLive) {
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