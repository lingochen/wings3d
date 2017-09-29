/*
//  wings3d.js
//     The start module of Wings 3D. Port 
//
// Original Erlang Version from Bjorn Gustavsson's Wings 3D
//
*/
"use strict";

var Wings3D = (function () {
	var my = {};
   var _pvt = {};

   // a few polyfill
   if (NodeList.prototype[Symbol.iterator] === undefined) {
      NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator]; // Microsoft Edge not support yet.
   }

   // utility function
   my.createMask = function() {  // from mozilla doc
      let nMask = 0, nFlag = 0, nLen = arguments.length > 32 ? 32 : arguments.length;
      for (nFlag; nFlag < nLen; nMask |= arguments[nFlag] << nFlag++);
      return nMask;
   }
   my.bindMenuItem = function(id, fn, hotkey, meta) {
      const menuItem = document.querySelector(id);
      if (menuItem) {
         menuItem.addEventListener('click', function(ev) {
            let target = ev.target;
            while ( target = target.parentNode ) {
               if ( target.classList && target.classList.contains("hover") ) {
                 target.classList.remove("hover");
                 break;
               }
             }
             // now run functions
             fn(ev);
         });
      }
      Wings3D.bindHotkey(id, fn);
      if (hotkey !== undefined) {
         Wings3D.setHotkey(id, hotkey, meta);

      }
   }

   // define constants
   my.GROUND_GRID_SIZE = 1;
   my.CAMERA_DIST = 8.0*my.GROUND_GRID_SIZE;

//make_geom_window(GeomGL, St) ->
    //Props = initial_properties(),        
    //wings_wm:new(geom, GeomGL, Op),
    //[wings_wm:set_prop(geom, K, V)|| {K,V} <- Props],
    //wings_wm:set_dd(geom, geom_display_lists),
    //set_drag_filter(geom),
    //..wings_frame:register_win(GeomGL, geom, [top, {title, geom_title(geom)}]),
    //GeomGL.

   my.start = function(canvasID) {

      // if we can initialize webgl context
      my.gl = createWebGLContext(canvasID);
      // wings_text:init(), setting font


/*    wings_pref:init(),
    wings_hotkey:set_default(),
    wings_pref:load(),
    wings_lang:init(),
    wings_plugin:init(),
    wings_sel_cmd:init(),
    wings_file:init(),

    St0 = new_st(),
    St1 = wings_sel:reset(St0),
    St2 = wings_undo:init(St1),
    //..St = wings_shape:create_folder_system(St2),

    //..wings_image:init(wings_io:get_process_option()),
    wings_color:init(),
    wings_io:init(),
*/
    my.cam = createCamera();
    my.cam.init();
//    wings_vec:init();

    my.view = createView();
    my.view.init(my.gl);

      my.contextmenu = createMenuHandler(my.view, "content");
      my.contextmenu.setup();
      my.buttonbar = createButtonBarHandler();
      my.buttonbar.setup();
      createUi(my);
      createGuideTour(my.ui.tutor);
 /*   wings_u:caption(St),
    wings_file:init_autosave(),
    wings_pb:start_link(Frame),
    wings_dialog:init(),
    wings_job:init(),
    wings_develop:init(),
    wings_tweak:init(),

//    open_file(File),
*/
      requestAnimationFrame(my.render);

      // prompt for quitting
      window.addEventListener("beforeunload", _pvt.confirmation);

      my.ui.tutor.tours.introduction();
   };

   _pvt.confirmation = function(ev) {
      // check if not saved then ask if want to quit, if nothing then just quit.
      var confirmMessage = "Are you sure you want to quit?";
      ev.returnValue = confirmMessage;      // Gecko, Trident, Chrome 34+
      return confirmMessage;                 // Gecko, WebKit, Chrome <34
   };


   my.start_halt = function() {
      // closed resource

      // halt for other reason. probably won't happen in non-erlang environment
   };
  /* my.new_st = function() {
      Empty = gb_trees:empty(),
      return #st{shapes=Empty,
                 selmode=face,
                 sel=[],
                 ssels=Empty,
                 mat=wings_material:default(),
                 saved=true,
                 onext=1,
                 repeatable=ignore,
                 ask_args=none,
                 drag_args=none,
                 def={ignore,ignore}
                }
   };*/

   my.render = function(timestamp) {
      my.view.render(my.gl);
      requestAnimationFrame(my.render);
   };

   // used this api only, for plugin export.
   my.apiExport = {};

   my.callApi = function(funcParam, position) {
      var funArray = funcParam.split(',');
      var func = funArray[0];
      var param;
      if (funArray.length > 1) {
         param = funArray[1];
      }
      if (my.apiExport[func]) {
         my.apiExport[func](position, param);
         help(func + " called");
      } else {
         console.log("api function: " + func + " does not exist.");
      }
   };

   // dialog form helper
   my.setupDialog = function(formID, submitData) {
      const _pvt = {submitSuccess: false};

      const form = document.querySelector(formID);
      if (form) {
         const submits = document.querySelectorAll(formID + ' [type="submit"]');
         for (let submit of submits) {
            if ('ok'.localeCompare(submit.value, 'en', {'sensitivity': 'base'}) == 0) {
               submit.addEventListener('click', function(ev) {
                  _pvt.submitSuccess = true;
               });
            } else if ('cancel'.localeCompare(submit.value, 'en', {'sensitivity': 'base'}) == 0) {

            } else {
               console.log('submit ' + submit.value + ' type not supported');
            }
         }
         // 

         // now handling event.
         form.addEventListener('submit', function(ev) {
            if (_pvt.submitSuccess) {
               // get form's input data.
               const elements = form.elements;
               const obj = {};
               for (let element of elements) {
                  if ((element.name) && (element.value)) {  // should we check the existence of .name? no name elements automatically excludede? needs to find out.
                     obj[element.name] = element.value;
                  }
               }
               submitData(obj);     // ask function to handle value
            }
            // hide the dialog, prevent default.
            ev.preventDefault();
            form.style.display = 'none';
         });
      }
      return form;
   };

   return my;
}());
