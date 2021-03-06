/**
//    This module contains most edge command and edge utility functions.
//
//    
**/
import {Madsor, DragSelect, TweakMove, ToggleModeCommand, GenericEditCommand} from './wings3d_mads.js';
import {FaceMadsor} from './wings3d_facemads.js';   // for switching
import {BodyMadsor} from './wings3d_bodymads.js';
import {VertexMadsor} from './wings3d_vertexmads.js';
import {EditCommand, EditCommandCombo} from './wings3d_undo.js';
import {PreviewCage} from './wings3d_model.js';
import * as UI from './wings3d_ui.js';
import * as View from './wings3d_view.js';
import * as ShaderProg from './wings3d_shaderprog.js';
import {action} from './wings3d.js';

// 
class EdgeMadsor extends Madsor {
   constructor() {
      super('Edge');
      // cut commands
      const self = this;
      for (let numberOfSegments of [action.cutLine2, action.cutLine3, action.cutLine4, action.cutLine5, action.cutLine10]) {
         const name = numberOfSegments.name;
         const count = name.substring('cutLine'.length);
         UI.bindMenuItem(name, function(ev) {
               const cmd = new GenericEditCommand(self, self.cut, [count], self.undoCut, [self.snapshotSelection()]);
               if (cmd.doIt()) {
                  View.undoQueue(cmd);
               } else {/* impossible condition*/}
            });
      }
      // cutEdge Dialog, show form when click
      UI.bindMenuItem(action.cutAsk.name, function(ev) {
            // position then show form;
            UI.runDialog("#cutLineDialog", ev, function(form) {
               const data = form.querySelector('input[name="Segments"');
               if (data) {
                  const number = parseInt(data.value, 10);
                  if ((number != NaN) && (number > 0) && (number < 100)) { // sane input
                     const cmd = new GenericEditCommand(self, self.cut, [number], self.undoCut, [self.snapshotSelection()]);
                     if (cmd.doIt()) {
                        View.undoQueue(cmd);
                     } else {/* impossible condition*/}
                  }
               }
            });
        });
      // cutAndConnect
      UI.bindMenuItem(action.cutAndConnect.name, (ev)=>{
            const cutEdge = new GenericEditCommand(this, this.cut, [2], this.undoCut, [this.snapshotSelection()]);
            cutEdge.doIt();
            const vertexMadsor = View.currentMode();   // assurely it vertexMode
            vertexMadsor.andConnectVertex(cutEdge);
         });
      // Dissolve
      UI.bindMenuItemMode(action.edgeDissolve.name, (ev)=> {
            const dissolve = new GenericEditCommand(this, this.dissolve, null, this.reinsertDissolve, null);
            if (dissolve.doIt()) {
               View.undoQueue(dissolve);
            } else {
               // should not happened.
            }
         }, this, 'Backspace');
      // Collapse
      UI.bindMenuItem(action.edgeCollapse.name, (ev)=> {
            const command = new GenericEditCommand(this, this.collapse, null, this.undoCollapse, null);
            if (command.doIt()) {
               View.undoQueue(command);
            } else {
               // should not happened.
            }
         });
      // Crease
      UI.bindMenuItem(action.edgeCrease.name, (ev) => {
         this.doMoveAlongNormal(false, GenericEditCommand(this, this.crease, null, this.undoExtrude, null) );
      });

      // EdgeLoop.
      for (let [numberOfSegments, hotkey] of [[action.edgeLoop1,"l"], [action.edgeLoop2,undefined], [action.edgeLoop3,undefined]]) {
         const name = numberOfSegments.name;
         const count = name.substring('edgeLoop'.length);        
         UI.bindMenuItem(name,(ev)=> {
            const command = new GenericEditCommand(this, this.edgeLoop, [count], this.undoLoopOrRing, null);
            if (command.doIt()) {
               View.undoQueue(command);
            } else { // should not happened, make some noise

            }
         }, hotkey);
      }
      // EdgeLoop Nth., show form when click
      UI.bindMenuItem(action.edgeLoopN.name, function(ev) {
         UI.runDialog('#cutLineDialog', ev, function(form) {
            const data = form.querySelector('input[name="Segments"]');
            if (data) {
               const number = parseInt(data.value, 10);
               if ((number != NaN) && (number > 0) && (number < 100)) { // sane input
                  const command = new GenericEditCommand(self, self.edgeLoop, [number], self.undoLoopOrRing, null);
                  if (command.doIt()) {
                     View.undoQueue(command);
                  } else { // should not happened, make some noise
                  }
               }
            }
          });
       });
      // EdgeRing
      for (let [numberOfSegments, hotkey] of [[action.edgeRing1,"g"], [action.edgeRing2,undefined], [action.edgeRing3,undefined]]) {
         const name = numberOfSegments.name;
         const count = name.substring('edgeRing'.length);
         UI.bindMenuItem(name, (ev)=> {
            const command = new GenericEditCommand(this, this.edgeRing, [count], this.undoLoopOrRing, null);
            if (command.doIt()) {
               View.undoQueue(command);
            } else { // should not happened, make some noise
      
            }
         }, hotkey);
      }
      // EdgeRing Nth
      UI.bindMenuItem(action.edgeRingN.name, function(ev) {
         UI.runDialog('#cutLineDialog', ev, function(form) {
            const data = form.querySelector('input[name="Segments"]');
            if (data) {
               const number = parseInt(data.value, 10);
               if ((number != NaN) && (number > 0) && (number < 100)) { // sane input
                  const command = new GenericEditCommand(self, self.edgeRing, [number], self.undoLoopOrRing, null);
                  if (command.doIt()) {
                     View.undoQueue(command);
                  } else { // should not happened, make some noise
                  }
               }
            }
          });
       });
       // loopCut
       UI.bindMenuItem(action.edgeLoopCut.name, (ev) => {
         const command = new GenericEditCommand(this, this.loopCut, null, this.undoLoopCut, null);
         if (command.doIt(this)) {
            View.undoQueue(command);
         } else { // geometry status. no LoopCut available.

         }
        });
      UI.bindMenuItem(action.edgeCorner.name, (ev) => {
         this.doMoveAlongNormal(false, new GenericEditCommand(this, this.corner, null, this.undoCorner, null) );
       });
      UI.bindMenuItem(action.edgeSlide.name, (ev) => {
         this.doMoveBidirection( new GenericEditCommand(this, this.slide) );
        });
      // Hardness
      for (let [hardness, operand] of [[action.edgeSoft, 0], [action.edgeHard, 1], [action.edgeInvert, 2]]) {
         UI.bindMenuItem(hardness.name, (ev)=> {
            const cmd = new GenericEditCommand(this, this.hardness, [operand], this.undoHardness);
            if (cmd.doIt()) {
               View.undoQueue(cmd);
            } else { // geometry status. no hardEdge to turn to softEdge.

            }
          });
      }
      // turn/spin edge, clockwise/counterclockwise,
      let id = action.edgeTurn.name;
      UI.bindMenuItem(id, (ev)=>{
         if (this.isTurnable()) {
            const cmd = new TurnEdgeCommand(true, false);
            cmd.doIt(this);
            View.undoQueue(cmd);
         }
       });
       UI.bindMenuItemMMB(id, (ev)=>{
         if (this.isTurnable()) {
            const cmd = new TurnEdgeCommand(false, false);
            cmd.doIt(this);
            View.undoQueue(cmd);
         }
       });
       UI.bindMenuItemRMB(id, (ev)=>{
         if (this.isTurnable()) {
            const cmd = new TurnEdgeCommand(true, true);
            cmd.doIt(this);
            View.undoQueue(cmd);
         }
       });

      // select boundary
      UI.bindMenuItem(action.edgeBoundary.name, (ev) => {
         const cmd = View._toggleEdgeMode();
         const boundary = new GenericEditCommand(this, this.edgeBoundary, null, this.undoDoSelection);
         if (boundary.doIt()) {
            if (cmd) {
               View.undoQueue( new EditCommandCombo([cmd, boundary]));
            } else {
               View.undoQueue(boundary);
            }
         } else {
            if (cmd) {
               View.undoQueue(cmd);
            }
         }
       });
      // close crack. 
      UI.bindMenuItem(action.closeCrack.name, (ev) => {
         const close = new GenericEditCommand(this, this.closeCrack, null, this.undoCloseCrack);
         if (close.doIt()) {
            View.undoQueue(close);
         }
       });
   }

