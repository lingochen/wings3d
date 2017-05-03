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
      const axisName = ['X', 'Y', 'Z'];
      // type handler 
      var self = this;
      // movement for (x, y, z)
      for (let axis=0; axis < 3; ++axis) {
         var menuItem = document.querySelector('#' + mode + 'Move' + axisName[axis]);
         if (menuItem) {
            menuItem.addEventListener("click", function(ev) {
               Wings3D.view.attachHandlerMouseMove(new MouseMoveAlongAxis(self, axis));
            });
         } 
      }
      // free Movement.
      var menuItem = document.querySelector('#' + mode + 'MoveFree');
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            Wings3D.view.attachHandlerMouseMove(new MoveFreePositionHandler(self));
         });
      }
      // normal Movement.

      // constructor
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
         gl.disableShader();
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

class MovePositionHandler extends MouseMoveHandler {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.snapshots = madsor.snapshotPosition();
      this.movement = [0.0, 0.0, 0.0];             // cumulative movement.
   }


   _commit(view) {
      view.undoQueue(new MoveCommand(this.madsor, this.snapshots, this.movement));
   }

   _cancel() {
      this.madsor.restoreMoveSelection(this.snapshots);
   }
}

// movement handler.
class MouseMoveAlongAxis extends MovePositionHandler {
   constructor(madsor, axis) {   // 0 = x axis, 1 = y axis, 2 = z axis.
      super(madsor);
      this.axis = axis;
   }

   handleMouseMove(ev) {
      var move = this._calibrateMovement(ev.movementX);
      var movement = [0.0, 0.0, 0.0];
      movement[this.axis] = move;
      this.madsor.moveSelection(movement, this.snapshots);
      this.movement[this.axis] += move;
   }
}


class MoveFreePositionHandler extends MovePositionHandler {
   constructor(madsor) {
      super(madsor);
   }

   handleMouseMove(ev) {
      var moveX = this._calibrateMovement(ev.movementX);
      var moveY = this._calibrateMovement(-ev.movementY);
      var movement = [moveX, moveY, 0.0];
      this.madsor.moveSelection(movement, this.snapshots);
      vec3.add(this.movement, this.movement, movement);
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

