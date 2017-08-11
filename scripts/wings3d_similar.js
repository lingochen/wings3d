// 
// similar comparison
//

class SimilarGeometry {
   constructor() {
      this.set = new Set;
   }

   // https://stackoverflow.com/questions/10015027/javascript-tofixed-not-rounding
   _toFixed(num, precision) {
      return (+(Math.round(+(num + 'e' + precision)) + 'e' + -precision)).toFixed(precision);
   }

   _discreetAngle(val) {
      function findDiscreet(radian) {
         let degree = radian * 180 / Math.PI;
         degree = Math.round(degree);     // round to nearest degree
         if (degree < 0) { // convert to 360, from (0, 2PI).
            degree = 360 + degree;
         }
         return (degree / 180 * Math.PI); // return radian.
      }
      let radian = 2 * Math.atan(val);
      // convert from [-pi, pi] to [0, 2pi].
      return findDiscreet(radian);
   }

   // W. Kahan suggested in his paper "Mindeless.pdf". numerically better formula.
   computeAngle(a, b) {
      // 2 * atan(norm(x*norm(y) - norm(x)*y) / norm(x * norm(y) + norm(x) * y));
      const aLengthB = new Float32Array(3);
      vec3.scale(aLengthB, a, vec3.length(b));
      const bLengthA = new Float32Array(3);
      vec3.scale(bLengthA, b, vec3.length(a));
      let dist = vec3.distance(bLengthA, aLengthB);
      vec3.add(aLengthB, aLengthB, bLengthA);
      const mag = vec3.length(aLengthB);
      return this._discreetAngle(dist / mag);
   }
}


class SimilarFace extends SimilarGeometry {
   constructor(selection) {
      super();
      for (let polygon of selection) {
         const metrics = this.getMetric(polygon, true);
         this.set.add( metrics[0] );
         this.set.add( metrics[1] );
      }
   }

   // metric return all the angle and side as a unique number.
   getMetric(polygon, reflect=false) {
      const self = this;
      const angle = [], angleR = [];
      let index = -1, indexR = -1;
      let a, b;
      polygon.eachEdge( function(edge) {
         if (a === undefined) {
            a = new Float32Array(3);
            b = new Float32Array(3);
            vec3.sub(a, edge.origin.vertex, edge.prev().origin.vertex);
         } else {
            vec3.copy(a, b);
         }
         vec3.sub(b, edge.destination().vertex, edge.origin.vertex);
         const rad = self.computeAngle(a, b);
         const lengthB = vec3.length(b) 
         const lengthA = vec3.length(a);
         const ratio = self._toFixed(lengthB/lengthA, 2) * rad;      // needFixing: possible collision, but should be fairly uncommon
         const ratioR = self._toFixed(lengthA/lengthB, 2) * rad;     // needs to revisited to get a better algorithm.
         if (index === -1) {
            index = 0;
            indexR = 0;
         } else {
            if (ratio < angle[index]) {
               index = angle.length;
            } 
            if (ratioR < angleR[indexR]) {
               indexR = 0;
            } else {
               ++indexR;
            }
         }
         angle.push( ratio );
         angleR.unshift( ratioR  );
      });
      // rotate the array, so the smallest angle start at index 0. so we can compare directly
      angle.unshift( ...(angle.splice(index, angle.length)) ); // spread operator to explode array.
      angleR.unshift( ...(angleR.splice(indexR, angleR.length)) );
      // convert to string, or really hash.
      let metric = 0;
      let metricR = 0;
      for (let i = 0; i < angle.length; ++i) {
         metric = (metric*angle[i]) + angle[i];                     // needFixing. better unique computation.
         metricR = (metricR*angleR[i]) + angleR[i];
      }
      if (reflect) {
         return [metric, metricR];
      } else {
         return metric;
      }
   }

   find(polygon) {   // find the selection set has similar .
      const metric = this.getMetric(polygon);

      return this.set.has(metric);
   }
}