/**
//    This module contains most face command and face utility functions.
//
//    
**/

class FaceMadsor extends Madsor {
   constructor() {
      super('face');
      var self = this;
      // extrude
      var menuItem = document.querySelector('#faceExtrude');
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            Wings3D.view.attachHandlerMouseMove(new FaceExtrudeHandler(self));
         });
      } 
      // setup highlite face, at most 18 triangles.
      var buf = new Float32Array(3*20);
      this.trianglefan = {data: buf, length: 0};
      var layout = ShaderData.attribLayout();
      this.shaderData.setupAttribute('position', layout, this.trianglefan.data, Wings3D.gl.DYNAMIC_DRAW);      
   }

   // get selected Face's vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotFacePosition() );
      });
      return snapshots;
   }

   // extrude Face
   extrudeFace() {
      var edgeLoops = [];
      this.eachPreviewCage( function(preview) {
         edgeLoops.push( preview.extrudeFace() );
      });
      return edgeLoops;
   }

   collapseEdge(extrudeEdgesContoursArray) {
      this.eachPreviewCage(function(cage, extrudeEdgesContours) {
         var edges = [].concat.apply([], extrudeEdgesContours);
         cage.collapseEdge(edges);
      }, extrudeEdgesContoursArray);
   }

   dragSelect(cage, selectArray, onOff) {
      if (this.currentEdge !== null) {
        if (cage.dragSelectFace(this.currentEdge, onOff)) {
            selectArray.push(this.currentEdge);
        }
      }
   }

   // select, hilite
   selectStart(preview) {
      // check not null, shouldn't happened
      if (this.currentEdge !== null) {
         var onOff = preview.selectFace(this.currentEdge);
         return new DragFaceSelect(this, preview, this.currentEdge, onOff);
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
            this.shaderData.uploadAttribute('position', 0, this.trianglefan.data);
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


class DragFaceSelect extends DragSelect {
   constructor(madsor, cage, halfEdge, onOff) {
      super(madsor, cage, halfEdge, onOff);
   }

   finish() {
      return new FaceSelectCommand(this.select);
   }
}


class FaceSelectCommand extends EditCommand {
   constructor(select) {
      super();
      this.select = select;
   }

   doIt() {
      for (var [cage, halfEdges] of this.select) {
         for (var i = 0; i < halfEdges.length; ++i) {
            cage.selectFace(halfEdges[i]);
         }
      }
   }

   undo() {
      this.doIt();   // selectEdge, flip/flop, so
   }
}

class FaceExtrudeHandler extends MovePositionHandler {
   constructor(madsor) {
      const contourEdges = madsor.extrudeFace();
      super(madsor);
      this.contourEdges = contourEdges;
      this.axis = 0;
   }


   handleMouseMove(ev) {
      var move = this._calibrateMovement(ev.movementX);
      var movement = [0.0, 0.0, 0.0];
      movement[this.axis] = move;
      this.madsor.moveSelection(movement, this.snapshots);
      this.movement[this.axis] += move;
   }
   _commit(view) {
      view.undoQueue(new ExtrudeFaceCommand(this.madsor, this.movement, this.contourEdges));
   }

   _cancel() {
      this.madsor.collapseEdge(this.contourEdges);
   }
}

class ExtrudeFaceCommand extends EditCommand {
   constructor(faceMadsor, movement, extrudeEdgesContours) {
      super();
      this.madsor = faceMadsor;
      this.movement = movement;
      this.extrudeEdgesContoursArray = extrudeEdgesContours;
   }

   doIt() {
      this.extrudeEdgesContoursArray = this.madsor.extrudeFace();
      this.snapshots = this.madsor.snapshotPosition();
      this.madsor.moveSelection(this.movement, this.snapshots);
   }

   undo() {
      this.madsor.collapseEdge(this.extrudeEdgesContoursArray);
   }
}