


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
   const distance = vec3.dot(plane.normal, box.center) - plane.distance;
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
   const pt0 = hEdge.origin.vertex;
   const pt1 = hEdge.destination().vertex;

   let d0 = vec3.dot(plane.normal, pt0) - plane.distance; 
   let d1 = vec3.dot(plane.normal, pt1) - plane.distance;
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
   vec3.sub(edge0, v0.vertex, v1.vertex);
   vec3.sub(edge1, v2.vertex, v1.vertex);
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
      vec3.sub(pt, vertex.vertex, planeOrigin);
      let d = vec3.dot(pt, planeNormal);
      vec3.scale(pt, planeNormal, d);
      vec3.sub(vertex.vertex, vertex.vertex, pt);
   }
};

function closestPointToPlane(out, point, plane) { // projection to plane
   const distance = vec3.dot(plane.normal, point) - plane.distance;
   vec3.scaleAndAdd(out, point, plane.normal, -distance);
};

function getAxisOrder(extent) {
   let size = vec3.create();
   vec3.sub(size, extent.max, extent.min);
   let first, second, third;
   if (size[0] > size[1]) {
      if (size[0] > size[2]) {
         first = 0;
         if (size[1] > size[2]) {
            second = 1;
            third = 2;
         } else {
            second = 2;
            third = 1;
         }
      }
   } else if (size[1] > size[2]) {

   } else {

   }

   return [first, second, third];
};

function hexToRGB(hex) {
   return [parseInt(hex.slice(1, 3), 16)/255,
           parseInt(hex.slice(3, 5), 16)/255,
           parseInt(hex.slice(5, 7), 16)/255];
 };
function hexToRGBA(hex) {
  return [parseInt(hex.slice(1, 3), 16)/255,
          parseInt(hex.slice(3, 5), 16)/255,
          parseInt(hex.slice(5, 7), 16)/255,
          1.0];
};

function hexToCssRGBA(hex) {  // microsft edge don't support #rrggbbaa format yet, so we convert to rgba() 2018/09/24.
   const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
   const a = parseInt(hex.slice(7, 9), 16) / 255;
   return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/**
 * convert float to hex value guarantee 2 digits. range(0, 255)
 * @param {*} value - between 0.0 - 1.0 
 */
function floatToHex(value) {
   value = Math.min(Math.max(value, 0.0), 1.0); // capped to (0.0, 1.0);
   return Math.round(value*255).toString(16).padStart(2, '0');
}

function rgbToHex(r, g, b) {
   r = floatToHex(r);
   g = floatToHex(g);
   b = floatToHex(b);
   return `#${r}${g}${b}`;
}

function rgbaToHex(r, g, b, a) {
   r = floatToHex(r);
   g = floatToHex(g);
   b = floatToHex(b);
   a = floatToHex(a);
   return `#${r}${g}${b}${a}`;
}

/**
 * https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 * generate unique id using crypto functions to avoid collision.
 */
function get_uuidv4() {
   return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
     (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
   )
 };

function clamp(number, min, max) {
   return Math.min(max, Math.max(min, value));
};

const Vec3View = function(buffer, index = 0) {
   this.buffer = buffer;
   this.offset = index * 3;
};

Vec3View.prototype.init = function(buffer, index) {
   this.buffer = buffer;
   this.offset = index *3;
   return this;
}

Vec3View.prototype.inc = function() {
   this.offset += 3;
   return this;
};

Vec3View.prototype.dec = function() {
   this.offset -= 3;
   return this;
};

Vec3View.prototype.set = function(inVec3) {
   this.buffer[this.offset] = inVec3[0];
   this.buffer[this.offset+1] = inVec3[1];
   this.buffer[this.offset+2] = inVec3[2];
   return this;
}

// faked array [0,1,2]
Object.defineProperties(Vec3View.prototype, {
   0: { get: function() {return this.buffer[this.offset];},
        set: function(value) {this.buffer[this.offset] = value; return value;} },
   1: { get: function() {return this.buffer[this.offset+1];},
        set: function(value) {this.buffer[this.offset+1] = value; return value;} },
   2: { get: function() {return this.buffer[this.offset+2];},
        set: function(value) {this.buffer[this.offset+2] = value; return value;} },
});


const Vec4View = function(buffer, offset = 0) {
   this.buffer = buffer;
   this.offset = offset;
};

Vec4View.prototype.inc = function() {
   this.offset += 4;
   return this;
};

Vec4View.prototype.dec = function() {
   this.offset -= 4;
   return this;
};

Vec4View.prototype.set = function(inVec4) {
   this.buffer[this.offset] = inVec4[0];
   this.buffer[this.offset+1] = inVec4[1];
   this.buffer[this.offset+2] = inVec4[2];
   this.buffer[this.offset+3] = inVec4[3];
   return this;
}

// faked array [0,1,2,3]
Object.defineProperties(Vec4View.prototype, {
   0: { get: function() {return this.buffer[this.offset];},
        set: function(value) {this.buffer[this.offset] = value; return value;} },
   1: { get: function() {return this.buffer[this.offset+1];},
        set: function(value) {this.buffer[this.offset+1] = value; return value;} },
   2: { get: function() {return this.buffer[this.offset+2];},
        set: function(value) {this.buffer[this.offset+2] = value; return value;} },
   3: { get: function() {return this.buffer[this.offset+3];},
        set: function(value) {this.buffer[this.offset+3] = value; return value;} }
});


export {
   closestPointToPlane,
   computeAngle,
   getAxisAngle,
   computeEdgeNormal,
   getAxisOrder,
   intersectTriangle,
   intersectRayAAExtent,
   intersectRaySphere,
   intersectPlaneSphere,
   intersectPlaneAABB,
   intersectPlaneHEdge,
   projectVec3,
   rotationFromToVec3,
   reflectionMat4,
   hexToRGB,
   hexToRGBA,
   hexToCssRGBA,
   rgbToHex,
   rgbaToHex,
   get_uuidv4,
   clamp,
   Vec3View,
   Vec4View,
};
