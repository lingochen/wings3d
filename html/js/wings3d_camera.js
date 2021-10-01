/*
**
**
**     This module handles camera moves (rotation, zooming, and panning).
**
**  Original Erlang Version:  Bjorn Gustavsson
*/

import { MouseMoveHandler } from './wings3d_undo.js';
import * as Wings3D from './wings3d.js';
const {vec3, mat4} = glMatrix;



// module variable.
const pref = {
   cameraMode: "WingsCam",
   numButtons: 3,
   camRotationSpeed: 0.5,
   panSpeed: 25,
   panSpeedArrowKeys: 50,
   wheelAdds: false,
   whScrollInfo: true,
   whPanSpeed: 50,
   whRotationSpeed: 0.15,
   highLightZoomAim: false,
   // additional pref
   wheelZooms: true,
   wheelZoomFactorAlt: 0.0005,
   wheelZoomFactor: 0.005,
   // dragging
   dragSpeed: 8.5,
   dragRotateSpeed: 8.5,
   dragScaleSpeed: 8.5,
};



class CameraMouseMoveHandler extends MouseMoveHandler {
   constructor(view, isPan) {
      super();
      this.saveView = { origin: [0, 0, 0], };
      copyCam(this.saveView, view);
      this.view = view;
      this.isPan = isPan;
   }

   handleInput(evt, cameraView, axis) {
      const value = Number(evt.target.value);
      if (!isNaN(value)) {
         if (axis === 0) {
            this.view.azimuth = value;
         } else {
            this.view.elevation = value;
         }
      } 
      //this._transformSelection(this._processInput(Number(evt.target.value), cameraView, axis));
   }

   getInputSetting() {
      return [{value: this.view.elevation, name: "El"}, {value: this.view.azimuth, name: "Az"}];
   }

   handleMouseMove(ev) {
      // if middle button down, pan 
      if ((ev.buttons == 4) || this.isPan) {
         this.view.pan(ev.movementX, ev.movementY);
      } else {
         // rotated
         this.view.rotate(ev.movementX, ev.movementY);
         //help(e.button + "," + e.buttons);
      }
   }

   commit() {}

   rescind() {
      this.undo();
   }

   doIt() {
      // no redo, undo for now
      //debugLog("exitCameraMode", {ok: this.camera});
   }

   undo() {
      // restore camera's value.
      copyCam(this.view, this.saveView);
      //debugLog("exitCameraMode", {cancel: this.camera});
   }
}

// utility function
function copyCam(save, source) {
   save.origin[0] = source.origin[0];
   save.origin[1] = source.origin[1];
   save.origin[2] = source.origin[2];
   save.azimuth = source.azimuth;
   save.elevation = source.elevation;
   save.distance = source.distance;
   save.panX = source.panX;
   save.panY = source.panY;
   save.fov = source.fov;
   save.zNear = source.zNear;
   save.zFar = source.zFar;
};


class Camera {
   constructor() {
      this.view = {
            origin: [0.0, 0.0, 0.0],
            azimuth: -45.0, elevation: 25.0,
            distance: Wings3D.CAMERA_DIST,
            panX: 0.0, panY: 0.0,
            fov: 45.0,
            zNear: 0.1, zFar: 1000.0
      };
      this.alongAxis = false;
      this.isModified = true;
   }

   inverseCameraVectors() {
      const cam = mat4.create();
      // fromTranslation, identity * vec3. modelView rest.
      mat4.fromTranslation(cam, vec3.fromValues(-this.view.panX, -this.view.panY, this.view.distance));
      mat4.rotateY(cam, cam, -this.view.azimuth * Math.PI / 180);
      mat4.rotateX(cam, cam, -this.view.elevation * Math.PI / 180);
      mat4.translate(cam, cam, [-this.view.origin[0], -this.view.origin[1], -this.view.origin[2]]);
      // x===right, y===up, z===forward.
      const ret = {x: [cam[0], cam[1], cam[2]], 
                   y: [cam[4], cam[5], cam[6]], 
                   z: [cam[8], cam[9], cam[10]]
               };
      vec3.normalize(ret.x, ret.x);
      vec3.normalize(ret.y, ret.y);
      vec3.normalize(ret.z, ret.z);
      return ret;
   }

   calibrateMovement(mouseMove) {
      // use the erlang Wings3d scaling code to be consistent.
      const speed = pref.dragSpeed;
      const dist = this.view.distance;
      const factor = (dist/((11-speed) * ((11-speed)*300))) * (this.view.fov / 60);
         
      return mouseMove * factor;
   }

   rotateMovement(mouseMove) {
      const speed = pref.dragRotateSpeed;
      const factor = 1.0/((10.1-speed)*8) * (Math.PI/180);
         
      return mouseMove * factor;
   }
            
   scaleMovement(mouseMove) {
      const speed = pref.dragScaleSpeed;
      const dist = this.view.distance;
      const factor = (dist/((11-speed)*((11-speed)*900)));
      return  mouseMove * factor;
   }

   get origin() { return this.view.origin; }
   set origin(org) { 
      if ( vec3.exactEquals(this.view.origin, org) ) {
         vec3.copy(this.view.origin, org);
         this.isModified = true;
      }
   }

   get azimuth() { return this.view.azimuth; }
   set azimuth(azi) {
      if (azi != this.view.azimuth) {
         this.view.azimuth = azi;
         this.isModified = true;
      }
   }
            
