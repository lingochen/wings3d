/**
 *  abstract EditCommand class for undo, redo handling. also MouseMoveHandler class.
 * 
 */

// merge MouseMoveHandler to EditCommand
class EditCommand {

   free() {}

   isDoable() { return true; }

   //doIt() {}

   //undo() {}
}

class MouseMoveHandler extends EditCommand {

   //handleMouseMove(ev) {}
 
   commit() {
      throw("unimplemented");
      // enable mouse cursor
      //document.body.style.cursor = 'auto';
   } 
   rescind() {
      throw("unimplemented");   // actually not the same.
   }
}

// delegate mouse movement to MouseMoveHandler
class MoveableCommand extends EditCommand {
   
   commit() {
      if (this.moveHandler) {
         this.moveHandler.commit();
         //document.body.style.cursor = 'auto';
      }
   }
   rescind() {
      if (this.moveHandler) {
         this.moveHandler.rescind();
      }
   }

   isMoveable() {
      if (this.moveHandler) {
         return true;
      }
      return false;
   }

   getInputSetting() {
      if (this.moveHandler) {
         return this.moveHandler.getInputSetting();
      }
      return [];
   }

   handleInput(evt, cameraView, axis) {
      if (this.moveHandler) {
         this.moveHandler.handleInput(evt, cameraView, axis);
      }
   }

   handleMouseMove(ev, cameraView, tweak) {
      if (this.moveHandler) {
         this.moveHandler.handleMouseMove(ev, cameraView, tweak);
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
   constructor(command, ...theArgs) {
      super();
      this.commandName = command;
      this.params = theArgs;
   }

   doIt(currentMadsor) {
      if (this.params) {
         this.result = currentMadsor[this.commandName]( ...this.params );
      } else {
         this.result = currentMadsor[this.commandName]();
      }
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