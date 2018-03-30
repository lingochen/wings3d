/**
//    This module contains most edge command and edge utility functions.
//
//    
**/
import {Madsor, DragSelect, ToggleModeCommand, MovePositionHandler} from './wings3d_mads';
import {FaceMadsor} from './wings3d_facemads';   // for switching
import {BodyMadsor} from './wings3d_bodymads';
import {VertexMadsor, VertexConnectCommand} from './wings3d_vertexmads';
import { EditCommand } from './wings3d_undo';
import * as UI from './wings3d_ui';
import * as View from './wings3d_view';
import * as ShaderProg from './wings3d_shaderprog';
import {action} from './wings3d';


// 
class EdgeMadsor extends Madsor {
   constructor() {
      super('edge');
      // cut commands
      const self = this;
      for (let numberOfSegments of [action.cutLine2, action.cutLine3, action.cutLine4, action.cutLine5, action.cutLine10]) {
         const name = numberOfSegments.name;
         const count = name.substring('cutLine'.length);
         UI.bindMenuItem(name, function(ev) {
               self.cutEdge(count);
            });
      }
      // cutEdge Dialog
      const form = UI.setupDialog('#cutLineDialog', function(data) {
         if (data['Segments']) {
            const number = parseInt(data['Segments'], 10);
            if ((number != NaN) && (number > 0) && (number < 100)) { // sane input
               self.cutEdge(number);
            }
         }
      });
      if (form) {
         // show form when click
         UI.bindMenuItem(action.cutAsk.name, function(ev) {
               // position then show form;
               UI.positionDom(form, UI.getPosition(ev));
               form.style.display = 'block';
               form.reset();
            });
      }
      // cutAndConnect
      UI.bindMenuItem(action.cutAndConnect.name, function(ev) {
            self.cutAndConnect();
         });
      // Dissolve
      UI.bindMenuItem(action.edgeDissolve.name, function(ev) {
            const dissolve = self.dissolve();
            if (dissolve.count > 0) {
               View.undoQueue(new DissolveEdgeCommand(self, dissolve.record));
            } else {
               // should not happened.
            }
         });
      // Collapse
      UI.bindMenuItem(action.edgeCollapse.name, function(ev) {
            const command = new CollapseEdgeCommand(self);
            if (command.doIt()) {
               View.undoQueue(command);
            } else {
               // should not happened.
            }
         });
      // Bevel
      UI.bindMenuItem(action.edgeBevel.name, function(ev) {
            View.attachHandlerMouseMove(new EdgeBevelHandler(self));
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
   }

   modeName() {
      return 'Edge';
   }

   // get selected Edge's vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotEdgePosition() );
      });
      return snapshots;
   }

   snapshotPositionAndNormal() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotEdgePositionAndNormal() );
      });
      return snapshots;
   }

   bevel() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.bevelEdge() );
      });
      return snapshots;
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
      const vertexConnect = new VertexConnectCommand(vertexMadsor);
      if (vertexConnect.doIt()) {
         View.undoQueueCombo([cutEdge, vertexConnect]);
      } else { // no connection possible
         cutEdge.undo();
         // post on geomoetryStatus
         
      }
   }

   cut(numberOfSegments) {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.cutEdge(numberOfSegments) );
      });
      return snapshots;
   }

   edgeLoop(nth) {
      const loop = {count: 0, selection: []};
      this.eachPreviewCage( function(preview) {
         const record = preview.edgeLoop(nth);
         loop.count += record.length;
         loop.selection.push( record );
      });
      return loop;
   }

   edgeRing(nth) {
      const loop = {count: 0, selection: []};
      this.eachPreviewCage( function(preview) {
         const record = preview.edgeRing(nth);
         loop.count += record.length;
         loop.selection.push( record );
      });
      return loop;
   }
   collapseEdge(collapseArray) {  // undo of splitEdge.
      this.eachPreviewCage(function(cage, collapse) {
         cage.collapseSplitOrBevelEdge(collapse);
      }, collapseArray);
   }

   // dissolve edge
   dissolve() {
      const dissolve = {count: 0, record: []};
      this.eachPreviewCage(function(cage) {
         const record = cage.dissolveSelectedEdge();
         dissolve.count += record.length;
         dissolve.record.push( record );
      });
      return dissolve;
   }
   reinsertDissolve(dissolveEdgesArray) {
      this.eachPreviewCage(function(cage, dissolveEdges) {
         cage.reinsertDissolveEdge(dissolveEdges);
      }, dissolveEdgesArray);
   }

   // collapse edge
   collapse() {
      const collapse = {count: 0, array: []};
      const selectedVertex = [];
      this.eachPreviewCage(function(cage) {
         const record = cage.collapseSelectedEdge();
         collapse.count += record.collapse.edges.length;
         collapse.array.push( record );
      });
      return collapse;
   }

   restoreEdge(collapseEdgesArray) {
      this.eachPreviewCage(function(cage, collapse) {
         cage.restoreCollapseEdge(collapse);
      }, collapseEdgesArray);
   }


   dragSelect(cage, selectArray, onOff) {
      if (this.currentEdge !== null) {
        if (cage.dragSelectEdge(this.currentEdge, onOff)) {
            selectArray.push(this.currentEdge);
        }
      }
   }

   // select, hilite
   selectStart(cage) {
      if (this.currentEdge !== null) {
         var onOff = cage.selectEdge(this.currentEdge);
         return new DragEdgeSelect(this, cage, this.currentEdge, onOff);
      }
      return null;
   }

   hideOldHilite() {
      //if (this.currentEdge) {
         this.preview.hiliteEdge(this.currentEdge, false);
      //}
   }

   showNewHilite(edge, intersect, _center) {
      // setting of setCurrentEdge
      //if (this.currentEdge) {
         this.preview.hiliteEdge(edge, true);
      //}
   }

   _wrapSelection(selection) {
      return {wingedEdges: selection};
   }

   _resetSelection(cage) {
      return {wingedEdges: cage._resetSelectEdge()};
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreEdgeSelection(snapshot);
   }

   toggleFunc(toMadsor) {
      const self = this;
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof FaceMadsor) {
         redoFn = View.restoreFaceMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( self._wrapSelection(cage.snapshotSelection()) );
            cage.changeFromEdgeToFaceSelect();
         });
      } else if (toMadsor instanceof VertexMadsor) {
         redoFn = View.restoreVertexMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( self._wrapSelection(cage.snapshotSelection()) );
            cage.changeFromEdgeToVertexSelect();
         });         
      } else {
         redoFn = View.restoreBodyMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( self._wrapSelection(cage.snapshotSelection()) );
            cage.changeFromEdgeToBodySelect();
         });
      }
      View.undoQueue(new ToggleModeCommand(redoFn, View.restoreEdgeMode, snapshots));
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof FaceMadsor) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromEdgeToFaceSelect(snapshot);
         }, snapshots);
      } else if (toMadsor instanceof VertexMadsor) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromEdgeToVertexSelect(snapshot);
         }, snapshots);
      } else {
           this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromEdgeToBodySelect(snapshot);
         }, snapshots);       
      }
   }

   draw(gl) {
      //if (this.currentEdge) {
         this.useShader(gl);
         gl.bindTransform();
         this.eachPreviewCage( function(preview) {
            preview.drawEdge(gl);
         });
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
      if (collapse.count > 0) {
         this.collapse = collapse.array;
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

class BevelEdgeCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.selectedEdges = madsor.snapshotSelection();
      this.movement = 0;
   }

   doIt() {
      this.snapshots = this.madsor.bevel();   // should test for current snapshots and prev snapshots?
      View.restoreFaceMode(this.snapshots);
      this.madsor.moveSelection(this.movement, this.snapshots);
      // get limit
      this.vertexLimit = Number.MAX_SAFE_INTEGER;
      for (let snapshot of this.snapshots) {
         this.vertexLimit = Math.min(this.vertexLimit, snapshot.vertexLimit);
      } 
   }

   update(move) {
      if ((this.movement+move) > this.vertexLimit) {
         move = this.vertexLimit - this.movement;
      } else if ((this.movement+move) < 0) {
         move = 0 - this.movement;
      }
      this.madsor.moveSelection(move, this.snapshots);
      this.movement += move;
   }

   undo() {
      this.madsor.restoreMoveSelection(this.snapshots);
      this.madsor.collapseEdge(this.snapshots);
      View.restoreEdgeMode(this.selectedEdges);
      //this.snapshots = undefined;
   }
}

class EdgeBevelHandler extends MovePositionHandler {
   constructor(madsor) {
      super(madsor);
      this.bevelEdge = new BevelEdgeCommand(this.madsor); 
      this.bevelEdge.doIt();
   }

   handleMouseMove(ev) {
      let move = this._calibrateMovement(ev.movementX);
      this.bevelEdge.update(move);
   }

   _commit() {
      View.undoQueue(this.bevelEdge);
   }

   _cancel() {
      this.bevelEdge.undo();
   }
}

class EdgeLoopCommand extends EditCommand {
   constructor(madsor, nth) {
      super();
      this.madsor = madsor;
      this.nth = nth;
      this.selectedEdges = madsor.snapshotSelection();
   }

   doIt() {
      this.loopSelection = this.madsor.edgeLoop(this.nth);
      return (this.loopSelection.count > 0);
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
      this.loopSelection = this.madsor.edgeRing(this.nth);
      return (this.loopSelection.count > 0);
   }

   undo() {
      this.madsor.resetSelection();
      this.madsor.restoreSelection(this.selectedEdges);
   } 
}

export {
   EdgeMadsor,
}