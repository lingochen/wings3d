/**
//    This module contains most face command and face utility functions.
//
//    
**/
import {Madsor, DragSelect, MouseMoveAlongAxis, MoveAlongNormal, MoveFreePositionHandler, ToggleModeCommand} from './wings3d_mads';
import {EdgeMadsor} from './wings3d_edgemads';   // for switching
import {BodyMadsor} from './wings3d_bodymads';
import {VertexMadsor} from './wings3d_vertexmads';
import { EditCommand } from './wings3d_undo';
import { PreviewCage } from './wings3d_model';
import * as View from './wings3d_view';
import {gl, ShaderData} from './wings3d_gl';
import * as ShaderProg from './wings3d_shaderprog';
import * as UI from './wings3d_ui';
import {action} from './wings3d';



class FaceMadsor extends Madsor {
   constructor() {
      super('face');
      var self = this;
      // extrude
      const axisName = [action.faceExtrudeX, action.faceExtrudeY, action.faceExtrudeZ];
      // movement for (x, y, z)
      for (let axis=0; axis < 3; ++axis) {
         UI.bindMenuItem(axisName[axis].name, function(ev) {
               View.attachHandlerMouseMove(new FaceExtrudeHandler(self, axis));
            });
      }
      UI.bindMenuItem(action.faceExtrudeFree.name, function(ev) {
            View.attachHandlerMouseMove(new FaceExtrudeFreeHandler(self));
         });
      UI.bindMenuItem(action.faceExtrudeNormal.name, function(ev) {
            View.attachHandlerMouseMove(new FaceExtrudeNormalHandler(self));
         });
      UI.bindMenuItem(action.faceDissolve.name, function(ev) {
            const command = new DissolveFaceCommand(self);
            if (command.doIt()) {
               View.undoQueue(command);
            } else {
               geometryStatus('Selected Face not dissolveable');
            }
         });
      UI.bindMenuItem(action.faceCollapse.name, function(ev) {
            const command = new CollapseFaceCommand(self);
            command.doIt();
            View.undoQueue(command);
         });
      UI.bindMenuItem(action.faceBridge.name, (ev) => {
         let bridgeFaces = this.getBridgeFaces();
         if (bridgeFaces.length === 2) {
            const dest = bridgeFaces[0];
            const origin = bridgeFaces[1];
            if (dest.face.numberOfVertex == origin.face.numberOfVertex) {
               let merge;
               if (dest.preview !== origin.preview) {
                  // merge dest and origin.
                  merge = new MergePreviewCommand(dest.preview, origin.preview);
                  merge.doIt();
               }
               const bridge = new BridgeFaceCommand(dest.preview, dest.face, origin.face);
               bridge.doIt();
               if (merge) {
                  View.undoQueueCombo([merge, bridge]);
               } else {
                  View.undoQueue(bridge);
               }
            }
         }
       });
      // setup highlite face, at most 28 triangles.
      var buf = new Float32Array(3*30);
      this.trianglefan = {data: buf, length: 0};
      var layout = ShaderData.attribLayout();
      this.shaderData.setupAttribute('position', layout, this.trianglefan.data, gl.DYNAMIC_DRAW);  // needs to import gl.DYNAMIC_DRAW. 
   }

   modeName() {
      return 'Face';
   }

