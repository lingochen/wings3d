/**
//    This module handle most vertex edit command.
//
//    
**/


class VertexMadsor extends Madsor {
   constructor() {
      super('vertex');
      this.currentVertex = null;
      let self = this;
      var menuItem = document.querySelector('#vertexConnect');
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            const cageArray = self.connect();
            let total = 0;
            for (let insertEdges of cageArray.edgeList) {
               total += insertEdges.length;
            }
            if (total > 0) {
               //const vertexConnect = new VertexConnectCommand(self, cageArray);
               //Wings3D.apiExport.undoQueue(vertexConnect);
               Wings3D.apiExport.restoreEdgeMode(cageArray.wingedEdgeList);    // abusing the api?
            } else {
               // show no connection message.

            }
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

   connect() {
      let snapshots = {edgeList: [], wingedEdgeList: []};
      this.eachPreviewCage( function(cage) {
         const snapshot = cage.connectVertex();
         snapshots.edgeList.push( snapshot.edgeList );
         snapshots.wingedEdgeList.push( snapshot.wingedEdgeList );
      });
      return snapshots;
   };

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

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof FaceMadsor) {
         redoFn = Wings3D.apiExport.restoreFaceMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromVertexToFaceSelect();
         } );
      } else {
         redoFn = Wings3D.apiExport.restoreEdgeMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromVertexToEdgeSelect();
         });
      }
      Wings3D.apiExport.undoQueue( new ToggleModeCommand(redoFn, Wings3D.apiExport.restoreVertexMode, snapshots) );
   }


   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof FaceMadsor) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromVertexToFaceSelect(snapshot);
         }, snapshots);
      } else {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromVertexToEdgeSelect(snapshot);
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
   constructor(madsor, insertEdges) {
      super();
      this.madsor = madsor;
      this.insertEdges = insertEdges;
   }

   doIt() {}

   undo() {}
   
}
