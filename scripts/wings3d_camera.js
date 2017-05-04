/*
**
**
**     This module handles camera moves (rotation, zooming, and panning).
**
**  Original Erlang Version:  Bjorn Gustavsson
*/
"use strict";


class CameraMouseMoveHandler extends MouseMoveHandler {
   constructor(camera) {
      super();
      this.camera = camera;
      this.saveView = { origin: [0, 0, 0], };
      this.camera.copyCam(this.saveView, this.camera.view);
   }

   handleMouseMove(ev) {
      // if middle button down, pan 
      if (ev.buttons == 4) {
         this.camera.pan(ev.movementX, 0);
      } else {
         // rotated
         this.camera.rotate(ev.movementX, ev.movementY);
         //help(e.button + "," + e.buttons);
      }
   }

   _commit(view) {
      // no redo, undo for now
   }

   _cancel() {
      // restore camera's value.
      this.camera.copyCam(this.camera.view, this.saveView);
   }
}

function createCamera() {
   var my = { pref: {
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
      },
      view: (function(){
         var camera = {
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
      })(),
   };

   my.copyCam = function(save, source) {
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

   my.init = function() {
/*    case {wings_pref:get_value(num_buttons),wings_pref:get_value(camera_mode)} of
	   {3,_} -> ok
	   {_,nendo} -> ok;
	   {_,blender} -> ok;
	   {_,_} -> wings_pref:set_value(camera_mode, nendo) */
   };

   var _pvt = {};

   my.getMouseMoveHandler = function() {
      var ret = new CameraMouseMoveHandler(my);
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
   my.aimZoom = function(dir, St0) {
      /*
        if (my.pref.highLightZoomAim) {
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
         my.zoomStep(dir);
      } */
   };

   my.rotate = function(dx, dy) {
      //if (my.allowRotation()) {
	      my.view.azimuth += dx * my.pref.camRotationSpeed;
         my.view.elevation += dy * my.pref.camRotationSpeed;
      //}
   };

   my.wheelRotate = function(dx, dy) {
      if (my.pref.wheelZoom && my.pref.wheelAdds) {
         var s = 2 * my.pref.wheelRotationSpeed;
         my.view.azimuth = my.view.azimuth + (dx * s);
         my.view.elevation = my.view.elevation + (dy * s);
         my.view.alongAxis = false;
      }
      // return keep;
   };


   function wheelZoom(factor, dir) {
      var delta = Math.max(Math.abs(my.view.distance), 0.2) * (dir * factor);
      my.view.distance += delta;
      //return keep;
   };

   my.zoomStepAlt = function(dir) {
      if (my.pref.wheelZoom) {
		   wheelZoom(my.pref.wheelZoomFactorAlt, dir);
      } 
      //return keep;
   };


   my.zoomStep = function(dir) {
      if (my.pref.wheelZoom) {
         wheelZoom(my.pref.wheelZoomFactor, dir);
      }
      //return keep;
   };

   my.zoom = function(delta) {
      my.view.distance = my.view.distance + (Math.max(Math.abs(my.view.distance), 0.2) * delta / 80);
   };

   my.pan = function(dx, dy) {
      var s = my.view.distance * (1/20)/(101-my.pref.panSpeed);
      my.view.panX = my.view.panX + (dx*s);
      my.view.panY = my.view.panY + (dy*s);
   };

   my.keyPan = function(dx, dy) {
      var s = my.view.distance * (my.pref.panSpeedArrowKeys/100);
      my.view.panX = my.view.panX + (dx * s);
      my.view.panY = my.view.panY + (dy * s);
   };
   my.keyPanLeftArrow = function() {
      my.keyPan(0.05, 0.0);
   };
   my.keyPanRightArrow = function() {
      my.keyPan(-0.05, 0.0);
   }
   my.keyPanUpArrow = function() {
      my.keyPan(0, 0.05);
   };
   my.keyPanDownArrow = function() {
      my.keyPan(0, -0.05);
   }

   my.wheelPan = function(dx0, dy0) {
      if (my.pref.wheelZoom && my.pref.wheelAdds) {
         var s = my.view.distance * (my.pref.wheelPanSpeed/100);
         my.view.panX = my.view.panX + (dx * s);
         my.view.panY = my.view.panY - (dy * s);
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

   return my;
};

