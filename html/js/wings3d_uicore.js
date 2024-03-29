/**
 * implement web component..
 * wings3d-image
 * wings3d-material
 * wings3d-jogdial
 * 
 */

import * as Wings3D from './wings3d.js';
import * as UI from './wings3d_ui.js';
import * as Util from './wings3d_util.js';
import * as PbrSphere from './wings3d_materialsphere.js';
import * as View from './wings3d_view.js';
import { Texture } from './wings3d_material.js';

// utility - handling event
let gDragObject
function contextMenu(ev, menuName, thatObj) {
   ev.preventDefault();
   ev.stopPropagation();
   let contextMenu = document.querySelector(menuName);
   if (contextMenu) {
      UI.showContextMenu(contextMenu, ev);
      UI.positionDom(contextMenu, UI.getPosition(ev));
      View.setObject(null, [thatObj]);
   }
};

/**
 * model after x3d texture node?/ under image.
 */
const textureTemplate = document.createElement('template');
textureTemplate.innerHTML = `
  <style>
   :host {
     display: block;
   }
   img { 
     object-fit: cover;
     height: 16px;
     width: 16px;
     object-position: 0px 0px;
   }
  </style>
  <img src="../img/bluecube/small_texture.png"><span></span>
`;
class ImageUI extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.shadowRoot.appendChild(textureTemplate.content.cloneNode(true));
      this.listener = {};
      this.listener.contextMenu = (ev)=> {
         contextMenu(ev, '#importImageTextMenu', {textureTypes: 'image', texture: this._texture, ui: this});
      }
      this.listener.showImage = (ev)=> {
         View.setObject(null, [{textureTypes: 'image', texture: this._texture, ui: this}]);
         Wings3D.runAction(0, 'showImage', ev);
      }
      this.listener.dragStart = (ev)=> {
         ev.stopPropagation()
         ev.dataTransfer.setData('text/plain', 'ImageUI');
         gDragObject = this;
      }
      this.observer = new Map;
   }

   connectedCallback() {
      this.setAttribute('draggable', true);
      this.addEventListener('dragstart', this.listener.dragStart);
      this.addEventListener('contextmenu', this.listener.contextMenu, false);
      const img = this.shadowRoot.querySelector("img");
      img.addEventListener('click', this.listener.showImage);
   }

   disconnectedCallback() {
      const img = this.shadowRoot.querySelector("img");
      img.removeEventListener('click', this.listener.showImage);
      this.removeEventListener('contextmenu', this.listener.contextMenu);
      this.removeEventListener('dragstart', this.listener.dragStart);
   }

   addObserver(materialUI, name) {
      let type = this.observer.get(materialUI);
      if (!type) {
         type = new Set;
         this.observer.set(materialUI, type);
      }
      type.add(name);
   }

   deleteObserver(materialUI, name) {
      let type = this.observer.get(materialUI);
      if (type) {
         type.delete(name);
         if (type.size === 0) {
            this.observer.delete(materialUI);
         }
      }
   }

   rename(newName) {
      const span = this.shadowRoot.querySelector("span");
      span.textContent = newName;
      for (const [ui, types] of this.observer) {
         for (const type of types) {
            ui._setTextureName(type, newName);
         }
      }
   }

   get texture() {
      return this._texture;
   }

   set texture(texture) {
      if (texture) {
         this._texture = texture;
         this.rename(texture.name);
      }
   }
};
customElements.define('wings3d-image', ImageUI);



