//
// bodymadsor. 
//

class BodyMadsor extends Madsor {
   constructor() {
      super('body');
      const self = this;
      let menuItem = document.querySelector('#bodyDelete');
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            const command = new DeleteBodyCommand(self.getSelected());
            Wings3D.apiExport.undoQueue( command );
            command.doIt(); // delete current selected.
         });
      }
      menuItem = document.querySelector('#bodyRename');
      if (menuItem) {
         const form = Wings3D.setupDialog('#renameDialog', function(data) {
            const command = new RenameBodyCommand(self.getSelected(), data);
            Wings3D.apiExport.undoQueue( command );
            command.doIt();   // rename
         });
         if (form) {
            // show Form when menuItem clicked
            const content = document.querySelector('#renameDialog div');
            menuItem.addEventListener('click', function(ev) {
               // position then show form;
               Wings3D.contextmenu.positionDom(form, Wings3D.contextmenu.getPosition(ev));
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
               Wings3D.view.attachHandlerMouseMove(new DuplicateMouseMoveAlongAxis(self, axis, self.getSelected()));
            });
         } 
      }
      menuItem = document.querySelector('#bodyDuplicateMoveFree');
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            Wings3D.view.attachHandlerMouseMove(new DuplicateMoveFreePositionHandler(self, self.getSelected()));
         });
      }
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

   resetSelection() {
      const snapshots = [];
      this.eachPreviewCage( function(cage) {
         snapshots.push( cage._resetBody() );
      });
      const self = this;
      return function() {
         self.restoreSelection(snapshots);
      }
   }

   restoreSelection(selection) {
      this.eachPreviewCage( function(cage, snapshot) {
         cage.restoreBodySelection(snapshot);
      }, selection);     
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof FaceMadsor) {
         redoFn = Wings3D.apiExport.restoreFaceMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromBodyToFaceSelect();
         });
      } else if (toMadsor instanceof VertexMadsor) {
         redoFn = Wings3D.apiExport.restoreVertexMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromBodyToVertexSelect();
         });
      } else {
         redoFn = Wings3D.apiExport.restoreEdgeMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromBodyToEdgeSelect();
         });
      }
      Wings3D.apiExport.undoQueue(new ToggleModeCommand(redoFn, Wings3D.apiExport.restoreBodyMode, snapshots));
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
      gl.useShader(Wings3D.shaderProg.colorSolidWireframe);
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
         Wings3D.view.removeFromWorld(previewCage);
      }
   }

   undo() {
      for (let previewCage of this.previewCages) {
         Wings3D.view.addToWorld(previewCage);
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
         Wings3D.view.addToWorld(cage);
         cage.selectBody();
      }
      this._toggleOriginalSelected();
   }

   undo() {
      for (let cage of this.duplicateCages) {
         cage.selectBody();                  // deselection before out
         Wings3D.view.removeFromWorld(cage);
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

   _commit(view) {
      const movement = new MoveCommand(this.madsor, this.snapshots, this.movement);
      view.undoQueueCombo([this.duplicateBodyCommand, movement]);
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

   _commit(view) {
      const movement = new MoveCommand(this.madsor, this.snapshots, this.movement);
      view.undoQueueCombo([this.duplicateBodyCommand, movement]);
   }

   _cancel() {
      // no needs to restore position. /this.madsor.restoreMoveSelection(this.snapshots);
      this.duplicateBodyCommand.undo();
   }

}