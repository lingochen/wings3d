/*
   require glmatrix
*/
"use strict";


var BoundingSphere = function(center, radius, polygon) {
   this.center = center;
   this.radius = radius;
   this.radius2 = radius*radius;
   this.polygon = polygon;
};

BoundingSphere.prototype.isIntersect = function(ray) {
	//  Fast Ray Sphere Intersection - eric haine, realtimerendering, similar to graphic gem's Jeff Hultquist
	var l = vec3.create();
   vec3.sub(l, this.center, ray.origin);
	var l2 = vec3.dot(l, l);
	var projection = vec3.dot(l, ray.direction);
   if ((projection < 0.0) && (l2 > this.radius2)) { // sphere is totally behind the camera, not just sphere's origin
      return false;
   }
   if ((l2 - (projection*projection)) > this.radius2) {   // discriminant < 0.0f, no sqrt, no intersection.
      return false;
   }

   // don't care about true intersection of the 2, just there is a intersection.
   return true;
};

// simple minded bounding sphere builder.
BoundingSphere.create = function(polygon) {
   // get all the polygon's vertex. compute barycentric.
   var center = vec3.create();
   polygon.eachVertex( function(vertex) {
      vec3.add(center, center, vertex.vertex);
   });
   vec3.scale(center, center, 1.0/polygon.numberOfVertex);
   // get the furthest distance. that the radius.
   var radius = 0.0;
   polygon.eachVertex( function(vertex) {
      var distance = vec3.distance(center, vertex.vertex);
      if (distance > radius) {
         radius = distance;
      }
   });
   return new BoundingSphere(center, radius, polygon);
}