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



/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html, ...handlers) {
   const template = document.createElement('template');
   //html = html.trim(); // Never return a text node of whitespace as the result
   template.innerHTML = html;
   const element = template.content.firstChild;
   handlers.map(function(handler){
      element.addEventListener(handler[0], handler[1]);
    });

   return element;
}
/**
* @param {String} HTML representing any number of sibling elements
* @return {NodeList} 
*/
function htmlToElements(html) {
   const template = document.createElement('template');
   template.innerHTML = html;
   return template.content.childNodes;
}

function tag(tagName, ...theElems) {
   const ret = document.createElement(tagName);

   theElems.map((element)=>{
      ret.appendChild(element);
    });
   return ret;
}

function hr() {
   return document.createElement('hr');
}

function sliderInput(name, value, handler) {
   const slider =  document.createElement("input");

   slider.addEventListener('change', handler);
   return slider;
}

function labelCheckbox(name, value, handler) {
   const label = document.createElement("label");
   let attribute = "";
   for (let [key, val] of Object.entries(value)) {
      attribute += ` ${key}='${val}'`;
   }
   const input = htmlToElement(`<input type='checkbox'${attribute}>`, ['change', handler]);

   label.appendChild(input);
   label.appendChild(document.createTextNode(name));
   return label;
}

function numberInput(name, value, handler) {
   const label = document.createElement("label");
   label.textContent = name;
   let attribute = "";
   for (let [key, val] of Object.entries(value)) {
      attribute += ` ${key}='${val}'`;
   }
   const input = htmlToElement(`<input type='number'${attribute}>`, ['change', handler]);

   label.appendChild(input);
   return label;
}

function makePrimitive(evt, name, maker, ...theDoms) {
   const form = htmlToElement('<form></form>', ['reset', function(_evt){maker.reset();}], ['submit', function(evt){maker.confirm(); document.body.removeChild(form);}]);
   form.appendChild(htmlToElement('<span class="close">&times;</span>', ['click', function(evt){maker.cancel(); document.body.removeChild(form);}]));
   form.appendChild(htmlToElement(`<h3>${name}</h3>`));
   
   // now add theDoms
   theDoms.map((element)=>{
      form.appendChild(element);
    });

   // add common putOn
   let translateY;
   form.appendChild( 
      tag('fieldset',
         htmlToElement('<label>Rotate</label>'),
         tag('span', numberInput('X', {value: 0, step: 1, name: 'rotate_x'}, function(evt) {maker.rotate(0, evt.target.value);}), 
            numberInput('Y', {value: 0, step: 1, name: 'rotate_y'}, function(evt) {maker.rotate(1, evt.target.value);}), 
            numberInput('Z', {value: 0, step: 1, name: 'rotate_z'}, function(evt) {maker.rotate(2, evt.target.value);})),
         htmlToElement('<label>Move</label>'),
         tag('span', numberInput('X', {value: 0, step: 1, name: 'translate_x'}, function(evt) {maker.translate(0, evt.target.value);}), 
            translateY = numberInput('Y', {value: 0, step: 1, name: 'translate_y'}, function(evt) {maker.translate(1, evt.target.value);}), 
            numberInput('Z', {value: 0, step: 1, name: 'translate_z'}, function(evt) {maker.translate(2, evt.target.value);})),
         tag('div', labelCheckbox('Put on Ground', {name: 'ground'}, function(evt){
            const checked = evt.target.checked;
            translateY.disabled = checked;         // no translateY when we are attach to the ground.
            maker.putOnGround(checked);
          }))
       ) 
    );

   // now add ok, reset button
   form.appendChild(htmlToElement('<button type="reset" value="Reset">Reset</button>'));
   form.appendChild(htmlToElement('<button type="submit" value="Ok">Ok</button>'));

   // display dialog, shown at the mouse location.
   form.style.display = 'block';
   UI.positionDom(form, UI.getPosition(evt));
   document.body.appendChild(form);
};



class PrimitiveMaker {
   constructor(name, maker, options) {
      this.name = name;
      this.cage = null;
      this.makeShape = maker;
      this.options = options;
      this.rotation = [0, 0, 0];
      this.translation = [0, 0, 0];
      this.ground = false;
      this.default = {};
      Object.assign(this.default, options);
   }

   cancel() {
      if (this.cage) {
         View.removeFromWorld(this.cage);
         this.cage.freeBuffer();
         this.cage = null;
      }
   }

   confirm() {
      View.undoQueue( new CreatePreviewCageCommand(this.cage) );
      PrimitiveMaker.reationCount++;
      this.cage.name = this.name + PrimitiveMaker.creationCount;
      // done
      this.cage = null;
   }

   make() {
      this.cancel();   // remove object first if any
      
      View.createIntoWorld((cage)=> {

         // get rotation
         let angleQ = quat.create();
         quat.fromEuler(angleQ, this.rotation[0], this.rotation[1], this.rotation[2]);
         const transform = mat4.create();
         mat4.fromRotationTranslation(transform, angleQ, this.translation);

         this.cage = cage;
         this.makeShape(cage.geometry, Material.defaultMaterial, transform, this.ground, this.options);
       });
   }

   putOnGround(checked) {
      this.ground = checked;
      this.make();
   }

   reset() {
      Object.assign(this.options, this.default);
      this.ground = false;
      this.rotation = [0,0,0];
      this.translation = [0,0,0];
      this.make();
   }

   rotate(index, value) {
      this.rotation[index] = value;
      this.make();
   }

   translate(index, value) {
      this.translation[index] = value;
      this.make();
   }

   update(option, value) {
      this.options[option] = value;
      this.make();
   }
}
PrimitiveMaker.creationCount = 0;



function makeCone(mesh, material, transform, ground, options) {
   let centerY = -(options.height/2);
   if (ground) {
      centerY = 0;
   }
   return Shape.makeCone(mesh, material, transform, options.sections, options.height, centerY, options.r1, options.r2);
};


/**
 * bind menu
 */
Wings3D.onReady(function() {
   const id = Wings3D.action.createCone.name;
   UI.bindMenuItem(id, function(ev) {
      const maker = new PrimitiveMaker("Cone", makeCone, {sections: 16, height: 2, r1: 1, r2: 1});
      maker.make();
      maker.confirm();
    });

   const handleCone = function(evt) {
      const maker = new PrimitiveMaker("Cone", makeCone, {sections: 16, height: 2, r1: 1, r2: 1});
      maker.make();
      makePrimitive(evt, "Cone Options Dialog", maker, 
         numberInput("Sections", {min: 3, value: 16, step: 1}, function(evt) {
            maker.update("sections", Number(evt.target.value));
          }),
         numberInput("Height", {min: 0, value: 2}, function(evt) {
            maker.update("height", Number(evt.target.value));
          }),
         numberInput("X Diameter", {min: 0, value: 2}, function(evt) {
            maker.update("r1", Number(evt.target.value)/2);
          }),
         numberInput("Z Diameter", {min: 0, value: 2}, function(evt) {
            maker.update("r2", Number(evt.target.value)/2);
          })
         );
    }

   UI.bindMenuItemRMB(id, handleCone);
   // preference optional dialog
   UI.bindMenuItem(Wings3D.action.createConePref.name, handleCone);   
});

export {
   makePrimitive
}