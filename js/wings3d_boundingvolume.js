/*   require glmatrix
//
// LooseOctree and BoundingSphere.
*/


import * as Util from './wings3d_util';



const BoundingSphere = function(center, radius, polygon) {
   this.center = center;
   this.radius = radius;
   this.radius2 = radius*radius;
   this.polygon = polygon;
};

BoundingSphere.prototype.isLive = function() {
   return (this.polygon.isVisible && this.polygon.isLive());
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


// loose octree for ease of implementation, and adequate performance. AABB tree, OBB tree can wait if needed.
// http://www.tulrich.com/geekstuff/partitioning.html by Thatcher Ulrich
class LooseOctree {  // this is really node
   constructor(bvh, bound, level) {
      this.bvh = bvh;
      this.level = level;
      this.node = [];
      if (bound) {
         this.bound = {center: vec3.clone(bound.center), halfSize: vec3.clone(bound.halfSize)};
      }
      //
   }

   getBound(bound) {
      vec3.copy(bound.center, this.bound.center);
      vec3.copy(bound.halfSize, this.bound.halfSize);
   }

   getExtent(extent, looseNess = 1.0) {
      for (let axis=0; axis < 3; ++axis) {
         const length = this.bound.halfSize[axis]*looseNess;   
         extent.min[axis] = this.bound.center[axis]-length;
         extent.max[axis] = this.bound.center[axis]+length;
      } 
   }

   getLooseExtent(extent) {
      this.getExtent(extent, LooseOctree.kLOOSENESS); // looseOctree's extent is 2x bigger.
   }

   static getOctant(sphere, bound) {
      let index = 0;
      const octant = [1, 2, 4];        // octant mapping
      for (let axis = 0; axis < 3; ++axis) {
         bound.halfSize[axis] /= 2;
         if (sphere.radius > bound.halfSize[axis]) {  // does not fit in the children's bound
            return -1;
         } else if (sphere.center[axis] < bound.center[axis]) {
            index += octant[axis];     // |= octant[axis] faster?
            bound.center[axis] -= bound.halfSize[axis];
         } else {
            bound.center[axis] += bound.halfSize[axis];
         }
      }
      return index;
   }

   // only expand when this.node.length > kTHRESHOLD. and this.leaf will double as this.node.
   insert(sphere, bound) {
      if (this.node) { // keep pushing.
         this.node.push(sphere);
         if (this.node.length >= LooseOctree.kTHRESHOLD) {  // now expand to children node if possible
            this.leaf = [null, null, null, null, null, null, null, null];  // now setup leaf octant
            let newBound = {center: vec3.create(), halfSize: vec3.create()};
            let ret;
            const node = this.node;
            this.node = undefined;
            for (let sphere of node) {  // redistribute to children.
               vec3.copy(newBound.center, bound.center);
               vec3.copy(newBound.halfSize, bound.halfSize);
               ret = this.insert(sphere, newBound);
            }
            return ret;
         }
      } else {// not leaf node.
         let index = LooseOctree.getOctant(sphere, bound);
         if (index >= 0) {  // descent to children
            let child = this.leaf[index];
            if (child === null) {
               child = new LooseOctree(this.bvh, bound, this.level+1);
               this.leaf[index] = child;
            }
            return child.insert(sphere, bound);  
         }
         // larger than child size, so insert here.
         this.leaf.push(sphere);
      }
      return this;
   }

   //
   // Revelles' algorithm, "An efficient parametric algorithm for octree traversal". <= todo
   * intersectRay(ray, extent) {   // act as generator
      if (this.node) {
         for (let sphere of this.node) {
            if (sphere.isIntersect(ray)) {
               yield sphere;
            }
         }
      } else {
         for (let i = 8; i < this.leaf.length; ++i) {
            const sphere = this.leaf[i];
            if (sphere.isIntersect(ray)) {
               yield sphere;
            }
         }
         // check children, this is the hard part
         for (let i = 0; i < 8; ++i) {
            const child = this.leaf[i];
            if (child) {
               child.getLooseExtent(extent);
               if (Util.intersectRayAABB(ray, extent)) {
                  yield* child.intersectRay(ray, extent);
               }
            }
         }
      }
   }

   *[Symbol.iterator]() {
      yield this;
      if (this.leaf) {
         for (let i = 0; i < 8; ++i) {
            const node = this.leaf[i];
            if (node) {
               yield* node;
            }
         }
      }
   }
}
LooseOctree.kTHRESHOLD = 16;    // read somewhere, 8-15 is a good number for octree node. expand to child only when node.length >= kTHRESHOLD
LooseOctree.kLOOSENESS = 1.5;




export {
   BoundingSphere,
   LooseOctree,
}