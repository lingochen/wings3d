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
   createGroup: ()=>{notImplemented(this);},
   createGroupWorld: ()=>{notImplemented(this);},
   importImageFileGUI: ()=>{notImplemented(this);},
   showImage: ()=>{notImplemented(this);},
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

export {
   onReady,
   start,
   log,
   interposeLog,
   createMask,
   GROUND_GRID_SIZE,
   CAMERA_DIST,
   action,
   addActionConstant,
   bindAction,
   runAction,
   setInteraction,
   ezFetch,
};
