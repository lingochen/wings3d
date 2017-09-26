/*
   wings3d, ui and ui utility functions.

*/

function createUi(Wings3D) {


   Wings3D.ui = {};

   Wings3D.ui.placement = function() {
   };

   // menuBar
   function initMenubar() {
      // bind on hover function (mouseEnter, mouseLeave, )
      let bar = document.getElementById("menubar");
      if (bar) {
         let dropdowns = bar.getElementsByClassName("dropdown");
         for (let dropdown of dropdowns) {
            dropdown.addEventListener("mouseenter", function(ev) {
               dropdown.classList.add("hover");
            });
            dropdown.addEventListener("mouseleave", function(ev) {
               dropdown.classList.remove("hover");
            });
         }
      }
   }

   initMenubar();
};