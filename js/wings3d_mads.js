/*
 *
 * MADS (Modify, Add, Delete, Select) operation. 
 *
**/
import {gl} from './wings3d_gl';
import {EditCommand, MouseMoveHandler, MoveableCommand} from './wings3d_undo';
import {PreviewCage} from './wings3d_model';
import * as View from './wings3d_view';
import * as UI from './wings3d_ui';
import {action} from './wings3d';


class Madsor { // Modify, Add, Delete, Select, (Mads)tor. Model Object.
   constructor(mode) {
      const self = this;
      // contextMenu
      this.contextMenu = {menu: document.querySelector("#"+mode+"-context-menu")};
      if (this.contextMenu.menu) {
         this.contextMenu.menuItems = this.contextMenu.menu.querySelectorAll(".context-menu__item");
      }
      const axisName = ['X', 'Y', 'Z'];
      // type handler 
      // movement for (x, y, z)
      for (let axis=0; axis < 3; ++axis) {
         UI.bindMenuItem(mode + 'Move' + axisName[axis], function(ev) {
               View.attachHandlerMouseMove(new MouseMoveAlongAxis(self, axis));
            });
      }
      // free Movement.
      const moveFree = {body: action.bodyMoveFree, face: action.faceMoveFree, edge: action.edgeMoveFree, vertex: action.vertexMoveFree};
      UI.bindMenuItem(moveFree[mode].name, function(ev) {
            View.attachHandlerMouseMove(new MoveFreePositionHandler(self));
         });
      // normal Movement.
      const moveNormal = {face: action.faceMoveNormal, edge: action.edgeMoveNormal, vertex: action.vertexMoveNormal};
      if (moveNormal[mode]) {
         UI.bindMenuItem(moveNormal[mode].name, function(ev) {
            View.attachHandlerMouseMove(new MoveAlongNormal(self));
          });
      }
      // scale uniform
      const scaleUniform = {face: action.faceScaleUniform};
      if (scaleUniform[mode]) {
         UI.bindMenuItem(scaleUniform[mode].name, function(ev) {
            View.attachHandlerMouseMove(new ScaleUniformHandler(self));
          });
      }
      // rotate x, y, z
      for (let axis = 0; axis < 3; ++axis) {
         UI.bindMenuItem(mode + 'Rotate' + axisName[axis], (ev) => {
            const vec = [0, 0, 0]; vec[axis] = 1.0;
            View.attachHandlerMouseMove(new MouseRotateAlongAxis(this, vec));
          });
      }
      // Bevel
      const bevel = {face: action.faceBevel, edge: action.edgeBevel, vertex: action.vertexBevel};
      if (bevel[mode]) {
         UI.bindMenuItem(bevel[mode].name, (ev)=> {
            View.attachHandlerMouseMove(new BevelHandler(this));
          });
      }
      // extrude
      const extrude = {face: [action.faceExtrudeX, action.faceExtrudeY, action.faceExtrudeZ],
                       edge: [action.edgeExtrudeX, action.edgeExtrudeY, action.edgeExtrudeZ],
                       vertex:  [action.vertexExtrudeX, action.vertexExtrudeY, action.vertexExtrudeZ],
                      };
      let extrudeMode = extrude[mode];
      if (extrudeMode) {
         // movement for (x, y, z)
         for (let axis=0; axis < 3; ++axis) {
            UI.bindMenuItem(extrudeMode[axis].name, (ev) => {
                  View.attachHandlerMouseMove(new ExtrudeAlongAxisHandler(this, axis));
             });
         }
      }
      const extrudeFree = {face: action.faceExtrudeFree, edge: action.edgeExtrudeFree, vertex: action.vertexExtrudeFree };
      if (extrudeFree[mode]) {
         UI.bindMenuItem(extrudeFree[mode].name, (ev) => {
            View.attachHandlerMouseMove(new ExtrudeFreeHandler(this));
          });
      }
      const extrudeNormal = {face: action.faceExtrudeNormal, edge: action.edgeExtrudeNormal, vertex: action.vertexExtrudeNormal};
      if (extrudeNormal[mode]) {
         UI.bindMenuItem(extrudeNormal[mode].name, (ev) => {
            View.attachHandlerMouseMove(new ExtrudeNormalHandler(this));
          });
      }
   } 

   getContextMenu() {
      if (this.hasSelection()) {
         return this.contextMenu;
      } else {
         return null;
      }
   }

