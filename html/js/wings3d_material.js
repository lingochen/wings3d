/**
 * 2019-02-19 - add pbr. ready to transition from opengl material to pbr.
 * 
 * 2020-08-08 - add texture. move all image and texture here ?
 */

import {gl} from './wings3d_gl.js';
import * as Util from './wings3d_util.js';


const defaultPBR = { baseColor: Util.hexToRGB("#C9CFB1"),              // rgb, baseColor, 
                     roughness: 0.8,                                   // float, 0-1.0
                     metallic: 0.1,                                    // float, 0-1.0
                     emission: Util.hexToRGB("#000000"),               // rgb, intensity
                     opacity: 1,                                       // float, 0-1.0
                     baseColorTexture: 0,
                     normalTexture: 0,
                     occlusionTexture: 0,
                     baseColorTexcoord: 0,                              // uv channel # for texCoord
                     normalTexcoord: 0,
                     occlusionTexcoord: 0,
                    };
/**
 * PhysicallyBasedMaterial
 */
const gList = [];
const gFreeList = [];
class Material {
   constructor(name) {
      this.name = name;
      this.uuid = Util.get_uuidv4();
      this.isAltered = false;
      this.usageCount = 0;
      this.guiStatus = {};
/*   this.material = {diffuseMaterial: Util.hexToRGB("#C9CFB1"),    // color, old style to be deleted.
                    ambientMaterial: Util.hexToRGB("#C9CFB1"),    // color
                    specularMaterial: Util.hexToRGB("#000000"),   // color
                    emissionMaterial: Util.hexToRGB("#000000"),   // color
                    vertexColorSelect: 0,                         // true/false
                    shininessMaterial: 0,                         // 0-1
                    opacityMaterial: 1};                          // 0-1*/
      this.pbr = Object.assign({}, defaultPBR);
      for (let i = 0; i < 3; ++i) {
         Texture.getWhite().assigned();
      }
      this.index = Material.color.alloc()/(3*5);
      this.setGPU();
   }



// https://github.com/AnalyticalGraphicsInc/obj2gltf
/**
 * convert rgb to luminance
 */
static luminance(rgb) {
   return (rgb[0] * 0.2125) + (rgb[1] * 0.7154) + (rgb[2] * 0.0721);
}

/**
 * Translate the blinn-phong model to the pbr metallic-roughness model
 * Roughness factor is a combination of specular intensity and shininess
 * Metallic factor is 0.0
 */
static convertTraditionalToMetallicRoughness(material) {

   const specularIntensity = Material.luminance(material.specularMaterial);
   let roughnessFactor = 1.0 - material.shininessMaterial;
   
   // Low specular intensity values should produce a rough material even if shininess is high.
   if (specularIntensity < 0.1) {
      roughnessFactor *= (1.0 - specularIntensity);
   }

   return {baseColor: material.diffuseMaterial, 
           metallic: 0.1,
           roughness: roughnessFactor,
           emission: material.emissionMaterial,
           opacity: material.opacityMaterial || 1.0,
          };
}


static create(name, input) {
   let ret;
   if (gFreeList.lenth > 0) {
      ret = gFreeList.pop();
      ret.name = name;
      ret.setValues(defaultPBR);
   } else { 
      ret = new Material(name);
      gList.push(ret);
   }
   if (input) {
      ret.setValues(input);
   }
   return ret;
};
//Material.default = Material.create("default");
//Material.dead = Material.create("dead");

static release(material) {
   if (material.usageCount === 0) {
      // release unused texture.
      material.setBaseColorTexture(Texture.getWhite());
      gFreeList.push(material);
      return true;
   } else {
      return false;
   }
};


   static * getInUse () {
      for (const mat of gList) {
         if (mat.usageCount > 0) {
            yield mat;
         }
      }
   }

   setGPU() {
      // now put on Material.color (for gpu)
      const i = this.index * (3*5);
      Material.color.set(i, this.pbr.baseColor[0]);
      Material.color.set(i+1, this.pbr.baseColor[1]);
      Material.color.set(i+2, this.pbr.baseColor[2]);
      Material.color.set(i+3, this.pbr.roughness);
      Material.color.set(i+4, this.pbr.metallic);
      Material.color.set(i+5, this.pbr.opacity);
      Material.color.set(i+6, this.pbr.emission[0]);
      Material.color.set(i+7, this.pbr.emission[1]);
      Material.color.set(i+8, this.pbr.emission[2]);
   }

   setGPUTexture() {
      const i = this.index * (3*5);
      Material.color.set(i+9, this.pbr.baseColorTexture);
      Material.color.set(i+10, this.pbr.normalTexture);
      Material.color.set(i+11, this.pbr.occlusionTexture);
   }
   
   setValues(inputDat) {
      for (const key of Object.keys(inputDat)) {
         if (this.pbr.hasOwnProperty(key)) {
            if ((key == "baseColor" || key == "emission") && !Array.isArray(inputDat[key])) {
               this.pbr[key] = Util.hexToRGB(inputDat[key]);
            } else {
               this.pbr[key] = parseFloat(inputDat[key]);
            }
         } else {
            console.log("unknown input material: " + key);
         }
      }
      this.setGPU();
   }

