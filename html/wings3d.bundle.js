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
/******/ 	return __webpack_require__(__webpack_require__.s = 22);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
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
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setupDialog", function() { return setupDialog; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "openFile", function() { return openFile; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_hotkey__ = __webpack_require__(16);
/*
   wings3d, ui and ui utility functions. including tutor.

*/



function _bindMenuItem(menuItem, id, fn, hotkey, meta) {
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
   __WEBPACK_IMPORTED_MODULE_0__wings3d_hotkey__["bindHotkey"](id, fn);
   if (hotkey !== undefined) {
      __WEBPACK_IMPORTED_MODULE_0__wings3d_hotkey__["setHotkey"](id, hotkey, meta);
   }
}


function bindMenuItem(id, fn, hotkey, meta) {
   const menuItem = document.querySelector(id);
   if (menuItem) {
      _bindMenuItem(menuItem, id, fn, hotkey, meta);
   }

}


function addMenuItem(menuId, id, menuItemText, fn, hotkey, meta) {
   const menu = document.querySelector(menuId);
   // insert the menuItem 
   const menuItem = document.createElement('li');
   const a = document.createElement('a');
   //a.setAttribute('onmouseover', '');
   a.textContent = menuItemText;
   // append to subment
   menuItem.appendChild(a);
   menu.appendChild(menuItem);
   _bindMenuItem(menuItem, id, fn, hotkey, meta);
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

// dialog helper
function setupDialog(formID, submitData) {
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

// fileInput helper
function openFile(fn) {
   const fileInput = document.querySelector('#importFile');    // <input type="file" id="wavefrontObj" style="display:none"/> 
   if (fileInput) {
      fileInput.click();
      fileInput.addEventListener('change', function(ev) {
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




/***/ }),
/* 1 */
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__ = __webpack_require__(3);
/*
//  wings3d.js
//     The start module of Wings 3D. Port,
//
// Original Erlang Version from Bjorn Gustavsson's Wings 3D
//
// 12-11-2017: convert to es6 module.
*/

//import * as View from './wings3d_view';
//import * as Contextmenu from './wings3d_menu';
//import * as Buttonbar from './wings3d_buttonbar';
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

// log action constant
const action = {
   cameraModeEnter: "CameraModeEnter",
   cameraModeExit: "CameraModeExit",
   cameraZoom: "CameraZoom",
   contextMenu: "ContextMenu",
   createCubeDialog: "CreateCubeDialog",
};




/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "prop", function() { return prop; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "theme", function() { return theme; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toggleVertexMode", function() { return toggleVertexMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toggleFaceMode", function() { return toggleFaceMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toggleEdgeMode", function() { return toggleEdgeMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toggleBodyMode", function() { return toggleBodyMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restoreVertexMode", function() { return restoreVertexMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restoreFaceMode", function() { return restoreFaceMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restoreEdgeMode", function() { return restoreEdgeMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restoreBodyMode", function() { return restoreBodyMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "currentMode", function() { return currentMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "putIntoWorld", function() { return putIntoWorld; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addToWorld", function() { return addToWorld; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeFromWorld", function() { return removeFromWorld; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getWorld", function() { return getWorld; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "attachHandlerMouseMove", function() { return attachHandlerMouseMove; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "redoEdit", function() { return redoEdit; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "undoEdit", function() { return undoEdit; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "undoQueue", function() { return undoQueue; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "undoQueueCombo", function() { return undoQueueCombo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "id2Fn", function() { return id2Fn; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadMatrices", function() { return loadMatrices; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "projection", function() { return projection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "modelView", function() { return modelView; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawWorld", function() { return drawWorld; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "render", function() { return render; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_render__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__plugins_wavefront_obj__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_facemads__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__wings3d_edgemads__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__wings3d_vertexmads__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__wings3d_bodymads__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__wings3d_model__ = __webpack_require__(12);
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
      constrainAxes: true,
      clipPlane: false,
      orthogonalView: false,
      numberOfLights: 1,
      activeShader: 1,
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
const nativeTheme = {
       activeVectorColor: [0.0, 1.0, 0.0],
       clipPlaneColor: [0.8, 0.3, 0.0],
       consoleColor: [1.0, 1.0, 1.0],
       consoleTextColor: [0.0, 0.0, 0.0],
       defaultAxis: [[0.0, 0.0, 0.0], [1.0, 0.0, 0.0]],
       edgeColor: [0.0, 0.0, 0.0],
       gridColor: [0.3, 0.3, 0.3],
       hardEdgeColor: [1.0, 0.5, 0.0],
       infoBackgroundColor: [0.38, 0.38, 0.38, 0.5],
       infoColor: [1.0, 1.0, 1.0],
       infoLineBg: [0.33131360000000004, 0.4, 0.0],
       infoLineText: [1.0, 1.0, 1.0],
       maskedVertexColor: [0.5, 1.0, 0.0, 0.8],
       materialDefault: [0.7898538076923077, 0.8133333333333334, 0.6940444444444445],
       normalVectorColor: [0.0, 1.0, 0.0],
       sculptMagnetColor: [0.0, 0.0, 1.0, 0.1],
       selectedColor: [0.65, 0.0, 0.0],
       selectedHlite: [0.7, 0.7, 0.0],
       tweakMagnetColor: [0.0, 0.0, 1.0, 0.06],
       tweakVectorColor: [1.0, 0.5, 0.0],
       unselectedHlite: [0.0, 0.65, 0.0],
       vertexColor: [0.0, 0.0, 0.0],
       color: [[0.7, 0.0, 0.1], [0.37210077142857145, 0.82, 0.0], [0.0, 0.3, 0.8]],
       negColor: [[0.8, 0.8, 0.8], [0.8, 0.8, 0.8], [0.8, 0.8, 0.8]]
   };
let theme = nativeTheme;

//--  end of pref and theme --------------------------------------------------------------------------


// 
// id2Fn()
//
let idMapping = new Map;
function id2Fn(inputID) {
   return idMapping.get(inputID);
}
function setId2Fn(fn) {
   idMapping.set(fn.name, fn);   // populate the support functions
}

// --- end of id mapping to functions ----------------------------------------------------------------------------


// 
// editing mode management
//
const mode = {             // private variable, needed to initialize after gl, 
   face: null,//new FaceMadsor, 
   edge: null,//new EdgeMadsor,
   vertex: null,//new VertexMadsor,
   body: null,//new BodyMadsor,
   current: null,
};
function initMode() {
   mode.face = new __WEBPACK_IMPORTED_MODULE_6__wings3d_facemads__["FaceMadsor"];
   mode.edge = new __WEBPACK_IMPORTED_MODULE_7__wings3d_edgemads__["EdgeMadsor"];
   mode.vertex = new __WEBPACK_IMPORTED_MODULE_8__wings3d_vertexmads__["VertexMadsor"];
   mode.body = new __WEBPACK_IMPORTED_MODULE_9__wings3d_bodymads__["BodyMadsor"];
   mode.current = mode.face;
   mode.face.setWorld(world);
   mode.edge.setWorld(world);
   mode.vertex.setWorld(world);
   mode.body.setWorld(world);
};


function toggleMode(mode) {
   let button = document.getElementById('toggle'+mode+'Mode');
   if (button) {
      button.checked = true;
   }
}
function toggleVertexMode() {
   // change current mode to 
   if (mode.current !== mode.vertex) {
      mode.current.toggleFunc(mode.vertex);
      mode.current = mode.vertex;
      toggleMode('Vertex');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};
setId2Fn(toggleVertexMode);

function toggleFaceMode() {
   if (mode.current !== mode.face) {
      mode.current.toggleFunc(mode.face);
      mode.current = mode.face;
      toggleMode('Face');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};
setId2Fn(toggleFaceMode);

function toggleEdgeMode() {
   if (mode.current !== mode.edge) {
      mode.current.toggleFunc(mode.edge);
      mode.current = mode.edge;
      toggleMode('Edge');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};
setId2Fn(toggleEdgeMode);

function toggleBodyMode() {
   if (mode.current !== mode.body) {
      mode.current.toggleFunc(mode.body);
      mode.current = mode.body;
      toggleMode('Body');
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};
setId2Fn(toggleBodyMode);

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

function currentMode() {
   return mode.current;
}
//- End of editing Mode ----------

//
// world objects management
//
const world = []; // private var
function putIntoWorld(mesh) {
   // write point to alert windows.
   /*var triangleSize = mesh.faces.reduce( function(acc, element) {
      return acc + element.numberOfVertex - 2;
      }, 0);
   var str = "Mesh:" + mesh.faces.length + "," + triangleSize + "{\n";
   mesh.faces.forEach(function(poly, index, arry){
      str += "face: [\n";
      poly.eachVertex(function(_vert){
         var vert = _vert.vertex;
         str += "[" + vert[0] + "," + vert[1] + "," + vert[2] + "],\n";
      });
      str += "},\n";
   });
   geometryStatus(str);*/
   //
   var model = new __WEBPACK_IMPORTED_MODULE_10__wings3d_model__["PreviewCage"](mesh);
   //
   return addToWorld(model);
};

function addToWorld(model) {
   world.push( model );
   __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   return model;
}

function removeFromWorld(previewCage) {
   var index = world.indexOf(previewCage);
   if (index >= 0) {
      world.splice(index, 1);
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};
function getWorld() {
   return world;
}
//-- End of World objects management -------------------------

//
// mouse handling
//
let lastPick = null;

function rayPick(ray) {
   let pick = null;
   for (let model of world) {
      const newPick = model.rayPick(ray);
      if (newPick !== null) {
         if ((pick === null) || (pick.t > newPick.t)) {
            pick = newPick;
         }
      }
   }
   if (pick !== null) {
      mode.current.setPreview(pick.model);
      //if (lastPick !== null && lastPick.model !== pick.model) {
      //   lastPick.model.setCurrentSelect(null);
      //}
      // now set current edge again.
      lastPick = pick;
      let intersect = vec3.create();
      vec3.scaleAndAdd(intersect, ray.origin, ray.direction, pick.t);
      mode.current.setCurrent(pick.edge, intersect, pick.center);
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   } else {
      if (lastPick !== null) {
         // no current selection.
         mode.current.setCurrent(null);
         __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
      }
   }
   // now the currentPick will be the next lastPick.
   lastPick = pick;
};

let dragMode = null;
function selectStart() {
   if (lastPick !== null) {
      dragMode = mode.current.selectStart(lastPick.model);
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};

function selectDrag() {
   if ((dragMode !== null)) {// &&
       if ((lastPick !== null)) {
         dragMode.dragSelect(lastPick.model);
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

const handler = {camera: null, mousemove: null};
function canvasHandleMouseDown(ev) {
   if (ev.button == 0) {
      if (handler.camera !== null) {
         handler.camera.commit();  
         handler.camera = null;
         __WEBPACK_IMPORTED_MODULE_5__wings3d__["log"](__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].cameraModeExit, __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"]);
         help('L:Select   M:Start Camera   R:Show Menu   [Alt]+R:Tweak menu');      
      } else if (handler.mousemove !== null) {
         handler.mousemove.commit();
         handler.mousemove = null;
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
      var ray = {origin: ptNear, direction: ptFar};
      //geometryStatus("mouse position: " + ptNear[0] + ", " + ptNear[1] + "," + ptNear[2] + ", <br />"+ ptFar[0] + ", " + ptFar[1] + ", " + ptFar[2]);
      rayPick(ray);
      // selectDrag if left button mousedown
      selectDrag();
   }
};

// contextMenu, mouse right click.
function canvasHandleContextMenu(ev) {
   if (handler.camera !== null || handler.mousemove !== null) {
      // prevent propagation.
      ev.preventDefault();
      ev.stopImmediatePropagation();      // prevent document's contextmenu popup
      if (handler.camera !== null) {
         handler.camera.cancel();
         handler.camera = null;
         __WEBPACK_IMPORTED_MODULE_5__wings3d__["log"](__WEBPACK_IMPORTED_MODULE_5__wings3d__["action"].cameraModeExit, __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"]);   // log action
         help('L:Select   M:Start Camera   R:Show Menu   [Alt]+R:Tweak menu');
      } else {
         handler.mousemove.cancel();
         handler.mousemove = null;
         __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
      }
      return false;
   }
   // let wings3d_contextmenu handle the event.
};

// handling in reverse order. the newest one will handle the event. (should be at most 2 handler)
function attachHandlerMouseMove(mousemoveHandler) {
   // should we make sure handler.mousemove is null?
   handler.mousemove = mousemoveHandler;
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
   const combo = new EditCommandCombo(editCommands);
   undoQueue( combo );
};
// undo queue
function undoQueue(editCommand) {
   if ( (undo.queue.length-1) > undo.current ) {
      // remove branch not taken
      undo.queue.length = undo.current+1;
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
setId2Fn(redoEdit);

function undoEdit() {
   if (undo.current >= 0) {
      undo.queue[undo.current--].undo(mode.current);
      __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
   }
};
setId2Fn(undoEdit);

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
   const ortho = view.orthogonalView;
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
      gl.polygonOffset(1.0, 1.0);          // Set the polygon offset
      gl.enable(gl.POLYGON_OFFSET_FILL);
      mode.current.previewShader(gl);
      world.forEach(function(model, _index, _array){
         gl.bindTransform();
         model.draw(gl);
      });
      gl.disableShader();
      gl.disable(gl.POLYGON_OFFSET_FILL);


      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_COLOR, gl.DST_COLOR);
      // draw Current Select Mode (vertex, edge, or face)
      mode.current.draw(gl);
      gl.disable(gl.BLEND);
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
   const selectionMenu = [ {id: '#deselect', fn: 'resetSelection', hotKey: ' '},
                         {id: '#more', fn: 'moreSelection', hotKey: '+'},
                         {id: '#less', fn: 'lessSelection', hotKey: '-'},
                         {id: '#similar', fn: 'similarSelection', hotkey: 'i'},
                         {id: '#all', fn: 'allSelection', hotKey: 'a', meta: 'ctrl'}, 
                         {id: '#invert', fn: 'invertSelection', hotKey: 'i', meta: 'ctrl+shift'},
                         {id: '#adjacent', fn: 'adjacentSelection'}
                        ];
   for (let select of selectionMenu) {
      __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["bindMenuItem"](select.id, function(ev) {
         const command = new EditCommandSimple(select.fn);
         if(command.doIt(mode.current)) {
            undoQueue( command );
            __WEBPACK_IMPORTED_MODULE_1__wings3d_render__["needToRedraw"]();
         }
      }, select.hotKey, select.meta);
   }

   //Renderer.init(gl, drawWorld);  // init by itself

   // capture click mouse event.
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("mouseenter", canvasHandleMouseEnter, false);
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("mousedown", canvasHandleMouseDown, false); 
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("mouseup", canvasHandleMouseUp, false);
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("mouseleave", canvasHandleMouseLeave, false);
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("mousemove", canvasHandleMouseMove, false);
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("wheel", canvasHandleWheel, false);
   __WEBPACK_IMPORTED_MODULE_3__wings3d_gl__["gl"].canvas.addEventListener("contextmenu", canvasHandleContextMenu, false);
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
/* 3 */
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
   }

   gl.bindShaderData = function(data, useIndex=true) {
      // using current setShader, set shader, set indexbuffer
      _pvt.currentShader.bindAttribute(gl, data.attribute);
      _pvt.currentShader.bindUniform(gl, data.uniform);
      if (useIndex && typeof(data.index)!=="undefined" && data.index !== null) {
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, data.index.handle);
      }
   };

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

//ShaderData.prototype.setAttribute = function(name, value) {
//};
// index is used for drawElement, not used for input to shaderProgram
ShaderData.prototype.setIndex = function(index) {
   if ((typeof(this.index)!=="undefined") && (this.index !== null)) {
      gl.deleteBuffer(this.index.handle);
   }
   if (index !== null) {
      var handle = gl.createBufferHandle(index, gl.ELEMENT_ARRAY_BUFFER);
      this.index = {handle: handle};
   }
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

ShaderProgram.prototype.bindAttribute = function(gl, attribute) {
   try {
   for (var key in this.attribute) {
      if (attribute.hasOwnProperty(key)) {   // don't need to check this.attribute' inherited property, cannot possibley exist
         var attrb = attribute[key];
         gl.bindAttributeToProgram(this.attribute[key].loc, attrb);
      } else {
         // don't have property. console.log?
         console.log("shaderData don't have shader attribute: " + key);
      }
   }
   }
   catch (e) {
      console.log(e);
   }
};

ShaderProgram.prototype.bindUniform = function(gl, uniform) {
   try {
   for (var key in this.uniform) {
      if (uniform.hasOwnProperty(key)) {
         var uni = uniform[key];
         uni.binder(gl, this.uniform[key].loc, uni.value);
      } else {
         // don't have property. console.log?
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
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MouseMoveHandler", function() { return MouseMoveHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EditCommand", function() { return EditCommand; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EditCommandCombo", function() { return EditCommandCombo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EditCommandSimple", function() { return EditCommandSimple; });
/**
 *  abstract EditCommand class for undo, redo handling. also MouseMoveHandler class.
 * 
 */

class MouseMoveHandler {

   _calibrateMovement(mouseMove) {
      // todo: instead of magic constant. should supply a scaling factor.
      var move = mouseMove/20.0;
      if (move >= 2) {
         move = 2;
      }
      return move;
   }

   //handleMouseMove(ev) {}

   cancel() {
      this._cancel();     // called descendant handler
      // enable mouse cursor
      document.body.style.cursor = 'auto';
   }

   commit() {
      this._commit();
      // enable mouse cursor
      document.body.style.cursor = 'auto';
   }
}

class EditCommand {


   //doIt() {}

   //undo() {}

}

class EditCommandSimple extends EditCommand {
   constructor(command) {
      super();
      this.commandName = command;
   }

   doIt(currentMadsor) {
      this.undo = currentMadsor[this.commandName]();
      return (this.undo !== null);
   }

   undo(currentMadsor) {
      this.undo(currentMadsor);
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
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "colorWireframe", function() { return colorWireframe; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "colorSolidWireframe", function() { return colorSolidWireframe; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d__ = __webpack_require__(1);
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
let selectedColorLine = {
   vertex: [
      'attribute vec3 position;',
      'attribute float color;',
      'uniform mat4 worldView;',
      'uniform mat4 projection;',

      'varying lowp float vColor;',

      'void main(void) {',
      '   gl_Position = projection * worldView * vec4(position, 1.0);',
      '   vColor = color;',
      '}'].join("\n"),
   fragment: [
      'precision lowp float;',
      'varying lowp float vColor;',
      'uniform vec4 hiliteColor;',
      'uniform vec4 selectedColor;',

      'void main(void) {',
      '   if (vColor == 0.0) {',
      '      discard;',             
      '   } else if (vColor == 0.25) {',
      '      gl_FragColor = selectedColor;',
      '   } else if (vColor == 0.5) {',
      '      gl_FragColor = hiliteColor;',
      '   } else {',
      '      gl_FragColor = vec4(hiliteColor.xyz+selectedColor.xyz, 1.0);',     // blended 
      '   }',
      '}'].join("\n"),
};
let selectedColorPoint = {
   vertex: [
      'attribute vec3 position;',
      'attribute float color;',
      'uniform mat4 worldView;',
      'uniform mat4 projection;',

      'varying lowp float vColor;',

      'void main(void) {',
      '   gl_Position = projection * worldView * vec4(position, 1.0);',
      '   vColor = color;',
      '  gl_PointSize = 8.8;',
      '}'].join("\n"),
   fragment: [
      'precision lowp float;',
      'varying lowp float vColor;',
      'uniform vec4 hiliteColor;',
      'uniform vec4 selectedColor;',

      'void main(void) {',
      '   if (vColor == 0.0) {',
      '      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);',     // black dotted.             
      '   } else if (vColor == 0.25) {',
      '      gl_FragColor = selectedColor;',
      '   } else if (vColor == 0.5) {',
      '      gl_FragColor = hiliteColor;',
      '   } else {',
      '      gl_FragColor = vec4(hiliteColor.xyz+selectedColor.xyz, 1.0);',     // blended 
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
      'uniform vec4 uColor;',
      'void main(void) {',
      '  gl_FragColor = uColor;',
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
      'varying vec3 vBC;',

      'float edgeFactor(){',
         'vec3 d = fwidth(vBC);',
         'vec3 a3 = smoothstep(vec3(0.0), d*1.5, vBC);',
         'return min(min(a3.x, a3.y), a3.z);',
      '}',

      'void main(){',
         // coloring by edge
         'gl_FragColor.rgb = mix(vec3(0.0), vec3(0.5), edgeFactor());',
         'gl_FragColor.a = 1.0;',
      '}'].join("\n"),
};
let colorWireframe = {  // we don't have geometry shader, so we have to manually pass barycentric to do 'single pass wireframe' 
   vertex: [       // http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
      'attribute vec3 position;', 
      'attribute vec3 barycentric;',
      'attribute float hilite;',  // (x,y), x is for edge, y is for interior. (y>0 is turnon), (x==1 is turnon).
      'uniform mat4 projection;', 
      'uniform mat4 worldView;',

      'varying vec3 vBC;',
      'varying float vHilite;',
      'void main(){',
         'vHilite = hilite;',
         'vBC = barycentric;',
         'gl_Position = projection * worldView * vec4(position, 1.0);',
      '}'].join("\n"),

   fragment:[
      '#extension GL_OES_standard_derivatives : enable',
      'precision mediump float;',
      'uniform vec3 hiliteColor;',  // hilite color
      'varying vec3 vBC;',
      'varying float vHilite;',

      'float edgeFactor(){',
         'vec3 d = fwidth(vBC);',
         'vec3 a3 = smoothstep(vec3(0.0), d*1.5, vBC);',
         'return min(min(a3.x, a3.y), a3.z);',
      '}',

      'void main(){',
         // coloring by edge
         'vec3 edgeColor = vec3(0.0);',
         'if (vHilite >= 1.0) {',
         '  edgeColor = hiliteColor;',
         '}',
         'gl_FragColor.rgb = mix(edgeColor, vec3(0.5), edgeFactor());',
         'gl_FragColor.a = 1.0;',
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
      'uniform vec3 faceColor;',
      'uniform vec3 selectedColor;',  // hilite color
      'varying vec3 vBC;',
      'varying float vSelected;',

      'float edgeFactor(){',
         'vec3 d = fwidth(vBC);',
         'vec3 a3 = smoothstep(vec3(0.0), d*1.5, vBC);',
         'return min(min(a3.x, a3.y), a3.z);',
      '}',

      'void main(){',
         'vec3 interiorColor = faceColor;',
         'if (vSelected == 1.0) {',
         '  interiorColor = selectedColor;',
         '}',
         // coloring by edge
         'gl_FragColor.rgb = mix(vec3(0.0), interiorColor, edgeFactor());',
         'gl_FragColor.a = 1.0;',
      '}'].join("\n"),
};

__WEBPACK_IMPORTED_MODULE_1__wings3d__["onReady"](function() {
   // compiled the program
   cameraLight = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(cameraLight.vertex, cameraLight.fragment);

   solidColor = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(solidColor.vertex, solidColor.fragment);

   simplePoint = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(simplePoint.vertex, simplePoint.fragment);

   colorPoint = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(colorPoint.vertex, colorPoint.fragment);

   solidWireframe = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(solidWireframe.vertex, solidWireframe.fragment);

   colorWireframe = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(colorWireframe.vertex, colorWireframe.fragment);

   colorSolidWireframe = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(colorSolidWireframe.vertex, colorSolidWireframe.fragment);

   selectedColorLine = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(selectedColorLine.vertex, selectedColorLine.fragment);

   selectedColorPoint = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderProgram(selectedColorPoint.vertex, selectedColorPoint.fragment);
});



/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FaceMadsor", function() { return FaceMadsor; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_edgemads__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_bodymads__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_view__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_gl__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__wings3d_shaderprog__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__wings3d_ui__ = __webpack_require__(0);
/**
//    This module contains most face command and face utility functions.
//
//    
**/

   // for switching










class FaceMadsor extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["Madsor"] {
   constructor() {
      super('face');
      var self = this;
      // extrude
      const axisName = ['X', 'Y', 'Z'];
      // type handler 
      var self = this;
      // movement for (x, y, z)
      for (let axis=0; axis < 3; ++axis) {
         __WEBPACK_IMPORTED_MODULE_8__wings3d_ui__["bindMenuItem"]('#faceExtrude' + axisName[axis], function(ev) {
               __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["attachHandlerMouseMove"](new FaceExtrudeHandler(self, axis));
            });
      }
      __WEBPACK_IMPORTED_MODULE_8__wings3d_ui__["bindMenuItem"]('#faceExtrudeFree', function(ev) {
            __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["attachHandlerMouseMove"](new FaceExtrudeFreeHandler(self));
         });
      __WEBPACK_IMPORTED_MODULE_8__wings3d_ui__["bindMenuItem"]('#faceExtrudeNormal', function(ev) {
            __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["attachHandlerMouseMove"](new FaceExtrudeNormalHandler(self));
         });
      __WEBPACK_IMPORTED_MODULE_8__wings3d_ui__["bindMenuItem"]('#faceDissolve', function(ev) {
            const command = new DissolveFaceCommand(self);
            if (command.doIt()) {
               __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["undoQueue"](command);
            } else {
               geometryStatus('Selected Face not dissolveable');
            }
         });
      __WEBPACK_IMPORTED_MODULE_8__wings3d_ui__["bindMenuItem"]('#faceCollapse', function(ev) {
            const command = new CollapseFaceCommand(self);
            command.doIt();
            __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["undoQueue"](command);
         });
      // setup highlite face, at most 28 triangles.
      var buf = new Float32Array(3*30);
      this.trianglefan = {data: buf, length: 0};
      var layout = __WEBPACK_IMPORTED_MODULE_6__wings3d_gl__["ShaderData"].attribLayout();
      this.shaderData.setupAttribute('position', layout, this.trianglefan.data, __WEBPACK_IMPORTED_MODULE_6__wings3d_gl__["gl"].DYNAMIC_DRAW);  // needs to import gl.DYNAMIC_DRAW. 
   }

   modeName() {
      return 'Face';
   }

   // get selected Face's vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotFacePosition() );
      });
      return snapshots;
   }

   snapshotPositionAndNormal() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotFacePositionAndNormal() );
      });
      return snapshots;
   }

   // extrude Face
   extrude(reuseLoops) {
      var edgeLoops = [];
      this.eachPreviewCage( function(preview, contours) {
         edgeLoops.push( preview.extrudeFace(contours) );
      }, reuseLoops);
      return edgeLoops;
   }

   collapseEdge(extrudeEdgesContoursArray) {
      this.eachPreviewCage(function(cage, extrudeEdgesContours) {
         cage.collapseExtrudeEdge(extrudeEdgesContours.extrudeEdges);
      }, extrudeEdgesContoursArray);
   }

   // face dissolve mode
   dissolve() {
      const dissolve = {count: 0, record: []};
      this.eachPreviewCage(function(cage) {
         const record = cage.dissolveSelectedFace();
         dissolve.count += record.edges.length;
         dissolve.record.push( record );
      });
      return dissolve;
   }
   undoDissolve(dissolveArray) {
      this.eachPreviewCage( function(cage, dissolveEdge) {
         cage.undoDissolveFace(dissolveEdge);
      }, dissolveArray);
   }

   // face collapse 
   collapse() {
      const collapse = {count: 0, collapseArray: [], vertexArray: [], faceArray: []};
      this.eachPreviewCage(function(cage) {
         const record = cage.collapseSelectedFace();
         collapse.count += record.collapse.edge.length;
         collapse.collapseArray.push( record.collapse );
         collapse.vertexArray.push( record.selectedVertex );
         collapse.faceArray.push( record.selectedFace );
      });
      return collapse;
   }
   undoCollapse(collapseArray) {
      this.eachPreviewCage( function(cage, collapseEdge) {
         cage.undoCollapseFace(collapseEdge);
      }, collapseArray);
   }


   dragSelect(cage, selectArray, onOff) {
      if (this.currentEdge !== null) {
        if (cage.dragSelectFace(this.currentEdge, onOff)) {
            selectArray.push(this.currentEdge);
        }
      }
   }

   // select, hilite
   selectStart(preview) {
      // check not null, shouldn't happened
      if (this.currentEdge !== null) {
         var onOff = preview.selectFace(this.currentEdge);
         return new DragFaceSelect(this, preview, this.currentEdge, onOff);
      }    
   }

   showNewHilite(edge, intersect, center) {
      if ((this.currentEdge === null) || (this.currentEdge.face !== edge.face)) {   // make sure it new face
         if (edge.face.numberOfVertex < 17) {
            var position = this.trianglefan.data;
            var i = 0;
            position[i++] = center[0];
            position[i++] = center[1];
            position[i++] = center[2];
            edge.face.eachVertex( function(vertex) {
               position[i++] = vertex.vertex[0];
               position[i++] = vertex.vertex[1];
               position[i++] = vertex.vertex[2];
            });
            // copied the first vertex to complete fan
            position[i++] = position[3];
            position[i++] = position[4];
            position[i++] = position[5];
            this.trianglefan.length = i / 3;
            // update vbo buffer
            this.shaderData.uploadAttribute('position', 0, this.trianglefan.data);
         }
      }
   }

   _resetSelection(cage) {
      return cage._resetSelectFace();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreFaceSelection(snapshot);
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_edgemads__["EdgeMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreEdgeMode"];
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromFaceToEdgeSelect();
         });
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreVertexMode"];
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromFaceToVertexSelect();
         });
      } else {
         redoFn = __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreBodyMode"];
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromFaceToBodySelect();
         });
      }
      __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["undoQueue"](new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["ToggleModeCommand"](redoFn, __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreFaceMode"], snapshots));
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_edgemads__["EdgeMadsor"]) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromFaceToEdgeSelect(snapshot);
         }, snapshots);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromFaceToVertexSelect(snapshot);
         }, snapshots);
      } else {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromFaceToBodySelect(snapshot);
         }, snapshots);
      }
   }

   drawObject(gl) {
      // draw hilite
      gl.drawArrays(gl.TRIANGLE_FAN, 0, this.trianglefan.length);
   }

   previewShader(gl) {
      gl.useShader(__WEBPACK_IMPORTED_MODULE_7__wings3d_shaderprog__["colorSolidWireframe"]);
   }

   useShader(gl) {
      gl.useShader(__WEBPACK_IMPORTED_MODULE_7__wings3d_shaderprog__["solidColor"]);
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

class FaceExtrudeHandler extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["MouseMoveAlongAxis"] {
   constructor(madsor, axis) {
      const contourEdges = madsor.extrude();
      super(madsor, axis);
      this.contourEdges = contourEdges;
   }

   _commit() {
      __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["undoQueue"](new ExtrudeFaceCommand(this.madsor, this.movement, this.snapshots, this.contourEdges));
   }

   _cancel() {
      this.madsor.restoreMoveSelection(this.snapshots);
      this.madsor.collapseEdge(this.contourEdges);
   }
}

class FaceExtrudeFreeHandler extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["MoveFreePositionHandler"] {
   constructor(madsor) {
      const contourEdges = madsor.extrude();
      super(madsor);
      this.contourEdges = contourEdges;
   }

   _commit() {
      __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["undoQueue"](new ExtrudeFaceCommand(this.madsor, this.movement, this.snapshots, this.contourEdges));
   }

   _cancel() {
      this.madsor.restoreMoveSelection(this.snapshots);
      this.madsor.collapseEdge(this.contourEdges);
   }
}

class FaceExtrudeNormalHandler extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["MoveAlongNormal"] {
   constructor(madsor) {
      const contourEdges = madsor.extrude();
      super(madsor);
      this.contourEdges = contourEdges;
   }

   _commit() {
      __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["undoQueue"](new ExtrudeFaceCommand(this.madsor, this.movement, this.snapshots, this.contourEdges, true));
   }

   _cancel() {
      this.madsor.restoreMoveSelection(this.snapshots);
      this.madsor.collapseEdge(this.contourEdges);
   }
}

class ExtrudeFaceCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(faceMadsor, movement, snapshots, extrudeEdgesContours, useNormal = false) {
      super();
      this.madsor = faceMadsor;
      this.movement = movement;
      this.snapshots = snapshots;
      this.useNormal = useNormal;
      this.extrudeEdgesContoursArray = extrudeEdgesContours;
   }

   doIt() {
      this.extrudeEdgesContoursArray = this.madsor.extrude( this.extrudeEdgesContoursArray );
      if (this.useNormal) {
         this.snapshots = this.madsor.snapshotPositionAndNormal();
      } else {
         this.snapshots = this.madsor.snapshotPosition();
      }
      this.madsor.moveSelection(this.movement, this.snapshots);
   }

   undo() {
      this.madsor.restoreMoveSelection(this.snapshots);
      this.madsor.collapseEdge(this.extrudeEdgesContoursArray);
   }
}

class DissolveFaceCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      const dissolve = this.madsor.dissolve();
      if (dissolve.count > 0) {
         this.dissolve = dissolve.record;
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
      if (collapse.count > 0) {
         __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreVertexMode"](collapse.vertexArray);
         this.collapse = collapse.collapseArray;
         this.selectedFace = collapse.faceArray;
         return true;
      } else {
         return false;
      }
   }

   undo() {
      __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["currentMode"]().resetSelection();
      this.madsor.undoCollapse(this.collapse);
      __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreFaceMode"](this.selectedFace);
   }   
}




/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Madsor", function() { return Madsor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DragSelect", function() { return DragSelect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MovePositionHandler", function() { return MovePositionHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MouseMoveAlongAxis", function() { return MouseMoveAlongAxis; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MoveAlongNormal", function() { return MoveAlongNormal; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MoveFreePositionHandler", function() { return MoveFreePositionHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MoveCommand", function() { return MoveCommand; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ToggleModeCommand", function() { return ToggleModeCommand; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_undo__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_view__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_ui__ = __webpack_require__(0);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "EditCommand", function() { return __WEBPACK_IMPORTED_MODULE_1__wings3d_undo__["EditCommand"]; });
/*
 *
 * MADS (Modify, Add, Delete, Select) operation. 
 *
**/






class Madsor { // Modify, Add, Delete, Select, (Mads)tor. Model Object.
   constructor(mode) {
      this.currentEdge = null;
      this.shaderData = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderData();
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
         __WEBPACK_IMPORTED_MODULE_3__wings3d_ui__["bindMenuItem"]('#' + mode + 'Move' + axisName[axis], function(ev) {
               __WEBPACK_IMPORTED_MODULE_2__wings3d_view__["attachHandlerMouseMove"](new MouseMoveAlongAxis(self, axis));
            });
      }
      // free Movement.
      __WEBPACK_IMPORTED_MODULE_3__wings3d_ui__["bindMenuItem"]('#' + mode + 'MoveFree', function(ev) {
            __WEBPACK_IMPORTED_MODULE_2__wings3d_view__["attachHandlerMouseMove"](new MoveFreePositionHandler(self));
         });
      // normal Movement.
      __WEBPACK_IMPORTED_MODULE_3__wings3d_ui__["bindMenuItem"]('#' + mode + 'MoveNormal', function(ev) {
            __WEBPACK_IMPORTED_MODULE_2__wings3d_view__["attachHandlerMouseMove"](new MoveAlongNormal(self));
         });
   }

   getContextMenu() {
      var hasSelection = false;
      this.eachPreviewCage( function(cage) {
         hasSelection = hasSelection || cage.hasSelection();
      });
      if (hasSelection) {
         return this.contextMenu;
      } else {
         return null;
      }
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

   * selectableCage() {
      for (let i = 0; i < this.world.length; ++i) {
         let cage = this.world[i];
         if (!cage.isLock() && cage.isVisible()) {
            yield cage;
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

   _doSelection(doName, initialCount=0) {
      const snapshots = [];
      const self = this;
      doName = '_select' + this.modeName() + doName;
      let count = initialCount;        // set initialCount, so we can force undo
      this.eachPreviewCage( function(cage) {
         const selection = cage[doName]();
         snapshots.push( selection );
         count += selection.size;
      });
      if (count != 0) {
         return function() {
            self.resetSelection();
            self.restoreSelection(snapshots);
         }
      } // else
      return null;  
   }

   similarSelection() {
      return this._doSelection('Similar');
   }

   adjacentSelection() {
      return this._doSelection('Adjacent');
   }

   invertSelection() {
      return this._doSelection('Invert', 1);
   }

   allSelection() {
      return this._doSelection('All', 1);
   }

   lessSelection() {
      return this._doSelection('Less');
   }

   moreSelection() {
      return this._doSelection('More');
   }

   resetSelection() {
      const snapshots = [];
      const self = this;
      this.eachPreviewCage( function(cage) {
         snapshots.push( self._resetSelection(cage) );
      });
      return function() {
         self.restoreSelection(snapshots);
      }
   }

   restoreSelection(selection) {
      const self = this;
      this.eachPreviewCage( function(cage, snapshot) {
         self._restoreSelection(cage, snapshot);
      }, selection);     
   }

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

class MovePositionHandler extends __WEBPACK_IMPORTED_MODULE_1__wings3d_undo__["MouseMoveHandler"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
      // this.snapshots
      // this.movement
   }

   _commit() {
      __WEBPACK_IMPORTED_MODULE_2__wings3d_view__["undoQueue"](new MoveCommand(this.madsor, this.snapshots, this.movement));
   }

   _cancel() {
      this.madsor.restoreMoveSelection(this.snapshots);
   }
}

// movement handler.
class MouseMoveAlongAxis extends MovePositionHandler {
   constructor(madsor, axis) {   // 0 = x axis, 1 = y axis, 2 = z axis.
      super(madsor);
      this.snapshots = madsor.snapshotPosition();
      this.movement = [0.0, 0.0, 0.0];             // cumulative movement.
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


class MoveAlongNormal extends MovePositionHandler {
   constructor(madsor) {
      super(madsor);
      this.snapshots = madsor.snapshotPositionAndNormal();
      this.movement = 0.0;                    // cumulative movement.
   }

   handleMouseMove(ev) {
      var move = this._calibrateMovement(ev.movementX);
      this.madsor.moveSelection(move, this.snapshots);
      this.movement += move;
   }
}


class MoveFreePositionHandler extends MovePositionHandler {
   constructor(madsor) {
      super(madsor);
      this.snapshots = madsor.snapshotPosition();
      this.movement = [0.0, 0.0, 0.0];             // cumulative movement.
   }

   handleMouseMove(ev, cameraView) {
      var x = this._calibrateMovement(ev.movementX);
      var y = this._calibrateMovement(-ev.movementY);
      var cam = cameraView.inverseCameraVectors();
      // move parallel to camera.
      var movement = [cam.x[0]*x + cam.y[0]*y, cam.x[1]*x + cam.y[1]*y, cam.x[2]*x + cam.y[2]*y];
      this.madsor.moveSelection(movement, this.snapshots);
      vec3.add(this.movement, this.movement, movement);
   }
}


class MoveCommand extends __WEBPACK_IMPORTED_MODULE_1__wings3d_undo__["EditCommand"] {
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


class ToggleModeCommand extends __WEBPACK_IMPORTED_MODULE_1__wings3d_undo__["EditCommand"] {
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



/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EdgeMadsor", function() { return EdgeMadsor; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_bodymads__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_ui__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_view__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__wings3d_shaderprog__ = __webpack_require__(5);
/**
//    This module contains most edge command and edge utility functions.
//
//    
**/

   // for switching








// 
class EdgeMadsor extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["Madsor"] {
   constructor() {
      super('edge');
      // cut commands
      const self = this;
      for (let numberOfSegments of [2, 3, 4, 5, 10]) {
         __WEBPACK_IMPORTED_MODULE_5__wings3d_ui__["bindMenuItem"]('#cutLine'+numberOfSegments, function(ev) {
               self.cutEdge(numberOfSegments);
            });
      }
      // cutEdge Dialog
      const form = __WEBPACK_IMPORTED_MODULE_5__wings3d_ui__["setupDialog"]('#cutLineDialog', function(data) {
         if (data['Segments']) {
            const number = parseInt(data['Segments'], 10);
            if ((number != NaN) && (number > 0) && (number < 100)) { // sane input
               self.cutEdge(number);
            }
         }
      });
      if (form) {
         // show form when click
         __WEBPACK_IMPORTED_MODULE_5__wings3d_ui__["bindMenuItem"]('#cutAsk', function(ev) {
               // position then show form;
               __WEBPACK_IMPORTED_MODULE_5__wings3d_ui__["positionDom"](form, __WEBPACK_IMPORTED_MODULE_5__wings3d_ui__["getPosition"](ev));
               form.style.display = 'block';
               form.reset();
            });
      }
      // cutAndConnect
      __WEBPACK_IMPORTED_MODULE_5__wings3d_ui__["bindMenuItem"]('#cutAndConnect', function(ev) {
            self.cutAndConnect();
         });
      // Dissolve
      __WEBPACK_IMPORTED_MODULE_5__wings3d_ui__["bindMenuItem"]('#edgeDissolve', function(ev) {
            const dissolve = self.dissolve();
            if (dissolve.count > 0) {
               __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](new DissolveEdgeCommand(self, dissolve.record));
            } else {
               // should not happened.
            }
         });
      // Collapse
      __WEBPACK_IMPORTED_MODULE_5__wings3d_ui__["bindMenuItem"]('#edgeCollapse', function(ev) {
            const command = new CollapseEdgeCommand(self);
            if (command.doIt()) {
               __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](command);
            } else {
               // should not happened.
            }
         });
   }

   modeName() {
      return 'Edge';
   }

   // get selected Edge's vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotEdgePosition() );
      });
      return snapshots;
   }

   snapshotPositionAndNormal() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotEdgePositionAndNormal() );
      });
      return snapshots;
   }

   cutEdge(numberOfSegments) {
      const cutEdge = new CutEdgeCommand(this, numberOfSegments);
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](cutEdge);
      cutEdge.doIt();
   }

   cutAndConnect() {
      const cutEdge = new CutEdgeCommand(this, 2);
      cutEdge.doIt();
      let vertexMadsor = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["currentMode"]();   // assurely it vertexMode
      let result = vertexMadsor.connect();
      if (result) {
         const vertexConnect = new VertexConnectCommand(vertexMadsor, result);
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueueCombo"]([cutEdge, vertexConnect]);
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreEdgeMode"](result.wingedEdgeList);
      } else { // no connection possible
         cutEdge.undo();
         // post on geomoetryStatus
         
      }
   }

   cut(numberOfSegments) {
      var snapshots = {vertices: [], splitEdges: []};
      this.eachPreviewCage( function(preview) {
         const snapshot = preview.cutEdge(numberOfSegments);
         snapshots.vertices.push( snapshot.vertices );
         snapshots.splitEdges.push( snapshot.splitEdges );
      });
      return snapshots;
   }

   collapseEdge(splitEdgesArray) {  // undo of splitEdge.
      this.eachPreviewCage(function(cage, splitEdges) {
         cage.collapseSplitEdge(splitEdges);
      }, splitEdgesArray);
   }

   // dissolve edge
   dissolve() {
      const dissolve = {count: 0, record: []};
      this.eachPreviewCage(function(cage) {
         const record = cage.dissolveSelectedEdge();
         dissolve.count += record.length;
         dissolve.record.push( record );
      });
      return dissolve;
   }
   reinsertDissolve(dissolveEdgesArray) {
      this.eachPreviewCage(function(cage, dissolveEdges) {
         cage.reinsertDissolveEdge(dissolveEdges);
      }, dissolveEdgesArray);
   }

   // collapse edge
   collapse() {
      const collapse = {count: 0, collapseArray: [], vertexArray: []};
      const selectedVertex = [];
      this.eachPreviewCage(function(cage) {
         const record = cage.collapseSelectedEdge();
         collapse.count += record.collapse.edge.length;
         collapse.collapseArray.push( record.collapse );
         collapse.vertexArray.push( record.selectedVertex );
      });
      return collapse;
   }

   restoreEdge(collapseEdgesArray) {
      this.eachPreviewCage(function(cage, collapseEdges) {
         cage.restoreCollapseEdge(collapseEdges);
      }, collapseEdgesArray);
   }


   dragSelect(cage, selectArray, onOff) {
      if (this.currentEdge !== null) {
        if (cage.dragSelectEdge(this.currentEdge, onOff)) {
            selectArray.push(this.currentEdge);
        }
      }
   }

   // select, hilite
   selectStart(cage) {
      if (this.currentEdge !== null) {
         var onOff = cage.selectEdge(this.currentEdge);
         return new DragEdgeSelect(this, cage, this.currentEdge, onOff);
      }
      return null;
   }

   hideOldHilite() {
      //if (this.currentEdge) {
         this.preview.hiliteEdge(this.currentEdge, false);
      //}
   }

   showNewHilite(edge, intersect, _center) {
      // setting of setCurrentEdge
      //if (this.currentEdge) {
         this.preview.hiliteEdge(edge, true);
      //}
   }

   _resetSelection(cage) {
      return cage._resetSelectEdge();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreEdgeSelection(snapshot);
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreFaceMode"];
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromEdgeToFaceSelect();
         });
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"];
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromEdgeToVertexSelect();
         });         
      } else {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreBodyMode"];
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromEdgeToBodySelect();
         });
      }
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["ToggleModeCommand"](redoFn, __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreEdgeMode"], snapshots));
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromEdgeToFaceSelect(snapshot);
         }, snapshots);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromEdgeToVertexSelect(snapshot);
         }, snapshots);
      } else {
           this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromEdgeToBodySelect(snapshot);
         }, snapshots);       
      }
   }

   draw(gl) {
      //if (this.currentEdge) {
         this.useShader(gl);
         gl.bindTransform();
         this.eachPreviewCage( function(preview) {
            preview.drawEdge(gl);
         });
         gl.disableShader();
      //}
   }

   previewShader(gl) {
      gl.useShader(__WEBPACK_IMPORTED_MODULE_7__wings3d_shaderprog__["solidWireframe"]);
   }

   useShader(gl) {
      //gl.useShader(ShaderProg.solidColor);
      gl.useShader(__WEBPACK_IMPORTED_MODULE_7__wings3d_shaderprog__["selectedColorLine"]);
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
      this.selectedEdges = [];
      this.numberOfSegments = numberOfSegments;
      const self = this;
      this.madsor.eachPreviewCage( function(cage) {
         self.selectedEdges.push( cage.snapshotSelection() );
      });
   }

   doIt() {
      const snapshots = this.madsor.cut(this.numberOfSegments);
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"](snapshots.vertices);    // abusing the api?
      this.splitEdges = snapshots.splitEdges;
   }

   undo() {
      // restoreToEdgeMode
      this.madsor.collapseEdge(this.splitEdges);
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreEdgeMode"](this.selectedEdges);
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
      if (collapse.count > 0) {
         __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"](collapse.vertexArray);
         this.collapse = collapse.collapseArray;
         return true;
      } else {
         return false;
      }
   }

   undo() {
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["currentMode"]().resetSelection();
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreEdgeMode"]();
      this.madsor.restoreEdge(this.collapse);
   }
}



/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BodyMadsor", function() { return BodyMadsor; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_edgemads__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_shaderprog__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_view__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__ = __webpack_require__(0);
//
// bodymadsor. 
//


   // for switching








class BodyMadsor extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["Madsor"] {
   constructor() {
      super('body');
      const self = this;
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"]('#bodyDelete', function(ev) {
            const command = new DeleteBodyCommand(self.getSelected());
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"]( command );
            command.doIt(); // delete current selected.
         });
      const form = __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["setupDialog"]('#renameDialog', function(data) {
         const command = new RenameBodyCommand(self.getSelected(), data);
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"]( command );
            command.doIt();   // rename
         });
      if (form) {
         // show Form when menuItem clicked
         const content = document.querySelector('#renameDialog div');
         __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"]('#bodyRename', function(ev) {
               // position then show form;
               __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["positionDom"](form, __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["getPosition"](ev));
               form.style.display = 'block';
               // remove old label
               form.reset();
               let labels = document.querySelectorAll('#renameDialog label');
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
      }
      const axisName = ['X', 'Y', 'Z'];
      // movement for (x, y, z)
      for (let axis=0; axis < 3; ++axis) {
         __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"]('#bodyDuplicateMove' + axisName[axis], function(ev) {
               __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["attachHandlerMouseMove"](new DuplicateMouseMoveAlongAxis(self, axis, self.getSelected()));
            });
      }
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"]('#bodyDuplicateMoveFree', function(ev) {
            __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["attachHandlerMouseMove"](new DuplicateMoveFreePositionHandler(self, self.getSelected()));
         });
   }

   modeName() {
      return 'Body';
   }

   getSelected() {
      const selection = [];
      this.eachPreviewCage( function(cage) {
         if (cage.hasSelection()) {
            selection.push(cage);
         }
      });
      return selection;
   }

   snapshotPosition() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotBodyPosition() );
      });
      return snapshots;
   }

   dragSelect(cage, selectArray, onOff) {
      if (this.currentEdge !== null) {
       // if (cage.dragSelectFace(this.currentEdge, onOff)) {
       //     selectArray.push(this.currentEdge);
       // }
      }
   }

   // select, hilite
   selectStart(preview) {
      // check not null, shouldn't happened
      if (this.currentEdge !== null) {
         var onOff = preview.selectBody();
         return new DragBodySelect(this, preview, this.currentEdge, onOff);
      }    
   }

   hideOldHilite() {
      this.preview.hiliteBody(false);
   }

   showNewHilite(_edge, _intersect, _center) {
      this.preview.hiliteBody(true);
   }

   similarSelection() {
      // first compute selected body's metric
      const snapshot = new Set;
      this.eachPreviewCage( function(cage) {
         if (cage.hasSelection()) {
            const size = cage._getGeometrySize();
            const metric = size.vertex*3 + size.edge*2 + size.face;
            snapshot.add(metric);
         } 
      });
      const restore = [];
      // now check if some of the unselected bodys match selected body.
      this.eachPreviewCage( function(cage) {
         if (!cage.hasSelection()) {
            const size = cage._getGeometrySize();
            const metric = size.vertex*3 + size.edge*2 + size.face;
            if (snapshot.has(metric)) {
               cage.selectBody();
               restore.push(cage);
            }
         }
      });
      if (restore.length > 0) {
         return function() {  // restore to previous state
            for (let cage in restore) {
               cage.selectBody();
            }
         };
      } else {
         return null;
      }
   }

   adjacentSelection() {
      return null;   // does nothing.
   }

   moreSelection() {
      return null;      // does nothing.
   }

   _resetSelection(cage) {
      return cage._resetBody();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreBodySelection(snapshot);
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreFaceMode"];
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromBodyToFaceSelect();
         });
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreVertexMode"];
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromBodyToVertexSelect();
         });
      } else {
         redoFn = __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreEdgeMode"];
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromBodyToEdgeSelect();
         });
      }
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueue"](new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["ToggleModeCommand"](redoFn, __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["restoreBodyMode"], snapshots));
   }

   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromBodyToFaceSelect(snapshot);
         }, snapshots);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_vertexmads__["VertexMadsor"]) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromBodyToVertexSelect(snapshot);
         }, snapshots);
      } else {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromBodyToEdgeSelect(snapshot);
         }, snapshots);
      }
   }

   draw(gl) {} // override draw

   previewShader(gl) {
      gl.useShader(__WEBPACK_IMPORTED_MODULE_5__wings3d_shaderprog__["colorSolidWireframe"]);
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
         let duplicate = PreviewCage.duplicate(cage);
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

   _commit() {
      const movement = new MoveCommand(this.madsor, this.snapshots, this.movement);
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueueCombo"]([this.duplicateBodyCommand, movement]);
   }

   _cancel() {
      // no needs to restore position. /this.madsor.restoreMoveSelection(this.snapshots);
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

   _commit() {
      const movement = new MoveCommand(this.madsor, this.snapshots, this.movement);
      __WEBPACK_IMPORTED_MODULE_6__wings3d_view__["undoQueueCombo"]([this.duplicateBodyCommand, movement]);
   }

   _cancel() {
      // no needs to restore position. /this.madsor.restoreMoveSelection(this.snapshots);
      this.duplicateBodyCommand.undo();
   }

}



/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "VertexMadsor", function() { return VertexMadsor; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_bodymads__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_edgemads__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_view__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_shaderprog__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__ = __webpack_require__(0);
/**
//    This module handle most vertex edit command.
//
//    
**/

   // for switching









class VertexMadsor extends __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["Madsor"] {
   constructor() {
      super('vertex');
      this.currentVertex = null;
      const self = this;
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"]('#vertexConnect', function(ev) {
            self.connectVertex();
         });
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"]('#vertexDissolve', function(ev) {
            const dissolve = new VertexDissolveCommand(self);
            dissolve.doIt();
            __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["undoQueue"](dissolve);
         });
      __WEBPACK_IMPORTED_MODULE_7__wings3d_ui__["bindMenuItem"]('#vertexCollapse', function(ev) {
            const dissolve = new VertexCollapseCommand(self);
            dissolve.doIt();
            __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["undoQueue"](dissolve);
         });
   }

   modeName() {
      return 'Vertex';
   }

   // get selected vertex snapshot. for doing, and redo queue. 
   snapshotPosition() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotVertexPosition() );
      });
      return snapshots;
   }

   snapshotPositionAndNormal() {
      var snapshots = [];
      this.eachPreviewCage( function(preview) {
         snapshots.push( preview.snapshotVertexPositionAndNormal() );
      });
      return snapshots;
   }

   connectVertex() {
      const cageArray = this.connect();
      if (cageArray) {
         const vertexConnect = new VertexConnectCommand(this, cageArray);
         __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["undoQueue"](vertexConnect);
         __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreEdgeMode"](cageArray.wingedEdgeList);    // abusing the api?
      } else {
         // show no connection possible message.

      }
   }

   connect() {
      let snapshots = {edgeList: [], wingedEdgeList: []};
      let total = 0;
      this.eachPreviewCage( function(cage) {
         const snapshot = cage.connectVertex();
         total += snapshot.edgeList.length;
         snapshots.edgeList.push( snapshot.edgeList );
         snapshots.wingedEdgeList.push( snapshot.wingedEdgeList );
      });
      if (total > 0) {
         return snapshots;
      }
      // return undefined, or null?
      return undefined;
   };

   dissolveConnect(edgesArray) {
      this.eachPreviewCage( function(cage, edges) {
         cage.dissolveConnect(edges);
      }, edgesArray);
   }

   dissolve() {
      const dissolve = {count: 0, undoArray: [], selectedFace: []};
      this.eachPreviewCage(function(cage) {
         const undo = cage.dissolveSelectedVertex();
         dissolve.count += undo.array.length;
         dissolve.undoArray.push( undo.array );
         dissolve.selectedFace.push( undo.selectedFace );
      });
      return dissolve;
   }

   undoDissolve(dissolveArray) {
      this.eachPreviewCage( function(cage, dissolveVertex) {
         cage.undoDissolveVertex(dissolveVertex);
      }, dissolveArray);
   }

   dragSelect(cage, selectArray, onOff) {
      if (this.currentVertex !== null) {
        if (cage.dragSelectVertex(this.currentVertex, onOff)) {
            selectArray.push(this.currentVertex);
        }
      }
   }

   selectStart(cage) {
      //
      if (this.currentVertex !== null) {
         var onOff = this.preview.selectVertex(this.currentVertex);
         return new DragVertexSelect(this, cage, this.currentVertex, onOff);
      }
      return null;
   }

   setCurrent(edge, intersect, center) {
      // find out origin, dest. which is closer.
      var currentVertex = null;
      if (edge !== null) {
         currentVertex = edge.destination();
         var distance0 = vec3.distance(edge.origin.vertex, intersect);
         var distance1 = vec3.distance(currentVertex.vertex, intersect);
         if (distance0 < distance1) {
            currentVertex = edge.origin;
         }
      }
      if (currentVertex !== this.currentVertex) {
         if (this.currentVertex !== null) {
            this.preview.hiliteVertex(this.currentVertex, false);
         }
         if (currentVertex !== null) {
            this.preview.hiliteVertex(currentVertex, true);
         }
         this.currentVertex = currentVertex;
      }
      this.currentEdge = edge;
   }

   _resetSelection(cage) {
      return cage._resetSelectVertex();
   }

   _restoreSelection(cage, snapshot) {
      cage.restoreVertexSelection(snapshot);
   }

   toggleFunc(toMadsor) {
      var redoFn;
      var snapshots = [];
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreFaceMode"];
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromVertexToFaceSelect();
         } );
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_edgemads__["EdgeMadsor"]) {
         redoFn = __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreEdgeMode"];
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromVertexToEdgeSelect();
         });
      } else {
         redoFn = __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreEdgeMode"];
         this.eachPreviewCage( function(cage) {
            snapshots.push( cage.snapshotSelection() );
            cage.changeFromVertexToBodySelect();
         });      
      }
      __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["undoQueue"]( new __WEBPACK_IMPORTED_MODULE_0__wings3d_mads__["ToggleModeCommand"](redoFn, __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreVertexMode"], snapshots) );
   }


   restoreMode(toMadsor, snapshots) {
      if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_1__wings3d_facemads__["FaceMadsor"]) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromVertexToFaceSelect(snapshot);
         }, snapshots);
      } else if (toMadsor instanceof __WEBPACK_IMPORTED_MODULE_3__wings3d_edgemads__["EdgeMadsor"]) {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromVertexToEdgeSelect(snapshot);
         }, snapshots);
      } else {
         this.eachPreviewCage( function(cage, snapshot) {
            cage.restoreFromVertexToBodySelect(snapshot);
         }, snapshots);
      }
   }

   draw(gl) {
      // draw hilite
      //if (this.currentEdge) {
         this.useShader(gl);
         gl.bindTransform();
         this.eachPreviewCage( function(preview) {
            preview.drawVertex(gl);
         });
         gl.disableShader();
      //}
   }

   previewShader(gl) {
      gl.useShader(__WEBPACK_IMPORTED_MODULE_6__wings3d_shaderprog__["solidWireframe"]);
   }

   useShader(gl) {
      gl.useShader(__WEBPACK_IMPORTED_MODULE_6__wings3d_shaderprog__["selectedColorPoint"]);
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
   constructor(madsor, cageArray) {
      super();
      this.madsor = madsor;
      this.cageArray = cageArray;
   }

   doIt() {
      // reconnect
      this.cageArray = this.madsor.connect();
      // goes to edgeMode.
      __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreEdgeMode"](this.cageArray.wingedEdgeList);    // abusing the api?
   }

   undo() {
      // restore to vertexMode.
      __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreVertexMode"]();
      // dissolve the connect edges.
      this.madsor.dissolveConnect(this.cageArray.edgeList);
   }  
}

class VertexDissolveCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      // dissolve
      const dissolve = this.madsor.dissolve();
      this.undoArray = dissolve.undoArray;         // guaranteed to have the dissolve vertex
   }

   undo() {
      this.madsor.undoDissolve(this.undoArray);
   }
}

class VertexCollapseCommand extends __WEBPACK_IMPORTED_MODULE_4__wings3d_undo__["EditCommand"] {
   constructor(madsor) {
      super();
      this.madsor = madsor;
   }

   doIt() {
      // collapse, is just like dissolve, but switch to facemode
      const dissolve = this.madsor.dissolve();
      this.undoArray = dissolve.undoArray;
      __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreFaceMode"](dissolve.selectedFace);
   }

   undo() {
      this.madsor.resetSelection();
      __WEBPACK_IMPORTED_MODULE_5__wings3d_view__["restoreVertexMode"]();
      this.madsor.undoDissolve(this.undoArray);
   }
}




/***/ }),
/* 11 */
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_js__ = __webpack_require__(1);
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
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PreviewCage", function() { return PreviewCage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CreatePreviewCageCommand", function() { return CreatePreviewCageCommand; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_boundingvolume__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_wingededge__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_view__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_undo__ = __webpack_require__(4);
/*
*  hold onto a WingedEdgeTopology. adds index, texture, etc....
*  bounding box, picking.
* 
*  previewCage. Internal representation rewrote many times.
*  Finally decided to trade space for ease of implementation and 
#  no worst case non linear runtimes.
* 
*/

 







const PreviewCage = function(mesh) {
   this.geometry = mesh;
   this.preview = {centroid: {}};
   this.preview.shaderData = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderData();
   this.preview.shaderData.setUniform3fv("faceColor", [0.5, 0.5, 0.5]);
   this.preview.shaderData.setUniform3fv("selectedColor", [1.0, 0.0, 0.0]);
   var layoutVec = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["ShaderData"].attribLayout();
   var layoutFloat = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["ShaderData"].attribLayout(1);
   this.preview.shaderData.createAttribute('position', layoutVec, __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].STATIC_DRAW);
   this.preview.shaderData.createAttribute('barycentric', layoutVec, __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].STATIC_DRAW);
   this.preview.shaderData.createAttribute('selected', layoutFloat, __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].DYNAMIC_DRAW);
   this._resizeBoundingSphere(0);
   this._resizePreview(0, 0);


   // previewEdge
   this.previewEdge = {};
   this.previewEdge.shaderData = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderData();
   this.previewEdge.shaderData.setUniform4fv("selectedColor", [1.0, 0.0, 0.0, 1.0]);
   this.previewEdge.shaderData.setUniform4fv('hiliteColor', [0.0, 1.0, 0.0, 1.0]);
   this.previewEdge.shaderData.createAttribute('position', layoutVec, __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].STATIC_DRAW);
   this.previewEdge.shaderData.createAttribute('color', layoutFloat, __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].DYNAMIC_DRAW);
   this._resizePreviewEdge(0);

   // previewVertex
   this.previewVertex = {};
   this.previewVertex.shaderData = __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].createShaderData();
   this.previewVertex.shaderData.setUniform4fv("selectedColor", [1.0, 0.0, 0.0, 1.0]);
   this.previewVertex.shaderData.setUniform4fv('hiliteColor', [0.0, 1.0, 0.0, 1.0]);
   this.previewVertex.shaderData.createAttribute('position', layoutVec, __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].STATIC_DRAW);
   this.previewVertex.shaderData.createAttribute('color', layoutFloat, __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__["gl"].DYNAMIC_DRAW);
   this._resizePreviewVertex(0);
   // body state.
   this.previewBody = {hilite: false};
   // selecte(Vertex,Edge,Face)here
   this.selectedSet = new Set;
   this.groupSelection = false;
   // default no name
   this.name = "";
};