   snapshotAll(func, ...args) {
      const snapshots = [];
      for (let preview of View.getWorld()) {
         if (preview.hasSelection()) {
            const snapshot = func.call(preview, ...args);
            if (snapshot) {
               snapshots.push( {preview: preview, snapshot: snapshot} );
            }
         }
      }
      return snapshots;
   }

   doAll(snapshots, func, ...args) {
      if (snapshots) {
         for (let obj of snapshots) {
            func.call(obj.preview, obj.snapshot, ...args);
         }
      } else {
         for (let preview of this.eachCage()) {
            func.call(preview, undefined, ...args);
         }
      }
   }

   * eachCage() {
      for (let cage of View.getWorld()) {
         yield cage;
      }
   }

   * selectableCage() {
      const world = View.getWorld();
      for (let i = 0; i < world.length; ++i) {
         let cage = world[i];
         if (!cage.isLock() && cage.isVisible()) {
            yield cage;
         }
      }
   }

   * selectedCage() {
      for (let cage of View.getWorld()) {
         if (cage.hasSelection()) {
            yield cage;
         }
      }
   }

   * notSelectedCage() {
      for (let cage of View.getWorld()) {
         if (!cage.hasSelection()) {
            yield cage;
         }
      }
   }

   hasSelection() {
      for (let cage of View.getWorld()) {
         if (cage.hasSelection()) {
            return true;
         }
      }
      return false;
   }

   restoreMoveSelection(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.restoreMoveSelection);
   }

   // move vertices
   moveSelectionNew(snapshots, movement) {
      this.doAll(snapshots, PreviewCage.prototype.moveSelection, movement);
   }

   restoreSelectionPosition(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.restoreMoveSelection);
   }

   // scale vertices along axis
   scaleSelection(snapshots, scale) {
      this.doAll(snapshots, PreviewCage.prototype.scaleSelection, scale);
   }

   // rotate vertices
   rotateSelection(snapshots, quatRotate, center) {
      this.doAll(snapshots, PreviewCage.prototype.rotateSelection, quatRotate, center);
   }

   snapshotSelection() {
      return this.snapshotAll(PreviewCage.prototype['snapshotSelection' + this.modeName()]);
   }

   _doSelection(doName, forceAll=false) {
      doName = '_select' + this.modeName() + doName;
      const snapshots = [];
      for (let cage of this.eachCage()) {    // this is snapshot all
         if (forceAll || cage.hasSelection()) {
            snapshots.push( {preview: cage, snapshot: cage[doName]()} );
         }
      }
      if (snapshots.length > 0) {
         return {undo: this.undoDoSelection, snapshots: snapshots};
      }
      return false;  // null? 
   }

   similarSelection() {
      return this._doSelection('Similar');
   }

   adjacentSelection() {
      return this._doSelection('Adjacent');
   }

   invertSelection() {
      return this._doSelection('Invert', true);
   }

   allSelection() {
      return this._doSelection('All', true);
   }

   lessSelection() {
      return this._doSelection('Less');
   }

   moreSelection() {
      return this._doSelection('More');
   }

   resetSelection() {
      for (let cage of this.selectedCage()) {
         this._resetSelection(cage);
      }
   }

   restoreSelection(selection) {
      this.doAll(selection, PreviewCage.prototype.restoreSelection, this); 
   }

   undoDoSelection(snapshots) {
      this.resetSelection();
      this.restoreSelection(snapshots);
   }

   isVertexSelectable() { return false; }
   isEdgeSelectable() { return false; }
   isFaceSelectable() { return false; }

   draw(gl, draftBench) {
      this.useShader(gl);
      gl.bindTransform();
      this.drawObject(gl, draftBench);
      //gl.disableShader();
   }
}



class DragSelect {
   constructor(madsor, cage, current, onOff) {
      this.madsor = madsor;
      this.select = new Map; 
      this.select.set(cage, [current]);
      this.onOff = onOff;        // true = on, false = off.
   }

 //  finish() {
 //     return new EdgeSelectCommand(this.select);
 //  }

