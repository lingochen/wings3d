/**
 * treeView gui

*/

import * as View from './wings3d_view.js';
import * as Wings3D from './wings3d.js';
import * as UI from './wings3d_ui.js';
import {Material} from './wings3d_material.js';
import {RenameBodyCommand} from './wings3d_bodymads.js';
import {PreviewCage, PreviewGroup} from './wings3d_model.js';

/**
 * reduce coupling. now PreviewCage don't need to know uitree. uitree extend the appropriate method.
 */
(function() {
PreviewGroup.nameSetters.push(function(value){
   if (this.guiStatus && this.guiStatus.textNode) {   // treeView's representation.
      this.guiStatus.textNode.textContent = value;
   } 
});

const superNumberOfCage = PreviewGroup.prototype.numberOfCage;
PreviewGroup.prototype.numberOfCage = function() {
   const count = superNumberOfCage.call(this);
   if (this.guiStatus && this.guiStatus.count) {
      this.guiStatus.count.textContent = count;
   }
   return count;
};

PreviewCage.nameSetters.push( function(value) {
   if (this.guiStatus && this.guiStatus.textNode) {   // treeView's representation.
      this.guiStatus.textNode.textContent = value;
   } 
 });

/**
 * update gui status.
 */
PreviewCage.prototype.updateStatus = function() {
   if (!this.isVisible() || (this.selectedSet.size === 0)) {
      if (this.guiStatus && this.guiStatus.select.checked) {
         this.guiStatus.select.checked = false;
      }
   } else {
      if (this.guiStatus && !this.guiStatus.select.checked) {
         this.guiStatus.select.checked = true;
      }
   }
};
})();

// utility - handling event
function dragOver(ev) {
   ev.preventDefault();
};
function dragLeave(ev){
   ev.preventDefault();
   ev.stopPropagation();
   if (ev.target === this) {  // won't handle child's bubbling phase
      this.classList.remove('dropZone');
   }
};
function dragEnter(ev){
   ev.preventDefault();
   ev.stopPropagation();
   this.classList.add('dropZone');
};

/** 
 * tree view
*/
class TreeView {
   constructor(label, treeView, world) {
      this.label = label;
      this.treeView = treeView;
      this.world = world;
      this.drag = {cage: null, li:null};
      // add drop zone
      const self = this;
      // get the resultCount
      if (world) {
         world.guiStatus.count = label.querySelector('.resultCount');
      }
      world.guiStatus.ul = treeView;
      // drop target, dragEnter, dragLeave
      label.addEventListener('drop', function(ev){
      dragLeave.call(this, ev);
         // check if belong to same treeView
         if (self.treeView.id === ev.dataTransfer.getData("text")) {
            // now move to UL.
            self.treeView.insertBefore(self.drag.li, self.treeView.firstChild);
            View.moveCage(world, self.drag.cage);
            self.drag.li = self.drag.cage = null;
         }
       });
      label.addEventListener('dragover', dragOver);
      label.addEventListener('dragenter',dragEnter);
      label.addEventListener('dragleave', dragLeave); 
      // context menu
      label.addEventListener('contextmenu', function(ev) {
         ev.preventDefault();
         let contextMenu = document.querySelector('#geometryGraphWorld');
         if (contextMenu) {
            UI.positionDom(contextMenu, UI.getPosition(ev));
            UI.showContextMenu(contextMenu);
            View.setObject(world, [world]);
         }
       }, false);
   }

   /**
    * 
    * @param {PreviewCage or PreviewGroup} model - . 
    */
   static addRenameListener(text, model) {
      text.textContent = model.name;
      model.guiStatus.textNode = text;
      const entry = function(ev) {
         if (ev.keyCode == 13) {
            // rename if different
            if (this.textContent !== model.name) {
               const data = {};
               data[model.uuid] = this.textContent;
               const command = new RenameBodyCommand([model], data);
               View.undoQueue( command );
               command.doIt();   // rename
            }
            this.contentEditable = false;
            this.removeEventListener('keydown', entry);  // remove keyListening event
         }
      };
      text.addEventListener('dblclick', function(ev){
         this.contentEditable = true;
         this.focus();
         this.addEventListener('keydown', entry);
       });
      text.addEventListener('blur', function(ev) {
         // restore 
         this.textContent = model.name;   // restore name
         this.contentEditable = false;
         this.removeEventListener('keydown', entry);
       });

      return text;
   }


