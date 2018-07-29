/**
//    This module contains most face command and face utility functions.
//
//    
**/
import {Madsor, DragSelect, MovePositionHandler, GenericEditCommand, MoveAlongNormal, MouseRotateAlongAxis, ToggleModeCommand} from './wings3d_mads';
import {EdgeMadsor} from './wings3d_edgemads';   // for switching
import {BodyMadsor} from './wings3d_bodymads';
import {VertexMadsor} from './wings3d_vertexmads';
import {MoveableCommand, EditCommand, EditSelectHandler} from './wings3d_undo';
import {PreviewCage} from './wings3d_model';
import * as View from './wings3d_view';
import {gl, ShaderData} from './wings3d_gl';
import * as ShaderProg from './wings3d_shaderprog';
import * as UI from './wings3d_ui';
import {action} from './wings3d';
import {DraftBench} from './wings3d_draftbench';


class FaceMadsor extends Madsor {
   constructor() {
      super('face');
      var self = this;
      UI.bindMenuItem(action.faceDissolve.name, function(ev) {
            const command = new DissolveFaceCommand(self);
            if (command.doIt()) {
               View.undoQueue(command);
            } else {
               geometryStatus('Selected Face not dissolveable');
            }
         });
      UI.bindMenuItem(action.faceCollapse.name, function(ev) {
            const command = new CollapseFaceCommand(self);
            command.doIt();
            View.undoQueue(command);
         });
      UI.bindMenuItem(action.faceBridge.name, (ev) => {
         let bridgeFaces = this.getBridgeFaces();
         if (bridgeFaces.length === 2) {
            const dest = bridgeFaces[0];
            const origin = bridgeFaces[1];
            if (dest.face.numberOfVertex == origin.face.numberOfVertex) {
               let merge;
               let bridge;
               if (dest.preview !== origin.preview) {
                  // merge dest and origin.
                  merge = new MergePreviewCommand(dest.preview, origin.preview);
                  merge.doIt();
                  bridge = new BridgeFaceCommand(merge.getCombine(), dest.face, origin.face);
               } else {
                  bridge = new BridgeFaceCommand(dest.preview, dest.face, origin.face);
               }
               bridge.doIt();
               if (merge) {
                  View.undoQueueCombo([merge, bridge]);
               } else {
                  View.undoQueue(bridge);
               }
            }
         }
       });
      UI.bindMenuItem(action.faceInset.name, (ev) => {
         if (this.hasSelection()) {
            View.attachHandlerMouseMove(new InsetFaceHandler(this));
         } else {
            geometryStatus('No selected face');
         }
       });
      UI.bindMenuItem(action.faceBump.name, (ev) => {
         View.attachHandlerMouseMove(new BumpFaceHandler(this));
       });
      UI.bindMenuItem(action.faceIntrude.name, (ev) => {
         View.attachHandlerMouseMove(new IntrudeFaceHandler(this));
       });
      UI.bindMenuItem(action.faceLift.name, (ev) => {
         const snapshots = this.snapshotAll(PreviewCage.prototype.snapshotTransformFaceGroup);
         if (snapshots.length === 1) {
            const snapshot = snapshots[0];
            View.attachHandlerMouseSelect(new LiftFaceHandler(this, snapshot.preview));
         } else {
            // helpBar("Lift works only in one Cage");
         }
        });
      UI.bindMenuItem(action.facePutOn.name, (ev)=> {
         let snapshot = [];
         for (let preview of this.selectedCage()) {
            if (preview.selectionSize() == 1) {
               snapshot.push( preview );
            }
          }
         if (snapshot.length == 1) {
            const putOn = new PutOnCommand(this, snapshot[0]);
            View.attachHandlerMouseSelect(putOn);
         } else {
            geometryStatus("You can only PutOn one face");
         }
        });
      UI.bindMenuItem(action.faceMirror.name, (ev) => {
         const command = new MirrorFaceCommand(this);
         command.doIt();
         View.undoQueue(command);
       });
      UI.bindMenuItem(action.faceFlattenNormal.name, (_ev) => {
         const cmd = new GenericEditCommand(this, this.flatten);
         if (cmd.doIt()) {
            View.undoQueue(cmd);
         }
       });
   }