PreviewCage.CONST = (function() {
   var constant = {};

   constant.SELECTON  = new Float32Array(1);
   constant.SELECTON[0] = 1.0;
   constant.SELECTOFF = new Float32Array(1);
   constant.SELECTOFF[0] = 0.0;
   constant.BARYCENTRIC = new Float32Array(3);
   constant.BARYCENTRIC[0] = 1.0;
   constant.BARYCENTRIC[1] = 0.0;
   constant.BARYCENTRIC[2] = 1.0;
   return constant;
}());


PreviewCage.duplicate = function(originalCage) {
   // copy geometry.
   const geometry = new __WEBPACK_IMPORTED_MODULE_2__wings3d_wingededge__["WingedTopology"]( originalCage.geometry.vertices.length*2 );
   for (let vertex of originalCage.geometry.vertices) {
      geometry.addVertex(vertex.vertex);
   }
   for (let polygon of originalCage.geometry.faces) {
      let index = [];
      polygon.eachVertex( function(vertex) {
         index.push( vertex.index );
      });
      geometry.addPolygon(index);
   }
   geometry.clearAffected();
   // new PreviewCage, and new name
   const previewCage = new PreviewCage(geometry);
   previewCage.name = originalCage.name + "_copy1";

   return previewCage;
};


PreviewCage.prototype._getGeometrySize = function() {
   return { face: this.geometry.faces.length,
            edge: this.geometry.edges.length,
            vertex: this.geometry.vertices.length
          };
};


