/*
// button toolbar for geometry ...etc. 
*/

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
const id2Func = new Map;

function executeApi(ev) {
   let command = ev.currentTarget.id;
   if (command) {
      //e.preventDefault();
      help( "wings3d - " + command);
      const func = id2Func.get(command);
      func(ev);
   } else {
      console.log("no id attribute defined");
   }
};

function init() {
   const toolbar = document.querySelector(buttonBarClassName.bar);
   const buttons = toolbar.querySelectorAll(buttonBarClassName.button);
   for (let button of buttons) {
      button.addEventListener('click', executeApi, false);
   }
};


export {
   id2Func,
};

Wings3D.onReady(init);