/**
//    This module handle most vertex edit command.
//
//    
**/
import {Madsor, DragSelect, ToggleModeCommand} from './wings3d_mads';
import {FaceMadsor} from './wings3d_facemads';   // for switching
import {BodyMadsor} from './wings3d_bodymads';
import {EdgeMadsor} from './wings3d_edgemads';
import {EditCommand, EditSelectHandler} from './wings3d_undo';
import {PreviewCage} from './wings3d_model';
import * as View from './wings3d_view';
import * as ShaderProg from './wings3d_shaderprog';
import * as UI from './wings3d_ui';
import {action} from './wings3d';
import {DraftBench} from './wings3d_draftbench';



class VertexMadsor extends Madsor {
   constructor() {
      super('vertex');
      const self = this;
      UI.bindMenuItem(action.vertexConnect.name, function(ev) {
            self.connectVertex();
         });
      UI.bindMenuItem(action.vertexDissolve.name, function(ev) {
            const dissolve = new VertexDissolveCommand(self);
            dissolve.doIt();
            View.undoQueue(dissolve);
         });
      UI.bindMenuItem(action.vertexCollapse.name, function(ev) {
            const dissolve = new VertexCollapseCommand(self);
            dissolve.doIt();
            View.undoQueue(dissolve);
         });
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

   modeName() {
      return 'Vertex';
   }

   // get selected vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      return this.snapshotAll(PreviewCage.prototype.snapshotVertexPosition);
   }

   snapshotPositionAndNormal() {
      return this.snapshotAll(PreviewCage.prototype.snapshotVertexPositionAndNormal);
   }

   snapshotTransformGroup() {
      return this.snapshotAll(PreviewCage.prototype.snapshotTransformVertexGroup);
   }

   bevel() {
      let snapshots = this.snapshotAll(PreviewCage.prototype.bevelVertex);
      // change to facemode.
      View.restoreFaceMode(snapshots);
      return snapshots;
   
   }

   undoBevel(snapshots, selection) {
      this.restoreSelectionPosition(snapshots);
      // collapse extrudeEdge
      this.doAll(snapshots, PreviewCage.prototype.collapseSplitOrBevelEdge);
      // restore Vertex Selection
      View.restoreVertexMode(selection); 
   }

   // extrude Vertex
   extrude() {
      return this.snapshotAll(PreviewCage.prototype.extrudeVertex);
   }
   undoExtrude(extrudeData) {
      this.doAll(extrudeData, PreviewCage.prototype.undoExtrudeVertex);
   }

   connectVertex() {
      const vertexConnect = new VertexConnectCommand(this);
      if (vertexConnect.doIt()) {
         View.undoQueue(vertexConnect);   // saved for undo
      } else {
         // show no connection possible message.
      }
   }

   connect() {
      return this.snapshotAll(PreviewCage.prototype.connectVertex);
   };

   dissolveConnect(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.dissolveConnect);
   }

   dissolve() {
      return this.snapshotAll(PreviewCage.prototype.dissolveSelectedVertex);
   }

   undoDissolve(dissolveArray) {
      this.doAll(dissolveArray, PreviewCage.prototype.undoDissolveVertex);
   }

   flatten(axis) {
      return this.snapshotAll(PreviewCage.prototype.flattenVertex, axis);
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

   isVertexSelectable() { return true; }

   _resetSelection(cage) {
      cage._resetSelectVertex();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreVertexSelection(snapshot);
   }

   toggleFunc(toMadsor) {
      const self = this;
      var redoFn;
      var snapshots;
      if (toMadsor instanceof FaceMadsor) {
         redoFn = View.restoreFaceMode;
         snapshots = this.snapshotAll(PreviewCage.prototype.changeFromVertexToFaceSelect);
      } else if (toMadsor instanceof EdgeMadsor) {
         redoFn = View.restoreEdgeMode;
         snapshots = this.snapshotAll(PreviewCage.prototype.changeFromVertexToEdgeSelect);
      } else {
         redoFn = View.restoreEdgeMode;
         snapshots = this.snapshotAll(PreviewCage.prototype.changeFromVertexToBodySelect);
      }
      View.undoQueue( new ToggleModeCommand(redoFn, View.restoreVertexMode, snapshots) );
   }


   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof FaceMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromVertexToFaceSelect);
      } else if (toMadsor instanceof EdgeMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromVertexToEdgeSelect);
      } else {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromVertexToBodySelect);
      }
   }

   draw(gl, draftBench) {
      // draw hilite
      //if (this.currentEdge) {
         this.useShader(gl);
         gl.bindTransform();
            draftBench.drawVertex(gl);
         gl.disableShader();
      //}
   }

   previewShader(gl) {
      gl.useShader(ShaderProg.solidWireframe);
   }

   useShader(gl) {
      gl.useShader(ShaderProg.selectedColorPoint);
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


class VertexConnectCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      // reconnect
      this.cageArray = this.madsor.connect();
      if (this.cageArray.length > 0) { // goes to edgeMode.
         View.restoreEdgeMode(this.cageArray);    // abusing the api?
         return true;
      }
      return false;
   }

   undo() {
      // restore to vertexMode.
      View.restoreVertexMode();
      // dissolve the connect edges.
      this.madsor.dissolveConnect(this.cageArray);
   }  
}

class VertexDissolveCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      // dissolve, guaranteed dissolveCount > 0
      this.dissolve = this.madsor.dissolve();
   }

   undo() {
      this.madsor.undoDissolve(this.dissolve);
   }
}

class VertexCollapseCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      // collapse, is just like dissolve, but switch to facemode
      this.dissolve = this.madsor.dissolve();
      View.restoreFaceMode(this.dissolve);
   }

   undo() {
      this.madsor.resetSelection();
      View.restoreVertexMode();
      this.madsor.undoDissolve(this.dissolve);
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
   VertexMadsor,
   VertexConnectCommand,
}