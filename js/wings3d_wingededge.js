import { PreviewCage } from "./wings3d_model";

/* require glmatrix
* http://kaba.hilvi.org/homepage/blog/halfedge/halfedge.htm. very nicely written half-edge explanation and pseudo code.
* https://fgiesen.wordpress.com/2012/02/21/half-edge-based-mesh-representations-theory/
* https://fgiesen.wordpress.com/2012/03/24/half-edge-based-mesh-representations-practice/
* https://fgiesen.wordpress.com/2012/04/03/half-edges-redux/ coder's perspective from requirement to implementation.
*
* http://mrl.nyu.edu/~dzorin/ig04/lecture24/meshes.pdf
* winged edge can have consistent orientation of edge. contray to what commonly believed.
* we composed WingedEdge using 2 half edge. slightly easier traversal, don't needs to test for which side we are on.
%% Edge in Wing3d a winged-edge object.
%%
%%                \       /           
%%                 \     /            
%%            ltpr  \   / rtsu        
%%                   \ /              
%%                   ve  b            
%%                    |               
%%                    |               
%%       lf           |          rf   
%%                    |               
%%                    |               
%%                 a  vs              
%%                   / \              
%%            ltsu  /   \ rtpr        
%%                 /     \            
%%                /       \           
%%                             
* our face is oriented counter clockwise.  
*
*/
"use strict";

var WingedEdge = function(orgVert, toVert) {
   this.index = -1;
   this.left = new HalfEdge(orgVert, this);
   this.right = new HalfEdge(toVert, this);
   this.left.pair = this.right;
   // link together for a complete loop
   this.left.next = this.right;
   // this.left.prev = this.right;
   this.right.pair = this.left;
   this.right.next = this.left;
   // this.right.prev = this.left;
};

WingedEdge.prototype[Symbol.iterator] = function* () {
   yield this.left;
   yield this.right;
};

WingedEdge.prototype.isLive = function() {
   return (this.left.origin !== null) && (this.right.origin !== null);
};

WingedEdge.prototype.adjacent = function* () {
   let next = this.left.next.wingedEdge;
   yield next;
   let prev = this.left.prev().wingedEdge;
   if (prev !== next) {
      yield prev;
   }
   next = this.right.next.wingedEdge;
   yield next;
   prev = this.right.prev().wingedEdge;
   if (prev !== next) {
      yield prev;
   }
};

WingedEdge.prototype.oneRing = function* () {
   for (let start of this) {
      let current = start.next;
      start = start.pair;
      do {
         yield current.wingedEdge;
         current = current.pair.next;
      } while (current !== start);
   }
};

WingedEdge.prototype.eachVertex = function* () {
   yield this.left.origin;
   yield this.right.origin;
};

// return left wing then right wing. \   right0-> /
//                                   |            |
//                          left0->  /            \ 
WingedEdge.prototype.wing = function* () {
   yield this.left.prev();
   yield this.left;
   yield this.left.next;
   yield this.right.prev();
   yield this.right;
   yield this.right.next;
};

var HalfEdge = function(vert, edge) {  // should only be created by WingedEdge
   this.next = null;
//   this.prev = null;       // not required, but very nice to have shortcut
   this.origin = vert;     // origin vertex, 
//   if (vert.outEdge === null) {
//     vert.outEdge = this;
//   }
   this.face = null;       // face pointer, not required, but useful shortcut
   this.pair = null;
   this.wingedEdge = edge; // parent winged edge
};

// boundary edge if no assigned face.
HalfEdge.prototype.isBoundary = function() {
   return this.face === null;
};
HalfEdge.prototype.isNotBoundary = function() {
   return this.face !== null;
};

/*Object.defineProperty(HalfEdge.prototype, 'pair', {
   get: function() {
      if (this.wingedEdge.left === this) {
         return this.wingedEdge.right;
      } else {
         return this.wingedEdge.left;
      }
    },
});*/


HalfEdge.prototype.destination = function() {
   return this.pair.origin;
}

// using polygon to find prev
HalfEdge.prototype.prevAux = function() {
   if (this.face !== null) {
      let current = this;
      while (current.next !== this) {
         current = current.next;
      }
      return current;
   }
   return null;
};

// using vertex to find prev
HalfEdge.prototype.prev = function() {
   if (this.pair.next === this)  {  // check for dangling edge.
      return this.pair; // we need this behavior.
   }
   var that = this;
   var ret = this.origin.findInEdge(function(inEdge, vertex) {
      if (inEdge.next === that) {   // found the prev
         return true;
      }
      return false;
   });
   if (ret === null) {
      // impossible condition, link list is broken
      console.log("HalfEdge.prev: link list is broken, cannot find prev");
   }
   return ret;
};

HalfEdge.prototype.eachEdge = function(callbackfn) {
   var start = this;
   var edge = start;
   if (edge) {
      do {  // counter clockwise ordering
         callbackfn(edge);
         edge = edge.pair.next;
      } while (edge && (edge !== start));
   }
};


//
var Vertex = function(pt) {
   this.vertex = pt;       // vec3. Float32Array. convenient function.
   this.outEdge = null;
 //  this.index = -1;
};

Object.defineProperty(Vertex.prototype, 'index', {
   get: function() {
      return (this.vertex.byteOffset / (this.vertex.BYTES_PER_ELEMENT*3));
   },
});

Object.defineProperty(Vertex.prototype, 'valence', {
   get: function() {
      let valence = 0;
      let start = this.outEdge;
      let edge = start;
      if (edge) {
         do {  // face edge is ccw. walking around vertex is cw.
            ++valence;
            edge = edge.pair.next;      // pair's next is outEdge too.
         } while (edge && (edge !== start));
      }
      return valence;
   },
});

//
// compute normal(later) and adjust outEdge to lowest index edge.
//
Vertex.prototype.reorient = function() {
   let outEdge = this.outEdge;
   let current = this.outEdge;
   do {
      if (current.index < outEdge.index) {
         outEdge = current;
      }
      current = current.pair.next;
   } while (current !== this.outEdge);
   this.outEdge = outEdge;    // get the lowest index outEdge;
};

Vertex.prototype.isLive = function() {
   return (this.outEdge !== null);
};

Vertex.prototype.oneRing = function* () {
   const start = this.outEdge; // we want inEdge.
   let current = start;
   do {
      const inEdge = current.pair;
      yield inEdge.origin;
      current = inEdge.next;
   } while(current !== start);
};

Vertex.prototype.edgeRing = function* () {
   const start = this.outEdge;
   let current = start;
   do {
      yield current;
      current = current.pair.next;
   } while(current !== start);
};

// utility functions for traversing all incident edge,
Vertex.prototype.eachInEdge = function(callbackfn) {
   // i am in
   var start = this.outEdge;
   var edge = start;
   if (edge) {
      do { // ccw ordering
         const inEdge = edge.pair;
         edge = edge.pair.next;   // my pair's next is outEdge. 
         callbackfn(inEdge, this);
      } while (edge && (edge !== start));
   }
};

Vertex.prototype.findInEdge = function(callbackfn) {
   // this.halfEdge is inEdge
   var start = this.outEdge;
   var edge = start;
   if (edge) {
      do { // ccw ordering
         if (callbackfn(edge.pair, this)) {
            return edge.pair;
         }
         edge = edge.pair.next;   // my pair's tail is in too. 
      } while (edge && (edge !== start));
   }
   return null;
};

// utility functions for traversing all direct out edge.
Vertex.prototype.eachOutEdge = function(callbackfn) {
   // i am in, so my pair is out.
   var start = this.outEdge;
   var edge = start;
   if (edge) {
      do {  // counter clockwise ordering
         callbackfn(edge, this);
         edge = edge.pair.next;      // pair's next is outEdge too.
      } while (edge && (edge !== start));
   }
};

// find first matching OutEdge
Vertex.prototype.findOutEdge = function(callbackfn) {
   // i am in, so my pair is out.
   var start = this.outEdge;
   var edge = start;
   if (edge) {
      do {  // counter clockwise ordering
         if (callbackfn(edge, this)) {
            return edge;
         }
         edge = edge.pair.next;
      } while (edge && (edge !== start));
   }
   return null;
};

// freeEdge meant no polygon face attach yet.
// find any freeInEdge.
Vertex.prototype.findFreeInEdge = function() {
   return this.findInEdge( function(halfEdge, vert) {
      if (halfEdge.face === null) {
         return true;
      }
      return false;
   });
};

Vertex.prototype.linkEdge = function(outHalf, inHalf) { // left, right of winged edge.
   if (this.outEdge === null) { // isolated vertex.
      this.outEdge = outHalf;
   } else {
      var inEdge = this.findFreeInEdge();
      if (inEdge === null) {
         console.log("Error: Vertex.linkEdge: complex vertex " + this.index);
         return false;
      }
      // else insert into circular list.
      var outEdge = inEdge.next;
      inEdge.next = outHalf;
      //fromHalf.prev = inEdge;
      inHalf.next = outEdge;
      //outEdge.prev = toHalf;
   }
   // link edge successful.
   return true;
};

Vertex.prototype.unlinkEdge = function(outHalf, inHalf)  {// left, right of winged edge
   const prev = outHalf.prev();
//   if (prev === null) {
//      console.log("bad prev");
//      return;
//   }
   if (this.outEdge === outHalf) {
      if (prev === inHalf) {
         this.outEdge = null;
         return;
      }
      this.outEdge = prev.pair;
   }
   // remove from circular list.
   prev.next = inHalf.next;
};

Vertex.prototype.isIsolated = function() {
   return (this.outEdge === null);
};

Vertex.prototype.numberOfEdge = function() {
   const limits = 1001;
   let count = 0;
   const start = this.outEdge;
   let current = start;
   do {
      count++;
      current = current.pair.next;
   } while ((current !== start) || (count > limits));
   return count;
};




var Polygon = function(startEdge, size) {
   this.halfEdge = startEdge;
   this.numberOfVertex = size;       // how many vertex in the polygon
   this.update(); //this.computeNormal();
   this.index = -1;
   this.isVisible = true;
};

// not on free list. not deleted.
Polygon.prototype.isLive = function() {
   return (this.halfEdge !== null);
};

Polygon.prototype.eachVertex = function(callbackFn) {
   // get every vertex of the face.
   var begin = this.halfEdge;
   var current = begin;
   do {
      callbackFn(current.origin);
      current = current.next;
   } while (current !== begin);
};

Polygon.prototype.eachEdge = function(callbackFn) {
   var begin = this.halfEdge;
   var current = begin;
   do {
      let next = current.next;
      callbackFn(current);
      current = next;
   } while (current !== begin);
};

