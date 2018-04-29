/**
//    This module handle most vertex edit command.
//
//    
**/
import {Madsor, DragSelect, ToggleModeCommand} from './wings3d_mads';
import {FaceMadsor} from './wings3d_facemads';   // for switching
import {BodyMadsor} from './wings3d_bodymads';
import {EdgeMadsor} from './wings3d_edgemads';
import { EditCommand } from './wings3d_undo';
import {PreviewCage} from './wings3d_model';
import * as View from './wings3d_view';
import * as ShaderProg from './wings3d_shaderprog';
import * as UI from './wings3d_ui';
import {action} from './wings3d';



class VertexMadsor extends Madsor {
   constructor() {
      super('vertex');
      this.currentVertex = null;
      const self = this;
      UI.bindMenuItem(action.vertexConnect.name, function(ev) {
            self.connectVertex();
         });
      UI.bindMenuItem(action.vertexDissolve.name, function(ev) {
            const dissolve = new VertexDissolveCommand(self);
            dissolve.doIt();
            View.undoQueue(dissolve);
         });
      UI.bindMenuItem(action.vertexCollapse.name, function(ev) {
            const dissolve = new VertexCollapseCommand(self);
            dissolve.doIt();
            View.undoQueue(dissolve);
         });
   }

   modeName() {
      return 'Vertex';
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

   snapshotTransformGroup() {
      return this.snapshotAll(PreviewCage.prototype.snapshotTransformVertexGroup);
   }

   bevel() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.bevelVertex() );
      });
      // change to facemode.
      View.restoreFaceMode(snapshots);
      return snapshots;
   }

   undoBevel(snapshots, selection) {
      this.restoreMoveSelection(snapshots);
      // collapse extrudeEdge
      this.eachPreviewCage(function(cage, collapse) {
         cage.collapseSplitOrBevelEdge(collapse);
      }, snapshots);
      // restore Vertex Selection
      View.restoreVertexMode(selection); 
   }

   // extrude Vertex
   extrude() {
      var edgeLoops = [];
      this.eachPreviewCage( function(preview, contours) {
         edgeLoops.push( preview.extrudeVertex(contours) );
      });
      return edgeLoops;
   }
   undoExtrude(extrudeData) {
      this.eachPreviewCage(function(cage, extrude) {
         cage.undoExtrudeVertex(extrude);
      }, extrudeData);
   }

   connectVertex() {
      const vertexConnect = new VertexConnectCommand(this);
      if (vertexConnect.doIt()) {
         View.undoQueue(vertexConnect);   // saved for undo
      } else {
         // show no connection possible message.
      }
   }

   connect() {
      let snapshots = [];
      let total = 0;
      this.eachPreviewCage( function(cage) {
         const snapshot = cage.connectVertex();
         total += snapshot.halfEdges.length;
         snapshots.push( snapshot );
      });
      if (total > 0) {
         return snapshots;
      }
      // return undefined, or null?
      return undefined;
   };

   dissolveConnect(edgesArray) {
      this.eachPreviewCage( function(cage, edges) {
         cage.dissolveConnect(edges.halfEdges);
      }, edgesArray);
   }

   dissolve() {
      const dissolve = {count: 0, undo: []};
      this.eachPreviewCage(function(cage) {
         const undo = cage.dissolveSelectedVertex();
         dissolve.count += undo.array.length;
         dissolve.undo.push( undo );
      });
      return dissolve;
   }

   undoDissolve(dissolveArray) {
      this.eachPreviewCage( function(cage, dissolveVertex) {
         cage.undoDissolveVertex(dissolveVertex.array);
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

   _resetSelection(cage) {
      return this._wrapSelection(cage._resetSelectVertex());
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreVertexSelection(snapshot);
   }

   _wrapSelection(selection) {
      return {vertices: selection};
   }

   toggleFunc(toMadsor) {
      const self = this;
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof FaceMadsor) {
         redoFn = View.restoreFaceMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( self._wrapSelection(cage.snapshotSelection()) );
            cage.changeFromVertexToFaceSelect();
         } );
      } else if (toMadsor instanceof EdgeMadsor) {
         redoFn = View.restoreEdgeMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( self._wrapSelection(cage.snapshotSelection())  );
            cage.changeFromVertexToEdgeSelect();
         });
      } else {
         redoFn = View.restoreEdgeMode;
         this.eachPreviewCage( function(cage) {
            snapshots.push( self._wrapSelection(cage.snapshotSelection())  );
            cage.changeFromVertexToBodySelect();
         });      
      }
      View.undoQueue( new ToggleModeCommand(redoFn, View.restoreVertexMode, snapshots) );
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
      gl.useShader(ShaderProg.solidWireframe);
   }

   useShader(gl) {
      gl.useShader(ShaderProg.selectedColorPoint);
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
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      // reconnect
      this.cageArray = this.madsor.connect();
      if (this.cageArray) { // goes to edgeMode.
         View.restoreEdgeMode(this.cageArray);    // abusing the api?
         return true;
      }
      return false;
   }

   undo() {
      // restore to vertexMode.
      View.restoreVertexMode();
      // dissolve the connect edges.
      this.madsor.dissolveConnect(this.cageArray);
   }  
}

class VertexDissolveCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      // dissolve, guaranteed dissolveCount > 0
      ({count: this.dissolveCount, undo: this.dissolve} = this.madsor.dissolve());
   }

   undo() {
      this.madsor.undoDissolve(this.dissolve);
   }
}

class VertexCollapseCommand extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      // collapse, is just like dissolve, but switch to facemode
      ({count: this.dissovleCount, undo: this.dissolve} = this.madsor.dissolve());
      View.restoreFaceMode(this.dissolve);
   }

   undo() {
      this.madsor.resetSelection();
      View.restoreVertexMode();
      this.madsor.undoDissolve(this.dissolve);
   }
}


export {
   VertexMadsor,
   VertexConnectCommand,
}