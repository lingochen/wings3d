/*
//  wings3d.js
//     The start module of Wings 3D. Port,
//
// Original Erlang Version from Bjorn Gustavsson's Wings 3D
//
// 12-11-2017: convert to es6 module.
*/
import {gl, createWebGLContext} from './wings3d_gl';
//import * as View from './wings3d_view';
//import * as Interact from './wings3d_interact';

//
// onReady. 
//
let isDocumentReady = false;
let deferredList = [];
function onReady(fn) {
   // If the DOM is already ready
   if ( isDocumentReady ) {
      fn();
   } else {
     // Add the function to the wait list
     deferredList.push( fn );
   }
   return this;
 };
// The ready event handler and self cleanup method
let _canvasID = '';
function onLoad(ev) {
	document.removeEventListener( "DOMContentLoaded", onLoad);
	//window.removeEventListener( "load", onLoad);
	init(_canvasID);
}
function start(canvas) {
   // automatically start
   if (document.readyState != 'loading'){
      init(canvas);
   } else {
      _canvasID = canvas;
      document.addEventListener('DOMContentLoaded', onLoad );
   }
}

//-- end of ready --------------

// a few polyfill
if (NodeList.prototype[Symbol.iterator] === undefined) {
   NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator]; // Microsoft Edge not support yet.
}


// log, does nothing for now, debug build?
let interpose = []; 
function log(action, value) {
   for (let logFn of interpose) {
      logFn(action, value);
   }
};
function interposeLog(logFn, insert) {
   if (insert) {
      interpose.push( logFn );
   } else {
      let index = interpose.indexOf(logFn);
      if (index > -1) {
         interpose.splice(index, 1);
      }
   }
};

// utility function
function createMask() {  // from mozilla doc
   let nMask = 0, nFlag = 0, nLen = arguments.length > 32 ? 32 : arguments.length;
   for (nFlag; nFlag < nLen; nMask |= arguments[nFlag] << nFlag++);
   return nMask;
}

// define constants
const GROUND_GRID_SIZE = 1;
const CAMERA_DIST = 8.0*GROUND_GRID_SIZE;

//make_geom_window(GeomGL, St) ->
    //Props = initial_properties(),        
    //wings_wm:new(geom, GeomGL, Op),
    //[wings_wm:set_prop(geom, K, V)|| {K,V} <- Props],
    //wings_wm:set_dd(geom, geom_display_lists),
    //set_drag_filter(geom),
    //..wings_frame:register_win(GeomGL, geom, [top, {title, geom_title(geom)}]),
    //GeomGL.

function init(canvasID) {
   // webgl context, handle first, and available.
   createWebGLContext(canvasID);
   // wings_text:init(), setting font
   isDocumentReady = true;

   // now run through the defered list.
   for (let fn of deferredList) {
      fn();
   }
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
   //camera.createCamera();
   //Camera.init();
//    wings_vec:init();

   //view.createView();
//   View.init();

   //contextmenu.createMenuHandler(view, "content");
//   Contextmenu.init("content", "popupmenu");
   //Buttonbar.createButtonBarHandler();
//   Buttonbar.init();
//   Interact.init();
   //createGuideTour();
 /*   wings_u:caption(St),
    wings_file:init_autosave(),
    wings_pb:start_link(Frame),
    wings_dialog:init(),
    wings_job:init(),
    wings_develop:init(),
    wings_tweak:init(),

//    open_file(File),
*/
      // prompt for quitting
      window.addEventListener("beforeunload", confirmation);

      //my.ui.tutor.tours.about();
   };

function confirmation(ev) {
   // check if not saved then ask if want to quit, if nothing then just quit.
   const confirmMessage = "Are you sure you want to quit?";
   ev.returnValue = confirmMessage;      // Gecko, Trident, Chrome 34+
   return confirmMessage;                 // Gecko, WebKit, Chrome <34
};


