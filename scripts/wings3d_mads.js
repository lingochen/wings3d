/*
 *
 * MADS (Modify, Add, Delete, Select) operation. 
 *
**/
"use strict";

class Madsor { // Modify, Add, Delete, Select, (Mads)tor. Model Object.
   constructor() {
      this.currentEdge = null;
      this.shaderData = Wings3D.gl.createShaderData();
      this.shaderData.setUniform4fv("uColor", [0.0, 1.0, 0.0, 0.3]); // hilite green, selected hilite yellow.
   }

   // can be use arguments object?
   eachPreviewCage(func, items) {
      if (items) {
         for (var i = 0; i < this.world.length; ++i) {
            func(this.world[i], items[i]);
         }
      } else {
         for (var i = 0; i < this.world.length; ++i) {
            func(this.world[i]);
         }
      }
   }

   snapshotSelection() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotSelection() );
      });
      return snapshots;
   }

   setWorld(world) {
      this.world = world;
   }

   setPreview(preview) {
      this.preview = preview;
   }

   setCurrent(edge, intersect, center) {
      if (this.currentEdge !== edge) {
         if (this.currentEdge !== null) {
            this.hideOldHilite();
         }
         if (edge !== null) {
            this.showNewHilite(edge, intersect, center);
         }
         this.currentEdge = edge;
      }
   }

   hideOldHilite() {}

   draw(gl) {
      if (this.currentEdge) {
         this.useShader(gl);
         gl.bindTransform();
         gl.bindShaderData(this.shaderData, false);
         this.drawObject(gl);
      }
   }
}


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


class VertexMadsor extends Madsor {
   constructor() {
      super();
      this.currentVertex = null;
   }

   select(preview) {
      //
      if (this.currentVertex !== null) {
         this.preview.selectVertex(this.currentVertex);
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

// movement handler.
class MouseMoveX extends MouseMoveHandler {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.snapshots = madsor.snapshotPosition();
      this.movement = [0.0, 0.0, 0.0];             // cumulative movement.
   }

   handleMouseMove(ev) {
      // todo: instead of magic constant. should supply a scaling factor.
      var x = ev.movementX/20.0;
      if (x >= 2) {
         x = 2;
      }
      this.madsor.moveSelection([x, 0.0, 0.0], this.snapshots);
      this.movement[0] += x;
   }

   _commit(view) {
      view.undoQueue(new MoveCommand(this.madsor, this.snapshots, this.movement));
   }

   _cancel() {
      this.madsor.restoreMoveSelection(this.snapshots);
   }
}

class MoveCommand extends EditCommand {
   constructor(madsor, snapshots, movement) {
      super();
      this.madsor = madsor;
      this.snapshots = snapshots;
      this.movement = movement;
   }

   doIt() {
      this.madsor.moveSelection(this.movement, this.snapshots);
   }

   undo() {
      this.madsor.restoreMoveSelection(this.snapshots);
   }
}

class ToggleModeCommand extends EditCommand {
   constructor(doFn, undoFn, snapshots) {
      super();
      this.snapshots = snapshots;
      this.redoToggle = doFn;
      this.undoToggle = undoFn;
   }

   doIt() {
      this.redoToggle();
   }

   undo() {
      // toggle back
      this.undoToggle(this.snapshots);
   }
}