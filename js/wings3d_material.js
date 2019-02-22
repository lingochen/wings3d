/**
 * 2019-02-19 - add pbr. ready to transition from opengl material to pbr.
 * 
 */

import * as Util from './wings3d_util.js';


/**
 * PhysicallyBasedMaterial
 */
const Material = function(name) {
   this.name = name;
   this.uuid = Util.get_uuidv4();
   this.isAltered = false;
   this.usageCount = 0;
   this.guiStatus = {};
   this.material = {diffuseMaterial: Util.hexToRGB("#C9CFB1"),    // color, old style to be deleted.
                    ambientMaterial: Util.hexToRGB("#C9CFB1"),    // color
                    specularMaterial: Util.hexToRGB("#000000"),   // color
                    emissionMaterial: Util.hexToRGB("#000000"),   // color
                    vertexColorSelect: 0,                         // true/false
                    shininessMaterial: 0,                         // 0-1
                    opacityMaterial: 1};                          // 0-1
   this.pbr = { color: Util.hexToRGB("#C9CFB1"),                  // rgb, baseColor, 
                roughness: 0.8,                                   // float, 0-1.0
                metallic: 0.1,                                    // float, 0-1.0
                emissive: [0, 0, 0],                              // rgb, intensity
                opacity: 1,                                       // float, 0-1.0
                // occulsion // should be textureMap.
              };
};

Material.create = function(name, input) {
   const ret = new Material(name);
   if (input) {
      ret.setValues(input);
   }
   return ret;
};

Material.default = Material.create("default");
Material.dead = Material.create("dead");


Material.prototype.setAmbient = function(ambientRGB) {
   this.material.ambientMaterial = ambientRGB;
}

Material.prototype.setDiffuse = function(diffuseRGB) {
   this.material.diffuseMaterial = diffuseRGB;
   this.updateGUI();
}

Material.prototype.setSpecular = function(specularRGB) {
   this.material.specularMaterial = specularRGB;
}

Material.prototype.setValues = function(inputDat) {
   for (const key of Object.keys(inputDat)) {
      if (this.material.hasOwnProperty(key)) {
         this.material[key] = Util.hexToRGB(inputDat[key]);
      } else {
         console.log("unknown input material: " + key);
      }
   }
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
      this.menu.color.style.backgroundColor = Util.rgbToHex(...this.material.diffuseMaterial);
   }
   if (this.pict) {
      this.pict.style.backgroundColor = Util.rgbToHex(...this.material.diffuseMaterial);
   }
}

// https://github.com/AnalyticalGraphicsInc/obj2gltf
/**
 * convert rgb to luminance
 */
Material.luminance = function(rgb) {
   return (rgb[0] * 0.2125) + (rgb[1] * 0.7154) + (rbg[2] * 0.0721);
}

/**
 * Translate the blinn-phong model to the pbr metallic-roughness model
 * Roughness factor is a combination of specular intensity and shininess
 * Metallic factor is 0.0
 */
Material.convertTraditionalToMetallicRoughness = function(material) {

   const specularIntensity = luminance(material.specularMaterial);
   let roughnessFactor = 1.0 - material.shininessMaterial;
   
   // Low specular intensity values should produce a rough material even if shininess is high.
   if (specularIntensity < 0.1) {
      roughnessFactor *= (1.0 - specularIntensity);
   }

   return {color: material.diffuseMaterial, 
           metal: 0.0,
           roughness: roughnessFactor,
           emissive: material.emissionMaterial,
           opacity: material.opacityMaterial,
          };
}


export {
   Material,
};