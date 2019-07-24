/**
 *  abstract EditCommand class for undo, redo handling. also MouseMoveHandler class.
 * 
 */

// merge MouseMoveHandler to EditCommand
class EditCommand {
   _calibrateMovement(mouseMove, cameraView) {
      // use the erlang Wings3d scaling code to be consistent.
      const speed = 8.5;
      const dist = cameraView.distance;
      const factor = (dist/((11-speed) * ((11-speed)*300))) * cameraView.fov / 60;

      return mouseMove * factor;
   }

   _xPercentMovement(ev, _cameraView) {
      let width = window.innertWidth || document.documentElement.clientWidth || document.body.clientWidth;
      return (ev.movementX / width);
   }

   free() {}

   isDoable() { return true; }

   //doIt() {}

   //undo() {}
}

class MouseMoveHandler extends EditCommand {

   //handleMouseMove(ev) {}

/*   cancel() {
      this._cancel();     // called descendant handler
      // enable mouse cursor
      document.body.style.cursor = 'auto';
   }

   commit() {
      this._commit();
      // enable mouse cursor
      document.body.style.cursor = 'auto';
   } */
}

// delegate mouse movement to MouseMoveHandler
class MoveableCommand extends EditCommand {

   isMoveable() {
      if (this.moveHandler) {
         return true;
      }
      return false;
   }

   handleMouseMove(ev, cameraView) {
      if (this.moveHandler) {
         this.moveHandler.handleMouseMove(ev, cameraView);
      }
   }

   doIt() {
      if (this.moveHandler) {
         this.moveHandler.doIt();
      }
   }

   undo() {
      if (this.moveHandler) {
         this.moveHandler.undo();
      }
   }
}

class EditSelectHandler extends MoveableCommand {
   constructor(isVertex, isEdge, isFace, planeNormal) {
      super();
      this.selectable = {isVertex: isVertex, isEdge: isEdge, isFace: isFace};
      this.planeNormal = planeNormal;
   }

   isVertexSelectable() { return this.selectable.isVertex; }
   isEdgeSelectable() { return this.selectable.isEdge; }
   isFaceSelectable() { return this.selectable.isFace; }
   getPlaneNormal() { return this.planeNormal; }

   // hilite(hilite, currentCage) - to be implemented by subclass
   // select(hilite) - to be implemented by subclass
}

class EditCommandSimple extends EditCommand {
   constructor(command) {
      super();
      this.commandName = command;
   }

   doIt(currentMadsor) {
      this.result = currentMadsor[this.commandName]();
      return (this.result !== false);
   }

   undo(currentMadsor) {
      this.result.undo.call(currentMadsor, this.result.snapshots);
      //this.undo(currentMadsor);   // originally using return function, but now we needs to serialize EditCommand, so pass back function and argument.
   }
}


class EditCommandCombo extends EditCommand {
   constructor(editCommands) {
      super();
      this.editCommands = editCommands;
   }

   doIt() {
      // start from beginning
      for (let cmd of this.editCommands) {
         cmd.doIt();
      }
   }

   undo() {
      // walk from last to first
      for (let i = this.editCommands.length-1; i >= 0; --i) {
         this.editCommands[i].undo();
      }
   }
}


export {
   EditCommand,
   EditSelectHandler,
   MouseMoveHandler,
   MoveableCommand,
   EditCommandCombo,
   EditCommandSimple
}