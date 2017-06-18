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
      const self = this;
      for (let numberOfSegments of [2, 3, 4, 5, 10]) {
         let menuItem = document.querySelector('#cutLine'+numberOfSegments);
         if (menuItem) {
            menuItem.addEventListener('click', function(ev) {
               self.cutEdge(numberOfSegments);
            });
         }
      }
      // cutEdge Dialog
      let menuItem = document.querySelector('#cutAsk');
      if (menuItem) {
         const form = Wings3D.setupDialog('#cutLineDialog', function(data) {
            if (data['Segments']) {
               const number = parseInt(data['Segments'], 10);
               if ((number != NaN) && (number > 0) && (number < 100)) { // sane input
                  self.cutEdge(number);
               }
            }
         });
         if (form) {
            // show Form when menuItem clicked
            menuItem.addEventListener('click', function(ev) {
               // position then show form;
               Wings3D.contextmenu.positionDom(form, Wings3D.contextmenu.getPosition(ev));
               form.style.display = 'block';
               form.reset();
            });
         }
      }
      // cutAndConnect
      menuItem = document.querySelector('#cutAndConnect');
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            self.cutAndConnect();
         });
      }
      // Dissolve
      menuItem = document.querySelector('#edgeDissolve');
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            const dissolve = self.dissolve();
            if (dissolve.count > 0) {
               Wings3D.view.undoQueue(new DissolveEdgeCommand(self, dissolve.record));
            } else {
               // should not happened.
            }
         });
      }
      // Collapse
      menuItem = document.querySelector('#edgeCollapse');
        if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            const collapse = self.collapse();
            if (collapse.count > 0) {
               Wings3D.view.undoQueue(new CollapseEdgeCommand(self, collapse.record));
            } else {
               // should not happened.
            }
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

   snapshotPositionAndNormal() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotEdgePositionAndNormal() );
      });
      return snapshots;
   }

   cutEdge(numberOfSegments) {
      const cutEdge = new CutEdgeCommand(this, numberOfSegments);
      Wings3D.apiExport.undoQueue(cutEdge);
      cutEdge.doIt();
   }

   cutAndConnect() {
      const cutEdge = new CutEdgeCommand(this, 2);
      cutEdge.doIt();
      let vertexMadsor = Wings3D.apiExport.currentMode();   // assurely it vertexMode
      let result = vertexMadsor.connect();
      if (result) {
         const vertexConnect = new VertexConnectCommand(vertexMadsor, result);
         Wings3D.apiExport.undoQueueCombo([cutEdge, vertexConnect]);
         Wings3D.apiExport.restoreEdgeMode(result.wingedEdgeList);
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
      const collapse = {count: 0, record: []};
      this.eachPreviewCage(function(cage) {
         const record = cage.collapseSelectedEdge();
         collapse.count += record.length;
         collapse.record.push( record );
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

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof FaceMadsor) {
         redoFn = Wings3D.apiExport.restoreFaceMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromEdgeToFaceSelect();
         });
      } else if (toMadsor instanceof VertexMadsor) {
         redoFn = Wings3D.apiExport.restoreVertexMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromEdgeToVertexSelect();
         });         
      } else {
         redoFn = Wings3D.apiExport.restoreBodyMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromEdgeToBodySelect();
         });
      }
      Wings3D.apiExport.undoQueue(new ToggleModeCommand(redoFn, Wings3D.apiExport.restoreEdgeMode, snapshots));
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
      Wings3D.apiExport.restoreVertexMode(snapshots.vertices);    // abusing the api?
      this.splitEdges = snapshots.splitEdges;
   }

   undo() {
      // restoreToEdgeMode
      this.madsor.collapseEdge(this.splitEdges);
      Wings3D.apiExport.restoreEdgeMode(this.selectedEdges);
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
   constructor(madsor, collapseEdges) {
      super();
      this.madsor = madsor;
      this.collapseEdges = collapseEdges;
   }

   doIt() {
      this.madsor.collapse();
   }

   undo() {
      this.madsor.restoreEdge(this.collapseEdges);
   }
}