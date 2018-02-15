/*
**
**
**     This module handles camera moves (rotation, zooming, and panning).
**
**  Original Erlang Version:  Bjorn Gustavsson
*/

import { MouseMoveHandler } from './wings3d_undo.js';
import * as Wings3D from './wings3d.js';


class CameraMouseMoveHandler extends MouseMoveHandler {
   constructor() {
      super();
      this.saveView = { origin: [0, 0, 0], };
      copyCam(this.saveView, view);
   }

   handleMouseMove(ev) {
      // if middle button down, pan 
      if (ev.buttons == 4) {
         pan(ev.movementX, 0);
      } else {
         // rotated
         rotate(ev.movementX, ev.movementY);
         //help(e.button + "," + e.buttons);
      }
   }

   _commit() {
      // no redo, undo for now
      //debugLog("exitCameraMode", {ok: this.camera});
   }

   _cancel() {
      // restore camera's value.
      copyCam(view, this.saveView);
      //debugLog("exitCameraMode", {cancel: this.camera});
   }
}

// module variable.
   let pref = {
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
         wheelZoom: true,
         wheelZoomFactorAlt: 0.0005,
         wheelZoomFactor: 0.005
      };
   let view = (function(){
         let camera = {
            origin: [0.0, 0.0, 0.0],
            azimuth: -45.0, elevation: 25.0,
            distance: Wings3D.CAMERA_DIST,
            panX: 0.0, panY: 0.0,
            fov: 45.0,
            zNear: 0.1, zFar: 1000.0
         };
         return {
            alongAxis: false,
            isModified: false,
            inverseCameraVectors: function() {
               var cam = mat4.create();
               // fromTranslation, identity * vec3. modelView rest.
               mat4.fromTranslation(cam, vec3.fromValues(-camera.panX, -camera.panY, camera.distance));
               mat4.rotateX(cam, cam, -camera.elevation * Math.PI / 180);
               mat4.rotateY(cam, cam, -camera.azimuth * Math.PI / 180);
               mat4.translate(cam, cam, -camera.origin);
               // x===right, y===up, z===forward.
               var ret = {x: [cam[0], cam[1], cam[2]], 
                          y: [cam[4], cam[5], cam[6]], 
                          z: [cam[8], cam[9], cam[10]]
                         };
               vec3.normalize(ret.x, ret.x);
               vec3.normalize(ret.y, ret.y);
               vec3.normalize(ret.z, ret.z);
               return ret;
            }, 
            get origin() { return camera.origin; },
            set origin(org) { 
               if ( camera.origin[0] != org[0] || camera.origin[1] != org[1] || camera.origin[2] != org[2]) {
                  camera.origin[0] = org[0];
                  camera.origin[1] = org[1];
                  camera.origin[2] = org[2];
                  this.isModified = true;
               }
            },
            get azimuth() { return camera.azimuth; },
            set azimuth(azi) {
               if (azi != camera.azimuth) {
                  camera.azimuth = azi;
                  this.isModified = true;
               }
            },
            get elevation() { return camera.elevation; },
            set elevation(elv) {
               if (camera.elevation != elv) {
                  camera.elevation = elv;
                  this.isModified = true;
               }
            },
            get distance() { return camera.distance; },
            set distance(dist) {
               if (camera.distance != dist) {
                  Wings3D.log(Wings3D.action.cameraZoom, dist - camera.distance);
                  camera.distance = dist;
                  this.isModified = true;
               }
            },
            get panX() { return camera.panX; },
            set panX(px) {
               if (camera.panX != px) {
                  camera.panX = px;
                  this.isModified = true;
               }
            },
            get panY() { return camera.panY; },
            set panY(py) {
               if (camera.panY != py) {
                  camera.panY = py;
                  this.isModified = true;
               }
            },
            get fov() { return camera.fov; },
            set fov(fv) {
               if (camera.fov != fv) {
                  camera.fov = fv;
                  this.isModified = true;
               }
            },
            get zNear() { return camera.zNear; },
            set zNear(near) {
               if (camera.zNear != near) {
                  camear.zNear = near;
                  this.isModified = true;
               }
            },
            get zFar() { return camera.zFar; },
            set zFar(far) {
               if (camera.zFar != far) {
                  camera.zFar = far;
                  this.isModified = true;
               }
            },
          };
      }());

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

   function init() {
/*    case {wings_pref:get_value(num_buttons),wings_pref:get_value(camera_mode)} of
	   {3,_} -> ok
	   {_,nendo} -> ok;
	   {_,blender} -> ok;
      {_,_} -> wings_pref:set_value(camera_mode, nendo) */
   };

   function getMouseMoveHandler() {
      const ret = new CameraMouseMoveHandler();
      return ret;
   };

