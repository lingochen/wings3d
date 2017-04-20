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
   this.numberOfTriangles = mesh.faces.reduce( function(acc, element) {
      return acc + element.numberOfVertex; // -2; for half the vertex
   }, 0);
   var buf = new ArrayBuffer(this.numberOfTriangles*3 * Uint16Array.BYTES_PER_ELEMENT);
   this.preview = {index: {buffer: buf, data: new Uint16Array(buf), length: 0},
                };
   this.preview.shaderData = Wings3D.gl.createShaderData();
   this.computeBoundingSphere();
   this.computePreview();
   this.preview.selectOn = new Float32Array(1);
   this.preview.selectOn[0] = 1.0;
   this.preview.selectOff = new Float32Array(1);
   this.preview.selectOff[0] = 0.0;
   var gl = Wings3D.gl;
   // set up position, faceColor, index.
   var layoutVec = ShaderData.attribLayout();
   var layoutFloat = ShaderData.attribLayout(1);
   this.preview.shaderData.setIndex(this.preview.index.data);
   var length = this.geometry.buf.len;
   var centroidLength = this.preview.centroid.len;
   var totalLength = centroidLength + length;
   // vertices is geometry data + centroid data.
   this.preview.shaderData.createAttribute('position', layoutVec, totalLength * 4, gl.STATIC_DRAW);
   this.preview.shaderData.uploadAttribute('position', 0, this.geometry.buf.data.subarray(0, length));
   this.preview.shaderData.uploadAttribute('position', length*4, this.preview.centroid.buf.data.subarray(0, centroidLength));
   this.preview.shaderData.createAttribute('barycentric', layoutVec, totalLength * 4, gl.STATIC_DRAW);
   this.preview.shaderData.uploadAttribute('barycentric', 0, this.preview.barycentric.subarray(0, length));
   this.preview.shaderData.uploadAttribute('barycentric', length*4, this.preview.centroid.barycentric.subarray(0, centroidLength));
   length /= 3;
   totalLength /= 3;
   centroidLength /= 3;
   this.preview.shaderData.createAttribute('selected', layoutFloat, totalLength * 4, gl.DYNAMIC_DRAW);
   this.preview.shaderData.uploadAttribute('selected', 0, this.preview.selected.subarray(0, length));
   this.preview.shaderData.uploadAttribute('selected', length*4, this.preview.centroid.selected.subarray(0, centroidLength));
   this.preview.shaderData.setUniform3fv("faceColor", [1.0, 0.0, 0.0]);
   this.preview.shaderData.setUniform3fv("selectedColor", [1.0, 0.0, 0.0]);
   // previewEdge
   this.previewEdge = {line: new Float32Array(mesh.edges.length*2*3), color: new Float32Array(mesh.edges.length*2)};
   this.computePreviewEdge();
   this.previewEdge.shaderData = Wings3D.gl.createShaderData();
   this.previewEdge.shaderData.setupAttribute('position', layoutVec, this.previewEdge.line, gl.STATIC_DRAW);
   this.previewEdge.shaderData.setupAttribute('color', layoutFloat, this.previewEdge.color, gl.DYNAMIC_DRAW);
   this.previewEdge.shaderData.setUniform4fv("selectedColor", [1.0, 0.0, 0.0, 1.0]);
   this.previewEdge.shaderData.setUniform4fv('hiliteColor', [0.0, 1.0, 0.0, 1.0]);
   // previewVertex
   this.previewVertex = {color: new Float32Array(mesh.vertices.length)};
   this.previewVertex.color.fill(0.0);
   this.previewVertex.shaderData = Wings3D.gl.createShaderData();
   this.previewVertex.shaderData.setupAttribute('position', layoutVec, this.geometry.buf.data, gl.STATIC_DRAW);
   this.previewVertex.shaderData.setupAttribute('color', layoutFloat, this.previewVertex.color, gl.DYNAMIC_DRAW);
   this.previewVertex.shaderData.setUniform4fv("selectedColor", [1.0, 0.0, 0.0, 1.0]);
   this.previewVertex.shaderData.setUniform4fv('hiliteColor', [0.0, 1.0, 0.0, 1.0]);
   // selecte(Vertex,Edge,Face)here
   this.selectedMap = new Map;
};


