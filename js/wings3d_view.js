/*
//     This module implements most of the commands in the View menu. 
//
// Original Erlang Version: Bjorn Gustavsson
*/

import * as UI from './wings3d_ui.js';
import * as Renderer from './wings3d_render.js';
import * as Camera from './wings3d_camera.js';
import {gl} from './wings3d_gl.js';
import {WavefrontObjImportExporter } from './plugins/wavefront_obj.js';
import {X3dImportExporter} from './plugins/x3d.js';
import * as Wings3D from './wings3d.js';
import {EditCommandSimple, EditCommandCombo} from './wings3d_undo.js';
import {FaceMadsor} from './wings3d_facemads.js';
import {EdgeMadsor} from './wings3d_edgemads.js';
import {VertexMadsor} from './wings3d_vertexmads.js';
import {BodyMadsor, DeleteBodyCommand, DuplicateBodyCommand} from './wings3d_bodymads.js';
import {MultiMadsor} from './wings3d_multimads.js';
import {PreviewCage, PreviewGroup} from './wings3d_model.js';
import {DraftBench} from './wings3d_draftbench.js';
import {Ray} from './wings3d_boundingvolume.js';
import * as Hotkey from './wings3d_hotkey.js';
import * as Util from './wings3d_util.js';
import * as TreeView from './wings3d_uitree.js';
import { GenericEditCommand, ToggleCheckbox } from './wings3d_mads.js';
import * as OpenSave from './wings3d_opensave.js'
import { ImportExporter } from './wings3d_importexport.js';


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
      showMiniAxis: true
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
         unselectedEdgeColor: '#000000',
         hardEdgeColor: '#FF8000',
         selectedColor: '#A60000',
         selectedHilite: '#B3B300',
         unselectedHilite: '#00A600',
         unselectedVertexColor: '#000000',
         //maskedVertexColor: '#80FF00', // alpha #0.8,
         faceColor: '#C9CFB1',   // materialDefault
         sculptMagnetColor: '#0000FF',  // alpha #0.1
         tweakMagnetColor: '#0000FF',  // alpha #0.06
         tweakVectorColor: '#FF8000',
       },

       draftBenchPref: {
         unselectedVertexSize: 4.0,
         selectedVertexSize: 5.0,
         maskedVertexSize: 8.0,
         unselectedEdgeWidth: 2.0,
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
   // load camera pref
   traverse(Camera.pref, (_obj, key, value)=> {
      const data = form.querySelectorAll(`input[name=${key}]`);   // both range and number input
      for (let datum of data) {
         datum.value = value;
      }
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
         root.style.setProperty(`--${key}`, Util.hexToCssRGBA(value));
      }
    });
   // store draftBench
   _environment.draftBench.setTheme(theme.draftBench, theme.draftBenchPref);
   // store prop
   traverse(prop, (obj, key, _value)=> {
      const data = form.querySelector(`input[type=checkbox][name=${key}]`);
      if (data) {
         obj[key] = data.checked;
      }
    });
    // store camera's dragging value
    traverse(Camera.pref, (obj, key, _value)=>{
      const data = form.querySelector(`input[type=number][name=${key}]`);
      if (data) {
         obj[key] = data.value;
      }
    });
    Renderer.needToRedraw();
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
   mode.face = new FaceMadsor;
   mode.edge = new EdgeMadsor;
   mode.vertex = new VertexMadsor;
   mode.body = new BodyMadsor;
   mode.multi = new MultiMadsor;
   mode.current = mode.multi;
};


function toggleMode(mode) {
   let button = document.getElementById('toggle'+mode+'ModeFor');  // :checked property only existed on <input>
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
      Renderer.needToRedraw();
   }
};

function toggleFaceMode() {
   if (mode.current !== mode.face) {
      mode.current.toggleFunc(mode.face);
      mode.current = mode.face;
      toggleMode('Face');
      Renderer.needToRedraw();
   }
};

function toggleEdgeMode() {
   if (mode.current !== mode.edge) {
      mode.current.toggleFunc(mode.edge);
      mode.current = mode.edge;
      toggleMode('Edge');
      Renderer.needToRedraw();
   }
};

function toggleBodyMode() {
   if (mode.current !== mode.body) {
      mode.current.toggleFunc(mode.body);
      mode.current = mode.body;
      toggleMode('Body');
      Renderer.needToRedraw();
   }
};

function toggleMultiMode() {
   if (mode.current !== mode.multi) {
      mode.current.toggleFunc(mode.multi);
      mode.current = mode.multi;
      toggleMode('Multi');
      Renderer.needToRedraw();
   }
};

