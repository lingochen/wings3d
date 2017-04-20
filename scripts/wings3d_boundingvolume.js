/*
   require glmatrix
*/
"use strict";


var BoundingSphere = function(center, radius, polygon) {
   this.center = center;
   this.radius = radius;
   this.radius2 = radius*radius;
   this.indexStart = -1;
   this.indexEnd = -1;
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

BoundingSphere.prototype.setSphere = function(sphere) {
   this.center = sphere.center;
   this.radius = sphere.radius;
   this.radius2 = sphere.radius*sphere.radius;
};

BoundingSphere.computeSphere = function(polygon, center) {  // vec3
   // get all the polygon's vertex. compute barycentric.
   center.fill(0.0);
   var ret = {center: center, radius: 0.0};
   polygon.eachVertex( function(vertex) {
      vec3.add(ret.center, ret.center, vertex.vertex);
   });
   vec3.scale(ret.center, ret.center, 1.0/polygon.numberOfVertex);
   // get the furthest distance. that the radius.
   polygon.eachVertex( function(vertex) {
      var distance = vec3.distance(ret.center, vertex.vertex);
      if (distance > ret.radius) {
         ret.radius = distance;
      }
   });
   return ret;
};

// simple minded bounding sphere builder.
BoundingSphere.create = function(polygon, center) {
   var sphere = BoundingSphere.computeSphere(polygon, center);
   return new BoundingSphere(sphere.center, sphere.radius, polygon);
}