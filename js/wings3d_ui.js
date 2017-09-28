/*
   wings3d, ui and ui utility functions. including tutor.

*/


class TutorStep {
   constructor(tour, title, text, target, placment, buttons) {
     this.tour = tour;
     this.target = target;
     this.placement = placement;
     this.title = title;
     this.content = text;
     
   }

   interact() {}
}

function createUi(Wings3D) {

   Wings3D.ui = {};

   Wings3D.ui.tutor = (function(ui) {
      const _this = {};
      const _rail = {stops: new Map, routes: []};
    
      // default 
      _this.popUp = { bubble: document.getElementById('tutorGuide') };
      if (_this.popUp.bubble) {
         _this.popUp.close = _this.popUp.bubble.getElementsByClassName("close");
         if (_this.popUp.close.length > 0) { // get close
            _this.popUp.close = _this.popUp.close[0];
            _this.popUp.close.addEventListener('click', function(e) {
               _this.popUp.bubble.classList.add("hide");
               // remove object from world.
               //_pvt.cancelPreview();
            });
         }
         //_this.popUp.title = _this.popUp.bubble.createElement('p');
         //_this.popUp.content = document.createElement('p');
      // 
         _this.addOneStep = function(title, text, target, placement, stepOptions) {
               if (_rail.stops.has(title)) {
                  console.log("bad step: already has ", title);
                  return;
               }
               // create a new step, and put it into rail
               const step = new TutorStep(this, title, text, target, placement);
               _rail.stops.add(nameId, step);
               _rail.routes.push(step);
         };
    
         _this.startTour = function(stepArray) {
            //myObj.hasOwnProperty('key')
            if (stepArray) {

            }
            // onto the world
            _this.popUp.bubble.classList.remove("hide");
         }
    
         _this.complete = function() {};
    
         _this.cancel = function() {};
    
         _this.goNext = {};
    
         _this.goBack = {};
    
         _this.goTo = function(id) {};

         return _this;
      } else { // should we create tour-bubble instead?
         return undefined;
      }
   }(Wings3D.ui));

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