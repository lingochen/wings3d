/**
 pbr sphere.

*/

import {gl} from './wings3d_gl.js';
import {makeSphere, makeCube} from './wings3d_shape.js';
import {Material} from './wings3d_material.js';
import * as Program from './wings3d_shaderprog.js';
const {vec3, vec4, mat4} = glMatrix;


class Vertex { // hacked up class.
   constructor(index) {
      this._index = index;
   }

   get index() {
      return this._index;
   }
}

class Mesh {
   constructor() {
      this.vertex = [];
      this.normal = [];
      this.index = [];
      this.buffer = {};
   }

   addVertex(vert) {
      this.vertex.push( vert );
      this.normal.push( [0, 0, 0] );
      return new Vertex(this.vertex.length-1);
   }

   addPolygon(face, _material) {
      const addTriangle = (v0, v1, v2)=>{
         this.index.push(v0, v1, v2);
         // now compute normal
         const p0 = this.vertex[v0], p1 = this.vertex[v1], p2 = this.vertex[v2];

         const edge1 = [p2[0]-p0[0], p2[1]-p0[1], p2[2]-p0[2]];
         const edge0 = [p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]];
         vec3.cross(edge0, edge0, edge1);
         vec3.normalize(edge0, edge0);
         vec3.add(this.normal[v0], this.normal[v0], edge0);
         vec3.add(this.normal[v1], this.normal[v1], edge0);
         vec3.add(this.normal[v2], this.normal[v2], edge0);
      }


      if (face.length < 5) {
         addTriangle( face[0], face[1], face[2] );
         if (face.length === 4) { // breakup quad to triangles
            addTriangle( face[0], face[2], face[3] );
         }
      } else {
         throw("unable to handle general polygon");
      }

      return null;
   }

   // copy to gl buffers.
   finalized() {
      // normalized normal and upload
      for (let normal of this.normal) {
         vec3.normalize(normal, normal);
      }
      this.buffer.normal = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.normal);
      let array = Float32Array.from(this.normal.flat());
      gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);

      // upload position
      this.buffer.position = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.position);
      array = Float32Array.from(this.vertex.flat());
      gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);

      // upload index
      this.buffer.index = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.index);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(this.index), gl.STATIC_DRAW);
   }

}


class PbrSphere {
   constructor() {
      // create render texture
      this.target = {width: 128,
                     height: 128,
                     handle: gl.createTexture()};
      gl.bindTexture(gl.TEXTURE_2D, this.target.handle);
    
      // define size and format of level 0
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                      this.target.width, this.target.height, 0,
                      gl.RGBA, gl.UNSIGNED_BYTE, null);
      // disable mipmap
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      this.fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
      // attach the texture as the first color attachment, level = 0
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.target.handle, 0);

      // make a depth buffer and the same size as the texture size
      //const depthBuffer = gl.createRenderbuffer();
      //gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
      //gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.target.width, this.target.height);
      //gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
    
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    
      // create sphere object.
      this.mesh = new Mesh;
      makeSphere(this.mesh, null, 16, 16, 1, 1); //sections: 16, slices: 8, radialX: 1, radialY: 1
      this.mesh.finalized();
   }

   _drawSphere(pbrMaterial) {
      function degToRad(d) {
         return d * Math.PI / 180;
       }
     
      gl.useProgram(Program.pbrMaterial.progHandle);

      // set pbrMaterial.
      gl.uniform3fv(Program.pbrMaterial.uniform.baseColor.loc, pbrMaterial.baseColor);
      gl.uniform3fv(Program.pbrMaterial.uniform.emission.loc, pbrMaterial.emission); // not used yet. optimized out of shader
      gl.uniform1f(Program.pbrMaterial.uniform.metallic.loc, pbrMaterial.metallic);
      gl.uniform1f(Program.pbrMaterial.uniform.roughness.loc, pbrMaterial.roughness);
      gl.uniform1i(Program.pbrMaterial.uniform.useDiffuseMap.loc, 0);
      gl.uniform1i(Program.pbrMaterial.uniform.usePBRMap.loc, 0);
      gl.uniform1i(Program.pbrMaterial.uniform.useEmissionMap.loc, 0);

      // Turn on the position, normal
      gl.setBufferAndAttrib(this.mesh.buffer.position, Program.pbrMaterial.attribute.position.loc);
      gl.setBufferAndAttrib(this.mesh.buffer.normal, Program.pbrMaterial.attribute.normal.loc);

      // set index
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.buffer.index);

      // Compute the projection matrix
      const projectionMatrix = mat4.create();
      mat4.perspective(projectionMatrix, 
                        degToRad(60),                          // field of view 
                        this.target.width/this.target.height,  // aspect
                        0.5, 100);

      // Compute the camera's matrix using look at., then  get the view matrix
      const cameraPos = [0, 0, 2];
      const tmpMatrix = mat4.create();
      mat4.lookAt(tmpMatrix, 
                   cameraPos,          // camera position 
                   [0, 0, 0],          // target
                   [0, 1, 0]);         // up
      mat4.multiply(projectionMatrix, projectionMatrix, tmpMatrix);
      mat4.identity(tmpMatrix);
      const lightDir = [1, -1, 1];
      vec3.normalize(lightDir, lightDir);

      // Set the matrix, lightDir, 
      gl.uniformMatrix4fv(Program.pbrMaterial.transform.worldViewProjection, false, projectionMatrix);
      gl.uniformMatrix4fv(Program.pbrMaterial.transform.world, false, tmpMatrix);
      gl.uniform3fv(Program.pbrMaterial.uniform.wsEyepoint.loc, cameraPos);
      gl.uniform3fv(Program.pbrMaterial.uniform.lightDir.loc, lightDir);
      gl.uniform3fv(Program.pbrMaterial.uniform.lightDiffuse.loc, [1.0, 1.0, 1.0]);
      gl.uniform3fv(Program.pbrMaterial.uniform.lightSpecular.loc, [1.0, 1.0, 1.0]);

      // Draw the geometry using 
      gl.drawElements(gl.TRIANGLES, this.mesh.index.length, gl.UNSIGNED_SHORT, 0);
   }

   preview(pbrMaterial) {  // return an image  that render pbrMaterial 
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, this.target.width, this.target.height);
      // draw using predefined sphere geometry

      // Render to the texture (using clear because it's simple)
      gl.clearColor(0, 0, 0, 1); //
      gl.clear(gl.COLOR_BUFFER_BIT);

      // now draw the sphere
      this._drawSphere(pbrMaterial);

      // readpixels
      const data = new Uint8ClampedArray(this.target.width * this.target.height * 4);
      gl.readPixels(0, 0, this.target.width, this.target.height, gl.RGBA, gl.UNSIGNED_BYTE, data); 

      // restore display framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // return ImageData
      return new ImageData(data, this.target.width, this.target.height);
   }

};


let m_sphere = null;
/**
 * return ImageData
 */
function preview(pbrMaterial) {
   if (!m_sphere) {
      m_sphere = new PbrSphere();
   }
   return m_sphere.preview(pbrMaterial);
}


export {
   preview,
}