function restoreVertexMode(snapshots) {
   if (mode.current !== mode.vertex) {
      mode.current.restoreMode(mode.vertex, snapshots);
      mode.current = mode.vertex;
      toggleMode('Vertex');
      Renderer.needToRedraw();
   } else {
      // bad state. should always be in other mode. 
   }
};

function restoreFaceMode(snapshots) {
   if (mode.current !== mode.face) {
      mode.current.restoreMode(mode.face, snapshots);
      mode.current = mode.face;
      toggleMode('Face');
      Renderer.needToRedraw();
   } else {
      // bad state. should always be in other mode. 
   }
};

function restoreEdgeMode(snapshots) {
   if (mode.current !== mode.edge) {
      mode.current.restoreMode(mode.edge, snapshots);
      mode.current = mode.edge;
      toggleMode('Edge');
      Renderer.needToRedraw();
   } else {
      // bad state. should always be in other mode. 
   }
};

function restoreBodyMode(snapshots) {
   if (mode.current !== mode.body) {
      mode.current.restoreMode(mode.body, snapshots);
      mode.current = mode.body;
      toggleMode('Body');
      Renderer.needToRedraw();
   } else {
      // bad state. should always be in other mode. 
   }
};

function restoreMultiMode(snapshots) {
   if (mode.current !== mode.multi) {
      mode.current.restoreMode(mode.multi, snapshots);
      mode.current = mode.multi;
      toggleMode('Multi');
      Renderer.needToRedraw();
   } else {
      // bad state. should always be in other mode. 
   }
};

const currentMode = () => mode.current;
//- End of editing Mode ----------

//
// world objects management, world, bench, image, material,
//
const _environment = {
   world: new PreviewGroup,    // private var
   draftBench: undefined,      // = new DraftBench; wait for GL
   geometryGraph: undefined,   // tree management of world; 
   imageList: undefined,
   materialList: undefined,
   lightList: undefined,
   currentObjects: undefined,
   currentParent: undefined,
   fileName: "",              // save fileName. + path.
   debug: {toggleOn: false, queue: []},
};
function addMaterial(material) {
   _environment.materialList.addMaterial(material);
}
function newCage() {
   return new PreviewCage(_environment.draftBench);
}
function putIntoWorld() {
   let model = new PreviewCage(_environment.draftBench);
   return addToWorld(model);
};
function moveCage(newParent, model) {  // drag & drop
   model.removeFromParent();
   newParent.insert(model);
   _environment.world.numberOfCage();   // update Count Status
};

function addToWorld(model, parent = _environment.world) { // default parent is world
   parent.insert( model );
   _environment.geometryGraph.addObject(model, parent.guiStatus.ul);
   model.setVisible(true);
   Renderer.needToRedraw();
   _environment.world.numberOfCage();   // update CountStatus
   return model;
}

function removeFromWorld(previewCage) {
   const deleted = previewCage.removeFromParent();
   if (deleted) {
      previewCage.setVisible(false);
      Renderer.needToRedraw();
      // remove from geometryGraph
      _environment.geometryGraph.removeObject(previewCage);
      _environment.world.numberOfCage();   // update CountStatus.
   }
   return deleted;
};
function getWorld() {
   return _environment.world.getCage();
}
function updateWorld() {
   Renderer.needToRedraw();
};
function makeCombineIntoWorld(cageSelection) {
   let combine = new PreviewCage(_environment.draftBench);
   for (let cage of cageSelection) {
      removeFromWorld(cage);
   }
   combine.merge(cageSelection); // new cage + merged polygons.
   addToWorld(combine);
   return combine;
};
function setObject(parent, objects) { // objects is array
   _environment.currentObjects = objects;
   _environment.currentParent = parent;
};
function toggleDebug() {
   _environment.debug.toggleOn = !_environment.debug.toggleOn;
   if (_environment.debug.toggleOn) {  // turn on debug, now relq
      alert("In Debug Mode");
   } else { // off, release queue.
      _environment.debug.queue = [];
   }
};
function debugPush() {
   if (_environment.debug.toggleOn) {
      _environment.world.checkIntegrity();
      _environment.debug.queue.push( _environment.draftBench.checkPoint() );
   }
};
function debugPop() {
   if (_environment.debug.toggleOn) {
      _environment.world.checkIntegrity();
      _environment.debug.queue.pop();
      if (_environment.debug.queue.length) {
         const checkPoint = _environment.debug.queue[_environment.debug.queue.length-1];
         _environment.draftBench.checkup(checkPoint);
      }
   }
};
//-- End of World objects management -------------------------