Polygon.prototype.hEdges = function* () {
   const begin = this.halfEdge;
   let current = begin;
   do {
      let next = current.next;
      yield current;
      current = next;
   } while (current !== begin);
}

// adjacent face, along the edge
Polygon.prototype.adjacent = function* () {
   const check = new Set;
   const start = this.halfEdge;
   let current = start;
   do {
      let face = current.pair.face;
      if (face !== null && !check.has(face)) {
         check.add(face);
         yield face;
      }
      current = current.next;
   } while (current !== start);
};

// one ring faces. all the vertex's face
Polygon.prototype.oneRing = function* () {
   const check = new Set; check.add(this);
   const start = this.halfEdge;
   let current = start;
   do {
      const vertex = current.origin;
      for (let outEdge of vertex.edgeRing()) {
         const face = outEdge.face;
         if ((face !== null) && !check.has(face)) {
            check.add(face);
            yield face;
         }
      }
      current = current.next;
   } while (current !== start);

};

// ccw ordering
Polygon.prototype.computeNormal = function() {
   const U = vec3.create();
   const V = vec3.create();
   const v1 = this.halfEdge.origin.vertex;
   const v0 = this.halfEdge.next.origin.vertex;
   const v2 = this.halfEdge.next.destination().vertex;
   vec3.sub(U, v1, v0);
   vec3.sub(V, v2, v0);
   if (!this.normal) {
      this.normal = vec3.create();
   }
   vec3.cross(this.normal, V, U);
   vec3.normalize(this.normal, this.normal);
};


// recompute numberOfVertex and normal. and reorient.
Polygon.prototype.update = function() {
   const begin = this.halfEdge;
   let halfEdge = begin;
   let current = begin;
   this.numberOfVertex = 0;
   do {
      current.face = this;
      //current.origin.reorient();
      ++this.numberOfVertex;
      if (current.index < halfEdge.index) {
         halfEdge = current;
      }
      if (this.numberOfVertex > 1001) {   // break;   
         console.log("something is wrong with polygon link list");
         return;
      }
      current = current.next;
   } while (current !== begin);
   this.halfEdge = halfEdge;              // the lowest index.
   // compute normal.
   if (this.numberOfVertex > 2) {
      this.computeNormal();
   }
};

//
// getCentroid - not really centroid, but center of points.
// todo - find a good centroid algorithm. like tessellate to triangles. and use triangle's centroid to find real centroid.
//
Polygon.prototype.getCentroid = function(centroid) {
   const begin = this.halfEdge;
   let current = begin;
   let numberOfVertex = 0;
   do {
      vec3.add(centroid, centroid, current.origin.vertex);
      ++numberOfVertex;
      current = current.next;
   } while (current !== begin);
   // compute centroid.
   vec3.scale(centroid, centroid, 1.0/numberOfVertex);
};


/*let PolygonHole = function() {
   const ret = new Polygon();
   ret.isVisible = false;

};*/




//
// 
//
let MeshAllocator = function(allocatedSize = 1024) {
   var buf = new ArrayBuffer(allocatedSize*3 * Float32Array.BYTES_PER_ELEMENT);  // vertices in typedArray
   this.buf = { buffer: buf, data: new Float32Array(buf), len: 0, }; // vertex's pt buffer. to be used for Vertex.
   this.vertices = [];     // class Vertex
   this.edges = [];        // class WingedEdge
   this.faces = [];        // class Polygon
   this.freeVertices = [];
   this.freeEdges = [];
   this.freeFaces = [];
   // affected is when reuse, deleted, or change vital stats.
   this.affected = {vertices: new Set, edges: new Set, faces: new Set};
};
// allocation,
MeshAllocator.prototype.allocVertex = function(pt, delVertex) {
   if (this.freeVertices.length > 0) {
      let vertex;
      if (typeof delVertex === 'undefined') {
         vertex = this.vertices[this.freeVertices.pop()];
      } else {
         const index = delVertex.index;   // remove delOutEdge from freeEdges list
         this.freeVertices = this.freeVertices.filter(function(element) {
            return element !== index;
         });
         vertex = delVertex;
      }
      vertex.vertex.set(pt);
      this.affected.vertices.add( vertex );
      return vertex;
   } else {
      if ((this.buf.len+3) >= (this.buf.data.length)) {
         // reached maximum buff size, resize, double the size
         var buffer = new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT*this.buf.len*2);
         var data = new Float32Array(buffer);
         // copy data to new buffer.
         data.set(this.buf.data);
         // update Vertex.position;
         this.vertices.forEach(function(element, index, arry) {
            element.vertex = new Float32Array(buffer, Float32Array.BYTES_PER_ELEMENT*index*3, 3);
         });
         // replace
         this.buf.data = data;
         this.buf.buffer = buffer;
      }
      // vec3 is 3 float32. mapped into the big buffer. float32=4 byte.
      let vertex = new Float32Array(this.buf.buffer, Float32Array.BYTES_PER_ELEMENT*this.buf.len, 3);
      this.buf.len += 3;
      vertex[0] = pt[0];
      vertex[1] = pt[1];
      vertex[2] = pt[2];
      var _vert = new Vertex(vertex);
      //_vert.index = this.vertices.length;
      this.vertices.push( _vert );
      //this.affected.vertices.add( _vert );
      return _vert;
   }
};

MeshAllocator.prototype.allocEdge = function(begVert, endVert, delOutEdge) {
   let edge;
   let outEdge;
   if (this.freeEdges.length > 0) { // prefered recycle edge.
      if (typeof delOutEdge !== "undefined") {
         const index = delOutEdge.wingedEdge.index;   // remove delOutEdge from freeEdges list
         this.freeEdges = this.freeEdges.filter(function(element) {
            return element !== index;
         });
         edge = delOutEdge.wingedEdge;
         outEdge = delOutEdge;
      } else {
         edge = this.edges[this.freeEdges.pop()];
         outEdge = edge.left;
      }
      outEdge.origin = begVert;
      outEdge.pair.origin = endVert;
      this.affected.edges.add( edge );
   } else {
      // initialized data.
      edge = new WingedEdge(begVert, endVert);
      edge.index = this.edges.length;
      this.edges.push( edge );
      outEdge = edge.left;
      //this.affected.edges.add( edge );
   }

   return outEdge;
};

// todo: ?binary search for delPolygon, then use splice. a win? for large freelist yes, but, I don't think it a common situation.
MeshAllocator.prototype.allocPolygon = function(halfEdge, numberOfVertex, delPolygon) {
   let polygon;
   if (this.freeFaces.length > 0) {
      if (typeof delPolygon !== "undefined") {
         const index = delPolygon.index;   // remove delOutEdge from freeEdges list
         this.freeFaces = this.freeFaces.filter(function(element) {
            return element !== index;
         });
         polygon = delPolygon;
      } else {
         polygon = this.faces[ this.freeFaces.pop() ];
      }
      polygon.halfEdge = halfEdge;
      polygon.numberOfVertex = numberOfVertex;
      polygon.update();
      polygon.isVisible = true;  // make sure it visible.
      this.affected.faces.add( polygon );
   } else {
      polygon = new Polygon(halfEdge, numberOfVertex);
      polygon.index = this.faces.length;
      this.faces.push( polygon );
   }
   return polygon;
};

// recycled
// insert the index number in reverse order. smallest last.
MeshAllocator.prototype._insertFreeList = function(val, array) {
   var l = 0, r = array.length - 1;
   while (l <= r) {
      //let m = (l + r) >>> 1; /// equivalent to Math.floor((l + h) / 2) but faster
      let m = l + ((r-l) >>> 1); // avoid overflow. 
      let comparison = val - array[m];
      if (comparison > 0) {
         r = m - 1;
      } else if (comparison < 0) {
         l = m + 1;
      } else {
         break; // should no happened.
      }
   }
   array.splice(l, 0, val);
};
MeshAllocator.prototype.freeVertex = function(vertex) {
   vertex.outEdge = null;
   //vertex.vertex.fill(0.0);
   // assert !freeVertices.has(vertex);
   //this.freeVertices.push( vertex );
   this._insertFreeList(vertex.index, this.freeVertices);
   this.affected.vertices.add( vertex );
};

MeshAllocator.prototype.freeHEdge = function(edge) {
   const pair = edge.pair;
   edge.face = null;
   pair.face = null;
   edge.origin = null;
   pair.origin = null;
   // link together for a complete loop
   edge.next = pair;
   pair.next = edge;
   // assert !this.freeEdges.has( edge.wingedEdge );
   //this.freeEdges.push( edge.wingedEdge );
   this._insertFreeList(edge.wingedEdge.index, this.freeEdges);
   this.affected.edges.add( edge.wingedEdge );
};

MeshAllocator.prototype.freePolygon = function(polygon) {
   polygon.halfEdge = null;
   polygon.numberOfVertex = 0;
   // assert !freeFaces.has( polygon );
   //this.freeFaces.push( polygon );
   this._insertFreeList(polygon.index, this.freeFaces);
   this.affected.faces.add( polygon );
};


// update for affected (vertex, edge, and polygon)
MeshAllocator.prototype.clearAffected = function() {
   this.affected.vertices.clear();
   this.affected.edges.clear();
   this.affected.faces.clear();
};

MeshAllocator.prototype.addAffectedEdgeAndFace = function(vertex) {
   this.affected.vertices.add(vertex);
   const self = this;
   vertex.eachOutEdge( function(halfEdge) {
      self.affected.edges.add(halfEdge.wingedEdge);
      if (halfEdge.face !== null) {
         self.affected.faces.add(halfEdge.face);
     }
   });
};


// 
// changed - so Vertex, WingedEdge, and Polygon is allocated from meshAllocator. So different 
// Models on the same DraftBench can use the same Allocation. Merging becomes easier.
//
var WingedTopology = function(allocator) {
   this.alloc = allocator;
   this.vertices = new Set;
   this.faces = new Set;
   this.edges = new Set;
};

// act as destructor
WingedTopology.prototype.free = function() {
   for (let polygon of this.faces) {
      this.alloc.freePolygon(polygon);
   }
   this.faces = new Set;
   for (let wedge of this.edges) {
      this.alloc.freeHEdge(wedge.left);
   }
   this.edges = new Set;
   for (let vertex of this.vertices) {
      this.alloc.freeVertex(vertex);
   }
   this.vertices = new Set;
};