export function start_halt() {
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

function bindAction(id, fn) {
   if (action.hasOwnProperty(id)) {
      action[id] = fn;
   }
};
function runAction(id, event) {
   if (action.hasOwnProperty(id)) {
      const fn = action[id];
      fn(event);
   }
}

function notImplemented(obj) {
   console.log( obj.name + " action is not implemented");
}
// log action constant
const action = {
   cameraModeEnter: () => {notImplemented(this);},
   cameraModeExit: () => {notImplemented(this);},
   cameraZoom: () => {notImplemented(this);},
   contextMenu: () => {notImplemented(this);},
   createCubeDialog: () => {notImplemented(this);},
   // fileMenu
   fileMenu: () => {notImplemented(this);},
   importMenu: () => {notImplemented(this);},
   exportMenu: () => {notImplemented(this);},
   // view action, button bar
   toggleVertexMode: () => {notImplemented(this);},
   toggleEdgeMode: () => {notImplemented(this);},
   toggleFaceMode: () => {notImplemented(this);},
   toggleBodyMode: () => {notImplemented(this);},
   redoEdit: () => {notImplemented(this);},
   undoEdit: () => {notImplemented(this);},
   // selection menu
   selectMenu: () => {notImplemented(this);},
   deselect: () => {notImplemented(this);},
   more: () => {notImplemented(this);},
   less: () => {notImplemented(this);},
   similar: () => {notImplemented(this);},
   all: () => {notImplemented(this);},
   invert: () => {notImplemented(this);},
   adjacent: () => {notImplemented(this);},
   //menu action
   bodyDelete: () => {notImplemented(this);},
   bodyRename: () => {notImplemented(this);},
   bodyDuplicateMoveMenu: () => {notImplemented(this);},
   bodyDuplicateMoveX: () => {notImplemented(this);},
   bodyDuplicateMoveY: () => {notImplemented(this);},
   bodyDuplicateMoveZ: () => {notImplemented(this);},
   bodyDuplicateMoveFree: () => {notImplemented(this);},
   bodyMoveMenu: () => {notImplemented(this);},
   bodyMoveX: () => {notImplemented(this);},
   bodyMoveY: () => {notImplemented(this);},
   bodyMoveZ: () => {notImplemented(this);},
   bodyMoveFree: () => {notImplemented(this);},
   bodyMoveNormal: () => {notImplemented(this);},
   // edge
   cutMenu: () => {notImplemented(this);},
   cutLine2: () => {notImplemented(this);},
   cutLine3: () => {notImplemented(this);},
   cutLine4: () => {notImplemented(this);},
   cutLine5: () => {notImplemented(this);},
   cutLine10: () => {notImplemented(this);},
   cutAsk: () => {notImplemented(this);},
   cutAndConnect: () =>{notImplemented(this);},
   edgeDissolve: () =>{notImplemented(this);},
   edgeCollapse: () =>{notImplemented(this);},
   edgeMoveMenu: () => {notImplemented(this);},
   edgeMoveX: () => {notImplemented(this);},
   edgeMoveY: () => {notImplemented(this);},
   edgeMoveZ: () => {notImplemented(this);},
   edgeMoveFree: () => {notImplemented(this);},
   edgeMoveNormal: () => {notImplemented(this);},
   // face
   faceExtrudeMenu: () =>{notImplemented(this);},
   faceExtrudeX: () =>{notImplemented(this);},
   faceExtrudeY: () =>{notImplemented(this);},
   faceExtrudeZ: () =>{notImplemented(this);},
   faceExtrudeFree: () =>{notImplemented(this);},
   faceExtrudeNormal: () =>{notImplemented(this);},
   faceDissolve: () =>{notImplemented(this);},
   faceCollapse: () =>{notImplemented(this);},
   faceMoveMenu: () =>{notImplemented(this);},
   faceMoveX: () => {notImplemented(this);},
   faceMoveY: () => {notImplemented(this);},
   faceMoveZ: () => {notImplemented(this);},
   faceMoveFree: () => {notImplemented(this);},
   faceMoveNormal: () => {notImplemented(this);},
   // vertex
   vertexConnect: () => {notImplemented(this);},
   vertexDissolve: () => {notImplemented(this);},
   vertexCollapse: () => {notImplemented(this);},
   vertexMoveMenu: () => {notImplemented(this);},
   vertexMoveX: () => {notImplemented(this);},
   vertexMoveY: () => {notImplemented(this);},
   vertexMoveZ: () => {notImplemented(this);},
   vertexMoveFree: () => {notImplemented(this);},
   vertexMoveNormal: () => {notImplemented(this);},
   // guide tour
   helpMenu: () => {notImplemented(this);},
   about: () => {notImplemented(this);},
   introduction: () => {notImplemented(this);},
   basicCommands: () => {notImplemented(this);},
   tableTutor: () => {notImplemented(this);},
};

export {
   onReady,
   start,
   log,
   interposeLog,
   createMask,
   GROUND_GRID_SIZE,
   CAMERA_DIST,
   action,
   bindAction,
   runAction,
};