// 
// undo/redo handling ------------------------------------------------------------------------------
//
const undo = {queue: [], current: -1, isModified: false};
// undo queueCombo, convenient functions
function undoQueueCombo(editCommands) {
   // wrap the array in a combo
   const combo = new EditCommandCombo(editCommands);
   undoQueue( combo );
};
// undo queue
function undoQueue(editCommand) {
   //if (!editCommand.doIt()) {  // move all check here.
   //   return;
   //}
   // editCommand = new CheckPoint(_environment.draftBench, editCommand);      // debug purpose. 

   while ( (undo.queue.length-1) > undo.current ) {
      // remove branch not taken
      const cmd = undo.queue.pop();
      cmd.free();
   }
   // now push the new command back
   undo.queue.push(editCommand);
   undo.current++;
   Renderer.needToRedraw();
   undo.isModified = true;
   debugPush();
};

function redoEdit() {
   if ( (undo.queue.length-1) > undo.current) {
      undo.queue[++undo.current].doIt(mode.current);
      Renderer.needToRedraw();
      undo.isModified = true;
      debugPush();
   }
};

function undoEdit() {
   if (undo.current >= 0) {
      const cmd = undo.queue[undo.current--];
      cmd.undo(mode.current);
      Renderer.needToRedraw();
      undo.isModified = true;
      debugPop();
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

function resetUndo() {
   undo.isModified = false;
   undo.current = -1;
   undo.queue = [];
};

function resetModified() {
   undo.isModified = false;
}

// -- end of undo/redo handling ----------------------------------------------------------------------------------



//
// mouse handling hilite-------------------------------------------------------------
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
      const destination = edge.destination(); // find out if we are within the distance threshold
      const origin = edge.origin;
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
      const sphere = edge.face;
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
            vec3.copy(planeRect.center, hiliteVertex);
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
               vec3.add(planeRect.center, hiliteEdge.origin, hiliteEdge.destination());
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
         hilite.vertex.setHilite(false);
      }
      if (hiliteVertex !== null) {
         if (handler.mouseSelect && !handler.mouseSelect.hilite( {vertex: hiliteVertex, plane: hilite.plane}, currentCage)) {
            hiliteVertex = null;
         } else {
            hiliteVertex.setHilite(true);
         }
      }
      hilite.vertex = hiliteVertex;
   }
   if (hiliteEdge !== hilite.edge) {
      if (hilite.edge !== null) {
         hilite.edge.setHilite(false);
      }
      if (hiliteEdge !== null) {
         if (handler.mouseSelect && !handler.mouseSelect.hilite( {edge: hiliteEdge, plane: hilite.plane}, currentCage)) {
            hiliteEdge = null;
         } else {
            hiliteEdge.setHilite(true);
         }
      }
      hilite.edge = hiliteEdge;
   }
   if (hiliteFace !== hilite.face) {
      if (hilite.face !== null) {
         hilite.face.setHilite(false);
      }
      if (hiliteFace !== null) {
         if (handler.mouseSelect && !handler.mouseSelect.hilite( {face: hiliteFace, plane: hilite.plane}, currentCage)) {
            hiliteFace = null;
         } else {
            hiliteFace.setHilite(true);
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
// mouse handling ---------------------------------------------------------------------
//
let lastPick = null;

function rayPick(ray) {
   let pick = null;
   for (let model of _environment.world.getCage()) {
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
      Renderer.needToRedraw();
   } else {
      if (lastPick !== null) {
         // deselect last selection
         setCurrent(null);
         Renderer.needToRedraw();
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
      Renderer.needToRedraw();
   }
};

function selectDrag() {
   if ((dragMode !== null)) {// &&
       if ((lastPick !== null)) {
         dragMode.dragSelect(lastPick.model, hilite);
         Renderer.needToRedraw();
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
   if (ev.button === 0) {
      if (handler.camera !== null) {
         handler.camera.doIt();  
         releaseHandlerCamera();
         Wings3D.log(Wings3D.action.cameraModeExit, Camera.view);
         help('L:Select   M:Start Camera   R:Show Menu   [Alt]+R:Tweak menu');      
      } else if (handler.mousemove !== null) {
         undoQueue( handler.mousemove );  // put on queue, commit()?
         releaseHandlerMouseMove(); // handler.mousemove = null;
      } else if (handler.mouseSelect !== null) {
         if (handler.mouseSelect.select(hilite)) {
            if (handler.mouseSelect.isMoveable()) {   // now do mousemove.
               // handler.mousemove must be null.
               attachHandlerMouseMove(handler.mouseSelect); //handler.mousemove = handler.mouseSelect;
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
         attachHandlerCamera( Camera.getMouseMoveHandler() );
         // tell tutor step, we are in camera mode
         Wings3D.log(Wings3D.action.cameraModeEnter, Camera.view);
         help('L:Accept   M:Drag to Pan  R:Cancel/Restore to View   Move mouse to tumble');
         // disable mouse cursor
         //document.body.style.cursor = 'none';
      } 
   } else if (ev.button === 2) { // hack up 2019/07/26 to handle no contextmenu event in pointerLock, - needs refactor
      if (handler.camera) {      // firefox will generate contextmenu event if we put it on mouseDown.
         handler.camera.undo();
         releaseHandlerCamera();
         Wings3D.log(Wings3D.action.cameraModeExit, Camera.view);   // log action
         help('L:Select   M:Start Camera   R:Show Menu   [Alt]+R:Tweak menu');
      } else if (handler.mousemove) {
         handler.mousemove.undo();
         releaseHandlerMouseMove();
         Renderer.needToRedraw();
      } else {
         handler.mouseSelect = null;   // no needs to undo because we havent doIt() yet.
         Renderer.needToRedraw();
      }
   }
};

function canvasHandleMouseMove(e) {
   if (handler.camera !== null) {
      handler.camera.handleMouseMove(e);
   } else if (handler.mousemove !== null) {
      handler.mousemove.handleMouseMove(e, Camera.view);
      Renderer.needToRedraw();
   } else {
      // handle pick selection
      var viewport = gl.getViewport();
      // needs to get the real offset by walking over all the parent.
      const offset = { left: e.currentTarget.offsetLeft, top: e.currentTarget.offsetTop};
      for (let reference = e.currentTarget.offsetParent; reference; reference = reference.offsetParet) {
         offset.left += reference.offsetLeft;
         offset.top += reference.offsetTop;
      }

      var winx = e.pageX - offset.left;
      var winy = (viewport[3]+1) - (e.pageY - offset.top);   // y is upside-down
      // yes, sometimes mouse coordinate is outside of the viewport. firefox is larger than width, height.
      if (winx < 0) { winx = 0; }
      if (winx > viewport[2]) { winx = viewport[2];}
      if (winy < 0) { winy = 0; }
      if (winy > viewport[3]) { winy = viewport[3];}

      var mat = loadMatrices(false);
      var ptNear = gl.unProject(winx, winy, 0.0, mat.modelView, mat.projection);
      var ptFar = gl.unProject(winx, winy, 1.0, mat.modelView, mat.projection);

      vec3.sub(ptFar, ptFar, ptNear);
      vec3.normalize(ptFar, ptFar);
      const ray = new Ray(ptNear, ptFar);
      //geometryStatus("mouse position: " + ptNear[0] + ", " + ptNear[1] + "," + ptNear[2] + ", <br />"+ ptFar[0] + ", " + ptFar[1] + ", " + ptFar[2]);
      rayPick(ray);
      // selectDrag if left button mousedown
      selectDrag();
   }
};

// contextMenu, mouse right click.
function canvasHandleContextMenu(ev) {
   if (handler.mouseSelect) {
      // prevent propagation.
      ev.preventDefault();
      ev.stopImmediatePropagation();      // prevent document's contextmenu popup
      return true;                        // mouseUp will handle select event.
   }
   // let wings3d_contextmenu handle the event.
   return false;
};

function releaseHandlerCamera() {
   handler.camera = null;
   document.exitPointerLock();
};
function attachHandlerCamera(camera) {
   gl.canvas.requestPointerLock();
   handler.camera = camera;
}

function releaseHandlerMouseMove() {
   handler.mousemove = null;
   document.exitPointerLock();
};
// handling in reverse order. the newest one will handle the event. (should be at most 2 handler)
function attachHandlerMouseMove(mousemoveHandler) {
   gl.canvas.requestPointerLock();
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
   Camera.zoomStep(py);
};

//-- end of mouse handling-----------------------------------------------


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
   const size = gl.getViewport();
   const aspect = (size[2]-size[0]) / (size[3]-size[1]);
   const view = Camera.view;
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

   mat4.mul(gl.projection, In, tp);
   return gl.projection;
};

function modelView(includeLights = false) {
   const view = Camera.view;

   let useSceneLights = false;
   if (includeLights) {
      useSceneLights = prop.useSceneLights; // && Wings3D.light.anyEnabledLights();
      if (!useSceneLights) {
         //Wings3D.light.cameraLights();
      }
   }

   // fromTranslation, identity * vec3. modelView rest.
   mat4.fromTranslation(gl.modelView, vec3.fromValues(view.panX, view.panY, -view.distance));
   mat4.rotateX(gl.modelView, gl.modelView, view.elevation * Math.PI / 180);
   mat4.rotateY(gl.modelView, gl.modelView, view.azimuth * Math.PI / 180);
   mat4.translate(gl.modelView, gl.modelView, view.origin);

   if (useSceneLights) {
      //Wings3D.light.globalLights();
   }
   return {useScentLights: useSceneLights, modelView: gl.modelView};
};

function drawWorld(gl) {
   //if (world.length > 0) {
      // update selectStatus
      let count = 0;
      for (let model of _environment.world.getCage()) {
         model.updateStatus();
         ++count;
      }
      if (count === 0) {
         return;
      }

      //gl.enable(gl.BLEND);
      //gl.blendFunc(gl.SRC_COLOR, gl.DST_COLOR);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      //offset
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1.0, 1.0);          // Set the polygon offset
      // draw Current Select Mode (vertex, edge, or face)
      mode.face.polygonShader(gl, hilite.face || hilite.cage);
      gl.bindTransform();
      _environment.draftBench.draw(gl, mode.current);       // draw polygon.
      gl.disable(gl.POLYGON_OFFSET_FILL);
      // end offset

      // blend 
      //gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      mode.current.edgeShader(gl, isEdgeSelectable());//hilite.edge !== null);
      gl.bindTransform();
      _environment.draftBench.drawEdge(gl, mode.current);

      if (mode.current.vertexShader(gl, isVertexSelectable())) { //hilite.vertex !== null)) {
         gl.bindTransform();
         _environment.draftBench.drawVertex(gl, mode.current);
      }
      gl.disable(gl.BLEND);
      // end of blend 

      // hack - draw plane
      if (hilite.plane) {
         _environment.draftBench.drawPlane(gl, hilite.plane);
      }
   //}
}

function render(gl) {
   if (_environment.world.numberOfCage() > 0) {
      if (_environment.draftBench.isModified()) {   // check for modification. 
         Renderer.needToRedraw();
      }
   }
   Renderer.render(gl, drawWorld);
};

//-- end of world rendering and utility functions ---------------------------------------------------------------

//
// initialization
//
function init() {
   initMode();
   //Renderer.init(gl, drawWorld);  // init by itself
   _environment.draftBench = new DraftBench(theme.draftBench, theme.draftBenchPref, _environment.materialList);
   // init menu
   const selectionMenu = [ {id: Wings3D.action.deselect, fn: 'resetSelection', hotKey: ' '},
                         {id: Wings3D.action.more, fn: 'moreSelection', hotKey: '+'},
                         {id: Wings3D.action.less, fn: 'lessSelection', hotKey: '-'},
                         {id: Wings3D.action.similar, fn: 'similarSelection', hotkey: 'i'},
                         {id: Wings3D.action.all, fn: 'allSelection', hotKey: 'a', meta: 'ctrl'}, 
                         {id: Wings3D.action.inverse, fn: 'inverseSelection', hotKey: 'i', meta: 'ctrl+shift'},
                         {id: Wings3D.action.adjacent, fn: 'adjacentSelection'}
                        ];
   for (let select of selectionMenu) {
      UI.bindMenuItem(select.id.name, function(ev) {
         const command = new EditCommandSimple(select.fn);
         if(command.doIt(mode.current)) {
            undoQueue( command );
         }
      }, select.hotKey, select.meta);
   }

   // toggle sidebar
   UI.bindMenuItem(Wings3D.action.openSidebar.name, (ev) => {
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
   const toolBar = [ {id: Wings3D.action.undoEdit, fn: undoEdit, hotKey: ' '},
                     {id: Wings3D.action.redoEdit, fn: redoEdit, hotKey: ' '},
                     {id: Wings3D.action.toggleVertexMode, fn: toggleVertexMode, hotKey: ' '},
                     {id: Wings3D.action.toggleEdgeMode, fn: toggleEdgeMode, hotKey: ' '},
                     {id: Wings3D.action.toggleFaceMode, fn: toggleFaceMode, hotKey: ' '},
                     {id: Wings3D.action.toggleBodyMode, fn: toggleBodyMode, hotKey: ' '},
                     {id: Wings3D.action.toggleMultiMode, fn: toggleMultiMode, hotkey: ' '},
                   ];
   // bindMenu toolbar
   for (let button of toolBar) {
      UI.bindMenuItem(button.id.name, function(ev) {
         //ev.preventDefault();
         help( "wings3d - " + ev.currentTarget.id);
         button.fn();
       });
   }
   const propBar = [{id: Wings3D.action.toggleGround, propName: 'showGroundplane', selector: '#toggleGroundFor'},
                    {id: Wings3D.action.toggleAxes, propName: 'showAxes', selector: '#toggleAxesFor'},
                    {id: Wings3D.action.toggleOrtho, propName: 'orthogonalView', selector: '#toggleOrthoFor'}];
   for (let button of propBar) {
      // bind showGrid/showAxes/persp-ortho button
      UI.bindMenuItem(button.id.name, (_ev)=> {
         const data = document.querySelector(button.selector);
         if (data) {
            prop[button.propName] = !data.checked;  // click event is earlier than input.checked event, so the value hasn't toggle yet.
            Renderer.needToRedraw();
         }
       });
   }
   // bind pref button
   UI.bindMenuItem(Wings3D.action.preferenceButton.name, (_ev)=>{
      UI.runDialogCenter('#preferenceForm', storePref, loadPref);
    });

   // bind geometryGraph
   _environment.geometryGraph = TreeView.getTreeView('#objectListLabel','#objectList', _environment.world);
   // selectObject
   Wings3D.bindAction([], 0, Wings3D.action.toggleObjectSelect.name, (ev) => {
      if (isMultiMode()) {
         toggleFaceMode(); // todo: see if we can capture the toggling cmd.
      }
      const toggle = new ToggleCheckbox(ev.target);
      const cmd = new GenericEditCommand(currentMode(), currentMode().selectObject, [_environment.currentObjects, ev.target], 
                                                        currentMode().undoSelectObject, [ev.target]);
      cmd.doIt();
      undoQueueCombo([toggle, cmd]);
    });
   // hide/show Object
   Wings3D.bindAction([], 0, Wings3D.action.toggleObjectVisibility.name, (ev) => {
      const toggle = new ToggleCheckbox(ev.target);
      const cmd = new GenericEditCommand(currentMode(), currentMode().toggleObjectVisibility, [_environment.currentObjects, ev.target], 
                                                        currentMode().undoObjectVisibility);
      cmd.doIt();
      undoQueueCombo([toggle, cmd]);
    });
   // lock/unlock Object
   Wings3D.bindAction([], 0, Wings3D.action.toggleObjectLock.name, (ev) => {
      const toggle = new ToggleCheckbox(ev.target);
      const cmd = new GenericEditCommand(currentMode(), currentMode().toggleObjectLock, [_environment.currentObjects, ev.target], 
                                                        currentMode().undoToggleObjectLock);
      cmd.doIt();
      undoQueueCombo([toggle, cmd]);
    });
   // toggle wire only mode.
   Wings3D.bindAction([], 0, Wings3D.action.toggleWireMode.name, (ev)=>{
      const toggle = new ToggleCheckbox(ev.target);
      const cmd = new GenericEditCommand(currentMode(), currentMode().toggleObjectWireMode, [_environment.currentObjects, ev.target.checked], 
                                                        currentMode().undoToggleObjectWireMode);
      cmd.doIt();
      undoQueueCombo([toggle, cmd]);
    });
   // objectDelete, gui
   UI.bindMenuItem(Wings3D.action.objectDelete.name, (_ev)=>{
      const command = new DeleteBodyCommand(_environment.currentObjects);
      undoQueue( command );
      command.doIt(); // delete current selected.
    });
   // objectDuplicate, gui
   UI.bindMenuItem(Wings3D.action.objectDuplicate.name, (_ev)=>{
      const command = new DuplicateBodyCommand(_environment.currentObjects);
      undoQueue( command );
      command.doIt(); // delete current selected.
    });
   // createGroup. replacement for folder.
   UI.bindMenuItem(Wings3D.action.createGroup.name, (_ev)=>{
      // createGroup
      const group = new PreviewGroup;
      group.name = "new_folder";
      let parent = _environment.currentParent;
      if (!parent) {
         parent = _environment.world;
      }
      parent.insert( group ); // later: change to addToWorld()
      _environment.geometryGraph.addGroup(parent.guiStatus.ul, group);
     });
   // CreateGroup-World
   UI.bindMenuItem(Wings3D.action.createGroupWorld.name, (_ev)=>{
      // createGroup
      const group = new PreviewGroup;
      group.name = "new_folder";
      let parent = _environment.world;
      parent.insert( group ); // later: change to addToWorld()
      _environment.geometryGraph.addGroup(parent.guiStatus.ul, group);
    });

   // Image List.
   _environment.imageList = TreeView.getImageList('#imageListLabel','#imageList');
   UI.bindMenuItem(Wings3D.action.importImageFileGUI.name, function(ev) {
      UI.openFile(function(file) { // open file Dialog, and retrive data
            _environment.imageList.loadImage(file);
         });      
    });
   UI.bindMenuItem(Wings3D.action.showImage.name, function(_ev){
      _environment.imageList.showImage(_environment.currentObjects);
    });
   UI.bindMenuItem(Wings3D.action.deleteImage.name, function(_ev){
      _environment.imageList.deleteImage(_environment.currentObjects);
    });

   // material List.
   _environment.materialList = TreeView.getMaterialList('#materialListLabel', '#materialList');
   UI.bindMenuItem(Wings3D.action.createMaterial.name, function(ev){
      _environment.materialList.createMaterial(ev);
    });
   UI.bindMenuItem(Wings3D.action.editMaterial.name, function(ev) {
      _environment.materialList.editMaterial(ev, _environment.currentObjects);
    });
   UI.bindMenuItem(Wings3D.action.deleteMaterial.name, function(_ev){
      // check if any alive polygon is using the tobe delete Material
      if (_environment.currentObjects[0].usageCount === 0) {
         _environment.materialList.deleteMaterial(_environment.currentObjects);
      } else {
         alert("Materials is in use");
      }
    });   
   UI.bindMenuItem(Wings3D.action.renameMaterial.name, function(ev) {
      _environment.materialList.renameMaterial(ev, _environment.currentObjects);
    });
   UI.bindMenuItem(Wings3D.action.duplicateMaterial.name, function(_ev) {
      _environment.materialList.duplicateMaterial(_environment.currentObjects);
    });
   UI.bindMenuItem(Wings3D.action.assignMaterial.name, function(_ev) {
      if (mode.current === mode.face) {
         const cmd = new GenericEditCommand(currentMode(), currentMode().assignMaterial, [_environment.currentObjects[0]], 
                                                           currentMode().undoAssignMaterial);
         undoQueue( cmd );                                                 
         cmd.doIt();
      } else { // help
         help('Cannot Assign Material without selecting Face');
      }  
    });
   UI.bindMenuItem(Wings3D.action.selectMaterial.name, function(ev){
      const cmd = currentMode().selectMaterialCmd([_environment.currentObjects[0]]);
      cmd.doIt();    // needs to run first                                                
      undoQueue( cmd );                                                 
    });
   // let lightList


   // bind .dropdown, click event.
   let buttons = document.querySelectorAll("li.dropdown > a");
   for (let button of buttons) {
      const id = button.getAttribute('data-menuid');
      if (id) {
         let ul = button.nextElementSibling;  // popupMenu
         if (ul && ul.classList.contains("popup") && ul.classList.contains("menu")) {
            UI.bindMenuItem(id, function(ev) {
               UI.queuePopupMenu(ul);  // show popupMenu
             });
         }
      }
   }
   // bind li.dropside > a.
   buttons = document.querySelectorAll("li.dropside > a");
   for (let button of buttons) {
      const id = button.getAttribute('data-menuid');
      if (id) {
         let ul = button.nextElementSibling;  // popupMenu
         if (ul && ul.classList.contains("popup") && ul.classList.contains("menu")) {
            UI.bindMenuItem(id, function(ev) {
               UI.toggleSubmenu(ul);  // slide in popup menu, replace the original one
               ev.stopPropagation();
             });
         }
      }
   }

   // capture keyevent.
   document.addEventListener('keydown', function(event) {
      //event.preventDefault();
      //event.stopPropagation();
      //      Don't fire in text-accepting inputs that we didn't directly bind to
      Hotkey.runHotkeyAction(currentMode(), event);
    });

   // capture click mouse event.
   gl.canvas.addEventListener("mouseenter", canvasHandleMouseEnter, false);
   gl.canvas.addEventListener("mousedown", canvasHandleMouseDown, false); 
   gl.canvas.addEventListener("mouseup", canvasHandleMouseUp, false);
   gl.canvas.addEventListener("mouseleave", canvasHandleMouseLeave, false);
   gl.canvas.addEventListener("mousemove", canvasHandleMouseMove, false);
   gl.canvas.addEventListener("wheel", canvasHandleWheel, false);
   // bind context-menu
   let createObjectContextMenu = {menu: document.querySelector('#create-context-menu')};
   gl.canvas.addEventListener("contextmenu", function(e) {
      if(!canvasHandleContextMenu(e)) {
         e.preventDefault();
         let contextMenu = currentMode().getContextMenu();
         if (!contextMenu || !contextMenu.menu) {
            contextMenu = createObjectContextMenu;
         }
         UI.positionDom(contextMenu.menu, UI.getPosition(e));
         UI.showContextMenu(contextMenu.menu);
      }
   }, false);   
   //console.log("Workspace init successful");

   // import/export
   ImportExporter.addLoadStore( new WavefrontObjImportExporter() );
   let X3d = new X3dImportExporter();
   ImportExporter.setDefault(X3d);
   // clearNew
   async function clearNew(evt) {
      if (undo.isModified &&  (_environment.world.numberOfCage() > 0)) {
         const [_form, answer] = await UI.execDialog('#askSaveDialog', null); // no, save, cancel
         if (answer.value === "cancel") { // does nothing
            return false; 
         } else if (answer.value === "ok") {  // call save.
            await OpenSave.save(evt, ()=>{return X3d.export(getWorld())}, X3d.extension(), 1);  // ask for save if new, and save to old if already does.
         }
      }
      // deselect all, delete all
      OpenSave.reset();
      mode.current.resetSelection();
      _environment.world.empty();
      resetUndo();
      Renderer.needToRedraw();
      return true;
   }
   // plug into import/export menu
   async function open(evt, loader, flag=0) {
      await clearNew(evt);
      OpenSave.open(evt, (file)=>{loader.import(file);}, flag);
   }
   function save(evt, saver, flag=0) {
      if (_environment.world.numberOfCage() > 0) {
         OpenSave.save(evt, ()=>{return saver.export(getWorld())}, saver.extension(), flag);
      }
   }
   for (let loadStore of ImportExporter.LOADSTORE) {
      if (loadStore.importMenuText) {
         const importMenuText = loadStore.importMenuText;
         // first get import Submenu.
         UI.addMenuItem('fileImport', 'import' + importMenuText.name, `${importMenuText.name} (.${importMenuText.ext})...`, function(evt) {
               open(evt, loadStore, 1);
            });
      }
      if (loadStore.exportMenuText) {
         const exportMenuText = loadStore.exportMenuText;
         UI.addMenuItem('fileExport', 'export' + exportMenuText.name, `${exportMenuText.name} (.${exportMenuText.ext})...`, function(evt) {
            save(evt, loadStore, 2);
         });
      }
   }
   // registering save/saveAs/ handling.
   UI.bindMenuItem(Wings3D.action.save.name, function(evt) {
      save(evt, X3d);
    });
   UI.bindMenuItem(Wings3D.action.saveAs.name, function(evt) {
      save(evt, X3d, 1);
    });
   // Open handling, remember to save first. then new.
   UI.bindMenuItem(Wings3D.action.open.name, function(evt) {
      open(evt, X3d);
    });
   // "New", clear away old objects, but ask to save it first.
   UI.bindMenuItem(Wings3D.action.clearNew.name, function(evt) {
      // clear 
      clearNew(evt);
    });

   // toggle debugging 
   window.addEventListener('keyup', function(evt) {
      if (evt.altKey && evt.ctrlKey && evt.keyCode == 74) { // ctrl + alt + j
         toggleDebug();
      }
    });

   // handle redrawingLoop
   function updateFrame(timestamp) {
      render(gl);
      requestAnimationFrame(updateFrame);
   };
   requestAnimationFrame(updateFrame);

   // show start help
   UI.runDialog('#start-help', "center");
};


export {
   // data
   prop,
   theme,
   //world,   // we want iteration. can we share it?
   // function
   toggleVertexMode,
   toggleFaceMode,
   toggleEdgeMode,
   toggleBodyMode,
   toggleMultiMode,
   restoreVertexMode,
   restoreFaceMode,
   restoreEdgeMode,
   restoreBodyMode,
   restoreMultiMode,
   currentMode,
   // world state
   putIntoWorld,
   moveCage,
   addToWorld,
   removeFromWorld,
   getWorld,
   updateWorld,
   makeCombineIntoWorld,
   setObject,
   addMaterial,
   newCage,
   // mouse handler
   //rayPick,
   attachHandlerMouseMove,
   attachHandlerMouseSelect,
   // undo/redo
   doCommand,
   redoEdit,
   undoEdit,
   undoQueue,
   undoQueueCombo,
   // rendering
   loadMatrices,
   projection,
   modelView,
   drawWorld,
   render
}; 

// register for initialization
Wings3D.onReady(init);