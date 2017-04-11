/**
//    This module contains most face command and face utility functions.
//
//    
**/

class FaceMadsor extends Madsor {
   constructor() {
      super();
      // setup highlite face, at most 18 triangles.
      var buf = new Float32Array(3*20);
      this.trianglefan = {data: buf, length: 0};
      this.shaderData.setPosition(this.trianglefan.data);      
   }

   select(preview) {
      // check not null, shouldn't happened
      if (this.currentEdge !== null) {
         preview.selectFace(this.currentEdge);
         Wings3D.view.undoQueue(new SelectFaceCommand(preview, this.currentEdge));
      }    
   }

   showNewHilite(edge, intersect, center) {
      if ((this.currentEdge === null) || (this.currentEdge.face !== edge.face)) {   // make sure it new face
         if (edge.face.numberOfVertex < 17) {
            var position = this.trianglefan.data;
            var i = 0;
            position[i++] = center[0];
            position[i++] = center[1];
            position[i++] = center[2];
            edge.face.eachVertex( function(vertex) {
               position[i++] = vertex.vertex[0];
               position[i++] = vertex.vertex[1];
               position[i++] = vertex.vertex[2];
            });
            // copied the first vertex to complete fan
            position[i++] = position[3];
            position[i++] = position[4];
            position[i++] = position[5];
            this.trianglefan.length = i / 3;
            // update vbo buffer
            this.shaderData.updatePosition(this.trianglefan.data);
         }
      }
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof EdgeMadsor) {
         redoFn = Wings3D.apiExport.restoreEdgeMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromFaceToEdgeSelect();
         });
      } else {
         redoFn = Wings3D.apiExport.restoreVertexMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromFaceToVertexSelect();
         });
      }
      Wings3D.apiExport.undoQueue(new ToggleModeCommand(redoFn, Wings3D.apiExport.restoreFaceMode, snapshots));
   }


   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof EdgeMadsor) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromFaceToEdgeSelect(snapshot);
         }, snapshots);
      } else {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromFaceToVertexSelect(snapshot);
         }, snapshots);
      }
   }

   drawObject(gl) {
      // draw hilite
      gl.drawArrays(gl.TRIANGLE_FAN, 0, this.trianglefan.length);
   }

   previewShader(gl) {
      gl.useShader(Wings3D.shaderProg.colorSolidWireframe);
   }

   useShader(gl) {
      gl.useShader(Wings3D.shaderProg.solidColor);
   }
}

class SelectFaceCommand extends EditCommand {
   constructor(previewCage, current) {
      super();
      this.previewCage = previewCage;
      this.halfEdge = current;
   }

   doIt() {
      this.previewCage.selectFace(this.halfEdge);
   }

   undo() {
      this.previewCage.selectFace(this.halfEdge);
   }
}