   modeName() {
      return 'Face';
   }

   // get selected Face's vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      return this.snapshotAll(PreviewCage.prototype.snapshotFacePosition);
   }

   snapshotPositionAndNormal() {
      return this.snapshotAll(PreviewCage.prototype.snapshotFacePositionAndNormal);
   }

   snapshotTransformGroup() {
      return this.snapshotAll(PreviewCage.prototype.snapshotTransformFaceGroup);
   }

   bevel() {
      return this.snapshotAll(PreviewCage.prototype.bevelFace);
   }

   undoBevel(snapshots, selection) {
      this.restoreSelectionPosition(snapshots);
      // collapse extrudeEdge
      this.doAll(snapshots, PreviewCage.prototype.collapseSplitOrBevelEdge);
      // rehilite selectedFace
      this.resetSelection();
      this.restoreSelection(selection);
   }

   bump() {
      return this.snapshotAll(PreviewCage.prototype.bumpFace);
   }

   undoBump(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.undoExtrudeEdge);
   }

   // extrude Face
   extrude() {
      return this.snapshotAll(PreviewCage.prototype.extrudeFace);
   }

   undoExtrude(extrudeEdgesContoursArray) {
      this.doAll(extrudeEdgesContoursArray, PreviewCage.prototype.collapseExtrudeEdge);
   }

   collapseEdgeNew(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.collapseExtrudeEdge);
   }

   // face dissolve mode
   dissolve() {
      return this.snapshotAll(PreviewCage.prototype.dissolveSelectedFace);
   }
   undoDissolve(dissolveArray) {
      this.doAll(dissolveArray, PreviewCage.prototype.undoDissolveFace);
   }

   // face collapse 
   collapse() {
      return this.snapshotAll(PreviewCage.prototype.collapseSelectedFace);
   }
   undoCollapse(collapseArray) {
      this.doAll(collapseArray, PreviewCage.prototype.undoCollapseFace);
   }

   // intrude, 
   intrude() {
      return this.snapshotAll(PreviewCage.prototype.intrudeFace);
   }
   undoIntrude(snapshots) {
      return this.doAll(snapshots, PreviewCage.prototype.undoIntrudeFace);
   }

   // bridge
   getBridgeFaces() {
      const snapshot = [];
      for (let cage of this.selectedCage()) {
         const selection = cage.snapshotSelection();
         for (let selected of selection) {
            snapshot.push( {preview: cage, face: selected} );
         }
      }
      return snapshot;
   }

   // Inset
   inset() {
      return this.snapshotAll(PreviewCage.prototype.insetFace);
   }

   mirror() {
      return this.snapshotAll(PreviewCage.prototype.mirrorFace);
   }

   undoMirror(snapshots) {
      return this.doAll(snapshots, PreviewCage.prototype.undoMirrorFace);
   }

   flatten(axis) {
      return this.snapshotAll(PreviewCage.prototype.flattenFace, axis);
   }

   planeCuttable(plane) {
      return this.resultAll(PreviewCage.prototype.planeCuttableFace, plane);
   }

   planeCut(plane) {
      return this.snapshotAll(PreviewCage.prototype.planeCutFace, plane);
   }
   undoPlaneCut(snapshots) { // undo of splitEdge.
      this.doAll(snapshots, PreviewCage.prototype.collapseSplitOrBevelEdge);
   }

   dragSelect(cage, hilite, selectArray, onOff) {
      if (hilite.face !== null) {
        if (cage.dragSelectFace(hilite.face, onOff)) {
            selectArray.push(hilite.face);
        }
      }
   }

   // select, hilite
   selectStart(preview, hilite) {
      // check not null, shouldn't happened
      if (hilite.face !== null) {
         var onOff = preview.selectFace(hilite.face);
         return new DragFaceSelect(this, preview, hilite.face, onOff);
      }    
   }

   isFaceSelectable() { return true; }

   _resetSelection(cage) {
      cage._resetSelectFace();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreFaceSelection(snapshot);
   }
   
   toggleFunc(toMadsor) {
      const self = this;
      var redoFn;
      var snapshots;
      if (toMadsor instanceof EdgeMadsor) {
         redoFn = View.restoreEdgeMode;
         snapshots = this.snapshotAll(PreviewCage.prototype.changeFromFaceToEdgeSelect);
      } else if (toMadsor instanceof VertexMadsor) {
         redoFn = View.restoreVertexMode;
         snapshots = this.snapshotAll(PreviewCage.prototype.changeFromFaceToVertexSelect);
      } else {
         redoFn = View.restoreBodyMode;
         snapshots = this.snapshotAll(PreviewCage.prototype.changeFromFaceToBodySelect);
      }
      View.undoQueue(new ToggleModeCommand(redoFn, View.restoreFaceMode, snapshots));
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof EdgeMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromFaceToEdgeSelect);
      } else if (toMadsor instanceof VertexMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromFaceToVertexSelect);
      } else {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromFaceToBodySelect);
      }
   }

   drawObject(gl, draftBench) {
      // draw hilite
      draftBench.drawHilite(gl);
   }

   previewShader(gl) {
      gl.useShader(ShaderProg.colorSolidWireframe);
   }

   useShader(gl) {
      gl.useShader(ShaderProg.solidColor);
   }
}


