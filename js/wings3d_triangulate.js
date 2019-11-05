//
// triangulate polygon - sweep monotone method.
//
// Modification: won't handle non-simple polygon. just use earcut to slice off.
//
//"use strict";
import {Polygon, Vertex, WingedEdge, HalfEdge} from './wings3d_wingededge.js';


/**
 * 
 * @param {Polygon} polygon - polygon object 
 */
function flattenPolygon(polygon) {
   const flatten = {uv:[], hEdges:[]};

   return flatten;
}


/**
 * return a list of triangle compose of 3 hEdges.
 * internally setup line drawing.
 * 
 * first we check if the polygon is triangle or quad. trivial case.
 * 
 * real triangulation. first flatten polygon, (dominant axis is not as good)
 * 
 * second produce sweep and prune structure. (if internal intersection then return a simple earcut version.)
 * 
 * third monotone the trapzoid.
 * 
 * @param {Polygon} polygon 
 */
function triangulate(polygon) {
   if (polygon.numberOfVertex < 5) {
      let hEdge = polygon.halfEdge;
      let hEdgeN2 = hEdge.next.next;
      const triangles = [hEdge.index, hEdge.next.index, hEdgeN2.index];
      if (polygon.numberOfVertex > 3) {   // return 2 triangle. 
         triangles.push(hEdgeN2.index, hEdgeN2.next.index, hEdge.index);   // should we rotate diagonal for a better triangle?
      }
      return triangles;
   }

   // the real triangulation, first flatten polygon.
   const flatten = flattenPolygon(polygon);

   // now find the monotone trapzoid

};


export {
   triangulate,
}