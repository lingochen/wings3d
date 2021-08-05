/**
 * triangulate polygon -
 * 
 * triangulateNice === earCut 
 * triangulateFast === monotones cut.
*/
//"use strict";
import {Polygon} from './wings3d_wingededge.js';
const {vec3} = glMatrix;



/*function triangleNormal(normal, h1, h0, h2) {
   const v0 = [h1.origin[0]-h0.origin[0], h1.origin[1]-h0.origin[1], h1.origin[2]-h0.origin[2]];
   const v1 = [h2.origin[0]-h0.origin[0], h2.origin[1]-h0.origin[1], h2.origin[2]-h0.origin[2]];
   vec3.cross(normal, v1, v0);
}*/

function quadTriangulate(hEdges, isOdd) {
   if (isOdd) {
      hEdges[0].setTriangleEdge(hEdges[3]);
      hEdges[1].setTriangle(hEdges[3]);
      hEdges[2].setTriangleEdge(hEdges[1]);
      hEdges[3].setTriangle(hEdges[1]);
   } else {
      hEdges[0].setTriangle(hEdges[2]);
      hEdges[1].setTriangleEdge(hEdges[0]);
      hEdges[2].setTriangle(hEdges[0]);
      hEdges[3].setTriangleEdge(hEdges[2]);
   }
}

function triangulate(polygon, dir) {
   const totalVertex = polygon.numberOfVertex;
   if (totalVertex < 5) {  
      let hEdges = [];
      for (let hEdge of polygon.hEdges()) {
         hEdges.push(hEdge);
      }
      if (totalVertex === 3) {
         hEdges[0].setTriangleEdge(hEdges[2]);
         hEdges[1].setTriangle(hEdges[0]);
         hEdges[2].setTriangleEdge(hEdges[1]);
         return 1; // success.
      } else if (totalVertex === 4) {  // split on concave vertex or where split triangles has similar size
         const normal = [0, 0, 0];
         polygon.getNormal(normal);
         const n = [0, 0, 0];
         let v0 = vec3.create(), v1 = vec3.create();
         vec3.sub(v0, hEdges[3].destination(), hEdges[3].origin);
         for (let i = 0; i < 4; ++i) {
            vec3.sub(v1, hEdges[i].destination(), hEdges[i].origin);
            vec3.cross(n, v0, v1);
            if (vec3.dot(normal, n) < 0) { // concave, 
               quadTriangulate(hEdges, i % 2);
               return 1;
            }
            let t = v0;
            v0 = v1;
            v1 = t;
         }
         /*
         const area = [];
         let s = 3;  // 4-1
         for (let i = 0; i < 4; ++i) {
            triangleNormal(n, hEdges[s], hEdges[i], hEdges[(i+1) % 4]);
            if (vec3.dot(normal, n) < 0) {   // concave, 
               quadTriangulate(hEdges, i % 2);
               return 1;
            }
            s = i;
            area.push(vec3.len(n));
         }
         // now see which way the split triangle is more similar
         let odd = 1;
         if (area[0] < area[2]) {
            odd = area[0] / area[2];
         } else if (area[0] > area[2]) {  // avoid divide by 0
            odd = area[2] / area[0];
         }
         let even = 1;
         if (area[1] < area[3]) {
            even = area[1] / area[3];
         } else if (even[1] > even[3]) {
            even = area[3] / area[1];
         }
         quadTriangulate(hEdges, (odd > even)); */

         vec3.sub(v0, hEdges[2].origin, hEdges[0].origin);
         vec3.sub(v1, hEdges[3].origin, hEdges[1].origin);
         quadTriangulate(hEdges, vec3.len(v0) > vec3.len(v1));
         return 1;
      } 
      // less than 3, bad triangles
      throw("bad triangle: only 2 edges");
      return 0;   // totally failed.
   }

   // earCut triangulate
   if (!triangulateNice(polygon, getSub2D(dir))) {
      return triangulateNaive(polygon);   // just tri-fan
   }
   return 1;
};

/**
 * setup edge triangle, using simplest, but not always good form.
 * 
 * @param {Polygon} polygon 
 */
function triangulateNaive(polygon) {
   const begin = polygon.halfEdge;
   let current = polygon.halfEdge.next;
   do {
      current.setTriangle(begin);         // add 1 edge and 1 triangle
      current = current.next;
   } while (current.next !== begin);
   current.setTriangleEdge(begin.next);   // add last edge but no triangle
   begin.setTriangleEdge(current);        // add beginning edge but no triangle
   
   return -1;
};


function getSub2D(dir) {
   // compute dominant axis, 
   let nX = Math.abs(dir[0]);
   let nY = Math.abs(dir[1]);
   let nZ = Math.abs(dir[2]);
   let flipped = dir[2];
   let iX = 0, iY = 1;     // project to xy
   if (nX > nY) { 
      if (nX > nZ) {       // project to yz
         iX = 1; 
         iY = 2;
         flipped = dir[0];         
      }
   } else if (nY > nZ) {   // project to zx
      iX = 2; 
      iY = 0;
      flipped = dir[1]; 
   }
   if (flipped < 0.0) { // swapped
      [iX, iY] = [iY, iX];
   }
   return (v, v0, v1)=> {
      v[0] = v0[iX] - v1[iX];
      v[1] = v0[iY] - v1[iY];
      v[2] = 0;
   }
}


