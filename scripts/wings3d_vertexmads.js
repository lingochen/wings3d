/**
//    This module handle most vertex edit command.
//
//    
**/


class VertexMadsor extends Madsor {
   constructor() {
      super('vertex');
      this.currentVertex = null;
      const self = this;
      let menuItem = document.querySelector('#vertexConnect');
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            self.connectVertex();
         });
      }
      menuItem = document.querySelector('#vertexDissolve');
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            const dissolve = new VertexDissolveCommand(self);
            dissolve.doIt();
            Wings3D.apiExport.undoQueue(dissolve);
         });
      }
      menuItem = document.querySelector('#vertexCollapse');
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            const dissolve = new VertexCollapseCommand(self);
            dissolve.doIt();
            Wings3D.apiExport.undoQueue(dissolve);
         });  
      }
    }
   // get selected vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotVertexPosition() );
      });
      return snapshots;
   }

   snapshotPositionAndNormal() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotVertexPositionAndNormal() );
      });
      return snapshots;
   }

   connectVertex() {
      const cageArray = this.connect();
      if (cageArray) {
         const vertexConnect = new VertexConnectCommand(this, cageArray);
         Wings3D.apiExport.undoQueue(vertexConnect);
         Wings3D.apiExport.restoreEdgeMode(cageArray.wingedEdgeList);    // abusing the api?
      } else {
         // show no connection possible message.

      }
   }

   connect() {
      let snapshots = {edgeList: [], wingedEdgeList: []};
      let total = 0;
      this.eachPreviewCage( function(cage) {
         const snapshot = cage.connectVertex();
         total += snapshot.edgeList.length;
         snapshots.edgeList.push( snapshot.edgeList );
         snapshots.wingedEdgeList.push( snapshot.wingedEdgeList );
      });
      if (total > 0) {
         return snapshots;
      }
      // return undefined, or null?
      return undefined;
   };

   dissolveConnect(edgesArray) {
      this.eachPreviewCage( function(cage, edges) {
         cage.dissolveConnect(edges);
      }, edgesArray);
   }

   dissolve() {
      const dissolve = {count: 0, undoArray: [], selectedFace: []};
      this.eachPreviewCage(function(cage) {
         const undo = cage.dissolveSelectedVertex();
         dissolve.count += undo.array.length;
         dissolve.undoArray.push( undo.array );
         dissolve.selectedFace.push( undo.selectedFace );
      });
      return dissolve;
   }

   undoDissolve(dissolveArray) {
      this.eachPreviewCage( function(cage, dissolveVertex) {
         cage.undoDissolveVertex(dissolveVertex);
      }, dissolveArray);
   }

   dragSelect(cage, selectArray, onOff) {
      if (this.currentVertex !== null) {
        if (cage.dragSelectVertex(this.currentVertex, onOff)) {
            selectArray.push(this.currentVertex);
        }
      }
   }

   selectStart(cage) {
      //
      if (this.currentVertex !== null) {
         var onOff = this.preview.selectVertex(this.currentVertex);
         return new DragVertexSelect(this, cage, this.currentVertex, onOff);
      }
      return null;
   }

   setCurrent(edge, intersect, center) {
      // find out origin, dest. which is closer.
      var currentVertex = null;
      if (edge !== null) {
         currentVertex = edge.destination();
         var distance0 = vec3.distance(edge.origin.vertex, intersect);
         var distance1 = vec3.distance(currentVertex.vertex, intersect);
         if (distance0 < distance1) {
            currentVertex = edge.origin;
         }
      }
      if (currentVertex !== this.currentVertex) {
         if (this.currentVertex !== null) {
            this.preview.hiliteVertex(this.currentVertex, false);
         }
         if (currentVertex !== null) {
            this.preview.hiliteVertex(currentVertex, true);
         }
         this.currentVertex = currentVertex;
      }
      this.currentEdge = edge;
   }

   resetSelection() {
      const snapshots = [];
      this.eachPreviewCage( function(cage) {
         snapshots.push( cage._resetSelectVertex() );
      });
      const self = this;
      return function() {
         self.restoreSelection(snapshots);
      }
   }

   restoreSelection(selection) {
      this.eachPreviewCage( function(cage, snapshot) {
         cage.restoreVertexSelection(snapshot);
      }, selection);
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof FaceMadsor) {
         redoFn = Wings3D.apiExport.restoreFaceMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromVertexToFaceSelect();
         } );
      } else if (toMadsor instanceof EdgeMadsor) {
         redoFn = Wings3D.apiExport.restoreEdgeMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromVertexToEdgeSelect();
         });
      } else {
         redoFn = Wings3D.apiExport.restoreEdgeMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromVertexToBodySelect();
         });      
      }
      Wings3D.apiExport.undoQueue( new ToggleModeCommand(redoFn, Wings3D.apiExport.restoreVertexMode, snapshots) );
   }


   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof FaceMadsor) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromVertexToFaceSelect(snapshot);
         }, snapshots);
      } else if (toMadsor instanceof EdgeMadsor) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromVertexToEdgeSelect(snapshot);
         }, snapshots);
      } else {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromVertexToBodySelect(snapshot);
         }, snapshots);
      }
   }

   draw(gl) {
      // draw hilite
      //if (this.currentEdge) {
         this.useShader(gl);
         gl.bindTransform();
         this.eachPreviewCage( function(preview) {
            preview.drawVertex(gl);
         });
         gl.disableShader();
      //}
   }

   previewShader(gl) {
      gl.useShader(Wings3D.shaderProg.solidWireframe);
   }

   useShader(gl) {
      gl.useShader(Wings3D.shaderProg.selectedColorPoint);
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
   constructor(madsor, cageArray) {
      super();
      this.madsor = madsor;
      this.cageArray = cageArray;
   }

   doIt() {
      // reconnect
      this.cageArray = this.madsor.connect();
      // goes to edgeMode.
      Wings3D.apiExport.restoreEdgeMode(this.cageArray.wingedEdgeList);    // abusing the api?
   }

   undo() {
      // restore to vertexMode.
      Wings3D.apiExport.restoreVertexMode();
      // dissolve the connect edges.
      this.madsor.dissolveConnect(this.cageArray.edgeList);
   }  
}

class VertexDissolveCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      // dissolve
      const dissolve = this.madsor.dissolve();
      this.undoArray = dissolve.undoArray;         // guaranteed to have the dissolve vertex
   }

   undo() {
      this.madsor.undoDissolve(this.undoArray);
   }
}

class VertexCollapseCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      // collapse, is just like dissolve, but switch to facemode
      const dissolve = this.madsor.dissolve();
      this.undoArray = dissolve.undoArray;
      Wings3D.apiExport.restoreFaceMode(dissolve.selectedFace);
   }

   undo() {
      this.madsor.resetSelection();
      Wings3D.apiExport.restoreVertexMode();
      this.madsor.undoDissolve(this.undoArray);
   }
}
