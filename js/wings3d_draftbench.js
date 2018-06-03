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
import {BoundingSphere} from './wings3d_boundingvolume';
import {WingedTopology, MeshAllocator} from './wings3d_wingededge';
import * as View from './wings3d_view';
import * as Wings3D from './wings3d';
import {EditCommand} from './wings3d_undo';


const DraftBench = function(defaultSize = 2048) {  // should only be created by View
   this.allocMesh = new MeshAllocator(defaultSize);
   this.lastPreviewSize = { vertices: 0, edges: 0, faces: 0};
   this.boundingSpheres = [];
   this.hilite = {index: null, indexLength: 0, numberOfTriangles: 0};  // the hilite index triangle list.

   this.preview = {centroid: {},};
   this.preview.shaderData = gl.createShaderData();
   this.preview.shaderData.setUniform4fv("faceColor", [0.5, 0.5, 0.5, 1.0]);
   this.preview.shaderData.setUniform4fv("selectedColor", [1.0, 0.0, 0.0, 1.0]);
   var layoutVec = ShaderData.attribLayout();
   var layoutFloat = ShaderData.attribLayout(1);
   this.preview.shaderData.createAttribute('position', layoutVec, gl.STATIC_DRAW);
   this.preview.shaderData.createAttribute('barycentric', layoutVec, gl.STATIC_DRAW);
   this.preview.shaderData.createAttribute('selected', layoutFloat, gl.DYNAMIC_DRAW);
   this._resizeBoundingSphere(0);
   this._resizePreview(0, 0);

   // previewEdge
   this.previewEdge = {};
   this.previewEdge.shaderData = gl.createShaderData();
   this.previewEdge.shaderData.setUniform4fv("selectedColor", [1.0, 0.0, 0.0, 1.0]);
   this.previewEdge.shaderData.setUniform4fv('hiliteColor', [0.0, 1.0, 0.0, 1.0]);
   this.previewEdge.shaderData.createAttribute('position', layoutVec, gl.STATIC_DRAW);
   this.previewEdge.shaderData.createAttribute('color', layoutFloat, gl.DYNAMIC_DRAW);
   this._resizePreviewEdge(0);

   // previewVertex
   this.previewVertex = {};
   this.previewVertex.shaderData = gl.createShaderData();
   this.previewVertex.shaderData.setUniform4fv("selectedColor", [1.0, 0.0, 0.0, 1.0]);
   this.previewVertex.shaderData.setUniform4fv('hiliteColor', [0.0, 1.0, 0.0, 1.0]);
   this.previewVertex.shaderData.createAttribute('position', layoutVec, gl.STATIC_DRAW);
   this.previewVertex.shaderData.createAttribute('color', layoutFloat, gl.DYNAMIC_DRAW);
   this._resizePreviewVertex(0);
   // body state.
   this.previewBody = {hilite: false};
};

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

// free webgl buffer.
DraftBench.prototype.freeBuffer = function() {
   this.preview.shaderData.freeAllAttributes();
   this.preview.shaderData =  null;
   this.previewEdge.shaderData.freeAllAttributes();
   this.previewEdge.shaderData = null;
   this.previewVertex.shaderData.freeAllAttributes();
   this.previewVertex.shaderData = null;
};

DraftBench.prototype.updatePreview = function() {
   this._resizeBoundingSphere();
   this._resizePreview();
   this._resizePreviewEdge();
   this._resizePreviewVertex();
   this._updatePreviewSize();
   this._updateAffected(this.allocMesh.affected);
};