class DragFaceSelect extends DragSelect {
   constructor(madsor, cage, halfEdge, onOff) {
      super(madsor, cage, halfEdge, onOff);
   }

   finish() {
      return new FaceSelectCommand(this.select);
   }
}


class FaceSelectCommand extends EditCommand {
   constructor(select) {
      super();
      this.select = select;
   }

   doIt() {
      for (var [cage, halfEdges] of this.select) {
         for (var i = 0; i < halfEdges.length; ++i) {
            cage.selectFace(halfEdges[i]);
         }
      }
   }

   undo() {
      this.doIt();   // selectEdge, flip/flop, so
   }
}


class DissolveFaceCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      const dissolve = this.madsor.dissolve();
      if (dissolve.length > 0) {
         this.dissolve = dissolve;
         return true;
      } else {
         return false;
      }
   }

   undo() {
      this.madsor.undoDissolve(this.dissolve);
   }
}

class CollapseFaceCommand extends EditCommand {
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
      this.madsor.undoCollapse(this.collapse);
      View.restoreFaceMode(this.collapse);
   }   
}


//
// current limitation, no interobject bridge yet.
//
class BridgeFaceCommand extends EditCommand {
   constructor(cage, target, source) {
      super();
      this.cage = cage;
      this.target = target;
      this.source = source;
   }

   doIt() {
      // should be ready for bridging. 
      this.bridge = this.cage.bridge(this.target, this.source);
   }

   undo() {
      this.cage.undoBridge(this.bridge);
      this.cage.restoreFaceSelection(this.bridge);
   }
}

class MergePreviewCommand extends EditCommand {
   constructor(targetCage, sourceCage) {
      super();
      this.targetCage = targetCage;
      this.sourceCage = sourceCage;
   }

   getCombine() {
      return this.combine;
   }

   doIt() {
      this.combine = View.makeCombineIntoWorld([this.targetCage, this.sourceCage]);
      this.combine.name = this.targetCage.name;
      return true;
   }

   undo() {
      View.removeFromWorld(this.combine);
      View.addToWorld(this.targetCage);
      View.addToWorld(this.sourceCage);
   }
}


class InsetFaceHandler extends MovePositionHandler {
   constructor(madsor) {
      super(madsor);
      //this.selectedFaces = madsor.snapshotSelection();
      this.movement = 0;
      this.doIt();   // init.
   }

   doIt() {
      this.snapshots = this.madsor.inset();   // should we test for current snapshots and prev snapshots?
      this.madsor.moveSelection(this.snapshots, this.movement);
      // get limit
      this.vertexLimit = Number.MAX_SAFE_INTEGER;
      for (let obj of this.snapshots) {
         this.vertexLimit = Math.min(this.vertexLimit, obj.snapshot.vertexLimit);
      } 
   }

   //_updateMovement(ev) {  // change back when we all move to moveSelection
   handleMouseMove(ev) {
      let move = this._calibrateMovement(ev.movementX);
      if ((this.movement+move) > this.vertexLimit) {
         move = this.vertexLimit - this.movement;
      } else if ((this.movement+move) < 0) {
         move = 0 - this.movement;
      }
      this.movement += move;
      this.madsor.moveSelection(this.snapshots, move);
      return move;
   }