   /**
    * 
    * @param {PreviewCage} sibling - insert after sibling 
    * @param {PreviewGroup} folder -  todo: later to be replace by TransformGroup
    */
   addGroup(parentUL, group) {
      const self = this;
      let li = group.guiStatus.li;
      if (!li) {
         li = document.createElement('li');
         group.guiStatus.li = li;
         // input before label
         const id = group.uuid;
         const whole = document.createRange().createContextualFragment(`<input type="checkbox" id="${id}"><label for="${id}" class="folder"></label><p><span></span><span class="resultCount">0</span></p><ul></ul>`);
         // span text
         TreeView.addRenameListener(whole.querySelector('span'), group);
         const ul = whole.querySelector('ul');
         group.guiStatus.ul = ul;
         const dropZone = whole.querySelector('p');
         group.guiStatus.count = whole.querySelector('.resultCount');
         li.appendChild(whole);
         // drop target, dragEnter, dragLeave
         dropZone.addEventListener('drop', function(ev){
            dragLeave.call(this, ev);
            // check if belong to same treeView
            if (self.treeView.id === ev.dataTransfer.getData("text")) {
               // now move to UL.
               ul.insertBefore(self.drag.li, ul.firstChild);
               
               View.moveCage(group, self.drag.cage);

               self.drag.li = self.drag.cage = null;
            }
          });
         dropZone.addEventListener('dragover', dragOver);
         dropZone.addEventListener('dragenter',dragEnter);
         dropZone.addEventListener('dragleave', dragLeave);
      }
      parentUL.appendChild(li);
   }

   /**
    * add previewCage to be displayed in TreeView
    * @param {PreviewCage} model -target 
    */
   addObject(model, parentUL = this.treeView) {
      const self = this;
      let li = model.guiStatus.li;
      if (!li) {
         li = document.createElement('li');
         model.guiStatus.li = li;
         li.classList.add('objectName');
         li.draggable = true;
         li.addEventListener('dragstart', function(ev){
            //ev.preventDefault();
            ev.stopPropagation()
            ev.dataTransfer.setData('text', self.treeView.id);
            self.drag.li = this;
            self.drag.cage = model;
          });
         // select whole object
         const whole = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_whole.png\');"></span></label>');
         let input = whole.querySelector('input');
         input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
            if (model.isLock() || !model.isVisible()) {   // not actually changeable
               ev.target.checked = !ev.target.checked;
               return;
            }
            View.setObject(model.parent, [model]);
            Wings3D.runAction(0, "toggleObjectSelect", ev);
          });
         model.guiStatus.select = input;
         li.appendChild(whole);
         // span text
         const text = TreeView.addRenameListener(document.createElement('span'), model);
         text.addEventListener('contextmenu', function(ev) {
            ev.preventDefault();
            let contextMenu = document.querySelector('#geometryGraphText');
            if (contextMenu) {
               UI.positionDom(contextMenu, UI.getPosition(ev));
               UI.showContextMenu(contextMenu);
               View.setObject(model.parent, [model]);
            }
          }, false);
         li.appendChild(text);
         // eye label
         const eyeLabel = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_show.png\');"></span></label>');
         input = eyeLabel.querySelector('input');
         input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
            if (model.isLock()) {   // non modifiable object
               ev.target.checked = !ev.target.checked;
               return;
            }
            View.setObject(model.parent, [model]);
            Wings3D.runAction(0, "toggleObjectVisibility", ev);   
          });
         model.guiStatus.visibility = input;
         li.appendChild(eyeLabel);
         // lock/unlock
         const lockLabel = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_unlock.png\');"></span></label>');
         input = lockLabel.querySelector('input');
         input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
            View.setObject(mode.parent, [model]);
            Wings3D.runAction(0, "toggleObjectLock", ev);
          });
         li.appendChild(lockLabel);
         model.guiStatus.locked = input;
         // wireframe
         const wireframe = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_wire.png\');"></span></label>');
         input = wireframe.querySelector('input');
         input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
            View.setObject(model.parent, [model]);
            Wings3D.runAction(0, "toggleWireMode", ev);
          });
         li.appendChild(wireframe);
      }
      parentUL.appendChild(li);
   }

   /**
    * remove PreviewCage from TreeView
    * @param {PreviewCage} model - the previewCage to be removed from 
    */
   removeObject(model) {
      const li = model.guiStatus.li;
      li.parentNode.removeChild(li);
      model.removeFromParent();
      //model._textNode = undefined;
   }

}

function getTreeView(labelId, id, world) {
   const label = document.querySelector(labelId);  // get <label>
   const treeView = document.querySelector(id); // get <ul>
   if (label && treeView) {
      return new TreeView(label, treeView, world);
   }
   // console log error
   return null;
};



