/**
//    This module contains most face command and face utility functions.
//
//    
**/
import {Madsor, DragSelect, TweakMove, MoveLimitHandler, GenericEditCommand, MoveAlongNormal, MouseRotateAlongAxis, ToggleModeCommand} from './wings3d_mads.js';
import {EdgeMadsor} from './wings3d_edgemads.js';   // for switching
import {BodyMadsor} from './wings3d_bodymads.js';
import {VertexMadsor} from './wings3d_vertexmads.js';
import {MoveableCommand, EditCommand, EditSelectHandler} from './wings3d_undo.js';
import {PreviewCage} from './wings3d_model.js';
import * as View from './wings3d_view.js';
import * as UI from './wings3d_ui.js';
import {action} from './wings3d.js';


class FaceMadsor extends Madsor {
   constructor() {
      super('Face');
      var self = this;
      UI.bindMenuItemMode(action.faceDissolve.name, function(ev) {
            const command = new DissolveFaceCommand(self);
            if (command.doIt()) {
               View.undoQueue(command);
            } else {
               geometryStatus('Selected Face not dissolveable');
            }
         }, this, 'Backspace');
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
            const cmd = new GenericEditCommand(this, this.inset, [], this.collapseEdgeNew, []);
            const move = new MoveLimitHandler(this, cmd);
            move.doIt();
            View.attachHandlerMouseMove(move);
            //View.attachHandlerMouseMove(new InsetFaceHandler(this));
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
         const snapshots = this.snapshotSelected(PreviewCage.prototype.snapshotTransformFaceGroup);
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
      //UI.bindMenuItem(action.faceExtractNormal.name, (_ev)=>{
      //   const extract = new GenericEditCommand(this, this.extract(), null, this.undoExtract);
      //   const cmd = new MoveAlongNormal(this, true, extract);
      //   cmd.doIt();
      //   View.undoQueue(cmd);
      // });
   }

   // get selected Face's vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      return this.snapshotSelected(PreviewCage.prototype.snapshotFacePosition);
   }

   snapshotPositionAndNormal() {
      return this.snapshotSelected(PreviewCage.prototype.snapshotFacePositionAndNormal);
   }

   snapshotTransformGroup() {
      return this.snapshotSelected(PreviewCage.prototype.snapshotTransformFaceGroup);
   }

   //extract() {
   //   return this.snapshotSelected(PreviewCage.prototype.extractFace);
   //}

   //undoExtract(snapshots, _selection) {
   //
   //}

   bevel() {
      return this.snapshotSelected(PreviewCage.prototype.bevelFace);
   }

   undoBevel(snapshots, _selection) {  // collapse extrudeEdge
      this.doAll(snapshots, PreviewCage.prototype.collapseSplitOrBevelEdge);

   }

   bump() {
      return this.snapshotSelected(PreviewCage.prototype.bumpFace);
   }

   undoBump(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.undoExtrudeEdge);
   }

   // extrude Face
   extrude() {
      return this.snapshotSelected(PreviewCage.prototype.extrudeFace);
   }

   undoExtrude(extrudeEdgesContoursArray) {
      this.doAll(extrudeEdgesContoursArray, PreviewCage.prototype.collapseExtrudeEdge);
   }

   collapseEdgeNew(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.collapseExtrudeEdge);
   }

   // face dissolve mode
   dissolve() {
      return this.snapshotSelected(PreviewCage.prototype.dissolveSelectedFace);
   }
   undoDissolve(dissolveArray) {
      this.doAll(dissolveArray, PreviewCage.prototype.undoDissolveFace);
   }

   // face collapse 
   collapse() {
      return this.snapshotSelected(PreviewCage.prototype.collapseSelectedFace);
   }
   undoCollapse(collapseArray) {
      this.doAll(collapseArray, PreviewCage.prototype.undoCollapseFace);
   }

   // intrude, 
   intrude() {
      return this.snapshotSelected(PreviewCage.prototype.intrudeFace);
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
      return this.snapshotSelected(PreviewCage.prototype.insetFace);
   }

   mirror() {
      return this.snapshotSelected(PreviewCage.prototype.mirrorFace);
   }

   undoMirror(snapshots) {
      return this.doAll(snapshots, PreviewCage.prototype.undoMirrorFace);
   }

   flatten(axis) {
      return this.snapshotSelected(PreviewCage.prototype.flattenFace, axis);
   }

   planeCuttable(plane) {
      return this.resultAll(PreviewCage.prototype.planeCuttableFace, plane);
   }
   planeCut(plane) {
      return this.snapshotSelected(PreviewCage.prototype.planeCutFace, plane);
   }
   undoPlaneCut(snapshots) { // undo of splitEdge.
      this.doAll(snapshots, PreviewCage.prototype.collapseSplitOrBevelEdge);
      View.restoreFaceMode(snapshots);
   }

   assignMaterial(material) {
      return this.snapshotSelected(PreviewCage.prototype.assignFaceMaterial, material);
   }
   undoAssignMaterial(saved) {
      return this.doAll(saved, PreviewCage.prototype.undoAssignFaceMaterial);
   }

   setVertexColor(color) {
      return this.snapshotSelected(PreviewCage.prototype.setFaceColor, color);
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

   _tweakMode(model, hilite, magnet) {
      return new TweakMoveFace(model, hilite, magnet);
   }

   isFaceSelectable() { return true; }

   _resetSelection(cage) {
      return cage._resetSelectFace();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreFaceSelection(snapshot);
   }
   
   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots;
      if (toMadsor instanceof EdgeMadsor) {
         redoFn = View.restoreEdgeMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromFaceToEdgeSelect);
      } else if (toMadsor instanceof VertexMadsor) {
         redoFn = View.restoreVertexMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromFaceToVertexSelect);
      } else if (toMadsor instanceof BodyMadsor) {
         redoFn = View.restoreBodyMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromFaceToBodySelect);
      } else {
         redoFn = View.restoreMultiMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromFaceToMultiSelect);
      }
      return new ToggleModeCommand(redoFn, View.restoreFaceMode, snapshots);
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof EdgeMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromFaceToEdgeSelect);
      } else if (toMadsor instanceof VertexMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromFaceToVertexSelect);
      } else if (toMadsor instanceof BodyMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromFaceToBodySelect);
      } else {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromFaceToMultiSelect);
      }
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


class TweakMoveFace extends TweakMove {
   constructor(model, hilite, magnet) {
      let face = model.tweakFace(hilite.face);
      super(model);
      if (face) {
         this.face = face;
      }
   }

   finish() {
      // deselect hilite if not already select.
      if (this.face) {   // deselect
         this.model.selectFace(this.face);
      }
      this.moveHandler.commit();
      return this.moveHandler;
   }

   finishAsSelect(hilite) {
      if (!this.face) { // remember to deselect
         this.model.selectFace(hilite.face);
      }
      const select = new Map;
      select.set(this.model, [hilite.face]);
      return new FaceSelectCommand(select);
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
         vec3.sub(this.axis, hilite.edge.destination(), hilite.edge.origin);
         this.hiliteEdge = hilite.edge;
         // lift
         this.lift = this.preview.liftFace(this.contours, hilite.edge);
         // now ready for rotation.
         this.moveHandler = new MouseRotateAlongAxis(this.madsor, this.axis, hilite.edge.origin);
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
      super.undo();
      // collapseFace
      this.preview.collapseExtrudeEdge(this.lift);
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
      this.preview.updatePosition(this.snapshot);  // update body
      return true;
   }

   undo() {
      this.preview.restoreMoveSelection(this.snapshot);
      this.preview.updatePosition(this.snapshot);
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