PreviewCage.prototype._resizeBoundingSphere = function(oldSize) {
   let size = this.geometry.faces.length - oldSize;
   if (size > 0) {   // we only care about growth for now
      if (oldSize > 0) {
         if (this.preview.centroid.buf.data.length < (this.preview.centroid.buf.len+(size*3))) {
            // needs to resize, and copy
            const buf = new ArrayBuffer(this.geometry.faces.length * 3 * Float32Array.BYTES_PER_ELEMENT * 2);
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
         const buf = new ArrayBuffer(this.geometry.faces.length * 3 * Float32Array.BYTES_PER_ELEMENT * 2); // twice the current size
         this.preview.centroid.buf = {buffer: buf, data: new Float32Array(buf), len: 0};
         // assign a boundingsphere for each polygon.
         this.boundingSpheres = new Array(this.geometry.faces.length);
         this.boundingSpheres.length = 0;
      }
      // create New, should not have deleted sphere to mess up things
      const centroid = this.preview.centroid;   // 
      for (let i = oldSize; i < this.geometry.faces.length; ++i) {
         const center = new Float32Array(centroid.buf.buffer, Float32Array.BYTES_PER_ELEMENT*centroid.buf.len, 3);
         centroid.buf.len += 3;
         const polygon = this.geometry.faces[i];
         //polygon.index = i; // recalibrate index for free.
         this.boundingSpheres.push( __WEBPACK_IMPORTED_MODULE_1__wings3d_boundingvolume__["BoundingSphere"].create(polygon, center) );
      }
      // vertices is geometry data + centroid data.
   }
};

PreviewCage.prototype._resizePreview = function(oldSize, oldCentroidSize) {
   const size = this.geometry.vertices.length - oldSize;
   const centroidSize = this.geometry.faces.length - oldCentroidSize;
   if ((size > 0) || (centroidSize > 0)) {
      const model = this;
      let length = model.geometry.buf.data.length;
      let centroidLength = model.preview.centroid.buf.data.length;
      if (oldSize > 0) {
         if (length > model.preview.barycentric.length) {
            // create new length
            model.preview.barycentric = new Float32Array(length);
            let selected = new Float32Array(length/3);
            selected.set(model.preview.selected);
            model.preview.selected = selected;
         }
         if (centroidLength > model.preview.centroid.barycentric.length) {
            model.preview.centroid.barycentric = new Float32Array(centroidLength);
            let selected = new Float32Array(centroidLength/3);
            selected.set(model.preview.centroid.selected);
            model.preview.centroid.selected = selected;
         }
      } else { // brand new
         // created array
         model.preview.barycentric = new Float32Array(length);
         model.preview.selected = new Float32Array(length/3);
      
         model.preview.centroid.barycentric = new Float32Array(centroidLength);
         model.preview.centroid.selected = new Float32Array(centroidLength/3);
      }
      model.preview.barycentric.set(PreviewCage.CONST.BARYCENTRIC);
      model.preview.selected.fill(0.0, oldSize);
      model.preview.centroid.barycentric.fill(1.0);
      model.preview.centroid.selected.fill(0.0, oldCentroidSize);
      // upload the data to webgl
      length = this.geometry.buf.len;
      centroidLength = this.preview.centroid.buf.len;
      model.preview.shaderData.resizeAttribute('position', (length+centroidLength)*4);
      model.preview.shaderData.uploadAttribute('position', 0, this.geometry.buf.data.subarray(0, length));
      model.preview.shaderData.uploadAttribute('position', length*4, this.preview.centroid.buf.data.subarray(0, centroidLength));
      model.preview.shaderData.resizeAttribute('barycentric', (length+centroidLength)*4);
      model.preview.shaderData.uploadAttribute('barycentric', 0, this.preview.barycentric.subarray(0, length));
      model.preview.shaderData.uploadAttribute('barycentric', length*4, this.preview.centroid.barycentric.subarray(0, centroidLength));
      length /= 3;
      centroidLength /= 3;
      model.preview.shaderData.resizeAttribute('selected', (length+centroidLength) * 4);
      model.preview.shaderData.uploadAttribute('selected', 0, this.preview.selected.subarray(0, length));
      model.preview.shaderData.uploadAttribute('selected', length*4, this.preview.centroid.selected.subarray(0, centroidLength));
   }
      
   // compute index.
   this._computePreviewIndex();
};

PreviewCage.prototype._computePreviewIndex = function() {
   this.numberOfTriangles = this.geometry.faces.reduce( function(acc, element) {
      return acc + element.numberOfVertex; // -2; for half the vertex
   }, 0);
   const index = new Uint32Array(this.numberOfTriangles*3 );
   let length = 0;
   // recompute all index. (no optimization unless prove to be bottleneck)
   let barycentric = this.geometry.vertices.length;
   for (let sphere of this.boundingSpheres) {
      if (sphere.isReal()) {     // skip over deleted sphere.
         const polygon = sphere.polygon;
         //sphere.indexStart = model.preview.index.length;
         let indicesLength = 0;
         polygon.eachEdge( function(edge) {
            const vertex = edge.origin;
            if (indicesLength > 0) {
               index[length+indicesLength++] = vertex.index;
               index[length+indicesLength++] = barycentric; 
            }
            index[length+indicesLength++] = vertex.index;         
         });
         // last triangle using the first vertices.
         index[length+indicesLength++] = index[length];
         index[length+indicesLength++] = barycentric;
         length += indicesLength;
         //sphere.indexEnd = model.preview.index.length;
      }
      barycentric++;
   }
   // save it to the buffer 
   this.preview.shaderData.setIndex(index);
   this.preview.indexLength = length;
};

PreviewCage.prototype._updateAffected = function(affected) {
   if (affected.vertices.size > 0) {
      for (let vertex of affected.vertices) {
         this._updateVertex(vertex, affected);
      }
   }
   if (affected.edges.size > 0) {
      for (let edge of affected.edges) {
         this._updatePreviewEdge(edge.left, true);
      }
   }
   if (affected.faces.size > 0) {
      for (let face of affected.faces) {
         this._updatePreview(face);
      }
      // update index

   }

   this.geometry.clearAffected();
};


PreviewCage.prototype._updateVertex = function(vertex, affected) {
   if (vertex.isReal()) {
      // first the simple case, update the vertexPreview,
      const index = vertex.index;
      this.previewVertex.shaderData.uploadAttribute('position', vertex.vertex.byteOffset, vertex.vertex);

      // then update the effectedEdge and effectedFaces.
//      vertex.eachOutEdge( function(halfEdge) {
//         if (!affected.edges.has(halfEdge.wingedEdge)) {    // check edge
//            affected.edges.add(halfEdge.wingedEdge);        // should not happened, for debugging purpose.
//         }
      //   const face = halfEdge.face;
      //   if ((face!==null) && !affected.faces.has(face)) {  // check face
      //      affected.faces.add(face);               // should not happened, for debugging purpose.
      //   }
//      });

      // update preview too.
      this.preview.shaderData.uploadAttribute('position', vertex.vertex.byteOffset, vertex.vertex);
   }
};

PreviewCage.prototype._updatePreview = function(polygon) {
   // recompute boundingSphere centroid, and if numberOfVertex changed, needs to recompute index.
   if ((polygon.index < this.boundingSpheres.length) && polygon.isReal()) { // will be get recompute on resize
      const sphere = this.boundingSpheres[ polygon.index ];
      sphere.setSphere( __WEBPACK_IMPORTED_MODULE_1__wings3d_boundingvolume__["BoundingSphere"].computeSphere(sphere.polygon, sphere.center) ); 
      // update center.
      const index = this.geometry.vertices.length+polygon.index;
      this.preview.shaderData.uploadAttribute('position', index*3*4, sphere.center);
   }
};


PreviewCage.prototype._updatePreviewEdge = function(edge, updateShader) {
   const wingedEdge = edge.wingedEdge;
   if (wingedEdge.isReal()) {
      const index = wingedEdge.index * 6; // 2*3
      this.previewEdge.line.set(edge.origin.vertex, index);
      this.previewEdge.line.set(edge.pair.origin.vertex, index+3);

      if (updateShader) {
         this.previewEdge.shaderData.uploadAttribute('position', index*4, this.previewEdge.line.subarray(index, index+6));
      }
   } else {    // deleted edge. deselcted, dehilite.
      const index = wingedEdge.index*2;
      const color = this.previewEdge.color.subarray(index, index+2);
      color.fill(0.0);
      //this.previewEdge.color.fill(0.0, wingedEdge.index, wingedEdge.index+2);

      //if (updateShader) {
         this.previewEdge.shaderData.uploadAttribute('color', index*4, color);
      //}
   }
};

PreviewCage.prototype._resizePreviewEdge = function(oldSize) {
   const size = this.geometry.edges.length - oldSize;
   if (size > 0) {
      if (oldSize > 0) {
         let line = new Float32Array(this.geometry.edges.length*2*3);
         line.set(this.previewEdge.line);
         this.previewEdge.line = line;
         let color = new Float32Array(this.geometry.edges.length*2);
         color.set(this.previewEdge.color);
         this.previewEdge.color = color;
      } else { // brand new
         this.previewEdge.line = new Float32Array(this.geometry.edges.length*2*3);
         this.previewEdge.color = new Float32Array(this.geometry.edges.length*2);
      }
      for (let i = oldSize, j=(oldSize*2*3); i < this.geometry.edges.length; i++) {
         let wingedEdge = this.geometry.edges[i];
         for (let halfEdge of wingedEdge) {
            if (wingedEdge.isReal()) {
               this.previewEdge.line.set(halfEdge.origin.vertex, j);
            } else {
               this.previewEdge.line.fill(0.0, j, j+3);
            }
            j += 3;
         }
      }
      //
      this.previewEdge.color.fill(0.0, oldSize*2);
      // update webgl
      this.previewEdge.shaderData.resizeAttribute('position', this.previewEdge.line.length*4);
      this.previewEdge.shaderData.uploadAttribute('position', 0, this.previewEdge.line);
      this.previewEdge.shaderData.resizeAttribute('color', this.previewEdge.color.length*4);
      this.previewEdge.shaderData.uploadAttribute('color', 0, this.previewEdge.color);
   }
};


PreviewCage.prototype._resizePreviewVertex = function(oldSize) {
   const length = this.geometry.vertices.length;
   const size = length - oldSize;
   if (size > 0) {
      const preview = this.previewVertex;
      const color = new Float32Array(length);
      if (oldSize > 0) {
         color.set(preview.color);
      }
      color.fill(0.0, oldSize);
      preview.color = color;
      // 
      preview.shaderData.resizeAttribute('position', length*4*3);
      preview.shaderData.uploadAttribute('position', 0, this.geometry.buf.data.subarray(0, length*3));
      preview.shaderData.resizeAttribute('color', length*4);
      preview.shaderData.uploadAttribute('color', 0, preview.color);
   }
   // rebuild index.
   const index = new Uint32Array(length);
   let j = 0;
   for (let i = 0; i < length; ++i) {
      if (this.geometry.vertices[i].isReal()) {
         index[j++] = i;
      }
   }
   // 
   this.previewVertex.shaderData.setIndex(index);
   this.previewVertex.indexLength = j;
};


// free webgl buffer.
PreviewCage.prototype.freeBuffer = function() {
   this.preview.shaderData.freeAllAttributes();
   this.preview.shaderData =  null;
   this.previewEdge.shaderData.freeAllAttributes();
   this.preview.shaderData = null;
   this.previewVertex.shaderData.freeAllAttributes();
   this.previewVertex.shaderData = null;
}


PreviewCage.prototype.draw = function(gl) {
   // draw using index
   try {
      gl.bindShaderData(this.preview.shaderData);
      gl.drawElements(gl.TRIANGLES, this.preview.indexLength, gl.UNSIGNED_INT, 0);
   } catch (e) {
      console.log(e);
   }
};

// draw vertex, select color, 
PreviewCage.prototype.drawVertex = function(gl) {
   // drawing using vertex array
   try {
      gl.bindShaderData(this.previewVertex.shaderData);
      //gl.drawArrays(gl.POINTS, 0, this.geometry.vertices.length);
      gl.drawElements(gl.POINTS, this.previewVertex.indexLength, gl.UNSIGNED_INT, 0);
   } catch (e) {
      console.log(e);
   }
};

// draw edge, select color
PreviewCage.prototype.drawEdge = function(gl) {
   gl.bindShaderData(this.previewEdge.shaderData);
   gl.drawArrays(gl.LINES, 0, this.previewEdge.line.length/3);
}


// todo: octree optimization.
PreviewCage.prototype.rayPick = function(ray) {
   var that = this;
   // return the closest face (triangle) that intersect ray.
   var intersect = {polygon: [], pt: []};
   var hitSphere = [];
   for (let sphere of this.boundingSpheres) {
      if (sphere.isReal() && sphere.isIntersect(ray)){
         hitSphere.push( sphere );
      }
   }
   // check for triangle intersection, select the hit Face, hit Edge(closest), and hit Vertex (closest).
   var hitEdge = null;
   var center;
   var hitT = 10000000;   // z_far is the furthest possible intersection
   for (let i = 0; i < hitSphere.length; ++i) {
      // walk the face, build a triangle on centroid + edge's 2 point. check for intersection
      var sphere = hitSphere[i];
      sphere.polygon.eachEdge( function(edge) {
         // now check the triangle is ok?
         var t = that.intersectTriangle(ray, [sphere.center, edge.origin.vertex, edge.destination().vertex]);
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


// body selection.
PreviewCage.prototype.changeFromBodyToFaceSelect = function() {
   if (this.hasSelection()) {
      this._resetBody();  
      // select all face
      this.selectedSet = new Set(this.geometry.faces);
      this.preview.selected.fill(1.0);
      this.preview.centroid.selected.fill(1.0);
      // update drawing element
      const length = this.geometry.buf.len/3;
      const centroidLength = this.preview.centroid.buf.len/3;
      this.preview.shaderData.uploadAttribute('selected', 0, this.preview.selected.subarray(0, length));
      this.preview.shaderData.uploadAttribute('selected', length*4, this.preview.centroid.selected.subarray(0, centroidLength));
   }
};

PreviewCage.prototype.changeFromBodyToEdgeSelect = function() {
   if (this.hasSelection()) {
      this._resetBody();
      this.groupSelection = true;
      // select all edge
      for (let wingedEdge of this.geometry.edges) {
         this.selectedSet.add(wingedEdge);
         this.setEdgeColor(wingedEdge, 0.25);
      }
      // update previewLine
      this.groupSelection = false;
      this.previewEdge.shaderData.uploadAttribute('color', 0, this.previewEdge.color);
   }
};

PreviewCage.prototype.changeFromBodyToVertexSelect = function() {
   if (this.hasSelection()) {
      this._resetBody();
      this.groupSelection = true;
      // select all vertex
      for (let vertex of this.geometry.vertices) {
         this.selectedSet.add(vertex);
         this.setVertexColor(vertex, 0.25);
      }
      // update previewVertex
      this.groupSelection = false;
      this.previewVertex.shaderData.uploadAttribute('color', 0, this.previewVertex.color);
   }
};

PreviewCage.prototype.restoreFaceSelection = function(snapshot) {
   for (let polygon of snapshot) {
      this.selectFace(polygon.halfEdge);
   }
};

PreviewCage.prototype.restoreEdgeSelection = function(snapshot) {
   for (let wingedEdge of snapshot) {
      this.selectEdge(wingedEdge.left);
   }
};

PreviewCage.prototype.restoreVertexSelection = function(snapshot) {
   for (let vertex of snapshot) {
      this.selectVertex(vertex);
   }
};

PreviewCage.prototype.restoreBodySelection = function(snapshot) {
   if (snapshot.size > 0) {
      this.selectBody();
   }
};

PreviewCage.prototype.restoreFromBodyToFaceSelect = function(snapshot) {
   if (snapshot) {
      this._resetBody();
      this.restoreFaceSelection(snapshot);
   } else {
      this.changeFromBodyToFaceSelect();
   }
};

PreviewCage.prototype.restoreFromBodyToEdgeSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetBody();
      this.restoreEdgeSelection(snapshot);
   } else {
      this.changeFromBodyToEdgeSelect();  // choose compute over storage, use the same code as going forward.
   }
};

PreviewCage.prototype.restoreFromBodyToVertexSelect = function(snapshot) {
   if (snapshot) {
      // discard old selected,
      this._resetBody();
      // and selected using the snapshots.
      this.restoreVertexSelection(snapshot);
   } else {
      this.changeFromBodyToVertexSelect();  // compute vs storage. currently lean toward compute.
   }
};

PreviewCage.prototype._resetBody = function() {
   const oldSet = this.selectedSet;
   this.selectedSet = new Set();
   this.previewBody.hilite = false;
   this.preview.shaderData.setUniform3fv("faceColor", [0.5, 0.5, 0.5]);
   return oldSet;
};

PreviewCage.prototype._selectBodyLess = function() {
   const snapshot = new Set(this.selectedSet);
   if (this.hasSelection()) {
      this.selectBody();
   }
   return snapshot;
}

PreviewCage.prototype._selectBodyAll = function() {
   const snapshot = new Set(this.selectedSet);
   if (!this.hasSelection()) {
      this.selectBody();
   }
   return snapshot;
}

PreviewCage.prototype._selectBodyInvert = function() {
   const snapshot = new Set(this.selectedSet);
   this.selectBody();
   return snapshot;
}

PreviewCage.prototype.selectBody = function() {
   let faceColor;
   // we change interior color to show the selection
   if (this.hasSelection()) {
      this.selectedSet.delete( this.geometry );
      // change to unselect, check if we are hilite,
      if (this.previewBody.hilite) {
         faceColor = [0.0, 1.0, 0.0];   // hilite and unselected         
      } else {
         faceColor = [0.5, 0.5, 0.5];   // unselected
      }
   } else {
      this.selectedSet.add( this.geometry );
      if (this.previewBody.hilite) {
         faceColor = [1.0, 1.0, 0.0];   // selected and hilite
      } else {
         faceColor = [1.0, 0.0, 0.0];   // selected.
      }
      geometryStatus("Object " + this.name + " has " + this.geometry.faces.length + " polygons");
   }
   this.preview.shaderData.setUniform3fv("faceColor", faceColor);
   return this.hasSelection();
};

PreviewCage.prototype.hiliteBody = function(hilite) {
   let faceColor;
   this.previewBody.hilite = hilite;
   if (hilite) {
      if (this.hasSelection()) {
         faceColor = [1.0, 1.0, 0.0];
      } else {
         faceColor = [0.0, 1.0, 0.0];
      }
   } else {
      if (this.hasSelection()) {
         faceColor = [1.0, 0.0, 0.0];
      } else {
         faceColor = [0.5, 0.5, 0.5];
      }
   }
   this.preview.shaderData.setUniform3fv("faceColor", faceColor);
}

PreviewCage.prototype.hasSelection = function() {
   return (this.selectedSet.size > 0);
};


PreviewCage.prototype.snapshotSelection = function() {
   return new Set(this.selectedSet);
};

PreviewCage.prototype.setVertexColor = function(vertex, color) {
   // selected color
   const j = vertex.index;  
   this.previewVertex.color[j] += color;
   if (!this.groupSelection) {
      const point = this.previewVertex.color.subarray(j, j+1);
      this.previewVertex.shaderData.uploadAttribute('color', j*Float32Array.BYTES_PER_ELEMENT, point);
   }
};

PreviewCage.prototype.hiliteVertex = function(vertex, show) {
   // select polygon set color,
   var color;
   if (show) {
      color = 0.5;
   } else {
      color = -0.5;
   }
   this.setVertexColor(vertex, color);
};

PreviewCage.prototype.dragSelectVertex = function(vertex, onOff) {
   var color;
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
   var oldSelected = this.selectedSet;
   this.selectedSet = new Set;
   // zeroout the edge seleciton.
   this.previewVertex.color.fill(0.0);
   this.previewVertex.shaderData.uploadAttribute('color', 0, this.previewVertex.color);
   return oldSelected;
};

PreviewCage.prototype._selectVertexMore = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   const self = this;
   for (let vertex of oldSelection) {
      vertex.eachInEdge( function(inEdge) {
         if (!self.selectedSet.has(inEdge.origin)) {
            self.selectVertex(inEdge.origin);
         }
      });
   }

   return oldSelection;
};

PreviewCage.prototype._selectVertexLess = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   for (let vertex of oldSelection) {
      for (let ringV of vertex.oneRing()) {
         if (!oldSelection.has(ringV)) {
            this.selectVertex(vertex);
            break;
         }
      }
   }

   return oldSelection;
};

PreviewCage.prototype._selectVertexAll = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   for (let vertex of this.geometry.vertices) {
      if (vertex.isReal() && !oldSelection.has(vertex)) {
         this.selectVertex(vertex);
      }
   }

   return oldSelection;
};

