//
// interact. tutoring.
//
import * as UI from './wings3d_ui';
import * as Wings3D from './wings3d';


class TutorStep {
   constructor(title, text, targetID, placement) {
     this.targetID = targetID;
     this.placement = placement;
     this.title = title;
     this.content = text;
   }

   // do functions along recursively up the parent
   static walkupDoms(target, ancestorTarget, fn) {
      if (target) {
         const parent = target.parentNode;
         for (let element = parent.firstElementChild; element; element = element.nextElementSibling) {
            if (element !==target) {
               fn(element);
            }           
         }
         if (parent !== ancestorTarget) {
            this.walkupDoms(parent, ancestorTarget, fn);
         }

      } else { // select all parent's childern
         for (let element = ancestorTarget.firstElementChild; element; element = element.nextElementSibling) {
            fn(element);
         }
      }
   }

   done() {
      // unblur all other id
      let target;
      if (this.targetID !== '') {
         target = document.getElementById(this.targetID);
      }
      TutorStep.walkupDoms(target, document.body, function(element) {element.classList.remove('unfocus');});
   }

   expect(action, value) {}

   show() {
      // place on  the world.
      popUp.title.textContent = this.title;
      popUp.content.innerHTML = this.content;
      popUp.bubble.classList.remove("left", "right", "top", "bottom");
      popUp.bubble.classList.add(UI.getArrow(this.placement));
      // now place it
      const placement = UI.placement(this.targetID, this.placement, popUp.bubble);
      popUp.bubble.style.top = placement.top.toString() + "px";
      popUp.bubble.style.left = placement.left.toString() + "px"; 
      // blur all not ide.
      let target;
      if (this.targetID !== '') {
         target = document.getElementById(this.targetID);
      }
      TutorStep.walkupDoms(target, document.body, function(node) {node.classList.add('unfocus')});
   }
}

class ExpectStep extends TutorStep {
   constructor(expect, title, text, targetID, placement) {
      super(title, text, targetID, placement);
      this.expectAction = expect;
   }

   expect(action, value) {
      if (this.expectAction === action) { // yes, great, now we can goto next step
         goNext();
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
               goNext();
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
      popUp.select.textContent = "";    
   }

   show() {
      super.show();
      this.showSelectionCount();
   }

   showSelectionCount() {
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



//
// export variable
//
const tours = {};
let targetCage = null;

//
// internal accounting.
//
const rail = {stops: new Map, routes: [], currentStation: -1};
var popUp = {};   // needs to be hoist, so var.
// init() popup.bubble.
function init(idName) {
   // default 
   popUp.bubble = document.getElementById('tutorGuide');
   if (popUp.bubble) {
      popUp.close = extractElement("close");
      if (popUp.close) { // get close
         popUp.close.addEventListener('click', function(e) {
            cancel();
         });
      }
      popUp.next = extractElement("next");
      if (popUp.next) {
         popUp.next.addEventListener('click', function(ev){
            if (popUp.next.textContent === "Done") {
               complete();
            } else {
               goNext();
            }
         });
      }
      //
      popUp.title = extractElement("tutor-title");
      popUp.content = extractElement("tutor-content");
      popUp.select = extractElement("tutor-selection");
   }
}


function interceptLog(command, value) {
   expect(command, value);
};

function extractElement(className) {
   const nodeList = popUp.bubble.getElementsByClassName(className);
   if (nodeList.length > 0) {
      return nodeList[0];
   }
   return undefined;
};
      
function noDuplicate(nameId) {      
   if (rail.stops.has(nameId)) {
      console.log("bad step: already has ", nameId);
      return false;
   }
   return true;
};

function _addStep(nameId, step) {
   rail.stops.set(nameId, rail.routes.length);
   rail.routes.push(step);
};
    
//
function addStep(nameId, title, text, targetID, placement, stepOptions) {
   if (noDuplicate(nameId)) {
      // create a new step, and put it into rail
      _addStep(nameId, new TutorStep(title, text, targetID, placement));
   }
};

function addExpectStep(expect, nameId, title, text, targetID, placement, stepOptions) {
   if (noDuplicate(nameId)) {
      // create a new step, and put it into rail
      _addStep(nameId, new ExpectStep(expect, title, text, targetID, placement));
   }
};

function addFaceSelectStep(selection, nameId, title, text, placement, stepOptions) {
   if (noDuplicate(nameId)) {
      // create a new step, and put it into rail
      _addStep(nameId, new FaceSelectStep(selection, title, text, placement));
   }
};

function _play(stepNumber) {
   if ((stepNumber < 0) || (stepNumber >= rail.routes.length)) {
      console.log("bad step number in tutor guide");
   } else {
      if (stepNumber === (rail.routes.length-1)) {
         // change the NextButton to DoneButton
         popUp.next.textContent = "Done";
      }
      if ((rail.currentStation >= 0) && (rail.currentStation < rail.routes.length)) {
         const prevStep = rail.routes[rail.currentStation];
         prevStep.done();
      }
      rail.currentStation = stepNumber;
      const step = rail.routes[stepNumber];
      // apply data
      step.show();
   }
};
    
function startTour(stepArray) {
   Wings3D.interposeLog(interceptLog, true);
   //myObj.hasOwnProperty('key')
   if (stepArray) {

   }
   // onto the world
   popUp.bubble.classList.remove("hide");
   // display firstStep
   _play(0);
};
    
function complete() {
   cancel();
};
    
function cancel() {
   // remove all unfocus class
   if (rail.currentStation > -1) {
      rail.routes[rail.currentStation].done();
   }
   // restore to original condition
   popUp.bubble.classList.add("hide");
   popUp.next.textContent = "Next";
   rail.stops.clear();
   rail.routes.length = 0;
   rail.currentStation = -1;
   Wings3D.interposeLog(interceptLog, false);   // remove interceptLog
};
function goNext() { _play(rail.currentStation+1); };
    
function goBack() { _play(rail.currentStation-1); };
    
function goTo(id) {};

function expect(action, value) {
   if (rail.currentStation >= 0) {
      const step =  rail.routes[rail.currentStation];
      step.expect(action, value);
      if (action === "createCube") {   // 
         targetCage = value;
      }
   }
};

// register for 
Wings3D.onReady(init);

export {
   tours, targetCage,         // variable
   // functions
   addStep, addExpectStep, addFaceSelectStep,
   cancel, complete, 
   startTour,
};