// merge - should we check alloc is the same?
WingedTopology.prototype.merge = function(geometryGenerator) {
   const self = this;
   this.vertices = new Set(function* () {yield* self.vertices; for (let geometry of geometryGenerator()) {yield* geometry.vertices;}}());
   this.edges = new Set(function* () {yield* self.edges; for (let geometry of geometryGenerator()) {yield* geometry.edges;}}());
   this.faces = new Set(function* () {yield* self.faces; for (let geometry of geometryGenerator()) {yield* geometry.faces;}}());
};

// separate - separate out non-connected geometry.
WingedTopology.prototype.separateOut = function() {
   const traversed = new Set;
   const separate = [];
   let faces;

   function oneRing(srcPolygon) {
      for (let hEdge of srcPolygon.hEdges()) {  // don't use oneRing. extra set operation.
         const polygon = hEdge.pair.face;
         if ((polygon !== null) && !traversed.has(polygon)) {
            traversed.add(polygon);
            faces.add(polygon);
            oneRing(polygon);
         }
      }
   };

   for (let polygon of this.faces) {
      if (!traversed.has(polygon)) {
         traversed.add(polygon);
         let geometry = new WingedTopology(this.alloc);
         faces = geometry.faces;              // ready for geometry.
         faces.add(polygon);
         oneRing(polygon);
         // ok, got one separated
         separate.push( geometry );
      }
   }

   if (separate.length > 1) {
      // we have the face list. now rebuild vertex and edge lists.
      for (let mesh of separate) {
         for (let polygon of mesh.faces) {
            for (let hEdge of polygon.hEdges()) {
               mesh.vertices.add( hEdge.origin );
               mesh.edges.add( hEdge.wingedEdge );
            }
         }
      }
      return separate; 
   } else {
      return null;
   }
};

WingedTopology.prototype.detachFace = function(faceSet) {
   const vertices = new Set;
   const edges = new Set;
   for (let polygon of faceSet) {
      this.faces.delete(polygon);
      for (let hEdge of polygon.hEdges()) {
         vertices.add(hEdge.origin);
         this.vertices.delete(hEdge.origin);
         edges.add(hEdge.wingedEdge);
         this.edges.delete(hEdge.wingedEdge);
      }
   }

   return {vertices: vertices, edges: edges};
};

WingedTopology.prototype.sanityCheck = function() {
   let sanity = true;
   // first check vertex for error.
   for (let [index, vertex] of this.vertices.entries()) {
      if (vertex.isLive()) {
         if (vertex.outEdge.origin !== vertex) {
            console.log("vertex " + index + " outEdge is wrong");
            sanity = false;
         } else {
            // manual find prev. 
            var start = vertex.outEdge;
            var edge = start;
            let prev = null;
            let iterationCount = 0;    // make sure, no infinite loop
            if (edge) {
               do { // ccw ordering
                  if (edge.pair.next === start) {
                     prev = edge.pair;
                     break;
                  }
                  edge = edge.pair.next;   // my pair's tail is in too. 
                  iterationCount++;
               } while (edge && (edge !== start) && (iterationCount < 101));
            }
            if (prev === null) {
               console.log("vertex " + index + " is broken");
               sanity = false;
            }
         }
      }
   }
   // now check polygon
   return sanity;
};

WingedTopology.prototype.addAffectedWEdge = function(wEdge) {
   this.alloc.affected.edges.add(wEdge);
};

WingedTopology.prototype.addAffectedFace = function(polygon) {
   this.alloc.affected.faces.add(polygon);
};

WingedTopology.prototype.addAffectedVertex = function(vertex) {
   this.alloc.affected.vertices.add(vertex);
};

WingedTopology.prototype.clearAffected = function() {
   this.alloc.clearAffected();
};

WingedTopology.prototype.addAffectedEdgeAndFace = function(vertex) {
   this.alloc.addAffectedEdgeAndFace(vertex);
};

WingedTopology.prototype._createPolygon = function(halfEdge, numberOfVertex, delPolygon) {
   const polygon = this.alloc.allocPolygon(halfEdge, numberOfVertex, delPolygon);
   this.faces.add(polygon);
   return polygon;
};

// return vertex index
WingedTopology.prototype.addVertex = function(pt, delVertex) {
   const vertex = this.alloc.allocVertex(pt, delVertex);
   this.vertices.add(vertex);
   return vertex;
};

WingedTopology.prototype._createEdge = function(begVert, endVert, delOutEdge) {
   const outEdge = this.alloc.allocEdge(begVert, endVert, delOutEdge);
   this.edges.add(outEdge.wingedEdge);
   return outEdge;
};
// recycled
WingedTopology.prototype._freeVertex = function(vertex) {
   if (this.vertices.delete(vertex)) {
      this.alloc.freeVertex(vertex);
   }
};

WingedTopology.prototype._freeEdge = function(edge) {
   if (this.edges.delete(edge.wingedEdge)){
      this.alloc.freeHEdge(edge);
   }
};

WingedTopology.prototype._freePolygon = function(polygon) {
   if (this.faces.delete(polygon)) {
      this.alloc.freePolygon(polygon);
   }
};

// return winged edge ptr because internal use only.
WingedTopology.prototype.addEdge = function(begVert, endVert, delOutEdge) {
   // what to do with loop edge?
   // what to do with parallel edge?

   // initialized data.
   var edge = this._createEdge(begVert, endVert, delOutEdge).wingedEdge;

   // Link outedge, splice if needed
   if (!begVert.linkEdge(edge.left, edge.right)) {
      // release the edge
      this._freeEdge(edge.left);
      return null;
   }
   // Link inedge, splice if needed
   if (!endVert.linkEdge(edge.right, edge.left)) {
      begVert.unlinkEdge(edge.left, edge.right);
      // release the endge
      this._freeEdge(edge.right);
      return null; 
   }

   // return outEdge.
   return edge.left;
};

WingedTopology.prototype.findFreeInEdge = function(inner_next, inner_prev) {
   // inner_prev is guaranteed to be boundary, so if link correctly, should be 

   // search a free gap, free gap will be between boundary_prev and boundary_next
   var boundary_prev = inner_next.pair;
   do {
      do {
         boundary_prev = boundary_prev.next.pair;
      } while (!boundary_prev.isBoundary());

      // ok ?
      if (boundary_prev !== inner_prev) {
         return boundary_prev;
      }
   } while (boundary_prev !== inner_next.pair);
   
   // check for bad connectivity. somewhere, there is no free inedge anywhere.
   console.log("WingedTopology.addFace.findFreeInEdge: patch re-linking failed");
   return null;
};



WingedTopology.prototype.spliceAdjacent = function(inEdge, outEdge) {
   if (inEdge.next === outEdge) {   // adjacency is already correct.
      return true;
   }

   const b = inEdge.next;
   const d = outEdge.prev();

   // Find a free incident half edge
   // after 'out' and before 'in'.
   const g = this.findFreeInEdge(outEdge, inEdge);

   if (g === null) {
      console.log("WingedTopology.spliceAjacent: no free inedge, bad ajacency");
      return false;
   } else if (g === d) {
      inEdge.next = outEdge;
      d.next = b;
   } else {
      const h = g.next;

      inEdge.next = outEdge;
      //out.half_->previous_ = in.half_;

      g.next = b;
      //b.half_->previous_ = g.half_;

      d.next = h;
      //h.half_->previous_ = d.half_;
   }
   return true;
};

// failed addPolygon. free and unlink edges.
WingedTopology.prototype._unwindNewEdges = function(halfEdges) {
   for (let halfEdge of halfEdges) {
      let pair = halfEdge.pair;
      halfEdge.origin.unlinkEdge(halfEdge, pair);
      pair.origin.unlinkEdge(pair, halfEdge);
      this._freeEdge(halfEdge);
   }
};

// passed in an array of vertex index. automatically create the required edge.
// return polygon index.
// add proper handling for non-manifold. (2017/05/28)
// add checking for complex polygon. (2017/05/29)
WingedTopology.prototype.addPolygon = function(pts) {
   var halfCount = pts.length;
   if (halfCount < 3) { // at least a triangle
      return -1;
   }

   var i, nextIndex;
   // builds WingEdge if not exist
   var halfLoop = [];
   var newEdges = [];
   const complex = new Set;
   for (i =0; i < halfCount; ++i) {
      nextIndex = i + 1;
      if (nextIndex == halfCount) {
         nextIndex = 0;
      }

      var v0 = this.alloc.vertices[pts[i]];
      var v1 = this.alloc.vertices[pts[nextIndex]];
      var edge = this.findHalfEdge(v0, v1);
      if (edge === null) { // not found, create one
         edge = this.addEdge(v0, v1);
         if (edge === null) {
            this._unwindNewEdges(newEdges);
            return null;
         }
         newEdges.push(edge);
         complex.add(edge.wingedEdge);
      } else if (!edge.isBoundary()) { // is it free? only free can form a chain.
         this._unwindNewEdges(newEdges);
         // This half-edge would introduce a non-manifold condition.
         console.log("non-manifold condition, no boundary");
         return null;
         // should we rewinded the newly created winged edge? currently nay.
      } else {
         // check if the wingedEdge already included.
         if (complex.has(edge.wingedEdge)) {
            this._unwindNewEdges(newEdges);
            // complex polygon that cannot be handle properly with halfEdge structure.
            console.log("complex polygon detected");
            return null;
         }
         complex.add(edge.wingedEdge);
      }

      halfLoop.push( edge );
   }

   // Try to reorder the links to get proper orientation.
   for (i = 0;i < halfCount;++i) {
      nextIndex = i + 1;
      if (nextIndex == halfCount) {
         nextIndex = 0;
      }

      if (!this.spliceAdjacent(halfLoop[i], halfLoop[nextIndex])) {
         this._unwindNewEdges(newEdges);
         // The polygon would introduce a non-manifold condition.
         console.log("non-manifold condition, cannot splice");
         return null;
      }
   }

   // Create and link the polygon
   var newPolygon = this._createPolygon(halfLoop[0], pts.length);

   // Link half-edges to the polygon.
   for (i = 0;i < halfCount; ++i) {
      halfLoop[i].face = newPolygon;
   }

   return newPolygon;
};

// utility for addPolygon.
WingedTopology.prototype.findHalfEdge = function(v0, v1) {
   // v0 = start, v1 = end.
  //assert(_start_vh.is_valid() && _end_vh.is_valid());

  return v0.findOutEdge( function(edge, _vertex) {
            if (edge.destination() === v1) {
               return true;
            }
            return false;
         });
};



