/*
//
// introductory tutorials. 
/// later expand to our own tutorial format and editor?
//
*/
"use strict";

function createGuideTour(tutor) {
   //tutor.addStep();

   tutor.tours.introduction = () => {
      // add step into tutor
      tutor.addStep("Welcome", "", "Wings3D4Web is a web implementation of Wings3D modeller." +
       "Goto <a target='_blank' href='http://www.wings3d.com/?page_id=87'>Wings3D documentation page</a> for more information",
       "statusbar", "bottom"
      );
      tutor.addStep("StatusBar", "Help Bar", "This is the help bar",
       "helpbar", "top"
      );
   
      // show 
      tutor.startTour();
   };
   Wings3D.bindMenuItem("#introduction", (ev) => {
      tutor.tours.introduction();
   });

}