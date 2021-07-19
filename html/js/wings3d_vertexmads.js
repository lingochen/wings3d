/**
//    This module handle most vertex edit command.
//
//    
**/
import {Madsor, DragSelect, TweakMove, ToggleModeCommand, GenericEditCommand} from './wings3d_mads.js';
import {FaceMadsor} from './wings3d_facemads.js';   // for switching
import {BodyMadsor} from './wings3d_bodymads.js';
import {EdgeMadsor} from './wings3d_edgemads.js';
import {EditCommand, EditSelectHandler} from './wings3d_undo.js';
import {PreviewCage} from './wings3d_model.js';
import * as View from './wings3d_view.js';
import * as ShaderProg from './wings3d_shaderprog.js';
import * as UI from './wings3d_ui.js';
import {action} from './wings3d.js';



class VertexMadsor extends Madsor {
   constructor() {
      super('Vertex');
      const self = this;
      UI.bindMenuItem(action.vertexConnect.name, (ev) => {
            const cmd = this.connectVertex();
            if (cmd.doIt()) {
               View.undoQueue(cmd);   // saved for undo
            } else {
               // show no connection possible message.
            }
         });
      UI.bindMenuItemMode(action.vertexDissolve.name, (ev)=> {
            const dissolve = new GenericEditCommand(this, this.dissolve, null, this.undoDissolve, null);
            dissolve.doIt();
            View.undoQueue(dissolve);
         }, this, 'Delete');
      UI.bindMenuItemMode(action.vertexCollapse.name, (ev)=> {
            const dissolve = new GenericEditCommand(this, this.collapse, null, this.undoCollapse, null);
            dissolve.doIt();
            View.undoQueue(dissolve);
         }, this, 'Backspace');
      UI.bindMenuItem(action.vertexWeld.name, (ev)=> {
         let snapshot = [];
         for (let preview of this.selectedCage()) {
            if (preview.selectionSize() == 1) {
               snapshot.push( preview );
            }
          }
         if (snapshot.length == 1) {
            const weld = new VertexWeldCommand(this, snapshot[0]);
            View.attachHandlerMouseSelect(weld);
         } else {
            geometryStatus("You can only Weld one vertex");
         }
        });
   }

   // get selected vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      return this.snapshotSelected(PreviewCage.prototype.snapshotVertexPosition);
   }

   snapshotPositionAndNormal() {
      return this.snapshotSelected(PreviewCage.prototype.snapshotVertexPositionAndNormal);
   }

   snapshotTransformGroup() {
      return this.snapshotSelected(PreviewCage.prototype.snapshotTransformVertexGroup);
   }

   bevel() {
      let snapshots = this.snapshotSelected(PreviewCage.prototype.bevelVertex);
      // change to facemode.
      View.restoreFaceMode(snapshots);
      return snapshots;
   
   }

   undoBevel(snapshots, selection) {
      // collapse extrudeEdge
      this.doAll(snapshots, PreviewCage.prototype.collapseSplitOrBevelEdge);
      // restore Vertex Selection
      View.restoreVertexMode(selection); 
   }

   // extrude Vertex
   extrude() {
      return this.snapshotSelected(PreviewCage.prototype.extrudeVertex);
   }
   undoExtrude(extrudeData) {
      this.doAll(extrudeData, PreviewCage.prototype.undoExtrudeVertex);
   }

   andConnectVertex(prevCmd) {
      const vertexConnect = this.connectVertex();
      if (vertexConnect.doIt()) {
         View.undoQueueCombo([prevCmd, vertexConnect]);
      } else { // no connection possible
         prevCmd.undo();
         // post on geomoetryStatus;
      }
   }

   connectVertex() {
      return new GenericEditCommand(this, this.connect, null, this.dissolveConnect, null);
   }

   connect() {
      const ret = this.snapshotSelected(PreviewCage.prototype.connectVertex);
      if (ret.length > 0) {
         View.restoreEdgeMode(ret);
      }
      return ret;
   };

   dissolveConnect(snapshots) {
      View.restoreVertexMode();
      this.doAll(snapshots, PreviewCage.prototype.dissolveConnect);
   }

   dissolve() {
      return this.snapshotSelected(PreviewCage.prototype.dissolveSelectedVertex);
   }

   undoDissolve(dissolveArray) {
      this.doAll(dissolveArray, PreviewCage.prototype.undoDissolveVertex);
   }

   collapse() {
      const ret = this.snapshotSelected(PreviewCage.prototype.dissolveSelectedVertex);
      View.restoreFaceMode(ret);
      return ret;
   }

   undoCollapse(dissolveArray) {
      View.currentMode().resetSelection();
      View.restoreVertexMode();
      this.doAll(dissolveArray, PreviewCage.prototype.undoDissolveVertex);
   }

   flatten(axis) {
      return this.snapshotSelected(PreviewCage.prototype.flattenVertex, axis);
   }

   setVertexColor(color) {
      return this.snapshotSelected(PreviewCage.prototype.setVertexColor, color);
   }

   tighten() {
      return this.snapshotSelected(PreviewCage.prototype.tightenVertex);
   }

   dragSelect(cage, hilite, selectArray, onOff) {
      if (hilite.vertex !== null) {
        if (cage.dragSelectVertex(hilite.vertex, onOff)) {
            selectArray.push(hilite.vertex);
        }
      }
   }

   selectStart(cage, hilite) {
      if (hilite.vertex !== null) {
         var onOff = cage.selectVertex(hilite.vertex);
         return new DragVertexSelect(this, cage, hilite.vertex, onOff);
      }
      return null;
   }

   _tweakMode(model, hilite, magnet) {
      return new TweakMoveVertex(model, hilite, magnet);
   }

   isVertexSelectable() { return true; }

   _resetSelection(cage) {
      return cage._resetSelectVertex();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreVertexSelection(snapshot);
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots;
      if (toMadsor instanceof FaceMadsor) {
         redoFn = View.restoreFaceMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromVertexToFaceSelect);
      } else if (toMadsor instanceof EdgeMadsor) {
         redoFn = View.restoreEdgeMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromVertexToEdgeSelect);
      } else if (toMadsor instanceof BodyMadsor) {
         redoFn = View.restoreBodyMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromVertexToBodySelect);
      } else {
         redoFn = View.restoreMultiMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromVertexToMultiSelect);
      }
      return new ToggleModeCommand(redoFn, View.restoreVertexMode, snapshots);
   }


   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof FaceMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromVertexToFaceSelect);
      } else if (toMadsor instanceof EdgeMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromVertexToEdgeSelect);
      } else if (toMadsor instanceof BodyMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromVertexToBodySelect);
      } else {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromVertexToMultiSelect);
      }
   }

   vertexShader(gl) {
      gl.useShader(ShaderProg.selectedColorPoint);
      return true;
   }
} 

