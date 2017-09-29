/*
   wings3d, ui and ui utility functions. including tutor.

*/


class TutorStep {
   constructor(tour, title, text, target, placement, buttons) {
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
      const _this = {tours: {}};
      const _rail = {stops: new Map, routes: [], currentStation: -1};
      function extractElement(className) {
         const nodeList = _this.popUp.bubble.getElementsByClassName(className);
         if (nodeList.length > 0) {
            return nodeList[0];
         }
         return undefined;
      }
    
      // default 
      _this.popUp = { bubble: document.getElementById('tutorGuide') };
      if (_this.popUp.bubble) {
         _this.popUp.close = extractElement("close");
         if (_this.popUp.close) { // get close
            _this.popUp.close.addEventListener('click', function(e) {
               _this.cancel();
            });
         }
         _this.popUp.next = extractElement("next");
         if (_this.popUp.next) {
            _this.popUp.next.addEventListener('click', function(ev){
               if (_this.popUp.next.textContent === "Done") {
                  _this.complete();
               } else {
                  _this.goNext();
               }
            });
         }
         //
         _this.popUp.title = extractElement("tutor-title");
         _this.popUp.content = extractElement("tutor-content");
         //
      // 
         _this.addStep = function(nameId, title, text, target, placement, stepOptions) {
               if (_rail.stops.has(nameId)) {
                  console.log("bad step: already has ", nameId);
                  return;
               }
               // create a new step, and put it into rail
               const step = new TutorStep(this, title, text, target, placement);
               _rail.stops.set(nameId, _rail.routes.length);
               _rail.routes.push(step);

         };

         _this._play = function(stepNumber) {
            if ((stepNumber < 0) || (stepNumber >= _rail.routes.length)) {
               console.log("bad step number in tutor guide");
            } else {
               if (stepNumber === (_rail.routes.length-1)) {
                  // change the NextButton to DoneButton
                  _this.popUp.next.textContent = "Done";
               }
               _rail.currentStation = stepNumber;
               const step = _rail.routes[stepNumber];
               // apply data
               _this.popUp.title.textContent = step.title;
               _this.popUp.content.innerHTML = step.content;
               _this.popUp.bubble.classList.remove("left", "right", "top", "bottom");
               _this.popUp.bubble.classList.add(Wings3D.ui.getArrow(step.placement));
               // now place it
               const placement = Wings3D.ui.placement(step.target, step.placement, _this.popUp.bubble);
               _this.popUp.bubble.style.top = placement.top.toString() + "px";
               _this.popUp.bubble.style.left = placement.left.toString() + "px"; 
               step.interact();
            }
         };
    
         _this.startTour = function(stepArray) {
            //myObj.hasOwnProperty('key')
            if (stepArray) {

            }
            // onto the world
            _this.popUp.bubble.classList.remove("hide");
            // display firstStep
            _this._play(0);
         }
    
         _this.complete = function() {
            _this.cancel();
         };
    
         _this.cancel = function() {
            _this.popUp.bubble.classList.add("hide");
            _this.popUp.next.textContent = "Next";
            _rail.stops.clear();
            _rail.routes.length = 0;
            _rail.currentStation = -1;
         };
    
         _this.goNext = function() { _this._play(_rail.currentStation+1); };
    
         _this.goBack = function() { _this._play(_rail.currentStation-1); };
    
         _this.goTo = function(id) {};

         return _this;
      } else { // should we create tour-bubble instead?
         return undefined;
      }
   }(Wings3D.ui));

   Wings3D.ui.getArrow = function(placement) {
      if (placement === "bottom") {
         return "top";
      } else if (placement === "top") {
         return "bottom";
      } else if (placement === "left") {
         return "right";
      } else if (placement === "right") {
         return "left";
      }
      return "";
   };

   // placement.
   Wings3D.ui.placement = function(targetId, placement, bubble) {
      let target = document.getElementById(targetId);
      if (!target) {
         target = document.body;
      }

      // get the size of bubble.
      const bubbleRect = bubble.getBoundingClientRect();
      bubbleRect.top -= window.scrollY;
      bubbleRect.left -= window.scrollX;

      // get the location and size of target
      const targetRect = target.getBoundingClientRect();
      targetRect.top -= window.scrollY;
      targetRect.left -= window.scrollX;

      // now compute the target position.
      if (placement === "bottom") {
         let x = Math.round((targetRect.width / 2) - (bubbleRect.width /2));
         x += targetRect.left;
         let y = targetRect.height;
         y += targetRect.top;
         return { top: y, left: x };
      } else if (placement === "top") {
         let x = Math.round((targetRect.width / 2) - (bubbleRect.width /2));
         x += targetRect.left;
         let y = targetRect.top - bubbleRect.height;
         return { top: y, left: x };
      }
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