   dragSelect(cage, hilite) {
      var array = this.select.get(cage);
      if (array === undefined) {
         array = [];
         this.select.set(cage, array);
      }
      this.madsor.dragSelect(cage, hilite, array, this.onOff);
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



class MovePositionHandler extends MouseMoveHandler {
   constructor(madsor, snapshots, movement) {
      super();
      this.madsor = madsor;
      this.snapshots = snapshots;
      this.movement = movement;
   }

   doIt() {
      if (this.movement !== 0) {
         this.madsor.moveSelectionNew(this.snapshots, this.movement);
      }
   }

   undo() {
      this.madsor.restoreSelectionPosition(this.snapshots);
   }

   handleMouseMove(ev, cameraView) {
      this.madsor.moveSelectionNew(this.snapshots, this._updateMovement(ev, cameraView));
   }
}


class MoveVertexHandler extends MovePositionHandler { // temp refactoring class
   constructor(madsor, movement, cmd) {
      super(madsor, null, movement);
      this.cmd = cmd;
   }

   doIt() {
      if (this.cmd) {
         this.cmd.doIt();
         this.snapshots = this.cmd.snapshotPosition();
      } else {
         this.snapshots = this.snapshotPosition();
      }
      super.doIt();
      return true;
   }

   undo() {
      if (this.cmd) {
         this.cmd.undo();   // no need to restore to be deleted position
      } else {
         super.undo();
      }

   }
}


// movement handler.
class MouseMoveAlongAxis extends MovePositionHandler {
   constructor(madsor, axis) {   // 0 = x axis, 1 = y axis, 2 = z axis.
      super(madsor, madsor.snapshotPosition(), [0.0, 0.0, 0.0]);
      this.axis = axis;
   }

   _updateMovement(ev) {
      let move = this._calibrateMovement(ev.movementX);
      let movement = [0.0, 0.0, 0.0];
      movement[this.axis] = move;
      this.movement[this.axis] += move;
      return movement;
   }
}

class MoveDirectionHandler extends MoveVertexHandler {
   constructor(madsor, cmd, noNegative=false) {
      super(madsor, 0, cmd);
      this.noNegative = noNegative;
   }
   
   _updateMovement(ev) {
      let move = this._calibrateMovement(ev.movementX);
      this.movement += move;
      if (this.noNegative && (this.movement < 0)) {
         move -= this.movement;
         this.movement = 0.0;
      }
      return move;
   }
}


class MoveBidirectionHandler extends MoveVertexHandler {
   constructor(madsor, cmd) {
      super(madsor, 0, cmd);
   }

   // override original handler. this
   handleMouseMove(ev, _cameraView) {
      let move = this._calibrateMovement(ev.movementX);
      if (move > 0) {
         if ((this.movement < 0) && ((this.movement+move) >=0)) { // negativeDir done
            this.madsor.moveSelectionNew(this.snapshots, -this.movement);
            move += this.movement;
            this.movement = 0;
            this.madsor.doAll(this.snapshots, PreviewCage.prototype.positiveDirection);
         }
      } else {
         if ((this.movement >= 0) && ((this.movement+move) < 0)) {
            this.madsor.moveSelectionNew(this.snapshots, -this.movement);
            move += this.movement;
            this.movement = 0;
            this.madsor.doAll(this.snapshots, PreviewCage.prototype.negativeDirection);
         }
      }
      this.movement += move;
      this.madsor.moveSelectionNew(this.snapshots, move);
   }
}

class MoveAlongNormal extends MovePositionHandler {
   constructor(madsor, noNegative = false, snapshots) {
      if (!snapshots) {
         snapshots = madsor.snapshotPositionAndNormal();
      }
      super(madsor, snapshots, 0.0);
      this.noNegative = noNegative;
   }

   _updateMovement(ev) {
      let move = this._calibrateMovement(ev.movementX);
      this.movement += move;
      if (this.noNegative && (this.movement < 0)) {
         move -= this.movement;
         this.movement = 0.0;
      }
      return move;
   }
}


class MoveFreePositionHandler extends MovePositionHandler {
   constructor(madsor) {
      super(madsor, madsor.snapshotPosition(), [0.0, 0.0, 0.0]);
   }

   _updateMovement(ev, cameraView) {
      let x = this._calibrateMovement(ev.movementX);
      let y = this._calibrateMovement(-ev.movementY);
      var cam = cameraView.inverseCameraVectors();
      // move parallel to camera.
      var movement = [cam.x[0]*x + cam.y[0]*y, cam.x[1]*x + cam.y[1]*y, cam.x[2]*x + cam.y[2]*y];
      vec3.add(this.movement, this.movement, movement);
      return movement;
   }
}


class ScaleUniformHandler extends EditCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.snapshots = madsor.snapshotTransformGroup();
      this.scale = 1.0;                    // cumulative movement.
   }

   handleMouseMove(ev) {
      let scale = this._xPercentMovement(ev);   // return (100% to -100%)
      if (scale < 0) {
         scale = 1.0 + Math.abs(scale);
      } else {
         scale = 1.0 / (1.0 + scale);
      }
      this.madsor.scaleSelection(this.snapshots, scale);
      this.scale *= scale;
   }

  
   doIt() {
      this.madsor.scaleSelection(this.snapshots, this.movement);
   }

