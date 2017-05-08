/**
//    This module contains most edge command and edge utility functions.
//
//    
**/



// 
class EdgeMadsor extends Madsor {
   constructor() {
      super('edge');
      // cut commands
      var self = this;
      var menuItem = document.querySelector('#cutLine2');
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            const cutEdge = new CutEdgeCommand(self, 2);
            Wings3D.apiExport.undoQueue(cutEdge);
            cutEdge.doIt();
         });
      }
   }

   // get selected Edge's vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotEdgePosition() );
      });
      return snapshots;
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

   collapseEdge(splitEdgesArray) {
      this.eachPreviewCage(function(cage, splitEdges) {
         cage.collapseSplitEdge(splitEdges);
      }, splitEdgesArray);
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

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof FaceMadsor) {
         redoFn = Wings3D.apiExport.restoreFaceMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromEdgeToFaceSelect();
         });
      } else {
         redoFn = Wings3D.apiExport.restoreVertexMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromEdgeToVertexSelect();
         });
         
      }
      Wings3D.apiExport.undoQueue(new ToggleModeCommand(redoFn, Wings3D.apiExport.restoreEdgeMode, snapshots));
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof FaceMadsor) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromEdgeToFaceSelect(snapshot);
         }, snapshots);
      } else {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromEdgeToVertexSelect(snapshot);
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
      gl.useShader(Wings3D.shaderProg.solidWireframe);
   }

   useShader(gl) {
      //gl.useShader(Wings3D.shaderProg.solidColor);
      gl.useShader(Wings3D.shaderProg.selectedColorLine);
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
      Wings3D.apiExport.restoreVertexMode(snapshots.vertices);    // abusing the api?
      this.splitEdges = snapshots.splitEdges;
   }

   undo() {
      // restoreToEdgeMode
      this.madsor.collapseEdge(this.splitEdges);
      Wings3D.apiExport.restoreEdgeMode(this.selectedEdges);
   }
}
