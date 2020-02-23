/**
 * common shape generator,
 *    makeCone
 *    
 */


/**
 * helper generator function, called ellipse
 * @param {*} number 
 * @param {*} centerY 
 * @param {*} r 
 */
function* circle(number, centerY, r) {
   yield* ellipse(number, centerY, r, r);
};

/**
 * helper generator function
 * @param {int} number - number of section
 * @param {real} centerY 
 * @param {real} r1 
 * @param {real} r2 
 */
function* ellipse(number, centerY, r1, r2) {
   const delta = Math.PI*2 / number;
   for (let i = 0; i < number; ++i) {
      const rad = i * delta;
      yield [r1*Math.cos(rad), centerY, r2*Math.sin(rad)];
   }
};


/**
 * we have to follow original's implementation, but we could have better options.
 * @param {*} sides - number of points along spiral
 * @param {*} centerY - y position
 * @param {*} r - distance from origin (x,z), radius
 * @param {*} d - distance 
 * @param {*} coils - number of loops.
 */
function* genSpiral(sides, centerY, r, d, coils) {
   const delta = Math.PI*2 / sides;
   for (let i = 0; i < (coils*sides); ++i) {
      yield [(r+i*d)*Math.cos(i*delta), centerY, (r+i*d)*Math.sin(i*delta)];
   }   
}




function* genSpring(sides, centerY, r, d, coils) {
   const delta = Math.PI*2 / sides;
   for (let i = 0; i < (coils*sides); ++i) {
      yield [r*Math.cos(i*delta), centerY+i*d, r*Math.sin(i*delta)];
   }
}
/**
 * 
 * @param {PreviewCage} mesh
 * @param {Material} defaultMaterial
 * @param {mat4} transform - matrix
 * @param {int} sections - # of cone sections
 * @param {real} height - height of cone
 * @param {real} centerY - y start location
 * @param {real} r1 - x axis
 * @param {real} r2 - z axis
 */
function makeCone(mesh, defaultMaterial, sections, height, centerY, r1, r2) {
   if ( (sections < 3) || (height < 0) || (r1 < 0) || (r2 < 0) ) {
      return false;
   }

   // add base ellipse vertex
   const vertices = [];
   for (let vertex of ellipse(sections, centerY, r1, r2)) {
      vertices.push( mesh.addVertex(vertex).index );      
   }

   // add base face 
   mesh.addPolygon( vertices, defaultMaterial );
   
   // add top vertex then cone section face
   let apex = [0, centerY+height, 0];
   const section = [mesh.addVertex(apex).index, 0, vertices[vertices.length-1]];
   for (let i = 0; i < vertices.length; ++i) {
      section[1] = vertices[i];
      mesh.addPolygon( section, defaultMaterial );
      section[2] = section[1];
   }

   return true;
};


function makeCube(mesh, defaultMaterial, originX, originY, originZ, sizeX, sizeY, sizeZ, numberOfCut) {
   const map = {};
   function addVertexUnique(pt) {
      var x = pt[0], y = pt[1], z = pt[2];
      var key = x.toFixed(6) + "," + y.toFixed(6) + "," + z.toFixed(6); // convert to fixed decimal, so no needs for (x-x1<epsilon)
      if (!map.hasOwnProperty(key)) {
         map[key] = mesh.addVertex(pt);
      }
      return map[key].index;
   }
   function makeFaces(getVertexFN) {
      var offset = 0;
      var vertexIndex = [];
      var polygon = [];
      for (let up = 0; up <= numberOfCut; ++up) {
         for (let rt = 0; rt <= numberOfCut; ++rt) { // add vertex and get vertices index.
            vertexIndex.push( addVertexUnique(getVertexFN(up, rt)) );
         }
         if (up > 0) {   // add polygon faces, ccw order
            for (let i = 0 ; i<numberOfCut; ++i) {
               polygon.push( vertexIndex[offset+i] );
               polygon.push( vertexIndex[offset+i+1] );
               polygon.push( vertexIndex[offset+i+1+numberOfCut+1] );
               polygon.push( vertexIndex[offset+i+numberOfCut+1] );
               mesh.addPolygon(polygon, defaultMaterial);
               polygon.length = 0;
            }
            offset += numberOfCut+1;  // done, add offset 
         }
      }
   }

   // setup start, end
   const org = vec3.fromValues( originX, originY, originZ);
   const x = vec3.fromValues(sizeX, 0.0, 0.0);
   const y = vec3.fromValues(0.0, sizeY, 0.0);
   const z = vec3.fromValues(0.0, 0.0, sizeZ);
   
   const dest = vec3.create();
   // creating step size for each cut
   const stepX = [], stepY = [], stepZ = [];
   for (let i = 0; i <= numberOfCut; ++i) {
      const cut = i / numberOfCut;
      const xStep = vec3.create();
      vec3.scale(xStep, x, cut);
      stepX.push( xStep );
      const yStep = vec3.create();
      vec3.scale(yStep, y, cut);
      stepY.push( yStep );
      const zStep = vec3.create();
      vec3.scale(zStep, z, cut);
      stepZ.push( zStep );
   }

   // right face (x-, -y+, -z)
   vec3.add(dest, org, x);
   makeFaces(function(up, rt) {
      return vec3.fromValues(dest[0]-stepX[rt][0]+stepY[up][0], 
                             dest[1]-stepX[rt][1]+stepY[up][1], 
                             dest[2]-stepX[rt][2]+stepY[up][2]);
   });

   // bottom face (x-, -y, -z+)
   makeFaces(function(up, rt){
      return [dest[0]-stepX[up][0]+stepZ[rt][0],
              dest[1]-stepX[up][1]+stepZ[rt][1], 
              dest[2]-stepX[up][2]+stepZ[rt][2]];
   });

   // front faces vertex (x, -y+, z-)
   //vec3.add(dest, org, x);
   vec3.add(dest, dest, z);
   makeFaces(function(up, rt) {
      return [dest[0]+stepY[up][0]-stepZ[rt][0], 
              dest[1]+stepY[up][1]-stepZ[rt][1], 
              dest[2]+stepY[up][2]-stepZ[rt][2]];
   });

   // left face (-x+, -y+, z)
   vec3.add(dest, org, z);
   makeFaces(function(up, rt) {
      return [dest[0]+stepX[rt][0]+stepY[up][0], 
              dest[1]+stepX[rt][1]+stepY[up][1], 
              dest[2]+stepX[rt][2]+stepY[up][2]]; 
   });

   // back face (-x, -y+, -z+)
   makeFaces(function(up, rt){
      return [org[0]+stepY[up][0]+stepZ[rt][0], 
              org[1]+stepY[up][1]+stepZ[rt][1], 
              org[2]+stepY[up][2]+stepZ[rt][2]];
   });

   // top face (x-, y, z-)
   vec3.add(dest, org, x);
   vec3.add(dest, dest, y);
   vec3.add(dest, dest, z);
   makeFaces(function(up, rt){
      return [dest[0]-stepX[up][0]-stepZ[rt][0], 
              dest[1]-stepX[up][1]-stepZ[rt][1], 
              dest[2]-stepX[up][2]-stepZ[rt][2]];
   });

   return true;
};


