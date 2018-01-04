/*
// button toolbar for geometry ...etc. 
*/

import * as View from './wings3d_view';
import * as Wings3D from './wings3d';

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


function init() {
   const toolbar = document.querySelector(buttonBarClassName.bar);
   const buttons = toolbar.querySelectorAll('div input');
   for (let button of buttons) {
      const func = View.id2Fn(button.id);
      if (func) {
         button.addEventListener('click', function(ev) {
            //ev.preventDefault();
            help( "wings3d - " + ev.currentTarget.id);
            func();
         }, false);
      }
   }
};


Wings3D.onReady(init);