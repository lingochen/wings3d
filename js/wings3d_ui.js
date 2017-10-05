/*
   wings3d, ui and ui utility functions. including tutor.

*/


class TutorStep {
   constructor(tour, title, text, target, placement) {
     this.tour = tour;
     this.target = target;
     this.placement = placement;
     this.title = title;
     this.content = text;
   }

   done() {}

   expect(action, value) {}

   show() {
      const popUp = this.tour.popUp;
      // place on  the world.
      popUp.title.textContent = this.title;
      popUp.content.innerHTML = this.content;
      popUp.bubble.classList.remove("left", "right", "top", "bottom");
      popUp.bubble.classList.add(Wings3D.ui.getArrow(this.placement));
      // now place it
      const placement = Wings3D.ui.placement(this.target, this.placement, popUp.bubble);
      popUp.bubble.style.top = placement.top.toString() + "px";
      popUp.bubble.style.left = placement.left.toString() + "px"; 
   }

}

class ExpectStep extends TutorStep {
   constructor(tour, expect, title, text, target, placement) {
      super(tour, title, text, target, placement);
      this.expectAction = expect;
   }

   expect(action, value) {
      if (this.expectAction === action) { // yes, great, now we can goto next step
         this.tour.goNext();
      }
   }
}

class SelectStep extends TutorStep {
   constructor(tour, selections, title, text, placement) {
      super(tour, title, text, "", placement);
      if (Number.isInteger(selections)) {
         this.count = selections;
         this.countDown = selections;
      } else {
         this.selections = selections;
         this.countDown = new Set(selections);
      } 
   }

   expect(action, value) {
      if (action === this.modeSelect) {
         // now check inside the array. if the array is empty. check number.
         if (this.count !== undefined) {
            if(--this.countDown === 0) {
               this.tour.goNext();
            } else {
               this.showSelectionCount();
            }
         } else {
            if (this.countDown.has(value)) {
               this.countDown.delete(value);
               this.showSelectionCount();
            }
         }
      }
   }

   done() {
      this.tour.popUp.select.textContent = "";    
   }

   show() {
      super.show();
      this.showSelectionCount();
   }

   showSelectionCount() {
      const popUp = this.tour.popUp;
      if (this.count !== undefined) {
         popUp.select.textContent = "selection " + (this.count - this.countDown).toString() + " of " + (this.count).toString();
      } else {
            // popUp.select.textContent = (this.selections.size - this.countDown.size).toString() + " of " + (this.selections.size).toString();
      }
   }
}

class FaceSelectStep extends SelectStep {
   constructor(tour, selections, title, text, placement) {
      super(tour, selections, title, text, placement);
      this.modeSelect = "faceSelectOn";
   }
}

class EdgeSelectStep extends SelectStep {
}

