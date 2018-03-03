/**
 *  abstract EditCommand class for undo, redo handling. also MouseMoveHandler class.
 * 
 */

class MouseMoveHandler {

   _calibrateMovement(mouseMove) {
      // todo: instead of magic constant. should supply a scaling factor.
      var move = mouseMove/20.0;
      if (move >= 2) {
         move = 2;
      }
      return move;
   }

   //handleMouseMove(ev) {}

   cancel() {
      this._cancel();     // called descendant handler
      // enable mouse cursor
      document.body.style.cursor = 'auto';
   }

   commit() {
      this._commit();
      // enable mouse cursor
      document.body.style.cursor = 'auto';
   }
}

class EditCommand {


   //doIt() {}

   //undo() {}

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
   MouseMoveHandler,
   EditCommand,
   EditCommandCombo,
   EditCommandSimple
}