/**
 * utility for 3d geometry computation.
 * 
 */
//import vec3 from '../vendor/gl-matrix-min.js';
const {vec3, vec4, mat4} = glMatrix;

const kEPSILON = 0.000001;

// Möller–Trumbore ray-triangle intersection algorithm
// should I use float64array? 
function intersectTriangle(ray, triangle) {
   var edge1 = vec3.create(), edge2 = vec3.create();
   /* find vectors for two edges sharing vert0 */
   vec3.sub(edge1, triangle[1], triangle[0]);
   vec3.sub(edge2, triangle[2], triangle[0]);

   /* begin calculating determinant - also used to calculate U parameter */
   var pvec = vec3.create();
   vec3.cross(pvec, ray.direction, edge2);

   /* if determinant is near zero, ray lies in plane of triangle */
   var det = vec3.dot(edge1, pvec);

   if (det < kEPSILON) { // cull backface, and nearly parallel ray
      return 0.0;
   }
   //if (det > -kEPSILON && det < kEPSILON), nearly parallel
   //  return 0;

   var inv_det = 1.0 / det;

   /* calculate distance from vert0 to ray origin */
   var tvec = vec3.create();
   vec3.sub(tvec, ray.origin, triangle[0]);

   /* calculate U parameter and test bounds */
   var u = vec3.dot(tvec, pvec) * inv_det;
   if (u < 0.0 || u > 1.0) {
     return 0.0;
   }

   /* prepare to test V parameter */
   var qvec = vec3.create();
   vec3.cross(qvec, tvec, edge1);

   /* calculate V parameter and test bounds */
   var v = vec3.dot(ray.direction, qvec) * inv_det;
   if (v < 0.0 || u + v > 1.0) {
     return 0.0;
   }

   /* calculate t, ray intersects triangle */
   var t = vec3.dot(edge2, qvec) * inv_det;
   return t;
};

// http://psgraphics.blogspot.com/2016/02/new-simple-ray-box-test-from-andrew.html
function intersectRayAAExtent(ray, aabb) {
   let tmin = Number.NEGATIVE_INFINITY;
   let tmax = Number.POSITIVE_INFINITY;
   for (let axis = 0; axis < 3; ++axis) {
      //const invD = 1.0 / ray.direction[axis];    // expect to be precalculate.
      let t0 = (aabb.min[axis] - ray.origin[axis]) * ray.invDir[axis];
      let t1 = (aabb.max[axis] - ray.origin[axis]) * ray.invDir[axis];
      if (ray.invDir[axis] < 0.0) { // swap
         let temp = t0; t0 = t1; t1 = temp;
      }
      tmin = t0 > tmin ? t0 : tmin;
      tmax = t1 < tmax ? t1 : tmax;
      if (tmax <= tmin) {
         return false;
      }
   }
   return (tmax > 0);
};

const intersectRaySphere = (function() {
	//  Fast Ray Sphere Intersection - eric haine, realtimerendering, similar to graphic gem's Jeff Hultquist
   const l = vec3.create();
   return function(ray, sphere) {
      vec3.sub(l, sphere.center, ray.origin);
	   const l2 = vec3.dot(l, l);
	   const projection = vec3.dot(l, ray.direction);
      if ((projection < 0.0) && (l2 > sphere.radius2)) { // sphere is totally behind the camera, not just sphere's origin
         return false;
      }
      if ((l2 - (projection*projection)) > sphere.radius2) {   // discriminant < 0.0f, no sqrt, no intersection.
         return false;
      }

      // don't care about true intersection of the 2, just there is a intersection.
      return true;
   };
})();


const intersectPlaneSphere = (function() {
   const pt = vec3.create();
   return function(plane, sphere) {
      closestPointToPlane(pt, sphere.center, plane);
      return vec3.squaredDistance(pt, sphere.center) < sphere.radius2;
   }
})();

// gamephysics cookbook.
function intersectPlaneAABB(plane, box) {
   const pLen = box.halfSize[0] * Math.abs(plane.normal[0]) + box.halfSize[1] * Math.abs(plane.normal[1]) + box.halfSize[2] * Math.abs(plane.normal[2]);
   const distance = vec3.dot(plane.normal, box.center) - plane.d;
   return Math.abs(distance) <= pLen;
};

