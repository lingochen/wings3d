/*
 *
 * MADS (Modify, Add, Delete, Select) operation. 
 *
**/
import {EditCommand, EditSelectHandler, MouseMoveHandler, MoveableCommand} from './wings3d_undo.js';
import {PreviewCage} from './wings3d_model.js';
import * as ShaderProg from './wings3d_shaderprog.js';
import * as View from './wings3d_view.js';
import * as UI from './wings3d_ui.js';
import {action} from './wings3d.js';
import { Plane } from './wings3d_boundingvolume.js';


class Madsor { // Modify, Add, Delete, Select, (Mads)tor. Model Object.
   constructor(mode) {
      this.modeString = mode;
      if (mode === 'Multi') {
         return;
      }
      mode = mode.toLowerCase();
      const self = this;
      // contextMenu
      this.contextMenu = {menu: document.querySelector("#"+mode+"-context-menu")};
      if (this.contextMenu.menu) {
         this.contextMenu.menuItems = this.contextMenu.menu.querySelectorAll(".context-menu__item");
      }
      const axisVec = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
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
      const scaleUniform = {face: action.faceScaleUniform, edge: action.edgeScaleUniform, vertex: action.vertexScaleUniform, body: action.bodyScaleUniform};
      UI.bindMenuItem(scaleUniform[mode].name, (_ev) => {
         View.attachHandlerMouseMove(new ScaleHandler(this, [1, 1, 1]));
       });
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
                       vertex:  [action.vertexExtrudeX, action.vertexExtrudeY, action.vertexExtrudeZ],};
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
      // flatten x,y,z
      const flatten = {face: [action.faceFlattenX, action.faceFlattenY, action.faceFlattenZ],
                       edge: [action.edgeFlattenX, action.edgeFlattenY, action.edgeFlattenZ],
                       vertex: [action.vertexFlattenX, action.vertexFlattenY, action.vertexFlattenZ] };
      let flattenMode = flatten[mode];
      if (flattenMode) {
         for (let axis = 0; axis < 3; ++axis) {
            UI.bindMenuItem(flattenMode[axis].name, (_ev) => {
               const cmd = new GenericEditCommand(this, this.flatten, [axisVec[axis]]);
               if (cmd.doIt()) {
                  View.undoQueue(cmd);
               }
             });
         }
      }
      // scale axis and radial
      const radialVec = [[0, 1, 1], [1, 0, 1], [1, 1, 0]];
      const scaleAxis = {face: [action.faceScaleAxisX, action.faceScaleAxisY, action.faceScaleAxisZ],
                         edge: [action.edgeScaleAxisX, action.edgeScaleAxisY, action.edgeScaleAxisZ],
                       vertex: [action.vertexScaleAxisX, action.vertexScaleAxisY, action.vertexScaleAxisZ],
                         body: [action.bodyScaleAxisX, action.bodyScaleAxisY, action.bodyScaleAxisZ]};
      const scaleAxisMode = scaleAxis[mode];
      const scaleRadial = {face: [action.faceScaleRadialX, action.faceScaleRadialY, action.faceScaleRadialZ],
                           edge: [action.edgeScaleRadialX, action.edgeScaleRadialY, action.edgeScaleRadialZ],
                         vertex: [action.vertexScaleRadialX, action.vertexScaleRadialY, action.vertexScaleRadialZ],
                           body: [action.bodyScaleRadialX, action.bodyScaleRadialY, action.bodyScaleRadialZ]};
      const scaleRadialMode = scaleRadial[mode];
      for (let axis = 0; axis < 3; ++axis) {
         UI.bindMenuItem(scaleAxisMode[axis].name, (_ev) => {
            View.attachHandlerMouseMove(new ScaleHandler(this, axisVec[axis]));
          });
         UI.bindMenuItem(scaleRadialMode[axis].name, (_ev) => {
            View.attachHandlerMouseMove(new ScaleHandler(this, radialVec[axis]));
          });
      }
      // plane Cut
      const planeCut = { face: [action.facePlaneCutX, action.facePlaneCutY, action.facePlaneCutZ], 
                         body: [action.bodyPlaneCutX, action.bodyPlaneCutY, action.bodyPlaneCutZ], };
      const planeCutMode = planeCut[mode];
      if (planeCutMode) {
         for (let axis = 0; axis < 3; ++axis) {
            UI.bindMenuItem(planeCutMode[axis].name, (_ev) =>{
               View.attachHandlerMouseSelect(new PlaneCutHandler(this, axisVec[axis]));
             });
         }
      }
   }

   modeName() {
      return this.modeString;
   }

   getContextMenu() {
      if (this.hasSelection()) {
         return this.contextMenu;
      } else {
         return null;
      }
   }

   snapshotSelected(func, ...args) {
      const snapshots = [];
      //for (let preview of View.getWorld()) {
      for (let preview of this.selectedCage()) {
         const snapshot = func.call(preview, ...args);
         if (snapshot || (snapshot === false)) {
            snapshots.push( {preview: preview, snapshot: snapshot} );
         }
      }
      return snapshots;
   }

   snapshotSelectable(func, ...args) {
      const snapshots = [];
      //for (let preview of View.getWorld()) {
      for (let preview of this.selectableCage()) {
         const snapshot = func.call(preview, ...args);
         if (snapshot || (snapshot === false)) {
            snapshots.push( {preview: preview, snapshot: snapshot} );
         }
      }
      return snapshots;
   }

   /**
    * should we make it static?
    * @param {*} targets 
    * @param {*} func 
    * @param  {...any} args 
    */
   snapshotTarget(targets, func, ...args) {
      const snapshots = [];
      for (let preview of targets) {
         const snapshot = func.call(preview, ...args);
         if (snapshot || (snapshot === false)) {
            snapshots.push( {preview: preview, snapshot: snapshot} );
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

   resultAll(func, ...args) {
      for (let preview of this.selectedCage()) {
         if (func.call(preview, ...args)) {
            return true;
         }
      }
      return false;
   }

   * eachCage() {
      const world = View.getWorld();
      for (let cage of world) {
         yield cage;
      }
   }

   * selectableCage() {
      const world = View.getWorld();
      for (let cage of world) {
         if (!cage.isLock() && cage.isVisible()) {
            yield cage;
         }
      }
   }

   * selectedCage() {
      const world = View.getWorld();
      for (let cage of world) {
         if (!cage.isLock() && cage.isVisible() && cage.hasSelection()) {
            yield cage;
         }
      }
   }

   * notSelectedCage() {
      const world = View.getWorld();
      for (let cage of world) {
         if (!cage.isLock() && cage.isVisible() && !cage.hasSelection()) {
            yield cage;
         }
      }
   }

   // visible but may be lock/unlock
   * visibleCage() {
      const world = View.getWorld();
      for (let cage of world) {
         if (cage.isVisible()) {
            yield cage;
         }
      }
   }

   * visibleWireCage(wireMode) {
      const world = View.getWorld();
      for (let cage of world) {
         if (cage.isVisible() && (cage.isWireMode() === wireMode)) {
            yield cage;
         }
      }
   }

   hasSelection() {
      for (let cage of this.selectableCage()) {
         if (!cage.isLock() && cage.hasSelection()) {
            return true;
         }
      }
      return false;
   }

   restoreMoveSelection(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.restoreMoveSelection);
   }

   // move vertices
   moveSelection(snapshots, movement) {
      this.doAll(snapshots, PreviewCage.prototype.moveSelection, movement);
   }

   restoreSelectionPosition(snapshots) {
      this.doAll(snapshots, PreviewCage.prototype.restoreMoveSelection);
   }

   // scale vertices along axis
   scaleSelection(snapshots, scale, axis) {
      this.doAll(snapshots, PreviewCage.prototype.scaleSelection, scale, axis);
   }

   // rotate vertices
   rotateSelection(snapshots, quatRotate, center) {
      this.doAll(snapshots, PreviewCage.prototype.rotateSelection, quatRotate, center);
   }

   snapshotSelection() {
      return this.snapshotSelected(PreviewCage.prototype['snapshotSelection' + this.modeName()]);
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

   selectObject(objects, input) {
      if (input.checked) {
         return this.snapshotTarget(objects, PreviewCage.prototype['_select' + this.modeName() + 'All']);
      } else {
         return this.snapshotTarget(objects, PreviewCage.prototype['_resetSelect' + this.modeName()]);
      }
   }

   undoSelectObject(selection, input) {
      if (input.checked) {
         this.doAll(selection, PreviewCage.prototype['_resetSelect' + this.modeName()]); // unselected All then
      }
      this.doAll(selection, PreviewCage.prototype.restoreSelection, this); // restore
   }

   toggleObjectLock(objects, input) {
      return this.snapshotTarget(objects, PreviewCage.prototype.toggleLock, input.checked);
   }

   undoToggleObjectLock(selection) {
      this.doAll(selection, PreviewCage.prototype.toggleLock);   // restore
   }

   toggleObjectVisibility(objects, input) {
      return this.snapshotTarget(objects, PreviewCage.prototype.setVisible, !input.checked); // checked is invisible
   }

   undoObjectVisibility(selection) {
      return this.doAll(selection, PreviewCage.prototype.setVisible);
   }

   toggleObjectWireMode(objects, checked) {
      return this.snapshotTarget(objects, PreviewCage.prototype.toggleWireMode, checked);
   }

   undoToggleObjectWireMode(selection) {
      return this.doAll(selection, PreviewCage.prototype.toggleWireMode);
   }

   selectMaterialCmd(material) {
      return new GenericEditCommand(this, this._selectMaterial, material, this.undoDoSelection);
   }

   _selectMaterial(material) {
      return this.snapshotSelectable(PreviewCage.prototype['select' + this.modeName() + 'Material'], material);
   }

   isVertexSelectable() { return false; }
   isEdgeSelectable() { return false; }
   isFaceSelectable() { return false; }

   toggleMulti(_hilite) {}

   // default draw FaceHlite, needs to override by vertex/edge/multi mode.
   drawExtra(gl, draftBench) {
      gl.useShader(ShaderProg.solidWireframe);//     gl.useShader(ShaderProg.solidColor);
      gl.bindTransform();
      // draw hilite
      draftBench.drawHilite(gl, this);
      //gl.disableShader();
   }

   // override by edge only
   previewShader(gl) {
      gl.useShader(ShaderProg.solidWireframe);
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


class ToggleCheckbox extends EditCommand {
   constructor(input) {
      super();
      this.input = input;
   }

   doIt() {
      this.input.checked = !this.input.checked;
   }

   undo() {
      this.input.checked = !this.input.checked;
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

   isDoable() {
      return (this.snapshots.length > 0);
   }

   doIt() {
      if (this.snapshots.length > 0) {
         //if (this.movement !== 0) {
            this._transformSelection(this.movement);
         //}
         return true;
      }
      return false;
   }

   undo() {
      this.madsor.restoreSelectionPosition(this.snapshots);
   }

   handleMouseMove(ev, cameraView) {
      this._transformSelection(this._updateMovement(ev, cameraView));
   }

   _transformSelection(transform) {
      this.madsor.moveSelection(this.snapshots, transform);
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
            this.madsor.moveSelection(this.snapshots, -this.movement);
            move += this.movement;
            this.movement = 0;
            this.madsor.doAll(this.snapshots, PreviewCage.prototype.positiveDirection);
         }
      } else {
         if ((this.movement >= 0) && ((this.movement+move) < 0)) {
            this.madsor.moveSelection(this.snapshots, -this.movement);
            move += this.movement;
            this.movement = 0;
            this.madsor.doAll(this.snapshots, PreviewCage.prototype.negativeDirection);
         }
      }
      this.movement += move;
      this.madsor.moveSelection(this.snapshots, move);
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


class ScaleHandler extends MovePositionHandler {
   constructor(madsor, axis) {
      const snapshots = madsor.snapshotTransformGroup();
      super(madsor, snapshots, 1.0);
      this.axis = axis;
   }

   _transformSelection(scale) {
      this.madsor.scaleSelection(this.snapshots, scale, this.axis);
   }

   _updateMovement(ev, _camera) {
      let scale = this._xPercentMovement(ev);   // return (100% to -100%)
      if (scale < 0) {
         scale = 1.0 + Math.abs(scale);
      } else {
         scale = 1.0 / (1.0 + scale);
      }
      this.movement *= scale;
      return scale;
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

class PlaneCutHandler extends EditSelectHandler {
   constructor(madsor, planeNorm) {
      super(true, true, true, planeNorm);
      this.madsor = madsor;
      this.center = vec3.create();
   }

   hilite(hilite, _currentCage) {
      if (hilite.plane) {
         this.plane = new Plane(this.planeNormal, hilite.plane.center);
         if (this.madsor.planeCuttable(this.plane)) {
            hilite.plane.hilite = true;
            return true;
         }
         hilite.plane.hilite = false;
         delete this.plane;
      }
      return true;   // always true, we want user to see selection.
   }
   
   select(_hilite) {
      if (this.plane) { // doIt   
         return this.doIt();
      }
      return false;
   }

   doIt() {
      if (this.plane) {
         this.cut = this.madsor.planeCut(this.plane);
         if (this.cut.length > 0) {
            View.restoreVertexMode(this.cut);
            this.vertexConnect = View.currentMode().connectVertex();   // assurely it vertexMode
            return this.vertexConnect.doIt();
         }
      }
      return false;
   }

   undo() {
      if (this.vertexConnect) {
         this.vertexConnect.undo();
         delete this.vertexConnect; // we are in vertex mode
         this.madsor.undoPlaneCut(this.cut);
      }
   }
}


class GenericEditCommand extends EditCommand {
   constructor(madsor, doCmd, doParams, undoCmd, undoParams) {
      super();
      this.madsor = madsor;
      this.doCmd = doCmd;
      this.doParams = doParams;
      this.undoCmd = undoCmd; 
      this.undoParams = undoParams;
   }

   doIt(_currentMadsor) {
      this.snapshots = this.doCmd.call(this.madsor, ...(this.doParams? this.doParams : []));
      return (this.snapshots.length > 0);
   }

   undo(_currentMadsor) {
      if (this.undoCmd) {
         this.undoCmd.call(this.madsor, this.snapshots, ...(this.undoParams? this.undoParams : []) );
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
   ToggleCheckbox,
   ToggleModeCommand,
}