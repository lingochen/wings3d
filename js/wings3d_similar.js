// 
// similar comparison
//

class SimilarGeometry {
   constructor() {
      this.set = new Set;
   }

   // https://stackoverflow.com/questions/10015027/javascript-tofixed-not-rounding
   static _toFixed(num, precision) {
      return (+(Math.round(+(num + 'e' + precision)) + 'e' + -precision)).toFixed(precision);
   }

   static _discreetAngle(val) {
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
   static _computeAngle(m) {   // m = {a, b, aLengthB, bLengthA};
      // 2 * atan(norm(x*norm(y) - norm(x)*y) / norm(x * norm(y) + norm(x) * y));
      vec3.scale(m.aLengthB, m.a, m.bLength);
      vec3.scale(m.bLengthA, m.b, m.aLength);
      let dist = vec3.distance(m.bLengthA, m.aLengthB);
      vec3.add(m.aLengthB, m.aLengthB, m.bLengthA);
      const mag = vec3.length(m.aLengthB);
      return SimilarGeometry._discreetAngle(dist / mag);
   }

   static computeRatio(m) {
      const rad = SimilarGeometry._computeAngle(m);
      const ratio = SimilarGeometry._toFixed(m.bLength/m.aLength, 2) * rad;      // needFixing: possible collision, but should be fairly uncommon
      const ratioR = SimilarGeometry._toFixed(m.aLength/m.bLength, 2) * rad;  
      if (m.fwd.index === -1) {
         m.fwd.index = 0;
         m.rev.index = 0;
      } else {
         if (ratio < m.fwd.angle[m.fwd.index]) {
            m.fwd.index = m.fwd.angle.length;
         } 
         if (ratioR < m.rev.angle[m.rev.index]) {
            m.rev.index = 0;
         } else {
            ++m.rev.index;
         }
      }
      m.fwd.angle.push( ratio );
      m.rev.angle.unshift( ratioR  );
   }

   static computeMetric(m, initial = 0.0) {
      // rotate the array, so the smallest angle start at index 0. so we can compare directly
      m.fwd.angle.unshift( ...(m.fwd.angle.splice(m.fwd.index, m.fwd.angle.length)) ); // spread operator to explode array.
      m.rev.angle.unshift( ...(m.rev.angle.splice(m.rev.index, m.rev.angle.length)) ); // spread operator to explode array.

      // convert to string, or really hash.
      let metric = initial;
      let metricR = initial;
      for (let i = 0; i < m.fwd.angle.length; ++i) {
         metric = (metric*(m.fwd.angle[i]+0.1)) + m.fwd.angle[i];                     // needFixing. better unique computation.
         metricR = (metricR*(m.rev.angle[i]+0.1)) + m.rev.angle[i];
      }

      return [metric, metricR];
   }

   static mStruct() {
      // shared computation resource
      return { a: vec3.create(), aLength: -1,
               b: vec3.create(), bLength: -1,
               aLengthB: vec3.create(),
               bLengthA: vec3.create(),
               fwd: {index: -1, angle: []},
               rev: {index: -1, angle: []},
             };
   }

   // find if selection has similar target
   find(target) {
      const metric = this.getMetric(target);
      return this.set.has(metric);
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
      const m = SimilarGeometry.mStruct();
      polygon.eachEdge( function(edge) {
         if (m.aLength === -1) {
            vec3.sub(m.a, edge.prev().origin.vertex, edge.origin.vertex);
            m.aLength = vec3.length(m.a);
         } else {
            vec3.negate(m.a, m.b);
            m.aLength = m.bLength;
         }
         vec3.sub(m.b, edge.destination().vertex, edge.origin.vertex);
         m.bLength = vec3.length(m.b);
         SimilarGeometry.computeRatio(m);
      });
      const result = SimilarGeometry.computeMetric(m);
      if (reflect) {
         return result;
      } else {
         return result[0];
      }
   }
}


class SimilarWingedEdge extends SimilarGeometry {
   constructor(selection) {
      super();
      for (let wingedEdge of selection) {
         const metrics = this.getMetric(wingedEdge, true);
         this.set.add( metrics[0] );
         this.set.add( metrics[1] );
      }
   }

   getMetric(wingedEdge, reflect=false) {
      const metric = SimilarGeometry.mStruct();
      const normal2 = [];
      for (let hEdge of wingedEdge) {  // left, right side 
         // down side.
         const hEdgeA = hEdge.prev();
         const hEdgeB = hEdge.next;
         vec3.sub(metric.a, hEdgeA.origin.vertex, hEdge.origin.vertex);
         metric.aLength = vec3.length(metric.a); 
         vec3.sub(metric.b, hEdgeB.origin.vertex, hEdge.origin.vertex);
         metric.bLength = vec3.length(metric.b);
         SimilarGeometry.computeRatio(metric);
         const norm = vec3.create();
         vec3.cross(norm, metric.b, metric.a);
         vec3.normalize(norm, norm);
         normal2.push(norm);
         // up
         vec3.negate(metric.a, metric.b);
         metric.aLength = metric.bLength;
         vec3.sub(metric.b, hEdgeB.destination().vertex, hEdgeB.origin.vertex);
         metric.bLength = vec3.length(metric.b);
         SimilarGeometry.computeRatio(metric);
      }
      // we should also check the difference of the  normal of the 2 side of the edge? differing from original implementation.
      const dot = vec3.dot(normal2[1], normal2[0]);
      const result = SimilarGeometry.computeMetric(metric, dot);
      if (reflect) {
         return result;
      } else {
         return result[0];
      }
   }
}


class SimilarVertex extends SimilarGeometry {
   constructor(selection) {
      super();
      for (let vertex of selection) {
         const metric = this.getMetric(vertex, true);
         this.set.add( metric[0] );
         this.set.add( metric[1] );
      }
   }

   getMetric(vertex, reflect=false) {
      const m = SimilarGeometry.mStruct();
      vertex.eachOutEdge( function(edge) {
         if (m.aLength === -1) {
            vec3.sub(m.a, edge.destination().vertex, vertex.vertex);  // similar to SimilarFace, but everything point outEdge.
            m.aLength = vec3.length(m.a);
         } else {
            vec3.copy(m.a, m.b);
            m.aLength = m.bLength;
         }
         vec3.sub(m.b, edge.destination().vertex, vertex.vertex);
         m.bLength = vec3.length(m.b);
         SimilarGeometry.computeRatio(m);
      });
      const result = SimilarGeometry.computeMetric(m);
      if (reflect) {
         return result;
      } else {
         return result[0];
      }
   }
}

export {
   SimilarFace,
//   SimilarGeometry,
   SimilarVertex,
   SimilarWingedEdge
}