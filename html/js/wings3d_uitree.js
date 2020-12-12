/**
 * treeView gui

*/

import * as View from './wings3d_view.js';
import * as Wings3D from './wings3d.js';
import * as UI from './wings3d_ui.js';
import * as Util from './wings3d_util.js';
import {Material, Texture} from './wings3d_material.js';
import * as PbrSphere from './wings3d_materialsphere.js';
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

PreviewGroup.prototype.addGuiStatus = function(treeView, parentUL) {
   // add here,
   treeView.addGroup(parentUL, this);

   // call all children to do the same
   for (let node of this.group) {
      node.addGuiStatus(treeView, this.guiStatus.ul);
   }
};

PreviewGroup.prototype.removeGuiStatus = function(treeView) {
   treeView.removeObject(this);
};

// update guiStatus
PreviewGroup.prototype.updateCount = function() {
   let count = 0;
   for (let node of this.group) {
      count += node.updateCount();
   }
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

PreviewCage.prototype.addGuiStatus = function(treeView, parentUL) {
   treeView.addObject(this, parentUL);
}

PreviewCage.prototype.removeGuiStatus = function(treeView) {
   treeView.removeObject(this);
}

PreviewCage.prototype.updateCount = function() {   // does nothing, just return 1
   return 1;  
}

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

   // toggle cage selection status.
   updateStatus(world) {
      let count = 0;
      for (let node of world.getCage()) {
         if (!node.isVisible() || !node.hasSelection()) {
            if (node.guiStatus.select && node.guiStatus.select.checked) {
               node.guiStatus.select.checked = false;
            }
         } else {
            if (node.guiStatus.select && !node.guiStatus.select.checked) {
               node.guiStatus.select.checked = true;
            }
         }
         ++count;
      }
      return count;
   };

   updateCount(world) {
      return world.updateCount();
   };

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


   addNode(node, parent) {
      node.addGuiStatus(this, parent.guiStatus.ul);
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
         const range = document.createRange();
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
         const whole = range.createContextualFragment('<label><input type="checkbox"><span class="smallIcon smallWhole"></span></label>');
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
         const eyeLabel = range.createContextualFragment('<label><input type="checkbox"><span class="smallIcon smallShow"></span></label>');
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
         const lockLabel = range.createContextualFragment('<label><input type="checkbox"><span class="smallIcon smallUnlock"></span></label>');
         input = lockLabel.querySelector('input');
         input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
            View.setObject(model.parent, [model]);
            Wings3D.runAction(0, "toggleObjectLock", ev);
          });
         li.appendChild(lockLabel);
         model.guiStatus.locked = input;
         // wireframe
         const wireframe = range.createContextualFragment('<label><input type="checkbox"><span class="smallIcon smallWire"></span></label>');
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
      //model._textNode = undefined;
   }


   /**
    * 
    */
   removeNode(model) {
      model.removeGuiStatus(this);
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
   constructor(listView) {
      this.view = listView;
      this.list = [];
   }

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

   /**
    * return array iterator
    */
   [Symbol.iterator]() {
      return this.list[Symbol.iterator]();
   }
}


/**
 * for material, image, lights
 */
class ImageList extends ListView {
   constructor(label, listView) {
      super(listView);
      // context menu
      let contextMenu = document.querySelector('#importImageMenu');
      if (contextMenu) {
         label.addEventListener('contextmenu', function(ev) {
            ev.preventDefault();
            UI.positionDom(contextMenu, UI.getPosition(ev));
            UI.showContextMenu(contextMenu);
          }, false);
      }
      this.popup = UI.showPopup();
   }

   buildImageItem(texture) {
      const image = document.createElement('wings3d-image');
      image.texture = texture;
      this.view.appendChild(image);

      return image;
   }

   loadTexture(texture) {
      this.buildImageItem(texture);
   }

   showImage(images) {
      const img = images[0];
      const wrap = this.popup.querySelector('.wrap');
      while (wrap.firstChild) {
         wrap.removeChild(wrap.lastChild);
      }
      wrap.appendChild(img.texture.image);
      const h3 = this.popup.querySelector('h3');
      h3.textContent = img.texture.name;
      // now show
      document.body.appendChild(this.popup);
   }

