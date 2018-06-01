//
// bodymadsor. 
//

import {Madsor, DragSelect, MouseMoveAlongAxis, MoveFreePositionHandler, ToggleModeCommand } from './wings3d_mads';
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
   }

   modeName() {
      return 'Body';
   }

   getSelected() {
      const selection = [];
      this.eachPreviewCage( function(cage) {
         if (cage.hasSelection()) {
            selection.push(cage);
         }
      });
      return selection;
   }

   snapshotPosition() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotBodyPosition() );
      });
      return snapshots;
   }

   snapshotTransformGroup() {
      return this.snapshotAll(PreviewCage.prototype.snapshotTransformBodyGroup);
   }

   combine() {
      const cageSelection = [];
      this.eachPreviewCage((cage)=> {
         if (cage.hasSelection()) {
            cageSelection.push( cage );
         }
       });
      // got at least 2 selected cage2.
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
      this.eachPreviewCage((cage)=> {
         if (cage.hasSelection()) {
            cage.invertBody();
         }
       });
      // invert the draftBench's preview and update
      View.updateWorld();
      this.hiliteView = null; // invalidate hilite
   }

   dragSelect(cage, selectArray, onOff) {
      if (this.currentEdge !== null) {
       // if (cage.dragSelectFace(this.currentEdge, onOff)) {
       //     selectArray.push(this.currentEdge);
       // }
      }
   }

   // select, hilite
   selectStart(preview) {
      // check not null, shouldn't happened
      if (this.currentEdge !== null) {
         var onOff = preview.selectBody();
         return new DragBodySelect(this, preview, this.currentEdge, onOff);
      }    
   }

   hideOldHilite() {
      if (this.hiliteView !== this.preview) {
         this.preview.hiliteBody(false);
         this.hiliteView = this.preview;
      }
   }

   showNewHilite(_edge, _intersect, _center) {
      if (this.hiliteView !== this.preview) {
         this.preview.hiliteBody(true);
         this.hiliteView = this.preview;
      }
   }

   similarSelection() {
      // first compute selected body's metric
      const snapshot = new Set;
      this.eachPreviewCage( function(cage) {
         if (cage.hasSelection()) {
            const size = cage._getGeometrySize();
            const metric = size.vertex*3 + size.edge*2 + size.face;
            snapshot.add(metric);
         } 
      });
      const restore = [];
      // now check if some of the unselected bodys match selected body.
      this.eachPreviewCage( function(cage) {
         if (!cage.hasSelection()) {
            const size = cage._getGeometrySize();
            const metric = size.vertex*3 + size.edge*2 + size.face;
            if (snapshot.has(metric)) {
               cage.selectBody();
               restore.push(cage);
            }
         }
      });
      if (restore.length > 0) {
         return function() {  // restore to previous state
            for (let cage in restore) {
               cage.selectBody();
            }
         };
      } else {
         return null;
      }
   }

   adjacentSelection() {
      return null;   // does nothing.
   }

   moreSelection() {
      return null;      // does nothing.
   }

   _resetSelection(cage) {
      return this._wrapSelection(cage._resetBody());
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreBodySelection(snapshot);
   }

   _wrapSelection(selection) {
      return {body: selection};
   }

   toggleFunc(toMadsor) {
      this.hiliteView = null;
      this.hideOldHilite();
      this.hiliteView = null;
      const self = this;
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof FaceMadsor) {
         redoFn = View.restoreFaceMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( self._wrapSelection(cage.snapshotSelection()) );
            cage.changeFromBodyToFaceSelect();
         });
      } else if (toMadsor instanceof VertexMadsor) {
         redoFn = View.restoreVertexMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( self._wrapSelection(cage.snapshotSelection()) );
            cage.changeFromBodyToVertexSelect();
         });
      } else {
         redoFn = View.restoreEdgeMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( self._wrapSelection(cage.snapshotSelection()) );
            cage.changeFromBodyToEdgeSelect();
         });
      }
      View.undoQueue(new ToggleModeCommand(redoFn, View.restoreBodyMode, snapshots));
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof FaceMadsor) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromBodyToFaceSelect(snapshot);
         }, snapshots);
      } else if (toMadsor instanceof VertexMadsor) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromBodyToVertexSelect(snapshot);
         }, snapshots);
      } else {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromBodyToEdgeSelect(snapshot);
         }, snapshots);
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
      if (this.combine) {
         return true;
      } else {
         return false;
      }
   }

   undo() {
      this.madsor.undoSeparate(this.separate);
      this.separate = null; // release memory
   } 
};

export {
   BodyMadsor,
}