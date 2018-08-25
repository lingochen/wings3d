//
// bodymadsor. 
//

import {Madsor, DragSelect, MouseMoveAlongAxis, MoveFreePositionHandler, ToggleModeCommand, GenericEditCommand} from './wings3d_mads';
import {FaceMadsor} from './wings3d_facemads';   // for switching
import {EdgeMadsor} from './wings3d_edgemads';
import {VertexMadsor} from './wings3d_vertexmads';
import { EditCommand } from './wings3d_undo';
import {PreviewCage} from './wings3d_model';
import * as ShaderProg from './wings3d_shaderprog';
import * as View from './wings3d_view';
import * as UI from './wings3d_ui';
import {action} from './wings3d';


class BodyMadsor extends Madsor {
   constructor() {
      super('body');
      const self = this;
      UI.bindMenuItem(action.bodyDelete.name, function(ev) {
            const command = new DeleteBodyCommand(self.getSelected());
            View.undoQueue( command );
            command.doIt(); // delete current selected.
         });

      UI.bindMenuItem(action.bodyRename.name, function(ev) {
         UI.runDialog('#renameDialog', ev, function(data) {
               const command = new RenameBodyCommand(self.getSelected(), data);
               View.undoQueue( command );
               command.doIt();   // rename
            }, function() {
               const content = document.querySelector('#renameDialog div');
               let labels = document.querySelectorAll('#renameDialog label');
               for (let label of labels) {
                  content.removeChild(label);
               }
               // add input name 
               let array = self.getSelected();
               for (let cage of array) {
                  const label = document.createElement('label');
                  label.textContent = cage.name;
                  const input = document.createElement('input');
                  input.type = "text";
                  input.name = cage.name;
                  input.placeholder = cage.name;
                  label.appendChild(input);
                  content.appendChild(label);
               }
            });
       });
      const duplicateMove = [action.bodyDuplicateMoveX, action.bodyDuplicateMoveY, action.bodyDuplicateMoveZ];
      // movement for (x, y, z)
      for (let axis=0; axis < 3; ++axis) {
         UI.bindMenuItem(duplicateMove[axis].name, function(ev) { //action.bodyDulipcateMoveX(Y,Z)
               View.attachHandlerMouseMove(new DuplicateMouseMoveAlongAxis(self, axis, self.getSelected()));
            });
      }
      UI.bindMenuItem(action.bodyDuplicateMoveFree.name, function(ev) {
            View.attachHandlerMouseMove(new DuplicateMoveFreePositionHandler(self, self.getSelected()));
         });
      UI.bindMenuItem(action.bodyInvert.name, (ev)=> {
         const command = new InvertBodyCommand(this);
         command.doIt();
         View.undoQueue(command);
        });
      UI.bindMenuItem(action.bodyCombine.name, (ev)=> {
         const command = new CombineBodyCommand(this);
         if (command.doIt()) {   // do we really have 2 + objects?
            View.undoQueue(command);
         }
       });
      UI.bindMenuItem(action.bodySeparate.name, (ev)=> {
         const command = new SeparateBodyCommand(this);
         if (command.doIt()) {   // check if separable.
            View.undoQueue(command);
         }
       });
      const flip = [action.bodyFlipX, action.bodyFlipY, action.bodyFlipZ];
      // flip for (x, y, z)
      for (let axis=0; axis < 3; ++axis) {
         UI.bindMenuItem(flip[axis].name, (ev) => { //action.bodyFlipX(Y,Z)
            //View.undoQueue(new FlipBodyAxis(this, axis));
            const command = new FlipBodyAxis(this, axis);
            command.doIt();
            View.undoQueue(command);
          });
      }
      const axisVec = [[1,0,0], [0,1,0], [0,0,1]];
      const slice = [action.bodySliceX, action.bodySliceY, action.bodySliceZ];
      for (let axis = 0; axis < 3; ++axis) {
         UI.bindMenuItem(slice[axis].name, (ev) => {
            UI.runDialog('#sliceBodyDialog', ev, (data)=> {
               if (data['amountRange']) {
                  const number = parseInt(data['amountRange'], 10);
                  if ((number != NaN) && (number > 0) && (number < 100)) { // sane input
                     const command = new GenericEditCommand(this, this.slice, [axisVec[axis], number], this.undoPlaneCut);
                     if (command.doIt()) {
                        const vertexMadsor = View.currentMode();   // assurely it vertexMode
                        vertexMadsor.andConnectVertex(command);
                     } else { // should not happened, make some noise

                     }
                  }
               }
             });
          });
      }
      // weld
      UI.bindMenuItem(action.bodyWeld.name, (ev)=> {
         const cmd = new GenericEditCommand(this, this.weld);
         if (cmd.doIt()) {
            View.undoQueue(command);
         }
       });
   }

