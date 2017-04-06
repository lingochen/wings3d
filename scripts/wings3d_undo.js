/**
 *  abstract DoCommand class for undo, redo handling. also MouseMoveHandler class.
 * 
 */
"use strict";

class MouseMoveHandler {

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

class DoCommand {


   //doIt() {}

   //undo() {}

}