function makeCylinder(mesh, defaultMaterial, sections, height, centerY,  bottomR1, bottomR2, topR1, topR2) {
   // add base ellipse vertex
   const bottom = [];
   for (let vertex of ellipse(sections, centerY, bottomR1, bottomR2)) {
      bottom.push( mesh.addVertex(vertex).index );      
   }
   // add base face 
   mesh.addPolygon( bottom, defaultMaterial );

   // add top ellipse vertex
   const top = [];
   for (let vertex of ellipse(sections, centerY+height, topR1, topR2)) {
      top.push( mesh.addVertex(vertex).index );      
   }

   // add cylinder sections.
   const section = [bottom[sections-1], top[sections-1], 0, 0];
   for (let i = 0; i < sections; ++i) {
      section[2] = top[i];
      section[3] = bottom[i];
      mesh.addPolygon( section, defaultMaterial );
      section[0] = section[3];
      section[1] = section[2];
   }

   // add top face 
   mesh.addPolygon( top.reverse(), defaultMaterial );

   return true;
};


function makeSphere(mesh, defaultMaterial, sections, slices, radialX, radialY) {
   // add bottom vertex
   let bottom = mesh.addVertex([0, -radialX, 0]).index;

   let delta = Math.PI/slices;
   // add layer sections of ellipse
   let lastLayer;
   for (let i = 1; i < slices; i++) {
      let pos = -Math.cos(i*delta); // we want bottom to top instead of top to bottom
      let rad = Math.sin(i*delta);
      let layer = [];
      for (let vertex of circle(sections, pos*radialX, rad*radialY)) {
         layer.push( mesh.addVertex(vertex).index );
      }
      if (!lastLayer) {  // bottom triangles
         const section = [bottom, layer[layer.length-1], -1];
         for (let vertex of layer) {
            section[2] = vertex;
            mesh.addPolygon(section, defaultMaterial);
            section[1] = vertex;
         }
      } else { // normal quad
         const section = [lastLayer[lastLayer.length-1], layer[layer.length-1], -1, -1];
         for (let j = 0; j < layer.length; ++j) {
            section[2] = layer[j];
            section[3] = lastLayer[j];
            mesh.addPolygon(section, defaultMaterial);
            section[0] = section[3];
            section[1] = section[2];
         }
      }
      lastLayer = layer;
   }

   // add top vertex and triangles
   let top = mesh.addVertex([0, radialX, 0]).index;
   const section = [lastLayer[lastLayer.length-1], top, -1];
   for (let vertex of lastLayer) {
      section[2] = vertex;
      mesh.addPolygon(section, defaultMaterial);
      section[0] = vertex;
   }

   return true;
};