function createUi(Wings3D) {
   Wings3D.ui = {};

   Wings3D.ui.tutor = (function(ui) {
      const _this = {tours: {}, targetCage: null};
      const _rail = {stops: new Map, routes: [], currentStation: -1};
      let oldLog;
      function interceptLog(command, value) {
         oldLog(command, value);
         _this.expect(command, value);
      }
      function extractElement(className) {
         const nodeList = _this.popUp.bubble.getElementsByClassName(className);
         if (nodeList.length > 0) {
            return nodeList[0];
         }
         return undefined;
      }
      function noDuplicate(nameId) {
         if (_rail.stops.has(nameId)) {
            console.log("bad step: already has ", nameId);
            return false;
         }
         return true;
      }
      function addStep(nameId, step) {
         _rail.stops.set(nameId, _rail.routes.length);
         _rail.routes.push(step);
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
         _this.popUp.select = extractElement("tutor-selection");
         //
         _this.addStep = function(nameId, title, text, target, placement, stepOptions) {
            if (noDuplicate(nameId)) {
               // create a new step, and put it into rail
               addStep(nameId, new TutorStep(this, title, text, target, placement));
            }
         };

         _this.addExpectStep = function(expect, nameId, title, text, target, placement, stepOptions) {
            if (noDuplicate(nameId)) {
               // create a new step, and put it into rail
               addStep(nameId, new ExpectStep(this, expect, title, text, target, placement));
            }
         };

         _this.addFaceSelectStep = function(selection, nameId, title, text, placement, stepOptions) {
            if (noDuplicate(nameId)) {
               // create a new step, and put it into rail
               addStep(nameId, new FaceSelectStep(this, selection, title, text, placement));
            }
         };

         _this._play = function(stepNumber) {
            if ((stepNumber < 0) || (stepNumber >= _rail.routes.length)) {
               console.log("bad step number in tutor guide");
            } else {
               if (stepNumber === (_rail.routes.length-1)) {
                  // change the NextButton to DoneButton
                  _this.popUp.next.textContent = "Done";
               }
               if ((_rail.currentStation >= 0) && (_rail.currentStation < _rail.routes.length)) {
                  const prevStep = _rail.routes[_rail.currentStation];
                  prevStep.done();
               }
               _rail.currentStation = stepNumber;
               const step = _rail.routes[stepNumber];
               // apply data
               step.show();
            }
         };
    
         _this.startTour = function(stepArray) {
            oldLog = Wings3D.log;
            Wings3D.log = interceptLog;
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
            if (oldLog) {
               Wings3D.log = oldLog;
            }
         };
    
         _this.goNext = function() { _this._play(_rail.currentStation+1); };
    
         _this.goBack = function() { _this._play(_rail.currentStation-1); };
    
         _this.goTo = function(id) {};

         _this.expect = function(action, value) {
            if (_rail.currentStation >= 0) {
               const step =  _rail.routes[_rail.currentStation];
               step.expect(action, value);
               if (action === "createCube") {   // 
                  this.targetCage = value;
               }
            }
         };

         return _this;
      } else { // should we create tour-bubble instead?
         return undefined;
      }
   }(Wings3D.ui));

   Wings3D.ui.getArrow = function(placement) {
      if (placement === "bottom") {
         return "top";
      } else if (placement === "bottom-start") {
         return "top";
      } else if (placement === "top") {
         return "bottom";
      } else if (placement === "top-start") {
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
      // get the size of bubble.
      const bubbleRect = bubble.getBoundingClientRect();

      let target;
      let targetRect;
      if (targetId === "") { // no target, then point at the workarea's center
         target = document.getElementById("glcanvas");
         const rect = target.getBoundingClientRect();
         targetRect = {left: Math.round(rect.left+rect.width/2), 
                       top: Math.round(rect.top+rect.height/2), 
                       width: 1, height: 1};
      } else {
         target = document.getElementById(targetId);
         // get the location and size of target
         targetRect = target.getBoundingClientRect();
      }

      let x=targetRect.left - window.scrollX, y=targetRect.top - window.scrollY;
      // now compute the target position.
      if (placement === "bottom") {
         x += Math.round((targetRect.width / 2) - (bubbleRect.width /2));
         y += targetRect.height;
         return { top: y, left: x };
      } else if (placement ==="bottom-start") {
         x += Math.round((targetRect.width / 8) - (bubbleRect.width /2));
         y += targetRect.height;
         return { top: y, left: x};
      } else if (placement === "top") {
         x += Math.round((targetRect.width / 2) - (bubbleRect.width /2));
         y -= bubbleRect.height;
         return { top: y, left: x };
      } else if (placement === "top-start") {
         x += Math.round((targetRect.width / 8) - (bubbleRect.width /2));
         y -= bubbleRect.height;
         return { top: y, left: x};
      } else if (placement === "right") {
         x += targetRect.width;
         y += Math.round((targetRect.height/2) - (bubbleRect.height/2));
         return {top: y, left: x};
      } else if (placement === "left") {        
         x -= bubbleRect.width;
         y += Math.round((targetRect.height/2) - (bubbleRect.height/2));
         return {top: y, left: x};
      }
   };

   // menuBar
   function initMenubar() {
      // bind on hover function (mouseEnter, mouseLeave, )
      let dropdowns = document.querySelectorAll("#menubar .dropdown");
      for (let dropdown of dropdowns) {
         dropdown.addEventListener("mouseenter", function(ev) {
            dropdown.classList.add("hover");
         });
         dropdown.addEventListener("mouseleave", function(ev) {
            dropdown.classList.remove("hover");
         });
      }
   }

   initMenubar();
};