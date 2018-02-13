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
     this.options = {};
     this.options.showNext = true;
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

      } else { // select all parent's childern, except canvas
         for (let element = ancestorTarget.firstElementChild; element; element = element.nextElementSibling) {
            if (element.id !== "canvas") {
               fn(element);
            }
         }
      }
   }

   cancel() {
      this.done();
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

   option(name) {
      return this.options[name];
   }

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


class MultiStep extends TutorStep {
   constructor(title, text, targetID, placement, steps) {
      super(title, text, targetID, placement);
      this.steps = steps;
      this.endStep = steps[steps.length-1].step;
   }

   cancel() {
      super.cancel();
      // remember to clean up.
      setMultiStep(null);
   }

   done() {
      const realStep = getRealCurrentStep();
      if (realStep  === this) {
         super.done();
      } else { // let substep handle it.
         realStep.done();
         if (realStep === this.endStep) {
            // should we insert an repeat again? congratulation? or something?
            setMultiStep(null);
            popUp.progressBar.style.display = 'none';
            popUp.progressDone.style.width = '0%';
            popUp.progressIndicator.style.width = '0%';
         }
      }
   }

   // let substep handle it.
   expect(action, value) {
      const realStep = getRealCurrentStep();
      if (realStep !== this) {
         realStep.expect(action, value);
      }
   }

   show() {
      const realStep = getRealCurrentStep();
      if (realStep === this) {
         super.show();
         setMultiStep(this);
         this.begin = getCurrentStation() + 1;
         this.end = this.begin + this.steps.length;
         const percent = (1 / this.steps.length) * 100;
         popUp.progressIndicator.style.width = percent + '%';
         popUp.progressBar.style.display = 'flex';
      } else { // run the real things
         realStep.show();
         // update the x/y progress bar.
         const x = getCurrentStation() - this.begin;
         const percent = (x / this.steps.length)*100;
         popUp.progressDone.style.width = percent + '%';   // set the progress bar's percentage.
      }
   }
}


class ExpectStep extends TutorStep {
   constructor(expect, title, text, targetID, placement) {
      super(title, text, targetID, placement);
      this.expectAction = expect;
      this.options.showNext = false;
   }

   action(value) {
      goNext();
   }

   expect(action, value) {
      if (this.expectAction === action) { // yes, great, now we can goto next step
         this.action(value);
      } else {
         // show error, and try to rewind?
         
      }
   }
}


class ExpectZoomStep extends ExpectStep {
   constructor(title, text, targetID, placement) {
      super(Wings3D.action.cameraZoom, title, text, targetID, placement);
   }

   action(value) {
      // now zoom step is done, we can show next button.
      nextButton(true);
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
let multiStep = null;   // current multistep if any
let popUp = {};
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
      popUp.progressBar = extractElement("tutor-progress");
      popUp.progressDone = extractElement("tutor-progress-done");
      popUp.progressIndicator = extractElement('tutor-progress-indicator');
   }
}

function nextButton(shown) {
   if (popUp.next) {
      if (shown) {
         popUp.next.style.display = 'inline-block';
      } else {
         popUp.next.style.display = 'none';
      }
   }
}

function setMultiStep(obj) {
   multiStep = obj;
};

function getCurrentStep() {
   if (multiStep) {  // let multiStep handle it
      return multiStep;
   } else {
      return rail.routes[rail.currentStation];
   }
};

function getRealCurrentStep() {
   return rail.routes[rail.currentStation];
};

function getCurrentStation() {
   return rail.currentStation;
}

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

function add(nameStep) {  // rename from _addStep, also return success or failure.
   if (noDuplicate(nameStep.nameId)) {
      rail.stops.set(nameStep.nameId, rail.routes.length);
      rail.routes.push(nameStep.step);
      return true;
   } else {
      return false;
   }
};
    
//
function step(nameId, title, text, targetID, placement, stepOptions) {
   return {nameId: nameId, step: new TutorStep(title, text, targetID, placement)};
};
function addStep(nameId, title, text, targetID, placement, stepOtions) {
   add(step(nameId, title, text, targetID, placement, stepOtions));
};

function expectStep(expect, nameId, title, text, targetID, placement, stepOptions) {
   return {nameId: nameId, step: new ExpectStep(expect, title, text, targetID, placement)};
};
function addExpectStep(expect, nameId, title, text, targetID, placement, stepOptions) {
   add(expectStep(expect, nameId, title, text, targetID, placement, stepOptions));
};

function faceSelectStep(selection, nameId, title, text, placement, stepOptions) {
   return {nameId: nameId, step: new FaceSelectStep(selection, title, text, placement)};
};
function addFaceSelectStep(selection, nameId, title, text, placement, stepOptions) {
   add(faceSelectStep(selection, nameId, title, text, placement, stepOptions));
};

// add MultiStep.
function addMultiStep(nameId, title, text, target, placement, steps) {
   //
   const multiStep = new MultiStep(title, text, target, placement, steps);
   add({nameId: nameId, step: multiStep}); // begin;
   for (let step of steps) {
      add(step);
   }
}

let _play = function(stepNumber) {
   if ((stepNumber < 0) || (stepNumber >= rail.routes.length)) {
      console.log("bad step number in tutor guide");
   } else {
      if (stepNumber === (rail.routes.length-1)) {
         // change the NextButton to DoneButton
         popUp.next.textContent = "Done";
      }
      if ((rail.currentStation >= 0) && (rail.currentStation < rail.routes.length)) {
         const prevStep = getCurrentStep();//rail.routes[rail.currentStation];
         prevStep.done();
      }
      rail.currentStation = stepNumber;
      const step = getCurrentStep();//rail.routes[stepNumber];
      // apply data
      nextButton(step.option('showNext'));
      step.show();
   }
};
    
function startTour(stepArray) {
   Wings3D.interposeLog(expect, true);
   //myObj.hasOwnProperty('key')
   if (stepArray) {

   }
   // onto the world
   popUp.bubble.classList.remove("hide");
   // display firstStep
   _play(0);
};
    
function complete() {
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
   Wings3D.interposeLog(expect, false);   // remove interceptLog
};
    
function cancel() {
   complete();
};
function goNext() { _play(rail.currentStation+1); };
    
function goBack() { _play(rail.currentStation-1); };
    
function goTo(id) {};

function expect(action, log) {
   if (rail.currentStation >= 0) {
      const step = getCurrentStep();
      step.expect(action, log);
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
   step, expectStep, faceSelectStep,
   addStep, addExpectStep, addFaceSelectStep,
   add, addMultiStep,
   cancel, complete, 
   startTour,
};