// to split a face into 2 faces by insertEdge, delOutEdge and delPolygon optional.
WingedTopology.prototype.insertEdge = function(prevHalf, nextHalf, delOutEdge, delPolygon) {
   // assert(prevHalf.face === nextHalf.face);
   // assert(prevHalf.next !== _nextHalf);      // we want to split face, not adding edge
   const v0 = prevHalf.destination();
   const v1 = nextHalf.origin;
   const oldPolygon = prevHalf.face;

   // create edge and link together.
   const outEdge = this._createEdge(v0, v1, delOutEdge);
   const inEdge = outEdge.pair;
   const nextPrev = prevHalf.next;           // save for later use
   const prevNext = nextHalf.prev();
   prevHalf.next = outEdge;
   outEdge.next = nextHalf;
   prevNext.next = inEdge;
   inEdge.next = nextPrev;
  
   //now set the face handles
   const newPolygon = this._createPolygon(outEdge, 4, delPolygon);  // readjust size later.
   outEdge.face = newPolygon;
   let size = 0;
   newPolygon.eachEdge( function(halfEdge) {
      ++size;
      halfEdge.face = newPolygon;
   });
   newPolygon.numberOfVertex = size;

   // inEdge is oldPolygon
   inEdge.face = oldPolygon;
   if (oldPolygon.halfEdge.face === newPolygon) {
      //  pointed to one of the halfedges now assigned to newPolygon
      oldPolygon.halfEdge = inEdge;
   }
   size = 0;
   oldPolygon.eachEdge( function(halfEdge) {
      ++size;
   });
   oldPolygon.numberOfVertex = size;
   this.addAffectedFace( oldPolygon );

   // adjustOutEdge for v0, v1. point to boundary so, ccw work better?
   return outEdge;
}

//
// insert a new outEdge at (origin), oldOut push out to newOrigin.
//
WingedTopology.prototype.splitEdge = function(outEdge, pt, delOut) {
   const inEdge = outEdge.pair;
   const outPrev = outEdge.prev();
   const inNext = inEdge.next;
   const vOrigin = outEdge.origin;
   const vOut = vOrigin.outEdge;

   //add the new edge
   const vertex = this.addVertex(pt);
   const newOut = this._createEdge(vOrigin, vertex, delOut);
   const newIn = newOut.pair;
   // fixe the halfedge connectivity
   newOut.next = outEdge;
   inEdge.next = newIn;
  
   outPrev.next = newOut;
   newIn.next = inNext;
  
   newOut.face = outEdge.face;
   newOut.face.numberOfVertex++;
   newIn.face = inEdge.face;
   newIn.face.numberOfVertex++;

   // fix vertex
   outEdge.origin = vertex;
   vertex.outEdge = newIn;
  
   if (vOut === outEdge) {
      vOrigin.outEdge = newOut;
   }
   this.addAffectedWEdge( outEdge.wingedEdge );     // edge changed.
   // return the newOut
   return newOut;
};



// used by bevel
WingedTopology.prototype.doubleEdge = function(inEdge) {
   const prev = inEdge.prev();

   // reassign pointer
   const newOut = this._createEdge(inEdge.destination(), inEdge.origin);
   const newIn = newOut.pair;
   newOut.next = inEdge;
   newIn.next = inEdge.next;
   inEdge.next = newOut;
   prev.next = newIn;

   // reassign polygon
   newIn.face = inEdge.face;
   if (inEdge.face.halfEdge === inEdge) {
      newIn.face.halfEdge = newIn;
   }
   this.addAffectedFace(newIn.face);
   const newPolygon = this._createPolygon(newOut, 2);
//   newOut.face = newPolygon;
//   inEdge.face = newPolygon;

   return newOut;
};
// create new edge, but no new vertex.
WingedTopology.prototype.simpleSplit = function(inEdge) {
   // check(inEdge.destination() !== inEdge.next.origin)
   const outEdge = this._createEdge(inEdge.destination(), inEdge.next.origin);
   // now break it up.
   outEdge.next = inEdge.next;
   inEdge.next = outEdge;
   // outEdge.pair.next have to wait 
   outEdge.face = inEdge.face;
   outEdge.face.numberOfVertex++;

   return outEdge; 
};
// prepare adding vertex
WingedTopology.prototype.prepVertex = function(inStart, outStop, adjacentRed, vertexLimit, slideEdge, origin) {
   if (!origin) {
      origin = outStop.origin;
   }
   const pts = vertexLimit.get(origin);
   let inEdge = inStart;
   let notDone = true;
   let outEdge;
   do {
      outEdge = inEdge.next;
      outEdge.origin = origin;
      inEdge = outEdge.pair;
      if (notDone) {
         pts.push(inEdge);
         if (!adjacentRed.has(outEdge.wingedEdge)) { // white edge, definite walk along this edge
            notDone = false;
            pts.length = 0;      // make sure we only have one.
            pts.push(inEdge);
         }
      }
   } while (outEdge !== outStop);
   if (slideEdge) {
      for (let hEdge of pts) {
         slideEdge.add(hEdge);   // 
      }
   }
};
WingedTopology.prototype.prepVertexAdd = function(inStart, outStop, adjacentRed, vertexLimit, slideEdge) {
   const origin = this.addVertex(inStart.destination().vertex);
   vertexLimit.set(origin, []);
   this.prepVertex(inStart, outStop, adjacentRed, vertexLimit, slideEdge, origin);
   return origin;
}
WingedTopology.prototype.isSplitEdgeSelected = function(origin, dest, adjacentRed) {
   for (let vertex of [origin, dest]) {
      let count = 0;
      let redCount = 0;
      for (let hEdge of vertex.edgeRing()) {
         count++;
         if (adjacentRed.has(hEdge.wingedEdge)) {
            redCount++;
         }
      }
      if (count !== 3) { // (count > 3) { // equal 3 or 4
         return false;
      } else if (redCount !== 2) {
         return false;
      }
   }
   return true;
}
// nice explanation.
// https://stackoverflow.com/questions/35378378/multi-edge-bevel-on-half-edge-structure
//
// We can split the operation into two conceptual steps. First, double the red edges. Second, explode the vertices incident to at least one red edge.
//
// The first step can be accomplished one edge at a time. Given a red edge e, create another edge e'. For one half edge of e, 
// insert one half edge of e' as the next half-edge with the same head in clockwise order. For the other half edge of e, 
// insert the other half edge of e' as the next half edge with the same head in counterclockwise order.
//
// The second step can be accomplished one vertex at a time. Given a vertex v incident to at least one red edge, 
// group the half edges with head v as follows. Break that circular list (1) between every adjacent pair of red half edges that arose from the same original edge 
// (2) between every adjacent pair of white edges (adjacent means that the two half edges are next/previous in clockwise/counterclockwise order). 
// For each break, create a new edge. Splice everything together.
//
WingedTopology.prototype.bevelEdge = function(wingedEdges) {   // wingedEdges(selected) is a set
   const ret = {vertices: [], halfEdges: [], collapsibleWings: new Set, selectedFaces: new Set};
   const vertices = new Set;
   const vertexLimit = new Map;
   const adjacentRed = new Map;
   const slideEdge = new Set;      // halfEdge, where we will slide the bevel edge
   const twoEdgeVertexHack = new Set;
   // double selected edge, and add face. 
   for (let wingedEdge of wingedEdges) {
      const outEdge = this.doubleEdge(wingedEdge.left);   // add edge and faces
      ret.selectedFaces.add(outEdge.face);
      vertices.add( outEdge.origin );
      vertices.add( outEdge.destination() );
      //ret.halfEdges.push(wingedEdge.left);    // start of new face. also can be use for undo.
      // we create a new tag.
      adjacentRed.set(wingedEdge, outEdge.wingedEdge);
      adjacentRed.set(outEdge.wingedEdge, wingedEdge);
      ret.collapsibleWings.add(outEdge.wingedEdge);
   }

   // for every vertex, add edge and chamfer vertex for 1)adjacent red edges, 2) adjacent white edges.
   for (let vertex of vertices) {
      ret.vertices.push(vertex);       // affected vertex original
      vertexLimit.set(vertex, []);
      let edgeInsertion = [];
      const start = vertex.outEdge;    // walk the ring
      let current = start;
      do {
         let next = current.pair.next;  // save 
         // check if current && prev are the same color edge, (white,white, red,red)
         if (adjacentRed.has(current.wingedEdge)) {
            if (adjacentRed.get(current.wingedEdge) === next.wingedEdge) {  // original red+expansion pair.
               edgeInsertion.push( current.pair ); // insertion point
            }
         } else if (!adjacentRed.has(next.wingedEdge)) {   // (white, white) pair
            edgeInsertion.push( current.pair );
         }
         current = next;
      } while(current !== start);   // save the last pair (end, start) for special processing.
      // real expandsion of vertex, and edge
      let insertion;
      let prevOut;
      let firstOut;
      for (let nextStop of edgeInsertion) {
         if (insertion) {
            const origin = this.prepVertexAdd(insertion, nextStop.pair, adjacentRed, vertexLimit, slideEdge);
            let out = this.simpleSplit(insertion);
            origin.outEdge = out.pair;
            ret.vertices.push( origin );
            ret.halfEdges.push( out.pair );
            if (prevOut) {
               out.pair.next = prevOut.pair;
            } else {
               firstOut = out;
            }
            prevOut = out;
         }
         insertion = nextStop;
      }
      // last edge
      if (edgeInsertion.length === 1) {   // must be splitEdge, special case. needs to create an extra triangle face.
         // create another edge
         const splitOut = insertion.next.pair.next;
         const outEdge = this.doubleEdge(splitOut.pair); // now we have 4 edge to expand, won't get into strange shape
         adjacentRed.set(splitOut.wingedEdge, outEdge.wingedEdge);
         adjacentRed.set(outEdge.wingedEdge, splitOut.wingedEdge);
         ret.selectedFaces.add(outEdge.face);
         const orig = this.prepVertexAdd(insertion, splitOut, adjacentRed, vertexLimit);
         //adjacentRed.delete(splitOut.wingedEdge);
         //adjacentRed.delete(outEdge.wingedEdge);
         const edge = this.simpleSplit(insertion);
         orig.outEdge = edge.pair;
         ret.vertices.push( orig );
         ret.halfEdges.push( edge.pair );
         // remember to fix the last edge
         const hEdge = edge.pair;
         hEdge.next = outEdge;
         splitOut.pair.next = hEdge;
         // fix the face pointer
         hEdge.face = outEdge.face;
         hEdge.face.numberOfVertex++;
         // this vertexLimit will limit to outer ring
         let pts = vertexLimit.get(vertex);
         pts.push(outEdge.pair);
         pts.push(insertion.pair.next.pair);
         pts = vertexLimit.get(orig);
         pts[0] = pts[0].prev(); // readjust
      } else if (edgeInsertion.length === 2) {   // 2 edges, so they should be sharing the same edge.
         const inStart = edgeInsertion[0];
         // breakup the insertion point, to reuse the lone edge
         let hEdge = inStart.next.pair;
         hEdge.next = insertion.next;
         insertion.next = hEdge;
         // fix the face ptr
         hEdge.face = insertion.face;
         hEdge.face.numberOfVertex++;
         this.addAffectedFace(hEdge.face);
         // fix the vertexLimit.
         const pts = vertexLimit.get(hEdge.next.origin); // to limit the original vertex
         if (!this.isSplitEdgeSelected(hEdge.next.origin, hEdge.origin, adjacentRed)) {
            const red = [];
            // we move along non-selected edge
            do { hEdge = hEdge.next.pair; red.push(hEdge); } while (adjacentRed.has(hEdge.wingedEdge));
            if (hEdge !== insertion.next) {
               pts.push( hEdge );
               slideEdge.add(hEdge );
            } else { // reselect all.
               red.pop();
               for (let hEdge of red) {pts.push(hEdge);slideEdge.add(hEdge);}
            }
         } else {  // adjust vertex, a lot of hacks.
            const hEdge2 = hEdge.next.pair;
            let prev = hEdge2.prev(); pts.push( prev ); slideEdge.add(prev);
            let temp = hEdge2.next.next.pair; pts.push(temp); slideEdge.add(temp);
            // readjust original
            const pts2 = vertexLimit.get(hEdge.origin);
            prev = pts2[0].prev(); pts2[0] = prev; slideEdge.add(prev);
            temp = pts2[1].pair.next.pair; pts2[1] = temp; slideEdge.add(temp);
            twoEdgeVertexHack.add(hEdge.origin).add(hEdge.destination());
         }
      } else { // normal expansion
         // add the last one, simple split
         // check(insertion.destination !== insertion.next.origin);
         this.prepVertex(insertion, edgeInsertion[0].pair, adjacentRed, vertexLimit, slideEdge);
         const edge = this.simpleSplit(insertion);
         ret.halfEdges.push(edge.pair);
         // create a new innerface, and fix the edge to point to it
         edge.pair.next = prevOut.pair;
         firstOut.pair.next = edge.pair;
         const polygon = this._createPolygon(edge.pair, edgeInsertion.length);
         ret.selectedFaces.add( polygon );
      }
   }
   // compute vertexLimit magnitude, and expanding direction. (reuse normal), 
   // now (vertexLimit - vertex) = direction. 
   ret.vertexLimit = Number.MAX_SAFE_INTEGER;       // magnitude
   ret.position = new Float32Array(ret.vertices.length*3);     // saved the original position
   ret.direction = new Float32Array(ret.vertices.length*3);    // also add direction.
   let i = 0;
   const pt = vec3.create();  // temporary
   for (let vertex of ret.vertices) {
      const position = ret.position.subarray(i, i+3);
      const direction = ret.direction.subarray(i, i+3);
      const hEdges = vertexLimit.get(vertex);
      let avg = 1.0;
      if (twoEdgeVertexHack.has(vertex)) {
         avg = 0.4;
      }
      for (let hEdge of hEdges) {
         vec3.copy(pt, hEdge.origin.vertex);
         vec3.copy(position, vertex.vertex);
         vec3.sub(pt, pt, position);
         let average = avg;
         if (slideEdge.has(hEdge.pair)) { // yep, we can only go as far as half point.
            average = 0.5;
         } 
         ret.vertexLimit = Math.min(vec3.length(pt)*average, ret.vertexLimit);
         vec3.normalize(pt, pt);
         vec3.add(direction, direction, pt);
      }
      if (avg == 0.4) {
         vec3.normalize(direction, direction);
      }
      i+=3;
   }

   // we needs faces, we needs
   return ret;
};