   undo() {
      //this.madsor.restoreSelectionPosition(this.snapshots);  // do we realy needs this. since we are destroying it.
      this.madsor.collapseEdgeNew(this.snapshots);
      //this.snapshots = undefined;
   }
}

// Bump
class BumpFaceHandler extends MoveableCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.bump = madsor.bump();
      this.moveHandler = new MoveAlongNormal(madsor);
   }

   doIt() {
      this.bump = this.madsor.bump(this.bump);
      super.doIt();     // = this.madsor.moveSelection(this.snapshots, this.movement);
   }

   undo() {
      super.undo(); //this.madsor.restoreSelectionPosition(this.snapshots);
      this.madsor.undoBump(this.bump);
   }
}

// Intrude
class IntrudeFaceHandler extends MoveableCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.intrude = madsor.intrude();
      this.moveHandler = new MoveAlongNormal(madsor, true);
   }

   doIt() {
      this.intrude = this.madsor.intrude();
      super.doIt();     // = this.madsor.moveSelection(this.snapshots, this.movement);
      return true;
   }

   undo() {
      super.undo(); //this.madsor.restoreSelectionPosition(this.snapshots);
      this.madsor.undoIntrude(this.intrude);
   }
}


class LiftFaceHandler extends EditSelectHandler {  // also moveable
   constructor(madsor, preview) {
      super(false, true, false);
      this.madsor = madsor;
      this.preview = preview;
      //this.snapshot = snapshot;
      // find contours
      this.contours = this.preview.getSelectedFaceContours();
      
   }

   hilite(hilite, currentCage) {  // no needs for currentCage
      if ((currentCage === this.preview) && hilite.edge) {
         return  this.contours.edges.has(hilite.edge.wingedEdge);
      }
      return false;
   }

   select(hilite) {
      if (hilite.edge && (this.contours.edges.has(hilite.edge.wingedEdge))) {
         // compute axis and center.
         this.axis = vec3.create();
         vec3.sub(this.axis, hilite.edge.destination().vertex, hilite.edge.origin.vertex);
         this.hiliteEdge = hilite.edge;
         // lift
         this.lift = this.preview.liftFace(this.contours, hilite.edge);
         // now ready for rotation.
         this.moveHandler = new MouseRotateAlongAxis(this.madsor, this.axis, hilite.edge.origin.vertex);
         return true;
      }
      return false;
   }

   doIt() {
      this.lift = this.preview.liftFace(this.contours, this.hiliteEdge);
      super.doIt();
      return true;
   }

   undo() {
      super.doIt();  // this really not needede.
      // collapseFace
      this.preview.collapseExtrudeEdge(this.lift.extrudeEdges);
   }
}

//
class PutOnCommand extends EditSelectHandler {
   constructor(madsor, preview) {
      super(true, true, true);
      this.madsor = madsor;
      this.preview = preview;
      this.snapshot = preview.snapshotPositionAll();
   }

   hilite(_hilite, currentCage) {
      // show that hilite.vertex is actually ok or not, by changing mouse cursor.
      if (currentCage === this.preview) { // not good, we can only put on other object
         return false;
      }
      return true;
   }

   select(hilite, _currentCage) { // return true for accepting, false for continue doing things.
      if (hilite.vertex) {
         this.vertex = hilite.vertex;
         this.doIt();
         return true;
      } else if (hilite.edge) {
         this.edge = hilite.edge;
         this.doIt();
         return true;
      } else if (hilite.face) {
         this.face = hilite.face;
         this.doIt();
         return true;
      }
      // cannot possibly reach here.
      return false;
   }

   doIt() {
      if (this.vertex) {
         this.preview.putOnVertex(this.vertex);
      } else if (this.edge) {
         this.preview.putOnEdge(this.edge);
      } else if (this.face) {
         this.preview.putOnFace(this.face);
      } else {
         return false;  // should not happened.
      }
      return true;
   }

   undo() {
      this.preview.restoreMoveSelection(this.snapshot);
   }
}


class MirrorFaceCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      this.mirror = this.madsor.mirror();
   }

   undo() {
      this.madsor.undoMirror(this.mirror);
   }
}


export {
   FaceMadsor,
}