PreviewCage.prototype.computeBoundingSphere = function() {
   var buf = new ArrayBuffer(this.geometry.faces.length * 3 * 2 * Float32Array.BYTES_PER_ELEMENT); // twice the current size
   var centroid = {buf: {buffer: buf, data: new Float32Array(buf)}, len: 0 };
   // assign a boundingsphere for each polygon.
   var boundingSpheres = new Array(this.geometry.faces.length);
   boundingSpheres.length = 0;
   for (var i = 0; i < this.geometry.faces.length; ++i) {
      var center = new Float32Array(centroid.buf.buffer, Float32Array.BYTES_PER_ELEMENT*centroid.len, 3);
      centroid.len += 3;
      var polygon = this.geometry.faces[i];
      // recalibrate index for free.
      polygon.index = i;
      boundingSpheres.push( BoundingSphere.create(polygon, center) );
   }
   this.boundingSpheres = boundingSpheres;
   this.preview.centroid = centroid;
};


PreviewCage.prototype.computePreview = function() {
   // given the mesh topology, recompute drawindex and drawindexbuffer, only works for convex polygon.
   var model = this;
   // fill preview position, barycentric, selected
   var length = model.geometry.buf.data.length;
   //var newLength = model.geometry.buf.len+(model.boundingSpheres.length*3);
   //model.preview.vertices = new Float32Array(newLength);
   model.preview.barycentric = new Float32Array(length);
   model.preview.selected = new Float32Array(length/3);
   model.preview.selected.fill(0.0);
   model.preview.barycentric[0] = 1.0;
   model.preview.barycentric[1] = 0.0;
   model.preview.barycentric[2] = 1.0;
   model.preview.barycentric.copyWithin(3, 0, 3);

   var centroidLength = model.preview.centroid.buf.data.length;
   model.preview.centroid.barycentric = new Float32Array(centroidLength);
   model.preview.centroid.selected = new Float32Array(centroidLength/3);
   model.preview.centroid.barycentric.fill(1.0);
   model.preview.centroid.selected.fill(0.0);

   // setup triangle index.
   var barycentric = model.geometry.vertices.length;
   this.boundingSpheres.forEach( function(sphere, _index, _arrray) {
      var polygon = sphere.polygon;
      sphere.indexStart = model.preview.index.length;
      var size = Uint16Array.BYTES_PER_ELEMENT;
      var indices = new Uint16Array(model.preview.index.buffer, size*model.preview.index.length, 3*polygon.numberOfVertex);
      var indicesLength = 0;
      polygon.eachEdge( function(edge) {
         var vertex = edge.origin;
         if (indicesLength > 0) {
            indices[indicesLength++] = vertex.index;
            indices[indicesLength++] = barycentric; 
         }
         indices[indicesLength++] = vertex.index;         
      });
      // last triangle using the first vertices.
      indices[indicesLength++] = indices[0];
      indices[indicesLength++] = barycentric++;
      model.preview.index.length += indicesLength;
      sphere.indexEnd = model.preview.index.length;
   });
   // done, copy all polygon
};


PreviewCage.prototype.computePreviewEdge = function() {
   for (var i = 0, j = 0; i < this.geometry.edges.length; i++) {
      for (let halfEdge of this.geometry.edges[i]) {
         this.previewEdge.line.set(halfEdge.origin.vertex, j);
         j += 3;
      }
   }
   this.previewEdge.color.fill(0.0);
}


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
      gl.drawElements(gl.TRIANGLES, this.preview.index.length, gl.UNSIGNED_SHORT, 0);
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
   var centroids = this.preview.centroid.buf.data.subarray(0, this.preview.centroid.len)
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
         if (!ret.faces.has(edge.face.index)) {
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
         if (edge.face !== polygon && self.selectedMap.has(edge.face.index)) {
            vertexSelected = true;
         }
      }); 
      if (vertexSelected === false) {  // no more sharing, can safely reset
         selected[vertex.index] = 0.0;
         self.preview.shaderData.uploadAttribute('selected', vertex.index*4, self.preview.selectOff);
      }
   });
   selected = this.preview.centroid.selected;
   selected[polygon.index]= 0.0;
   this.selectedMap.delete(polygon.index);
   var byteOffset = (this.geometry.vertices.length+polygon.index)*4;
   this.preview.shaderData.uploadAttribute("selected", byteOffset, this.preview.selectOff);
};
PreviewCage.prototype.setFaceSelectionOn = function(polygon) {
   var self = this;
   var selected = this.preview.selected;      // filled triangle's selection status.
   // set the drawing color
   polygon.eachVertex( function(vertex) {
      selected[vertex.index] = 1.0;
      self.preview.shaderData.uploadAttribute('selected', vertex.index*4, self.preview.selectOn);
   });
   this.preview.centroid.selected;
   selected[polygon.index]= 1.0;
   this.selectedMap.set(polygon.index, polygon);
   var byteOffset = (this.geometry.vertices.length+polygon.index)*4;
   this.preview.shaderData.uploadAttribute("selected", byteOffset, this.preview.selectOn);
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
   var centroidLength = this.preview.centroid.len/3;
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