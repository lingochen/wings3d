/*
 *
 * MADS (Modify, Add, Delete, Select) operation. 
 *
**/
"use strict";

class Madsor { // Modify, Add, Delete, Select, (Mads)tor. Model Object.
   constructor(mode) {
      this.currentEdge = null;
      this.shaderData = Wings3D.gl.createShaderData();
      this.shaderData.setUniform4fv("uColor", [0.0, 1.0, 0.0, 0.3]); // hilite green, selected hilite yellow.
      // contextMenu
      this.contextMenu = {menu: document.querySelector("#"+mode+"-context-menu")};
      if (this.contextMenu.menu) {
         this.contextMenu.menuItems = this.contextMenu.menu.querySelectorAll(".context-menu__item");
      }
      // type handler 
      var self = this;
      // movement for (x, y, z)
      function addMovementHandler(axis, mode) {
         var axisName = ['X', 'Y', 'Z'];
         var menuItem = document.querySelector('#' + mode + 'Move' + axisName[axis]);
         if (menuItem) {
            menuItem.addEventListener("click", function(ev) {
               Wings3D.view.attachHandlerMouseMove(new MouseMoveAlongAxis(self, axis));
            });
         }  
      }
      for (var i = 0; i < 3; ++i) {
         addMovementHandler(i, mode);
      }
      // free Movement.

   }

   getContextMenu() {
      var hasSelection = false;
      this.eachPreviewCage( function(cage) {
         hasSelection = hasSelection || cage.hasSelection();
      });
      if (hasSelection) {
         return this.contextMenu;
      }
      return null;
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

   // move edge along movement.
   moveSelection(movement, snapshots) {
      this.eachPreviewCage( function(cage, snapshot) {
         cage.moveSelection(movement, snapshot);
      }, snapshots);
   }

   restoreMoveSelection(snapshots) {
      this.eachPreviewCage( function(cage, snapshot) {
         cage.restoreMoveSelection(snapshot);
      }, snapshots);
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

   dragSelect(cage) {
      var array = this.select.get(cage);
      if (array === undefined) {
         array = [];
         this.select.set(cage, array);
      }
      this.madsor.dragSelect(cage, array, this.onOff);
   }
}


// movement handler.
class MouseMoveAlongAxis extends MouseMoveHandler {
   constructor(madsor, axis) {   // 0 = x axis, 1 = y axis, 2 = z axis.
      super();
      this.madsor = madsor;
      this.snapshots = madsor.snapshotPosition();
      this.axis = axis;
      this.movement = [0.0, 0.0, 0.0];             // cumulative movement.
   }

   handleMouseMove(ev) {
      // todo: instead of magic constant. should supply a scaling factor.
      var move = ev.movementX/20.0;
      if (move >= 2) {
         move = 2;
      }
      var movement = [0.0, 0.0, 0.0];
      movement[this.axis] = move;
      this.madsor.moveSelection(movement, this.snapshots);
      this.movement[this.axis] += move;
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