/**
 * triangulateNice() - an earcut implementation.
 * implement "Gang Mei, John C.Tipper and Nengxiong Xu"' high quality earclipping triangulation
 * (David Eberly said triangluation only needs to check concave vertices, an optimization).
 * 
 */
function triangulateNice(polygon, sub) {
   function hasReflexInside(ear) {
      if (concave.size) {
      /**
       * https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle
       * optimize halfPlane checking. similar to john w. ratcliff
      */
         let v2;
         const s = vec3.create();
         for (let reflex of concave) {
            // check if reflex is inside ear
            sub(s, reflex.hEdge.origin, ear.hEdge.origin);
            let z = ear.prev.v[0]*s[1] - ear.prev.v[1]*s[0];
            if (z > 0) {
               z = s[0]*ear.v[1] - s[1]*ear.v[0];
               if (z > 0) {
                  if (!v2) {
                     v2 = vec3.create();
                     sub(v2, ear.prev.hEdge.origin, ear.next.hEdge.origin);
                  }
                  sub(s, reflex.hEdge.origin, ear.next.hEdge.origin);
                  z = s[0]*v2[1] - s[1]*v2[0];
                  if (z > 0) {   // yes, inside
                     reflex.intersect.push(ear);
                     return true;
                  }
               }
            }
         }
      }
      return false;
   }
   function removeFromConcave(reflex) {
      concave.delete(reflex);
      queue.push(...reflex.intersect);
      reflex.intersect = null;
   }
   function setTriangle(ear) {
      if (ear.hEdge.next === ear.next.hEdge) {
         ear.hEdge.setTriangle(ear.prev.hEdge);
      } else { // internal triangle
         ear.hEdge.setTriangleInternal(ear.next.hEdge, ear.prev.hEdge);
      }
   }
   function computeAngle(v0, v1) {
      return Math.atan2(v0[0]*v1[1]-v1[0]*v0[1], vec3.dot(v0, v1)); // -Z is concave.
   }

   const queue = [];
   const concave = new Set;
   // compute 
   let iMinus = polygon.numberOfVertex - 1;
   let i = 0;
   for (let hEdge of polygon.hEdges()) {
      let v1 = vec3.create();
      sub(v1, hEdge.destination(), hEdge.origin);    
      let ear =  {hEdge: hEdge, prev: iMinus, next: (i+1)%polygon.numberOfVertex, v: v1};
      queue.push( ear );
      iMinus = i;
      i++;
   }
   // calculation angle in dominant axis
   for (let i = 0; i < polygon.numberOfVertex; ++i) {
      let current = queue[i];
      current.prev = queue[current.prev];
      current.next = queue[current.next];
      let rad = computeAngle(current.prev.v, current.v);
      current.rad = rad;
      if (rad < 0) {
         current.intersect = [];
         concave.add( current );
      }
   }
   // cut off ear by most acute angle.
   let lastChanceCount = queue.length;
   do {
      do {
         //s ort concave, convex vertex order by degree, (check intersection?)
         queue.sort((ear0, ear1)=>{return (ear0.rad - ear1.rad)});
         let ear = queue.pop();
         if (!hasReflexInside(ear)) { // remove ear, or push into concave's intersect
            setTriangle(ear);
            // reconnect next to prev
            let prev = ear.prev;
            let next = ear.next;
            ear.next.prev = prev;
            ear.prev.next = next;
            sub(prev.v, next.hEdge.origin, prev.hEdge.origin);
            let rad = computeAngle(prev.prev.v, prev.v);
            if (prev.rad < 0 && rad >= 0) { // remove from trouble.
               removeFromConcave(prev);
            }
            prev.rad = rad;
            rad = computeAngle(prev.v, next.v);
            if (next.rad < 0 && rad >= 0) {
               removeFromConcave(next);
            }
            next.rad = rad;
         }
      } while (queue.length > 3);
      // check concave is empty?
      for (let ear of concave) {
         queue.push(...ear.intersect);
         ear.intersect = [];
      }
      if (lastChanceCount === queue.length) { // check if we actually make any progress
         console.log("TriangulateNice impcomplete");
         return 0;   // no progress.
      }
      lastChanceCount = queue.length;
   } while (queue.length > 3);
   
   // cleanup
   setTriangle(queue[2]);
   let ear = queue[0];
   ear.hEdge.setTriangleEdge(ear.prev.hEdge);
   ear = queue[1];
   ear.hEdge.setTriangleEdge(ear.prev.hEdge);

   return 1;
}



/**
 * FixeMe: only implement if there is performance problem with earcut. earcut works better with bad polygons.
 * triangulationFast() - monotones, using sweep and prune. 
 * https://www.bowdoin.edu/~ltoma/teaching/cs3250-CompGeom/spring18/syllabus.html
 * has a clear explanation how monotones worked, and how to sweep the line.
 * the key insight is the "reflex/concave" vertex's diagonal cut off the monotones.
 * use ""
 * 
 * first we check if the polygon is triangle or quad. trivial case.
 * 
 * real triangulation. first flatten polygon, (dominant axis is good enough)
 * 
 * second produce sweep and prune structure. (if internal intersection then return a simple fan version?)
 * 
 * sweep and do monotone triangulation simultaneously
 * 
 * @param {Polygon} polygon 
 */
function triangulateFast(polygon) {
   // find the dominant axis

   // build the "sweep and prune" list


   // sweep start

};



export {
   triangulate,
   triangulateNaive,
}