//
// bevel Vertex. create new edge between each vertex's outEdge, which is n. will create (n-1) vertex, and one face, for each 
// selected vertex.
WingedTopology.prototype.bevelVertex = function(vertices) {
   const ret = {vertices: [], halfEdges: [], selectedFaces:[], };

   const slideHEdges = new Set;
   for (let vertex of vertices) {
      let prevOut = vertex.outEdge;
      let prevBevel;
      let outEdge = prevOut.pair.next;
      let count = 0;
      ret.vertices.push(vertex);
      slideHEdges.add(outEdge);
      while (outEdge !== vertex.outEdge) { // splice between outTarget and inEdge. add a new Vertex
         const origin = this.addVertex(outEdge.origin.vertex);
         ret.vertices.push(origin);
         outEdge.origin = origin;
         origin.outEdge = outEdge;
         slideHEdges.add(outEdge);
         const outNext = outEdge.pair.next;     // save the next Out
         let outBevel = this.simpleSplit(prevOut.pair);  // the newly create bevel edge
         ret.halfEdges.push(outBevel.pair);
         //origin.outEdge = outBevel.pair;
         ++count;
         if (prevBevel) {  // innerEdge connect together.
            outBevel.pair.next = prevBevel.pair;
         }
         prevBevel = outBevel;
         // check(outEdge.next === nextOut);
         prevOut = outEdge;
         outEdge = outNext;
      }
      // fixed the inner edge then add face.
      if (count > 1) {  // add the last edge
         let lastBevel = this.simpleSplit(prevOut.pair);
         ret.halfEdges.push(lastBevel);   // reverse direction. so collapse will do the right thing.
         lastBevel.pair.next = prevBevel.pair; 
         const firstBevel = vertex.outEdge.pair.next;
         firstBevel.pair.next = lastBevel.pair;   // innerEdge loop connected.
         const polygon = this._createPolygon(firstBevel.pair, count+1);
         ret.selectedFaces.push(polygon);
      } else { // weird case of 2 edge vertex

      }
   }

   // compute moveLimit.
   ret.vertexLimit = Number.MAX_SAFE_INTEGER;       // magnitude
   ret.position = new Float32Array(ret.vertices.length*3);     // saved the original position
   ret.direction = new Float32Array(ret.vertices.length*3);    // also add direction.
   let i = 0;
   for (let vertex of ret.vertices) {
      const position = ret.position.subarray(i, i+3);
      const direction = ret.direction.subarray(i, i+3);
      vec3.copy(position, vertex.vertex);
      vec3.sub(direction, vertex.outEdge.destination().vertex, position);
      if (slideHEdges.has(vertex.outEdge.pair)) {  // half length because we are sharing the expansion.
         ret.vertexLimit = Math.min(vec3.length(direction)*0.5, ret.vertexLimit);
      } else {
         ret.vertexLimit = Math.min(vec3.length(direction), ret.vertexLimit);  // the full length.
      }
      vec3.normalize(direction, direction);
      i += 3;
   }

   // results
   return ret;
};



WingedTopology.prototype.extrudeContours = function(edgeLoops) {
   // extrude face. connect(outer, inner) loop.
   let extrudeContours = [];
   for (let contour of edgeLoops) {
      for (let edge of contour) {
         let polygon = [];
         polygon.push( edge.inner.origin.index );
         polygon.push( edge.outer.origin.index );
         polygon.push( edge.outer.destination().index );
         polygon.push( edge.inner.destination().index );
         this.addPolygon( polygon );
         extrudeContours.push( this.findHalfEdge(edge.inner.origin, edge.outer.origin) );
      }
   }

   return extrudeContours;
};

// Similar to findFaceGroup
WingedTopology.prototype.findEdgeGroup = function(selectedWingedEdge) {
   const processWingedEdge = new Set(selectedWingedEdge);
   let wingedEdgeGroup = null;
   function processNeighbors(wingedEdge) {
      processWingedEdge.delete(wingedEdge);
      wingedEdgeGroup.add(wingedEdge);
      for (let neighborWinged of wingedEdge.oneRing()) {
         if (processWingedEdge.has(neighborWinged)) {
            processNeighbors(neighborWinged);
         }
      }
   };

   let list = [];
   for (let wingedEdge of processWingedEdge) {
      wingedEdgeGroup = new Set;
      processNeighbors(wingedEdge);
      list.push( wingedEdgeGroup );
   }

   return list;
};


//
// similar to findContours. but return a list of faces.
//
WingedTopology.prototype.findFaceGroup = function(selectedPolygon) {
   const processPolygon = new Set(selectedPolygon);
   let faceGroup = null;

   function processNeighbors(polygon) {
      processPolygon.delete(polygon);
      faceGroup.add(polygon);
      polygon.eachVertex( (vertex) => {   // polygon sharing the same vertex will be group together
         vertex.eachOutEdge( (outEdge) => {
            const face = outEdge.pair.face;
            if (processPolygon.has(face)) {
               // depth first search
               processNeighbors(face);
            }
          });
      });
   };

   let list = [];
   for (let polygon of processPolygon) {
      faceGroup = new Set;
      processNeighbors(polygon);
      list.push( faceGroup );
   }

   return list;
}



WingedTopology.prototype.findContours = function(selectedPolygon) {
   const self = this;
   const contourEdges = new Set;
   const edgeLoops = [];
   // find all contourEdges to extrude
   for (let polygon of selectedPolygon) {
      polygon.eachEdge( function(outEdge) {
         if (!contourEdges.has(outEdge) && !selectedPolygon.has(outEdge.pair.face)) {
            const edgeLoop = [];
            let currentIn = outEdge;
            do {
               // this edge is contour. now walk cwRing to find the next edges.
               let nextIn = currentIn.next.pair;
               while (nextIn !== currentIn) {
                  if (!selectedPolygon.has(nextIn.face)) { // yup, find the other contour
                     break;
                  }
                  nextIn = nextIn.next.pair;
               }
               const edge = {outer: currentIn, inner: null};
               edgeLoop.push( edge );
               contourEdges.add(currentIn);       // checkIn the contour edge.
               // we cw walk over to the next contour edge.
               currentIn = nextIn.pair;
            } while (currentIn !== outEdge);      // check if we come full circle
            edgeLoops.push( edgeLoop );
         }
      } );
   }

   return edgeLoops;
};


