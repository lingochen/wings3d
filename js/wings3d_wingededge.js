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

WingedEdge.prototype.isReal = function() {
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

HalfEdge.prototype.prev = function() {
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

Vertex.prototype.isReal = function() {
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
   const start = this.outEdge; // we want inEdge.
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




var Polygon = function(startEdge, size) {
   this.halfEdge = startEdge;
   this.numberOfVertex = size;       // how many vertex in the polygon
   this.update(); //this.computeNormal();
   this.index = -1;
};

// not on free list. not deleted.
Polygon.prototype.isReal = function() {
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
      callbackFn(current);
      current = current.next;
   } while (current !== begin);
};

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

// recompute numberOfVertex and normal.
Polygon.prototype.update = function() {
   const begin = this.halfEdge;
   let current = begin;
   this.numberOfVertex = 0;
   do {
      current.face = this;
      ++this.numberOfVertex;
      if (this.numberOfVertex > 1000) {   // break;   
         console.log("something is wrong with polygon link list");
         return;
      }
      current = current.next;
   } while (current !== begin);
   // compute normal.
   this.computeNormal();
};


var WingedTopology = function(allocatedSize = 256) {     // default to 256 vertex
   var buf = new ArrayBuffer(allocatedSize*3 * Float32Array.BYTES_PER_ELEMENT);
   this.buf = { buffer: buf, data: new Float32Array(buf), len: 0, };
   this.vertices = [];
   this.edges = [];        // wingededge
   this.faces = [];
   this.freeVertices = [];
   this.freeEdges = [];
   this.freeFaces = [];
   // affected is when reuse, deleted, or change vital stats.
   this.affected = {vertices: new Set, edges: new Set, faces: new Set};
};

WingedTopology.prototype.sanityCheck = function() {
   let sanity = true;
   // first check vertex for error.
   for (let [index, vertex] of this.vertices.entries()) {
      if (vertex.isReal()) {
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

WingedTopology.prototype.clearAffected = function() {
   this.affected.vertices.clear();
   this.affected.edges.clear();
   this.affected.faces.clear();
};

WingedTopology.prototype.addAffectedEdgeAndFace = function(vertex) {
   this.affected.vertices.add(vertex);
   const self = this;
   vertex.eachOutEdge( function(halfEdge) {
      self.affected.edges.add(halfEdge.wingedEdge);
      if (halfEdge.face !== null) {
         self.affected.faces.add(halfEdge.face);
     }
   });
};

// todo: ?binary search for delPolygon, then use splice. a win? for large freelist yes, but, I don't think it a common situation.
WingedTopology.prototype._createPolygon = function(halfEdge, numberOfVertex, delPolygon) {
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
      this.affected.faces.add( polygon );
   } else {
      polygon = new Polygon(halfEdge, numberOfVertex);
      polygon.index = this.faces.length;
      this.faces.push( polygon );
   }
   return polygon;
};

// return vertex index
WingedTopology.prototype.addVertex = function(pt, delVertex) {
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
      if (this.buf.len >= (this.buf.data.length)) {
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
      return _vert;
   }
};

WingedTopology.prototype._createEdge = function(begVert, endVert, delOutEdge) {
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
   }

   return outEdge;
};

// return winged edge ptr because internal use only.
WingedTopology.prototype.addEdge = function(begVert, endVert) {
   // what to do with loop edge?
   // what to do with parallel edge?

   // initialized data.
   var edge = this._createEdge(begVert, endVert).wingedEdge;

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

      var v0 = this.vertices[pts[i]];
      var v1 = this.vertices[pts[nextIndex]];
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
   this.affected.faces.add( oldPolygon );

   // adjustOutEdge for v0, v1. point to boundary so, ccw work better?
   return outEdge;
}


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
   this.affected.edges.add( outEdge.wingedEdge );     // edge changed.
   // return the newOut
   return newOut;
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


// lift edges from outerLoop to innerLoop.
WingedTopology.prototype.liftContours = function(edgeLoops) {
   // create innerloops
   for (let contours of edgeLoops) {
      let firstVertex = this.addVertex(contours[0].outer.origin.vertex);
      let fromVertex = firstVertex; 
      for (let i = 0; i < contours.length; ++i) {
         let outerEdge = contours[i].outer;
         let toVertex;
         if (i == (contours.length-1)) {  // the last one loopback
            toVertex = firstVertex;
         } else {
            toVertex = this.addVertex(outerEdge.destination().vertex);
         }
         contours[i].inner = this.addEdge(fromVertex, toVertex);
         fromVertex = toVertex;
      }
   }

   // got the internal loop, now lift and connect the faces to the innerLoop.
   for (let i = 0; i < edgeLoops.length; ++i) {
      const edgeLoop = edgeLoops[i];
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
      this.affected.edges.add( currentOut.wingedEdge );
      currentOut = currentOut.pair.next;
   } while (currentOut !== outEdge);
   outEdge.face = inRight.face;
   outEdge.face.numberOfVertex++;
   inEdge.face = outLeft.face;
   inEdge.face.numberOfVertex++;
   this.affected.faces.add(outEdge.face);
   this.affected.faces.add(inEdge.face);
}


// insert the index number in reverse order. smallest last.
WingedTopology.prototype._insertFreeList = function(val, array) {
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

// recycled
WingedTopology.prototype._freeVertex = function(vertex) {
   vertex.outEdge = null;
   //vertex.vertex.fill(0.0);
   // assert !freeVertices.has(vertex);
   //this.freeVertices.push( vertex );
   this._insertFreeList(vertex.index, this.freeVertices);
   this.affected.vertices.add( vertex );
};

WingedTopology.prototype._freeEdge = function(edge) {
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

WingedTopology.prototype._freePolygon = function(polygon) {
   polygon.halfEdge = null;
   polygon.numberOfVertex = 0;
   // assert !freeFaces.has( polygon );
   //this.freeFaces.push( polygon );
   this._insertFreeList(polygon.index, this.freeFaces);
   this.affected.faces.add( polygon );
};


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
      this.affected.edges.add(current.wingedEdge);
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
   this.affected.faces.add(face);
   face = pair.face;
   if (face.halfEdge === pair) {
      face.halfEdge = pairNext;
   }
   face.numberOfVertex--;
   this.affected.faces.add(face);

   // adjust vertex
   if (toVertex.outEdge === pair) {
      toVertex.outEdge = next;
   }

   // delete stuff
   this._freeEdge(halfEdge);
   this._freeVertex(fromVertex);

   const self = this;
   return function() {  // undo collapseEdge
      self._liftEdge(pairNext, prev, self.addVertex(fromVertex.vertex, fromVertex), halfEdge);
   }
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

   // const self = this;
   // return function() {
   //    self._collapseLoop(outEdge);      
   //}
};
WingedTopology.prototype._collapseLoop = function(halfEdge) {
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
   const self = this;
   return function() {
      self._restoreLoop(next, halfEdge, delPolygon);
   };
};


WingedTopology.prototype.collapseEdge = function(halfEdge) {
   const next = halfEdge.next;
   const pair = halfEdge.pair;
   const pairNext = pair.next;

   // remove edge
   const undo = this._collapseEdge(halfEdge);

   // remove loops(2 side polygon)
   let undoCollapseLeft;
   let undoCollapseRight;
   if (next.next.next === next) {
      undoCollapseLeft = this._collapseLoop(next.next);
   }
   if (pairNext.next.next === pairNext) {
      undoCollapseRight = this._collapseLoop(pairNext);
   }
   return function() {
      if (typeof undoCollapseRight !== 'undefined') {
         undoCollapseRight();
      }
      if (typeof undoCollapseLeft !== 'undefined') {
         undoCollapseLeft();
      }
      undo();
   }
};

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
   const outPrev = outEdge.prev();
   const inPrev = inEdge.prev();
   const inNext = inEdge.next;
   
   outPrev.next = inNext;
   inPrev.next = outEdge.next;

   //correct vertext.outEdge if needed.
   if (outEdge.origin.outEdge === outEdge) {
      outEdge.origin.outEdge = outPrev.pair;
   }
   if (inEdge.origin.outEdge === inEdge) {
      inEdge.origin.outEdge = inPrev.pair;
   }
  
   //deal with the faces
   const face = outEdge.face;    // the other side is boundary, after removal becomes boundary too.
   const delFace = inEdge.face;

   if (face !== null) {
      if (face.halfEdge === outEdge) { //correct the halfedge handle of face if needed
         face.halfEdge = outPrev;
      }
   // make sure everye connect edge point to the same face.
      let size = 0;
      face.eachEdge( function(outEdge) {
         ++size;
         outEdge.face = face;
      });
      face.numberOfVertex = size;
      this.affected.faces.add(face);
   }

   if (delFace !== null) {    // guaranteed to be non-null, but
      this._freePolygon(delFace);
   }
   this._freeEdge(outEdge);
   // return undo functions
   const self = this;
   return function() {
      self.insertEdge(inPrev, inNext, inEdge, delFace);
   };
   //return face;   // return the remaining face handle
};


WingedTopology.prototype.dissolveEdge = function(outEdge) {
   // check next only connect to outEdge? 
   const self = this;
   const inEdge = outEdge.pair;
   if (outEdge.next.pair.next === inEdge) {
      const outNext = outEdge.next;
      return this.collapseEdge(inEdge);   // collapse inward
   } else if (inEdge.next.pair.next === outEdge) {
      return this.collapseEdge(outEdge);  // collapse outward
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


/*WingedTopology.prototype.removePolygon = function(polygon) {
   polygon.eachEdge( function(edge) {
      edge.face = null;
   });
   // put into freeList.
   polygon.halfEdge = null;
   this.freeFaces.push(polygon);
};
function isCorner(outEdge) {
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