   get elevation() { return this.view.elevation; }
   set elevation(elv) {
      if (this.view.elevation != elv) {
         this.view.elevation = elv;
         this.isModified = true;
      }
   }

   get distance() { return this.view.distance; }
   set distance(dist) {
      if (this.view.distance != dist) {
         Wings3D.log(Wings3D.action.cameraZoom, dist - this.view.distance);
         this.view.distance = dist;
         this.isModified = true;
      }
   }

   get panX() { return this.view.panX; }
   set panX(px) {
      if (this.view.panX != px) {
         this.view.panX = px;
         this.isModified = true;
      }
   }

   get panY() { return this.view.panY; }
   set panY(py) {
      if (this.view.panY != py) {
         this.view.panY = py;
         this.isModified = true;
      }
   }

   get fov() { return this.view.fov; }
   set fov(fv) {
      if (this.view.fov != fv) {
         this.view.fov = fv;
         this.isModified = true;
      }
   }
   get zNear() { return this.view.zNear; }
   set zNear(near) {
      if (this.view.zNear != near) {
         this.view.zNear = near;
         this.isModified = true;
      }
   }
   get zFar() { return this.view.zFar; }
   set zFar(far) {
      if (this.view.zFar != far) {
         this.view.zFar = far;
         this.isModified = true;
      }
   }

   getMouseMoveHandler() {
      return new CameraMouseMoveHandler(this, false);
   }

   getMousePanHandler() {
      return new CameraMouseMoveHandler(this, true);
   }


   aimZoom(dir, St0) {
      /*
        if (pref.highLightZoomAim) {
        #view{origin=OriginB}=Before = wings_view:current(),
        {{_,Cmd},_} = wings:highlight_aim_setup(St0),
        wings_view:command(Cmd,St0),
        #view{origin=OriginA} = wings_view:current(),
        O = e3d_vec:zero(),
        if OriginA =:= O, Cmd =:= aim ->
              wings_view:set_current(Before),
              zoom_step(Dir);
            OriginA =:= OriginB ->
              zoom_step(Dir);
            true ->
              Client = wings_wm:this(),
              {X0,Y0} = wings_wm:win_size(Client),
              {X,Y} = {X0 div 2, Y0 div 2},
              wings_io:warp(X,Y),
              zoom_step(Dir)
      } else {
         zoomStep(dir);
      } */
   };

   rotate(dx, dy) {
      //if (allowRotation()) {
	   this.azimuth += dx * pref.camRotationSpeed;
      this.elevation += dy * pref.camRotationSpeed;
      //}
   };

   wheelRotate(dx, dy) {
      if (pref.wheelZooms && pref.wheelAdds) {
         const s = 2 * pref.wheelRotationSpeed;
         this.azimuth = this.view.azimuth + (dx * s);
         this.elevation = this.view.elevation + (dy * s);
         this.alongAxis = false;
      }
      // return keep;
   };


   wheelZoom(factor, dir) {
      const delta = Math.max(Math.abs(this.view.distance), 0.2) * (dir * factor);
      this.distance += delta;
      //return keep;
   };

   zoomStepAlt(dir) {
      if (pref.wheelZooms) {
		   this.wheelZoom(pref.wheelZoomFactorAlt, dir);
      } 
      //return keep;
   };


   zoomStep(dir) {
      if (pref.wheelZooms) {
         this.wheelZoom(pref.wheelZoomFactor, dir);
      }
      //return keep;
   };

   zoom(delta) {
      this.distance = this.view.distance + (Math.max(Math.abs(this.view.distance), 0.2) * delta / 80);
   };

   pan(dx, dy) {
      const s = this.view.distance * (1/20)/(101-pref.panSpeed);
      this.panX += (dx*s);
      this.panY += (dy*s);
   };

   keyPan(dx, dy) {
      const s = this.view.distance * (pref.panSpeedArrowKeys/100);
      this.panX += (dx * s);
      this.panY += (dy * s);
   };
   keyPanLeftArrow() {
      this.keyPan(0.05, 0.0);
   };
   keyPanRightArrow() {
      this.keyPan(-0.05, 0.0);
   }
   keyPanUpArrow() {
      this.keyPan(0, 0.05);
   };
   keyPanDownArrow() {
      this.keyPan(0, -0.05);
   }

   wheelPan(dx, dy) {
      if (pref.wheelZooms && pref.wheelAdds) {
         const s = this.view.distance * (pref.wheelPanSpeed/100);
         this.panX += (dx * s);
         this.panY -= (dy * s);
      }
      // keep
   };

   /**
    * axis = [x = 0, y =  1, z = 2, -x = 3, -y = 4, -z = 5]
    */
   viewAxis(axis) {
      let azimuth, elevation;
      switch (axis) {   // switch, for 
         case 0:
            azimuth = -90.0; elevation = 0.0;
            break;
         case 1:
            azimuth = 0.0; elevation = 90.0;
            break;
         case 2:
            azimuth = 0.0; elevation = 0.0;
            break;
         case 3:
            azimuth = 90.0; elevation = 0.0;
            break;
         case 4:
            azimuth = 0.0; elevation = -90.0;
            break;
         case 5:
            azimuth = 180.0; elevation = 0.0;
            break;
         default:
            console.log("viewAxis non-existent axis: " + axis);
            azimuth = this.azimuth;
            elevation = this.elevation;
      }
      this.azimuth = azimuth;
      this.elevation = elevation;
   }
}


export {
   pref, 
   Camera,
};