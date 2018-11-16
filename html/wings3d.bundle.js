/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 25);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["start_halt"] = start_halt;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "onReady", function() { return onReady; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "start", function() { return start; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "log", function() { return log; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "interposeLog", function() { return interposeLog; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createMask", function() { return createMask; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GROUND_GRID_SIZE", function() { return GROUND_GRID_SIZE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CAMERA_DIST", function() { return CAMERA_DIST; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "action", function() { return action; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addActionConstant", function() { return addActionConstant; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bindAction", function() { return bindAction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "runAction", function() { return runAction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setInteraction", function() { return setInteraction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ezFetch", function() { return ezFetch; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__ = __webpack_require__(5);
/*
//  wings3d.js
//     The start module of Wings 3D. Port,
//
// Original Erlang Version from Bjorn Gustavsson's Wings 3D
//
// 12-11-2017: convert to es6 module.
*/

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
   Object(__WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["createWebGLContext"])(canvasID);
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


function start_halt() {
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

let interactFn;
function setInteraction(interact) {
   interactFn = interact;
}
const lastMouseDown = [null, null, null];
function handleContextmenu(ev) {
   ev.preventDefault();
   return false;
}
function handleMouseDown(ev) {
   if (ev.button <= 2) {
      lastMouseDown[ev.button] = ev.currentTarget;
   } else {
      console.log("Amazing: mouse button is " + ev.button);
   }
   //ev.stopImmediatePropagation();
};
function handleMouseUp(ev) {
   if (ev.button <= 2) {
      let lastDownEvent = lastMouseDown[ev.button];
      if (lastDownEvent) {
         if (lastDownEvent === ev.currentTarget) {
            // now we do proper clicking
            runAction(ev.button, ev.currentTarget.id, ev);
         }
      }
   }
   // reset
   lastMouseDown[0] = lastMouseDown[1] = lastMouseDown[2] = null;
   //ev.stopImmediatePropagation();
};
function bindAction(menuItem, button, id, fn) {
   if (action.hasOwnProperty(id)) {
      if (!Array.isArray(action[id])) {
         action[id] = [null, null, null];
         if (menuItem) {
            menuItem.addEventListener("mousedown", handleMouseDown);
            menuItem.addEventListener("mouseup", handleMouseUp);
            menuItem.addEventListener("contextmenu", handleContextmenu);  // no ops.
         }
      }
      action[id][button] = fn;
   }
};
function runAction(button, id, event) {
   if (action.hasOwnProperty(id)) {
      const fn = action[id][button];
      if (fn) {
         if (interactFn) {
            if (interactFn(id, event)) {
               fn(event);
            }
         } else {
            fn(event);
         }
      }
   } else {
      console.log("unrecognized action: " + id);
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
   openSidebar: () => {notImplemented(this);},
   toggleVertexMode: () => {notImplemented(this);},
   toggleEdgeMode: () => {notImplemented(this);},
   toggleFaceMode: () => {notImplemented(this);},
   toggleBodyMode: () => {notImplemented(this);},
   toggleMultiMode: () => {notImplemented(this);},
   redoEdit: () => {notImplemented(this);},
   undoEdit: () => {notImplemented(this);},
   // preference Group
   preferenceButton: ()=>{notImplemented(this);},
   toggleOrtho: ()=> {notImplemented(this);},
   toggleGround: ()=>{notImplemented(this);},
   toggleAxes: ()=> {notImplemented(this);},
   // createObject Menu
   createCube: () => {notImplemented(this);},
   createCubePref: () =>{notImplemented(this);},
   createMaterial: () => {notImplemented(this);},
   // outliner/geometory
   toggleObjectSelect: () => {notImplemented(this);},
   toggleObjectVisibility: () =>{notImplemented(this);},
   toggleObjectLock: ()=>{notImplemented(this);},
   toggleWireMode: ()=>{notImplemented(this);},
   objectRename: ()=>{notImplemented(this);},
   objectDelete: ()=>{notImplemented(this);},
   objectDuplicate: ()=>{notImplemented(this);},
   // selection menu
   selectMenu: () => {notImplemented(this);},
   deselect: () => {notImplemented(this);},
   more: () => {notImplemented(this);},
   less: () => {notImplemented(this);},
   similar: () => {notImplemented(this);},
   all: () => {notImplemented(this);},
   invert: () => {notImplemented(this);},
   adjacent: () => {notImplemented(this);},
   edgeLoopMenu: () => {notImplemented(this);},
   edgeLoop1:  () => {notImplemented(this);},
   nthEdgeLoopMenu: () => {notImplemented(this);},
   edgeLoop2: () => {notImplemented(this);},
   edgeLoop3: () => {notImplemented(this);},
   edgeLoopN: () => {notImplemented(this);},
   edgeRing1:  () => {notImplemented(this);},
   nthEdgeRingMenu: () => {notImplemented(this);},
   edgeRing2: () => {notImplemented(this);},
   edgeRing3: () => {notImplemented(this);},
   edgeRingN: () => {notImplemented(this);},
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
   bodyRotateMenu: () => {notImplemented(this);},
   bodyRotateX: () => {notImplemented(this);},
   bodyRotateY: () => {notImplemented(this);},
   bodyRotateZ: () => {notImplemented(this);},
   bodyRotateFree: () => {notImplemented(this);},
   bodyInvert: () => {notImplemented(this);},
   bodyCombine: () => {notImplemented(this);},
   bodySeparate: () => {notImplemented(this);},
   bodyFlipMenu: () => {notImplemented(this);},
   bodyFlipX: () => {notImplemented(this);},
   bodyFlipY: () => {notImplemented(this);},
   bodyFlipZ: () => {notImplemented(this);},
   bodyScaleUniform: ()=> {notImplemented(this);},
   bodyScaleAxis: ()=> {notImplemented(this);},
   bodyScaleAxisX: ()=> {notImplemented(this);},
   bodyScaleAxisY: ()=> {notImplemented(this);},
   bodyScaleAxisZ: ()=> {notImplemented(this);},
   bodyScaleRadial: ()=> {notImplemented(this);},
   bodyScaleRadialX: ()=> {notImplemented(this);},
   bodyScaleRadialY: ()=> {notImplemented(this);},
   bodyScaleRadialZ: ()=> {notImplemented(this);},
   bodyPlaneCut: ()=> {notImplemented(this);},
   bodyPlaneCutX: ()=> {notImplemented(this);},
   bodyPlaneCutY: ()=> {notImplemented(this);},
   bodyPlaneCutZ: ()=> {notImplemented(this);},
   bodySlice: () => {notImplemented(this);},
   bodySliceX: () => {notImplemented(this);},
   bodySliceY: () => {notImplemented(this);},
   bodySliceZ: () => {notImplemented(this);},
   bodyWeld: () => {notImplemented(this);},
   // edge
   cutMenu: () => {notImplemented(this);},
   cutLine2: () => {notImplemented(this);},
   cutLine3: () => {notImplemented(this);},
   cutLine4: () => {notImplemented(this);},
   cutLine5: () => {notImplemented(this);},
   cutLine10: () => {notImplemented(this);},
   cutAsk: () => {notImplemented(this);},
   cutAndConnect: () =>{notImplemented(this);},
   edgeBevel: () =>{notImplemented(this);},
   edgeDissolve: () =>{notImplemented(this);},
   edgeCollapse: () =>{notImplemented(this);},
   edgeMoveMenu: () => {notImplemented(this);},
   edgeMoveX: () => {notImplemented(this);},
   edgeMoveY: () => {notImplemented(this);},
   edgeMoveZ: () => {notImplemented(this);},
   edgeMoveFree: () => {notImplemented(this);},
   edgeMoveNormal: () => {notImplemented(this);},
   edgeRotateMenu: () => {notImplemented(this);},
   edgeRotateX: () => {notImplemented(this);},
   edgeRotateY: () => {notImplemented(this);},
   edgeRotateZ: () => {notImplemented(this);},
   edgeRotateFree: () => {notImplemented(this);},
   edgeExtrudeMenu: () =>{notImplemented(this);}, // submenu
   edgeExtrudeNormal: () =>{notImplemented(this);},
   edgeExtrudeFree: () =>{notImplemented(this);},
   edgeExtrudeX: () =>{notImplemented(this);},
   edgeExtrudeY: () =>{notImplemented(this);},
   edgeExtrudeZ: () =>{notImplemented(this);},
   edgeCrease: () =>{notImplemented(this);},
   edgeLoopCut: () =>{notImplemented(this);},
   edgeCorner: () =>{notImplemented(this);},
   edgeSlide: () =>{notImplemented(this);},
   edgeFlatten: ()=> {notImplemented(this);},
   edgeFlattenX: ()=> {notImplemented(this);},
   edgeFlattenY: ()=> {notImplemented(this);},
   edgeFlattenZ: ()=> {notImplemented(this);},
   edgeScaleUniform: ()=> {notImplemented(this);},
   edgeScaleAxis: ()=> {notImplemented(this);},
   edgeScaleAxisX: ()=> {notImplemented(this);},
   edgeScaleAxisY: ()=> {notImplemented(this);},
   edgeScaleAxisZ: ()=> {notImplemented(this);},
   edgeScaleRadial: ()=> {notImplemented(this);},
   edgeScaleRadialX: ()=> {notImplemented(this);},
   edgeScaleRadialY: ()=> {notImplemented(this);},
   edgeScaleRadialZ: ()=> {notImplemented(this);},
   edgeHardness: ()=> {notImplemented(this);},
   edgeSoft: ()=> {notImplemented(this);},
   edgeHard: ()=> {notImplemented(this);},
   edgeInvert: ()=> {notImplemented(this);},
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
   faceRotateMenu: () => {notImplemented(this);},
   faceRotateX: () => {notImplemented(this);},
   faceRotateY: () => {notImplemented(this);},
   faceRotateZ: () => {notImplemented(this);},
   faceRotateFree: () => {notImplemented(this);},
   faceScaleUniform: () => {notImplemented(this);},
   faceBridge: () => {notImplemented(this);},
   faceInset: () => {notImplemented(this);},
   faceBevel: () => {notImplemented(this);},
   faceBump: () => {notImplemented(this);},
   faceIntrude: () => {notImplemented(this);},
   facePutOn: () => {notImplemented(this);},
   faceLift: () => {notImplemented(this);},
   faceMirror: () => {notImplemented(this);},
   faceFlatten: () =>  {notImplemented(this);},
   faceFlattenNormal: ()=> {notImplemented(this);},
   faceFlattenX: () => {notImplemented(this);},
   faceFlattenY: () =>  {notImplemented(this);},
   faceFlattenZ: () =>  {notImplemented(this);},
   faceScaleAxis: ()=> {notImplemented(this);},
   faceScaleAxisX: ()=> {notImplemented(this);},
   faceScaleAxisY: ()=> {notImplemented(this);},
   faceScaleAxisZ: ()=> {notImplemented(this);},
   faceScaleRadial: ()=> {notImplemented(this);},
   faceScaleRadialX: ()=> {notImplemented(this);},
   faceScaleRadialY: ()=> {notImplemented(this);},
   faceScaleRadialZ: ()=> {notImplemented(this);},
   facePlaneCut: ()=> {notImplemented(this);},
   facePlaneCutX: ()=> {notImplemented(this);},
   facePlaneCutY: ()=> {notImplemented(this);},
   facePlaneCutZ: ()=> {notImplemented(this);},
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
   vertexRotateMenu: () => {notImplemented(this);},
   vertexRotateX: () => {notImplemented(this);},
   vertexRotateY: () => {notImplemented(this);},
   vertexRotateZ: () => {notImplemented(this);},
   vertexRotateFree: () => {notImplemented(this);},
   vertexBevel: () => {notImplemented(this);},
   vertexExtrudeMenu: () =>{notImplemented(this);}, // submenu
   vertexExtrudeNormal: () =>{notImplemented(this);},
   vertexExtrudeFree: () =>{notImplemented(this);},
   vertexExtrudeX: () =>{notImplemented(this);},
   vertexExtrudeY: () =>{notImplemented(this);},
   vertexExtrudeZ: () =>{notImplemented(this);},
   vertexWeld: () =>{notImplemented(this);},
   vertexFlatten: ()=>  {notImplemented(this);},
   vertexFlattenX: ()=>  {notImplemented(this);},
   vertexFlattenY: ()=>  {notImplemented(this);},
   vertexFlattenZ: ()=>  {notImplemented(this);},
   vertexScaleUniform: ()=> {notImplemented(this);},
   vertexScaleAxis: ()=> {notImplemented(this);},
   vertexScaleAxisX: ()=> {notImplemented(this);},
   vertexScaleAxisY: ()=> {notImplemented(this);},
   vertexScaleAxisZ: ()=> {notImplemented(this);},
   vertexScaleRadial: ()=> {notImplemented(this);},
   vertexScaleRadialX: ()=> {notImplemented(this);},
   vertexScaleRadialY: ()=> {notImplemented(this);},
   vertexScaleRadialZ: ()=> {notImplemented(this);},
   // guide tour
   helpMenu: () => {notImplemented(this);},
   about: () => {notImplemented(this);},
   introduction: () => {notImplemented(this);},
   basicCommands: () => {notImplemented(this);},
   tableTutor: () => {notImplemented(this);},
};
function addActionConstant(id) {
   action[id] = () => {notImplemented(this);}
}

//
// @Params: pathToResource 
//
// code from https://css-tricks.com/using-fetch/
const ezFetch = (function() {
   return function(pathToResource) { 
      return fetch(pathToResource)
      .then(handleResponse)
      // to be supplied by user. -->
      //.then(data => console.log(data))
      //.catch(error => console.log(error));
      // <---
   }
 
 function handleResponse (response) {
   let contentType = response.headers.get('content-type')
   if (contentType.includes('application/json') || contentType.includes('application/jason')) { // tcl wub problems?
     return handleJSONResponse(response)
   } else if (contentType.includes('text/html')) {
     return handleTextResponse(response)
   } else {
     // Other response types as necessary. I haven't found a need for them yet though.
     throw new Error(`Sorry, content-type ${contentType} not supported`)
   }
 }
 
 function handleJSONResponse (response) {
   return response.json()
     .then(json => {
       if (response.ok) {
         return json
       } else {
         return Promise.reject(Object.assign({}, json, {
           status: response.status,
           statusText: response.statusText
         }))
       }
     })
 }
 function handleTextResponse (response) {
   return response.text()
     .then(text => {
       if (response.ok) {
         return json
       } else {
         return Promise.reject({
           status: response.status,
           statusText: response.statusText,
           err: text
         })
       }
     })
 }
}());




/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "prop", function() { return prop; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "theme", function() { return theme; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draftBench", function() { return draftBench; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toggleVertexMode", function() { return toggleVertexMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toggleFaceMode", function() { return toggleFaceMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toggleEdgeMode", function() { return toggleEdgeMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toggleBodyMode", function() { return toggleBodyMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toggleMultiMode", function() { return toggleMultiMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restoreVertexMode", function() { return restoreVertexMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restoreFaceMode", function() { return restoreFaceMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restoreEdgeMode", function() { return restoreEdgeMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restoreBodyMode", function() { return restoreBodyMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restoreMultiMode", function() { return restoreMultiMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "currentMode", function() { return currentMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "putIntoWorld", function() { return putIntoWorld; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addToWorld", function() { return addToWorld; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeFromWorld", function() { return removeFromWorld; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getWorld", function() { return getWorld; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateWorld", function() { return updateWorld; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "makeCombineIntoWorld", function() { return makeCombineIntoWorld; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setObject", function() { return setObject; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "attachHandlerMouseMove", function() { return attachHandlerMouseMove; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "attachHandlerMouseSelect", function() { return attachHandlerMouseSelect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "doCommand", function() { return doCommand; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "redoEdit", function() { return redoEdit; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "undoEdit", function() { return undoEdit; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "undoQueue", function() { return undoQueue; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "undoQueueCombo", function() { return undoQueueCombo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadMatrices", function() { return loadMatrices; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "projection", function() { return projection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "modelView", function() { return modelView; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawWorld", function() { return drawWorld; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "render", function() { return render; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_render__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__plugins_wavefront_obj__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_undo__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__wings3d_facemads__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__wings3d_edgemads__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__wings3d_vertexmads__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__wings3d_bodymads__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__wings3d_multimads__ = __webpack_require__(22);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__wings3d_model__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__wings3d_draftbench__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__wings3d_boundingvolume__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__wings3d_hotkey__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_16__wings3d_util__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_17__wings3d_uitree__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_18__wings3d_mads__ = __webpack_require__(8);
/*
//     This module implements most of the commands in the View menu. 
//
// Original Erlang Version: Bjorn Gustavsson
*/






















// 
// pref and theme
//
// init Prop
const prop = {
      showEdges: true,
      showBackfaces: true,
      showNormals: false,
      showBB: true,
      showBBCenter: true,
      showColors: true,
      showMaterials: true,
      showTextures: true,
      showNormalMaps: true,
      showWireBackfaces: false,
      showGroundplane: true,
      showCamImagePlane: false,
      showAxes: true,
      infoVerbose: false,
      constrainAxes: true,
      clipPlane: false,
      orthogonalView: false,
      filterTexture: true,
      frameDisregardsMirror: false,
      useSceneLights: false,
      forceOrthoAlongAxis: false,
      workmode: true,
      //wireFramedObjects: gb_sets:empty(),
      //currentView: DEFAULT_VIEW,   // goes to camera
      allowRotation: true,
      allowInfoText: true,
      miniAxis: true
   };
const propExtend = {
   numberOfLights: 1,
   activeShader: 1,
};
const theme = {
       activeVectorColor: [0.0, 1.0, 0.0],
       clipPlaneColor: [0.8, 0.3, 0.0],
       defaultAxis: [[0.0, 0.0, 0.0], [1.0, 0.0, 0.0]],
       gridColor: '#4D4D4D',
       
       draftBench: {
         edgeColor: '#000000',
         hardEdgeColor: '#FF8000',
         selectedColor: '#A60000',
         selectedHilite: '#B3B300',
         unselectedHilite: '#00A600',
         vertexColor: '#000000',
         //maskedVertexColor: '#80FF00', // alpha #0.8,
         faceColor: '#C9CFB1',   // materialDefault
         sculptMagnetColor: '#0000FF',  // alpha #0.1
         tweakMagnetColor: '#0000FF',  // alpha #0.06
         tweakVectorColor: '#FF8000',
       },

       draftBenchPref: {
         vertexSize: 4.0,
         selectedVertexSize: 5.0,
         maskedVertexSize: 8.0,
         edgeWidth: 2.0,
         selectedEdgeWidth: 2.0,
         hardEdgeWidth: 2.0,
       },

       normalVectorColor: [0.0, 1.0, 0.0],
       colorX: '#B3001A',
       colorY: '#5FD100',
       colorZ: '#004DCC',
       negColorX: '#CCCCCC',
       negColorY: '#CCCCCC',
       negColorZ: '#CCCCCC',
       // UserInterface'
       geometryBackground: '#CCCCCC',
       css: {
         menubarBackground: '#3C3B37',
         menubarText: '#FFFFFF',
         menuBackground: '#3C3B37',
         menuText: '#FFFFFF',
         menuHighlight: '#F07746',
         menuHighlightText: '#FFFFFF',
         infoLineBackground: '#F2F1F0',
         infoLineText: '#4C4C4C',
         infoBackground: '#6161617F',
         infoText: '#FFFFFF',
       },
   };
const themeAlpha = {
   geometryBackground: 'FF',
   infoBackground: '7F',
};
/*const getThemeProp = (path) => (
   path.split('.').reduce((acc, part) => acc && acc[part], theme)
);*/
function traverse(obj, loadStore) {
   Object.entries(obj).forEach(([key, value]) => {
      if ((typeof value === "object") && !Array.isArray(value)) {
         traverse(value, loadStore);
      } else {
         loadStore(obj, key, value);
      }
    });
}
function loadPref(form) {
   traverse(theme, (_obj, key, value)=> {
      let data = form.querySelector(`input[type=color][name=${key}]`);
      if (data) {
         if (value.length === 9) {  // no support of #rrggbbaa yet, for colorpicker.
            data.value = value.slice(0, 7);
         } else {
            data.value = value;
         }
      }
      data = form.querySelector(`input[type=number][name=${key}]`);
      if (data) {
         data.value = value;
      }    
    });
   // load prop
   traverse(prop, (_obj, key, value)=> {
      const data = form.querySelector(`input[type=checkbox][name=${key}]`);
      if (data) {
         data.checked = value;
      }
    });
   // load pref
   traverse(prop, (_obj, key, value)=> {

    });
};
function storePref(form) {
   traverse(theme, (obj, key, _value) => {
      let data = form.querySelector(`input[type=color][name=${key}]`);
      if (data) {
         obj[key] = themeAlpha[key] ? (data.value + themeAlpha[key]) : data.value;
      }
      data = form.querySelector(`input[type=number][name=${key}]`);
      if (data) {
         obj[key] = data.value;
      }
    });
   // now update css variable.
   const root = document.documentElement;
   Object.entries(theme.css).forEach(([key, value]) => {
      // put the css to styleSheet
      if (value.length === 7) {
         root.style.setProperty(`--${key}`, value);
      } else if (value.length === 9) {
         root.style.setProperty(`--${key}`, __WEBPACK_IMPORTED_MODULE_16__wings3d_util__["hexToCssRGBA"](value));
      }
    });
   // store draftBench
   draftBench.setTheme(theme.draftBench, theme.draftBenchPref);
   // store prop
   traverse(prop, (obj, key, _value)=> {
      const data = form.querySelector(`input[type=checkbox][name=${key}]`);
      if (data) {
         obj[key] = data.checked;
      }
    });
    __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
};

//--  end of pref and theme --------------------------------------------------------------------------

// 
// editing mode management
//
const mode = {             // private variable, needed to initialize after gl, 
   face: null,//new FaceMadsor, 
   edge: null,//new EdgeMadsor,
   vertex: null,//new VertexMadsor,
   body: null,//new BodyMadsor,
   multi: null,//new Multimode
   current: null,
};
function initMode() {
   mode.face = new __WEBPACK_IMPORTED_MODULE_7__wings3d_facemads__["FaceMadsor"];
   mode.edge = new __WEBPACK_IMPORTED_MODULE_8__wings3d_edgemads__["EdgeMadsor"];
   mode.vertex = new __WEBPACK_IMPORTED_MODULE_9__wings3d_vertexmads__["VertexMadsor"];
   mode.body = new __WEBPACK_IMPORTED_MODULE_10__wings3d_bodymads__["BodyMadsor"];
   mode.multi = new __WEBPACK_IMPORTED_MODULE_11__wings3d_multimads__["MultiMadsor"];
   mode.current = mode.multi;
};


function toggleMode(mode) {
   let button = document.getElementById('toggle'+mode+'Mode');  // :checked property only existed on <input>
   if (button && !button.checked) {
      button.click();         // https://stackoverflow.com/questions/8206565/check-uncheck-checkbox-with-javascript
   }
}
function isMultiMode() {
   return mode.current === mode.multi;
};
function toggleVertexMode() {
   // change current mode to 
   if (mode.current !== mode.vertex) {
      mode.current.toggleFunc(mode.vertex);
      mode.current = mode.vertex;
      toggleMode('Vertex');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};

function toggleFaceMode() {
   if (mode.current !== mode.face) {
      mode.current.toggleFunc(mode.face);
      mode.current = mode.face;
      toggleMode('Face');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};

function toggleEdgeMode() {
   if (mode.current !== mode.edge) {
      mode.current.toggleFunc(mode.edge);
      mode.current = mode.edge;
      toggleMode('Edge');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};

function toggleBodyMode() {
   if (mode.current !== mode.body) {
      mode.current.toggleFunc(mode.body);
      mode.current = mode.body;
      toggleMode('Body');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};

function toggleMultiMode() {
   if (mode.current !== mode.multi) {
      mode.current.toggleFunc(mode.multi);
      mode.current = mode.multi;
      toggleMode('Multi');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};

function restoreVertexMode(snapshots) {
   if (mode.current !== mode.vertex) {
      mode.current.restoreMode(mode.vertex, snapshots);
      mode.current = mode.vertex;
      toggleMode('Vertex');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   } else {
      // bad state. should always be in other mode. 
   }
};

function restoreFaceMode(snapshots) {
   if (mode.current !== mode.face) {
      mode.current.restoreMode(mode.face, snapshots);
      mode.current = mode.face;
      toggleMode('Face');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   } else {
      // bad state. should always be in other mode. 
   }
};

function restoreEdgeMode(snapshots) {
   if (mode.current !== mode.edge) {
      mode.current.restoreMode(mode.edge, snapshots);
      mode.current = mode.edge;
      toggleMode('Edge');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   } else {
      // bad state. should always be in other mode. 
   }
};

function restoreBodyMode(snapshots) {
   if (mode.current !== mode.body) {
      mode.current.restoreMode(mode.body, snapshots);
      mode.current = mode.body;
      toggleMode('Body');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   } else {
      // bad state. should always be in other mode. 
   }
};

function restoreMultiMode(snapshots) {
   if (mode.current !== mode.multi) {
      mode.current.restoreMode(mode.multi, snapshots);
      mode.current = mode.multi;
      toggleMode('Multi');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   } else {
      // bad state. should always be in other mode. 
   }
};

const currentMode = () => mode.current;
//- End of editing Mode ----------

//
// world objects management
//
const world = [];    // private var
let draftBench;      // = new DraftBench; wait for GL
let geometryGraph;   // tree management of world; 
let currentObjects;
function putIntoWorld() {
   let model = new __WEBPACK_IMPORTED_MODULE_12__wings3d_model__["PreviewCage"](draftBench);
   return addToWorld(model);
};

function addToWorld(model) {
   world.push( model );
   model.setVisible(true);
   draftBench.updatePreview();
   __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   // update geometryGraph
   geometryGraph.addObject(model);
   return model;
}

function removeFromWorld(previewCage) {
   var index = world.indexOf(previewCage);
   if (index >= 0) {
      world.splice(index, 1);
      previewCage.setVisible(false);
      draftBench.updatePreview();
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
      // remove from geometryGraph
      geometryGraph.removeObject(previewCage);
   }
};
function getWorld() {
   return world;
}
function updateWorld() {
   draftBench.updatePreview();
   __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
};
function makeCombineIntoWorld(cageSelection) {
   let combine = new __WEBPACK_IMPORTED_MODULE_12__wings3d_model__["PreviewCage"](draftBench);
   for (let cage of cageSelection) {
      removeFromWorld(cage);
   }
   combine.merge(cageSelection);
   addToWorld(combine);
   return combine;
}
function setObject(objects) { // objects is array
   currentObjects = objects;
}
//-- End of World objects management ----------------dra---------

//
// mouse handling hilite
//
const hilite = {cage: null, edge: null, vertex: null, face: null, plane: null};
let currentCage;
const handler = {camera: null, mousemove: null, mouseSelect: null};
const planeRect = {center: vec3.create(), halfSize: vec3.create(), normal: vec3.create(), hilite: false};


const isVertexSelectable = () => handler.mouseSelect ? handler.mouseSelect.isVertexSelectable() : (mode.current ? mode.current.isVertexSelectable() : true);
const isEdgeSelectable = () => handler.mouseSelect ? handler.mouseSelect.isEdgeSelectable() : (mode.current ? mode.current.isEdgeSelectable() : true);
const isFaceSelectable = () => handler.mouseSelect ? handler.mouseSelect.isFaceSelectable() : (mode.current ? mode.current.isFaceSelectable() : true);
const isPlaneShown = ()=> handler.mouseSelect ? handler.mouseSelect.getPlaneNormal() : false;

function setCurrent(edge, intersect, center) {
   // find out origin, dest. which is closer.
   let hiliteVertex = null, hiliteEdge = null, hiliteFace = null, hiliteCage = null;
   hilite.plane = null;
   if (edge !== null) {
      const a = vec3.create(), b = vec3.create(), c = vec3.create();
      const destination = edge.destination().vertex; // find out if we are within the distance threshold
      const origin = edge.origin.vertex;
      vec3.sub(a, intersect, origin);
      vec3.sub(b, intersect, destination);
      vec3.sub(c, destination, origin);
      const dist0 = vec3.length(a);
      const dist1 = vec3.length(b);
      const dist2 = vec3.length(c);
      const threshold = dist2 / 4.0;
      const isVertex = isVertexSelectable();
      const isEdge = isEdgeSelectable();
      const isFace = isFaceSelectable();
      const isPlane = isPlaneShown();
      const sphere = draftBench.boundingSpheres[edge.face.index];
      if (isPlane) {
         vec3.copy(planeRect.halfSize, sphere.getBVHRoot().getHalfSize());
         vec3.copy(planeRect.normal, handler.mouseSelect.getPlaneNormal());
      }
      if (isVertex) {
         if (dist0 < dist1) {
            if (!(isEdge || isFace) || (dist0 < threshold)) {  // only multiple selectable needs to check threshold
               hiliteVertex = edge.origin;
            }
         } else {
            if (!(isEdge || isFace) || (dist1 < threshold)) {
               hiliteVertex = edge.destination();
            }
         }
         if (hiliteVertex && isPlane) {
            vec3.copy(planeRect.center, hiliteVertex.vertex);
            hilite.plane = planeRect;
         }
      }
      if (isEdge && (hiliteVertex === null)) { // check out if edge is close enough
         vec3.cross(a, a, b);
         vec3.sub(b, destination, origin);
         const distance = vec3.length(a) / dist2;
         if (!(isVertex || isFace) || (distance < threshold)) {
            hiliteEdge = edge;
            if (isPlane) {
               vec3.add(planeRect.center, hiliteEdge.origin.vertex, hiliteEdge.destination().vertex);
               vec3.scale(planeRect.center, planeRect.center, 0.5);
               hilite.plane = planeRect;
            }
         }
      }
      if (isFace && (hiliteVertex === null) && (hiliteEdge === null)) {   // now hilite face
         hiliteFace = edge.face;
         if (isPlane) {
            vec3.copy(planeRect.center, sphere.center);
            hilite.plane = planeRect;
         }
      }
      if (!(isVertex || isEdge || isFace)) {    // all 3 mode not true then only bodyMode possible.
         hiliteCage = currentCage;
      }
   }
   // now do hilite.
   if (hiliteVertex !== hilite.vertex) {  
      if (hilite.vertex !== null) {
         draftBench.hiliteVertex(hilite.vertex, false);
      }
      if (hiliteVertex !== null) {
         if (handler.mouseSelect && !handler.mouseSelect.hilite( {vertex: hiliteVertex, plane: hilite.plane}, currentCage)) {
            hiliteVertex = null;
         } else {
            draftBench.hiliteVertex(hiliteVertex, true);
         }
      }
      hilite.vertex = hiliteVertex;
   }
   if (hiliteEdge !== hilite.edge) {
      if (hilite.edge !== null) {
         draftBench.hiliteEdge(hilite.edge, false);
      }
      if (hiliteEdge !== null) {
         if (handler.mouseSelect && !handler.mouseSelect.hilite( {edge: hiliteEdge, plane: hilite.plane}, currentCage)) {
            hiliteEdge = null;
         } else {
            draftBench.hiliteEdge(hiliteEdge, true);
         }
      }
      hilite.edge = hiliteEdge;
   }
   if (hiliteFace !== hilite.face) {
      if (hilite.face !== null) {
         draftBench.hiliteFace(hilite.face, false); // hiliteFace(null, false)?
      }
      if (hiliteFace !== null) {
         if (handler.mouseSelect && !handler.mouseSelect.hilite( {face: hiliteFace, plane: hilite.plane}, currentCage)) {
            hiliteFace = null;
         } else {
            draftBench.hiliteFace(hiliteFace, true);
         }
      }
      hilite.face = hiliteFace;
   }
   if (hiliteCage !== hilite.cage) {
      if (hilite.cage !== null) {
         hilite.cage.hiliteBody(false);
      }
      if (hiliteCage) {
         hiliteCage.hiliteBody(true);
      }
      hilite.cage = hiliteCage;
   }
   if (!(hilite.vertex || hilite.edge || hilite.face)) {
      hilite.plane = null;
   }
}


//
// mouse handling
//
let lastPick = null;

function rayPick(ray) {
   let pick = null;
   for (let model of world) {
      if (!model.isLock() && model.isVisible()) {
         const newPick = model.rayPick(ray);
         if (newPick !== null) {
            if ((pick === null) || (pick.t > newPick.t)) {
               pick = newPick;
            }
         }
      }
   }
   if (pick !== null) {
      currentCage = pick.model;
      //if (lastPick !== null && lastPick.model !== pick.model) {
      //   lastPick.model.setCurrentSelect(null);
      //}
      // now set current edge again.
      lastPick = pick;
      let intersect = vec3.create();
      vec3.scaleAndAdd(intersect, ray.origin, ray.direction, pick.t);
      setCurrent(pick.edge, intersect, pick.center);
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   } else {
      if (lastPick !== null) {
         // deselect last selection
         setCurrent(null);
         __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
      }
   }
   // now the currentPick will be the next lastPick.
   lastPick = pick;
};

let dragMode = null;
function selectStart() {
   if (lastPick !== null) {   
      // first check if we needs to autoToggle
      mode.current.toggleMulti(hilite);
      // now we can safely dragStart
      dragMode = mode.current.selectStart(lastPick.model, hilite);
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};

function selectDrag() {
   if ((dragMode !== null)) {// &&
       if ((lastPick !== null)) {
         dragMode.dragSelect(lastPick.model, hilite);
         __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
      }
   }
}

function selectFinish() {
   if (dragMode !== null) {
      undoQueue(dragMode.finish());
      dragMode = null;
   }
}

function canvasHandleMouseDown(ev) {
   if (ev.button == 0) {
      if (handler.camera !== null) {
         handler.camera.doIt();  
         handler.camera = null;
         __WEBPACK_IMPORTED_MODULE_5__wings3d__["log"](__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].cameraModeExit, __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"]);
         help('L:Select   M:Start Camera   R:Show Menu   [Alt]+R:Tweak menu');      
      } else if (handler.mousemove !== null) {
         undoQueue( handler.mousemove );  // put on queue, commit()?
         handler.mousemove = null;
      } else if (handler.mouseSelect !== null) {
         if (handler.mouseSelect.select(hilite)) {
            if (handler.mouseSelect.isMoveable()) {   // now do mousemove.
               // handler.mousemove must be null.
               handler.mousemove = handler.mouseSelect;
            } else {
               undoQueue( handler.mouseSelect );
            }
            handler.mouseSelect = null;
         }
      } else {
         //e.stopImmediatePropagation();
         // ask view to select current hilite if any.
         selectStart();
      }
   }
};

function canvasHandleMouseEnter(ev) {
   if (handler.camera !== null) {
      help('L:Accept   M:Drag to Pan  R:Cancel/Restore to View   Move mouse to tumble');
   } else {
      help('L:Select   M:Start Camera   R:Show Menu   [Alt]+R:Tweak menu');
   }
};

function canvasHandleMouseLeave(ev) {
   selectFinish();       // we can't caputre mouseup when mouse leave, so force to finish the selection.
};

// event handling, switching state if needs to be
function canvasHandleMouseUp(ev) {
   if (ev.button == 0) {
      selectFinish();
   } else if (ev.button == 1) { // check for middle button down
      if (handler.camera === null) {
         ev.stopImmediatePropagation();
         // let camera handle the mouse event until it quit.
         handler.camera = __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["getMouseMoveHandler"]();
         // tell tutor step, we are in camera mode
         __WEBPACK_IMPORTED_MODULE_5__wings3d__["log"](__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].cameraModeEnter, __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"]);
         help('L:Accept   M:Drag to Pan  R:Cancel/Restore to View   Move mouse to tumble');
         // disable mouse cursor
         //document.body.style.cursor = 'none';
      } 
   }
};

function canvasHandleMouseMove(e) {
   if (handler.camera !== null) {
      handler.camera.handleMouseMove(e);
   } else if (handler.mousemove !== null) {
      handler.mousemove.handleMouseMove(e, __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"]);
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   } else {
      // handle pick selection
      var viewport = __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].getViewport();
      var winx = e.pageX - e.currentTarget.offsetLeft;
      var winy = (viewport[3]+1) - (e.pageY - e.currentTarget.offsetTop);   // y is upside-down
      // yes, sometimes mouse coordinate is outside of the viewport. firefox is larger than width, height.
      if (winx < 0) { winx = 0; }
      if (winx > viewport[2]) { winx = viewport[2];}
      if (winy < 0) { winy = 0; }
      if (winy > viewport[3]) { winy = viewport[3];}

      var mat = loadMatrices(false);
      var ptNear = __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].unProject(winx, winy, 0.0, mat.modelView, mat.projection);
      var ptFar = __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].unProject(winx, winy, 1.0, mat.modelView, mat.projection);

      vec3.sub(ptFar, ptFar, ptNear);
      vec3.normalize(ptFar, ptFar);
      const ray = new __WEBPACK_IMPORTED_MODULE_14__wings3d_boundingvolume__["Ray"](ptNear, ptFar);
      //geometryStatus("mouse position: " + ptNear[0] + ", " + ptNear[1] + "," + ptNear[2] + ", <br />"+ ptFar[0] + ", " + ptFar[1] + ", " + ptFar[2]);
      rayPick(ray);
      // selectDrag if left button mousedown
      selectDrag();
   }
};

// contextMenu, mouse right click.
function canvasHandleContextMenu(ev) {
   if (handler.camera || handler.mousemove || handler.mouseSelect) {
      // prevent propagation.
      ev.preventDefault();
      ev.stopImmediatePropagation();      // prevent document's contextmenu popup
      if (handler.camera) {
         handler.camera.undo();
         handler.camera = null;
         __WEBPACK_IMPORTED_MODULE_5__wings3d__["log"](__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].cameraModeExit, __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"]);   // log action
         help('L:Select   M:Start Camera   R:Show Menu   [Alt]+R:Tweak menu');
      } else if (handler.mousemove) {
         handler.mousemove.undo();
         handler.mousemove = null;
         __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
      } else {
         handler.mouseSelect = null;   // no needs to undo because we havent doIt() yet.
         __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
      }
      return true;
   }
   // let wings3d_contextmenu handle the event.
   return false;
};

// handling in reverse order. the newest one will handle the event. (should be at most 2 handler)
function attachHandlerMouseMove(mousemoveHandler) {
   // should we make sure handler.mousemove is null?
   handler.mousemove = mousemoveHandler;
};
function attachHandlerMouseSelect(mouseSelectHandler) {
   handler.mouseSelect = mouseSelectHandler;
};

function canvasHandleWheel(e) {
   // adjusting to scroll pixels, inspiration from facebook's estimate.
   var px = e.deltaX, py = e.deltaY, pz = e.deltaZ;
   if ((px || py || pz) && e.deltaMode) {
      var scale = 360;        // page scaler
      if (e.deltaMode == 1) {
         scale = 18;          // line scaler, should be line height
      }
      px *= scale;
      py *= scale;
      pz *= scale;
   }
   
   // asks camera to zoomIn/Out.
   __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["zoomStep"](py);
};

//-- end of mouse handling-----------------------------------------------

// 
// undo/redo handling
//
const undo = {queue: [], current: -1};
// undo queueCombo, convenient functions
function undoQueueCombo(editCommands) {
   // wrap the array in a combo
   const combo = new __WEBPACK_IMPORTED_MODULE_6__wings3d_undo__["EditCommandCombo"](editCommands);
   undoQueue( combo );
};
// undo queue
function undoQueue(editCommand) {
   //if (!editCommand.doIt()) {  // move all check here.
   //   return;
   //}
   // editCommand = new CheckPoint(draftBench, editCommand);      // debug purpose. 

   while ( (undo.queue.length-1) > undo.current ) {
      // remove branch not taken
      const cmd = undo.queue.pop();
      cmd.free();
   }
   // now push the new command back
   undo.queue.push(editCommand);
   undo.current++;
   __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
};

function redoEdit() {
   if ( (undo.queue.length-1) > undo.current) {
      undo.queue[++undo.current].doIt(mode.current);
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};

function undoEdit() {
   if (undo.current >= 0) {
      const cmd = undo.queue[undo.current--];
      cmd.undo(mode.current);
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};

function doCommand(command) {
   if (command.doIt()) {
      undoQueue(command);
      return true;
   } else {
      // todo: pop messages, said command not workable.
      return false;
   }
}

// -- end of undo/redo handling ----------------------------------------------------------------------------------


//
// world rendering and utility functions
//
function loadMatrices(includeLights) {
   let proj = projection(mat4.create()); // passed identity matrix.
   let tmm = modelView(includeLights);
   return { projection: proj, modelView: tmm.modelView, useSceneLights: tmm.useSceneLights };
};

//projection() ->
//     OP0 = gl:getDoublev(?GL_PROJECTION_MATRIX),
//     projection(e3d_transform:init(list_to_tuple(OP0))).
function projection(In) {
   const size = __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].getViewport();
   const aspect = (size[2]-size[0]) / (size[3]-size[1]);
   const view = __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"];
   const ortho = prop.orthogonalView;
   if (!ortho && view.alongAxis) {
      ortho = prop.force_ortho_along_axis;
   }
   var tp = mat4.create();
   if (ortho) {
      const sz = view.distance * Math.tan(view.fov * Math.PI  / 180 / 2);
      mat4.ortho(tp, -sz * aspect, sz * aspect, -sz, sz, view.zNear, view.zFar);      
   } else {
      mat4.perspective(tp, view.fov, aspect, view.zNear, view.zFar);
   }

   mat4.mul(__WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].projection, In, tp);
   return __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].projection;
};

function modelView(includeLights = false) {
   const view = __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"];

   let useSceneLights = false;
   if (includeLights) {
      useSceneLights = prop.useSceneLights; // && Wings3D.light.anyEnabledLights();
      if (!useSceneLights) {
         //Wings3D.light.cameraLights();
      }
   }

   // fromTranslation, identity * vec3. modelView rest.
   mat4.fromTranslation(__WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].modelView, vec3.fromValues(view.panX, view.panY, -view.distance));
   mat4.rotateX(__WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].modelView, __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].modelView, view.elevation * Math.PI / 180);
   mat4.rotateY(__WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].modelView, __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].modelView, view.azimuth * Math.PI / 180);
   mat4.translate(__WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].modelView, __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].modelView, view.origin);

   if (useSceneLights) {
      //Wings3D.light.globalLights();
   }
   return {useScentLights: useSceneLights, modelView: __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].modelView};
};

function drawWorld(gl) {
   if (world.length > 0) {
      // update selectStatus
      for (let model of world) {
         model.updateStatus();
      }

      //gl.enable(gl.BLEND);
      //gl.blendFunc(gl.SRC_COLOR, gl.DST_COLOR);
      // draw Current Select Mode (vertex, edge, or face)
      //if (hilite.vertex || hilite.edge || hilite.face || hilite.cage) {
         mode.current.drawExtra(gl, draftBench);
      //}
      // hack -- draw other hilite selection if any, really should move to multimode
      if (hilite.vertex && (mode.current !== mode.vertex)) {
         mode.vertex.drawExtra(gl, draftBench);
      }
      if (hilite.edge && (mode.current !== mode.edge)) {
         mode.edge.drawExtra(gl, draftBench);
      }
      if (hilite.face && (mode.current !== mode.face)) {
         mode.face.drawExtra(gl, draftBench);
      }
      // hack - draw plane
      if (hilite.plane) {
         draftBench.drawPlane(gl, hilite.plane);
      }
      // end of hack ----
      //gl.disable(gl.BLEND);

      // draw all other edge (extra, hardEdge, wireframeEdge) if applicable
      draftBench.drawHardEdgeEtc(gl, mode.current === mode.edge, mode.current);

      //gl.polygonOffset(1.0, 1.0);          // Set the polygon offset
      //gl.enable(gl.POLYGON_OFFSET_FILL);
      mode.current.previewShader(gl);
      //world.forEach(function(model, _index, _array){
         gl.bindTransform();
         draftBench.draw(gl, mode.current);
      //});
      gl.disableShader();
      //gl.disable(gl.POLYGON_OFFSET_FILL);
   }
}

function render(gl) {
   __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["render"](gl, drawWorld);
};

//-- end of world rendering and utility functions ---------------------------------------------------------------

//
// initialization
//
function init() {
   initMode();
   // init menu
   const selectionMenu = [ {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].deselect, fn: 'resetSelection', hotKey: ' '},
                         {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].more, fn: 'moreSelection', hotKey: '+'},
                         {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].less, fn: 'lessSelection', hotKey: '-'},
                         {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].similar, fn: 'similarSelection', hotkey: 'i'},
                         {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].all, fn: 'allSelection', hotKey: 'a', meta: 'ctrl'}, 
                         {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].invert, fn: 'invertSelection', hotKey: 'i', meta: 'ctrl+shift'},
                         {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].adjacent, fn: 'adjacentSelection'}
                        ];
   for (let select of selectionMenu) {
      __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["bindMenuItem"](select.id.name, function(ev) {
         const command = new __WEBPACK_IMPORTED_MODULE_6__wings3d_undo__["EditCommandSimple"](select.fn);
         if(command.doIt(mode.current)) {
            undoQueue( command );
         }
      }, select.hotKey, select.meta);
   }

   // toggle sidebar
   __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].openSidebar.name, (ev) => {
      const sidebar = document.querySelector('#sidebar');
      const toggle = document.querySelector('#openSidebarFor');
      if (sidebar && toggle) {
         if (toggle.checked) {
            sidebar.style.display = "none";
         } else {
            sidebar.style.display = "flex";
         }
      }
    });
   const toolBar = [ {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].undoEdit, fn: undoEdit, hotKey: ' '},
                     {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].redoEdit, fn: redoEdit, hotKey: ' '},
                     {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].toggleVertexMode, fn: toggleVertexMode, hotKey: ' '},
                     {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].toggleEdgeMode, fn: toggleEdgeMode, hotKey: ' '},
                     {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].toggleFaceMode, fn: toggleFaceMode, hotKey: ' '},
                     {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].toggleBodyMode, fn: toggleBodyMode, hotKey: ' '},
                     {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].toggleMultiMode, fn: toggleMultiMode, hotkey: ' '},
                   ];
   // bindMenu toolbar
   for (let button of toolBar) {
      __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["bindMenuItem"](button.id.name, function(ev) {
         //ev.preventDefault();
         help( "wings3d - " + ev.currentTarget.id);
         button.fn();
       });
   }
   const propBar = [{id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].toggleGround, propName: 'showGroundplane', selector: '#toggleGroundFor'},
                    {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].toggleAxes, propName: 'showAxes', selector: '#toggleAxesFor'},
                    {id: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].toggleOrtho, propName: 'orthogonalView', selector: '#toggleOrthoFor'}];
   for (let button of propBar) {
      // bind showGrid/showAxes/persp-ortho button
      __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["bindMenuItem"](button.id.name, (_ev)=> {
         const data = document.querySelector(button.selector);
         if (data) {
            prop[button.propName] = !data.checked;  // click event is earlier than input.checked event, so the value hasn't toggle yet.
            __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
         }
       });
   }
   // bind pref button
   __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].preferenceButton.name, (_ev)=>{
      __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["runDialogCenter"]('#preferenceForm', storePref, loadPref);
    });

   // bind createMaterial button.

   // bind geometryGraph
   geometryGraph = __WEBPACK_IMPORTED_MODULE_17__wings3d_uitree__["getTreeView"]('#objectList');
   // selectObject
   __WEBPACK_IMPORTED_MODULE_5__wings3d__["bindAction"](null, 0, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].toggleObjectSelect.name, (ev) => {
      if (isMultiMode()) {
         toggleFaceMode(); // todo: see if we can capture the toggling cmd.
      }
      const toggle = new __WEBPACK_IMPORTED_MODULE_18__wings3d_mads__["ToggleCheckbox"](ev.target);
      const cmd = new __WEBPACK_IMPORTED_MODULE_18__wings3d_mads__["GenericEditCommand"](currentMode(), currentMode().selectObject, [currentObjects, ev.target], 
                                                        currentMode().undoSelectObject, [ev.target]);
      cmd.doIt();
      undoQueueCombo([toggle, cmd]);
    });
   // hide/show Object
   __WEBPACK_IMPORTED_MODULE_5__wings3d__["bindAction"](null, 0, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].toggleObjectVisibility.name, (ev) => {
      const toggle = new __WEBPACK_IMPORTED_MODULE_18__wings3d_mads__["ToggleCheckbox"](ev.target);
      const cmd = new __WEBPACK_IMPORTED_MODULE_18__wings3d_mads__["GenericEditCommand"](currentMode(), currentMode().toggleObjectVisibility, [currentObjects, ev.target], 
                                                        currentMode().undoObjectVisibility);
      cmd.doIt();
      undoQueueCombo([toggle, cmd]);
    });
   // lock/unlock Object
   __WEBPACK_IMPORTED_MODULE_5__wings3d__["bindAction"](null, 0, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].toggleObjectLock.name, (ev) => {
      const toggle = new __WEBPACK_IMPORTED_MODULE_18__wings3d_mads__["ToggleCheckbox"](ev.target);
      const cmd = new __WEBPACK_IMPORTED_MODULE_18__wings3d_mads__["GenericEditCommand"](currentMode(), currentMode().toggleObjectLock, [currentObjects, ev.target], 
                                                        currentMode().undoToggleObjectLock);
      cmd.doIt();
      undoQueueCombo([toggle, cmd]);
    });
   // toggle wire only mode.
   __WEBPACK_IMPORTED_MODULE_5__wings3d__["bindAction"](null, 0, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].toggleWireMode.name, (ev)=>{
      const toggle = new __WEBPACK_IMPORTED_MODULE_18__wings3d_mads__["ToggleCheckbox"](ev.target);
      const cmd = new __WEBPACK_IMPORTED_MODULE_18__wings3d_mads__["GenericEditCommand"](currentMode(), currentMode().toggleObjectWireMode, [currentObjects, ev.target.checked], 
                                                        currentMode().undoToggleObjectWireMode);
      cmd.doIt();
      undoQueueCombo([toggle, cmd]);
    });
   // objectDelete, gui
   __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].objectDelete.name, (_ev)=>{
      const command = new __WEBPACK_IMPORTED_MODULE_10__wings3d_bodymads__["DeleteBodyCommand"](currentObjects);
      undoQueue( command );
      command.doIt(); // delete current selected.
    });

   // objectDuplicate, gui
   
   // objectRename, gui

   // bind .dropdown, click event.
   let buttons = document.querySelectorAll("li.dropdown > a");
   for (let button of buttons) {
      if (button.id) {
         let ul = button.nextElementSibling;  // popupMenu
         if (ul && ul.classList.contains("popup") && ul.classList.contains("menu")) {
            __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["bindMenuItem"](button.id, function(ev) {
               __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["queuePopupMenu"](ul);  // show popupMenu
             });
         }
      }
   }
   // bind li.dropside > a.
   buttons = document.querySelectorAll("li.dropside > a");
   for (let button of buttons) {
      if (button.id) {
         let ul = button.nextElementSibling;  // popupMenu
         if (ul && ul.classList.contains("popup") && ul.classList.contains("menu")) {
            __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["bindMenuItem"](button.id, function(ev) {
               __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["toggleSubmenu"](ul);  // slide in popup menu, replace the original one
               ev.stopPropagation();
             });
         }
      }
   }


   //Renderer.init(gl, drawWorld);  // init by itself
   draftBench = new __WEBPACK_IMPORTED_MODULE_13__wings3d_draftbench__["DraftBench"](theme.draftBench, theme.draftBenchPref);

   // capture keyevent.
   document.addEventListener('keydown', function(event) {
      //event.preventDefault();
      //event.stopPropagation();
      //      Don't fire in text-accepting inputs that we didn't directly bind to
      __WEBPACK_IMPORTED_MODULE_15__wings3d_hotkey__["runHotkeyAction"](currentMode(), event);
    });

   // capture click mouse event.
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("mouseenter", canvasHandleMouseEnter, false);
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("mousedown", canvasHandleMouseDown, false); 
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("mouseup", canvasHandleMouseUp, false);
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("mouseleave", canvasHandleMouseLeave, false);
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("mousemove", canvasHandleMouseMove, false);
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("wheel", canvasHandleWheel, false);
   // bind context-menu
   let createObjectContextMenu = {menu: document.querySelector('#create-context-menu')};
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("contextmenu", function(e) {
      if(!canvasHandleContextMenu(e)) {
         e.preventDefault();
         let contextMenu = currentMode().getContextMenu();
         if (!contextMenu || !contextMenu.menu) {
            contextMenu = createObjectContextMenu;
         }
         __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["positionDom"](contextMenu.menu, __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["getPosition"](e));
         __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["showContextMenu"](contextMenu.menu);
      }
   }, false);
   //console.log("Workspace init successful");
   let wavefront = new __WEBPACK_IMPORTED_MODULE_4__plugins_wavefront_obj__["a" /* WavefrontObjImportExporter */]();

   // handle redrawingLoop
   function updateFrame(timestamp) {
      render(__WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"]);
      requestAnimationFrame(updateFrame);
   };
   requestAnimationFrame(updateFrame);
};


 

// register for initialization
__WEBPACK_IMPORTED_MODULE_5__wings3d__["onReady"](init);

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "styleSheet", function() { return styleSheet; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getArrow", function() { return getArrow; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "placement", function() { return placement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getPosition", function() { return getPosition; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "positionDom", function() { return positionDom; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addMenuItem", function() { return addMenuItem; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bindMenuItem", function() { return bindMenuItem; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bindMenuItemMMB", function() { return bindMenuItemMMB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bindMenuItemRMB", function() { return bindMenuItemRMB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bindMenuItemMode", function() { return bindMenuItemMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "extractDialogValue", function() { return extractDialogValue; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "runDialog", function() { return runDialog; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "runDialogCenter", function() { return runDialogCenter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "openFile", function() { return openFile; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "showContextMenu", function() { return showContextMenu; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queuePopupMenu", function() { return queuePopupMenu; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toggleSubmenu", function() { return toggleSubmenu; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_hotkey__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d__ = __webpack_require__(0);
/*
   wings3d, ui and ui utility functions. including tutor.

*/




function _bindMenuItem(mode, menuItem, button, id, fn, hotkey, meta) {
   __WEBPACK_IMPORTED_MODULE_1__wings3d__["bindAction"](menuItem, button, id, fn);
   if (hotkey !== undefined) {
      __WEBPACK_IMPORTED_MODULE_0__wings3d_hotkey__["setHotkey"](mode, id, hotkey, meta);
      // now put it on meta
      const data = meta ? `${meta}+${hotkey}` : hotkey;
      menuItem.classList.add("hotkey");
      menuItem.setAttribute("data-hotkey", data.toUpperCase());
   }
}


function bindMenuItem(id, fn, hotkey, meta) {
   const menuItem = document.querySelector('#' + id);
   if (menuItem) {
      _bindMenuItem(null, menuItem, 0, id, fn, hotkey, meta);
   } else {
      console.log("Click: could not find menuItem " + id);
   }
}
function bindMenuItemMMB(id, fn) {
   const menuItem = document.querySelector('#' + id);
   if (menuItem) {
      _bindMenuItem(null, menuItem, 1, id, fn);
   } else {
      console.log("AuxClick: could not find menuItem " + id);
   }
}
function bindMenuItemRMB(id, fn) {
   const menuItem = document.querySelector('#' + id);
   if (menuItem) {
      _bindMenuItem(null, menuItem, 2, id, fn);
   } else {
      console.log("ContextClick: could not find menuItem " + id);
   }
}
function bindMenuItemMode(id, fn, mode, hotkey, meta) {
   const menuItem = document.querySelector('#' + id);
   if (menuItem) {
      _bindMenuItem(mode, menuItem, 0, id, fn, hotkey, meta);
   } else {
      console.log("Click: could not find menuItem " + id);
   }
}



function addMenuItem(menuId, id, menuItemText, fn, hotkey, meta) {
   const menu = document.querySelector('#' + menuId);
   // insert the menuItem 
   const menuItem = document.createElement('li');
   const a = document.createElement('a');
   a.id = id;
   a.textContent = menuItemText;
   // append to submenu
   menuItem.appendChild(a);
   menu.appendChild(menuItem);
   __WEBPACK_IMPORTED_MODULE_1__wings3d__["addActionConstant"](id);
   _bindMenuItem(a, 0, id, fn, hotkey, meta);
}


function getArrow(placement) {
      if (placement === "bottom") {
         return "top";
      } else if (placement === "bottom-start") {
         return "top";
      } else if (placement === "top") {
         return "bottom";
      } else if (placement === "top-start") {
         return "bottom";
      } else if (placement === "left") {
         return "right";
      } else if (placement === "right") {
         return "left";
      }
      return "";
};

// placement.
function placement(targetId, placement, bubble) {
      // get the size of bubble.
      const bubbleRect = bubble.getBoundingClientRect();

      let target;
      let targetRect;
      if (targetId === "") { // no target, then point at the workarea's center
         target = document.getElementById("glcanvas");
         const rect = target.getBoundingClientRect();
         targetRect = {left: Math.round(rect.left+rect.width/2), 
                       top: Math.round(rect.top+rect.height/2), 
                       width: 1, height: 1};
      } else {
         target = document.getElementById(targetId);
         // get the location and size of target
         targetRect = target.getBoundingClientRect();
      }

      let x=targetRect.left - window.scrollX, y=targetRect.top - window.scrollY;
      // now compute the target position.
      if (placement === "bottom") {
         x += Math.round((targetRect.width / 2) - (bubbleRect.width /2));
         y += targetRect.height;
         return { top: y, left: x };
      } else if (placement ==="bottom-start") {
         x += Math.round((targetRect.width / 8) - (bubbleRect.width /2));
         y += targetRect.height;
         return { top: y, left: x};
      } else if (placement === "top") {
         x += Math.round((targetRect.width / 2) - (bubbleRect.width /2));
         y -= bubbleRect.height;
         return { top: y, left: x };
      } else if (placement === "top-start") {
         x += Math.round((targetRect.width / 8) - (bubbleRect.width /2));
         y -= bubbleRect.height;
         return { top: y, left: x};
      } else if (placement === "right") {
         x += targetRect.width;
         y += Math.round((targetRect.height/2) - (bubbleRect.height/2));
         return {top: y, left: x};
      } else if (placement === "left") {        
         x -= bubbleRect.width;
         y += Math.round((targetRect.height/2) - (bubbleRect.height/2));
         return {top: y, left: x};
      }
};

  /**
   * Get's exact position of event.
   * 
   * @param {Object} e The event passed in
   * @return {Object} Returns the x and y position
   */
  function getPosition(e) {
   const pos = {x: 0, y: 0};
    
    if (e.pageX || e.pageY) {
      pos.x = e.pageX;
      pos.y = e.pageY;
    } else if (e.clientX || e.clientY) {
      pos.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      pos.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    return pos;
  }
  /**
   * Positions the menu properly. If outside the windows, tried to move backin.
   * 
   * @param {Object} e The event
   */
function positionDom(element, mousePosition) {
   var elementWidth = element.offsetWidth + 4;
   var elementHeight = element.offsetHeight + 4;

   var windowWidth = window.innerWidth;
   var windowHeight = window.innerHeight;

   if ( (windowWidth - mousePosition.x) < elementWidth ) {
      element.style.left = windowWidth - elementWidth + "px";
   } else {
      element.style.left = mousePosition.x + "px";
   }

   if ( (windowHeight - mousePosition.y) < elementHeight ) {
      element.style.top = windowHeight - elementHeight + "px";
   } else {
      element.style.top = mousePosition.y + "px";
   }
};


function extractDialogValue(form) {
   // get form's input data.
   const obj = {};
   for (let element of form.elements) {
      if ((element.name) && (element.value)) {  // should we check the existence of .name? no name elements automatically excludede? needs to find out.
         obj[element.name] = element.value;
      }
   }
   return obj;
};
function runDialog(formID, ev, submitCallback, setup) {
   runDialogCenter(formID, submitCallback, setup, ev);
};

function runDialogCenter(formID, submitCallback, setup, _ev) {
   const form = document.querySelector(formID);
   if (form) {
      const _pvt = {submitSuccess: false};
      // create overlay
      const overlay = document.createElement("div");
      overlay.classList.add("overlay");   
      overlay.appendChild(form); 
      form.style.display = 'block';
      if (_ev) {
         overlay.classList.add("realCenterModal");
      } else {
         overlay.classList.add("centerModal");
      }
      form.reset();
      if (setup) {
         setup(form);
      }
      // we need this because submit event won't tell which submit buttons we clicked.
      const submits = form.querySelectorAll('[type=submit]');
      for (let submit of submits) {
         if ('ok'.localeCompare(submit.value, 'en', {'sensitivity': 'base'}) == 0) {
            submit.addEventListener('click', function oked(ev) {
               _pvt.submitSuccess = true;
               submit.removeEventListener('click', oked);
            });
         } else if ('cancel'.localeCompare(submit.value, 'en', {'sensitivity': 'base'}) == 0) {

         } else {
            console.log('submit ' + submit.value + ' type not supported');
         }
      }
      document.body.appendChild(overlay);
      
      // wait for handling event.
      form.addEventListener('submit', function submitted(ev) {
         if ((_pvt.submitSuccess)) {
            // get form's input data.
            submitCallback(form);     // ask function to extract element's value.
         }
         // hide the dialog, prevent default.
         ev.preventDefault();
         form.style.display = 'none';
         form.removeEventListener('submit', submitted);
         document.body.appendChild(form);
         document.body.removeChild(overlay);
      });
   }
};


// fileInput helper
function openFile(fn) {
   const fileInput = document.querySelector('#importFile');    // <input type="file" id="wavefrontObj" style="display:none"/> 
   if (fileInput) {
      fileInput.click();
      fileInput.addEventListener('change', function ok(ev) {
         let fileList = this.files;    // = ev.target.files;
         for (let file of fileList) {
            fn(file);
         }
      });
   }
};


let styleSheet = (function(){
   let style = document.createElement('style');
   document.head.appendChild(style);
   // webkit hack, still needs in 2018?
   style.appendChild(document.createTextNode(''));
   return style.sheet;
}());


const submenu = [];
function slideBack() {
   if (submenu.length === 0) {
      return false;
   }
   // hide current ul
   const ul = submenu.pop();
   ul.style.visibility = "hidden";
   // now toggle parent sibling
   const dropside = ul.parentElement;  
   dropside.classList.remove('hideAfter', 'showBefore');
   // hide all dropside sibling 
   const grandParent = dropside.parentElement;
   let element = grandParent.firstElementChild;
   do {
      //if (element !== dropside) {
         element.style.visibility = "inherit";
      //}
   } while (element = element.nextElementSibling);
   if (submenu.length > 0) {
      const grandA = grandParent.previousElementSibling;
      if (grandA && grandA.tagName == "A") { 
         grandA.style.visibility = "inherit";
         grandA.parentElement.style.visibility = "inherit";
      }
   }
   return true;
};
//dropside, slide in/out
function toggleSubmenu(ul) {
   if ((submenu.length > 0) && (submenu[submenu.length-1] === ul)) { // is toggling
      slideBack();
   } else {
      // now toggle on
      const dropside = ul.parentElement;
      dropside.classList.add("showBefore", "hideAfter");
      // hide grandParent if needed 
      const grandParent = dropside.parentElement;
      if (submenu.length > 0) {
         const grandA = grandParent.previousElementSibling;
         if (grandA && grandA.tagName == "A") {
            grandA.style.visibility = "hidden";
            grandA.parentElement.style.visibility = "hidden";
         }
      }
      // hide all dropside Sibling
      let element = grandParent.firstElementChild;
      do {
         if (element !== dropside) {
            element.style.visibility = "hidden";
         }
      } while (element = element.nextElementSibling);
      submenu.push(ul);
      ul.style.visibility = "visible";
   }
};

// show popupMenu
function clickInsideElement( e, className ) {
   let target = e.target;
   do {
      if ( target.classList && target.classList.contains(className) ) {
         return target;
      }
   } while ( target = target.parentNode )
   return false;
};

let currentMenu=false;
let nextPopup=false;
function toggleMenuOff() {
   if (currentMenu) {
      currentMenu.style.visibility = "hidden";
      currentMenu=false;
      while (slideBack()) {}
   }
   if (nextPopup) {
      currentMenu = nextPopup;
      nextPopup=false;
      currentMenu.style.visibility = "visible";   // toggleMenuOn
   }
};
let firstClick = 0;
function clickListener() {
   function callBack(e) {
      if (firstClick) {
         firstClick--;
      } else {
      //let clickeElIsLink = clickInsideElement( e, popupMenuClass );
      //if ( !clickeElIsLink ) {
         //if ( (e.button == 0) || (e.button == 1) ) {  // somehow, any click should 
            toggleMenuOff();
            if (!currentMenu) {
               // remove listening event
               document.removeEventListener("mouseup", callBack);
            }
         //}
      }
    }

   document.addEventListener("mouseup", callBack, false);
};
function showContextMenu(popupMenu) {
   if (currentMenu) {
      toggleMenuOff();
   } else {
      firstClick++;
      clickListener();
   }
   currentMenu = popupMenu;
   currentMenu.style.visibility = "visible";   // toggleMenuOn
};
function queuePopupMenu(popupMenu) {
   if (popupMenu !==currentMenu) {
      nextPopup = popupMenu;
      if (!currentMenu) {
         clickListener();
      }
   }
};





/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PreviewCage", function() { return PreviewCage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CreatePreviewCageCommand", function() { return CreatePreviewCageCommand; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_boundingvolume__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_wingededge__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_view__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_undo__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_util__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__wings3d_i18n__ = __webpack_require__(17);
/*
*  hold onto a WingedEdgeTopology. adds index, texture, etc....
*  bounding box, picking.
* 
*  previewCage. Internal representation rewrote many times.
*  Finally decided to trade space for ease of implementation and 
#  no worst case non linear runtimes.
* 
*/

 









class MeshAllocatorProxy { // we could use Proxy, but ....
   constructor(preview) {
      this.preview = preview;
   }

   allocVertex(...args) { return this.preview.bench.allocVertex(...args); }

   allocEdge(...args) { return this.preview.bench.allocEdge(...args); }

   allocPolygon(...args) {
      const face = this.preview.bench.allocPolygon(...args);
      if (this.preview.bench.boundingSpheres.length < this.preview.bench.faces.length) {   // now create sphere and insert to preview's bvh
         this.preview.bench.boundingSpheres.push( __WEBPACK_IMPORTED_MODULE_1__wings3d_boundingvolume__["BoundingSphere"].allocate(face) );
      }
      this.preview.insertFace(face);
      return face;
   }

   freeAll(polygons, wEdges, vertices) { this.preview.bench.freeAll(polygons, wEdges, vertices); }

   freeVertex(vertex) { 
      this.preview.bench.alterVertex(); 
      this.preview.bench.freeVertex(vertex); 
   }

   freeHEdge(hEdge) { this.preview.bench.freeHEdge(hEdge); }

   freePolygon(polygon) {
      this.preview.removeFace(polygon);
      this.preview.bench.freePolygon(polygon);
   }

   getVertices(index) { return this.preview.bench.getVertices(index); }

   clearAffected() { this.preview.bench.clearAffected(); }

   addAffectedEdgeAndFace(...args) { this.preview.bench.addAffectedEdgeAndFace(...args); }
   addAffectedWEdge(wEdge) {this.preview.bench.addAffectedWEdge(wEdge);}
   addAffectedFace(polygon) {this.preview.bench.addAffectedFace(polygon);}
   addAffectedVertex(vertex) {this.preview.bench.addAffectedVertex(vertex);}
}


/**
 * Model constructor.
 * 
 * @param {DraftBench} bench - drawing workbench. 
 */
const PreviewCage = function(bench) {
   this.geometry = new __WEBPACK_IMPORTED_MODULE_2__wings3d_wingededge__["WingedTopology"](new MeshAllocatorProxy(this));
   this.bench = bench;
   this.guiStatus = {};
   this.status = {locked: false, visible: true, wireMode: false};

   // selecte(Vertex,Edge,Face)here
   this.selectedSet = new Set;
   // default no name
   let _name = "";
   Object.defineProperty(this,"name",{
      get: function() { return _name; },
      set: function(value) {  
         if (value === '') {  // cannot assign empty string?
            return;
         }
         _name = value; 
         if (this.guiStatus.textNode) {   // treeView's representation.
            if (this.guiStatus.textNode.textContent !== value) {
               this.guiStatus.textNode.textContent = value;
            }
         }
       }
    });
   // bvh
   this.bvh = {root: null, queue: new Set};       // queue is for lazy evaluation.1
};


// act as destructor
PreviewCage.prototype.freeBuffer = function() {
   if (this.bvh.root) {
      this.bvh.root.free();
      this.bvh.root = null;
   }
   this.geometry.free();
};

/**
 * update gui status.
 */
PreviewCage.prototype.updateStatus = function() {
   if (!this.isVisible() || (this.selectedSet.size === 0)) {
      if (this.guiStatus.select.checked) {
         this.guiStatus.select.checked = false;
      }
   } else {
      if (!this.guiStatus.select.checked) {
         this.guiStatus.select.checked = true;
      }
   }
};

//-- bvh -----

PreviewCage.prototype.initBVH = function() {
   const faceSet = this.geometry.faces;

   let max, min;
   const center = vec3.create();
   // first compute midPoint.
   const spheres = [];
   for (let face of faceSet) {
      const sphere = this.bench.boundingSpheres[face.index];
      spheres.push(sphere);
      vec3.add(center, center, sphere.center);
      if (!max) {
         max = vec3.fromValues(sphere.center[0]+sphere.radius, sphere.center[1]+sphere.radius, sphere.center[2]+sphere.radius);
         min = vec3.fromValues(sphere.center[0]-sphere.radius, sphere.center[1]-sphere.radius, sphere.center[2]-sphere.radius);
      } else {
         for (let axis = 0; axis < 3; ++axis) {
            if (max[axis] < (sphere.center[axis]+sphere.radius)) {
               max[axis] = sphere.center[axis]+sphere.radius;
            } else if (min[axis] > (sphere.center[axis]-sphere.radius)) {
               min[axis] = sphere.center[axis] - sphere.radius;
            }
         }
      }
   }
   vec3.scale(center, center, 1/spheres.length);
   // mid point of a bunch of spheres will likely split more evently.
   const bound = {center: center, 
                  halfSize: vec3.fromValues(Math.max(max[0]-center[0], center[0]-min[0]), 
                                            Math.max(max[1]-center[1], center[1]-min[1]), 
                                            Math.max(max[2]-center[2], center[2]-min[2]) )};
   if (this.bvh.root) {
      this.bvh.root.free();
   }
   this.bvh.queue.clear();
   this.bvh.root = new __WEBPACK_IMPORTED_MODULE_1__wings3d_boundingvolume__["LooseOctree"](this, bound, 0);
   // now insert every spheres onto the root
   for (let sphere of spheres) {
      this.bvh.root.getBound(bound);
      this.bvh.root.insert(sphere, bound);
   }
   //this.bvh.root.check(new Set);
}

PreviewCage.prototype.insertFace = function(face) {
   const sphere = this.bench.boundingSpheres[face.index];
   if (!sphere.octree) {
      this.bvh.queue.add(sphere);
   } else {
      console.log("octree insert duplicated");
   }
   //this.bvh.root.insert(sphere);
}

PreviewCage.prototype.moveSphere = function(sphere) { // lazy evaluation.
   this.bvh.queue.add(sphere);
}

PreviewCage.prototype.removeFace = function(face) { 
   const sphere = this.bench.boundingSpheres[face.index];
   if (sphere.octree) { // octree should exist, or 
      sphere.octree._remove(sphere);                     
   } else {
      this.bvh.queue.delete(sphere);
   }
}

// check if we needs to resize, if yes then might as well rebuild.
PreviewCage.prototype.updateBVH = function() {
   // check if any sphere is outside of original bound.
   for (let sphere of this.bvh.queue) {
      if (!this.bvh.root.isInside(sphere)) {
         this.bvh.queue.clear();
         this.initBVH();
         return;
      }
   }
   
   // now insert the queue moved polygons
   const bound = {center: vec3.create(), halfSize: vec3.create()};
   for (let sphere of this.bvh.queue) {
      this.bvh.root.getBound(bound);
      this.bvh.root.insert(sphere, bound);
   }
   this.bvh.root.check(new Set);
   this.bvh.queue.clear();
}

//-- end of bvh

PreviewCage.prototype.rayPick = function(ray) {
   if (this.bvh.root === null) {
      this.initBVH();
   } else {
      this.updateBVH();
   }
   // return the closest face (triangle) that intersect ray.
   // check for triangle intersection, select the hit Face, hit Edge(closest), and hit Vertex (closest).
   var hitEdge = null;
   var center;
   var hitT = Number.POSITIVE_INFINITY;   // z_far is the furthest possible intersection

   for (let sphere of this.bvh.root.intersectExtent(ray)) {
      sphere.polygon.eachEdge( function(edge) {
         // now check the triangle is ok?
         var t = __WEBPACK_IMPORTED_MODULE_6__wings3d_util__["intersectTriangle"](ray, [sphere.center, edge.origin.vertex, edge.destination().vertex]);
         if ((t != 0.0) && (t < hitT)) {
            // intersection, check for smallest t, closest intersection
            hitT = t;
            hitEdge = edge;
            center = sphere.center;
         }
      });
   }
   // yes, we have an hit
   if (hitEdge) {
      return {t: hitT, model: this, center: center, edge: hitEdge};
      // p = o + td; intersection point.
   } else {
      return null;
   }
};


PreviewCage.prototype.getSelectedSorted = function() {
   let selectedSort = Array.from(this.selectedSet);
   selectedSort.sort((a, b) => {return a.index - b.index;});  // iterated selectedFaces in index order.
   return selectedSort;
}


PreviewCage.duplicate = function(originalCage) {
   // copy geometry.
   const indexMap = new Map;
   const previewCage = new PreviewCage(originalCage.bench);
   const geometry = previewCage.geometry;
   for (let vertex of originalCage.geometry.vertices) {
      const copy = geometry.addVertex(vertex.vertex);
      indexMap.set(vertex.index, copy.index);
   }
   for (let polygon of originalCage.geometry.faces) {
      let index = [];
      polygon.eachVertex( function(vertex) {
         index.push( indexMap.get(vertex.index) );
      });
      geometry.addPolygon(index);
   }
   //geometry.clearAffected();
   previewCage._updatePreviewAll();
   // new PreviewCage, and new name
   previewCage.name = originalCage.name + "_copy1";

   return previewCage;
};


PreviewCage.prototype.merge = function(mergeSelection) {
   // copy geometry.
   this.geometry.merge(function* (){for (let cage of mergeSelection) {yield cage.geometry;}});
   // copy selection
   this.selectedSet = new Set(function* (){for (let cage of mergeSelection) {yield* cage.selectedSet;}}());
   // clear out all ?
/*   for (let cage of mergeSelection) {
      cage.geometry.faces = new Set;
      cage.geometry.vertices = new Set;
      cage.geometry.edges = new Set;
      cage.selectedSet = new Set;
   } */
};

PreviewCage.prototype.separate = function() {
   const separatePreview = [];
   const separateGeometry = this.geometry.separateOut();
   let sep = 0;
   for (let geometry of separateGeometry) {
      const cage = new PreviewCage(this.bench);
      cage.geometry = geometry;     // copy back
      if (sep > 0) {
         cage.name = this.name + "_sep" + sep.toString();
      } else {
         cage.name = this.name;
      }
      sep++;
      separatePreview.push(cage);
   }
   return separatePreview;    // snapshot.
};


PreviewCage.prototype.detachFace = function(detachFaces, number) {
   const detach = this.geometry.detachFace(detachFaces);
   const separate = new PreviewCage(this.bench);   // should only happened once for each partition.
   separate.geometry.faces = detachFaces;
   separate.geometry.edges = detach.edges;
   separate.geometry.vertices = detach.vertices;
   separate.name = this.name + "_cut" + number.toString();

   return separate;
};


PreviewCage.prototype.setVisible = function(on) {
   if (on) {
      if (!this.status.visible) {
         this.status.visible = true;
         this.bench.alterPreview();
         return (!on);
      }
   } else {
      if (this.status.visible) {
         this.status.visible = false;
         this.bench.alterPreview();
         return (!on);
      }
   }
   return null;
};


/**
 * lock/unlock Preview to further operation.
 * @param {bool} toggle - lock/ unlock
 */
PreviewCage.prototype.toggleLock = function(toggle) {
   if (toggle) {
      if (!this.status.locked) {
         this.status.locked = true;
         return !toggle;
      }
   } else {
      if (this.status.locked) {
         this.status.locked = false;
         return !toggle;
      }
   }
   return null;
};


/**
 * 
 */
PreviewCage.prototype.toggleWireMode = function(on) {
   if (on) {
      if (!this.status.wireMode) {
         this.status.wireMode = true;
         this.bench.alterPreview();
         return (!on);
      }
   } else {
      if (this.status.wireMode) {
         this.status.wireMode = false;
         this.bench.alterPreview();
         return (!on);
      }
   }
   return null;
};


PreviewCage.prototype.isLock = function() {
   return this.status.locked;
}

PreviewCage.prototype.isVisible = function() {
   return this.status.visible;
}

PreviewCage.prototype.isWireMode = function() {
   return this.status.wireMode;
}


PreviewCage.prototype._getGeometrySize = function() {
   return { face: this.geometry.faces.size,
            edge: this.geometry.edges.size,
            vertex: this.geometry.vertices.size
          };
};


PreviewCage.prototype._updatePreviewAll = function() {
   this.bench.updatePreview();
};


// body selection.
PreviewCage.prototype.changeFromBodyToFaceSelect = function() {
   // do nothing, already selected or deselected.
   return this.snapshotSelectionBody();
};

PreviewCage.prototype.changeFromBodyToEdgeSelect = function() {
   const snapshot = this.snapshotSelectionBody();

   if (this.hasSelection()) {
      this._resetSelectBody();
      // select all edge
      for (let wingedEdge of this.geometry.edges) {
         this.selectedSet.add(wingedEdge);
         this.bench.setEdgeColor(wingedEdge, true);
      }
   }

   return snapshot;
};

PreviewCage.prototype.changeFromBodyToVertexSelect = function() {
   const snapshot = this.snapshotSelectionBody();

   if (this.hasSelection()) {
      this._resetSelectBody();
      // select all vertex
      for (let vertex of this.geometry.vertices) {
         this.selectedSet.add(vertex);
         this.setVertexColor(vertex, 0.25);
      }
   }

   return snapshot;
};

PreviewCage.prototype.changeFromBodyToMultiSelect = function() {
   const snapshot = this.snapshotSelectionBody();
   if (this.hasSelection()) {
      this._resetSelectBody();
   }

   return snapshot;
}



// hack for calling restoerXXXSelection. double dispatch?
PreviewCage.prototype.restoreSelection = function(snapshot, madsor) {
   madsor._restoreSelection(this, snapshot);
}

PreviewCage.prototype.restoreFaceSelection = function(snapshot) {
   for (let polygon of snapshot.selectedFaces) {
      this.selectFace(polygon);
   }
};

PreviewCage.prototype.restoreEdgeSelection = function(snapshot) {
   for (let wingedEdge of snapshot.wingedEdges) {
      this.selectEdge(wingedEdge.left);
   }
};

PreviewCage.prototype.restoreVertexSelection = function(snapshot) {
   for (let vertex of snapshot.vertices) {
      this.selectVertex(vertex);
   }
};

PreviewCage.prototype.restoreBodySelection = function(snapshot) {
   if (snapshot.body.size > 0) {
      this.selectBody();
   }
};

PreviewCage.prototype.restoreFromBodyToFaceSelect = function(snapshot) {
   if (snapshot) {
      this._resetSelectBody();
      this.restoreFaceSelection(snapshot);
   } else {
      this.changeFromBodyToFaceSelect();
   }
};

PreviewCage.prototype.restoreFromBodyToEdgeSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectBody();
      this.restoreEdgeSelection(snapshot);
   } else {
      this.changeFromBodyToEdgeSelect();  // choose compute over storage, use the same code as going forward.
   }
};

PreviewCage.prototype.restoreFromBodyToVertexSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectBody();
      // and selected using the snapshots.
      this.restoreVertexSelection(snapshot);
   } else {
      this.changeFromBodyToVertexSelect();  // compute vs storage. currently lean toward compute.
   }
};

PreviewCage.prototype.restoreFromBodyToMultiSelect = function(_snapshot) {
   this.changeFromBodyToMutliSelect();
};

PreviewCage.prototype._resetSelectBody = function() {
   const oldSet = this.snapshotSelectionBody();
   this.selectedSet = new Set();
   this.bench.resetBody(oldSet.body);
   return oldSet;
};

PreviewCage.prototype._selectBodyLess = function() {
   const snapshot = this.snapshotSelectionBody();
   if (this.hasSelection()) {
      this.selectBody();
   }
   return snapshot;
}

PreviewCage.prototype._selectBodyAll = function() {
   const snapshot = this.snapshotSelectionBody();
   if (!this.hasSelection()) {
      this.selectBody();
   }
   return snapshot;
}

PreviewCage.prototype._selectBodyInvert = function() {
   const snapshot = this.snapshotSelectionBody();
   this.selectBody();
   return snapshot;
}

PreviewCage.prototype.selectBody = function() {
   //let faceColor;
   // we change interior color to show the selection
   if (this.hasSelection()) {
      this.bench.selectGroup(this.selectedSet, false);
      this.selectedSet = new Set;
         //faceColor = [0.0, 1.0, 0.0];   // hilite and unselected         
         //faceColor = [0.5, 0.5, 0.5];   // unselected
   } else {
      this.selectedSet = new Set(this.geometry.faces);
      this.bench.selectGroup(this.selectedSet, true);
         //faceColor = [1.0, 1.0, 0.0];   // selected and hilite
         //faceColor = [1.0, 0.0, 0.0];   // selected.
      geometryStatus(Object(__WEBPACK_IMPORTED_MODULE_7__wings3d_i18n__["i18n"])("body_status", {name: this.name, polygonSize: this.geometry.faces.size, edgeSize: this.geometry.edges.size, vertexSize: this.geometry.vertices.size}));
   }
   return this.hasSelection();
};

PreviewCage.prototype.hiliteBody = function(hilite) {
   this.bench.hiliteBody(this.geometry.faces, hilite); 
}

PreviewCage.prototype.hasSelection = function() {
   return (this.selectedSet.size > 0);
};

PreviewCage.prototype.selectionSize = function() {
   return this.selectedSet.size;
}

PreviewCage.prototype.snapshotSelection = function() {
   return new Set(this.selectedSet);
};

PreviewCage.prototype.snapshotSelectionFace = function() {
   return {selectedFaces: new Set(this.selectedSet)};
}

PreviewCage.prototype.snapshotSelectionEdge = function() {
   return {wingedEdges: new Set(this.selectedSet)};
}

PreviewCage.prototype.snapshotSelectionVertex = function() {
   return {vertices: new Set(this.selectedSet)};
}

PreviewCage.prototype.snapshotSelectionBody = function() {
   return {body: new Set(this.selectedSet)};
}

PreviewCage.prototype.setVertexColor = function(vertex, color) {
   // selected color
   this.bench.setVertexColor(vertex, color);
};

PreviewCage.prototype.dragSelectVertex = function(vertex, onOff) {
   if (this.selectedSet.has(vertex)) {
      if (onOff === false) {
         this.selectedSet.delete(vertex);
         this.setVertexColor(vertex, -0.25);
         return true;
      }
   } else {
      if (onOff === true) {
         this.selectedSet.add(vertex);
         this.setVertexColor(vertex, 0.25);
         geometryStatus("select vertex: " + vertex.index);
         return true;
      }
   }
   return false;
};

PreviewCage.prototype.selectVertex = function(vertex) {
   var onOff;
   var color;
   if (this.selectedSet.has(vertex)) {
      this.selectedSet.delete(vertex);
      color = -0.25;
      onOff = false;
   } else {
      this.selectedSet.add(vertex);
      color = 0.25;
      onOff = true;
      geometryStatus("select vertex: " + vertex.index);
   }
   // selected color
   this.setVertexColor(vertex, color);
   return onOff;
};


PreviewCage.prototype._resetSelectVertex = function() {
   var snapshot = this.snapshotSelectionVertex();
   this.selectedSet = new Set;
   // zeroout the edge seleciton.
   this.bench.resetSelectVertex();
   return snapshot;
};

PreviewCage.prototype._selectVertexMore = function() {
   const snapshot = this.snapshotSelectionVertex();

   const self = this;
   for (let vertex of snapshot.vertices) {
      vertex.eachInEdge( function(inEdge) {
         if (!self.selectedSet.has(inEdge.origin)) {
            self.selectVertex(inEdge.origin);
         }
      });
   }

   return snapshot;
};

PreviewCage.prototype._selectVertexLess = function() {
   const snapshot = this.snapshotSelectionVertex();

   for (let vertex of snapshot.vertices) {
      for (let ringV of vertex.oneRing()) {
         if (!snapshot.vertices.has(ringV)) {
            this.selectVertex(vertex);
            break;
         }
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectVertexAll = function() {
   const snapshot = this.snapshotSelectionVertex();

   for (let vertex of this.geometry.vertices) {
      if (vertex.isLive() && !snapshot.vertices.has(vertex)) {
         this.selectVertex(vertex);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectVertexInvert = function() {
   const snapshot = this.snapshotSelectionVertex();

   for (let vertex of this.geometry.vertices) {
      if (vertex.isLive()) {
         this.selectVertex(vertex);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectVertexAdjacent = function() {
   return this._selectVertexMore();
};

PreviewCage.prototype._selectVertexSimilar = function() {
   const snapshot = this.snapshotSelectionVertex();
   const similarVertex = new SimilarVertex(snapshot.vertices);

   for (let vertex of this.geometry.vertices) {
      if (vertex.isLive() && !snapshot.vertices.has(vertex) && similarVertex.find(vertex)) {
         this.selectVertex(vertex);
      }
   }

   return snapshot;
};

PreviewCage.prototype.changeFromVertexToFaceSelect = function() {
   const snapshot = this.snapshotSelectionVertex();

   var self = this;
   var oldSelected = this._resetSelectVertex();
   //
   for (let vertex of oldSelected.vertices) { 
      // select all face that is connected to the vertex.
      vertex.eachOutEdge(function(edge) {
         if (!self.selectedSet.has(edge.face)) {
            self.selectFace(edge.face);
         }
      });
   }

   return snapshot;
};

PreviewCage.prototype.changeFromVertexToEdgeSelect = function() {
   const snapshot = this.snapshotSelectionVertex();

   var self = this;
   var oldSelected = this._resetSelectVertex();
   //
   for (let vertex of oldSelected.vertices) { 
      // select all edge that is connected to the vertex.
      vertex.eachOutEdge(function(edge) {
         if (!self.selectedSet.has(edge.wingedEdge)) {
            self.selectEdge(edge);
         }
      });
   }

   return snapshot;
};

PreviewCage.prototype.changeFromVertexToBodySelect = function() {
   const snapshot = this.snapshotSelectionVertex();

   if (this.hasSelection()) {
      // select whole body,
      this._resetSelectVertex();
      this.selectBody();
   }

   return snapshot;
};

PreviewCage.prototype.changeFromVertexToMultiSelect = function() {
   const snapshot = this.snapshotSelectionVertex();

   // clear all selection.
   this._resetSelectVertex();

   return snapshot;
};

PreviewCage.prototype.restoreFromVertexToFaceSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectVertex();
      this.restoreFaceSelection(snapshot);
   } else {
      this.changeFromVertexToFaceSelect();  // choose compute over storage, use the same code as going forward.
   }
};

PreviewCage.prototype.restoreFromVertexToEdgeSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectVertex();
      this.restoreEdgeSelection(snapshot);
   } else {
      this.changeFromVertexToEdgeSelect();  // choose compute over storage, use the same code as going forward.
   }
};

PreviewCage.prototype.restoreFromVertexToBodySelect = function(snapshot) {
   if (snapshot) {
      this._resetSelectVertex();
      this.restoreBodySelection(snapshot);
   } else {
      this.changeFromVertexToBodySelect();
   }
};

PreviewCage.prototype.restoreFromVertexToMultiSelect = function(_snapshot) {
   this.changeFromVertexToMultiSelect();
};


PreviewCage.prototype.changeFromMultiToEdgeSelect = function() {
   return {}; // nothing todo
};
PreviewCage.prototype.changeFromMultiToFaceSelect = function() {
   return {}; // nothing todo
};
PreviewCage.prototype.changeFromMultiToVertexSelect = function() {
   return {}; // nothing todo
};
PreviewCage.prototype.changeFromMultiToBodySelect = function() {
   return {}; // nothing todo
};
PreviewCage.prototype.restoreFromMultiToEdgeSelect = function(_snapshot) {
   // nothing because guarantee nothing selected.
};
PreviewCage.prototype.restoreFromMultiToFaceSelect = function(_snapshot) {
   // nothing because guarantee nothing selected.
};
PreviewCage.prototype.restoreFromMultiToVertexSelect = function(_snapshot) {
   // nothing because guarantee nothing selected.
};
PreviewCage.prototype.restoreFromMultiToBodySelect = function(_snapshot) {
   // nothing because guarantee nothing selected.
};


PreviewCage.prototype.dragSelectEdge = function(selectEdge, dragOn) {
   var wingedEdge = selectEdge.wingedEdge;

   if (this.selectedSet.has(wingedEdge)) { 
      if (dragOn === false) { // turn from on to off
         this.selectedSet.delete(wingedEdge);
         this.bench.selectEdge(wingedEdge, false);
         return true;   // new off selection
      }
   } else {
      if (dragOn === true) {   // turn from off to on.
         this.selectedSet.add(wingedEdge);
         this.bench.selectEdge(wingedEdge, true);
         return true;
      }
   }
   // edge already on the correct state.
   return false;
}

PreviewCage.prototype.selectEdge = function(selectEdge) {
   // select polygon set color,
   var wingedEdge = selectEdge.wingedEdge;

   var onOff;
   var color;
   if (this.selectedSet.has(wingedEdge)) {
      this.selectedSet.delete(wingedEdge);
      color = -0.25;
      onOff = false;
   } else {
      this.selectedSet.add(wingedEdge);
      color = 0.25;
      onOff = true;
      geometryStatus("select edge: " + wingedEdge.index);
   }
   // selected color
   this.bench.selectEdge(wingedEdge, onOff);
   return onOff;
};

PreviewCage.prototype.computeSnapshot = function(snapshot) {
   // update all affected polygon(use sphere). copy and recompute vertex.
   for (let polygon of snapshot.faces) {
      const sphere = this.bench.boundingSpheres[polygon.index];
      // recompute sphere center. and normal
      polygon.computeNormal();
      sphere.setSphere( __WEBPACK_IMPORTED_MODULE_1__wings3d_boundingvolume__["BoundingSphere"].computeSphere(polygon, sphere.center) );
   }
   this.bench.updateCentroid();
};


PreviewCage.prototype.restoreMoveSelection = function(snapshot) {
   // restore to the snapshot position.
   let i = 0;
   for (let vertex of snapshot.vertices) {
      vec3.copy(vertex.vertex, snapshot.position.subarray(i, i+3));
      i += 3;
   }
   this.bench.updatePosition();
   this.computeSnapshot(snapshot);
};


// 3-15 - add limit to movement.
PreviewCage.prototype.moveSelection = function(snapshot, movement) {
   // first move geometry's position
   if (snapshot.direction) {
      let i = 0; 
      for (let vertex of snapshot.vertices) {
         vec3.scaleAndAdd(vertex.vertex, vertex.vertex, snapshot.direction.subarray(i, i+3), movement);  // movement is magnitude
         i+=3;
      }
   } else {
      for (let vertex of snapshot.vertices) {
         vec3.add(vertex.vertex, vertex.vertex, movement);
      }
   }
   this.bench.updatePosition();
   this.computeSnapshot(snapshot);
};

//
// rotate selection, with a center
//
PreviewCage.prototype.rotateSelection = function(snapshot, quatRotate, center) {
   const translate = vec3.create();
   const scale = vec3.fromValues(1, 1, 1);
   this.transformSelection(snapshot, (transform, origin) => {
      mat4.fromRotationTranslationScaleOrigin(transform, quatRotate, translate, scale, (center ? center : origin));   
    });
};

//
// scale selection, by moving vertices
//
PreviewCage.prototype.scaleSelection = function(snapshot, scale, axis) {
   const scaleV = vec3.fromValues(axis[0] ? scale * axis[0] : 1, 
                                  axis[1] ? scale * axis[1] : 1, 
                                  axis[2] ? scale * axis[2] : 1);
   this.transformSelection(snapshot, (transform, _origin) => {
      mat4.fromScaling(transform, scaleV);   
    });
};

//
// transform selection,
//
PreviewCage.prototype.transformSelection = function(snapshot, transformFn) {
   // construct the matrix
   const transform = mat4.create();

   const vArry = snapshot.vertices[Symbol.iterator]();
   for (let group of snapshot.matrixGroup) {
      //mat4.fromRotationTranslationScaleOrigin(transform, quatRotation, translate, scale, group.center); // origin should not be modified by scale, glmatrix seems to get the order wrong.
      transformFn(transform, group.center);
      for (let index = 0; index < group.count; index++) {
         const vertex = vArry.next().value;
         vec3.transformMat4(vertex.vertex, vertex.vertex, transform);
      }
   }

   this.bench.updatePosition();
   this.computeSnapshot(snapshot);
};


PreviewCage.prototype.snapshotPositionAll = function() {
   return this.snapshotPosition(this.geometry.vertices);
};

PreviewCage.prototype.snapshotPosition = function(vertices, normalArray) {
   var ret = {
      faces: new Set,
      vertices: null,
      wingedEdges: new Set,
      position: null,
      direction: normalArray,
   };
   ret.vertices = vertices;
   // allocated save position data.
   const length = vertices.length ? vertices.length : vertices.size; // could be array or set
   ret.position = new Float32Array(length*3);
   // use the vertex to collect the affected polygon and the affected edge.
   let i = 0;
   for (let vertex of ret.vertices) {
      vertex.eachOutEdge(function(edge) {
         if (edge.isNotBoundary() && !ret.faces.has(edge.face)) {
            ret.faces.add(edge.face);
         }
         if (!ret.wingedEdges.has(edge.wingedEdge)) {
            ret.wingedEdges.add(edge.wingedEdge);
         }
      });
      // save position data
      ret.position.set(vertex.vertex, i);
      i += 3;
   }
   return ret;
};

PreviewCage.prototype.snapshotEdgePosition = function() {
   var vertices = new Set;
   // first collect all the vertex
   for (let wingedEdge of this.selectedSet) {
      for (let edge of wingedEdge) {
         var vertex = edge.origin;
         if (!vertices.has(vertex)) {
            vertices.add(vertex);
         }
      }
   }
   return this.snapshotPosition(vertices);
};


PreviewCage.prototype.snapshotFacePosition = function() {
   var vertices = new Set;
   // first collect all the vertex
   for (let polygon of this.selectedSet) {
      polygon.eachVertex( function(vertex) {
         if (!vertices.has(vertex)) {
            vertices.add(vertex);
         }
      });
   }
   return this.snapshotPosition(vertices);
};

PreviewCage.prototype.snapshotVertexPosition = function() {
   const vertices = new Set(this.selectedSet);
   return this.snapshotPosition(vertices);
};

PreviewCage.prototype.snapshotBodyPosition = function() {
   let vertices = new Set;
   if (this.hasSelection()) {
      vertices = new Set(this.geometry.vertices);
   }
   return this.snapshotPosition(vertices);
};


PreviewCage.prototype.snapshotFacePositionAndNormal = function() {
   const vertices = new Set;
   let normalMap = new Map;
   // first collect all the vertex
   for (let polygon of this.selectedSet) {
      polygon.eachVertex( function(vertex) {
         if (!vertices.has(vertex)) {
            vertices.add(vertex);
            const normal = [polygon.normal[0], polygon.normal[1], polygon.normal[2]];
            normalMap.set(vertex, normal);
         } else {
            const normal = normalMap.get(vertex);
            if (vec3.dot(normal, polygon.normal) < 0.999) {  // check for nearly same normal, or only added if hard edge?
               vec3.add(normal, normal, polygon.normal);
            } 
         }
      });
   }
   // copy normal;
   const normalArray = new Float32Array(vertices.size*3);
   let i = 0;
   for (let [_vert, normal] of normalMap) {
      let inputNormal = normalArray.subarray(i, i+3);
      vec3.copy(inputNormal, normal);
      i+=3;
   }
   return this.snapshotPosition(vertices, normalArray);
};

PreviewCage.prototype.snapshotVertexPositionAndNormal = function() {
   const vertices = new Set(this.selectedSet);
   const array = new Float32Array(vertices.size*3);
   array.fill(0.0);
   // copy normal
   let i = 0;
   for (let vertex of vertices) {
      let normal = array.subarray(i, i+3);
      vertex.eachOutEdge( function(outEdge) {
         if (outEdge.isNotBoundary()) {
            vec3.add(normal, normal, outEdge.face.normal);
         }
      });
      vec3.normalize(normal, normal);        // finally, we can safely normalized?
      i +=3;
   }

   return this.snapshotPosition(vertices, array);
};

PreviewCage.prototype.snapshotEdgePositionAndNormal = function() {
   const vertices = new Set;
   const normalMap = new Map; 
   // first collect all the vertex
   const tempNorm = vec3.create();
   for (let wingedEdge of this.selectedSet) {
      const p0 = wingedEdge.left.face;
      const p1 = wingedEdge.right.face;
      //vec3.normalize(tempNorm, tempNorm);
      for (let edge of wingedEdge) {
         let vertex = edge.origin;
         let normal;
         if (!vertices.has(vertex)) {
            vertices.add(vertex);
            normal = new Set;
            normalMap.set(vertex, normal);
         } else {
            normal = normalMap.get(vertex);
         }
         if (p0 !== null) {
            normal.add( p0 );
         }
         if (p1 !== null) {
            normal.add( p1 );
         }
      }
   }
   // copy normal
   const normalArray = new Float32Array(vertices.size*3);
   normalArray.fill(0.0);
   let i = 0;
   for (let [_vert, normal] of normalMap) {
      let inputNormal = normalArray.subarray(i, i+3);
      for (let poly of normal) {
         vec3.add(inputNormal, inputNormal, poly.normal);
      }
      i+=3;
   }
   return this.snapshotPosition(vertices, normalArray);
};

PreviewCage.prototype.snapshotTransformEdgeGroup = function() {
   const vertices = new Set;
   const matrixGroup = [];
   // array of edgeLoop. 
   let edgeGroup = this.geometry.findEdgeGroup(this.selectedSet);
   // compute center of loop, gather all the vertices, create the scaling matrix
   for (let group of edgeGroup) {
      let count = 0;
      const center = vec3.create();
      for (let wEdge of group) {
         for (let vertex of wEdge.eachVertex()) {
            if (!vertices.has(vertex)){
               vertices.add(vertex);
               count++;
               vec3.add(center, center, vertex.vertex);
            }
          };
      }
      vec3.scale(center, center, 1.0/count); // get the center
      // now construct the group
      matrixGroup.push( {center: center, count: count});
   }

   // now construct all the effected data and save position.
   const ret = this.snapshotPosition(vertices);
   ret.matrixGroup = matrixGroup;
   return ret;
};

PreviewCage.prototype.snapshotTransformFaceGroup = function() {
   const vertices = new Set;
   const matrixGroup = [];
   // array of edgeLoop. 
   let faceGroup = __WEBPACK_IMPORTED_MODULE_2__wings3d_wingededge__["WingedTopology"].findFaceGroup(this.getSelectedSorted());
   // compute center of loop, gather all the vertices, create the scaling matrix
   const center = vec3.create();
   for (let group of faceGroup) {
      let count = 0;
      vec3.set(center, 0, 0, 0);
      for (let face of group) {
         face.eachVertex(function(vertex) {
            if (!vertices.has(vertex)){
               vertices.add(vertex);
               count++;
               vec3.add(center, center, vertex.vertex);
            }
          });
      }
      vec3.scale(center, center, 1.0/count); // get the center
      // now construct the group
      matrixGroup.push( {center: center, count: count});
   }

   // now construct all the effected data and save position.
   const ret = this.snapshotPosition(vertices);
   ret.matrixGroup = matrixGroup;
   return ret;
};

PreviewCage.prototype.snapshotTransformBodyGroup = function() {
   let vertices = new Set;
   const center = vec3.create();
   if (this.hasSelection()) {
      for (let vertex of this.geometry.vertices) {
         if (vertex.isLive()) {
            vertices.add(vertex);
            vec3.add(center, center, vertex.vertex);
         }
      }
      vec3.scale(center, center, 1.0/vertices.size);
   }

   const ret = this.snapshotPosition(vertices);
   ret.matrixGroup = [{center: center, count: vertices.size}];
   return ret;
};

//
// no separate group. needs to have 2 vertex to see rotation.
//
PreviewCage.prototype.snapshotTransformVertexGroup = function() {
   let vertices = new Set;
   const center = vec3.create();
   if (this.hasSelection()) {
      for (let vertex of this.selectedSet) {
         vertices.add(vertex);
         vec3.add(center, center, vertex.vertex);
      }
      vec3.scale(center, center, 1.0/vertices.size);
   }

   const ret = this.snapshotPosition(vertices);
   ret.matrixGroup = [{center: center, count: vertices.size}];
   return ret;
};


PreviewCage.prototype._resetSelectEdge = function() {
   const snapshot = this.snapshotSelectionEdge();
   this.selectedSet = new Set;
   this.bench.resetSelectEdge();
   return snapshot;
};

PreviewCage.prototype._selectEdgeMore = function() {
   const snapshot = this.snapshotSelectionEdge();

   for (let wingedEdge of snapshot.wingedEdges) {
      for (let halfEdge of wingedEdge) {
         halfEdge.eachEdge( (edge) => {
            if (!this.selectedSet.has(edge.wingedEdge)) {
               this.selectEdge(edge);
            }
         });
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectEdgeLess = function() {
   const snapshot = this.snapshotSelectionEdge();

   const self = this;
   for (let selectedWinged of snapshot.wingedEdges) {
      for (let wingedEdge of selectedWinged.oneRing()) {
         if (!snapshot.wingedEdges.has(wingedEdge)) {
            this.selectEdge(selectedWinged.left);
            break;
         }
      }
   }

   return snapshot;
}

PreviewCage.prototype._selectEdgeAll = function() {
   const snapshot = this.snapshotSelectionEdge();

   for (let wingedEdge of this.geometry.edges) {
      if (wingedEdge.isLive() && !snapshot.wingedEdges.has(wingedEdge)) {
         this.selectEdge(wingedEdge.left);
      }
   }

   return snapshot;
}

PreviewCage.prototype._selectEdgeInvert = function() {
   const snapshot = this.snapshotSelectionEdge();

   for (let wingedEdge of this.geometry.edges) {
      if (wingedEdge.isLive()) {
         this.selectEdge(wingedEdge.left);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectEdgeAdjacent = function() {
   const snapshot = this.snapshotSelectionEdge();

   for (let wingedEdge of snapshot.wingedEdges) {
      for (let adjacent of wingedEdge.adjacent()) {
         if (!this.selectedSet.has(adjacent)) {
            this.selectEdge(adjacent.left);
         }
      }
   }

   return snapshot;
};


PreviewCage.prototype._selectEdgeSimilar = function() {
   const snapshot = this.snapshotSelectionEdge();
   const similarEdge = new SimilarWingedEdge(snapshot.wingedEdges);

   for (let wingedEdge of this.geometry.edges) {
      if (wingedEdge.isLive && !snapshot.wingedEdges.has(wingedEdge) && similarEdge.find(wingedEdge)) {
         this.selectEdge(wingedEdge.left);
      }
   }

   return snapshot;
};


PreviewCage.prototype.changeFromEdgeToFaceSelect = function() {
   const snapshot = this.snapshotSelectionEdge();

   const oldSelected = this._resetSelectEdge();
   for (let wingedEdge of oldSelected.wingedEdges) {
      // for each WingedEdge, select both it face.
      for (let halfEdge of wingedEdge) {
         if (!this.selectedSet.has(halfEdge.face)) {
            this.selectFace(halfEdge.face);
         }
      }
   }

   return snapshot;
};

PreviewCage.prototype.changeFromEdgeToVertexSelect = function() {
   const snapshot = this.snapshotSelectionEdge();

   const oldSelected = this._resetSelectEdge();
   for (let wingedEdge of oldSelected.wingedEdges) {
      // for each WingedEdge, select both it face.
      for (let halfEdge of wingedEdge) {
         if (!this.selectedSet.has(halfEdge.origin)) {
            this.selectVertex(halfEdge.origin);
         }
      }
   }
   return snapshot;
};

PreviewCage.prototype.changeFromEdgeToBodySelect = function() {
   const snapshot = this.snapshotSelectionEdge();

   if (this.hasSelection()) {
      this._resetSelectEdge();
      this.selectBody();
   }

   return snapshot;
};

PreviewCage.prototype.changeFromEdgeToMultiSelect = function() {
   const snapshot = this.snapshotSelectionEdge();

   if (this.hasSelection()) {
      this._resetSelectEdge();
   }

   return snapshot;
};

PreviewCage.prototype.restoreFromEdgeToFaceSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectEdge();
      this.restoreFaceSelection(snapshot);
   } else {
      this.changeFromEdgeToFaceSelect();  // we cheat, use the same code as going forward.
   }
};

PreviewCage.prototype.restoreFromEdgeToVertexSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectEdge();
      this.restoreVertexSelection(snapshot);
   } else {
      this.changeFromEdgeToVertexSelect();  // we cheat, use the same code as going forward.
   }
};

PreviewCage.prototype.restoreFromEdgeToBodySelect = function(snapshot) {
   if (snapshot) {
      this._resetSelectEdge();
      this.restoreBodySelection(snapshot);
   } else {
      this.changeFromEdgeToBodySelect();
   }
};

PreviewCage.prototype.restoreFromEdgeToMultiSelect = function(_snapshot) {
   this.changeFromEdgeToMultiSelect();
};

PreviewCage.prototype.setFaceSelectionOff = function(polygon) {
   this.bench.selectFace(polygon, false);
   this.selectedSet.delete(polygon);
};
PreviewCage.prototype.setFaceSelectionOn = function(polygon) {
   this.bench.selectFace(polygon, true);
   this.selectedSet.add(polygon);
};

PreviewCage.prototype.dragSelectFace = function(polygon, onOff) {
   // select polygon set color,
   if (this.selectedSet.has(polygon)) {
      if (onOff === false) {
         this.setFaceSelectionOff(polygon);
         return true;
      }
   } else {
      if (onOff === true) {
         this.setFaceSelectionOn(polygon);
         return true;
      }
   }
   geometryStatus("polygon face # " + polygon.index);
   return false;
};

/**
 * 
 */
PreviewCage.prototype.selectFace = function(polygon) {
   var onOff;
   if (this.selectedSet.has(polygon)) {
      this.setFaceSelectionOff(polygon);
      __WEBPACK_IMPORTED_MODULE_4__wings3d__["log"]("faceSelectOff", polygon.index);
      onOff = false;
   } else {
      this.setFaceSelectionOn(polygon);
      __WEBPACK_IMPORTED_MODULE_4__wings3d__["log"]("faceSelectOn", polygon.index);
      onOff = true;
   }
   geometryStatus("polygon face # " + polygon.index);
   return onOff;
};


PreviewCage.prototype._resetSelectFace = function() {
   const snapshot = this.snapshotSelectionFace();
   this.selectedSet = new Set;
   this.bench.selectGroup(snapshot.selectedFaces, false);   // turn off selected Face
   return snapshot;
}

PreviewCage.prototype._selectFaceMore = function() {
   const snapshot = this.snapshotSelectionFace();
   // seleceted selectedFace's vertex's all faces.
   for (let polygon of snapshot.selectedFaces) {
      for (let face of polygon.oneRing()) {
         // check if face is not selected.
         if ( (face !== null) && !this.selectedSet.has(face) ) {
            this.selectFace(face);
         }
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectFaceLess = function() {
   const snapshot = this.snapshotSelectionFace();

   for (let selected of snapshot.selectedFaces) {
      for (let polygon of selected.adjacent()) {
         if (!snapshot.selectedFaces.has(polygon)) {      // selected is a boundary polygon
            this.selectFace(selected); // now removed.
            break;
         }
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectFaceAll = function() {
   const snapshot = this.snapshotSelectionFace();

   for (let polygon of this.geometry.faces) {
      if (polygon.isLive && !snapshot.selectedFaces.has(polygon)) {
         this.selectFace(polygon);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectFaceInvert = function() {
   const snapshot = this.snapshotSelectionFace();;

   for (let polygon of this.geometry.faces) {
      if (polygon.isLive()) {
         this.selectFace(polygon);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectFaceAdjacent = function() {
   const snapshot = this.snapshotSelectionFace();;

   // seleceted selectedFace's vertex's all faces.
   for (let polygon of snapshot.selectedFaces) {
      for (let face of polygon.adjacent()) {
         // check if face is not selected.
         if ( (face !== null) && !this.selectedSet.has(face) ) {
            this.selectFace(face);
         }
      }
   }
   
   return snapshot;
};

PreviewCage.prototype._selectFaceSimilar = function() {
   const snapshot = this.snapshotSelectionFace();;
   const similarFace = new SimilarFace(snapshot.selectedFaces);

   for (let polygon of this.geometry.faces) {
      if (polygon.isLive() && !snapshot.selectedFaces.has(polygon) && similarFace.find(polygon)) {
         this.selectFace(polygon);
      }
   }

   return snapshot;
};


PreviewCage.prototype.changeFromFaceToEdgeSelect = function() {
   const snapshot = this.snapshotSelectionFace();

   var self = this;
   var oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      // for eachFace, selected all it edge.
      polygon.eachEdge(function(edge) {
         if (!self.selectedSet.has(edge.wingedEdge)) {
            self.selectEdge(edge);
         }
      });
   }

   return snapshot;
};

PreviewCage.prototype.changeFromFaceToVertexSelect = function() {
   const snapshot = this.snapshotSelectionFace();

   var self = this
   var oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      // for eachFace, selected all it vertex.
      polygon.eachVertex(function(vertex) {
         if (!self.selectedSet.has(vertex)) {
            self.selectVertex(vertex);
         }
      });
   }

   return snapshot;
};

PreviewCage.prototype.changeFromFaceToBodySelect = function() {
   const snapshot = this.snapshotSelectionFace();

   if (this.hasSelection()) {
      this._resetSelectFace();
      this.selectBody();
   }

   return snapshot;
};

PreviewCage.prototype.changeFromFaceToMultiSelect = function() {
   const snapshot = this.snapshotSelectionFace();

   if (this.hasSelection()) {
      this._resetSelectFace();
   }

   return snapshot;
};

PreviewCage.prototype.restoreFromFaceToEdgeSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectFace();
      // and selected using the snapshots.
      this.restoreEdgeSelection(snapshot);
   } else {
      this.changeFromFaceToEdgeSelect();  // compute vs storage. currently lean toward compute.
   }
}

PreviewCage.prototype.restoreFromFaceToVertexSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetSelectFace();
      // and selected using the snapshots.
      this.restoreVertexSelection(snapshot);
   } else {
      this.changeFromFaceToVertexSelect();  // compute vs storage. currently lean toward compute.
   }
};

PreviewCage.prototype.restoreFromFaceToBodySelect = function(snapshot) {
   if (snapshot) {
      this._resetSelectFace();
      this.restoreBodySelection(snapshot);
   } else {
      this.changeFromFaceToBodySelect();
   }
};

PreviewCage.prototype.restoreFromFaceToMultiSelect = function(_snapshot) {
   this.changeFromFaceToMultiSelect();
};


PreviewCage.prototype.extractFace = function() {
   var vertexSize = this.geometry.vertices.size;
   var edgeSize = this.geometry.edges.size;
   var faceSize = this.geometry.faces.size;
   // array of edgeLoop. 
   var edgeLoops = this.geometry.extractPolygon(this.selectedSet);
   // adjust preview to the new vertices, edges and faces.
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   //this._resizeEdges();

   return edgeLoops;
};


PreviewCage.prototype.creaseEdge = function() {
   return this.extrudeEdge(true);
}
//
// extrudeEdge - add 1/5 vertex to non-selected next/prev hEdges.
// or to extrude corner if next/prev hEdges are selected. 
// creaseFlag = crease endCap is different.
PreviewCage.prototype.extrudeEdge = function(creaseFlag = false) {
   const oldSize = this._getGeometrySize();

   // return value
   let collapsibleWings = new Set;
   let liftEdges = [];
   function undoExtrudeAccounting(result) {  // for undo Purpose.
      for (let hEdge of result.extrude) {
         collapsibleWings.add(hEdge.wingedEdge);
      }
      for (let hEdge of result.lift) {
         liftEdges.push(hEdge);
      }
   };
   // temp for accounting purpose.
   const pt = vec3.create();
   let extrudeOut  = new Set;    // fFence
   let extrudeIn = new Set;       // sFence
   let fences = [];
   let adjustEnd = [];
   let adjustStart = [];
   let traversedEdges = new Set;
   for (let wEdge of this.selectedSet) {
      for (let hEdge of wEdge) {
         if (traversedEdges.has(hEdge)) {  
            continue;   // already processed.
         }
         let current = hEdge.next;
         while (current !== hEdge) {
            if (!this.selectedSet.has(current.wingedEdge)) {
               while (!this.selectedSet.has(current.next.wingedEdge)) { current = current.next; }
               break;   // found the last of the first contiguous non-selected hEdge.
            } 
            // this is selected, so keep going.
            current = current.next;
         }
         if (current === hEdge) {   // all inner edges of polygon selected. 
            for (let current of hEdge.face.hEdges()) {
               traversedEdges.add(current);
            }  
            // liftCorner, and extrudeTheLooop.
            let danglingOut = this.geometry.liftCornerEdge(current);
            liftEdges.push(danglingOut.pair);
            let result = this.geometry.extrudeEdge(danglingOut.pair, danglingOut);    
            undoExtrudeAccounting(result);
         } else { // now we have a starting non-selected hEdge. restart from here. this is the heart of the algorithm.
            //let fences = [];
            hEdge = current;     // reset the starting edge.
            do {
               let start = current; // now find contiguous selected.
               current = current.next;
               while (this.selectedSet.has(current.wingedEdge)) {
                  traversedEdges.add(current);
                  current = current.next; // go until not selected.
               }
               let endAdjust = false;
               let startAdjust = false;
               let end = current;
               // we have start, we have end. now split new Edge if not already split by neighbor edges.
               if (!extrudeIn.has(current.pair)) {
                  if (end === end.pair.next.pair.next) { // special case of -- edge. lift Edge.
                     endAdjust = true;
                  } else { // split it out.
                     vec3.lerp(pt, current.origin.vertex, current.destination().vertex, 0.2);
                     current = this.geometry.splitEdge(current, pt); // current newly create edge
                     end = current;
                     extrudeOut.add(current);
                     liftEdges.push(current.pair);
                  }
               } else {
                  extrudeIn.delete(current.pair);   // yes, already create, now connect together, can savely remove
               }
               if (!extrudeOut.has(start.pair)) {  // we have end, check if already split by neighbor edges.
                  if (start === start.next.pair.next.pair) { // special case of -- edge. lift Edge
                     startAdjust = true;
                  } else { // split it out, start stay in the front.
                     vec3.lerp(pt, start.origin.vertex, start.destination().vertex, 0.8);
                     let newOut = this.geometry.splitEdge(start.pair, pt).pair;
                     extrudeIn.add(newOut);
                     liftEdges.push(newOut);
                     if (start === hEdge) {
                        hEdge = newOut;               // adjust endEdge.
                     }
                     start = newOut;
                  }
               } else {
                  extrudeOut.delete(start.pair);   // yes, already create, now connect together, can savely remove
               }
               let fence = {start: start, end: end};
               fences.push(fence);
               if (endAdjust) { adjustEnd.push(fence);}
               if (startAdjust) { adjustStart.push(fence);}
               // non-selected edge
               while (!this.selectedSet.has(current.next.wingedEdge)) { 
                  current = current.next;
               }
            } while (current !== hEdge);  // check if we have reach starting point.
         }
      }
   }
   // before loop the extrudeEdge, check if we needs to adjust {start, end}
   for (let fence of adjustEnd) {
      let end = fence.end;
      end.face.getCentroid(pt);
      vec3.lerp(pt, end.origin.vertex, pt, 0.2);
      const destVert = this.geometry.addVertex(pt);
      end = this.geometry._liftDanglingEdge(end.prev(), destVert);
      liftEdges.push(end.pair);
      fence.end = end;
   }
   for (let fence of adjustStart) {
      let start = fence.start;
      start.face.getCentroid(pt);
      vec3.lerp(pt, start.destination().vertex, pt, 0.2);
      const destVert = this.geometry.addVertex(pt);
      start = this.geometry._liftDanglingEdge(start, destVert);
      liftEdges.push(start.pair);
      fence.start = start.pair;
   }
   // now loop the extrudeEdge. we could not (splitEdge and extrudeEdge) because it will become very hard to find the beginning again.
   for (let fence of fences) {
      // now extrude the contiguous selected edge.
      let result = this.geometry.extrudeEdge(fence.start, fence.end);
      undoExtrudeAccounting(result);
   }

   // connected the extrudeEdge corner together if any.
   for (let hOut of extrudeOut) {
      let hIn = hOut.pair;
      // if (extrudeIn.has(hIn)) { continue; } // this is special case of -- edges. already connected. 
      if (creaseFlag) {  // special case of creasing
         let currentOut = hIn.next;
         const endIn = currentOut.pair.next.pair;
         if (extrudeIn.has(endIn))  { // yes the special pair
            if ((currentOut.face.numberOfVertex > 3) && (currentOut.pair.face.numberOfVertex > 3)) {  // could not do diagonal with triangle.
               // check if we have to splitEdge because we share the edge with other selected edge.
               if (extrudeIn.has(currentOut.next.pair) && extrudeOut.has(currentOut.pair.prev().pair)) {
                  vec3.lerp(pt, currentOut.origin.vertex, currentOut.destination().vertex, 0.5);
                  let newOut = this.geometry.splitEdge(currentOut, pt);
                  liftEdges.push(newOut.pair);
                  currentOut = newOut;
               }
               // insert diagonal edge.
               let diagonalOut = this.geometry.insertEdge(currentOut, hIn);
               collapsibleWings.add(diagonalOut.wingedEdge);
               // slide currentOut Edge to diagonal.
               this.geometry.slideToNext(currentOut.pair);  // will collapse back, due to edge's contraction.
               continue;   // done th end cap
            }
         }
      }
      do {
         hIn = hIn.next.pair;   // move to next In
         if (extrudeIn.has(hIn)) {  // just connect, then exit
            let connect = this.geometry.insertEdge(hIn.pair, hOut.pair);
            collapsibleWings.add(connect.wingedEdge);
            break;
         } else { // split edge and connect
            vec3.lerp(pt, hIn.destination().vertex, hIn.origin.vertex, 0.2);
            let newOut = this.geometry.splitEdge(hIn.pair, pt);
            hIn = newOut.pair;
            liftEdges.push( hIn );
            let connect = this.geometry.insertEdge(newOut, hOut.pair);
            collapsibleWings.add(connect.wingedEdge);
         }
         hOut = hIn.pair;  // move to current
      } while (true);   // walk until we hit the other pair
   }
   
   this._updatePreviewAll(oldSize, this.geometry.affected);

   return {collapsibleWings: collapsibleWings, liftEdges: liftEdges};
};
PreviewCage.prototype.undoExtrudeEdge = function(extrude) {
   const oldSize = this._getGeometrySize();

   if (extrude.dissolveEdges) {
      for (let hEdge of extrude.dissolveEdges) {
         if (hEdge.wingedEdge.isLive()) {
            this.geometry.dissolveEdge(hEdge, extrude.collapsibleWings);
         }
      }
   }

   for (let hEdge of extrude.liftEdges) {
      this.geometry.collapseEdge(hEdge, extrude.collapsibleWings);
   }
 
   this._updatePreviewAll(oldSize, this.geometry.affected);
};


//
// extrudeVertex - add 1/4 vertex to every edge then connect all together.
PreviewCage.prototype.extrudeVertex = function() {
   const oldSize = this._getGeometrySize();

   const splitEdges = [];
   const extrudeLoops = [];
   const pt = vec3.create();
   for (let vertex of this.selectedSet) {
      let firstHalf;
      let prevHalf = null;
      let hEdge = vertex.outEdge;
      do {
         vec3.lerp(pt, hEdge.origin.vertex, hEdge.destination().vertex, 0.25);
         let newOut = this.geometry.splitEdge(hEdge, pt);   // pt is the split point.
         splitEdges.push( newOut );
         hEdge = newOut.pair.next;                          // move to next
         // connect vertex
         if (prevHalf) {
            let outConnect = this.geometry.insertEdge(prevHalf, newOut.next);
            extrudeLoops.push( outConnect );
            prevHalf = outConnect.next.pair;
         } else {
            firstHalf = newOut;   // remember to save the first one
            prevHalf = newOut.next.pair;
         }
      } while (hEdge !== firstHalf);   // firstHalf is the new vertex.outEdge;
      // connect last to first loop.
      let outConnect = this.geometry.insertEdge(prevHalf, firstHalf.next);
      extrudeLoops.push( outConnect );
   }

   this._updatePreviewAll(oldSize, this.geometry.affected);

   return {insertEdges: extrudeLoops, splitEdges: splitEdges};
};
PreviewCage.prototype.undoExtrudeVertex = function(extrude) {
   const oldSize = this._getGeometrySize();

   for (let hEdge of extrude.insertEdges) {
      this.geometry.removeEdge(hEdge.pair);
   }
   for (let hEdge of extrude.splitEdges) {
      this.geometry.collapseEdge(hEdge.pair);
   }
 
   this._updatePreviewAll(oldSize, this.geometry.affected);
}


//
// extrudeFace - will create a list of 
PreviewCage.prototype.extrudeFace = function(contours) {
   const oldSize = this._getGeometrySize();
   // array of edgeLoop. 
   if (!contours) {
      contours = {};
      contours.edgeLoops = __WEBPACK_IMPORTED_MODULE_2__wings3d_wingededge__["WingedTopology"].findContours(this.selectedSet); 
   }
   contours.edgeLoops = this.geometry.liftContours(contours.edgeLoops);
   contours.extrudeEdges = this.geometry.extrudeContours(contours.edgeLoops);
   //const edgeLoops = this.geometry.extrudePolygon(this.selectedSet);
   // add the new Faces. and new vertices to the preview
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // reselect face
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      this.selectFace(polygon);
   }

   return contours; //edgeLoops;
};


// collapse list of edges
PreviewCage.prototype.collapseExtrudeEdge = function(undo) {
   const edges = undo.extrudeEdges;
   const affectedPolygon = new Set;
   const oldSize = this._getGeometrySize();
   for (let edge of edges) {
      edge.origin.eachOutEdge( function(edge) {
         affectedPolygon.add(edge.face);
      });
      this.geometry.collapseEdge(edge);
   }
   // recompute the smaller size
   this._updatePreviewAll(oldSize,  this.geometry.affected);
   // reselect face
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      this.selectFace(polygon);
   }

   // update all affected polygon(use sphere). recompute centroid.
   for (let polygon of affectedPolygon) {
      if (polygon.isLive()) {
         const sphere = this.bench.boundingSpheres[polygon.index];
         // recompute sphere center.
         sphere.setSphere( __WEBPACK_IMPORTED_MODULE_1__wings3d_boundingvolume__["BoundingSphere"].computeSphere(polygon, sphere.center) );
      }
   }
   // done, update shader data, should we update each vertex individually?
   this.bench.updateCentroid();
};

//
// selectable polygon - find exterior edges loop of selected polygon
//
PreviewCage.prototype.findExtFaceContours = function() {
   const contourEdges = new Set;
   const cornerFaces = new Set;
   const edgeLoops = [];
   // find all contourEdges to extrude
   for (let polygon of this.selectedSet) {
      for (let outEdge of polygon.hEdges()) {
         let extEdge = outEdge.pair;
         if (!contourEdges.has(extEdge) && !this.selectedSet.has(extEdge.face)) {   // yes, this exterior edge has not been processed yet
            const edgeLoop = [];
            let current = extEdge;
            do {
               edgeLoop.push( current );
               contourEdges.add(current);       // checkIn the contour edge.
               let corner = true;
               while (!this.selectedSet.has(current.next.pair.face)) {  // walk to the next exterior edge
                  current = current.next.pair;
                  corner = false;
               }
               if (corner) {
                  cornerFaces.add(current.face);
               }
               current = current.next;          // the next exterior Edge
            } while (current !== extEdge);      // check if we come full circle
            edgeLoops.push( edgeLoop );
         }
      }
   }

   return {contourLoops: edgeLoops, cornerFaces: cornerFaces};
};


PreviewCage.prototype.bumpFace = function() {
   const oldSize = this._getGeometrySize();

   // find contourEdge
   const result = this.findExtFaceContours();
   const contours = result.contourLoops;

   const pt = vec3.create();
   const cornerFaces = new Map;
   let collapsibleWings = new Set;
   let dissolveEdges = new Set;
   let liftEdges = new Set;
   let self = this;
   function bumpEdge(next, prev) {
      let connectOut = self.geometry.insertEdge(next, prev);
      collapsibleWings.add(connectOut.wingedEdge);
      dissolveEdges.add(connectOut.pair); // make sure it gone.
   };
   // split and connect the exterior edges.
   for (let loop of contours) {
      let firstLift = null;
      let prevLift = null;
      let prevH = loop[loop.length-1]; // get the last exterior edge
      for (let hEdge of loop) {
         let current = prevH.next;
         if (current !== hEdge) {   // skip corner
            do {  // at lease one splitEdge
               let splitOut = current;
               if (collapsibleWings.has(current.next.wingedEdge) || liftEdges.has(current.next)) {  // yep, already split,
                  // check if neighbor face already bump it
                  if (prevLift) {
                     if (current.next.next !== prevLift) {  // no, not bump yet.
                        bumpEdge(splitOut, prevLift);
                     }
                  } else if (firstLift === null) { // first time through
                     firstLift = current;
                  } else { // exit cornerFace
                     const fans = cornerFaces.get(current.face);
                     fans.add(current);
                  }
               } else { // split edge, and connect to prevLift
                  vec3.lerp(pt, current.origin.vertex, current.destination().vertex, 0.5);
                  splitOut = this.geometry.splitEdge(current, pt);   // pt is the split point.
                  liftEdges.add(splitOut.pair);
                  if (prevLift) {   // connect to prevLift
                     bumpEdge(splitOut, prevLift);
                  } else if (firstLift === null) { // first time through
                     firstLift = splitOut;
                  } else { // exit cornerFace
                     const fans = cornerFaces.get(splitOut.face);
                     fans.add(splitOut);
                  }
               }

               prevLift = splitOut.pair;
               current = splitOut.pair.next;
            } while (current !== hEdge);
         } else { // inner corner, reset prevLift
            if (!cornerFaces.has(current.face)) {
               cornerFaces.set(current.face, new Set);
            }
            const fans = cornerFaces.get(current.face);
            if (prevLift) {
               fans.add( prevLift.prev() );
               prevLift = null;
            }
            fans.add( prevH );   // all inEdge.
            if (firstLift === null) {  // firstLift is a corner, so no worry. undefined it
               firstLift = undefined;
            }
         }
         prevH = hEdge;
      }
      if (prevLift) {
         if (cornerFaces.has(prevLift.face)) {
            const fans = cornerFaces.get(prevLift.face);
            fans.add( prevLift.prev() );
         }

         if (firstLift && (firstLift.next.next !== prevLift)) {   // no bumped by other loop
            // connect last to first.
            bumpEdge(firstLift, prevLift);
         }
      }
   }
   // now do polygon fans on the cornerFace.
   for (let [polygon, fans] of cornerFaces) {   // fan is error
      const fan = this.geometry.insertFan(polygon, fans);
      // add fan to dissolveEdges, and collapsibleWings
      //liftEdges.add(liftEdge);
      //collapsibleWings.add(liftEdge.wingedEdge);
      for (let hEdge of fan) {
         collapsibleWings.add(hEdge.wingedEdge);
         dissolveEdges.add(hEdge);
      }
   }

 
   this._updatePreviewAll(oldSize, this.geometry.affected);

   return {liftEdges: liftEdges, collapsibleWings: collapsibleWings, dissolveEdges: dissolveEdges};
};


PreviewCage.prototype.cutEdge = function(numberOfSegments) {
   const edges = this.selectedSet;

   const oldSize = this._getGeometrySize();
   const vertices = [];
   const splitEdges = [];              // added edges list
   // cut edge by numberOfCuts
   let diff = vec3.create();
   let vertex = vec3.create();
   for (let wingedEdge of edges) {
      let edge = wingedEdge.left;
      vec3.sub(diff, edge.origin.vertex, edge.destination().vertex); // todo: we could use vec3.lerp?
      for (let i = 1; i < numberOfSegments; ++i) {
         const scaler = (numberOfSegments-i)/numberOfSegments;
         vec3.scale(vertex, diff, scaler);                  
         vec3.add(vertex, edge.destination().vertex, vertex);
         const newEdge = this.geometry.splitEdge(edge, vertex);       // input edge will take the new vertex as origin.
         vertices.push( edge.origin );
         splitEdges.push( newEdge.pair );
      }
      // update previewEdge position.
      //this._updatePreviewEdge(edge, true);
   }
      // after deletion of faces and edges. update
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // returns created vertices.
   return {vertices: vertices, halfEdges: splitEdges};
};

// collapse list of edges, pair with CutEdge, bevelEdge.
PreviewCage.prototype.collapseSplitOrBevelEdge = function(collapse) {
   const oldSize = this._getGeometrySize();
   for (let halfEdge of collapse.halfEdges) {
      if (halfEdge.wingedEdge.isLive()) { // checked for already collapse edge
         this.geometry.collapseEdge(halfEdge, collapse.collapsibleWings);
      }
   }
   // recompute the smaller size
   this._updatePreviewAll(oldSize, this.geometry.affected);
};


// connect selected Vertex,
PreviewCage.prototype.connectVertex = function() {
   const oldSize = this._getGeometrySize();
   
   //this.geometry.clearAffected();
   const edgeList = this.geometry.connectVertex(this.selectedSet);
   const wingedEdgeList = [];
   for (let edge of edgeList) {
      wingedEdgeList.push( edge.wingedEdge );
   }

   // updatePreviewbox
   this._updatePreviewAll(oldSize, this.geometry.affected);

   return {halfEdges: edgeList, wingedEdges: wingedEdgeList};
};
// pair with connectVertex.
PreviewCage.prototype.dissolveConnect = function(connect) {
   const insertEdges = connect.halfEdges;
   const oldSize = this._getGeometrySize();

   // dissolve in reverse direction
   for (let i = insertEdges.length-1; i >= 0; --i) {
      const halfEdge = insertEdges[i];
      this.geometry.removeEdge(halfEdge.pair);
   }

   this._updatePreviewAll(oldSize, this.geometry.affected);
};


//
PreviewCage.prototype.dissolveSelectedEdge = function() {
   const dissolveEdges = [];
   const oldSize = this._getGeometrySize();
   for (let edge of this.selectedSet) {
      let undo = this.geometry.dissolveEdge(edge.left);
      let dissolve = { halfEdge: edge.left, undo: undo};
      dissolveEdges.push(dissolve);
   }
   this.selectedSet.clear();
   // after deletion of faces and edges. update
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // return affected.
   return dissolveEdges;
};
PreviewCage.prototype.reinsertDissolveEdge = function(dissolveEdges) {
   const oldSize = this._getGeometrySize();
   // walk form last to first.
   for (let i = (dissolveEdges.length-1); i >= 0; --i) {
      let dissolve = dissolveEdges[i];
      this.geometry.restoreDissolveEdge(dissolve.undo);
      this.selectEdge(dissolve.halfEdge);
   }
   this._updatePreviewAll(oldSize, this.geometry.affected);
};


PreviewCage.prototype.collapseSelectedEdge = function() {
   const restoreVertex = [];
   const collapseEdges = [];
   const oldSize = this._getGeometrySize();
   const selected = new Map();
   for (let edge of this.selectedSet) {
      let undo = null;
      if (edge.isLive()){
      let vertex = edge.left.origin;
      let pt;
      if (selected.has(vertex)) {
         pt = selected.get(vertex);    
         selected.delete(vertex);   // going to be freed, so we can safely remove it.
         vec3.add(pt.pt, pt.pt, vertex.vertex);
         pt.count++;
      } else {
         pt = {pt: new Float32Array(3), count: 1};
         vec3.copy(pt.pt, vertex.vertex);
      }
      let keep = edge.right.origin;
      if (selected.has(keep)) {
         const keepPt = selected.get(keep);
         vec3.add(keepPt.pt, pt.pt, keepPt.pt);
         keepPt.count += pt.count;
      } else {
         selected.set(keep, pt);
      }
         undo = this.geometry.collapseEdge(edge.left);
      }
      let collapse = {halfEdge: edge.left, undo: undo};
      collapseEdges.push(collapse);
   }
   this.selectedSet.clear();

   // the selected is the remaining Vertex
   const selectedVertex = [];
   for (let [vertex, pt] of selected) {
      selectedVertex.push( vertex );
      // save and move the position
      const savePt = new Float32Array(3);
      vec3.copy(savePt, vertex.vertex);
      restoreVertex.push({vertex: vertex, savePt: savePt});
      vec3.add(pt.pt, pt.pt, savePt);
      vec3.scale(pt.pt, pt.pt, 1.0/(pt.count+1)); 
      vec3.copy(vertex.vertex, pt.pt);
      this.geometry.addAffectedEdgeAndFace(vertex);
   }
   // after deletion of
   this._updatePreviewAll(oldSize, this.geometry.affected);
   return { collapse: {edges: collapseEdges, vertices: restoreVertex}, vertices: selectedVertex };
};

PreviewCage.prototype.restoreCollapseEdge = function(data) {
   const collapse = data.collapse;
   const oldSize = this._getGeometrySize();
   // walk form last to first.
   this.selectedSet.clear();

   const collapseEdges = collapse.edges;
   for (let i = (collapseEdges.length-1); i >= 0; --i) {
      let collapseEdge = collapseEdges[i];
      if (collapseEdge.undo) {
         this.geometry.restoreCollapseEdge(collapseEdge.undo);
      }
   }
   for (let collapseEdge of collapseEdges) { // selectedge should be in order
      this.selectEdge(collapseEdge.halfEdge);
   }
   const restoreVertex = collapse.vertices;
   for (let restore of restoreVertex) {   // restore position
      vec3.copy(restore.vertex.vertex, restore.savePt);
      this.geometry.addAffectedEdgeAndFace(restore.vertex);
   }
   // 
   this._updatePreviewAll(oldSize, this.geometry.affected);
};


PreviewCage.prototype.dissolveSelectedFace = function() {
   const oldSize = this._getGeometrySize();
   const selectedEdges = new Set;
   // the all the selectedFace's edge.
   for (let polygon of this.selectedSet) {
      polygon.eachEdge( function(outEdge) {
         selectedEdges.add(outEdge.wingedEdge);
      });
   }
   // get the outline edge
   const contourLoops = __WEBPACK_IMPORTED_MODULE_2__wings3d_wingededge__["WingedTopology"].findContours(this.selectedSet);
   // subtract outline edges from all selected edge.
   for (let loop of contourLoops) {
      for (let edge of loop) {
         let outEdge = edge.outer;
         if (selectedEdges.has(outEdge.wingedEdge)) {
            selectedEdges.delete(outEdge.wingedEdge);
         }
      }
   }
   // the reemaining edges is the remove Edge.
   const substract = [];
   for (let edge of selectedEdges) {
      substract.unshift( this.geometry.dissolveEdge(edge.left) );   // add in reverse order
   }
   // update the remaining selectedSet.
   const selectedFace = this.selectedSet;
   const selectedSet = new Set;
   for (let polygon of this.selectedSet) {
      if (polygon.isLive()) {
         selectedSet.add(polygon);
      }
   }
   this.selectedSet = selectedSet;
   // update previewBox.
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // return undo function
   return {edges: substract, selection: selectedFace};
};
PreviewCage.prototype.undoDissolveFace = function(dissolve) {
   const oldSize = this._getGeometrySize();
   for (let dissolveUndo of dissolve.edges) {
      dissolveUndo();
   }
   this.selectedSet.clear();
   // reselected the polygon in order.
   for (let polygon of dissolve.selection) {
      this.selectFace(polygon);
   }
   // update previewBox.
   this._updatePreviewAll(oldSize, this.geometry.affected);
}


// the original wings3D collapse quite strangely. collapse by edge index order? such a weird algorithm.
// we change it to collapse to middle.
PreviewCage.prototype.collapseSelectedFace = function() {
   const saveSet = this.selectedSet;
   // reuse edgeSelect().
   this.changeFromFaceToEdgeSelect();
   // reuse collapseEdge
   const collapse = this.collapseSelectedEdge();
   collapse.selectedFaces = saveSet;
   return collapse;
};
PreviewCage.prototype.undoCollapseFace = function(collapse) {
   this.restoreCollapseEdge(collapse);
};


PreviewCage.prototype.dissolveSelectedVertex = function() {
   const oldSize = this._getGeometrySize();
   const undoArray = {array: [], selectedFaces: []};
   for (let vertex of this.selectedSet) {
      let result = this.geometry.dissolveVertex(vertex);
      undoArray.array.unshift( result );
      undoArray.selectedFaces.push( result.polygon );
   }
   this._resetSelectVertex();
   // update previewBox.
   this._updatePreviewAll(oldSize, this.geometry.affected);
   return undoArray;
};
PreviewCage.prototype.undoDissolveVertex = function(undoArray) {
   const oldSize = this._getGeometrySize();
   for (let undo of undoArray.array) {
      this.geometry.restoreDissolveVertex(undo);
      this.selectVertex(undo.vertex);
   }
   // update previewBox.
   this._updatePreviewAll(oldSize, this.geometry.affected);
};


// Bevelling of edge.
PreviewCage.prototype.bevelEdge = function() {
   const oldSize = this._getGeometrySize();
   const wingedEdges = this.selectedSet;

   // bevelEdge
   const result = this.geometry.bevelEdge(wingedEdges);       // input edge will take the new vertex as origin.
   // get all effected wingedEdge
   result.wingedEdges = new Set;
   result.faces = new Set;
   for (let vertex of result.vertices) {
      for (let hEdge of vertex.edgeRing()) {
         result.wingedEdges.add( hEdge.wingedEdge );
         result.faces.add( hEdge.face );
      }
   };

   // add the new Faces, new edges and new vertices to the preview
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // update vertices created vertices.
   return result;
   //let ret = {
   //   faces: [],
   //   vertices: [],
   //   wingedEdge: new set,
   //   halfEdges: [],
   //   position: float32array,
   //   direction: float32array,
   //   vertexLimit: magnitude,
   //};
};
// 
// bevel face, same as edge but with differnt hilite faces
//
PreviewCage.prototype.bevelFace = function() {
   const oldSize = this._getGeometrySize();
   const faces = this.selectedSet;

   let wingedEdges = new Set;
   for (let polygon of faces) {  // select all polygon's edges
      for (let hEdge of polygon.hEdges()) {
         wingedEdges.add( hEdge.wingedEdge );
      }
   }
   // bevelEdge
   const result = this.geometry.bevelEdge(wingedEdges);       // input edge will take the new vertex as origin.
   // get all effected wingedEdge
   result.wingedEdges = new Set;
   result.faces = new Set;
   for (let vertex of result.vertices) {
      for (let hEdge of vertex.edgeRing()) {
         result.wingedEdges.add( hEdge.wingedEdge );
         result.faces.add( hEdge.face );
      }
   };

   // add the new Faces, new edges and new vertices to the preview
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // reselect faces again. because polygon's edges were changed.
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      this.selectFace(polygon);
   }

   return result;
};
//
// bevel vertex
//
PreviewCage.prototype.bevelVertex = function() {
   const oldSize = this._getGeometrySize();
   const vertices = this.selectedSet;

   // bevelVertex
   const result = this.geometry.bevelVertex(vertices);       // input vertices, out new vertex, edges, and faces.
   // get all effected wingedEdge
   result.wingedEdges = new Set;
   result.faces = new Set;
   for (let vertex of result.vertices) {
      for (let hEdge of vertex.edgeRing()) {
         result.wingedEdges.add( hEdge.wingedEdge );
         result.faces.add( hEdge.face );
      }
   };

   // add the new Faces, new edges and new vertices to the preview
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // update vertices created vertices.
   return result;
   //let ret = {
   //   faces: [],
   //   vertices: [],
   //   wingedEdge: new set,
   //   halfEdges: [],
   //   position: float32array,
   //   direction: float32array,
   //   vertexLimit: magnitude,
   //};
};

//
// iterated through selectedEdge, and expand it along the edges, edge loop only possible on 4 edges vertex
//
PreviewCage.prototype.edgeLoop = function(nth) {
   let count = 0;
   const selection = new Set(this.selectedSet);
   const ret = [];
   for (let wingedEdge of selection) {
      // walk forward, then backward.
      for (let hEdge of wingedEdge) {
         const end = hEdge;
         // walking along the loop
         while (hEdge = hEdge.next.pair.next) { // next edge
            if (this.selectedSet.has(hEdge.wingedEdge) || (hEdge.destination().numberOfEdge() !== 4) ) {
               break;   // already at end, or non-4 edge vertex.
            }
            ++count;
            if ((count % nth) === 0) {
               this.selectEdge(hEdge);
               ret.push(hEdge);
            }
         }
      }
   }
   return ret;
};

//
// iterated through selectedEdge, and expand it along 2 side of loop, edge Ring only possible on 4 edges face
//
PreviewCage.prototype.edgeRing = function(nth) {
   let count = 0;
   const selection = new Set(this.selectedSet);
   const ret = [];
   for (let wingedEdge of selection) {
      // walk forward, then backward.
      for (let hEdge of wingedEdge) {
         const end = hEdge;
         // walking along the loop
         while (hEdge = hEdge.pair.next.next) { // next edge
            if (this.selectedSet.has(hEdge.wingedEdge) || (hEdge.next.next.next.next !== hEdge) ) {
               break;   // already at end, or non-4 edge face.
            }
            ++count;
            if ((count % nth) === 0) {
               this.selectEdge(hEdge);
               ret.push(hEdge);
            }
         }
      }
   }
   return ret;
};

// bridge, and unbridge
PreviewCage.prototype.bridge = function(targetFace, sourceFace) {
   if (this.selectedSet.size === 2) {  // make sure. it really target, source
      const oldSize = this._getGeometrySize();

      const targetSphere = this.bench.boundingSpheres[targetFace.index];
      const sourceSphere = this.bench.boundingSpheres[sourceFace.index];
      const deltaCenter = vec3.create();
      //vec3.sub(deltaCenter, targetSphere.center, sourceSphere.center);   // what if we don't move the center, would it work better? so far, no
      const result = this.geometry.bridgeFace(targetFace, sourceFace, deltaCenter);
      // clear selection
      result.selectedFaces = this.selectedSet;
      this._resetSelectFace();


      // update previewBox.
      this._updatePreviewAll(oldSize, this.geometry.affected);  
      return result;
   }
   // should not happened, throw?
   return null;
};
PreviewCage.prototype.undoBridge = function(bridge) {
   if (bridge) {
      const oldSize = this._getGeometrySize();

      this.geometry.undoBridgeFace(bridge);

      // update previewBox.
      this._updatePreviewAll(oldSize, this.geometry.affected);  
   }
};

// 
// Inset face, reuse extrude face code.
//
PreviewCage.prototype.insetFace = function() {
   const oldSize = this._getGeometrySize();

   // array of edgeLoop.
   const contours = {};
   contours.edgeLoops = this.geometry.findInsetContours(this.selectedSet); 
   
   contours.edgeLoops = this.geometry.liftContours(contours.edgeLoops);
   contours.extrudeEdges = this.geometry.extrudeContours(contours.edgeLoops);
   // now get all the effected vertices, and moving direction.
   let vertexCount = 0;
   for (let polygon of this.selectedSet) {
      vertexCount += polygon.numberOfVertex;
   }
   // compute direction, and moveLimit.
   contours.vertices = [];
   contours.faces = new Set;
   contours.wingedEdges = new Set;
   contours.position = new Float32Array(vertexCount*3);     // saved the original position
   contours.direction = new Float32Array(vertexCount*3);    // also add direction.
   contours.vertexLimit = Number.MAX_SAFE_INTEGER;  // really should call moveLimit.
   let count = 0;
   for (let polygon of this.selectedSet) {
      let prev = null;
      contours.faces.add(polygon);
      for (let hEdge of polygon.hEdges()) {
         contours.vertices.push(hEdge.origin);
         contours.faces.add(hEdge.pair.face);
         contours.wingedEdges.add( hEdge.wingedEdge );
         contours.wingedEdges.add( hEdge.pair.next.wingedEdge );  // the extrude edge 
         let position = contours.position.subarray(count, count+3);
         let direction = contours.direction.subarray(count, count+3);
         count += 3;
         vec3.copy(position, hEdge.origin.vertex);
         if (!prev) {
            prev = hEdge.prev();
         }
         vec3.scale(direction, hEdge.destination().vertex, 1.0/2);            // compute the sliding middle point
         vec3.scaleAndAdd(direction, direction, prev.origin.vertex, 1.0/2);
         vec3.sub(direction, direction, hEdge.origin.vertex);
         // get length and normalized.
         const len = vec3.length(direction);
         if (len < contours.vertexLimit) {
            contours.vertexLimit = len;
         }
         vec3.normalize(direction, direction);
         // 
         prev = hEdge;
      }
   }

   // add the new Faces. and new vertices to the preview
   this._updatePreviewAll(oldSize, this.geometry.affected);
   // reselect face, or it won't show up. a limitation.
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      this.selectFace(polygon);
   }


   return contours;
};

PreviewCage.prototype.invertBody = function() {
   this.geometry.invert();
};

PreviewCage.prototype.flipBodyAxis = function(pivot, axis) {
   // first flip, then invert.
   this.geometry.flip(pivot, axis);
   this.geometry.invert();
};

// todo: current implementation is wrong. we should not average vertex, instead we should average using area of polygon
PreviewCage.prototype.bodyCentroid = function() {
   // 
   const pt = vec3.create();
   let count = 0;
   for (let vertex of this.geometry.vertices) {
      vec3.add(pt, pt, vertex.vertex);
      ++count;
   }
   if (count > 0) {
      vec3.scale(pt, pt, 1/count);
   }
   return pt;
};

PreviewCage.prototype.weldableVertex = function(vertex) {
   if (this.selectedSet.size == 1) {
      let it = this.selectedSet.values();
      let selectedVertex = it.next().value;     // get the selectedVertex
      const end = selectedVertex.outEdge;
      let current = end;
      do {
         if (current.destination() === vertex) {
            return current;
         }
         current = current.pair.next;
      } while (current !== end);
   }
   return false;
};

PreviewCage.prototype.weldVertex = function(halfEdge) {
   this.selectVertex(halfEdge.origin);
   this.selectVertex(halfEdge.destination());   // select the weld Vertex as new Selection.
   let ret = this.geometry.collapseEdge(halfEdge);
   this._updatePreviewAll();
   return ret;
};

PreviewCage.prototype.undoWeldVertex = function(undo) {
   this.geometry.restoreCollapseEdge(undo);
   this.selectVertex(undo.hEdge.destination())  // unselect
   this.selectVertex(undo.hEdge.origin);
   this._updatePreviewAll();
};


PreviewCage.prototype.intrudeFace = function() {
   const ret = {};
   if (this.selectedSet.size == 0) {
      return ret;   // no hole to intrude through.
   }

   // first merge adjacent faces
   ret.dissolve = this.dissolveSelectedFace();

   // duplicate connectivity info(invert), and vertex
   const uniqueVertex = new Map;
   const addVertex = (vertex) => {
      let pt = uniqueVertex.get(vertex);
      if (!pt) {
         pt = this.geometry.addVertex(vertex.vertex);
         uniqueVertex.set(vertex, pt);
      }
      return pt.index;
   };
   const newPolygons = [];
   const connectLoops = [];
   const originalFaces = Array.from(this.geometry.faces);
   for (let polygon of originalFaces) {
      const ptsLoop = [];
      for (let hEdge of polygon.hEdges()) {
         ptsLoop.push( addVertex(hEdge.origin) );
      }
      if (this.selectedSet.has(polygon)) {   // save hole's connect loop.
         let i = 0;
         let lastFront, lastBack;
         for (let hEdge of polygon.hEdges()) {
            const currentF = hEdge.origin.index;
            const currentB = ptsLoop[i];
            if (i > 0) {
               connectLoops.push( [lastFront, currentF, currentB, lastBack] );
            }
            ++i;
            lastFront = currentF;
            lastBack = currentB;
         }
         // add the last loop
         connectLoops.push( [lastFront, polygon.halfEdge.origin.index, ptsLoop[0], lastBack]);
      } else { // add the invert polygon.
         ptsLoop.reverse();
         newPolygons.push( this.geometry.addPolygon(ptsLoop) );
      }
   }

   // now holed the remaining selected Face
   this._updatePreviewAll();  // temp Fix: needs to update Preview before holeSelectedFace
   ret.holed = this.holeSelectedFace();
   // select all newly created polygon
   for (let polygon of newPolygons) {
      this.selectFace(polygon);
   }
   ret.invert = newPolygons;

   // connect to the front polygons.
   ret.connect = [];
   for (let loop of connectLoops) {
      ret.connect.push( this.geometry.addPolygon(loop) );
   }

   this._updatePreviewAll();
   // return restoration params.
   return ret;
};

PreviewCage.prototype.undoIntrudeFace = function(intrude) {
   for (let polygon of intrude.connect) { // first remove the connect face
      this.geometry.makeHole(polygon);
   }

   // now deselect inverts, and remove all polygon' and it edges and vertex
   for (let polygon of intrude.invert) {
      this.selectFace(polygon);
   }
   const wEdges = new Set();
   for (let polygon of intrude.invert) {
      for (let hEdge of polygon.hEdges()) {
         this.geometry._freeVertex(hEdge.origin);
         wEdges.add( hEdge.wingedEdge );
      }
      this.geometry._freePolygon(polygon);
   }
   for (let wEdge of wEdges) {
      this.geometry._freeEdge(wEdge.left);
   }

   // now restore hole facce
   this.undoHoleSelectedFace(intrude.holed);

   // undo merge face
   this.undoDissolveFace(intrude.dissolve);
};


PreviewCage.prototype.holeSelectedFace = function() {
   // remove the selected Face, and free it.
   const holes = new Set(this.selectedSet);
   const ret = [];
   for (let polygon of holes) {
      this.selectFace(polygon);
      ret.push( this.geometry.makeHole(polygon) );
   }

   return ret;
};
PreviewCage.prototype.undoHoleSelectedFace = function(holes) {
   for (let hole of holes) {
      const polygon = this.geometry.undoHole(hole);
      this.selectFace(polygon);
   }
};


// edgeMode - cut out selected contours.
PreviewCage.prototype.loopCut = function() {
   const allFaces = new Set(this.geometry.faces);
   let partition;

   const partitionFace = (polygon) => {
      partition.add(polygon);
      allFaces.delete(polygon);
      for (let hEdge of polygon.hEdges()) {
         if (!this.selectedSet.has(hEdge.wingedEdge) && allFaces.has(hEdge.pair.face)) {
            partitionFace(hEdge.pair.face);
         }
      }      
   };

   let partitionGroup = [];
   for (let wEdge of this.selectedSet) {
      for (let hEdge of wEdge) {
         if (allFaces.has(hEdge.face)) {
            partition = new Set;
            partitionFace(hEdge.face);
            // go the partition, now save it
            partitionGroup.push( partition );
         }
      }
   }

   if (partitionGroup.length < 2) {   // make sure, there is at least 2 partition.
      geometryStatus("less than 2 partitions");
      return false;
   }

   // we have to separate from smallest to largest, so that separation can gel into single face correctly.
   partitionGroup = partitionGroup.sort((a,b) => { return a.size - b.size;});
   // reset selected set
   const selected = new Set(this.selectedSet);
   for (let wEdge of selected) {
      this.selectEdge(wEdge.left);
   }

   const ret = {separateCages: [], fillFaces: [], contourLoops: [], selectedSet: selected};
   const fillFaces = new Set;
   // detach smaller groups from the largest, by finding the contour.
   for (let i = 0; i < partitionGroup.length; ++i) {
      const partition = partitionGroup[i];
      let newFills = [];
      let separate = this;
      if (i !== (partitionGroup.length-1)) { 
         let contours = __WEBPACK_IMPORTED_MODULE_2__wings3d_wingededge__["WingedTopology"].findContours(partition); // detach faceGroups from main
         for (let edgeLoop of contours) {
            if ((edgeLoop.length > 0) && !fillFaces.has(edgeLoop[0].outer.face)) { // not already separated.
               this.geometry.liftContour(edgeLoop);
               const fillFace = this.geometry._createPolygon(edgeLoop[0].outer, edgeLoop.size); // fill hole.
               newFills.push(fillFace);
               separate = this.detachFace(partition, i);
               ret.contourLoops.push( edgeLoop );
            }
         }
      }
      // merge/delete add fillFaces
      for (let polygon of fillFaces) {
         if (separate.geometry.faces.has(polygon)) {
            separate.selectedSet.add(polygon);
            fillFaces.delete(polygon);
         }
      }
      separate.dissolveSelectedFace(); // merge if possible.
      ret.fillFaces = ret.fillFaces.concat( Array.from(separate.selectedSet) );
      separate.selectedSet = new Set;
      for (let polygon of newFills) {  // newFills should be always 0th, or 1th length. 
         fillFaces.add(polygon);
      }

      // separation will be selected.
      if (separate !== this) {
         ret.separateCages.push( separate );
      }
   }

   return ret;
};

PreviewCage.prototype.undoLoopCut = function(undo) {
   // merge back to this
   this.merge(undo.separateCages);

   // remove fillFaces
   for (let polygon of undo.fillFaces) {
      this.geometry.removePolygon(polygon);
   }

   // weldContour back
   for (let edgeLoop of undo.contourLoops) {
      this.geometry.weldContour(edgeLoop);
   }

   // reSelect edges.
   for (let wEdge of undo.selectedSet) {
      this.selectEdge(wEdge.left);
   }
};


// the real workhorse.
PreviewCage.prototype._putOn = function(target) {
   let fromFace = this.selectedSet.values().next().value; // must be true

   const center = this.bench.boundingSpheres[fromFace.index].center;
   const normal = vec3.create();
   vec3.copy(normal, fromFace.normal);
   vec3.negate(normal, normal);

   const rotAxis = mat4.create();
   __WEBPACK_IMPORTED_MODULE_6__wings3d_util__["rotationFromToVec3"](rotAxis, normal, target.normal);
   
   const transform = mat4.create();
   mat4.fromTranslation(transform, target.center);
   mat4.mul(transform, transform, rotAxis);
   vec3.negate(center, center);
   const centerTransform = mat4.create();
   mat4.fromTranslation(centerTransform, center);
   mat4.mul(transform, transform, centerTransform);

   // now transform all vertex
   for (let vertex of this.geometry.vertices) {
      vec3.transformMat4(vertex.vertex, vertex.vertex, transform);
      this.geometry.addAffectedVertex(vertex);
      this.geometry.addAffectedEdgeAndFace(vertex);
   }
   // now transform all normal
   for (let face of this.geometry.faces) {
      vec3.transformMat4(face.normal, face.normal, rotAxis);
   }

   this._updatePreviewAll();
};


PreviewCage.prototype.putOnVertex = function(vertex) {
   const normal = vec3.create();
   vertex.getNormal(normal);

   this._putOn({normal: normal, center: vertex.vertex});
};

PreviewCage.prototype.putOnEdge = function(hEdge) {
   const normal = vec3.create();
   hEdge.wingedEdge.getNormal(normal);
   const center = vec3.create();
   vec3.add(center, hEdge.origin.vertex, hEdge.destination().vertex);
   vec3.scale(center, center, 0.5);

   this._putOn({normal: normal, center: center});
};

PreviewCage.prototype.putOnFace = function(polygon) {
   const normal = polygon.normal;
   const center = this.bench.boundingSpheres[polygon.index].center;
   
   this._putOn({normal:normal, center: center});
};


PreviewCage.prototype.getSelectedFaceContours = function() {
   let contours = {};
   contours.edgeLoops = __WEBPACK_IMPORTED_MODULE_2__wings3d_wingededge__["WingedTopology"].findContours(this.selectedSet);

   contours.edges = new Set;
   // copy to a set, so searching is easier.
   for (let edgeLoop of contours.edgeLoops) {
      for (let edge of edgeLoop) {
         contours.edges.add(edge.outer.wingedEdge);
      }
   }

   return contours;
};

PreviewCage.prototype.liftFace = function(contours, hingeHEdge) {
   // extrude edges
   contours.edgeLoops = this.geometry.liftContours(contours.edgeLoops);
   contours.extrudeEdges = this.geometry.extrudeContours(contours.edgeLoops);
   
   this._updatePreviewAll();
   // collapse hEdgeHinge
   const length = contours.extrudeEdges.length
   for (let i = 0; i < length; ++i) {
      const hEdge = contours.extrudeEdges[i];
      if (hEdge.next.wingedEdge === hingeHEdge.wingedEdge) {
         this.geometry.collapseEdge(hEdge);
         if (i === length-1) {
            this.geometry.collapseEdge(contours.extrudeEdges[0]);
            contours.extrudeEdges = contours.extrudeEdges.slice(1, length-1); // remove collapseEdges
         } else {
            this.geometry.collapseEdge(contours.extrudeEdges[i+1]);
            contours.extrudeEdges.splice(i, 2);     // remove collapseEdges
         }
         break;
      }
   }

   // reselect face, due to rendering requirement
   this._updatePreviewAll();
   // reselect face
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected.selectedFaces) {
      this.selectFace(polygon);
   }

   return contours;
};


//
// mirror object, select polygon will become hole and connect the mirror object to original object
//
PreviewCage.prototype.mirrorFace = function() {
   const selectedPolygons = this.getSelectedSorted();

   const mirrorMat = mat4.create();
   const protectVertex = new Set;
   const protectWEdge = new Set;
   const uniqueVertex = new Map;
   function resetAddVertex(targetFace) {
      uniqueVertex.clear();
      for (let hEdge of targetFace.hEdges()) {
         uniqueVertex.set(hEdge.origin, hEdge.origin);   // targetFace's pts are shared to the newly mirror faces.
         protectVertex.add(hEdge.origin);
         protectWEdge.add(hEdge.wingedEdge);
      }
      __WEBPACK_IMPORTED_MODULE_6__wings3d_util__["reflectionMat4"](mirrorMat, targetFace.normal, targetFace.halfEdge.origin.vertex);
   };
   const addVertex = (vertex) => {
      let pt = uniqueVertex.get(vertex);
      if (!pt) {
         pt = this.geometry.addVertex(vertex.vertex);
         vec3.transformMat4(pt.vertex, pt.vertex, mirrorMat);
         uniqueVertex.set(vertex, pt);
      }
      return pt.index;
   };

   const originalFaces = Array.from(this.geometry.faces);
   const newGroups = [];
   for (let target of selectedPolygons) {
      resetAddVertex(target);
      const newPolygons = [];
      for (let polygon of originalFaces) {
         if (polygon !== target) {  // add polygon
            const ptsLoop = [];
            for (let hEdge of polygon.hEdges()) {
               ptsLoop.push( addVertex(hEdge.origin) );
            }
            ptsLoop.reverse();   // new face is invert
            newPolygons.push( ptsLoop );
         }
      }
      newGroups.push( newPolygons );
   }

         
   this._updatePreviewAll();  // temp Fix: needs to update Preview before holeSelectedFace
   // now we can safely create new polygons to connect everything together
   const mirrorGroups = [];
   for (let i = 0; i < selectedPolygons.length; ++i) {
      const polygon = selectedPolygons[i];
      this.selectFace(polygon);
      const holed = this.geometry.makeHole(polygon);   // remove selected polygon so mirror face connect through
      const newPolygons = newGroups[i];
      const newMirrors = [];
      for (let ptsLoop of newPolygons) {
         newMirrors.push( this.geometry.addPolygon(ptsLoop) );
      }
      mirrorGroups.push( {holed: holed, newMirrors: newMirrors} );
   }

   this._updatePreviewAll();

   return {mirrorGroups: mirrorGroups, protectVertex: protectVertex, protectWEdge: protectWEdge};
}

PreviewCage.prototype.undoMirrorFace = function(undoMirror) {
   for (let undo of undoMirror.mirrorGroups) {
      const wEdges = new Set();
      for (let polygon of undo.newMirrors) {
         for (let hEdge of polygon.hEdges()) {
            if (!undoMirror.protectVertex.has(hEdge.origin)) {
               this.geometry._freeVertex(hEdge.origin);
            }
            if (undoMirror.protectWEdge.has(hEdge.wingedEdge)) {
               hEdge.next = hEdge.next.pair.next;     // hacky: restore to original connection.
            } else {
               wEdges.add( hEdge.wingedEdge );
            }
         }
         this.geometry._freePolygon(polygon);
      }
      for (let wEdge of wEdges) {
         this.geometry._freeEdge(wEdge.left);
      }
      // restore hole
      this.undoHoleSelectedFace([undo.holed]);
   }
   this._updatePreviewAll();
};


PreviewCage.prototype.cornerEdge = function() {
   const selectedEdge = this.getSelectedSorted();

   const faces = [];
   const vertices = [];
   const splitEdges = [];
   const dissolveEdges = [];
   const vertex = vec3.create();
   for (let wEdge of selectedEdge) {
      let three;
      let five = wEdge.left;
      if (five.face) {
         if (five.face.numberOfVertex == 5) {
            three = wEdge.right;
            if (three.face && (three.face.numberOfVertex !== 3)) {
               three = null;
            }
         } else if (five.face.numberOfVertex === 3) {
            three = five;
            five = wEdge.right;
            if (five.face && (five.face.numberOfVertex !== 5)) {
               five = null;
            }
         }
      }
      if (three && five) {
         faces.push( three.face );
         faces.push( five.face );
         // insert mid point at wEdge.
         vec3.add(vertex, three.origin.vertex, five.origin.vertex);
         vec3.scale(vertex, vertex, 0.5);
         let outEdge = this.geometry.splitEdge(five, vertex);
         vertices.push(five.origin);
         splitEdges.push(outEdge.pair);
         // insert edge from mid-pt to five's diagonal point.
         let connectOut = this.geometry.insertEdge(outEdge, five.next.next.next);
         dissolveEdges.push(connectOut.pair);
         faces.push(connectOut.face);
      }
   }
   // compute direction, and copy position.
   let count = 0;
   let direction = new Float32Array(dissolveEdges.length*3);
   for (let connect of dissolveEdges) {
      const dir = direction.subarray(count, count+3);
      vec3.sub(dir, connect.origin.vertex, connect.destination().vertex);
      vec3.normalize(dir, dir);
      count += 3;
   }
   const ret = this.snapshotPosition(vertices, direction);
   this._updatePreviewAll();
   // reselect splitEdges
   for (let hEdge of splitEdges) {
      this.selectEdge(hEdge);
   }

   // undo stuff
   ret.splitEdges = splitEdges;
   ret.dissolveEdges = dissolveEdges;
   return ret; 
};
PreviewCage.prototype.undoCornerEdge = function(undo) {
   // dissolveEdges first
   for (let hEdge of undo.dissolveEdges) {
      this.geometry.removeEdge(hEdge);
   }

   // unselect the splitEdges then restore to original situation
   for (let hEdge of undo.splitEdges) {
      this.selectEdge(hEdge);
      this.geometry.collapseEdge(hEdge);
   }
   this._updatePreviewAll();
}

PreviewCage.prototype.slideEdge = function() {
   const selection = this.snapshotSelectionEdge();

   const sixAxis = [[0, 0, 1], [0, 1, 0], [1, 0, 0], [0, 0, -1], [0, -1, 0], [-1, 0, 0]];
   const vertices = new Map;
   const pt = vec3.create();
   for (let wEdge of selection.wingedEdges) {
      for (let hEdge of wEdge) {
         // compute the direction
         let dir = vertices.get(hEdge.origin);
         if (!dir) {
            dir = {positive: vec3.create(), negative: vec3.create()};
            vertices.set(hEdge.origin, dir);
         }
         const prev = hEdge.prev();
         const next = hEdge.pair.next;
         // compute which quadrant, pt(normal) is normalized.
         __WEBPACK_IMPORTED_MODULE_6__wings3d_util__["computeEdgeNormal"](pt, next, prev.pair);
         let max;
         let index;
         for (let i = 0; i < 6; ++i) {
            let axis = sixAxis[i];
            let angle =  vec3.dot(axis, pt);
            if (i === 0) {
               max = angle;
               index = 0;
            } else if (max < angle) {
               max = angle;
               index = i;
            }
         }
         // now compute the dir
         if (index > 2) {   // check if needs to reverse negative and positive.
            vec3.sub(pt, hEdge.origin.vertex, prev.origin.vertex);
            vec3.add(dir.negative, dir.negative, pt);
            vec3.sub(pt, next.destination().vertex, next.origin.vertex);
            vec3.add(dir.positive, dir.positive, pt);
         } else {
            vec3.sub(pt, prev.origin.vertex, hEdge.origin.vertex);
            vec3.add(dir.positive, dir.positive, pt);
            vec3.sub(pt, next.origin.vertex, next.destination().vertex);
            vec3.add(dir.negative, dir.negative, pt);
         }
      }
   }

   // copy to array and normalize.
   let count = 0;
   const retVertices = [];
   const positiveDir = new Float32Array(vertices.size*3);
   const negativeDir = new Float32Array(vertices.size*3);
   for (const [vertex, dir] of vertices) {
      retVertices.push( vertex );
      const positive = positiveDir.subarray(count, count+3);
      vec3.copy(positive, dir.positive);
      vec3.normalize(positive, positive);
      const negative = negativeDir.subarray(count, count+3);
      vec3.copy(negative, dir.negative);
      vec3.normalize(negative, negative);
      count += 3;
   }

   const ret = this.snapshotPosition(retVertices, positiveDir);
   ret.directionPositive = positiveDir;
   ret.directionNegative = negativeDir;

   return ret;
};
PreviewCage.prototype.positiveDirection = function(snapshot) {
   snapshot.direction = snapshot.directionPositive;
};
PreviewCage.prototype.negativeDirection = function(snapshot) {
   snapshot.direction = snapshot.directionNegative;
};


// flatten
PreviewCage.prototype.flattenEdge = function(axis) {
   // first snapshot original position
   const ret = this.snapshotEdgePosition();

   // project onto axis.
   const center = vec3.create();
   const vertices = new Set;
   const edgeGroups = this.geometry.findEdgeGroup(this.getSelectedSorted());
   for (let group of edgeGroups) {
      // compute center of a plane
      vertices.clear();
      vec3.set(center, 0, 0, 0);
      for (let wEdge of group) { // compute center.
         for (let hEdge of wEdge) {
            if (!vertices.has(hEdge.origin)) {
               vec3.add(center, center, hEdge.origin.vertex);
               vertices.add(hEdge.origin);
               this.geometry.addAffectedEdgeAndFace(hEdge.origin);
            }
         }
      }
      vec3.scale(center, center, 1/vertices.size);
      // now project all vertex to (axis, center) plane.
      __WEBPACK_IMPORTED_MODULE_6__wings3d_util__["projectVec3"](vertices, axis, center);
   }


   this._updatePreviewAll();
   return ret;
};


// add group normal if planeNormal not present.
PreviewCage.prototype.flattenFace = function(planeNormal) {
   // first snapshot original position.
   const ret = this.snapshotFacePosition();

   const faceGroups = __WEBPACK_IMPORTED_MODULE_2__wings3d_wingededge__["WingedTopology"].findFaceGroup(this.getSelectedSorted());
   const center = vec3.create();
   const vertices = new Set;
   let normal = planeNormal;
   if (!planeNormal) {
      normal = vec3.create();
   }
   for (let group of faceGroups) {
      vertices.clear();
      vec3.set(center, 0, 0, 0);
      for (let face of group) {
         for (let hEdge of face.hEdges()) {
            if (!vertices.has(hEdge.origin)) {
               vertices.add(hEdge.origin);
               vec3.add(center, center, hEdge.origin.vertex);
               this.geometry.addAffectedEdgeAndFace(hEdge.origin);
            }
         }
         if (!planeNormal) {
            vec3.add(normal, normal, face.normal);
         }
      }
      vec3.scale(center, center, 1/vertices.size);
      if (!planeNormal) {
         vec3.normalize(normal, normal);
      }
      __WEBPACK_IMPORTED_MODULE_6__wings3d_util__["projectVec3"](vertices, normal, center);
   }

   this._updatePreviewAll();
   return ret;
};


PreviewCage.prototype.flattenVertex = function(planeNormal) {
   if (this.selectedSet.size > 1) { // needs at least 2 vertex to get a center.
      const selectedVertices = this.getSelectedSorted();
      const ret = this.snapshotVertexPosition();

      const center = vec3.create();
      for (let vertex of selectedVertices) {
         vec3.add(center, center, vertex.vertex);
         this.geometry.addAffectedEdgeAndFace(vertex);
      }
      vec3.scale(center, center, 1/selectedVertices.length);
      __WEBPACK_IMPORTED_MODULE_6__wings3d_util__["projectVec3"](selectedVertices, planeNormal, center);

      this._updatePreviewAll();

      return ret;
   }
   return null;
};


// check if given plane can cut selected face. coplanar does not count.
PreviewCage.prototype.planeCuttableFace = function(plane) {
   for (let sphere of this.bvh.root.intersectBound(plane)) {
      if (this.selectedSet.has(sphere.polygon)) {
         // now, check hEdge against plane.
         for (let hEdge of sphere.polygon.hEdges()) {
            const t = __WEBPACK_IMPORTED_MODULE_6__wings3d_util__["intersectPlaneHEdge"](null, plane, hEdge);
            if ((t>0) && (t<1)) {   // intersection at begin or end don't count
               return true;
            }
         }
      }
   }
   return false;
};

// cut the selected by the given plane, and reconnect
PreviewCage.prototype._planeCutFace = function(cutPlanes) {
   const selectedVertex = new Set;
   const splitEdges = [];
   const pt = vec3.create();
   for (let plane of cutPlanes) {
      const cutList = [];
      for (let sphere of this.bvh.root.intersectBound(plane)) {
         if (this.selectedSet.has(sphere.polygon)) {
            cutList.push(sphere.polygon);
         }
      }

      // sort cutList, guarantee ordering.
      cutList.sort( (a,b)=> { return a.index - b.index;} );

      // now cut, and select vertex for later connect phase.
      const cuthEdgeList = [];
      const wEdgeList = new Set;
      for (let polygon of cutList) {
         for (let hEdge of polygon.hEdges()) {
            if (!wEdgeList.has(hEdge.wingedEdge)) {
               cuthEdgeList.push(hEdge);
               wEdgeList.add(hEdge.wingedEdge);
            }
         }
      }
      for (let hEdge of cuthEdgeList) {   // only iterate once for every potentail edges
         const t = __WEBPACK_IMPORTED_MODULE_6__wings3d_util__["intersectPlaneHEdge"](pt, plane, hEdge);
         if (t == 0) {  // select origin
            selectedVertex.add( hEdge.origin );
         } else if ( (t>0) && (t<1)) { // spliEdge, and select
            let newOut = this.geometry.splitEdge(hEdge, pt);   // pt is the split point.
            splitEdges.push( newOut.pair );
            selectedVertex.add( hEdge.origin );
         }
      }
   }
   this._updatePreviewAll();  // update drawing buffer.
   return {selectedFaces: this.selectedSet, vertices: selectedVertex, halfEdges: splitEdges};
};

PreviewCage.prototype.planeCutFace = function(plane) {
   return this._planeCutFace([plane]);
};

PreviewCage.prototype.planeCutBody = function(plane) {
   const result = this._planeCutFace([plane]);

   // adjust result to body
   return {body: result.selectedFaces, vertices: result.vertices, halfEdges: result.halfEdges};
};


PreviewCage.prototype.sliceBody = function(planeNormal, numberOfPart) {
   // first get tight bounding box.
   const min = vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
   const max = vec3.fromValues(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
   this.geometry.getExtent(min, max);
   const size = vec3.create();
   vec3.sub(size, max, min);
   // find the number of cuts.
   const cutPlanes = [];
   const center = vec3.create();
   const numberOfCuts = numberOfPart-1;
   for (let i = 1; i <= numberOfCuts; ++i) {
      vec3.lerp(center, min, max, i/(numberOfCuts+1));
      cutPlanes.push( new __WEBPACK_IMPORTED_MODULE_1__wings3d_boundingvolume__["Plane"](planeNormal, center) );
   }

   // iterate through the cut
   const result = this._planeCutFace(cutPlanes);

   // adjust result to body
   return {body: result.selectedFaces, vertices: result.vertices, halfEdges: result.halfEdges};
};


PreviewCage.prototype.getBodySelection = function(selection, extent) {
   // first get extent size
   this.geometry.getExtent(extent.min, extent.max);
   // now push all faces's sphere.
   for (let polygon of this.selectedSet) {
      selection.push( this.bench.boundingSpheres[polygon.index] );
   }
};


// make holes
PreviewCage.prototype.makeHolesFromBB = function(selection) {
   const restore = [];
   for (let sphere of selection) {
      this.selectedSet.delete(sphere.polygon);              // remove from selection. also selection off(not done)?
      restore.unshift( this.geometry.makeHole(sphere.polygon) );  // restore has to be done in reverse
   }
   return restore;
};


// the real workhorse
PreviewCage.findWeldContours = function(overlap) {
   // combinedCages
   const combinedCages = new Map;
   const combines = [];
   function combineCage(source, target) {
      let cages;
      if (source.cage === target.cage) {  // same cage
         if (combinedCages.has(source.cage)) {
            cages = combinedCages.get(source.cage);
         } else {
            cages = [];
            combines.push( cages );
            cages.push(source.cage);
            combines.set(source.cage, cages);
            combines.set(target.cage, cages);             
         }
      } else {
         if (combinedCages.has(source.cage)) {
            cages = combinedCages.get(source.cage);
            if (!combinedCages.has(target.cage)) {
               combinedCages.set(target.cage, cages);
               cages.push( target.cage );
            }
         } else if (combinedCages.has(target.cage)) {
            cages = combinedCages.get(target.cage);
            combinedCages.set(source.cage, cages);
            cages.push( source.cages );
            loopUse.push();
         } else {
            cages = [];
            combines.push( cages );
            cages.push(source.cage, target.cage);
            combinedCages.set(source.cage, cages);
            combinedCages.set(target.cage, cages);
         }
      }     
      return cages;
   };
   // find edgeLoops
   const loopUsed = [];
   const hEdge2Loop = new Map;
   const edgeLoops = __WEBPACK_IMPORTED_MODULE_2__wings3d_wingededge__["WingedTopology"].findContours(overlap.selection);
   // find inner, outer, then combined.
   for (let edgeLoop of edgeLoops) {
      const source = overlap.pair.get(edgeLoop[0].outer);
      const target = overlap.pair.get(source.hEdge)
      if (hEdge2Loop.has(source.hEdge)) { // now check if matching hEdge already saved
         const result = hEdge2Loop.get(source.hEdge);
         if (result.length === edgeLoop.length) {   // move hEdge to match and checked.
            for (let i = 0; i < edgeLoop.length; ++i) {  // could not just loop both because they are in reverse order.
               let inner = overlap.pair.get(edgeLoop[i].outer);  
               if (!overlap.pair.has(inner.hEdge)) {// no matching not possible, bad
                  return false;
               }
               edgeLoop[i].inner = inner.hEdge.pair;
            } // ok, done
            // now combined Cage
            loopUsed.push( {combine: combineCage(source, target), edgeLoop: edgeLoop} );
         } else { // bad match, could be 3+ cage involvement, don't handle it now.
            return false;
         }
      } else { // save all to hEdge2Loop
         for (let i = 0; i < edgeLoop.length; ++i) {
            const outer = edgeLoop[i].outer;
            hEdge2Loop.set(outer, edgeLoop);
         }
      } // also won't handle self weld contours.
   }

   return {combineCages: combines, edgeLoops: loopUsed};
};


PreviewCage.weldableFace = function(target, compare, tolerance) {
   // check number of vertex
   if (target.polygon.numberOfVertex !== compare.polygon.numberOfVertex) {
      return false;
   }
   // check direction
   if (vec3.dot(target.polygon.normal, compare.polygon.normal) > 0) {
      return false;
   }
   // check center distance and radisu
   const toleranceSquare = tolerance * tolerance;
   if (vec3.sqrDist(target.center, compare.center) > toleranceSquare) {
      return false;
   }
   if (Math.abs(target.radius - compare.radius) > tolerance) {
      return false;
   }
   // check all vertex distance
   const reverse2 = []; 
   for (let current2 of compare.polygon.hEdges()) {  // get reverse order
      reverse2.unshift(current2);
   }
   for (let hEdge of target.polygon.hEdges()) {  // find the closest pair first
      for (let i = 0; i < reverse2.length; ++i) {
         let current = hEdge;
         let current2 = reverse2[i];
         let match = [];
         let j = i;
         do {  // iterated through the loop
            if (vec3.sqrDist(current.origin.vertex, current2.destination().vertex) > toleranceSquare) {
               match = undefined;
               break;
            }
            match.push( {target: current, source: current2} );
            current = current.next;
            j = (++j)%reverse2.length;
            current2 = reverse2[j];
         } while (current !== hEdge);
         if (match) {
            return match;
         }
      }
   }

   return false;
};

PreviewCage.findOverlapFace = function(order, selection, tolerance) {
   const merged = new Set;
   const retSelection = new Set;
   const pair = new Map;
   for (let i = 0; i < selection.length; ++i) {  // walk through the whole list
      const target = selection[i];
      if (!merged.has(target)) {
         for (let j = i+1; j < selection.length; j++) {// walk till the end, or 
            const compare = selection[j];
            if (compare.isLive() && !merged.has(compare)) {
               if (Math.abs(target.center[order[0]]-compare.center[order[0]]) > tolerance) {  // out of bounds
                  break;
               }
                // weld compare to target if possibled
               const weld = PreviewCage.weldableFace(target, compare, tolerance);  // weldable
               if (weld) {
                  merged.add(compare);
                  merged.add(target);
                  retSelection.add(compare.polygon);
                  retSelection.add(target.polygon);
                  for (let match of weld) {                     
                     pair.set(match.target, {hEdge: match.source, cage: compare.octree.bvh});
                     pair.set(match.source, {hEdge: match.target, cage: target.octree.bvh});
                  }
               }
            }
         }
      }
   }
   return {pair: pair, merged: merged, selection: retSelection};
};

// get the merged sphere, and remove the polygon.
PreviewCage.weldHole = function(merged) {
   const holesOfCages = new Map;
   for (let sphere of merged.merged) { // sort holes to cages.
      let holes = holesOfCages.get(sphere.octree.bvh);
      if (holes === undefined) {
         holes = [];
         holesOfCages.set(sphere.octree.bvh, holes);
      }
      holes.push(sphere);
   }

   // now remove holes from each cages.
   const result = [];
   for (let [cage, holes] of holesOfCages) {
      result.push( [cage, cage.makeHolesFromBB(holes)] );
      cage._updatePreviewAll();
   }
   return result;
};
PreviewCage.undoWeldHole = function(weldHoles) {
   for (let [cage, holes] of weldHoles) {
      for (let restore of holes) {
         cage.geometry.undoHole(restore);
      }
      cage._updatePreviewAll();
   }
};

PreviewCage.weldBody = function(combines, weldContours) {
   const result = [];
   // then weld contour.
   for (let {combine, edgeLoop} of weldContours.edgeLoops) {
      const cage = combines.get(combine);
      cage.combine.geometry.weldContour(edgeLoop);
      cage.combine._updatePreviewAll();
      // compute snapshot
      cage.preview = cage.combine;  // smuglling snapshot. should we rename (combine to preview)?
      if (!cage.snapshot) {
         cage.snapshot = {vertices: new Set};
      }
      for (let edge of edgeLoop) {
         cage.snapshot.vertices.add(edge.outer.origin);
      }
      // weldContour saved restore info
      result.push( [cage.preview, edgeLoop] );
   }
   return result;
};
PreviewCage.undoWeldBody = function(weldContours) {
   for (let [cage, edgeLoop] of weldContours) {
      cage.geometry.restoreContour(edgeLoop);   // liftContour will restore innerLoop for us
      cage._updatePreviewAll();
   }
};

/**
 * change selectedEdge's state
 * @param {number} operand - 0=soft, 1=hard, 2=invert 
 */
PreviewCage.prototype.hardnessEdge = function(operand) {
   let ret = {operand: operand, selection: []};

   for (let wEdge of this.selectedSet) {
      if (this.bench.setHardness(wEdge, operand)) {   // check set successfully
         ret.selection.push(wEdge);
      }
   }
   // return ret
   if (ret.selection.length > 0) {
      return ret;
   } else {
      return null;
   }
};

/**
 * restore selection's edge state
 * @param {number} operand - 0=soft, 1=hard, 2=invert
 * @param {array} selection - the edges that needs to restore
 */
PreviewCage.prototype.undoHardnessEdge = function(result) {
   let operand = result.operand;
   if (operand === 0) { // soft restore to hard
      operand = 1;
   } else if (operand === 1) {   // hard restore to soft
      operand = 0;
   }
   for (let wEdge of result.selection) {   // restore edges state
      this.bench.setHardness(wEdge, operand);
   }
};

//----------------------------------------------------------------------------------------------------------



class CreatePreviewCageCommand extends __WEBPACK_IMPORTED_MODULE_5__wings3d_undo__["EditCommand"] {
   constructor(previewCage) {
      super();
      this.previewCage = previewCage;
   }

   free() {
      this.previewCage.freeBuffer();
   }

   doIt() {
      __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["addToWorld"](this.previewCage);
   }

   undo() {
      __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["removeFromWorld"](this.previewCage);
   }
}




/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EditCommand", function() { return EditCommand; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EditSelectHandler", function() { return EditSelectHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MouseMoveHandler", function() { return MouseMoveHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MoveableCommand", function() { return MoveableCommand; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EditCommandCombo", function() { return EditCommandCombo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EditCommandSimple", function() { return EditCommandSimple; });
/**
 *  abstract EditCommand class for undo, redo handling. also MouseMoveHandler class.
 * 
 */

// merge MouseMoveHandler to EditCommand
class EditCommand {
   _calibrateMovement(mouseMove) {
      // todo: instead of magic constant. should supply a scaling factor.
      let move;
      if (mouseMove == 0) {
         move = 0;
      } else if (mouseMove < 0) {
         move = Math.log(-mouseMove) / 5.0;  // log to counteract mouse acceleration.
         move = -move;
      } else {
         move = Math.log(mouseMove) / 5.0;
      }

      return move;
   }

   _xPercentMovement(ev) {
      let width = window.innertWidth || document.documentElement.clientWidth || document.body.clientWidth;
      return (ev.movementX / width);
   }

   free() {}

   isDoable() { return true; }

   //doIt() {}

   //undo() {}
}

class MouseMoveHandler extends EditCommand {

   //handleMouseMove(ev) {}

/*   cancel() {
      this._cancel();     // called descendant handler
      // enable mouse cursor
      document.body.style.cursor = 'auto';
   }

   commit() {
      this._commit();
      // enable mouse cursor
      document.body.style.cursor = 'auto';
   } */
}

// delegate mouse movement to MouseMoveHandler
class MoveableCommand extends EditCommand {

   isMoveable() {
      if (this.moveHandler) {
         return true;
      }
      return false;
   }

   handleMouseMove(ev, cameraView) {
      if (this.moveHandler) {
         this.moveHandler.handleMouseMove(ev, cameraView);
      }
   }

   doIt() {
      if (this.moveHandler) {
         this.moveHandler.doIt();
      }
   }

   undo() {
      if (this.moveHandler) {
         this.moveHandler.undo();
      }
   }
}

class EditSelectHandler extends MoveableCommand {
   constructor(isVertex, isEdge, isFace, planeNormal) {
      super();
      this.selectable = {isVertex: isVertex, isEdge: isEdge, isFace: isFace};
      this.planeNormal = planeNormal;
   }

   isVertexSelectable() { return this.selectable.isVertex; }
   isEdgeSelectable() { return this.selectable.isEdge; }
   isFaceSelectable() { return this.selectable.isFace; }
   getPlaneNormal() { return this.planeNormal; }

   // hilite(hilite, currentCage) - to be implemented by subclass
   // select(hilite) - to be implemented by subclass
}

class EditCommandSimple extends EditCommand {
   constructor(command) {
      super();
      this.commandName = command;
   }

   doIt(currentMadsor) {
      this.result = currentMadsor[this.commandName]();
      return (this.result !== false);
   }

   undo(currentMadsor) {
      this.result.undo.call(currentMadsor, this.result.snapshots);
      //this.undo(currentMadsor);   // originally using return function, but now we needs to serialize EditCommand, so pass back function and argument.
   }
}


class EditCommandCombo extends EditCommand {
   constructor(editCommands) {
      super();
      this.editCommands = editCommands;
   }

   doIt() {
      // start from beginning
      for (let cmd of this.editCommands) {
         cmd.doIt();
      }
   }

   undo() {
      // walk from last to first
      for (let i = this.editCommands.length-1; i >= 0; --i) {
         this.editCommands[i].undo();
      }
   }
}




/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createWebGLContext", function() { return createWebGLContext; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ShaderData", function() { return ShaderData; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ShaderProgram", function() { return ShaderProgram; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "gl", function() { return gl; });
/*
//
//     Append a few utilities and convenience functions. now to es6 module.
//
*/


let gl = null;
function createWebGLContext(canvasID, attrib) {
   var _pvt = {currentShader: null};

   // initialization
   var canvas = document.getElementById(canvasID);
   if (!canvas) {
      return null;
   }
      
   attrib = typeof attrib !== 'undefined' ? attrib : { depth: true, stencil: true, antialias: true };
//   gl = canvas.getContext("webgl2", attrib);
//   if (!gl) {
      gl = canvas.getContext("webgl", attrib) || canvas.getContext("experimental-webgl", attrib);
      if (gl) {
         // init_extensions(), init_restrictions()
         let ext = gl.getExtension("OES_standard_derivatives"); // webgl2 is standard.
         if (ext === null) {
            console.log("No OES_standard_derivatives");
            return null;   
         }
         ext = gl.getExtension("OES_element_index_uint");
         if (ext === null) {
            console.log("No OES_element_index_uint");
            return null;
         }
         console.log("WebGL 1 init with extension");
      } else {
         alert("Unable to initialize WebGL");
         return null;
      }
//   } else {
//      console.log("WebGL 2 init successful");
//   }


   // make sure webgl framebuffer size matched real canvas size.
   gl.resizeToDisplaySize = function() {
      var canvas = gl.canvas;
      var displayWidth = canvas.clientWidth;
      var displayHeight = canvas.clientHeight;
      if (canvas.width != displayWidth ||
          canvas.height != displayHeight) {
         canvas.width = displayWidth;
         canvas.height = displayHeight;     
         gl.viewport(0, 0, displayWidth, displayHeight);
         return true;
      }
      return false;
   };
   gl.resizeToDisplaySize();

   // setup variables
   gl.projection = mat4.create();
   gl.modelView = mat4.create();

   // binder
   _pvt.transform = {
      projection: function(gl, loc) {
         gl.uniformMatrix4fv(loc, false, gl.projection);
      },
      worldView: function(gl, loc) {
         gl.uniformMatrix4fv(loc, false, gl.modelView);
      },
   };

   // utility functions
   // move from wings3d.wm.
   // return int32array[0,0, width, height] ...etc.
   gl.getViewport = function() {
      return gl.getParameter(gl.VIEWPORT);
   };
   // project() transform objectSpace vert to screenSpace,
   //   return vec4. vec4[3] == 0 meant failure, problems with input projection.
   gl.project = function(objx, objy, objz, modelview, projection) {
      //Transformation vectors
      var input = vec4.fromValues(objx, objy, objz, 1.0);
          out = vec4.create();
      //Modelview transform
      vec4.transformMat4(out, input, modelView);
      //Projection transform, 
      vec4.transformMat4(input, out, projection);
      if(input[3] == 0.0) {//The w value
         return input;
      }
      //Perspective division
      input[0] /= input[3];
      input[1] /= input[3];
      input[2] /= input[3];
      var viewport = gl.getViewport();
      //screenCoordinate, Map x, y to range 0-1
      out[0]=(input[0]*0.5+0.5)*viewport[2]+viewport[0];
      out[1]=(input[1]*0.5+0.5)*viewport[3]+viewport[1];
      //This is only correct when glDepthRange(0.0, 1.0)
      out[2]=input[2]*0.5 + 0.5;	//Between 0 and 1
      out[3]=1.0;             // out[w] determined success or failure.
      return out;
  };

   gl.unProject = function(winx, winy, winz, modelview, projection, viewport) {
      //Transformation matrices
      var final = mat4.create(),
          input = vec4.create(),
          out = vec4.create();
      //Calculation for inverting a matrix, compute projection x modelview
      //and store in A[16]
      mat4.multiply(final, projection, modelview);
      //Now compute the inverse of matrix A
      if(mat4.invert(final, final)==null) {
         out[3]=0.0;
         return out;
      }
      var viewport = gl.getViewport();
      //Transformation of normalized coordinates between -1 and 1
      input[0]=(winx-viewport[0])/viewport[2]*2.0 - 1.0;
      input[1]=(winy-viewport[1])/viewport[3]*2.0 - 1.0;
      input[2]=2.0*winz-1.0;
      input[3]=1.0;
      //Objects coordinates
      vec4.transformMat4(out, input, final);
      if(out[3]==0.0) {
         return out;
      }
      out[0]/=out[3];
      out[1]/=out[3];
      out[2]/=out[3];
      out[3] =1.0;
      return out;
   };
   gl.transformVertex = function(vertex4) {
       var out = vec4.create();
       return vec4.transformMat4(out, vec4.transformMat4(out, vertex4, gl.modelView), gl.projection);
   };

   // shader, programs.
   gl.compileGLSL = function(vshader, fshader) {
      // compile vertex and fragment shader
      var vertexShader = gl.loadShader(gl.VERTEX_SHADER, vshader);
      if (!vertexShader) {
         console.log("failed to compile vertex shader");
         return null;
      }
      var fragmentShader = gl.loadShader(gl.FRAGMENT_SHADER, fshader);
      if (!fragmentShader) {
         console.log("failed to compile fragment shader");
         return null;
      }

      // get program, attach, link
      var progHandle = gl.createProgram();
      gl.attachShader(progHandle, vertexShader);
      gl.attachShader(progHandle, fragmentShader);
      gl.linkProgram(progHandle);

      // check for error
      var linked = gl.getProgramParameter(progHandle, gl.LINK_STATUS);
      if (!linked) {
         var error = gl.getProgramInfoLog(progHandle);
         console.log('failed to link program: ' + error);
         gl.deleteProgram(progHandle);
         gl.deleteShader(fragmentShader);
         gl.deleteShader(vertexShader);
         return null;
      }
      return progHandle;
   };

   gl.loadShader = function(shaderType, shaderSource) {
      // createShader always work unless shaderType is wrong?
      var shaderHandle = gl.createShader(shaderType);

      // loading shaderSource then compile shader.
      gl.shaderSource(shaderHandle, shaderSource);
      gl.compileShader(shaderHandle);

      // check for successful compilation.
      var compiled = gl.getShaderParameter(shaderHandle, gl.COMPILE_STATUS);
      if (!compiled) {
         var error = gl.getShaderInfoLog(shaderHandle);
         console.log('failed to compile shader: ' + error);
         gl.deleteShader(shaderHandle);
         return null;
      }
      return shaderHandle;
   };

   gl.createShaderProgram = function(vShader, fShader) {
      var progHandle = gl.compileGLSL(vShader, fShader);
      if (progHandle) {
         var info;
         var attribute = {};
         var numCount = gl.getProgramParameter(progHandle, gl.ACTIVE_ATTRIBUTES);
         for (var i = 0; i < numCount; ++i) {
            info = gl.getActiveAttrib(progHandle, i);
            if (!info){
               console.log("Something wrong, getActiveAttrib failed");
               return null;
            }
            attribute[info.name] = {loc: gl.getAttribLocation(progHandle, info.name), type: info.type};
         }
         var uniform = {};
         var transform = {world: null, worldView: null, worldViewProjection: null, view: null, projection: null};
         numCount = gl.getProgramParameter(progHandle, gl.ACTIVE_UNIFORMS);
         for (i = 0; i < numCount; ++i) {
            info  = gl.getActiveUniform(progHandle, i);
            if (!info) {
               console.log("Something wrong, getActiveUniform failed");
               return null;
            }
            // check if it belongs to transform?
            if (transform.hasOwnProperty(info.name)) {
               transform[info.name] = gl.getUniformLocation(progHandle, info.name);
            } else {
               // check for array suffix?
               uniform[info.name] = {loc: gl.getUniformLocation(progHandle, info.name),
                                     size: info.size, type: info.type};
            }
         }
         return new ShaderProgram(progHandle, transform, attribute, uniform);
      }
      
   };

   // return buffer Handle.
   gl.createBufferHandle = function(typedArray, type = gl.ARRAY_BUFFER, draw = gl.STATIC_DRAW) {
      if (ArrayBuffer.isView(typedArray)) {
         var handle = gl.createBuffer();
         gl.bindBuffer(type, handle);
         gl.bufferData(type, typedArray, draw);
         gl.bindBuffer(type, null);
         return handle;
      } else {
         console.log("not typedArray");
         return null;
      }
   };

   gl.setBufferAndAttrib = function(handle, position, size=3) {
      gl.bindBuffer(gl.ARRAY_BUFFER, handle);
      gl.vertexAttribPointer(position, size, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(position);
   };
   
   gl.bindAttributeToProgram = function(progLoc, attrib) {
      gl.bindBuffer(gl.ARRAY_BUFFER, attrib.handle);
      gl.vertexAttribPointer(progLoc, attrib.size, attrib.type, attrib.normalized, attrib.stride, attrib.offset);
      gl.enableVertexAttribArray(progLoc);
   };

   /**
    * bind index to current drawing.
    * @param {shaderData} - gpu data.
    * @param {string} - name of index
    */
   gl.bindIndex = function(data, name) {
      const handle = data.index[name];
      if (handle) {
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, handle);
      }
   };

   /**
    * bind attribute to current program
    * @param {shaderData} - gpu data
    * @param {array of strings} - the name of attributes to binds to program.
    */
   gl.bindAttribute = function(data, names) {
      _pvt.currentShader.bindAttribute(gl, data.attribute, names);
   };

   /**
    * bind uniform to current program
    * @param {shaderData} - gpu data.
    * @param {array of strings} - the name of uniforms to bind to program
    */
   gl.bindUniform = function(data, names) {
      _pvt.currentShader.bindUniform(gl, data.uniform, names);
   }
/*   gl.bindShaderData = function(data, useIndex=true) {
      // using current setShader, set shader, set indexbuffer
      _pvt.currentShader.bindAttribute(gl, data.attribute);
      _pvt.currentShader.bindUniform(gl, data.uniform);
      if (useIndex && typeof(data.index)!=="undefined" && data.index !== null) {
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, data.index.handle);
      }
   }; */

   gl.bindTransform = function() {
      // current shader, set current transform
      _pvt.currentShader.bindTransform(gl, _pvt.transform);
   };
   gl.pushTransform = function(matrix) {

   };
   gl.popTransform = function() {
      // restore transform
   };
   gl.useShader = function(shader) {
      _pvt.currentShader = shader;
      gl.useProgram(shader.progHandle);
   };
   gl.disableShader = function() {
      // disable vertex attribute array
      if (_pvt.currentShader) {
         _pvt.currentShader.disableVertexAttributeArray(gl);
      }
   };

   gl.drawVertex =  function(drawObject) {
      gl.bindTransform();
      gl.bindShaderData(drawObject.shaderData, false);
      drawObject.drawVertex(gl);
   };

   gl.drawSelect = function(drawObject) {
      gl.bindTransform();
      drawObject.bindSelectorShaderData(gl);
      drawObject.drawSelect(gl);
   };

   gl.createShaderData = function() {
      return new ShaderData();
   };

   return gl;
};


//
// define ShaderProgram, ShaderData.
//

/**input to ShaderProgram.
 */
const ShaderData = function() {
   this.attribute = {};
   this.uniform = {};
   this.index = {};
};

ShaderData.attribLayout = function(attribSize=3, attribType=gl.FLOAT, normalized=false, stride=0, offset=0) {
   return {size: attribSize, type: attribType, normalized: normalized, stride: stride, offset: offset};
}


ShaderData.prototype.setupAttribute = function(name, layout, buffer, usage) {
   this.createAttribute(name, layout, usage);
   this.resizeAttribute(name, buffer.byteLength);
   this.uploadAttribute(name, 0, buffer);
}

ShaderData.prototype.createAttribute = function(name, layout, usage) {
   if (!this.attribute[name]) {
      var handle = gl.createBuffer();
      this.attribute[name] = {handle: handle,
                              byteLength: 0,
                              usage: usage,
                              size: layout.size,
                              type: layout.type,
                              normalized: layout.normalized,
                              stride: layout.stride,
                              offset: layout.offset
                             };
   } else {
      console.log("Shader Data: " + name + " already initialized");
   }
};

ShaderData.prototype.resizeAttribute = function(name, byteLength) {//, usage) {
   var attrib = this.attribute[name];
   if (attrib && attrib.byteLength != byteLength) {
      gl.bindBuffer(gl.ARRAY_BUFFER, attrib.handle);
      gl.bufferData(gl.ARRAY_BUFFER, byteLength, attrib.usage);
      attrib.byteLength = byteLength;
   }
};

ShaderData.prototype.deleteAttribute = function(name) {
   var attribute = this.attribute[name];
   if (attribute) {
      gl.deleteBuffer(attribute.handle);
      this.attribute[name] = null;
   }
};

ShaderData.prototype.freeAllAttributes = function() {
   var removeList = [];
   for (var key in this.attribute) {
      removeList.push(key);
   }
   for (var i = 0; i < removeList.length; ++i) {
      this.deleteAttribute(removeList[i]);
   }
};


ShaderData.prototype.uploadAttribute = function(name, byteOffset, typedArray)  {
   var attrb = this.attribute[name];
   if (attrb) {
      gl.bindBuffer(gl.ARRAY_BUFFER, attrb.handle);
      gl.bufferSubData(gl.ARRAY_BUFFER, byteOffset, typedArray);
   } else {
      console.log("Shader Data: " + name + " not initialized");
   }
};


/** 
 * index is used for drawElement
 * @param {string} - index name
 * @param {typedArray} - array of unsigned int
 */
ShaderData.prototype.setIndex = function(name, index) {
   let handle = this.index[name];
   if (handle) {
      gl.deleteBuffer(handle);
      this.index[name] = undefined;
   }
   if (index) {
      this.index[name] = gl.createBufferHandle(index, gl.ELEMENT_ARRAY_BUFFER);
   }
};

ShaderData.prototype.setUniform1f = function(name, float) {
   this.uniform[name] = {value: new Float32Array(1), binder: ShaderData.uniform1fFn};
   this.uniform[name].value = float;
};

ShaderData.uniform1fFn = function(gl, loc, value) {
   gl.uniform1f(loc, value);
};

ShaderData.prototype.setUniform3fv = function(name, arry3) {   // 3fv === vec3
   this.uniform[name] = {value: new Float32Array(arry3), binder: ShaderData.uniform3fvFn};
};

ShaderData.uniform3fvFn = function(gl, loc, value) {
   gl.uniform3fv(loc, value);
}; 

ShaderData.prototype.setUniform4fv = function(name, arry4) {
   this.uniform[name] = {value: new Float32Array(arry4), binder: ShaderData.uniform4fvFn};
};

ShaderData.uniform4fvFn = function(gl, loc, value) {
   gl.uniform4fv(loc, value);
};

// a few predefine var. 
//        attributes: ["position", "normal", "uv"],
//        uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"] ? how about inverse?
var ShaderProgram = function(progHandle, transform, attribute, uniform) {
   this.progHandle = progHandle;
   this.transform = transform;
   this.attribute = attribute;
   this.uniform = uniform;
};

ShaderProgram.prototype.disableVertexAttributeArray = function(gl) {
   for (var key in this.attribute) {
      if (this.attribute.hasOwnProperty(key)) {
         gl.disableVertexAttribArray(this.attribute[key].loc);
      }
   }
};

ShaderProgram.prototype.bindAttribute = function(gl, attribute, names) {
   try {
      for (let key of names) {
         if (attribute.hasOwnProperty(key) && this.attribute.hasOwnProperty(key)) {   // don't need to check this.attribute' inherited property, cannot possibley exist
            const attrb = attribute[key];
            gl.bindAttributeToProgram(this.attribute[key].loc, attrb);
         } else {
            // don't have property. console.log?
            //console.log("shaderData don't have shader attribute: " + key);
         }
      }
   }
   catch (e) {
      console.log(e);
   }
};

ShaderProgram.prototype.bindUniform = function(gl, uniform, names) {
   try {
   for (let key of names) {
      if (uniform.hasOwnProperty(key) && this.uniform.hasOwnProperty(key)) {
         var uni = uniform[key];
         uni.binder(gl, this.uniform[key].loc, uni.value);
      } else {
         // don't have property. console.log?
         //console.log("shaderData don't have shader uniform: " + key);
      }
   }
   }
   catch (e) {
      console.log(e);
   }
};

ShaderProgram.prototype.bindTransform = function(gl, transform) {
   try {
     for (var key in this.transform) {
      if (transform.hasOwnProperty(key)) {
         var binder = transform[key];
         binder(gl, this.transform[key]);
      }
   } 
   }
   catch (e) {
      console.log(e);
   }
};

ShaderProgram.prototype.getTypeByName = function(type) {
/*	  var FLOAT = 0x1406;
	  var FLOAT_VEC2 = 0x8B50;
	  var FLOAT_VEC3 = 0x8B51;
	  var FLOAT_VEC4 = 0x8B52;
	  var INT = 0x1404;
	  var INT_VEC2 = 0x8B53;
	  var INT_VEC3 = 0x8B54;
	  var INT_VEC4 = 0x8B55;
	  var BOOL = 0x8B56;
	  var BOOL_VEC2 = 0x8B57;
	  var BOOL_VEC3 = 0x8B58;
	  var BOOL_VEC4 = 0x8B59;
	  var FLOAT_MAT2 = 0x8B5A;
	  var FLOAT_MAT3 = 0x8B5B;
	  var FLOAT_MAT4 = 0x8B5C;
	  var SAMPLER_2D = 0x8B5E;
	  var SAMPLER_CUBE = 0x8B60;
	  var SAMPLER_3D = 0x8B5F;
	  var SAMPLER_2D_SHADOW = 0x8B62;
	  var FLOAT_MAT2x3 = 0x8B65;
	  var FLOAT_MAT2x4 = 0x8B66;
	  var FLOAT_MAT3x2 = 0x8B67;
	  var FLOAT_MAT3x4 = 0x8B68;
	  var FLOAT_MAT4x2 = 0x8B69;
	  var FLOAT_MAT4x3 = 0x8B6A;
	  var SAMPLER_2D_ARRAY = 0x8DC1;
	  var SAMPLER_2D_ARRAY_SHADOW = 0x8DC4;
	  var SAMPLER_CUBE_SHADOW = 0x8DC5;
	  var UNSIGNED_INT = 0x1405;
	  var UNSIGNED_INT_VEC2 = 0x8DC6;
	  var UNSIGNED_INT_VEC3 = 0x8DC7;
	  var UNSIGNED_INT_VEC4 = 0x8DC8;
	  var INT_SAMPLER_2D = 0x8DCA;
	  var INT_SAMPLER_3D = 0x8DCB;
	  var INT_SAMPLER_CUBE = 0x8DCC;
	  var INT_SAMPLER_2D_ARRAY = 0x8DCF;
	  var UNSIGNED_INT_SAMPLER_2D = 0x8DD2;
	  var UNSIGNED_INT_SAMPLER_3D = 0x8DD3;
	  var UNSIGNED_INT_SAMPLER_CUBE = 0x8DD4;
	  var UNSIGNED_INT_SAMPLER_2D_ARRAY = 0x8DD7;

	  var TEXTURE_2D = 0x0DE1;
	  var TEXTURE_CUBE_MAP = 0x8513;
	  var TEXTURE_3D = 0x806F;
	  var TEXTURE_2D_ARRAY = 0x8C1A;*/

};





/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "uColorArray", function() { return uColorArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "colorArray", function() { return colorArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "selectedColorLine", function() { return selectedColorLine; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "selectedColorPoint", function() { return selectedColorPoint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "textArray", function() { return textArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "cameraLight", function() { return cameraLight; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "solidColor", function() { return solidColor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "simplePoint", function() { return simplePoint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "colorPoint", function() { return colorPoint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "solidWireframe", function() { return solidWireframe; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "edgeSolidWireframe", function() { return edgeSolidWireframe; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "colorSolidWireframe", function() { return colorSolidWireframe; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d__ = __webpack_require__(0);
// program as text .




let uColorArray = {
   vertexShader:[
      'attribute vec3 position;',
      'uniform mat4 worldView;',
      'uniform mat4 projection;',
      'void main(void) {',
      '   gl_Position = projection * worldView * vec4(position, 1.0);',
      '}'].join("\n"),
   fragShader:[
      'uniform lowp vec4 uColor;',
      'void main(void) {',
      '   gl_FragColor = uColor;',
      '}'].join("\n"),
};
let colorArray = {
   vertexShader: [
      'attribute vec3 aVertexPosition;',
      'attribute vec3 aVertexColor;',

      'uniform mat4 uMVMatrix;',
      'uniform mat4 uPMatrix;',

      'varying lowp vec4 vColor;',

      'void main(void) {',
      '   gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);',
      '   vColor = vec4(aVertexColor, 1.0);',
      '}'].join("\n"),
   fragShader: [
      'varying lowp vec4 vColor;',

      'void main(void) {',
      '   gl_FragColor = vColor;',
      '}'].join("\n"),
};
let selectedColorLine =  {  // we don't have geometry shader, so we have to manually pass barycentric to do 'single pass wireframe' 
vertex: [       // http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
   'attribute vec3 position;', 
   'attribute vec3 barycentric;',
   'uniform mat4 projection;', 
   'uniform mat4 worldView;',

   'varying vec3 vBC;',
   'void main(){',
      'vBC = barycentric;',
      'gl_Position = projection * worldView * vec4(position, 1.0);',
   '}'].join("\n"),

fragment:[
   '#extension GL_OES_standard_derivatives : enable',
   'precision mediump float;',
   'uniform vec4 faceColor;',
   'uniform vec4 color;',
   'uniform float lineWidth;',
   'varying vec3 vBC;',

   'float edgeFactor(){',
      'vec3 d = fwidth(vBC);',
      'vec3 a3 = smoothstep(vec3(0.0), d*lineWidth, vBC);',
      'return min(min(a3.x, a3.y), a3.z);',
   '}',

   'void main(){',
      // coloring by edge
      'float edge = edgeFactor();',
      'if (edge < 1.0) {',
        'gl_FragColor = mix(color, faceColor, edge);',
      '} else {',
         'discard;',
      '}',
   '}'].join("\n"),
};
let selectedColorPoint = {
   vertex: [
      'attribute vec3 position;',
      'attribute float vertexState;',
      'uniform mat4 worldView;',
      'uniform mat4 projection;',
      'uniform float vertexSize;',
      'uniform float selectedVertexSize;',
      'uniform float maskedVertexSize;',

      'varying lowp float vState;',

      'void main(void) {',
      '   gl_Position = projection * worldView * vec4(position, 1.0);',
      '   vState = vertexState;',
      '   if (vertexState == 0.0) {',
      '      gl_PointSize = vertexSize;',
      '   } else if (vertexState < 1.0) {',
      '      gl_PointSize = selectedVertexSize;',
      '   } else {',
      '      gl_PointSize = maskedVertexSize;',
      '   }',
      '}'].join("\n"),
   fragment: [
      'precision lowp float;',
      'varying lowp float vState;',
      'uniform vec4 vertexColor;',
      'uniform vec4 unselectedHilite;',
      'uniform vec4 selectedHilite;',
      'uniform vec4 selectedColor;',
      'uniform vec4 maskedVertexColor;',

      'void main(void) {',
      '   if (vState < 0.0) {',
      '      discard;',
      '   } else if (vState == 0.0) {',
      '      gl_FragColor = vertexColor;',     // unselected color         
      '   } else if (vState == 0.25) {',
      '      gl_FragColor = selectedColor;',
      '   } else if (vState == 0.5) {',
      '      gl_FragColor = unselectedHilite;',
      '   } else if (vState == 0.75) {',
      '      gl_FragColor = selectedHilite;',     
      '   } else {',
      '      gl_FragColor = maskedVertexColor;',
      '   }',
      '}'].join("\n"),
};
let textArray = {
   vertexShader:[
      'attribute vec4 aVertexPosition;',
      'attribute vec2 aTexCoord;',
      'uniform mat4 uMVMatrix;',
      'uniform mat4 uPMatrix;',
      'varying vec2 v_texcoord;',
      'void main() {',
         'gl_Position =  uPMatrix * uMVMatrix * aVertexPosition;',
         'v_texcoord = aTexCoord;',
      '}'].join("\n"),
   fragShader:[
      'precision mediump float;',
      'varying vec2 v_texcoord;',
      'uniform sampler2D u_texture;',
      'void main() {',
         'gl_FragColor = texture2D(u_texture, v_texcoord);',
      '}'].join("\n")
};
let cameraLight = {
   vertex:[
      'attribute vec3 position;',

      'uniform vec3 faceColor;',
      'uniform mat4 worldView;',
      'uniform mat4 projection;',

      'varying vec3 vPosition;',
      'varying vec3 vLight;',
      'varying vec3 vColor;',

      'void main(void) {',
      '   gl_Position = projection * worldView * vec4(position, 1.0);',
      '   vPosition =  (worldView * vec4(position, 1.0)).xyz;',
      '   vColor = faceColor;',
      '   vLight = vec3(0.0, 0.0, -1.0);',
      '}'].join("\n"),
   fragment:[
      '#extension GL_OES_standard_derivatives : enable',
      'precision mediump float;\n',
      'varying vec3 vPosition;',
      'varying vec3 vLight;',  // light direction
      'varying vec3 vColor;',

      'void main() {',
      '  vec3 n = normalize(cross(dFdy(vPosition), dFdx(vPosition)));', // N is the world normal
      //'  vec3 l = normalize(v_Light);' + // no needs, v_Light is always normalized.
      '  float diffuseFactor = dot(normalize(n), vLight);',
      '  if (diffuseFactor > 0.0) {',
      '    gl_FragColor = vec4(vColor * diffuseFactor, 1.0);',
      '  } else {',
      '    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);',
      '  }',
      '}'].join("\n"),
};
let solidColor = {
   vertex:[
      'attribute vec3 position;',

      'uniform mat4 worldView;',
      'uniform mat4 projection;',

      'void main(void) {',
      '  gl_Position = projection * worldView * vec4(position, 1.0);',
      '}'].join("\n"),
   fragment:[
      'precision mediump float;',
      'uniform vec4 faceColor;',
      'void main(void) {',
      '  gl_FragColor = faceColor;',
      '}'].join("\n")
};
let simplePoint = { 
   vertex: [
      'attribute vec3 position;',
      'attribute vec3 color;',
      'uniform mat4 worldView;',
      'uniform mat4 projection;',			
      
      'varying vec3 vColor;',
      'void main() {',
      '  vColor = color;',
      '  gl_Position = projection * worldView * vec4(position, 1.0);',
      '  gl_PointSize = 8.8;',
      '}'].join("\n"),
   fragment: [
      'precision mediump float;',
      'varying vec3 vColor;',

      'void main() {',
         ' gl_FragColor = vec4(vColor, 1.0);',
      '}'].join("\n")
};
let colorPoint = {
   vertex: [
      'attribute vec3 position;',
      'uniform mat4 worldView;',
      'uniform mat4 projection;',			
      
      'void main() {',
      '  gl_Position = projection * worldView * vec4(position, 1.0);',
      '  gl_PointSize = 8.8;',
      '}'].join("\n"),
   fragment: [
      'precision lowp float;',
      'uniform vec4 uColor;',

      'void main() {',
      // http://stackoverflow.com/questions/17274820/drawing-round-points-using-modern-opengl
         'float distance = distance( gl_PointCoord, vec2(0.5,0.5) );',
         'if ( distance >= 0.5 ) {',
            'discard;',  
         '}',
         'gl_FragColor = uColor;',
      '}'].join("\n"),
};
let solidWireframe = {  // we don't have geometry shader, so we have to manually pass barycentric to do 'single pass wireframe' 
   vertex: [       // http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
      'attribute vec3 position;', 
      'attribute vec3 barycentric;',
      'uniform mat4 projection;', 
      'uniform mat4 worldView;',

      'varying vec3 vBC;',
      'void main(){',
         'vBC = barycentric;',
         'gl_Position = projection * worldView * vec4(position, 1.0);',
      '}'].join("\n"),

   fragment:[
      '#extension GL_OES_standard_derivatives : enable',
      'precision mediump float;',
      'uniform vec4 color;',
      'uniform vec4 faceColor;',
      'varying vec3 vBC;',

      'float edgeFactor(){',
         'vec3 d = fwidth(vBC);',
         'vec3 a3 = smoothstep(vec3(0.0), d*1.1, vBC);',
         'return min(min(a3.x, a3.y), a3.z);',
      '}',

      'void main(){',
         // coloring by edge
         'gl_FragColor = mix(color, faceColor, edgeFactor());',
      '}'].join("\n"),
};
let edgeSolidWireframe = {  // we don't have geometry shader, so we have to manually pass barycentric to do 'single pass wireframe' 
      vertex: [       // http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
         'attribute vec3 position;', 
         'attribute vec3 barycentric;',
         'uniform mat4 projection;', 
         'uniform mat4 worldView;',

         'varying vec3 vBC;',
         'void main(){',
            'vBC = barycentric;',
            'gl_Position = projection * worldView * vec4(position, 1.0);',
         '}'].join("\n"),

      fragment:[
         '#extension GL_OES_standard_derivatives : enable',
         'precision mediump float;',
         'uniform vec4 color;',
         'uniform vec4 faceColor;',
         'uniform float lineWidth;',
         'varying vec3 vBC;',

         'float edgeFactor(){',
            'vec3 d = fwidth(vBC);',
            'vec3 a3 = smoothstep(vec3(0.0), d*lineWidth, vBC);',
            'return min(min(a3.x, a3.y), a3.z);',
         '}',

         'void main(){',
            // coloring by edge
            'gl_FragColor = mix(color, faceColor, edgeFactor());',
         '}'].join("\n"),
};
let colorSolidWireframe = {  // we don't have geometry shader, so we have to manually pass barycentric to do 'single pass wireframe' 
   vertex: [       // http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
      'attribute vec3 position;', 
      'attribute vec3 barycentric;',
      'attribute float selected;',  // (x,y), x is for edge, y is for interior. (y>0 is turnon), (x==1 is turnon).
      'uniform mat4 projection;', 
      'uniform mat4 worldView;',

      'varying vec3 vBC;',
      'varying float vSelected;',
      'void main(){',
         'vSelected = selected;',
         'vBC = barycentric;',
         'gl_Position = projection * worldView * vec4(position, 1.0);',
      '}'].join("\n"),

   fragment:[
      '#extension GL_OES_standard_derivatives : enable',
      'precision mediump float;',
      'uniform vec4 faceColor;',
      'uniform vec4 selectedColor;',  // hilite color
      'varying vec3 vBC;',
      'varying float vSelected;',

      'float edgeFactor(){',
         'vec3 d = fwidth(vBC);',
         'vec3 a3 = smoothstep(vec3(0.0), d*1.5, vBC);',
         'return min(min(a3.x, a3.y), a3.z);',
      '}',

      'void main(){',
         'vec4 interiorColor = faceColor;',
         'if (vSelected == 1.0) {',
         '  interiorColor = selectedColor;',
         '}',
         // coloring by edge
         'gl_FragColor.rgb = mix(vec3(0.0), vec3(interiorColor), edgeFactor());',
         'gl_FragColor.a = interiorColor[3];',
      '}'].join("\n"),
};

__WEBPACK_IMPORTED_MODULE_1__wings3d__["onReady"](function() {
   // compiled the program
   cameraLight = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(cameraLight.vertex, cameraLight.fragment);

   solidColor = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(solidColor.vertex, solidColor.fragment);

   simplePoint = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(simplePoint.vertex, simplePoint.fragment);

   colorPoint = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(colorPoint.vertex, colorPoint.fragment);

   solidWireframe = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(solidWireframe.vertex, solidWireframe.fragment);

   edgeSolidWireframe = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(edgeSolidWireframe.vertex, edgeSolidWireframe.fragment);

   colorSolidWireframe = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(colorSolidWireframe.vertex, colorSolidWireframe.fragment);

   selectedColorLine = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(selectedColorLine.vertex, selectedColorLine.fragment);

   selectedColorPoint = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(selectedColorPoint.vertex, selectedColorPoint.fragment);
});



/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "closestPointToPlane", function() { return closestPointToPlane; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "computeAngle", function() { return computeAngle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getAxisAngle", function() { return getAxisAngle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "computeEdgeNormal", function() { return computeEdgeNormal; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getAxisOrder", function() { return getAxisOrder; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "intersectTriangle", function() { return intersectTriangle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "intersectRayAAExtent", function() { return intersectRayAAExtent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "intersectRaySphere", function() { return intersectRaySphere; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "intersectPlaneSphere", function() { return intersectPlaneSphere; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "intersectPlaneAABB", function() { return intersectPlaneAABB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "intersectPlaneHEdge", function() { return intersectPlaneHEdge; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "projectVec3", function() { return projectVec3; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "rotationFromToVec3", function() { return rotationFromToVec3; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "reflectionMat4", function() { return reflectionMat4; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hexToRGB", function() { return hexToRGB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hexToRGBA", function() { return hexToRGBA; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hexToCssRGBA", function() { return hexToCssRGBA; });



const kEPSILON = 0.000001;

// Möller–Trumbore ray-triangle intersection algorithm
// should I use float64array? 
function intersectTriangle(ray, triangle) {
   var edge1 = vec3.create(), edge2 = vec3.create();
   /* find vectors for two edges sharing vert0 */
   vec3.sub(edge1, triangle[1], triangle[0]);
   vec3.sub(edge2, triangle[2], triangle[0]);

   /* begin calculating determinant - also used to calculate U parameter */
   var pvec = vec3.create();
   vec3.cross(pvec, ray.direction, edge2);

   /* if determinant is near zero, ray lies in plane of triangle */
   var det = vec3.dot(edge1, pvec);

   if (det < kEPSILON) { // cull backface, and nearly parallel ray
      return 0.0;
   }
   //if (det > -kEPSILON && det < kEPSILON), nearly parallel
   //  return 0;

   var inv_det = 1.0 / det;

   /* calculate distance from vert0 to ray origin */
   var tvec = vec3.create();
   vec3.sub(tvec, ray.origin, triangle[0]);

   /* calculate U parameter and test bounds */
   var u = vec3.dot(tvec, pvec) * inv_det;
   if (u < 0.0 || u > 1.0) {
     return 0.0;
   }

   /* prepare to test V parameter */
   var qvec = vec3.create();
   vec3.cross(qvec, tvec, edge1);

   /* calculate V parameter and test bounds */
   var v = vec3.dot(ray.direction, qvec) * inv_det;
   if (v < 0.0 || u + v > 1.0) {
     return 0.0;
   }

   /* calculate t, ray intersects triangle */
   var t = vec3.dot(edge2, qvec) * inv_det;
   return t;
};

// http://psgraphics.blogspot.com/2016/02/new-simple-ray-box-test-from-andrew.html
function intersectRayAAExtent(ray, aabb) {
   let tmin = Number.NEGATIVE_INFINITY;
   let tmax = Number.POSITIVE_INFINITY;
   for (let axis = 0; axis < 3; ++axis) {
      //const invD = 1.0 / ray.direction[axis];    // expect to be precalculate.
      let t0 = (aabb.min[axis] - ray.origin[axis]) * ray.invDir[axis];
      let t1 = (aabb.max[axis] - ray.origin[axis]) * ray.invDir[axis];
      if (ray.invDir[axis] < 0.0) { // swap
         let temp = t0; t0 = t1; t1 = temp;
      }
      tmin = t0 > tmin ? t0 : tmin;
      tmax = t1 < tmax ? t1 : tmax;
      if (tmax <= tmin) {
         return false;
      }
   }
   return (tmax > 0);
};

const intersectRaySphere = (function() {
	//  Fast Ray Sphere Intersection - eric haine, realtimerendering, similar to graphic gem's Jeff Hultquist
   const l = vec3.create();
   return function(ray, sphere) {
      vec3.sub(l, sphere.center, ray.origin);
	   const l2 = vec3.dot(l, l);
	   const projection = vec3.dot(l, ray.direction);
      if ((projection < 0.0) && (l2 > sphere.radius2)) { // sphere is totally behind the camera, not just sphere's origin
         return false;
      }
      if ((l2 - (projection*projection)) > sphere.radius2) {   // discriminant < 0.0f, no sqrt, no intersection.
         return false;
      }

      // don't care about true intersection of the 2, just there is a intersection.
      return true;
   };
})();


const intersectPlaneSphere = (function() {
   const pt = vec3.create();
   return function(plane, sphere) {
      closestPointToPlane(pt, sphere.center, plane);
      return vec3.squaredDistance(pt, sphere.center) < sphere.radius2;
   }
})();

// gamephysics cookbook.
function intersectPlaneAABB(plane, box) {
   const pLen = box.halfSize[0] * Math.abs(plane.normal[0]) + box.halfSize[1] * Math.abs(plane.normal[1]) + box.halfSize[2] * Math.abs(plane.normal[2]);
   const distance = vec3.dot(plane.normal, box.center) - plane.distance;
   return Math.abs(distance) <= pLen;
};

// return value:
// -2 for no intersection
// -1 for co planar on the plane
// 0-1 for intersection t.
// 0.5 when no (out) intersection pt provided.
// algorithm
// paul burke explain the intersection code pretty clearly.
// same side check and coplane check are from moller.
function intersectPlaneHEdge(out, plane, hEdge) {
   const pt0 = hEdge.origin.vertex;
   const pt1 = hEdge.destination().vertex;

   let d0 = vec3.dot(plane.normal, pt0) - plane.distance; 
   let d1 = vec3.dot(plane.normal, pt1) - plane.distance;
   // coplanarity check
   if (Math.abs(d0) < kEPSILON) { d0=0.0; }
   if (Math.abs(d1) < kEPSILON) { d1=0.0; }
   
   let t;
   if ((d0*d1) > 0) {  // check if on the same side
      return -2;
   } else if (d0 == 0.0) {
      if (d1 == 0.0) {  // co planar
         return -1;
      }
      t = 0;            // intersect at begin
   } else if (d1 == 0.0) {
      t = 1;            // intersect at end
   }

   // compute intersection pt (out).
   if (out) {
      if (t === undefined) {
         // t = (plane.normal dot (plane.pt - pt0)) / (plane.normal dot (pt1-pt0))
         vec3.sub(out, plane.pt, pt0);
         const tDer = vec3.dot(plane.normal, out);
         vec3.sub(out, pt1, pt0);
         t = tDer / vec3.dot(plane.normal, out);
      }
      // out = pt0 + t(pt1-pt0)
      vec3.scaleAndAdd(out, pt0, out, t);
   }

   return (t !== undefined)? t : 0.5;  // 0.5 for intersection not 0 or 1.
};

/* from
 * @article{MollerHughes99,
  author = "Tomas Möller and John F. Hughes",
  title = "Efficiently Building a Matrix to Rotate One Vector to Another",
  journal = "journal of graphics tools",
  volume = "4",
  number = "4",
  pages = "1-4",
  year = "1999",
}
http://jgt.akpeters.com/papers/MollerHughes99/code.html
*/
function rotationFromToVec3(mtx, from, to) {

  let e = vec3.dot(from, to);
  if (Math.abs(e) > (1.0-kEPSILON) ) { // "from" and "to"-vector almost parallel
      // find closest axis
      const x = vec3.fromValues(Math.abs(from[0]), Math.abs(from[1]), Math.abs(from[2]));   // vector most nearly orthogonal to "from"
      if (x[0] < x[1]) {
         if( x[0] < x[2] ) {
            x[0] = 1.0; x[1] = x[2] = 0.0;
         } else {
            x[2] = 1.0; x[0] = x[1] = 0.0;
         }
      } else {
         if( x[1] < x[2] ) {
            x[1] = 1.0; x[0] = x[2] = 0.0;
         } else {
            x[2] = 1.0; x[0] = x[1] = 0.0;
         }
      }

      // compute the matrix
      let ut = vec3.fromValues(x[0] - from[0], x[1] - from[1], x[2] - from[2]);  // sub(v, x, from);
      let vt = vec3.fromValues(x[0] - to[0],   x[1] - to[1],   x[2] - to[2]);

      let c1 = 2.0 / vec3.dot(ut, ut);       // coefficients
      let c2 = 2.0 / vec3.dot(vt, vt);
      let c3 = c1 * c2  * vec3.dot(ut, vt);
      for (let i = 0; i < 3; i++) {
         let k = i*4;      // stride.
         for (let j = 0; j < 3; j++) {
            mtx[k+j] =  -c1 * ut[i] * ut[j] - c2 * vt[i] * vt[j] + c3 * vt[i] * ut[j];
         }
         mtx[k+i] += 1.0;
      }
   } else  {// the most common case, unless "from"="to", or "from"=-"to" 
      let v = vec3.create();
      vec3.cross(v, from, to);
      // ...otherwise use this hand optimized version (9 mults less)
      //let h = 1.0 / (1.0 + e);      // optimization by Gottfried Chen
      let h = (1.0 -e)/ vec3.dot(v, v);
      let hvx = h * v[0];
      let hvz = h * v[2];
      let hvxy = hvx * v[1];
      let hvxz = hvx * v[2];
      let hvyz = hvz * v[1];
      mtx[0] = e + hvx * v[0];
      mtx[1] = hvxy + v[2];
      mtx[2] = hvxz - v[1];

      mtx[4] = hvxy - v[2];
      mtx[5] = e + h * v[1] * v[1];
      mtx[6] = hvyz + v[0];

      mtx[8] = hvxz + v[1];
      mtx[9] = hvyz - v[0];
      mtx[10] = e + hvz * v[2];
   }

   return mtx;
};

/*
References
https://www.opengl.org/discussion_boards/showthread.php/147784-Mirror-Matrices
https://www.opengl.org/discussion_boards/showthread.php/169605-reflection-matrix-how-to-derive
"3D Math Primer for Graphics andGame Development" by Fletcher Dunn, Ian Parberry
*/
function reflectionMat4(mat, norm, pt) {
   const d = -vec3.dot(norm, pt);

	mat[0] = -2 * norm[0] * norm[0] + 1;
	mat[1] = -2 * norm[1] * norm[0];
	mat[2] = -2 * norm[2] * norm[0];
	mat[3] = 0;
 
	mat[4] = -2 * norm[0] * norm[1];
	mat[5] = -2 * norm[1] * norm[1] + 1;
	mat[6] = -2 * norm[2] * norm[1];
	mat[7] = 0;
 
	mat[8] =	-2 * norm[0] * norm[2];
	mat[9] = -2 * norm[1] * norm[2];
	mat[10] = -2 * norm[2] * norm[2] + 1;
	mat[11] = 0;
 
	mat[12] = -2 * norm[0] * d;
	mat[13] = -2 * norm[1] * d;
	mat[14] = -2 * norm[2] * d;
   mat[15] = 1;
   return mat;
};


// angle is between (-PI, PI). equivalent to (-180, 180) degree.
function computeAngle(crossNorm, v0, v1, v2) {
   let edge0 = vec3.create(), edge1 = vec3.create();
   // angle = pi - atan2(v[i] x v[i+1].magnitude, v[i] * v[i+1]);
   vec3.sub(edge0, v0.vertex, v1.vertex);
   vec3.sub(edge1, v2.vertex, v1.vertex);
   vec3.cross(crossNorm, edge0, edge1);
   let rad = Math.atan2(vec3.length(crossNorm), vec3.dot(edge0, edge1));
   vec3.normalize(crossNorm, crossNorm);
   return rad;
}

function getAxisAngle(axis, vFrom, vTo) {
   vec3.cross(axis, vFrom, vTo);
   let rad = Math.atan2(vec3.length(axis), vec3.dot(vFrom, vTo));
   vec3.normalize(axis, axis);
   return rad;
   //return 2*Math.acos( Math.abs( vec3.dot(vFrom, vTo), -1, 1 ) );
}


// the input (left, right) is on the same Vertex.
function computeEdgeNormal(normal, leftHEdge, rightHEdge) {
   //let normal = vec3.create();
   let radian = computeAngle(normal, leftHEdge.destination(), leftHEdge.origin, rightHEdge.destination());
   radian = Math.abs(radian);
   if ((radian < kEPSILON) || (radian > (Math.PI-kEPSILON))) {   // nearly parallel, now get face
      vec3.set(normal, 0, 0, 0);
      if (leftHEdge.face) {
         vec3.add(normal, normal, leftHEdge.face.normal);
      }
      if (rightHEdge.pair.face) {
         vec3.add(normal, normal, rightHEdge.pair.face);
      }
   }
   // compute normal
   vec3.normalize(normal, normal);
};

function projectVec3(vertices, planeNormal, planeOrigin) {
   const pt = vec3.create();

   for (let vertex of vertices) {
      vec3.sub(pt, vertex.vertex, planeOrigin);
      let d = vec3.dot(pt, planeNormal);
      vec3.scale(pt, planeNormal, d);
      vec3.sub(vertex.vertex, vertex.vertex, pt);
   }
};

function closestPointToPlane(out, point, plane) { // projection to plane
   const distance = vec3.dot(plane.normal, point) - plane.distance;
   vec3.scaleAndAdd(out, point, plane.normal, -distance);
};

function getAxisOrder(extent) {
   let size = vec3.create();
   vec3.sub(size, extent.max, extent.min);
   let first, second, third;
   if (size[0] > size[1]) {
      if (size[0] > size[2]) {
         first = 0;
         if (size[1] > size[2]) {
            second = 1;
            third = 2;
         } else {
            second = 2;
            third = 1;
         }
      }
   } else if (size[1] > size[2]) {

   } else {

   }

   return [first, second, third];
};

function hexToRGB(hex) {
   return [parseInt(hex.slice(1, 3), 16)/255,
           parseInt(hex.slice(3, 5), 16)/255,
           parseInt(hex.slice(5, 7), 16)/255];
 };
function hexToRGBA(hex) {
  return [parseInt(hex.slice(1, 3), 16)/255,
          parseInt(hex.slice(3, 5), 16)/255,
          parseInt(hex.slice(5, 7), 16)/255,
          1.0];
};

function hexToCssRGBA(hex) {  // microsft edge don't support #rrggbbaa format yet, so we convert to rgba() 2018/09/24.
   const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
   const a = parseInt(hex.slice(7, 9), 16) / 255;
   return `rgba(${r}, ${g}, ${b}, ${a})`;
};





/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Madsor", function() { return Madsor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MultiMadsor", function() { return MultiMadsor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DragSelect", function() { return DragSelect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GenericEditCommand", function() { return GenericEditCommand; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MovePositionHandler", function() { return MovePositionHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MouseMoveAlongAxis", function() { return MouseMoveAlongAxis; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MoveDirectionHandler", function() { return MoveDirectionHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MoveBidirectionHandler", function() { return MoveBidirectionHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MoveAlongNormal", function() { return MoveAlongNormal; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MoveFreePositionHandler", function() { return MoveFreePositionHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MouseRotateAlongAxis", function() { return MouseRotateAlongAxis; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ToggleCheckbox", function() { return ToggleCheckbox; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ToggleModeCommand", function() { return ToggleModeCommand; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_undo__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_model__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_shaderprog__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_view__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_boundingvolume__ = __webpack_require__(13);
/*
 *
 * MADS (Modify, Add, Delete, Select) operation. 
 *
**/









class Madsor { // Modify, Add, Delete, Select, (Mads)tor. Model Object.
   constructor(mode) {
      this.modeString = mode;
      if (mode === 'Multi') {
         return;
      }
      mode = mode.toLowerCase();
      const self = this;
      // contextMenu
      this.contextMenu = {menu: document.querySelector("#"+mode+"-context-menu")};
      if (this.contextMenu.menu) {
         this.contextMenu.menuItems = this.contextMenu.menu.querySelectorAll(".context-menu__item");
      }
      const axisVec = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      const axisName = ['X', 'Y', 'Z'];
      // type handler 
      // movement for (x, y, z)
      for (let axis=0; axis < 3; ++axis) {
         __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__["bindMenuItem"](mode + 'Move' + axisName[axis], function(ev) {
               __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["attachHandlerMouseMove"](new MouseMoveAlongAxis(self, axis));
            });
      }
      // free Movement.
      const moveFree = {body: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].bodyMoveFree, face: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceMoveFree, edge: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeMoveFree, vertex: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexMoveFree};
      __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__["bindMenuItem"](moveFree[mode].name, function(ev) {
            __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["attachHandlerMouseMove"](new MoveFreePositionHandler(self));
         });
      // normal Movement.
      const moveNormal = {face: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceMoveNormal, edge: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeMoveNormal, vertex: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexMoveNormal};
      if (moveNormal[mode]) {
         __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__["bindMenuItem"](moveNormal[mode].name, function(ev) {
            __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["attachHandlerMouseMove"](new MoveAlongNormal(self));
          });
      }
      // scale uniform
      const scaleUniform = {face: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceScaleUniform, edge: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeScaleUniform, vertex: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexScaleUniform, body: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].bodyScaleUniform};
      __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__["bindMenuItem"](scaleUniform[mode].name, (_ev) => {
         __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["attachHandlerMouseMove"](new ScaleHandler(this, [1, 1, 1]));
       });
      // rotate x, y, z
      for (let axis = 0; axis < 3; ++axis) {
         __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__["bindMenuItem"](mode + 'Rotate' + axisName[axis], (ev) => {
            const vec = [0, 0, 0]; vec[axis] = 1.0;
            __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["attachHandlerMouseMove"](new MouseRotateAlongAxis(this, vec));
          });
      }
      // Bevel
      const bevel = {face: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceBevel, edge: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeBevel, vertex: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexBevel};
      if (bevel[mode]) {
         __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__["bindMenuItem"](bevel[mode].name, (ev)=> {
            __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["attachHandlerMouseMove"](new BevelHandler(this));
          });
      }
      // extrude
      const extrude = {face: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceExtrudeX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceExtrudeY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceExtrudeZ],
                       edge: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeExtrudeX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeExtrudeY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeExtrudeZ],
                       vertex:  [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexExtrudeX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexExtrudeY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexExtrudeZ],};
      let extrudeMode = extrude[mode];
      if (extrudeMode) {
         // movement for (x, y, z)
         for (let axis=0; axis < 3; ++axis) {
            __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__["bindMenuItem"](extrudeMode[axis].name, (ev) => {
                  __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["attachHandlerMouseMove"](new ExtrudeAlongAxisHandler(this, axis));
             });
         }
      }
      const extrudeFree = {face: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceExtrudeFree, edge: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeExtrudeFree, vertex: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexExtrudeFree };
      if (extrudeFree[mode]) {
         __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__["bindMenuItem"](extrudeFree[mode].name, (ev) => {
            __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["attachHandlerMouseMove"](new ExtrudeFreeHandler(this));
          });
      }
      const extrudeNormal = {face: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceExtrudeNormal, edge: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeExtrudeNormal, vertex: __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexExtrudeNormal};
      if (extrudeNormal[mode]) {
         __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__["bindMenuItem"](extrudeNormal[mode].name, (ev) => {
            __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["attachHandlerMouseMove"](new ExtrudeNormalHandler(this));
          });
      }
      // flatten x,y,z
      const flatten = {face: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceFlattenX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceFlattenY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceFlattenZ],
                       edge: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeFlattenX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeFlattenY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeFlattenZ],
                       vertex: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexFlattenX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexFlattenY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexFlattenZ] };
      let flattenMode = flatten[mode];
      if (flattenMode) {
         for (let axis = 0; axis < 3; ++axis) {
            __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__["bindMenuItem"](flattenMode[axis].name, (_ev) => {
               const cmd = new GenericEditCommand(this, this.flatten, [axisVec[axis]]);
               if (cmd.doIt()) {
                  __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["undoQueue"](cmd);
               }
             });
         }
      }
      // scale axis and radial
      const radialVec = [[0, 1, 1], [1, 0, 1], [1, 1, 0]];
      const scaleAxis = {face: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceScaleAxisX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceScaleAxisY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceScaleAxisZ],
                         edge: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeScaleAxisX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeScaleAxisY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeScaleAxisZ],
                       vertex: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexScaleAxisX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexScaleAxisY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexScaleAxisZ],
                         body: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].bodyScaleAxisX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].bodyScaleAxisY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].bodyScaleAxisZ]};
      const scaleAxisMode = scaleAxis[mode];
      const scaleRadial = {face: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceScaleRadialX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceScaleRadialY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].faceScaleRadialZ],
                           edge: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeScaleRadialX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeScaleRadialY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].edgeScaleRadialZ],
                         vertex: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexScaleRadialX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexScaleRadialY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].vertexScaleRadialZ],
                           body: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].bodyScaleRadialX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].bodyScaleRadialY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].bodyScaleRadialZ]};
      const scaleRadialMode = scaleRadial[mode];
      for (let axis = 0; axis < 3; ++axis) {
         __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__["bindMenuItem"](scaleAxisMode[axis].name, (_ev) => {
            __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["attachHandlerMouseMove"](new ScaleHandler(this, axisVec[axis]));
          });
         __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__["bindMenuItem"](scaleRadialMode[axis].name, (_ev) => {
            __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["attachHandlerMouseMove"](new ScaleHandler(this, radialVec[axis]));
          });
      }
      // plane Cut
      const planeCut = { face: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].facePlaneCutX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].facePlaneCutY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].facePlaneCutZ], 
                         body: [__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].bodyPlaneCutX, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].bodyPlaneCutY, __WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].bodyPlaneCutZ], };
      const planeCutMode = planeCut[mode];
      if (planeCutMode) {
         for (let axis = 0; axis < 3; ++axis) {
            __WEBPACK_IMPORTED_MODULE_4__wings3d_ui__["bindMenuItem"](planeCutMode[axis].name, (_ev) =>{
               __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["attachHandlerMouseSelect"](new PlaneCutHandler(this, axisVec[axis]));
             });
         }
      }
   }

   modeName() {
      return this.modeString;
   }

   getContextMenu() {
      if (this.hasSelection()) {
         return this.contextMenu;
      } else {
         return null;
      }
   }

   snapshotAll(func, ...args) {
      const snapshots = [];
      //for (let preview of View.getWorld()) {
      for (let preview of this.selectableCage()) {
         if (preview.hasSelection()) {
            const snapshot = func.call(preview, ...args);
            if (snapshot || (snapshot === false)) {
               snapshots.push( {preview: preview, snapshot: snapshot} );
            }
         }
      }
      return snapshots;
   }

   /**
    * should we make it static?
    * @param {*} targets 
    * @param {*} func 
    * @param  {...any} args 
    */
   snapshotTarget(targets, func, ...args) {
      const snapshots = [];
      for (let preview of targets) {
         const snapshot = func.call(preview, ...args);
         if (snapshot || (snapshot === false)) {
            snapshots.push( {preview: preview, snapshot: snapshot} );
         }
      }
      return snapshots;
   }

   doAll(snapshots, func, ...args) {
      if (snapshots) {
         for (let obj of snapshots) {
            func.call(obj.preview, obj.snapshot, ...args);
         }
      } else {
         for (let preview of this.eachCage()) {
            func.call(preview, undefined, ...args);
         }
      }
   }

   resultAll(func, ...args) {
      for (let preview of this.selectedCage()) {
         if (func.call(preview, ...args)) {
            return true;
         }
      }
      return false;
   }

   * eachCage() {
      for (let cage of __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["getWorld"]()) {
         yield cage;
      }
   }

   * selectableCage() {
      const world = __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["getWorld"]();
      for (let i = 0; i < world.length; ++i) {
         let cage = world[i];
         if (!cage.isLock() && cage.isVisible()) {
            yield cage;
         }
      }
   }

   * selectedCage() {
      for (let cage of __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["getWorld"]()) {
         if (!cage.isLock() && cage.isVisible() && cage.hasSelection()) {
            yield cage;
         }
      }
   }

   * notSelectedCage() {
      for (let cage of __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["getWorld"]()) {
         if (!cage.isLock() && cage.isVisible() && !cage.hasSelection()) {
            yield cage;
         }
      }
   }

   // visible but may be lock/unlock
   * visibleCage() {
      for (let cage of __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["getWorld"]()) {
         if (cage.isVisible()) {
            yield cage;
         }
      }
   }

   * visibleWireCage(wireMode) {
      for (let cage of __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["getWorld"]()) {
         if (cage.isVisible() && (cage.isWireMode() === wireMode)) {
            yield cage;
         }
      }
   }

   hasSelection() {
      for (let cage of this.selectableCage()) {
         if (!cage.isLock() && cage.hasSelection()) {
            return true;
         }
      }
      return false;
   }

   restoreMoveSelection(snapshots) {
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.restoreMoveSelection);
   }

   // move vertices
   moveSelection(snapshots, movement) {
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.moveSelection, movement);
   }

   restoreSelectionPosition(snapshots) {
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.restoreMoveSelection);
   }

   // scale vertices along axis
   scaleSelection(snapshots, scale, axis) {
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.scaleSelection, scale, axis);
   }

   // rotate vertices
   rotateSelection(snapshots, quatRotate, center) {
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.rotateSelection, quatRotate, center);
   }

   snapshotSelection() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype['snapshotSelection' + this.modeName()]);
   }

   _doSelection(doName, forceAll=false) {
      doName = '_select' + this.modeName() + doName;
      const snapshots = [];
      for (let cage of this.eachCage()) {    // this is snapshot all
         if (forceAll || cage.hasSelection()) {
            snapshots.push( {preview: cage, snapshot: cage[doName]()} );
         }
      }
      if (snapshots.length > 0) {
         return {undo: this.undoDoSelection, snapshots: snapshots};
      }
      return false;  // null? 
   }

   similarSelection() {
      return this._doSelection('Similar');
   }

   adjacentSelection() {
      return this._doSelection('Adjacent');
   }

   invertSelection() {
      return this._doSelection('Invert', true);
   }

   allSelection() {
      return this._doSelection('All', true);
   }

   lessSelection() {
      return this._doSelection('Less');
   }

   moreSelection() {
      return this._doSelection('More');
   }

   resetSelection() {
      for (let cage of this.selectedCage()) {
         this._resetSelection(cage);
      }
   }

   restoreSelection(selection) {
      this.doAll(selection, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.restoreSelection, this); 
   }

   undoDoSelection(snapshots) {
      this.resetSelection();
      this.restoreSelection(snapshots);
   }

   selectObject(objects, input) {
      if (input.checked) {
         return this.snapshotTarget(objects, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype['_select' + this.modeName() + 'All']);
      } else {
         return this.snapshotTarget(objects, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype['_resetSelect' + this.modeName()]);
      }
   }

   undoSelectObject(selection, input) {
      if (input.checked) {
         this.doAll(selection, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype['_resetSelect' + this.modeName()]); // unselected All then
      }
      this.doAll(selection, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.restoreSelection, this); // restore
   }

   toggleObjectLock(objects, input) {
      return this.snapshotTarget(objects, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.toggleLock, input.checked);
   }

   undoToggleObjectLock(selection) {
      this.doAll(selection, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.toggleLock);   // restore
   }

   toggleObjectVisibility(objects, input) {
      return this.snapshotTarget(objects, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.setVisible, !input.checked); // checked is invisible
   }

   undoObjectVisibility(selection) {
      return this.doAll(selection, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.setVisible);
   }

   toggleObjectWireMode(objects, checked) {
      return this.snapshotTarget(objects, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.toggleWireMode, checked);
   }

   undoToggleObjectWireMode(selection) {
      return this.doAll(selection, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.toggleWireMode);
   }

   isVertexSelectable() { return false; }
   isEdgeSelectable() { return false; }
   isFaceSelectable() { return false; }

   toggleMulti(_hilite) {}

   // default draw FaceHlite, needs to override by vertex/edge/multi mode.
   drawExtra(gl, draftBench) {
      gl.useShader(__WEBPACK_IMPORTED_MODULE_2__wings3d_shaderprog__["solidColor"]);
      gl.bindTransform();
      // draw hilite
      draftBench.drawHilite(gl);
      //gl.disableShader();
   }

   // override by edge only
   previewShader(gl) {
      gl.useShader(__WEBPACK_IMPORTED_MODULE_2__wings3d_shaderprog__["solidWireframe"]);
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

   dragSelect(cage, hilite) {
      var array = this.select.get(cage);
      if (array === undefined) {
         array = [];
         this.select.set(cage, array);
      }
      this.madsor.dragSelect(cage, hilite, array, this.onOff);
   }
}


class ToggleCheckbox extends __WEBPACK_IMPORTED_MODULE_0__wings3d_undo__["EditCommand"] {
   constructor(input) {
      super();
      this.input = input;
   }

   doIt() {
      this.input.checked = !this.input.checked;
   }

   undo() {
      this.input.checked = !this.input.checked;
   }
}


class ToggleModeCommand extends __WEBPACK_IMPORTED_MODULE_0__wings3d_undo__["EditCommand"] {
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



class MovePositionHandler extends __WEBPACK_IMPORTED_MODULE_0__wings3d_undo__["MouseMoveHandler"] {
   constructor(madsor, snapshots, movement) {
      super();
      this.madsor = madsor;
      this.snapshots = snapshots;
      this.movement = movement;
   }

   isDoable() {
      return (this.snapshots.length > 0);
   }

   doIt() {
      if (this.snapshots.length > 0) {
         //if (this.movement !== 0) {
            this._transformSelection(this.movement);
         //}
         return true;
      }
      return false;
   }

   undo() {
      this.madsor.restoreSelectionPosition(this.snapshots);
   }

   handleMouseMove(ev, cameraView) {
      this._transformSelection(this._updateMovement(ev, cameraView));
   }

   _transformSelection(transform) {
      this.madsor.moveSelection(this.snapshots, transform);
   }
}


class MoveVertexHandler extends MovePositionHandler { // temp refactoring class
   constructor(madsor, movement, cmd) {
      super(madsor, null, movement);
      this.cmd = cmd;
   }

   doIt() {
      if (this.cmd) {
         this.cmd.doIt();
         this.snapshots = this.cmd.snapshotPosition();
      } else {
         this.snapshots = this.snapshotPosition();
      }
      super.doIt();
      return true;
   }

   undo() {
      if (this.cmd) {
         this.cmd.undo();   // no need to restore to be deleted position
      } else {
         super.undo();
      }

   }
}


// movement handler.
class MouseMoveAlongAxis extends MovePositionHandler {
   constructor(madsor, axis) {   // 0 = x axis, 1 = y axis, 2 = z axis.
      super(madsor, madsor.snapshotPosition(), [0.0, 0.0, 0.0]);
      this.axis = axis;
   }

   _updateMovement(ev) {
      let move = this._calibrateMovement(ev.movementX);
      let movement = [0.0, 0.0, 0.0];
      movement[this.axis] = move;
      this.movement[this.axis] += move;
      return movement;
   }
}

class MoveDirectionHandler extends MoveVertexHandler {
   constructor(madsor, cmd, noNegative=false) {
      super(madsor, 0, cmd);
      this.noNegative = noNegative;
   }
   
   _updateMovement(ev) {
      let move = this._calibrateMovement(ev.movementX);
      this.movement += move;
      if (this.noNegative && (this.movement < 0)) {
         move -= this.movement;
         this.movement = 0.0;
      }
      return move;
   }
}


class MoveBidirectionHandler extends MoveVertexHandler {
   constructor(madsor, cmd) {
      super(madsor, 0, cmd);
   }

   // override original handler. this
   handleMouseMove(ev, _cameraView) {
      let move = this._calibrateMovement(ev.movementX);
      if (move > 0) {
         if ((this.movement < 0) && ((this.movement+move) >=0)) { // negativeDir done
            this.madsor.moveSelection(this.snapshots, -this.movement);
            move += this.movement;
            this.movement = 0;
            this.madsor.doAll(this.snapshots, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.positiveDirection);
         }
      } else {
         if ((this.movement >= 0) && ((this.movement+move) < 0)) {
            this.madsor.moveSelection(this.snapshots, -this.movement);
            move += this.movement;
            this.movement = 0;
            this.madsor.doAll(this.snapshots, __WEBPACK_IMPORTED_MODULE_1__wings3d_model__["PreviewCage"].prototype.negativeDirection);
         }
      }
      this.movement += move;
      this.madsor.moveSelection(this.snapshots, move);
   }
}

class MoveAlongNormal extends MovePositionHandler {
   constructor(madsor, noNegative = false, snapshots) {
      if (!snapshots) {
         snapshots = madsor.snapshotPositionAndNormal();
      }
      super(madsor, snapshots, 0.0);
      this.noNegative = noNegative;
   }

   _updateMovement(ev) {
      let move = this._calibrateMovement(ev.movementX);
      this.movement += move;
      if (this.noNegative && (this.movement < 0)) {
         move -= this.movement;
         this.movement = 0.0;
      }
      return move;
   }
}


class MoveFreePositionHandler extends MovePositionHandler {
   constructor(madsor) {
      super(madsor, madsor.snapshotPosition(), [0.0, 0.0, 0.0]);
   }

   _updateMovement(ev, cameraView) {
      let x = this._calibrateMovement(ev.movementX);
      let y = this._calibrateMovement(-ev.movementY);
      var cam = cameraView.inverseCameraVectors();
      // move parallel to camera.
      var movement = [cam.x[0]*x + cam.y[0]*y, cam.x[1]*x + cam.y[1]*y, cam.x[2]*x + cam.y[2]*y];
      vec3.add(this.movement, this.movement, movement);
      return movement;
   }
}


class ScaleHandler extends MovePositionHandler {
   constructor(madsor, axis) {
      const snapshots = madsor.snapshotTransformGroup();
      super(madsor, snapshots, 1.0);
      this.axis = axis;
   }

   _transformSelection(scale) {
      this.madsor.scaleSelection(this.snapshots, scale, this.axis);
   }

   _updateMovement(ev, _camera) {
      let scale = this._xPercentMovement(ev);   // return (100% to -100%)
      if (scale < 0) {
         scale = 1.0 + Math.abs(scale);
      } else {
         scale = 1.0 / (1.0 + scale);
      }
      this.movement *= scale;
      return scale;
   }
}


// movement handler.
class MouseRotateAlongAxis extends __WEBPACK_IMPORTED_MODULE_0__wings3d_undo__["EditCommand"] {
   constructor(madsor, axis, center) {   // axis directly
      super();
      this.madsor = madsor;
      this.snapshots = madsor.snapshotTransformGroup();
      this.movement = 0.0;             // cumulative movement.
      this.axisVec3 = vec3.clone(axis);
      this.center = center;
   }

   handleMouseMove(ev) {
      const move = this._xPercentMovement(ev)*5;
      const quatRotate = quat.create();
      quat.setAxisAngle(quatRotate, this.axisVec3, move);
      this.madsor.rotateSelection(this.snapshots, quatRotate, this.center);
      this.movement += move;
   }

   doIt() {
      const quatRotate = quat.create();
      quat.setAxisAngle(quatRotate, this.axisVec3, this.movement);
      this.madsor.rotateSelection(this.snapshots, quatRotate, this.center);
   }

   undo() {
      this.madsor.restoreSelectionPosition(this.snapshots);
   }
}


class BevelHandler extends MovePositionHandler {
   constructor(madsor) {
      const selection = madsor.snapshotSelection();   // have to get selection first
      super(madsor, madsor.bevel(), 0.0);
      this.selection = selection;
      // get limit
      this.vertexLimit = Number.MAX_SAFE_INTEGER;
      for (let snapshot of this.snapshots) {
         this.vertexLimit = Math.min(this.vertexLimit, snapshot.vertexLimit);
      }
   }

   _updateMovement(ev) {
      let move = this._calibrateMovement(ev.movementX);
      if ((this.movement+move) > this.vertexLimit) {
         move = this.vertexLimit - this.movement;
      } else if ((this.movement+move) < 0) {
         move = 0 - this.movement;
      }
      this.movement += move;
      return move;
   }

   doIt() {
      this.snapshots = this.madsor.bevel();   // should test for current snapshots and prev snapshots? should not change
      // no needs to recompute limit, wont change, 
      // move 
      super.doIt();  // = this.madsor.moveSelection(this.snapshots, this.movement);
   }

   undo() {
      this.madsor.undoBevel(this.snapshots, this.selection);
      //this.snapshots = undefined;
   }
}

// extrude
class ExtrudeHandler extends __WEBPACK_IMPORTED_MODULE_0__wings3d_undo__["MoveableCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.contourEdges = madsor.extrude();
   }

   doIt() {
      this.contourEdges = this.madsor.extrude(this.contourEdges);
      super.doIt();     // = this.madsor.moveSelection(this.snapshots, this.movement);
   }

   undo() {
      super.undo(); //this.madsor.restoreSelectionPosition(this.snapshots);
      this.madsor.undoExtrude(this.contourEdges);
   }
}

class ExtrudeAlongAxisHandler extends ExtrudeHandler {
   constructor(madsor, axis) { 
      super(madsor);
      this.moveHandler = new MouseMoveAlongAxis(madsor, axis); // this should comes earlier
   }
}


class ExtrudeFreeHandler extends ExtrudeHandler {
   constructor(madsor) {
      super(madsor);
      this.moveHandler = new MoveFreePositionHandler(madsor);
   }
}

class ExtrudeNormalHandler extends ExtrudeHandler {
   constructor(madsor) {
      super(madsor);
      this.moveHandler = new MoveAlongNormal(madsor);
   }
}
// end of extrude

class PlaneCutHandler extends __WEBPACK_IMPORTED_MODULE_0__wings3d_undo__["EditSelectHandler"] {
   constructor(madsor, planeNorm) {
      super(true, true, true, planeNorm);
      this.madsor = madsor;
      this.center = vec3.create();
   }

   hilite(hilite, _currentCage) {
      if (hilite.plane) {
         this.plane = new __WEBPACK_IMPORTED_MODULE_6__wings3d_boundingvolume__["Plane"](this.planeNormal, hilite.plane.center);
         if (this.madsor.planeCuttable(this.plane)) {
            hilite.plane.hilite = true;
            return true;
         }
         hilite.plane.hilite = false;
         delete this.plane;
      }
      return true;   // always true, we want user to see selection.
   }
   
   select(_hilite) {
      if (this.plane) { // doIt   
         return this.doIt();
      }
      return false;
   }

   doIt() {
      if (this.plane) {
         this.cut = this.madsor.planeCut(this.plane);
         if (this.cut.length > 0) {
            __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["restoreVertexMode"](this.cut);
            this.vertexConnect = __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["currentMode"]().connectVertex();   // assurely it vertexMode
            return this.vertexConnect.doIt();
         }
      }
      return false;
   }

   undo() {
      if (this.vertexConnect) {
         this.vertexConnect.undo();
         delete this.vertexConnect; // we are in vertex mode
         this.madsor.undoPlaneCut(this.cut);
      }
   }
}


class GenericEditCommand extends __WEBPACK_IMPORTED_MODULE_0__wings3d_undo__["EditCommand"] {
   constructor(madsor, doCmd, doParams, undoCmd, undoParams) {
      super();
      this.madsor = madsor;
      this.doCmd = doCmd;
      this.doParams = doParams;
      this.undoCmd = undoCmd; 
      this.undoParams = undoParams;
   }

   doIt(_currentMadsor) {
      this.snapshots = this.doCmd.call(this.madsor, ...(this.doParams? this.doParams : []));
      return (this.snapshots.length > 0);
   }

   undo(_currentMadsor) {
      if (this.undoCmd) {
         this.undoCmd.call(this.madsor, this.snapshots, ...(this.undoParams? this.undoParams : []) );
      } else {
         this.madsor.restoreSelectionPosition(this.snapshots);
      }
   }

   snapshotPosition() {
      return this.snapshots;
   }
}




/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "WingedEdge", function() { return WingedEdge; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HalfEdge", function() { return HalfEdge; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Vertex", function() { return Vertex; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Polygon", function() { return Polygon; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MeshAllocator", function() { return MeshAllocator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "WingedTopology", function() { return WingedTopology; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_model__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_vm__ = __webpack_require__(33);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_vm___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_vm__);



/* require glmatrix
* http://kaba.hilvi.org/homepage/blog/halfedge/halfedge.htm. very nicely written half-edge explanation and pseudo code.
* https://fgiesen.wordpress.com/2012/02/21/half-edge-based-mesh-representations-theory/
* https://fgiesen.wordpress.com/2012/03/24/half-edge-based-mesh-representations-practice/
* https://fgiesen.wordpress.com/2012/04/03/half-edges-redux/ coder's perspective from requirement to implementation.
*
* http://mrl.nyu.edu/~dzorin/ig04/lecture24/meshes.pdf
* winged edge can have consistent orientation of edge. contray to what commonly believed.
* we composed WingedEdge using 2 half edge. slightly easier traversal, don't needs to test for which side we are on.
%% Edge in Wing3d a winged-edge object.
%%
%%                \       /           
%%                 \     /            
%%            ltpr  \   / rtsu        
%%                   \ /              
%%                   ve  b            
%%                    |               
%%                    |               
%%       lf           |          rf   
%%                    |               
%%                    |               
%%                 a  vs              
%%                   / \              
%%            ltsu  /   \ rtpr        
%%                 /     \            
%%                /       \           
%%                             
* our face is oriented counter clockwise.  
*
*/
"use strict";

var WingedEdge = function(orgVert, toVert) {
   this.index = -1;
   this.left = new HalfEdge(orgVert, this);
   this.right = new HalfEdge(toVert, this);
   this.left.pair = this.right;
   // link together for a complete loop
   this.left.next = this.right;
   // this.left.prev = this.right;
   this.right.pair = this.left;
   this.right.next = this.left;
   // this.right.prev = this.left;
   this.state = 0;
};

WingedEdge.prototype[Symbol.iterator] = function* () {
   yield this.left;
   yield this.right;
};

/**
 * buildup drawingLine using triangle
 * @param {Uint32Array} data - array
 * @param {number} idx - start index
 * @param {number} vertexLength - center is after vertexLength.
 * @return {number} - current index position.
 */
WingedEdge.prototype.buildIndex = function(data, idx, vertexLength) {
   if (this.left.face && this.left.face.isVisible()) {
      data[idx++] = this.left.origin.index;
      data[idx++] = this.right.origin.index;
      data[idx++] = this.left.face.index + vertexLength;
   }
   if (this.right.face && this.right.face.isVisible()) {
      data[idx++] = this.right.origin.index;
      data[idx++] = this.left.origin.index;
      data[idx++] = this.right.face.index + vertexLength;
   }
   return idx;
}

WingedEdge.prototype.isLive = function() {
   return (this.left.origin !== null) && (this.right.origin !== null);
};

WingedEdge.prototype.adjacent = function* () {
   let next = this.left.next.wingedEdge;
   yield next;
   let prev = this.left.prev().wingedEdge;
   if (prev !== next) {
      yield prev;
   }
   next = this.right.next.wingedEdge;
   yield next;
   prev = this.right.prev().wingedEdge;
   if (prev !== next) {
      yield prev;
   }
};

WingedEdge.prototype.oneRing = function* () {
   for (let start of this) {
      let current = start.next;
      start = start.pair;
      do {
         yield current.wingedEdge;
         current = current.pair.next;
      } while (current !== start);
   }
};

WingedEdge.prototype.eachVertex = function* () {
   yield this.left.origin;
   yield this.right.origin;
};

// return left wing then right wing. \   right0-> /
//                                   |            |
//                          left0->  /            \ 
WingedEdge.prototype.wing = function* () {
   yield this.left.prev();
   yield this.left;
   yield this.left.next;
   yield this.right.prev();
   yield this.right;
   yield this.right.next;
};

WingedEdge.prototype.getNormal = function(normal) {
   if (this.left.face) {
      vec3.add(normal, normal, this.left.face.normal);
   }
   if (this.right.face) {
      vec3.add(normal, normal, this.right.face.normal);
   }
   vec3.normalize(normal, normal);
};

var HalfEdge = function(vert, edge) {  // should only be created by WingedEdge
   this.next = null;
//   this.prev = null;       // not required, but very nice to have shortcut
   this.origin = vert;     // origin vertex, 
//   if (vert.outEdge === null) {
//     vert.outEdge = this;
//   }
   this.face = null;       // face pointer, not required, but useful shortcut
   this.pair = null;
   this.wingedEdge = edge; // parent winged edge
};

// boundary edge if no assigned face.
HalfEdge.prototype.isBoundary = function() {
   return this.face === null;
};
HalfEdge.prototype.isNotBoundary = function() {
   return this.face !== null;
};

/*Object.defineProperty(HalfEdge.prototype, 'pair', {
   get: function() {
      if (this.wingedEdge.left === this) {
         return this.wingedEdge.right;
      } else {
         return this.wingedEdge.left;
      }
    },
});*/


HalfEdge.prototype.destination = function() {
   return this.pair.origin;
}

// using polygon to find prev
HalfEdge.prototype.prevAux = function() {
   if (this.face !== null) {
      let current = this;
      while (current.next !== this) {
         current = current.next;
      }
      return current;
   }
   return null;
};

// using vertex to find prev
HalfEdge.prototype.prev = function() {
   if (this.pair.next === this)  {  // check for dangling edge.
      return this.pair; // we need this behavior.
   }
   var that = this;
   var ret = this.origin.findInEdge(function(inEdge, vertex) {
      if (inEdge.next === that) {   // found the prev
         return true;
      }
      return false;
   });
   if (ret === null) {
      // impossible condition, link list is broken
      console.log("HalfEdge.prev: link list is broken, cannot find prev");
   }
   return ret;
};

HalfEdge.prototype.eachEdge = function(callbackfn) {
   var start = this;
   var edge = start;
   if (edge) {
      do {  // counter clockwise ordering
         callbackfn(edge);
         edge = edge.pair.next;
      } while (edge && (edge !== start));
   }
};


//
var Vertex = function(pt) {
   this.vertex = pt;       // vec3. Float32Array. convenient function.
   this.outEdge = null;
 //  this.index = -1;
};

Object.defineProperty(Vertex.prototype, 'index', {
   get: function() {
      return (this.vertex.byteOffset / (this.vertex.BYTES_PER_ELEMENT*3));
   },
});

Object.defineProperty(Vertex.prototype, 'valence', {
   get: function() {
      let valence = 0;
      let start = this.outEdge;
      let edge = start;
      if (edge) {
         do {  // face edge is ccw. walking around vertex is cw.
            ++valence;
            edge = edge.pair.next;      // pair's next is outEdge too.
         } while (edge && (edge !== start));
      }
      return valence;
   },
});

//
// compute normal(later) and adjust outEdge to lowest index edge.
//
Vertex.prototype.reorient = function() {
   let outEdge = this.outEdge;
   let current = this.outEdge;
   do {
      if (current.index < outEdge.index) {
         outEdge = current;
      }
      current = current.pair.next;
   } while (current !== this.outEdge);
   this.outEdge = outEdge;    // get the lowest index outEdge;
};

Vertex.prototype.isLive = function() {
   return (this.outEdge !== null);
};

Vertex.prototype.oneRing = function* (start) {
   if (!start) {
      start = this.outEdge; // we want inEdge.
   }
   let current = start;
   do {
      const inEdge = current.pair;
      yield inEdge.origin;
      current = inEdge.next;
   } while(current !== start);
};

Vertex.prototype.edgeRing = function* (start) {
   if (!start) {
      start = this.outEdge;
   }
   let current = start;
   do {
      yield current;
      current = current.pair.next;
   } while(current !== start);
};

// utility functions for traversing all incident edge,
Vertex.prototype.eachInEdge = function(callbackfn) {
   // i am in
   var start = this.outEdge;
   var edge = start;
   if (edge) {
      do { // ccw ordering
         const inEdge = edge.pair;
         edge = edge.pair.next;   // my pair's next is outEdge. 
         callbackfn(inEdge, this);
      } while (edge && (edge !== start));
   }
};

Vertex.prototype.findInEdge = function(callbackfn) {
   // this.halfEdge is inEdge
   var start = this.outEdge;
   var edge = start;
   if (edge) {
      do { // ccw ordering
         if (callbackfn(edge.pair, this)) {
            return edge.pair;
         }
         edge = edge.pair.next;   // my pair's tail is in too. 
      } while (edge && (edge !== start));
   }
   return null;
};

// utility functions for traversing all direct out edge.
Vertex.prototype.eachOutEdge = function(callbackfn) {
   // i am in, so my pair is out.
   var start = this.outEdge;
   var edge = start;
   if (edge) {
      do {  // counter clockwise ordering
         callbackfn(edge, this);
         edge = edge.pair.next;      // pair's next is outEdge too.
      } while (edge && (edge !== start));
   }
};

// find first matching OutEdge
Vertex.prototype.findOutEdge = function(callbackfn) {
   // i am in, so my pair is out.
   var start = this.outEdge;
   var edge = start;
   if (edge) {
      do {  // counter clockwise ordering
         if (callbackfn(edge, this)) {
            return edge;
         }
         edge = edge.pair.next;
      } while (edge && (edge !== start));
   }
   return null;
};

// freeEdge meant no polygon face attach yet.
// find any freeInEdge.
Vertex.prototype.findFreeInEdge = function() {
   return this.findInEdge( function(halfEdge, vert) {
      if (halfEdge.face === null) {
         return true;
      }
      return false;
   });
};

Vertex.prototype.linkEdge = function(outHalf, inHalf) { // left, right of winged edge.
   if (this.outEdge === null) { // isolated vertex.
      this.outEdge = outHalf;
   } else {
      var inEdge = this.findFreeInEdge();
      if (inEdge === null) {
         console.log("Error: Vertex.linkEdge: complex vertex " + this.index);
         return false;
      }
      // else insert into circular list.
      var outEdge = inEdge.next;
      inEdge.next = outHalf;
      //fromHalf.prev = inEdge;
      inHalf.next = outEdge;
      //outEdge.prev = toHalf;
   }
   // link edge successful.
   return true;
};

Vertex.prototype.unlinkEdge = function(outHalf, inHalf)  {// left, right of winged edge
   const prev = outHalf.prev();
//   if (prev === null) {
//      console.log("bad prev");
//      return;
//   }
   if (this.outEdge === outHalf) {
      if (prev === inHalf) {
         this.outEdge = null;
         return;
      }
      this.outEdge = prev.pair;
   }
   // remove from circular list.
   prev.next = inHalf.next;
};

Vertex.prototype.isIsolated = function() {
   return (this.outEdge === null);
};

Vertex.prototype.numberOfEdge = function() {
   const limits = 1001;
   let count = 0;
   const start = this.outEdge;
   let current = start;
   do {
      count++;
      current = current.pair.next;
   } while ((current !== start) || (count > limits));
   return count;
};

Vertex.prototype.getNormal = function(normal) {
   const start = this.outEdge;
   let current = start;
   const a = vec3.create(), b = vec3.create(), temp = vec3.create();
   vec3.sub(a, current.destination().vertex, current.origin.vertex);
   do {
      current = current.pair.next;
      vec3.sub(b, current.destination().vertex, current.origin.vertex);
      vec3.cross(temp, b, a);
      vec3.add(normal, normal, temp);
      vec3.copy(a, b);
   } while (current !== start);
   vec3.normalize(normal, normal);
};




var Polygon = function(startEdge, size) {
   this.halfEdge = startEdge;
   this.numberOfVertex = size;       // how many vertex in the polygon
   this.update(); //this.computeNormal();
   this.index = -1;
   this.visible = true;
};

// not on free list. not deleted and visible
Polygon.prototype.isLive = function() {
   return (this.halfEdge !== null);
};

Polygon.prototype.isVisible = function() {
   return this.visible && (this.halfEdge !== null);
}

Polygon.prototype.buildIndex = function(data, index, center) {
   for (let edge of this.hEdges()) {
      data[index++] = edge.origin.index;
      data[index++] = edge.destination().index;
      data[index++] = center;
   }
   return index;
}

Polygon.prototype.eachVertex = function(callbackFn) {
   // get every vertex of the face.
   var begin = this.halfEdge;
   var current = begin;
   do {
      callbackFn(current.origin);
      current = current.next;
   } while (current !== begin);
};

Polygon.prototype.eachEdge = function(callbackFn) {
   var begin = this.halfEdge;
   var current = begin;
   do {
      let next = current.next;
      callbackFn(current);
      current = next;
   } while (current !== begin);
};

Polygon.prototype.hEdges = function* (modify = false) {
   if (modify) {
      const unmodify = [];
      let current = this.halfEdge; 
      do {
         unmodify.push(current);
         current = current.next;
      } while (current !== this.halfEdge);
      for (let current of unmodify) {
         yield current;
      }
   } else {
      const begin = this.halfEdge;
      let current = begin;
      do {
         let next = current.next;
         yield current;
         current = next;
      } while (current !== begin);
   }
}

// adjacent face, along the edge
Polygon.prototype.adjacent = function* () {
   const check = new Set;
   const start = this.halfEdge;
   let current = start;
   do {
      let face = current.pair.face;
      if (face !== null && !check.has(face)) {
         check.add(face);
         yield face;
      }
      current = current.next;
   } while (current !== start);
};

// one ring faces. all the vertex's face
Polygon.prototype.oneRing = function* () {
   const check = new Set; check.add(this);
   const start = this.halfEdge;
   let current = start;
   do {
      const vertex = current.origin;
      for (let outEdge of vertex.edgeRing()) {
         const face = outEdge.face;
         if ((face !== null) && !check.has(face)) {
            check.add(face);
            yield face;
         }
      }
      current = current.next;
   } while (current !== start);

};

// ccw ordering
Polygon.prototype.computeNormal = function() {
   const U = vec3.create();
   const V = vec3.create();
   const v1 = this.halfEdge.origin.vertex;
   const v0 = this.halfEdge.next.origin.vertex;
   const v2 = this.halfEdge.next.destination().vertex;
   vec3.sub(U, v1, v0);
   vec3.sub(V, v2, v0);
   if (!this.normal) {
      this.normal = vec3.create();
   }
   vec3.cross(this.normal, V, U);
   vec3.normalize(this.normal, this.normal);
};


// recompute numberOfVertex and normal. and reorient.
Polygon.prototype.update = function() {
   const begin = this.halfEdge;
   let halfEdge = begin;
   let current = begin;
   this.numberOfVertex = 0;
   do {
      current.face = this;
      //current.origin.reorient();
      ++this.numberOfVertex;
      if (current.index < halfEdge.index) {
         halfEdge = current;
      }
      if (this.numberOfVertex > 1001) {   // break;   
         console.log("something is wrong with polygon link list");
         return;
      }
      current = current.next;
   } while (current !== begin);
   this.halfEdge = halfEdge;              // the lowest index.
   // compute normal.
   if (this.numberOfVertex > 2) {
      this.computeNormal();
   }
};

//
// getCentroid - not really centroid, but center of points.
// todo - find a good centroid algorithm. like tessellate to triangles. and use triangle's centroid to find real centroid.
//
Polygon.prototype.getCentroid = function(centroid) {
   const begin = this.halfEdge;
   let current = begin;
   let numberOfVertex = 0;
   do {
      vec3.add(centroid, centroid, current.origin.vertex);
      ++numberOfVertex;
      current = current.next;
   } while (current !== begin);
   // compute centroid.
   vec3.scale(centroid, centroid, 1.0/numberOfVertex);
};


/*let PolygonHole = function() {
   const ret = new Polygon();
   ret.visible = false;

};*/




//
// 
//
let MeshAllocator = function(allocatedSize = 1024) {
   var buf = new ArrayBuffer(allocatedSize*3 * Float32Array.BYTES_PER_ELEMENT);  // vertices in typedArray
   this.buf = { buffer: buf, data: new Float32Array(buf), len: 0, }; // vertex's pt buffer. to be used for Vertex.
   this.vertices = [];     // class Vertex
   this.edges = [];        // class WingedEdge
   this.faces = [];        // class Polygon
   this.free = {vertices: [], edges: [], faces: []};
   this.affected = {vertices: new Set, edges: new Set, faces: new Set};// affected is when reuse, deleted, or change vital stats.
};
// allocation,
MeshAllocator.prototype.allocVertex = function(pt, delVertex) {
   if (this.free.vertices.length > 0) {
      let vertex;
      if (typeof delVertex === 'undefined') {
         vertex = this.vertices[this.free.vertices.pop()];
      } else {
         const index = delVertex.index;   // remove delOutEdge from freeEdges list
         this.free.vertices = this.free.vertices.filter(function(element) {
            return element !== index;
         });
         vertex = delVertex;
      }
      vertex.vertex.set(pt);
      this.affected.vertices.add( vertex );
      return vertex;
   } else {
      if ((this.buf.len+3) >= (this.buf.data.length)) {
         // reached maximum buff size, resize, double the size
         var buffer = new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT*this.buf.len*2);
         var data = new Float32Array(buffer);
         // copy data to new buffer.
         data.set(this.buf.data);
         // update Vertex.position;
         this.vertices.forEach(function(element, index, arry) {
            element.vertex = new Float32Array(buffer, Float32Array.BYTES_PER_ELEMENT*index*3, 3);
         });
         // replace
         this.buf.data = data;
         this.buf.buffer = buffer;
      }
      // vec3 is 3 float32. mapped into the big buffer. float32=4 byte.
      let vertex = new Float32Array(this.buf.buffer, Float32Array.BYTES_PER_ELEMENT*this.buf.len, 3);
      this.buf.len += 3;
      vertex[0] = pt[0];
      vertex[1] = pt[1];
      vertex[2] = pt[2];
      var _vert = new Vertex(vertex);
      //_vert.index = this.vertices.length;
      this.vertices.push( _vert );
      //this.affected.vertices.add( _vert );
      return _vert;
   }
};

MeshAllocator.prototype.allocEdge = function(begVert, endVert, delOutEdge) {
   let edge;
   let outEdge;
   if (this.free.edges.length > 0) { // prefered recycle edge.
      if (typeof delOutEdge !== "undefined") {
         const index = delOutEdge.wingedEdge.index;   // remove delOutEdge from freeEdges list
         this.free.edges = this.free.edges.filter(function(element) {
            return element !== index;
         });
         edge = delOutEdge.wingedEdge;
         outEdge = delOutEdge;
      } else {
         edge = this.edges[this.free.edges.pop()];
         outEdge = edge.left;
      }
      outEdge.origin = begVert;
      outEdge.pair.origin = endVert;
      this.affected.edges.add( edge );
   } else {
      // initialized data.
      edge = new WingedEdge(begVert, endVert);
      edge.index = this.edges.length;
      this.edges.push( edge );
      outEdge = edge.left;
      //this.affected.edges.add( edge );
   }

   return outEdge;
};

// todo: ?binary search for delPolygon, then use splice. a win? for large freelist yes, but, I don't think it a common situation.
MeshAllocator.prototype.allocPolygon = function(halfEdge, numberOfVertex, delPolygon) {
   let polygon;
   if (this.free.faces.length > 0) {
      if (typeof delPolygon !== "undefined") {
         const index = delPolygon.index;   // remove delOutEdge from freeEdges list
         this.free.faces = this.free.faces.filter(function(element) {
            return element !== index;
         });
         polygon = delPolygon;
      } else {
         polygon = this.faces[ this.free.faces.pop() ];
      }
      polygon.halfEdge = halfEdge;
      polygon.numberOfVertex = numberOfVertex;
      polygon.update();
      polygon.visible = true;  // make sure it visible.
      this.affected.faces.add( polygon );
   } else {
      polygon = new Polygon(halfEdge, numberOfVertex);
      polygon.index = this.faces.length;
      this.faces.push( polygon );
   }
   return polygon;
};

// recycled
// insert the index number in reverse order. smallest last.
MeshAllocator.prototype._insertFreeList = function(val, array) {
   var l = 0, r = array.length - 1;
   while (l <= r) {
      //let m = (l + r) >>> 1; /// equivalent to Math.floor((l + h) / 2) but faster
      let m = l + ((r-l) >>> 1); // avoid overflow. 
      let comparison = val - array[m];
      if (comparison > 0) {
         r = m - 1;
      } else if (comparison < 0) {
         l = m + 1;
      } else {
         break; // should no happened.
      }
   }
   array.splice(l, 0, val);
};
MeshAllocator.prototype.freeVertex = function(vertex) {
   vertex.outEdge = null;
   //vertex.vertex.fill(0.0);
   // assert !freeVertices.has(vertex);
   //this.free.vertices.push( vertex );
   this._insertFreeList(vertex.index, this.free.vertices);
   this.affected.vertices.add( vertex );
};

MeshAllocator.prototype.freeHEdge = function(edge) {
   const pair = edge.pair;
   edge.face = null;
   pair.face = null;
   edge.origin = null;
   pair.origin = null;
   // link together for a complete loop
   edge.next = pair;
   pair.next = edge;
   // assert !this.free.edges.has( edge.wingedEdge );
   //this.free.edges.push( edge.wingedEdge );
   this._insertFreeList(edge.wingedEdge.index, this.free.edges);
   this.affected.edges.add( edge.wingedEdge );
};

MeshAllocator.prototype.freePolygon = function(polygon) {
   polygon.halfEdge = null;
   polygon.numberOfVertex = 0;
   // assert !freeFaces.has( polygon );
   //this.free.faces.push( polygon );
   this._insertFreeList(polygon.index, this.free.faces);
   this.affected.faces.add( polygon );
};

MeshAllocator.prototype.freeAll = function(polygons, wEdges, vertices) {
   function compare(a, b) {return b-a;}
   for (let polygon of polygons) {
      this.free.faces.push(polygon.index);
      polygon.halfEdge = null;
      polygon.numberOfVertex = 0;
   }
   this.free.faces.sort(compare);
   for (let wEdge of wEdges) {
      this.free.edges.push(wEdge.index);
      wEdge.left.face = null;
      wEdge.left.origin = null;
      wEdge.right.face = null;
      wEdge.right.face = null;
      wEdge.left.next = wEdge.right;
      wEdge.right.next = wEdge.left;
   }
   this.free.edges.sort(compare);
   for (let vertex of vertices) {
      this.free.vertices.push(vertex.index);
      vertex.outEdge = null;
   }
   this.free.vertices.sort(compare);
}


MeshAllocator.prototype.getVertices = function(index) {
   return this.vertices[index];
}

// update for affected (vertex, edge, and polygon)
MeshAllocator.prototype.clearAffected = function() {
   this.affected.vertices.clear();
   this.affected.edges.clear();
   this.affected.faces.clear();
};
MeshAllocator.prototype.addAffectedWEdge = function(wEdge) {
   this.affected.edges.add(wEdge);
};
MeshAllocator.prototype.addAffectedFace = function(polygon) {
   this.affected.faces.add(polygon);
};
MeshAllocator.prototype.addAffectedVertex = function(vertex) {
   this.affected.vertices.add(vertex);
};
MeshAllocator.prototype.addAffectedEdgeAndFace = function(vertex) {
   this.affected.vertices.add(vertex);
   const self = this;
   vertex.eachOutEdge( function(halfEdge) {
      self.affected.edges.add(halfEdge.wingedEdge);
      if (halfEdge.face !== null) {
         self.affected.faces.add(halfEdge.face);
     }
   });
};


// 
// changed - so Vertex, WingedEdge, and Polygon is allocated from meshAllocator. So different 
// Models on the same DraftBench can use the same Allocation. Merging becomes easier.
//
var WingedTopology = function(allocator) {
   this.alloc = allocator;
   this.vertices = new Set;
   this.faces = new Set;
   this.edges = new Set;
};

// act as destructor
WingedTopology.prototype.free = function() {
   this.alloc.freeAll(this.faces, this.edges, this.vertices);
   this.faces = new Set;
   this.edges = new Set;
   this.vertices = new Set;
};

// merge - should we check alloc is the same?
WingedTopology.prototype.merge = function(geometryGenerator) {
   const self = this;
   this.vertices = new Set(function* () {yield* self.vertices; for (let geometry of geometryGenerator()) {yield* geometry.vertices;}}());
   this.edges = new Set(function* () {yield* self.edges; for (let geometry of geometryGenerator()) {yield* geometry.edges;}}());
   this.faces = new Set(function* () {yield* self.faces; for (let geometry of geometryGenerator()) {yield* geometry.faces;}}());
};

// separate - separate out non-connected geometry.
WingedTopology.prototype.separateOut = function() {
   const traversed = new Set;
   const separate = [];
   let faces;

   function oneRing(srcPolygon) {
      for (let hEdge of srcPolygon.hEdges()) {  // don't use oneRing. extra set operation.
         const polygon = hEdge.pair.face;
         if ((polygon !== null) && !traversed.has(polygon)) {
            traversed.add(polygon);
            faces.add(polygon);
            oneRing(polygon);
         }
      }
   };

   for (let polygon of this.faces) {
      if (!traversed.has(polygon)) {
         traversed.add(polygon);
         let geometry = new WingedTopology(this.alloc);
         faces = geometry.faces;              // ready for geometry.
         faces.add(polygon);
         oneRing(polygon);
         // ok, got one separated
         separate.push( geometry );
      }
   }

   if (separate.length > 1) {
      // we have the face list. now rebuild vertex and edge lists.
      for (let mesh of separate) {
         for (let polygon of mesh.faces) {
            for (let hEdge of polygon.hEdges()) {
               mesh.vertices.add( hEdge.origin );
               mesh.edges.add( hEdge.wingedEdge );
            }
         }
      }
      return separate; 
   } else {
      return null;
   }
};

WingedTopology.prototype.detachFace = function(faceSet) {
   const vertices = new Set;
   const edges = new Set;
   for (let polygon of faceSet) {
      this.faces.delete(polygon);
      for (let hEdge of polygon.hEdges()) {
         vertices.add(hEdge.origin);
         this.vertices.delete(hEdge.origin);
         edges.add(hEdge.wingedEdge);
         this.edges.delete(hEdge.wingedEdge);
      }
   }

   return {vertices: vertices, edges: edges};
};

WingedTopology.prototype.sanityCheck = function() {
   let sanity = true;
   // first check vertex for error.
   for (let [index, vertex] of this.vertices.entries()) {
      if (vertex.isLive()) {
         if (vertex.outEdge.origin !== vertex) {
            console.log("vertex " + index + " outEdge is wrong");
            sanity = false;
         } else {
            // manual find prev. 
            var start = vertex.outEdge;
            var edge = start;
            let prev = null;
            let iterationCount = 0;    // make sure, no infinite loop
            if (edge) {
               do { // ccw ordering
                  if (edge.pair.next === start) {
                     prev = edge.pair;
                     break;
                  }
                  edge = edge.pair.next;   // my pair's tail is in too. 
                  iterationCount++;
               } while (edge && (edge !== start) && (iterationCount < 101));
            }
            if (prev === null) {
               console.log("vertex " + index + " is broken");
               sanity = false;
            }
         }
      }
   }
   // now check polygon
   return sanity;
};

WingedTopology.prototype.addAffectedWEdge = function(wEdge) {
   this.alloc.addAffectedWEdge(wEdge);
};

WingedTopology.prototype.addAffectedFace = function(polygon) {
   this.alloc.addAffectedFace(polygon);
};

WingedTopology.prototype.addAffectedVertex = function(vertex) {
   this.alloc.addAffectedVertex(vertex);
};

WingedTopology.prototype.clearAffected = function() {
   this.alloc.clearAffected();
};

WingedTopology.prototype.addAffectedEdgeAndFace = function(vertex) {
   this.alloc.addAffectedEdgeAndFace(vertex);
};

WingedTopology.prototype._createPolygon = function(halfEdge, numberOfVertex, delPolygon) {
   const polygon = this.alloc.allocPolygon(halfEdge, numberOfVertex, delPolygon);
   this.faces.add(polygon);
   return polygon;
};

// return vertex index
WingedTopology.prototype.addVertex = function(pt, delVertex) {
   const vertex = this.alloc.allocVertex(pt, delVertex);
   this.vertices.add(vertex);
   return vertex;
};

WingedTopology.prototype._createEdge = function(begVert, endVert, delOutEdge) {
   const outEdge = this.alloc.allocEdge(begVert, endVert, delOutEdge);
   this.edges.add(outEdge.wingedEdge);
   return outEdge;
};
// recycled
WingedTopology.prototype._freeVertex = function(vertex) {
   if (this.vertices.delete(vertex)) {
      this.alloc.freeVertex(vertex);
   }
};

WingedTopology.prototype._freeEdge = function(edge) {
   if (this.edges.delete(edge.wingedEdge)){
      this.alloc.freeHEdge(edge);
   }
};

WingedTopology.prototype._freePolygon = function(polygon) {
   if (this.faces.delete(polygon)) {
      this.alloc.freePolygon(polygon);
   }
};


WingedTopology.prototype.getExtent = function(min, max) {
   //min[0] = min[1] = min[2] = Number.MAX_VALUE;
   //max[0] = max[1] = max[2] = Number.MIN_VALUE;
   for (let vertex of this.vertices) {
      const pt = vertex.vertex;
      for (let i = 0; i < 3; ++i) {
         if (pt[i] > max[i]) {
            max[i] = pt[i];
         } else if (pt[i] < min[i]) {
            min[i] = pt[i];
         }
      }
   }
};


// return winged edge ptr because internal use only.
WingedTopology.prototype.addEdge = function(begVert, endVert, delOutEdge) {
   // what to do with loop edge?
   // what to do with parallel edge?

   // initialized data.
   var edge = this._createEdge(begVert, endVert, delOutEdge).wingedEdge;

   // Link outedge, splice if needed
   if (!begVert.linkEdge(edge.left, edge.right)) {
      // release the edge
      this._freeEdge(edge.left);
      return null;
   }
   // Link inedge, splice if needed
   if (!endVert.linkEdge(edge.right, edge.left)) {
      begVert.unlinkEdge(edge.left, edge.right);
      // release the endge
      this._freeEdge(edge.right);
      return null; 
   }

   // return outEdge.
   return edge.left;
};

WingedTopology.prototype.findFreeInEdge = function(inner_next, inner_prev) {
   // inner_prev is guaranteed to be boundary, so if link correctly, should be 

   // search a free gap, free gap will be between boundary_prev and boundary_next
   var boundary_prev = inner_next.pair;
   do {
      do {
         boundary_prev = boundary_prev.next.pair;
      } while (!boundary_prev.isBoundary());

      // ok ?
      if (boundary_prev !== inner_prev) {
         return boundary_prev;
      }
   } while (boundary_prev !== inner_next.pair);
   
   // check for bad connectivity. somewhere, there is no free inedge anywhere.
   console.log("WingedTopology.addFace.findFreeInEdge: patch re-linking failed");
   return null;
};



WingedTopology.prototype.spliceAdjacent = function(inEdge, outEdge) {
   if (inEdge.next === outEdge) {   // adjacency is already correct.
      return true;
   }

   const b = inEdge.next;
   const d = outEdge.prev();

   // Find a free incident half edge
   // after 'out' and before 'in'.
   const g = this.findFreeInEdge(outEdge, inEdge);

   if (g === null) {
      console.log("WingedTopology.spliceAjacent: no free inedge, bad ajacency");
      return false;
   } else if (g === d) {
      inEdge.next = outEdge;
      d.next = b;
   } else {
      const h = g.next;

      inEdge.next = outEdge;
      //out.half_->previous_ = in.half_;

      g.next = b;
      //b.half_->previous_ = g.half_;

      d.next = h;
      //h.half_->previous_ = d.half_;
   }
   return true;
};

// failed addPolygon. free and unlink edges.
WingedTopology.prototype._unwindNewEdges = function(halfEdges) {
   for (let halfEdge of halfEdges) {
      let pair = halfEdge.pair;
      halfEdge.origin.unlinkEdge(halfEdge, pair);
      pair.origin.unlinkEdge(pair, halfEdge);
      this._freeEdge(halfEdge);
   }
};

// passed in an array of vertex index. automatically create the required edge.
// return polygon index.
// add proper handling for non-manifold. (2017/05/28)
// add checking for complex polygon. (2017/05/29)
WingedTopology.prototype.addPolygon = function(pts) {
   var halfCount = pts.length;
   if (halfCount < 3) { // at least a triangle
      return -1;
   }

   var i, nextIndex;
   // builds WingEdge if not exist
   var halfLoop = [];
   var newEdges = [];
   const complex = new Set;
   for (i =0; i < halfCount; ++i) {
      nextIndex = i + 1;
      if (nextIndex == halfCount) {
         nextIndex = 0;
      }

      var v0 = this.alloc.getVertices(pts[i]);
      var v1 = this.alloc.getVertices(pts[nextIndex]);
      var edge = this.findHalfEdge(v0, v1);
      if (edge === null) { // not found, create one
         edge = this.addEdge(v0, v1);
         if (edge === null) {
            this._unwindNewEdges(newEdges);
            return null;
         }
         newEdges.push(edge);
         complex.add(edge.wingedEdge);
      } else if (!edge.isBoundary()) { // is it free? only free can form a chain.
         this._unwindNewEdges(newEdges);
         // This half-edge would introduce a non-manifold condition.
         console.log("non-manifold condition, no boundary");
         return null;
         // should we rewinded the newly created winged edge? currently nay.
      } else {
         // check if the wingedEdge already included.
         if (complex.has(edge.wingedEdge)) {
            this._unwindNewEdges(newEdges);
            // complex polygon that cannot be handle properly with halfEdge structure.
            console.log("complex polygon detected");
            return null;
         }
         complex.add(edge.wingedEdge);
      }

      halfLoop.push( edge );
   }

   // Try to reorder the links to get proper orientation.
   for (i = 0;i < halfCount;++i) {
      nextIndex = i + 1;
      if (nextIndex == halfCount) {
         nextIndex = 0;
      }

      if (!this.spliceAdjacent(halfLoop[i], halfLoop[nextIndex])) {
         this._unwindNewEdges(newEdges);
         // The polygon would introduce a non-manifold condition.
         console.log("non-manifold condition, cannot splice");
         return null;
      }
   }

   // Create and link the polygon
   var newPolygon = this._createPolygon(halfLoop[0], pts.length);

   // Link half-edges to the polygon.
   for (i = 0;i < halfCount; ++i) {
      halfLoop[i].face = newPolygon;
   }

   return newPolygon;
};

// utility for addPolygon.
WingedTopology.prototype.findHalfEdge = function(v0, v1) {
   // v0 = start, v1 = end.
  //assert(_start_vh.is_valid() && _end_vh.is_valid());

  return v0.findOutEdge( function(edge, _vertex) {
            if (edge.destination() === v1) {
               return true;
            }
            return false;
         });
};



// to split a face into 2 faces by insertEdge, delOutEdge and delPolygon optional.
WingedTopology.prototype.insertEdge = function(prevHalf, nextHalf, delOutEdge, delPolygon) {
   // assert(prevHalf.face === nextHalf.face);
   // assert(prevHalf.next !== _nextHalf);      // we want to split face, not adding edge
   const v0 = prevHalf.destination();
   const v1 = nextHalf.origin;
   const oldPolygon = prevHalf.face;

   // create edge and link together.
   const outEdge = this._createEdge(v0, v1, delOutEdge);
   const inEdge = outEdge.pair;
   const nextPrev = prevHalf.next;           // save for later use
   const prevNext = nextHalf.prev();
   prevHalf.next = outEdge;
   outEdge.next = nextHalf;
   prevNext.next = inEdge;
   inEdge.next = nextPrev;
  
   //now set the face handles
   const newPolygon = this._createPolygon(outEdge, 4, delPolygon);  // readjust size later.
   outEdge.face = newPolygon;
   let size = 0;
   newPolygon.eachEdge( function(halfEdge) {
      ++size;
      halfEdge.face = newPolygon;
   });
   newPolygon.numberOfVertex = size;

   // inEdge is oldPolygon
   inEdge.face = oldPolygon;
   if (oldPolygon) {
      if (oldPolygon.halfEdge.face === newPolygon) {
         //  pointed to one of the halfedges now assigned to newPolygon
         oldPolygon.halfEdge = inEdge;
      }
      size = 0;
      oldPolygon.eachEdge( function(halfEdge) {
         ++size;
      });
      oldPolygon.numberOfVertex = size;
      this.addAffectedFace( oldPolygon );
   }

   // adjustOutEdge for v0, v1. point to boundary so, ccw work better?
   return outEdge;
}

//
// insert a new outEdge at (origin), oldOut push out to newOrigin.
//
WingedTopology.prototype.splitEdge = function(outEdge, pt, delOut) {
   const inEdge = outEdge.pair;
   const outPrev = outEdge.prev();
   const inNext = inEdge.next;
   const vOrigin = outEdge.origin;
   const vOut = vOrigin.outEdge;

   //add the new edge
   const vertex = this.addVertex(pt);
   const newOut = this._createEdge(vOrigin, vertex, delOut);
   const newIn = newOut.pair;
   // fixe the halfedge connectivity
   newOut.next = outEdge;
   inEdge.next = newIn;
  
   outPrev.next = newOut;
   newIn.next = inNext;
  
   newOut.face = outEdge.face;
   newOut.face.numberOfVertex++;
   newIn.face = inEdge.face;
   newIn.face.numberOfVertex++;

   // fix vertex
   outEdge.origin = vertex;
   vertex.outEdge = newIn;
  
   if (vOut === outEdge) {
      vOrigin.outEdge = newOut;
   }
   this.addAffectedWEdge( outEdge.wingedEdge );     // edge changed.
   // return the newOut
   return newOut;
};



// used by bevel
WingedTopology.prototype.doubleEdge = function(inEdge) {
   const prev = inEdge.prev();

   // reassign pointer
   const newOut = this._createEdge(inEdge.destination(), inEdge.origin);
   const newIn = newOut.pair;
   newOut.next = inEdge;
   newIn.next = inEdge.next;
   inEdge.next = newOut;
   prev.next = newIn;

   // reassign polygon
   newIn.face = inEdge.face;
   if (inEdge.face.halfEdge === inEdge) {
      newIn.face.halfEdge = newIn;
   }
   this.addAffectedFace(newIn.face);
   const newPolygon = this._createPolygon(newOut, 2);
//   newOut.face = newPolygon;
//   inEdge.face = newPolygon;

   return newOut;
};
// create new edge, but no new vertex.
WingedTopology.prototype.simpleSplit = function(inEdge) {
   // check(inEdge.destination() !== inEdge.next.origin)
   const outEdge = this._createEdge(inEdge.destination(), inEdge.next.origin);
   // now break it up.
   outEdge.next = inEdge.next;
   inEdge.next = outEdge;
   // outEdge.pair.next have to wait 
   outEdge.face = inEdge.face;
   outEdge.face.numberOfVertex++;

   return outEdge; 
};
// prepare adding vertex
WingedTopology.prototype.prepVertex = function(inStart, outStop, adjacentRed, vertexLimit, slideEdge, origin) {
   if (!origin) {
      origin = outStop.origin;
   }
   const pts = vertexLimit.get(origin);
   let inEdge = inStart;
   let notDone = true;
   let outEdge;
   do {
      outEdge = inEdge.next;
      outEdge.origin = origin;
      inEdge = outEdge.pair;
      if (notDone) {
         pts.push(inEdge);
         if (!adjacentRed.has(outEdge.wingedEdge)) { // white edge, definite walk along this edge
            notDone = false;
            pts.length = 0;      // make sure we only have one.
            pts.push(inEdge);
         }
      }
   } while (outEdge !== outStop);
   if (slideEdge) {
      for (let hEdge of pts) {
         slideEdge.add(hEdge);   // 
      }
   }
};
WingedTopology.prototype.prepVertexAdd = function(inStart, outStop, adjacentRed, vertexLimit, slideEdge) {
   const origin = this.addVertex(inStart.destination().vertex);
   vertexLimit.set(origin, []);
   this.prepVertex(inStart, outStop, adjacentRed, vertexLimit, slideEdge, origin);
   return origin;
}
WingedTopology.prototype.isSplitEdgeSelected = function(origin, dest, adjacentRed) {
   for (let vertex of [origin, dest]) {
      let count = 0;
      let redCount = 0;
      for (let hEdge of vertex.edgeRing()) {
         count++;
         if (adjacentRed.has(hEdge.wingedEdge)) {
            redCount++;
         }
      }
      if (count !== 3) { // (count > 3) { // equal 3 or 4
         return false;
      } else if (redCount !== 2) {
         return false;
      }
   }
   return true;
}
// nice explanation.
// https://stackoverflow.com/questions/35378378/multi-edge-bevel-on-half-edge-structure
//
// We can split the operation into two conceptual steps. First, double the red edges. Second, explode the vertices incident to at least one red edge.
//
// The first step can be accomplished one edge at a time. Given a red edge e, create another edge e'. For one half edge of e, 
// insert one half edge of e' as the next half-edge with the same head in clockwise order. For the other half edge of e, 
// insert the other half edge of e' as the next half edge with the same head in counterclockwise order.
//
// The second step can be accomplished one vertex at a time. Given a vertex v incident to at least one red edge, 
// group the half edges with head v as follows. Break that circular list (1) between every adjacent pair of red half edges that arose from the same original edge 
// (2) between every adjacent pair of white edges (adjacent means that the two half edges are next/previous in clockwise/counterclockwise order). 
// For each break, create a new edge. Splice everything together.
//
WingedTopology.prototype.bevelEdge = function(wingedEdges) {   // wingedEdges(selected) is a set
   const ret = {vertices: [], halfEdges: [], collapsibleWings: new Set, selectedFaces: new Set};
   const vertices = new Set;
   const vertexLimit = new Map;
   const adjacentRed = new Map;
   const slideEdge = new Set;      // halfEdge, where we will slide the bevel edge
   const twoEdgeVertexHack = new Set;
   // double selected edge, and add face. 
   for (let wingedEdge of wingedEdges) {
      const outEdge = this.doubleEdge(wingedEdge.left);   // add edge and faces
      ret.selectedFaces.add(outEdge.face);
      vertices.add( outEdge.origin );
      vertices.add( outEdge.destination() );
      //ret.halfEdges.push(wingedEdge.left);    // start of new face. also can be use for undo.
      // we create a new tag.
      adjacentRed.set(wingedEdge, outEdge.wingedEdge);
      adjacentRed.set(outEdge.wingedEdge, wingedEdge);
      ret.collapsibleWings.add(outEdge.wingedEdge);
   }

   // for every vertex, add edge and chamfer vertex for 1)adjacent red edges, 2) adjacent white edges.
   for (let vertex of vertices) {
      ret.vertices.push(vertex);       // affected vertex original
      vertexLimit.set(vertex, []);
      let edgeInsertion = [];
      const start = vertex.outEdge;    // walk the ring
      let current = start;
      do {
         let next = current.pair.next;  // save 
         // check if current && prev are the same color edge, (white,white, red,red)
         if (adjacentRed.has(current.wingedEdge)) {
            if (adjacentRed.get(current.wingedEdge) === next.wingedEdge) {  // original red+expansion pair.
               edgeInsertion.push( current.pair ); // insertion point
            }
         } else if (!adjacentRed.has(next.wingedEdge)) {   // (white, white) pair
            edgeInsertion.push( current.pair );
         }
         current = next;
      } while(current !== start);   // save the last pair (end, start) for special processing.
      // real expandsion of vertex, and edge
      let insertion;
      let prevOut;
      let firstOut;
      for (let nextStop of edgeInsertion) {
         if (insertion) {
            const origin = this.prepVertexAdd(insertion, nextStop.pair, adjacentRed, vertexLimit, slideEdge);
            let out = this.simpleSplit(insertion);
            origin.outEdge = out.pair;
            ret.vertices.push( origin );
            ret.halfEdges.push( out.pair );
            if (prevOut) {
               out.pair.next = prevOut.pair;
            } else {
               firstOut = out;
            }
            prevOut = out;
         }
         insertion = nextStop;
      }
      // last edge
      if (edgeInsertion.length === 1) {   // must be splitEdge, special case. needs to create an extra triangle face.
         // create another edge
         const splitOut = insertion.next.pair.next;
         const outEdge = this.doubleEdge(splitOut.pair); // now we have 4 edge to expand, won't get into strange shape
         adjacentRed.set(splitOut.wingedEdge, outEdge.wingedEdge);
         adjacentRed.set(outEdge.wingedEdge, splitOut.wingedEdge);
         ret.selectedFaces.add(outEdge.face);
         const orig = this.prepVertexAdd(insertion, splitOut, adjacentRed, vertexLimit);
         //adjacentRed.delete(splitOut.wingedEdge);
         //adjacentRed.delete(outEdge.wingedEdge);
         const edge = this.simpleSplit(insertion);
         orig.outEdge = edge.pair;
         ret.vertices.push( orig );
         ret.halfEdges.push( edge.pair );
         // remember to fix the last edge
         const hEdge = edge.pair;
         hEdge.next = outEdge;
         splitOut.pair.next = hEdge;
         // fix the face pointer
         hEdge.face = outEdge.face;
         hEdge.face.numberOfVertex++;
         // this vertexLimit will limit to outer ring
         let pts = vertexLimit.get(vertex);
         pts.push(outEdge.pair);
         pts.push(insertion.pair.next.pair);
         pts = vertexLimit.get(orig);
         pts[0] = pts[0].prev(); // readjust
      } else if (edgeInsertion.length === 2) {   // 2 edges, so they should be sharing the same edge.
         const inStart = edgeInsertion[0];
         // breakup the insertion point, to reuse the lone edge
         let hEdge = inStart.next.pair;
         hEdge.next = insertion.next;
         insertion.next = hEdge;
         // fix the face ptr
         hEdge.face = insertion.face;
         hEdge.face.numberOfVertex++;
         this.addAffectedFace(hEdge.face);
         // fix the vertexLimit.
         const pts = vertexLimit.get(hEdge.next.origin); // to limit the original vertex
         if (!this.isSplitEdgeSelected(hEdge.next.origin, hEdge.origin, adjacentRed)) {
            const red = [];
            // we move along non-selected edge
            do { hEdge = hEdge.next.pair; red.push(hEdge); } while (adjacentRed.has(hEdge.wingedEdge));
            if (hEdge !== insertion.next) {
               pts.push( hEdge );
               slideEdge.add(hEdge );
            } else { // reselect all.
               red.pop();
               for (let hEdge of red) {pts.push(hEdge);slideEdge.add(hEdge);}
            }
         } else {  // adjust vertex, a lot of hacks.
            const hEdge2 = hEdge.next.pair;
            let prev = hEdge2.prev(); pts.push( prev ); slideEdge.add(prev);
            let temp = hEdge2.next.next.pair; pts.push(temp); slideEdge.add(temp);
            // readjust original
            const pts2 = vertexLimit.get(hEdge.origin);
            prev = pts2[0].prev(); pts2[0] = prev; slideEdge.add(prev);
            temp = pts2[1].pair.next.pair; pts2[1] = temp; slideEdge.add(temp);
            twoEdgeVertexHack.add(hEdge.origin).add(hEdge.destination());
         }
      } else { // normal expansion
         // add the last one, simple split
         // check(insertion.destination !== insertion.next.origin);
         this.prepVertex(insertion, edgeInsertion[0].pair, adjacentRed, vertexLimit, slideEdge);
         const edge = this.simpleSplit(insertion);
         ret.halfEdges.push(edge.pair);
         // create a new innerface, and fix the edge to point to it
         edge.pair.next = prevOut.pair;
         firstOut.pair.next = edge.pair;
         const polygon = this._createPolygon(edge.pair, edgeInsertion.length);
         ret.selectedFaces.add( polygon );
      }
   }
   // compute vertexLimit magnitude, and expanding direction. (reuse normal), 
   // now (vertexLimit - vertex) = direction. 
   ret.vertexLimit = Number.MAX_SAFE_INTEGER;       // magnitude
   ret.position = new Float32Array(ret.vertices.length*3);     // saved the original position
   ret.direction = new Float32Array(ret.vertices.length*3);    // also add direction.
   let i = 0;
   const pt = vec3.create();  // temporary
   for (let vertex of ret.vertices) {
      const position = ret.position.subarray(i, i+3);
      const direction = ret.direction.subarray(i, i+3);
      const hEdges = vertexLimit.get(vertex);
      let avg = 1.0;
      if (twoEdgeVertexHack.has(vertex)) {
         avg = 0.4;
      }
      for (let hEdge of hEdges) {
         vec3.copy(pt, hEdge.origin.vertex);
         vec3.copy(position, vertex.vertex);
         vec3.sub(pt, pt, position);
         let average = avg;
         if (slideEdge.has(hEdge.pair)) { // yep, we can only go as far as half point.
            average = 0.5;
         } 
         ret.vertexLimit = Math.min(vec3.length(pt)*average, ret.vertexLimit);
         vec3.normalize(pt, pt);
         vec3.add(direction, direction, pt);
      }
      if (avg == 0.4) {
         vec3.normalize(direction, direction);
      }
      i+=3;
   }

   // we needs faces, we needs
   return ret;
};

//
// bevel Vertex. create new edge between each vertex's outEdge, which is n. will create (n-1) vertex, and one face, for each 
// selected vertex.
WingedTopology.prototype.bevelVertex = function(vertices) {
   const ret = {vertices: [], halfEdges: [], selectedFaces:[], };

   const slideHEdges = new Set;
   for (let vertex of vertices) {
      let prevOut = vertex.outEdge;
      let prevBevel;
      let outEdge = prevOut.pair.next;
      let count = 0;
      ret.vertices.push(vertex);
      slideHEdges.add(outEdge);
      while (outEdge !== vertex.outEdge) { // splice between outTarget and inEdge. add a new Vertex
         const origin = this.addVertex(outEdge.origin.vertex);
         ret.vertices.push(origin);
         outEdge.origin = origin;
         origin.outEdge = outEdge;
         slideHEdges.add(outEdge);
         const outNext = outEdge.pair.next;     // save the next Out
         let outBevel = this.simpleSplit(prevOut.pair);  // the newly create bevel edge
         ret.halfEdges.push(outBevel.pair);
         //origin.outEdge = outBevel.pair;
         ++count;
         if (prevBevel) {  // innerEdge connect together.
            outBevel.pair.next = prevBevel.pair;
         }
         prevBevel = outBevel;
         // check(outEdge.next === nextOut);
         prevOut = outEdge;
         outEdge = outNext;
      }
      // fixed the inner edge then add face.
      if (count > 1) {  // add the last edge
         let lastBevel = this.simpleSplit(prevOut.pair);
         ret.halfEdges.push(lastBevel);   // reverse direction. so collapse will do the right thing.
         lastBevel.pair.next = prevBevel.pair; 
         const firstBevel = vertex.outEdge.pair.next;
         firstBevel.pair.next = lastBevel.pair;   // innerEdge loop connected.
         const polygon = this._createPolygon(firstBevel.pair, count+1);
         ret.selectedFaces.push(polygon);
      } else { // weird case of 2 edge vertex

      }
   }

   // compute moveLimit.
   ret.vertexLimit = Number.MAX_SAFE_INTEGER;       // magnitude
   ret.position = new Float32Array(ret.vertices.length*3);     // saved the original position
   ret.direction = new Float32Array(ret.vertices.length*3);    // also add direction.
   let i = 0;
   for (let vertex of ret.vertices) {
      const position = ret.position.subarray(i, i+3);
      const direction = ret.direction.subarray(i, i+3);
      vec3.copy(position, vertex.vertex);
      vec3.sub(direction, vertex.outEdge.destination().vertex, position);
      if (slideHEdges.has(vertex.outEdge.pair)) {  // half length because we are sharing the expansion.
         ret.vertexLimit = Math.min(vec3.length(direction)*0.5, ret.vertexLimit);
      } else {
         ret.vertexLimit = Math.min(vec3.length(direction), ret.vertexLimit);  // the full length.
      }
      vec3.normalize(direction, direction);
      i += 3;
   }

   // results
   return ret;
};



WingedTopology.prototype.extrudeContours = function(edgeLoops) {
   // extrude face. connect(outer, inner) loop.
   let extrudeContours = [];
   for (let contour of edgeLoops) {
      for (let edge of contour) {
         let polygon = [];
         polygon.push( edge.inner.origin.index );
         polygon.push( edge.outer.origin.index );
         polygon.push( edge.outer.destination().index );
         polygon.push( edge.inner.destination().index );
         this.addPolygon( polygon );
         extrudeContours.push( this.findHalfEdge(edge.inner.origin, edge.outer.origin) );
      }
   }

   return extrudeContours;
};

// Similar to findFaceGroup
WingedTopology.prototype.findEdgeGroup = function(selectedWingedEdge) {
   const processWingedEdge = new Set(selectedWingedEdge);
   let wingedEdgeGroup = null;
   function processNeighbors(wingedEdge) {
      processWingedEdge.delete(wingedEdge);
      wingedEdgeGroup.add(wingedEdge);
      for (let neighborWinged of wingedEdge.oneRing()) {
         if (processWingedEdge.has(neighborWinged)) {
            processNeighbors(neighborWinged);
         }
      }
   };

   let list = [];
   for (let wingedEdge of processWingedEdge) {
      wingedEdgeGroup = new Set;
      processNeighbors(wingedEdge);
      list.push( wingedEdgeGroup );
   }

   return list;
};


//
// similar to findContours. but return a list of faces.
//
WingedTopology.findFaceGroup = function(selectedPolygon) {
   const processPolygon = new Set(selectedPolygon);
   let faceGroup = null;

   function processNeighbors(polygon) {
      processPolygon.delete(polygon);
      faceGroup.add(polygon);
      polygon.eachVertex( (vertex) => {   // polygon sharing the same vertex will be group together
         vertex.eachOutEdge( (outEdge) => {
            const face = outEdge.pair.face;
            if (processPolygon.has(face)) {
               // depth first search
               processNeighbors(face);
            }
          });
      });
   };

   let list = [];
   for (let polygon of processPolygon) {
      faceGroup = new Set;
      processNeighbors(polygon);
      list.push( faceGroup );
   }

   return list;
}



WingedTopology.findContours = function(selectedPolygon) {
   const contourEdges = new Set;
   const edgeLoops = [];
   // find all contourEdges to extrude
   for (let polygon of selectedPolygon) {
      polygon.eachEdge( function(outEdge) {
         if (!contourEdges.has(outEdge) && !selectedPolygon.has(outEdge.pair.face)) {
            const edgeLoop = [];
            let currentIn = outEdge;
            do {
               // this edge is contour. now walk cwRing to find the next edges.
               let nextIn = currentIn.next.pair;
               while (nextIn !== currentIn) {
                  if (!selectedPolygon.has(nextIn.face)) { // yup, find the other contour
                     break;
                  }
                  nextIn = nextIn.next.pair;
               }
               const edge = {outer: currentIn, inner: null};
               edgeLoop.push( edge );
               contourEdges.add(currentIn);       // checkIn the contour edge.
               // we cw walk over to the next contour edge.
               currentIn = nextIn.pair;
            } while (currentIn !== outEdge);      // check if we come full circle
            edgeLoops.push( edgeLoop );
         }
      } );
   }

   return edgeLoops;
};


// weld innerLoop to outerLoop. both side must null face. 
WingedTopology.prototype.weldContour = function(edgeLoop) {
   let edgePrev = edgeLoop[edgeLoop.length-1]
   for (let i = 0; i < edgeLoop.length; ++i) {
      const edge = edgeLoop[i];
      if (edgePrev.inner.next !== edge.inner) { // check for contour tht don't have interpose edge
         const end = edge.inner;
         let current = edgePrev.inner.next;
         edgePrev.outer.next = current;
         let prev;
         do {
            current.origin = edge.outer.origin;
            prev = current.pair;
            current = prev.next;
         } while (current !== end);
         prev.next = edge.outer;
      }
      edge.outer.face = edge.inner.face;
      if (edge.inner.face.halfEdge === edge.inner) {
         edge.outer.face.halfEdge = edge.outer;
      }

      edgePrev = edge;
      this.addAffectedFace(edge.outer.face);
   }

   // now we can safely release memory
   for (let edge of edgeLoop) {
      edge.restore = {origin: edge.inner.origin, pt: vec3.clone(edge.inner.origin.vertex), hEdge: edge.inner};
      // remove vertex, and edge.
      this._freeVertex(edge.inner.origin);
      this._freeEdge(edge.inner);

   }
};


WingedTopology.prototype._liftLoop = function(edgeLoop) {
   // lift loop
   let edge0 = edgeLoop[edgeLoop.length-1];
   // lift the face edge from outer to inner.
   for (let j = 0; j < edgeLoop.length; ++j) {
      let edge1 = edgeLoop[j];
      // lift edges from outer, and connect to inner
      let outerNext = edge0.outer.next;
      if (outerNext !== edge1.outer) {
         // lift begin to end
         let outer1Prev = edge1.outer.prev();
         edge0.outer.next = edge1.outer;
         edge0.inner.next = outerNext;
         outer1Prev.next = edge1.inner;
         // reset all vertex
         let inner = outerNext;
         do {
            if (inner.origin.outEdge === inner) {
               inner.origin.outEdge = edge1.outer;
            }
            inner.origin = edge1.inner.origin;
            inner = inner.pair.next;
         } while (inner !== edge1.inner);
      }
      edge0 = edge1;       // move edge post
      // setup the faces.
      edge1.inner.face = edge1.outer.face;
      edge1.outer.face = null;
      if (edge1.inner.face.halfEdge === edge1.outer) {
         edge1.inner.face.halfEdge = edge1.inner;
      }
      this.addAffectedFace(edge1.inner.face);
   }
   return edgeLoop;
};
// lift edges from outerLoop to innerLoop. null the face between inner and outerface
WingedTopology.prototype.liftContour = function(edgeLoop) {
   if (edgeLoop.length === 0) {   // should not happened, but. Should we check ( < 4) too?
      return edgeLoop;
   }

   let firstVertex = this.addVertex(edgeLoop[0].outer.origin.vertex);
   let fromVertex = firstVertex; 
   for (let i = 0; i < edgeLoop.length; ++i) {
      let outerEdge = edgeLoop[i].outer;
      let toVertex;
      if (i == (edgeLoop.length-1)) {  // the last one loopback
         toVertex = firstVertex;
      } else {
         toVertex = this.addVertex(outerEdge.destination().vertex);
      }
      edgeLoop[i].inner = this.addEdge(fromVertex, toVertex);
      fromVertex = toVertex;
   }

   return this._liftLoop(edgeLoop);
};
WingedTopology.prototype.restoreContour = function(edgeLoop) {
   if (edgeLoop.length === 0) {   // should not happened, but. Should we check ( < 4) too?
      return edgeLoop;
   }

   // restore
   for (let edge of edgeLoop) { // restore vertex
      this.addVertex(edge.restore.pt, edge.restore.origin);
   }
   let prev;
   for (let i = 0; i < edgeLoop.length; ++i) { // restore edge
      const edge = edgeLoop[i];
      const edgeNext = edgeLoop[(i+1)%edgeLoop.length];
      const current = this._createEdge(edge.restore.origin, edgeNext.restore.origin, edge.restore.hEdge); // destination = next.origin
      edge.restore.origin.outEdge = current;
      if (prev) {
         prev.next = current;
         current.pair.next = prev.pair;
      }
      prev = current;
   }
   // connect last to first
   prev.next = edgeLoop[0].inner;
   edgeLoop[0].inner.pair.next = prev.pair;

   return this._liftLoop(edgeLoop);
};


// lift edges from outerLoop to innerLoop.
WingedTopology.prototype.liftContours = function(edgeLoops) {
   for (let edgeLoop of edgeLoops) {
      this.liftContour(edgeLoop);
   }

   return edgeLoops;
};


// insert a new edge, for undo purpose
WingedTopology.prototype._liftEdge = function(outLeft, inRight, fromVertex, delEdge) {
   const beg = outLeft.prev();
   const endOut = inRight.next;
   const outEdge = this._createEdge(fromVertex, outLeft.origin, delEdge);
   const inEdge = outEdge.pair;
   inRight.next = outEdge;
   outEdge.next = endOut;
   inEdge.next = outLeft;
   beg.next = inEdge;
   fromVertex.outEdge = outEdge;
   // lift edges up from left to right.
   let currentOut = outLeft;
   do {
      if (currentOut.origin.outEdge === currentOut) {
         currentOut.origin.outEdge = endOut; // or inEdge a safer choice? 
      }
      currentOut.origin = fromVertex;
      this.addAffectedWEdge( currentOut.wingedEdge );
      currentOut = currentOut.pair.next;
   } while (currentOut !== outEdge);
   outEdge.face = inRight.face;
   if (outEdge.face) {
      outEdge.face.numberOfVertex++;
      this.addAffectedFace(outEdge.face);
   }
   inEdge.face = outLeft.face;
   if (inEdge.face) {
      inEdge.face.numberOfVertex++;
      this.addAffectedFace(inEdge.face);
   }
}


WingedTopology.prototype._collapseEdge = function(halfEdge) {
   const next = halfEdge.next;
   const prev = halfEdge.prev();

   const pair = halfEdge.pair;
   const pairNext = pair.next;
   const pairPrev = pair.prev();

   const fromVertex = halfEdge.origin;
   const toVertex = pair.origin;

   // halfedge -> vertex
   let current = pairNext;
   while (current !== halfEdge) {
      current.origin = toVertex;
      this.addAffectedWEdge(current.wingedEdge);
      current = current.pair.next;
   }

   // reconnect 
   prev.next = next;
   pairPrev.next = pairNext;

   // adjust face
   let face = halfEdge.face;
   if (face) {
      if (face.halfEdge === halfEdge) {
         face.halfEdge = next;
      }
      face.numberOfVertex--;
      this.addAffectedFace(face);
   }
   face = pair.face;
   if (face) {
      if (face.halfEdge === pair) {
         face.halfEdge = pairNext;
      }
      face.numberOfVertex--;
      this.addAffectedFace(face);
   }
   // adjust vertex
   if (toVertex.outEdge === pair) {
      toVertex.outEdge = next;
   }

   // delete stuff
   this._freeEdge(halfEdge);
   this._freeVertex(fromVertex);

   // undo collapseEdge
   return {hEdge: halfEdge, pairNext: pairNext, prev: prev, vertex: fromVertex};
};

// undo of  _collapseLoop.
WingedTopology.prototype._restoreLoop = function(halfEdge, delEdge, delPolygon) {
   const prev = halfEdge.prev();
   const outEdge = this._createEdge(halfEdge.destination(), halfEdge.origin, delEdge);
   const inEdge = outEdge.pair;

   // fix connection
   prev.next = inEdge;
   inEdge.next = halfEdge.next;
   halfEdge.next = outEdge;
   outEdge.next = halfEdge;

   // fix face
   inEdge.face = halfEdge.face;
   const newPolygon = this._createPolygon(outEdge, 2, delPolygon);
   halfEdge.face = newPolygon;   // unnecessary, already update
   outEdge.face = newPolygon;    // unnecessary, already update.

   // fix face.outEdge
   if (inEdge.face.halfEdge === halfEdge) {
      inEdge.face.halfEdge = inEdge;
   }
};
WingedTopology.prototype._collapseLoop = function(halfEdge, collapsibleWings) {
   if (collapsibleWings && !collapsibleWings.has(halfEdge.wingedEdge)) {   // if not collapsible, move to next.
      halfEdge = halfEdge.next;  // need not check, if both are collapsible, either one are ok.
   }
   const next = halfEdge.next;
   const pair = halfEdge.pair;
   const nextPair = next.pair;

   // is it a loop ?//assert ((next_halfedge_handle(h1) == h0) && (h1 != o0));

   // fix halfEdge.next connectionh
   next.next = pair.next;
   pair.prev().next = next;

   // fix halfEdge.face
   let polygon = pair.face;
   next.face = polygon;

   // fix vertex.outEdge;
   if (halfEdge.origin.outEdge === halfEdge) {
      halfEdge.origin.outEdge = nextPair;   // adjustOutgoing();
   }
   if (pair.origin.outEdge === pair) {
      pair.origin.outEdge = next;      // adjustOutgoingEdge();
   }

   // fix face.halfEdge
   if (polygon.halfEdge === pair) {
      polygon.halfEdge = next;
   }

   // delete stuff
   const delPolygon = halfEdge.face;
   this._freePolygon(halfEdge.face);
   this._freeEdge(halfEdge);
   
   // restoreLoop
   return {next: next, hEdge: halfEdge, polygon: delPolygon};
};


WingedTopology.prototype.collapseEdge = function(halfEdge, collapsibleWings) {
   const next = halfEdge.next;
   const pair = halfEdge.pair;
   const pairNext = pair.next;

   // remove edge
   const undo = this._collapseEdge(halfEdge);

   // remove loops(2 side polygon)
   if (next.next.next === next) {
      undo.leftLoop = this._collapseLoop(next.next, collapsibleWings);
   }
   if (pairNext.wingedEdge.isLive() && (pairNext.next.next === pairNext)) {   // add wingedEdge.isLive() to guard (--) edges.
      undo.rightLoop = this._collapseLoop(pairNext, collapsibleWings);
   }
   return undo;
};

WingedTopology.prototype.restoreCollapseEdge = function(undo) {
   if (undo.rightLoop) {
      this._restoreLoop(undo.rightLoop.next, undo.rightLoop.hEdge, undo.rightLoop.polygon);
   }
   if (undo.leftLoop) {
      this._restoreLoop(undo.leftLoop.next, undo.leftLoop.hEdge, undo.leftLoop.polygon);
   }
   // undo collapseEdge
   this._liftEdge(undo.pairNext, undo.prev, this.addVertex(undo.vertex.vertex, undo.vertex), undo.hEdge);
};


// fixed the halfEdge relation only.
WingedTopology.prototype._removeEdge = function(outEdge, inEdge) {
   const outPrev = outEdge.prev();
   const outNext = outEdge.next;
   const inPrev = inEdge.prev();
   const inNext = inEdge.next;
   
   outPrev.next = inNext;
   inPrev.next = outEdge.next;

   //correct vertex.outEdge if needed.
   if (outEdge.origin.outEdge === outEdge) {
      outEdge.origin.outEdge = outPrev.pair;
   }
   if (inEdge.origin.outEdge === inEdge) {
      inEdge.origin.outEdge = inPrev.pair;
   }
   return {outPrev: outPrev, outNext: outNext, outEdge: outEdge}; // changed to restore outEdge
}
// won't work with potentially "dangling" vertices and edges. Any doubt, call dissolveEdge
WingedTopology.prototype.removeEdge = function(outEdge) {
   let inEdge = outEdge.pair;
   if (inEdge.face === null && outEdge.face !== null) {   // switch side
      inEdge = outEdge;
      outEdge = inEdge;
      /*if (inEdge.face === null) {
         console.log("error, both side of the edges are null faces");
         return null;
      }*/
   }

   //fix the halfedge relations
   const remove = this._removeEdge(outEdge, inEdge);
  
   //deal with the faces
   const delFace = outEdge.face;    // the other side is boundary, after removal becomes boundary too.
   const face = inEdge.face;

   if (face !== null) {
      if (face.halfEdge === inEdge) { //correct the halfedge handle of face if needed
         face.halfEdge = remove.outPrev;
      }
   // make sure everye connect edge point to the same face.
      face.numberOfVertex = 0;
      for (let hEdge of face.hEdges()) {
         ++face.numberOfVertex;
         hEdge.face = face;
      }
      this.addAffectedFace(face);
   }

   if (delFace !== null) {    // guaranteed to be non-null, but maybe later use case will change, (yes, makeHole needs to be both-null. 2018-08-28)
      this._freePolygon(delFace);
      remove.delFace = delFace;
   }
   this._freeEdge(outEdge);

   // return undo function
   return remove;
   //return face;   // return the remaining face handle
};
WingedTopology.prototype.restoreRemoveEdge = function(undo) {
   this.insertEdge(undo.outPrev, undo.outNext, undo.outEdge, undo.delFace);
};



WingedTopology.prototype.dissolveEdge = function(outEdge, collapsibleWings) {
   // check next only connect to outEdge? 
   const inEdge = outEdge.pair;
   if (outEdge.next.pair.next === inEdge) {
      return this.collapseEdge(inEdge, collapsibleWings);   // collapse inward
   } else if (inEdge.next.pair.next === outEdge) {
      return this.collapseEdge(outEdge, collapsibleWings);  // collapse outward
   } else {
      return this.removeEdge(outEdge);    // normal dissolve
   }
};

WingedTopology.prototype.restoreDissolveEdge = function(undo) {
   if (undo.outPrev) {
      this.restoreRemoveEdge(undo);
   } else {
      this.restoreCollapseEdge(undo);
   }
};



// selectedVertex. search the nearest edge on the same face.
// 2 ways to determine if vertex is edge. 1)prev, next edges are not parallel. 2) vertex has only 2 wingededges, and share the same faces.
// we decided to use the 2nd way temporary. After everything is debugged, switch to first method because it more robust.
WingedTopology.prototype.connectVertex = function(selectedVertex) {
   // first collect face from vertex.
   const selectedFace = new Map();
   for (let vertex of selectedVertex) {
      vertex.eachOutEdge( function(edge) {
         let val = 1;
         if (selectedFace.has(edge.face)) {
            val = selectedFace.get(edge.face) + 1;
         }
         selectedFace.set(edge.face, val);
      });
   }

   // corner. 
   const faceList = [];
   let edges = [];       // each face's edges
   // second (group vertex) that have the same faces as same edgeGroup.
   for (let [polygon, faceCount] of selectedFace) {
      if (faceCount > 1) {
         // at least 2 vertex selected.
         let prevEdgeNumber = -1;
         let edgeNumber = -1;
         let outEdge = polygon.halfEdge;
         // find first corner.
         while (outEdge.origin.valence == 2) {
            outEdge = outEdge.next;
         }
         // ok, first corner.
         const firstCorner = outEdge;
         do {
            let valence = outEdge.origin.valence;
            prevEdgeNumber = edgeNumber;
            if (valence != 2) {        // we should really check for straight line.
               edgeNumber++;
            }
            if (selectedVertex.has(outEdge.origin)) {
               const obj = {prevEdgeNumber: prevEdgeNumber, edgeNumber: edgeNumber, outEdge: outEdge};
               edges.push( obj );
            }
            outEdge = outEdge.next;
         } while (outEdge !== firstCorner);
         //update first edges number
         const edge = edges[0];
         if (edge.prevEdgeNumber == -1) {
            edge.prevEdgeNumber = edgeNumber;
         }
         // save to face list
         faceList.push( edges );
         edges = [];
      }
   }


   const edgeList = [];
   // the real meat, connect vertex.
   for (let edges of faceList) {
      // check for special case. one interior selected vertex per edge. update. includeing zero selected vertex per edge.
      let specialCase = true;
      let prevEdgeNumber = -1;
      for (let [_i, edge] of edges.entries()) {
         if ( (edge.prevEdgeNumber !== edge.edgeNumber) || (prevEdgeNumber == edge.edgeNumber) ) {   // corner or more than 1 vertex on same Edge.
            specialCase = false;
            break;
         }
         prevEdgeNumber = edge.edgeNumber;
      }
      if (specialCase) {
         if (edges.length === 2) {  // connect 2 edges will have a 2 side polygon, so just connect one edge. last to first, first to last is the same edge.
            edgeList.push( this.insertEdge(edges[0].outEdge.prev(), edges[1].outEdge));
         } else {
            const edge0Prev = edges[0].outEdge.prev();
            for (let i = 0; i < edges.length; ++i) {
               let origin = edges[i];
               let destination;
               let edge;
               if ( (i+1) < edges.length) {
                  destination = edges[i+1];
                  edge = this.insertEdge(origin.outEdge.prev(), destination.outEdge);
               } else { // connect last to first.
                  edge = this.insertEdge(origin.outEdge.prev(), edge0Prev.next);
               }
               edgeList.push( edge );
            }
         }
      } else {
         // walk from beginning++, and end--.
         let i = edges.length-1;
         let j = 0;
         do {
            let origin = edges[i];
            let destination = edges[j];
            if (origin.edgeNumber != destination.prevEdgeNumber) {
               const edge = this.insertEdge(origin.outEdge.prev(), destination.outEdge);
               edgeList.push( edge );
               i--;
            }
            j++;     // move to next destination.
         } while (j < i);
      }
   }
   // return insertEdge list.
   return edgeList;
};


WingedTopology.prototype.removePolygon = function(polygon) {
   for (let hEdge of polygon.hEdges()) {
      hEdge.face = null;
   }
   // put into freeList.
   this._freePolygon(polygon);
};
/*function isCorner(outEdge) {
   const prev = outEdge.prev();
   const a = vec3.create();
   vec3.sub(a, outEdge.destination().vertex, outEdge.origin.vertex); 
   const b = vec3.create();
   vec3.sub(b, prev.origin.vertex, prev.destination().vertex);
   const cosTheta = vec3.dot(a, b) / (vec3.len(a) + vec3.len(b));
   // none straight line is corner; cos 180 === -1. cos 0 === 1.
   return cosTheta > -0.992;   // ~< 175 degree. is a corner.
}*/

WingedTopology.prototype.dissolveVertex = function(vertex) {
   // now free the vertex.
   const self = this;
   const pt = new Float32Array(3);
   vec3.copy(pt, vertex.vertex);
   if (vertex.isIsolated()) {
      this._freeVertex(vertex);
      return {pt: pt, vertex: vertex};
   } else {
      this.addAffectedEdgeAndFace(vertex);
      let count = 0;
      const firstIn = vertex.outEdge.pair;
      let lastIn;
      // slide edge, move edge down like collapse edge, without the collapsing.
      let outEdge;    // outEdge for new Polygon
      vertex.eachInEdge( function(inEdge) {
         //inEdges.unshift( inEdge );
         const nextOut = inEdge.next;
         outEdge = inEdge.pair;
         if (nextOut.face.halfEdge === nextOut) {
            nextOut.face.halfEdge = inEdge;   // reassigned outEdge.
         }
         --nextOut.face.numberOfVertex;
         inEdge.next = nextOut.next;      // slide down the next Edge.
         nextOut.next = outEdge;
         outEdge.origin = nextOut.pair.origin; // reassign new vertex
         count++;
         lastIn = inEdge;
      });
      // remove loop edge.
      const polygon = this._createPolygon(outEdge, count);
      const undoCollapseLoop = [];
      let vertexOutEdge = vertex.outEdge;
      outEdge = vertex.outEdge;
      do {
         let inEdge = outEdge.pair;
         outEdge = outEdge.next;
         if (inEdge.next.next === inEdge) {  // 2 edge loop, not polygon, now collapse it.
            if (inEdge.pair === vertexOutEdge) {
               vertexOutEdge = inEdge.next;  // 
            }
            undoCollapseLoop.unshift( this._collapseLoop(inEdge) );   // collapse inward
         } else {
            //inEdge.pair.face = polygon;      // already assigned in _createPolygon.
         }
      } while (outEdge !== vertexOutEdge);
      // free vertex
      this._freeVertex(vertex);
      return {polygon: polygon, pt: pt, vertex: vertex, undoCollapseLoop: undoCollapseLoop, lastIn: lastIn, firstIn: firstIn};
   }
};
WingedTopology.prototype.restoreDissolveVertex = function(undo) {
   if (undo.polygon) {
      // reallocated free vertex
      const vertex = this.addVertex(undo.pt, undo.vertex);
      // undo collapse loop
      for (let loop of undo.undoCollapseLoop) {
         this._restoreLoop(loop.next, loop.hEdge, loop.polygon);
      }
      // reattach edges to vertex
      let inEdge = undo.lastIn;
      let lastIn = undo.lastIn.next.pair;
      let prevIn = undo.firstIn;
      do {
         let outEdge = inEdge.pair;
         outEdge.origin = vertex;
         let prevOut = prevIn.pair;
         prevOut.next = inEdge.next;
         inEdge.next = prevOut;
         prevOut.face = inEdge.face;  
         ++prevOut.face.numberOfVertex;
         // ready for next.
         prevIn = inEdge;
         inEdge = outEdge.next.pair;
      } while (inEdge !== lastIn);
      vertex.outEdge = undo.firstIn.pair;
      // free polygon
      this._freePolygon(undo.polygon);
      // selected vertex
      this.addAffectedEdgeAndFace(vertex);
   } else { // isolated vertex
      this.addVertex(undo.pt, undo.vertex);
   }
   return undo.vertex;
};

//
// bridge the 2 faces. and 
//
WingedTopology.prototype.bridgeFace = function(targetFace, sourceFace, deltaCenter) {
   const ret = {target: {face: targetFace, hEdge: targetFace.halfEdge}, source: {face: sourceFace, hEdge: sourceFace.halfEdge} };
   // get the 2 faces vertices
   const targetHEdges = [];
   const sourceHEdges = [];
   for (let hEdge of targetFace.hEdges()) {
      targetHEdges.push( hEdge );
      hEdge.face = null;   // remove face reference
   }
   // move source to target
   for (let hEdge of sourceFace.hEdges()) {
      const point = vec3.clone(hEdge.origin.vertex);
      vec3.add(point, point, deltaCenter);
      sourceHEdges.unshift( {hEdge: hEdge, delta: point} );  // reverse direction.
      hEdge.face = null;   // remove face reference
   }
   // project origin's vertices  to target's plane? skip it for now
   // find the smallest length combined.
   let index = -1;
   let len = Number.MAX_SAFE_INTEGER;
   const temp = vec3.create();
   for (let i = 0; i < sourceFace.numberOfVertex; ++i) {
      // add up th length
      let currentLen = 0;
      for (let j = 0; j < targetHEdges.length; ++j) {
         vec3.sub(temp, targetHEdges[j].origin.vertex, sourceHEdges[j].delta);
         len += vec3.length(temp);
      }
      if (currentLen < len) {
         len = currentLen;
         index = i;
      }
      sourceHEdges.push( sourceHEdges.shift() );  // rotate 
   }
   // hopefully -1 works well enough with splice and unshift.
   sourceHEdges.unshift.apply( sourceHEdges, sourceHEdges.splice(index-1, sourceHEdges.length ) ); // rotate to desired location.
   // remove face, and bridge target[0] at the source index
   this._freePolygon(targetFace);
   this._freePolygon(sourceFace);
   let hEdgePrev = null;
   const hEdges = [];
   for (let i = 0; i < targetHEdges.length; ++i) {  // create new Edge, new Face.
      const hEdge = this.addEdge(sourceHEdges[i].hEdge.origin, targetHEdges[i].origin);
      if (hEdgePrev) {  // added the face
         this._createPolygon(hEdgePrev, 4);
      }
      hEdges.push( hEdge );
      hEdgePrev = hEdge;
   }
   this._createPolygon(hEdgePrev, 4);

   ret.hEdges = hEdges;
   return ret;
}

WingedTopology.prototype.undoBridgeFace = function(bridge) {
   for (let hEdge of bridge.hEdges) {
      this.removePolygon(hEdge.face);  // free face first
   }
   for (let hEdge of bridge.hEdges) {
      this._removeEdge(hEdge, hEdge.pair); // remove edge later.
   }
   // now, get the 2 face back
   this._createPolygon(bridge.target.hEdge, bridge.hEdges.length, bridge.target.face);
   this._createPolygon(bridge.source.hEdge, bridge.hEdges.length, bridge.source.face);
};

//
// insetFace.
//
WingedTopology.prototype.findInsetContours = function(polygonSet) {
   // find contour.
   const edgeLoops = [];
   for (let polygon of polygonSet) {
      const edgeLoop = [];
      for (let hEdge of polygon.hEdges()) {
         const edge = {outer: hEdge, inner: null};
         edgeLoop.push(edge);
      }
      edgeLoops.push( edgeLoop );
   }

   return edgeLoops;
};



WingedTopology.prototype._liftDanglingEdge = function(hEdge, destVert) {
   const next = hEdge.next;
   const danglingOut = this._createEdge(next.origin, destVert);
   destVert.outEdge = danglingOut.pair;
   hEdge.next = danglingOut;
   danglingOut.pair.next = next;
   danglingOut.face = danglingOut.pair.face = hEdge.face;   // assigned face, but don't update number of vertex.
   return danglingOut;
};
//
// insert a dangling corner edge at hEdge.next position.
WingedTopology.prototype.liftCornerEdge = function(hEdge, percent = 0.2) {
   const pt = vec3.create();
   const vector = vec3.create();
   // lift destination corner vertex
   let next = hEdge.next;
   vec3.lerp(pt, next.origin.vertex, next.destination().vertex, percent);
   vec3.sub(vector, hEdge.origin.vertex, hEdge.destination().vertex);
   vec3.scale(vector, vector, percent);
   vec3.add(pt, pt, vector);
   let destVert = this.addVertex(pt);
   // fixup the new fence End
   let danglingOut = this._liftDanglingEdge(hEdge, destVert);

   return danglingOut;
};
//
// fix up insertOut.destination() at inEdge.destination().
//
/*WingedTopology.prototype._insertEdge = function(begHalf, endHalf, delPolygon) {
   const v0 = begHalf.destination();
   const v1 = endHalf.destination();
   const oldPolygon = begHalf.face;

   // create edge and link together
   const outEdge = this._createEdge(v0, v1);
   const inEdge = outEdge.pair;
   inEdge.next = begHalf.next;
   outEdge.next = endHalf.next;
   begHalf.next = outEdge;
   begHalf.next = inEdge;
  
   //now set the face handles
   const newPolygon = this._createPolygon(outEdge, 4, delPolygon);  // readjust size later.

   // inEdge is oldPolygon
   inEdge.face = oldPolygon;
   if (oldPolygon.halfEdge.face === newPolygon) { //  pointed to one of the halfedges now assigned to newPolygon
      oldPolygon.halfEdge = inEdge; // should add to restore list.
   }
   oldPolygon.update();
   this.addAffectedFace( oldPolygon );

   // adjustOutEdge for v0, v1. point to boundary so, ccw work better?
   return outEdge;
}*/
//
// extrudeEdge.
//  
WingedTopology.prototype.extrudeEdge = function(startFenceHEdge, finishFenceHEdge) {
   const lift = [];
   const extrude = [];
   // 
   let sFenceOut = startFenceHEdge;
   let current = startFenceHEdge.next;
   let next = current.next;
   const pt = vec3.create();
   while (next !== finishFenceHEdge) {
      // lift destination corner vertex
      let fFenceIn = this.liftCornerEdge(current);   // at destination() of current
      lift.push(fFenceIn.pair);
      // extrude paralle edge.
      let extrudeOut = this.insertEdge(fFenceIn, sFenceOut);
      extrude.push( extrudeOut );
      // move to nextEdge
      sFenceOut = fFenceIn.pair;
      current = next;
      next = next.next;
   }
   // connect to the last one. 
   let extrudeOut = this.insertEdge(next, sFenceOut);
   extrude.push( extrudeOut );

   // return created halfEdges
   return {extrude: extrude, lift: lift};
};


WingedTopology.prototype.slideToPrev = function(outEdge, prevPrev) {
   if (!prevPrev) {
      prevPrev = outEdge.prev().prev();
   } else {
      // check(prevPrev.next.next === outEdge)
   }
   const prev = prevPrev.next;
   const inEdge = outEdge.pair;

   if (outEdge.face.numberOfVertex <= 3) {   // collapseLoop already.
      const result = {inEdge: outEdge, delFace: outEdge.face, inNext: outEdge.next, inPrev: outEdge.prev()};
      this.this.removeEdge(outEdge);
      return result;
   }

   // fix up th pointer
   prev.next = inEdge.next;
   inEdge.next = prev;
   prevPrev.next = outEdge;

   // fix up the faces.
   if (outEdge.origin.outEdge === outEdge) {
      outEdge.origin.outEdge = prev.next;  // we will be no longer using origin;
   }
   outEdge.origin = prev.origin;

   // reassign face
   if (prev.face.halfEdge === prev) {
      prev.face.halfEdge = inEdge;
   }
   prev.face = inEdge.face;
   ++inEdge.face.numberOfVertex;
   --outEdge.face.numberOfVertex;

   // for slideToNext
   return {inEdge: inEdge};
};


// slide dow
WingedTopology.prototype.slideToNext = function(inEdge) {
   if (inEdge.face.numberOfVertex <= 3) {   // collapseLoop if slide, just remove the edge, simpler
      const result = {inEdge: inEdge, delFace: inEdge.face, inNext: inEdge.next, inPrev: inEdge.prev()};
      this.removeEdge(inEdge);   // todo: removeEdge should return result, instead of closure.
      return result;
   }

   // Fix up the pointer and face.
   const outEdge = inEdge.pair;
   const next = inEdge.next;
   const prev = outEdge.prev();

   prev.next = next;
   inEdge.next = next.next;
   next.next = outEdge;

   if (outEdge.origin.outEdge === outEdge) {
      outEdge.origin.outEdge = next;  // we will be no longer using origin;
   }
   outEdge.origin = inEdge.next.origin;
   this.addAffectedWEdge(outEdge.wingedEdge);

   // reassign face.
   if (next.face.halfEdge === next) {
      next.face.halfEdge = inEdge;
   }
   inEdge.face = next.face;
   next.face = outEdge.face; 
   ++outEdge.face.numberOfVertex;      // accounting.
   --inEdge.face.numberOfVertex;       // oops, needs ot collapse edge
   this.addAffectedFace( outEdge.face );
   this.addAffectedFace( inEdge.face );

   return {prevPrev: prev, outEdge: outEdge};   // for slideToPrev
};
WingedTopology.prototype.undoSlideToNext = function(result) {
   if (result.delFace) {   // yep, removeEdge, so now restore.
      this.insertEdge(result.inPrev, result.inNext, result.inEdge, result.delFace);
   } else {
      this.slideToPrev(result.outEdge, result.prevPrev);
   }
};


//
// insertFan - inside polygon, adds polygon fan with fanLists(Set)
//
WingedTopology.prototype.insertFan = function(polygon, fanLists) {
   //const 
   
   // get polygon centroid.
   const centroid = vec3.create();
   polygon.getCentroid(centroid);
   let destVert = this.addVertex(centroid);

   const fan = [];
   let lastOut;
   for (let hEdge of polygon.hEdges()) {  // walk in order.
      if (fanLists.has(hEdge)) { // only in the list, we do fanEdge.
         if (lastOut !== undefined) {
            lastOut = this.insertEdge(hEdge, lastOut.pair);
            fan.unshift(lastOut.pair);
         } else { // liftCorner Edge for first Fan.
            lastOut = this._liftDanglingEdge(hEdge, destVert);
            fan.unshift( lastOut ); // lastOut, not lastOut.pair will guarantee dissolve correctly.
         }
      }
   }

   return fan;
};


// 
// invert() - invert the normal of all polygon. usefull when import meshes that use cw-order polygon.
//
WingedTopology.prototype.invert = function() {
   const reverse = [];
   for (let polygon of this.faces) {
      for (let hEdge of polygon.hEdges()) {
         reverse.push( {hEdge: hEdge.next.pair, next: hEdge.pair} );
      }
   }
   // got the reversed list, now reverse the edge.
   for (let {hEdge, next} of reverse) {
      hEdge.next = next;
   }
   // now swap the polygon pointer.
   for (let wEdge of this.edges) {
      let swapPoly = wEdge.left.face;
      if (swapPoly.halfEdge === wEdge.left) {
         swapPoly.halfEdge = wEdge.right;
      }
      wEdge.left.face = wEdge.right.face;
      if (wEdge.left.face.halfEdge === wEdge.right) {
         wEdge.left.face.halfEdge = wEdge.left;
      }
      wEdge.right.face = swapPoly;  // done swapping.
   }
};

//
// flip() - flip vertex around center with particular axis only
//
WingedTopology.prototype.flip = function(pivot, axis) {
   const axisX2 = pivot[axis] * 2;
   for (let vertex of this.vertices) {
      vertex.vertex[axis] = axisX2 - vertex.vertex[axis];  // == center[axis] - (vertex.vertex[axis]-center[ais])
         this.addAffectedEdgeAndFace(vertex);               // optimiztion: addAllAffected() functions.
      }
};


WingedTopology.prototype.makeHole = function(polygon) {
   // turn polygon into hole, 
   let ret = {hEdge: polygon.halfEdge, face: polygon, dissolveEdges: []};
   for (let hEdge of polygon.hEdges(true)) {
      hEdge.face = null;
      const pairEdge = hEdge.pair;
      if (pairEdge.face === null) { 
         ret.dissolveEdges.unshift( this.dissolveEdge(hEdge) );   // in any doubt, use dissolveEdge. I am stupid
      }
   }
   this._freePolygon(polygon);
   return ret;
};

WingedTopology.prototype.undoHole = function(hole) {
   for (let dissolve of hole.dissolveEdges) {
      if (!hole.face.isLive()) {
         dissolve.delFace = hole.face;
      }
      this.restoreDissolveEdge(dissolve);
   }
   if (!hole.face.isLive()) {
      return this._createPolygon(hole.hEdge, 4, hole.face);
   } else {
      return hole.face;
   }
};





/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FaceMadsor", function() { return FaceMadsor; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_edgemads__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_bodymads__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_model__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_view__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__wings3d__ = __webpack_require__(0);
/**
//    This module contains most face command and face utility functions.
//
//    
**/

   // for switching









class FaceMadsor extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["Madsor"] {
   constructor() {
      super('Face');
      var self = this;
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItemMode"](__WEBPACK_IMPORTED_MODULE_8__wings3d__["action"].faceDissolve.name, function(ev) {
            const command = new DissolveFaceCommand(self);
            if (command.doIt()) {
               __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](command);
            } else {
               geometryStatus('Selected Face not dissolveable');
            }
         }, this, 'Backspace');
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_8__wings3d__["action"].faceCollapse.name, function(ev) {
            const command = new CollapseFaceCommand(self);
            command.doIt();
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](command);
         });
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_8__wings3d__["action"].faceBridge.name, (ev) => {
         let bridgeFaces = this.getBridgeFaces();
         if (bridgeFaces.length === 2) {
            const dest = bridgeFaces[0];
            const origin = bridgeFaces[1];
            if (dest.face.numberOfVertex == origin.face.numberOfVertex) {
               let merge;
               let bridge;
               if (dest.preview !== origin.preview) {
                  // merge dest and origin.
                  merge = new MergePreviewCommand(dest.preview, origin.preview);
                  merge.doIt();
                  bridge = new BridgeFaceCommand(merge.getCombine(), dest.face, origin.face);
               } else {
                  bridge = new BridgeFaceCommand(dest.preview, dest.face, origin.face);
               }
               bridge.doIt();
               if (merge) {
                  __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueueCombo"]([merge, bridge]);
               } else {
                  __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](bridge);
               }
            }
         }
       });
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_8__wings3d__["action"].faceInset.name, (ev) => {
         if (this.hasSelection()) {
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["attachHandlerMouseMove"](new InsetFaceHandler(this));
         } else {
            geometryStatus('No selected face');
         }
       });
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_8__wings3d__["action"].faceBump.name, (ev) => {
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["attachHandlerMouseMove"](new BumpFaceHandler(this));
       });
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_8__wings3d__["action"].faceIntrude.name, (ev) => {
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["attachHandlerMouseMove"](new IntrudeFaceHandler(this));
       });
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_8__wings3d__["action"].faceLift.name, (ev) => {
         const snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.snapshotTransformFaceGroup);
         if (snapshots.length === 1) {
            const snapshot = snapshots[0];
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["attachHandlerMouseSelect"](new LiftFaceHandler(this, snapshot.preview));
         } else {
            // helpBar("Lift works only in one Cage");
         }
        });
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_8__wings3d__["action"].facePutOn.name, (ev)=> {
         let snapshot = [];
         for (let preview of this.selectedCage()) {
            if (preview.selectionSize() == 1) {
               snapshot.push( preview );
            }
          }
         if (snapshot.length == 1) {
            const putOn = new PutOnCommand(this, snapshot[0]);
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["attachHandlerMouseSelect"](putOn);
         } else {
            geometryStatus("You can only PutOn one face");
         }
        });
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_8__wings3d__["action"].faceMirror.name, (ev) => {
         const command = new MirrorFaceCommand(this);
         command.doIt();
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](command);
       });
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_8__wings3d__["action"].faceFlattenNormal.name, (_ev) => {
         const cmd = new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["GenericEditCommand"](this, this.flatten);
         if (cmd.doIt()) {
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](cmd);
         }
       });
   }

   // get selected Face's vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.snapshotFacePosition);
   }

   snapshotPositionAndNormal() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.snapshotFacePositionAndNormal);
   }

   snapshotTransformGroup() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.snapshotTransformFaceGroup);
   }

   bevel() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.bevelFace);
   }

   undoBevel(snapshots, selection) {
      this.restoreSelectionPosition(snapshots);
      // collapse extrudeEdge
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.collapseSplitOrBevelEdge);
      // rehilite selectedFace
      this.resetSelection();
      this.restoreSelection(selection);
   }

   bump() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.bumpFace);
   }

   undoBump(snapshots) {
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.undoExtrudeEdge);
   }

   // extrude Face
   extrude() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.extrudeFace);
   }

   undoExtrude(extrudeEdgesContoursArray) {
      this.doAll(extrudeEdgesContoursArray, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.collapseExtrudeEdge);
   }

   collapseEdgeNew(snapshots) {
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.collapseExtrudeEdge);
   }

   // face dissolve mode
   dissolve() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.dissolveSelectedFace);
   }
   undoDissolve(dissolveArray) {
      this.doAll(dissolveArray, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.undoDissolveFace);
   }

   // face collapse 
   collapse() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.collapseSelectedFace);
   }
   undoCollapse(collapseArray) {
      this.doAll(collapseArray, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.undoCollapseFace);
   }

   // intrude, 
   intrude() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.intrudeFace);
   }
   undoIntrude(snapshots) {
      return this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.undoIntrudeFace);
   }

   // bridge
   getBridgeFaces() {
      const snapshot = [];
      for (let cage of this.selectedCage()) {
         const selection = cage.snapshotSelection();
         for (let selected of selection) {
            snapshot.push( {preview: cage, face: selected} );
         }
      }
      return snapshot;
   }

   // Inset
   inset() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.insetFace);
   }

   mirror() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.mirrorFace);
   }

   undoMirror(snapshots) {
      return this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.undoMirrorFace);
   }

   flatten(axis) {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.flattenFace, axis);
   }

   planeCuttable(plane) {
      return this.resultAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.planeCuttableFace, plane);
   }
   planeCut(plane) {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.planeCutFace, plane);
   }
   undoPlaneCut(snapshots) { // undo of splitEdge.
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.collapseSplitOrBevelEdge);
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreFaceMode"](snapshots);
   }

   dragSelect(cage, hilite, selectArray, onOff) {
      if (hilite.face !== null) {
        if (cage.dragSelectFace(hilite.face, onOff)) {
            selectArray.push(hilite.face);
        }
      }
   }

   // select, hilite
   selectStart(preview, hilite) {
      // check not null, shouldn't happened
      if (hilite.face !== null) {
         var onOff = preview.selectFace(hilite.face);
         return new DragFaceSelect(this, preview, hilite.face, onOff);
      }    
   }

   isFaceSelectable() { return true; }

   _resetSelection(cage) {
      cage._resetSelectFace();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreFaceSelection(snapshot);
   }
   
   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots;
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_edgemads__["EdgeMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreEdgeMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromFaceToEdgeSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromFaceToVertexSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_2__wings3d_bodymads__["BodyMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreBodyMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromFaceToBodySelect);
      } else {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreMultiMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromFaceToMultiSelect);
      }
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["ToggleModeCommand"](redoFn, __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreFaceMode"], snapshots));
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_edgemads__["EdgeMadsor"]) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromFaceToEdgeSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromFaceToVertexSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_2__wings3d_bodymads__["BodyMadsor"]) {
         this.doaAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromFaceToBodySelect);
      } else {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromFaceToMultiSelect);
      }
   }
}


class DragFaceSelect extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["DragSelect"] {
   constructor(madsor, cage, halfEdge, onOff) {
      super(madsor, cage, halfEdge, onOff);
   }

   finish() {
      return new FaceSelectCommand(this.select);
   }
}


class FaceSelectCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(select) {
      super();
      this.select = select;
   }

   doIt() {
      for (var [cage, halfEdges] of this.select) {
         for (var i = 0; i < halfEdges.length; ++i) {
            cage.selectFace(halfEdges[i]);
         }
      }
   }

   undo() {
      this.doIt();   // selectEdge, flip/flop, so
   }
}


class DissolveFaceCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      const dissolve = this.madsor.dissolve();
      if (dissolve.length > 0) {
         this.dissolve = dissolve;
         return true;
      } else {
         return false;
      }
   }

   undo() {
      this.madsor.undoDissolve(this.dissolve);
   }
}

class CollapseFaceCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      const collapse = this.madsor.collapse();
      if (collapse.length > 0) {
         this.collapse = collapse;
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"](this.collapse);
         return true;
      } else {
         return false;
      }
   }

   undo() {
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["currentMode"]().resetSelection();
      this.madsor.undoCollapse(this.collapse);
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreFaceMode"](this.collapse);
   }   
}


//
// current limitation, no interobject bridge yet.
//
class BridgeFaceCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(cage, target, source) {
      super();
      this.cage = cage;
      this.target = target;
      this.source = source;
   }

   doIt() {
      // should be ready for bridging. 
      this.bridge = this.cage.bridge(this.target, this.source);
   }

   undo() {
      this.cage.undoBridge(this.bridge);
      this.cage.restoreFaceSelection(this.bridge);
   }
}

class MergePreviewCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(targetCage, sourceCage) {
      super();
      this.targetCage = targetCage;
      this.sourceCage = sourceCage;
   }

   getCombine() {
      return this.combine;
   }

   doIt() {
      this.combine = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["makeCombineIntoWorld"]([this.targetCage, this.sourceCage]);
      this.combine.name = this.targetCage.name;
      return true;
   }

   undo() {
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["removeFromWorld"](this.combine);
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["addToWorld"](this.targetCage);
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["addToWorld"](this.sourceCage);
   }
}


class InsetFaceHandler extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["MovePositionHandler"] {
   constructor(madsor) {
      super(madsor);
      //this.selectedFaces = madsor.snapshotSelection();
      this.movement = 0;
      this.doIt();   // init.
   }

   doIt() {
      this.snapshots = this.madsor.inset();   // should we test for current snapshots and prev snapshots?
      this.madsor.moveSelection(this.snapshots, this.movement);
      // get limit
      this.vertexLimit = Number.MAX_SAFE_INTEGER;
      for (let obj of this.snapshots) {
         this.vertexLimit = Math.min(this.vertexLimit, obj.snapshot.vertexLimit);
      } 
   }

   //_updateMovement(ev) {  // change back when we all move to moveSelection
   handleMouseMove(ev) {
      let move = this._calibrateMovement(ev.movementX);
      if ((this.movement+move) > this.vertexLimit) {
         move = this.vertexLimit - this.movement;
      } else if ((this.movement+move) < 0) {
         move = 0 - this.movement;
      }
      this.movement += move;
      this.madsor.moveSelection(this.snapshots, move);
      return move;
   }

   undo() {
      //this.madsor.restoreSelectionPosition(this.snapshots);  // do we realy needs this. since we are destroying it.
      this.madsor.collapseEdgeNew(this.snapshots);
      //this.snapshots = undefined;
   }
}

// Bump
class BumpFaceHandler extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["MoveableCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.bump = madsor.bump();
      this.moveHandler = new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["MoveAlongNormal"](madsor);
   }

   doIt() {
      this.bump = this.madsor.bump(this.bump);
      super.doIt();     // = this.madsor.moveSelection(this.snapshots, this.movement);
   }

   undo() {
      super.undo(); //this.madsor.restoreSelectionPosition(this.snapshots);
      this.madsor.undoBump(this.bump);
   }
}

// Intrude
class IntrudeFaceHandler extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["MoveableCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.intrude = madsor.intrude();
      this.moveHandler = new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["MoveAlongNormal"](madsor, true);
   }

   doIt() {
      this.intrude = this.madsor.intrude();
      super.doIt();     // = this.madsor.moveSelection(this.snapshots, this.movement);
      return true;
   }

   undo() {
      super.undo(); //this.madsor.restoreSelectionPosition(this.snapshots);
      this.madsor.undoIntrude(this.intrude);
   }
}


class LiftFaceHandler extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditSelectHandler"] {  // also moveable
   constructor(madsor, preview) {
      super(false, true, false);
      this.madsor = madsor;
      this.preview = preview;
      //this.snapshot = snapshot;
      // find contours
      this.contours = this.preview.getSelectedFaceContours();
      
   }

   hilite(hilite, currentCage) {  // no needs for currentCage
      if ((currentCage === this.preview) && hilite.edge) {
         return  this.contours.edges.has(hilite.edge.wingedEdge);
      }
      return false;
   }

   select(hilite) {
      if (hilite.edge && (this.contours.edges.has(hilite.edge.wingedEdge))) {
         // compute axis and center.
         this.axis = vec3.create();
         vec3.sub(this.axis, hilite.edge.destination().vertex, hilite.edge.origin.vertex);
         this.hiliteEdge = hilite.edge;
         // lift
         this.lift = this.preview.liftFace(this.contours, hilite.edge);
         // now ready for rotation.
         this.moveHandler = new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["MouseRotateAlongAxis"](this.madsor, this.axis, hilite.edge.origin.vertex);
         return true;
      }
      return false;
   }

   doIt() {
      this.lift = this.preview.liftFace(this.contours, this.hiliteEdge);
      super.doIt();
      return true;
   }

   undo() {
      super.doIt();  // this really not needede.
      // collapseFace
      this.preview.collapseExtrudeEdge(this.lift.extrudeEdges);
   }
}

//
class PutOnCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditSelectHandler"] {
   constructor(madsor, preview) {
      super(true, true, true);
      this.madsor = madsor;
      this.preview = preview;
      this.snapshot = preview.snapshotPositionAll();
   }

   hilite(_hilite, currentCage) {
      // show that hilite.vertex is actually ok or not, by changing mouse cursor.
      if (currentCage === this.preview) { // not good, we can only put on other object
         return false;
      }
      return true;
   }

   select(hilite, _currentCage) { // return true for accepting, false for continue doing things.
      if (hilite.vertex) {
         this.vertex = hilite.vertex;
         this.doIt();
         return true;
      } else if (hilite.edge) {
         this.edge = hilite.edge;
         this.doIt();
         return true;
      } else if (hilite.face) {
         this.face = hilite.face;
         this.doIt();
         return true;
      }
      // cannot possibly reach here.
      return false;
   }

   doIt() {
      if (this.vertex) {
         this.preview.putOnVertex(this.vertex);
      } else if (this.edge) {
         this.preview.putOnEdge(this.edge);
      } else if (this.face) {
         this.preview.putOnFace(this.face);
      } else {
         return false;  // should not happened.
      }
      return true;
   }

   undo() {
      this.preview.restoreMoveSelection(this.snapshot);
   }
}


class MirrorFaceCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      this.mirror = this.madsor.mirror();
   }

   undo() {
      this.madsor.undoMirror(this.mirror);
   }
}




/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EdgeMadsor", function() { return EdgeMadsor; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_bodymads__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_model__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__wings3d_view__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__wings3d_shaderprog__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__wings3d__ = __webpack_require__(0);
/**
//    This module contains most edge command and edge utility functions.
//
//    
**/

   // for switching









// 
class EdgeMadsor extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["Madsor"] {
   constructor() {
      super('Edge');
      // cut commands
      const self = this;
      for (let numberOfSegments of [__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].cutLine2, __WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].cutLine3, __WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].cutLine4, __WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].cutLine5, __WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].cutLine10]) {
         const name = numberOfSegments.name;
         const count = name.substring('cutLine'.length);
         __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItem"](name, function(ev) {
               self.cutEdge(count);
            });
      }
      // cutEdge Dialog, show form when click
      __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].cutAsk.name, function(ev) {
            // position then show form;
            __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["runDialog"]("#cutLineDialog", ev, function(form) {
               const data = form.querySelector('input[name="Segments"');
               if (data) {
                  const number = parseInt(data.value, 10);
                  if ((number != NaN) && (number > 0) && (number < 100)) { // sane input
                     self.cutEdge(number);
                  }
               }
            });
        });
      // cutAndConnect
      __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].cutAndConnect.name, function(ev) {
            self.cutAndConnect();
         });
      // Dissolve
      __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItemMode"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeDissolve.name, function(ev) {
            const dissolve = self.dissolve();
            if (dissolve.length > 0) {
               __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["undoQueue"](new DissolveEdgeCommand(self, dissolve));
            } else {
               // should not happened.
            }
         }, this, 'Backspace');
      // Collapse
      __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeCollapse.name, function(ev) {
            const command = new CollapseEdgeCommand(self);
            if (command.doIt()) {
               __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["undoQueue"](command);
            } else {
               // should not happened.
            }
         });
      // Crease
      __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeCrease.name, (ev) => {
         __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["attachHandlerMouseMove"](new CreaseEdgeHandler(this));
      });

      // EdgeLoop.
      for (let [numberOfSegments, hotkey] of [[__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeLoop1,"l"], [__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeLoop2,undefined], [__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeLoop3,undefined]]) {
         const name = numberOfSegments.name;
         const count = name.substring('edgeLoop'.length);        
         __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItem"](name, function(ev) {
            const command = new EdgeLoopCommand(self, count);
            if (command.doIt()) {
               __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["undoQueue"](command);
            } else { // should not happened, make some noise

            }
         }, hotkey);
      }
      // EdgeLoop Nth., show form when click
      __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeLoopN.name, function(ev) {
         __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["runDialog"]('#cutLineDialog', ev, function(form) {
            const data = form.querySelector('input=[name="Segments"');
            if (data) {
               const number = parseInt(data.value, 10);
               if ((number != NaN) && (number > 0) && (number < 100)) { // sane input
                  const command = new EdgeLoopCommand(self, number);
                  if (command.doIt()) {
                     __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["undoQueue"](command);
                  } else { // should not happened, make some noise
                  }
               }
            }
          });
       });
      // EdgeRing
      for (let [numberOfSegments, hotkey] of [[__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeRing1,"g"], [__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeRing2,undefined], [__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeRing3,undefined]]) {
         const name = numberOfSegments.name;
         const count = name.substring('edgeRing'.length);
         __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItem"](name, function(ev) {
            const command = new EdgeRingCommand(self, count);
            if (command.doIt()) {
               __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["undoQueue"](command);
            } else { // should not happened, make some noise
      
            }
         }, hotkey);
      }
      // EdgeRing Nth
      __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeRingN.name, function(ev) {
         __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["runDialog"]('#cutLineDialog', ev, function(form) {
            const data = form.querySelector('input[name="Segments"');
            if (data) {
               const number = parseInt(data.value, 10);
               if ((number != NaN) && (number > 0) && (number < 100)) { // sane input
                  const command = new EdgeRingCommand(self, number);
                  if (command.doIt()) {
                     __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["undoQueue"](command);
                  } else { // should not happened, make some noise
                  }
               }
            }
          });
       });
       // loopCut
       __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeLoopCut.name, (ev) => {
         const command = new LoopCutCommand(this);
         if (command.doIt()) {
            __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["undoQueue"](command);
         } else { // geometry status. no LoopCut available.

         }
        });
      __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeCorner.name, (ev) => {
         __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["attachHandlerMouseMove"](new EdgeCornerHandler(this));
       });
      __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeSlide.name, (ev) => {
         const handler = new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["MoveBidirectionHandler"](this, new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["GenericEditCommand"](this, this.slide));
         handler.doIt();
         __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["attachHandlerMouseMove"](handler);
        });
      // Hardness
      for (let [hardness, operand] of [[__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeSoft, 0], [__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeHard, 1], [__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].edgeInvert, 2]]) {
         __WEBPACK_IMPORTED_MODULE_6__wings3d_ui__["bindMenuItem"](hardness.name, (ev)=> {
            const cmd = new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["GenericEditCommand"](this, this.hardness, [operand], this.undoHardness);
            if (cmd.doIt()) {
               __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["undoQueue"](cmd);
            } else { // geometry status. no hardEdge to turn to softEdge.

            }
          });
      }
   }

   // get selected Edge's vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.snapshotEdgePosition);
   }

   snapshotPositionAndNormal() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.snapshotEdgePositionAndNormal);
   }

   snapshotTransformGroup() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.snapshotTransformEdgeGroup);
   }

   loopCut() {
      const snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.loopCut);
      for (let snapshot of snapshots) {
         for (let preview of snapshot.snapshot.separateCages) {
            __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["addToWorld"](preview);
            preview.selectBody();
         }
      }
      return snapshots;
   }

   undoLoopCut(snapshots) {
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.undoLoopCut);
      for (let snapshot of snapshots) {   // we have to remove later because of removeFromWorld will set invisible flag on polygon.
         for (let preview of snapshot.snapshot.separateCages) {
            //preview.selectBody();
            __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["removeFromWorld"](preview);
         }
      }
   }

   bevel() {
      const snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.bevelEdge);
      // change to facemode.
      __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["restoreFaceMode"](snapshots);
      return snapshots;
   }

   undoBevel(snapshots, selection) {
      this.restoreSelectionPosition(snapshots);
      this.collapseEdge(snapshots);
      __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["restoreEdgeMode"](selection);
   }

   crease() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.creaseEdge);
   }

   extrude() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.extrudeEdge);
   }

   undoExtrude(contourEdges) {
      this.doAll(contourEdges, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.undoExtrudeEdge);
   }

   cutEdge(numberOfSegments) {
      const cutEdge = new CutEdgeCommand(this, numberOfSegments);
      __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["undoQueue"](cutEdge);
      cutEdge.doIt();
   }

   cutAndConnect() {
      const cutEdge = new CutEdgeCommand(this, 2);
      cutEdge.doIt();
      const vertexMadsor = __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["currentMode"]();   // assurely it vertexMode
      vertexMadsor.andConnectVertex(cutEdge);
   }

   cut(numberOfSegments) {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.cutEdge, numberOfSegments);
   }

   edgeLoop(nth) {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.edgeLoop, nth);
   }

   edgeRing(nth) {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.edgeRing, nth);
   }
   collapseEdge(snapshots) {  // undo of splitEdge.
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.collapseSplitOrBevelEdge);
   }

   // dissolve edge
   dissolve() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.dissolveSelectedEdge);
   }
   reinsertDissolve(dissolveEdgesArray) {
      this.doAll(dissolveEdgesArray, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.reinsertDissolveEdge);
   }

   // collapse edge
   collapse() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.collapseSelectedEdge);
   }

   restoreEdge(collapseEdgesArray) {
      this.doAll(collapseEdgesArray, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreCollapseEdge);
   }

   corner() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.cornerEdge);
   }

   undoCorner(snapshots) {
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.undoCornerEdge);
   }

   hardness(state) {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.hardnessEdge, state);
   }

   undoHardness(snapshots, state) {
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.undoHardness, state);
   }

   slide() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.slideEdge);
   }

   flatten(axis) {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.flattenEdge, axis);
   }

   dragSelect(cage, hilite, selectArray, onOff) {
      if (hilite.edge !== null) {
        if (cage.dragSelectEdge(hilite.edge, onOff)) {
            selectArray.push(hilite.edge);
        }
      }
   }

   // select, hilite
   selectStart(cage, hilite) {
      if (hilite.edge !== null) {
         var onOff = cage.selectEdge(hilite.edge);
         return new DragEdgeSelect(this, cage, hilite.edge, onOff);
      }
      return null;
   }

   isEdgeSelectable() { return true; }

   _resetSelection(cage) {
      cage._resetSelectEdge();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreEdgeSelection(snapshot);
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots;
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["restoreFaceMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromEdgeToFaceSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["restoreVertexMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromEdgeToVertexSelect); 
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_2__wings3d_bodymads__["BodyMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["restoreBodyMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromEdgeToBodySelect);
      } else {
         redoFn = __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["restoreMultiMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromEdgeToMultiSelect);   
      }
      __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["undoQueue"](new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["ToggleModeCommand"](redoFn, __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["restoreEdgeMode"], snapshots));
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromEdgeToFaceSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromEdgeToVertexSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_2__wings3d_bodymads__["BodyMadsor"]) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromEdgeToBodySelect);
      } else {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromEdgeToMultiSelect);      
      }
   }

   drawExtra(gl, draftBench) {
      //if (this.currentEdge) {
         //gl.useShader(ShaderProg.solidColor);
         gl.useShader(__WEBPACK_IMPORTED_MODULE_8__wings3d_shaderprog__["selectedColorLine"]);
         gl.bindTransform();
         draftBench.drawEdge(gl, this);
         gl.disableShader();
      //}
   }

   previewShader(gl) {
      gl.useShader(__WEBPACK_IMPORTED_MODULE_8__wings3d_shaderprog__["edgeSolidWireframe"]);
   }
}

class DragEdgeSelect extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["DragSelect"] {
   constructor(madsor, cage, halfEdge, onOff) {
      super(madsor, cage, halfEdge, onOff);
   }

   finish() {
      return new EdgeSelectCommand(this.select);
   }
}


class EdgeSelectCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(select) {
      super();
      this.select = select;
   }

   doIt() {
      for (var [cage, halfEdges] of this.select) {
         for (var i = 0; i < halfEdges.length; ++i) {
            cage.selectEdge(halfEdges[i]);
         }
      }
   }

   undo() {
      this.doIt();   // selectEdge, flip/flop, so
   }
}


//class CutEdgeMoveCommand extends MouseMoveHandler {
//}


class CutEdgeCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor, numberOfSegments) {
      super();
      this.madsor = madsor;
      this.numberOfSegments = numberOfSegments;
      this.selectedEdges = madsor.snapshotSelection();
   }

   doIt() {
      const snapshots = this.madsor.cut(this.numberOfSegments);
      __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["restoreVertexMode"](snapshots);    // abusing the api?
      this.snapshots = snapshots;
   }

   undo() {
      // restoreToEdgeMode
      this.madsor.collapseEdge(this.snapshots);
      __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["restoreEdgeMode"](this.selectedEdges);
   }
}


class DissolveEdgeCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor, dissolveEdges) {
      super();
      this.madsor = madsor;
      this.dissolveEdges = dissolveEdges;
   }

   doIt() {
      this.madsor.dissolve(); // return data should be the same as previous one
   }

   undo() {
      this.madsor.reinsertDissolve(this.dissolveEdges);
   }
}


class CollapseEdgeCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      const collapse = this.madsor.collapse();
      if (collapse.length > 0) {
         this.collapse = collapse;
         __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["restoreVertexMode"](this.collapse);
         return true;
      } else {
         return false;
      }
   }

   undo() {
      __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["currentMode"]().resetSelection();
      __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["restoreEdgeMode"]();
      this.madsor.restoreEdge(this.collapse);
   }
}

// Crease
class CreaseEdgeHandler extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["MoveableCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.contourEdges = madsor.crease();
      this.moveHandler = new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["MoveAlongNormal"](madsor);
   }

   doIt() {
      this.contourEdges = this.madsor.crease(this.contourEdges);
      super.doIt();     // = this.madsor.moveSelection(this.movement, this.snapshots);
   }

   undo() {
      super.undo(); //this.madsor.restoreSelectionPosition(this.snapshots);
      this.madsor.undoExtrude(this.contourEdges);
   }
}
// end of Crease

class EdgeLoopCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor, nth) {
      super();
      this.madsor = madsor;
      this.nth = nth;
      this.selectedEdges = madsor.snapshotSelection();
   }

   doIt() {
      const loopSelection = this.madsor.edgeLoop(this.nth);
      return (loopSelection.length > 0);
   }

   undo() {
      this.madsor.resetSelection();
      this.madsor.restoreSelection(this.selectedEdges);
   }
}

class EdgeRingCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor, nth) {
      super();
      this.madsor = madsor;
      this.nth = nth;
      this.selectedEdges = madsor.snapshotSelection();
   }

   doIt() {
      const loopSelection = this.madsor.edgeRing(this.nth);
      return (loopSelection.length > 0);
   }

   undo() {
      this.madsor.resetSelection();
      this.madsor.restoreSelection(this.selectedEdges);
   } 
}

class LoopCutCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      this.loopCut = this.madsor.loopCut();
      if (this.loopCut.length > 0) {   // change to body Mode.
         __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["restoreBodyMode"]();
         return true;
      } else {
         return false;
      }
   }

   undo() {
      if (this.loopCut.length > 0) {
         __WEBPACK_IMPORTED_MODULE_7__wings3d_view__["restoreEdgeMode"]();
         this.madsor.undoLoopCut(this.loopCut);
      }
   }
}

class EdgeCornerHandler extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["MoveableCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      this.cornerEdges = madsor.corner();
      this.moveHandler = new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["MoveAlongNormal"](madsor, false, this.cornerEdges);
   }

   doIt() {
      this.cornerEdges = this.madsor.corner();
      super.doIt();
   }

   undo() {
      // super.undo();  // not need, because movement was deleted
      this.madsor.undoCorner(this.cornerEdges);
   }

}



/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "VertexMadsor", function() { return VertexMadsor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "VertexConnectCommand", function() { return VertexConnectCommand; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_bodymads__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_edgemads__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_model__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_view__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__wings3d_shaderprog__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__wings3d_ui__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__wings3d__ = __webpack_require__(0);
/**
//    This module handle most vertex edit command.
//
//    
**/

   // for switching











class VertexMadsor extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["Madsor"] {
   constructor() {
      super('Vertex');
      const self = this;
      __WEBPACK_IMPORTED_MODULE_8__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].vertexConnect.name, (ev) => {
            const vertexConnect = this.connectVertex();
            if (vertexConnect.doIt()) {
               __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](vertexConnect);   // saved for undo
            } else {
               // show no connection possible message.
            }
         });
      __WEBPACK_IMPORTED_MODULE_8__wings3d_ui__["bindMenuItemMode"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].vertexDissolve.name, function(ev) {
            const dissolve = new VertexDissolveCommand(self);
            dissolve.doIt();
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](dissolve);
         }, this, 'Delete');
      __WEBPACK_IMPORTED_MODULE_8__wings3d_ui__["bindMenuItemMode"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].vertexCollapse.name, function(ev) {
            const dissolve = new VertexCollapseCommand(self);
            dissolve.doIt();
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](dissolve);
         }, this, 'Backspace');
      __WEBPACK_IMPORTED_MODULE_8__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].vertexWeld.name, (ev)=> {
         let snapshot = [];
         for (let preview of this.selectedCage()) {
            if (preview.selectionSize() == 1) {
               snapshot.push( preview );
            }
          }
         if (snapshot.length == 1) {
            const weld = new VertexWeldCommand(this, snapshot[0]);
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["attachHandlerMouseSelect"](weld);
         } else {
            geometryStatus("You can only Weld one vertex");
         }
        });
   }

   // get selected vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.snapshotVertexPosition);
   }

   snapshotPositionAndNormal() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.snapshotVertexPositionAndNormal);
   }

   snapshotTransformGroup() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.snapshotTransformVertexGroup);
   }

   bevel() {
      let snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.bevelVertex);
      // change to facemode.
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreFaceMode"](snapshots);
      return snapshots;
   
   }

   undoBevel(snapshots, selection) {
      this.restoreSelectionPosition(snapshots);
      // collapse extrudeEdge
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.collapseSplitOrBevelEdge);
      // restore Vertex Selection
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"](selection); 
   }

   // extrude Vertex
   extrude() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.extrudeVertex);
   }
   undoExtrude(extrudeData) {
      this.doAll(extrudeData, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.undoExtrudeVertex);
   }

   andConnectVertex(prevCmd) {
      const vertexConnect = new VertexConnectCommand(this);
      if (vertexConnect.doIt()) {
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueueCombo"]([prevCmd, vertexConnect]);
      } else { // no connection possible
         prevCmd.undo();
         // post on geomoetryStatus;
      }
   }

   connectVertex() {
      return  new VertexConnectCommand(this);
   }

   connect() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.connectVertex);
   };

   dissolveConnect(snapshots) {
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.dissolveConnect);
   }

   dissolve() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.dissolveSelectedVertex);
   }

   undoDissolve(dissolveArray) {
      this.doAll(dissolveArray, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.undoDissolveVertex);
   }

   flatten(axis) {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.flattenVertex, axis);
   }

   dragSelect(cage, hilite, selectArray, onOff) {
      if (hilite.vertex !== null) {
        if (cage.dragSelectVertex(hilite.vertex, onOff)) {
            selectArray.push(hilite.vertex);
        }
      }
   }

   selectStart(cage, hilite) {
      if (hilite.vertex !== null) {
         var onOff = cage.selectVertex(hilite.vertex);
         return new DragVertexSelect(this, cage, hilite.vertex, onOff);
      }
      return null;
   }

   isVertexSelectable() { return true; }

   _resetSelection(cage) {
      cage._resetSelectVertex();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreVertexSelection(snapshot);
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots;
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreFaceMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromVertexToFaceSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_edgemads__["EdgeMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreEdgeMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromVertexToEdgeSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_2__wings3d_bodymads__["BodyMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreBodyMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromVertexToBodySelect);
      } else {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreMultiMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromVertexToMultiSelect);
      }
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"]( new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["ToggleModeCommand"](redoFn, __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"], snapshots) );
   }


   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromVertexToFaceSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_edgemads__["EdgeMadsor"]) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromVertexToEdgeSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_2__wings3d_bodymads__["BodyMadsor"]) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromVertexToBodySelect);
      } else {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromVertexToMultiSelect);
      }
   }

   drawExtra(gl, draftBench) {
      // draw hilite
      //if (this.currentEdge) {
         gl.useShader(__WEBPACK_IMPORTED_MODULE_7__wings3d_shaderprog__["selectedColorPoint"]);
         gl.bindTransform();
         draftBench.drawVertex(gl, this);
         gl.disableShader();
      //}
   }
} 

class DragVertexSelect extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["DragSelect"] {
   constructor(madsor, cage, vertex, onOff) {
      super(madsor, cage, vertex, onOff);
   }

   finish() {
      return new VertexSelectCommand(this.select);
   }
}

class VertexSelectCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(select) {
      super();
      this.select = select;
   }

   doIt() {
      for (var [cage, vertices] of this.select) {
         for (var i = 0; i < vertices.length; ++i) {
            cage.selectVertex(vertices[i]);
         }
      }
   }

   undo() {
      this.doIt();   // selectVertex, flip/flop, so
   }  
}


class VertexConnectCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      // reconnect
      this.cageArray = this.madsor.connect();
      if (this.cageArray.length > 0) { // goes to edgeMode.
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreEdgeMode"](this.cageArray);    // abusing the api?
         return true;
      }
      return false;
   }

   undo() {
      // restore to vertexMode.
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"]();
      // dissolve the connect edges.
      this.madsor.dissolveConnect(this.cageArray);
   }  
}

class VertexDissolveCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      // dissolve, guaranteed dissolveCount > 0
      this.dissolve = this.madsor.dissolve();
   }

   undo() {
      this.madsor.undoDissolve(this.dissolve);
   }
}

class VertexCollapseCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      // collapse, is just like dissolve, but switch to facemode
      this.dissolve = this.madsor.dissolve();
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreFaceMode"](this.dissolve);
   }

   undo() {
      this.madsor.resetSelection();
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"]();
      this.madsor.undoDissolve(this.dissolve);
   }
}


class VertexWeldCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditSelectHandler"] {
   constructor(madsor, preview) {
      super(true, false, false);
      this.madsor = madsor;
      this.preview = preview;
   }

   hilite(hilite, currentCage) {  // no needs for currentCage
      if ((currentCage === this.preview) && hilite.vertex) {
         return  this.preview.weldableVertex(hilite.vertex) !== false;
      }
      return false;
   }

   select(hilite) { // return true for accepting, false for continue doing things.
      const vertex = hilite.vertex;
      if (vertex) {
         this.collapseHEdge = this.preview.weldableVertex(vertex);
         if (this.collapseHEdge != false) {
            return this.doIt();
         }
      }
      return false;
   }

   doIt() {
      this.restore = this.preview.weldVertex(this.collapseHEdge);
      return true;
   }

   undo() {
      this.preview.undoWeldVertex(this.restore);
   }
}




/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BoundingSphere", function() { return BoundingSphere; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LooseOctree", function() { return LooseOctree; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Plane", function() { return Plane; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Ray", function() { return Ray; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_util__ = __webpack_require__(7);
/*   require glmatrix
//
// LooseOctree and BoundingSphere.
*/






const BoundingSphere = function(polygon, center, radius) {
   this.center = center;
   this.radius = radius;
   if (radius) {
      this.radius2 = radius*radius;
   }
   this.polygon = polygon;
   this.octree = null;
};

BoundingSphere.prototype.isLive = function() {
   return (this.polygon.isVisible && this.polygon.isLive());
};

BoundingSphere.prototype.isIntersect = function(ray) {
   return __WEBPACK_IMPORTED_MODULE_0__wings3d_util__["intersectRaySphere"](ray, this);
};

BoundingSphere.prototype.setSphere = function(sphere) {
   this.center = sphere.center;
   this.radius = sphere.radius;
   this.radius2 = sphere.radius*sphere.radius;
   if (this.octree) {
      this.octree._move(this);
   }
};

BoundingSphere.prototype.getBVHRoot = function() {
   return this.octree.bvh.bvh.root;
};

BoundingSphere.computeSphere = function(polygon, center) {  // vec3
   // get all the polygon's vertex. compute barycentric.
   center.fill(0.0);
   var ret = {center: center, radius: 0.0};
   polygon.eachVertex( function(vertex) {
      vec3.add(ret.center, ret.center, vertex.vertex);
   });
   vec3.scale(ret.center, ret.center, 1.0/polygon.numberOfVertex);
   // get the furthest distance. that the radius.
   polygon.eachVertex( function(vertex) {
      var distance = vec3.distance(ret.center, vertex.vertex);
      if (distance > ret.radius) {
         ret.radius = distance;
      }
   });
   return ret;
};


// simple minded bounding sphere builder.
BoundingSphere.create = function(polygon, center) {
   var sphere = BoundingSphere.computeSphere(polygon, center);
   return new BoundingSphere(polygon, sphere.center, sphere.radius);
}
BoundingSphere.allocate = function(polygon) {
   return new BoundingSphere(polygon);
}


// loose octree for ease of implementation, and adequate performance. AABB tree, OBB tree can wait if needed.
// http://www.tulrich.com/geekstuff/partitioning.html by Thatcher Ulrich
class LooseOctree {  // this is really node
   constructor(bvh, bound, level) {
      this.bvh = bvh;
      this.level = level;
      this.node = [];
      if (bound) {
         this.bound = {center: vec3.clone(bound.center), halfSize: vec3.clone(bound.halfSize)};
      }
      //
   }

   *[Symbol.iterator]() {
      yield this;
      if (this.leaf) {
         for (let i = 0; i < 8; ++i) {
            const node = this.leaf[i];
            if (node) {
               yield* node;
            }
         }
      }
   }

   getHalfSize() {
      return this.bound.halfSize;
   }

   getBound(bound) {
      vec3.copy(bound.center, this.bound.center);
      vec3.copy(bound.halfSize, this.bound.halfSize);
   }

   getLooseBound(bound) {
      vec3.copy(bound.center, this.bound.center);
      vec3.scale(bound.halfSize, this.bound.halfSize, LooseOctree.kLOOSENESS);
   }

   getExtent(extent, looseNess = 1.0) {
      for (let axis=0; axis < 3; ++axis) {
         const length = this.bound.halfSize[axis]*looseNess;   
         extent.min[axis] = this.bound.center[axis]-length;
         extent.max[axis] = this.bound.center[axis]+length;
      } 
   }

   getLooseExtent(extent) {
      this.getExtent(extent, LooseOctree.kLOOSENESS); // looseOctree's extent is 2x bigger.
   }

   static getOctant(sphere, bound) {
      let index = 0;
      const octant = [1, 2, 4];        // octant mapping
      for (let axis = 0; axis < 3; ++axis) {
         bound.halfSize[axis] /= 2;
         if (sphere.radius > bound.halfSize[axis]) {  // does not fit in the children's bound
            return -1;
         } else if (sphere.center[axis] < bound.center[axis]) {
            index += octant[axis];     // |= octant[axis] faster?
            bound.center[axis] -= bound.halfSize[axis];
         } else {
            bound.center[axis] += bound.halfSize[axis];
         }
      }
      return index;
   }

   check(duplicateSet) {
      if (this.node) {
         for (let sphere of this.node) {
            if (duplicateSet.has(sphere)) {
               console.log("octree problems");
            } else {
               duplicateSet.add(sphere);
            }
         }
      } else {
         for (let i = 0; i < 8; ++i) {
            const octreeNode = this.leaf[i];
            if (octreeNode) {
               octreeNode.check(duplicateSet);
            }
         }
         for (let i = 8; i < this.leaf.length; ++i) {
            const sphere = this.leaf[i];
            if (duplicateSet.has(sphere)) {
               console.log("octree problems");
            } else {
               duplicateSet.add(sphere);
            }
         }
      }
   }

   free() {
      if (this.node) {
         for (let sphere of this.node) {
            sphere.octree = null;
         }
      } else {
         for (let i = 0; i < 8; ++i) {
            const octreeNode = this.leaf[i];
            if (octreeNode) {
               octreeNode.free();
            }
         }
         for (let i = 8; i < this.leaf.length; ++i) {
            const sphere = this.leaf[i];
            sphere.octree = null;
         }
      }
   }

   // only expand when this.node.length > kTHRESHOLD. and this.leaf will double as this.node.
   insert(sphere, bound) {
      if (this.node) { // keep pushing.
         this.node.push(sphere);
         sphere.octree = this;
         if (this.node.length >= LooseOctree.kTHRESHOLD) {  // now expand to children node if possible
            this.leaf = [null, null, null, null, null, null, null, null];  // now setup leaf octant
            let newBound = {center: vec3.create(), halfSize: vec3.create()};
            let ret;
            const node = this.node;
            delete this.node;
            for (let sphere of node) {  // redistribute to children or self.
               vec3.copy(newBound.center, bound.center);
               vec3.copy(newBound.halfSize, bound.halfSize);
               ret = this.insert(sphere, newBound);
            }
            return ret;
         }
      } else {// not leaf node.
         let index = LooseOctree.getOctant(sphere, bound);
         if (index >= 0) {  // descent to children
            let child = this.leaf[index];
            if (child === null) {
               child = new LooseOctree(this.bvh, bound, this.level+1);
               this.leaf[index] = child;
            }
            return child.insert(sphere, bound);  
         }
         // larger than child size, so insert here.
         this.leaf.push(sphere);
         sphere.octree = this;
      }
      return this;
   }

   _move(sphere) {   // sphere size or center changed, check for moving to different node.
      if (!this.isInside(sphere)) {
         this._remove(sphere);
         this.bvh.moveSphere(sphere);
      }
   }

   _remove(sphere) {
      if (sphere.octree === this) {
         if (this.node) {
            this.node.splice(this.node.indexOf(sphere), 1);
         } else {
            this.leaf.splice(this.leaf.indexOf(sphere), 1);
         }
         sphere.octree = null;
      } else {
         console.log("LooseOctree _remove error");
      }
   }

   isInside(sphere) {
      for (let axis = 0; axis < 3; ++axis) {
         let length = this.bound.halfSize[axis];
         if ( (length < sphere.radius) || 
              (this.bound.center[axis]+length) < sphere.center[axis] ||
              (this.bound.center[axis]-length) > sphere.center[axis]) {
            return false;
         }
      }
      return true;
   }


   * intersectExtent(shape) {   // act as generator
      const extent = {min: vec3.create(), max: vec3.create()};
      this.getLooseExtent(extent);
      if (shape.intersectAAExtent(extent)) {
         yield* this._extentIntersect(shape, extent);
      }
   }
   //
   // Revelles' algorithm, "An efficient parametric algorithm for octree traversal". <= todo
   * _extentIntersect(shape, extent) {
      if (this.node) {
         for (let sphere of this.node) {
            if (shape.intersectSphere(sphere)) {
               yield sphere;
            }
         }
      } else {
         for (let i = 8; i < this.leaf.length; ++i) {
            const sphere = this.leaf[i];
            if (shape.intersectSphere(sphere)) {
               yield sphere;
            }
         }
         // check children, this is the hard part of Revelle's algorithm.
         for (let i = 0; i < 8; ++i) {
            const child = this.leaf[i];
            if (child) {
               child.getLooseExtent(extent);
               if (shape.intersectAAExtent(extent)) {
                  yield* child._extentIntersect(shape, extent);
               }
            }
         }
      }
   }

   // bound = {center, halfSize};
   * intersectBound(shape) {
      const bound = {center: vec3.create(), halfSize: vec3.create()};
      this.getLooseBound(bound);
      if (shape.intersectAABB(bound)) {
         yield* this._boundIntersect(shape, bound);
      }
   }
   * _boundIntersect(shape, bound) {
      if (this.node) {
         for (let sphere of this.node) {
            if (shape.intersectSphere(sphere)) {
               yield sphere;
            }
         }
      } else {
         for (let i = 8; i < this.leaf.length; ++i) {
            const sphere = this.leaf[i];
            if (shape.intersectSphere(sphere)) {
               yield sphere;
            }
         }
         // check children, this is the hard part of Revelle's algorithm.
         for (let i = 0; i < 8; ++i) {
            const child = this.leaf[i];
            if (child) {
               child.getLooseBound(bound);
               if (shape.intersectAABB(bound)) {
                  yield* child._boundIntersect(shape, bound);
               }
            }
         }
      }
   }
}
LooseOctree.kTHRESHOLD = 88;    // read somewhere, 8-15 is a good number for octree node. expand to child only when node.length >= kTHRESHOLD
LooseOctree.kLOOSENESS = 1.5;    // cannot change. because isInside depend on this property.



class Plane {
   constructor(normal, pt) {
      this.normal = vec3.clone(normal);
      vec3.normalize(this.normal, this.normal);    // make sure.
      this.pt = vec3.clone(pt);
      this.distance = vec3.dot(this.normal, this.pt); // dot(n, pt) = k form.
   }

   closestPoint(out, point) { // projection to plane
      __WEBPACK_IMPORTED_MODULE_0__wings3d_util__["closestPointToPlane"](out, point, this);
   }

   intersectAABB(box) {
      return __WEBPACK_IMPORTED_MODULE_0__wings3d_util__["intersectPlaneAABB"](this, box);
   }

   intersectSphere(sphere) {
      return __WEBPACK_IMPORTED_MODULE_0__wings3d_util__["intersectPlaneSphere"](this, sphere);
   }
}


class Ray {
   constructor(origin, dir) {
      this.origin = origin;
      this.direction = dir;
      this.invDir = vec3.fromValues(1/dir[0], 1/dir[1], 1/dir[2]);   //1/0 still work for our purpose.
   }

   intersectSphere(sphere) {
      return __WEBPACK_IMPORTED_MODULE_0__wings3d_util__["intersectRaySphere"](this, sphere);
   }

   intersectAAExtent(extent) {
      return __WEBPACK_IMPORTED_MODULE_0__wings3d_util__["intersectRayAAExtent"](this, extent);
   }
}




/***/ }),
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BodyMadsor", function() { return BodyMadsor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DeleteBodyCommand", function() { return DeleteBodyCommand; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_edgemads__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_model__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_view__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__wings3d_util__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__wings3d__ = __webpack_require__(0);
//
// bodymadsor. 
//


   // for switching










class BodyMadsor extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["Madsor"] {
   constructor() {
      super('Body');
      const self = this;
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItemMode"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodyDelete.name, function(ev) {
            const command = new DeleteBodyCommand(self.getSelected());
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"]( command );
            command.doIt(); // delete current selected.
         }, this, 'Backspace');

      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodyRename.name, function(ev) {
         __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["runDialog"]('#renameDialog', ev, function(form) {
               const data = __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["extractDialogValue"](form);
               const command = new RenameBodyCommand(self.getSelected(), data);
               __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"]( command );
               command.doIt();   // rename
            }, function(form) {
               const content = form.querySelector('div');
               let labels = form.querySelectorAll('label');
               for (let label of labels) {
                  content.removeChild(label);
               }
               // add input name 
               let array = self.getSelected();
               for (let cage of array) {
                  const label = document.createElement('label');
                  label.textContent = cage.name;
                  const input = document.createElement('input');
                  input.type = "text";
                  input.name = cage.name;
                  input.placeholder = cage.name;
                  label.appendChild(input);
                  content.appendChild(label);
               }
            });
       });
      const duplicateMove = [__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodyDuplicateMoveX, __WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodyDuplicateMoveY, __WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodyDuplicateMoveZ];
      // movement for (x, y, z)
      for (let axis=0; axis < 3; ++axis) {
         __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](duplicateMove[axis].name, function(ev) { //action.bodyDulipcateMoveX(Y,Z)
               __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["attachHandlerMouseMove"](new DuplicateMouseMoveAlongAxis(self, axis, self.getSelected()));
            });
      }
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodyDuplicateMoveFree.name, function(ev) {
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["attachHandlerMouseMove"](new DuplicateMoveFreePositionHandler(self, self.getSelected()));
         });
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodyInvert.name, (ev)=> {
         const command = new InvertBodyCommand(this);
         command.doIt();
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](command);
        });
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodyCombine.name, (ev)=> {
         const command = new CombineBodyCommand(this);
         if (command.doIt()) {   // do we really have 2 + objects?
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](command);
         }
       });
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodySeparate.name, (ev)=> {
         const command = new SeparateBodyCommand(this);
         if (command.doIt()) {   // check if separable.
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](command);
         }
       });
      const flip = [__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodyFlipX, __WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodyFlipY, __WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodyFlipZ];
      // flip for (x, y, z)
      for (let axis=0; axis < 3; ++axis) {
         __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](flip[axis].name, (ev) => { //action.bodyFlipX(Y,Z)
            //View.undoQueue(new FlipBodyAxis(this, axis));
            const command = new FlipBodyAxis(this, axis);
            command.doIt();
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](command);
          });
      }
      const axisVec = [[1,0,0], [0,1,0], [0,0,1]];
      const slice = [__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodySliceX, __WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodySliceY, __WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodySliceZ];
      for (let axis = 0; axis < 3; ++axis) {
         __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](slice[axis].name, (ev) => {
            __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["runDialog"]('#sliceBodyDialog', ev, (form)=> {
               const data = form.querySelector('input[name="amountRange"');
               if (data) {
                  const number = parseInt(data.value, 10);
                  if ((number != NaN) && (number > 0) && (number < 100)) { // sane input
                     const command = new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["GenericEditCommand"](this, this.slice, [axisVec[axis], number], this.undoPlaneCut);
                     if (command.doIt()) {
                        const vertexMadsor = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["currentMode"]();   // assurely it vertexMode
                        vertexMadsor.andConnectVertex(command);
                     } else { // should not happened, make some noise

                     }
                  }
               }
             });
          });
      }
      // weld
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_9__wings3d__["action"].bodyWeld.name, (ev)=> {
         const cmd = new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["GenericEditCommand"](this, this.weld, undefined, this.undoWeld);
         if (cmd.doIt()) {
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](cmd);
         }
       });
   }

   getSelected() {
      const selection = [];
      for (let cage of this.selectedCage()) {
         selection.push(cage);
      }
      return selection;
   }

   snapshotPosition() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.snapshotBodyPosition);
   }

   snapshotTransformGroup() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.snapshotTransformBodyGroup);
   }

   combine(cageSelection) {
      if (cageSelection === undefined) {
         cageSelection = [];
         for (let cage of this.selectedCage()) {
            cageSelection.push( cage );
         }
      }
      // needs least 2 selected cage2.
      if (cageSelection.length >= 2) {
         // now do merge operation.
         const combine = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["makeCombineIntoWorld"](cageSelection);
         combine.name = cageSelection[0].name;
         combine.selectBody();
         return {combine: combine, oldSelection: cageSelection};
      }
      return null;
   }
   undoCombine(combine) {
      if (combine) {
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["removeFromWorld"](combine.combine);
         for (let cage of combine.oldSelection) {
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["addToWorld"](cage);  // restore oldCage
         }
      }
   }

   separate() {
      const selection = [];
      for (let cage of this.selectedCage()) {
         let snapshot = cage.separate();
         if (snapshot.length > 0) {
            selection.push( {preview: cage, snapshot: snapshot} );
         }
      }
      for (let separate of selection) {
         // remove original
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["removeFromWorld"](separate.preview);
         // add the separates one.
         for (let preview of separate.snapshot) {
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["addToWorld"](preview);     // has to addToWorld after separate all selection, or we will mess up the iteration.
         }
      }
      return selection;
   }
   undoSeparate(separateSelection) {
      for (let separate of separateSelection) {
         for (let preview of separate.snapshot) {
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["removeFromWorld"](preview);
         }
         // addback the original one
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["addToWorld"](separate.preview);
      }
   }

   invert() {
      for (let cage of this.selectedCage()) {
         cage.invertBody();
      }
      // invert the draftBench's preview and update
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["updateWorld"]();
      this.hiliteView = null; // invalidate hilite
   }

   flipAxis(snapShotPivot, axis) {
      this.doAll(snapShotPivot, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.flipBodyAxis, axis);
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["updateWorld"]();
   }

   planeCuttable(plane) {
      return this.resultAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.planeCuttableFace, plane);
   }
   planeCut(plane) {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.planeCutBody, plane);
   }
   undoPlaneCut(snapshots) { // undo of splitEdge.
      this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.collapseSplitOrBevelEdge);
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreBodyMode"](snapshots);
   }

   slice(planeNormal, numberOfPart) {
      const snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.sliceBody, planeNormal, numberOfPart);
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"](snapshots);
      return snapshots;
   }

   weld(tolerance = 0.001) {
      const extent = {min: vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), 
                      max: vec3.fromValues(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE)};
      const selection = [];
      // adds up all selected object's face
      for (let cage of this.selectedCage()) {
         cage.getBodySelection(selection, extent);
      }
      // sort by longest length.
      let order = __WEBPACK_IMPORTED_MODULE_8__wings3d_util__["getAxisOrder"](extent);
      selection.sort( (a, b) => {
         for (let i = 0; i < 3; ++i) {
            let result = a.center[order[i]] - b.center[order[i]];
            if (result !== 0.0) {
               return result;
            }
         }
         return (a.polygon.index - b.polygon.index);
       });

      // find weldable pair
      const merged = __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].findOverlapFace(order, selection, tolerance); 
      // now find the contours of potential mergers.
      const weldContours = __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].findWeldContours(merged);
      if (weldContours !== false) {
         // make holes of weldable polygons.
         const holes = __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].weldHole(merged);
         // combine cages
         const combinedCages = [];
         const combined = new Map;
         for (let cages of weldContours.combineCages) {
            const result = this.combine(cages);
            combined.set(cages, result);
            combinedCages.push( result );
         }
         // now weld the contours
         const mergeCage = __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].weldBody(combined, weldContours);
         // goto vertexMode
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"](combinedCages);

         // return undo info
         return [{holes: holes, weldContours: mergeCage, combinedCages: combinedCages}];
      }
      // unable to weld
      return [];
   }
   undoWeld(snapshots) {
      const weld = snapshots[0]; // have to enclose in a array.
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreBodyMode"]();
      // splice with inner
      __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].undoWeldBody(weld.weldContours);
      // undo combine
      for (let combine of weld.combinedCages) {
         this.undoCombine(combine);
      }
      // restore holes
      __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].undoWeldHole(weld.holes);
   }

   centroid() {
      return this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.bodyCentroid);
   }

   dragSelect(cage, hilite, selectArray, onOff) {
      if (hilite.edge !== null) {
       // if (cage.dragSelectFace(this.currentEdge, onOff)) {
       //     selectArray.push(this.currentEdge);
       // }
      }
   }

   // select, hilite
   selectStart(preview, hilite) {
      // check not null, shouldn't happened
      if (hilite.cage !== null) {
         var onOff = preview.selectBody();
         return new DragBodySelect(this, preview, hilite.edge, onOff);
      }    
   }

   selectBody(snapshots) { // use for unselect by similarSelection.
      for (let cage of snapshots) {
         cage.selectBody();
      }
   }

   similarSelection() {
      // first compute selected body's metric
      const snapshot = new Set;
      for (let cage of this.selectedCage()) {
         const size = cage._getGeometrySize();
         const metric = size.vertex*3 + size.edge*2 + size.face;
         snapshot.add(metric);
      }
      const restore = [];
      // now check if some of the unselected bodys match selected body.
      for (let cage of this.notSelectedCage()) {
         const size = cage._getGeometrySize();
         const metric = size.vertex*3 + size.edge*2 + size.face;
         if (snapshot.has(metric)) {
            cage.selectBody();
            restore.push(cage);
         }
      }
      if (restore.length > 0) {
         return {undo: this.selectBody, snapshots: restore};   // restore all 
      }
      return false;
   }

   adjacentSelection() {
      return false;   // does nothing.
   }

   moreSelection() {
      return false;      // does nothing.
   }

   _resetSelection(cage) {
      cage._resetSelectBody();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreBodySelection(snapshot);
   }

   toggleFunc(toMadsor) {
//      this.hiliteView = null;
//      this.hideOldHilite();
//      this.hiliteView = null;
      var redoFn;
      var snapshots;
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreFaceMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromBodyToFaceSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromBodyToVertexSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_2__wings3d_edgemads__["EdgeMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreEdgeMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromBodyToEdgeSelect);
      } else {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreMultiMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.changeFromBodyToMultiSelect);
      }
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["ToggleModeCommand"](redoFn, __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreBodyMode"], snapshots));
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromBodyToFaceSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromBodyToVertexSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_2__wings3d_edgemads__["EdgeMadsor"]) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromBodyToEdgeSelect);
      } else {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].prototype.restoreFromBodyToMultiSelect);
      }
   }
}


class DragBodySelect extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["DragSelect"] {
   constructor(madsor, cage, halfEdge, onOff) {
      super(madsor, cage, halfEdge, onOff);
   }

   finish() {
      return new BodySelectCommand(this.select);
   }
}

class BodySelectCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(select) {
      super();
      this.select = select;
   }

   doIt() {
      for (var [cage, halfEdges] of this.select) {
         if (halfEdges.length > 0) {
            cage.selectBody();
         }
      }
   }

   undo() {
      this.doIt();   // selectEdge, flip/flop, so
   }

}

class DeleteBodyCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(previewCages) {
      super();
      this.previewCages = previewCages;
   }

   doIt() {
      for (let previewCage of this.previewCages) {
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["removeFromWorld"](previewCage);
      }
   }

   undo() {
      for (let previewCage of this.previewCages) {
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["addToWorld"](previewCage);
      }
   }
}

class RenameBodyCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(previewCages, data) {
      super();
      this.previewCages = previewCages;
      this.newName = data;
      this.oldName = new Map;
   }

   doIt() {
      for (let cage of this.previewCages) {
         if (this.newName.hasOwnProperty(cage.name)) {
            if (!this.oldName.has(cage.name)) {
               this.oldName.set(cage.name, cage);
            }
            cage.name = this.newName[cage.name];
            geometryStatus("Object new name is " + cage.name);
         }
      }
   }

   undo() {
      for (let [name, cage] of this.oldName) {
         cage.name = name;
         geometryStatus("Object restore name to " + cage.name);
      }  
   }
}


class DuplicateBodyCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(originalCages) {
      super();
      this.originalCages = originalCages;
      this.duplicateCages = [];
      for (let cage of originalCages) {
         let duplicate = __WEBPACK_IMPORTED_MODULE_5__wings3d_model__["PreviewCage"].duplicate(cage);
         this.duplicateCages.push( duplicate );
      }
   }

   _toggleOriginalSelected() {
      for (let cage of this.originalCages) {
         cage.selectBody();
      }
   }

   doIt() {
      for (let cage of this.duplicateCages) {
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["addToWorld"](cage);
         cage.selectBody();
      }
      this._toggleOriginalSelected();
   }

   undo() {
      for (let cage of this.duplicateCages) {
         cage.selectBody();                  // deselection before out
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["removeFromWorld"](cage);
      }
      this._toggleOriginalSelected();        // reselected the original
   }
}

class DuplicateMouseMoveAlongAxis extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["MouseMoveAlongAxis"] {
   constructor(madsor, axis, originalCages) {
      const duplicateBodyCommand = new DuplicateBodyCommand(originalCages);
      duplicateBodyCommand.doIt();
      super(madsor, axis);
      this.duplicateBodyCommand = duplicateBodyCommand;
   }

   doIt() {
      this.duplicateBodyCommand.doIt();
      super.doIt();     // movement.
   }

   undo() {
      super.undo();
      this.duplicateBodyCommand.undo();
   }
}

class DuplicateMoveFreePositionHandler extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["MoveFreePositionHandler"] {
   constructor(madsor, originalCages) {
      const duplicateBodyCommand = new DuplicateBodyCommand(originalCages);
      duplicateBodyCommand.doIt();
      super(madsor);
      this.duplicateBodyCommand = duplicateBodyCommand;
   }

   doIt() {
      this.duplicateBodyCommand.doIt();
      super.doIt();     // movement.
      return true;
   }

   undo() {
      super.undo();
      this.duplicateBodyCommand.undo();
   }
}

class InvertBodyCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      this.madsor.invert();
      return true;
   }

   undo() {
      this.madsor.invert();
   }   
}

class CombineBodyCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      this.combine = this.madsor.combine();
      if (this.combine) {
         return true;
      } else {
         return false;
      }
   }

   undo() {
      this.madsor.undoCombine(this.combine);
      this.combine = null; // release memory
   } 
};


class SeparateBodyCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      this.separate = this.madsor.separate();
      return (this.separate.length > 0);
   }

   undo() {
      this.madsor.undoSeparate(this.separate);
      this.separate = null; // release memory
   } 
};


class FlipBodyAxis extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor, axis) {
      super();
      this.madsor = madsor;
      this.axis = axis;
      this.pivot = madsor.centroid();
   }

   doIt() {
      this.madsor.flipAxis(this.pivot, this.axis);
      return true;
   }

   undo() {
      this.madsor.flipAxis(this.pivot, this.axis);
   }
}




/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "pref", function() { return pref; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "view", function() { return view; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getMouseMoveHandler", function() { return getMouseMoveHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "aimZoom", function() { return aimZoom; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "rotate", function() { return rotate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "wheelRotate", function() { return wheelRotate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "wheelZoom", function() { return wheelZoom; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "zoomStepAlt", function() { return zoomStepAlt; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "zoomStep", function() { return zoomStep; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "zoom", function() { return zoom; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "pan", function() { return pan; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "keyPan", function() { return keyPan; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "keyPanLeftArrow", function() { return keyPanLeftArrow; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "keyPanRightArrow", function() { return keyPanRightArrow; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "keyPanUpArrow", function() { return keyPanUpArrow; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "keyPanDownArrow", function() { return keyPanDownArrow; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "wheelPan", function() { return wheelPan; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_undo_js__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_js__ = __webpack_require__(0);
/*
**
**
**     This module handles camera moves (rotation, zooming, and panning).
**
**  Original Erlang Version:  Bjorn Gustavsson
*/





class CameraMouseMoveHandler extends __WEBPACK_IMPORTED_MODULE_0__wings3d_undo_js__["MouseMoveHandler"] {
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

   doIt() {
      // no redo, undo for now
      //debugLog("exitCameraMode", {ok: this.camera});
   }

   undo() {
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
            distance: __WEBPACK_IMPORTED_MODULE_1__wings3d_js__["CAMERA_DIST"],
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
                  __WEBPACK_IMPORTED_MODULE_1__wings3d_js__["log"](__WEBPACK_IMPORTED_MODULE_1__wings3d_js__["action"].cameraZoom, dist - camera.distance);
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



__WEBPACK_IMPORTED_MODULE_1__wings3d_js__["onReady"](init);

/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "runHotkeyAction", function() { return runHotkeyAction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setHotkey", function() { return setHotkey; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d__ = __webpack_require__(0);
//
// hotkey handling and remapping.
//
//
//



const keyMap = new Map;

function runHotkeyAction(mode, event) {
   // extract alt, ctrl, shift key
   const meta = Object(__WEBPACK_IMPORTED_MODULE_0__wings3d__["createMask"])(event.altKey, event.ctrlKey, event.shiftKey);
   // extract key
   const hotkey = event.key.toLowerCase();
   // run the binding function
   let metaSet = keyMap.get(hotkey);
   if (metaSet) {
      // check mode specific first
      for (let value of metaSet) {
         if ( (meta === value.meta) && (value.mode === mode)) { // has all the meta
            Object(__WEBPACK_IMPORTED_MODULE_0__wings3d__["runAction"])(0, value.id, event);
            return;
         }
      }
      // check for non-mode, if no mode specific found
      for (let value of metaSet) {
         if ( (meta === value.meta) && (value.mode === null)) { // has all the meta
            Object(__WEBPACK_IMPORTED_MODULE_0__wings3d__["runAction"])(0, value.id, event);
            return;
         }
      }
   }
};


function setHotkey(mode, id, hotkey, meta='') {
      hotkey = hotkey.toLowerCase();
      meta = meta.toLowerCase();
      const metaMask = Object(__WEBPACK_IMPORTED_MODULE_0__wings3d__["createMask"])(meta.indexOf('alt') > -1, meta.indexOf('ctrl') > -1, meta.indexOf('shift') > -1);
      if (!keyMap.has(hotkey)) {
         keyMap.set(hotkey, []);
      }
      keyMap.get(hotkey).unshift({mode: mode, meta: metaMask, id: id});
};




/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i18n", function() { return i18n; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setCurrentLocale", function() { return setCurrentLocale; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getCurrentLocale", function() { return getCurrentLocale; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d__ = __webpack_require__(0);
/*
 routines for translation. l10n.

 stub for i18n, other stuff, like number, date format.
*/




const i18nAttrib = "data-i18n";
const newLine = "\n";
let LMB = "LMB: ";
let MMB = "MMB: ";
let RMB = "RMB: ";
let currentCountry = "US";
let currentLanguage = "en";
let defaultMessages;
let currentMessages;

function getTemplate(key) {
   let template = currentMessages.get(key);
   if (!template && defaultMessages) {
      return defaultMessages.get(key);
   }
   return template;
}

function helpTooltip(ev) {
   const text = this.getAttribute("title");
   const helpText = text.replace(newLine, "    ");
   help(helpText);
}
function* entries(obj) {
   for (let key in obj) {
      yield [key, obj[key]];
   }
}
function resetStaticElements(langObj) {  
   // first copy to currentMessages.
   currentMessages = new Map(entries(langObj));
   if (!defaultMessages) {
      defaultMessages = currentMessages;
   }
   
   // set the resources staticElement
   //console.log(langJson);
   let allDom = document.querySelectorAll(`[${i18nAttrib}]`);
   for (let elem of allDom) {
      let warning = true;
      let key = elem.getAttribute(i18nAttrib);
      let content = getTemplate(key);
      if (content) {
         elem.textContent = content;
         warning = false;
      } 
      // now prepare tooltips
      let tooltip = key + "_tooltip";
      content = getTemplate(tooltip);
      if (content) {
         warning = false;
         let text = "";
         if (Array.isArray(content)) {
            if (content[0]) {
               text += LMB + content[0];
            }
            if (content[1]) {
               text += newLine + MMB + content[1];
            }
            if (content[2]) {
               text += newLine + RMB + content[2];
            }
         } else { // must be string
            text = content;
         }
         elem.setAttribute("title", text);   // use title tooltip directly
         // should we register/unregister mouseover event?
         elem.removeEventListener("mouseover", helpTooltip);
         elem.addEventListener("mouseover", helpTooltip);
      }
      if (warning) {
         console.log(`Warning: ${key} has no translation`);
      }
   }
}

function loadResource(language, successCallback){
   Object(__WEBPACK_IMPORTED_MODULE_0__wings3d__["ezFetch"])(`./resources/${language}.json`)
      .then(data => {
         resetStaticElements(data);
         if (successCallback) {
            successCallback();
         }
      })
      .catch(err => {
         console.log('Fetch Error :-S', err);
      });
} 

function getCurrentLocale() {
   return {country: currentCountry, language: currentLanguage};
}

/**
  * Sets the current language/locale and does any application initialization after loading language.
  *
  * @method load
  * @param {language} The two-letter ISO language code.
  * @param {country} The two-letter ISO conuntry code.
  * @param {successCallback} The function to be called when the language/locale has been loaded. 
  */
function setCurrentLocale(language, country, successCallback) {
   currentCountry = country || 'unknown';
   currentLanguage = language || 'unknown';

   loadResource(currentLanguage, successCallback);
};

/*
 * wonderfully simple template engine.
 * https://stackoverflow.com/questions/30003353/can-es6-template-literals-be-substituted-at-runtime-or-reused
*/
const fillTemplate = function(template, templateVars){
   return new Function(`return \`${template}\`;`).call(templateVars);
}
   /**
     * Replaces each format item in a specified localized string 
     * e.g. key = 'helloFirstNameLastName'
            localised value of key = "Hello ${this.firstname} ${this.lastname}!"
     *      _('helloFirstNameLastName', {firstname: 'John', lastname:'Smith'});
     *      returns "Hello John Smith!"
     *
     * @method _
     * @param {key} The unique identifier for the resource name (using object notation).
     * @return {String} Returns the localized value based on the provided key and optional arguments.
     */
function i18n(key, templateVars) {
   let template = getTemplate(key);
   if (template) {
      if (templateVars) {
         return fillTemplate(template, templateVars);
      }
      return template;
   }
   return `Error: ${key} don't exist`;
};


 


// init
Object(__WEBPACK_IMPORTED_MODULE_0__wings3d__["onReady"])(()=> {
   // init
   setCurrentLocale("en");
   // hookup to language select
   let selectLang = document.querySelector('#selectLanguage');
   if (selectLang) {
      selectLang.addEventListener('change', function(ev) {
         setCurrentLocale(selectLang.value); // change locale
       });
   }
});

/***/ }),
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "tours", function() { return tours; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "targetCage", function() { return targetCage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "step", function() { return step; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "expectStep", function() { return expectStep; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "faceSelectStep", function() { return faceSelectStep; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addStep", function() { return addStep; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addExpectStep", function() { return addExpectStep; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addFaceSelectStep", function() { return addFaceSelectStep; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "add", function() { return add; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addMultiStep", function() { return addMultiStep; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addZoomStep", function() { return addZoomStep; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "zoomStep", function() { return zoomStep; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "cancel", function() { return cancel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "complete", function() { return complete; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "startTour", function() { return startTour; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d__ = __webpack_require__(0);
//
// interact. tutoring.
//





class TutorStep {
   constructor(title, text, targetID, placement) {
     this.targetID = targetID;
     this.placement = placement;
     this.title = title;
     this.content = text;
     this.options = {};
     this.options.showNext = true;
   }

   // do functions along recursively up the parent
   static walkupDoms(target, ancestorTarget, fn) {
      if (target) {
         const parent = target.parentNode;
         for (let element = parent.firstElementChild; element; element = element.nextElementSibling) {
            if (element !==target) {
               fn(element);
            }           
         }
         if (parent !== ancestorTarget) {
            this.walkupDoms(parent, ancestorTarget, fn);
         }

      } else { // select all parent's childern, except canvas
         for (let element = ancestorTarget.firstElementChild; element; element = element.nextElementSibling) {
            if (element.id !== "canvas") {
               fn(element);
            }
         }
      }
   }

   cancel() {
      this.done();
   }

   done() {
      // unblur all other id
      let target;
      if (this.targetID !== '') {
         target = document.getElementById(this.targetID);
      }
      TutorStep.walkupDoms(target, document.body, function(element) {element.classList.remove('unfocus');});
   }

   expect(action, value) {}

   option(name) {
      return this.options[name];
   }

   show() {
      // place on  the world.
      popUp.title.textContent = this.title;
      popUp.content.innerHTML = this.content;
      popUp.bubble.classList.remove("left", "right", "top", "bottom");
      popUp.bubble.classList.add(__WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["getArrow"](this.placement));
      // now place it
      const placement = __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["placement"](this.targetID, this.placement, popUp.bubble);
      popUp.bubble.style.top = placement.top.toString() + "px";
      popUp.bubble.style.left = placement.left.toString() + "px"; 
      // blur all not ide.
      let target;
      if (this.targetID !== '') {
         target = document.getElementById(this.targetID);
      }
      TutorStep.walkupDoms(target, document.body, function(node) {node.classList.add('unfocus')});
   }
}


class MultiStep extends TutorStep {
   constructor(title, text, targetID, placement, steps) {
      super(title, text, targetID, placement);
      this.steps = steps;
      this.endStep = steps[steps.length-1].step;
   }

   cancel() {
      super.cancel();
      // remember to clean up.
      setMultiStep(null);
   }

   done() {
      const realStep = getRealCurrentStep();
      if (realStep  === this) {
         super.done();
      } else { // let substep handle it.
         realStep.done();
         if (realStep === this.endStep) {
            // should we insert an repeat again? congratulation? or something?
            setMultiStep(null);
            popUp.progressBar.style.display = 'none';
            popUp.progressDone.style.width = '0%';
            popUp.progressIndicator.style.width = '0%';
         }
      }
   }

   // let substep handle it.
   expect(action, value) {
      const realStep = getRealCurrentStep();
      if (realStep !== this) {
         realStep.expect(action, value);
      }
   }

   show() {
      const realStep = getRealCurrentStep();
      if (realStep === this) {
         super.show();
         setMultiStep(this);
         this.begin = getCurrentStation() + 1;
         this.end = this.begin + this.steps.length;
         const percent = (1 / this.steps.length) * 100;
         popUp.progressIndicator.style.width = percent + '%';
         popUp.progressBar.style.display = 'flex';
      } else { // run the real things
         realStep.show();
         // update the x/y progress bar.
         const x = getCurrentStation() - this.begin;
         const percent = (x / this.steps.length)*100;
         popUp.progressDone.style.width = percent + '%';   // set the progress bar's percentage.
      }
   }
}


class ExpectStep extends TutorStep {
   constructor(expect, title, text, targetID, placement) {
      super(title, text, targetID, placement);
      this.expectAction = expect;
      this.options.showNext = false;
   }

   action(value) {
      goNext();
   }

   expect(action, value) {
      if (this.expectAction === action) { // yes, great, now we can goto next step
         this.action(value);
      } else {
         // show error, and try to rewind?
         
      }
   }
}


class ExpectZoomStep extends ExpectStep {
   constructor(title, text, targetID, placement) {
      super(__WEBPACK_IMPORTED_MODULE_1__wings3d__["action"].cameraZoom, title, text, targetID, placement);
   }

   action(value) {
      // now zoom step is done, we can show next button.
      nextButton(true);
   }
}


class SelectStep extends TutorStep {
   constructor(tour, selections, title, text, placement) {
      super(tour, title, text, "", placement);
      if (Number.isInteger(selections)) {
         this.count = selections;
         this.countDown = selections;
      } else {
         this.selections = selections;
         this.countDown = new Set(selections);
      } 
   }

   expect(action, value) {
      if (action === this.modeSelect) {
         // now check inside the array. if the array is empty. check number.
         if (this.count !== undefined) {
            if(--this.countDown === 0) {
               goNext();
            } else {
               this.showSelectionCount();
            }
         } else {
            if (this.countDown.has(value)) {
               this.countDown.delete(value);
               this.showSelectionCount();
            }
         }
      }
   }

   done() {
      popUp.select.textContent = "";    
   }

   show() {
      super.show();
      this.showSelectionCount();
   }

   showSelectionCount() {
      if (this.count !== undefined) {
         popUp.select.textContent = "selection " + (this.count - this.countDown).toString() + " of " + (this.count).toString();
      } else {
            // popUp.select.textContent = (this.selections.size - this.countDown.size).toString() + " of " + (this.selections.size).toString();
      }
   }
}

class FaceSelectStep extends SelectStep {
   constructor(tour, selections, title, text, placement) {
      super(tour, selections, title, text, placement);
      this.modeSelect = "faceSelectOn";
   }
}

class EdgeSelectStep extends SelectStep {
}



//
// export variable
//
const tours = {};
let targetCage = null;

//
// internal accounting.
//
const rail = {stops: new Map, routes: [], currentStation: -1};
let multiStep = null;   // current multistep if any
let popUp = {};
// init() popup.bubble.
function init(idName) {
   // default 
   popUp.bubble = document.getElementById('tutorGuide');
   if (popUp.bubble) {
      popUp.close = extractElement("close");
      if (popUp.close) { // get close
         popUp.close.addEventListener('click', function(e) {
            cancel();
         });
      }
      popUp.next = extractElement("next");
      if (popUp.next) {
         popUp.next.addEventListener('click', function(ev){
            if (popUp.next.textContent === "Done") {
               complete();
            } else {
               goNext();
            }
         });
      }
      //
      popUp.title = extractElement("tutor-title");
      popUp.content = extractElement("tutor-content");
      popUp.select = extractElement("tutor-selection");
      popUp.progressBar = extractElement("tutor-progress");
      popUp.progressDone = extractElement("tutor-progress-done");
      popUp.progressIndicator = extractElement('tutor-progress-indicator');
   }
}

function nextButton(shown) {
   if (popUp.next) {
      if (shown) {
         popUp.next.style.display = 'inline-block';
      } else {
         popUp.next.style.display = 'none';
      }
   }
}

function setMultiStep(obj) {
   multiStep = obj;
};

function getCurrentStep() {
   if (multiStep) {  // let multiStep handle it
      return multiStep;
   } else {
      return rail.routes[rail.currentStation];
   }
};

function getRealCurrentStep() {
   return rail.routes[rail.currentStation];
};

function getCurrentStation() {
   return rail.currentStation;
}

function extractElement(className) {
   const nodeList = popUp.bubble.getElementsByClassName(className);
   if (nodeList.length > 0) {
      return nodeList[0];
   }
   return undefined;
};
      
function noDuplicate(nameId) {      
   if (rail.stops.has(nameId)) {
      console.log("bad step: already has ", nameId);
      return false;
   }
   return true;
};

function add(nameStep) {  // rename from _addStep, also return success or failure.
   if (noDuplicate(nameStep.nameId)) {
      rail.stops.set(nameStep.nameId, rail.routes.length);
      rail.routes.push(nameStep.step);
      return true;
   } else {
      return false;
   }
};
    
//
function step(nameId, title, text, targetID, placement, stepOptions) {
   return {nameId: nameId, step: new TutorStep(title, text, targetID, placement)};
};
function addStep(nameId, title, text, targetID, placement, stepOtions) {
   add(step(nameId, title, text, targetID, placement, stepOtions));
};

function expectStep(expect, nameId, title, text, targetID, placement, stepOptions) {
   return {nameId: nameId, step: new ExpectStep(expect, title, text, targetID, placement)};
};
function addExpectStep(expect, nameId, title, text, targetID, placement, stepOptions) {
   add(expectStep(expect, nameId, title, text, targetID, placement, stepOptions));
};

function faceSelectStep(selection, nameId, title, text, placement, stepOptions) {
   return {nameId: nameId, step: new FaceSelectStep(selection, title, text, placement)};
};
function addFaceSelectStep(selection, nameId, title, text, placement, stepOptions) {
   add(faceSelectStep(selection, nameId, title, text, placement, stepOptions));
};

function zoomStep(nameId, title, text, targetID, placement, stepOptions) {
   return {nameId: nameId, step: new ExpectZoomStep(title, text, targetID, placement, stepOptions)};
}

function addZoomStep(nameId, title, text, targetID, placement, stepOptions) {
   add(zoomStep(nameId, title, text, targetID, placement, stepOptions));
}

// add MultiStep.
function addMultiStep(nameId, title, text, target, placement, steps) {
   //
   const multiStep = new MultiStep(title, text, target, placement, steps);
   add({nameId: nameId, step: multiStep}); // begin;
   for (let step of steps) {
      add(step);
   }
}


let _play = function(stepNumber) {
   if ((stepNumber < 0) || (stepNumber >= rail.routes.length)) {
      console.log("bad step number in tutor guide");
   } else {
      if (stepNumber === (rail.routes.length-1)) {
         // change the NextButton to DoneButton
         popUp.next.textContent = "Done";
      }
      if ((rail.currentStation >= 0) && (rail.currentStation < rail.routes.length)) {
         const prevStep = getCurrentStep();//rail.routes[rail.currentStation];
         prevStep.done();
      }
      rail.currentStation = stepNumber;
      const step = getCurrentStep();//rail.routes[stepNumber];
      // apply data
      nextButton(step.option('showNext'));
      step.show();
   }
};
    
function startTour(stepArray) {
   __WEBPACK_IMPORTED_MODULE_1__wings3d__["interposeLog"](expect, true);
   //myObj.hasOwnProperty('key')
   if (stepArray) {

   }
   // onto the world
   popUp.bubble.classList.remove("hide");
   // display firstStep
   _play(0);
};
    
function complete() {
   // remove all unfocus class
   if (rail.currentStation > -1) {
      rail.routes[rail.currentStation].done();
   }
   // restore to original condition
   popUp.bubble.classList.add("hide");
   popUp.next.textContent = "Next";
   rail.stops.clear();
   rail.routes.length = 0;
   rail.currentStation = -1;
   __WEBPACK_IMPORTED_MODULE_1__wings3d__["interposeLog"](expect, false);   // remove interceptLog
};
    
function cancel() {
   complete();
};
function goNext() { _play(rail.currentStation+1); };
    
function goBack() { _play(rail.currentStation-1); };
    
function goTo(id) {};

function expect(action, log) {
   if (rail.currentStation >= 0) {
      const step = getCurrentStep();
      step.expect(action, log);
      if (action === "createCube") {   // 
         targetCage = value;
      }
   }
};

// register for 
__WEBPACK_IMPORTED_MODULE_1__wings3d__["onReady"](init);



/***/ }),
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "renderText", function() { return renderText; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "needToRedraw", function() { return needToRedraw; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "render", function() { return render; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_view__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_shaderprog__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_util__ = __webpack_require__(7);
/*
//    Render all objects and helpers (such as axes) in the scene.
//     Used for the Geometry and AutoUV windows.
//
//  Original Erlang Version: Bjorn Gustavsson
*/









// my.shader = initShaders();
// wings_pref:set_default(multisample, true), <- why set default here? shouldn't bunch of defaults set together?
// initPolygonStipple(); no webgl support. shader replacement? ignore for now
let lineProg;        // to be replaced
let groundAxisProg;  // to be replaced
let textProg;        // to be replaced

Object(__WEBPACK_IMPORTED_MODULE_3__wings3d__["onReady"])(function() {
   redrawFlag = true;
   __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].enable(__WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].DEPTH_TEST);
   __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].enable(__WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].CULL_FACE);   // enable cull face (2018-05-30) back face culling is default
   // initialized glsl program, update data
   // program source ShaderProg
   // drawGrid, using LineProgram
   // compile and link program
   lineProg = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(__WEBPACK_IMPORTED_MODULE_4__wings3d_shaderprog__["uColorArray"].vertexShader, __WEBPACK_IMPORTED_MODULE_4__wings3d_shaderprog__["uColorArray"].fragShader);

   // compile and link program.
   groundAxisProg = {handle: __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].compileGLSL(__WEBPACK_IMPORTED_MODULE_4__wings3d_shaderprog__["colorArray"].vertexShader, __WEBPACK_IMPORTED_MODULE_4__wings3d_shaderprog__["colorArray"].fragShader)};

   // get attribute handle.
   groundAxisProg.vertexPosition = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].getAttribLocation(groundAxisProg.handle, "aVertexPosition");
   groundAxisProg.vertexColor = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].getAttribLocation(groundAxisProg.handle, "aVertexColor");
   groundAxisProg.uPMatrix = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].getUniformLocation(groundAxisProg.handle, "uPMatrix");
   groundAxisProg.uMVMatrix = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].getUniformLocation(groundAxisProg.handle, "uMVMatrix");

   // compute grid and axis, and write to vbo.
   var mat = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["loadMatrices"](true);
   var yon = computeGroundAndAxes(__WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"], mat.projection, mat.modelView);    
   initMiniAxis(__WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"], mat.modelView);

   // init simpleText.
   // compile and link program.
   textProg = {handle: __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].compileGLSL(__WEBPACK_IMPORTED_MODULE_4__wings3d_shaderprog__["textArray"].vertexShader, __WEBPACK_IMPORTED_MODULE_4__wings3d_shaderprog__["textArray"].fragShader)};

   // get attribute handle.
   textProg.vertexPosition = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].getAttribLocation(textProg.handle, "aVertexPosition");
   textProg.texCoord = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].getAttribLocation(textProg.handle, "aTexCoord");
   textProg.uMVMatrix = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].getUniformLocation(textProg.handle, "uMVMatrix");
   textProg.uPMatrix = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].getUniformLocation(textProg.handle, "uPMatrix");
   textProg.uTexture = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].getUniformLocation(textProg.handle, "u_texture");
   
   initSimpleASCII(__WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"]);

 //  console.log("Render.init() success");
});



function makeVerticesForString(s) {
   var len = s.length;
   var numVertices = len * 6;
   var positions = textProg.bitmapTextVBO.verticesData;
   var texcoords = textProg.bitmapTextVBO.texCoordData;
   var numElements = positions.length / 2;
   if (numVertices > numElements) {
      // reallocated
      positions = new Float32Array(numVertices * 2);
      texcoords = new Float32Array(numVertices * 2);
   }

   var offset = 0;
   var x = 0;
   var maxX = textProg.bitmapTextVBO.fontInfo.textureWidth;
   var maxY = textProg.bitmapTextVBO.fontInfo.textureHeight;
   for (var ii = 0; ii < len; ++ii) {
      var letter = s[ii];
      var glyphInfo = textProg.bitmapTextVBO.fontInfo.glyphInfos[letter];
      if (glyphInfo) {
         var x2 = x + glyphInfo.width;
         var u1 = glyphInfo.x / maxX;
         var v1 = (glyphInfo.y + textProg.bitmapTextVBO.fontInfo.letterHeight - 1) / maxY;
         var u2 = (glyphInfo.x + glyphInfo.width - 1) / maxX;
         var v2 = glyphInfo.y / maxY;

         // 6 vertices per letter, instead triangle strip, we use triangle, single call to webgl, faster that way.
         positions[offset + 0] = x;
         positions[offset + 1] = 0;
         texcoords[offset + 0] = u1;
         texcoords[offset + 1] = v1;

         positions[offset + 2] = x2;
         positions[offset + 3] = 0;
         texcoords[offset + 2] = u2;
         texcoords[offset + 3] = v1;

         positions[offset + 4] = x;
         positions[offset + 5] = textProg.bitmapTextVBO.fontInfo.letterHeight;
         texcoords[offset + 4] = u1;
         texcoords[offset + 5] = v2;

         positions[offset + 6] = x;
         positions[offset + 7] = textProg.bitmapTextVBO.fontInfo.letterHeight;
         texcoords[offset + 6] = u1;
         texcoords[offset + 7] = v2;

         positions[offset + 8] = x2;
         positions[offset + 9] = 0;
         texcoords[offset + 8] = u2;
         texcoords[offset + 9] = v1;

         positions[offset + 10] = x2;
         positions[offset + 11] = textProg.bitmapTextVBO.fontInfo.letterHeight;
         texcoords[offset + 10] = u2;
         texcoords[offset + 11] = v2;

         x += glyphInfo.width + textProg.bitmapTextVBO.fontInfo.spacing;
         offset += 12;
      } else {
         // we don't have this character so just advance
         x += textProg.bitmapTextVBO.fontInfo.spaceWidth;
      }
   }

   // return ArrayBufferViews for the portion of the TypedArrays
   // that were actually used.
   textProg.bitmapTextVBO.verticesData = positions;
   textProg.bitmapTextVBO.texCoordData = texcoords;
   textProg.bitmapTextVBO.numElements = offset / 2;
}
// 
function renderText(gl, x, y, color, s) {
   gl.useProgram(textProg.handle);
   gl.setBufferAndAttrib(textProg.bitmapTextVBO.position, textProg.vertexPosition, 2);
   gl.setBufferAndAttrib(textProg.bitmapTextVBO.texCoord, textProg.texCoord, 2);

   makeVerticesForString(s);

   // update the buffers
   gl.bindBuffer(gl.ARRAY_BUFFER, textProg.bitmapTextVBO.position);
   gl.bufferData(gl.ARRAY_BUFFER, textProg.bitmapTextVBO.verticesData, gl.DYNAMIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER, textProg.bitmapTextVBO.texCoord);
   gl.bufferData(gl.ARRAY_BUFFER, textProg.bitmapTextVBO.texCoordData, gl.DYNAMIC_DRAW);

   // setup modelView
   textProg.bitmapTextVBO.modelView[12] = x;
   textProg.bitmapTextVBO.modelView[13] = y;
   textProg.bitmapTextVBO.modelView[14] = 0.0;
   // set uniforms
   gl.uniformMatrix4fv(textProg.uPMatrix, false, textProg.bitmapTextVBO.projection);
   gl.uniformMatrix4fv(textProg.uMVMatrix, false, textProg.bitmapTextVBO.modelView);
   gl.activeTexture(gl.TEXTURE0);
   gl.bindTexture(gl.TEXTURE_2D, textProg.bitmapTextVBO.uTexture);
   gl.uniform1i(textProg.uTexture, 0);

   // Draw the text.
   gl.drawArrays(gl.TRIANGLES, 0, textProg.bitmapTextVBO.numElements);
};

function initSimpleASCII(gl) {
   var fontInfo = {
      letterHeight: 8,
      spaceWidth: 8,
      spacing: -1,
      textureWidth: 64,
      textureHeight: 40,
      glyphInfos: {
         'a': { x:  0, y:  0, width: 8, }, 'b': { x:  8, y:  0, width: 8, }, 
         'c': { x: 16, y:  0, width: 8, }, 'd': { x: 24, y:  0, width: 8, },
         'e': { x: 32, y:  0, width: 8, }, 'f': { x: 40, y:  0, width: 8, },
         'g': { x: 48, y:  0, width: 8, }, 'h': { x: 56, y:  0, width: 8, },
         'i': { x:  0, y:  8, width: 8, }, 'j': { x:  8, y:  8, width: 8, },
         'k': { x: 16, y:  8, width: 8, }, 'l': { x: 24, y:  8, width: 8, },
         'm': { x: 32, y:  8, width: 8, }, 'n': { x: 40, y:  8, width: 8, },
         'o': { x: 48, y:  8, width: 8, }, 'p': { x: 56, y:  8, width: 8, },
         'q': { x:  0, y: 16, width: 8, }, 'r': { x:  8, y: 16, width: 8, },
         's': { x: 16, y: 16, width: 8, }, 't': { x: 24, y: 16, width: 8, },
         'u': { x: 32, y: 16, width: 8, }, 'v': { x: 40, y: 16, width: 8, },
         'w': { x: 48, y: 16, width: 8, }, 'x': { x: 56, y: 16, width: 8, },
         'y': { x:  0, y: 24, width: 8, }, 'z': { x:  8, y: 24, width: 8, },
         '0': { x: 16, y: 24, width: 8, }, '1': { x: 24, y: 24, width: 8, },
         '2': { x: 32, y: 24, width: 8, }, '3': { x: 40, y: 24, width: 8, },
         '4': { x: 48, y: 24, width: 8, }, '5': { x: 56, y: 24, width: 8, },
         '6': { x:  0, y: 32, width: 8, }, '7': { x:  8, y: 32, width: 8, },
         '8': { x: 16, y: 32, width: 8, }, '9': { x: 24, y: 32, width: 8, },
         '-': { x: 32, y: 32, width: 8, }, '*': { x: 40, y: 32, width: 8, },
         '!': { x: 48, y: 32, width: 8, }, '?': { x: 56, y: 32, width: 8, },
      },
   };

   // ready VBO and Image.
   var vertices = new Float32Array(8*6*2);
   var texCoord = new Float32Array(8*6*2);
  // Create a texture.
   var glyphTex = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D, glyphTex);
   // Fill the texture with a 1x1 blue pixel.
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
   // Asynchronously load an image
   var image = new Image();
   image.src = "../img/8x8-font.png";
   image.onload = function() {   // image loaded, copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, glyphTex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   };   
   textProg.bitmapTextVBO = {
      verticesData: vertices,
      texCoordData: texCoord,
      numElements: 0,
      position: gl.createBufferHandle(vertices),
      texCoord: gl.createBufferHandle(texCoord),
      modelView: mat4.create(),
      projection: mat4.create(),
      uTexture: glyphTex,
      fontInfo: fontInfo
   };
}

// it seems erlang version use 2d(w) line - line intersection (wikipedia). 
// we changed it to blinn's homogenous clipping. we are only interest in clip to end-out region. 
function clipLine(pt0, pt1) {
   var tIn = 0.0, tOut = 1.0, tHit;
   // bc, boundary code.
   var bc = {pt0: [pt0[3]+pt0[0], pt0[3]-pt0[0], pt0[3]+pt0[1], pt0[3]-pt0[1], pt0[3]+pt0[2], pt0[3]-pt0[2]],
             pt1: [pt1[3]+pt1[0], pt1[3]-pt1[0], pt1[3]+pt1[1], pt1[3]-pt1[1], pt1[3]+pt1[2], pt1[3]-pt1[2]]};
   var outCode = {pt0: 0, pt1: 0};
   for (var i = 0; i < 6; ++i) {
      var tmp = (bc.pt0[i] < 0) << i;
      outCode.pt0 |= tmp;
      outCode.pt1 |= (bc.pt1[i] < 0) << i;
   }

   if ((outCode.pt0 & outCode.pt1) != 0) { // trivial reject, both point outside the same plane
      return false;
   }
   if ((outCode.pt0 | outCode.pt1) == 0) { // trivial accept
      return true;
   }
   // now, do 3D line clipping
   for (i=0; i < 6; i++) {  // clip against 6 planes
      if (bc.pt1[i] < 0) {  // C is outside wall i (exit so tOut)
         tHit = bc.pt0[i]/(bc.pt0[i] - bc.pt1[i]);      // calculate tHit
         tOut = Math.min(tOut, tHit);
      } else if(bc.pt0[i] < 0) { // A is outside wall I (enters so tIn)
         tHit = bc.pt0[i]/(bc.pt0[i] - bc.pt1[i]);      // calculate tHit
         tIn = Math.max(tIn, tHit);
      }
      if (tIn > tOut) {
         return false; // CI is empty: early out
      }
   }

   var tmp = vec4.create();  // stores homogeneous coordinates
   if (outCode.pt0 != 0) { // A is outside: tIn has changed. Calculate A_chop
      for (i = 0; i < 4; ++i) { // compute x, y, z, w component
         tmp[i] = pt0[i] + tIn * (pt1[i] - pt0[i]);
      }
   }
   if (outCode.pt1 != 0) { // C is outside: tOut has changed. Calculate C_chop
      for (i = 0; i < 4; ++i) { // compute x, y, z, w component
         pt1[i] = pt0[i] + tOut * (pt1[i] - pt0[i]);
      }
   }
   pt0 = tmp;
   return true; // some of the edges lie inside CVV
};

function renderASCII(gl, origin, end, c, color, viewport) {
   if (clipLine(origin, end)) {
      // line inside view volume
      //console.log(end[0], end[1], end[2], end[3]);
      var x = Math.trunc((0.5*end[0]/end[3]+0.5)*(viewport[2]-20) + 10);
      var y = viewport[3] - Math.trunc((0.5*end[1]/end[3]+0.5)*(viewport[3]-16) + 7);
      //console.log("x:", x, "y:", y);
      renderText(gl, x, y, color, c);
   }
};

function renderAxisLetter(gl, zFar) {
   if (__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["prop"].showAxes){
      var viewPort = gl.getViewport();
      var start = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
      var origin = gl.transformVertex(start);

      //gl:matrixMode(?GL_PROJECTION),
      //gl:loadIdentity(),
      //{_,_,W,H} = ViewPort,
      //glu:ortho2D(0.0, W, H, 0.0, -1, 1);
      mat4.ortho(textProg.bitmapTextVBO.projection, 0.0, viewPort[2], viewPort[3], 0.0, -1.0,  1.0);
      //gl:matrixMode(?GL_MODELVIEW),
      //gl:loadIdentity(),
      zFar = zFar + __WEBPACK_IMPORTED_MODULE_3__wings3d__["GROUND_GRID_SIZE"];
      //gl:polygonMode(?GL_FRONT_AND_BACK, ?GL_FILL),
      
      var color = [__WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGB"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].colorX), __WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGB"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].colorY), __WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGB"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].colorZ)];
      var endx = gl.transformVertex(vec4.fromValues(zFar, 0.0, 0.0, 1.0)), 
          endy = gl.transformVertex(vec4.fromValues(0.0, zFar, 0.0, 1.0)), 
          endz = gl.transformVertex(vec4.fromValues(0.0, 0.0, zFar, 1.0));
      renderASCII(gl, origin, endx, 'x', color[0], viewPort);
      renderASCII(gl, origin, endy, 'y', color[1], viewPort);
      renderASCII(gl, origin, endz, 'z', color[2], viewPort);
   }
};

// ignore along_axis for now. fixed it later when we get to set the preference.
function initMiniAxis(gl, inModelView) {
   //#view{along_axis=Along} = wings_view:current(),
   // mini axis and arrow
   var PA = 0.08, PB = 0.01;
   var arry = [].concat(
      [0.0, 0.0, 0.0], [0.1, 0.0, 0.0], // x
      [0.0, 0.0, 0.0], [0.0, 0.1, 0.0], // y
      [0.0, 0.0, 0.0], [0.0, 0.0, 0.1], // z
      [ PA, 0.0, -PB], [0.1, 0.0, 0.0], [PA, 0.0,  PB], [0.1, 0.0, 0.0], // x arrow
      [-PB,  PA, 0.0], [0.0, 0.1, 0.0], [PB,  PA, 0.0], [0.0, 0.1, 0.0], // y arrow
      [-PB, 0.0,  PA], [0.0, 0.0, 0.1], [PB, 0.0,  PA], [0.0, 0.0, 0.1]   // z arrow
   );
   // ready color
   var clr = [__WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGB"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].colorX), __WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGB"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].colorY), __WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGB"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].colorZ)];
   var color = [], arrow = [];
   for (var i=0; i< 3; ++i) {
      color = color.concat(clr[i], clr[i]);
      arrow = arrow.concat(clr[i], clr[i], clr[i], clr[i]);
   }
   color = color.concat(arrow);
   // bindVBO
   groundAxisProg.miniAxisVBO = {
       position: gl.createBufferHandle(new Float32Array(arry)),
       color: gl.createBufferHandle(new Float32Array(color)),
       length: 3*2 + 3*4
   };
   // compute ortho projection, and modelView.
   var ratio = gl.canvas.clientWidth / gl.canvas.clientHeight;
   var modelView = mat4.clone(inModelView);
   modelView[12] = 0.11-ratio;
   modelView[13] = -1.0+0.11;
   modelView[14] = 0.0;
   groundAxisProg.miniAxisVBO.modelView = modelView;
   groundAxisProg.miniAxisVBO.projection = mat4.create();
   mat4.ortho(groundAxisProg.miniAxisVBO.projection, -ratio, ratio, -1.0, 1.0, 0.00001,  10000000.0);
}
function renderMiniAxis(gl, inModelView) {
   if (__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["prop"].miniAxis) {
      var ratio = gl.canvas.clientWidth / gl.canvas.clientHeight;
      // set current rotation.
      var modelView = groundAxisProg.miniAxisVBO.modelView;
      mat4.copy(modelView, inModelView);
      modelView[12] = 0.11-ratio;
      modelView[13] = -1.0+0.11;
      modelView[14] = 0.0;
      // save attribute
      var length = groundAxisProg.miniAxisVBO.length;

      // render mini axis, use groundAxisProg
      gl.useProgram(groundAxisProg.handle);
      // bind attribute, vertex, color, matrix
      gl.uniformMatrix4fv(groundAxisProg.uPMatrix, false, groundAxisProg.miniAxisVBO.projection);
      gl.uniformMatrix4fv(groundAxisProg.uMVMatrix, false, groundAxisProg.miniAxisVBO.modelView);
      gl.setBufferAndAttrib(groundAxisProg.miniAxisVBO.position, groundAxisProg.vertexPosition);
      gl.setBufferAndAttrib(groundAxisProg.miniAxisVBO.color, groundAxisProg.vertexColor);
      // draw line segments
      gl.drawArrays(gl.LINES, 0, length);
      // pop attribute
   }
}
// recompute groundplanegrid, given the size of grid. size is mutiple of GROUND_GRID_SIZE. default
// GROUND_GRID_SIZE=1, so size=10, grid is 10x10.
function computeGroundGrid(size, gridSize) {
   var data = [];
   for (var xz= size; xz > 0; xz-=gridSize) {
      data = data.concat([xz, 0.0, size], [xz, 0.0, -size],
                         [-xz, 0.0, size], [-xz, 0.0, -size],
                         [size, 0.0, xz], [-size, 0.0, xz],
                         [size, 0.0, -xz], [-size, 0.0, -xz]  
                        );
   }
   // final x, z, axis lines.
   return data.concat([0.0, 0.0, size], [0.0, 0.0, -size],
                      [size, 0.0, 0.0], [-size, 0.0, 0.0]);
}
function calcGridSize(projection, modelView) {
   var width = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].canvas.clientWidth;
   var height = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].canvas.clientHeight;
   var w1 = Math.max(width, height);// /2.0;
   var coord = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].unProject(w1, 0.0, 0.0, modelView, projection, [0, 0, width, height]);
   var ret = __WEBPACK_IMPORTED_MODULE_3__wings3d__["GROUND_GRID_SIZE"] * 
           Math.max(Math.round(Math.max(Math.max(Math.abs(coord[0]), Math.abs(coord[1])), Math.abs(coord[2]))), 10.0);
   // hacked an value that just cover the screen space.
   ret *= width/height * 0.7;
   return Math.round(ret);
}
function computeGroundAndAxes(gl, projection, modelView) {
   var gridSize = calcGridSize(projection, modelView);
   //console.log("gridsize " + gridSize.toString());
   var data = computeGroundGrid(gridSize, __WEBPACK_IMPORTED_MODULE_3__wings3d__["GROUND_GRID_SIZE"]);
   // bindVBO.
   lineProg.groundGridVBO = {
      position: gl.createBufferHandle(new Float32Array(data)),
      length: data.length/3
   };

   // compute Axes, bindVBO.
   groundAxisProg.axisVBO = {
      position: gl.createBufferHandle(getAxis()),
      color: gl.createBufferHandle(getAxisColor()),
      length: 3*2*2
   };

   return gridSize;
}
function getAxis() {
   var yon = __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"].zFar;
   var arry = [[yon, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [-yon, 0.0, 0.0], 
               [0.0, yon, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -yon, 0.0],
               [0.0, 0.0, yon], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, -yon]];
   return new Float32Array([].concat.apply([],arry));
}
function getAxisColor() {
    const color = [__WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGB"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].colorX), __WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGB"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].colorY), __WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGB"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].colorZ)],
       negColor = [__WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGB"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].negColorX), __WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGB"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].negColorY), __WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGB"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].negColorZ)];
   var arry = [];
   for (var i = 0; i < 3; i++) {
      arry = arry.concat(color[i], color[i], negColor[i], negColor[i]);
   }
   return new Float32Array(arry);
}
function renderGroundAndAxes(gl, projection, modelView) {
   const showAxes = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["prop"].showAxes;
   // draw groundPlane
   const show = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["prop"].showGroundplane; // || 
      //(wings_pref:get_value(force_show_along_grid) andalso
      //(Camera.view.alongAxis =/= none);      
   if (show) {
      var alongAxis = __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"].alongAxis;
      const color = __WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGBA"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].gridColor);
         //case view.AlongAxis of
         // x -> gl:rotatef(90.0, 0.0, 1.0, 0.0);
         // z -> ok;
         // _ -> gl:rotatef(90.0, 1.0, 0.0, 0.0)
      var length = lineProg.groundGridVBO.length;
      if (showAxes) {
         length -= 4;            // skip the axes line
      }
      // data
      // use line segment program
      gl.useProgram(lineProg.progHandle);
      // bind attribute, vertex, color, matrix
      gl.setBufferAndAttrib(lineProg.groundGridVBO.position, lineProg.attribute.position.loc);
      gl.uniform4fv(lineProg.uniform.uColor.loc, color);
      gl.uniformMatrix4fv(lineProg.transform.projection, false, projection);
      gl.uniformMatrix4fv(lineProg.transform.worldView, false, modelView);
      // draw line segments
      gl.drawArrays(gl.LINES, 0, length);
   }

   var yon;
   //if (View.prop.constrainAxes) {
   //   yon = gridSize;
   //} else {
      yon = __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"].zFar;
   //}
   if (showAxes) {
      // use line segment program
      gl.useProgram(groundAxisProg.handle);
      // bind attribute, vertex, color, matrix
      gl.uniformMatrix4fv(groundAxisProg.uPMatrix, false, projection);
      gl.uniformMatrix4fv(groundAxisProg.uMVMatrix, false, modelView);
      gl.setBufferAndAttrib(groundAxisProg.axisVBO.position, groundAxisProg.vertexPosition);
      gl.setBufferAndAttrib(groundAxisProg.axisVBO.color, groundAxisProg.vertexColor);
      // draw line segment
      gl.drawArrays(gl.LINES, 0, groundAxisProg.axisVBO.length);
   }

   return yon;
};

let redrawFlag = false;

function needToRedraw() {
   redrawFlag = true;
};

function render(gl, drawWorldFn) {
   if (gl.resizeToDisplaySize() || __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"].isModified || redrawFlag) {
      redrawFlag = false; 
      const backColor = __WEBPACK_IMPORTED_MODULE_5__wings3d_util__["hexToRGBA"](__WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].geometryBackground);
      gl.clearColor(backColor[0], backColor[1], backColor[2], backColor[3]);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.polygonOffset(0.0, 0.0);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      //?CHECK_ERROR(),
      // no support for pushAttrib()
      //gl.pushAttrib(?GL_CURRENT_BIT bor ?GL_ENABLE_BIT bor
      //                        ?GL_TEXTURE_BIT bor ?GL_POLYGON_BIT bor
      //		                   ?GL_LINE_BIT bor ?GL_COLOR_BUFFER_BIT bor
      //		                   ?GL_LIGHTING_BIT).enable(?GL_DEPTH_TEST).enable(?GL_CULL_FACE);
      // no support for dynamic anti aliasing. only setup in creatingContext
      var mat = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["loadMatrices"](true);
      if (__WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"].isModified) {
         __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"].isModified = false;
         computeGroundAndAxes(gl, mat.projection, mat.modelView);
      }
      var yon = renderGroundAndAxes(gl, mat.projection, mat.modelView);
      renderMiniAxis(gl, mat.modelView);
      //show_saved_bb(St),
      //show_bb_center(St),
      //user_clipping_planes(on),
      drawWorldFn(gl); // and scenelights.
      //user_clipping_planes(off),
      renderAxisLetter(gl, yon);
      //show_camera_image_plane(),
      //wings_develop:gl_error_check("Rendering scene")
   }
};









/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return WavefrontObjImportExporter; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_importexport__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_view__ = __webpack_require__(1);
//
// Wavefront Obj Loader and Writer.
//
//




class WavefrontObjImportExporter extends __WEBPACK_IMPORTED_MODULE_0__wings3d_importexport__["ImportExporter"] {
   constructor() {
      super('Wavefront (.obj)...', 'Wavefront (.obj)...');
   }

   extension() {
      return "obj";
   }

   _export(world) {      
      let text = "#wings3d-web wavefront export\n";
      const fn = function(vertex) {
         text += " " + (vertex.index+1);
      };
      for (const [index, cage] of world.entries()) {
         const mesh = cage.geometry;
         text += "o " + index.toString() + "\n";
         // now append the "v x y z\n"
         text += "\n#vertex total " + mesh.vertices.size + "\n";
         for (let vertex of mesh.vertices) {
            const vert = vertex.vertex;
            text += "v " + vert[0] + " " + vert[1] + " " + vert[2] + "\n";
         }
         // "f index+1 index+1 index+1"
         text += "\n#face list total " + mesh.faces.size + "\n";
         for (let polygon of mesh.faces) {
            text += "f";
            polygon.eachVertex(fn);
            text += "\n";
         }
      }
      const blob = new Blob([text], {type: "text/plain;charset=utf-8"});

      return blob;
   }

   _import(objText) {
      // break the objText to lines we needs.
      const linesMatch = objText.match(/^([vfogs])(?:\s+(.+))$/gm);   //objText.match(/^v((?:\s+)[\d|\.|\+|\-|e|E]+){3}$/gm);

      if (linesMatch) {
         for (let line of linesMatch) {
            line = line.trim();            // how can we remove end of space in regex?
            let split = line.split(/\s+/);
            let tag = split.shift();
            if (typeof this[tag] === 'function') {
               this[tag](split);
            } else {
               console.log("unexpected tag: " + tag); // should not happened
            }
         }
         // done reading, return the object.
         return this.objs;
      }
   }

   o(objName) {
      this.objView = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["putIntoWorld"]();
      this.obj = this.objView.geometry;
      this.objs.push( this.objView );

      this.obj.clearAffected();
      // assignedName
      this.objView.name = objName;
   }

   g(groupNames) {
      if (!this.objView) {
         this.objView = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["putIntoWorld"]();
         this.obj = this.objView.geometry;
         this.objs.push( this.objView );
      }
      // to be implemented later

   }

   s(groupNumber) {
      // to be implemented later
   }

   v(vertex) {
      // should we do error check?
      const vert = this.obj.addVertex(vertex);
      this.realVertices.push(vert.index);
      this.vertexCount++;
   }

   f(index) {
      const faceIndex = [];
      for (let i of index) {
         let split = i.split('/');
         let idx = split[0] - 1;          // convert 1-based index to 0-based index.
         if ( (idx >= 0) && (idx < this.obj.vertices.size)) {
            faceIndex.push( this.realVertices[idx] );
         } else {
            console.log("face index out of bound: " + idx);
         }
      }
      let polygonIndex = this.obj.addPolygon(faceIndex);
      if (polygonIndex === null) {
         this.non_manifold.push( this.polygonCount );    // addup failure.
      }
      //if (!this.obj.sanityCheck()) {
      //   console.log("polygon # " + this.polygonCount + " not sane");
      //}
      this.polygonCount++;
   }
}




/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ImportExporter", function() { return ImportExporter; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_model__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_wingededge__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_view__ = __webpack_require__(1);
//
// file handling. 
// 1) handling local file upload. and simple file download.
// todo
// 2) dropbox, yandex.
// 3) google drive, microsoft onedrive, baidupan to come later.
//







class ImportExporter {
   constructor(importMenuText, exportMenuText) {
      const self = this;
      // plug into import/export menu
      if (importMenuText) {
         // first get import Submenu.
         __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["addMenuItem"]('fileImport', 'import' + importMenuText.split(" ")[0], importMenuText, function(ev) {
               __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["openFile"](function(file) { // open file Dialog, and retrive data
                     self.import(file);
                  });      
            });
      }
      if (exportMenuText) {
         __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["addMenuItem"]('fileExport', 'export' + exportMenuText.split(" ")[0], exportMenuText, function(ev) {
            __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["runDialog"]('#exportFile', ev, function(form) {
               const data = form.querySelector('input[name="Filename"');
               if (data) {
                  self.export(data.value);
               }
             });
         });
      }
      // init at beginning.
      this._reset();
   }


   export(filename) {
      const blob = this._export(__WEBPACK_IMPORTED_MODULE_3__wings3d_view__["getWorld"]());
      saveAs(blob, filename + '.' + this.extension());
   }

   import(file) {
      const self = this;
      let reader = new FileReader();

      reader.onload = function(ev) {
         const text = reader.result;
         const world = self._import(text);
         const cages = [];
         for (let cage of world) {
            cages.push( new __WEBPACK_IMPORTED_MODULE_0__wings3d_model__["CreatePreviewCageCommand"](cage) );
         }
         if (cages.length > 1) {
            // combo
            __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["undoQueueCombo"]( cages );
         } else if (cages.length > 0) {
            __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["undoQueue"](cages[0]);
         }
         // after we finalised _reset too.
         self._reset();
         __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["updateWorld"]();
      }

      reader.readAsText(file);
   }

   _reset() {
      this.objs = [];
      this.obj = null;
      this.objView = null;
      this.realVertices = []; // convert index
      this.polygonCount = 0;
      this.vertexCount = 0;
      this.non_manifold = [];
   }
};



/***/ }),
/* 22 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MultiMadsor", function() { return MultiMadsor; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_edgemads__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_model__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_shaderprog__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_view__ = __webpack_require__(1);
/*
 *
 * MADS (Modify, Add, Delete, Select) operation. only toggling function
 *
**/










class MultiMadsor extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["Madsor"] {
   constructor() {
      super('Multi');
   }

   isFaceSelectable() { return true; }
   isEdgeSelectable() { return true; }
   isVertexSelectable() { return true; }

   toggleMulti(hilite) {
      if (hilite.face) {
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["toggleFaceMode"]();
      } else if (hilite.vertex) {
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["toggleVertexMode"]();
      } else {    // if (hilite.edge) {   
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["toggleEdgeMode"]();
      } // not body possible.
   }

   toggleFunc(toMadsor) {
      let redoFn;
      let snapshots;
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreFaceMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_4__wings3d_model__["PreviewCage"].prototype.changeFromMultiToFaceSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_4__wings3d_model__["PreviewCage"].prototype.changeFromMultiToVertexSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_2__wings3d_edgemads__["EdgeMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreEdgeMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_4__wings3d_model__["PreviewCage"].prototype.changeFromMultiToEdgeSelect);
      } else { // bodyMadsor
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreEdgeMode"];
         snapshots = this.snapshotAll(__WEBPACK_IMPORTED_MODULE_4__wings3d_model__["PreviewCage"].prototype.changeFromMultiToBodySelect);
      }
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["ToggleModeCommand"](redoFn, __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreMultiMode"], snapshots));
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_4__wings3d_model__["PreviewCage"].prototype.restoreFromMultiToFaceSelect);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_4__wings3d_model__["PreviewCage"].prototype.restoreFromMultiToVertexSelect);
      } else if (toMadsor instanceof EdgeVertex) {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_4__wings3d_model__["PreviewCage"].prototype.restoreFromMultiToEdgeSelect);
      } else {
         this.doAll(snapshots, __WEBPACK_IMPORTED_MODULE_4__wings3d_model__["PreviewCage"].prototype.restoreFromMultiToBodySelect);      
      }
   }

   drawExtra(_gl, _draftBench) {
      // no hilite
   }
};




/***/ }),
/* 23 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DraftBench", function() { return DraftBench; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CheckPoint", function() { return CheckPoint; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_shaderprog__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_util__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_boundingvolume__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_wingededge__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_undo__ = __webpack_require__(4);
//
// strategy:
//    use GPU as much as possible. multiple passes for drawing. we have more than enough GPU power.
//
//    update as little as possible on cpu side. 
//
// todo: done.
//    first pass: draw line (select, unselected) first (using triangles). 
//
//    second pass: draw polygon (selected, unseleced) using slightly optimized index.
//
//    third pass?: draw vertex.
//
//    last pass: draw hilite (line, polygon, or vertex).
//









/**
 * 
 * @param {*} theme 
 * @param {*} prop 
 * @param {*} defaultSize
 * 
 * internal data. isAltered (index rebuilt). isModified(reupload data to gpu) 
 */
const DraftBench = function(theme, prop, defaultSize = 2048) {  // should only be created by View
   __WEBPACK_IMPORTED_MODULE_4__wings3d_wingededge__["MeshAllocator"].call(this, defaultSize); // constructor.
  
   this.lastPreviewSize = { vertices: 0, edges: 0, faces: 0};
   this.boundingSpheres = [];
   this.hilite = {index: null, indexLength: 0, numberOfTriangles: 0};  // the hilite index triangle list.
   this.numberOfTriangles = 0;

   this.preview = {centroid: {}, isAltered: false};
   this.preview.shaderData = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderData();
   //this.preview.shaderData.setUniform4fv("faceColor", [0.5, 0.5, 0.5, 1.0]);
   //this.preview.shaderData.setUniform4fv("selectedColor", [1.0, 0.0, 0.0, 1.0]);
   var layoutVec = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["ShaderData"].attribLayout();
   var layoutFloat = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["ShaderData"].attribLayout(1);
   this.preview.shaderData.createAttribute('position', layoutVec, __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].STATIC_DRAW);
   this.preview.shaderData.createAttribute('barycentric', layoutVec, __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].STATIC_DRAW);
   this._resizeBoundingSphere(0);
   this._resizePreview(0, 0);
   this.setTheme(theme, prop);

   // previewEdge
   this.preview.edge = {};
   this.preview.edge.isAltered = false;
   this.preview.edge.indexCount = 0;
   this.preview.edge.hilite = {indexCount: 0, wEdge: null};
   this.preview.edge.hardness = {isAltered: false, indexCount: 0};
   this.preview.edge.wireOnly = {isAltered: false, indexCount: 0};

   // previewVertex
   this.preview.vertex = {isModified: false, isAltered: false, min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER};
   this.preview.shaderData.createAttribute('vertexState', layoutFloat, __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].DYNAMIC_DRAW);
   this._resizePreviewVertex();
   // body state.
   this.previewBody = {hilite: false};
   // shown plane normal
   this.previewPlane = {};
   this.previewPlane.shaderData = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderData();
   this.previewPlane.shaderData.setUniform4fv("faceColor", [1.0, 0.0, 0.0, 1.0]);
   this.previewPlane.shaderData.createAttribute('position', layoutVec, __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].STATIC_DRAW);
   this.previewPlane.rectangle = new Float32Array(3*4);  // 
   this.previewPlane.shaderData.resizeAttribute('position', Float32Array.BYTES_PER_ELEMENT*3*4);
   this.previewPlane.pts = [];
   for (let i = 0; i < 4; ++i) {
      this.previewPlane.pts[i] = this.previewPlane.rectangle.subarray(i*3, (i+1)*3);
   }
};

// temp structure
DraftBench.theme = {edgeColor: [0.0, 0.0, 0.0, 1.0],
                    hardEdgeColor: [1.0, 0.5, 0.0, 1.0],
                    selectedColor: [0.65, 0.0, 0.0, 1.0],
                    selectedHilite: [0.7, 0.7, 0.0, 1.0],
                    unselectedHilite: [0.0, 0.65, 0.0, 1.0],
                    vertexColor: [0.0, 0.0, 0.0, 1.0],
                    maskedVertexColor: [0.5, 1.0, 0.0, 0.8],
                    faceColor: [0.7898538076923077, 0.8133333333333334, 0.6940444444444445],
                    sculptMagnetColor: [0.0, 0.0, 1.0, 0.1],
                    tweakMagnetColor: [0.0, 0.0, 1.0, 0.06],
                    tweakVectorColor: [1.0, 0.5, 0.0],
                  };
DraftBench.pref = {vertexSize: 4.0,
                   selectedVertexSize: 5.0,
                   maskedVertexSize: 8.0,
                   edgeWidth: 2.0,
                   selectedEdgeWidth: 2.0,
                   hardEdgeWidth: 2.0,
                  };
// temp structure for 
DraftBench.CONST = (function() {
   const constant = {};

   constant.EDGEWIDTH = 1.1;
   constant.BARYCENTRIC = new Float32Array(3);
   constant.BARYCENTRIC[0] = 1.0;
   constant.BARYCENTRIC[1] = 0.0;
   constant.BARYCENTRIC[2] = 1.0;
   return constant;
}());


// draftBench inherited from MeshAllocator, so we canintercept freeXXX and allocXXX call easier. It also makes logical sense.
DraftBench.prototype = Object.create(__WEBPACK_IMPORTED_MODULE_4__wings3d_wingededge__["MeshAllocator"].prototype);


/**
 * 
 */
DraftBench.prototype.setTheme = function(theme, pref) {
   Object.entries(theme).forEach(([key, value]) => {
      // put the hext value to shader
      this.preview.shaderData.setUniform4fv(key, __WEBPACK_IMPORTED_MODULE_2__wings3d_util__["hexToRGBA"](value));
      DraftBench.theme[key] = __WEBPACK_IMPORTED_MODULE_2__wings3d_util__["hexToRGBA"](value);     // to be deleted
    });
   // set pref
   Object.entries(pref).forEach(([key, value]) => {
      DraftBench.pref[key] = value;
    });
   // manual update
   const manualKeys = ['vertexSize', 'selectedVertexSize', 'maskedVertexSize'];
   for (let key of manualKeys) {
      this.preview.shaderData.setUniform1f(key, pref[key]);
   }
};

// free webgl buffer.
DraftBench.prototype.freeBuffer = function() {
   this.preview.shaderData.freeAllAttributes();
   this.preview.shaderData =  null;
   this.previewEdge.shaderData.freeAllAttributes();
   this.previewEdge.shaderData = null;
};

/**
 * vertex.isAltered = true; needs to recompute index.
 */
DraftBench.prototype.alterVertex = function() {
   this.preview.vertex.isAltered = true;
}

/** 
 * visiblility change. update vertex/edge/polygon state.
 */
DraftBench.prototype.alterPreview = function() {
   this.preview.isAltered = true;
   this.preview.edge.isAltered = true;
   this.preview.edge.wireOnly.isAltered = true;
   this.preview.vertex.isAltered = true;
}

DraftBench.prototype.updatePreview = function() {
   this._resizeBoundingSphere();
   this._resizePreview();
   this._resizePreviewVertex();
   this._updatePreviewSize();
   this._updateAffected(this.affected);
   // compute index
   //this._computePreviewIndex();
};


DraftBench.prototype._resizeBoundingSphere = function() {
   let oldSize = this.lastPreviewSize.faces
   let size = this.faces.length - oldSize;
   if (size > 0) {   // we only care about growth for now
      if (oldSize > 0) {
         if (this.preview.centroid.buf.data.length < (this.preview.centroid.buf.len+(size*3))) {
            // needs to resize, and copy
            const buf = new ArrayBuffer(this.faces.length * 3 * Float32Array.BYTES_PER_ELEMENT * 2);
            const centroid = {buf: {buffer: buf, data: new Float32Array(buf), len: 0} };
            // 
            centroid.buf.data.set(this.preview.centroid.buf.data);  // copy old data
            for (let sphere of this.boundingSpheres) {
               sphere.center = new Float32Array(centroid.buf.buffer, Float32Array.BYTES_PER_ELEMENT*centroid.buf.len, 3); 
               centroid.buf.len += 3;             
            }
            this.preview.centroid.buf = centroid.buf;
         }
      } else {
         const buf = new ArrayBuffer(this.faces.length * 3 * Float32Array.BYTES_PER_ELEMENT * 2); // twice the current size
         this.preview.centroid.buf = {buffer: buf, data: new Float32Array(buf), len: 0};
         // assign a boundingsphere for each polygon.
         //this.boundingSpheres = new Array(this.faces.length);
         //this.boundingSpheres.length = 0;
      }
      // create New, should not have deleted sphere to mess up things
      const centroid = this.preview.centroid;   // 
      for (let i = oldSize; i < this.faces.length; ++i) {
         const polygon = this.faces[i];
         const sphere = this.boundingSpheres[i];
         let center = sphere.center;
         if (!center) {
            center = new Float32Array(centroid.buf.buffer, Float32Array.BYTES_PER_ELEMENT*centroid.buf.len, 3);
            centroid.buf.len += 3;
         }
         //polygon.index = i; // recalibrate index for free.
         //this.boundingSpheres.push( BoundingSphere.create(polygon, center) );
         sphere.setSphere( __WEBPACK_IMPORTED_MODULE_3__wings3d_boundingvolume__["BoundingSphere"].computeSphere(polygon, center) );
      }
      // vertices is geometry data + centroid data.
   }
};

DraftBench.prototype._resizePreview = function() {
   let oldSize = this.lastPreviewSize.vertices;
   let oldCentroidSize = this.lastPreviewSize.faces;

   const size = this.vertices.length - oldSize;
   const centroidSize = this.faces.length - oldCentroidSize;
   if ((size > 0) || (centroidSize > 0)) {
      const model = this;
      let length = model.buf.data.length;
      let centroidLength = model.preview.centroid.buf.data.length;
      if (oldSize > 0) {
         if (length > model.preview.barycentric.length) {
            // create new length
            model.preview.barycentric = new Float32Array(length);
            let selected = new Uint8Array(length/3);
            selected.set(model.preview.selected);
            model.preview.selected = selected;
         }
         if (centroidLength > model.preview.centroid.barycentric.length) {
            model.preview.centroid.barycentric = new Float32Array(centroidLength);
         }
      } else { // brand new
         // created array
         model.preview.barycentric = new Float32Array(length);
         model.preview.selected = new Uint8Array(length/3);
         model.preview.selectedCount = 0;
         model.preview.realSelectedCount = 0;
      
         model.preview.centroid.barycentric = new Float32Array(centroidLength);
      }
      model.preview.barycentric.set(DraftBench.CONST.BARYCENTRIC);
      model.preview.selected.fill(0, oldSize);
      model.preview.centroid.barycentric.fill(1.0);
      // upload the data to webgl
      length = this.buf.len;
      centroidLength = this.preview.centroid.buf.len;
      model.preview.shaderData.resizeAttribute('position', (length+centroidLength)*4);
      model.preview.shaderData.uploadAttribute('position', 0, this.buf.data.subarray(0, length));
      model.preview.shaderData.uploadAttribute('position', length*4, this.preview.centroid.buf.data.subarray(0, centroidLength));
      model.preview.shaderData.resizeAttribute('barycentric', (length+centroidLength)*4);
      model.preview.shaderData.uploadAttribute('barycentric', 0, this.preview.barycentric.subarray(0, length));
      model.preview.shaderData.uploadAttribute('barycentric', length*4, this.preview.centroid.barycentric.subarray(0, centroidLength));
      // invalidate hilite
      model.hilite.indexLength = 0;
      this.preview.isAltered = true;
   }
      
   // compute index
   if (this.preview.isAltered) {
      this._computePreviewIndex();
   }
};

DraftBench.prototype._computePreviewIndex = function() {
   this.numberOfTriangles = this.faces.reduce( function(acc, element) {
      return acc + element.numberOfVertex; // -2; for half the vertex
   }, 0);
   this.preview.indexLength = this.numberOfTriangles * 3;
   this.preview.realIndexLength = this.preview.indexLength;
};

DraftBench.prototype._computeFaceHiliteIndex = function(polygon, offset) {
   if (this.hilite.numberOfTriangles < polygon.numberOfVertex) {
      this.hilite.numberOfTriangles = polygon.numberOfVertex;
      this.hilite.index = new Uint32Array(this.hilite.numberOfTriangles*3);
   }
   if (offset === undefined) {
      offset = 0;
   }
   let index = polygon.index;
   let indicesLength = 0;
   let barycentric = this.vertices.length + polygon.index;
   for (let hEdge of polygon.hEdges()) {
      const vertex = hEdge.origin;
      if (indicesLength > 0) {
         this.hilite.index[offset+indicesLength++] = vertex.index;
         this.hilite.index[offset+indicesLength++] = barycentric;
      }
      this.hilite.index[offset+indicesLength++] = vertex.index;
   }
   // last triangle using the first vertices
   this.hilite.index[offset+indicesLength++] = this.hilite.index[offset];
   this.hilite.index[offset+indicesLength++] = barycentric;

   this.hilite.indexLength = offset+indicesLength;
   // copy to gpu
   this.preview.shaderData.setIndex('faceHilite', this.hilite.index);
};

DraftBench.prototype._computeGroupHiliteIndex = function(faceGroup) {
   let numberOfTriangles = 0;
   for (let polygon of faceGroup) {
      numberOfTriangles += polygon.numberOfVertex;
   }
   if (this.hilite.numberOfTriangles < numberOfTriangles) {
      this.hilite.numberOfTriangles = numberOfTriangles;
      this.hilite.index = new Uint32Array(this.hilite.numberOfTriangles*3);
   }
   this.hilite.indexLength = 0;
   for (let polygon of faceGroup) {
      this._computeFaceHiliteIndex(polygon, this.hilite.indexLength);
   }
};


DraftBench.prototype._resizePreviewVertex = function() {
   const oldSize = this.lastPreviewSize.vertices;
   const length = this.vertices.length;
   const size = length - oldSize;
   if (size > 0) {
      const preview = this.preview.vertex;
      const color = new Float32Array(length);
      if (oldSize > 0) {
         color.set(preview.color);
      }
      color.fill(0.0, oldSize);
      preview.color = color;
      //this.preview.vertex.isModified = true;
      this.preview.vertex.isAltered = true;
      // 
      this.preview.shaderData.resizeAttribute('vertexState', length*4);
      this.preview.shaderData.uploadAttribute('vertexState', 0, preview.color);
   }

};


DraftBench.prototype._updatePreviewSize = function() {
   this.lastPreviewSize.vertices = this.vertices.length;
   this.lastPreviewSize.edges = this.edges.length;
   this.lastPreviewSize.faces = this.faces.length;
};


DraftBench.prototype._updateAffected = function(affected) {
   if (affected.vertices.size > 0) {
      for (let vertex of affected.vertices) {
         this._updateVertex(vertex, affected);
      }
   }
   if (affected.faces.size > 0) {
      for (let face of affected.faces) {
         this._updatePreviewFace(face);
      }
      // update index

   }

   this.clearAffected();
};

DraftBench.prototype._updateVertex = function(vertex, affected) {
   if (vertex.isLive()) {
      // first the simple case, update the vertexPreview,
      this.preview.shaderData.uploadAttribute('position', vertex.vertex.byteOffset, vertex.vertex);
   }
};

DraftBench.prototype._updatePreviewFace = function(polygon) {
   // recompute boundingSphere centroid, and if numberOfVertex changed, needs to recompute index.
   if ((polygon.index < this.boundingSpheres.length) && polygon.isLive()) { // will be get recompute on resize
      polygon.update();
      const sphere = this.boundingSpheres[ polygon.index ];
      sphere.setSphere( __WEBPACK_IMPORTED_MODULE_3__wings3d_boundingvolume__["BoundingSphere"].computeSphere(sphere.polygon, sphere.center) ); 
      // update center
      const index = this.vertices.length+polygon.index;
      this.preview.shaderData.uploadAttribute('position', index*3*4, sphere.center);
   }
};



DraftBench.prototype.hiliteFace = function(polygon, isHilite) {
   if (isHilite) {   // show
      this.hilite.color = DraftBench.theme.unselectedHilite;
      if ((this.preview.selected[polygon.index] & 1) === 1) {
         this.hilite.color = DraftBench.theme.selectedHilite;
      }
      this.preview.selected[polygon.index] |= 2;
      this._computeFaceHiliteIndex(polygon);
   } else { // hide
      this.hilite.indexLength = 0;
      this.preview.selected[polygon.index] &= ~2;
   }
};

DraftBench.prototype.hiliteBody = function(faceGroup, isHilite) {
   if (isHilite) { // show
      let checkColor = true;
      this.hilite.color = DraftBench.theme.unselectedHilite;
      for (let polygon of faceGroup) {
         if (checkColor && ((this.preview.selected[polygon.index] & 1) === 1)) {
            this.hilite.color = DraftBench.theme.selectedHilite;  // unnecessary assignment
            checkColor = false;
         }
         this.preview.selected[polygon.index] |= 2;
      }
      this._computeGroupHiliteIndex(faceGroup);
   } else { // hide 
      this.hilite.indexLength = 0;
      for (let polygon of faceGroup) { // clear flag
         this.preview.selected[polygon.index] &= ~2;
      }
   }
};


/**
 * polygon drawing routines. draw selected polygon first then draw unselected one. 
 * 
 * @param {gl} - drawing context.
 */
DraftBench.prototype.draw = function(gl, madsor) {
   // draw selected polygon first if application
   // first check index modification
   if (this.preview.isAltered) {
      const selection = new Uint32Array(this.preview.selectedCount);
      let k = 0;
      const index = new Uint32Array(this.preview.indexLength-this.preview.selectedCount);
      let j = 0;
      for (let cage of madsor.visibleWireCage(false)) {  // wire only cage was drawn before.
         for (let polygon of cage.geometry.faces) {
            if (polygon.isVisible()) {
               const i = polygon.index;
               const center = i + this.vertices.length;
               if (this.preview.selected[i] & 1) {
                  k = polygon.buildIndex(selection, k, center);
               } else {
                  j = polygon.buildIndex(index, j, center);
               }
            }
         }
      }
      this.preview.realSelectedCount = k;
      this.preview.realIndexLength = j+k;
      this.preview.shaderData.setIndex('face', index);
      this.preview.shaderData.setIndex('selectedFace', selection);
      this.preview.isAltered = false;
   }
   
   // draw faceSelected if not empty
   let bindPosition = false;
   if (this.preview.realSelectedCount > 0) {
      gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
      this.preview.shaderData.setUniform4fv('color', DraftBench.theme.edgeColor);
      this.preview.shaderData.setUniform1f('lineWidth', DraftBench.pref.edgeWidth);
      bindPosition = true;
      this.preview.shaderData.setUniform4fv('faceColor', DraftBench.theme.selectedColor);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'selectedFace');
      gl.drawElements(gl.TRIANGLES, this.preview.realSelectedCount, gl.UNSIGNED_INT, 0);
   }
   const indexLength = this.preview.realIndexLength - this.preview.realSelectedCount;
   if (indexLength > 0) {  // draw normal polygon
      if (!bindPosition) {
         gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
         this.preview.shaderData.setUniform4fv('color', DraftBench.theme.edgeColor);
         this.preview.shaderData.setUniform1f('lineWidth', DraftBench.pref.edgeWidth);
         bindPosition = true;
      }
      this.preview.shaderData.setUniform4fv('faceColor', DraftBench.theme.faceColor);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'face');
      gl.drawElements(gl.TRIANGLES, indexLength, gl.UNSIGNED_INT, 0);
   }
};


// draw hilite polygon. not offset
DraftBench.prototype.drawHilite = function(gl) {
   if (this.hilite.indexLength == 0) {
      return;
   }
   try {
      // set hilite color and hilite index
      this.preview.shaderData.setUniform4fv("faceColor", this.hilite.color);
      gl.bindAttribute(this.preview.shaderData, ['position']);
      gl.bindUniform(this.preview.shaderData, ['faceColor']);
      gl.bindIndex(this.preview.shaderData, 'faceHilite');
      gl.drawElements(gl.TRIANGLES, this.hilite.indexLength, gl.UNSIGNED_INT, 0);
      // restore color
      this.preview.shaderData.setUniform4fv("faceColor", DraftBench.theme.faceColor);
   } catch (e) {
      console.log(e);
   }
};

// draw vertex, select color, 
DraftBench.prototype.drawVertex = function(gl, madsor) {
   // drawing using vertex array
   try {
      if (this.preview.vertex.isModified) {  // upload min  - max
         this.preview.vertex.isModified = false;
         if (this.preview.vertex.min <= this.preview.vertex.max) {
            const i = this.preview.vertex.min;
            const j = this.preview.vertex.max;
            const points = this.preview.vertex.color.subarray(i, j+1);
            this.preview.shaderData.uploadAttribute('vertexState', i*Float32Array.BYTES_PER_ELEMENT, points);
            this.preview.vertex.max = -1;
            this.preview.vertex.min = Number.MAX_SAFE_INTEGER;
         }
      }
      // rebuild index.
      if (this.preview.vertex.isAltered) {
         const length = this.vertices.length;
         const index = new Uint32Array(length);
         let j = 0;
         for (let cage of madsor.visibleCage()) {
            for (let vertex of cage.geometry.vertices) {
               index[j++] = vertex.index;
            }
         }
         this.preview.shaderData.setIndex('vertex', index);
         this.preview.vertex.indexLength = j;
      }
      // 
      gl.bindAttribute(this.preview.shaderData, ['position', 'vertexState']);
      gl.bindUniform(this.preview.shaderData, ['vertexSize', 'selectedVertexSize', 'maskedVertexSize',
                                               'vertexColor', 'selectedColor', 'unselectedHilite', 'selectedHilite', 'maskedVertexColor']);
      gl.bindIndex(this.preview.shaderData, 'vertex');
      gl.drawElements(gl.POINTS, this.preview.vertex.indexLength, gl.UNSIGNED_INT, 0);
   } catch (e) {
      console.log(e);
   }
};

/**
 * 
 */
DraftBench.prototype.drawHardEdgeEtc = function(gl, isEdgeMode, madsor) {
   let isBinded = false;
   // draw hard edge if applicable.
   if (this.preview.edge.hardness.indexCount > 0) {
      if (this.preview.edge.hardness.isAltered) {
         const index = new Uint32Array(this.preview.edge.hardness.indexCount);
         let j = 0;
         for (let cage of madsor.visibleCage()) {
            for (let wEdge of cage.geometry.edges) {
               if (wEdge.state & 4) {  // yes, hardEdge
                  j = wEdge.buildIndex(index, j, this.vertices.length);
               }
            }
         }
         this.preview.shaderData.setIndex('hardEdge', index);
         this.preview.edge.hardness.realIndexCount = j;
         this.preview.edge.hardness.isAltered = false;
      }
      if (this.preview.edge.hardness.realIndexCount > 0) {
      isBinded = true;
      // draw HardEdge
      gl.useShader(__WEBPACK_IMPORTED_MODULE_1__wings3d_shaderprog__["selectedColorLine"]);
      gl.bindTransform();
      gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
      let lineWidth = DraftBench.CONST.EDGEWIDTH;
      if (isEdgeMode) {
         lineWidth = DraftBench.pref.hardEdgeWidth;
      }
      this.preview.shaderData.setUniform1f("lineWidth", lineWidth);
      this.preview.shaderData.setUniform4fv("color", DraftBench.theme.hardEdgeColor);
      this.preview.shaderData.setUniform4fv('faceColor', DraftBench.theme.faceColor);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'hardEdge');
      gl.drawElements(gl.TRIANGLES, this.preview.edge.hardness.realIndexCount, gl.UNSIGNED_INT, 0);  // draw 1 line.
      }
   }
   // recompute wireMode edge index if applicable
   if (this.preview.edge.wireOnly.isAltered) {
      let indexCount = 0 ;
      for (let cage of madsor.visibleWireCage(true)) { // looking for wireMode cage only
         indexCount += cage.geometry.edges.size;
      }
      this.preview.edge.wireOnly.indexCount = indexCount * 6;  // draw 2 triangle for each edge.
      if (indexCount > 0) {
         // now compute the wireOnly polygon
         const index = new Uint32Array(this.preview.edge.wireOnly.indexCount);
         let j = 0;
         for (let cage of madsor.visibleWireCage(true)) {
            for (let wEdge of cage.geometry.edges) {
               if (wEdge.state === 0) {  // we only draw normal edge
                  j = wEdge.buildIndex(index, j, this.vertices.length);
               }
            }
         }
         // wireOnly Edge
         this.preview.shaderData.setIndex('wireEdge', index);
         this.preview.edge.wireOnly.indexCount = j;
      }
      this.preview.edge.wireOnly.isAltered = false;
   }
   // draw wireMode edge if applicable
   if (this.preview.edge.wireOnly.indexCount > 0) {
      if (!isBinded) {  // bind program and data
         gl.useShader(__WEBPACK_IMPORTED_MODULE_1__wings3d_shaderprog__["selectedColorLine"]);
         gl.bindTransform();
         gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
         this.preview.shaderData.setUniform4fv('faceColor', DraftBench.theme.faceColor);
      }
      this.preview.shaderData.setUniform4fv("color", DraftBench.theme.edgeColor);
      this.preview.shaderData.setUniform1f("lineWidth", DraftBench.CONST.EDGEWIDTH);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'wireEdge');
      gl.drawElements(gl.TRIANGLES, this.preview.edge.wireOnly.indexCount, gl.UNSIGNED_INT, 0);  // draw 1 line.
   }
}

/** 
 * draw select, hilite, and (normal) edge
 * @param {gl} - drawing context
 */
DraftBench.prototype.drawEdge = function(gl, madsor) {
   gl.bindAttribute(this.preview.shaderData, ['position', 'barycentric']);
   this.preview.shaderData.setUniform1f("lineWidth", DraftBench.pref.selectedEdgeWidth);

   // draw hilite first
   if (this.preview.edge.hilite.wEdge) {
      let hiliteColor = DraftBench.theme.unselectedHilite;
      const wEdge = this.preview.edge.hilite.wEdge;
      if (wEdge.state & 1) { // selected?
         hiliteColor = DraftBench.theme.selectedHilite;
      }
      this.preview.shaderData.setUniform4fv("color", hiliteColor);
      gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
      gl.bindIndex(this.preview.shaderData, 'edgeHilite');
      gl.drawElements(gl.TRIANGLES, this.preview.edge.hilite.indexCount, gl.UNSIGNED_INT, 0);  // draw 1 line.
   }

   // 2nd) draw selected
   if (this.preview.edge.indexCount > 0) { // draw selected edge
      if (this.preview.edge.isAltered) {  // rebuild selected index, might as well rebuilt hardEdge.
         const selected = new Uint32Array( this.preview.edge.indexCount );
         const hard = new Uint32Array( this.preview.edge.hardness.indexCount );
         let j = 0;
         let k = 0;
         for (let cage of madsor.visibleCage()) {
            for (let wEdge of cage.geometry.edges) {
               if (wEdge.state & 1) {   // selected, draw both side
                  j = wEdge.buildIndex(selected, j, this.vertices.length);
               } else if (wEdge.state & 4) { // might as well check for hardEdge simultaneously
                  k = wEdge.buildIndex(hard, k, this.vertices.length);
               }
            }
         }
         // set the new selected.
         this.preview.shaderData.setIndex('edgeSelected', selected);
         this.preview.edge.realIndexCount = j;
         this.preview.edge.isAltered = false;
         if (this.preview.edge.hardness.isAltered) {
            this.preview.shaderData.setIndex('hardEdge', hard);
            this.preview.edge.hardness.realIndexCount = k;
            this.preview.edge.hardness.isAltered = false;
         }
      }
      // now draw
      if (this.preview.edge.realIndexCount > 0) {
         this.preview.shaderData.setUniform4fv('color', DraftBench.theme.selectedColor);
         gl.bindUniform(this.preview.shaderData, ['color', 'faceColor', 'lineWidth']);
         gl.bindIndex(this.preview.shaderData, 'edgeSelected');
         gl.drawElements(gl.TRIANGLES, this.preview.edge.realIndexCount, gl.UNSIGNED_INT, 0);  // draw selected lines
      }
   }
};

DraftBench.prototype.drawPlane = (function() {
   const diagonal = vec3.create();   // a diagonal [1,0,1] normalize vector
   const up = vec3.fromValues(0, 1, 0);
   const rotate = quat.create();
   const transform = mat4.create();
   const halfSize = vec3.create();
   
   return function(gl, plane) {   // the real function
      vec3.copy(halfSize, plane.halfSize);
      vec3.normalize(halfSize, halfSize);
      vec3.cross(diagonal, halfSize, up);
      vec3.normalize(diagonal, diagonal);
      // find rotation between planeNormal and Axis alignment
      quat.rotationTo(rotate, diagonal, plane.normal);//, diagonal);
      mat4.fromQuat(transform, rotate);
      //vec3.transformMat4(halfSize, plane.halfSize, transform);
      vec3.copy(halfSize, plane.halfSize);
      // setup halfSize, 
      vec3.negate(this.previewPlane.pts[0], halfSize);
      let pt = this.previewPlane.pts[1];
      pt[0] = halfSize[0];
      pt[1] = -halfSize[1];
      pt[2] = halfSize[2];
      vec3.copy(this.previewPlane.pts[2], halfSize);
      vec3.negate(this.previewPlane.pts[3], pt);
      // update position.
      for (let i = 0; i < 4; ++i) {
         const pt = this.previewPlane.pts[i];
         vec3.transformMat4(pt, pt, transform);
         vec3.add(pt, plane.center, pt);
      }
      // upload result
      this.previewPlane.shaderData.uploadAttribute('position', 0, this.previewPlane.rectangle);
      if (plane.hilite) {  // set color
         this.previewPlane.shaderData.setUniform4fv("faceColor", [0.0, 1.0, 0.0, 1.0]);
      } else {
         this.previewPlane.shaderData.setUniform4fv("faceColor", [0.1, 0.1, 0.1, 1.0]);
      }
      // draw the rectangle plane
      gl.disable(gl.CULL_FACE);
      gl.useShader(__WEBPACK_IMPORTED_MODULE_1__wings3d_shaderprog__["solidColor"]);
      gl.bindTransform();
      gl.bindAttribute(this.previewPlane.shaderData, ['position']);
      gl.bindUniform(this.previewPlane.shaderData, ['faceColor']);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      gl.disableShader();
      gl.enable(gl.CULL_FACE);
   };
})();


DraftBench.prototype.selectGroup = function(selection, isOn) {
   for (let polygon of selection) {
      this.selectFace(polygon, isOn);
   }
};


DraftBench.prototype.resetBody = function(bodyGroup) {
   this.selectGroup(bodyGroup, false);    // turn group off.
};



DraftBench.prototype.hiliteVertex = function(vertex, show) {
   // select polygon set color,
   if (show) {
      this.setVertexColor(vertex, 0.5);
   } else {
      this.setVertexColor(vertex, -0.5);
   }
};

DraftBench.prototype.setVertexColor = function(vertex, color) {
   // selected color
   const j = vertex.index;  
   this.preview.vertex.color[j] += color;
      if (j < this.preview.vertex.min) {
         this.preview.vertex.min = j;
      }
      if (j > this.preview.vertex.max) {
         this.preview.vertex.max = j;
      }
      this.preview.vertex.isModified = true;
      //this.preview.vertex.min = this.preview.vertex.max = j;
};

DraftBench.prototype.resetSelectVertex = function() {
   // zeroout the edge seleciton.
   this.preview.vertex.isModified = false;
   this.preview.vertex.color.fill(0.0);
   this.preview.shaderData.uploadAttribute('vertexState', 0, this.preview.vertex.color);
};

DraftBench.prototype.hiliteEdge = function(hEdge, onOff) {
   // select polygon set color,
   if (onOff) {
      const wEdge = hEdge.wingedEdge;
      this.preview.edge.hilite.wEdge = wEdge;
      const index = new Uint32Array( 6 ); // both edge. max 2 triangle.
      wEdge.buildIndex(index, 0, this.vertices.length);
      this.preview.shaderData.setIndex('edgeHilite', index);   // update index.
      this.preview.edge.hilite.indexCount = 6;
   } else {
      this.preview.edge.hilite.wEdge = null;
      this.preview.edge.hilite.indexCount = 0;
   }
}

/**
 * toggle selection of wEdge
 * @param {WingedEdge} wEdge - target wEdge
 * @param {boolean} onOff - on/off toggle.
 */
DraftBench.prototype.selectEdge = function(wEdge, onOff) {
   if (onOff) {
      if ((wEdge.state & 1) === 0) {
         wEdge.state |= 1;
         this.preview.edge.indexCount += 6;
      }
   } else {
      if ((wEdge.state & 1) === 1) {
         wEdge.state &= ~1;
         this.preview.edge.indexCount -= 6;
      }
   }
   this.preview.edge.isAltered = true;
};


DraftBench.prototype.resetSelectEdge = function() {
   // zeroout the edge seleciton.
   for (let wEdge of this.edges) {
      wEdge.state = 0;
   }
   this.preview.edge.isAltered = false;
   this.preview.edge.indexCount = 0;
};


DraftBench.prototype.updateCentroid = function(snapshot) {
   // done, update shader data, should we update each vertex individually?
   const centroids = this.preview.centroid.buf.data.subarray(0, this.preview.centroid.buf.len)
   this.preview.shaderData.uploadAttribute('position', this.buf.len*4, centroids);
};


DraftBench.prototype.updatePosition = function() {
   // todo: we really should update as little as possible.
   const vertices = this.buf.data.subarray(0, this.buf.len);
   this.preview.shaderData.uploadAttribute('position', 0, vertices);
};


DraftBench.prototype.selectFace = function(polygon, toggleOn) {
   if (toggleOn) {
      if ((this.preview.selected[polygon.index] & 1) === 0) {
         this.preview.selectedCount += polygon.numberOfVertex * 3;
         this.preview.selected[polygon.index] |= 1;
         this.preview.isAltered = true;
         if (this.preview.selected[polygon.index] & 2) { // now we are both hilite and selected
            this.hilite.color = DraftBench.theme.selectedHilite;
         }
      }
   } else {
      if ((this.preview.selected[polygon.index] & 1) === 1) {
         this.preview.selectedCount -= polygon.numberOfVertex * 3;
         this.preview.selected[polygon.index] &= ~1;
         this.preview.isAltered = true;
         if (this.preview.selected[polygon.index] & 2) { // now we are both hilite and unselected
            this.hilite.color = DraftBench.theme.unselectedHilite;
         }
      }
   }
};

DraftBench.prototype.resetSelectFace = function() {
   this.preview.selected.fill(0);            // reset all polygon to non-selected 
   this.preview.selectedCount = 0;
   this.preview.realSelectedCount = 0;
   this.preview.isAltered = true;
};


/**
 * set bitmask on 3rd position. off meant soft, on meant hard
 * @param {WingedEdge} wEdge - target edge
 * @param {number} operand - 0=soft, 1=hard, 2=invert.
 */
DraftBench.prototype.setHardness = function(wEdge, operand) {
   if (operand === 0)  {   // set soft
      if (wEdge.state & 4) { // make sure it hard
         wEdge.state &= ~4;  // clear hardness bit
         this.preview.edge.hardness.isAltered = true;
         this.preview.edge.hardness.indexCount -= 6;
         return true;
      }
   } else if (operand === 1) {   // set hard
      if ((wEdge.state & 4) === 0) { // make sure it soft
         wEdge.state |= 4;   // set hardness bit
         this.preview.edge.hardness.isAltered = true;
         this.preview.edge.hardness.indexCount += 6;
         return true;
      }
   } else { // invert
      if (wEdge.state & 4) { // it hard, turn to soft
         return this.setHardness(wEdge, 0);
      } else { // wEdge is soft turn to hard
         return this.setHardness(wEdge, 1);
      }
   }
   return false;
};


class CheckPoint extends __WEBPACK_IMPORTED_MODULE_5__wings3d_undo__["EditCommand"] { // do we really needs to inherited form EditCommand?
   CheckPoint(draftBench, editCommand) {
      this.command = editCommand;
      this.draftBench = draftBench;
      // map the (vertices, edges, faces) value.
      this.vertices = [];
      for (let vertex of draftBench.vertices) {
         // outEdge index, need real pt?
         if (vertex.isLive()) {
            this.vertices.push( vertex.outEdge.wingedEdge.index );
         } else {
            this.vertices.push( -1 );
         }
      }
      this.edges = [];
      for (let wEdge of draftBench.edges) {
         // left->next index, right->next index, origin index, dest index.
         if (wEdge.isLive()) {
            this.edges.push( wEdge.left.next.index, wEdge.right.next.index, wEdge.left.origin.index, wEdge.right.origin.index);
         } else {
            this.edges.push( -1, -1, -1, -1 );
         }
      }
      this.faces = [];
      for (let polygon of draftBench.faces) {
         // halfEdge index.
         if (polygon.isLive()) {
            this.faces.push( polygon.halfEdge.index );
         } else {
            this.faces.push( -1 );
         }
      }
   }

   doIt() {
      return this.command.doIt();
   }

   undo() {
      this.command.undo();
      // now check draftBench and our saved value.
      // use index because draftBench could have more faces(all dead) than our Saved one due to expansion.
      for (let i = 0; i < this.faces.length; ++i) {   // check polygon first, most like to have problems
         const polygon = this.draftBench.faces[i];
         if (polygon.isLive()) {
            if (polygon.halfEdge.index != this.faces[i]) {
               geometryStatus("CheckPoint failed. non matching polygon halfEdge");
               return;
            }
         } else {
            if (this.faces[i] != -1) {
               geometryStatus("CheckPoint failed. extra face");
               return
            }
         }
      }
      for (let i = 0; i < this.vertices.lenth; ++i ) {   // check vertex next because of simplicity.
         const vertex = this.draftBench.vertices[i];
         if (vertex.isLive()) {
            if (vertex.outEdge.wingedEdge.index != this.vertices[i]) {
               geometryStatus("CheckPoint failed. non-matching vertex outEdge");
               return;
            }
         } else {
            if (this.vertices[i] != -1) {
               geometryStatus("CheckPoint failed. extra vertex");
               return;
            }
         }
      }
      // check edges
      for (let i = 0; i < this.edges.length; i+=4) {
         const wEdge = this.draftBench.edges[i];
         if (wEdge.isAlive()) {
            if (wEdge.left.next.index != this.edges[i] || wEdge.right.next.index != [i+1] ||
                 wEdge.left.origin.index != this.edges[i+2] || wEdge.right.origin.index != this.edges[i+3]) {
               geometryStatus("CheckPoint failed. non matching wEdge");
               return;
            }
         } else {
            if (this.edges[i] != -1) {
               geometryStatus("CheckPoint failed. extra wEdge");
               return;
            }
         }
      }
   }
};




/***/ }),
/* 24 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTreeView", function() { return getTreeView; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_view__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__ = __webpack_require__(2);
/**

*/





//---- utility function
function editable(_ev) {
   this.contentEditable = true;
   this.focus();
};
function unEditable(_ev) {
   this.contentEditable = false;
};

/** 
 * tree view
*/
class TreeView {
   constructor(treeView) {
      this.treeView = treeView;
      this.tree = {};
   }

   /**
    * 
    * @param {string} name - folderName <- todo: later to be replace by TransformGroup. 
    */
   createFolder(name) {
      const li = document.createElement('li');

      return li;
   }

   /**
    * 
    * @param {folderObj} parent - 
    * @param {folderObj} folder - 
    */
   addFolder(parent, folder) {   //

   }

   /**
    * add previewCage to be displayed in TreeView
    * @param {PreviewCage} model -target 
    */
   addObject(model) {
      let li = model.guiStatus.li;
      if (!li) {
         li = document.createElement('li');
         model.guiStatus.li = li;
         li.classList.add('objectName');
         // select whole object
         const whole = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_whole.png\');"></span></label>');
         let input = whole.querySelector('input');
         input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
            if (model.isLock() || !model.isVisible()) {   // not actually changeable
               ev.target.checked = !ev.target.checked;
               return;
            }
            __WEBPACK_IMPORTED_MODULE_0__wings3d_view__["setObject"]([model]);
            __WEBPACK_IMPORTED_MODULE_1__wings3d__["runAction"](0, "toggleObjectSelect", ev);
          });
         model.guiStatus.select = input;
         li.appendChild(whole);
         // span text
         const text = document.createElement('span');
         text.textContent = model.name;
         model.guiStatus.textNode = text;
         text.addEventListener('dblclick', editable);
         text.addEventListener('blur', unEditable);
         text.addEventListener('contextmenu', function(ev) {
            ev.preventDefault();
            let contextMenu = document.querySelector('#geometryGraphText');
            if (contextMenu) {
               __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["positionDom"](contextMenu, __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["getPosition"](ev));
               __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["showContextMenu"](contextMenu);
               __WEBPACK_IMPORTED_MODULE_0__wings3d_view__["setObject"]([model]);
            }
          }, false);
         li.appendChild(text);
         // eye label
         const eyeLabel = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_show.png\');"></span></label>');
         input = eyeLabel.querySelector('input');
         input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
            if (model.isLock()) {   // non modifiable object
               ev.target.checked = !ev.target.checked;
               return;
            }
            __WEBPACK_IMPORTED_MODULE_0__wings3d_view__["setObject"]([model]);
            __WEBPACK_IMPORTED_MODULE_1__wings3d__["runAction"](0, "toggleObjectVisibility", ev);   
          });
         model.guiStatus.visibility = input;
         li.appendChild(eyeLabel);
         // lock/unlock
         const lockLabel = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_unlock.png\');"></span></label>');
         input = lockLabel.querySelector('input');
         input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
            __WEBPACK_IMPORTED_MODULE_0__wings3d_view__["setObject"]([model]);
            __WEBPACK_IMPORTED_MODULE_1__wings3d__["runAction"](0, "toggleObjectLock", ev);
          });
         li.appendChild(lockLabel);
         model.guiStatus.locked = input;
         // wireframe
         const wireframe = document.createRange().createContextualFragment('<label><input type="checkbox"><span class="smallIcon" style="background-image: url(\'../img/bluecube/small_wire.png\');"></span></label>');
         input = wireframe.querySelector('input');
         input.addEventListener('change', (ev)=> {  // whole is fragment. we want label.
            __WEBPACK_IMPORTED_MODULE_0__wings3d_view__["setObject"]([model]);
            __WEBPACK_IMPORTED_MODULE_1__wings3d__["runAction"](0, "toggleWireMode", ev);
          });
         li.appendChild(wireframe);
      }
      this.treeView.appendChild(li);
   }

   /**
    * remove PreviewCage from TreeView
    * @param {PreviewCage} model - the previewCage to be removed from 
    */
   removeObject(model) {
      const li = model.guiStatus.li;
      li.parentNode.removeChild(li);
      //model._textNode = undefined;
   }

}

function getTreeView(id) {
   const treeView = document.querySelector(id); // get <ul>
   if (treeView) {
      return new TreeView(treeView);
   }
   // console log error
   return null;
};



/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(26);
__webpack_require__(14);
__webpack_require__(13);
__webpack_require__(15);
__webpack_require__(23);
__webpack_require__(11);
__webpack_require__(10);
__webpack_require__(5);
__webpack_require__(36);
__webpack_require__(16);
__webpack_require__(17);
__webpack_require__(21);
__webpack_require__(18);
__webpack_require__(8);
__webpack_require__(3);
__webpack_require__(22);
__webpack_require__(19);
__webpack_require__(6);
__webpack_require__(37);
__webpack_require__(38);
__webpack_require__(2);
__webpack_require__(24);
__webpack_require__(4);
__webpack_require__(7);
__webpack_require__(12);
__webpack_require__(1);
__webpack_require__(9);
module.exports = __webpack_require__(0);


/***/ }),
/* 26 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__css_default_css__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__css_default_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__css_default_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__css_menu_css__ = __webpack_require__(28);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__css_menu_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__css_menu_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__css_button_css__ = __webpack_require__(29);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__css_button_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__css_button_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__css_form_css__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__css_form_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__css_form_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__css_bubble_css__ = __webpack_require__(31);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__css_bubble_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__css_bubble_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__css_sidebar_css__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__css_sidebar_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5__css_sidebar_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_view__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__wings3d_camera__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__wings3d_interact__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__wings3d__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__wings3d_ui__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__wings3d_i18n__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__js_plugins_cubeshape_js__ = __webpack_require__(35);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__js_plugins_wavefront_obj_js__ = __webpack_require__(20);
// app.js
//  for bundling and initialization
//

// import css, should bundle it to a different files.







// import js







// plugins




__WEBPACK_IMPORTED_MODULE_9__wings3d__["start"]('glcanvas');

/***/ }),
/* 27 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 28 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 29 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 30 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 31 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 32 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

var indexOf = __webpack_require__(34);

var Object_keys = function (obj) {
    if (Object.keys) return Object.keys(obj)
    else {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    }
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

var defineProp = (function() {
    try {
        Object.defineProperty({}, '_', {});
        return function(obj, name, value) {
            Object.defineProperty(obj, name, {
                writable: true,
                enumerable: false,
                configurable: true,
                value: value
            })
        };
    } catch(e) {
        return function(obj, name, value) {
            obj[name] = value;
        };
    }
}());

var globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'];

function Context() {}
Context.prototype = {};

var Script = exports.Script = function NodeScript (code) {
    if (!(this instanceof Script)) return new Script(code);
    this.code = code;
};

Script.prototype.runInContext = function (context) {
    if (!(context instanceof Context)) {
        throw new TypeError("needs a 'context' argument.");
    }
    
    var iframe = document.createElement('iframe');
    if (!iframe.style) iframe.style = {};
    iframe.style.display = 'none';
    
    document.body.appendChild(iframe);
    
    var win = iframe.contentWindow;
    var wEval = win.eval, wExecScript = win.execScript;

    if (!wEval && wExecScript) {
        // win.eval() magically appears when this is called in IE:
        wExecScript.call(win, 'null');
        wEval = win.eval;
    }
    
    forEach(Object_keys(context), function (key) {
        win[key] = context[key];
    });
    forEach(globals, function (key) {
        if (context[key]) {
            win[key] = context[key];
        }
    });
    
    var winKeys = Object_keys(win);

    var res = wEval.call(win, this.code);
    
    forEach(Object_keys(win), function (key) {
        // Avoid copying circular objects like `top` and `window` by only
        // updating existing context properties or new properties in the `win`
        // that was only introduced after the eval.
        if (key in context || indexOf(winKeys, key) === -1) {
            context[key] = win[key];
        }
    });

    forEach(globals, function (key) {
        if (!(key in context)) {
            defineProp(context, key, win[key]);
        }
    });
    
    document.body.removeChild(iframe);
    
    return res;
};

Script.prototype.runInThisContext = function () {
    return eval(this.code); // maybe...
};

Script.prototype.runInNewContext = function (context) {
    var ctx = Script.createContext(context);
    var res = this.runInContext(ctx);

    forEach(Object_keys(ctx), function (key) {
        context[key] = ctx[key];
    });

    return res;
};

forEach(Object_keys(Script.prototype), function (name) {
    exports[name] = Script[name] = function (code) {
        var s = Script(code);
        return s[name].apply(s, [].slice.call(arguments, 1));
    };
});

exports.createScript = function (code) {
    return exports.Script(code);
};

exports.createContext = Script.createContext = function (context) {
    var copy = new Context();
    if(typeof context === 'object') {
        forEach(Object_keys(context), function (key) {
            copy[key] = context[key];
        });
    }
    return copy;
};


/***/ }),
/* 34 */
/***/ (function(module, exports) {


var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};

/***/ }),
/* 35 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export createCube */
/* unused harmony export createCubeDialog */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_view__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_wingededge__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_model__ = __webpack_require__(3);
/*
   n cube create. Use Dialog to create the cube.
   todo: to support spherize, rotate, translate, putOnGround. currently only numberOfCuts and size is working.
*/







let createCube, createCubeDialog;
document.addEventListener('DOMContentLoaded', function() {
   var _pvt = {previewCage: null};
   _pvt.cubeParams = { numberOfCut: 1,
                       spherize: false,
                       size: {x: 2.0, y: 2.0, z: 2.0},
                       rotate: {x: 0.0, y: 0.0, z: 0.0},
                       translate: {x: 0.0, y: 0.0, z: 0.0},
                       putOnGround: false,

   };
   _pvt.creationCount = 0;

   _pvt.resetCubeParams = function() {
      // reset.cubeParams.
      _pvt.cubeParams.numberOfCut = 1;
      _pvt.cubeParams.spherize = false;
      _pvt.cubeParams.size.x = _pvt.cubeParams.size.y = _pvt.cubeParams.size.z = 2.0;
      _pvt.cubeParams.rotate.x = _pvt.cubeParams.rotate.y = _pvt.cubeParams.rotate.z = 0.0;
      _pvt.cubeParams.translate.x = _pvt.cubeParams.translate.y = _pvt.cubeParams.translate.z = 0.0;    
      _pvt.cubeParams.putOnGround = false;
   };

   _pvt.cancelPreview = function() {
      if (_pvt.previewCage !== null) {
         // remove it from world.
         __WEBPACK_IMPORTED_MODULE_2__wings3d_view__["removeFromWorld"](_pvt.previewCage);
         _pvt.previewCage.freeBuffer();
         _pvt.previewCage = null;
      } 
   };

   _pvt.updatePreview = function() {
      if (_pvt.previewCage !== null) {
         // remove it from world.
         __WEBPACK_IMPORTED_MODULE_2__wings3d_view__["removeFromWorld"](_pvt.previewCage);
         _pvt.previewCage.freeBuffer();
         _pvt.previewCage = null;
      }
      createCube(_pvt.cubeParams.size, _pvt.cubeParams.numberOfCut, _pvt.cubeParams.translate, _pvt.cubeParams.rotate, _pvt.cubeParams.putOnGround);
   };

   createCube = function(size, numberOfCut, translate, rotate, onGround) {
      // create, one 
      let preview = __WEBPACK_IMPORTED_MODULE_2__wings3d_view__["putIntoWorld"]();    //new WingedTopology; create WingedTopology(PreviewCage) and putIntoWorld.
      let mesh = preview.geometry;
      var map = {};
      function addVertexUnique(pt) {
         var x = pt[0], y = pt[1], z = pt[2];
         var key = x.toFixed(6) + "," + y.toFixed(6) + "," + z.toFixed(6); // convert to fixed decimal, so no needs for (x-x1<epsilon)
         if (!map.hasOwnProperty(key)) {
            map[key] = mesh.addVertex(pt);
         }
         return map[key].index;
      }
      function makeFaces(getVertexFN) {
         var offset = 0;
         var vertexIndex = [];
         var polygon = [];
         for (let up = 0; up <= numberOfCut; ++up) {
            for (let rt = 0; rt <= numberOfCut; ++rt) { // add vertex and get vertices index.
               vertexIndex.push( addVertexUnique(getVertexFN(up, rt)) );
            }
            if (up > 0) {   // add polygon faces, ccw order
               for (let i = 0 ; i<numberOfCut; ++i) {
                  polygon.push( vertexIndex[offset+i] );
                  polygon.push( vertexIndex[offset+i+1] );
                  polygon.push( vertexIndex[offset+i+1+numberOfCut+1] );
                  polygon.push( vertexIndex[offset+i+numberOfCut+1] );
                  mesh.addPolygon(polygon);
                  polygon.length = 0;
               }
               offset += numberOfCut+1;  // done, add offset 
            }
         }
      }
      // get rotation
      let angleQ = quat.create();
      quat.fromEuler(angleQ, rotate.x, rotate.y, rotate.z);
      const rotateM3 = mat3.create();
      mat3.fromQuat(rotateM3, angleQ);

      // setup start, end
      const org = vec3.fromValues( -(size.x / 2.0), -(size.y / 2.0), -(size.z / 2.0));
      const offset = vec3.fromValues(translate.x, translate.y, translate.z);
      if (onGround) {
         offset[1] = -org[1];
      }
      const x = vec3.fromValues(size.x, 0.0, 0.0);
      const y = vec3.fromValues(0.0, size.y, 0.0);
      const z = vec3.fromValues(0.0, 0.0, size.z);
      vec3.transformMat3(org, org, rotateM3);
      vec3.transformMat3(x, x, rotateM3);
      vec3.transformMat3(y, y, rotateM3);
      vec3.transformMat3(z, z, rotateM3);
      const dest = vec3.create();

      // creating step size for each cut
      const stepX = [], stepY = [], stepZ = [];
      for (let i = 0; i <= numberOfCut; ++i) {
         const cut = i / numberOfCut;
         const xStep = vec3.create();
         vec3.scale(xStep, x, cut);
         stepX.push( xStep );
         const yStep = vec3.create();
         vec3.scale(yStep, y, cut);
         stepY.push( yStep );
         const zStep = vec3.create();
         vec3.scale(zStep, z, cut);
         stepZ.push( zStep );
      }
      // right face (x-, -y+, -z)
      vec3.add(dest, org, x);
      makeFaces(function(up, rt) {
         return vec3.fromValues(dest[0]-stepX[rt][0]+stepY[up][0]+offset[0], 
                                dest[1]-stepX[rt][1]+stepY[up][1]+offset[1], 
                                dest[2]-stepX[rt][2]+stepY[up][2]+offset[2]);
      });

      // bottom face (x-, -y, -z+)
      makeFaces(function(up, rt){
         return [dest[0]-stepX[up][0]+stepZ[rt][0]+offset[0], 
                 dest[1]-stepX[up][1]+stepZ[rt][1]+offset[1], 
                 dest[2]-stepX[up][2]+stepZ[rt][2]+offset[2]];
      });

      // front faces vertex (x, -y+, z-)
      //vec3.add(dest, org, x);
      vec3.add(dest, dest, z);
      makeFaces(function(up, rt) {
         return [dest[0]+stepY[up][0]-stepZ[rt][0]+offset[0], 
                 dest[1]+stepY[up][1]-stepZ[rt][1]+offset[1], 
                 dest[2]+stepY[up][2]-stepZ[rt][2]+offset[2]];
      });

      // left face (-x+, -y+, z)
      vec3.add(dest, org, z);
      makeFaces(function(up, rt) {
         return [dest[0]+stepX[rt][0]+stepY[up][0]+offset[0], 
                 dest[1]+stepX[rt][1]+stepY[up][1]+offset[1], 
                 dest[2]+stepX[rt][2]+stepY[up][2]+offset[2]]; 
      });

      // back face (-x, -y+, -z+)
      makeFaces(function(up, rt){
         return [org[0]+stepY[up][0]+stepZ[rt][0]+offset[0], 
                 org[1]+stepY[up][1]+stepZ[rt][1]+offset[1], 
                 org[2]+stepY[up][2]+stepZ[rt][2]+offset[2]];
      });

      // top face (x-, y, z-)
      vec3.add(dest, org, x);
      vec3.add(dest, dest, y);
      vec3.add(dest, dest, z);
      makeFaces(function(up, rt){
         return [dest[0]-stepX[up][0]-stepZ[rt][0]+offset[0], 
                 dest[1]-stepX[up][1]-stepZ[rt][1]+offset[1], 
                 dest[2]-stepX[up][2]-stepZ[rt][2]+offset[2]];
      });

      _pvt.previewCage = preview;   //View.putIntoWorld(); already.
      __WEBPACK_IMPORTED_MODULE_2__wings3d_view__["updateWorld"]();
   };

   function submitCage() {
         // accept previewCage to the world
         __WEBPACK_IMPORTED_MODULE_2__wings3d_view__["undoQueue"]( new __WEBPACK_IMPORTED_MODULE_4__wings3d_model__["CreatePreviewCageCommand"](_pvt.previewCage) );
         _pvt.previewCage.name = "Cube" + (_pvt.creationCount+1);
         __WEBPACK_IMPORTED_MODULE_1__wings3d__["log"]("createCube", _pvt.previewCage);
         _pvt.previewCage = null;
         _pvt.creationCount++;
   };

   // insert a hidden form into document
   var form = document.getElementById('createCubeForm');
   if (form === null) {
      form = document.createElement('form');
      form.setAttribute('id', 'createCubeForm');
      form.innerHTML = `
         <span class="close">&times;</span>
         <h3>Cube Options</h3>
         <fieldset> 
            <legend>Number of Cuts</legend>
            <input name="numberOfCuts" type="range" min="1" max="20" value="1" onchange="this.nextElementSibling.value=this.value" />
            <input name="numberOfCuts" type="number" min="1" max="20" value="1" step="1" onchange="this.previousElementSibling.value=this.value" />
         </fieldset>
         <div>
            <label>X <input type="number" name="size_x" value="2.0" step="0.5"></label><br>
            <label>Y <input type="number" name="size_y" value="2.0" step="0.5"></label><br>
            <label>Z <input type="number" name="size_z" value="2.0" step="0.5"></label>
         </div>
         <fieldset>
            <legend>Spherize</legend>
            <label><input type='radio' name='sphere' value='true' disabled>Yes</label>
            <label><input type='radio' name='sphere' value='false' checked disabled>No<label>
         </fieldset>
         <fieldset>
            <label>Rotate</label>
            <span>
               <label>X <input type="number" name="rotate_x" value="0.0" step="1"></label><br>
               <label>Y <input type="number" name="rotate_y" value="0.0" step="1"></label><br>
               <label>Z <input type="number" name="rotate_z" value="0.0" step="1"></label>    
            </span>
            <label>Move</label>
            <span>
               <label>X <input type="number" name="translate_x" value="0.0" step="0.5"></label><br>
               <label>Y <input type="number" name="translate_y" value="0.0" step="0.5"></label><br>
               <label>Z <input type="number" name="translate_z" value="0.0" step="0.5"></label>
            </span>
            <div>
               <label><input type="checkbox" name="ground">Put on Ground</label>
            </div>
         </fieldset>
          <button type="reset" value="Reset">Reset</button>
          <button type="submit" value="Ok">Ok</button>
      `;
      // hide, then append into document.body.
      form.style.display = 'none'; 
      form.style.position = 'absolute';
      form.className += 'dialog';
      document.body.appendChild(form);
      // handlingEvent.
      var close = form.getElementsByClassName("close")[0];
      close.addEventListener('click',function(e) {
         form.style.display = 'none';
         // remove object from world.
         _pvt.cancelPreview();
      });
      // submit button.
      form.addEventListener('submit', function(ev) {
         ev.preventDefault();
         form.style.display = 'none';
         submitCage();
      });
      var cutHandler = function(ev) {
         _pvt.cubeParams.numberOfCut = Number(ev.target.value);
         _pvt.updatePreview();
      };
      // var inputs = form.getElementsByTagName('input');
      var cut = document.querySelectorAll('#createCubeForm input[name="numberOfCuts"]');
      cut[0].addEventListener('change', cutHandler);
      cut[1].addEventListener('change', cutHandler);
      var size = document.querySelectorAll('#createCubeForm input[name^="size_"]');
      size[0].addEventListener('change', function(ev) { 
         _pvt.cubeParams.size.x = Number(ev.target.value);
         _pvt.updatePreview();
      });
      size[1].addEventListener('change', function(ev) { 
         _pvt.cubeParams.size.y = Number(ev.target.value);
         _pvt.updatePreview();
      });
      size[2].addEventListener('change', function(ev) {
         _pvt.cubeParams.size.z = Number(ev.target.value);
         _pvt.updatePreview();
      });
      const translate = document.querySelectorAll('#createCubeForm input[name^="translate_"]');
      translate[0].addEventListener('change', function(ev) {
         _pvt.cubeParams.translate.x = Number(ev.target.value);
         _pvt.updatePreview();
      });
      translate[1].addEventListener('change', function(ev) {
         _pvt.cubeParams.translate.y = Number(ev.target.value);
         _pvt.updatePreview();
      });
      translate[2].addEventListener('change', function(ev) {
         _pvt.cubeParams.translate.z = Number(ev.target.value);
         _pvt.updatePreview();
      });
      // putonGround
      const ground = document.querySelectorAll('#createCubeForm input[name="ground"]');
      ground[0].addEventListener('change', function(ev) {
         if (ground[0].checked) {
            translate[1].disabled = true;
            _pvt.cubeParams.putOnGround = true;
         } else {
            translate[1].disabled = false;
            _pvt.cubeParams.putOnGround = false;
         }
         _pvt.updatePreview();
      });
      // rotation
      const rotate = document.querySelectorAll('#createCubeForm input[name^="rotate_"]');
      rotate[0].addEventListener('change', function(ev) {
         _pvt.cubeParams.rotate.x = Number(ev.target.value);
         _pvt.updatePreview();
      });
      rotate[1].addEventListener('change', function(ev) {
         _pvt.cubeParams.rotate.y = Number(ev.target.value);
         _pvt.updatePreview();
      });
      rotate[2].addEventListener('change', function(ev) {
         _pvt.cubeParams.rotate.z = Number(ev.target.value);
         _pvt.updatePreview();
      });
      form.addEventListener('change', function(ev) {
         ev.stopPropagation();
         if (ev.target.name !== null) {
            help(ev.target.name + " = " + ev.target.value);    
         }
      });
      form.addEventListener('reset', function(ev) {
         _pvt.resetCubeParams();
         // setup the first one.
         _pvt.updatePreview();
      });
   }

   // attach to click event.
   /*var menuItem = document.querySelector("#createCube");
   if (menuItem) {
      menuItem.addEventListener("click", function(ev) {
         // get exact position,
         var position = UI.getPosition(ev);
         // run createCube dialog
         createCubeDialog(position);
         Wings3D.log(Wings3D.action.createCubeDialog);
      })
   }*/
   const id = __WEBPACK_IMPORTED_MODULE_1__wings3d__["action"].createCube.name;
   __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["bindMenuItem"](id, function(ev) {
         _pvt.updatePreview();
         submitCage();
      });
   __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["bindMenuItemRMB"](id, function(ev) {
         // get exact position,
         var position = __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["getPosition"](ev);
         // run createCube dialog
         createCubeDialog(position);
         __WEBPACK_IMPORTED_MODULE_1__wings3d__["log"](__WEBPACK_IMPORTED_MODULE_1__wings3d__["action"].createCubeDialog);
      });
   // preference optional dialog
   __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_1__wings3d__["action"].createCubePref.name, function(ev) {
         // get exact position,
         var position = __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["getPosition"](ev);
         // run createCube dialog
         createCubeDialog(position);
         __WEBPACK_IMPORTED_MODULE_1__wings3d__["log"](__WEBPACK_IMPORTED_MODULE_1__wings3d__["action"].createCubeDialog);
      });

   //
   createCubeDialog = function(mousePosition) {
      // display dialog, shown at the mouse location.
      form.style.display = 'block';
      // position form.
      __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["positionDom"](form, mousePosition);
      _pvt.previewCage = null;
      // reset dialog value.
      form.reset();
      // get sphere value.
      // _pvt.cubeParams.spherize = form.querySelector('input[name="sphere"]:checked').value;
   };
}, false);




/***/ }),
/* 36 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "tours", function() { return tours; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_ui__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d__ = __webpack_require__(0);
/*
//
// introductory tutorials. 
/// later expand to our own tutorial format and editor?
//
*/




const tours = {};

function createGuideTour() {
   //tutor.addStep();

   tours.about = () => {
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["cancel"]();
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["addStep"]("Welcome", "", "<p>Wings3D4Web is a web implementation of Wings3D modeller</p>" +
       "<p>Use Help's interactive learning aid</p>" +
       "<p>Or goto <a target='_blank' href='http://www.wings3d.com/?page_id=87'>Wings3D documentation page</a> for more instruction.</p>",
       "helpMenu", "bottom"
      );
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["startTour"]();
   };

   tours.introduction = () => {
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["cancel"]();
      // add step into tutor
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["addStep"]("Welcome", "Interface Essential", `Wings 3D interface keeps the focus on modeling. It consists of 
         <ul>
          <li>Menubar</li>
          <li>Toolbar</li>
          <li>Geometry Info</li>
          <li>Modelling Area</li>
          <li>Information Line</li>
         </ul>`,
         "", "top"
      );
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["addStep"]("Status", "Geometry Info", "Shown information about the current Model if any",
       "statusbar", "bottom-start"
      );
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["addStep"]("Information", "Information Line", 
       `<ul>
         <li>Hovering over almost anything in Wings displays its function in the info line.</li>
         <li><mark>L, M</mark>, and <mark>R</mark> are used in the info line to indicate commands initiated by the <em>Left, Middle</em>, and <em>Right</em> mouse buttons.</li>
         <li>Uppercase letters in square brackets represent keyboard keys like <mark>[C]</mark>.</li>
         <li>Numbers in square brackets represent number keys on the keyboard like <mark>[1], [2], [3]</mark>.</li>
         <li><mark>[Shift], [Ctrl]</mark>, and <mark>[Alt]</mark> are keyboard modifier keys.</li>
        </ul>`,
       "helpbar", "top-start"
      );
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["addStep"]("Undo", "undo/redo", "undo button revert the last operation",
       "undoEdit", "bottom"
      );
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["addStep"]("Redo", "undo/redo", "redo button revert the last undo operation",
       "redoEdit", "bottom"
     );
   
      // show 
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["startTour"]();
   };
   tours.basicCommands = () => {
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["cancel"]();   // clear tours.
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["addZoomStep"]("Welcome", "Zoom", "Mouse wheel scroll in Canvas will zoom in/out",
       "", "top");
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["addExpectStep"](__WEBPACK_IMPORTED_MODULE_2__wings3d__["action"].cameraModeEnter, "Camera", "Camera Mode", "Let <em>M</em>, click middle mouse button anywhere in the Canvas to enter camera mode",       
       "", "right");
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["addExpectStep"](__WEBPACK_IMPORTED_MODULE_2__wings3d__["action"].cameraModeExit, "MoveCamera", "Move Camera", "Information Line shows you how to move camera, exit Camera Mode, and you can still zoom in/out",
       "helpbar", "top-start");
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["addMultiStep"]("Cube Creation", "Create Cube Steps", "Steps to create a Cube", "", "top",
         [__WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["expectStep"](__WEBPACK_IMPORTED_MODULE_2__wings3d__["action"].contextMenu, "CreateMenu", "ContextMenu", "Let <em>R</em> click right mouse button in the Canvas empty place to bring up CreateObject Menu",
           "", "left"),
          __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["expectStep"](__WEBPACK_IMPORTED_MODULE_2__wings3d__["action"].createCubeDialog, "CreateCubeForm", "Great Job", "Click Cube MenuItem to create Cube",
           "createCube", "right"),
          __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["expectStep"]("createCube", "CreateCube", "Cube Form", "You can adjust the cube's parameter",
           "createCubeForm", "top")]
         );
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["addFaceSelectStep"](1, "selectFace", "Select any Face", "Try to click/select face",
         "left");
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["addStep"]("Congratulation", "Congratulation", "<em>R</em>, Right click mouse button will bring up Face tools. Now you know the basic steps.",
           "", "bottom");

/*
      Tutor.addExpectStep(Wings3D.action.contextMenu, "CreateMenu", "ContextMenu", "Let <em>R</em> click right mouse button in the Canvas empty place to bring up CreateObject Menu",
       "", "left");
      Tutor.addExpectStep(Wings3D.action.createCubeDialog, "CreateCubeForm", "Great Job", "Click Cube MenuItem to create Cube",
       "createCube", "right");
      Tutor.addExpectStep("createCube", "CreateCube", "Cube Form", "You can adjust the cube's parameter",
       "createCubeForm", "top");
      Tutor.addFaceSelectStep(1, "selectFace", "Select any Face", "Try to click/select face",
       "left");
      Tutor.addStep("Congratulation", "Congratulation", "<em>R</em>, Right click mouse button will bring up Face tools. Now you know the basic steps.",
       "", "bottom"); */

       // start tour
       __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["startTour"]();
   };
   tours.tableTutor = () => {
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["cancel"]();   // clear tours.
      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["addExpectStep"]("Make a simple table", "Cube", "RMB (anywhere in geometry window) to display the primitives menu and select cube with LMB.", 
      "", "top");

      __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__["startTour"]();
   };
   __WEBPACK_IMPORTED_MODULE_1__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_2__wings3d__["action"].about.name, (ev) => {
      tours.about();
   });
   __WEBPACK_IMPORTED_MODULE_1__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_2__wings3d__["action"].introduction.name, (ev) => {
      tours.introduction();
   });
   __WEBPACK_IMPORTED_MODULE_1__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_2__wings3d__["action"].basicCommands.name, (ev) => {
      tours.basicCommands();
   });

   __WEBPACK_IMPORTED_MODULE_1__wings3d_ui__["bindMenuItem"](__WEBPACK_IMPORTED_MODULE_2__wings3d__["action"].tableTutor.name, (ev) => {
      tours.tableTutor();
   });
}

__WEBPACK_IMPORTED_MODULE_2__wings3d__["onReady"](createGuideTour);



/***/ }),
/* 37 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SimilarFace", function() { return SimilarFace; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SimilarVertex", function() { return SimilarVertex; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SimilarWingedEdge", function() { return SimilarWingedEdge; });
// 
// similar comparison
//

class SimilarGeometry {
   constructor() {
      this.set = new Set;
   }

   // https://stackoverflow.com/questions/10015027/javascript-tofixed-not-rounding
   static _toFixed(num, precision) {
      return (+(Math.round(+(num + 'e' + precision)) + 'e' + -precision)).toFixed(precision);
   }

   static _discreetAngle(val) {
      function findDiscreet(radian) {
         let degree = radian * 180 / Math.PI;
         degree = Math.round(degree);     // round to nearest degree
         if (degree < 0) { // convert to 360, from (0, 2PI).
            degree = 360 + degree;
         }
         return (degree / 180 * Math.PI); // return radian.
      }
      let radian = 2 * Math.atan(val);
      // convert from [-pi, pi] to [0, 2pi].
      return findDiscreet(radian);
   }

   // W. Kahan suggested in his paper "Mindeless.pdf". numerically better formula.
   static _computeAngle(m) {   // m = {a, b, aLengthB, bLengthA};
      // 2 * atan(norm(x*norm(y) - norm(x)*y) / norm(x * norm(y) + norm(x) * y));
      vec3.scale(m.aLengthB, m.a, m.bLength);
      vec3.scale(m.bLengthA, m.b, m.aLength);
      let dist = vec3.distance(m.bLengthA, m.aLengthB);
      vec3.add(m.aLengthB, m.aLengthB, m.bLengthA);
      const mag = vec3.length(m.aLengthB);
      return SimilarGeometry._discreetAngle(dist / mag);
   }

   static computeRatio(m) {
      const rad = SimilarGeometry._computeAngle(m);
      const ratio = SimilarGeometry._toFixed(m.bLength/m.aLength, 2) * rad;      // needFixing: possible collision, but should be fairly uncommon
      const ratioR = SimilarGeometry._toFixed(m.aLength/m.bLength, 2) * rad;  
      if (m.fwd.index === -1) {
         m.fwd.index = 0;
         m.rev.index = 0;
      } else {
         if (ratio < m.fwd.angle[m.fwd.index]) {
            m.fwd.index = m.fwd.angle.length;
         } 
         if (ratioR < m.rev.angle[m.rev.index]) {
            m.rev.index = 0;
         } else {
            ++m.rev.index;
         }
      }
      m.fwd.angle.push( ratio );
      m.rev.angle.unshift( ratioR  );
   }

   static computeMetric(m, initial = 0.0) {
      // rotate the array, so the smallest angle start at index 0. so we can compare directly
      m.fwd.angle.unshift( ...(m.fwd.angle.splice(m.fwd.index, m.fwd.angle.length)) ); // spread operator to explode array.
      m.rev.angle.unshift( ...(m.rev.angle.splice(m.rev.index, m.rev.angle.length)) ); // spread operator to explode array.

      // convert to string, or really hash.
      let metric = initial;
      let metricR = initial;
      for (let i = 0; i < m.fwd.angle.length; ++i) {
         metric = (metric*(m.fwd.angle[i]+0.1)) + m.fwd.angle[i];                     // needFixing. better unique computation.
         metricR = (metricR*(m.rev.angle[i]+0.1)) + m.rev.angle[i];
      }

      return [metric, metricR];
   }

   static mStruct() {
      // shared computation resource
      return { a: vec3.create(), aLength: -1,
               b: vec3.create(), bLength: -1,
               aLengthB: vec3.create(),
               bLengthA: vec3.create(),
               fwd: {index: -1, angle: []},
               rev: {index: -1, angle: []},
             };
   }

   // find if selection has similar target
   find(target) {
      const metric = this.getMetric(target);
      return this.set.has(metric);
   }
}


class SimilarFace extends SimilarGeometry {
   constructor(selection) {
      super();
      for (let polygon of selection) {
         const metrics = this.getMetric(polygon, true);
         this.set.add( metrics[0] );
         this.set.add( metrics[1] );
      }
   }

   // metric return all the angle and side as a unique number.
   getMetric(polygon, reflect=false) {
      const m = SimilarGeometry.mStruct();
      polygon.eachEdge( function(edge) {
         if (m.aLength === -1) {
            vec3.sub(m.a, edge.prev().origin.vertex, edge.origin.vertex);
            m.aLength = vec3.length(m.a);
         } else {
            vec3.negate(m.a, m.b);
            m.aLength = m.bLength;
         }
         vec3.sub(m.b, edge.destination().vertex, edge.origin.vertex);
         m.bLength = vec3.length(m.b);
         SimilarGeometry.computeRatio(m);
      });
      const result = SimilarGeometry.computeMetric(m);
      if (reflect) {
         return result;
      } else {
         return result[0];
      }
   }
}


class SimilarWingedEdge extends SimilarGeometry {
   constructor(selection) {
      super();
      for (let wingedEdge of selection) {
         const metrics = this.getMetric(wingedEdge, true);
         this.set.add( metrics[0] );
         this.set.add( metrics[1] );
      }
   }

   getMetric(wingedEdge, reflect=false) {
      const metric = SimilarGeometry.mStruct();
      const normal2 = [];
      for (let hEdge of wingedEdge) {  // left, right side 
         // down side.
         const hEdgeA = hEdge.prev();
         const hEdgeB = hEdge.next;
         vec3.sub(metric.a, hEdgeA.origin.vertex, hEdge.origin.vertex);
         metric.aLength = vec3.length(metric.a); 
         vec3.sub(metric.b, hEdgeB.origin.vertex, hEdge.origin.vertex);
         metric.bLength = vec3.length(metric.b);
         SimilarGeometry.computeRatio(metric);
         const norm = vec3.create();
         vec3.cross(norm, metric.b, metric.a);
         vec3.normalize(norm, norm);
         normal2.push(norm);
         // up
         vec3.negate(metric.a, metric.b);
         metric.aLength = metric.bLength;
         vec3.sub(metric.b, hEdgeB.destination().vertex, hEdgeB.origin.vertex);
         metric.bLength = vec3.length(metric.b);
         SimilarGeometry.computeRatio(metric);
      }
      // we should also check the difference of the  normal of the 2 side of the edge? differing from original implementation.
      const dot = vec3.dot(normal2[1], normal2[0]);
      const result = SimilarGeometry.computeMetric(metric, dot);
      if (reflect) {
         return result;
      } else {
         return result[0];
      }
   }
}


class SimilarVertex extends SimilarGeometry {
   constructor(selection) {
      super();
      for (let vertex of selection) {
         const metric = this.getMetric(vertex, true);
         this.set.add( metric[0] );
         this.set.add( metric[1] );
      }
   }

   getMetric(vertex, reflect=false) {
      const m = SimilarGeometry.mStruct();
      vertex.eachOutEdge( function(edge) {
         if (m.aLength === -1) {
            vec3.sub(m.a, edge.destination().vertex, vertex.vertex);  // similar to SimilarFace, but everything point outEdge.
            m.aLength = vec3.length(m.a);
         } else {
            vec3.copy(m.a, m.b);
            m.aLength = m.bLength;
         }
         vec3.sub(m.b, edge.destination().vertex, vertex.vertex);
         m.bLength = vec3.length(m.b);
         SimilarGeometry.computeRatio(m);
      });
      const result = SimilarGeometry.computeMetric(m);
      if (reflect) {
         return result;
      } else {
         return result[0];
      }
   }
}



/***/ }),
/* 38 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "triangulatePreview", function() { return triangulatePreview; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_wingededge__ = __webpack_require__(9);
//
// triangulate polygon - our own modified ear-cutting method.
//
// the algorithm worked most of time without checking diagonal. good for our usage, previewPolyogn, not suitable for real triangulation.
// first cut off concave edge, keep cutting until not concave.
// when all the concave edges were processed, the remaining polygon is convex polygon.
//
//"use strict";


// helper class for triangulate
const InternalHEdge = function(vertex, next) {
   this.origin = vertex;
   this.next = next;
};

InternalHEdge.prototype.destination = function() {
   return this.next.origin;
}

//
// check if v1 vertex lies on concave edges.
//
let edge0 = vec3.create();
let edge1 = vec3.create();
let crossNorm = vec3.create();
function isConcave(v0, v1, v2) {
// angle = pi - atan2(v[i] x v[i+1].magnitude, v[i] * v[i+1]);
   vec3.sub(edge0, v0.vertex, v1.vertex);
   vec3.sub(edge1, v2.vertex, v1.vertex);
   vec3.cross(crossNorm, edge0, edge1);
   let angle = Math.atan2(vec3.length(crossNorm), vec3.dot(edge0, edge1));
   return (angle <= 0);
};


function triangulatePreview(polygon) {
   let concave = 0;    // accumulate incomplete processing.
   let convex = [];
   let triangles = [];

   let end = polygon.halfEdge;
   let hEdge = polygon.halfEdge;
   let current;
   do {  // find the first concave.
      if (lastHEdge) {
         if (lastHEdge.origin, current.origin, current.destination()) {
            convex.push(lastHEdge);
            concave++;
            break;
         }
      } else {
         lastHEdge = current;
      }
      current = current.next;
   } while (current !== end);
   // now process concave.
   if (current !== end) {
      end = current;
      lastHEdge = current;
      current = current.next;
      do {
         if (isConcave(lastHEdge.origin,current.origin, current.destination())) {   // push it onto concave, and let later edge connected it
            convex.push( current );
            concave++;
         } else { // connect back to concave if any.
            if (concave > 0) {
               do { // keep slicing off concave if convex
                  let connect = new InternalHEdge(lastHEdge.origin, current.next); // triangle is lastHedge->hEdge->connect
                  triangles.push(lastHEdge.origin, current.origin, curret.destination());
                  convex.pop();  // popout lastHEdge.
                  lastHEdge = convex[convex.length-1];
                  current = connect;
               } while (!isConcave(lastHEdge.origin, connect.origin, connect.destination()) && (--concave > 0));
               // cleanup
               if (concave == 0) {
                  convex.push( current );
               }
            } else {
               convex.push( current );
            }
         }
         lastHEdge = current;
         current = current.next;
      } while (current !== end);
   }
   // only convex polygon left. process it.
   if (convex.length >= 3) {
      lastHEdge = convex[0];
      const end = convex.length -1;
      lastHEdge.triPt = convex[2].origin;
      for (let i = 1; end > i; ++i) { // add triangle
         const current = convex[i];
         triangles.push(lastHEdge.origin, current.origin, current.destination());
         current.triPt = lastHEdge.origin;
      }
   } else { // something wrong
      console.log("something wrong in triangulatePreview");
   }


   
   // return the  triangle list.
   return triangles;
};




/***/ })
/******/ ]);