DraftBench.prototype._resizeBoundingSphere = function() {
   let oldSize = this.lastPreviewSize.faces
   let size = this.allocMesh.faces.length - oldSize;
   if (size > 0) {   // we only care about growth for now
      if (oldSize > 0) {
         if (this.preview.centroid.buf.data.length < (this.preview.centroid.buf.len+(size*3))) {
            // needs to resize, and copy
            const buf = new ArrayBuffer(this.allocMesh.faces.length * 3 * Float32Array.BYTES_PER_ELEMENT * 2);
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
         const buf = new ArrayBuffer(this.allocMesh.faces.length * 3 * Float32Array.BYTES_PER_ELEMENT * 2); // twice the current size
         this.preview.centroid.buf = {buffer: buf, data: new Float32Array(buf), len: 0};
         // assign a boundingsphere for each polygon.
         this.boundingSpheres = new Array(this.allocMesh.faces.length);
         this.boundingSpheres.length = 0;
      }
      // create New, should not have deleted sphere to mess up things
      const centroid = this.preview.centroid;   // 
      for (let i = oldSize; i < this.allocMesh.faces.length; ++i) {
         const center = new Float32Array(centroid.buf.buffer, Float32Array.BYTES_PER_ELEMENT*centroid.buf.len, 3);
         centroid.buf.len += 3;
         const polygon = this.allocMesh.faces[i];
         //polygon.index = i; // recalibrate index for free.
         this.boundingSpheres.push( BoundingSphere.create(polygon, center) );
      }
      // vertices is geometry data + centroid data.
   }
};

DraftBench.prototype._resizePreview = function() {
   let oldSize = this.lastPreviewSize.vertices;
   let oldCentroidSize = this.lastPreviewSize.faces;

   const size = this.allocMesh.vertices.length - oldSize;
   const centroidSize = this.allocMesh.faces.length - oldCentroidSize;
   if ((size > 0) || (centroidSize > 0)) {
      const model = this;
      let length = model.allocMesh.buf.data.length;
      let centroidLength = model.preview.centroid.buf.data.length;
      if (oldSize > 0) {
         if (length > model.preview.barycentric.length) {
            // create new length
            model.preview.barycentric = new Float32Array(length);
            let selected = new Float32Array(length/3);
            selected.set(model.preview.selected);
            model.preview.selected = selected;
         }
         if (centroidLength > model.preview.centroid.barycentric.length) {
            model.preview.centroid.barycentric = new Float32Array(centroidLength);
            let selected = new Float32Array(centroidLength/3);
            selected.set(model.preview.centroid.selected);
            model.preview.centroid.selected = selected;
         }
      } else { // brand new
         // created array
         model.preview.barycentric = new Float32Array(length);
         model.preview.selected = new Float32Array(length/3);
      
         model.preview.centroid.barycentric = new Float32Array(centroidLength);
         model.preview.centroid.selected = new Float32Array(centroidLength/3);
      }
      model.preview.barycentric.set(DraftBench.CONST.BARYCENTRIC);
      model.preview.selected.fill(0.0, oldSize);
      model.preview.centroid.barycentric.fill(1.0);
      model.preview.centroid.selected.fill(0.0, oldCentroidSize);
      // upload the data to webgl
      length = this.allocMesh.buf.len;
      centroidLength = this.preview.centroid.buf.len;
      model.preview.shaderData.resizeAttribute('position', (length+centroidLength)*4);
      model.preview.shaderData.uploadAttribute('position', 0, this.allocMesh.buf.data.subarray(0, length));
      model.preview.shaderData.uploadAttribute('position', length*4, this.preview.centroid.buf.data.subarray(0, centroidLength));
      model.preview.shaderData.resizeAttribute('barycentric', (length+centroidLength)*4);
      model.preview.shaderData.uploadAttribute('barycentric', 0, this.preview.barycentric.subarray(0, length));
      model.preview.shaderData.uploadAttribute('barycentric', length*4, this.preview.centroid.barycentric.subarray(0, centroidLength));
      length /= 3;
      centroidLength /= 3;
      model.preview.shaderData.resizeAttribute('selected', (length+centroidLength) * 4);
      model.preview.shaderData.uploadAttribute('selected', 0, this.preview.selected.subarray(0, length));
      model.preview.shaderData.uploadAttribute('selected', length*4, this.preview.centroid.selected.subarray(0, centroidLength));
      // invalidate hilite
      model.hilite.indexLength = 0;
   }
      
   // compute index.
   this._computePreviewIndex();
};

DraftBench.prototype._computePreviewIndex = function() {
   this.numberOfTriangles = this.allocMesh.faces.reduce( function(acc, element) {
      return acc + element.numberOfVertex; // -2; for half the vertex
   }, 0);
   const index = new Uint32Array( this.numberOfTriangles*3 );
   let length = 0;
   // recompute all index. (no optimization unless prove to be bottleneck)
   let barycentric = this.allocMesh.vertices.length;
   for (let sphere of this.boundingSpheres) {
      if (sphere.isLive()) {     // skip over deleted sphere.
         const polygon = sphere.polygon;
         //sphere.indexStart = model.preview.index.length;
         let indicesLength = 0;
         polygon.eachEdge( function(edge) {
            const vertex = edge.origin;
            if (indicesLength > 0) {
               index[length+indicesLength++] = vertex.index;
               index[length+indicesLength++] = barycentric; 
            }
            index[length+indicesLength++] = vertex.index;         
         });
         // last triangle using the first vertices.
         index[length+indicesLength++] = index[length];
         index[length+indicesLength++] = barycentric;
         length += indicesLength;
         //sphere.indexEnd = model.preview.index.length;
      }
      barycentric++;
   }
   // save it to the buffer 
   this.preview.shaderData.setIndex(index);
   this.preview.index = index;
   this.preview.indexLength = length;
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
   let barycentric = this.allocMesh.vertices.length + polygon.index;
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

   const size = this.allocMesh.edges.length - oldSize;
   if (size > 0) {
      if (oldSize > 0) {
         let line = new Float32Array(this.allocMesh.edges.length*2*3);
         line.set(this.previewEdge.line);
         this.previewEdge.line = line;
         let color = new Float32Array(this.allocMesh.edges.length*2);
         color.set(this.previewEdge.color);
         this.previewEdge.color = color;
      } else { // brand new
         this.previewEdge.line = new Float32Array(this.allocMesh.edges.length*2*3);
         this.previewEdge.color = new Float32Array(this.allocMesh.edges.length*2);
      }
      for (let i = oldSize, j=(oldSize*2*3); i < this.allocMesh.edges.length; i++) {
         let wingedEdge = this.allocMesh.edges[i];
         for (let halfEdge of wingedEdge) {
            if (wingedEdge.isLive()) {
               this.previewEdge.line.set(halfEdge.origin.vertex, j);
            } else {
               this.previewEdge.line.fill(0.0, j, j+3);
            }
            j += 3;
         }
      }
      //
      this.previewEdge.color.fill(0.0, oldSize*2);
      // update GPU
      this.previewEdge.shaderData.resizeAttribute('position', this.previewEdge.line.length*4);
      this.previewEdge.shaderData.uploadAttribute('position', 0, this.previewEdge.line);
      this.previewEdge.shaderData.resizeAttribute('color', this.previewEdge.color.length*4);
      this.previewEdge.shaderData.uploadAttribute('color', 0, this.previewEdge.color);
   }
};


DraftBench.prototype._resizePreviewVertex = function() {
   const oldSize = this.lastPreviewSize.vertices;
   const length = this.allocMesh.vertices.length;
   const size = length - oldSize;
   if (size > 0) {
      const preview = this.previewVertex;
      const color = new Float32Array(length);
      if (oldSize > 0) {
         color.set(preview.color);
      }
      color.fill(0.0, oldSize);
      preview.color = color;
      // 
      preview.shaderData.resizeAttribute('position', length*4*3);
      preview.shaderData.uploadAttribute('position', 0, this.allocMesh.buf.data.subarray(0, length*3));
      preview.shaderData.resizeAttribute('color', length*4);
      preview.shaderData.uploadAttribute('color', 0, preview.color);
   }
   // rebuild index.
   const index = new Uint32Array(length);
   let j = 0;
   for (let i = 0; i < length; ++i) {
      if (this.allocMesh.vertices[i].isLive()) {
         index[j++] = i;
      }
   }
   // 
   this.previewVertex.shaderData.setIndex(index);
   this.previewVertex.indexLength = j;
};


DraftBench.prototype._updatePreviewSize = function() {
   this.lastPreviewSize.vertices = this.allocMesh.vertices.length;
   this.lastPreviewSize.edges = this.allocMesh.edges.length;
   this.lastPreviewSize.faces = this.allocMesh.faces.length;
};


DraftBench.prototype._updateAffected = function(affected) {
   if (affected.vertices.size > 0) {
      for (let vertex of affected.vertices) {
         this._updateVertex(vertex, affected);
      }
   }
   if (affected.edges.size > 0) {
      for (let edge of affected.edges) {
         this._updatePreviewEdge(edge.left, true);
      }
   }
   if (affected.faces.size > 0) {
      for (let face of affected.faces) {
         this._updatePreviewFace(face);
      }
      // update index

   }

   this.allocMesh.clearAffected();
};

DraftBench.prototype._updateVertex = function(vertex, affected) {
   if (vertex.isLive()) {
      // first the simple case, update the vertexPreview,
      const index = vertex.index;
      this.previewVertex.shaderData.uploadAttribute('position', vertex.vertex.byteOffset, vertex.vertex);

      // then update the effectedEdge and effectedFaces.
//      vertex.eachOutEdge( function(halfEdge) {
//         if (!affected.edges.has(halfEdge.wingedEdge)) {    // check edge
//            affected.edges.add(halfEdge.wingedEdge);        // should not happened, for debugging purpose.
//         }
      //   const face = halfEdge.face;
      //   if ((face!==null) && !affected.faces.has(face)) {  // check face
      //      affected.faces.add(face);               // should not happened, for debugging purpose.
      //   }
//      });

      // update preview too.
      this.preview.shaderData.uploadAttribute('position', vertex.vertex.byteOffset, vertex.vertex);
   }
};

DraftBench.prototype._updatePreviewFace = function(polygon) {
   // recompute boundingSphere centroid, and if numberOfVertex changed, needs to recompute index.
   if ((polygon.index < this.boundingSpheres.length) && polygon.isLive()) { // will be get recompute on resize
      const sphere = this.boundingSpheres[ polygon.index ];
      sphere.setSphere( BoundingSphere.computeSphere(sphere.polygon, sphere.center) ); 
      // update center.
      const index = this.allocMesh.vertices.length+polygon.index;
      this.preview.shaderData.uploadAttribute('position', index*3*4, sphere.center);
   }
};


DraftBench.prototype._updatePreviewEdge = function(edge, updateShader) {
   const wingedEdge = edge.wingedEdge;
   if (wingedEdge.isLive()) {
      const index = wingedEdge.index * 6; // 2*3
      this.previewEdge.line.set(edge.origin.vertex, index);
      this.previewEdge.line.set(edge.pair.origin.vertex, index+3);

      if (updateShader) {
         this.previewEdge.shaderData.uploadAttribute('position', index*4, this.previewEdge.line.subarray(index, index+6));
      }
   } else {    // deleted edge. deselcted, dehilite.
      const index = wingedEdge.index*2;
      const color = this.previewEdge.color.subarray(index, index+2);
      color.fill(0.0);
      //this.previewEdge.color.fill(0.0, wingedEdge.index, wingedEdge.index+2);

      //if (updateShader) {
         this.previewEdge.shaderData.uploadAttribute('color', index*4, color);
      //}
   }
};


DraftBench.prototype.hiliteFace = function(polygon, isHilite) {
   if (isHilite) {   // show
      this._computeFaceHiliteIndex(polygon);
   } else { // hide
      this.hilite.indexLength = 0;
   }
};

DraftBench.prototype.hiliteBody = function(faceGroup, isHilite) {
   if (isHilite) { // show
      this._computeGroupHiliteIndex(faceGroup);
   } else { // hide 
      this.hilite.indexLength = 0;
   }
};


// drawing routines -- draw selected polygon first, then draw unselected one, this is offseted
DraftBench.prototype.draw = function(gl) {
   // draw using index
   try {
      gl.bindShaderData(this.preview.shaderData);
      gl.drawElements(gl.TRIANGLES, this.preview.indexLength, gl.UNSIGNED_INT, 0);
   } catch (e) {
      console.log(e);
   }
};

// draw hilite polygon. not offset
DraftBench.prototype.drawHilite = function(gl) {
   if (this.hilite.indexLength == 0) {
      return;
   }
   // set hilite color and hilite index
   this.preview.shaderData.setIndex(this.hilite.index);
   this.preview.shaderData.setUniform4fv("faceColor", [0.0, 1.0, 0.0, 0.35]);
   gl.bindShaderData(this.preview.shaderData);
   gl.drawElements(gl.TRIANGLES, this.hilite.indexLength, gl.UNSIGNED_INT, 0);
   // restore color and index
   this.preview.shaderData.setIndex(this.preview.index);
   this.preview.shaderData.setUniform4fv("faceColor", [0.5, 0.5, 0.5, 1.0]);
};

// draw vertex, select color, 
DraftBench.prototype.drawVertex = function(gl) {
   // drawing using vertex array
   try {
      gl.bindShaderData(this.previewVertex.shaderData);
      //gl.drawArrays(gl.POINTS, 0, this.allocMesh.vertices.length);
      gl.drawElements(gl.POINTS, this.previewVertex.indexLength, gl.UNSIGNED_INT, 0);
   } catch (e) {
      console.log(e);
   }
};

// draw edge, select color
DraftBench.prototype.drawEdge = function(gl) {
   gl.bindShaderData(this.previewEdge.shaderData);
   gl.drawArrays(gl.LINES, 0, this.previewEdge.line.length/3);
}


DraftBench.prototype.selectGroup = function(selection, isOn) {
   const noSelection = new Set;
   for (let polygon of selection) {
      if (isOn) {
         this.setFaceSelectionOn(polygon);
      } else {
         this.setFaceSelectionOff(polygon, noSelection);
      }
   }
};


DraftBench.prototype.resetBody = function(bodyGroup) {
   this.selectGroup(bodyGroup, false);    // turn group off.
};


DraftBench.prototype.uploadFacePreview = function() {

};

DraftBench.prototype.uploadEdgePreview = function() {
   this.previewEdge.shaderData.uploadAttribute('color', 0, this.previewEdge.color);
};

DraftBench.prototype.uploadVertexPreview = function() {
   //if (this.locked) {
      this.previewVertex.shaderData.uploadAttribute('color', 0, this.previewVertex.color);
      //this.locked = false;
   //}
};


DraftBench.prototype.setVertexColor = function(vertex, color, groupSelection) {
   // selected color
   const j = vertex.index;  
   this.previewVertex.color[j] += color;
   if (!groupSelection) {
      const point = this.previewVertex.color.subarray(j, j+1);
      this.previewVertex.shaderData.uploadAttribute('color', j*Float32Array.BYTES_PER_ELEMENT, point);
   }
};

DraftBench.prototype.resetSelectVertex = function() {
   // zeroout the edge seleciton.
   this.previewVertex.color.fill(0.0);
   this.previewVertex.shaderData.uploadAttribute('color', 0, this.previewVertex.color);
};

DraftBench.prototype.setEdgeColor = function(wingedEdge, color, groupSelection) {
   // selected color
   const j = wingedEdge.index * 2;  
   this.previewEdge.color[j] += color;
   this.previewEdge.color[j+1] += color;
   if (!groupSelection) {
      const line = this.previewEdge.color.subarray(j, j+2);
      this.previewEdge.shaderData.uploadAttribute('color', j*Float32Array.BYTES_PER_ELEMENT, line);
   }
};

DraftBench.prototype.resetSelectEdge = function() {
   // zeroout the edge seleciton.
   this.previewEdge.color.fill(0.0);
   this.previewEdge.shaderData.uploadAttribute('color', 0, this.previewEdge.color);
};

DraftBench.prototype.updateWEdges = function(wingedEdges) {
   // update the edges.vertex
   for (let wingedEdge of wingedEdges) {
      let index = wingedEdge.index * 2 * 3;
      for (let halfEdge of wingedEdge) {
         this.previewEdge.line.set(halfEdge.origin.vertex, index);
         index += 3;
      }
   }
   this.previewEdge.shaderData.uploadAttribute('position', 0, this.previewEdge.line);
}

DraftBench.prototype.updateCentroid = function(snapshot) {
   // done, update shader data, should we update each vertex individually?
   const centroids = this.preview.centroid.buf.data.subarray(0, this.preview.centroid.buf.len)
   this.preview.shaderData.uploadAttribute('position', this.allocMesh.buf.len*4, centroids);
};


DraftBench.prototype.updatePosition = function() {
   // todo: we really should update as little as possible.
   const vertices = this.allocMesh.buf.data.subarray(0, this.allocMesh.buf.len);
   this.preview.shaderData.uploadAttribute('position', 0, vertices);
   this.previewVertex.shaderData.uploadAttribute('position', 0, vertices);
};

DraftBench.prototype.setFaceSelectionOff = function(polygon, selectedSet) {
   var self = this;
   var selected = this.preview.selected;    // filled triangle's selection status.
   polygon.eachVertex( function(vertex) {
      // restore drawing color
      var vertexSelected = false;
      vertex.eachOutEdge( function(edge) {
         if (edge.isNotBoundary() && (edge.face !== polygon) && selectedSet.has(edge.face)) {
            vertexSelected = true;
         }
      }); 
      if (vertexSelected === false) {  // no more sharing, can safely reset
         selected[vertex.index] = 0.0;
         self.preview.shaderData.uploadAttribute('selected', vertex.index*4, DraftBench.CONST.SELECTOFF);
      }
   });
   selected = this.preview.centroid.selected;
   selected[polygon.index]= 0.0;
   var byteOffset = (this.allocMesh.vertices.length+polygon.index)*4;
   this.preview.shaderData.uploadAttribute("selected", byteOffset, DraftBench.CONST.SELECTOFF);
};
DraftBench.prototype.setFaceSelectionOn = function(polygon) {
   var self = this;
   var selected = this.preview.selected;      // filled triangle's selection status.
   // set the drawing color
   polygon.eachVertex( function(vertex) {
      selected[vertex.index] = 1.0;
      self.preview.shaderData.uploadAttribute('selected', vertex.index*4, DraftBench.CONST.SELECTON);
   });
   selected = this.preview.centroid.selected;
   selected[polygon.index]= 1.0;
   var byteOffset = (this.allocMesh.vertices.length+polygon.index)*4;
   this.preview.shaderData.uploadAttribute("selected", byteOffset, DraftBench.CONST.SELECTON);
};

DraftBench.prototype.resetSelectFace = function() {
   this.preview.selected.fill(0.0);          // reset all polygon to non-selected 
   this.preview.centroid.selected.fill(0.0);
   var length = this.allocMesh.buf.len/3;
   this.preview.shaderData.uploadAttribute("selected", 0, this.preview.selected.subarray(0, length));
   var centroidLength = this.preview.centroid.buf.len/3;
   this.preview.shaderData.uploadAttribute('selected', length*4, this.preview.centroid.selected.subarray(0, centroidLength));
};


DraftBench.prototype.hide = function(faceGroup) {
   for (let polygon of faceGroup) {
      this.boundingSpheres[polygon.index].isVisible = false;
   }
};

DraftBench.prototype.show = function(faceGroup) {
   for (let polygon of faceGroup) {
      this.boundingSpheres[polygon.index].isVisible = true;
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