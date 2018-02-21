/**
//    This module contains most edge command and edge utility functions.
//
//    
**/
import {Madsor, DragSelect, ToggleModeCommand} from './wings3d_mads';
import {FaceMadsor} from './wings3d_facemads';   // for switching
import {BodyMadsor} from './wings3d_bodymads';
import {VertexMadsor} from './wings3d_vertexmads';
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

   cutEdge(numberOfSegments) {
      const cutEdge = new CutEdgeCommand(this, numberOfSegments);
      View.undoQueue(cutEdge);
      cutEdge.doIt();
   }

   cutAndConnect() {
      const cutEdge = new CutEdgeCommand(this, 2);
      cutEdge.doIt();
      let vertexMadsor = View.currentMode();   // assurely it vertexMode
      let result = vertexMadsor.connect();
      if (result) {
         const vertexConnect = new VertexConnectCommand(vertexMadsor, result);
         View.undoQueueCombo([cutEdge, vertexConnect]);
         View.restoreEdgeMode(result.wingedEdgeList);
      } else { // no connection possible
         cutEdge.undo();
         // post on geomoetryStatus
         
      }
   }

   cut(numberOfSegments) {
      var snapshots = {vertices: [], splitEdges: []};
      this.eachPreviewCage( function(preview) {
         const snapshot = preview.cutEdge(numberOfSegments);
         snapshots.vertices.push( snapshot.vertices );
         snapshots.splitEdges.push( snapshot.splitEdges );
      });
      return snapshots;
   }

   collapseEdge(splitEdgesArray) {  // undo of splitEdge.
      this.eachPreviewCage(function(cage, splitEdges) {
         cage.collapseSplitEdge(splitEdges);
      }, splitEdgesArray);
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
      const collapse = {count: 0, collapseArray: [], vertexArray: []};
      const selectedVertex = [];
      this.eachPreviewCage(function(cage) {
         const record = cage.collapseSelectedEdge();
         collapse.count += record.collapse.edge.length;
         collapse.collapseArray.push( record.collapse );
         collapse.vertexArray.push( record.selectedVertex );
      });
      return collapse;
   }

   restoreEdge(collapseEdgesArray) {
      this.eachPreviewCage(function(cage, collapseEdges) {
         cage.restoreCollapseEdge(collapseEdges);
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

   _resetSelection(cage) {
      return cage._resetSelectEdge();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreEdgeSelection(snapshot);
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof FaceMadsor) {
         redoFn = View.restoreFaceMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromEdgeToFaceSelect();
         });
      } else if (toMadsor instanceof VertexMadsor) {
         redoFn = View.restoreVertexMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromEdgeToVertexSelect();
         });         
      } else {
         redoFn = View.restoreBodyMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
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
      this.selectedEdges = [];
      this.numberOfSegments = numberOfSegments;
      const self = this;
      this.madsor.eachPreviewCage( function(cage) {
         self.selectedEdges.push( cage.snapshotSelection() );
      });
   }

   doIt() {
      const snapshots = this.madsor.cut(this.numberOfSegments);
      View.restoreVertexMode(snapshots.vertices);    // abusing the api?
      this.splitEdges = snapshots.splitEdges;
   }

   undo() {
      // restoreToEdgeMode
      this.madsor.collapseEdge(this.splitEdges);
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
         View.restoreVertexMode(collapse.vertexArray);
         this.collapse = collapse.collapseArray;
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

export {
   EdgeMadsor,
}