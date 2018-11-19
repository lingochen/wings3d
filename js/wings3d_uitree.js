/**

*/

import * as View from './wings3d_view';
import * as Wings3D from './wings3d';
import * as UI from './wings3d_ui';
import {RenameBodyCommand} from './wings3d_bodymads';


/** 
 * tree view
*/
class TreeView {
   constructor(treeView) {
      this.treeView = treeView;
      this.tree = {};
   }

   /**
    * 
    * @param {string} name - folderName <- todo: later to be replace by TransformGroup. 
    */
   createFolder(name) {
      const li = document.createElement('li');

      return li;
   }

   /**
    * 
    * @param {folderObj} parent - 
    * @param {folderObj} folder - 
    */
   addFolder(parent, folder) {   //

   }

   /**
    * add previewCage to be displayed in TreeView
    * @param {PreviewCage} model -target 
    */
   addObject(model) {
      let li = model.guiStatus.li;
      if (!li) {
         li = document.createElement('li');
         model.guiStatus.li = li;
         li.classList.add('objectName');
         // select whole object
         const whole = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_whole.png\');"></span></label>');
         let input = whole.querySelector('input');
         input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
            if (model.isLock() || !model.isVisible()) {   // not actually changeable
               ev.target.checked = !ev.target.checked;
               return;
            }
            View.setObject([model]);
            Wings3D.runAction(0, "toggleObjectSelect", ev);
          });
         model.guiStatus.select = input;
         li.appendChild(whole);
         // span text
         const text = document.createElement('span');
         text.textContent = model.name;
         model.guiStatus.textNode = text;
         const entry = function(ev) {
            if (ev.keyCode == 13) {
               // rename if different
               if (this.textContent !== model.name) {
                  const data = {};
                  data[model.name] = this.textContent;
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
         text.addEventListener('contextmenu', function(ev) {
            ev.preventDefault();
            let contextMenu = document.querySelector('#geometryGraphText');
            if (contextMenu) {
               UI.positionDom(contextMenu, UI.getPosition(ev));
               UI.showContextMenu(contextMenu);
               View.setObject([model]);
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
            View.setObject([model]);
            Wings3D.runAction(0, "toggleObjectVisibility", ev);   
          });
         model.guiStatus.visibility = input;
         li.appendChild(eyeLabel);
         // lock/unlock
         const lockLabel = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_unlock.png\');"></span></label>');
         input = lockLabel.querySelector('input');
         input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
            View.setObject([model]);
            Wings3D.runAction(0, "toggleObjectLock", ev);
          });
         li.appendChild(lockLabel);
         model.guiStatus.locked = input;
         // wireframe
         const wireframe = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_wire.png\');"></span></label>');
         input = wireframe.querySelector('input');
         input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
            View.setObject([model]);
            Wings3D.runAction(0, "toggleWireMode", ev);
          });
         li.appendChild(wireframe);
      }
      this.treeView.appendChild(li);
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

}

function getTreeView(id) {
   const treeView = document.querySelector(id); // get <ul>
   if (treeView) {
      return new TreeView(treeView);
   }
   // console log error
   return null;
};

export {
   getTreeView
}