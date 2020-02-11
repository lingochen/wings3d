/**
 * primitives maker
 * 
 */

import * as UI from './wings3d_ui.js';
import * as Wings3D from './wings3d.js';
import * as View from './wings3d_view.js';
import {Material} from './wings3d_material.js';
import {CreatePreviewCageCommand} from './wings3d_model.js';
import * as Shape from './wings3d_shape.js';



class PrimitiveMaker {
   constructor() {
      this.cage = null;
   }

   async ask() {
      return new Promise((resolve, reject) => {
         addDialog(initialValue, resolve);


       });
   }

   transform() {

   }

   update() {

   }
}



class ConeMaker extends PrimitiveMaker {
   constructor() {
      super();
      
   }

   make() {

   }

   getDoms() {
      
   }
}


/**
 * bind menu
 */
Wings3D.onReady(function() {
   let coneCreationCount = 0;

   const id = Wings3D.action.createCone.name;
   UI.bindMenuItem(id, function(ev) {
      const cage =  View.putIntoWorld();
      Shape.makeCone(cage.geometry, Material.defaultMaterial, 16, 2, -1, 1, 1);
      View.undoQueue( new CreatePreviewCageCommand(cage) );
      coneCreationCount++;
      cage.name = "Cone" + coneCreationCount;
      View.updateWorld();
    });
});