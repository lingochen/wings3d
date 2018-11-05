/**

*/

import * as View from './wings3d_view';
import * as Wings3D from './wings3d';

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
      const li = document.createElement('li');
      li.classList.add('objectName');
      // select whole object
      const whole = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_whole.png\');"></span></label>');
      let input = whole.querySelector('input');
      input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
         View.setObject([model]);
         Wings3D.runAction(0, "selectObject", ev);
       });
       li.appendChild(whole);
      // span text
      const text = document.createElement('span');
      text.textContent = model.name;
      model._textNode = text;
      li.appendChild(text);
      // eye label
      const eyeLabel = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_show.png\');"></span></label>');
      li.appendChild(eyeLabel);
      // lock/unlock
      const lockLabel = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_lock.png\');"></span></label>');
      li.appendChild(lockLabel);
      // wireframe
      const wireframe = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_wire.png\');"></span></label>');
      li.appendChild(wireframe);
      this.treeView.appendChild(li);
   }

   /**
    * remove PreviewCage from TreeView
    * @param {PreviewCage} model - the previewCage to be removed from 
    */
   removeObject(model) {
      const li = model._textNode.parentNode;
      li.parentNode.removeChild(li);
      model._textNode = undefined;
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