/**
//    This module handle most vertex edit command.
//
//    
**/


class VertexMadsor extends Madsor {
   constructor() {
      super();
      this.currentVertex = null;
   }

   select(preview) {
      //
      if (this.currentVertex !== null) {
         this.preview.selectVertex(this.currentVertex);
         Wings3D.view.undoQueue(new SelectVertexCommand(preview, this.currentVertex));
      }
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
      //}
   }

   previewShader(gl) {
      gl.useShader(Wings3D.shaderProg.solidWireframe);
   }

   useShader(gl) {
      gl.useShader(Wings3D.shaderProg.selectedColorPoint);
   }
} 

class SelectVertexCommand extends EditCommand {
   constructor(previewCage, current) {
      super();
      this.previewCage = previewCage;
      this.vertex = current;
   }

   doIt() {
      this.previewCage.selectVertex(this.vertex);
   }

   undo() {
      this.previewCage.selectVertex(this.vertex);
   }
}