   deleteImage(images) {
      const image = images[0];
      if (Texture.release(image.texture)) {
         // remove li
         if (image.ui) {
            this.view.removeChild(image.ui);
         }
      } else {
         alert("Texture is still in use");
      }
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
}

class MaterialList extends ListView {
   constructor(label, listView) {
      super(listView);
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

   /**
    * 
    * @param {*} material - material
    */
   addMaterial(material) {
      const dat = material;

      const mat = document.createElement('wings3d-material');
      // also put on subMenu.
      if (!this.submenu) {
         this.submenu = document.querySelector('[data-menuid="faceMaterialMenu"]');
         if (this.submenu) {
            this.submenu = this.submenu.nextElementSibling;  // the ul
         }
      }
      if (this.submenu) {
         mat.menu = {};
         let li = mat.menu.li = document.createElement('li');
         let aFrag = document.createRange().createContextualFragment('<a></a>');
         mat.menu.a = aFrag.firstElementChild; 
         li.appendChild(aFrag);
         let nameFrag = document.createRange().createContextualFragment(`<span>${dat.name}</span>`);
         mat.menu.text = nameFrag.firstElementChild;
         mat.menu.a.appendChild(nameFrag);
         let square = document.createRange().createContextualFragment('<span style="width: 1rem;"></span>');
         mat.menu.color = square.firstElementChild; 
         mat.menu.a.appendChild(square);
         mat.menu.color.style.backgroundColor = Util.rgbToHex(...dat.pbr.baseColor);

         mat.menu.a.addEventListener('click', function(ev){
            View.setObject(null, [dat]);       
            Wings3D.runAction(ev.button, "assignMaterial", ev);
          });
         this.submenu.prepend(li); // put on submenu
      }
      // set mat value
      mat.material = material;
      if (material === Material.default) {
         mat.default = true;
      }

      this.view.appendChild(mat);
      this.list.push(dat);

      return mat;
   }

   createMaterial(ev) {
      const newName = this.newName();
      const mat = this.addMaterial(Material.create(newName));
      mat.editMaterial(ev);
   }

   duplicateMaterial(objects) {
      const dat = objects[0]._mat;
      let name = dat.name.split(/\d+$/);
      if (name.length > 1) {
         name = name[0] + (parseInt(dat.name.match(/\d+$/), 10) + 1);
      } else {
         name = dat.name + '2';
      }
      this.addMaterial(Material.create(name, dat.pbr));
   }

   deleteMaterial(objects) {  // default and in-use material is not deletable.
      const mat = objects[0];
      if (mat.default) {   // default material is not deletable.
         return;
      }
      // remove li
      this.view.removeChild(mat);
      // remove from list
      this.list.splice(this.list.indexOf(mat._mat), 1);
      // remove from submenu
      this.submenu.removeChild(mat.menu.li);
      // remove from Material.
      Material.release(mat._mat);
   }

   newName() {
      return `New Material ${this.list.length}`;
   }

   renameMaterial(ev, objects) {
      const mat = objects[0];
      if (mat.default) {   // default material cannot be renamed
         return;
      }
      // run rename dialog
      UI.runDialog('#renameDialog', ev, function(form) {
         const data = UI.extractDialogValue(form);
         mat.rename(data[mat._mat.uuid]);
      }, function(form) {
         UI.addLabelInput(form, [mat._mat]);
      });
   }

   static resetCSS() {
      const style = document.documentElement.style;
      style.setProperty("--baseColorMax", "#FFFFFF");
      style.setProperty("--emissionMax", "#FFFFFF");
   }
}

function getMaterialList(labelId, id) {
   const listView = document.querySelector(id); // get <ul>
   const label = document.querySelector(labelId);
   if (label && listView) {
      const ret = new MaterialList(label, listView);
      ret.addMaterial(Material.default);
      return ret;
   }
   // console log error
   return null;
};

export {
   getTreeView,
   getImageList,
   getMaterialList,
}