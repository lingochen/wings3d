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

var HalfEdge = function(vert, edge) {  // should only be created by WingedEdge
   this.next = null;
//   this.prev = null;       // not required, but very nice to have shortcut
   this.origin = vert;     // origin vertex, 
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

// utility functions for traversing all incident edge,
Vertex.prototype.eachInEdge = function(callbackfn) {
   // i am in
   var start = this.outEdge;
   var edge = begin;
   if (edge) {
      do { // ccw ordering
         callbackfn(edge.pair, this);
         edge = edge.pair.next;   // my pair's next is outEdge. 
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
         console.log("Error: Vertex.linkEdge: complex vertex");
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


var Polygon = function(startEdge, size) {
   this.halfEdge = startEdge;
   this.numberOfVertex = size;       // how many vertex in the polygon
   this.index = -1;
};

Polygon.prototype.eachVertex = function(callbackFn) {
   // get every vertex of the face.
   var begin = this.halfEdge;
   var current = begin;
   do {
      callbackFn(current.origin);
      current = current.next;
   } while (current != begin);
};

Polygon.prototype.eachEdge = function(callbackFn) {
   var begin = this.halfEdge;
   var current = begin;
   do {
      callbackFn(current);
      current = current.next;
   } while (current != begin);
};


var WingedTopology = function(allocatedSize = 256) {     // default to 256 vertex
   var buf = new ArrayBuffer(allocatedSize*3 * Float32Array.BYTES_PER_ELEMENT);
   this.buf = { buffer: buf, data: new Float32Array(buf), len: 0, };
   this.vertices = [];
   this.edges = [];        // wingededge
   this.faces = [];
};

// return vertex index
WingedTopology.prototype.addVertex = function(pt) {
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
   var vertex = new Float32Array(this.buf.buffer, Float32Array.BYTES_PER_ELEMENT*this.buf.len, 3);
   this.buf.len += 3;
   vertex[0] = pt[0];
   vertex[1] = pt[1];
   vertex[2] = pt[2];
   var _vert = new Vertex(vertex);
   //_vert.index = this.vertices.length;
   this.vertices.push( _vert );
   return _vert;
};

WingedTopology.prototype._createEdge = function(begVert, endVert) {
   // initialized data.
   var edge = new WingedEdge(begVert, endVert);
   edge.index = this.edges.length;
   this.edges.push( edge );

   return edge.left;
};

// return winged edge ptr because internal use only.
WingedTopology.prototype.addEdge = function(begVert, endVert) {
   // what to do with loop edge?
   // what to do with parallel edge?

   // initialized data.
   var edge = this._createEdge(begVert, endVert).wingedEdge;

   // Link outedge, splice if needed
   begVert.linkEdge(edge.left, edge.right);
   // Link inedge, splice if needed
   endVert.linkEdge(edge.right, edge.left);

   // return outEdge.
   return edge.left;
};

WingedTopology.prototype.findFreeInEdge = function(inner_next, inner_prev) {
   // inner_prev is guaranteed to be boundary, so if link correctly, should be 

   // search a free gap, free gap will be between boundary_prev and boundary_next
   var boundary_prev = inner_next.pair;
   do {
      boundary_prev = boundary_prev.next.pair;
   } while (!boundary_prev.isBoundary());

   // ok ?
   if (boundary_prev === inner_prev) {  // check for bad connectivity. somewhere 
      console.log("WingedTopology.addFace.findFreeInEdge: patch re-linking failed");
      return null;
   }

   // return free Incident edge.
   return boundary_prev.next;
};

WingedTopology.prototype.spliceAdjacent = function(inEdge, outEdge) {
    if (inEdge.next === outEdge) {   // adjacency is already correct.
        return true;
    }

    var b = inEdge.next;
    var d = outEdge.prev();

    // Find a free incident half edge
    // after 'out' and before 'in'.
    var g = this.findFreeInEdge(outEdge, inEdge);

    if (g === null) {
        console.log("WingedTopology.spliceAjacent: no free inedge, bad ajacency");
        return false;
    }
    var h = g.next;

    inEdge.next = outEdge;
    //out.half_->previous_ = in.half_;

    g.next = b;
    //b.half_->previous_ = g.half_;

    d.next = h;
    //h.half_->previous_ = d.half_;

    return true;
};


// passed in an array of vertex index. automatically create the required edge.
// return polygon index.
WingedTopology.prototype.addPolygon = function(pts) {
   var halfCount = pts.length;
   if (halfCount < 3) { // at least a triangle
      return -1;
   }

   var i, nextIndex;
   // builds WingEdge if not exist
   var halfLoop = [];
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
      } else if (!edge.isBoundary()) { // is it free? only free can form a chain.
         // This half-edge would introduce a non-manifold condition.
         return -1;
         // should we rewinded the newly created winged edge? currently nay.
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
         // The polygon would introduce a non-manifold condition.
         return -1;
      }
   }

   // Create and link the polygon
   var newPolygon = new Polygon(halfLoop[0], pts.length);

   // Link half-edges to the polygon.
   for (i = 0;i < halfCount; ++i) {
      halfLoop[i].face = newPolygon;
   }

   return this.faces.push( newPolygon ) - 1;
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

// to split a face into 2 faces by insertEdge.
WingedTopology.prototype.insertEdge = function(prevHalf, nextHalf) {
   // assert(prevHalf.face === nextHalf.face);
   // assert(prevHalf.next !== _nextHalf);      // we want to split face, not adding edge
   const v0 = prevHalf.destination();
   const v1 = nextHalf.origin;

   // create edge and link together.
   const outEdge = this._createEdge(v0, v1);
   const inEdge = outEdge.pair;
   const nextPrev = prevHalf.next;           // save for later use
   const prevNext = nextHalf.prev();
   prevHalf.next = outEdge;
   outEdge.next = nextHalf;
   prevNext.next = inEdge;
   inEdge.next = nextPrev;
  
   //now set the face handles
   const newPolygon = new Polygon(outEdge, 4);  // readjust size later.
   outEdge.face = newPolygon;
   let size = 0;
   newPolygon.eachEdge( function(halfEdge) {
      ++size;
      halfEdge.face = newPolygon;
   });
   newPolygon.numberOfVertex = size;
   this.faces.push( newPolygon );

   const oldPolygon = nextPrev.face;
   inEdge.face = oldPolygon;
   if (oldPolygon.halfEdge.face === newPolygon) {
      //  pointed to one of the halfedges now assigned to new_fh
      oldPolygon.halfEdge = inEdge.face;
   }

   // adjustOutEdge for v0, v1. point to boundary so, ccw work better?
   return outEdge;
}


WingedTopology.prototype.splitEdge = function(outEdge, vertex) {
   const inEdge = outEdge.pair;
   const outPrev = outEdge.prev();
   const inNext = inEdge.next;
   const vOrigin = outEdge.origin;
   const vOut = vOrigin.outEdge;

   //add the new edge
   const newOut = this._createEdge(vOrigin, vertex);
   const newIn = newOut.pair;
   // fixe the halfedge connectivity
   newOut.next = outEdge;
   inEdge.next = newIn;
  
   outPrev.next = newOut;
   newIn.next = inNext;
  
   newOut.face = outEdge.face;
   newIn.face = inEdge.face;

   // fix vertex
   outEdge.origin = vertex;
   vertex.outEdge = outEdge;
  
   if (vOrigin.outEdge === outEdge) {
      vOrigin.outEdge = newOut;
   }
   // return the newOut
   return newOut;
};



WingedTopology.prototype.extrudePolygon = function(selectedPolygon) {
   let edgeLoops = this._extractPolygon(selectedPolygon);
   // extrude face. connect (outer, inner) loop.
   for (let contour of edgeLoops) {
      for (let edge of contour) {
         let polygon = [];
         polygon.push( edge.outer.origin.index );
         polygon.push( edge.outer.destination().index );
         polygon.push( edge.inner.destination().index );
         polygon.push( edge.inner.origin.index );
         this.addPolygon( polygon );
      }
   }

   return edgeLoops;
};


WingedTopology.prototype._extractPolygon = function(selectedPolygon) {   // selectedPolygon is es6 map. should be set.
   const self = this;
   let contourEdges = new Set;
   let edgeLoops = [];
   // find all contourEdges to extrude
   for (var [_oid, polygon] of selectedPolygon) {
      polygon.eachEdge( function(outEdge) {
         if (!contourEdges.has(outEdge) && !selectedPolygon.has(outEdge.pair.face.index)) {
            const firstVertex = self.addVertex(outEdge.origin.vertex);
            let fromVertex = firstVertex;
            const edgeLoop = [];
            let currentIn = outEdge;
            do {
               // this edge is contour. now walk cwRing to find the next edges.
               let nextIn = currentIn.next.pair;
               while (nextIn !== currentIn) {
                  if (!selectedPolygon.has(nextIn.face.index)) { // yup, find the other contour
                     break;
                  }
                  nextIn = nextIn.next.pair;
               }
               // check if it the first vertex, in other word, the last one.
               var check = nextIn.destination();
               let toVertex = firstVertex;
               if (check !== outEdge.origin) {
                  toVertex = self.addVertex(check.vertex);
               }
               const edges = {outer: currentIn, inner: self.addEdge(fromVertex, toVertex)};
               edgeLoop.push( edges );
               fromVertex = toVertex;
               contourEdges.add(currentIn);       // checkIn the contour edge.
               // we cw walk over to the next contour edge.
               currentIn = nextIn.pair;
            } while (currentIn !== outEdge);      // check if we come full circle
            edgeLoops.push( edgeLoop );
         }
      } );
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
         // let innerNext = edge0.inner.next; === edge1.inner;
         let inner = edge0.inner;
         while (outerNext !== edge1.outer) {
            if (outerNext.origin.outEdge === outerNext) {   
               outerNext.origin.outEdge = edge0.outer.pair; // needs to redirect origin's outerEdge
            }
            outerNext.origin = edge1.inner.origin;    // first set the vertex
            edge0.outer.next = outerNext.pair.next;   // lift off
            outerNext.pair.next = inner.next;
            inner.next = outerNext;                   // lift done
            // advance to next edge.
            outerNext = edge0.outer.next;
            inner = inner.next.pair;
         }
         edge0 = edge1;       // move edge post
         // setup the faces.
         if (edge1.outer.face.halfEdge === edge1.outer) {
            edge1.outer.face.halfEdge = edge1.inner;
         }
         edge1.inner.face = edge1.outer.face;
         edge1.outer.face = null;
      }
   }

   return edgeLoops;
};