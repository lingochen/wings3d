/**
 *  abstract EditCommand class for undo, redo handling. also MouseMoveHandler class.
 * 
 */
"use strict";

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

   commit(view) {
      this._commit(view);
      // enable mouse cursor
      document.body.style.cursor = 'auto';
   }
}

class EditCommand {


   //doIt() {}

   //undo() {}

}