PreviewCage.prototype._selectVertexInvert = function() {
   const snapshot = new Set(this.selectedSet);

   for (let vertex of this.geometry.vertices) {
      if (vertex.isReal()) {
         this.selectVertex(vertex);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectVertexAdjacent = function() {
   return this._selectVertexMore();
};

PreviewCage.prototype._selectVertexSimilar = function() {
   const snapshot = new Set(this.selectedSet);
   const similarVertex = new SimilarVertex(snapshot);

   for (let vertex of this.geometry.vertices) {
      if (vertex.isReal() && !snapshot.has(vertex) && similarVertex.find(vertex)) {
         this.selectVertex(vertex);
      }
   }

   return snapshot;
};

PreviewCage.prototype.changeFromVertexToFaceSelect = function() {
   var self = this;
   var oldSelected = this._resetSelectVertex();
   //
   for (let vertex of oldSelected) { 
      // select all face that is connected to the vertex.
      vertex.eachOutEdge(function(edge) {
         if (!self.selectedSet.has(edge.face)) {
            self.selectFace(edge);
         }
      });
   }
};

PreviewCage.prototype.changeFromVertexToEdgeSelect = function() {
   var self = this;
   var oldSelected = this._resetSelectVertex();
   //
   for (let vertex of oldSelected) { 
      // select all edge that is connected to the vertex.
      vertex.eachOutEdge(function(edge) {
         if (!self.selectedSet.has(edge.wingedEdge)) {
            self.selectEdge(edge);
         }
      });
   }
};

PreviewCage.prototype.changeFromVertexToBodySelect = function() {
   if (this.hasSelection()) {
      // select whole body,
      this._resetSelectVertex();
      this.selectBody();
   }
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


PreviewCage.prototype.setEdgeColor = function(wingedEdge, color) {
   // selected color
   const j = wingedEdge.index * 2;  
   this.previewEdge.color[j] += color;
   this.previewEdge.color[j+1] += color;
   if (!this.groupSelection) {
      const line = this.previewEdge.color.subarray(j, j+2);
      this.previewEdge.shaderData.uploadAttribute('color', j*Float32Array.BYTES_PER_ELEMENT, line);
   }
};

PreviewCage.prototype.hiliteEdge = function(selectEdge, show) {
   // select polygon set color,
   var color;
   var wingedEdge = selectEdge.wingedEdge;
   if (show) {
      color = 0.5;
   } else {
      color = -0.5;
   }
   this.setEdgeColor(wingedEdge, color);
};

PreviewCage.prototype.dragSelectEdge = function(selectEdge, dragOn) {
   var wingedEdge = selectEdge.wingedEdge;

   if (this.selectedSet.has(wingedEdge)) { 
      if (dragOn === false) { // turn from on to off
         this.selectedSet.delete(wingedEdge);
         this.setEdgeColor(wingedEdge, -0.25);
         return true;   // new off selection
      }
   } else {
      if (dragOn === true) {   // turn from off to on.
         this.selectedSet.add(wingedEdge);
         this.setEdgeColor(wingedEdge, 0.25);
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
   this.setEdgeColor(wingedEdge, color);
   return onOff;
};

PreviewCage.prototype.computeSnapshot = function(snapshot) {
   // update all affected polygon(use sphere). copy and recompute vertex.
   for (let polygon of snapshot.faces) {
      const sphere = this.boundingSpheres[polygon.index];
      // recompute sphere center. and normal
      polygon.computeNormal();
      sphere.setSphere( __WEBPACK_IMPORTED_MODULE_1__wings3d_boundingvolume__["BoundingSphere"].computeSphere(polygon, sphere.center) );
   }
   // done, update shader data, should we update each vertex individually?
   const centroids = this.preview.centroid.buf.data.subarray(0, this.preview.centroid.buf.len)
   this.preview.shaderData.uploadAttribute('position', this.geometry.buf.len*4, centroids);
   // update the edges.vertex
   for (let wingedEdge of snapshot.wingedEdges) {
      let index = wingedEdge.index * 2 * 3;
      for (let halfEdge of wingedEdge) {
         this.previewEdge.line.set(halfEdge.origin.vertex, index);
         index += 3;
      }
   }
   this.previewEdge.shaderData.uploadAttribute('position', 0, this.previewEdge.line);
};


PreviewCage.prototype.restoreMoveSelection = function(snapshot) {
   // restore to the snapshot position.
   let i = 0;
   for (let vertex of snapshot.vertices) {
      vec3.copy(vertex.vertex, snapshot.position.subarray(i, i+3));
      i += 3;
   }
   // todo: we really should update as little as possible.
   const vertices = this.geometry.buf.data.subarray(0, this.geometry.buf.len);
   this.preview.shaderData.uploadAttribute('position', 0, vertices);
   this.previewVertex.shaderData.uploadAttribute('position', 0, vertices);
   this.computeSnapshot(snapshot);
};

PreviewCage.prototype.moveSelection = function(movement, snapshot) {
   // first move geometry's position
   if (snapshot.normal) {
      let i = 0; 
      for (let vertex of snapshot.vertices) {
         vec3.scaleAndAdd(vertex.vertex, vertex.vertex, snapshot.normal[i++], movement);  // movement is magnitude
      }
   } else {
      for (let vertex of snapshot.vertices) {
         vec3.add(vertex.vertex, vertex.vertex, movement);
      }
   }
   // todo: we really should update as little as possible.
   const vertices = this.geometry.buf.data.subarray(0, this.geometry.buf.len);
   this.preview.shaderData.uploadAttribute('position', 0, vertices);
   this.previewVertex.shaderData.uploadAttribute('position', 0, vertices);
   this.computeSnapshot(snapshot);
};


PreviewCage.prototype.snapshotPosition = function(vertices, normalArray) {
   var ret = {
      faces: new Set,
      vertices: null,
      wingedEdges: new Set,
      position: null,
      normal: normalArray,
   };
   ret.vertices = vertices;
   // allocated save position data.
   ret.position = new Float32Array(ret.vertices.size*3);
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
            if (vec3.dot(normal, polygon.normal) < 0.98) {  // check for nearly same normal, or only added if hard edge?
               vec3.add(normal, normal, polygon.normal);
            } 
         }
      });
   }
   // copy normal;
   const normalArray = new Float32Array(vertices.size*3);
   const retArray = [];
   let i = 0;
   for (let [_vert, normal] of normalMap) {
      let inputNormal = normalArray.subarray(i, i+3);
      vec3.copy(inputNormal, normal);
      retArray.push(inputNormal);
      i+=3;
   }
   return this.snapshotPosition(vertices, retArray);
};

PreviewCage.prototype.snapshotVertexPositionAndNormal = function() {
   const vertices = new Set(this.selectedSet);
   const normalArray = [];
   const array = new Float32Array(vertices.size*3);
   array.fill(0.0);
   // copy normal
   let i = 0;
   for (let vertex of vertices) {
      let normal = array.subarray(i, i+3);
      normalArray.push( normal );
      vertex.eachOutEdge( function(outEdge) {
         if (outEdge.isNotBoundary()) {
            vec3.add(normal, normal, outEdge.face.normal);
         }
      });
      vec3.normalize(normal, normal);        // finally, we can safely normalized?
      i +=3;
   }

   return this.snapshotPosition(vertices, normalArray);
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
   const retArray = [];
   let i = 0;
   for (let [_vert, normal] of normalMap) {
      let inputNormal = normalArray.subarray(i, i+3);
      for (let poly of normal) {
         vec3.add(inputNormal, inputNormal, poly.normal);
      }
      retArray.push(inputNormal);
      i+=3;
   }
   return this.snapshotPosition(vertices, retArray);
};


PreviewCage.prototype._resetSelectEdge = function() {
   const oldSelected = this.selectedSet;
   this.selectedSet = new Set;
   // zeroout the edge seleciton.
   this.previewEdge.color.fill(0.0);
   this.previewEdge.shaderData.uploadAttribute('color', 0, this.previewEdge.color);
   return oldSelected;
};

PreviewCage.prototype._selectEdgeMore = function() {
   const oldSelection = new Set(this.selectedSet);

   const self = this;
   for (let wingedEdge of oldSelection) {
      for (let halfEdge of wingedEdge) {
         halfEdge.eachEdge( function(edge) {
            if (!self.selectedSet.has(edge.wingedEdge)) {
               self.selectEdge(edge);
            }
         });
      }
   }

   return oldSelection;
};

PreviewCage.prototype._selectEdgeLess = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   const self = this;
   for (let selectedWinged of oldSelection) {
      for (let wingedEdge of selectedWinged.oneRing()) {
         if (!oldSelection.has(wingedEdge)) {
            this.selectEdge(selectedWinged.left);
            break;
         }
      }
   }

   return oldSelection;
}

PreviewCage.prototype._selectEdgeAll = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   for (let wingedEdge of this.geometry.edges) {
      if (wingedEdge.isReal() && !oldSelection.has(wingedEdge)) {
         this.selectEdge(wingedEdge.left);
      }
   }

   return oldSelection;
}

