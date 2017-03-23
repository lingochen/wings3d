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
   // set up position, faceColor, index.
   this.preview.shaderData.setIndex(this.preview.index.data);
   this.preview.shaderData.setPosition(this.preview.vertices);
   //this.preview.shaderData.setColor(this.preview.color);
   this.preview.shaderData.setAttribute('barycentric', this.preview.barycentric);
   this.preview.shaderData.setAttribute('selected', this.preview.selected, 1);
   this.preview.shaderData.setUniform3fv("faceColor", [1.0, 0.0, 0.0]);
   this.preview.shaderData.setUniform3fv("selectedColor", [1.0, 0.0, 0.0]);
   // previewEdge
   this.previewEdge = {line: new Float32Array(mesh.edges.length*2*3), color: new Float32Array(mesh.edges.length*2)};
   this.computePreviewEdge();
   this.previewEdge.shaderData = Wings3D.gl.createShaderData();
   this.previewEdge.shaderData.setPosition(this.previewEdge.line);
   this.previewEdge.shaderData.setAttribute('color', this.previewEdge.color, 1);
   this.previewEdge.shaderData.setUniform4fv("selectedColor", [1.0, 0.0, 0.0, 1.0]);
   this.previewEdge.shaderData.setUniform4fv('hiliteColor', [0.0, 1.0, 0.0, 1.0]);
   // previewVertex
   this.previewVertex = {color: new Float32Array(mesh.vertices.length)};
   this.previewVertex.color.fill(0.0);
   this.previewVertex.shaderData = Wings3D.gl.createShaderData();
   this.previewVertex.shaderData.setPosition(this.geometry.buf.data);
   this.previewVertex.shaderData.setAttribute('color', this.previewVertex.color, 1);
   this.previewVertex.shaderData.setUniform4fv("selectedColor", [1.0, 0.0, 0.0, 1.0]);
   this.previewVertex.shaderData.setUniform4fv('hiliteColor', [0.0, 1.0, 0.0, 1.0]);
   // selectedMap
   
};


PreviewCage.prototype.computeBoundingSphere = function() {
   // assign a boundingSphere for each polygon.
   var boundingSphere = new Array(this.geometry.faces.length);
   boundingSphere.length = 0;
   for (var i = 0; i < this.geometry.faces.length; ++i) {
      var polygon = this.geometry.faces[i];
      // recalibrate index for free.
      polygon.index = i;
      boundingSphere.push( BoundingSphere.create(polygon) ); 
   }
   this.boundingSphere = boundingSphere;
};


PreviewCage.prototype.computePreview = function() {
   // given the mesh topology, recompute drawindex and drawindexbuffer, only works for convex polygon.
   var model = this;
   // fill preview position, barycentric, selected
   var newLength = model.geometry.buf.len+(model.boundingSphere.length*3);
   model.preview.vertices = new Float32Array(newLength);
   model.preview.barycentric = new Float32Array(newLength);
   model.preview.selected = new Float32Array(newLength/3);
   model.preview.selected.fill(0.0);
   for (var i = 0, j = 0; i < model.geometry.buf.len; i+=3) {
      model.preview.vertices[i] = model.geometry.buf.data[i];
      model.preview.vertices[i+1] = model.geometry.buf.data[i+1];
      model.preview.vertices[i+2] = model.geometry.buf.data[i+2];
      model.preview.barycentric[i] = 1.0;
      model.preview.barycentric[i+1] = 0.0;
      model.preview.barycentric[i+2] = 1.0;
   }
   for (; i < newLength; i+=3) {
      model.preview.barycentric[i] = 1.0;
      model.preview.barycentric[i+1] = 1.0;
      model.preview.barycentric[i+2] = 1.0;
   }
   // setup triangle index.
   var barycentric = model.geometry.vertices.length;
   this.boundingSphere.forEach( function(sphere, _index, _arrray) {
      var polygon = sphere.polygon;
      // copy the polygon's center to vertices
      model.preview.vertices[barycentric*3] = sphere.center[0];
      model.preview.vertices[barycentric*3+1] = sphere.center[1];
      model.preview.vertices[barycentric*3+2] = sphere.center[2];
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
      sphere.indexIndex = model.preview.index.length;
      indices[indicesLength++] = indices[0];
      indices[indicesLength++] = barycentric++;
      model.preview.index.length += indicesLength;
   });
   // done, copy all polygon
};


PreviewCage.prototype.computePreviewEdge = function() {
   for (var i = 0, j = 0; i < this.geometry.edges.length; i++) {
      this.previewEdge.line.set(this.geometry.edges[i].left.origin.vertex, j);
      j += 3;
      this.previewEdge.line.set(this.geometry.edges[i].right.origin.vertex, j);
      j += 3;
   }
   this.previewEdge.color.fill(0.0);
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
   for (var i = 0; i < this.boundingSphere.length; ++i) {
      if (this.boundingSphere[i].isIntersect(ray)){
         hitSphere.push( this.boundingSphere[i] );
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

PreviewCage.prototype.setVertexColor = function(vertex, color) {
   // selected color
   var j = vertex.index;  
   this.previewVertex.color[j] += color;
   var point = this.previewVertex.color.slice(j, j+1);
   this.previewVertex.shaderData.updateAttribute('color', j*Float32Array.BYTES_PER_ELEMENT, point);
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

PreviewCage.prototype.selectVertex = function(vertex) {
   var color;
   if (vertex.selected === false) {
      vertex.selected = true;
      color = 0.25;
      geometryStatus("select vertex: " + vertex.index);
   } else {
      vertex.selected = false;
      color = -0.25;
   }
   // selected color
   this.setVertexColor(vertex, color);
};

PreviewCage.prototype.setEdgeColor = function(wingedEdge, color) {
   // selected color
   var j = wingedEdge.index * 2;  
   this.previewEdge.color[j] += color;
   this.previewEdge.color[j+1] += color;
   var line = this.previewEdge.color.slice(j, j+2);
   this.previewEdge.shaderData.updateAttribute('color', j*Float32Array.BYTES_PER_ELEMENT, line);
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

PreviewCage.prototype.selectEdge = function(selectEdge) {
   // select polygon set color,
   var wingedEdge = selectEdge.wingedEdge;

   var color;
   if (wingedEdge.selected === false) {
      wingedEdge.selected = true;
      color = 0.25;
      geometryStatus("select edge: " + wingedEdge.index);
   } else {
      wingedEdge.selected = false;
      color = -0.25;
   }
   // selected color
   this.setEdgeColor(wingedEdge, color);
};


/**
 * 
 */
PreviewCage.prototype.selectFace = function(selectEdge) {
   // select polygon set color,
   var selected = this.preview.selected;
   var polygon = selectEdge.face;
   if (polygon.selected === false) {
      polygon.eachVertex( function(vertex) {
         selected[vertex.index] = 1.0;
      });
      selected[this.geometry.vertices.length+polygon.index]= 1.0;
      polygon.selected = true;
   } else {
      polygon.eachVertex( function(vertex) {
         var vertexSelected = false;
         vertex.eachOutEdge( function(edge) {
            if (edge.face !== polygon && edge.face.selected === true) {
               vertexSelected = true;
            }
         });
         if (vertexSelected === false) {  // no more sharing, can safely reset
            selected[vertex.index] = 0;
         }
      });
      selected[this.geometry.vertices.length+polygon.index]= 0.0;
      polygon.selected = false;
   }
   this.preview.shaderData.updateAttribute("selected", 0, selected);
   geometryStatus("polygon face # " + polygon.index);
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



