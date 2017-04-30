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
   this.preview.shaderData.setUniform3fv("faceColor", [1.0, 0.0, 0.0]);
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
   // selecte(Vertex,Edge,Face)here
   this.selectedMap = new Map;
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
      } else { // brand new
         const buf = new ArrayBuffer(this.geometry.faces.length * 3 * Float32Array.BYTES_PER_ELEMENT * 2); // twice the current size
         this.preview.centroid.buf = {buffer: buf, data: new Float32Array(buf), len: 0};
         // assign a boundingsphere for each polygon.
         this.boundingSpheres = new Array(this.geometry.faces.length);
         this.boundingSpheres.length = 0;
      }
      // create New
      const centroid = this.preview.centroid;   // 
      for (let i = oldSize; i < this.geometry.faces.length; ++i) {
         const center = new Float32Array(centroid.buf.buffer, Float32Array.BYTES_PER_ELEMENT*centroid.buf.len, 3);
         centroid.buf.len += 3;
         const polygon = this.geometry.faces[i];
         // recalibrate index for free.
         polygon.index = i;
         this.boundingSpheres.push( BoundingSphere.create(polygon, center) );
      }
      // vertices is geometry data + centroid data.
   }
};

PreviewCage.prototype._resizePreview = function(oldSize, oldCentroidSize) {
   const size = this.geometry.vertices.length - oldSize;
   if (size > 0) {
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
   const index = new Uint16Array(this.numberOfTriangles*3 );
   let length = 0;
   // recompute all index. (no optimization unless prove to be bottleneck)
   let barycentric = this.geometry.vertices.length;
   for (let sphere of this.boundingSpheres) {
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
      index[length+indicesLength++] = barycentric++;
      length += indicesLength;
      //sphere.indexEnd = model.preview.index.length;
   }
   // save it to the buffer 
   this.preview.shaderData.setIndex(index);
   this.preview.indexLength = length;
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
         this.previewEdge.color = new Float32Array(this.geometry.edges.length*2)
      }
      for (let i = oldSize, j=(oldSize*3); i < this.geometry.edges.length; i++) {
         for (let halfEdge of this.geometry.edges[i]) {
            this.previewEdge.line.set(halfEdge.origin.vertex, j);
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
      gl.drawElements(gl.TRIANGLES, this.preview.indexLength, gl.UNSIGNED_SHORT, 0);
   } catch (e) {
      console.log(e);
   }
};


PreviewCage.prototype.hasSelection = function() {
   return (this.selectedMap.size > 0);
}


// draw vertex, select color, 
PreviewCage.prototype.drawVertex = function(gl) {
   // drawing using vertex array
   try {
      gl.bindShaderData(this.previewVertex.shaderData);
      gl.drawArrays(gl.POINTS, 0, this.geometry.vertices.length);
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
   for (var i = 0; i < this.boundingSpheres.length; ++i) {
      if (this.boundingSpheres[i].isIntersect(ray)){
         hitSphere.push( this.boundingSpheres[i] );
      }
   }
   // check for triangle intersection, select the hit Face, hit Edge(closest), and hit Vertex (closest).
   var hitEdge = null;
   var center;
   var hitT = 10000000;   // z_far is the furthest possible intersection
   for (i = 0; i < hitSphere.length; ++i) {
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

PreviewCage.prototype.snapshotSelection = function() {
   return new Map(this.selectedMap);
};

PreviewCage.prototype.setVertexColor = function(vertex, color) {
   // selected color
   var j = vertex.index;  
   this.previewVertex.color[j] += color;
   var point = this.previewVertex.color.subarray(j, j+1);
   this.previewVertex.shaderData.uploadAttribute('color', j*Float32Array.BYTES_PER_ELEMENT, point);
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
   if (this.selectedMap.has(vertex.index)) {
      if (onOff === false) {
         this.selectedMap.delete(vertex.index);
         this.setVertexColor(vertex, -0.25);
         return true;
      }
   } else {
      if (onOff === true) {
         this.selectedMap.set(vertex.index, vertex);
         this.setVertexColor(vertex, 0.25);
         geometryStatus("select vertex: " + vertex.index);
         return true;
      }
   }
   return false;
}

PreviewCage.prototype.selectVertex = function(vertex) {
   var onOff;
   var color;
   if (this.selectedMap.has(vertex.index)) {
      this.selectedMap.delete(vertex.index);
      color = -0.25;
      onOff = false;
   } else {
      this.selectedMap.set(vertex.index, vertex);
      color = 0.25;
      onOff = true;
      geometryStatus("select vertex: " + vertex.index);
   }
   // selected color
   this.setVertexColor(vertex, color);
   return onOff;
};


PreviewCage.prototype._resetSelectVertex = function() {
   var oldSelected = this.selectedMap;
   this.selectedMap = new Map;
   // zeroout the edge seleciton.
   this.previewVertex.color.fill(0.0);
   this.previewVertex.shaderData.uploadAttribute('color', 0, this.previewVertex.color);
   return oldSelected;
};

PreviewCage.prototype.changeFromVertexToFaceSelect = function() {
   var self = this;
   var oldSelected = this._resetSelectVertex();
   //
   for (var [key, vertex] of oldSelected) { 
      // select all face that is connected to the vertex.
      vertex.eachOutEdge(function(edge) {
         if (!self.selectedMap.has(edge.face.index)) {
            self.selectFace(edge);
         }
      });
   }
};


PreviewCage.prototype.changeFromVertexToEdgeSelect = function() {
   var self = this;
   var oldSelected = this._resetSelectVertex();
   //
   for (var [key, vertex] of oldSelected) { 
      // select all edge that is connected to the vertex.
      vertex.eachOutEdge(function(edge) {
         if (!self.selectedMap.has(edge.wingedEdge.index)) {
            self.selectEdge(edge);
         }
      });
   }
};

PreviewCage.prototype.restoreFromVertexToFaceSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectVertex();
      for (var [_key, polygon] of snapshot) {
         this.selectFace(polygon.halfEdge);
      }
   } else {
      this.changeFromVertexToFaceSelect();  // choose compute over storage, use the same code as going forward.
   }
}

PreviewCage.prototype.restoreFromVertexToEdgeSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectVertex();
      for (var [_key, wingedEdge] of snapshot) {
         this.selectEdge(wingedEdge.left);
      }
   } else {
      this.changeFromVertexToEdgeSelect();  // choose compute over storage, use the same code as going forward.
   }
}


