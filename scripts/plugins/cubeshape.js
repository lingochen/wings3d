/*
   n cube create. 
*/

(function(api) {
   api.createCube = api.createCube || function(size={x:2.0,y:2.0,z:2.0}, numberOfCut=5) {//, translate, rotate, aboveGround = false) {
      // create, one 
      var mesh = new WingedTopology;
      var map = {};
      function addVertexUnique(pt) {
         var x = pt[0], y = pt[1], z = pt[2];
         var key = x.toFixed(6) + "," + y.toFixed(6) + "," + z.toFixed(6); // convert to fixed decimal, so no needs for (x-x1<epsilon)
         if (!map.hasOwnProperty(key)) {
            map[key] = mesh.addVertex(x, y, z);
         }
         return map[key];
      }
      function makeFaces(getVertexFN) {
         var offset = 0;
         var vertexIndex = [];
         var polygon = [];
         for (up = 0; up <= numberOfCut; ++up) {
            for (rt = 0; rt <= numberOfCut; ++rt) { // add vertex and get vertices index.
               vertexIndex.push( addVertexUnique(getVertexFN(up, rt)) );
            }
            if (up > 0) {   // add polygon faces, ccw order
               for (i = 0 ; i<numberOfCut; ++i) {
                  polygon.push( vertexIndex[offset+i] );
                  polygon.push( vertexIndex[offset+i+1] );
                  polygon.push( vertexIndex[offset+i+1+numberOfCut+1] );
                  polygon.push( vertexIndex[offset+i+numberOfCut+1] );
                  mesh.addPolygon(polygon);
                  polygon.length = 0;
               }
               offset += numberOfCut+1;  // done, add offset 
            }
         }
      }

      // setup start, end
      var org = {x: -(size.x / 2.0), y: -(size.y / 2.0), z: -(size.z / 2.0)};
      var dest = {x: org.x+size.x, y: org.y+size.y, z: org.z+size.z};
      // creating step size for each cut
      var step = [];
      for (i = 0; i <= numberOfCut; ++i) {
         step.push( {x: size.x * (i/numberOfCut),
                     y: size.y * (i/numberOfCut),
                     z: size.z * (i/numberOfCut)
                    });
      }
      // front faces vertex (x, -y+, z-)
      makeFaces(function(up, rt) {
         return [dest.x, org.y+step[up].y, dest.z-step[rt].z];
      });

      // left face (-x+, -y+, z)
      makeFaces(function(up, rt) {
         return [org.x+step[rt].x, org.y+step[up].y, dest.z]; 
      });

      // right face (x-, -y+, -z)
      makeFaces(function(up, rt) {
         return [dest.x-step[rt].x, org.y+step[up].y, org.z];
      });

      // back face (-x, -y+, -z+)
      makeFaces(function(up, rt){
         return [org.x, org.y+step[up].y, org.z+step[rt].z];
      });

      // top face (x-, y, z-)
      makeFaces(function(up, rt){
         return [dest.x-step[up].x, dest.y, dest.z-step[rt].z];
      });

      // bottom face (x-, -y, -z+)
      makeFaces(function(up, rt){
         return [dest.x-step[up].x, org.y, org.z+step[rt].z];
      });

      api.putIntoWorld(mesh);
   }
})(Wings3D.apiExport);