// return value:
// -2 for no intersection
// -1 for co planar on the plane
// 0-1 for intersection t.
// 0.5 when no (out) intersection pt provided.
// algorithm
// paul burke explain the intersection code pretty clearly.
// same side check and coplane check are from moller.
function intersectPlaneHEdge(out, plane, hEdge) {
   const pt0 = hEdge.origin;
   const pt1 = hEdge.destination();

   let d0 = vec3.dot(plane.normal, pt0) - plane.d; 
   let d1 = vec3.dot(plane.normal, pt1) - plane.d;
   // coplanarity check
   if (Math.abs(d0) < kEPSILON) { d0=0.0; }
   if (Math.abs(d1) < kEPSILON) { d1=0.0; }
   
   let t;
   if ((d0*d1) > 0) {  // check if on the same side
      return -2;
   } else if (d0 == 0.0) {
      if (d1 == 0.0) {  // co planar
         return -1;
      }
      t = 0;            // intersect at begin
   } else if (d1 == 0.0) {
      t = 1;            // intersect at end
   }

   // compute intersection pt (out).
   if (out) {
      if (t === undefined) {
         // t = (plane.normal dot (plane.pt - pt0)) / (plane.normal dot (pt1-pt0))
         vec3.sub(out, plane.pt, pt0);
         const tDer = vec3.dot(plane.normal, out);
         vec3.sub(out, pt1, pt0);
         t = tDer / vec3.dot(plane.normal, out);
      }
      // out = pt0 + t(pt1-pt0)
      vec3.scaleAndAdd(out, pt0, out, t);
   }

   return (t !== undefined)? t : 0.5;  // 0.5 for intersection not 0 or 1.
};

/* from
 * @article{MollerHughes99,
  author = "Tomas Möller and John F. Hughes",
  title = "Efficiently Building a Matrix to Rotate One Vector to Another",
  journal = "journal of graphics tools",
  volume = "4",
  number = "4",
  pages = "1-4",
  year = "1999",
}
http://jgt.akpeters.com/papers/MollerHughes99/code.html
*/
function rotationFromToVec3(mtx, from, to) {

  let e = vec3.dot(from, to);
  if (Math.abs(e) > (1.0-kEPSILON) ) { // "from" and "to"-vector almost parallel
      // find closest axis
      const x = vec3.fromValues(Math.abs(from[0]), Math.abs(from[1]), Math.abs(from[2]));   // vector most nearly orthogonal to "from"
      if (x[0] < x[1]) {
         if( x[0] < x[2] ) {
            x[0] = 1.0; x[1] = x[2] = 0.0;
         } else {
            x[2] = 1.0; x[0] = x[1] = 0.0;
         }
      } else {
         if( x[1] < x[2] ) {
            x[1] = 1.0; x[0] = x[2] = 0.0;
         } else {
            x[2] = 1.0; x[0] = x[1] = 0.0;
         }
      }

      // compute the matrix
      let ut = vec3.fromValues(x[0] - from[0], x[1] - from[1], x[2] - from[2]);  // sub(v, x, from);
      let vt = vec3.fromValues(x[0] - to[0],   x[1] - to[1],   x[2] - to[2]);

      let c1 = 2.0 / vec3.dot(ut, ut);       // coefficients
      let c2 = 2.0 / vec3.dot(vt, vt);
      let c3 = c1 * c2  * vec3.dot(ut, vt);
      for (let i = 0; i < 3; i++) {
         let k = i*4;      // stride.
         for (let j = 0; j < 3; j++) {
            mtx[k+j] =  -c1 * ut[i] * ut[j] - c2 * vt[i] * vt[j] + c3 * vt[i] * ut[j];
         }
         mtx[k+i] += 1.0;
      }
   } else  {// the most common case, unless "from"="to", or "from"=-"to" 
      let v = vec3.create();
      vec3.cross(v, from, to);
      // ...otherwise use this hand optimized version (9 mults less)
      //let h = 1.0 / (1.0 + e);      // optimization by Gottfried Chen
      let h = (1.0 -e)/ vec3.dot(v, v);
      let hvx = h * v[0];
      let hvz = h * v[2];
      let hvxy = hvx * v[1];
      let hvxz = hvx * v[2];
      let hvyz = hvz * v[1];
      mtx[0] = e + hvx * v[0];
      mtx[1] = hvxy + v[2];
      mtx[2] = hvxz - v[1];

      mtx[4] = hvxy - v[2];
      mtx[5] = e + h * v[1] * v[1];
      mtx[6] = hvyz + v[0];

      mtx[8] = hvxz + v[1];
      mtx[9] = hvyz - v[0];
      mtx[10] = e + hvz * v[2];
   }

   return mtx;
};

