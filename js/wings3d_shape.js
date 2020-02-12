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
   yield ellipse(number, centerY, r, r);
};

/**
 * helper generator function
 * @param {int} number 
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
 * 
 * @param {PreviewCage} mesh
 * @param {Material} defaultMaterial
 * @param {int} sections - # of cone sections
 * @param {real} height - height of cone
 * @param {real} centerY - y start location
 * @param {real} r1 - x axis
 * @param {real} r2 - z axis
 */
function makeCone(mesh, defaultMaterial, transform, sections, height, centerY, r1, r2) {
   if ( (sections < 3) || (height < 0) || (r1 < 0) || (r2 < 0) ) {
      return false;
   }

   // add base ellipse vertex
   const vertices = [];
   for (let vertex of ellipse(sections, centerY, r1, r2)) {
      vec3.transformMat4(vertex, vertex, transform);
      vertices.push( mesh.addVertex(vertex).index );      
   }

   // add base face 
   mesh.addPolygon( vertices, defaultMaterial );
   
   // add top vertex then cone section face
   let apex = [0, centerY+height, 0];
   vec3.transformMat4(apex, apex, transform);
   const section = [mesh.addVertex(apex).index, 0, vertices[vertices.length-1]];
   for (let i = 0; i < vertices.length; ++i) {
      section[1] = vertices[i];
      mesh.addPolygon( section, defaultMaterial );
      section[2] = section[1];
   }

   return true;
};


export {
   makeCone
}