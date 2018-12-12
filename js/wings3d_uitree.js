/**
 * treeView gui

*/

import * as View from './wings3d_view';
import * as Wings3D from './wings3d';
import * as UI from './wings3d_ui';
import {RenameBodyCommand, BodyMadsor} from './wings3d_bodymads';

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

/**
 * for material, image, lights
 */
class ListView {
   constructor(label, listView) {
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
         const dat = {img: null, li: null, name: null, popup: null};
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

function getListView(labelId, id) {
   const listView = document.querySelector(id); // get <ul>
   const label = document.querySelector(labelId);
   if (label && listView) {
      return new ListView(label, listView);
   }
   // console log error
   return null;
};

export {
   getTreeView,
   getListView,
}