


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

	mat[0] = -2 * norm.x * norm.x + 1;
	mat[1] = -2 * norm.y * norm.x;
	mat[2] = -2 * norm.z * norm.x;
	mat[3] = 0;
 
	mat[4] = -2 * norm.x * norm.y;
	mat[5] = -2 * norm.y * norm.y + 1;
	mat[6] = -2 * norm.z * norm.y;
	mat[7] = 0;
 
	mat[8] =	-2 * norm.x * norm.z;
	mat[9] = -2 * norm.y * norm.z;
	mat[10] = -2 * norm.z * norm.z + 1;
	mat[11] = 0;
 
	mat[12] = -2 * norm.x * d;
	mat[13] = -2 * norm.y * d;
	mat[14] = -2 * norm.z * d;
   mat[15] = 1;
   return mat;
};


export {
   intersectTriangle,
   rotationFromToVec3,
   reflectionMat4,
};
