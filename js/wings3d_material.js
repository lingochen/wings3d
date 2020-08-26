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
                     // occulsion // should be textureMap.
                     baseColorTexture: null,
                    };
/**
 * PhysicallyBasedMaterial
 */
const Material = function(name) {
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
   this.index = Material.color.alloc()/(3*3);
   this.setGPU();
};
Material.color = null;  // saved the color

const gList = [];
const gFreeList = [];
Material.create = function(name, input) {
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

Material.release = function(material) {
   if (material.usageCunt === 0) {
      gFreeList.push(material);
      return true;
   } else {
      return false;
   }
};


Material.prototype.setGPU = function() {
   // now put on Material.color (for gpu)
   const i = this.index * (3*3);
   Material.color.set(i, this.pbr.baseColor[0]);
   Material.color.set(i+1, this.pbr.baseColor[1]);
   Material.color.set(i+2, this.pbr.baseColor[2]);
   Material.color.set(i+3, this.pbr.roughness);
   Material.color.set(i+4, this.pbr.metallic);
   Material.color.set(i+5, this.pbr.opacity);
   Material.color.set(i+6, this.pbr.emission[0]);
   Material.color.set(i+7, this.pbr.emission[1]);
   Material.color.set(i+8, this.pbr.emission[2]);
};


Material.prototype.setValues = function(inputDat) {
   for (const key of Object.keys(inputDat)) {
      if (this.pbr.hasOwnProperty(key)) {
         if ((key == "baseColor" || key == "emission") && !Array.isArray(inputDat[key])) {
            this.pbr[key] = Util.hexToRGB(inputDat[key]);
         } else {
            this.pbr[key] = inputDat[key];
         }
      } else {
         console.log("unknown input material: " + key);
      }
   }
   this.setGPU();
};


Material.prototype.setPBR = function(pbr) {
   this.pbr = pbr;
   this.setGPU();
};


Material.prototype.assigned = function() {
   ++this.usageCount;
   this.updateGUI();
   this.isAltered = true;
}

Material.prototype.unassigned = function() {
   --this.usageCount;
   this.updateGUI();
   this.isAltered = true;
}

Material.prototype.updateGUI = function() {
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

// https://github.com/AnalyticalGraphicsInc/obj2gltf
/**
 * convert rgb to luminance
 */
Material.luminance = function(rgb) {
   return (rgb[0] * 0.2125) + (rgb[1] * 0.7154) + (rgb[2] * 0.0721);
}

/**
 * Translate the blinn-phong model to the pbr metallic-roughness model
 * Roughness factor is a combination of specular intensity and shininess
 * Metallic factor is 0.0
 */
Material.convertTraditionalToMetallicRoughness = function(material) {

   const specularIntensity = Material.luminance(material.specularMaterial);
   let roughnessFactor = 1.0 - material.shininessMaterial;
   
   // Low specular intensity values should produce a rough material even if shininess is high.
   if (specularIntensity < 0.1) {
      roughnessFactor *= (1.0 - specularIntensity);
   }

   return {baseColor: material.diffuseMaterial, 
           metal: 0.0,
           roughness: roughnessFactor,
           emission: material.emissionMaterial,
           opacity: material.opacityMaterial || 1.0,
          };
}



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
let checkerboardCanvas;
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
      this.wrapS = options.wrapS || gl.CLAMP_TO_EDGE;
      this.wrapT = options.wrapT || gl.CLAMP_TO_EDGE;
   }

   static checkerboard() {
      checkerboardCanvas = checkerboardCanvas || (function() {
         const c = document.createElement('canvas').getContext('2d');
         c.canvas.width = c.canvas.height = 128;
         for (var y = 0; y < c.canvas.height; y += 16) {
           for (var x = 0; x < c.canvas.width; x += 16) {
             c.fillStyle = (x ^ y) & 16 ? '#FFF' : '#DDD';
             c.fillRect(x, y, 16, 16);
           }
         }
         return c.canvas;
       })();
      return checkerboardCanvas;
   }

   bind(unit) {
      if (!this.image) {   // no image! supply the default checkerbox item.
         this.setImage(Texture.checkerboard());
      }
      gl.activeTexture(gl.TEXTURE0 + (unit || 0));
      gl.bindTexture(gl.TEXTURE_2D, this.id);
   }

   static unbind(unit) {
      gl.activeTexture(gl.TEXTURE0 + (unit || 0));
      gl.bindTexture(gl.TEXTURE_2D, 0);
   }


   /**
    * 
    * image - (dom image), - 
    */
   setImage(image) {
      this.image = image;

      gl.activeTexture(gl.TEXTURE0+7);                // use baseColorTexture position to update.
      gl.bindTexture(gl.TEXTURE_2D, this.id);
      //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);      
      gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, this.type, image);
      
      if ((this.minFilter != gl.NEAREST) && (this.minFilter != gl.LINEAR)) {
        gl.generateMipmap(gl.TEXTURE_2D);
      }
   }
}

 

export {
   Material,
   Texture,
};