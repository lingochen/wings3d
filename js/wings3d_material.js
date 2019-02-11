/**
 * 
 * 
 */

import * as Util from './wings3d_util.js';


const Material = function(name) {
   this.name = name;
   this.uuid = Util.get_uuidv4();
   this.isAltered = false;
   this.usageCount = 0;
   this.guiStatus = {};
   this.material = {diffuseMaterial: Util.hexToRGB("#C9CFB1"), 
                    ambientMaterial: Util.hexToRGB("#C9CFB1"),
                    specularMaterial: Util.hexToRGB("#000000"), 
                    emissionMaterial: Util.hexToRGB("#000000"), 
                    vertexColorSelect: 0,
                    shininessMaterial: 0, 
                    opacityMaterial: 1};
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
}


export {
   Material,
};