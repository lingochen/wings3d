/**
//    This module contains most edge command and edge utility functions.
//
//    
**/
import {Madsor, DragSelect, ToggleModeCommand, MoveAlongNormal, MoveBidirectionHandler, GenericEditCommand} from './wings3d_mads';
import {FaceMadsor} from './wings3d_facemads';   // for switching
import {BodyMadsor} from './wings3d_bodymads';
import {VertexMadsor} from './wings3d_vertexmads';
import {EditCommand, MoveableCommand} from './wings3d_undo';
import {PreviewCage} from './wings3d_model';
import * as UI from './wings3d_ui';
import * as View from './wings3d_view';
import * as ShaderProg from './wings3d_shaderprog';
import {action} from './wings3d';
import {DraftBench} from './wings3d_draftbench';

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
               self.cutEdge(count);
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
                     self.cutEdge(number);
                  }
               }
            });
        });
      // cutAndConnect
      UI.bindMenuItem(action.cutAndConnect.name, function(ev) {
            self.cutAndConnect();
         });
      // Dissolve
      UI.bindMenuItemMode(action.edgeDissolve.name, function(ev) {
            const dissolve = self.dissolve();
            if (dissolve.length > 0) {
               View.undoQueue(new DissolveEdgeCommand(self, dissolve));
            } else {
               // should not happened.
            }
         }, this, 'Backspace');
      // Collapse
      UI.bindMenuItem(action.edgeCollapse.name, function(ev) {
            const command = new CollapseEdgeCommand(self);
            if (command.doIt()) {
               View.undoQueue(command);
            } else {
               // should not happened.
            }
         });
      // Crease
      UI.bindMenuItem(action.edgeCrease.name, (ev) => {
         View.attachHandlerMouseMove(new CreaseEdgeHandler(this));
      });

      // EdgeLoop.
      for (let [numberOfSegments, hotkey] of [[action.edgeLoop1,"l"], [action.edgeLoop2,undefined], [action.edgeLoop3,undefined]]) {
         const name = numberOfSegments.name;
         const count = name.substring('edgeLoop'.length);        
         UI.bindMenuItem(name, function(ev) {
            const command = new EdgeLoopCommand(self, count);
            if (command.doIt()) {
               View.undoQueue(command);
            } else { // should not happened, make some noise

            }
         }, hotkey);
      }
      // EdgeLoop Nth., show form when click
      UI.bindMenuItem(action.edgeLoopN.name, function(ev) {
         UI.runDialog('#cutLineDialog', ev, function(form) {
            const data = form.querySelector('input=[name="Segments"');
            if (data) {
               const number = parseInt(data.value, 10);
               if ((number != NaN) && (number > 0) && (number < 100)) { // sane input
                  const command = new EdgeLoopCommand(self, number);
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
         UI.bindMenuItem(name, function(ev) {
            const command = new EdgeRingCommand(self, count);
            if (command.doIt()) {
               View.undoQueue(command);
            } else { // should not happened, make some noise
      
            }
         }, hotkey);
      }
      // EdgeRing Nth
      UI.bindMenuItem(action.edgeRingN.name, function(ev) {
         UI.runDialog('#cutLineDialog', ev, function(form) {
            const data = form.querySelector('input[name="Segments"');
            if (data) {
               const number = parseInt(data.value, 10);
               if ((number != NaN) && (number > 0) && (number < 100)) { // sane input
                  const command = new EdgeRingCommand(self, number);
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
         const command = new LoopCutCommand(this);
         if (command.doIt()) {
            View.undoQueue(command);
         } else { // geometry status. no LoopCut available.

         }
        });
      UI.bindMenuItem(action.edgeCorner.name, (ev) => {
         View.attachHandlerMouseMove(new EdgeCornerHandler(this));
       });
      UI.bindMenuItem(action.edgeSlide.name, (ev) => {
         const handler = new MoveBidirectionHandler(this, new GenericEditCommand(this, this.slide));
         handler.doIt();
         View.attachHandlerMouseMove(handler);
        });
   }

   // get selected Edge's vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      return this.snapshotAll(PreviewCage.prototype.snapshotEdgePosition);
   }

   snapshotPositionAndNormal() {
      return this.snapshotAll(PreviewCage.prototype.snapshotEdgePositionAndNormal);
   }

   snapshotTransformGroup() {
      return this.snapshotAll(PreviewCage.prototype.snapshotTransformEdgeGroup);
   }

   loopCut() {
      const snapshots = this.snapshotAll(PreviewCage.prototype.loopCut);
      for (let snapshot of snapshots) {
         for (let preview of snapshot.snapshot.separateCages) {
            View.addToWorld(preview);
            preview.selectBody();
         }
      }
      return snapshots;
   }

   undoLoopCut(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.undoLoopCut);
      for (let snapshot of snapshots) {   // we have to remove later because of removeFromWorld will set invisible flag on polygon.
         for (let preview of snapshot.snapshot.separateCages) {
            //preview.selectBody();
            View.removeFromWorld(preview);
         }
      }
   }

   bevel() {
      const snapshots = this.snapshotAll(PreviewCage.prototype.bevelEdge);
      // change to facemode.
      View.restoreFaceMode(snapshots);
      return snapshots;
   }

   undoBevel(snapshots, selection) {
      this.restoreSelectionPosition(snapshots);
      this.collapseEdge(snapshots);
      View.restoreEdgeMode(selection);
   }

   crease() {
      return this.snapshotAll(PreviewCage.prototype.creaseEdge);
   }

   extrude() {
      return this.snapshotAll(PreviewCage.prototype.extrudeEdge);
   }

   undoExtrude(contourEdges) {
      this.doAll(contourEdges, PreviewCage.prototype.undoExtrudeEdge);
   }

   cutEdge(numberOfSegments) {
      const cutEdge = new CutEdgeCommand(this, numberOfSegments);
      View.undoQueue(cutEdge);
      cutEdge.doIt();
   }

   cutAndConnect() {
      const cutEdge = new CutEdgeCommand(this, 2);
      cutEdge.doIt();
      const vertexMadsor = View.currentMode();   // assurely it vertexMode
      vertexMadsor.andConnectVertex(cutEdge);
   }

   cut(numberOfSegments) {
      return this.snapshotAll(PreviewCage.prototype.cutEdge, numberOfSegments);
   }

   edgeLoop(nth) {
      return this.snapshotAll(PreviewCage.prototype.edgeLoop, nth);
   }

   edgeRing(nth) {
      return this.snapshotAll(PreviewCage.prototype.edgeRing, nth);
   }
   collapseEdge(snapshots) {  // undo of splitEdge.
      this.doAll(snapshots, PreviewCage.prototype.collapseSplitOrBevelEdge);
   }

   // dissolve edge
   dissolve() {
      return this.snapshotAll(PreviewCage.prototype.dissolveSelectedEdge);
   }
   reinsertDissolve(dissolveEdgesArray) {
      this.doAll(dissolveEdgesArray, PreviewCage.prototype.reinsertDissolveEdge);
   }

   // collapse edge
   collapse() {
      return this.snapshotAll(PreviewCage.prototype.collapseSelectedEdge);
   }

   restoreEdge(collapseEdgesArray) {
      this.doAll(collapseEdgesArray, PreviewCage.prototype.restoreCollapseEdge);
   }

   corner() {
      return this.snapshotAll(PreviewCage.prototype.cornerEdge);
   }

   undoCorner(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.undoCornerEdge);
   }

   slide() {
      return this.snapshotAll(PreviewCage.prototype.slideEdge);
   }

   flatten(axis) {
      return this.snapshotAll(PreviewCage.prototype.flattenEdge, axis);
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

   isEdgeSelectable() { return true; }

   _resetSelection(cage) {
      cage._resetSelectEdge();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreEdgeSelection(snapshot);
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots;
      if (toMadsor instanceof FaceMadsor) {
         redoFn = View.restoreFaceMode;
         snapshots = this.snapshotAll(PreviewCage.prototype.changeFromEdgeToFaceSelect);
      } else if (toMadsor instanceof VertexMadsor) {
         redoFn = View.restoreVertexMode;
         snapshots = this.snapshotAll(PreviewCage.prototype.changeFromEdgeToVertexSelect); 
      } else if (toMadsor instanceof BodyMadsor) {
         redoFn = View.restoreBodyMode;
         snapshots = this.snapshotAll(PreviewCage.prototype.changeFromEdgeToBodySelect);
      } else {
         redoFn = View.restoreMultiMode;
         snapshots = this.snapshotAll(PreviewCage.prototype.changeFromEdgeToMultiSelect);   
      }
      View.undoQueue(new ToggleModeCommand(redoFn, View.restoreEdgeMode, snapshots));
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

   draw(gl, draftBench) {
      //if (this.currentEdge) {
         this.useShader(gl);
         gl.bindTransform();
            draftBench.drawEdge(gl);
         gl.disableShader();
      //}
   }

   previewShader(gl) {
      gl.useShader(ShaderProg.solidWireframe);
   }

   useShader(gl) {
      //gl.useShader(ShaderProg.solidColor);
      gl.useShader(ShaderProg.selectedColorLine);
   }
}

class DragEdgeSelect extends DragSelect {
   constructor(madsor, cage, halfEdge, onOff) {
      super(madsor, cage, halfEdge, onOff);
   }

   finish() {
      return new EdgeSelectCommand(this.select);
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


//class CutEdgeMoveCommand extends MouseMoveHandler {
//}


class CutEdgeCommand extends EditCommand {
   constructor(madsor, numberOfSegments) {
      super();
      this.madsor = madsor;
      this.numberOfSegments = numberOfSegments;
      this.selectedEdges = madsor.snapshotSelection();
   }

   doIt() {
      const snapshots = this.madsor.cut(this.numberOfSegments);
      View.restoreVertexMode(snapshots);    // abusing the api?
      this.snapshots = snapshots;
   }

   undo() {
      // restoreToEdgeMode
      this.madsor.collapseEdge(this.snapshots);
      View.restoreEdgeMode(this.selectedEdges);
   }
}


class DissolveEdgeCommand extends EditCommand {
   constructor(madsor, dissolveEdges) {
      super();
      this.madsor = madsor;
      this.dissolveEdges = dissolveEdges;
   }

   doIt() {
      this.madsor.dissolve(); // return data should be the same as previous one
   }

   undo() {
      this.madsor.reinsertDissolve(this.dissolveEdges);
   }
}


class CollapseEdgeCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      const collapse = this.madsor.collapse();
      if (collapse.length > 0) {
         this.collapse = collapse;
         View.restoreVertexMode(this.collapse);
         return true;
      } else {
         return false;
      }
   }

   undo() {
      View.currentMode().resetSelection();
      View.restoreEdgeMode();
      this.madsor.restoreEdge(this.collapse);
   }
}

// Crease
class CreaseEdgeHandler extends MoveableCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.contourEdges = madsor.crease();
      this.moveHandler = new MoveAlongNormal(madsor);
   }

   doIt() {
      this.contourEdges = this.madsor.crease(this.contourEdges);
      super.doIt();     // = this.madsor.moveSelection(this.movement, this.snapshots);
   }

   undo() {
      super.undo(); //this.madsor.restoreSelectionPosition(this.snapshots);
      this.madsor.undoExtrude(this.contourEdges);
   }
}
// end of Crease

class EdgeLoopCommand extends EditCommand {
   constructor(madsor, nth) {
      super();
      this.madsor = madsor;
      this.nth = nth;
      this.selectedEdges = madsor.snapshotSelection();
   }

   doIt() {
      const loopSelection = this.madsor.edgeLoop(this.nth);
      return (loopSelection.length > 0);
   }

   undo() {
      this.madsor.resetSelection();
      this.madsor.restoreSelection(this.selectedEdges);
   }
}

class EdgeRingCommand extends EditCommand {
   constructor(madsor, nth) {
      super();
      this.madsor = madsor;
      this.nth = nth;
      this.selectedEdges = madsor.snapshotSelection();
   }

   doIt() {
      const loopSelection = this.madsor.edgeRing(this.nth);
      return (loopSelection.length > 0);
   }

   undo() {
      this.madsor.resetSelection();
      this.madsor.restoreSelection(this.selectedEdges);
   } 
}

class LoopCutCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      this.loopCut = this.madsor.loopCut();
      if (this.loopCut.length > 0) {   // change to body Mode.
         View.restoreBodyMode();
         return true;
      } else {
         return false;
      }
   }

   undo() {
      if (this.loopCut.length > 0) {
         View.restoreEdgeMode();
         this.madsor.undoLoopCut(this.loopCut);
      }
   }
}

class EdgeCornerHandler extends MoveableCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.cornerEdges = madsor.corner();
      this.moveHandler = new MoveAlongNormal(madsor, false, this.cornerEdges);
   }

   doIt() {
      this.cornerEdges = this.madsor.corner();
      super.doIt();
   }

   undo() {
      // super.undo();  // not need, because movement was deleted
      this.madsor.undoCorner(this.cornerEdges);
   }

}

export {
   EdgeMadsor,
}