   // get selected Edge's vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      return this.snapshotSelected(PreviewCage.prototype.snapshotEdgePosition);
   }

   snapshotPositionAndNormal() {
      return this.snapshotSelected(PreviewCage.prototype.snapshotEdgePositionAndNormal);
   }

   snapshotTransformGroup() {
      return this.snapshotSelected(PreviewCage.prototype.snapshotTransformEdgeGroup);
   }

   loopCut() {
      const snapshots = this.snapshotSelected(PreviewCage.prototype.loopCut);
      if (snapshots.length > 0) {
         View.restoreBodyMode();
         for (let snapshot of snapshots) {
            for (let preview of snapshot.snapshot.separateCages) {
               View.addToWorld(preview);
               preview.selectBody();
            }
         }
      }
      return snapshots;
   }

   undoLoopCut(snapshots) {
      for (let snapshot of snapshots) {   // we have to remove later because of removeFromWorld will set invisible flag on polygon.
         for (let preview of snapshot.snapshot.separateCages) {
            preview.selectBody();
            View.removeFromWorld(preview);
         }
      }
      View.restoreEdgeMode();
      this.doAll(snapshots, PreviewCage.prototype.undoLoopCut);
   }

   bevel() {
      const snapshots = this.snapshotSelected(PreviewCage.prototype.bevelEdge);
      // change to facemode.
      View.restoreFaceMode(snapshots);
      return snapshots;
   }

   undoBevel(snapshots, selection) {
      this.collapseEdge(snapshots);
      // restore Vertex Selection
      View.restoreEdgeMode(selection); 
   }

   crease() {
      return this.snapshotSelected(PreviewCage.prototype.creaseEdge);
   }

   extrude() {
      return this.snapshotSelected(PreviewCage.prototype.extrudeEdge);
   }

   undoExtrude(contourEdges) {
      this.doAll(contourEdges, PreviewCage.prototype.undoExtrudeEdge);
   }

   cut(numberOfSegments) {
      const snapshots = this.snapshotSelected(PreviewCage.prototype.cutEdge, numberOfSegments);
      View.restoreVertexMode(snapshots);
      return snapshots;
   }
   undoCut(snapshots, selectedEdges) {
      this.collapseEdge(snapshots);
      View.restoreEdgeMode(selectedEdges);
   }

   closeCrack() {
      return this.snapshotSelected(PreviewCage.prototype.closeCrack);
   }

   undoCloseCrack(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.undoCloseCrack);
   }

   edgeBoundary() {
      return this.snapshotSelectable(PreviewCage.prototype.selectBoundaryEdge);
   }

   edgeLoop(nth) {
      return this.snapshotSelected(PreviewCage.prototype.edgeLoop, nth);
   }

   edgeRing(nth) {
      return this.snapshotSelected(PreviewCage.prototype.edgeRing, nth);
   }

   undoLoopOrRing(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.undoLoopOrRing);
   }

   collapseEdge(snapshots) {  // undo of splitEdge.
      this.doAll(snapshots, PreviewCage.prototype.collapseSplitOrBevelEdge);
   }

   // dissolve edge
   dissolve() {
      return this.snapshotSelected(PreviewCage.prototype.dissolveSelectedEdge);
   }
   reinsertDissolve(dissolveEdgesArray) {
      this.doAll(dissolveEdgesArray, PreviewCage.prototype.reinsertDissolveEdge);
   }

   // collapse edge
   collapse() {
      const ret = this.snapshotSelected(PreviewCage.prototype.collapseSelectedEdge);
      if (ret.length > 0) {
         View.restoreVertexMode(ret);
      }
      return ret;
   }

   undoCollapse(collapseEdgesArray) {
      View.currentMode().resetSelection();
      View.restoreEdgeMode();
      this.doAll(collapseEdgesArray, PreviewCage.prototype.restoreCollapseEdge);
   }

   corner() {
      return this.snapshotSelected(PreviewCage.prototype.cornerEdge);
   }

   undoCorner(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.undoCornerEdge);
   }

   hardness(state) {
      return this.snapshotSelected(PreviewCage.prototype.hardnessEdge, state);
   }

   undoHardness(snapshots, state) {
      this.doAll(snapshots, PreviewCage.prototype.undoHardness, state);
   }

   slide() {
      return this.snapshotSelected(PreviewCage.prototype.slideEdge);
   }

   flatten(axis) {
      return this.snapshotSelected(PreviewCage.prototype.flattenEdge, axis);
   }

   isTurnable() {
      for (let preview of this.selectedCage()) {
         if (!preview.isEdgeSpinnable()) {
            alert('Selected edges must not be in the same face.');
            return false;  // if one of cage not turnable then abort operation.
         }
      }
      return true;
   }

   turn(checkShorter) { // spin edges (clockwise or counterclockwise)
      return this.snapshotSelected(PreviewCage.prototype.spinEdge, checkShorter);
   }

   undoTurn(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.spinEdgeCounter);
   }

   turnCounter() {
      return this.snapshotSelected(PreviewCage.prototype.spinEdgeCounter);
   }

   dragSelect(cage, hilite, selectArray, onOff) {
      if (hilite.edge !== null) {
        if (cage.dragSelectEdge(hilite.edge, onOff)) {
            selectArray.push(hilite.edge);
        }
      }
   }

   // select, hilite
   selectStart(cage, hilite) {
      if (hilite.edge !== null) {
         var onOff = cage.selectEdge(hilite.edge);
         return new DragEdgeSelect(this, cage, hilite.edge, onOff);
      }
      return null;
   }

   _tweakMode(model, hilite, magnet) {
      return new TweakMoveEdge(model, hilite, magnet);
   }

   isEdgeSelectable() { return true; }

   _resetSelection(cage) {
      return cage._resetSelectEdge();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreEdgeSelection(snapshot);
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots;
      if (toMadsor instanceof FaceMadsor) {
         redoFn = View.restoreFaceMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromEdgeToFaceSelect);
      } else if (toMadsor instanceof VertexMadsor) {
         redoFn = View.restoreVertexMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromEdgeToVertexSelect); 
      } else if (toMadsor instanceof BodyMadsor) {
         redoFn = View.restoreBodyMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromEdgeToBodySelect);
      } else {
         redoFn = View.restoreMultiMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromEdgeToMultiSelect);   
      }
      return new ToggleModeCommand(redoFn, View.restoreEdgeMode, snapshots);
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof FaceMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromEdgeToFaceSelect);
      } else if (toMadsor instanceof VertexMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromEdgeToVertexSelect);
      } else if (toMadsor instanceof BodyMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromEdgeToBodySelect);
      } else {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromEdgeToMultiSelect);      
      }
   }

   edgeShader(gl) {
      gl.useShader(ShaderProg.selectedWireframeLine);
   }
}