/*
%%%
%%% Common utilities.
%%%h

generic_event(redraw, _Camera, #state{st=St, func=none}) ->
    wings:redraw(St),
    keep;
generic_event(redraw, _Camera, #state{func=Redraw}) when is_function(Redraw) ->
    Redraw(),
    keep;

generic_event(#mousebutton{button=4,mod=Mod,state=?SDL_RELEASED}, _Camera, _Redraw)
  when Mod band ?SHIFT_BITS =/= 0 andalso Mod band ?ALT_BITS =/= 0 ->
    whrotate(0.5,0.0);
generic_event(#mousebutton{button=5,mod=Mod,state=?SDL_RELEASED}, _Camera, _Redraw)
  when Mod band ?SHIFT_BITS =/= 0 andalso Mod band ?ALT_BITS =/= 0 ->
    whrotate(-0.5,0.0);
generic_event(#mousebutton{button=4,mod=Mod,state=?SDL_RELEASED}, _Camera, _Redraw)
  when Mod band ?SHIFT_BITS =/= 0 ->
    whrotate(0.0,0.5);
generic_event(#mousebutton{button=5,mod=Mod,state=?SDL_RELEASED}, _Camera, _Redraw)
  when Mod band ?SHIFT_BITS =/= 0 ->
    whrotate(0.0,-0.5);

generic_event(#mousebutton{button=4,mod=Mod,state=?SDL_RELEASED}, _Camera, _Redraw)
  when Mod band ?CTRL_BITS =/= 0 andalso Mod band ?ALT_BITS =/= 0 ->
    whpan(0.05,0.0);
generic_event(#mousebutton{button=5,mod=Mod,state=?SDL_RELEASED}, _Camera, _Redraw)
  when Mod band ?CTRL_BITS =/= 0 andalso Mod band ?ALT_BITS =/= 0 ->
    whpan(-0.05,0.0);
generic_event(#mousebutton{button=4,mod=Mod,state=?SDL_RELEASED}, _Camera, _Redraw)
  when Mod band ?CTRL_BITS =/= 0 ->
    whpan(0.0,0.05);
generic_event(#mousebutton{button=5,mod=Mod,state=?SDL_RELEASED}, _Camera, _Redraw)
  when Mod band ?CTRL_BITS =/= 0 ->
    whpan(0.0,-0.05);

generic_event(#mousebutton{button=4,mod=Mod,state=?SDL_RELEASED}, _Camera, _Redraw)
  when Mod band ?ALT_BITS =/= 0 ->
    zoom_step_alt(-1);
generic_event(#mousebutton{button=4,state=?SDL_RELEASED}, #st{}=St, none) ->
%% Matching 'none' stops zoom aim from being activated during a drag sequence.
%% Zoom aim warps the mouse to the screen's centre, and this can cause a crash
%% in since drag events also depend on cursor position.
    aim_zoom(-1, St);
generic_event(#mousebutton{button=4,state=?SDL_RELEASED}, _Camera, _Redraw) ->
    zoom_step(-1);
generic_event(#mousebutton{button=5,mod=Mod,state=?SDL_RELEASED}, _Camera, _Redraw)
  when Mod band ?ALT_BITS =/= 0 ->
    zoom_step_alt(1);
generic_event(#mousebutton{button=5,state=?SDL_RELEASED}, _, none) ->
%% Matching 'none' stops zoom aim from being activated during a drag sequence
    zoom_step(1);
generic_event(#mousebutton{button=5,state=?SDL_RELEASED}, _Camera, _Redraw) ->
    zoom_step(1);

generic_event(_, _, _) -> keep.

*/
   function aimZoom(dir, St0) {
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

   function rotate(dx, dy) {
      //if (allowRotation()) {
	      view.azimuth += dx * pref.camRotationSpeed;
         view.elevation += dy * pref.camRotationSpeed;
      //}
   };

   function wheelRotate(dx, dy) {
      if (pref.wheelZoom && pref.wheelAdds) {
         var s = 2 * pref.wheelRotationSpeed;
         view.azimuth = view.azimuth + (dx * s);
         view.elevation = view.elevation + (dy * s);
         view.alongAxis = false;
      }
      // return keep;
   };


   function wheelZoom(factor, dir) {
      var delta = Math.max(Math.abs(view.distance), 0.2) * (dir * factor);
      view.distance += delta;
      //return keep;
   };

   function zoomStepAlt(dir) {
      if (pref.wheelZoom) {
		   wheelZoom(pref.wheelZoomFactorAlt, dir);
      } 
      //return keep;
   };


   function zoomStep(dir) {
      if (pref.wheelZoom) {
         wheelZoom(pref.wheelZoomFactor, dir);
      }
      //return keep;
   };

   function zoom(delta) {
      view.distance = view.distance + (Math.max(Math.abs(view.distance), 0.2) * delta / 80);
   };

   function pan(dx, dy) {
      const s = view.distance * (1/20)/(101-pref.panSpeed);
      view.panX += (dx*s);
      view.panY += (dy*s);
   };

   function keyPan(dx, dy) {
      const s = view.distance * (pref.panSpeedArrowKeys/100);
      view.panX += (dx * s);
      view.panY += (dy * s);
   };
   function keyPanLeftArrow() {
      keyPan(0.05, 0.0);
   };
   function keyPanRightArrow() {
      keyPan(-0.05, 0.0);
   }
   function keyPanUpArrow() {
      keyPan(0, 0.05);
   };
   function keyPanDownArrow() {
      keyPan(0, -0.05);
   }

   function wheelPan(dx0, dy0) {
      if (pref.wheelZoom && pref.wheelAdds) {
         const s = view.distance * (pref.wheelPanSpeed/100);
         view.panX += (dx * s);
         view.panY -= (dy * s);
      }
      // keep
   };

   // handle mouse and keyboard event.

/*
stop_camera(#camera{ox=Ox,oy=Oy}) ->
    wings_wm:release_focus(),
    case wings_io:ungrab(Ox, Oy) of
	still_grabbed ->
	    wings_wm:later(view_changed);
	no_grab ->
	    wings_wm:dirty()
    end,
    update_sel(fun show_sel_fun/2),
    pop.

camera_mouse_range(X1, Y1, #camera{x=OX,y=OY, xt=Xt0, yt=Yt0}=Camera) ->
%%    io:format("Camera Mouse Range ~p ~p~n", [{X0,Y0}, {OX,OY,Xt0,Yt0}]),
    XD0 = (X1 - OX),
    YD0 = (Y1 - OY),
    {XD,YD} = wings_pref:lowpass(XD0 + Xt0, YD0 + Yt0),

    if
	XD0 =:= 0, YD0 =:= 0 ->
	    {0.0,0.0,Camera#camera{xt=0,yt=0}};
	true ->
	    wings_io:warp(OX, OY),
	    {XD/?CAMDIV, YD/?CAMDIV, Camera#camera{xt=XD0, yt=YD0}}
    end.

view_hotkey(Ev, Camera, #state{st=St}) ->
    case wings_hotkey:event(Ev,St) of
	next -> keep;
	{view,smooth_proxy} -> keep;
	{view,quick_preview} -> keep;
	{view,Cmd} -> 
	    wings_view:command(Cmd, St),
	    keep;	
	_Other -> %% Hotkey pressed, Quit camera mode
	    wings_wm:later(Ev),
	    stop_camera(Camera)
    end.

message(Message) ->
    wings_wm:message(Message),
    wings_wm:message_right([]).
    
grab() ->
    wings_io:grab(),
    wings_wm:grab_focus(),
    update_sel(fun hide_sel_fun/2).

hide_sel_fun(#dlo{sel=Sel}=D, _) ->
    D#dlo{sel={call,none,Sel}}.

show_sel_fun(#dlo{sel={call,none,Sel}}=D, _) ->
    D#dlo{sel=Sel};
show_sel_fun(D, _) -> D.

allow_rotation() ->
    wings_wm:get_prop(allow_rotation).

update_sel(Fun) ->
    case wings_pref:get_value(hide_sel_in_camera_moves) of
	false -> ok;
	true -> wings_dl:map(Fun, [])
    end.

format([{Mod,But,Msg}|T]) ->
    wings_msg:join(wings_msg:mod_format(Mod, But, Msg), format(T));
format([]) -> []. 
*/

export {
   pref, 
   view,
   getMouseMoveHandler,
   aimZoom,
   rotate,
   wheelRotate,
   wheelZoom,
   zoomStepAlt,
   zoomStep,
   zoom,
   pan,
   keyPan,
   keyPanLeftArrow,
   keyPanRightArrow,
   keyPanUpArrow,
   keyPanDownArrow,
   wheelPan,
};

Wings3D.onReady(init);