// weld innerLoop to outerLoop. both side must null face. 
WingedTopology.prototype.weldContour = function(edgeLoop) {
   let edgePrev = edgeLoop[edgeLoop.length-1]
   for (let i = 0; i < edgeLoop.length; ++i) {
      const edge = edgeLoop[i];
      if (edgePrev.inner.next !== edge.inner) { // check for contour tht don't have interpose edge
         const end = edge.inner;
         const current = edgePrev.inner.next;
         edgePrev.outer.next = current;
         let prev;
         do {
            current.origin = edge.outer.origin;
            prev = current.pair;
            current = prev.next;
         } while (current !== end);
         prev.next = edge1.outer;
      }
      edge.outer.face = edge.inner.face;
      if (edge.inner.face.halfEdge === edge.inner) {
         edge.outer.face.halfEdge = edge.outer;
      }

      edgePrev = edge;
   }

   // now we can safely release memory
   for (let edge of edgeLoop) {
      // remove vertex, and edge.
      this._freeVertex(edge.inner.origin);
      this._freeEdge(edge.inner);
   }
};


// lift edges from outerLoop to innerLoop. null the face between inner and outerface
WingedTopology.prototype.liftContour = function(edgeLoop) {
   if (edgeLoop.length == 0) {   // should not happened, but. Should we check ( < 4) too?
      return edgeLoop;
   }

   // first create innerLoop
   let firstVertex = this.addVertex(edgeLoop[0].outer.origin.vertex);
   let fromVertex = firstVertex; 
   for (let i = 0; i < edgeLoop.length; ++i) {
      let outerEdge = edgeLoop[i].outer;
      let toVertex;
      if (i == (edgeLoop.length-1)) {  // the last one loopback
         toVertex = firstVertex;
      } else {
         toVertex = this.addVertex(outerEdge.destination().vertex);
      }
      edgeLoop[i].inner = this.addEdge(fromVertex, toVertex);
      fromVertex = toVertex;
   }

   // lift loop
   let edge0 = edgeLoop[edgeLoop.length-1];
   // lift the face edge from outer to inner.
   for (let j = 0; j < edgeLoop.length; ++j) {
      let edge1 = edgeLoop[j];
      // lift edges from outer, and connect to inner
      let outerNext = edge0.outer.next;
      if (outerNext !== edge1.outer) {
         // lift begin to end
         let outer1Prev = edge1.outer.prev();
         edge0.outer.next = edge1.outer;
         edge0.inner.next = outerNext;
         outer1Prev.next = edge1.inner;
         // reset all vertex
         let inner = outerNext;
         do {
            if (inner.origin.outEdge === inner) {
               inner.origin.outEdge = edge1.outer;
            }
            inner.origin = edge1.inner.origin;
            inner = inner.pair.next;
         } while (inner !== edge1.inner);
      }
      edge0 = edge1;       // move edge post
      // setup the faces.
      edge1.inner.face = edge1.outer.face;
      edge1.outer.face = null;
      if (edge1.inner.face.halfEdge === edge1.outer) {
         edge1.inner.face.halfEdge = edge1.inner;
      }
   }
   return edgeLoop;
};


// lift edges from outerLoop to innerLoop.
WingedTopology.prototype.liftContours = function(edgeLoops) {
   for (let edgeLoop of edgeLoops) {
      this.liftContour(edgeLoop);
   }

   return edgeLoops;
};


// insert a new edge, for undo purpose
WingedTopology.prototype._liftEdge = function(outLeft, inRight, fromVertex, delEdge) {
   const beg = outLeft.prev();
   const endOut = inRight.next;
   const outEdge = this._createEdge(fromVertex, outLeft.origin, delEdge);
   const inEdge = outEdge.pair;
   inRight.next = outEdge;
   outEdge.next = endOut;
   inEdge.next = outLeft;
   beg.next = inEdge;
   fromVertex.outEdge = outEdge;
   // lift edges up from left to right.
   let currentOut = outLeft;
   do {
      if (currentOut.origin.outEdge === currentOut) {
         currentOut.origin.outEdge = endOut; // or inEdge a safer choice? 
      }
      currentOut.origin = fromVertex;
      this.addAffectedWEdge( currentOut.wingedEdge );
      currentOut = currentOut.pair.next;
   } while (currentOut !== outEdge);
   outEdge.face = inRight.face;
   outEdge.face.numberOfVertex++;
   inEdge.face = outLeft.face;
   inEdge.face.numberOfVertex++;
   this.addAffectedFace(outEdge.face);
   this.addAffectedFace(inEdge.face);
}


WingedTopology.prototype._collapseEdge = function(halfEdge) {
   const next = halfEdge.next;
   const prev = halfEdge.prev();

   const pair = halfEdge.pair;
   const pairNext = pair.next;
   const pairPrev = pair.prev();

   const fromVertex = halfEdge.origin;
   const toVertex = pair.origin;

   // halfedge -> vertex
   let current = pairNext;
   while (current !== halfEdge) {
      current.origin = toVertex;
      this.addAffectedWEdge(current.wingedEdge);
      current = current.pair.next;
   }

   // reconnect 
   prev.next = next;
   pairPrev.next = pairNext;

   // adjust face
   let face = halfEdge.face;
   if (face.halfEdge === halfEdge) {
      face.halfEdge = next;
   }
   face.numberOfVertex--;
   this.addAffectedFace(face);
   face = pair.face;
   if (face.halfEdge === pair) {
      face.halfEdge = pairNext;
   }
   face.numberOfVertex--;
   this.addAffectedFace(face);

   // adjust vertex
   if (toVertex.outEdge === pair) {
      toVertex.outEdge = next;
   }

   // delete stuff
   this._freeEdge(halfEdge);
   this._freeVertex(fromVertex);

   // undo collapseEdge
   return {hEdge: halfEdge, pairNext: pairNext, prev: prev, vertex: fromVertex};
};

// undo of  _collapseLoop.
WingedTopology.prototype._restoreLoop = function(halfEdge, delEdge, delPolygon) {
   const prev = halfEdge.prev();
   const outEdge = this._createEdge(halfEdge.destination(), halfEdge.origin, delEdge);
   const inEdge = outEdge.pair;

   // fix connection
   prev.next = inEdge;
   inEdge.next = halfEdge.next;
   halfEdge.next = outEdge;
   outEdge.next = halfEdge;

   // fix face
   inEdge.face = halfEdge.face;
   const newPolygon = this._createPolygon(outEdge, 2, delPolygon);
   halfEdge.face = newPolygon;   // unnecessary, already update
   outEdge.face = newPolygon;    // unnecessary, already update.

   // fix face.outEdge
   if (inEdge.face.halfEdge === halfEdge) {
      inEdge.face.halfEdge = inEdge;
   }
};
WingedTopology.prototype._collapseLoop = function(halfEdge, collapsibleWings) {
   if (collapsibleWings && !collapsibleWings.has(halfEdge.wingedEdge)) {   // if not collapsible, move to next.
      halfEdge = halfEdge.next;  // need not check, if both are collapsible, either one are ok.
   }
   const next = halfEdge.next;
   const pair = halfEdge.pair;
   const nextPair = next.pair;

   // is it a loop ?//assert ((next_halfedge_handle(h1) == h0) && (h1 != o0));

   // fix halfEdge.next connectionh
   next.next = pair.next;
   pair.prev().next = next;

   // fix halfEdge.face
   let polygon = pair.face;
   next.face = polygon;

   // fix vertex.outEdge;
   if (halfEdge.origin.outEdge === halfEdge) {
      halfEdge.origin.outEdge = nextPair;   // adjustOutgoing();
   }
   if (pair.origin.outEdge === pair) {
      pair.origin.outEdge = next;      // adjustOutgoingEdge();
   }

   // fix face.halfEdge
   if (polygon.halfEdge === pair) {
      polygon.halfEdge = next;
   }

   // delete stuff
   const delPolygon = halfEdge.face;
   this._freePolygon(halfEdge.face);
   this._freeEdge(halfEdge);
   
   // restoreLoop
   return {next: next, hEdge: halfEdge, polygon: delPolygon};
};


WingedTopology.prototype.collapseEdge = function(halfEdge, collapsibleWings) {
   const next = halfEdge.next;
   const pair = halfEdge.pair;
   const pairNext = pair.next;

   // remove edge
   const undo = this._collapseEdge(halfEdge);

   // remove loops(2 side polygon)
   if (next.next.next === next) {
      undo.leftLoop = this._collapseLoop(next.next, collapsibleWings);
   }
   if (pairNext.wingedEdge.isLive() && (pairNext.next.next === pairNext)) {   // add wingedEdge.isLive() to guard (--) edges.
      undo.rightLoop = this._collapseLoop(pairNext, collapsibleWings);
   }
   return undo;
};

WingedTopology.prototype.restoreCollapseEdge = function(undo) {
   if (undo.rightLoop) {
      this._restoreLoop(undo.rightLoop.next, undo.rightLoop.hEdge, undo.rightLoop.polygon);
   }
   if (undo.leftLoop) {
      this._restoreLoop(undo.leftLoop.next, undo.leftLoop.hEdge, undo.leftLoop.polygon);
   }
   // undo collapseEdge
   this._liftEdge(undo.pairNext, undo.prev, this.addVertex(undo.vertex.vertex, undo.vertex), undo.hEdge);
};


// fixed the halfEdge relation only.
WingedTopology.prototype._removeEdge = function(outEdge, inEdge) {
   const outPrev = outEdge.prev();
   const inPrev = inEdge.prev();
   const inNext = inEdge.next;
   
   outPrev.next = inNext;
   inPrev.next = outEdge.next;

   //correct vertex.outEdge if needed.
   if (outEdge.origin.outEdge === outEdge) {
      outEdge.origin.outEdge = outPrev.pair;
   }
   if (inEdge.origin.outEdge === inEdge) {
      inEdge.origin.outEdge = inPrev.pair;
   }
   return {outPrev: outPrev, inPrev: inPrev, inNext: inNext, inEdge: inEdge}; // fixed? outPrev: not needed
}
// won't work with potentially "dangling" vertices and edges. Any doubt, call dissolveEdge
WingedTopology.prototype.removeEdge = function(outEdge) {
   let inEdge = outEdge.pair;
   if (inEdge.face === null) {   // switch side
      inEdge = outEdge;
      outEdge = outEdge.pair;
      if (inEdge.face === null) {
         console.log("error, both side of the edges are null faces");
         return null;
      }
   }

   //fix the halfedge relations
   const remove = this._removeEdge(outEdge, inEdge);
  
   //deal with the faces
   const face = outEdge.face;    // the other side is boundary, after removal becomes boundary too.
   const delFace = inEdge.face;

   if (face !== null) {
      if (face.halfEdge === outEdge) { //correct the halfedge handle of face if needed
         face.halfEdge = remove.outPrev;
      }
   // make sure everye connect edge point to the same face.
      let size = 0;
      face.eachEdge( function(outEdge) {
         ++size;
         outEdge.face = face;
      });
      face.numberOfVertex = size;
      this.addAffectedFace(face);
   }

   if (delFace !== null) {    // guaranteed to be non-null, but maybe later use case will change
      this._freePolygon(delFace);
   }
   this._freeEdge(outEdge);
   // return undo functions
   const self = this;
   return function() {
      self.insertEdge(remove.inPrev, remove.inNext, inEdge, delFace);
   };
   //return face;   // return the remaining face handle
};