PreviewCage.prototype.setEdgeColor = function(wingedEdge, color) {
   // selected color
   var j = wingedEdge.index * 2;  
   this.previewEdge.color[j] += color;
   this.previewEdge.color[j+1] += color;
   var line = this.previewEdge.color.subarray(j, j+2);
   this.previewEdge.shaderData.uploadAttribute('color', j*Float32Array.BYTES_PER_ELEMENT, line);
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

   if (this.selectedMap.has(wingedEdge.index)) { 
      if (dragOn === false) { // turn from on to off
         this.selectedMap.delete(wingedEdge.index);
         this.setEdgeColor(wingedEdge, -0.25);
         return true;   // new off selection
      }
   } else {
      if (dragOn === true) {   // turn from off to on.
         this.selectedMap.set(wingedEdge.index, wingedEdge);
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
   if (this.selectedMap.has(wingedEdge.index)) {
      this.selectedMap.delete(wingedEdge.index);
      color = -0.25;
      onOff = false;
   } else {
      this.selectedMap.set(wingedEdge.index, wingedEdge);
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
   for (var [oid, polygon] of snapshot.faces) {
      var sphere = this.boundingSpheres[polygon.index];
      // recompute sphere center.
      sphere.setSphere( BoundingSphere.computeSphere(polygon, sphere.center) );
   }
   // done, update shader data, should we update each vertex individually?
   var centroids = this.preview.centroid.buf.data.subarray(0, this.preview.centroid.buf.len)
   this.preview.shaderData.uploadAttribute('position', this.geometry.buf.len*4, centroids);
   // update the edges.vertex
   for (var [oid, wingedEdge] of snapshot.wingedEdges) {
      var index = oid * 2 * 3;
      for (let halfEdge of wingedEdge) {
         this.previewEdge.line.set(halfEdge.origin.vertex, index);
         index += 3;
      }
   }
   this.previewEdge.shaderData.uploadAttribute('position', 0, this.previewEdge.line);
};


PreviewCage.prototype.restoreMoveSelection = function(snapshot) {
   // restore to the snapshot position.
   var i = 0;
   for (var [_index, vertex] of snapshot.vertices) {
      vec3.copy(vertex.vertex, snapshot.position.subarray(i, i+3));
      i += 3;
   }
   // todo: we really should update as little as possible.
   var vertices = this.geometry.buf.data.subarray(0, this.geometry.buf.len);
   this.preview.shaderData.uploadAttribute('position', 0, vertices);
   this.previewVertex.shaderData.uploadAttribute('position', 0, vertices);
   this.computeSnapshot(snapshot);
};

PreviewCage.prototype.moveSelection = function(movement, snapshot) {
   // first move geometry's position
   for (var [_key, vertex] of snapshot.vertices) {
      vec3.add(vertex.vertex, vertex.vertex, movement);
   }
   // todo: we really should update as little as possible.
   var vertices = this.geometry.buf.data.subarray(0, this.geometry.buf.len);
   this.preview.shaderData.uploadAttribute('position', 0, vertices);
   this.previewVertex.shaderData.uploadAttribute('position', 0, vertices);
   this.computeSnapshot(snapshot);
};


PreviewCage.prototype.snapshotPosition = function(vertices) {
   var ret = {
      faces: new Map,
      vertices: null,
      wingedEdges: new Map,
      position: null,
   };
   ret.vertices = vertices;
   // allocated save position data.
   ret.position = new Float32Array(ret.vertices.size*3);
   // use the vertex to collect the affected polygon and the affected edge.
   var i = 0;
   for (var [_key, vertex] of ret.vertices) {
      vertex.eachOutEdge(function(edge) {
         if (edge.isNotBoundary() && !ret.faces.has(edge.face.index)) {
            ret.faces.set(edge.face.index, edge.face);
         }
         if (!ret.wingedEdges.has(edge.wingedEdge.index)) {
            ret.wingedEdges.set(edge.wingedEdge.index, edge.wingedEdge);
         }
      });
      // save position data
      ret.position.set(vertex.vertex, i);
      i += 3;
   }
   return ret;
};

PreviewCage.prototype.snapshotEdgePosition = function() {
   var vertices = new Map;
   // first collect all the vertex
   for (var [_key, wingedEdge] of this.selectedMap) {
      for (let edge of wingedEdge) {
         var vertex = edge.origin;
         if (!vertices.has(vertex.index)) {
            vertices.set(vertex.index, vertex);
         }
      }
   }
   return this.snapshotPosition(vertices);
};

PreviewCage.prototype.snapshotFacePosition = function() {
   var vertices = new Map;
   // first collect all the vertex
   for (var [_key, polygon] of this.selectedMap) {
      polygon.eachVertex( function(vertex) {
         if (!vertices.has(vertex.index)) {
            vertices.set(vertex.index, vertex);
         }
      });
   }
   return this.snapshotPosition(vertices);
};

PreviewCage.prototype.snapshotVertexPosition = function() {
   var vertices = new Map(this.selectedMap);
   return this.snapshotPosition(vertices);
};


PreviewCage.prototype._resetSelectEdge = function() {
   var oldSelected = this.selectedMap;
   this.selectedMap = new Map;
   // zeroout the edge seleciton.
   this.previewEdge.color.fill(0.0);
   this.previewEdge.shaderData.uploadAttribute('color', 0, this.previewEdge.color);
   return oldSelected;
};

PreviewCage.prototype.changeFromEdgeToFaceSelect = function() {
   var oldSelected = this._resetSelectEdge();
   //
   for (var [key, wingedEdge] of oldSelected) {
      // for each WingedEdge, select both it face.
      for (let halfEdge of wingedEdge) {
         if (!this.selectedMap.has(halfEdge.face.index)) {
            this.selectFace(halfEdge);
         }
      }
   } 
};

PreviewCage.prototype.changeFromEdgeToVertexSelect = function() {
   var oldSelected = this._resetSelectEdge();
   //
   for (var [key, wingedEdge] of oldSelected) {
      // for each WingedEdge, select both it face.
      for (let halfEdge of wingedEdge) {
         if (!this.selectedMap.has(halfEdge.origin.index)) {
            this.selectVertex(halfEdge.origin);
         }
      }
   } 
};

PreviewCage.prototype.restoreFromEdgeToFaceSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectEdge();
      for (var [_key, polygon] of snapshot) {
         this.selectFace(polygon.halfEdge);
      }
   } else {
      this.changeFromEdgeToFaceSelect();  // we cheat, use the same code as going forward.
   }
}

PreviewCage.prototype.restoreFromEdgeToVertexSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectEdge();
      for (var [_key, vertex] of snapshot) {
         this.selectVertex(vertex);
      }
   } else {
      this.changeFromEdgeToVertexSelect();  // we cheat, use the same code as going forward.
   }
}