   modeName() {
      return 'Body';
   }

   getSelected() {
      const selection = [];
      for (let cage of this.selectedCage()) {
         selection.push(cage);
      }
      return selection;
   }

   snapshotPosition() {
      return this.snapshotAll(PreviewCage.prototype.snapshotBodyPosition);
   }

   snapshotTransformGroup() {
      return this.snapshotAll(PreviewCage.prototype.snapshotTransformBodyGroup);
   }

   combine(cageSelection) {
      if (cageSelection === undefined) {
         cageSelection = [];
         for (let cage of this.selectedCage()) {
            cageSelection.push( cage );
         }
      }
      // needs least 2 selected cage2.
      if (cageSelection.length >= 2) {
         // now do merge operation.
         const combine = View.makeCombineIntoWorld(cageSelection);
         combine.name = cageSelection[0].name;
         combine.selectBody();
         return {combine: combine, oldSelection: cageSelection};
      }
      return null;
   }
   undoCombine(combine) {
      if (combine) {
         View.removeFromWorld(combine.combine);
         for (let cage of combine.oldSelection) {
            View.addToWorld(cage);  // restore oldCage
         }
      }
   }

   separate() {
      const selection = [];
      for (let cage of this.selectedCage()) {
         let snapshot = cage.separate();
         if (snapshot.length > 0) {
            selection.push( {preview: cage, snapshot: snapshot} );
         }
      }
      for (let separate of selection) {
         // remove original
         View.removeFromWorld(separate.preview);
         // add the separates one.
         for (let preview of separate.snapshot) {
            View.addToWorld(preview);     // has to addToWorld after separate all selection, or we will mess up the iteration.
         }
      }
      return selection;
   }
   undoSeparate(separateSelection) {
      for (let separate of separateSelection) {
         for (let preview of separate.snapshot) {
            View.removeFromWorld(preview);
         }
         // addback the original one
         View.addToWorld(separate.preview);
      }
   }

   invert() {
      for (let cage of this.selectedCage()) {
         cage.invertBody();
      }
      // invert the draftBench's preview and update
      View.updateWorld();
      this.hiliteView = null; // invalidate hilite
   }

   flipAxis(snapShotPivot, axis) {
      this.doAll(snapShotPivot, PreviewCage.prototype.flipBodyAxis, axis);
      View.updateWorld();
   }

   planeCuttable(plane) {
      return this.resultAll(PreviewCage.prototype.planeCuttableFace, plane);
   }
   planeCut(plane) {
      return this.snapshotAll(PreviewCage.prototype.planeCutBody, plane);
   }
   undoPlaneCut(snapshots) { // undo of splitEdge.
      this.doAll(snapshots, PreviewCage.prototype.collapseSplitOrBevelEdge);
      View.restoreBodyMode(snapshots);
   }

   slice(planeNormal, numberOfPart) {
      const snapshots = this.snapshotAll(PreviewCage.prototype.sliceBody, planeNormal, numberOfPart);
      View.restoreVertexMode(snapshots);
      return snapshots;
   }

   weld(tolerance = 0.001) {
      const extent = {min: vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), 
                      max: vec3.fromValues(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE)};
      const selection = [];
      // adds up all selected object's face
      for (let cage of this.selectedCage()) {
         cage.getBodySelection(selection, extent);
      }
      // sort by longest length.
      let order = Util.getAxisOrder(extent);
      selection.sort( (a, b) => {
         for (let i = 0; i < 3; ++i) {
            let result = a.center[order[i]] - b.center[order[i]];
            if (result !== 0.0) {
               return result;
            }
         }
         return (a.polygon.index - b.polygon.index);
       });