   // get selected Face's vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotFacePosition() );
      });
      return snapshots;
   }

   snapshotPositionAndNormal() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotFacePositionAndNormal() );
      });
      return snapshots;
   }

   snapshotTransformGroup() {
      return this.snapshotAll(PreviewCage.prototype.snapshotTransformFaceGroup);
   }

   // extrude Face
   extrude(reuseLoops) {
      var edgeLoops = [];
      this.eachPreviewCage( function(preview, contours) {
         edgeLoops.push( preview.extrudeFace(contours) );
      }, reuseLoops);
      return edgeLoops;
   }

   collapseEdge(extrudeEdgesContoursArray) {
      this.eachPreviewCage(function(cage, extrudeEdgesContours) {
         cage.collapseExtrudeEdge(extrudeEdgesContours.extrudeEdges);
      }, extrudeEdgesContoursArray);
   }

   // face dissolve mode
   dissolve() {
      const dissolve = {count: 0, record: []};
      this.eachPreviewCage(function(cage) {
         const record = cage.dissolveSelectedFace();
         dissolve.count += record.edges.length;
         dissolve.record.push( record );
      });
      return dissolve;
   }
   undoDissolve(dissolveArray) {
      this.eachPreviewCage( function(cage, dissolveEdge) {
         cage.undoDissolveFace(dissolveEdge);
      }, dissolveArray);
   }

   // face collapse 
   collapse() {
      const collapse = {count: 0, collapse: []};
      this.eachPreviewCage(function(cage) {
         const record = cage.collapseSelectedFace();
         collapse.count += record.collapse.edges.length;
         collapse.collapse.push( record );
      });
      return collapse;
   }
   undoCollapse(collapseArray) {
      this.eachPreviewCage( function(cage, collapse) {
         cage.undoCollapseFace(collapse);
      }, collapseArray);
   }

   // bridge
   getBridgeFaces() {
      const snapshot = [];
      this.eachPreviewCage( (cage) => {
         const selection = cage.snapshotSelection();
         for (let selected of selection) {
            snapshot.push( {preview: cage, face: selected} );
         }
      });
      return snapshot;
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

   _resetSelection(cage) {
      return this._wrapSelection(cage._resetSelectFace());
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreFaceSelection(snapshot);
   }

   _wrapSelection(selection) {
      return {selectedFaces: selection };
   }
   
   toggleFunc(toMadsor) {
      const self = this;
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof EdgeMadsor) {
         redoFn = View.restoreEdgeMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( self._wrapSelection(cage.snapshotSelection()) );
            cage.changeFromFaceToEdgeSelect();
         });
      } else if (toMadsor instanceof VertexMadsor) {
         redoFn = View.restoreVertexMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push(  self._wrapSelection(cage.snapshotSelection()) );
            cage.changeFromFaceToVertexSelect();
         });
      } else {
         redoFn = View.restoreBodyMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push(  self._wrapSelection(cage.snapshotSelection()) );
            cage.changeFromFaceToBodySelect();
         });
      }
      View.undoQueue(new ToggleModeCommand(redoFn, View.restoreFaceMode, snapshots));
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof EdgeMadsor) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromFaceToEdgeSelect(snapshot);
         }, snapshots);
      } else if (toMadsor instanceof VertexMadsor) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromFaceToVertexSelect(snapshot);
         }, snapshots);
      } else {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromFaceToBodySelect(snapshot);
         }, snapshots);
      }
   }

   drawObject(gl) {
      // draw hilite
      gl.drawArrays(gl.TRIANGLE_FAN, 0, this.trianglefan.length);
   }

   previewShader(gl) {
      gl.useShader(ShaderProg.colorSolidWireframe);
   }

   useShader(gl) {
      gl.useShader(ShaderProg.solidColor);
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

class FaceExtrudeHandler extends MouseMoveAlongAxis {
   constructor(madsor, axis) {
      const contourEdges = madsor.extrude();
      super(madsor, axis);
      this.contourEdges = contourEdges;
   }

   _commit() {
      View.undoQueue(new ExtrudeFaceCommand(this.madsor, this.movement, this.snapshots, this.contourEdges));
   }

   _cancel() {
      this.madsor.restoreMoveSelection(this.snapshots);
      this.madsor.collapseEdge(this.contourEdges);
   }
}

class FaceExtrudeFreeHandler extends MoveFreePositionHandler {
   constructor(madsor) {
      const contourEdges = madsor.extrude();
      super(madsor);
      this.contourEdges = contourEdges;
   }

   _commit() {
      View.undoQueue(new ExtrudeFaceCommand(this.madsor, this.movement, this.snapshots, this.contourEdges));
   }

   _cancel() {
      this.madsor.restoreMoveSelection(this.snapshots);
      this.madsor.collapseEdge(this.contourEdges);
   }
}

class FaceExtrudeNormalHandler extends MoveAlongNormal {
   constructor(madsor) {
      const contourEdges = madsor.extrude();
      super(madsor);
      this.contourEdges = contourEdges;
   }

   _commit() {
      View.undoQueue(new ExtrudeFaceCommand(this.madsor, this.movement, this.snapshots, this.contourEdges, true));
   }

   _cancel() {
      this.madsor.restoreMoveSelection(this.snapshots);
      this.madsor.collapseEdge(this.contourEdges);
   }
}

class ExtrudeFaceCommand extends EditCommand {
   constructor(faceMadsor, movement, snapshots, extrudeEdgesContours, useNormal = false) {
      super();
      this.madsor = faceMadsor;
      this.movement = movement;
      this.snapshots = snapshots;
      this.useNormal = useNormal;
      this.extrudeEdgesContoursArray = extrudeEdgesContours;
   }

   doIt() {
      this.extrudeEdgesContoursArray = this.madsor.extrude( this.extrudeEdgesContoursArray );
      if (this.useNormal) {
         this.snapshots = this.madsor.snapshotPositionAndNormal();
      } else {
         this.snapshots = this.madsor.snapshotPosition();
      }
      this.madsor.moveSelection(this.movement, this.snapshots);
   }

   undo() {
      this.madsor.restoreMoveSelection(this.snapshots);
      this.madsor.collapseEdge(this.extrudeEdgesContoursArray);
   }
}

class DissolveFaceCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      const dissolve = this.madsor.dissolve();
      if (dissolve.count > 0) {
         this.dissolve = dissolve.record;
         return true;
      } else {
         return false;
      }
   }

   undo() {
      this.madsor.undoDissolve(this.dissolve);
   }
}

class CollapseFaceCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      let collapseCount;
      ({count: collapseCount, collapse: this.collapse} = this.madsor.collapse());
      if (collapseCount > 0) {
         View.restoreVertexMode(this.collapse);
         return true;
      } else {
         return false;
      }
   }

   undo() {
      View.currentMode().resetSelection();
      this.madsor.undoCollapse(this.collapse);
      View.restoreFaceMode(this.collapse);
   }   
}


//
// current limitation, no interobject bridge yet.
//
class BridgeFaceCommand extends EditCommand {
   constructor(cage, target, source) {
      super();
      this.cage = cage;
      this.target = target;
      this.source = source;
   }

   doIt() {
      // should be ready for bridging. 
      this.bridge = this.cage.bridge(this.target, this.source);
   }

   undo() {
      this.cage.undoBridge(this.bridge);
   }
}


export {
   FaceMadsor,
}