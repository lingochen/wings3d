//
// triangulate polygon - our own modified ear-cutting method.
//
// the algorithm worked most of time without checking diagonal. good for our usage, previewPolyogn, not suitable for real triangulation.
// first cut off concave edge, keep cutting until not concave.
// when all the concave edges were processed, the remaining polygon is convex polygon.
//
//"use strict";
import {Polygon, Vertex, WingedEdge, HalfEdge} from './wings3d_wingededge';

// helper class for triangulate
const InternalHEdge = function(vertex, next) {
   this.origin = vertex;
   this.next = next;
};

InternalHEdge.prototype.destination = function() {
   return this.next.origin;
}

//
// check if v1 vertex lies on concave edges.
//
let edge0 = vec3.create();
let edge1 = vec3.create();
let crossNorm = vec3.create();
function isConcave(v0, v1, v2) {
// angle = pi - atan2(v[i] x v[i+1].magnitude, v[i] * v[i+1]);
   vec3.sub(edge0, v0.vertex, v1.vertex);
   vec3.sub(edge1, v2.vertex, v1.vertex);
   vec3.cross(crossNorm, edge0, edge1);
   let angle = Math.atan2(vec3.length(crossNorm), vec3.dot(edge0, edge1));
   return (angle <= 0);
};


function triangulatePreview(polygon) {
   let concave = 0;    // accumulate incomplete processing.
   let convex = [];
   let triangles = [];

   let end = polygon.halfEdge;
   let hEdge = polygon.halfEdge;
   let current;
   do {  // find the first concave.
      if (lastHEdge) {
         if (lastHEdge.origin, current.origin, current.destination()) {
            convex.push(lastHEdge);
            concave++;
            break;
         }
      } else {
         lastHEdge = current;
      }
      current = current.next;
   } while (current !== end);
   // now process concave.
   if (current !== end) {
      end = current;
      lastHEdge = current;
      current = current.next;
      do {
         if (isConcave(lastHEdge.origin,current.origin, current.destination())) {   // push it onto concave, and let later edge connected it
            convex.push( current );
            concave++;
         } else { // connect back to concave if any.
            if (concave > 0) {
               do { // keep slicing off concave if convex
                  let connect = new InternalHEdge(lastHEdge.origin, current.next); // triangle is lastHedge->hEdge->connect
                  triangles.push(lastHEdge.origin, current.origin, curret.destination());
                  convex.pop();  // popout lastHEdge.
                  lastHEdge = convex[convex.length-1];
                  current = connect;
               } while (!isConcave(lastHEdge.origin, connect.origin, connect.destination()) && (--concave > 0));
               // cleanup
               if (concave == 0) {
                  convex.push( current );
               }
            } else {
               convex.push( current );
            }
         }
         lastHEdge = current;
         current = current.next;
      } while (current !== end);
   }
   // only convex polygon left. process it.
   if (convex.length >= 3) {
      lastHEdge = convex[0];
      const end = convex.length -1;
      lastHEdge.triPt = convex[2].origin;
      for (let i = 1; end > i; ++i) { // add triangle
         const current = convex[i];
         triangles.push(lastHEdge.origin, current.origin, current.destination());
         current.triPt = lastHEdge.origin;
      }
   } else { // something wrong
      console.log("something wrong in triangulatePreview");
   }


   
   // return the  triangle list.
   return triangles;
};


export {
   triangulatePreview
}