class DragVertexSelect extends DragSelect {
   constructor(madsor, cage, vertex, onOff) {
      super(madsor, cage, vertex, onOff);
   }

   finish() {
      return new VertexSelectCommand(this.select);
   }
}

class TweakMoveVertex extends TweakMove {
   constructor(model, hilite, magnet) {
      let vertex = model.tweakVertex(hilite.vertex);
      super(model);
      if (vertex) {
         this.vertex = vertex;
      }
   }

   finish() {
      // deselect hilite if not already select.
      if (this.vertex) {   // deselect
         this.model.selectVertex(this.vertex);
      }
      this.moveHandler.commit();
      return this.moveHandler;
   }

   finishAsSelect(hilite) {
      if (!this.vertex) { // remember to deselect
         this.model.selectVertex(hilite.vertex);
      }
      const select = new Map;
      select.set(this.model, [hilite.vertex]);
      return new VertexSelectCommand(select);
   }
}

class VertexSelectCommand extends EditCommand {
   constructor(select) {
      super();
      this.select = select;
   }

   doIt() {
      for (var [cage, vertices] of this.select) {
         for (var i = 0; i < vertices.length; ++i) {
            cage.selectVertex(vertices[i]);
         }
      }
   }

   undo() {
      this.doIt();   // selectVertex, flip/flop, so
   }  
}


class VertexWeldCommand extends EditSelectHandler {
   constructor(madsor, preview) {
      super(true, false, false);
      this.madsor = madsor;
      this.preview = preview;
   }

   hilite(hilite, currentCage) {  // no needs for currentCage
      if ((currentCage === this.preview) && hilite.vertex) {
         return  this.preview.weldableVertex(hilite.vertex) !== false;
      }
      return false;
   }

   select(hilite) { // return true for accepting, false for continue doing things.
      const vertex = hilite.vertex;
      if (vertex) {
         this.collapseHEdge = this.preview.weldableVertex(vertex);
         if (this.collapseHEdge != false) {
            return this.doIt();
         }
      }
      return false;
   }

   doIt() {
      this.restore = this.preview.weldVertex(this.collapseHEdge);
      return true;
   }

   undo() {
      this.preview.undoWeldVertex(this.restore);
   }
}


export {
   VertexMadsor
}