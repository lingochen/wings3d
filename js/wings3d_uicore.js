/**
 * implement web component..
 * 
 */

import * as UI from './wings3d_ui.js';
import * as Util from './wings3d_util.js';
import * as PbrSphere from './wings3d_materialsphere.js';
import * as View from './wings3d_view.js';


/**
 * model after x3d texture node/ under image.
 */
const textureTemplate = document.createElement('template');
textureTemplate.innerHTML = `
  <style>

  </style>
  <span class="smallIcon smallImage"><span><span></span>
`;
class TextureUI extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({mode: 'open'});

      this.shadowRoot.appendChild(textureTemplate.content.cloneNode(true));
   }

   get type() {
      
   }
};



const materialTemplate = document.createElement('template');
materialTemplate.innerHTML = `
   <style>
   :host {
      display: block;
    }
   ul {
      display: none;
      list-style: none; /* Remove list bullets */
      padding: 0;
      margin: 0;
   }
   li {
      display: none;
      padding-left: 1rem;
   }
   li.shown {
      display: block;
   }
   .materialIcon { /* https://stackoverflow.com/questions/50646577/how-to-ignore-transparent-pixels-with-background-blend-mode */
      display: inline-block;
      background-image: url("../img/bluecube/material.png");
      width: 16px;
      height: 16px;
      -webkit-mask-image: url("../img/bluecube/material.png");
      -webkit-mask-mode: alpha;
      mask-image: url("../img/bluecube/material.png");
      mask-mode: alpha;
      background-blend-mode: multiply;
      background-color: white;
   }
   .resultCount::before {
      content: " (";
   }
   .resultCount::after {
      content: ")";
   }
   li > img {
      object-fit: cover;
      height: 16px;
      width: 16px;
   }
   li.baseColorTexture > img {
      object-position: -32px 0px;
   }
   li.normalTexture > img {
      object-position: -48px 0px;
   }
   li.occlusionTexture > img {
      object-position: -64px 0px;
   }
   li.emissionTexture > img {
      object-position: -80px 0px;
   }
   li.roughnessTexture > img {
      object-position: -96px 0px;
   }
   
    input {
      display: none;
    }
    input:checked ~ ul {
      display: block;
    }
    label {
      cursor: pointer;
      font-weight: bold;
    }
    input:not([disabled]) ~ label:before {
      content: '';
      width: 0;
      height: 0;
      position: absolute;
      border-style: solid;
      margin-top: 0.2em;
      margin-left: -0.6em;
      border-width: 6px;
      border-top-color: transparent;
      border-right-color: transparent;
      border-bottom-color: transparent;
      border-left-color: red;
    }
    input:checked:not([disabled])~ label:before {
      content: '';
      margin-top: 0.4em;
      margin-left: -0.8em;
      border-width: 7px 5px 0;
      border-top-color: red;
      border-right-color: transparent;
      border-bottom-color: transparent;
      border-left-color: transparent;
    }
   </style>
   <input type="checkbox" id="materialCheck" disabled />
   <label for="materialCheck"><span class="materialIcon"></span><span></span><span class="resultCount"></span></label>
   <ul class="texture">
     <li class="baseColorTexture"><img src="../img/bluecube/small_texture.png"><span></span></li>
     <li class="roughnessTexture"><img src="../img/bluecube/small_texture.png"><span></span></li>
     <li class="normalTexture"><img src="../img/bluecube/small_texture.png"><span></span></li>
     <li class="occlusionTexture"><img src="../img/bluecube/small_texture.png"><span></span></li>
     <li class="emissionTexture"><img src="../img/bluecube/small_texture.png"><span></span></li>
   </ul>
`;