class ListView {
   /**
    * 
    * @param {data} - materail/image/light data
    */
   static addRenameListener(text, data) {
      const entry = function(ev) {
         if (ev.keyCode == 13) {
            // rename if not empty
            if (this.textContent != "") {
               data.name = this.textContent;
            } else {
               this.textContent = data.name;
            }
            this.contentEditable = false;
            this.removeEventListener('keydown', entry);  // remove keyListening event
         }
      };
      text.addEventListener('dblclick', function(ev){
         this.contentEditable = true;
         this.focus();
         this.addEventListener('keydown', entry);
       });
      text.addEventListener('blur', function(ev) {
         // restore 
         this.textContent = data.name;   // restore name
         this.contentEditable = false;
         this.removeEventListener('keydown', entry);
       });

      return text;
   }
}


/**
 * for material, image, lights
 */
class ImageList extends ListView {
   constructor(label, listView) {
      super();
      this.view = listView;
      this.list = [];
      // context menu
      let contextMenu = document.querySelector('#importImageMenu');
      if (contextMenu) {
         label.addEventListener('contextmenu', function(ev) {
            ev.preventDefault();
            UI.positionDom(contextMenu, UI.getPosition(ev));
            UI.showContextMenu(contextMenu);
          }, false);
      }
   }

   loadImage(file) { // show file name.
      //const self = this;
      let reader = new FileReader();

      reader.onload = (_ev) => {
         const dat = {img: null, li: null, uuid: Util.get_uuidv4(), name: "", popup: null};
         const img = dat.img = document.createElement("img");
         img.src = reader.result;
         img.onload = function () {
            dat.popup = UI.showPopup(this, file.name);
          }
         let li = dat.li = document.createElement('li');
         let pict = document.createRange().createContextualFragment('<span class="smallIcon" style="background-image: url(\'../img/bluecube/small_image.png\');"></span>');
         pict.firstElementChild.addEventListener('click', (_ev) => {
            document.body.appendChild(dat.popup);
          });
         li.appendChild(pict);
         let whole = document.createRange().createContextualFragment(`<span>${file.name}</span>`);
         dat.name = whole.firstElementChild;
         whole.firstElementChild.addEventListener('contextmenu', function(ev) {
            ev.preventDefault();
            let contextMenu = document.querySelector('#importImageTextMenu');
            if (contextMenu) {
               UI.positionDom(contextMenu, UI.getPosition(ev));
               UI.showContextMenu(contextMenu);
               View.setObject(null, [dat]);
            }
          }, false);
         li.appendChild(whole);
         this.view.appendChild(li);
         //dat.popup = UI.showPopup(img, file.name);
         this.list.push( dat );
      };

      reader.readAsDataURL(file);
   }

   showImage(images) {
      document.body.appendChild(images[0].popup);
   }

   deleteImage(images) {
      const image = images[0];
      // remove image from body
      image.popup.remove();
      // remove li
      this.view.removeChild(image.li);
      // remove from list
      this.list.splice(this.list.indexOf(image), 1);
   }

}

function getImageList(labelId, id) {
   const listView = document.querySelector(id); // get <ul>
   const label = document.querySelector(labelId);
   if (label && listView) {
      return new ImageList(label, listView);
   }
   // console log error
   return null;
};

class MaterialList extends ListView {
   constructor(label, listView) {
      super();
      this.view = listView;
      this.list = [];
      // add default Material.
      this.addMaterial("default");
      // context menu
      let contextMenu = document.querySelector('#createMaterialMenu');
      if (contextMenu) {
         label.addEventListener('contextmenu', function(ev) {
            ev.preventDefault();
            UI.positionDom(contextMenu, UI.getPosition(ev));
            UI.showContextMenu(contextMenu);
          }, false);
      }
   }