PreviewCage.prototype._selectEdgeInvert = function() {
   const snapshot = new Set(this.selectedSet);

   for (let wingedEdge of this.geometry.edges) {
      if (wingedEdge.isReal()) {
         this.selectEdge(wingedEdge.left);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectEdgeAdjacent = function() {
   const oldSelection = new Set(this.selectedSet);

   for (let wingedEdge of oldSelection) {
      for (let adjacent of wingedEdge.adjacent()) {
         if (!this.selectedSet.has(adjacent)) {
            this.selectEdge(adjacent.left);
         }
      }
   }

   return oldSelection;
};


PreviewCage.prototype._selectEdgeSimilar = function() {
   const snapshot = new Set(this.selectedSet);
   const similarEdge = new SimilarWingedEdge(snapshot);

   for (let wingedEdge of this.geometry.edges) {
      if (wingedEdge.isReal && !snapshot.has(wingedEdge) && similarEdge.find(wingedEdge)) {
         this.selectEdge(wingedEdge.left);
      }
   }

   return snapshot;
};


PreviewCage.prototype.changeFromEdgeToFaceSelect = function() {
   const oldSelected = this._resetSelectEdge();
   //
   for (let wingedEdge of oldSelected) {
      // for each WingedEdge, select both it face.
      for (let halfEdge of wingedEdge) {
         if (!this.selectedSet.has(halfEdge.face)) {
            this.selectFace(halfEdge);
         }
      }
   }
};

PreviewCage.prototype.changeFromEdgeToVertexSelect = function() {
   const oldSelected = this._resetSelectEdge();
   //
   for (let wingedEdge of oldSelected) {
      // for each WingedEdge, select both it face.
      for (let halfEdge of wingedEdge) {
         if (!this.selectedSet.has(halfEdge.origin)) {
            this.selectVertex(halfEdge.origin);
         }
      }
   } 
};

PreviewCage.prototype.changeFromEdgeToBodySelect = function() {
   if (this.hasSelection()) {
      this._resetSelectEdge();
      this.selectBody();
   }
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

PreviewCage.prototype.setFaceSelectionOff = function(polygon) {
   var self = this;
   var selected = this.preview.selected;    // filled triangle's selection status.
   polygon.eachVertex( function(vertex) {
      // restore drawing color
      var vertexSelected = false;
      vertex.eachOutEdge( function(edge) {
         if (edge.isNotBoundary() && (edge.face !== polygon) && self.selectedSet.has(edge.face)) {
            vertexSelected = true;
         }
      }); 
      if (vertexSelected === false) {  // no more sharing, can safely reset
         selected[vertex.index] = 0.0;
         self.preview.shaderData.uploadAttribute('selected', vertex.index*4, PreviewCage.CONST.SELECTOFF);
      }
   });
   selected = this.preview.centroid.selected;
   selected[polygon.index]= 0.0;
   this.selectedSet.delete(polygon);
   var byteOffset = (this.geometry.vertices.length+polygon.index)*4;
   this.preview.shaderData.uploadAttribute("selected", byteOffset, PreviewCage.CONST.SELECTOFF);
};
PreviewCage.prototype.setFaceSelectionOn = function(polygon) {
   var self = this;
   var selected = this.preview.selected;      // filled triangle's selection status.
   // set the drawing color
   polygon.eachVertex( function(vertex) {
      selected[vertex.index] = 1.0;
      self.preview.shaderData.uploadAttribute('selected', vertex.index*4, PreviewCage.CONST.SELECTON);
   });
   selected = this.preview.centroid.selected;
   selected[polygon.index]= 1.0;
   this.selectedSet.add(polygon);
   var byteOffset = (this.geometry.vertices.length+polygon.index)*4;
   this.preview.shaderData.uploadAttribute("selected", byteOffset, PreviewCage.CONST.SELECTON);
};

PreviewCage.prototype.dragSelectFace = function(selectEdge, onOff) {
   // select polygon set color,
   var polygon = selectEdge.face;
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
PreviewCage.prototype.selectFace = function(selectEdge) {
   var onOff;
   var polygon = selectEdge.face;
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
   var oldSelected = this.selectedSet;
   this.selectedSet = new Set;
   this.preview.selected.fill(0.0);          // reset all polygon to non-selected 
   this.preview.centroid.selected.fill(0.0);
   var length = this.geometry.buf.len/3;
   this.preview.shaderData.uploadAttribute("selected", 0, this.preview.selected.subarray(0, length));
   var centroidLength = this.preview.centroid.buf.len/3;
   this.preview.shaderData.uploadAttribute('selected', length*4, this.preview.centroid.selected.subarray(0, centroidLength));
   return oldSelected;
}

PreviewCage.prototype._selectFaceMore = function() {
   const oldSelected = this.selectedSet;
   this.selectedSet = new Set(oldSelected);
   // seleceted selectedFace's vertex's all faces.
   for (let polygon of oldSelected) {
      for (let face of polygon.oneRing()) {
         // check if face is not selected.
         if ( (face !== null) && !this.selectedSet.has(face) ) {
            this.selectFace(face.halfEdge);
         }
      }
   }

   return oldSelected;
};

PreviewCage.prototype._selectFaceLess = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   for (let selected of oldSelection) {
      for (let polygon of selected.adjacent()) {
         if (!oldSelection.has(polygon)) {      // selected is a boundary polygon
            this.selectFace(selected.halfEdge); // now removed.
            break;
         }
      }
   }

   return oldSelection;
};

PreviewCage.prototype._selectFaceAll = function() {
   const oldSelection = this.selectedSet;
   this.selectedSet = new Set(oldSelection);

   for (let polygon of this.geometry.faces) {
      if (polygon.isReal && !oldSelection.has(polygon)) {
         this.selectFace(polygon.halfEdge);
      }
   }

   return oldSelection;
};

PreviewCage.prototype._selectFaceInvert = function() {
   const snapshot = new Set(this.selectedSet);

   for (let polygon of this.geometry.faces) {
      if (polygon.isReal()) {
         this.selectFace(polygon.halfEdge);
      }
   }

   return snapshot;
};

PreviewCage.prototype._selectFaceAdjacent = function() {
   const snapshot = new Set(this.selectedSet);

   // seleceted selectedFace's vertex's all faces.
   for (let polygon of snapshot) {
      for (let face of polygon.adjacent()) {
         // check if face is not selected.
         if ( (face !== null) && !this.selectedSet.has(face) ) {
            this.selectFace(face.halfEdge);
         }
      }
   }
   
   return snapshot;
};

PreviewCage.prototype._selectFaceSimilar = function() {
   const snapshot = new Set(this.selectedSet);
   const similarFace = new SimilarFace(snapshot);

   for (let polygon of this.geometry.faces) {
      if (polygon.isReal && !snapshot.has(polygon) && similarFace.find(polygon)) {
         this.selectFace(polygon.halfEdge);
      }
   }

   return snapshot;
};


PreviewCage.prototype.changeFromFaceToEdgeSelect = function() {
   var self = this;
   var oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected) {
      // for eachFace, selected all it edge.
      polygon.eachEdge(function(edge) {
         if (!self.selectedSet.has(edge.wingedEdge)) {
            self.selectEdge(edge);
         }
      });
   }
};

PreviewCage.prototype.changeFromFaceToVertexSelect = function() {
   var self = this
   var oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected) {
      // for eachFace, selected all it vertex.
      polygon.eachVertex(function(vertex) {
         if (!self.selectedSet.has(vertex)) {
            self.selectVertex(vertex);
         }
      });
   }
};

PreviewCage.prototype.changeFromFaceToBodySelect = function() {
   if (this.hasSelection()) {
      this._resetSelectFace();
      this.selectBody();
   }
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


PreviewCage.prototype._resizeVertices = function(oldSize) {
   // update webgl buffer
   if (oldSize < this.geometry.vertices.length) {
      // expand webgl buffer
      this.preview.setAttribute();

   } // ignore shrinking request for now.
};



PreviewCage.prototype.extractFace = function() {
   var vertexSize = this.geometry.vertices.length;
   var edgeSize = this.geometry.edges.length;
   var faceSize = this.geometry.faces.length;
   // array of edgeLoop. 
   var edgeLoops = this.geometry.extractPolygon(this.selectedSet);
   // adjust preview to the new vertices, edges and faces.
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   //this._resizeEdges();

   return edgeLoops;
};

//
// extrudeFace - will create a list of 
PreviewCage.prototype.extrudeFace = function(contours) {
   const vertexSize = this.geometry.vertices.length;
   const edgeSize = this.geometry.edges.length;
   const faceSize = this.geometry.faces.length;
   // array of edgeLoop. 
   if (!contours) {
      contours = {};
      contours.edgeLoops = this.geometry.findContours(this.selectedSet); 
   }
   contours.edgeLoops = this.geometry.liftContours(contours.edgeLoops);
   contours.extrudeEdges = this.geometry.extrudeContours(contours.edgeLoops);
   //const edgeLoops = this.geometry.extrudePolygon(this.selectedSet);
   // add the new Faces. and new vertices to the preview
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   this._resizePreviewEdge(edgeSize);
   this._resizePreviewVertex(vertexSize);
   // reselect face
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected) {
      this.selectFace(polygon.halfEdge);
   }

   return contours; //edgeLoops;
};


// collapse list of edges
PreviewCage.prototype.collapseExtrudeEdge = function(edges) {
   const affectedPolygon = new Set;
   const vertexSize = this.geometry.vertices.length;
   const edgeSize = this.geometry.edges.length;
   const faceSize = this.geometry.faces.length;
   for (let edge of edges) {
      edge.origin.eachOutEdge( function(edge) {
         affectedPolygon.add(edge.face);
      });
      this.geometry.collapseEdge(edge);
   }
   // recompute the smaller size
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   this._resizePreviewEdge(edgeSize);
   this._resizePreviewVertex(vertexSize);
      // reselect face
   const oldSelected = this._resetSelectFace();
   for (let polygon of oldSelected) {
      this.selectFace(polygon.halfEdge);
   }

   // update all affected polygon(use sphere). recompute centroid.
   for (let polygon of affectedPolygon) {
      if (polygon.isReal()) {
         const sphere = this.boundingSpheres[polygon.index];
         // recompute sphere center.
         sphere.setSphere( __WEBPACK_IMPORTED_MODULE_1__wings3d_boundingvolume__["BoundingSphere"].computeSphere(polygon, sphere.center) );
      }
   }
   // done, update shader data, should we update each vertex individually?
   const centroids = this.preview.centroid.buf.data.subarray(0, this.preview.centroid.buf.len)
   this.preview.shaderData.uploadAttribute('position', this.geometry.buf.len*4, centroids);
};


PreviewCage.prototype.cutEdge = function(numberOfSegments) {
   const edges = this.selectedSet;

   const faceSize = this.geometry.faces.length;
   const edgeSize = this.geometry.edges.length;
   const vertexSize = this.geometry.vertices.length;
   const vertices = [];
   const splitEdges = [];              // added edges list
   // cut edge by numberOfCuts
   let diff = vec3.create();
   let vertex = vec3.create();
   for (let wingedEdge of edges) {
      let edge = wingedEdge.left;
      vec3.sub(diff, edge.origin.vertex, edge.destination().vertex);
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
   this._updateAffected(this.geometry.affected);
   //
   this._resizePreview(vertexSize, faceSize);
   this._resizePreviewEdge(edgeSize);
   this._resizePreviewVertex(vertexSize);
   // returns created vertices.
   return {vertices: vertices, splitEdges: splitEdges};
};

// collapse list of edges, pair with CutEdge.
PreviewCage.prototype.collapseSplitEdge = function(splitEdges) {
   const vertexSize = this.geometry.vertices.length;
   const edgeSize = this.geometry.edges.length;
   const faceSize = this.geometry.faces.length;
   for (let edge of splitEdges) {
      this.geometry.collapseEdge(edge);
   }
   // recompute the smaller size
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   this._resizePreviewEdge(edgeSize);
   this._resizePreviewVertex(vertexSize);
};


// connect selected Vertex,
PreviewCage.prototype.connectVertex = function() {
   const faceSize = this.geometry.faces.length;
   const edgeSize = this.geometry.edges.length;
   const vertexSize = this.geometry.vertices.length;
   
   //this.geometry.clearAffected();
   const edgeList = this.geometry.connectVertex(this.selectedSet);
   const wingedEdgeList = [];
   for (let edge of edgeList) {
      wingedEdgeList.push( edge.wingedEdge );
   }

   // updateAffected.
   this._updateAffected(this.geometry.affected);

   // addition.
   this._resizeBoundingSphere(faceSize);
   this._resizePreview(vertexSize, faceSize);
   this._resizePreviewEdge(edgeSize);
   this._resizePreviewVertex(vertexSize);

   return {edgeList: edgeList, wingedEdgeList: wingedEdgeList};
};
// pair with connectVertex.
PreviewCage.prototype.dissolveConnect = function(insertEdges) {
   const size = this._getGeometrySize();

   // dissolve in reverse direction
   for (let i = insertEdges.length-1; i >= 0; --i) {
      const halfEdge = insertEdges[i];
      this.geometry.removeEdge(halfEdge.pair);
   }

   // after deletion of faces and edges. update
   this._updateAffected(this.geometry.affected);

   // let _resize, to update preview
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);

};


//
PreviewCage.prototype.dissolveSelectedEdge = function() {
   const dissolveEdges = [];
   const size = this._getGeometrySize();
   for (let edge of this.selectedSet) {
      let undo = this.geometry.dissolveEdge(edge.left);
      let dissolve = { halfEdge: edge.left, undo: undo};
      dissolveEdges.push(dissolve);
   }
   this.selectedSet.clear();
   // after deletion of faces and edges. update
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);
   // return affected.
   return dissolveEdges;
};
PreviewCage.prototype.reinsertDissolveEdge = function(dissolveEdges) {
   const size = this._getGeometrySize();
   // walk form last to first.
   for (let i = (dissolveEdges.length-1); i >= 0; --i) {
      let dissolve = dissolveEdges[i];
      dissolve.undo();
      this.selectEdge(dissolve.halfEdge);
   }
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);
};


PreviewCage.prototype.collapseSelectedEdge = function() {
   const restoreVertex = [];
   const collapseEdges = [];
   const size = this._getGeometrySize();
   const selected = new Map();
   for (let edge of this.selectedSet) {
      let undo = function() {};
      if (edge.isReal()){
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
      let collapse = { halfEdge: edge.left, undo: undo};
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
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);
   this._resizePreviewVertex(size.vertex);
   return { collapse: {edge: collapseEdges, vertex: restoreVertex}, selectedVertex: selectedVertex};
};

PreviewCage.prototype.restoreCollapseEdge = function(collapse) {
   const size = this._getGeometrySize();
   // walk form last to first.
   this.selectedSet.clear();

   const collapseEdges = collapse.edge;
   for (let i = (collapseEdges.length-1); i >= 0; --i) {
      let collapse = collapseEdges[i];
      collapse.undo();
   }
   for (let collapseEdge of collapseEdges) { // selectedge should be in order
      this.selectEdge(collapseEdge.halfEdge);
   }
   const restoreVertex = collapse.vertex;
   for (let restore of restoreVertex) {   // restore position
      vec3.copy(restore.vertex.vertex, restore.savePt);
      this.geometry.addAffectedEdgeAndFace(restore.vertex);
   }
   // 
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);   
   this._resizePreviewVertex(size.vertex);
};