const materialTemplate = document.createElement('template');
materialTemplate.innerHTML = `
   <style>
   :host {
      display: block;
    }
   :host.dropZone {
      border-style: dashed;
      border-color: #333;
      background: #ccc;
    }
   :host.dropZone * { /* avoid dragleave event when .dropZone have children */
      pointer-events: none;
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

      // create listener.
      this.listener = {};
      this.listener.dragEnter = (ev)=> {
         if (gDragObject && (gDragObject instanceof ImageUI)) {
            ev.preventDefault();
            ev.stopPropagation();
            this.classList.add('dropZone');
         }
      }
      this.listener.dragOver = (ev)=> {
         ev.preventDefault();
      }
      this.listener.dragLeave = (ev)=> {
         ev.preventDefault();
         ev.stopPropagation();
         if (ev.target === this &&                             // won't handle child's bubbling phase
             gDragObject && (gDragObject instanceof ImageUI)) {
            this.classList.remove('dropZone');
         }
      }
      this.listener.drop = (ev)=> {
         if (ev.dataTransfer.getData("text/plain") === 'ImageUI') {  // check if allow
            this.listener.dragLeave(ev);
            // now ask textureMenu to decide the type.
            this.addTexture(ev, gDragObject);
         }
      }

      this.listener.editMaterial = (ev)=>{this.editMaterial(ev);};
      this.listener.contextMaterial = (ev)=>{
         contextMenu(ev, '#materialMenu', this);
      };
      for (let texture of MaterialUI.textureTypes()) {
         this.listener[texture] = (ev)=>{
            contextMenu(ev, '#importTextureMenu', {textureType: texture, texture: this._mat[texture] , ui: this});
         };
      }
      this.listener.editDef = this.editDef();
   }

   getMain() {  // return [pict, def, count] span
      const span = {};
      [span.pict, span.def, span.count] = this.shadowRoot.querySelectorAll("span");
      return span;
   }

   static get observedAttributes() {
      return ['def'];
   };

   static textureTypes() {
      return ['baseColorTexture', "roughnessTexture", 'normalTexture', 'occlusionTexture', "emissionTexture", ];
   }

   attributeChangedCallback(attrName, oldVal, newVal) {
      switch (attrName) {
         case 'def':
            this.getMain().def.textContent = newVal; // remember to show text in "span"
         break;
      }
   }

   connectedCallback() {
      // upgrade attribute,
      this._upgradeProps(['def']);

      // dropzone
      this.addEventListener("drop", this.listener.drop);
      this.addEventListener("dragenter", this.listener.dragEnter);
      this.addEventListener("dragover", this.listener.dragOver);
      this.addEventListener("dragleave", this.listener.dragLeave);

      // shadow
      const main = this.getMain();
      main.pict.addEventListener('click', this.listener.editMaterial);
      this.addEventListener('contextmenu', this.listener.contextMaterial, false);
      if (!this.default) {   // default material's name cannot be changed.
         main.def.addEventListener('dbclick', this.listener.editDef.dbclick);
         main.def.addEventListener('blur', this.listener.editDef.blur);
      }

      // add contextMenu for textures
      for (let texture of MaterialUI.textureTypes()) {
         let li = this.shadowRoot.querySelector(`.${texture}`);
         li.addEventListener('contextmenu', this.listener[texture]);
      }
   }

   disconnectedCallback() {
      for (let texture of MaterialUI.textureTypes()) {
         let li = this.shadowRoot.querySelector(`.${texture}`);
         li.removeEventListener('contextmenu', this.listener[texture]);
      }
      const main = this.getMain();
      main.pict.removeEventListener('click', this.listener.editMaterial);   
      this.removeEventListener('contextmenu', this.listener.menuMaterial);
         
      main.def.removeEventListener('dblclick', this.listener.editDef.dbclick);
      main.def.removeEventListener('blur', this.listener.editDef.blur);
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

   addTexture(ev, imageUI) {
      UI.runDialog("#textureTypePicker", ev, (form)=>{
         const type = form.querySelector('input:checked').value;
         if (type in this._mat) {   // sanity chec
            this._mat[type] = imageUI.texture;
         }
       }, (form)=>{
         form.reset();
       });
   }

   editMaterial(ev) {
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
         this._setBaseColor(Util.rgbToHex(...data.baseColor));
       }, (form)=>{ // handle setup
         form.reset();
         {  // resetCSS
            const style = document.documentElement.style;
            style.setProperty("--baseColorMax", "#FFFFFF");
            style.setProperty("--emissionMax", "#FFFFFF");
         }
         const data = form.querySelector('h3 > span:nth-child(2)');
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

   editDef() {
      const data = this;
      const entry = function(ev) {
         if (ev.key == 'Enter') {
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
      //text.addEventListener('dblclick', ret.dbclick);
      ret.blur = function(ev) {
         // restore 
         this.textContent = data._mat.name;   // restore name
         this.contentEditable = false;
         this.removeEventListener('keydown', entry);
       };
      //text.addEventListener('blur', ret.blur);
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
      this._mat.name = newName;
      this._setName(newName);
   }

   removeTexture(textureType) {
      const li = this.shadowRoot.querySelector(`.${textureType}`);
      if (li) {
         this._mat.removeTexture(textureType);
      }
   }

   _setName(newName) {
      this.def = newName;
      this.menu.text.textContent = newName;
   }

   _setBaseColor(color) {
      this.getMain().pict.style.backgroundColor = color;
      this.menu.color.style.backgroundColor = color;
   }

   _setTexture(type, texture) {
      const li = this.shadowRoot.querySelector(`.${type}`);
      if (li) {
         if (texture.isExist()) { // enabled 
            li.classList.add("shown");
            li.querySelector('span').textContent = texture.name;
            this.shadowRoot.querySelector('input').disabled = false;
            return true;
         } //else
         li.classList.remove('shown');
      }
      return false;
   }

   _setTextureName(type, name) {
      const li = this.shadowRoot.querySelector(`.${type}`);
      if (li) {
         li.querySelector('span').textContent = name;
      }
   }

   _setUsageCount(count) {
      this.getMain().count.textContent = count;      
   }

   isInUse() {
      return this._mat.isInUse();
   }

   get material() {
      return this._matProxy;
   }

   setMaterial(newMat, proxy) {
      this._mat = newMat;
      this._matProxy = proxy;
      if (newMat) {
         this.def = newMat.pbr.name;

         this._setBaseColor(newMat.getBaseColorInHex());
         this._setUsageCount(newMat.pbr.usageCount);

         // set textures if exists
         let hasTexture = false;
         for (let texture of MaterialUI.textureTypes()) {
            hasTexture |= this._setTexture(texture, newMat[texture]);
         }
         this.shadowRoot.querySelector('input').disabled = !hasTexture;
      }
   }

}
customElements.define('wings3d-material', MaterialUI);


//------------------------------------------------------------------
const jogDialTemplate = document.createElement('template');
jogDialTemplate.innerHTML = `
   <style>
    :host {
      display: flex;
      flex-direction: row;
      justify-content: center;
    }
    input[type='number'] {
      font-size: 2.5rem;
      text-align: right;
      max-width: 20rem;
      width: 100%;
    }
    button.mark {
      color: white;
      font-size: 2.5rem;
      border-radius: 12px;
    }
    button.check {
      background-color: green;
    }
    button.cross {
      background-color: red;
    }
    table {
      margin: 0 1rem 0 1rem;
    }
    th {
      font-size: 2rem; 
      background-color: white; 
    }
   </style>
   <button class="check mark">✓</button>
   <table></table>
   <button class="cross mark">✗</button>