      // find weldable pair
      const merged = PreviewCage.findOverlapFace(selection); 
      // now find the contours of potential mergers.
      const weldContours = PreviewCage.findWeldContours(merged);
      if (weldContours !== false) {
         // combine cages
         const combinedCages = [];
         const combined = new Map;
         for (let cages of weldContours.combineCages) {
            const result = this.combine(cages);
            combined.set(cages, result);
            combinedCages.push( result );
         }
         // make holes of weldable polygons.
         const holes = PreviewCage.weldHoles(merged);
         // now weld the contours
         const mergeCage = PreviewCage.weldBody(combined, weldContours);
         // return undo result;

         return {holes: holes, weldContours: weldContours, };
      }
      // unable to weld
      return false;
   }

   centroid() {
      return this.snapshotAll(PreviewCage.prototype.bodyCentroid);
   }

   dragSelect(cage, hilite, selectArray, onOff) {
      if (hilite.edge !== null) {
       // if (cage.dragSelectFace(this.currentEdge, onOff)) {
       //     selectArray.push(this.currentEdge);
       // }
      }
   }

   // select, hilite
   selectStart(preview, hilite) {
      // check not null, shouldn't happened
      if (hilite.cage !== null) {
         var onOff = preview.selectBody();
         return new DragBodySelect(this, preview, hilite.edge, onOff);
      }    
   }

   selectBody(snapshots) { // use for unselect by similarSelection.
      for (let cage of snapshots) {
         cage.selectBody();
      }
   }

   similarSelection() {
      // first compute selected body's metric
      const snapshot = new Set;
      for (let cage of this.selectedCage()) {
         const size = cage._getGeometrySize();
         const metric = size.vertex*3 + size.edge*2 + size.face;
         snapshot.add(metric);
      }
      const restore = [];
      // now check if some of the unselected bodys match selected body.
      for (let cage of this.notSelectedCage()) {
         const size = cage._getGeometrySize();
         const metric = size.vertex*3 + size.edge*2 + size.face;
         if (snapshot.has(metric)) {
            cage.selectBody();
            restore.push(cage);
         }
      }
      if (restore.length > 0) {
         return {undo: this.selectBody, snapshots: restore};   // restore all 
      }
      return false;
   }

   adjacentSelection() {
      return false;   // does nothing.
   }

   moreSelection() {
      return false;      // does nothing.
   }

   _resetSelection(cage) {
      cage._resetBody();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreBodySelection(snapshot);
   }

   toggleFunc(toMadsor) {
//      this.hiliteView = null;
//      this.hideOldHilite();
//      this.hiliteView = null;
      const self = this;
      var redoFn;
      var snapshots;
      if (toMadsor instanceof FaceMadsor) {
         redoFn = View.restoreFaceMode;
         snapshots = this.snapshotAll(PreviewCage.prototype.changeFromBodyToFaceSelect);
      } else if (toMadsor instanceof VertexMadsor) {
         redoFn = View.restoreVertexMode;
         snapshots = this.snapshotAll(PreviewCage.prototype.changeFromBodyToVertexSelect);
      } else {
         redoFn = View.restoreEdgeMode;
         snapshots = this.snapshotAll(PreviewCage.prototype.changeFromBodyToEdgeSelect);
      }
      View.undoQueue(new ToggleModeCommand(redoFn, View.restoreBodyMode, snapshots));
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof FaceMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromBodyToFaceSelect);
      } else if (toMadsor instanceof VertexMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromBodyToVertexSelect);
      } else {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromBodyToEdgeSelect);
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


class DragBodySelect extends DragSelect {
   constructor(madsor, cage, halfEdge, onOff) {
      super(madsor, cage, halfEdge, onOff);
   }

   finish() {
      return new BodySelectCommand(this.select);
   }
}

class BodySelectCommand extends EditCommand {
   constructor(select) {
      super();
      this.select = select;
   }

   doIt() {
      for (var [cage, halfEdges] of this.select) {
         if (halfEdges.length > 0) {
            cage.selectBody();
         }
      }
   }