PreviewCage.prototype.dissolveSelectedFace = function() {
   const size = this._getGeometrySize();
   const selectedEdges = new Set;
   // the all the selectedFace's edge.
   for (let polygon of this.selectedSet) {
      polygon.eachEdge( function(outEdge) {
         selectedEdges.add(outEdge.wingedEdge);
      });
   }
   // get the outline edge
   const contourLoops = this.geometry.findContours(this.selectedSet);
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
      if (polygon.isReal()) {
         selectedSet.add(polygon);
      }
   }
   this.selectedSet = selectedSet;
   // update previewBox.
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);   
   this._resizePreviewVertex(size.vertex);
   // return undo function
   return {edges: substract, selection: selectedFace};
};
PreviewCage.prototype.undoDissolveFace = function(dissolve) {
   const size = this._getGeometrySize();
   for (let dissolveUndo of dissolve.edges) {
      dissolveUndo();
   }
   this.selectedSet.clear();
   // reselected the polygon in order.
   for (let polygon of dissolve.selection) {
      this.selectFace(polygon.halfEdge);
   }
   // update previewBox.
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);   
   this._resizePreviewVertex(size.vertex);
}


// the original wings3D collapse quite strangely. collapse by edge index order? such a weird algorithm.
// we change it to collapse to middle.
PreviewCage.prototype.collapseSelectedFace = function() {
   const saveSet = this.selectedSet;
   // reuse edgeSelect().
   this.changeFromFaceToEdgeSelect();
   // reuse collapseEdge
   const collapse = this.collapseSelectedEdge();
   collapse.selectedFace = saveSet;
   return collapse;
};
PreviewCage.prototype.undoCollapseFace = function(collapse) {
   this.restoreCollapseEdge(collapse);
};


PreviewCage.prototype.dissolveSelectedVertex = function() {
   const size = this._getGeometrySize();
   const undoArray = {array: [], selectedFace: []};
   for (let vertex of this.selectedSet) {
      let result = this.geometry.dissolveVertex(vertex);
      undoArray.array.unshift( result.undo );
      undoArray.selectedFace.push( result.polygon );
   }
   this._resetSelectVertex();
   // update previewBox.
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);   
   this._resizePreviewVertex(size.vertex);
   return undoArray;
};
PreviewCage.prototype.undoDissolveVertex = function(undoArray) {
   const size = this._getGeometrySize();
   for (let undo of undoArray) {
      let vertex = undo();
      this.selectVertex(vertex);
   }
   // update previewBox.
   this._updateAffected(this.geometry.affected);
   this._resizeBoundingSphere(size.face);
   this._resizePreview(size.vertex, size.face);
   this._resizePreviewEdge(size.edge);   
   this._resizePreviewVertex(size.vertex);
};


