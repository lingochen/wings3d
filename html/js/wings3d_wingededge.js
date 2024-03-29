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
import {Float32Buffer, ByteBuffer, Int32Buffer, TriangleIndexBuffer, ColorAttribute, TexCoordAttribute} from './wings3d_gl.js';
import {BoundingSphere} from './wings3d_boundingvolume.js';
import {triangulateNaive, triangulate} from './wings3d_triangulate.js';
import {Material} from './wings3d_material.js';
import { Vec3View } from "./wings3d_util.js";
const {vec3} = glMatrix;


const WingedEdge = function(orgVert, toVert, index) {
   WingedEdge.state.alloc();     // advance usedSize
   WingedEdge.index.alloc();     // advance usedSize
   // start init
   this.index = index;
   this.left = new HalfEdge(this);
   this.right = new HalfEdge(this);
   this.left.pair = this.right;
   // link together for a complete loop
   this.left.next = this.right;
   // this.left.prev = this.right;
   this.right.pair = this.left;
   this.right.next = this.left;
   // this.right.prev = this.left;
   // now set origin.
   this.left.origin = orgVert;
   this.right.origin = toVert;
   // update vertex color
   this.left.initAttribute();
   this.right.initAttribute();
   // update HalfEdge.index. offset start at 1
   const idx = 1 + this.index * 2;
   const i = idx * 4;
   HalfEdge.index.set(i+1, idx);
   HalfEdge.index.set(i+5, idx+1);
   HalfEdge.triangleList.set((idx-1)*3, idx);
   HalfEdge.triangleList.set((idx-1)*3+2, idx);  // center point to self for null face
   HalfEdge.triangleList.set(idx*3, idx+1);
   HalfEdge.triangleList.set(idx*3+2, idx+1);  // center point to self for null face
};
WingedEdge.index = null;   // (vertex, index, barycentric)
WingedEdge.state = null;
/**
 * 
 */
WingedEdge.prototype.discardInternal = function(affected) {
   this.setGroup(-1);
   this.left.discardInternal(affected);
   this.right.discardInternal(affected);
};
WingedEdge.prototype.archiveInternal = function(archive) {
   let left = this.left.archiveInternal(archive);
   let right = this.right.archiveInternal(archive);
   return {wEdge: this, left: left, right: right};
};
WingedEdge.prototype.restoreInternal = function(restore) {
   this.left.restoreInternal(restore.left);
   this.right.restoreInternal(restore.right);
};

WingedEdge.prototype[Symbol.iterator] = function* () {
   yield this.left;
   yield this.right;
};

WingedEdge.prototype.isOk = function() {
   if (!this.left.origin || !this.left.origin.outEdge) {
      throw("leftEdge has problem");
   }
   if (!this.right.origin || !this.right.origin.outEdge) {
      throw ("rightEdge has problem");
   }
}

/**
 * return true if this wingedEdge is hardEdge.
 */
WingedEdge.prototype.isHard = function() {
   return (WingedEdge.state.buffer[this.index] & 1);
}

/**
 * set bitmask on 1st position. off meant soft, on meant hard, 0x0001
 * @param {WingedEdge} wEdge - target edge
 * @param {number} operand - 0=soft, 1=hard, 2=invert.
 */
WingedEdge.prototype.setHardness = function(operand) {
   if (operand < 2) {
      return this.setEdgeMask(operand, 1);
   } else { // invert
      if (this.isHard())  {  // originally hard, turn to soft
         return this.setHardness(false, 1);
      } else { // soft turn to hard
         return this.setHardness(true, 1);
      }
   }
};

/**
 * toggle selection of wEdge, 2nd position, 0x0010
 * @param {WingedEdge} wEdge - target wEdge
 * @param {boolean} onOff - on/off toggle.
 */
WingedEdge.prototype.selectEdge = function(onOff) {
   this.setEdgeMask(onOff, 2);
};

WingedEdge.prototype.setEdgeMask = function(onOff, mask) {
   const i = this.index;
   const state = WingedEdge.state.buffer[i];
   if (onOff) {
      return WingedEdge.state.set(i,  state | mask);
   } else {
      return WingedEdge.state.set(i, state & ~mask);
   }
};

WingedEdge.prototype.setGroup = function(topologyIndex) {
   // update WingedEdge.index;
   let i = this.index * 24 + 3;      // 4*3*2;
   for (let j = 0; j < 6; j++, i+=4) {
      WingedEdge.index.set(i, topologyIndex);
   }
   // update HalfEdge.index.
   i = (1 + this.index * 2) * 4;
   HalfEdge.index.set(i+3, topologyIndex);
   HalfEdge.index.set(i+7, topologyIndex);
};

/**
 * offset to start at 1. Zeroth HalfEdge is used as Null.
 */
WingedEdge.prototype.getIndex = function(hEdge) {
   return 1 + (this.index*2) + ((hEdge === this.right) ? 1 : 0);
};


WingedEdge.prototype.getApex = function(hEdge, pt) {
   const data = WingedEdge.index.buffer;
   let idx = this.index * 24;    // 24 = 4*3*2;
   if (this.right === hEdge) {
      idx += 12;
   }

   idx += 8;  // apex index
   const apex = data[idx]*3;
   pt[0] = Vertex.position.buffer[apex];
   pt[1] = Vertex.position.buffer[apex+1];
   pt[2] = Vertex.position.buffer[apex+2];
}
/**
 * buildup drawingLine using triangle, assume this wingedEdge is lived.
 * @param {Float32Array} data - array
 * @param {number} idx - start index
 * @return {number} - current index position.
 */
WingedEdge.prototype.updateApex = function(hEdge, apex) {
   const data = WingedEdge.index.buffer;
   let idx = this.index * 24;    // 24 = 4*3*2;
   if (this.right === hEdge) {
      idx += 12;
   }

   if (idx < WingedEdge.index.alteredMin) {
      WingedEdge.index.alteredMin = idx;
   }  

   const faceId = hEdge.face ? hEdge.face.index : -1;
   data[idx++] = hEdge.origin ? hEdge.origin.index : -1;   // vertexId
   data[idx++] = this.index;           // wEdge
   data[idx++] = faceId;               // face
   idx++;                              // body
   data[idx++] = hEdge.destination() ? hEdge.destination().index : -1;
   data[idx++] = this.index;
   data[idx++] = faceId;
   idx++;
   data[idx++] = apex ? apex.origin.index : -1;
   data[idx++] = (-this.index) - 1;    // -wEdge - 1. barycentric indication.
   data[idx]   =  faceId;
   
   if (idx > WingedEdge.index.alteredMax) {
      WingedEdge.index.alteredMax = idx;
   }
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

WingedEdge.prototype.getNormal = function(normal) {
   if (this.left.face) {
      vec3.add(normal, normal, this.left.face.normal);
   }
   if (this.right.face) {
      vec3.add(normal, normal, this.right.face.normal);
   }
   vec3.normalize(normal, normal);
};


const Attribute = {
// vertex: null,
   color: null,
   normal: null,
   uv: null,         // uv(4) - 4 group of uv using float16.
};


const HalfEdge = function(wEdge) {  // should only be created by WingedEdge
   HalfEdge.index.alloc();    // allocate 12 (4 * 3)
   HalfEdge.indexAttribute.alloc();
   HalfEdge.triangleList.alloc();
   //
   this.wingedEdge = wEdge;   // parent winged edge
   this._next = null;
//   this.prev = null;       // not required, but very nice to have shortcut
   this._origin = null;        // origin vertex, 
//   if (vert.outEdge === null) {
//     vert.outEdge = this;
//   }
   this._face = null;
   this.pair = null;
};
HalfEdge.index = null;        // (vertex(index), hEdge(index), PolygonIndex, GroupIndex) hEdge(normal, color, texCoord) (polygon has material, state, centroid), (group state)
HalfEdge.indexAttribute = null;    // (color, normal, texCoord0) Index.  how about tangent?, joints? weights? 
HalfEdge.color = null;        // (r,g,b) - using byte.
HalfEdge.triangleList = null; // Polygon.index = (HalfEdge.totalSize * 3) - (hEdge, hEdge, apex)
//HalfEdge.barycentric = null;  // clutch for webgl1
Object.defineProperties(HalfEdge.prototype, {
   origin: {get: function() {return this._origin;},
            set: function(pt) {
               if (this._origin !== pt) {
                  this._origin = pt;
                  // update index
                  let i = this.getIndex(this) * 4;
                  const idx = pt ? pt.index : -1;
                  HalfEdge.index.set(i, idx);
               }
            } },
   face: {get: function() {return this._face;},
          set: function(polygon) {
            if (this._face !== polygon) {
               this._face = polygon;
               // update index
               const idx = this.getIndex();
               const i = idx * 4;
               if (polygon) {
                  HalfEdge.index.set(i+2, polygon.index);
                  //HalfEdge.triangleList.set((idx-1)*3+2, -polygon.index - 1);    // centerFakehEdge.
               } else {
                  HalfEdge.index.set(i+2, -1);              // negative number indicate null polygon.
                  //HalfEdge.triangleList.set((idx-1)*3+2, idx);           // null face. point back to self.
               }
            }
          } },
   next: {get: function() {return this._next;},
          set: function(hEdge) {
             if (this._next !== hEdge) {
               this._next = hEdge;
               /*const idx = this.getIndex();
               let index = idx;
               if (hEdge) {
                  index = hEdge.getIndex();
               }
               HalfEdge.triangleList.set((idx-1)*3+1, index);  // point to next*/
             }
          }},
   index: {get: function() {return this.wingedEdge.index;}},
});

HalfEdge.prototype.setTriangle = function(apex) {
   const idx = this.getIndex();
   const i = (idx-1)*3;
   HalfEdge.triangleList.set(i, idx);                       // draw triangle
   HalfEdge.triangleList.set(i+1, this.next.getIndex());
   HalfEdge.triangleList.set(i+2, apex.getIndex());  // draw triangle
   this.updateApex(apex);  // set draw edge
};
HalfEdge.prototype.setTriangleEdge = function(apex) {    // edge only
   const idx = (this.getIndex()-1)*3;
   HalfEdge.triangleList.set(idx, 0);                    // non-drawing triangle
   HalfEdge.triangleList.set(idx+1, 0);                  // non-drawing triangle
   HalfEdge.triangleList.set(idx+2, 0);                  // non-drawing triangle
   this.updateApex(apex);                                // setup edge drawing
};
HalfEdge.prototype.setTriangleInternal = function(next, apex) {   // internal triangle,
   const idx = this.getIndex();
   const i = (idx-1)*3;
   HalfEdge.triangleList.set(i, idx);                       // draw triangle
   HalfEdge.triangleList.set(i+1, next.getIndex());
   HalfEdge.triangleList.set(i+2, apex.getIndex());  // draw triangle
   this.updateApex(next);  // set draw edge
};

HalfEdge.prototype.getApex = function(pt) {
   this.wingedEdge.getApex(this, pt);
}

HalfEdge.prototype.updateApex = function(apex) {
   this.wingedEdge.updateApex(this, apex);
};

HalfEdge.prototype.getIndex = function() {
   return this.wingedEdge.getIndex(this);
}

/**
 * toggle hilite of wEdge, third position, 0x0100
 */
HalfEdge.prototype.setHilite = function(onOff) {
   // select polygon set color,
   this.wingedEdge.setEdgeMask(onOff, 4);
}

/**
 * 
 */
HalfEdge.prototype.getVertexColor = function(colorBuff) {
   const index = this.getIndex() * 3;
   const ret = HalfEdge.indexAttribute.get(index);
   if (colorBuff) {
      HalfEdge.color.getValue(ret, colorBuff);
   }
   return ret;
};
/**
 * 
 */
HalfEdge.prototype.setVertexColor = function(color) {
   // remove old bind
   let index = this.getIndex() * 3;
   let oldColor = HalfEdge.indexAttribute.get(index);
   const colorAsset = HalfEdge.color.pruneGet(oldColor);
   HalfEdge.color.bind(color);
   HalfEdge.indexAttribute.set(index, color); 
   // return colorBuff 
   return colorAsset;
};

/**
 * (uv) - uv index.
 */
HalfEdge.prototype.setUV = function(uv) {
   // remove old bind
   let index = this.getIndex() * 3 + 2;
   let oldUV = HalfEdge.indexAttribute.get(index);
   let texCoord = Attribute.uv.pruneGet(oldUV);
   Attribute.uv.bind(uv);
   HalfEdge.indexAttribute.set(index, uv);
   // return oldAsset 
   return texCoord;
};
/**
 * return the uv index. 0 meant no uv
 */
HalfEdge.prototype.getUV = function() {
   let index = this.getIndex() * 3 + 2;
   return HalfEdge.indexAttribute.get(index);
};
HalfEdge.prototype.getUVCoord = function(channel, coord) {
   Attribute.uv.getChannel(this.getUV(), channel, coord);
}


HalfEdge.prototype.initAttribute = function() {
   HalfEdge.color.bind(0);
   let index = this.getIndex() * 3;
   HalfEdge.indexAttribute.set(index, 0);
   // set uv
   Attribute.uv.bind(0);
   HalfEdge.indexAttribute.set(index+2, 0);
};


HalfEdge.prototype.discardInternal = function(affected) {
   // release resources.
   let index = this.getIndex() * 3;
   let oldIndex = HalfEdge.indexAttribute.get(index);
   let asset = HalfEdge.color.pruneGet(oldIndex);
   if (asset.value) {
      affected.color.push( asset );
   }
   oldIndex = HalfEdge.indexAttribute.get(index+2);
   asset = Attribute.uv.pruneGet(oldIndex);
   if (asset.value) {
      affected.uv.push( asset );
   }
   this.setTriangleEdge(null);

   // reset HalfEdge
   this.face = null;
   this.origin = null;
   this.next = this.pair;
};

HalfEdge.prototype.archiveInternal = function() {
   let index = this.getIndex() * 3;
   let oldColor = HalfEdge.indexAttribute.get(index);
   if (oldColor < 0) {
      throw(new Error("No color Attribute"));
   }
   let oldUV = HalfEdge.indexAttribute.get(index + 2);
   if (oldUV < 0) {
      throw(new Error("No uv Attribute"));
   }
   return {origin: this.origin, next: this.next, color: oldColor, uv: oldUV};
};

HalfEdge.prototype.restoreInternal = function(archive) {
   this.origin = archive.origin;
   this.next = archive.next;
   // setVertexColor;
   this.setVertexColor(archive.color);
   this.setUV(archive.uv);
   //let index = this.getIndex() * 3;
   //HalfEdge.color.bind(archive.color);
   //HalfEdge.indexAttribute.set(index, archive.color);
   //Attribute.uv.bind(archive.uv);
   //HalfEdge.indexAttribute.set(index+2, archive.uv);
};

HalfEdge.prototype.isLive = function() {
   return this.wingedEdge.isLive();
}

// boundary edge if no assigned face.
HalfEdge.prototype.isBoundary = function() {
   return this.face === null;
};

HalfEdge.prototype.isNotBoundary = function() {
   return this.face !== null;
};

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
      throw("HalfEdge.prev: link list is broken, cannot find prev");
   }
   return ret;
};

