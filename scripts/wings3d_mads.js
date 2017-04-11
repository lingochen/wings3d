/*
 *
 * MADS (Modify, Add, Delete, Select) operation. 
 *
**/
"use strict";

class Madsor { // Modify, Add, Delete, Select, (Mads)tor. Model Object.
   constructor() {
      this.currentEdge = null;
      this.shaderData = Wings3D.gl.createShaderData();
      this.shaderData.setUniform4fv("uColor", [0.0, 1.0, 0.0, 0.3]); // hilite green, selected hilite yellow.
   }

   // can be use arguments object?
   eachPreviewCage(func, items) {
      if (items) {
         for (var i = 0; i < this.world.length; ++i) {
            func(this.world[i], items[i]);
         }
      } else {
         for (var i = 0; i < this.world.length; ++i) {
            func(this.world[i]);
         }
      }
   }

   setWorld(world) {
      this.world = world;
   }

   setPreview(preview) {
      this.preview = preview;
   }

   setCurrent(edge, intersect, center) {
      if (this.currentEdge !== edge) {
         if (this.currentEdge !== null) {
            this.hideOldHilite();
         }
         if (edge !== null) {
            this.showNewHilite(edge, intersect, center);
         }
         this.currentEdge = edge;
      }
   }

   hideOldHilite() {}

   draw(gl) {
      if (this.currentEdge) {
         this.useShader(gl);
         gl.bindTransform();
         gl.bindShaderData(this.shaderData, false);
         this.drawObject(gl);
      }
   }
}





// movement handler.
class MouseMoveX extends MouseMoveHandler {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.snapshots = madsor.snapshotPosition();
      this.movement = [0.0, 0.0, 0.0];             // cumulative movement.
   }

   handleMouseMove(ev) {
      // todo: instead of magic constant. should supply a scaling factor.
      var x = ev.movementX/20.0;
      if (x >= 2) {
         x = 2;
      }
      this.madsor.moveSelection([x, 0.0, 0.0], this.snapshots);
      this.movement[0] += x;
   }

   _commit(view) {
      view.undoQueue(new MoveCommand(this.madsor, this.snapshots, this.movement));
   }

   _cancel() {
      this.madsor.restoreMoveSelection(this.snapshots);
   }
}

class MoveCommand extends EditCommand {
   constructor(madsor, snapshots, movement) {
      super();
      this.madsor = madsor;
      this.snapshots = snapshots;
      this.movement = movement;
   }

   doIt() {
      this.madsor.moveSelection(this.movement, this.snapshots);
   }

   undo() {
      this.madsor.restoreMoveSelection(this.snapshots);
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