PreviewCage.prototype.setFaceSelectionOff = function(polygon) {
   var self = this;
   var selected = this.preview.selected;    // filled triangle's selection status.
   polygon.eachVertex( function(vertex) {
      // restore drawing color
      var vertexSelected = false;
      vertex.eachOutEdge( function(edge) {
         if (edge.isNotBoundary() && (edge.face !== polygon) && self.selectedMap.has(edge.face.index)) {
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
   this.selectedMap.delete(polygon.index);
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
   this.selectedMap.set(polygon.index, polygon);
   var byteOffset = (this.geometry.vertices.length+polygon.index)*4;
   this.preview.shaderData.uploadAttribute("selected", byteOffset, PreviewCage.CONST.SELECTON);
};

PreviewCage.prototype.dragSelectFace = function(selectEdge, onOff) {
   // select polygon set color,
   var polygon = selectEdge.face;
   if (this.selectedMap.has(polygon.index)) {
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
   if (this.selectedMap.has(polygon.index)) {
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
   var oldSelected = this.selectedMap;
   this.selectedMap = new Map;
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
   for (var [key, polygon] of oldSelected) {
      // for eachFace, selected all it edge.
      polygon.eachEdge(function(edge) {
         if (!self.selectedMap.has(edge.wingedEdge.index)) {
            self.selectEdge(edge);
         }
      });
   }
};

PreviewCage.prototype.changeFromFaceToVertexSelect = function() {
   var self = this
   var oldSelected = this._resetSelectFace();
   for (var [key, polygon] of oldSelected) {
      // for eachFace, selected all it vertex.
      polygon.eachVertex(function(vertex) {
         if (!self.selectedMap.has(vertex.index)) {
            self.selectVertex(vertex);
         }
      });
   }
};


PreviewCage.prototype.restoreFromFaceToEdgeSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectFace();
      // and selected using the snapshots.
      for (var [_key, wingedEdge] of snapshot) {
         this.selectEdge(wingedEdge.left);
      }
   } else {
      this.changeFromFaceToEdgeSelect();  // compute vs storage. currently lean toward compute.
   }
}

PreviewCage.prototype.restoreFromFaceToVertexSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectFace();
      // and selected using the snapshots.
      for (var [_key, vertex] of snapshot) {
         this.selectVertex(vertex);
      }
   } else {
      this.changeFromFaceToVertexSelect();  // compute vs storage. currently lean toward compute.
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
   var edgeLoops = this.geometry.extractPolygon(this.selectedMap);
   // adjust preview to the new vertices, edges and faces.
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   //this._resizeEdges();

   return edgeLoops;
};

//
// extrudeFace - will create a list of 
PreviewCage.prototype.extrudeFace = function() {
   var vertexSize = this.geometry.vertices.length;
   var edgeSize = this.geometry.edges.length;
   var faceSize = this.geometry.faces.length;
   // array of edgeLoop. 
   var edgeLoops = this.geometry.extrudePolygon(this.selectedMap);
   // add the new Faces. and new vertices to the preview
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   this._resizePreviewEdge(edgeSize);
   this._resizePreviewVertex(vertexSize);

   return edgeLoops;
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
