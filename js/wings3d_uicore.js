/**
 * implement web component..
 * 
 */

import * as UI from './wings3d_ui.js';
import * as Util from './wings3d_util.js';
import * as PbrSphere from './wings3d_materialsphere.js';
import * as View from './wings3d_view.js';

const materialTemplate = document.createElement('template');
materialTemplate.innerHTML = `
   <style>
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
      content: "(";
   }
   .resultCount::after {
      content: ")";
   }
   </style>
   <li><span class="materialIcon"></span><span></span><span class="resultCount"></span>
     <ul class="texture">
        <slot></slot>
     </ul>
   </li>
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

      if (!this.getAttribute('default')) {   // default material's name cannot be changed.
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

   setUsageCount(count) {
      this.span.count.textContent = count;      
   }

   isInUse() {
      return (this._mat.usageCount > 0);
   }
}
customElements.define('wings3d-material', MaterialUI);


