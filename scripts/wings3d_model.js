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


var PreviewCage = function(mesh) {
   this.geometry = mesh;
   this.preview = {centroid: {}};
   var gl = Wings3D.gl;
   this.preview.shaderData = gl.createShaderData();
   this.preview.shaderData.setUniform3fv("faceColor", [0.5, 0.5, 0.5]);
   this.preview.shaderData.setUniform3fv("selectedColor", [1.0, 0.0, 0.0]);
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
   // selecte(Vertex,Edge,Face)here
   this.selectedSet = new Set;
   this.groupSelection = false;
   // default no name
   this.name = "";
};

PreviewCage.CONST = (function() {
   var constant = {};

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


PreviewCage.duplicate = function(originalCage) {
   // copy geometry.
   const geometry = new WingedTopology( originalCage.geometry.vertices.length*2 );
   for (let vertex of originalCage.geometry.vertices) {
      geometry.addVertex(vertex.vertex);
   }
   for (let polygon of originalCage.geometry.faces) {
      let index = [];
      polygon.eachVertex( function(vertex) {
         index.push( vertex.index );
      });
      geometry.addPolygon(index);
   }
   geometry.clearAffected();
   // new PreviewCage, and new name
   const previewCage = new PreviewCage(geometry);
   previewCage.name = originalCage.name + "_copy1";

   return previewCage;
};


PreviewCage.prototype._getGeometrySize = function() {
   return { face: this.geometry.faces.length,
            edge: this.geometry.edges.length,
            vertex: this.geometry.vertices.length
          };
};


PreviewCage.prototype._resizeBoundingSphere = function(oldSize) {
   let size = this.geometry.faces.length - oldSize;
   if (size > 0) {   // we only care about growth for now
      if (oldSize > 0) {
         if (this.preview.centroid.buf.data.length < (this.preview.centroid.buf.len+(size*3))) {
            // needs to resize, and copy
            const buf = new ArrayBuffer(this.geometry.faces.length * 3 * Float32Array.BYTES_PER_ELEMENT * 2);
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
         const buf = new ArrayBuffer(this.geometry.faces.length * 3 * Float32Array.BYTES_PER_ELEMENT * 2); // twice the current size
         this.preview.centroid.buf = {buffer: buf, data: new Float32Array(buf), len: 0};
         // assign a boundingsphere for each polygon.
         this.boundingSpheres = new Array(this.geometry.faces.length);
         this.boundingSpheres.length = 0;
      }
      // create New, should not have deleted sphere to mess up things
      const centroid = this.preview.centroid;   // 
      for (let i = oldSize; i < this.geometry.faces.length; ++i) {
         const center = new Float32Array(centroid.buf.buffer, Float32Array.BYTES_PER_ELEMENT*centroid.buf.len, 3);
         centroid.buf.len += 3;
         const polygon = this.geometry.faces[i];
         //polygon.index = i; // recalibrate index for free.
         this.boundingSpheres.push( BoundingSphere.create(polygon, center) );
      }
      // vertices is geometry data + centroid data.
   }
};

PreviewCage.prototype._resizePreview = function(oldSize, oldCentroidSize) {
   const size = this.geometry.vertices.length - oldSize;
   const centroidSize = this.geometry.faces.length - oldCentroidSize;
   if ((size > 0) || (centroidSize > 0)) {
      const model = this;
      let length = model.geometry.buf.data.length;
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
      model.preview.barycentric.set(PreviewCage.CONST.BARYCENTRIC);
      model.preview.selected.fill(0.0, oldSize);
      model.preview.centroid.barycentric.fill(1.0);
      model.preview.centroid.selected.fill(0.0, oldCentroidSize);
      // upload the data to webgl
      length = this.geometry.buf.len;
      centroidLength = this.preview.centroid.buf.len;
      model.preview.shaderData.resizeAttribute('position', (length+centroidLength)*4);
      model.preview.shaderData.uploadAttribute('position', 0, this.geometry.buf.data.subarray(0, length));
      model.preview.shaderData.uploadAttribute('position', length*4, this.preview.centroid.buf.data.subarray(0, centroidLength));
      model.preview.shaderData.resizeAttribute('barycentric', (length+centroidLength)*4);
      model.preview.shaderData.uploadAttribute('barycentric', 0, this.preview.barycentric.subarray(0, length));
      model.preview.shaderData.uploadAttribute('barycentric', length*4, this.preview.centroid.barycentric.subarray(0, centroidLength));
      length /= 3;
      centroidLength /= 3;
      model.preview.shaderData.resizeAttribute('selected', (length+centroidLength) * 4);
      model.preview.shaderData.uploadAttribute('selected', 0, this.preview.selected.subarray(0, length));
      model.preview.shaderData.uploadAttribute('selected', length*4, this.preview.centroid.selected.subarray(0, centroidLength));
   }
      
   // compute index.
   this._computePreviewIndex();
};

PreviewCage.prototype._computePreviewIndex = function() {
   this.numberOfTriangles = this.geometry.faces.reduce( function(acc, element) {
      return acc + element.numberOfVertex; // -2; for half the vertex
   }, 0);
   const index = new Uint32Array(this.numberOfTriangles*3 );
   let length = 0;
   // recompute all index. (no optimization unless prove to be bottleneck)
   let barycentric = this.geometry.vertices.length;
   for (let sphere of this.boundingSpheres) {
      if (sphere.isReal()) {     // skip over deleted sphere.
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
   this.preview.indexLength = length;
};

PreviewCage.prototype._updateAffected = function(affected) {
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
         this._updatePreview(face);
      }
      // update index

   }

   this.geometry.clearAffected();
};


PreviewCage.prototype._updateVertex = function(vertex, affected) {
   if (vertex.isReal()) {
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

PreviewCage.prototype._updatePreview = function(polygon) {
   // recompute boundingSphere centroid, and if numberOfVertex changed, needs to recompute index.
   if ((polygon.index < this.boundingSpheres.length) && polygon.isReal()) { // will be get recompute on resize
      const sphere = this.boundingSpheres[ polygon.index ];
      sphere.setSphere( BoundingSphere.computeSphere(sphere.polygon, sphere.center) ); 
      // update center.
      const index = this.geometry.vertices.length+polygon.index;
      this.preview.shaderData.uploadAttribute('position', index*3*4, sphere.center);
   }
};


PreviewCage.prototype._updatePreviewEdge = function(edge, updateShader) {
   const wingedEdge = edge.wingedEdge;
   if (wingedEdge.isReal()) {
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

PreviewCage.prototype._resizePreviewEdge = function(oldSize) {
   const size = this.geometry.edges.length - oldSize;
   if (size > 0) {
      if (oldSize > 0) {
         let line = new Float32Array(this.geometry.edges.length*2*3);
         line.set(this.previewEdge.line);
         this.previewEdge.line = line;
         let color = new Float32Array(this.geometry.edges.length*2);
         color.set(this.previewEdge.color);
         this.previewEdge.color = color;
      } else { // brand new
         this.previewEdge.line = new Float32Array(this.geometry.edges.length*2*3);
         this.previewEdge.color = new Float32Array(this.geometry.edges.length*2);
      }
      for (let i = oldSize, j=(oldSize*2*3); i < this.geometry.edges.length; i++) {
         let wingedEdge = this.geometry.edges[i];
         for (let halfEdge of wingedEdge) {
            if (wingedEdge.isReal()) {
               this.previewEdge.line.set(halfEdge.origin.vertex, j);
            } else {
               this.previewEdge.line.fill(0.0, j, j+3);
            }
            j += 3;
         }
      }
      //
      this.previewEdge.color.fill(0.0, oldSize*2);
      // update webgl
      this.previewEdge.shaderData.resizeAttribute('position', this.previewEdge.line.length*4);
      this.previewEdge.shaderData.uploadAttribute('position', 0, this.previewEdge.line);
      this.previewEdge.shaderData.resizeAttribute('color', this.previewEdge.color.length*4);
      this.previewEdge.shaderData.uploadAttribute('color', 0, this.previewEdge.color);
   }
};


PreviewCage.prototype._resizePreviewVertex = function(oldSize) {
   const length = this.geometry.vertices.length;
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
      preview.shaderData.uploadAttribute('position', 0, this.geometry.buf.data.subarray(0, length*3));
      preview.shaderData.resizeAttribute('color', length*4);
      preview.shaderData.uploadAttribute('color', 0, preview.color);
   }
   // rebuild index.
   const index = new Uint32Array(length);
   let j = 0;
   for (let i = 0; i < length; ++i) {
      if (this.geometry.vertices[i].isReal()) {
         index[j++] = i;
      }
   }
   // 
   this.previewVertex.shaderData.setIndex(index);
   this.previewVertex.indexLength = j;
};


// free webgl buffer.
PreviewCage.prototype.freeBuffer = function() {
   this.preview.shaderData.freeAllAttributes();
   this.preview.shaderData =  null;
   this.previewEdge.shaderData.freeAllAttributes();
   this.preview.shaderData = null;
   this.previewVertex.shaderData.freeAllAttributes();
   this.previewVertex.shaderData = null;
}


PreviewCage.prototype.draw = function(gl) {
   // draw using index
   try {
      gl.bindShaderData(this.preview.shaderData);
      gl.drawElements(gl.TRIANGLES, this.preview.indexLength, gl.UNSIGNED_INT, 0);
   } catch (e) {
      console.log(e);
   }
};

// draw vertex, select color, 
PreviewCage.prototype.drawVertex = function(gl) {
   // drawing using vertex array
   try {
      gl.bindShaderData(this.previewVertex.shaderData);
      //gl.drawArrays(gl.POINTS, 0, this.geometry.vertices.length);
      gl.drawElements(gl.POINTS, this.previewVertex.indexLength, gl.UNSIGNED_INT, 0);
   } catch (e) {
      console.log(e);
   }
};

// draw edge, select color
PreviewCage.prototype.drawEdge = function(gl) {
   gl.bindShaderData(this.previewEdge.shaderData);
   gl.drawArrays(gl.LINES, 0, this.previewEdge.line.length/3);
}


// todo: octree optimization.
PreviewCage.prototype.rayPick = function(ray) {
   var that = this;
   // return the closest face (triangle) that intersect ray.
   var intersect = {polygon: [], pt: []};
   var hitSphere = [];
   for (let sphere of this.boundingSpheres) {
      if (sphere.isReal() && sphere.isIntersect(ray)){
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
   if (this.hasSelection()) {
      this._resetBody();  
      // select all face
      this.selectedSet = new Set(this.geometry.faces);
      this.preview.selected.fill(1.0);
      this.preview.centroid.selected.fill(1.0);
      // update drawing element
      const length = this.geometry.buf.len/3;
      const centroidLength = this.preview.centroid.buf.len/3;
      this.preview.shaderData.uploadAttribute('selected', 0, this.preview.selected.subarray(0, length));
      this.preview.shaderData.uploadAttribute('selected', length*4, this.preview.centroid.selected.subarray(0, centroidLength));
   }
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
      this.previewEdge.shaderData.uploadAttribute('color', 0, this.previewEdge.color);
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
      this.previewVertex.shaderData.uploadAttribute('color', 0, this.previewVertex.color);
   }
};

PreviewCage.prototype.restoreFaceSelection = function(snapshot) {
   for (let polygon of snapshot) {
      this.selectFace(polygon.halfEdge);
   }
};

PreviewCage.prototype.restoreEdgeSelection = function(snapshot) {
   for (let wingedEdge of snapshot) {
      this.selectEdge(wingedEdge.left);
   }
};

PreviewCage.prototype.restoreVertexSelection = function(snapshot) {
   for (let vertex of snapshot) {
      this.selectVertex(vertex);
   }
};

PreviewCage.prototype.restoreBodySelection = function(snapshot) {
   if (snapshot.size > 0) {
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
   this.previewBody.hilite = false;
   this.preview.shaderData.setUniform3fv("faceColor", [0.5, 0.5, 0.5]);
   return oldSet;
};

PreviewCage.prototype.selectBody = function() {
   let faceColor;
   // we change interior color to show the selection
   if (this.hasSelection()) {
      this.selectedSet.delete( this.geometry );
      // change to unselect, check if we are hilite,
      if (this.previewBody.hilite) {
         faceColor = [0.0, 1.0, 0.0];   // hilite and unselected         
      } else {
         faceColor = [0.5, 0.5, 0.5];   // unselected
      }
   } else {
      this.selectedSet.add( this.geometry );
      if (this.previewBody.hilite) {
         faceColor = [1.0, 1.0, 0.0];   // selected and hilite
      } else {
         faceColor = [1.0, 0.0, 0.0];   // selected.
      }
      geometryStatus("Object " + this.name + " has " + this.geometry.faces.length + " polygons");
   }
   this.preview.shaderData.setUniform3fv("faceColor", faceColor);
   return this.hasSelection();
};

PreviewCage.prototype.hiliteBody = function(hilite) {
   let faceColor;
   this.previewBody.hilite = hilite;
   if (hilite) {
      if (this.hasSelection()) {
         faceColor = [1.0, 1.0, 0.0];
      } else {
         faceColor = [0.0, 1.0, 0.0];
      }
   } else {
      if (this.hasSelection()) {
         faceColor = [1.0, 0.0, 0.0];
      } else {
         faceColor = [0.5, 0.5, 0.5];
      }
   }
   this.preview.shaderData.setUniform3fv("faceColor", faceColor);
}

PreviewCage.prototype.hasSelection = function() {
   return (this.selectedSet.size > 0);
};


PreviewCage.prototype.snapshotSelection = function() {
   return new Set(this.selectedSet);
};

PreviewCage.prototype.setVertexColor = function(vertex, color) {
   // selected color
   const j = vertex.index;  
   this.previewVertex.color[j] += color;
   if (!this.groupSelection) {
      const point = this.previewVertex.color.subarray(j, j+1);
      this.previewVertex.shaderData.uploadAttribute('color', j*Float32Array.BYTES_PER_ELEMENT, point);
   }
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
   this.previewVertex.color.fill(0.0);
   this.previewVertex.shaderData.uploadAttribute('color', 0, this.previewVertex.color);
   return oldSelected;
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
   const j = wingedEdge.index * 2;  
   this.previewEdge.color[j] += color;
   this.previewEdge.color[j+1] += color;
   if (!this.groupSelection) {
      const line = this.previewEdge.color.subarray(j, j+2);
      this.previewEdge.shaderData.uploadAttribute('color', j*Float32Array.BYTES_PER_ELEMENT, line);
   }
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
      const sphere = this.boundingSpheres[polygon.index];
      // recompute sphere center. and normal
      polygon.computeNormal();
      sphere.setSphere( BoundingSphere.computeSphere(polygon, sphere.center) );
   }
   // done, update shader data, should we update each vertex individually?
   const centroids = this.preview.centroid.buf.data.subarray(0, this.preview.centroid.buf.len)
   this.preview.shaderData.uploadAttribute('position', this.geometry.buf.len*4, centroids);
   // update the edges.vertex
   for (let wingedEdge of snapshot.wingedEdges) {
      let index = wingedEdge.index * 2 * 3;
      for (let halfEdge of wingedEdge) {
         this.previewEdge.line.set(halfEdge.origin.vertex, index);
         index += 3;
      }
   }
   this.previewEdge.shaderData.uploadAttribute('position', 0, this.previewEdge.line);
};


PreviewCage.prototype.restoreMoveSelection = function(snapshot) {
   // restore to the snapshot position.
   let i = 0;
   for (let vertex of snapshot.vertices) {
      vec3.copy(vertex.vertex, snapshot.position.subarray(i, i+3));
      i += 3;
   }
   // todo: we really should update as little as possible.
   const vertices = this.geometry.buf.data.subarray(0, this.geometry.buf.len);
   this.preview.shaderData.uploadAttribute('position', 0, vertices);
   this.previewVertex.shaderData.uploadAttribute('position', 0, vertices);
   this.computeSnapshot(snapshot);
};

PreviewCage.prototype.moveSelection = function(movement, snapshot) {
   // first move geometry's position
   if (snapshot.normal) {
      let i = 0; 
      for (let vertex of snapshot.vertices) {
         vec3.scaleAndAdd(vertex.vertex, vertex.vertex, snapshot.normal[i++], movement);  // movement is magnitude
      }
   } else {
      for (let vertex of snapshot.vertices) {
         vec3.add(vertex.vertex, vertex.vertex, movement);
      }
   }
   // todo: we really should update as little as possible.
   const vertices = this.geometry.buf.data.subarray(0, this.geometry.buf.len);
   this.preview.shaderData.uploadAttribute('position', 0, vertices);
   this.previewVertex.shaderData.uploadAttribute('position', 0, vertices);
   this.computeSnapshot(snapshot);
};


PreviewCage.prototype.snapshotPosition = function(vertices, normalArray) {
   var ret = {
      faces: new Set,
      vertices: null,
      wingedEdges: new Set,
      position: null,
      normal: normalArray,
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
   const retArray = [];
   let i = 0;
   for (let [_vert, normal] of normalMap) {
      let inputNormal = normalArray.subarray(i, i+3);
      vec3.copy(inputNormal, normal);
      retArray.push(inputNormal);
      i+=3;
   }
   return this.snapshotPosition(vertices, retArray);
};

PreviewCage.prototype.snapshotVertexPositionAndNormal = function() {
   const vertices = new Set(this.selectedSet);
   const normalArray = [];
   const array = new Float32Array(vertices.size*3);
   array.fill(0.0);
   // copy normal
   let i = 0;
   for (let vertex of vertices) {
      let normal = array.subarray(i, i+3);
      normalArray.push( normal );
      vertex.eachOutEdge( function(outEdge) {
         if (outEdge.isNotBoundary()) {
            vec3.add(normal, normal, outEdge.face.normal);
         }
      });
      vec3.normalize(normal, normal);        // finally, we can safely normalized?
      i +=3;
   }

   return this.snapshotPosition(vertices, normalArray);
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
   const retArray = [];
   let i = 0;
   for (let [_vert, normal] of normalMap) {
      let inputNormal = normalArray.subarray(i, i+3);
      for (let poly of normal) {
         vec3.add(inputNormal, inputNormal, poly.normal);
      }
      retArray.push(inputNormal);
      i+=3;
   }
   return this.snapshotPosition(vertices, retArray);
};


PreviewCage.prototype._resetSelectEdge = function() {
   const oldSelected = this.selectedSet;
   this.selectedSet = new Set;
   // zeroout the edge seleciton.
   this.previewEdge.color.fill(0.0);
   this.previewEdge.shaderData.uploadAttribute('color', 0, this.previewEdge.color);
   return oldSelected;
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
   var self = this;
   var selected = this.preview.selected;    // filled triangle's selection status.
   polygon.eachVertex( function(vertex) {
      // restore drawing color
      var vertexSelected = false;
      vertex.eachOutEdge( function(edge) {
         if (edge.isNotBoundary() && (edge.face !== polygon) && self.selectedSet.has(edge.face)) {
            vertexSelected = true;
         }
      }); 
      if (vertexSelected === false) {  // no more sharing, can safely reset
         selected[vertex.index] = 0.0;
         self.preview.shaderData.uploadAttribute('selected', vertex.index*4, PreviewCage.CONST.SELECTOFF);
      }
   });
   selected = this.preview.centroid.selected;
   selected[polygon.index]= 0.0;
   this.selectedSet.delete(polygon);
   var byteOffset = (this.geometry.vertices.length+polygon.index)*4;
   this.preview.shaderData.uploadAttribute("selected", byteOffset, PreviewCage.CONST.SELECTOFF);
};
PreviewCage.prototype.setFaceSelectionOn = function(polygon) {
   var self = this;
   var selected = this.preview.selected;      // filled triangle's selection status.
   // set the drawing color
   polygon.eachVertex( function(vertex) {
      selected[vertex.index] = 1.0;
      self.preview.shaderData.uploadAttribute('selected', vertex.index*4, PreviewCage.CONST.SELECTON);
   });
   selected = this.preview.centroid.selected;
   selected[polygon.index]= 1.0;
   this.selectedSet.add(polygon);
   var byteOffset = (this.geometry.vertices.length+polygon.index)*4;
   this.preview.shaderData.uploadAttribute("selected", byteOffset, PreviewCage.CONST.SELECTON);
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
      onOff = false;
   } else {
      this.setFaceSelectionOn(polygon);
      onOff = true;
   }
   geometryStatus("polygon face # " + polygon.index);
   return onOff;
};

PreviewCage.prototype._resetSelectFace = function() {
   var oldSelected = this.selectedSet;
   this.selectedSet = new Set;
   this.preview.selected.fill(0.0);          // reset all polygon to non-selected 
   this.preview.centroid.selected.fill(0.0);
   var length = this.geometry.buf.len/3;
   this.preview.shaderData.uploadAttribute("selected", 0, this.preview.selected.subarray(0, length));
   var centroidLength = this.preview.centroid.buf.len/3;
   this.preview.shaderData.uploadAttribute('selected', length*4, this.preview.centroid.selected.subarray(0, centroidLength));
   return oldSelected;
}


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


PreviewCage.prototype._resizeVertices = function(oldSize) {
   // update webgl buffer
   if (oldSize < this.geometry.vertices.length) {
      // expand webgl buffer
      this.preview.setAttribute();

   } // ignore shrinking request for now.
};



PreviewCage.prototype.extractFace = function() {
   var vertexSize = this.geometry.vertices.length;
   var edgeSize = this.geometry.edges.length;
   var faceSize = this.geometry.faces.length;
   // array of edgeLoop. 
   var edgeLoops = this.geometry.extractPolygon(this.selectedSet);
   // adjust preview to the new vertices, edges and faces.
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   //this._resizeEdges();

   return edgeLoops;
};

//
// extrudeFace - will create a list of 
PreviewCage.prototype.extrudeFace = function(contours) {
   const vertexSize = this.geometry.vertices.length;
   const edgeSize = this.geometry.edges.length;
   const faceSize = this.geometry.faces.length;
   // array of edgeLoop. 
   if (!contours) {
      contours = {};
      contours.edgeLoops = this.geometry.findContours(this.selectedSet); 
   }
   contours.edgeLoops = this.geometry.liftContours(contours.edgeLoops);
   contours.extrudeEdges = this.geometry.extrudeContours(contours.edgeLoops);
   //const edgeLoops = this.geometry.extrudePolygon(this.selectedSet);
   // add the new Faces. and new vertices to the preview
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   this._resizePreviewEdge(edgeSize);
   this._resizePreviewVertex(vertexSize);
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
   const vertexSize = this.geometry.vertices.length;
   const edgeSize = this.geometry.edges.length;
   const faceSize = this.geometry.faces.length;
   for (let edge of edges) {
      edge.origin.eachOutEdge( function(edge) {
         affectedPolygon.add(edge.face);
      });
      this.geometry.collapseEdge(edge);
   }
   // recompute the smaller size
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   this._resizePreviewEdge(edgeSize);
   this._resizePreviewVertex(vertexSize);
      // reselect face
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected) {
      this.selectFace(polygon.halfEdge);
   }

   // update all affected polygon(use sphere). recompute centroid.
   for (let polygon of affectedPolygon) {
      if (polygon.isReal()) {
         const sphere = this.boundingSpheres[polygon.index];
         // recompute sphere center.
         sphere.setSphere( BoundingSphere.computeSphere(polygon, sphere.center) );
      }
   }
   // done, update shader data, should we update each vertex individually?
   const centroids = this.preview.centroid.buf.data.subarray(0, this.preview.centroid.buf.len)
   this.preview.shaderData.uploadAttribute('position', this.geometry.buf.len*4, centroids);
};


PreviewCage.prototype.cutEdge = function(numberOfSegments) {
   const edges = this.selectedSet;

   const faceSize = this.geometry.faces.length;
   const edgeSize = this.geometry.edges.length;
   const vertexSize = this.geometry.vertices.length;
   const vertices = [];
   const splitEdges = [];              // added edges list
   // cut edge by numberOfCuts
   let diff = vec3.create();
   let vertex = vec3.create();
   for (let wingedEdge of edges) {
      let edge = wingedEdge.left;
      vec3.sub(diff, edge.origin.vertex, edge.destination().vertex);
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
   this._updateAffected(this.geometry.affected);
   //
   this._resizePreview(vertexSize, faceSize);
   this._resizePreviewEdge(edgeSize);
   this._resizePreviewVertex(vertexSize);
   // returns created vertices.
   return {vertices: vertices, splitEdges: splitEdges};
};

// collapse list of edges, pair with CutEdge.
PreviewCage.prototype.collapseSplitEdge = function(splitEdges) {
   const vertexSize = this.geometry.vertices.length;
   const edgeSize = this.geometry.edges.length;
   const faceSize = this.geometry.faces.length;
   for (let edge of splitEdges) {
      this.geometry.collapseEdge(edge);
   }
   // recompute the smaller size
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   this._resizePreviewEdge(edgeSize);
   this._resizePreviewVertex(vertexSize);
};


// connect selected Vertex,
PreviewCage.prototype.connectVertex = function() {
   const faceSize = this.geometry.faces.length;
   const edgeSize = this.geometry.edges.length;
   const vertexSize = this.geometry.vertices.length;
   
   //this.geometry.clearAffected();
   const edgeList = this.geometry.connectVertex(this.selectedSet);
   const wingedEdgeList = [];
   for (let edge of edgeList) {
      wingedEdgeList.push( edge.wingedEdge );
   }

   // updateAffected.
   this._updateAffected(this.geometry.affected);

   // addition.
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   this._resizePreviewEdge(edgeSize);
   this._resizePreviewVertex(vertexSize);

   return {edgeList: edgeList, wingedEdgeList: wingedEdgeList};
};
// pair with connectVertex.
PreviewCage.prototype.dissolveConnect = function(insertEdges) {
   const size = this._getGeometrySize();

   // dissolve in reverse direction
   for (let i = insertEdges.length-1; i >= 0; --i) {
      const halfEdge = insertEdges[i];
      this.geometry.removeEdge(halfEdge.pair);
   }

   // after deletion of faces and edges. update
   this._updateAffected(this.geometry.affected);

   // let _resize, to update preview
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);

};


//
PreviewCage.prototype.dissolveSelectedEdge = function() {
   const dissolveEdges = [];
   const size = this._getGeometrySize();
   for (let edge of this.selectedSet) {
      let undo = this.geometry.dissolveEdge(edge.left);
      let dissolve = { halfEdge: edge.left, undo: undo};
      dissolveEdges.push(dissolve);
   }
   this.selectedSet.clear();
   // after deletion of faces and edges. update
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);
   // return affected.
   return dissolveEdges;
};
PreviewCage.prototype.reinsertDissolveEdge = function(dissolveEdges) {
   const size = this._getGeometrySize();
   // walk form last to first.
   for (let i = (dissolveEdges.length-1); i >= 0; --i) {
      let dissolve = dissolveEdges[i];
      dissolve.undo();
      this.selectEdge(dissolve.halfEdge);
   }
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);
};


PreviewCage.prototype.collapseSelectedEdge = function() {
   const restoreVertex = [];
   const collapseEdges = [];
   const size = this._getGeometrySize();
   const selected = new Map();
   for (let edge of this.selectedSet) {
      let undo = function() {};
      if (edge.isReal()){
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
      let collapse = { halfEdge: edge.left, undo: undo};
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
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);
   this._resizePreviewVertex(size.vertex);
   return { collapse: {edge: collapseEdges, vertex: restoreVertex}, selectedVertex: selectedVertex};
};

PreviewCage.prototype.restoreCollapseEdge = function(collapse) {
   const size = this._getGeometrySize();
   // walk form last to first.
   this.selectedSet.clear();

   const collapseEdges = collapse.edge;
   for (let i = (collapseEdges.length-1); i >= 0; --i) {
      let collapse = collapseEdges[i];
      collapse.undo();
   }
   for (let collapseEdge of collapseEdges) { // selectedge should be in order
      this.selectEdge(collapseEdge.halfEdge);
   }
   const restoreVertex = collapse.vertex;
   for (let restore of restoreVertex) {   // restore position
      vec3.copy(restore.vertex.vertex, restore.savePt);
      this.geometry.addAffectedEdgeAndFace(restore.vertex);
   }
   // 
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);   
   this._resizePreviewVertex(size.vertex);
};


PreviewCage.prototype.dissolveSelectedFace = function() {
   const size = this._getGeometrySize();
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
      if (polygon.isReal()) {
         selectedSet.add(polygon);
      }
   }
   this.selectedSet = selectedSet;
   // update previewBox.
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);   
   this._resizePreviewVertex(size.vertex);
   // return undo function
   return {edges: substract, selection: selectedFace};
};
PreviewCage.prototype.undoDissolveFace = function(dissolve) {
   const size = this._getGeometrySize();
   for (let dissolveUndo of dissolve.edges) {
      dissolveUndo();
   }
   this.selectedSet.clear();
   // reselected the polygon in order.
   for (let polygon of dissolve.selection) {
      this.selectFace(polygon.halfEdge);
   }
   // update previewBox.
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);   
   this._resizePreviewVertex(size.vertex);
}


// the original wings3D collapse quite strangely. collapse by edge index order? such a weird algorithm.
// we change it to collapse to middle.
PreviewCage.prototype.collapseSelectedFace = function() {
   const saveSet = this.selectedSet;
   // reuse edgeSelect().
   this.changeFromFaceToEdgeSelect();
   // reuse collapseEdge
   const collapse = this.collapseSelectedEdge();
   collapse.selectedFace = saveSet;
   return collapse;
};
PreviewCage.prototype.undoCollapseFace = function(collapse) {
   this.restoreCollapseEdge(collapse);
};


PreviewCage.prototype.dissolveSelectedVertex = function() {
   const size = this._getGeometrySize();
   const undoArray = {array: [], selectedFace: []};
   for (let vertex of this.selectedSet) {
      let result = this.geometry.dissolveVertex(vertex);
      undoArray.array.unshift( result.undo );
      undoArray.selectedFace.push( result.polygon );
   }
   this._resetSelectVertex();
   // update previewBox.
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);   
   this._resizePreviewVertex(size.vertex);
   return undoArray;
};
PreviewCage.prototype.undoDissolveVertex = function(undoArray) {
   const size = this._getGeometrySize();
   for (let undo of undoArray) {
      let vertex = undo();
      this.selectVertex(vertex);
   }
   // update previewBox.
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);   
   this._resizePreviewVertex(size.vertex);
};


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
      Wings3D.view.addToWorld(this.previewCage);
   }

   undo() {
      Wings3D.view.removeFromWorld(this.previewCage);
   }
}