   setBaseColorTexture(texture) {
      // release previous
      Texture.gList[this.pbr.baseColorTexture].unassigned();
      // assign new one
      this.pbr.baseColorTexture = texture.idx;
      texture.assigned();
      this.setGPUTexture();
   }

   getBasecolorTextureHandle() {
      return Texture.handle(this.pbr.baseColorTexture);
   }
   /**
   * return a string compose of texture's index, which act as hash. or should we packed the texture as int32?
   */
   textureHash() {
      return `${this.pbr.baseColorTexture}`;
   }

   assigned() {
      ++this.usageCount;
      this.updateGUI();
      this.isAltered = true;
   }

   unassigned() {
      --this.usageCount;
      this.updateGUI();
      this.isAltered = true;
   }

   updateGUI() {
      if (this.guiStatus.count) {
         this.guiStatus.count.textContent = this.usageCount;
      }
      if (this.menu && this.menu.color) {
         this.menu.color.style.backgroundColor = Util.rgbToHex(...this.pbr.baseColor);
      }
      if (this.pict) {
         this.pict.style.backgroundColor = Util.rgbToHex(...this.pbr.baseColor);
      }
   }
};
Material.color = null;  // saved the color




// Texture parameters can be passed in via the `options` argument.
// Example usage:
//
//     var t = new GL.Texture(256, 256, {
//       // Defaults to gl.LINEAR, set both at once with "filter"
//       magFilter: gl.NEAREST,
//       minFilter: gl.LINEAR,
//
//       // Defaults to gl.CLAMP_TO_EDGE, set both at once with "wrap"
//       wrapS: gl.REPEAT,
//       wrapT: gl.REPEAT,
//
//       format: gl.RGB, // Defaults to gl.RGBA
//       type: gl.FLOAT // Defaults to gl.UNSIGNED_BYTE
//     });
class Texture {
   constructor(name, options) {
      this.name = name;
      options = options || {};
      this.id = gl.createTexture();
      //this.width = 0;
      //this.height = 0;
      this.format = options.format || gl.RGBA;
      this.type = options.type || gl.UNSIGNED_BYTE;
      this.magFilter = options.magFilter || gl.LINEAR;
      this.minFilter = options.minFilter || gl.LINEAR;
      this.wrapS = options.wrapS || gl.REPEAT;//gl.CLAMP_TO_EDGE;
      this.wrapT = options.wrapT || gl.REPEAT;//gl.CLAMP_TO_EDGE;
      this.usageCount = 0;    // the number of materials that contains this Texture.
      this.setImage(gl.CHECKERBOARD);   // default
   }

   close() { // free id texture resource.
      gl.deleteTexture(this.id);
      this.id = null;
      this.image = null;
   }

   static create(name, options) {
      let ret = new Texture(name, options);
      if (Texture.gFreeList.lenth > 0) {
         ret.idx = gFreeList.pop();
         Texture.gList[ret.idx] = ret;
      } else {
         ret.idx = Texture.gList.length;
         Texture.gList.push(ret);
      }
      
      return ret;
   }

   static release(texture) {
      if (texture.usageCount === 0) {
         Texture.gFreeList.push(texture.idx);
         Texture.gList[texture.idx] = null;
         texture.close();
         return true;
      } else {
         return false;
      }
   }

   static getWhite() {
      if (!Texture.WHITE) {
         Texture.WHITE = (function() { 
            const white = Texture.create("WHITE");
            gl.activeTexture(gl.TEXTURE0+7);                // use baseColorTexture position to update.
            gl.bindTexture(gl.TEXTURE_2D, white.id);
            // Fill the texture with a 1x1 white pixel.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
            return white;
         }());
      }
      return Texture.WHITE;
   }

   assigned() {
      this.usageCount++;
   }

   unassigned() {
      this.usageCount--;
   }

   bind(unit) {
      gl.activeTexture(gl.TEXTURE0 + (unit || 0));
      gl.bindTexture(gl.TEXTURE_2D, this.id);
   }

   static unbind(unit) {
      gl.activeTexture(gl.TEXTURE0 + (unit || 0));
      gl.bindTexture(gl.TEXTURE_2D, 0);
   }

   static handle(textureIdx) {
      return Texture.gList[textureIdx].id;
   }

   /**
    * 
    * image - (dom image), - 
    */
   setImage(image, flip=false) {
      this.image = gl.resizeImage(image);

      gl.activeTexture(gl.TEXTURE0+7);                // use baseColorTexture position to update.
      gl.bindTexture(gl.TEXTURE_2D, this.id);
      if (flip) {
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);      
      gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, this.type, this.image);
      
      if ((this.minFilter != gl.NEAREST) && (this.minFilter != gl.LINEAR)) {
        gl.generateMipmap(gl.TEXTURE_2D);
      }
      if (flip) {
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      }
   }
}
Texture.gList = [];
Texture.gFreeList = [];
Texture.WHITE;
 

export {
   Material,
   Texture,
};