/*
References
https://www.opengl.org/discussion_boards/showthread.php/147784-Mirror-Matrices
https://www.opengl.org/discussion_boards/showthread.php/169605-reflection-matrix-how-to-derive
"3D Math Primer for Graphics andGame Development" by Fletcher Dunn, Ian Parberry
*/
function reflectionMat4(mat, norm, pt) {
   const d = -vec3.dot(norm, pt);

	mat[0] = -2 * norm[0] * norm[0] + 1;
	mat[1] = -2 * norm[1] * norm[0];
	mat[2] = -2 * norm[2] * norm[0];
	mat[3] = 0;
 
	mat[4] = -2 * norm[0] * norm[1];
	mat[5] = -2 * norm[1] * norm[1] + 1;
	mat[6] = -2 * norm[2] * norm[1];
	mat[7] = 0;
 
	mat[8] =	-2 * norm[0] * norm[2];
	mat[9] = -2 * norm[1] * norm[2];
	mat[10] = -2 * norm[2] * norm[2] + 1;
	mat[11] = 0;
 
	mat[12] = -2 * norm[0] * d;
	mat[13] = -2 * norm[1] * d;
	mat[14] = -2 * norm[2] * d;
   mat[15] = 1;
   return mat;
};


// angle is between (-PI, PI). equivalent to (-180, 180) degree.
function computeAngle(crossNorm, v0, v1, v2) {
   let edge0 = vec3.create(), edge1 = vec3.create();
   // angle = pi - atan2(v[i] x v[i+1].magnitude, v[i] * v[i+1]);
   vec3.sub(edge0, v0, v1);
   vec3.sub(edge1, v2, v1);
   vec3.cross(crossNorm, edge0, edge1);
   let rad = Math.atan2(vec3.length(crossNorm), vec3.dot(edge0, edge1));
   vec3.normalize(crossNorm, crossNorm);
   return rad;
}

function getAxisAngle(axis, vFrom, vTo) {
   vec3.cross(axis, vFrom, vTo);
   let rad = Math.atan2(vec3.length(axis), vec3.dot(vFrom, vTo));
   vec3.normalize(axis, axis);
   return rad;
   //return 2*Math.acos( Math.abs( vec3.dot(vFrom, vTo), -1, 1 ) );
}


// the input (left, right) is on the same Vertex.
function computeEdgeNormal(normal, leftHEdge, rightHEdge) {
   //let normal = vec3.create();
   let radian = computeAngle(normal, leftHEdge.destination(), leftHEdge.origin, rightHEdge.destination());
   radian = Math.abs(radian);
   if ((radian < kEPSILON) || (radian > (Math.PI-kEPSILON))) {   // nearly parallel, now get face
      vec3.set(normal, 0, 0, 0);
      if (leftHEdge.face) {
         vec3.add(normal, normal, leftHEdge.face.normal);
      }
      if (rightHEdge.pair.face) {
         vec3.add(normal, normal, rightHEdge.pair.face);
      }
   }
   // compute normal
   vec3.normalize(normal, normal);
};

function projectVec3(vertices, planeNormal, planeOrigin) {
   const pt = vec3.create();

   for (let vertex of vertices) {
      vec3.sub(pt, vertex, planeOrigin);
      let d = vec3.dot(pt, planeNormal);
      vec3.scale(pt, planeNormal, d);
      vec3.sub(vertex, vertex, pt);
   }
};

function closestPointToPlane(out, point, plane) { // projection to plane
   const distance = vec3.dot(plane.normal, point) - plane.d;
   vec3.scaleAndAdd(out, point, plane.normal, -distance);
};


/**
 * don't work, we probabaly have to return the full transform.
 */
