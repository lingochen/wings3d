/*
// button toolbar for geometry ...etc. 
*/

import * as View from './wings3d_view';
import * as Wings3D from './wings3d';
import * as UI from './wings3d_ui';

   /*
   * variable 
   */   
const buttonBarClassName = {
         bar: ".button-bar",
         group: ".button-group",
         button: ".button",
         //link: , 
         //active: ".button-active",
      };

//
// needs refactoring.
function init() {
   const toolbar = document.querySelector(buttonBarClassName.bar);
   const buttons = toolbar.querySelectorAll('div label');
   for (let button of buttons) {
      const func = View.id2Fn(button.id);
      if (func) {
         UI.bindMenuItem(button.id, function(ev) {
            //ev.preventDefault();
            help( "wings3d - " + ev.currentTarget.id);
            func();
          });
      }
   }
};


Wings3D.onReady(init);