// similar to vertex's traverse each edge.
HalfEdge.prototype.eachEdge = function *() {
   var start = this;
   var edge = start;
   if (edge) {
      do {  // counter clockwise ordering
         yield edge;
         edge = edge.pair.next;
      } while (edge && (edge !== start));
   }
};


//
const Vertex = function(index) {
   Vertex.index.alloc();                     // get value from global buffer
   let posOffset = Vertex.position.alloc();   // allocate component.
   // real init
   this.outEdge = null;
   this.posOffset = posOffset;
   this._index = index;
   const i = posOffset;
   Vertex.index.set(i, i/3);
};
Vertex.index = null;  // (vIndex, state, group) - map together. (how about webgl2?)
Vertex.position = null;

/** 
 *  -1 meant no major axis intersection, 0 no intersection, 1 intersection
 */
Vertex.isOverlap = function(a, b) {
   const kTolerance = 0.001*2;
   const rad2 = kTolerance*kTolerance;
   
   let x = b[0] - a[0];
   x *= x;
   if (x > rad2)  {
      return -1;
   }
   let y = b[1] - a[1];
   y *= y;
   let z = b[2] - a[2];
   z *= z;
   if (rad2 > (x+y+z)) {
      return 1;
   }
   return 0;   // no overlap
}

Object.defineProperty(Vertex.prototype, 'index', {
   get: function() {
      return this.posOffset / 3; // or should we get this._index?
   },
});

// faked array [0,1,2]
Object.defineProperties(Vertex.prototype, {
   0: { get: function() {return Vertex.position.buffer[this.posOffset];},
        set: function(value) {Vertex.position.set(this.posOffset, value);} },
   1: { get: function() {return Vertex.position.buffer[this.posOffset+1];},
        set: function(value) {Vertex.position.set(this.posOffset+1, value);} },
   2: { get: function() {return Vertex.position.buffer[this.posOffset+2];},
        set: function(value) {Vertex.position.set(this.posOffset+2, value);} },
   length: { get: function() { return 3;},
             set: function(_value) {}}
}); 
Vertex.prototype.set = function(inArray) {
   Vertex.position.set(this.posOffset, inArray[0]);
   Vertex.position.set(this.posOffset+1, inArray[1]);
   Vertex.position.set(this.posOffset+2, inArray[2]);
};

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
/**
 * for undo/redo purpose
 */
Vertex.prototype.getRestore = function(ptView) {
   ptView.set(this); ptView.inc();
   return {vertex: this, outEdge: this.outEdge};
};
Vertex.prototype.setRestore = function(restore, ptView) {
   this.outEdge = restore.outEdge;
   this.set(ptView); ptView.inc();
};


Vertex.prototype.hide = function() {
   this.setMask(false, 128);
};

Vertex.prototype.show = function() {
   this.setMask(true, 128);
};

Vertex.prototype.resetState = function() {
   const index =this.posOffset+1;
   const state = parseInt(Vertex.index.buffer[index]);
   Vertex.index.set(index, state & 128);   // clear all bit except hide/show
};

Vertex.prototype.setHilite = function(onOff) {
   this.setState(onOff, 4);
};

Vertex.prototype.setSelect = function(onOff) {
   this.setState(onOff, 1);
};


Vertex.prototype.setMagnet = function(onOff) {
   this.setState(onOff, 2);
}

Vertex.prototype.setState = function(onOff, mask) {
   const index = this.posOffset + 1;

   const state = parseInt(Vertex.index.buffer[index]);   // float to int, so easier to mask?
   if (onOff) {
      return Vertex.index.set(index, state | mask);
   } else {
      return Vertex.index.set(index, state & (~mask));
   }
};

Vertex.prototype.setGroup = function(topology) {
   const index = this.posOffset+2;
   Vertex.index.set(index, topology);
};


Vertex.prototype.restructure = function(deleteWedges) {
   let start = this.outEdge;
   let outEdge = this.outEdge;
   let current = this.outEdge;
   let prev = null;
   while (deleteWedges.has(current.wingedEdge)) {
      prev = current;
      current = current.next.pair;
      start = outEdge = current;
      if (current === this.outEdge) {  // should not happened
         break;
      }
   }
   do {
      if (deleteWedges.has(current.wingedEdge)) {
         // remove current from link list
         if (prev === null) {
            let cur = current;
            do {
               prev = cur;
               cur = cur.pair.next;
            } while (cur !== current);
         }
         prev.pair.next = current.pair.next;
         if (outEdge === current) { // outEdge should not point to deleteWedges
            outEdge = current.pair.next;
         }
      } else {
         if (current.index < outEdge.index) {
            outEdge = current;
         }
         prev = current;
      }
      current = current.pair.next;
   } while (current !== start);
   if (this.outEdge !== outEdge) {
      this.outEdge = outEdge;    // lowest index outEdge
   }
}

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
Vertex.prototype.orient = function(outEdge) {
   if (!this.outEdge ||  (this.outEdge.index > outEdge.index)) {
      this.outEdge = outEdge;
   }
}

Vertex.prototype.isLive = function() {
   return (this.outEdge !== null);
};

Vertex.prototype.oneRing = function* (start) {
   if (!start) {
      start = this.outEdge; // we want inEdge.
   }
   let current = start;
   do {
      const inEdge = current.pair;
      yield inEdge.origin;
      current = inEdge.next;
   } while(current !== start);
};

Vertex.prototype.edgeRing = function* (start) {
   if (!start) {
      start = this.outEdge;
   }
   let current = start;
   do {
      let next = current.pair.next;
      yield current;
      current = next;
   } while(current !== start);
};

