/**
 * triangulate polygon -
 * 
 * triangulateNice === earCut 
 * triangulateFast === monotones cut.
*/
//"use strict";
import {Polygon} from './wings3d_wingededge.js';
const {vec3} = glMatrix;



function triangleNormal(normal, h1, h0, h2) {
   const v0 = [h1.origin[0]-h0.origin[0], h1.origin[1]-h0.origin[1], h1.origin[2]-h0.origin[2]];
   const v1 = [h2.origin[0]-h0.origin[0], h2.origin[1]-h0.origin[1], h2.origin[2]-h0.origin[2]];
   vec3.cross(normal, v1, v0);
}

function quadTriangulate(hEdges, isOdd) {
   if (isOdd) {
      hEdges[0].setEdgeTriangle(hEdges[3]);
      hEdges[1].setTriangle(hEdges[3]);
      hEdges[2].setEdgeTriangle(hEdges[1]);
      hEdges[3].setTriangle(hEdges[1]);
   } else {
      hEdges[0].setTriangle(hEdges[2]);
      hEdges[1].setEdgeTriangle(hEdges[0]);
      hEdges[2].setTriangle(hEdges[0]);
      hEdges[3].setEdgeTriangle(hEdges[2]);
   }
}

function triangulate(polygon) {
   const totalVertex = polygon.numberOfVertex;
   if (totalVertex < 5) {  
      let hEdges = [];
      for (let hEdge of polygon.hEdges()) {
         hEdges.push(hEdge);
      }
      if (totalVertex === 3) {
         hEdges[0].setEdgeTriangle(hEdges[2]);
         hEdges[1].setTriangle(hEdges[0]);
         hEdges[2].setEdgeTriangle(hEdges[1]);
         return 1; // success.
      } else if (totalVertex === 4) {  // split on concave vertex or where split triangles has similar size
         const area = [];
         const normal = [0, 0, 0];
         polygon.getNormal(normal);
         const n = [0, 0, 0];
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
         quadTriangulate(hEdges, (odd > even));
         return 1;
      } 
      // less than 3, bad triangles
      throw("bad triangle: only 2 edges");
      return 0;   // totally failed.
   }

   // now real triangulation
   return triangulateNaive(polygon);
};

/**
 * setup edge triangle, using simplest, but not always good form.
 * 
 * @param {Polygon} polygon 
 */
function triangulateNaive(polygon) {
   const triangles = [];

   const begin = polygon.halfEdge;
   let current = polygon.halfEdge.next;
   do {
      triangles.push(begin.index, current.index, current.next.index);
      current.setTriangle(begin);         // add 1 edge and 1 triangle
      current = current.next;
   } while (current.next !== begin);
   current.setEdgeTriangle(begin.next);   // add last edge but no triangle
   begin.setEdgeTriangle(current);        // add beginning edge but no triangle
   
   return triangles;
};






/**
 * return a list of triangle compose of 3 hEdges.
 * internally setup line drawing.
 * 
 * monotones, using sweep and prune. 
 * https://www.bowdoin.edu/~ltoma/teaching/cs3250-CompGeom/spring18/syllabus.html
 * has a clear explanation how monotones worked, and how to sweep the line.
 * the key insight is the "reflex/concave" vertex's diagonal cut off the monotones.
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