   addMaterial(name, material) {
      const dat = Material.create(name, material);
      // now show on li.
      let li = dat.li = document.createElement('li');
      let pictFrag = document.createRange().createContextualFragment('<span class="materialIcon"></span>');
      dat.pict = pictFrag.firstElementChild;
      dat.pict.addEventListener('click', (ev) => {
         // edit material Setting
         this.editMaterial(ev, [dat]);
       });
      dat.pict.style.backgroundColor = dat.material.diffuseMaterial;
      li.appendChild(pictFrag);
      let whole = document.createRange().createContextualFragment(`<span>${name}</span>`);
      dat.text = whole.firstElementChild;
      if (dat !== this.default) {   // default material's name cannot be changed.
         ListView.addRenameListener(dat.text, dat);
      }
      dat.text.addEventListener('contextmenu', function(ev) {  // contextMenu
         ev.preventDefault();
         let contextMenu = document.querySelector('#materialMenu');
         if (contextMenu) {
            UI.positionDom(contextMenu, UI.getPosition(ev));
            UI.showContextMenu(contextMenu);
            View.setObject(null, [dat]);
         }
       }, false);
      li.appendChild(whole);
      this.view.appendChild(li);
      // also put on subMenu.
      dat.menu = {};
      li = dat.menu.li = document.createElement('li');
      let aFrag = document.createRange().createContextualFragment('<a></a>');
      dat.menu.a = aFrag.firstElementChild; 
      li.appendChild(aFrag);
      let nameFrag = document.createRange().createContextualFragment(`<span>${name}</span>`);
      dat.menu.text = nameFrag.firstElementChild;
      dat.menu.a.appendChild(nameFrag);
      let square = document.createRange().createContextualFragment('<span style="width: 1rem;"></span>');
      dat.menu.color = square.firstElementChild; 
      dat.menu.a.appendChild(square);
      dat.menu.color.style.backgroundColor = dat.material.diffuseMaterial;
      let submenu = document.querySelector('#faceMaterialMenu');
      if (submenu) {
         submenu = submenu.nextElementSibling;  // the ul
         submenu.appendChild(li);
      }
      dat.menu.a.addEventListener('click', function(ev){
         View.setObject(null, [dat]);       
         Wings3D.runAction(ev.button, "assignMaterial", ev);
       });

      if (this.list.length === 0) { // first one is the default
         this.default = dat;
      }
      this.list.push(dat);
   }

   createMaterial(ev) {
      const materialList = this;
      const newName = materialList.newName();
      UI.runDialog('#materialSetting', ev, function(form) {
         const data = UI.extractDialogValue(form);
         materialList.addMaterial(newName, data);
       }, function(form) {
          form.reset();
          MaterialList.resetCSS();
          const data = form.querySelector('h3 > span');
          if (data) {
             data.textContent = newName;
          }
       });
   }

   duplicateMaterial(objects) {
      const dat = objects[0];
      let name = dat.name.split(/\d+$/);
      if (name.length > 1) {
         name = name[0] + (parseInt(dat.name.match(/\d+$/), 10) + 1);
      } else {
         name = dat.name + '2';
      }
      this.addMaterial(name, dat.material);
   }

   editMaterial(ev, objects) {
      const dat = objects[0];
      UI.runDialog('#materialSetting', ev, function(form) {
         const data = UI.extractDialogValue(form);
         dat.setValues(data);
         dat.pict.style.backgroundColor = data.diffuseMaterial;
       }, function(form) { // handle setup
         form.reset();
         MaterialList.resetCSS();
         const data = form.querySelector('h3 > span');
         if (data) {
            data.textContent = dat.name;
         }
         for (let [key, value] of Object.entries(dat.material)) {
            const data = form.querySelector(`div > [name=${key}]`);
            if (data) {
               data.value = value;
               if (data.onchange) { // vertexColorSelect don't have onChange
                  data.onchange();
               }
            }
         }
       });
   }

   deleteMaterial(objects) {
      const dat = objects[0];
      if (dat === this.default) {   // default material is not deletable.
         return;
      }
      // remove li
      this.view.removeChild(dat.li);
      // remove from list
      this.list.splice(this.list.indexOf(dat), 1);
   }

   newName() {
      return `New Material ${this.list.length}`;
   }

   renameMaterial(ev, objects) {
      const dat = objects[0];
      if (dat === this.default) {   // default material cannot be deleted
         return;
      }
      // run rename dialog
      UI.runDialog('#renameDialog', ev, function(form) {
         const data = UI.extractDialogValue(form);
         dat.name = data[dat.uuid]; // now rename
         dat.text.textContent = dat.name;
      }, function(form) {
         UI.addLabelInput(form, objects);
      });
   }

   static resetCSS() {
      const style = document.documentElement.style;
      style.setProperty("--diffuseMaterialMax", "#FFFFFF");
      style.setProperty("--ambientMaterialMax", "#FFFFFF");
      style.setProperty("--specularMaterialMax", "#FFFFFF");
      style.setProperty("--emissionMaterialMax", "#FFFFFF");
   }
}

function getMaterialList(labelId, id) {
   const listView = document.querySelector(id); // get <ul>
   const label = document.querySelector(labelId);
   if (label && listView) {
      return new MaterialList(label, listView);
   }
   // console log error
   return null;
};

export {
   getTreeView,
   getImageList,
   getMaterialList,
}