`;
class ScrubberUI extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.shadowRoot.appendChild(jogDialTemplate.content.cloneNode(true));
      this._callback = {};
      this._ok = this.shadowRoot.querySelector('.check');
      this._ok.addEventListener("pointerdown", (ev)=>{
         if (ev.isPrimary) {
            this.confirm(true);
         }
       });
      this._ok.addEventListener("keydown", (ev)=>{
         if (ev.key == "Enter") {
            this.confirm(true);
         }
       });
      this._cancel = this.shadowRoot.querySelector('.cross');
      this._cancel.addEventListener("pointerdown", (ev)=>{
         if (ev.isPrimary) {
            this.confirm(false);
         }
       });
      this._cancel.addEventListener("keydown", (ev)=>{   // keep tabbing within scrubber.
         if (ev.key == 'Tab') {   // yes, we cycle back to first ok, button.
            ev.preventDefault();
            this._ok.focus();
         } else if (ev.key == 'Enter') {
            this.confirm(false);
         }
       });
   }

   confirm(isOk) {
      if (this._callback.confirm) {
         this._callback.confirm(isOk);
      }
   }

   setConfirmCallback(okcancel) {
      this._callback.confirm = okcancel;
   }

   setChangeCallback(onChange) {
      this._callback.change = onChange;
   }

   reset(settings) {
      const table = this.shadowRoot.querySelector('table');
      table.innerHTML = "";
      this._change = [];
      for (let i = 0; i < settings.length; ++i) {
         const tr = document.createElement('tr');
         const td = document.createElement('td');
         const input = document.createElement('input');
         input.type = "number";
         input.value = Number.parseFloat(settings[i].value).toFixed(2);
         input.step = 0.01;
         td.appendChild(input);
         tr.appendChild(td);
         const th = document.createElement('th');
         th.textContent = settings[i].name;
         tr.appendChild(th);
         table.appendChild(tr);
         this._change.push(input);
         input.addEventListener("change", (ev)=> {
            if (this._callback.change) {
               this._callback.change(ev, i);
            }
          });
      }
   }

   updateStep(settings) {
      for (let i = 0; i < settings.length; ++i) {
         this._change[i].value = Number.parseFloat(settings[i].value).toFixed(2);
      }
   }
}
customElements.define('wings3d-scrubber', ScrubberUI);