// drag, 
// tweak, 
// select handler
class DragEdgeSelect extends DragSelect {
   constructor(madsor, cage, halfEdge, onOff) {
      super(madsor, cage, halfEdge, onOff);
   }

   finish() {
      return new EdgeSelectCommand(this.select);
   }
}


class TweakMoveEdge extends TweakMove {
   constructor(model, hilite, magnet) {
      let edge = model.tweakEdge(hilite.edge);
      super(model);
      if (edge) {
         this.edge = edge;
      }
   }

   finish() {
      // deselect hilite if not already select.
      if (this.edge) {   // deselect
         this.model.selectEdge(this.edge);
      }
      this.moveHandler.commit();
      return this.moveHandler;
   }

   finishAsSelect(hilite) {
      if (!this.edge) { // remember to deselect
         this.model.selectEdge(hilite.edge);
      }
      const select = new Map;
      select.set(this.model, [hilite.edge]);
      return new EdgeSelectCommand(select);
   }
}


class EdgeSelectCommand extends EditCommand {
   constructor(select) {
      super();
      this.select = select;
   }

   doIt() {
      for (var [cage, halfEdges] of this.select) {
         for (var i = 0; i < halfEdges.length; ++i) {
            cage.selectEdge(halfEdges[i]);
         }
      }
   }

   undo() {
      this.doIt();   // selectEdge, flip/flop, so
   }
}


class TurnEdgeCommand extends EditCommand {
   constructor(isClockwise, checkShorter) {
      super();
      this.isClockwise = isClockwise;
      this.checkShorter = checkShorter;
   }

   doIt(currentMadsor) {
      if (this.isClockwise) {
         let undo = currentMadsor.turn(this.checkShorter);
         if (this.checkShorter) {
            this.snapshots = undo;
         }
      } else {
         currentMadsor.turnCounter();
      }
      return true;
   }

   undo(currentMadsor) {
      if (this.isClockwise) {
         if (this.snapshots) {
            currentMadsor.undoTurn(this.snapshots);
         } else {
            currentMadsor.turnCounter();
         }
      } else {
         currentMadsor.turn(false);
      }
   }

}



export {
   EdgeMadsor,
}