   undo() {
      this.madsor.restoreSelectionPosition(this.snapshots);
   }
}


// movement handler.
class MouseRotateAlongAxis extends EditCommand {
   constructor(madsor, axis, center) {   // axis directly
      super();
      this.madsor = madsor;
      this.snapshots = madsor.snapshotTransformGroup();
      this.movement = 0.0;             // cumulative movement.
      this.axisVec3 = vec3.clone(axis);
      this.center = center;
   }

   handleMouseMove(ev) {
      const move = this._xPercentMovement(ev)*5;
      const quatRotate = quat.create();
      quat.setAxisAngle(quatRotate, this.axisVec3, move);
      this.madsor.rotateSelection(this.snapshots, quatRotate, this.center);
      this.movement += move;
   }

   doIt() {
      const quatRotate = quat.create();
      quat.setAxisAngle(quatRotate, this.axisVec3, this.movement);
      this.madsor.rotateSelection(this.snapshots, quatRotate, this.center);
   }

   undo() {
      this.madsor.restoreSelectionPosition(this.snapshots);
   }
}


class BevelHandler extends MovePositionHandler {
   constructor(madsor) {
      const selection = madsor.snapshotSelection();   // have to get selection first
      super(madsor, madsor.bevel(), 0.0);
      this.selection = selection;
      // get limit
      this.vertexLimit = Number.MAX_SAFE_INTEGER;
      for (let snapshot of this.snapshots) {
         this.vertexLimit = Math.min(this.vertexLimit, snapshot.vertexLimit);
      }
   }

   _updateMovement(ev) {
      let move = this._calibrateMovement(ev.movementX);
      if ((this.movement+move) > this.vertexLimit) {
         move = this.vertexLimit - this.movement;
      } else if ((this.movement+move) < 0) {
         move = 0 - this.movement;
      }
      this.movement += move;
      return move;
   }

   doIt() {
      this.snapshots = this.madsor.bevel();   // should test for current snapshots and prev snapshots? should not change
      // no needs to recompute limit, wont change, 
      // move 
      super.doIt();  // = this.madsor.moveSelection(this.snapshots, this.movement);
   }

   undo() {
      this.madsor.undoBevel(this.snapshots, this.selection);
      //this.snapshots = undefined;
   }
}

// extrude
class ExtrudeHandler extends MoveableCommand {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.contourEdges = madsor.extrude();
   }

   doIt() {
      this.contourEdges = this.madsor.extrude(this.contourEdges);
      super.doIt();     // = this.madsor.moveSelection(this.snapshots, this.movement);
   }

   undo() {
      super.undo(); //this.madsor.restoreSelectionPosition(this.snapshots);
      this.madsor.undoExtrude(this.contourEdges);
   }
}

class ExtrudeAlongAxisHandler extends ExtrudeHandler {
   constructor(madsor, axis) { 
      super(madsor);
      this.moveHandler = new MouseMoveAlongAxis(madsor, axis); // this should comes earlier
   }
}


class ExtrudeFreeHandler extends ExtrudeHandler {
   constructor(madsor) {
      super(madsor);
      this.moveHandler = new MoveFreePositionHandler(madsor);
   }
}

class ExtrudeNormalHandler extends ExtrudeHandler {
   constructor(madsor) {
      super(madsor);
      this.moveHandler = new MoveAlongNormal(madsor);
   }
}
// end of extrude

class GenericEditCommand extends EditCommand {
   constructor(madsor, doCmd, undoCmd) {
      super();
      this.madsor = madsor;
      this.doCmd = doCmd;
      this.undoCmd = undoCmd; 
   }

   doIt(_currentMadsor) {
      this.snapshots = this.doCmd.call(this.madsor);
      return (this.snapshots.length > 1);
   }

   undo(_currentMadsor) {
      if (this.undoCmd) {
         this.undoCmd.call(this.madsor, this.snapshots);
      } else {
         this.madsor.restoreSelectionPosition(this.snapshots);
      }
   }

   snapshotPosition() {
      return this.snapshots;
   }
}


export {
   Madsor,
   DragSelect,
   GenericEditCommand,
   MovePositionHandler,
   MouseMoveAlongAxis,
   MoveDirectionHandler,
   MoveBidirectionHandler,
   MoveAlongNormal,
   MoveFreePositionHandler,
   MouseRotateAlongAxis,
   ToggleModeCommand,
}