/**
 *  abstract EditCommand class for undo, redo handling. also MouseMoveHandler class.
 * 
 */

// merge MouseMoveHandler to EditCommand
class EditCommand {
   _calibrateMovement(mouseMove) {
      // todo: instead of magic constant. should supply a scaling factor.
      let move;
      if (mouseMove == 0) {
         move = 0;
      } else if (mouseMove < 0) {
         move = Math.log(-mouseMove) / 5.0;  // log to counteract mouse acceleration.
         move = -move;
      } else {
         move = Math.log(mouseMove) / 5.0;
      }

      return move;
   }

   _xPercentMovement(ev) {
      let width = window.innertWidth || document.documentElement.clientWidth || document.body.clientWidth;
      return (ev.movementX / width);
   }

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

class EditCommandSimple extends EditCommand {
   constructor(command) {
      super();
      this.commandName = command;
   }

   doIt(currentMadsor) {
      this.undo = currentMadsor[this.commandName]();
      return (this.undo !== null);
   }

   undo(currentMadsor) {
      this.undo(currentMadsor);
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
   MouseMoveHandler,
   MoveableCommand,
   EditCommandCombo,
   EditCommandSimple
}