PreviewCage.prototype.EPSILON = 0.000001;
// Möller–Trumbore ray-triangle intersection algorithm
// should I use float64array? 
PreviewCage.prototype.intersectTriangle = function(ray, triangle) {
   var edge1 = vec3.create(), edge2 = vec3.create();
   /* find vectors for two edges sharing vert0 */
   vec3.sub(edge1, triangle[1], triangle[0]);
   vec3.sub(edge2, triangle[2], triangle[0]);

   /* begin calculating determinant - also used to calculate U parameter */
   var pvec = vec3.create();
   vec3.cross(pvec, ray.direction, edge2);

   /* if determinant is near zero, ray lies in plane of triangle */
   var det = vec3.dot(edge1, pvec);

   if (det < this.EPSILON) { // cull backface, and nearly parallel ray
      return 0.0;
   }
   //if (det > -this.EPSILON && det < this.EPSILON), nearly parallel
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



class CreatePreviewCageCommand extends __WEBPACK_IMPORTED_MODULE_5__wings3d_undo__["EditCommand"] {
   constructor(previewCage) {
      super();
      this.previewCage = previewCage;
   }

   doIt() {
      __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["addToWorld"](this.previewCage);
   }

   undo() {
      __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["removeFromWorld"](this.previewCage);
   }
}




/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "WingedEdge", function() { return WingedEdge; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HalfEdge", function() { return HalfEdge; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Vertex", function() { return Vertex; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Polygon", function() { return Polygon; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "WingedTopology", function() { return WingedTopology; });
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
};

WingedEdge.prototype[Symbol.iterator] = function* () {
   yield this.left;
   yield this.right;
};

WingedEdge.prototype.isReal = function() {
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

HalfEdge.prototype.prev = function() {
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

Vertex.prototype.isReal = function() {
   return (this.outEdge !== null);
};

Vertex.prototype.oneRing = function* () {
   const start = this.outEdge; // we want inEdge.
   let current = start;
   do {
      const inEdge = current.pair;
      yield inEdge.origin;
      current = inEdge.next;
   } while(current !== start);
};

Vertex.prototype.edgeRing = function* () {
   const start = this.outEdge; // we want inEdge.
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




var Polygon = function(startEdge, size) {
   this.halfEdge = startEdge;
   this.numberOfVertex = size;       // how many vertex in the polygon
   this.update(); //this.computeNormal();
   this.index = -1;
};

// not on free list. not deleted.
Polygon.prototype.isReal = function() {
   return (this.halfEdge !== null);
};

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
      callbackFn(current);
      current = current.next;
   } while (current !== begin);
};

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

// recompute numberOfVertex and normal.
Polygon.prototype.update = function() {
   const begin = this.halfEdge;
   let current = begin;
   this.numberOfVertex = 0;
   do {
      current.face = this;
      ++this.numberOfVertex;
      if (this.numberOfVertex > 1000) {   // break;   
         console.log("something is wrong with polygon link list");
         return;
      }
      current = current.next;
   } while (current !== begin);
   // compute normal.
   this.computeNormal();
};


var WingedTopology = function(allocatedSize = 256) {     // default to 256 vertex
   var buf = new ArrayBuffer(allocatedSize*3 * Float32Array.BYTES_PER_ELEMENT);
   this.buf = { buffer: buf, data: new Float32Array(buf), len: 0, };
   this.vertices = [];
   this.edges = [];        // wingededge
   this.faces = [];
   this.freeVertices = [];
   this.freeEdges = [];
   this.freeFaces = [];
   // affected is when reuse, deleted, or change vital stats.
   this.affected = {vertices: new Set, edges: new Set, faces: new Set};
};

WingedTopology.prototype.sanityCheck = function() {
   let sanity = true;
   // first check vertex for error.
   for (let [index, vertex] of this.vertices.entries()) {
      if (vertex.isReal()) {
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

WingedTopology.prototype.clearAffected = function() {
   this.affected.vertices.clear();
   this.affected.edges.clear();
   this.affected.faces.clear();
};

WingedTopology.prototype.addAffectedEdgeAndFace = function(vertex) {
   this.affected.vertices.add(vertex);
   const self = this;
   vertex.eachOutEdge( function(halfEdge) {
      self.affected.edges.add(halfEdge.wingedEdge);
      if (halfEdge.face !== null) {
         self.affected.faces.add(halfEdge.face);
     }
   });
};

// todo: ?binary search for delPolygon, then use splice. a win? for large freelist yes, but, I don't think it a common situation.
WingedTopology.prototype._createPolygon = function(halfEdge, numberOfVertex, delPolygon) {
   let polygon;
   if (this.freeFaces.length > 0) {
      if (typeof delPolygon !== "undefined") {
         const index = delPolygon.index;   // remove delOutEdge from freeEdges list
         this.freeFaces = this.freeFaces.filter(function(element) {
            return element !== index;
         });
         polygon = delPolygon;
      } else {
         polygon = this.faces[ this.freeFaces.pop() ];
      }
      polygon.halfEdge = halfEdge;
      polygon.numberOfVertex = numberOfVertex;
      polygon.update();
      this.affected.faces.add( polygon );
   } else {
      polygon = new Polygon(halfEdge, numberOfVertex);
      polygon.index = this.faces.length;
      this.faces.push( polygon );
   }
   return polygon;
};

// return vertex index
WingedTopology.prototype.addVertex = function(pt, delVertex) {
   if (this.freeVertices.length > 0) {
      let vertex;
      if (typeof delVertex === 'undefined') {
         vertex = this.vertices[this.freeVertices.pop()];
      } else {
         const index = delVertex.index;   // remove delOutEdge from freeEdges list
         this.freeVertices = this.freeVertices.filter(function(element) {
            return element !== index;
         });
         vertex = delVertex;
      }
      vertex.vertex.set(pt);
      this.affected.vertices.add( vertex );
      return vertex;
   } else {
      if (this.buf.len >= (this.buf.data.length)) {
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
      return _vert;
   }
};

WingedTopology.prototype._createEdge = function(begVert, endVert, delOutEdge) {
   let edge;
   let outEdge;
   if (this.freeEdges.length > 0) { // prefered recycle edge.
      if (typeof delOutEdge !== "undefined") {
         const index = delOutEdge.wingedEdge.index;   // remove delOutEdge from freeEdges list
         this.freeEdges = this.freeEdges.filter(function(element) {
            return element !== index;
         });
         edge = delOutEdge.wingedEdge;
         outEdge = delOutEdge;
      } else {
         edge = this.edges[this.freeEdges.pop()];
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
   }

   return outEdge;
};

// return winged edge ptr because internal use only.
WingedTopology.prototype.addEdge = function(begVert, endVert) {
   // what to do with loop edge?
   // what to do with parallel edge?

   // initialized data.
   var edge = this._createEdge(begVert, endVert).wingedEdge;

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

      var v0 = this.vertices[pts[i]];
      var v1 = this.vertices[pts[nextIndex]];
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
   if (oldPolygon.halfEdge.face === newPolygon) {
      //  pointed to one of the halfedges now assigned to newPolygon
      oldPolygon.halfEdge = inEdge;
   }
   size = 0;
   oldPolygon.eachEdge( function(halfEdge) {
      ++size;
   });
   oldPolygon.numberOfVertex = size;
   this.affected.faces.add( oldPolygon );

   // adjustOutEdge for v0, v1. point to boundary so, ccw work better?
   return outEdge;
}


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
   this.affected.edges.add( outEdge.wingedEdge );     // edge changed.
   // return the newOut
   return newOut;
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



WingedTopology.prototype.findContours = function(selectedPolygon) {
   const self = this;
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


// lift edges from outerLoop to innerLoop.
WingedTopology.prototype.liftContours = function(edgeLoops) {
   // create innerloops
   for (let contours of edgeLoops) {
      let firstVertex = this.addVertex(contours[0].outer.origin.vertex);
      let fromVertex = firstVertex; 
      for (let i = 0; i < contours.length; ++i) {
         let outerEdge = contours[i].outer;
         let toVertex;
         if (i == (contours.length-1)) {  // the last one loopback
            toVertex = firstVertex;
         } else {
            toVertex = this.addVertex(outerEdge.destination().vertex);
         }
         contours[i].inner = this.addEdge(fromVertex, toVertex);
         fromVertex = toVertex;
      }
   }

   // got the internal loop, now lift and connect the faces to the innerLoop.
   for (let i = 0; i < edgeLoops.length; ++i) {
      const edgeLoop = edgeLoops[i];
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
      }
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
      this.affected.edges.add( currentOut.wingedEdge );
      currentOut = currentOut.pair.next;
   } while (currentOut !== outEdge);
   outEdge.face = inRight.face;
   outEdge.face.numberOfVertex++;
   inEdge.face = outLeft.face;
   inEdge.face.numberOfVertex++;
   this.affected.faces.add(outEdge.face);
   this.affected.faces.add(inEdge.face);
}


// insert the index number in reverse order. smallest last.
WingedTopology.prototype._insertFreeList = function(val, array) {
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

// recycled
WingedTopology.prototype._freeVertex = function(vertex) {
   vertex.outEdge = null;
   //vertex.vertex.fill(0.0);
   // assert !freeVertices.has(vertex);
   //this.freeVertices.push( vertex );
   this._insertFreeList(vertex.index, this.freeVertices);
   this.affected.vertices.add( vertex );
};

WingedTopology.prototype._freeEdge = function(edge) {
   const pair = edge.pair;
   edge.face = null;
   pair.face = null;
   edge.origin = null;
   pair.origin = null;
   // link together for a complete loop
   edge.next = pair;
   pair.next = edge;
   // assert !this.freeEdges.has( edge.wingedEdge );
   //this.freeEdges.push( edge.wingedEdge );
   this._insertFreeList(edge.wingedEdge.index, this.freeEdges);
   this.affected.edges.add( edge.wingedEdge );
};

WingedTopology.prototype._freePolygon = function(polygon) {
   polygon.halfEdge = null;
   polygon.numberOfVertex = 0;
   // assert !freeFaces.has( polygon );
   //this.freeFaces.push( polygon );
   this._insertFreeList(polygon.index, this.freeFaces);
   this.affected.faces.add( polygon );
};


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
      this.affected.edges.add(current.wingedEdge);
      current = current.pair.next;
   }

   // reconnect 
   prev.next = next;
   pairPrev.next = pairNext;

   // adjust face
   let face = halfEdge.face;
   if (face.halfEdge === halfEdge) {
      face.halfEdge = next;
   }
   face.numberOfVertex--;
   this.affected.faces.add(face);
   face = pair.face;
   if (face.halfEdge === pair) {
      face.halfEdge = pairNext;
   }
   face.numberOfVertex--;
   this.affected.faces.add(face);

   // adjust vertex
   if (toVertex.outEdge === pair) {
      toVertex.outEdge = next;
   }

   // delete stuff
   this._freeEdge(halfEdge);
   this._freeVertex(fromVertex);

   const self = this;
   return function() {  // undo collapseEdge
      self._liftEdge(pairNext, prev, self.addVertex(fromVertex.vertex, fromVertex), halfEdge);
   }
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

   // const self = this;
   // return function() {
   //    self._collapseLoop(outEdge);      
   //}
};
WingedTopology.prototype._collapseLoop = function(halfEdge) {
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
   const self = this;
   return function() {
      self._restoreLoop(next, halfEdge, delPolygon);
   };
};


WingedTopology.prototype.collapseEdge = function(halfEdge) {
   const next = halfEdge.next;
   const pair = halfEdge.pair;
   const pairNext = pair.next;

   // remove edge
   const undo = this._collapseEdge(halfEdge);

   // remove loops(2 side polygon)
   let undoCollapseLeft;
   let undoCollapseRight;
   if (next.next.next === next) {
      undoCollapseLeft = this._collapseLoop(next.next);
   }
   if (pairNext.next.next === pairNext) {
      undoCollapseRight = this._collapseLoop(pairNext);
   }
   return function() {
      if (typeof undoCollapseRight !== 'undefined') {
         undoCollapseRight();
      }
      if (typeof undoCollapseLeft !== 'undefined') {
         undoCollapseLeft();
      }
      undo();
   }
};

// won't work with potentially "dangling" vertices and edges. Any doubt, call dissolveEdge
WingedTopology.prototype.removeEdge = function(outEdge) {
   let inEdge = outEdge.pair;
   if (inEdge.face === null) {   // switch side
      inEdge = outEdge;
      outEdge = outEdge.pair;
      if (inEdge.face === null) {
         console.log("error, both side of the edges are null faces");
         return null;
      }
   }

   //fix the halfedge relations
   const outPrev = outEdge.prev();
   const inPrev = inEdge.prev();
   const inNext = inEdge.next;
   
   outPrev.next = inNext;
   inPrev.next = outEdge.next;

   //correct vertext.outEdge if needed.
   if (outEdge.origin.outEdge === outEdge) {
      outEdge.origin.outEdge = outPrev.pair;
   }
   if (inEdge.origin.outEdge === inEdge) {
      inEdge.origin.outEdge = inPrev.pair;
   }
  
   //deal with the faces
   const face = outEdge.face;    // the other side is boundary, after removal becomes boundary too.
   const delFace = inEdge.face;

   if (face !== null) {
      if (face.halfEdge === outEdge) { //correct the halfedge handle of face if needed
         face.halfEdge = outPrev;
      }
   // make sure everye connect edge point to the same face.
      let size = 0;
      face.eachEdge( function(outEdge) {
         ++size;
         outEdge.face = face;
      });
      face.numberOfVertex = size;
      this.affected.faces.add(face);
   }

   if (delFace !== null) {    // guaranteed to be non-null, but
      this._freePolygon(delFace);
   }
   this._freeEdge(outEdge);
   // return undo functions
   const self = this;
   return function() {
      self.insertEdge(inPrev, inNext, inEdge, delFace);
   };
   //return face;   // return the remaining face handle
};


WingedTopology.prototype.dissolveEdge = function(outEdge) {
   // check next only connect to outEdge? 
   const self = this;
   const inEdge = outEdge.pair;
   if (outEdge.next.pair.next === inEdge) {
      const outNext = outEdge.next;
      return this.collapseEdge(inEdge);   // collapse inward
   } else if (inEdge.next.pair.next === outEdge) {
      return this.collapseEdge(outEdge);  // collapse outward
   } else {
      return this.removeEdge(outEdge);    // normal dissolve
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
         let special = true;
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
      for (let [index, edge] of edges.entries()) {
         if ( (edge.prevEdgeNumber !== edge.edgeNumber) || (prevEdgeNumber == edge.edgeNumber) ) {   // corner or more than 1 vertex on same Edge.
            specialCase = false;
            break;
         }
         prevEdgeNumber = edge.edgeNumber;
      }
      if (specialCase) {
         const edge0Prev = edges[0].outEdge.prev();
         for (let i = 0; i < edges.length; ++i) {
            let origin = edges[i];
            let destination;
            let edge;
            if ( (i+1) < edges.length) {
               destination = edges[i+1];
               edge = this.insertEdge(origin.outEdge.prev(), destination.outEdge);
            } else {
               edge = this.insertEdge(origin.outEdge.prev(), edge0Prev.next);
            }

            edgeList.push( edge );
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


/*WingedTopology.prototype.removePolygon = function(polygon) {
   polygon.eachEdge( function(edge) {
      edge.face = null;
   });
   // put into freeList.
   polygon.halfEdge = null;
   this.freeFaces.push(polygon);
};
function isCorner(outEdge) {
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
      return function() {
         self.addVertex(pt, vertex);
      };
   } else {
      this.addAffectedEdgeAndFace(vertex);
      let count = 0;
      const firstIn = vertex.outEdge.pair;
      let lastIn;
      // slide edge, move edge down like collapse edge, withou thehe collapsing.
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
      return {polygon: polygon, undo: function() {
         // reallocated free vertex
         self.addVertex(pt, vertex);
         // undo collapse loop
         for (let undo of undoCollapseLoop) {
            undo();
         }
         // reattach edges to vertex
         let inEdge = lastIn;
         lastIn = lastIn.next.pair;
         let prevIn = firstIn;
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
         vertex.outEdge = firstIn.pair;
         // free polygon
         self._freePolygon(polygon);
         // selected vertex
         self.addAffectedEdgeAndFace(vertex);
         return vertex;
      }};
   }
};



/***/ }),
/* 14 */
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d__ = __webpack_require__(1);
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
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_view__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d__ = __webpack_require__(1);





  
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //
  // H E L P E R    F U N C T I O N S
  //
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////


  /**
   * Function to check if we clicked inside an element with a particular class
   * name.
   * 
   * @param {Object} e The event
   * @param {String} className The class name to check against
   * @return {Boolean}
   */
   function clickInsideElement( e, className ) {
    if ( e.target.classList.contains(className) ) {
      return e.target;
    } else {
      let target = e.target;
      while ( target = target.parentNode ) {
        if ( target.classList && target.classList.contains(className) ) {
          return target;
        }
      }
    }

    return false;
  };


  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //
  // C O R E    F U N C T I O N S
  //
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  
  /**
   * Variables.
   */
  let menuState = 0;
  let contextMenu = null;   // current context Menu

  /**
   * Initialise our application's code.
   */
  function init(contextClassName, contextMenuLinkClassName) {
    contextListener(contextClassName);
    clickListener(contextMenuLinkClassName);
//    keyupListener();
//    resizeListener();
   // init menubar, bind on hover function (mouseEnter, mouseLeave, )
      let dropdowns = document.querySelectorAll("#menubar .dropdown");
      for (let dropdown of dropdowns) {
         dropdown.addEventListener("mouseenter", function(ev) {
            dropdown.classList.add("hover");
         });
         dropdown.addEventListener("mouseleave", function(ev) {
            dropdown.classList.remove("hover");
         });
      }
  }


  /**
   * Listens for contextmenu events.
   */
function contextListener(className) {
    let createObjectContextMenu = {menu: document.querySelector('#context-menu')};
    function getContextMenu(ev) {
      let popupMenu = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["currentMode"]().getContextMenu();
      if (popupMenu && popupMenu.menu) {
         return popupMenu;
      } else {
         // return default create object menu
         return createObjectContextMenu;
      }
   }; 

    document.addEventListener("contextmenu", function(e) {
      let  canvasInContext = clickInsideElement( e, className );

      if ( canvasInContext ) {
        e.preventDefault();
        contextMenu = getContextMenu(e);
        __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["positionDom"](contextMenu.menu, __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["getPosition"](e));
        toggleMenuOn();
      } else {
        toggleMenuOff();
      }
    }, false);
};

  /**
   * Listens for click events.
   */
  function clickListener(contextMenuLinkClassName) {
    document.addEventListener( "click", function(e) {
      let clickeElIsLink = clickInsideElement( e, contextMenuLinkClassName );

      if ( clickeElIsLink ) {
        //e.preventDefault();
        menuItemListener( clickeElIsLink, e );
      } else {
        if ( (e.button == 0) || (e.button == 1) ) {
          toggleMenuOff();
        }
      }
    }, false);
  }

  /**
   * Listens for keyup events.
   */
//  function keyupListener() {
//    window.onkeyup = function(e) {
//      if ( e.keyCode === 27 ) {
//        toggleMenuOff();
//      }
//    }
//  }

  /**
   * Window resize event listener
   */
//  function resizeListener() {
//    window.onresize = function(e) {
//      toggleMenuOff();
//    };
//  }

  /**
   * Turns the custom context menu on.
   */
  function toggleMenuOn() {
    if ( menuState !== 1 ) {
      menuState = 1;
      contextMenu.menu.style.display = "block";
      __WEBPACK_IMPORTED_MODULE_2__wings3d__["log"](__WEBPACK_IMPORTED_MODULE_2__wings3d__["action"].contextMenu, contextMenu.menu.id);   // needs to 
    }
  }

  /**
   * Turns the custom context menu off.
   */
  function toggleMenuOff() {
    if ( menuState !== 0 ) {
      menuState = 0;
      contextMenu.menu.style.display = "none";
    }
  }


  /**
   * Dummy action function that logs an action when a menu item link is clicked
   * 
   * @param {HTMLElement} link The link that was clicked
   */
  function menuItemListener( link, ev ) {
    toggleMenuOff();
    help( "wings3d api - " + link.getAttribute("wings3d-api"));
    //Wings3D.callApi(link.getAttribute("wings3d-api", UI.getPosition(ev)));
  }

__WEBPACK_IMPORTED_MODULE_2__wings3d__["onReady"](function() {
   init('content', 'popupmenu');
});

/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setHotkey", function() { return setHotkey; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bindHotkey", function() { return bindHotkey; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d__ = __webpack_require__(1);
//
// hotkey handling and remapping.
//
//
//



const _private = {keyMap: new Map, idMap: new Map};

document.addEventListener('keydown', function(event) {
   event.preventDefault();
   event.stopPropagation();
   //      Don't fire in text-accepting inputs that we didn't directly bind to

   // extract alt, ctrl, shift key
   const meta = Object(__WEBPACK_IMPORTED_MODULE_0__wings3d__["createMask"])(event.altKey, event.ctrlKey, event.shiftKey);
   // extract key
   const hotkey = event.key.toLowerCase();
   // run the binding function
    if (_private.keyMap.has(hotkey)) {
      const metaSet = _private.keyMap.get(hotkey);
      for (let value of metaSet) {
         if ( (value.meta & meta) == value.meta) { // has all the meta
            if (_private.idMap.has(value.id)) {
               const fn = _private.idMap.get(value.id);
               fn(event);
               break;
            }
         }
      }
   }
}, true);

function setHotkey(id, hotkey, meta='') {
      hotkey = hotkey.toLowerCase();
      meta = meta.toLowerCase();
      const metaMask = Object(__WEBPACK_IMPORTED_MODULE_0__wings3d__["createMask"])(meta.indexOf('alt') > -1, meta.indexOf('ctrl') > -1, meta.indexOf('shift') > -1);
      if (!_private.keyMap.has(hotkey)) {
         _private.keyMap.set(hotkey, []);
      }
      _private.keyMap.get(hotkey).unshift({id: id, meta: metaMask});
};
function bindHotkey(id, fn) {
   _private.idMap.set(id, fn);
};



/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "renderText", function() { return renderText; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "needToRedraw", function() { return needToRedraw; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "render", function() { return render; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_gl__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_view__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_shaderprog__ = __webpack_require__(5);
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

/* move to shaderprog.js
   // render shaded object.
   ShaderProg.cameraLight = gl.createShaderProgram(ShaderProg.cameraLight.vertex, ShaderProg.cameraLight.fragment);

   ShaderProg.solidColor = gl.createShaderProgram(ShaderProg.solidColor.vertex, ShaderProg.solidColor.fragment);

   ShaderProg.simplePoint = gl.createShaderProgram(ShaderProg.simplePoint.vertex, ShaderProg.simplePoint.fragment);

   ShaderProg.colorPoint = gl.createShaderProgram(ShaderProg.colorPoint.vertex, ShaderProg.colorPoint.fragment);

   ShaderProg.solidWireframe = gl.createShaderProgram(ShaderProg.solidWireframe.vertex, ShaderProg.solidWireframe.fragment);

   ShaderProg.colorWireframe = gl.createShaderProgram(ShaderProg.colorWireframe.vertex, ShaderProg.colorWireframe.fragment);

   ShaderProg.colorSolidWireframe = gl.createShaderProgram(ShaderProg.colorSolidWireframe.vertex, ShaderProg.colorSolidWireframe.fragment);

   ShaderProg.selectedColorLine = gl.createShaderProgram(ShaderProg.selectedColorLine.vertex, ShaderProg.selectedColorLine.fragment);

   ShaderProg.selectedColorPoint = gl.createShaderProgram(ShaderProg.selectedColorPoint.vertex, ShaderProg.selectedColorPoint.fragment);*/

   console.log("Render.init() success");
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
      
      var color = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].color;
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
   var clr = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].color;
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
   var color = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].color,
       negColor = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].negColor;
   var arry = [];
   for (var i = 0; i < 3; i++) {
      arry = arry.concat(color[i], color[i], negColor[i], negColor[i]);
   }
   return new Float32Array(arry);
}
function renderGroundAndAxes(gl, projection, modelView) {
   var showAxes = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["prop"].showAxes;
   // draw groundPlane
   var show = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["prop"].showGroundplane; // || 
      //(wings_pref:get_value(force_show_along_grid) andalso
      //(Camera.view.alongAxis =/= none);      
   if (show) {
      var alongAxis = __WEBPACK_IMPORTED_MODULE_2__wings3d_camera__["view"].alongAxis;
      var color = __WEBPACK_IMPORTED_MODULE_1__wings3d_view__["theme"].gridColor;
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
      gl.uniform4fv(lineProg.uniform.uColor.loc, new Float32Array([color[0], color[1], color[2], 1.0]));
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

      gl.clearColor(0.6, 0.6, 0.8, 1.0);
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
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return WavefrontObjImportExporter; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_importexport__ = __webpack_require__(19);
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
         text += "\n#vertex total " + mesh.vertices.length + "\n";
         for (let vertex of mesh.vertices) {
            const vert = vertex.vertex;
            text += "v " + vert[0] + " " + vert[1] + " " + vert[2] + "\n";
         }
         // "f index+1 index+1 index+1"
         text += "\n#face list total " + mesh.faces.length + "\n";
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
         this.objs.push( this.obj );
         return this.objs;
      }
   }

   o(objName) {
      if (this.obj.vertices.length == 0) {   //
         // no needs to create a new one.
      } else {
         this.objs.push( this.obj );
         this.obj = new WingedTopology;
      }
      this.obj.clearAffected();
      // assignedName
      this.obj.name = objName;
   }

   g(groupNames) {
      // to be implemented later

   }

   s(groupNumber) {
      // to be implemented later
   }

   v(vertex) {
      // should we do error check?
      this.obj.addVertex(vertex);
      this.vertexCount++;
   }

   f(index) {
      const faceIndex = [];
      for (let i of index) {
         let split = i.split('/');
         let idx = split[0] - 1;          // convert 1-based index to 0-based index.
         if ( (idx >= 0) && (idx < this.obj.vertices.length)) {
            faceIndex.push( idx );
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
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ImportExporter", function() { return ImportExporter; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_model__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_wingededge__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_view__ = __webpack_require__(2);
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
         __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["addMenuItem"]('#fileImport', '#import' + importMenuText, importMenuText, function(ev) {
               __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["openFile"](function(file) { // open file Dialog, and retrive data
                     self.import(file);
                  });      
            });
      }
      if (exportMenuText) {
         const form = __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["setupDialog"]('#exportFile', function(data) {
            if (data['Filename']) {
               self.export(data['Filename']);
            }
         });

         if (form) {
            __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["addMenuItem"]('#fileExport', '#export' + exportMenuText, exportMenuText, function(ev) {
                  // popup dialog.
                  // position then show form;
                  __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["positionDom"](form, __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["getPosition"](ev));
                  form.style.display = 'block';
                  form.reset();
               });
         }
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
         const meshes = self._import(text);
         const cages = [];
         for (let mesh of meshes) {
            let cage = __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["putIntoWorld"](mesh);
            cages.push( new __WEBPACK_IMPORTED_MODULE_0__wings3d_model__["CreatePreviewCageCommand"](cage) );
         }
         if (cages.length > 1) {
            // combo
            __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["undoQueueCombo"]( cages );
         } else if (cages.length > 0) {
            __WEBPACK_IMPORTED_MODULE_3__wings3d_view__["undoQueue"](cages[0]);
         }
         // after we finisehd _reset too.
         self._reset();
      }

      reader.readAsText(file);
   }

   _reset() {
      this.objs = [];
      this.obj = new __WEBPACK_IMPORTED_MODULE_1__wings3d_wingededge__["WingedTopology"];
      this.polygonCount = 0;
      this.vertexCount = 0;
      this.non_manifold = [];
   }
};



/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BoundingSphere", function() { return BoundingSphere; });
/*
   require glmatrix
*/


const BoundingSphere = function(center, radius, polygon) {
   this.center = center;
   this.radius = radius;
   this.radius2 = radius*radius;
   this.polygon = polygon;
};

BoundingSphere.prototype.isReal = function() {
   return this.polygon.isReal();
};

BoundingSphere.prototype.isIntersect = function(ray) {
	//  Fast Ray Sphere Intersection - eric haine, realtimerendering, similar to graphic gem's Jeff Hultquist
	var l = vec3.create();
   vec3.sub(l, this.center, ray.origin);
	var l2 = vec3.dot(l, l);
	var projection = vec3.dot(l, ray.direction);
   if ((projection < 0.0) && (l2 > this.radius2)) { // sphere is totally behind the camera, not just sphere's origin
      return false;
   }
   if ((l2 - (projection*projection)) > this.radius2) {   // discriminant < 0.0f, no sqrt, no intersection.
      return false;
   }

   // don't care about true intersection of the 2, just there is a intersection.
   return true;
};

BoundingSphere.prototype.setSphere = function(sphere) {
   this.center = sphere.center;
   this.radius = sphere.radius;
   this.radius2 = sphere.radius*sphere.radius;
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
   return new BoundingSphere(sphere.center, sphere.radius, polygon);
}



/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_view__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__ = __webpack_require__(0);
/*
// button toolbar for geometry ...etc. 
*/





   /*
   * variable 
   */   
const buttonBarClassName = {
         bar: ".button-bar",
         group: ".button-group",
         button: ".button",
         //link: , 
         //active: ".button-active",
      };

//
// needs refactoring.
function init() {
   const toolbar = document.querySelector(buttonBarClassName.bar);
   const buttons = toolbar.querySelectorAll('div label');
   for (let button of buttons) {
      const func = __WEBPACK_IMPORTED_MODULE_0__wings3d_view__["id2Fn"](button.id);
      if (func) {
         __WEBPACK_IMPORTED_MODULE_2__wings3d_ui__["bindMenuItem"](button.id, function(ev) {
            //ev.preventDefault();
            help( "wings3d - " + ev.currentTarget.id);
            func();
          });
      }
   }
};


__WEBPACK_IMPORTED_MODULE_1__wings3d__["onReady"](init);

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(23);
__webpack_require__(9);
__webpack_require__(20);
__webpack_require__(21);
__webpack_require__(11);
__webpack_require__(8);
__webpack_require__(6);
__webpack_require__(3);
__webpack_require__(30);
__webpack_require__(16);
__webpack_require__(19);
__webpack_require__(14);
__webpack_require__(7);
__webpack_require__(15);
__webpack_require__(12);
__webpack_require__(17);
__webpack_require__(5);
__webpack_require__(31);
__webpack_require__(0);
__webpack_require__(4);
__webpack_require__(10);
__webpack_require__(2);
__webpack_require__(13);
module.exports = __webpack_require__(1);


/***/ }),
/* 23 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__css_default_css__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__css_default_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__css_default_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__css_menu_css__ = __webpack_require__(25);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__css_menu_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__css_menu_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__css_button_css__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__css_button_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__css_button_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__css_form_css__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__css_form_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__css_form_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__css_bubble_css__ = __webpack_require__(28);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__css_bubble_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__css_bubble_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wings3d_menu__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__wings3d_view__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__wings3d_buttonbar__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__wings3d_camera__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__wings3d_interact__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__wings3d__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__wings3d_ui__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__js_plugins_cubeshape_js__ = __webpack_require__(29);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__js_plugins_wavefront_obj_js__ = __webpack_require__(18);
// app.js
//  for bundling and initialization
//

// import css, should bundle it to a different files.






// import js








// plugins




__WEBPACK_IMPORTED_MODULE_10__wings3d__["start"]('glcanvas');

/***/ }),
/* 24 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 25 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 26 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

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
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export createCube */
/* unused harmony export createCubeDialog */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d_view__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wings3d_wingededge__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__wings3d_model__ = __webpack_require__(12);
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
      var mesh = new __WEBPACK_IMPORTED_MODULE_3__wings3d_wingededge__["WingedTopology"];
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

      _pvt.previewCage = __WEBPACK_IMPORTED_MODULE_2__wings3d_view__["putIntoWorld"](mesh);
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
         // accept previewCage to the world
         __WEBPACK_IMPORTED_MODULE_2__wings3d_view__["undoQueue"]( new __WEBPACK_IMPORTED_MODULE_4__wings3d_model__["CreatePreviewCageCommand"](_pvt.previewCage) );
         _pvt.previewCage.name = "Cube" + (_pvt.creationCount+1);
         __WEBPACK_IMPORTED_MODULE_1__wings3d__["log"]("createCube", _pvt.previewCage);
         _pvt.previewCage = null;
         _pvt.creationCount++;
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
   var menuItem = document.querySelector("#createCube");
   if (menuItem) {
      menuItem.addEventListener("click", function(ev) {
         // get exact position,
         var position = __WEBPACK_IMPORTED_MODULE_0__wings3d_ui__["getPosition"](ev);
         // run createCube dialog
         createCubeDialog(position);
         __WEBPACK_IMPORTED_MODULE_1__wings3d__["log"](__WEBPACK_IMPORTED_MODULE_1__wings3d__["action"].createCubeDialog);
      })
   }
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
/* 30 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "tours", function() { return tours; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__wings3d_interact__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__wings3d_ui__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__wings3d__ = __webpack_require__(1);
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
   __WEBPACK_IMPORTED_MODULE_1__wings3d_ui__["bindMenuItem"]("#about", (ev) => {
      tours.about();
   });
   __WEBPACK_IMPORTED_MODULE_1__wings3d_ui__["bindMenuItem"]("#introduction", (ev) => {
      tours.introduction();
   });
   __WEBPACK_IMPORTED_MODULE_1__wings3d_ui__["bindMenuItem"]("#basicCommands", (ev) => {
      tours.basicCommands();
   });

   __WEBPACK_IMPORTED_MODULE_1__wings3d_ui__["bindMenuItem"]("#tableTutor", (ev) => {
      tours.tableTutor();
   });
}

__WEBPACK_IMPORTED_MODULE_2__wings3d__["onReady"](createGuideTour);



/***/ }),
/* 31 */
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



/***/ })
/******/ ]);