function makeTorus(mesh, defaultMaterial, sections, slices, r1, r2, r) {
   function addPolygon(lastLayer, layer) {
      const section =  [lastLayer[lastLayer.length-1], layer[layer.length-1], -1, -1];
      for (let j = 0; j < layer.length; ++j) {
         section[2] = layer[j];
         section[3] = lastLayer[j];
         mesh.addPolygon(section, defaultMaterial);
         section[0] = section[3];
         section[1] = section[2];
      }
   };

   let delta = 2*Math.PI/slices;    // 360 degree.

   let lastLayer, firstLayer;
   for (let i = 0; i < slices; ++i) {
      let pos = -Math.cos(i*delta) * r; // we want bottom to top instead of top to bottom
      let rad = Math.sin(i*delta) * r;
      let layer = [];
      for (let vertex of ellipse(sections, pos, r1+rad, r2+rad)) {
         layer.push( mesh.addVertex(vertex).index );
      }
      if (lastLayer) {  // add quad between current and last layer. bottom to out to top to in to bottom.
         addPolygon(lastLayer, layer);
      } else {
         firstLayer = layer;
      }
      lastLayer = layer;
   }
   // add quad between last layer and first layer
   addPolygon(lastLayer, firstLayer);

   return true;
};


function makePlane(mesh, defaultMaterial, resolution, size, thickness) {
   let sizeX2 = size * 2;
   let startX = -size;
   let startY = -thickness;
   let startZ = -size;
   function planeGrid() {
      let base = [];
      for (let i = 0; i < resolution; i++) {
         let x = i / (resolution-1) * sizeX2;
         x += startX;
         let plane = [];
         for (let j = 0; j < resolution; j++)   {
            let z = j / (resolution-1) * sizeX2;
            z += startZ;
            plane.push( mesh.addVertex([x, startY, z]).index );
         }
         base.push(plane);
      }
      return base;
   }
   // bottom grid
   let bottom = planeGrid();
   for (let i = 1; i < resolution; ++i) {
      for (let j = 1; j < resolution; ++j) {
         const face = [bottom[i-1][j-1], bottom[i][j-1], bottom[i][j], bottom[i-1][j]];
         mesh.addPolygon(face, defaultMaterial);
      }
   }
   
   // top grid
   startY = thickness;
   let top = planeGrid();
   for (let i = 1; i < resolution; ++i) {
      for (let j = 1; j < resolution; ++j) {
         const face = [top[i-1][j-1], top[i-1][j], top[i][j], top[i][j-1]];
         mesh.addPolygon(face, defaultMaterial);
      }
   }

   // left, right, front, back
   let end = resolution-1;
   for (let i = 1; i < resolution; ++i) {
      let face = [bottom[i-1][0], top[i-1][0], top[i][0], bottom[i][0]];
      mesh.addPolygon(face, defaultMaterial);
   }
   for (let i = 1; i < resolution; ++i) {
      let face = [bottom[i][end], top[i][end], top[i-1][end], bottom[i-1][end]];
      mesh.addPolygon(face, defaultMaterial);
   }
   for (let i = 1; i < resolution; ++i) {
      let face = [bottom[0][i], top[0][i], top[0][i-1], bottom[0][i-1]];
      mesh.addPolygon(face, defaultMaterial);
   }
   for (let i = 1; i < resolution; ++i) {
      let face = [bottom[end][i-1], top[end][i-1], top[end][i], bottom[end][i]];
      mesh.addPolygon(face, defaultMaterial);
   }

   return true;
};


function makeSpiralSpring(mesh, defaultMaterial, sides, sections, coils, genFunc) {
   const delta = Math.PI*2 / sections;
   let circles = [];
   for (let i = 0; i < sections; ++i ) {
      let layer = [];
      let y = 0.25 * Math.sin(i*delta);
      let rads = 0.75 + 0.25 * Math.cos(i*delta);
      for (let vertex of genFunc(sides, y, rads, 0.05, coils)) {
         layer.push( mesh.addVertex(vertex).index );
      }
      circles.push( layer );
   }

   // add spiral faces
   const begin = [], end = [];
   let last = circles[circles.length-1];
   for (let layer of circles) {
      const section =  [last[0], layer[0], -1, -1];
      for (let j = 1; j < layer.length; ++j) {
         section[2] = layer[j];
         section[3] = last[j];
         mesh.addPolygon(section, defaultMaterial);
         section[0] = section[3];
         section[1] = section[2];
      }
      last = layer;
      begin.push( layer[0] );
      end.push( layer[layer.length-1] );
   }

   // add begin, end circle.
   mesh.addPolygon(begin.reverse(), defaultMaterial);
   mesh.addPolygon(end, defaultMaterial);


   return true;
}


function makeSpiral(mesh, defaultMaterial, sides, sections, coils) {
   return makeSpiralSpring(mesh, defaultMaterial, sides, sections, coils, genSpiral);
};


function makeSpring(mesh, defaultMaterial, sides, sections, coils) {
   return makeSpiralSpring(mesh, defaultMaterial, sides, sections, coils, genSpring);
};

export {
   makeCone,
   makeCube,
   makeCylinder,
   makePlane,
   makeSpiral,
   makeSphere,
   makeSpring,
   makeTorus
}