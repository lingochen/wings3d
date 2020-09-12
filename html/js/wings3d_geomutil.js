/**
 * utility for 3d geometry computation.
 * 
 */
const kEPSILON = 0.000001;

class Plane {
   constructor(plane, pt) {   // plane = normal + d, [nx, ny, nz, d]
      this.plane = plane;
      this.origin = pt;
   }

   static fromPoints(a, b, c) {
      const plane = [0, 0, 0, 0];
      const temp = [0, 0, 0];
      vec3.sub(plane, c, b); 
      vec3.sub(temp, a, b);
      vec3.cross(plane, plane, temp);
      vec3.normalize(plane, plane);
   
      plane[3] = -vec3.dot(b, plane);
      return new Plane(plane, b);
   }

   distanceToPoint(pt) {
      return vec3.dot(pt, this.plane) + this.plane[3];
   }

   /**
    * https://stackoverflow.com/questions/5666222/3d-line-plane-intersection
    * ZGorlock's version
    */
   intersectLine(out, a, b) {
      vec3.sub(out, a, b);
      vec3.normalize(out, out);
      const dot = vec3.dot(this.plane, out);
      if (Math.abs(dot) > kEPSILON) {  // is it not parallel
         const t = (-this.plane[3] - vec3.dot(this.plane, a)) / dot;
         vec3.scale(out, out, t);
         vec3.add(out, a, out);
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


/**
 * 
 */
function pickMatrix(pick, x, y, width, height, viewport) {

};



export {
   Frustum,
   Plane,
   pickMatrix,
};