   undo() {
      this.doIt();   // selectEdge, flip/flop, so
   }

}

class DeleteBodyCommand extends EditCommand {
   constructor(previewCages) {
      super();
      this.previewCages = previewCages;
   }

   doIt() {
      for (let previewCage of this.previewCages) {
         View.removeFromWorld(previewCage);
      }
   }

   undo() {
      for (let previewCage of this.previewCages) {
         View.addToWorld(previewCage);
      }
   }
}

class RenameBodyCommand extends EditCommand {
   constructor(previewCages, data) {
      super();
      this.previewCages = previewCages;
      this.newName = data;
      this.oldName = new Map;
   }

   doIt() {
      for (let cage of this.previewCages) {
         if (this.newName.hasOwnProperty(cage.name)) {
            if (!this.oldName.has(cage.name)) {
               this.oldName.set(cage.name, cage);
            }
            cage.name = this.newName[cage.name];
            geometryStatus("Object new name is " + cage.name);
         }
      }
   }

   undo() {
      for (let [name, cage] of this.oldName) {
         cage.name = name;
         geometryStatus("Object restore name to " + cage.name);
      }  
   }
}


class DuplicateBodyCommand extends EditCommand {
   constructor(originalCages) {
      super();
      this.originalCages = originalCages;
      this.duplicateCages = [];
      for (let cage of originalCages) {
         let duplicate = PreviewCage.duplicate(cage);
         this.duplicateCages.push( duplicate );
      }
   }

   _toggleOriginalSelected() {
      for (let cage of this.originalCages) {
         cage.selectBody();
      }
   }

   doIt() {
      for (let cage of this.duplicateCages) {
         View.addToWorld(cage);
         cage.selectBody();
      }
      this._toggleOriginalSelected();
   }

   undo() {
      for (let cage of this.duplicateCages) {
         cage.selectBody();                  // deselection before out
         View.removeFromWorld(cage);
      }
      this._toggleOriginalSelected();        // reselected the original
   }
}

class DuplicateMouseMoveAlongAxis extends MouseMoveAlongAxis {
   constructor(madsor, axis, originalCages) {
      const duplicateBodyCommand = new DuplicateBodyCommand(originalCages);
      duplicateBodyCommand.doIt();
      super(madsor, axis);
      this.duplicateBodyCommand = duplicateBodyCommand;
   }

   doIt() {
      this.duplicateBodyCommand.doIt();
      super.doIt();     // movement.
   }

   undo() {
      super.undo();
      this.duplicateBodyCommand.undo();
   }
}

class DuplicateMoveFreePositionHandler extends MoveFreePositionHandler {
   constructor(madsor, originalCages) {
      const duplicateBodyCommand = new DuplicateBodyCommand(originalCages);
      duplicateBodyCommand.doIt();
      super(madsor);
      this.duplicateBodyCommand = duplicateBodyCommand;
   }

   doIt() {
      this.duplicateBodyCommand.doIt();
      super.doIt();     // movement.
      return true;
   }

   undo() {
      super.undo();
      this.duplicateBodyCommand.undo();
   }
}

class InvertBodyCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      this.madsor.invert();
      return true;
   }

   undo() {
      this.madsor.invert();
   }   
}

class CombineBodyCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      this.combine = this.madsor.combine();
      if (this.combine) {
         return true;
      } else {
         return false;
      }
   }

   undo() {
      this.madsor.undoCombine(this.combine);
      this.combine = null; // release memory
   } 
};


class SeparateBodyCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      this.separate = this.madsor.separate();
      return (this.separate.length > 0);
   }

   undo() {
      this.madsor.undoSeparate(this.separate);
      this.separate = null; // release memory
   } 
};


class FlipBodyAxis extends EditCommand {
   constructor(madsor, axis) {
      super();
      this.madsor = madsor;
      this.axis = axis;
      this.pivot = madsor.centroid();
   }

   doIt() {
      this.madsor.flipAxis(this.pivot, this.axis);
      return true;
   }

   undo() {
      this.madsor.flipAxis(this.pivot, this.axis);
   }
}


export {
   BodyMadsor,
}