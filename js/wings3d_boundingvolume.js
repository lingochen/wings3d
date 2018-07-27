/*   require glmatrix
//
// LooseOctree and BoundingSphere.
*/


import * as Util from './wings3d_util';



const BoundingSphere = function(polygon, center, radius) {
   this.center = center;
   this.radius = radius;
   if (radius) {
      this.radius2 = radius*radius;
   }
   this.polygon = polygon;
   this.octree = null;
};

BoundingSphere.prototype.isLive = function() {
   return (this.polygon.isVisible && this.polygon.isLive());
};

BoundingSphere.prototype.isIntersect = function(ray) {
   return Util.intersectRaySphere(ray, this);
};

BoundingSphere.prototype.setSphere = function(sphere) {
   this.center = sphere.center;
   this.radius = sphere.radius;
   this.radius2 = sphere.radius*sphere.radius;
   if (this.octree) {
      this.octree._move(this);
   }
};

BoundingSphere.prototype.getBVHRoot = function() {
   return this.octree.bvh.bvh.root;
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
   return new BoundingSphere(polygon, sphere.center, sphere.radius);
}
BoundingSphere.allocate = function(polygon) {
   return new BoundingSphere(polygon);
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

   getHalfSize() {
      return this.bound.halfSize;
   }

   getBound(bound) {
      vec3.copy(bound.center, this.bound.center);
      vec3.copy(bound.halfSize, this.bound.halfSize);
   }

   getLooseBound(bound) {
      vec3.copy(bound.center, this.bound.center);
      vec3.scale(bound.halfSize, this.bound.halfSize, LooseOctree.kLOOSENESS);
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

   check(duplicateSet) {
      if (this.node) {
         for (let sphere of this.node) {
            if (duplicateSet.has(sphere)) {
               console.log("octree problems");
            } else {
               duplicateSet.add(sphere);
            }
         }
      } else {
         for (let i = 0; i < 8; ++i) {
            const octreeNode = this.leaf[i];
            if (octreeNode) {
               octreeNode.check(duplicateSet);
            }
         }
         for (let i = 8; i < this.leaf.length; ++i) {
            const sphere = this.leaf[i];
            if (duplicateSet.has(sphere)) {
               console.log("octree problems");
            } else {
               duplicateSet.add(sphere);
            }
         }
      }
   }

   free() {
      if (this.node) {
         for (let sphere of this.node) {
            sphere.octree = null;
         }
      } else {
         for (let i = 0; i < 8; ++i) {
            const octreeNode = this.leaf[i];
            if (octreeNode) {
               octreeNode.free();
            }
         }
         for (let i = 8; i < this.leaf.length; ++i) {
            const sphere = this.leaf[i];
            sphere.octree = null;
         }
      }
   }

   // only expand when this.node.length > kTHRESHOLD. and this.leaf will double as this.node.
   insert(sphere, bound) {
      if (this.node) { // keep pushing.
         this.node.push(sphere);
         sphere.octree = this;
         if (this.node.length >= LooseOctree.kTHRESHOLD) {  // now expand to children node if possible
            this.leaf = [null, null, null, null, null, null, null, null];  // now setup leaf octant
            let newBound = {center: vec3.create(), halfSize: vec3.create()};
            let ret;
            const node = this.node;
            delete this.node;
            for (let sphere of node) {  // redistribute to children or self.
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
         sphere.octree = this;
      }
      return this;
   }

   _move(sphere) {   // sphere size or center changed, check for moving to different node.
      if (!this.isInside(sphere)) {
         this._remove(sphere);
         this.bvh.moveSphere(sphere);
      }
   }

   _remove(sphere) {
      if (sphere.octree === this) {
         if (this.node) {
            this.node.splice(this.node.indexOf(sphere), 1);
         } else {
            this.leaf.splice(this.leaf.indexOf(sphere), 1);
         }
         sphere.octree = null;
      } else {
         console.log("LooseOctree _remove error");
      }
   }

   isInside(sphere) {
      for (let axis = 0; axis < 3; ++axis) {
         let length = this.bound.halfSize[axis];
         if ( (length < sphere.radius) || 
              (this.bound.center[axis]+length) < sphere.center[axis] ||
              (this.bound.center[axis]-length) > sphere.center[axis]) {
            return false;
         }
      }
      return true;
   }


   * intersectExtent(shape) {   // act as generator
      const extent = {min: vec3.create(), max: vec3.create()};
      this.getLooseExtent(extent);
      if (shape.intersectAAExtent(extent)) {
         yield* this._extentIntersect(shape, extent);
      }
   }
   //
   // Revelles' algorithm, "An efficient parametric algorithm for octree traversal". <= todo
   * _extentIntersect(shape, extent) {
      if (this.node) {
         for (let sphere of this.node) {
            if (shape.intersectSphere(sphere)) {
               yield sphere;
            }
         }
      } else {
         for (let i = 8; i < this.leaf.length; ++i) {
            const sphere = this.leaf[i];
            if (shape.intersectSphere(sphere)) {
               yield sphere;
            }
         }
         // check children, this is the hard part of Revelle's algorithm.
         for (let i = 0; i < 8; ++i) {
            const child = this.leaf[i];
            if (child) {
               child.getLooseExtent(extent);
               if (shape.intersectAAExtent(extent)) {
                  yield* child._extentIntersect(shape, extent);
               }
            }
         }
      }
   }

   // bound = {center, halfSize};
   * intersectBound(shape) {
      const bound = {center: vec3.create(), halfSize: vec3.create()};
      this.getLooseBound(bound);
      if (shape.intersectAABB(bound)) {
         yield* this._boundIntersect(shape, bound);
      }
   }
   * _boundIntersect(shape, bound) {
      if (this.node) {
         for (let sphere of this.node) {
            if (shape.intersectSphere(sphere)) {
               yield sphere;
            }
         }
      } else {
         for (let i = 8; i < this.leaf.length; ++i) {
            const sphere = this.leaf[i];
            if (shape.intersectSphere(sphere)) {
               yield sphere;
            }
         }
         // check children, this is the hard part of Revelle's algorithm.
         for (let i = 0; i < 8; ++i) {
            const child = this.leaf[i];
            if (child) {
               child.getLooseBound(bound);
               if (shape.intersectAABB(bound)) {
                  yield* child._boundIntersect(shape, bound);
               }
            }
         }
      }
   }
}
LooseOctree.kTHRESHOLD = 88;    // read somewhere, 8-15 is a good number for octree node. expand to child only when node.length >= kTHRESHOLD
LooseOctree.kLOOSENESS = 1.5;    // cannot change. because isInside depend on this property.



class Plane {
   constructor(normal, pt) {
      this.normal = vec3.clone(normal);
      vec3.normalize(this.normal, this.normal);    // make sure.
      this.pt = vec3.clone(pt);
      this.distance = vec3.dot(this.normal, this.pt); // dot(n, pt) = k form.
   }

   closestPoint(out, point) { // projection to plane
      Util.closestPointToPlane(out, point, this);
   }

   intersectAABB(box) {
      return Util.intersectPlaneAABB(this, box);
   }

   intersectSphere(sphere) {
      return Util.intersectPlaneSphere(this, sphere);
   }
}


class Ray {
   constructor(origin, dir) {
      this.origin = origin;
      this.direction = dir;
      this.invDir = vec3.fromValues(1/dir[0], 1/dir[1], 1/dir[2]);   //1/0 still work for our purpose.
   }

   intersectSphere(sphere) {
      return Util.intersectRaySphere(this, sphere);
   }

   intersectAAExtent(extent) {
      return Util.intersectRayAAExtent(this, extent);
   }
}


export {
   BoundingSphere,
   LooseOctree,
   Plane,
   Ray
}