WingedTopology.prototype.dissolveEdge = function(outEdge, collapsibleWings) {
   // check next only connect to outEdge? 
   const self = this;
   const inEdge = outEdge.pair;
   if (outEdge.next.pair.next === inEdge) {
      const outNext = outEdge.next;
      return this.collapseEdge(inEdge, collapsibleWings);   // collapse inward
   } else if (inEdge.next.pair.next === outEdge) {
      return this.collapseEdge(outEdge, collapsibleWings);  // collapse outward
   } else {
      return this.removeEdge(outEdge);    // normal dissolve
   }
};



// selectedVertex. search the nearest edge on the same face.
// 2 ways to determine if vertex is edge. 1)prev, next edges are not parallel. 2) vertex has only 2 wingededges, and share the same faces.
// we decided to use the 2nd way temporary. After everything is debugged, switch to first method because it more robust.
WingedTopology.prototype.connectVertex = function(selectedVertex) {
   // first collect face from vertex.
   const selectedFace = new Map();
   for (let vertex of selectedVertex) {
      vertex.eachOutEdge( function(edge) {
         let val = 1;
         if (selectedFace.has(edge.face)) {
            val = selectedFace.get(edge.face) + 1;
         }
         selectedFace.set(edge.face, val);
      });
   }

   // corner. 
   const faceList = [];
   let edges = [];       // each face's edges
   // second (group vertex) that have the same faces as same edgeGroup.
   for (let [polygon, faceCount] of selectedFace) {
      if (faceCount > 1) {
         // at least 2 vertex selected.
         let special = true;
         let prevEdgeNumber = -1;
         let edgeNumber = -1;
         let outEdge = polygon.halfEdge;
         // find first corner.
         while (outEdge.origin.valence == 2) {
            outEdge = outEdge.next;
         }
         // ok, first corner.
         const firstCorner = outEdge;
         do {
            let valence = outEdge.origin.valence;
            prevEdgeNumber = edgeNumber;
            if (valence != 2) {        // we should really check for straight line.
               edgeNumber++;
            }
            if (selectedVertex.has(outEdge.origin)) {
               const obj = {prevEdgeNumber: prevEdgeNumber, edgeNumber: edgeNumber, outEdge: outEdge};
               edges.push( obj );
            }
            outEdge = outEdge.next;
         } while (outEdge !== firstCorner);
         //update first edges number
         const edge = edges[0];
         if (edge.prevEdgeNumber == -1) {
            edge.prevEdgeNumber = edgeNumber;
         }
         // save to face list
         faceList.push( edges );
         edges = [];
      }
   }


   const edgeList = [];
   // the real meat, connect vertex.
   for (let edges of faceList) {
      // check for special case. one interior selected vertex per edge. update. includeing zero selected vertex per edge.
      let specialCase = true;
      let prevEdgeNumber = -1;
      for (let [index, edge] of edges.entries()) {
         if ( (edge.prevEdgeNumber !== edge.edgeNumber) || (prevEdgeNumber == edge.edgeNumber) ) {   // corner or more than 1 vertex on same Edge.
            specialCase = false;
            break;
         }
         prevEdgeNumber = edge.edgeNumber;
      }
      if (specialCase) {
         const edge0Prev = edges[0].outEdge.prev();
         for (let i = 0; i < edges.length; ++i) {
            let origin = edges[i];
            let destination;
            let edge;
            if ( (i+1) < edges.length) {
               destination = edges[i+1];
               edge = this.insertEdge(origin.outEdge.prev(), destination.outEdge);
            } else {
               edge = this.insertEdge(origin.outEdge.prev(), edge0Prev.next);
            }

            edgeList.push( edge );
         }
      } else {
         // walk from beginning++, and end--.
         let i = edges.length-1;
         let j = 0;
         do {
            let origin = edges[i];
            let destination = edges[j];
            if (origin.edgeNumber != destination.prevEdgeNumber) {
               const edge = this.insertEdge(origin.outEdge.prev(), destination.outEdge);
               edgeList.push( edge );
               i--;
            }
            j++;     // move to next destination.
         } while (j < i);
      }
   }
   // return insertEdge list.
   return edgeList;
};


WingedTopology.prototype.removePolygon = function(polygon) {
   for (let hEdge of polygon.hEdges()) {
      hEdge.face = null;
   }
   // put into freeList.
   this._freePolygon(polygon);
};
/*function isCorner(outEdge) {
   const prev = outEdge.prev();
   const a = vec3.create();
   vec3.sub(a, outEdge.destination().vertex, outEdge.origin.vertex); 
   const b = vec3.create();
   vec3.sub(b, prev.origin.vertex, prev.destination().vertex);
   const cosTheta = vec3.dot(a, b) / (vec3.len(a) + vec3.len(b));
   // none straight line is corner; cos 180 === -1. cos 0 === 1.
   return cosTheta > -0.992;   // ~< 175 degree. is a corner.
}*/

WingedTopology.prototype.dissolveVertex = function(vertex) {
   // now free the vertex.
   const self = this;
   const pt = new Float32Array(3);
   vec3.copy(pt, vertex.vertex);
   if (vertex.isIsolated()) {
      this._freeVertex(vertex);
      return function() {
         self.addVertex(pt, vertex);
      };
   } else {
      this.addAffectedEdgeAndFace(vertex);
      let count = 0;
      const firstIn = vertex.outEdge.pair;
      let lastIn;
      // slide edge, move edge down like collapse edge, withou thehe collapsing.
      let outEdge;    // outEdge for new Polygon
      vertex.eachInEdge( function(inEdge) {
         //inEdges.unshift( inEdge );
         const nextOut = inEdge.next;
         outEdge = inEdge.pair;
         if (nextOut.face.halfEdge === nextOut) {
            nextOut.face.halfEdge = inEdge;   // reassigned outEdge.
         }
         --nextOut.face.numberOfVertex;
         inEdge.next = nextOut.next;      // slide down the next Edge.
         nextOut.next = outEdge;
         outEdge.origin = nextOut.pair.origin; // reassign new vertex
         count++;
         lastIn = inEdge;
      });
      // remove loop edge.
      const polygon = this._createPolygon(outEdge, count);
      const undoCollapseLoop = [];
      let vertexOutEdge = vertex.outEdge;
      outEdge = vertex.outEdge;
      do {
         let inEdge = outEdge.pair;
         outEdge = outEdge.next;
         if (inEdge.next.next === inEdge) {  // 2 edge loop, not polygon, now collapse it.
            if (inEdge.pair === vertexOutEdge) {
               vertexOutEdge = inEdge.next;  // 
            }
            undoCollapseLoop.unshift( this._collapseLoop(inEdge) );   // collapse inward
         } else {
            //inEdge.pair.face = polygon;      // already assigned in _createPolygon.
         }
      } while (outEdge !== vertexOutEdge);
      // free vertex
      this._freeVertex(vertex);
      return {polygon: polygon, undo: function() {
         // reallocated free vertex
         self.addVertex(pt, vertex);
         // undo collapse loop
         for (let undo of undoCollapseLoop) {
            undo();
         }
         // reattach edges to vertex
         let inEdge = lastIn;
         lastIn = lastIn.next.pair;
         let prevIn = firstIn;
         do {
            let outEdge = inEdge.pair;
            outEdge.origin = vertex;
            let prevOut = prevIn.pair;
            prevOut.next = inEdge.next;
            inEdge.next = prevOut;
            prevOut.face = inEdge.face;  
            ++prevOut.face.numberOfVertex;
            // ready for next.
            prevIn = inEdge;
            inEdge = outEdge.next.pair;
         } while (inEdge !== lastIn);
         vertex.outEdge = firstIn.pair;
         // free polygon
         self._freePolygon(polygon);
         // selected vertex
         self.addAffectedEdgeAndFace(vertex);
         return vertex;
      }};
   }
};

//
// bridge the 2 faces. and 
//
WingedTopology.prototype.bridgeFace = function(targetFace, sourceFace, deltaCenter) {
   const ret = {target: {face: targetFace, hEdge: targetFace.halfEdge}, source: {face: sourceFace, hEdge: sourceFace.halfEdge} };
   // get the 2 faces vertices
   const targetHEdges = [];
   const sourceHEdges = [];
   for (let hEdge of targetFace.hEdges()) {
      targetHEdges.push( hEdge );
      hEdge.face = null;   // remove face reference
   }
   // move source to target
   for (let hEdge of sourceFace.hEdges()) {
      const point = vec3.clone(hEdge.origin.vertex);
      vec3.add(point, point, deltaCenter);
      sourceHEdges.unshift( {hEdge: hEdge, delta: point} );  // reverse direction.
      hEdge.face = null;   // remove face reference
   }
   // project origin's vertices  to target's plane? skip it for now
   // find the smallest length combined.
   let index = -1;
   let len = Number.MAX_SAFE_INTEGER;
   const temp = vec3.create();
   for (let i = 0; i < sourceFace.numberOfVertex; ++i) {
      // add up th length
      let currentLen = 0;
      for (let j = 0; j < targetHEdges.length; ++j) {
         vec3.sub(temp, targetHEdges[j].origin.vertex, sourceHEdges[j].delta);
         len += vec3.length(temp);
      }
      if (currentLen < len) {
         len = currentLen;
         index = i;
      }
      sourceHEdges.push( sourceHEdges.shift() );  // rotate 
   }
   // hopefully -1 works well enough with splice and unshift.
   sourceHEdges.unshift.apply( sourceHEdges, sourceHEdges.splice(index-1, sourceHEdges.length ) ); // rotate to desired location.
   // remove face, and bridge target[0] at the source index
   this._freePolygon(targetFace);
   this._freePolygon(sourceFace);
   let hEdgePrev = null;
   const hEdges = [];
   for (let i = 0; i < targetHEdges.length; ++i) {  // create new Edge, new Face.
      const hEdge = this.addEdge(sourceHEdges[i].hEdge.origin, targetHEdges[i].origin);
      if (hEdgePrev) {  // added the face
         this._createPolygon(hEdgePrev, 4);
      }
      hEdges.push( hEdge );
      hEdgePrev = hEdge;
   }
   this._createPolygon(hEdgePrev, 4);

   ret.hEdges = hEdges;
   return ret;
}

