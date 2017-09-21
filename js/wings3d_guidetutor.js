/*
//
// introductory tutorials. 
/// later expand to our own tutorial format and editor?
//
*/
"use strict";

function createGuideTutor() {
   const my = {}; // introductory material

   my.introduction = function() {
      let tour = new Shepherd.Tour({
         defaults: {
            classes: 'shepherd-theme-arrows',
            scrollTo: true
         }
      });

      tour.addStep('example-step', {
         text: `This step is attached to the bottom of the <code>. 
                example-css-selector</code> element.`,
         classes: 'shepherd shepherd-open shepherd-theme-arrows shepherd-transparent-text',
         buttons: [{
            text: 'Next',
            action: tour.next
         }]
      });

      tour.addStep('Information Line', {
         text: `<h3>This is the information Line.</h3>
            <ul> 
               <li>L, M, and R are used in the info line to indicate commands initiated by the Left, Middle, and Right mouse buttons.</li>
               <li>Uppercase letters in square brackets represent keyboard keys like [C].</li>
               <li>Numbers in square brackets represent number keys on the keyboard like [1], [2], [3].</li>
               <li>[Shift], [Ctrl], and [Alt] are keyboard modifier keys.</li>
            </ul>`,
         attachTo: '.footer top',
         classes: 'shepherd shepherd-open shepherd-theme-arrows shepherd-transparent-text',
         buttons: [{
            text: 'Next',
            action: tour.next
         }]
      }); 

      // start the tour
      tour.start();
   };

   return my;
};