function computeAxisScale(scaling, axis) {
   //const translate = [0, 0, 0];
   const scaleV = [scaling, 1, 1];
   vec3.normalize(axis, axis);

   const newAxis = [1, 0, 0]
   let theta = Math.acos(vec3.dot(axis, newAxis));
   vec3.cross(newAxis, axis, newAxis);
   vec3.normalize(newAxis, newAxis);
   if (theta > (Math.PI / 2)) {
      vec3.scale(newAxis, newAxis, -1.0);
      theta = Math.PI - theta;
   }

   const transform = mat4.create();
   const scale = mat4.create();
   mat4.fromScaling(scale, scaleV);
   const rotate = mat4.create();
   mat4.fromRotation(rotate, theta, newAxis);
   const rotateInv = mat4.create();
   mat4.transpose(rotateInv, rotate);
      
   //mat4.translate(transform, transform, origin);
      mat4.mul(transform, transform, rotateInv);
      mat4.mul(transform, transform, scale);
      mat4.mul(transform, transform, rotate);
   //mat4.translate(transform, transform, [-origin[0], -origin[1], -origin[2]]);

   return transform;
}


// it seems erlang version use 2d(w) line - line intersection (wikipedia). 
// we changed it to blinn's homogenous clipping. we are only interest in clip to end-out region. 
// clip in clipSpace.
function clipLine(pt0, pt1) {
   var tIn = 0.0, tOut = 1.0, tHit;
   // bc, boundary code.
   var bc = {pt0: [pt0[3]+pt0[0], pt0[3]-pt0[0], pt0[3]+pt0[1], pt0[3]-pt0[1], pt0[3]+pt0[2], pt0[3]-pt0[2]],
             pt1: [pt1[3]+pt1[0], pt1[3]-pt1[0], pt1[3]+pt1[1], pt1[3]-pt1[1], pt1[3]+pt1[2], pt1[3]-pt1[2]]};
   var outCode = {pt0: 0, pt1: 0};
   for (var i = 0; i < 6; ++i) {
      var tmp = (bc.pt0[i] < 0) << i;
      outCode.pt0 |= tmp;
      outCode.pt1 |= (bc.pt1[i] < 0) << i;
   }

   if ((outCode.pt0 & outCode.pt1) != 0) { // trivial reject, both point outside the same plane
      return false;
   }
   if ((outCode.pt0 | outCode.pt1) == 0) { // trivial accept
      return true;
   }
   // now, do 3D line clipping
   for (i=0; i < 6; i++) {  // clip against 6 planes
      if (bc.pt1[i] < 0) {  // C is outside wall i (exit so tOut)
         tHit = bc.pt0[i]/(bc.pt0[i] - bc.pt1[i]);      // calculate tHit
         tOut = Math.min(tOut, tHit);
      } else if(bc.pt0[i] < 0) { // A is outside wall I (enters so tIn)
         tHit = bc.pt0[i]/(bc.pt0[i] - bc.pt1[i]);      // calculate tHit
         tIn = Math.max(tIn, tHit);
      }
      if (tIn > tOut) {
         return false; // CI is empty: early out
      }
   }

   var tmp = vec4.create();  // stores homogeneous coordinates
   if (outCode.pt0 != 0) { // A is outside: tIn has changed. Calculate A_chop
      for (i = 0; i < 4; ++i) { // compute x, y, z, w component
         tmp[i] = pt0[i] + tIn * (pt1[i] - pt0[i]);
      }
   }
   if (outCode.pt1 != 0) { // C is outside: tOut has changed. Calculate C_chop
      for (i = 0; i < 4; ++i) { // compute x, y, z, w component
         pt1[i] = pt0[i] + tOut * (pt1[i] - pt0[i]);
      }
   }
   pt0 = tmp;
   return true; // some of the edges lie inside CVV
};


/**
 * 
 */
function pickMat4(pick, x, y, width, height, viewport) {

};


class Plane {
   constructor(normal, pt) {
      this.normal = normal;
      this.d = vec3.dot(pt, normal);
      this.pt = pt;
   }

   static fromNormalPoint(normal, pt) {
      const norm = vec3.clone(normal);
      vec3.normalize(norm, norm);    // make sure
      
      return new Plane(norm, vec3.clone(pt));
   }

   static fromPoints(a, b, c) {
      const normal = [0, 0, 0];
      const temp = [0, 0, 0];
      vec3.sub(normal, c, b); 
      vec3.sub(temp, a, b);
      vec3.cross(normal, normal, temp);
      vec3.normalize(normal, normal);
   
      return new Plane(normal, vec3.clone(b));
   }

   closestPoint(out, point) { // projection to plane
      closestPointToPlane(out, point, this);
   }

   intersectAABB(box) {
      return intersectPlaneAABB(this, box);
   }

   intersectSphere(sphere) {
      return intersectPlaneSphere(this, sphere);
   }

