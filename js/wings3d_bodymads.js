//
// bodymadsor. 
//

import {Madsor, DragSelect, MouseMoveAlongAxis, MoveFreePositionHandler } from './wings3d_mads';
import { EditCommand } from './wings3d_undo';
import * as ShaderProg from './wings3d_shaderprog';
import * as View from './wings3d_view';
import * as UI from './wings3d_ui';


class BodyMadsor extends Madsor {
   constructor() {
      super('body');
      const self = this;
      let menuItem = document.querySelector('#bodyDelete');
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            const command = new DeleteBodyCommand(self.getSelected());
            View.undoQueue( command );
            command.doIt(); // delete current selected.
         });
      }
      menuItem = document.querySelector('#bodyRename');
      if (menuItem) {
         const form = UI.setupDialog('#renameDialog', function(data) {
            const command = new RenameBodyCommand(self.getSelected(), data);
            View.undoQueue( command );
            command.doIt();   // rename
         });
         if (form) {
            // show Form when menuItem clicked
            const content = document.querySelector('#renameDialog div');
            menuItem.addEventListener('click', function(ev) {
               // position then show form;
               UI.positionDom(form, UI.getPosition(ev));
               form.style.display = 'block';
               // remove old label
               form.reset();
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
         }
      }
      const axisName = ['X', 'Y', 'Z'];
      // movement for (x, y, z)
      for (let axis=0; axis < 3; ++axis) {
         menuItem = document.querySelector('#bodyDuplicateMove' + axisName[axis]);
         if (menuItem) {
            menuItem.addEventListener("click", function(ev) {
               View.attachHandlerMouseMove(new DuplicateMouseMoveAlongAxis(self, axis, self.getSelected()));
            });
         } 
      }
      menuItem = document.querySelector('#bodyDuplicateMoveFree');
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            View.attachHandlerMouseMove(new DuplicateMoveFreePositionHandler(self, self.getSelected()));
         });
      }
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
      this.preview.hiliteBody(false);
   }

   showNewHilite(_edge, _intersect, _center) {
      this.preview.hiliteBody(true);
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
      return cage._resetBody();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreBodySelection(snapshot);
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof FaceMadsor) {
         redoFn = View.restoreFaceMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromBodyToFaceSelect();
         });
      } else if (toMadsor instanceof VertexMadsor) {
         redoFn = View.restoreVertexMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromBodyToVertexSelect();
         });
      } else {
         redoFn = View.restoreEdgeMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
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

   draw(gl) {} // override draw

   previewShader(gl) {
      gl.useShader(ShaderProg.colorSolidWireframe);
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

   _commit() {
      const movement = new MoveCommand(this.madsor, this.snapshots, this.movement);
      View.undoQueueCombo([this.duplicateBodyCommand, movement]);
   }

   _cancel() {
      // no needs to restore position. /this.madsor.restoreMoveSelection(this.snapshots);
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

   _commit() {
      const movement = new MoveCommand(this.madsor, this.snapshots, this.movement);
      View.undoQueueCombo([this.duplicateBodyCommand, movement]);
   }

   _cancel() {
      // no needs to restore position. /this.madsor.restoreMoveSelection(this.snapshots);
      this.duplicateBodyCommand.undo();
   }

}

export {
   BodyMadsor,
}