/** 

*/

import * as Wings3D from './wings3d.js';
import * as UI from './wings3d_ui.js';

const gConstraints = {
   x: false,
   y: false,
   z: false,
};


function tweakConstraint(inVec) {
   if (gConstraints.x || gConstraints.y || gConstraints.y) {
      const outVec = [0,0,0];
      if (gConstraints.x) {
         outVec[0] = inVec[0];
      }
      if (gConstraints.y) {
         outVec[1] = inVec[1];
      }
      if (gConstraints.z) {
         outVec[2] = inVec[2];
      }
      return outVec;
   }
   // else 

   return inVec;
};


Wings3D.onReady(()=>{
   UI.bindMenuItem(Wings3D.action.constraintX.name, function(ev) {
      gConstraints.x = !gConstraints.x;
      const check = document.querySelector('input[data-menuid="constraintX"');
      if (check !== ev.target) { // don't toggle the checkbox that trigger the event, it mess up the state
         check.checked = gConstraints.x;
      }
   });

   UI.bindMenuItem(Wings3D.action.constraintY.name, function(ev) {
      gConstraints.y = !gConstraints.y;
      const check = document.querySelector('input[data-menuid="constraintY"');
      if (check !== ev.target) { // don't toggle the checkbox that trigger the event, it mess up the state
         check.checked = gConstraints.y;
      }
   });

   UI.bindMenuItem(Wings3D.action.constraintZ.name, function(ev) {
      gConstraints.z = !gConstraints.z;
      const check = document.querySelector('input[data-menuid="constraintZ"');
      if (check !== ev.target) { // don't toggle the checkbox that trigger the event, it mess up the state
         check.checked = gConstraints.z;
      }
   });
   
});


export {
   tweakConstraint,
};