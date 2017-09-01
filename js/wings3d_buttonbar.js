/*
// button toolbar for geometry ...etc. 
*/
"use strict";

function createButtonBarHandler() {
   /*
   * variable 
   */   
   var _pvt = {
      buttonBarClassName: {
         bar: ".button-bar",
         group: ".button-group",
         button: ".button",
         //link: , 
         //active: ".button-active",
      },
   };

   _pvt.executeApi = function(e) {
      var command = e.currentTarget.getAttribute("wings3d-api");
      if (command) {
         //e.preventDefault();
         help( "wings3d api - " + command);
         Wings3D.callApi(command);
      } else {
         console.log("no wings3d-api attribute defined");
      }
   };

   _pvt.clickListener = function() {
      var toolbar = document.querySelector(_pvt.buttonBarClassName.bar);
      var buttons = toolbar.querySelectorAll(_pvt.buttonBarClassName.button);
      for (var i=0; i < buttons.length; i++) {
         buttons[i].addEventListener('click', _pvt.executeApi, false);
      }
   };

   var init = function() {
      _pvt.clickListener();
   };

   return {setup: init,
           //_pvt: _pvt
          };
}