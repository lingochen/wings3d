/*
//
// introductory tutorials. 
/// later expand to our own tutorial format and editor?
//
*/
"use strict";

function createGuideTour(tutor) {
   //tutor.addStep();

   tutor.tours.about = () => {
      tutor.cancel();
      tutor.addStep("Welcome", "", "<p>Wings3D4Web is a web implementation of Wings3D modeller</p>" +
       "<p>Use Help's interactive learning aid</p>" +
       "<p>Or goto <a target='_blank' href='http://www.wings3d.com/?page_id=87'>Wings3D documentation page</a> for more instruction.</p>",
       "helpMenu", "bottom"
      );
      tutor.startTour();
   };

   tutor.tours.introduction = () => {
      tutor.cancel();
      // add step into tutor
      tutor.addStep("Welcome", "Interface Essential", `Wings 3D interface keeps the focus on modeling. It consists of 
         <ul>
          <li>Menubar</li>
          <li>Toolbar</li>
          <li>Geometry Info</li>
          <li>Modelling Area</li>
          <li>Information Line</li>
         </ul>`,
         "", "top"
      );
      tutor.addStep("Status", "Geometry Info", "Shown information about the current Model if any",
       "statusbar", "bottom-start"
      );
      tutor.addStep("Information", "Information Line", 
       `<ul>
         <li>Hovering over almost anything in Wings displays its function in the info line.</li>
         <li><mark>L, M</mark>, and <mark>R</mark> are used in the info line to indicate commands initiated by the <em>Left, Middle</em>, and <em>Right</em> mouse buttons.</li>
         <li>Uppercase letters in square brackets represent keyboard keys like <mark>[C]</mark>.</li>
         <li>Numbers in square brackets represent number keys on the keyboard like <mark>[1], [2], [3]</mark>.</li>
         <li><mark>[Shift], [Ctrl]</mark>, and <mark>[Alt]</mark> are keyboard modifier keys.</li>
        </ul>`,
       "helpbar", "top-start"
      );
      tutor.addStep("Undo", "undo/redo", "undo button revert the last operation",
       "undoEdit", "bottom"
      );
      tutor.addStep("Redo", "undo/redo", "redo button revert the last undo operation",
       "redoEdit", "bottom"
     );
   
      // show 
      tutor.startTour();
   };
   tutor.tours.basicModelling = () => {
      

      // show
      tutor.startTour();
   };
   Wings3D.bindMenuItem("#about", (ev) => {
      tutor.tours.about();
   });
   Wings3D.bindMenuItem("#introduction", (ev) => {
      tutor.tours.introduction();
   });

}