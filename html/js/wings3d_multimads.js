/*
 *
 * MADS (Modify, Add, Delete, Select) operation. only toggling function
 *
**/

import {Madsor, ToggleModeCommand} from './wings3d_mads.js';
import {FaceMadsor} from './wings3d_facemads.js';
import {EdgeMadsor} from './wings3d_edgemads.js';
import {VertexMadsor} from './wings3d_vertexmads.js';
import {PreviewCage} from './wings3d_model.js';
import * as ShaderProg from './wings3d_shaderprog.js';
import * as View from './wings3d_view.js';


class MultiMadsor extends Madsor {
   constructor() {
      super('Multi');
   }

   selectMaterialCmd(material) { // override
      // toggleToFaceMode - queue an extra command.
      View.toggleFaceMode();
      // now run faceMode.selectMaterial
      return View.currentMode().selectMaterialCmd(material);
   }

   isFaceSelectable() { return true; }
   isEdgeSelectable() { return true; }
   isVertexSelectable() { return true; }

   toggleMulti(hilite) {
      if (hilite.face) {
         View.toggleFaceMode();
      } else if (hilite.vertex) {
         View.toggleVertexMode();
      } else {    // if (hilite.edge) {   
         View.toggleEdgeMode();
      } // not body possible.
   }

   _doSelection() {
      return false;
   }

   toggleFunc(toMadsor) {
      let redoFn;
      let snapshots;
      if (toMadsor instanceof FaceMadsor) {
         redoFn = View.restoreFaceMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromMultiToFaceSelect);
      } else if (toMadsor instanceof VertexMadsor) {
         redoFn = View.restoreVertexMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromMultiToVertexSelect);
      } else if (toMadsor instanceof EdgeMadsor) {
         redoFn = View.restoreEdgeMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromMultiToEdgeSelect);
      } else { // bodyMadsor
         redoFn = View.restoreEdgeMode;
         snapshots = this.snapshotSelected(PreviewCage.prototype.changeFromMultiToBodySelect);
      }
      return new ToggleModeCommand(redoFn, View.restoreMultiMode, snapshots);
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof FaceMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromMultiToFaceSelect);
      } else if (toMadsor instanceof VertexMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromMultiToVertexSelect);
      } else if (toMadsor instanceof EdgeMadsor) {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromMultiToEdgeSelect);
      } else {
         this.doAll(snapshots, PreviewCage.prototype.restoreFromMultiToBodySelect);      
      }
   }

   
   polygonShader(gl, _hilite) {
      gl.useShader(ShaderProg.drawSelectablePolygon);
   }
   edgeShader(gl, hilite) {
      if (hilite) {
         gl.useShader(ShaderProg.selectedWireframeLine);
      } else {
         gl.useShader(ShaderProg.wireframeLine);
      }
   }
   vertexShader(gl, hilite) {  // let vertexMadsor override.
      if (hilite) {
         gl.useShader(ShaderProg.selectedColorPoint)
         return true;
      }
      return false;        
   }
};


export {
   MultiMadsor
}