/**

*/

import * as View from './wings3d_view';
import * as Wings3D from './wings3d';

//---- utility function
function editable(_ev) {
   this.contentEditable = true;
   this.focus();
};
function unEditable(_ev) {
   this.contentEditable = false;
}

/** 
 * tree view
*/
class TreeView {
   constructor(treeView) {
      this.treeView = treeView;
      this.tree = {};
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
            View.setObject([model]);
            Wings3D.runAction(0, "toggleSelectObject", ev);
          });
         model.guiStatus.select = input;
         li.appendChild(whole);
         // span text
         const text = document.createElement('span');
         text.textContent = model.name;
         model.guiStatus.textNode = text;
         text.addEventListener('dblclick', editable);
         text.addEventListener('blur', unEditable);
         li.appendChild(text);
         // eye label
         const eyeLabel = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_show.png\');"></span></label>');
         input = eyeLabel.querySelector('input');
         input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
            View.setObject([model]);
            Wings3D.runAction(0, "toggleSelectObject", ev);
          });
         model.guiStatus.visibility = input;
         li.appendChild(eyeLabel);
         // lock/unlock
         const lockLabel = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_lock.png\');"></span></label>');
         li.appendChild(lockLabel);
         // wireframe
         const wireframe = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_wire.png\');"></span></label>');
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