class MaterialUI extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({mode: 'open'});

      this.shadowRoot.appendChild(materialTemplate.content.cloneNode(true));
      const span = {};
      [span.pict, span.def, span.count] = this.shadowRoot.querySelectorAll("span");
      this.span = span;
   }

   static get observedAttributes() {
      return ['def'];
   };

   attributeChangedCallback(attrName, oldVal, newVal) {
      switch (attrName) {
         case 'def':
            this.span.def.textContent = newVal; // remember to show text in "span"
         break;
      }
   }

   connectedCallback() {
      // upgrade attribute,
      this._upgradeProps(['def']);

      // connect event if not already
      if (!this.hasOwnProperty('editMaterial')) {
         this.editMaterial = (ev)=>{this._editMaterial(ev);};
      }
      this.span.pict.addEventListener('click', this.editMaterial);

      if (!this.hasOwnProperty('menuMaterial')) {
         this.menuMaterial = (ev)=>{this._menuMaterial(ev);};
      }
      this.addEventListener('contextmenu', this.menuMaterial, false);
      // add contextMenu for texture.

      

      if (!this.default) {   // default material's name cannot be changed.
         this.editDef = this._editDef(this.span.def);
      }
   }

   disconnectedCallback() {
      this.span.pict.removeEventListener('click', this.editMaterial);   
      this.removeEventListener('contextmenu', this.menuMaterial);
      if (this.editDef) {
         const text = this.span.def;
         text.removeEventListener('dblclick', this.editDef.dbclick);
         text.removeEventListener('blur', this.editDef.blur);
      }
   }

   /**
    * for framework that set properties before define.
    */
   _upgradeProps(props) {
      for (let prop of props) {
         if (this.hasOwnProperty(prop)) {    // value before fully defined.
            const value = this[prop];  
            delete this[prop];
            this[prop] = value;        // use class method to set value.
         }
      }
   }

   _menuMaterial(ev) {
      ev.preventDefault();
      let contextMenu = document.querySelector('#materialMenu');
      if (contextMenu) {
         UI.positionDom(contextMenu, UI.getPosition(ev));
         UI.showContextMenu(contextMenu);
         View.setObject(null, [this]);
      }
   }

   _editMaterial(ev) {
      function extractData(form) {
         const data = UI.extractDialogValue(form);
         for (let [key, value] of Object.entries(data)) {
            if (isNaN(value)) {  // convert '#121212' to rgb
               data[key] = Util.hexToRGB(value);
            } else {
               data[key] = parseFloat(value);
            }
         }
         return data;
      }
      const dat = this._mat;

      UI.runDialog('#materialSetting', ev, (form)=>{
         const data = extractData(form);
         dat.setValues(data);
         this.setBaseColor(Util.rgbToHex(...dat.pbr.baseColor));
       }, (form)=>{ // handle setup
         form.reset();
         {  // resetCSS
            const style = document.documentElement.style;
            style.setProperty("--baseColorMax", "#FFFFFF");
            style.setProperty("--emissionMax", "#FFFFFF");
         }
         const data = form.querySelector('h3 > span');
         if (data) {
            data.textContent = dat.name;
         }
         const canvas = form.querySelector('canvas');
         if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.putImageData(PbrSphere.preview(dat.pbr), 0, 0);
         }
         for (let [key, value] of Object.entries(dat.pbr)) {
            const data = form.querySelector(`div > [name=${key}]`);
            if (data) {
               if(isNaN(value)) {
                  data.value = Util.rgbToHex(value[0], value[1], value[2]);
               } else {
                  data.value = value;
               }
               if (data.onchange) { // vertexColorSelect don't have onChange
                  data.onchange();
               }
            }
         }
         if (!form.onchange) {   // use onchange for update
            form.onchange = function(ev) {
               // extract current pbr values, and ask canvas to redo pbr value
               if (canvas) {
                  const data = extractData(form);
                  const ctx = canvas.getContext('2d');
                  ctx.putImageData(PbrSphere.preview(data), 0, 0);
               }
            }
         }
       }, 
       );
   }

   _editDef(text) {
      const data = this;
      const entry = function(ev) {
         if (ev.keyCode == 13) {
            // rename if not empty
            if (this.textContent != "") {
               data._mat.name = this.textContent;
            } else {
               this.textContent = data.name;
            }
            this.contentEditable = false;
            this.removeEventListener('keydown', entry);  // remove keyListening event
         }
      };
      const ret = {};
      ret.dbclick = function(ev){
         this.contentEditable = true;
         this.focus();
         this.addEventListener('keydown', entry);
       };
      text.addEventListener('dblclick', ret.dbclick);
      ret.blur = function(ev) {
         // restore 
         this.textContent = data._mat.name;   // restore name
         this.contentEditable = false;
         this.removeEventListener('keydown', entry);
       };
      text.addEventListener('blur', ret.blur);
      return ret;
   }

   get def() {
      return this.getAttribute('def');
   }

   set def(materialName) {
      this.setAttribute('def', materialName);
   }

   get default() {
      return (this.getAttribute('default') !== null);
   }

   set default(enable) {
      if (enable) {
         this.setAttribute('default', '');
      } else {
         this.removeAttribute('default');
      }
   }

   // should we merge with "def"?
   rename(newName) {
      this.def = newName;
      this._mat.name = newName;
      this.menu.text.textContent = newName;
   }

   setBaseColor(color) {
      this.span.pict.style.backgroundColor = color;
      this.menu.color.style.backgroundColor = color;
   }

   setBaseColorTexture(texture) {
      return this.setTexture('baseColorTexture', texture);
   }

   setRoughnessTexture(texture) {
      return this.setTexture("roughnessTexture", texture);
   }

   setNormalTexture(texture) {
      return this.setTexture('normalTexture', texture);
   }

   setOcclusionTexture(texture) {
      return this.setTexture('occlusionTexture', texture);
   }

   setEmissionTexture(texture) {
      return this.setTexture("emissionTexture", texture);
   }

   setTexture(name, texture) {
      const li = this.shadowRoot.querySelector(`.${name}`);
      if (texture.isExist()) { // enabled 
         li.classList.add("shown");
         li.querySelector('span').textContent = texture.name;
         return true;
      } else {
         li.classList.remove('shown');
         return false;
      }
   }

   setUsageCount(count) {
      this.span.count.textContent = count;      
   }

   isInUse() {
      return (this._mat.usageCount > 0);
   }

   get material() {
      return this._mat;
   }

   set material(newMat) {
      this._mat = newMat;
      this.def = newMat.name;
      this.setBaseColor(newMat.getBaseColorInHex());
      this.setUsageCount(newMat.usageCount);


      // set textures if exists
      let hasTexture = false;
      hasTexture |= this.setBaseColorTexture(newMat.getBaseColorTexture());
      hasTexture |= this.setRoughnessTexture(newMat.getRoughnessTexture());
      hasTexture |= this.setNormalTexture(newMat.getNormalTexture());
      hasTexture |= this.setOcclusionTexture(newMat.getOcclusionTexture());
      hasTexture |= this.setEmissionTexture(newMat.getEmissionTexture());
      this.shadowRoot.querySelector('input').disabled = !hasTexture;
   }

}
customElements.define('wings3d-material', MaterialUI);