// utility functions for traversing all incident edge,
Vertex.prototype.eachInEdge = function *() {
   // i am in
   var start = this.outEdge;
   var edge = start;
   if (edge) {
      do { // ccw ordering
         const inEdge = edge.pair;
         edge = edge.pair.next;   // my pair's next is outEdge.
         yield inEdge;
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
Vertex.prototype.eachOutEdge = function *() {
   // i am in, so my pair is out.
   var start = this.outEdge;
   var edge = start;
   if (edge) {
      do {  // counter clockwise ordering
         yield edge;
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

/**
 * return all freeInEdge. There could be more than one.
 */
Vertex.prototype.findFreeInEdgeAll = function() {
   const ret = [];
   const start = this.outEdge;
   let current = start;
   do {
      if (current.pair.isBoundary()) {
         ret.push( current.pair );
      }
      current = current.pair.next;
   } while (current !== start);
   return ret;
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
      if (outHalf.index < this.outEdge.index) {   // check for minimal 
         this.outEdge = outHalf;
      }
   }
   // link edge successful.
   return true;
};

Vertex.prototype.unlinkEdge = function(outHalf, inHalf)  {// left, right of winged edge
   const prev = outHalf.prev();
   if (prev === null) {
      throw("Error: Could not find Prev hEdge");
   }
   if (this.outEdge === outHalf) {
      if (prev === inHalf) {
         this.outEdge = null;
         return;
      }
      this.outEdge = prev.pair;
      //this.reorient();
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

Vertex.prototype.getNormal = function(normal) {
   const start = this.outEdge;
   let current = start;
   const a = [0, 0, 0], b = [0, 0, 0], temp = [0, 0, 0];
   vec3.sub(a, current.destination(), current.origin);
   do {
      current = current.pair.next;
      vec3.sub(b, current.destination(), current.origin);
      vec3.cross(temp, b, a);
      vec3.add(normal, normal, temp);
      vec3.copy(a, b);
   } while (current !== start);
   vec3.normalize(normal, normal);
};
/**
 * check for vertices' health  
 */
Vertex.prototype.isOk = function() {
   if (this.outEdge) {
      let hEdge = this.outEdge;
      do {
         if (hEdge.index < this.outEdge.index) {
            throw("Vertex's outEdge is not the smallest");
         }
         hEdge = hEdge.pair.next;
      } while (hEdge !== this.outEdge);
   } else {
      throw("outEdge should not be null");
   }
}




const Polygon = function(startEdge, size, material=Material.default) {
   BoundingSphere.call(this);
   this.index = Polygon.state.alloc()/3;
   Polygon.normal.alloc();
   this.halfEdge = startEdge;
   this.numberOfVertex = size;      // how many vertex in the polygon
   this.assignMaterial(material);
   this.triangulation = 0;          // false
   //this.update(); //this should init right?
};
Polygon.prototype = Object.create(BoundingSphere.prototype);
Object.defineProperty(Polygon.prototype, 'constructor', { 
   value: Polygon,
   enumerable: false, // so that it does not appear in 'for in' loop
   writable: true });
Polygon.state = null;         // state(selected, hilite). byte. 2 bytes should be enough for material.
Polygon.normal = null;        // normal per polygon.
Polygon.triangleIndex = null; // the drawing list
/**
 * for undo/redo purpose.
 */
Polygon.prototype.getRestore = function() {
   return {polygon: this, halfEdge: this.halfEdge, material: this.material};  // all other data can be computed.
};


Polygon.prototype.hide = function() {
   this.setState(true, 4);
};

Polygon.prototype.show = function() {
   this.setState(false, 4);
};

Polygon.prototype.setHilite = function(onOff) {
   this.setState(onOff, 2);
};

Polygon.prototype.setSelect = function(onOff) {
   this.setState(onOff, 1);
};

Polygon.prototype.setState = function(onOff, mask) {
   const index = this.index * 3;

   const state = Polygon.state.buffer[index];
   if (onOff) {
      return Polygon.state.set(index, state | mask);
   } else {
      return Polygon.state.set(index, state & (~mask));
   }
};

/**
 * assignMaterial - incre assignedMaterial and decre old discard material;
 * @param {Material} - input material;
 */
Polygon.prototype.assignMaterial = function(material) {
   if (material !== this.material) {
      if (this.material) {
         this.material.unassigned();
      }
      this.material = material;
      material.assigned();
      const i = this.index * 3;
      Polygon.state.set(i+1,  material.index & 0x000000ff);          // pack into 2 byte, assume no more than 65026 material.
      Polygon.state.set(i+2, (material.index & 0x0000ff00) >> 8);
   }
}

// the return value should not be modified. todo:?
Object.defineProperty(Polygon.prototype, 'normal', {
   get: function() { return new Vec3View(Polygon.normal.buffer, this.cntrOffset);},
});
Polygon.prototype.getNormal = function(normal) {
   let index = this.cntrOffset;
   normal[0] = Polygon.normal.get(index);
   normal[1] = Polygon.normal.get(index+1);
   normal[2] = Polygon.normal.get(index+2);
   return normal;
}

// not on free list. not deleted and visible
Polygon.prototype.isLive = function() {
   return (this.halfEdge !== null);
};

Polygon.prototype.isVisible = function() {
   const visible = !(Polygon.state.buffer[this.index] & 4);
   return (visible && (this.halfEdge !== null));
}

Polygon.prototype.buildIndex = function(data, index, center) {
   for (let edge of this.hEdges()) {
      data[index++] = edge.origin.index;
      data[index++] = edge.destination().index;
      data[index++] = center;
   }
   return index;
}

Polygon.prototype.eachVertex = function *() {
   // get every vertex of the face.
   var begin = this.halfEdge;
   var current = begin;
   do {
      yield current.origin;
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
/*Polygon.prototype.computeNormal = (function() {
   const U = vec3.create();
   const V = vec3.create();
   return function() {
      const v1 = this.halfEdge.origin;
      const v0 = this.halfEdge.next.origin;
      //const v2 = this.halfEdge.next.destination();
      this.getCentroid(U);
      vec3.sub(V, U, v0);
      vec3.sub(U, v1, v0);
      vec3.cross(V, V, U);
      vec3.normalize(V, V);
      const i = this.index * 3;
      Polygon.normal.set(i, V[0]);
      Polygon.normal.set(i+1, V[1]);
      Polygon.normal.set(i+2, V[2]);
   };
}());*/
/**
 * ccw ordering 
 * newell's method for polygon normal.
*/
Polygon.prototype.computeNormal = function() {
  let normal = [0, 0, 0];
  for (let hEdge of this.hEdges()) {
     let v0 = hEdge.origin, v1 = hEdge.destination();
     normal[0] += (v0[1] - v1[1]) * (v0[2] + v1[2]);
     normal[1] += (v0[2] - v1[2]) * (v0[0] + v1[0]);
     normal[2] += (v0[0] - v1[0]) * (v0[1] + v1[1]);
  }
  const dir = [normal[0], normal[1], normal[2]];
  vec3.normalize(normal, normal);
  const i = this.index * 3;
  Polygon.normal.set(i, normal[0]);
  Polygon.normal.set(i+1, normal[1]);
  Polygon.normal.set(i+2, normal[2]);
  return dir;
}


/**
 * used by undo functions.
 */
Polygon.prototype._assignFace = function() {
   let current = this.halfEdge;
   do {  // reassign back face for restored wEdge.
      current.face = this;
      current = current.next;
   } while (current != this.halfEdge);
   return this;
};

// compute centroid and radius, and normal
Polygon.prototype.updatePosition = function() {
   const begin = this.halfEdge;
   let current = begin;
   // now get radius, after we have center, or we could compute min, max, and get distance to center.
   const min = [current.origin[0], current.origin[1], current.origin[2]];
   const max = [current.origin[0], current.origin[1], current.origin[2]];
   do {
      vec3.min(min, min, current.origin);
      vec3.max(max, max, current.origin);
      current = current.next;
   } while (current !== begin);
   let sphere = {center: [0, 0, 0], radius: 0};
   vec3.sub(sphere.center, max, min);
   vec3.scale(sphere.center, sphere.center, 0.5);
   sphere.radius = Math.hypot(sphere.center[0], sphere.center[1], sphere.center[2]);
   vec3.add(sphere.center, sphere.center, min);
   this.setSphere(sphere);
   
   // compute normal.
   if (this.numberOfVertex > 2) {
      const dir = this.computeNormal();
      if (this.numberOfVertex > 3) {
         // redo triangulation.
         this.triangulation = triangulate(this, dir);
      }
   }
};

/**
 * redo triangulation because change of topology.
 * recompute numberOfVertex, triangulation, and reorient, and call updatePosition to compute normal and centroid and radius.
 */
Polygon.prototype.updateIncipient = function() {
   const dir = this._update();
   if (dir) {
      if (this.triangulation) {  // redo full triangulation
         this.triangulation = triangulate(this, dir);
      } else { // really incipient, so use naive triangulation.
         this.triangulation = triangulateNaive(this);
      }
   }
};

Polygon.prototype.updateFull = function() {
   const dir = this._update();
   if (dir) {
      this.triangulation = triangulate(this, dir);
   }
};

Polygon.prototype._update = function() {
   // reorient, assign triangle to edge, and compute position, size.
   const begin = this.halfEdge;
   let current = this.halfEdge;
   this.numberOfVertex = 0;
   //this[0] = this[1] = this[2] = 0.0;  // reset center
   // now get radius, after we have center, or we could compute min, max, and get distance to center.
   const min = [current.origin[0], current.origin[1], current.origin[2]];
   const max = [current.origin[0], current.origin[1], current.origin[2]];
   const result = [0, 0, 0];
   do {
      //vec3.add(this, this, current.origin);
      vec3.min(min, min, current.origin);
      vec3.max(max, max, current.origin);
      vec3.add(result, result, current.origin);
      if (current.getIndex() < this.halfEdge.getIndex()) {
         this.halfEdge = current;
      }
      if (++this.numberOfVertex > 10001) {   // break;   
         throw("something is wrong with polygon link list");
      }
      if (current.face !== this) {
         throw("impossible face polygon");
      }
      current = current.next;
   } while (current !== begin);
   // compute bounding box, and 
   let radius;
   if (this.numberOfVertex === 3) { // triangle centroid.
      vec3.scale(result, result, 1.0/3.0);
      radius = vec3.distance(result, begin.origin);
   } else { // polygon centroid heuristic.
      radius = vec3.distance(max, min) / 2.0;
      vec3.lerp(result, min, max, 0.5);
   }
   this.setSphere({center: result, radius: radius});


   // now ask updatePosition to compute normal centroid and radius and compute normal.
   if (this.numberOfVertex > 2) {
      return this.computeNormal();
   }
   return null;
};

/**
 * check halfEdge has the smallest id, and we can finish counting vertex in times.
 */
Polygon.prototype.isOk = function() {
   if (this.halfEdge) {
      let hEdge = this.halfEdge;
      let count = 0;
      do {
         if (hEdge.index < this.halfEdge.index) {
            throw "Polygon's halfEdge is not smallest";
         }
         ++count;
         if (count > 1001) {
            throw "Polygon has too many side";  // likely an error.           
         }
         hEdge = hEdge.next;
      } while (hEdge !== this.halfEdge);
      if (count !== this.numberOfVertex) {
         throw "Polygon's Number of Vertex is not consistent";
      }
   } else {
      throw("halfEdge should not be null");
   }
};


/*let PolygonHole = function() {
   const ret = new Polygon();
   ret.visible = false;

};*/


//
// 
//
const MeshAllocator = function(allocatedSize) {
   // Material
   Material.color = new Float32Buffer(3*5);    // not packing to byte to save space because there won't be millions of Materials.
   Material.default = Material.create("default");
   Material.dead = Material.create("dead");
   // wEdge
   WingedEdge.index = new Float32Buffer(24);           // drawing index.
   WingedEdge.state = new ByteBuffer(1);     // unsigned byte state
   // HalfEdge
   HalfEdge.index = new Float32Buffer(4);    // (vIdx, hIdx, pIdx, gIdx)
   HalfEdge.index.alloc();                   // Zeroth HalfEdge is used as Null(-1).
   HalfEdge.index.set(0, -1); HalfEdge.index.set(1, 0); HalfEdge.index.set(2, -1); HalfEdge.index.set(3, -1);
   HalfEdge.indexAttribute = new Float32Buffer(3);
   HalfEdge.indexAttribute.alloc();          // follow zeroth HalfEdge.
   HalfEdge.triangleList = new Int32Buffer(3);     // (hEdge0, hEdge1, hEdge2)
   HalfEdge.color = new ColorAttribute();
   HalfEdge.color.bind(HalfEdge.color.reserve());    // zeroth default color, white.
   HalfEdge.color.setValue(0, [255,255,255]); 
   Attribute.uv = new TexCoordAttribute();  
   Attribute.uv.bind(Attribute.uv.reserve());
   Attribute.uv.setValue(0, [0, 0, 0, 0, 0, 0, 0 ,0]);
   // Vertex
   Vertex.index = new Float32Buffer(3);
   Vertex.position = this.position = new Float32Buffer(3, allocatedSize);  // position buffer.
   // polygon
   BoundingSphere.center = new Float32Buffer(3, allocatedSize);
   //Polygon.index = new Float32Buffer(4);
   Polygon.state = new ByteBuffer(3);
   Polygon.normal = new Float32Buffer(3, allocatedSize);
   
   Polygon.triangleIndex = new TriangleIndexBuffer;

   // WingedTopology
   WingedTopology.state = new ByteBuffer(1);
   // data init
   this.vertices = [];     // class Vertex
   this.edges = [];        // class WingedEdge
   this.faces = [];        // class Polygon
   this.free = {vertices: [], edges: [], faces: []};
   this.affected = {vertices: new Set, edges: new Set, faces: new Set, color: [], uv: []};// affected is when reuse, deleted, or change vital stats.
};
// allocation,
MeshAllocator.prototype.allocVertex = function(pt, delVertex) {
   if (this.free.vertices.length > 0) {
      let vertex;
      if (typeof delVertex === 'undefined') {
         vertex = this.vertices[this.free.vertices.pop()];
      } else {
         const index = MeshAllocator._indexOfFreeList(delVertex.index, this.free.vertices);   // remove delOutEdge from freeEdges list
         if (index < 0) { // not found in free list
            throw("delVertex " + index + " not found in free list");
         }                vertex = delVertex;
         this.free.vertices.splice(index, 1);
         vertex = delVertex;
      }
      vertex.set(pt);
      this.affected.vertices.add( vertex );
      return vertex;
   } else {
      let _vert = new Vertex(this.vertices.length);
      _vert.set(pt); // copy value
      //_vert.index = this.vertices.length;
      this.vertices.push( _vert );
      this.affected.vertices.add( _vert );
      return _vert;
   }
};

MeshAllocator.prototype.allocEdge = function(begVert, endVert, delOutEdge) {
   let edge;
   let outEdge;
   if (this.free.edges.length > 0) { // prefered recycle edge.
      if (typeof delOutEdge !== "undefined") {
         const index = MeshAllocator._indexOfFreeList(delOutEdge.wingedEdge.index, this.free.edges);   // remove delOutEdge from freeEdges list
         if (index < 0) {
            throw("delOutEdge " + delOutEdge.wingedEdge.index + " not found in free list");
         }
         this.free.edges.splice(index, 1);
         edge = delOutEdge.wingedEdge;
         outEdge = delOutEdge;
      } else {
         edge = this.edges[this.free.edges.pop()];
         outEdge = edge.left;
      }
      outEdge.origin = begVert;
      outEdge.pair.origin = endVert;
      outEdge.initAttribute();
      outEdge.pair.initAttribute();
      //this.affected.edges.add( edge );
   } else {
      // initialized data.
      edge = new WingedEdge(begVert, endVert, this.edges.length);
      this.edges.push( edge );

      outEdge = edge.left;
      //this.affected.edges.add( edge );
   }

   return outEdge;
};

// todo: ?binary search for delPolygon, then use splice. a win? for large freelist yes, but, I don't think it a common situation.
MeshAllocator.prototype.allocPolygon = function(halfEdge, numberOfVertex, material, delPolygon) {
   let polygon;
   if (!material) {
      material = Material.default;
   }
   if (this.free.faces.length > 0) {
      if (typeof delPolygon !== 'undefined') {
         const index = MeshAllocator._indexOfFreeList(delPolygon.index, this.free.faces);   // remove delOutEdge from freeEdges list
         if (index < 0) {
            throw("delPolygon " + delPolygon.index + " not found in free list");
         }
         this.free.faces.splice(index, 1);
         polygon = delPolygon;
      } else {
         polygon = this.faces[ this.free.faces.pop() ];
      }
      polygon.assignMaterial(material);
      polygon.halfEdge = halfEdge;
      polygon.numberOfVertex = numberOfVertex;
      //polygon.update();
      polygon.show();            // make sure it visible.
      //this.affected.faces.add( polygon );
   } else {
      polygon = new Polygon(halfEdge, numberOfVertex, material);
      polygon.index = this.faces.length;
      this.faces.push( polygon );
   }
   return polygon;
};

// find the val, return the index of free list
MeshAllocator._indexOfFreeList = function(val, array) {
   let l = 0, r = array.length - 1;
   while (l <= r) {
      //let m = (l + r) >>> 1; /// equivalent to Math.floor((l + h) / 2) but faster
      let m = l + ((r-l) >>> 1); // avoid overflow. 
      let comparison = val - array[m];
      if (comparison > 0) {
         r = m - 1;
      } else if (comparison < 0) {
         l = m + 1;
      } else { // yes found it
         return m;
      }
   }
   // should not happend, throw?
   return -1;
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
   //this.free.vertices.push( vertex );
   this._insertFreeList(vertex.index, this.free.vertices);
   this.affected.vertices.add( vertex );
};

MeshAllocator.prototype.freeHEdge = function(edge) {
   const wEdge = edge.wingedEdge;
   const archive = wEdge.archiveInternal();
   wEdge.discardInternal(this.affected);

   // assert !this.free.edges.has( edge.wingedEdge );
   //this.free.edges.push( edge.wingedEdge );
   this._insertFreeList(wEdge.index, this.free.edges);
   //this.affected.edges.add( edge.wingedEdge );
   return archive;
};

MeshAllocator.prototype.freePolygon = function(polygon) {
   polygon.halfEdge = null;
   polygon.numberOfVertex = 0;
   polygon.assignMaterial(Material.dead); // dead material.
   polygon.hide();
   // assert !freeFaces.has( polygon );
   //this.free.faces.push( polygon );
   this._insertFreeList(polygon.index, this.free.faces);
   this.affected.faces.add( polygon );
};

MeshAllocator.prototype.freeAll = function(polygons, wEdges, vertices) {
   function compare(a, b) {return b-a;}
   for (let polygon of polygons) {
      this.free.faces.push(polygon.index);
      polygon.halfEdge = null;
      polygon.numberOfVertex = 0;
   }
   this.free.faces.sort(compare);
   for (let wEdge of wEdges) {
      this.free.edges.push(wEdge.index);
      wEdge.left.face = null;
      wEdge.left.origin = null;
      wEdge.right.face = null;
      wEdge.right.face = null;
      wEdge.left.next = wEdge.right;
      wEdge.right.next = wEdge.left;
   }
   this.free.edges.sort(compare);
   for (let vertex of vertices) {
      this.free.vertices.push(vertex.index);
      vertex.outEdge = null;
   }
   this.free.vertices.sort(compare);
}


MeshAllocator.prototype.getVertices = function(index) {
   return this.vertices[index];
}

// update for affected (vertex, edge, and polygon)
MeshAllocator.prototype.clearAffected = function() {
   this.affected.vertices.clear();
   this.affected.faces.clear();
};
MeshAllocator.prototype.addAffectedFace = function(polygon) {
   this.affected.faces.add(polygon);
};
MeshAllocator.prototype.addAffectedVertex = function(vertex) {
   this.affected.vertices.add(vertex);
};
MeshAllocator.prototype.addAffectedVertexFace = function(vertex) {
   this.affected.vertices.add(vertex);
   for (let halfEdge of vertex.eachOutEdge()) {
      if (halfEdge.face !== null) {
         this.affected.faces.add(halfEdge.face);
      }
   }
}
MeshAllocator.prototype.updateAffectedVertex = function() {
   for (let vertex of this.affected.vertices) {
      if (vertex.isLive()) {
         vertex.reorient();
      }
   }
};
MeshAllocator.prototype.updateAffected = function() {
   this.updateAffectedVertex();
   for (let polygon of this.affected.faces) {
      if (polygon.isLive()) {
         polygon.updateFull();
      }
   }
   // now cleanup.
   this.clearAffected();
};
MeshAllocator.prototype.updateAffectedIncipient = function() {
   this.updateAffectedVertex();
   for (let polygon of this.affected.faces) {
      if (polygon.isLive()) {
         polygon.updateIncipient();
      }
   }
   // now cleanup.
   this.clearAffected();
};



// 
// changed - so Vertex, WingedEdge, and Polygon is allocated from meshAllocator. So different 
// Models on the same DraftBench can use the same Allocation. Merging becomes easier.
//
const WingedTopology = function(allocator) {
   this.guid = WingedTopology.state.alloc();
   this.alloc = allocator;
   this.vertices = new Set;
   this.faces = new Set;
   this.edges = new Set;
};
WingedTopology.state = null;     // onOff, select, hilite state.

/**
 * check if all polygon, vertex are well formed.
 */
WingedTopology.prototype.checkIntegrity = function() {
   try {
      // check polygon first
      for (let polygon of this.faces) {
         polygon.isOk();
      }
      // check wEdge
      for (let wEdge of this.edges) {
         wEdge.isOk();
      }
      // check vertex next,
      for (let vertex of this.vertices) {
         vertex.isOk();
      }
   } catch (e) {
      alert(e);
   }
};

WingedTopology.prototype.hide = function() {
   this.setState(true, 8);
};
WingedTopology.prototype.show = function() {
   this.setState(false, 8);
};

WingedTopology.prototype.setTransparency = function(onOff) {
   this.setState(onOff, 4);
};

WingedTopology.prototype.setHilite = function(onOff) {
   this.setState(onOff, 2);
};

WingedTopology.prototype.setSelect = function(onOff) {
   this.setState(onOff, 1);
};

WingedTopology.prototype.setState = function(onOff, mask) {
   const index = this.guid;
   const state = WingedTopology.state.buffer[index];
   if (onOff) {
      return WingedTopology.state.set(index, state | mask);
   } else {
      return WingedTopology.state.set(index, state & (~mask));
   }
};


/**
 * @param (stat) - {vertices, faces, edges, boundaryCount}. add up this.s count.
 */
WingedTopology.prototype.getStat = function(stat) {
   for (let wEdge of this.edges) {
      for (let hEdge of wEdge) {
         if (hEdge.isBoundary()) {
            ++stat.boundary;
         }
      }
   }

   stat.vertices += this.vertices.size;
   stat.faces += this.faces.size;
   stat.edges += this.edges.size;
};

/**
 * release all faces, edges, and vertices.
 * return all undo data so we can redo. 
 */
WingedTopology.prototype.empty = function() {
   const archive = {faces: [], edges: [], vertices: [], uvs: [], colors: []};
   for (let polygon of this.faces) {   // free all polygon, and save polygo list
      archive.faces.push( polygon.getRestore() );
      this.alloc.freePolygon(polygon);
   }
   this.faces.clear();

   for (const wEdge of this.edges) {
      archive.edges.push( this.alloc.freeHEdge(wEdge.left) );
   }
   this.edges.clear();

   archive.pts = new Float32Array(this.vertices.size * 3);
   const ptView = new Vec3View(archive.pts);
   for (let vertex of this.vertices) {
      archive.vertices.push( vertex.getRestore(ptView) );
      this.alloc.freeVertex(vertex);
   }
   this.vertices.clear();
   return archive;
};
WingedTopology.prototype.emptyUndo = function(restoreAll) {
   const ptView = new Vec3View(restoreAll.pts);
   for (let vert of restoreAll.vertices) {
      this.addVertex(vert.vertex);
      vert.vertex.setRestore(vert, ptView);
   }

   for (let wEdge of restoreAll.edges) {
      this._createEdge(wEdge.left.origin, wEdge.right.origin, wEdge.wEdge.left);
      wEdge.wEdge.restoreInternal(wEdge);
   }

   for (let restore of restoreAll.faces) {   // undo successfully
      const face = this._createPolygon(restore.halfEdge, 4, restore.material, restore);
      face._assignFace();
   }
};

// act as destructor
WingedTopology.prototype.free = function() {
   this.alloc.freeAll(this.faces, this.edges, this.vertices);
   this.faces = new Set;
   this.edges = new Set;
   this.vertices = new Set;
};

// merge - should we check alloc is the same?
WingedTopology.prototype.merge = function(thisCage, cageGenerator) {
   for (let cage of cageGenerator()) {
      cage.extinquish();   // remove polygon from bvh.
      this._merge(thisCage, cage.geometry.faces, cage.geometry.edges, cage.geometry.vertices);
   }
};

WingedTopology.prototype._merge = function(thisCage, faces, edges, vertices) {
   for (let vert of vertices) {
      vert.setGroup(this.guid);
      this.vertices.add(vert);
   }
   for (let wEdge of edges) {
      wEdge.setGroup(this.guid);
      this.edges.add(wEdge);
   }
   for (let polygon of faces) {
      thisCage.insertFace(polygon);
      this.faces.add(polygon);
   }
}

WingedTopology.prototype.revive = function(thisCage) {
   for (let vert of this.vertices) {
      vert.setGroup(this.guid);
   }
   for (let wEdge of this.edges) {
      wEdge.setGroup(this.guid);
   }
   for (let polygon of this.faces) {
      thisCage.insertFace(polygon);
   }
}

// separate - separate out non-connected geometry.
WingedTopology.prototype.separateOut = function(thisCage) {
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
            thisCage.removeFace(polygon); // separate out of cage
            for (let hEdge of polygon.hEdges()) {
               mesh.vertices.add( hEdge.origin );
               hEdge.origin.setGroup(mesh.guid);
               mesh.edges.add( hEdge.wingedEdge );
               hEdge.wingedEdge.setGroup(mesh.guid);
            }
         }
      }
      return separate; 
   } else {
      return null;
   }
};

WingedTopology.prototype.detachFace = function(thisCage, faceSet) {
   const vertices = new Set;
   const edges = new Set;
   for (let polygon of faceSet) {
      thisCage.removeFace(polygon);
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

WingedTopology.prototype.addAffectedFace = function(polygon) {
   this.alloc.addAffectedFace(polygon);
   return this;
};

WingedTopology.prototype.addAffectedVertex = function(vertex) {
   this.alloc.addAffectedVertex(vertex);
   return this;
};

WingedTopology.prototype.updateAffected = function() {
   this.alloc.updateAffected();
};

WingedTopology.prototype.updateAffectedIncipient = function() {
   this.alloc.updateAffectedIncipient();
};

WingedTopology.prototype.addAffectedVertexFace = function(vertex) {
   this.alloc.addAffectedVertexFace(vertex);
};

WingedTopology.prototype._createPolygon = function(halfEdge, numberOfVertex, material, delPolygon) {
   let polygon;
   if (delPolygon) {
      if (delPolygon.polygon.isLive()) {
         polygon = delPolygon.polygon;
      } else {
         polygon = this.alloc.allocPolygon(halfEdge, numberOfVertex, delPolygon.material, delPolygon.polygon);
      }
   } else {
      polygon = this.alloc.allocPolygon(halfEdge, numberOfVertex, material);
   }
   this.faces.add(polygon);
   this.addAffectedFace(polygon);
   return polygon;
};

// return vertex index
WingedTopology.prototype.addVertex = function(pt, delVertex) {
   const vertex = this.alloc.allocVertex(pt, delVertex);
   this.vertices.add(vertex);
   vertex.setGroup(this.guid);
   return vertex;
};

WingedTopology.prototype._createEdge = function(begVert, endVert, delOutEdge) {
   const outEdge = this.alloc.allocEdge(begVert, endVert, delOutEdge);
   outEdge.wingedEdge.setGroup(this.guid);  // copy index.
   this.edges.add(outEdge.wingedEdge);
   // align vertex.outEdge
   this.addAffectedVertex(begVert).addAffectedVertex(endVert);
   //begVert.orient(outEdge);
   //endVert.orient(outEdge.pair);
   return outEdge;
};
// recycled
WingedTopology.prototype._freeVertex = function(vertex) {
   if (this.vertices.delete(vertex)) {
      vertex.setGroup(-1);
      this.alloc.freeVertex(vertex);
   }
};

WingedTopology.prototype._freeEdge = function(edge) {
   if (this.edges.delete(edge.wingedEdge)){
      this.alloc.freeHEdge(edge);
   }
};

WingedTopology.prototype._freePolygon = function(polygon) {
   if (this.faces.delete(polygon)) {   // should always true
      const delPolygon = {material: polygon.material, polygon: polygon};
      this.alloc.freePolygon(polygon);
      return delPolygon;   // could be reused, so we have to save polygon and it material.
   }
   return null;
};


WingedTopology.prototype.getExtent = function(min, max) {
   //min[0] = min[1] = min[2] = Number.MAX_VALUE;
   //max[0] = max[1] = max[2] = Number.MIN_VALUE;
   for (let vertex of this.vertices) {
      for (let i = 0; i < 3; ++i) {
         const p = vertex[i];
         if (p > max[i]) {
            max[i] = p;
         } else if (p < min[i]) {
            min[i] = p;
         }
      }
   }
};


// return winged edge ptr because internal use only.
WingedTopology.prototype.addEdge = function(begVert, endVert, prevHalf, nextHalf) {
   // what to do with loop edge?
   // what to do with parallel edge?

   // initialized data.
   var edge = this._createEdge(begVert, endVert).wingedEdge;

   // Link outedge, splice if needed
   if (prevHalf) {   // splice directly to prevHalf
      edge.right.next = prevHalf.next;
      prevHalf.next = edge.left;
   } else if (!begVert.linkEdge(edge.left, edge.right)) {
      // release the edge
      this._freeEdge(edge.left);
      return null;
   }
   // Link inedge, splice if needed
   /*if (nextHalf) {
      const prev = nextHalf.prev();
      edge.left.next = nextHalf
      prev.next = edge.right;
   } else*/ if (!endVert.linkEdge(edge.right, edge.left)) {
      begVert.unlinkEdge(edge.left, edge.right);
      // release the endge
      this._freeEdge(edge.right);
      return null; 
   }

   // return outEdge.
   return edge.left;
};

/**
 * search for free gap,
 * http://kaba.hilvi.org/homepage/blog/halfedge/halfedge.htm
 */
WingedTopology.prototype.findFreeInEdge = function(inner_next, inner_prev) {
   const startingFrom = inner_next.pair;
   const andBefore = inner_prev;
   if (andBefore !== startingFrom) {
      let current = startingFrom;
      do {
         if (current.isBoundary()) {
            return current;
         }
         current = current.next.pair;
      } while (current !== andBefore);
   }

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

/**
 * add wrapper, use original name,
 */
WingedTopology.prototype.addPolygon = function(pts, material) {
   return this.addPolygonEx(0, pts.length, pts, material).face;
}

// passed in an array of vertex index. automatically create the required edge.
// return polygon index.
// rename as addPolygonEx() - (2021/08/17)
// add proper handling for non-manifold. (2017/05/28)
// add checking for complex polygon. (2017/05/29)
/**
 * param {int} start = start index
 *       {int} end = end index, not included.
 *       {array} pts - cw pts polygon list
 *       {Material} material - assigned material.
 */
WingedTopology.prototype.addPolygonEx = function(start, end, pts, material) {
   const length = end - start;
   if (length < 3) { // at least a triangle
      console.log("Bad polygon: less than 3 edges");
      return -1;
   }

   let prevHalf = null;
   let nextHalf = null;
   var nextIndex = start;
   // builds WingEdge if not exist
   var halfLoop = [];
   var newEdges = [];
   const complex = new Set;
   for (let i = start; i < end; ++i) {
      nextIndex = i + 1;
      if (nextIndex === end) {
         nextIndex = start;
         nextHalf = halfLoop[0];
      }

      var v0 = this.alloc.getVertices(pts[i]);
      var v1 = this.alloc.getVertices(pts[nextIndex]);
      var edge = this.findHalfEdge(v0, v1);
      if (edge === null) { // not found, create one
         edge = this.addEdge(v0, v1, prevHalf, nextHalf);
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

      prevHalf = edge;
      halfLoop.push( edge );
   }

   // Try to reorder the links to get proper orientation.
   for (let i = 0; i < length; ++i) {
      nextIndex = i + 1;
      if (nextIndex === length) {
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
   var newPolygon = this._createPolygon(halfLoop[0], length, material);

   // Link half-edges to the polygon.
   for (let i = 0; i < length; ++i) {
      halfLoop[i].face = newPolygon;
   }

   return {face: newPolygon, hLoop: halfLoop};
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
   let newPolygon = null;
   if (delPolygon !== null) { // undefined will created a newPolygon
      newPolygon = this._createPolygon(outEdge, 4, Material.default, delPolygon);  // todo: correct material, inEdge.face.material
      let size = 0;
      newPolygon.eachEdge( function(halfEdge) {
         ++size;
         halfEdge.face = newPolygon;
      });
      newPolygon.numberOfVertex = size;
   }
   outEdge.face = newPolygon;

   // inEdge is oldPolygon
   inEdge.face = oldPolygon;
   if (oldPolygon) {
      if (oldPolygon.halfEdge.face === newPolygon) {
         //  pointed to one of the halfedges now assigned to newPolygon
         oldPolygon.halfEdge = inEdge;
      }
      let size = 0;
      oldPolygon.eachEdge( function(halfEdge) {
         ++size;
      });
      oldPolygon.numberOfVertex = size;
      this.addAffectedFace( oldPolygon );
   }

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
   //const vOut = vOrigin.outEdge;

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
   this.addAffectedFace(newOut.face);
   newIn.face = inEdge.face;
   newIn.face.numberOfVertex++;
   this.addAffectedFace(newIn.face);

   // fix vertex
   outEdge.origin = vertex;
   vertex.outEdge = newIn;
   //vertex.orient(outEdge);
  
   if (vOrigin.outEdge === outEdge) {
      vOrigin.outEdge = newOut;
   } 
   //this.addAffectedWEdge( outEdge.wingedEdge );     // edge changed.
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
   this.addAffectedFace(inEdge.pair.face);   // 2020-12-25 - due to double edge, sometime vertex will move to other face.
   const newPolygon = this._createPolygon(newOut, 2, Material.default); // todo: outEdge.face.material?
   newOut.face = newPolygon;
   inEdge.face = newPolygon;

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
   this.addAffectedFace(inEdge.face);
   this.addAffectedFace(inEdge.pair.face);

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
   const origin = this.addVertex(inStart.destination());
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
         const polygon = this._createPolygon(edge.pair, edgeInsertion.length, Material.default);   // todo: find the correct material
         polygon._assignFace();
         ret.selectedFaces.add( polygon );
      }
   }
   // compute vertexLimit magnitude, and expanding direction. (reuse normal), 
   // now (vertexLimit - vertex) = direction. 
   ret.vertexLimit = Number.MAX_SAFE_INTEGER;       // magnitude
   ret.position = new Float32Array(ret.vertices.length*3);     // saved the original position
   ret.direction = new Float32Array(ret.vertices.length*3);    // also add direction.
   const position = new Vec3View(ret.position);
   const direction = new Vec3View(ret.direction);
   const pt = [0, 0, 0];  // temporary
   for (let vertex of ret.vertices) {
      const hEdges = vertexLimit.get(vertex);
      let avg = 1.0;
      if (twoEdgeVertexHack.has(vertex)) {
         avg = 0.4;
      }
      for (let hEdge of hEdges) {
         vec3.copy(pt, hEdge.origin);
         vec3.copy(position, vertex);
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
      position.inc();
      direction.inc();
   }

   // we needs faces, we needs
   return ret;
};



/**
 * stitchVertex together, aGroup will attach to bGroup
 * @{param} aGroup - 
 */
WingedTopology.prototype._simpleStitch = function(aIn, aOut, bIn, bOut) {
   //const a = aOut.origin;
   const b = bOut.origin;
   
   // lift a's edges to b
   const end = aIn.next;
   let current = aOut;
   do {
      current.origin = b;
      current = current.pair.next;
   } while (current !== end);
   // stitch and release vertex a
   bIn.next = aOut;
   aIn.next = bOut;
};
WingedTopology.prototype.stitchVertex = function(aGroup, bGroup) {
   const a = aGroup[0].destination();
   if (a.index === 1093) {
      console.log("impossible");
   }
   //const b = bGroup[0].destination();
   const undo = {stitch: []};
   // try to stich a to b
   let count = 0;
   let stitch = false;
   for (let i = aGroup.length-1; i >= 0; --i) {
      let aIn = aGroup[i];
      let aOut = aIn.next;     // already separate out
      let rightK = -1;            // aIn connect to bOut position
      let connectJ = -1;
      for (let j = 0; j < bGroup.length; ++j) { // check for overlap
         const bIn = bGroup[j];
         const bOut = bIn.next;
         if (aIn !== bOut && bIn !== aOut) { // make sure a and b don't connect
            if (rightK < 0) {
               const right = Vertex.isOverlap(aOut.destination(), bIn.origin) > 0;
               if (right) {   // great got it
                  rightK = j; // 
               }
            }
            const left = Vertex.isOverlap(aIn.origin, bOut.destination()) > 0;
            if (left) {
               this._simpleStitch(aIn, aOut, bIn, bOut); // break
               stitch = true;
               connectJ = j;
               aGroup.splice(i, 1);  // remove detach polygons.
               break;
            }
         }
      }
      // now try to find right connect
      if (connectJ >= 0 && rightK < 0) {
         for (let j = 0; j < bGroup.length; ++j) { // connect to bIn
            const bIn = bGroup[j];
            const bOut = bIn.next;
            if (aIn !== bOut && bIn !== aOut) { // make sure a and b don't connect
               if (Vertex.isOverlap(aOut.destination(), bIn.origin) > 0) {
                  rightK = j;
                  break;
               }
            }
         }
      }
      if (rightK >= 0 && rightK !== connectJ) {  // do we need to stitch right?
         const bIn = bGroup[rightK];
         const bOut = bIn.next;
         if (connectJ >= 0) { // remove bGroup to correct position since we form a big group.
            aIn = bGroup[connectJ];
            aOut = aIn.next
            bGroup.splice(rightK, 1);
         } else { // replace position.
            bGroup[rightK] = aIn;
         }
         // stitch
         this._simpleStitch(aIn, aOut, bIn, bOut);
         stitch = true;
      }
   }
   undo.count = count;
   if (stitch) {
      // final clean up.
      //b.reorient();
      undo.vertex = a;
      if (aGroup.length > 0) {// reattch a to first group then reorient.
         a.outEdge = aGroup[0];
         //a.reorient();
      } else { // empty, so safely delete.
         this._freeVertex(a);
      }
      return undo;
   }
   return null;
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
         const origin = this.addVertex(outEdge.origin);
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
         const polygon = this._createPolygon(firstBevel.pair, count+1, Material.default); // todo: find the correct material. 
         polygon._assignFace();  // assign face to all edges, some were not assigned.
         ret.selectedFaces.push(polygon);
      } else { // weird case of 2 edge vertex
         console.log("weird 2 edge vertex, to be done later");
      }
   }

   // compute moveLimit.
   ret.vertexLimit = Number.MAX_SAFE_INTEGER;       // magnitude
   ret.position = new Float32Array(ret.vertices.length*3);     // saved the original position
   ret.direction = new Float32Array(ret.vertices.length*3);    // also add direction.
   const position = new Vec3View(ret.position);
   const direction = new Vec3View(ret.direction);
   for (let vertex of ret.vertices) {
      vec3.copy(position, vertex);
      vec3.sub(direction, vertex.outEdge.destination(), position);
      if (slideHEdges.has(vertex.outEdge.pair)) {  // half length because we are sharing the expansion.
         ret.vertexLimit = Math.min(vec3.length(direction)*0.5, ret.vertexLimit);
      } else {
         ret.vertexLimit = Math.min(vec3.length(direction), ret.vertexLimit);  // the full length.
      }
      vec3.normalize(direction, direction);
      position.inc();
      direction.inc();
   }

   // results
   return ret;
};


/**
 * we need to lift then extrude each contour together. lift all contours then extrude all contours
 * has potential to introduce bugs in topology due to our implementation strategy.
 */
WingedTopology.prototype.liftAndExtrudeContours = function(edgeLoops) {
   // extrude face. connect(outer, inner) loop.
   let extrudeContours = [];
   for (let contour of edgeLoops) {
      this.liftContour(contour);          // lift edges from outerLoop to innerLoop.
      for (let edge of contour) {         // extrude edge
         let polygon = [];
         polygon.push( edge.inner.origin.index );
         polygon.push( edge.outer.origin.index );
         polygon.push( edge.outer.destination().index );
         polygon.push( edge.inner.destination().index );
         this.addPolygon( polygon,  edge.inner.face.material); // todo: inner material, but should be be outer.pair.face?
         const hEdge = this.findHalfEdge(edge.inner.origin, edge.outer.origin);
         extrudeContours.push( hEdge );
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
WingedTopology.findFaceGroup = function(selectedPolygon) {
   const processPolygon = new Set(selectedPolygon);
   let faceGroup = null;

   function processNeighbors(polygon) {
      processPolygon.delete(polygon);
      faceGroup.add(polygon);
      for (let vertex of polygon.eachVertex()) {   // polygon sharing the same vertex will be group together
         for (let outEdge of vertex.eachOutEdge()) {
            const face = outEdge.pair.face;
            if (processPolygon.has(face)) {
               // depth first search
               processNeighbors(face);
            }
          };
      };
   };

   let list = [];
   for (let polygon of processPolygon) {
      faceGroup = new Set;
      processNeighbors(polygon);
      list.push( faceGroup );
   }

   return list;
}



WingedTopology.findContours = function(selectedPolygon) {
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
         let current = edgePrev.inner.next;
         edgePrev.outer.next = current;
         let prev;
         do {
            current.origin = edge.outer.origin;
            prev = current.pair;
            current = prev.next;
         } while (current !== end);
         prev.next = edge.outer;
         edge.outer.origin.reorient(); // make sure smallest outEdge
      }
      edge.outer.face = edge.inner.face;
      this.addAffectedFace(edge.outer.face);
      if (edge.inner.face.halfEdge === edge.inner) {
         edge.outer.face.halfEdge = edge.outer;
      }

      edgePrev = edge;
   }

   // now we can safely release memory
   for (let edge of edgeLoop) {
      edge.restore = {origin: edge.inner.origin, pt: vec3.clone(edge.inner.origin), hEdge: edge.inner};
      // remove vertex, and edge.
      this._freeVertex(edge.inner.origin);
      this._freeEdge(edge.inner);
   }
};


WingedTopology.prototype._liftLoop = function(edgeLoop) {
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
            this.addAffectedVertex(inner.origin);
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
      this.addAffectedFace(edge1.inner.face);
   }
   return edgeLoop;
};
// lift edges from outerLoop to innerLoop. null the face between inner and outerface
WingedTopology.prototype.liftContour = function(edgeLoop) {
   if (edgeLoop.length === 0) {   // should not happened, but. Should we check ( < 4) too?
      return edgeLoop;
   }

   let firstVertex = this.addVertex(edgeLoop[0].outer.origin);
   let fromVertex = firstVertex; 
   for (let i = 0; i < edgeLoop.length; ++i) {
      let outerEdge = edgeLoop[i].outer;
      let toVertex;
      if (i == (edgeLoop.length-1)) {  // the last one loopback
         toVertex = firstVertex;
      } else {
         toVertex = this.addVertex(outerEdge.destination());
      }
      edgeLoop[i].inner = this.addEdge(fromVertex, toVertex);
      fromVertex = toVertex;
   }

   return this._liftLoop(edgeLoop);
};
WingedTopology.prototype.restoreContour = function(edgeLoop) {
   if (edgeLoop.length === 0) {   // should not happened, but. Should we check ( < 4) too?
      return edgeLoop;
   }

   // restore
   for (let edge of edgeLoop) { // restore vertex
      this.addVertex(edge.restore.pt, edge.restore.origin);
   }
   let prev;
   for (let i = 0; i < edgeLoop.length; ++i) { // restore edge
      const edge = edgeLoop[i];
      const edgeNext = edgeLoop[(i+1)%edgeLoop.length];
      const current = this._createEdge(edge.restore.origin, edgeNext.restore.origin, edge.restore.hEdge); // destination = next.origin
      edge.restore.origin.outEdge = current;
      if (prev) {
         prev.next = current;
         current.pair.next = prev.pair;
      }
      prev = current;
   }
   // connect last to first
   prev.next = edgeLoop[0].inner;
   edgeLoop[0].inner.pair.next = prev.pair;

   return this._liftLoop(edgeLoop);
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
      //this.addAffectedWEdge( currentOut.wingedEdge );
      currentOut = currentOut.pair.next;
   } while (currentOut !== outEdge);
   outEdge.face = inRight.face;
   if (outEdge.face) {
      outEdge.face.numberOfVertex++;
      //this.addAffectedFace(outEdge.face);
   }
   inEdge.face = outLeft.face;
   if (inEdge.face) {
      inEdge.face.numberOfVertex++;
      //this.addAffectedFace(inEdge.face);
   }
   this.addAffectedVertexFace(fromVertex);
}


WingedTopology.prototype._collapseEdge = function(halfEdge) {
   const next = halfEdge.next;
   const prev = halfEdge.prev();

   const pair = halfEdge.pair;
   const pairNext = pair.next;
   const pairPrev = pair.prev();

   const fromVertex = halfEdge.origin;
   const toVertex = pair.origin;

   this.addAffectedVertex(toVertex);
   this.addAffectedVertexFace(fromVertex);
   // halfedge -> vertex
   let current = pairNext;
   while (current !== halfEdge) {
      if (current.origin.outEdge === current) { // make sure current.origin.outEdge point to correct outEdge. 2019-08-17
         current.origin.outEdge = current.pair.next;
      }
      current.origin = toVertex;
      //this.addAffectedWEdge(current.wingedEdge);
      current = current.pair.next;
   }

   // reconnect 
   prev.next = next;
   pairPrev.next = pairNext;

   // adjust face
   let face = halfEdge.face;
   if (face) {
      if (face.halfEdge === halfEdge) {
         face.halfEdge = next;
      }
      face.numberOfVertex--;
      //this.addAffectedFace(face);
   }
   face = pair.face;
   if (face) {
      if (face.halfEdge === pair) {
         face.halfEdge = pairNext;
      }
      face.numberOfVertex--;
      //this.addAffectedFace(face);
   }
   // adjust vertex
   if (toVertex.outEdge === pair) {
      toVertex.outEdge = next;
   }

   // delete stuff
   this._freeEdge(halfEdge);
   const pt = [fromVertex[0], fromVertex[1], fromVertex[2]];
   this._freeVertex(fromVertex);

   // undo collapseEdge
   return {hEdge: halfEdge, pairNext: pairNext, prev: prev, vertex: fromVertex, pt: pt};
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
   let newPolygon = null;
   if (delPolygon !== null) {
      newPolygon = this._createPolygon(outEdge, 2, Material.default, delPolygon);   // todo: delPolygon should handle it.
   }
   halfEdge.face = newPolygon;   // unnecessary, already update
   outEdge.face = newPolygon;    // unnecessary, already update.

   // fix face.outEdge
   if (inEdge.face && inEdge.face.halfEdge === halfEdge) {
      inEdge.face.halfEdge = inEdge;
   }
};
WingedTopology.prototype._collapseLoop = function(halfEdge, collapsibleWings) {
   if (collapsibleWings && !collapsibleWings.has(halfEdge.wingedEdge)) {   // if not collapsible, move to next.
      halfEdge = halfEdge.next;  // need not check, if both are collapsible, either one are ok.
   }
   const next = halfEdge.next;
   const pair = halfEdge.pair;
   const pairPrev = pair.prev();
   const nextPair = next.pair;

   // is it a loop ?//assert ((next_halfedge_handle(h1) == h0) && (h1 != o0));

   // fix halfEdge.next connectionh
   next.next = pair.next;
   pairPrev.next = next;

   // fix halfEdge.face
   let polygon = pair.face;
   next.face = polygon;

   // fix vertex.outEdge;
   if (halfEdge.origin.outEdge === halfEdge) {
      halfEdge.origin.outEdge = nextPair;   // adjustOutgoing();
   }
   this.addAffectedVertex(halfEdge.origin);
   //this.addAffectedFace(halfEdge.face);
   if (pair.origin.outEdge === pair) {
      pair.origin.outEdge = next;      // adjustOutgoingEdge();
   }
   this.addAffectedVertex(pair.origin);
   this.addAffectedFace(pair.face);

   // fix face.halfEdge
   if (polygon && polygon.halfEdge === pair) {
      polygon.halfEdge = next;
   }

   // delete stuff
   const delPolygon = this._freePolygon(halfEdge.face);
   this._freeEdge(halfEdge);
   
   // restoreLoop
   return {next: next, hEdge: halfEdge, polygon: delPolygon};
};
WingedTopology.prototype._restoreDangling = function(undo) {
   // restore destination pt
   const destination = this.addVertex(undo.destination.pt , undo.destination.vertex);

   let outEdge;
   if (undo.origin) {   // restore origin 
      const origin = this.addVertex(undo.origin.pt, undo.origin.vertex);
      outEdge = this._createEdge(origin, destination, undo.hEdge);
      origin.outEdge = outEdge;
   } else { // restore to dangling point.
      outEdge = this._createEdge(undo.next.origin, destination, undo.hEdge);
      undo.prev.next = outEdge;
      outEdge.pair.next = undo.next;
   }
   destination.outEdge = outEdge.pair;
   outEdge.face = undo.face;
   outEdge.pair.face = undo.pairFace;
};
WingedTopology.prototype._collapseDangling = function(hEdge) {
   const undo = {};
   
   const pair = hEdge.pair;
   // this will be removed
   const destination = pair.origin;
   undo.destination = {vertex: destination, pt: [destination[0], destination[1], destination[2]]};
   this._freeVertex(pair.origin);
   undo.face = hEdge.face;    // both side should be same face?
   undo.pairFace = hEdge.pair.face;

   // check if origin is also due for removal.
   if (pair.next === hEdge) {
      undo.origin = {vertex: hEdge.origin, pt: [hEdge.origin[0], hEdge.origin[1], hEdge.origin[2]]};
      this._freeVertex(hEdge.origin);
   } else { // reattach polygon if it
      let face = hEdge.face;  // hEdge.face === pair.face. if not throw?
      if (face && (face.outEdge === hEdge || face.outEdge === pair)) {
         face.outEdge = pair.next;
      }
      // reattach next
      if (hEdge.origin.outEdge === hEdge) {
         hEdge.origin.outEdge = pair.next;
      }
      const prev = hEdge.prev();
      undo.prev = prev;
      prev.next = pair.next;
      undo.next = pair.next;  
   }

   // free edge at last
   undo.hEdge = hEdge;
   this._freeEdge(hEdge);

   return undo;
};


WingedTopology.prototype.collapseEdge = function(halfEdge, collapsibleWings) {
   let next = halfEdge.next;
   const pair = halfEdge.pair;
   let pairNext = pair.next;

   // remove edge
   const undo = this._collapseEdge(halfEdge);

   // remove loops(2 side polygon)
   if (next.next.next === next) {
      if (!next.pair.face && next.next.pair.face) {  // 2019-10-17, yep both side null, priority collapse. 2019-12-17: better selection
         next = next.next;
      }
      undo.leftLoop = this._collapseLoop(next.next, collapsibleWings);
      if (next.isLive()) { // 2019-10-20, add guard
         if (next.next === next.pair) {   // 2019-10-14, add cascade removal of edge, vertex and polygon.
            undo.leftDangling = this._collapseDangling(next);
         } else if (next.pair.next === next) {
            undo.leftDangling = this._collapseDangling(next.pair);
         }
      }
   }
   if (pairNext.wingedEdge.isLive() && (pairNext.next.next === pairNext)) {   // add wingedEdge.isLive() to guard (--) edges.
      if (pairNext.face && !pairNext.next.pair.face) {  // 2019-10-17, yep both side null, priority collapse. 2019-12-17: better selection.
         pairNext = pairNext.next;
      }
      undo.rightLoop = this._collapseLoop(pairNext, collapsibleWings);  // 2019-12-17: pairNext.next bad choice to collapse edge create ith extrude and inset
      if (pairNext.isLive()) {   // 2019-10-20, add guard
         if (pairNext.next === pairNext.pair) {   // 2019-10-14, add cascade removal of edge, vertex and polygon.
            undo.rightDangling = this._collapseDangling(pairNext);
         } else if (pairNext.pair.next === pairNext) {
            undo.rightDangling = this._collapseDangling(pairNext.pair);
         }
      }
   }
   return undo;
};

WingedTopology.prototype.restoreCollapseEdge = function(undo) {
   if (undo.rightLoop) {
      if (undo.rightDangling) {
         this._restoreDangling(undo.rightDangling);
      }
      this._restoreLoop(undo.rightLoop.next, undo.rightLoop.hEdge, undo.rightLoop.polygon);
   }
   if (undo.leftLoop) {
      if (undo.leftDangling) {
         this._restoreDangling(undo.leftDangling);
      }
      this._restoreLoop(undo.leftLoop.next, undo.leftLoop.hEdge, undo.leftLoop.polygon);
   }
   // undo collapseEdge
   this._liftEdge(undo.pairNext, undo.prev, this.addVertex(undo.pt, undo.vertex), undo.hEdge);
};


// fixed the halfEdge relation only.
WingedTopology.prototype._removeEdge = function(outEdge, inEdge) {
   const outPrev = outEdge.prev();
   const outNext = outEdge.next;
   const inPrev = inEdge.prev();
   const inNext = inEdge.next;
   
   outPrev.next = inNext;
   inPrev.next = outEdge.next;

   //correct vertex.outEdge if needed.
   if (outEdge.origin.outEdge === outEdge) {
      outEdge.origin.outEdge = outPrev.pair;
      this.addAffectedVertex(outEdge.origin);
   }
   if (inEdge.origin.outEdge === inEdge) {
      inEdge.origin.outEdge = inPrev.pair;
      this.addAffectedVertex(inEdge.origin);
   }
   return {outPrev: outPrev, outNext: outNext, outEdge: outEdge}; // changed to restore outEdge
}
// won't work with potentially "dangling" vertices and edges. Any doubt, call dissolveEdge
WingedTopology.prototype.removeEdge = function(outEdge) {
   let inEdge = outEdge.pair;
   if (inEdge.face === null && outEdge.face !== null) {   // switch side
      inEdge = outEdge;
      outEdge = inEdge;
      if (inEdge.face === null) {
         throw("error, both side of the edges are null faces");
      }
   }

   //fix the halfedge relations
   const remove = this._removeEdge(outEdge, inEdge);
  
   //deal with the faces
   remove.delFace = outEdge.face;    // the other side is boundary, after removal becomes boundary too.
   const face = inEdge.face;

   if (face !== null) {
      if (face.halfEdge === inEdge) { //correct the halfedge handle of face if needed
         face.halfEdge = remove.outPrev;
      }
   // make sure everye connect edge point to the same face.
      face.numberOfVertex = 0;
      for (let hEdge of face.hEdges()) {
         ++face.numberOfVertex;
         hEdge.face = face;
      }
      this.addAffectedFace(face);
   }

   if (remove.delFace !== null) {    // (yes, makeHole needs to be both-null. 2018-08-28)
      remove.delFace = this._freePolygon(remove.delFace);
   }
   this._freeEdge(outEdge);

   // return undo function
   return remove;
   //return face;   // return the remaining face handle
};
WingedTopology.prototype.restoreRemoveEdge = function(undo) {
   this.insertEdge(undo.outPrev, undo.outNext, undo.outEdge, undo.delFace);
};



WingedTopology.prototype.dissolveEdge = function(outEdge, collapsibleWings) {
   // check next only connect to outEdge? 
   const inEdge = outEdge.pair;
   if (outEdge.next.pair.next === inEdge) {
      return this.collapseEdge(inEdge, collapsibleWings);   // collapse inward
   } else if (inEdge.next.pair.next === outEdge) {
      return this.collapseEdge(outEdge, collapsibleWings);  // collapse outward
   } else {
      return this.removeEdge(outEdge);    // normal dissolve
   }
};

WingedTopology.prototype.restoreDissolveEdge = function(undo) {
   if (undo.outPrev) {
      this.restoreRemoveEdge(undo);
   } else {
      this.restoreCollapseEdge(undo);
   }
};



// selectedVertex. search the nearest edge on the same face.
// 2 ways to determine if vertex is edge. 1)prev, next edges are not parallel. 2) vertex has only 2 wingededges, and share the same faces.
// we decided to use the 2nd way temporary. After everything is debugged, switch to first method because it more robust.
WingedTopology.prototype.connectVertex = function(selectedVertex) {
   // first collect face from vertex.
   const selectedFace = new Map();
   for (let vertex of selectedVertex) {
      for (let edge of vertex.eachOutEdge()) {
         let val = 1;
         if (selectedFace.has(edge.face)) {
            val = selectedFace.get(edge.face) + 1;
         }
         selectedFace.set(edge.face, val);
      };
   }

   // corner. 
   const faceList = [];
   let edges = [];       // each face's edges
   // second (group vertex) that have the same faces as same edgeGroup.
   for (let [polygon, faceCount] of selectedFace) {
      if (faceCount > 1) {
         // at least 2 vertex selected.
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
      for (let [_i, edge] of edges.entries()) {
         if ( (edge.prevEdgeNumber !== edge.edgeNumber) || (prevEdgeNumber == edge.edgeNumber) ) {   // corner or more than 1 vertex on same Edge.
            specialCase = false;
            break;
         }
         prevEdgeNumber = edge.edgeNumber;
      }
      if (specialCase) {
         if (edges.length === 2) {  // connect 2 edges will have a 2 side polygon, so just connect one edge. last to first, first to last is the same edge.
            edgeList.push( this.insertEdge(edges[0].outEdge.prev(), edges[1].outEdge));
         } else {
            const edge0Prev = edges[0].outEdge.prev();
            for (let i = 0; i < edges.length; ++i) {
               let origin = edges[i];
               let destination;
               let edge;
               if ( (i+1) < edges.length) {
                  destination = edges[i+1];
                  edge = this.insertEdge(origin.outEdge.prev(), destination.outEdge);
               } else { // connect last to first.
                  edge = this.insertEdge(origin.outEdge.prev(), edge0Prev.next);
               }
               edgeList.push( edge );
            }
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
   return this._freePolygon(polygon);
};
/*function isCorner(outEdge) {
   const prev = outEdge.prev();
   const a = vec3.create();
   vec3.sub(a, outEdge.destination(), outEdge.origin); 
   const b = vec3.create();
   vec3.sub(b, prev.origin, prev.destination());
   const cosTheta = vec3.dot(a, b) / (vec3.len(a) + vec3.len(b));
   // none straight line is corner; cos 180 === -1. cos 0 === 1.
   return cosTheta > -0.992;   // ~< 175 degree. is a corner.
}*/

WingedTopology.prototype.dissolveVertex = function(vertex) {
   // now free the vertex.
   const pt = [0, 0, 0];
   vec3.copy(pt, vertex);
   if (vertex.isIsolated()) {
      this._freeVertex(vertex);
      return {pt: pt, vertex: vertex};
   } else {
      this.addAffectedVertexFace(vertex);
      let count = 0;
      const firstIn = vertex.outEdge.pair;
      let lastIn;
      // slide edge, move edge down like collapse edge, without the collapsing.
      let outEdge;    // outEdge for new Polygon
      for (let inEdge of vertex.eachInEdge()) {
         //inEdges.unshift( inEdge )
         this.addAffectedVertex(inEdge.origin);
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
      };
      // remove loop edge.
      const polygon = this._createPolygon(outEdge, count, Material.default);  // todo: find the correct material
      const undoCollapseLoop = [];
      let vertexOutEdge = vertex.outEdge;
      outEdge = vertex.outEdge;
      do {
         let inEdge = outEdge.pair;
         this.addAffectedVertex(inEdge.origin);
         outEdge = outEdge.next;
         if (inEdge.next.next === inEdge) {  // 2 edge loop, not polygon, now collapse it.
            if (inEdge.pair === vertexOutEdge) {
               vertexOutEdge = inEdge.next;  // 
            }
            undoCollapseLoop.unshift( this._collapseLoop(inEdge) );   // collapse inward
         } else {
            inEdge.pair.face = polygon;      // assigned polygon, 2020-02-01. _createPolygon don't assigned polygon
         }
      } while (outEdge !== vertexOutEdge);
      // free vertex
      this._freeVertex(vertex);
      return {polygon: polygon, pt: pt, vertex: vertex, undoCollapseLoop: undoCollapseLoop, lastIn: lastIn, firstIn: firstIn};
   }
};
WingedTopology.prototype.restoreDissolveVertex = function(undo) {
   if (undo.polygon) {
      // reallocated free vertex
      const vertex = this.addVertex(undo.pt, undo.vertex);
      // undo collapse loop
      for (let loop of undo.undoCollapseLoop) {
         this._restoreLoop(loop.next, loop.hEdge, loop.polygon);
      }
      // reattach edges to vertex
      let inEdge = undo.lastIn;
      let lastIn = undo.lastIn.next.pair;
      let prevIn = undo.firstIn;
      do {
         let outEdge = inEdge.pair;
         if (outEdge.origin.outEdge === outEdge) { // make sure find the new OutEdge if we are the OutEdge. 2019/08/16
            outEdge.origin.outEdge = inEdge.next;
         }
         this.addAffectedVertex(outEdge.origin);
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
      vertex.outEdge = undo.firstIn.pair;
      // free polygon
      this._freePolygon(undo.polygon);
      // selected vertex
      this.addAffectedVertexFace(vertex);
   } else { // isolated vertex
      this.addVertex(undo.pt, undo.vertex);
   }
   return undo.vertex;
};

//
// bridge the 2 faces. and 
//
WingedTopology.prototype.bridgeFace = function(targetFace, sourceFace) {
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
      sourceHEdges.unshift( hEdge );  // reverse direction.
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
         vec3.sub(temp, targetHEdges[j].origin, sourceHEdges[(i+j)%targetHEdges.length].origin);
         currentLen += vec3.length(temp);
      }
      if (currentLen < len) {
         len = currentLen;
         index = i;
      }
   }
   // rotate to desired location.
   sourceHEdges.unshift.apply( sourceHEdges, sourceHEdges.splice(index, sourceHEdges.length ) );
   // remove face, and bridge target[0] at the source index
   ret.target.face = this._freePolygon(targetFace);
   ret.source.face = this._freePolygon(sourceFace);
   let hEdgePrev = null;
   const hEdges = [];
   for (let i = 0; i < targetHEdges.length; ++i) {  // create new Edge, new Face.
      const hEdge = this.addEdge(sourceHEdges[i].origin, targetHEdges[i].origin);
      if (hEdgePrev) {  // added the face
         this._createPolygon(hEdgePrev, 4, Material.default)._assignFace();  // todo: hEdgePrev.pair.face.material?
      }
      hEdges.push( hEdge );
      hEdgePrev = hEdge;
   }
   this._createPolygon(hEdgePrev, 4, Material.default)._assignFace();  // todo: hEdgePrev.pair.face.material?
   ret.hEdges = hEdges;
   return ret;
}

WingedTopology.prototype.undoBridgeFace = function(bridge) {
   for (let hEdge of bridge.hEdges) {
      this.removePolygon(hEdge.face);  // free face first
   }
   for (let hEdge of bridge.hEdges) {
      this._removeEdge(hEdge, hEdge.pair); // remove edge later.
      this._freeEdge(hEdge);
   }
   // now, get the 2 face back
   this._createPolygon(bridge.target.hEdge, bridge.hEdges.length, Material.default, bridge.target.face)._assignFace();
   this._createPolygon(bridge.source.hEdge, bridge.hEdges.length, Material.default, bridge.source.face)._assignFace();
};

//
// insetFace.
//
WingedTopology.findInsetContours = function(polygonSet) {
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
   danglingOut.face = danglingOut.pair.face = hEdge.face;   // assigned face, but don't update number of vertex yet.
   this.addAffectedFace(danglingOut.face);
   return danglingOut;
};
//
// insert a dangling corner edge at hEdge.next position.
WingedTopology.prototype.liftCornerEdge = function(hEdge, percent = 0.2) {
   const pt = vec3.create();
   const vector = vec3.create();
   // lift destination corner vertex
   let next = hEdge.next;
   vec3.lerp(pt, next.origin, next.destination(), percent);
   vec3.sub(vector, hEdge.origin, hEdge.destination());
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


WingedTopology.prototype._slideToPrev = function(outEdge, prevPrev) {
   // fix up th pointer
   const prev = prevPrev.next;
   const inEdge = outEdge.pair;


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
   this.addAffectedFace( outEdge.face );
   this.addAffectedFace( inEdge.face );

   // for slideToNext
   return {inEdge: inEdge};
};
WingedTopology.prototype.slideToPrev = function(outEdge, prevPrev) {
   if (outEdge.face.numberOfVertex <= 3) {   // collapseLoop already.
      const result = {inEdge: outEdge, delFace: outEdge.face, inNext: outEdge.next, inPrev: outEdge.prev()};
      this.this.removeEdge(outEdge);
      return result;
   }

   if (!prevPrev) {
      prevPrev = outEdge.prev().prev();
   } else {
      // check(prevPrev.next.next === outEdge)
   }

   return this._slideToPrev(outEdge, prevPrev);
};


// slide down
WingedTopology.prototype._slideToNext = function(inEdge) {
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
   //this.addAffectedWEdge(outEdge.wingedEdge);

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
WingedTopology.prototype.slideToNext = function(inEdge) {
   if (inEdge.face.numberOfVertex <= 3) {   // collapseLoop if slide, just remove the edge, simpler
      const result = {inEdge: inEdge, delFace: inEdge.face, inNext: inEdge.next, inPrev: inEdge.prev()};
      this.removeEdge(inEdge);   // todo: removeEdge should return result, instead of closure.
      return result;
   }// else
   
   return this._slideToNext(inEdge);
};
WingedTopology.prototype.undoSlideToNext = function(result) {
   if (result.delFace) {   // yep, removeEdge, so now restore.
      this.insertEdge(result.inPrev, result.inNext, result.inEdge, result.delFace);
   } else {
      this.slideToPrev(result.outEdge, result.prevPrev);
   }
};


/**
 * reuse _slideToNext
 */
WingedTopology.prototype.spinWEdgeCounter = function(wEdge) {
   const leftUndo = this._slideToNext(wEdge.left);
   const rightUndo = this._slideToNext(wEdge.right);

   return {left: leftUndo, right: rightUndo};
};

/**
 * reuse _slideToPrev
 */
WingedTopology.prototype.spinWEdge = function(wEdge) {
   const leftUndo = this._slideToPrev(wEdge.left, wEdge.left.prev().prev());
   const rightUndo = this._slideToPrev(wEdge.right, wEdge.right.prev().prev());

   return {left: leftUndo, right: rightUndo};
}


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
      this.addAffectedFace(polygon);
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
      vertex[axis] = axisX2 - vertex[axis];        // == center[axis] - (vertex[axis]-center[ais])
      this.addAffectedVertexFace(vertex);      // optimiztion: addAllAffected() functions.
   }
};


WingedTopology.prototype.makeHole = function(polygon) {
   // turn polygon into hole, 
   let ret = {hEdge: polygon.halfEdge, face: {polygon: polygon}, dissolveEdges: []};
   let hEdges = [];
   for (let hEdge of polygon.hEdges()) {
      hEdges.push( hEdge );
      hEdge.face = null;
   }
   for (let hEdge of hEdges) {
      if (hEdge.wingedEdge.isLive()) {
         //hEdge.face = null;
         const pairEdge = hEdge.pair;
         if (pairEdge.face === null) { 
            ret.dissolveEdges.unshift( this.dissolveEdge(pairEdge) );   // in any doubt, use dissolveEdge. I am stupid
         }
      }
   }
   if (polygon.isLive()) { // dissolveEdge might free polygon first.
      ret.face = this._freePolygon(polygon);
   }
   return ret;
};

WingedTopology.prototype.undoHole = function(hole) {
   for (let dissolve of hole.dissolveEdges) {
      this.restoreDissolveEdge(dissolve);
   }
   if (!hole.face.polygon.isLive()) {
      const polygon = this._createPolygon(hole.hEdge, 4, hole.face.material, hole.face);
      polygon._assignFace();
      this.addAffectedFace(polygon);
      return polygon;
   } else {
      return hole.face.polygon;
   }
};



export {
   WingedEdge,
   HalfEdge,
   Attribute,
   Vertex,
   Polygon,
   MeshAllocator,
   WingedTopology,
}