WingedTopology.prototype.undoBridgeFace = function(bridge) {
   for (let hEdge of bridge.hEdges) {
      this.removePolygon(hEdge.face);  // free face first
   }
   for (let hEdge of bridge.hEdges) {
      this._removeEdge(hEdge, hEdge.pair); // remove edge later.
   }
   // now, get the 2 face back
   this._createPolygon(bridge.target.hEdge, bridge.hEdges.length, bridge.target.face);
   this._createPolygon(bridge.source.hEdge, bridge.hEdges.length, bridge.source.face);
};

//
// insetFace.
//
WingedTopology.prototype.findInsetContours = function(polygonSet) {
   // find contour.
   const edgeLoops = [];
   for (let polygon of polygonSet) {
      const edgeLoop = [];
      for (let hEdge of polygon.hEdges()) {
         const edge = {outer: hEdge, inner: null};
         edgeLoop.push(edge);
      }
      edgeLoops.push( edgeLoop );
   }

   return edgeLoops;
};



WingedTopology.prototype._liftDanglingEdge = function(hEdge, destVert) {
   const next = hEdge.next;
   const danglingOut = this._createEdge(next.origin, destVert);
   destVert.outEdge = danglingOut.pair;
   hEdge.next = danglingOut;
   danglingOut.pair.next = next;
   danglingOut.face = danglingOut.pair.face = hEdge.face;   // assigned face, but don't update number of vertex.
   return danglingOut;
};
//
// insert a dangling corner edge at hEdge.next position.
WingedTopology.prototype.liftCornerEdge = function(hEdge, percent = 0.2) {
   const pt = vec3.create();
   const vector = vec3.create();
   // lift destination corner vertex
   let next = hEdge.next;
   vec3.lerp(pt, next.origin.vertex, next.destination().vertex, percent);
   vec3.sub(vector, hEdge.origin.vertex, hEdge.destination().vertex);
   vec3.scale(vector, vector, percent);
   vec3.add(pt, pt, vector);
   let destVert = this.addVertex(pt);
   // fixup the new fence End
   let danglingOut = this._liftDanglingEdge(hEdge, destVert);

   return danglingOut;
};
//
// fix up insertOut.destination() at inEdge.destination().
//
/*WingedTopology.prototype._insertEdge = function(begHalf, endHalf, delPolygon) {
   const v0 = begHalf.destination();
   const v1 = endHalf.destination();
   const oldPolygon = begHalf.face;

   // create edge and link together
   const outEdge = this._createEdge(v0, v1);
   const inEdge = outEdge.pair;
   inEdge.next = begHalf.next;
   outEdge.next = endHalf.next;
   begHalf.next = outEdge;
   begHalf.next = inEdge;
  
   //now set the face handles
   const newPolygon = this._createPolygon(outEdge, 4, delPolygon);  // readjust size later.

   // inEdge is oldPolygon
   inEdge.face = oldPolygon;
   if (oldPolygon.halfEdge.face === newPolygon) { //  pointed to one of the halfedges now assigned to newPolygon
      oldPolygon.halfEdge = inEdge; // should add to restore list.
   }
   oldPolygon.update();
   this.addAffectedFace( oldPolygon );

   // adjustOutEdge for v0, v1. point to boundary so, ccw work better?
   return outEdge;
}*/
//
// extrudeEdge.
//  
WingedTopology.prototype.extrudeEdge = function(startFenceHEdge, finishFenceHEdge) {
   const lift = [];
   const extrude = [];
   // 
   let sFenceOut = startFenceHEdge;
   let current = startFenceHEdge.next;
   let next = current.next;
   const pt = vec3.create();
   while (next !== finishFenceHEdge) {
      // lift destination corner vertex
      let fFenceIn = this.liftCornerEdge(current);   // at destination() of current
      lift.push(fFenceIn.pair);
      // extrude paralle edge.
      let extrudeOut = this.insertEdge(fFenceIn, sFenceOut);
      extrude.push( extrudeOut );
      // move to nextEdge
      sFenceOut = fFenceIn.pair;
      current = next;
      next = next.next;
   }
   // connect to the last one. 
   let extrudeOut = this.insertEdge(next, sFenceOut);
   extrude.push( extrudeOut );

   // return created halfEdges
   return {extrude: extrude, lift: lift};
};


WingedTopology.prototype.slideToPrev = function(outEdge, prevPrev) {
   if (!prevPrev) {
      prevPrev = outEdge.prev().prev();
   } else {
      // check(prevPrev.next.next === outEdge)
   }
   const prev = prevPrev.next;
   const inEdge = outEdge.pair;

   if (outEdge.face.numberOfVertex <= 3) {   // collapseLoop already.
      const result = {inEdge: outEdge, delFace: outEdge.face, inNext: outEdge.next, inPrev: outEdge.prev()};
      this.this.removeEdge(outEdge);
      return result;
   }

   // fix up th pointer
   prev.next = inEdge.next;
   inEdge.next = prev;
   prevPrev.next = outEdge;

   // fix up the faces.
   if (outEdge.origin.outEdge === outEdge) {
      outEdge.origin.outEdge = prev.next;  // we will be no longer using origin;
   }
   outEdge.origin = prev.origin;

   // reassign face
   if (prev.face.halfEdge === prev) {
      prev.face.halfEdge = inEdge;
   }
   prev.face = inEdge.face;
   ++inEdge.face.numberOfVertex;
   --outEdge.face.numberOfVertex;

   // for slideToNext
   return {inEdge: inEdge};
};


// slide dow
WingedTopology.prototype.slideToNext = function(inEdge) {
   if (inEdge.face.numberOfVertex <= 3) {   // collapseLoop if slide, just remove the edge, simpler
      const result = {inEdge: inEdge, delFace: inEdge.face, inNext: inEdge.next, inPrev: inEdge.prev()};
      this.removeEdge(inEdge);   // todo: removeEdge should return result, instead of closure.
      return result;
   }

   // Fix up the pointer and face.
   const outEdge = inEdge.pair;
   const next = inEdge.next;
   const prev = outEdge.prev();

   prev.next = next;
   inEdge.next = next.next;
   next.next = outEdge;

   if (outEdge.origin.outEdge === outEdge) {
      outEdge.origin.outEdge = next;  // we will be no longer using origin;
   }
   outEdge.origin = inEdge.next.origin;
   this.addAffectedWEdge(outEdge.wingedEdge);

   // reassign face.
   if (next.face.halfEdge === next) {
      next.face.halfEdge = inEdge;
   }
   inEdge.face = next.face;
   next.face = outEdge.face; 
   ++outEdge.face.numberOfVertex;      // accounting.
   --inEdge.face.numberOfVertex;       // oops, needs ot collapse edge
   this.addAffectedFace( outEdge.face );
   this.addAffectedFace( inEdge.face );

   return {prevPrev: prev, outEdge: outEdge};   // for slideToPrev
};
WingedTopology.prototype.undoSlideToNext = function(result) {
   if (result.delFace) {   // yep, removeEdge, so now restore.
      this.insertEdge(result.inPrev, result.inNext, result.inEdge, result.delFace);
   } else {
      this.slideToPrev(result.outEdge, result.prevPrev);
   }
};


//
// insertFan - inside polygon, adds polygon fan with fanLists(Set)
//
WingedTopology.prototype.insertFan = function(polygon, fanLists) {
   //const 
   
   // get polygon centroid.
   const centroid = vec3.create();
   polygon.getCentroid(centroid);
   let destVert = this.addVertex(centroid);

   const fan = [];
   let lastOut;
   for (let hEdge of polygon.hEdges()) {  // walk in order.
      if (fanLists.has(hEdge)) { // only in the list, we do fanEdge.
         if (lastOut !== undefined) {
            lastOut = this.insertEdge(hEdge, lastOut.pair);
            fan.unshift(lastOut.pair);
         } else { // liftCorner Edge for first Fan.
            lastOut = this._liftDanglingEdge(hEdge, destVert);
            fan.unshift( lastOut ); // lastOut, not lastOut.pair will guarantee dissolve correctly.
         }
      }
   }

   return fan;
};


// 
// invert() - invert the normal of all polygon. usefull when import meshes that use cw-order polygon.
//
WingedTopology.prototype.invert = function() {
   const reverse = [];
   for (let polygon of this.faces) {
      for (let hEdge of polygon.hEdges()) {
         reverse.push( {hEdge: hEdge.next.pair, next: hEdge.pair} );
      }
   }
   // got the reversed list, now reverse the edge.
   for (let {hEdge, next} of reverse) {
      hEdge.next = next;
   }
   // now swap the polygon pointer.
   for (let wEdge of this.edges) {
      let swapPoly = wEdge.left.face;
      if (swapPoly.halfEdge === wEdge.left) {
         swapPoly.halfEdge = wEdge.right;
      }
      wEdge.left.face = wEdge.right.face;
      if (wEdge.left.face.halfEdge === wEdge.right) {
         wEdge.left.face.halfEdge = wEdge.left;
      }
      wEdge.right.face = swapPoly;  // done swapping.
   }
};

//
// flip() - flip vertex around center with particular axis only
//
WingedTopology.prototype.flip = function(pivot, axis) {
   const axisX2 = pivot[axis] * 2;
   for (let vertex of this.vertices) {
      vertex.vertex[axis] = axisX2 - vertex.vertex[axis];  // == center[axis] - (vertex.vertex[axis]-center[ais])
         this.addAffectedEdgeAndFace(vertex);               // optimiztion: addAllAffected() functions.
      }
};


WingedTopology.prototype.makeHole = function(polygon) {
   // turn polygon into hole, 
   let ret = {hEdge: polygon.halfEdge, face: polygon, removeEdges: []};
   for (let hEdge of polygon.hEdges()) {
      hEdge.face = null;
      const pairEdge = hEdge.pair;
      if (pairEdge.face === null) { 
         this._removeEdge(hEdge, pairEdge);
         ret.removeEdges.unshift( {begVert: hEdge.origin, endVert: hEdge.destination(), delOutEdge: hEdge} );
      }
   }
   this._freePolygon(polygon);
   return ret;
};

WingedTopology.prototype.undoHole = function(hole) {
   for (let remove of hole.removeEdges) {
      this.addEdge( remove.begVert, remove.endVert, remove.delOutEdge );
   }
   return this._createPolygon(hole.hEdge, 4, hole.face);
};



export {
   WingedEdge,
   HalfEdge,
   Vertex,
   Polygon,
   MeshAllocator,
   WingedTopology,
}