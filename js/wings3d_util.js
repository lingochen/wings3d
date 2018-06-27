


const kEPSILON = 0.000001;
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


export {
   rotationFromToVec3,
};