   distanceToPoint(pt) {
      return vec3.dot(pt, this.normal) - this.d;
   }

   /**
    * https://stackoverflow.com/questions/5666222/3d-line-plane-intersection
    * ZGorlock's version
    */
   intersectLine(out, a, b) {
      vec3.sub(out, a, b);
      vec3.normalize(out, out);
      const dot = vec3.dot(this.normal, out);
      if (Math.abs(dot) > kEPSILON) {  // is it not parallel
         const t = (this.d - vec3.dot(this.normal, a)) / dot;
         vec3.scaleAndAdd(out, a, out, t);
         return t;
      } else {
         return 0;
      }
   }
};

class Frustum {
   constructor(p0, p1, p2, p3, p4, p5) {
      this.planes = [p0, p1, p2, p3, p4, p5];
   };

   static fromProjectionMatrix(m) {

   }

   containPoint(pt) {
      for (let i = 0; i < 6; i++) {
         if (this.planes[i].distanceToPoint(pt) < 0) { // outside
            return false;
         }
      }
      return true;
   }

   /**
    * do line clipping to determine if line segment overlap frustum.
    */
   overlapHEdge(hEdge) {
      let a = hEdge.origin;
      let b = hEdge.destination();
      for (let i = 0; i < 6; ++i) {
         const distA = this.planes[i].distanceToPoint(a);
         const distB = this.planes[i].distanceToPoint(b);
         if (distA < 0 && distB < 0) {  // completely outside
            return false;
         } else if (distA > 0 && distB > 0) {
            continue;
         } else {
            const c = [0, 0, 0];
            this.planes[i].intersectLine(c, a, b);
            if (distA < 0) {
               a = c;
            } else {
               b = c;
            }
         }
      }
      return true;
   }


   /**
    * clip polygon to determine if overlap. use sutherland-hodgeman
    */
   overlapPolygon(polygon) {
      let outputList = [];
      for (let hEdge of polygon.hEdges()) {
         outputList.push( hEdge.origin );
      }

      for (const clipPlane of this.planes) { // iterate through frustum
         let inputList = outputList;
         outputList = [];

         for (let i = 0; i < inputList.length; ++i) { // iterate through the resulting polygon
            let currentPt = inputList[i];
            let prevPt = inputList[(i+inputList.length-1) % inputList.length];

            if (clipPlane.distanceToPoint(currentPt) > 0) {       // current Inside plane
               if (clipPlane.distanceToPoint(prevPt) < 0) {    // prev Outside plane
                  const intersect = [0, 0, 0];
                  clipPlane.intersectLine(intersect, prevPt, currentPt);
                  outputList.push(intersect);
               }
               outputList.push(currentPt);             
            } else if (clipPlane.distanceToPoint(prevPt) > 0) { // current Outside, prev Inside
               const intersect = [0, 0, 0];
               clipPlane.intersectLine(intersect, prevPt, currentPt);
               outputList.push(intersect);
            }
         }
      }
      
      return (outputList.length > 0);
   }

   /**
    * some false positives.
    * 
    * return (-1, totally outside), (0, partial overlap possible), (1, totally inside)
    */
   overlapSphere(sphere) {
      let result = 1;
      for (let i = 0; i < 6; i++) {
         let distance = this.planes[i].distanceToPoint(sphere.center);
         if (distance < -sphere.radius) {
            return -1;
         } else if (distance < sphere.radius) {
            result = 0;
         }
      }
      return result;
   }

};



class Ray {
   constructor(origin, dir) {
      this.origin = origin;
      this.direction = dir;
      this.invDir = vec3.fromValues(1/dir[0], 1/dir[1], 1/dir[2]);   //1/0 still work for our purpose.
   }

   intersectSphere(sphere) {
      return intersectRaySphere(this, sphere);
   }

   intersectAAExtent(extent) {
      return intersectRayAAExtent(this, extent);
   }
}





export {
   closestPointToPlane,
   computeAngle,
   computeAxisScale,
   getAxisAngle,
   computeEdgeNormal,  
   clipLine,
   intersectTriangle,
   intersectRayAAExtent,
   intersectRaySphere,
   intersectPlaneSphere,
   intersectPlaneAABB,
   intersectPlaneHEdge,
   projectVec3,
   rotationFromToVec3,
   reflectionMat4,
   pickMat4,
   Frustum,
   Plane,
   Ray,

};