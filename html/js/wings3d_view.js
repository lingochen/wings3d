/*
//     This module implements most of the commands in the View menu. 
//
// Original Erlang Version: Bjorn Gustavsson
*/

import * as UI from './wings3d_ui.js';
import * as Render from './wings3d_render.js';
import * as Camera from './wings3d_camera.js';
import {i18n} from './wings3d_i18n.js';
import {gl} from './wings3d_gl.js';
import {WavefrontObjImportExporter } from './plugins/wavefront_obj.js';
import {X3dImportExporter} from './plugins/x3d.js';
import * as Wings3D from './wings3d.js';
import {EditCommandSimple, EditCommandCombo} from './wings3d_undo.js';
import {FaceMadsor} from './wings3d_facemads.js';
import {EdgeMadsor} from './wings3d_edgemads.js';
import {VertexMadsor} from './wings3d_vertexmads.js';
import {BodyMadsor} from './wings3d_bodymads.js';
import {MultiMadsor} from './wings3d_multimads.js';
import {PreviewCage, PreviewGroup} from './wings3d_model.js';
import {DraftBench} from './wings3d_draftbench.js';
import {Ray} from './wings3d_geomutil.js';
import * as Hotkey from './wings3d_hotkey.js';
import * as Util from './wings3d_util.js';
import * as TreeView from './wings3d_uitree.js';
import { GenericEditCommand, ToggleCheckbox } from './wings3d_mads.js';
import * as OpenSave from './wings3d_opensave.js'
import { ImportExporter } from './wings3d_importexport.js';
import { STLImportExporter } from './plugins/stl.js';
import { GLTFImportExporter } from './plugins/gltf.js';
import { Texture } from './wings3d_material.js';
const {vec2, vec3} = glMatrix;


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
    Render.needToRedraw();
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
   const cmd = _toggleVertexMode();
   if (cmd) {
      undoQueue(cmd);
   }
}
function _toggleVertexMode() {
   let cmd = null;
   if (mode.current !== mode.vertex) { // change current mode to 
      cmd = mode.current.toggleFunc(mode.vertex);
      mode.current = mode.vertex;
      toggleMode('Vertex');
      Render.needToRedraw();
   }
   return cmd;
};

function toggleFaceMode() {
   const cmd = _toggleFaceMode();
   if (cmd) {
      undoQueue(cmd);
   }
}
function _toggleFaceMode() {
   let cmd = null;
   if (mode.current !== mode.face) {
      cmd = mode.current.toggleFunc(mode.face);
      mode.current = mode.face;
      toggleMode('Face');
      Render.needToRedraw();
   }
   return cmd;
};

function toggleEdgeMode() {
   const cmd = _toggleEdgeMode();
   if (cmd) {
      undoQueue(cmd);
   }
}
function _toggleEdgeMode() {
   let cmd = null;
   if (mode.current !== mode.edge) {
      cmd = mode.current.toggleFunc(mode.edge);
      mode.current = mode.edge;
      toggleMode('Edge');
      Render.needToRedraw();
   }
   return cmd;
};

function toggleBodyMode() {
   const cmd = _toggleBodyMode();
   if (cmd) {
      undoQueue(cmd);
   }
}
function _toggleBodyMode() {
   let cmd = null;
   if (mode.current !== mode.body) {
      cmd = mode.current.toggleFunc(mode.body);
      mode.current = mode.body;
      toggleMode('Body');
      Render.needToRedraw();
   }
   return cmd;
};

function toggleMultiMode() {
   const cmd = _toggleMultiMode();
   if (cmd) {
      undoQueue(cmd);
   }
}
function _toggleMultiMode() {
   let cmd = null;
   if (mode.current !== mode.multi) {
      cmd = mode.current.toggleFunc(mode.multi);
      mode.current = mode.multi;
      toggleMode('Multi');
      Render.needToRedraw();
   }
   return cmd;
};

function restoreVertexMode(snapshots) {
   if (mode.current !== mode.vertex) {
      mode.current.restoreMode(mode.vertex, snapshots);
      mode.current = mode.vertex;
      toggleMode('Vertex');
      Render.needToRedraw();
   } else {
      // bad state. should always be in other mode. 
   }
};

function restoreFaceMode(snapshots) {
   if (mode.current !== mode.face) {
      mode.current.restoreMode(mode.face, snapshots);
      mode.current = mode.face;
      toggleMode('Face');
      Render.needToRedraw();
   } else {
      // bad state. should always be in other mode. 
   }
};

function restoreEdgeMode(snapshots) {
   if (mode.current !== mode.edge) {
      mode.current.restoreMode(mode.edge, snapshots);
      mode.current = mode.edge;
      toggleMode('Edge');
      Render.needToRedraw();
   } else {
      // bad state. should always be in other mode. 
   }
};

function restoreBodyMode(snapshots) {
   if (mode.current !== mode.body) {
      mode.current.restoreMode(mode.body, snapshots);
      mode.current = mode.body;
      toggleMode('Body');
      Render.needToRedraw();
   } else {
      // bad state. should always be in other mode. 
   }
};

function restoreMultiMode(snapshots) {
   if (mode.current !== mode.multi) {
      mode.current.restoreMode(mode.multi, snapshots);
      mode.current = mode.multi;
      toggleMode('Multi');
      Render.needToRedraw();
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
};
function createTexture(name, sampler) {
   const ret = Texture.create(name, sampler);
   _environment.imageList.loadTexture(ret);
   return ret;
}
function createGroup(name) {
   const ret = new PreviewGroup();
   ret.name = name;
   return ret;
};
function createCage(name) {
   const model = new PreviewCage(_environment.draftBench);
   model.name = name;
   return model;
};
function createIntoWorld(process) {
   const model = new PreviewCage(_environment.draftBench);
   process(model);
   addToWorld(model);
   updateWorld();
   return model;
};
function putIntoWorld() {
   let model = new PreviewCage(_environment.draftBench);
   return addToWorld(model);
};
function moveCage(newParent, model) {  // drag & drop
   model.removeFromParent();
   newParent.insert(model);
   _environment.geometryGraph.updateCount(_environment.world);   // update Count Status
};

function addToWorld(model, parent = _environment.world) { // default parent is world
   parent.insert( model );
   _environment.geometryGraph.addNode(model, parent);
   for (let cage of model.getCage()) {
      cage.display(true);
   }
   Render.needToRedraw();
   _environment.geometryGraph.updateCount(_environment.world);   // update Count Status
   _environment.draftBench.updateAffected();
   return model;
}

function removeFromWorld(preview) {
   const deleted = preview.removeFromParent();
   if (deleted) {
      for (let cage of preview.getCage()) {
         cage.display(false);
      }
      Render.needToRedraw();
      // remove from geometryGraph
      _environment.geometryGraph.removeNode(preview);
      _environment.geometryGraph.updateCount(_environment.world);   // update Count Status
   }
   return deleted;
};
function getWorld() {
   return _environment.world.getCage();
}
function updateWorld() {
   for (let cage of _environment.world.getCage()) {
      cage.updateAffected();
   }
   Render.needToRedraw();
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
   Render.needToRedraw();
   undo.isModified = true;
   debugPush();
};

function redoEdit() {
   if ( (undo.queue.length-1) > undo.current) {
      undo.queue[++undo.current].doIt(mode.current);
      Render.needToRedraw();
      undo.isModified = true;
      debugPush();
   }
};

function undoEdit() {
   if (undo.current >= 0) {
      const cmd = undo.queue[undo.current--];
      cmd.undo(mode.current);
      Render.needToRedraw();
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
   while ( undo.queue.length ) {   // clear undo queue
      const cmd = undo.queue.pop();
      cmd.free();
   }
   undo.isModified = false;
   undo.current = -1;
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


const _mousePointer = (function(){
   let _nestCount = 0;

   return {
      hide: ()=> {
         if (_nestCount === 0) {
            gl.canvas.requestPointerLock();
         }
         ++_nestCount;
      },

      show: () => {
         --_nestCount;
         if (_nestCount === 0) {
            setTimeout(()=>{document.exitPointerLock()}, 1);  // workaround firefox's quirk. exitPointerLock() in right mouse up's handler will follow by contextmenu event.
         }
      },
   };
}());


function attachHandlerCamera(camera) {
   function gotoExit(mousePos) {
      Wings3D.log(Wings3D.action.cameraModeExit, m_windows.current.camera);
      modeHelp();
      handler.camera = null;
      _mousePointer.show();
   }

   // let camera handle the mouse event until it quit.0
   _mousePointer.hide();
   // tell tutor step, we are in camera mode
   Wings3D.log(Wings3D.action.cameraModeEnter, m_windows.current.camera);
   help(`L:${i18n('accept')}   M:${i18n('dragPan')}  R:${i18n('cancelRestoreView')}   ${i18n('moveMouseTumble')}`);

   handler.camera = {
      commit: ()=> {
         camera.commit();
         gotoExit();
      },

      rescind: ()=> {
         camera.rescind();
         gotoExit();
      },

      onMove: (e)=>{
         camera.handleMouseMove(e);
      },
   };
};


function attachHandlerMouseMove(mouseMove) {
   /*function onTab(evt) {
      if (evt.key == 'Tab') {   // yes, tab.
         evt.preventDefault();
         document.removeEventListener('keyup', onTab);
         _mousePointer.show();
         UI.execDialog('#numericInput', function(form) {  // setup input.
            const labels = form.querySelectorAll('label');
            const settings = mouseMove.getInputSetting();
            for (let i = 0; i < settings.length; ++i) {
               labels[i].classList.remove('hide');
               const input = labels[i].querySelector('input');
               input.value = settings[i].value;
               input.addEventListener('change', function(evt) {
                  handler.mousemove.onInput(evt, i);
               });
               const span = labels[i].querySelector('span');
               span.textContent = settings[i].name;
            }
            // setup default.
         }).then(([_form, button])=>{ // check ok, or not
            if (button.value == 'ok') {
               handler.mousemove.commit();
            } else {
               handler.mousemove.rescind();
            }
         });
      } 
   }*/
   function gotoExit() {
      _jogDial.hide();
      //document.removeEventListener('keyup', onTab);
      _mousePointer.show();
      handler.mousemove = null;
      Render.needToRedraw();
   };

   // onEntry
   _mousePointer.hide();
   // request handling of tab.
   //document.addEventListener('keyup', onTab);
   _jogDial.show((evt, index)=>{   // callBack 
      handler.mousemove.onInput(evt, index);
    }, mouseMove.getInputSetting());
   
   handler.mousemove = {
      commit: ()=> {
         mouseMove.commit();
         undoQueue(mouseMove);   // put on queue
         gotoExit();
      },

      rescind: ()=> {
         mouseMove.undo();//mouseMove.rescind();   // temp fix: 2020/12/22
         gotoExit();
      },

      onMove: (ev)=>{
         mouseMove.handleMouseMove(ev, m_windows.current.camera);
         _jogDial.update(mouseMove.getInputSetting());
         Render.needToRedraw();
      },

      onInput: (evt, index)=>{
         mouseMove.handleInput(evt, m_windows.current.camera, index);
         Render.needToRedraw();
      }
   };
};


function attachHandlerMouseSelect(mouseSelectHandler) {
   handler.mouseSelect = mouseSelectHandler;
};

function createElementSVG(element) {
   return document.createElementNS("http://www.w3.org/2000/svg", element);
}
const TweakMode = (function(){
/*   let selection = {pos: [0,0], area: null};       // dome area...
         // start tweaking, svgUI shown (dome, spike ...)
         const dome = createElementSVG('circle');
         selection.pos = mousePos;
         dome.setAttributeNS(null, 'cx', mousePos.x);
         dome.setAttributeNS(null, 'cy', mousePos.y);
         dome.setAttributeNS(null, 'r', 50);
         dome.setAttributeNS(null, 'fill', 'blue');
         dome.rect.setAttributeNS(null, 'fill-opacity', 0.20);
         Render.svgUI.appendChild(dome);
         selection.area = dome; */
}());
let tweakMode = true;
function toggleTweak() {
   tweakMode = !tweakMode;
   return tweakMode;
}
function modeHelp() {
   if (tweakMode) {
      help(`${i18n('clickSelect')}   ${i18n('paintSelect')}  M:${i18n('startCamera')}   R:${i18n('showMenu')}   [Alt]+R:${i18n('tweakMenu')}`);   
   } else {
      help(`L:${i18n('select')}   M:${i18n('startCamera')}  R:${i18n('showMenu')}   [Alt]+R:${i18n('tweakMenu')}`);
   }
}

//-- touch event handling -----------------------------------------------
// two-finger touch event.
let _2fingers = (()=>{
   let touchStart, touchCurrent;
   function touchRecord(evt) {
      const data =  {pos: [evt.clientX, evt.clientY], velocity: [0, 0], time: Date.now()};
      return data;
   }

   const startHandler = {
      is2Fingers: ()=>{return false;},

      onDown: (evt)=> {
         if (evt.touches.length === 2) {
            touchStart = [touchRecord(evt.touches[0]), touchRecord(evt.touches[1])];
            touchCurrent = touchStart;
            return actionHandler;
         }
         return startHandler;
      },

      onUp: (evt)=> {
         if (evt.touches.length === 2) {
            touchStart = [touchRecord(evt.touches[0]), touchRecord(evt.touches[1])];
            touchCurrent = touchStart;
            return actionHandler;
         }
         return startHandler;
      },

      onCancel: (_evt)=>{
         return startHandler;
      },

      onMove: (_evt)=> {
         return startHandler;
      },
   };

   function touchAction(onRotate, onScale, onTranslate) { 
      // check if we have enough movement
      let a0 = touchStart[0].pos, a1 = touchCurrent[0].pos, 
               b0 = touchStart[1].pos, b1 = touchCurrent[1].pos;
      const aV = [0, 0], bV= [0, 0];
      vec2.sub(aV, a1, a0);
      vec2.sub(bV, b1, b0);
      let aLen = vec2.len(aV), bLen = vec2.len(bV);

      if ((aLen > 9) || (bLen > 9)) {
         const ba1 = [0, 0], ba0 = [0, 0];
         vec2.sub(ba1, b1, a1);
         vec2.sub(ba0, b0, a0);
         let rotate = Math.atan2(ba1[1], ba1[0]) - Math.atan2(ba0[1], ba0[0]);
         const jitter = Math.PI/25;
         if ( (rotate > jitter) || (rotate < -jitter) ) {
            if (a0[0] > b0[0]) { // we want a to be on the left
               [aLen, bLen] = [bLen, aLen];
            }
            if (rotate > 0) {
               onRotate(-aLen, -bLen);
            } else {
               onRotate(aLen, bLen);
            }
            touchStart = touchCurrent;
         } else {
            let scale = Math.sqrt(vec2.sqrLen(ba1) / vec2.sqrLen(ba0));
            if (vec2.dot(aV, bV) <= 0) {  // scale should not move on same dir.
               if ( (scale > 1.04) || (scale < 0.96) ) {
                  onScale(scale);
                  touchStart = touchCurrent;
               }
            } else {
               // check if we are panning, (no rotate,scale), the length of (a1,a0) == (b1,b0), so we just check 1
               let scale = aLen / bLen;
               if ((scale < 1.22) && (scale > 0.8)) {  // 2 finger should move more less togther
                  vec2.lerp(aV, aV, bV, 0.5);   // average vec
                  onTranslate(aV);
                  touchStart = touchCurrent;
               } 
            }
         }
      }
   }

   const actionHandler = {
      is2Fingers: ()=>{return true;},

      onGesture: (rotate, scale, translate)=>{
         touchAction(rotate, scale, translate);
      },

      onDown: (evt)=> {
         if (evt.touches.length !== 2) {  // we only want 2 finger
            touchStart = touchCurrent = null;
            return startHandler;
         }
         return actionHandler;
      },

      onUp: (evt)=> {
         if (evt.touches.length !== 2) {
            touchStart = touchCurrent = null;
            return startHandler;
         }
         // this should not happened!
         return actionHandler;
      },

      onCancel: (evt)=> {

      },

      onMove: (evt)=> { // we have 2 finger, now check if 
         if (evt.touches.length === 2) {
            touchCurrent = [touchRecord(evt.touches[0]), touchRecord(evt.touches[1])];
         }
         return actionHandler;
      }
   };
   return startHandler;
})();
function canvasHandleTouchDown(evt) {
   _2fingers = _2fingers.onDown(evt);
}
function canvasHandleTouchUp(evt) {
   _2fingers = _2fingers.onUp(evt);
}
/** 
   firefox for window don't handle 2 pointers move well. (the 2nd touch fire event sporadically with large movement)
   so we revert using touchmove when we detect 2 pointers.
   todo: comeback to revisit(2021/04/26) the problem.
*/
function canvasHandleTouchMove(evt) {
   _2fingers = _2fingers.onMove(evt);
   if (evt.touches.length === 2) {
      // check, move, zoom, rotate
      _2fingers.onGesture((dx, dy)=> {
         m_windows.current.camera.rotate(dx, dy);
      },
      (scale)=>{
         // now zoom action
         if (scale >= 1.0) {  // negative direction
            m_windows.current.camera.zoomStep( scale * -50 );
         } else {
            m_windows.current.camera.zoomStep( 1/scale * 50);
         }
      },
      (translate)=> {
         m_windows.current.camera.pan(translate[0], -translate[1]);
      }
   );
   }
}
const _jogDial = (()=> {
   function simulatePointer(name, button) {  //button: 0 = left, 1 = middle, 2 = right
      return new PointerEvent(name, {
         view: window,
         bubbles: true,
         cancelable: true,
         isPrimary: true,
         pointerType: "mouse",
         /* whatever properties you want to give it */
         detail: 1,
         screenX: 0, //The coordinates within the entire page
         screenY: 0,
         clientX: 0, //The coordinates within the viewport
         clientY: 0,
         ctrlKey: false,
         altKey: false,
         shiftKey: false,
         metaKey: false, //I *think* 'meta' is 'Cmd/Apple' on Mac, and 'Windows key' on Win. Not sure, though!
         button: button, 
         relatedTarget: null,
     });
   }
   let container;
   function isOk() {
      if (!container) {
         container = document.getElementById('jogDial');
         if (!container) {
            return false;
         }
         container.setConfirmCallback((ok)=>{
            if (ok) {
               gl.canvas.dispatchEvent(simulatePointer('pointerdown', 0));
            } else {
               gl.canvas.dispatchEvent(simulatePointer('pointerup', 2));
            }
          });
      }
      return true;
   }

   return {
      show: (onChange, settings)=> {
         if (isOk()) {
            container.setChangeCallback(onChange);
            container.reset(settings);
            container.classList.remove('hide');
         }
      },
      hide: ()=> {
         if (isOk()) {
            container.classList.add('hide');
         }
      },
      
      update: (settings)=>{
         if (isOk()) {
            container.updateStep(settings);
         }
      },
   };
})();
//-- end of touch event handling ----------------------------------------
//
// mouse handling ---------------------------------------------------------------------
//
let lastPick = null;
let _pointer = (function() {
   let primary = {detail: 0, lastDown: {time: 0, pos: [0,0]} };
   let states = new Map;

   return {
      downUpdate: (evt)=> {
         //_2fingers = _2fingers.onDown(evt);
         if (evt.isPrimary) { // only interested in primary
            // check lastTime of the up Event
            const currentTime = Date.now();
            const pos = [evt.clientX, evt.clientY];
            if ((currentTime - primary.lastDown.time < 300) &&  // inside 300
                (vec2.distance(pos, primary.lastDown.pos) < 10)) { // inside errorBound
               primary.detail += 1;
            } else { // reset click count
               primary.detail = 1;
            }
            primary.lastDown.time = currentTime;
            primary.lastDown.pos = pos;
         }
      },

      upUpdate: (evt) => { // check primary
         //_2fingers = _2fingers.onUp(evt);
         if (evt.isPrimary) {
            states.delete(evt.pointerId); // reset pos
         }
      },

      moveUpdate: (evt) => {  //
         //_2fingers = _2fingers.onMove(evt);
         const pos = [evt.clientX, evt.clientY];
         if (!states.has(evt.pointerId)) {
            states.set(evt.pointerId, {last: pos, current: pos});
         } else {
            const record = states.get(evt.pointerId);
            record.last = record.current;
            record.current = pos;
         }
      },

      isDoubleDown: ()=> {   // is primary in doubleDown mode.
         return (primary.detail === 2);
      },

      getMovement: (pointerId, move)=> {
         const pos = states.get(pointerId);
         if (pos) {
            move.movementX = pos.current[0] - pos.last[0];
            move.movementY = pos.current[1] - pos.last[1];
         }
      },
   };
}());
function getClientPosition(e) {
   const rect = e.target.getBoundingClientRect();
   return {x: e.clientX - rect.left,   //x position within the element.
           y: e.clientY - rect.top};   //y position within the element.
};
function rayPick(mousePos) {
   const [ptNear, ptFar] = m_windows.current.screenPointToWorld( mousePos );
   vec3.sub(ptFar, ptFar, ptNear);
   vec3.normalize(ptFar, ptFar);
   const ray = new Ray(ptNear, ptFar);

   // now let pick
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
      Render.needToRedraw();
   } else {
      if (lastPick !== null) {
         // deselect last selection
         setCurrent(null);
         Render.needToRedraw();
      }
   }
   // now the currentPick will be the next lastPick.
   lastPick = pick;
};

const noSelect = (function(){  // no select
   return { start: function() {},
            move: function(evtMove) {
               // check on the same panes?
               if (!m_windows.current.isInside(evtMove.mousePos)) {
                  for (let i = 0; i < m_windows.length; ++i) {
                     if (m_windows.viewports[i].isInside(evtMove.mousePos)) {
                        makeCurrent(m_windows.viewports[i]);
                        break;
                     }
                  }
               }
               rayPick(evtMove.mousePos);
            },
            finish: function(ev) {}
         };
}());

const dragSelect = (function(){
   let dragMode = null;
   return {
      start: function(_mousePos) {
         // first check if we needs to autoToggle
         mode.current.toggleMulti(hilite);
         // now we can safely dragStart
         dragMode = mode.current.selectStart(lastPick.model, hilite);
         Render.needToRedraw();
      },

      move: function(evtMove) {
         rayPick(evtMove.mousePos);
         if ((lastPick !== null)) {
            dragMode.dragSelect(lastPick.model, hilite);
            Render.needToRedraw();
         }
      },

      finish: function(_ev) {  
         undoQueue(dragMode.finish());
         dragMode = null;
      }
   }
}());


const boxSelect = (function(){
   let selectionRectangle = {rect: null, start: [0, 0], end: [0, 0]};

   function setupRectangle(mousePos) {
      selectionRectangle.rect = createElementSVG('rect');
      selectionRectangle.rect.setAttributeNS(null, 'x', mousePos.x);
      selectionRectangle.rect.setAttributeNS(null, 'y', mousePos.y);
      selectionRectangle.rect.setAttributeNS(null, 'fill', 'blue');
      selectionRectangle.rect.setAttributeNS(null, 'fill-opacity', 0.50);
      Render.svgUI.appendChild(selectionRectangle.rect);
   }
   
   return {
      start: function(mousePos) {
         selectionRectangle.start = selectionRectangle.end = mousePos;
      },

      move: function(evtMove) {    
         if (isMultiMode()) { // force to faceMode if in multiMode.
            mode.current.toggleMulti({face: true}); 
         }
         let x = selectionRectangle.start.x;
         selectionRectangle.end = evtMove.mousePos;
         // reverse if negative width, height.
         let width = evtMove.mousePos.x - x;
         if (width < 0) {
            width = -width;
            x = evtMove.mousePos.x;
         }
         let y = selectionRectangle.start.y
         let height = evtMove.mousePos.y - y;
         if (height < 0) {
            height = -height;
            y = evtMove.mousePos.y;
         }
         if (!selectionRectangle.rect) {// setup svg rectangle.
            setupRectangle(selectionRectangle.start);
         }
         selectionRectangle.rect.setAttributeNS(null, 'x', x);
         selectionRectangle.rect.setAttributeNS(null, 'y', y);
         selectionRectangle.rect.setAttributeNS(null, 'width', width);
         selectionRectangle.rect.setAttributeNS(null, 'height', height);
         help(`[Ctrl] ${i18n('deselectMarquee')}    [Shift] ${i18n('whollyInsideMarquee')}`);
      },

      finish: function(ev) {
         if (selectionRectangle.rect) {
            let fn = 'frustumSelection';
            if (ev.shiftKey) {
               fn = 'frustumSelectionWhole';
            }
            const deselecting = ev.ctrlKey;
            if (selectionRectangle.start.x !== selectionRectangle.end.x &&
               selectionRectangle.start.y !== selectionRectangle.end.y) {   // won't do zero width, or zero height.
               // select everything inside the selection rectangle
               const undo = new EditCommandSimple(fn, m_windows.current.selectionBox(selectionRectangle.start, selectionRectangle.end), deselecting);
               if (undo.doIt(mode.current)) {
                  undoQueue( undo );
               }
            }
            // cleanup
            Render.svgUI.removeChild(selectionRectangle.rect);
            selectionRectangle.rect = null;
            modeHelp();
         }
      }
   };
}());



const tweakSelect = (function() {   // it just like mousemove, but with leftButton pressed down and move
   let tweak;
   let isMoved;
   let tweakMode = "tweakMove";

   return {
      start: function(_mousePos) {
         // hide cursor, magnet area
         _mousePointer.hide();
         // start tweaking
         isMoved = false;
         if (isMultiMode()) {
            for (let current of ['vertex', 'edge', 'face', 'body']) {
               if (hilite[current]) {
                  tweak = mode[current];//.tweakMove(lastPick.model, hilite);
                  break;
               } 
            }
         } else {
            tweak = mode.current;//.tweakMove(lastPick.model, hilite);
         }
         tweak = tweak[tweakMode](lastPick.model, hilite);
         Render.needToRedraw();
      },
 
      finish: function(_ev) {
         // finish tweak
         if (isMoved) {
            undoQueue(tweak.finish());
            isMoved = false;
         } else { // switch to selectMode since there is no movement.
            if (isMultiMode()) {
               mode.current.toggleMulti(hilite);
            }
            undoQueue(tweak.finishAsSelect(hilite)); // select/deselect
         }
         tweak = null;
         // show cursor, magnet area
         _mousePointer.show();
      },
   
      move: function(ev) {
         isMoved = true;
         tweak.handleMove(ev, m_windows.current.camera);
         Render.needToRedraw();
      },

      setMode(mode) {
         tweakMode = mode;
      }
   };
}());



let selectionMode = noSelect;
function selectStart(isDoubleDown, mousePos) {
   if (lastPick !== null) {
      if (tweakMode) {
         if (isDoubleDown) { // double click dragOnly.
            undoEdit();    // undo the previous tweak Select
            selectionMode = dragSelect;
         } else {
            selectionMode = tweakSelect; //dragSelect;
         }
      } else {
         selectionMode = dragSelect;
      }
   } else { // definitely boxSelect Mode
      selectionMode = boxSelect;
   }
   selectionMode.start(mousePos);
}

function selectFinish(ev) {
   selectionMode.finish(ev);
   selectionMode = noSelect;
}



function canvasHandleMouseEnter(ev) {
   modeHelp();
};

function canvasHandleMouseLeave(ev) {
   selectFinish(ev);       // we can't caputre mouseup when mouse leave, so force to finish the selection.
};

//const _lastTouch = {};
function canvasHandleMouseDown(ev) {
   ev.preventDefault();       // this prevent select text on infoLine because of canvas.
   // touch event
   _pointer.downUpdate(ev);
   if (ev.button === 0) {
      if (handler.camera !== null) {
         handler.camera.commit();
      } else if (handler.mousemove !== null) {
         if (ev.pointerType === "mouse") {   // skipped touch/pen down event,
            handler.mousemove.commit();      // yes commit. do the commit thing.
         }
      } else if (handler.mouseSelect !== null) {
         if (handler.mouseSelect.select(hilite)) {
            if (handler.mouseSelect.isMoveable()) {   // now do mousemove.
               attachHandlerMouseMove(handler.mouseSelect); //handler.mousemove = handler.mouseSelect;
            } else {
               undoQueue( handler.mouseSelect );
            }
            handler.mouseSelect = null;
         }
      } else {
         //e.stopImmediatePropagation();
         // ask view to select current hilite if any.
         selectStart(_pointer.isDoubleDown(ev.pointerId), getClientPosition(ev));
      }
   }
};

// event handling, switching state if needs to be
function canvasHandleMouseUp(ev) {
   // touch event
   _pointer.upUpdate(ev);
   if (ev.button == 0) {
      selectFinish(ev);
   } else if (ev.button == 1) { // check for middle button down
      if (handler.camera === null) {
         ev.stopImmediatePropagation();
         // let camera handle the mouse event until it quit.
         attachHandlerCamera( m_windows.current.camera.getMouseMoveHandler() );
      } 
   } else if (ev.button === 2) { // hack up 2019/07/26 to handle no contextmenu event in pointerLock, - needs refactor
      if (handler.camera) {      // firefox will generate contextmenu event if we put it on mouseDown.
         handler.camera.rescind();
      } else if (handler.mousemove) {
         handler.mousemove.rescind();
      } else {
         handler.mouseSelect = null;   // no needs to undo because we havent doIt() yet.
         Render.needToRedraw();
      }
   }
};

function canvasHandleMouseMove(e) {
   _pointer.moveUpdate(e);
   const move = Object.assign({}, e);
   move.mousePos = getClientPosition(e);
   move.movementX = e.movementX;
   move.movementY = e.movementY;
   if ((e.pointerType !== "mouse")) {  // touch buttons don't have movementXY, so we have to get it ourself
      _pointer.getMovement(e.pointerId, move);
   }
   if (!_2fingers.is2Fingers() && 
       ((move.movementX !== 0) || (move.movementY !== 0))) {
      if (handler.camera !== null) {
         handler.camera.onMove(move);
      } else if (handler.mousemove !== null) {
         handler.mousemove.onMove(move);
      } else {
         selectionMode.move(move);
      }
   }
};

// contextMenu, mouse right click.
function canvasHandleContextMenu(ev) {
   if (_2fingers.is2Fingers() || handler.mouseSelect || handler.mousemove) {  // add mousemove, 2021/06/29, prevent touch contexmenu
      // prevent propagation.
      ev.preventDefault();
      ev.stopImmediatePropagation();      // prevent document's contextmenu popup
      return true;                        // mouseUp will handle select event.
   }
   // let wings3d_contextmenu handle the event.
   return false;
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
   m_windows.current.camera.zoomStep(py);
};

//-- end of mouse handling-----------------------------------------------

//-- handle Camera pan by keyboard -------------------------------------

function canvasHandleKeyDown(evt) {
   if (evt.defaultPrevented) {
      return;
   }
   const camera = m_windows.current.camera;
   switch (evt.key) {
      case "Down": // IE/Edge specific value
      case "ArrowDown":
        camera.keyPanDownArrow();
        break;
      case "Up": // IE/Edge specific value
      case "ArrowUp":
        camera.keyPanUpArrow();
        break;
      case "Left": // IE/Edge specific value
      case "ArrowLeft":
        camera.keyPanLeftArrow();
        break;
      case "Right": // IE/Edge specific value
      case "ArrowRight":
        camera.keyPanRightArrow();
        break;
      default:
        return; // Quit when this doesn't handle the key event.
    }   

   evt.preventDefault();
};

//-- end of camera handling ------------------------------------------


//
// world rendering and utility functions
//
const m_windows = {current: null, viewports: [], mode: 0, length: 1, hilite: null};
function updateHiliteRect() {
   let x = m_windows.current.viewport[0], y = m_windows.current.viewport[1], width = m_windows.current.viewport[2], height = m_windows.current.viewport[3]; 
   y = gl.canvas.height - height - y;
   m_windows.hilite.setAttributeNS(null, 'x', x);
   m_windows.hilite.setAttributeNS(null, 'y', y);
   m_windows.hilite.setAttributeNS(null, 'width', width);
   m_windows.hilite.setAttributeNS(null, 'height', height);
}
function makeCurrent(newCurrent) {
   if (m_windows.current !== newCurrent) {
      m_windows.current.makeCurrent(false);
      m_windows.current = newCurrent;
      newCurrent.makeCurrent(true);
      updateHiliteRect();
   }
}
function changeGeometryWindows(mode, length) {
   if (mode !== m_windows.mode) {
      for (let i = length; i< m_windows.length; ++i) {
         m_windows.viewports[i].hide();
      }
      m_windows.mode = mode;
      m_windows.length = length;
      makeCurrent(m_windows.viewports[0]);
      resizeViewports();
   }
}
function resizeViewports() {
   const viewport = gl.getViewport();

   if (m_windows.mode === 0) {
      m_windows.viewports[0].setViewport(...viewport, viewport[3]);
   } else {
      const leftWidth = Math.round(viewport[2] / 2.0);
      const rightWidth = viewport[2] - leftWidth;
      const bottomHeight = Math.round(viewport[3] / 2.0);
      const topHeight = viewport[3] - bottomHeight;
      if (m_windows.mode === 1) {  // left, right
         // divide width,
         m_windows.viewports[0].setViewport(0, 0, leftWidth, viewport[3], viewport[3]);
         m_windows.viewports[1].setViewport(leftWidth, 0, rightWidth, viewport[3], viewport[3]);
      } else if (m_windows.mode === 2) {  // top, down
         // divide height
         m_windows.viewports[0].setViewport(0, 0, viewport[2], bottomHeight, viewport[3]);
         m_windows.viewports[1].setViewport(0, bottomHeight, viewport[2], topHeight, viewport[3]);
      } else { // quad
         // divide width, and height
         m_windows.viewports[0].setViewport(0, 0, leftWidth, bottomHeight, viewport[3]);
         m_windows.viewports[1].setViewport(leftWidth, 0, rightWidth, bottomHeight, viewport[3]);
         m_windows.viewports[2].setViewport(0, bottomHeight, leftWidth, topHeight, viewport[3]);
         m_windows.viewports[3].setViewport(leftWidth, bottomHeight, rightWidth, topHeight, viewport[3]);
      }
   }
   // resize curretBox too
   updateHiliteRect();
}

function drawWorld(gl) {
   //if (world.length > 0) {
      // update selectStatus
      const count = _environment.geometryGraph.updateStatus(_environment.world);
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
         Render.needToRedraw();
      }
   }
   if (gl.resizeToDisplaySize()) {  // update viewports if necessary
      resizeViewports();
   }
   // draw
   for (let i = 0; i < m_windows.length; ++i) {
      m_windows.viewports[i].render(gl, drawWorld);
   }
   Render.clearRedraw();
};

//-- end of world rendering and utility functions ---------------------------------------------------------------

//
// initialization
//
function init() {
   initMode();
   //Render.init(gl, drawWorld);  // init by itself
   _environment.draftBench = new DraftBench(theme.draftBench, theme.draftBenchPref, _environment.materialList);
   // init renderer
   for (let i = 0; i < 4; ++i) {
      m_windows.viewports.push( new Render.Renderport([0, 0, gl.canvas.width, gl.canvas.height], prop.orthogonalView, prop.showAxes, prop.showGroundplane) );
   }
   m_windows.current = m_windows.viewports[0];
   m_windows.hilite = createElementSVG('rect');
   m_windows.hilite.setAttributeNS(null, 'x', 0);
   m_windows.hilite.setAttributeNS(null, 'y', 0);
   m_windows.hilite.setAttributeNS(null, 'stroke', 'black');
   m_windows.hilite.setAttributeNS(null, 'fill', 'none');
   Render.svgUI.appendChild(m_windows.hilite);
   //
   UI.bindMenuItem(Wings3D.action.singlePane.name, (ev)=> {
      const radio = document.querySelector('input[data-menuid="singlePane"');
      if (radio !== ev.target) {
         radio.checked = true;
      }
      changeGeometryWindows(0, 1);
   });
   // bind multiple geometry menu
   UI.bindMenuItem(Wings3D.action.horizontalPane.name, (ev)=>{
      // toggle radio if not already,
      const radio = document.querySelector('input[data-menuid="horizontalPane"');
      if (radio !== ev.target) {
         radio.checked = true;
      }
      // delete/add/adjust Renderport.
      changeGeometryWindows(1, 2);
   });
   UI.bindMenuItem(Wings3D.action.verticalPane.name, (ev)=>{
      // toggle radio if not already,
      const radio = document.querySelector('input[data-menuid="verticalPane"');
      if (radio !== ev.target) {
         radio.checked = true;
      }
      // delete/add/adjust Renderport.
      changeGeometryWindows(2, 2);
   });

   UI.bindMenuItem(Wings3D.action.quadPane.name, (ev)=>{
      // toggle radio if not already,
      const radio = document.querySelector('input[data-menuid="quadPane"');
      if (radio !== ev.target) {
         radio.checked = true;
      }
      // delete/add/adjust Renderport.
      changeGeometryWindows(3, 4);
   });


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
            m_windows.current[button.propName](!data.checked);
            //Render.needToRedraw();
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
      const command = mode.body.deleteCommand(_environment.currentObjects);
      undoQueue( command );
      command.doIt(); // delete current selected.
    });
   // objectDuplicate, gui
   UI.bindMenuItem(Wings3D.action.objectDuplicate.name, (_ev)=>{
      const command = mode.body.duplicateCommand(_environment.currentObjects);
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
   
   // tweakMode
   UI.bindMenuItem(Wings3D.action.openTweak.name, (ev) => {
      const popup = document.querySelector('#tweak-context-menu');
      // move to ev.target's location
      const rect = ev.target.getBoundingClientRect();
      const mousePos = {x: ev.clientX,// + (rect.right-rect.left),   //x position within the element.
                        y: ev.clientY + (rect.bottom-rect.top)};   //y position within the element.
      popup.style.left = mousePos.x + 'px';
      popup.style.top = mousePos.y + 'px';
      UI.queuePopupMenu(popup);
    });
   UI.bindMenuItem(Wings3D.action.toggleTweak.name, function(ev) {
      const toggle = toggleTweak();
      // find all tweakMode 
      const checkboxes = document.querySelectorAll('input[data-menuid="toggleTweak"]');
      for (let check of checkboxes) {
         if (check !== ev.target) { // don't toggle the checkbox that trigger the event, it mess up the state
            check.checked = toggle;
         }
      }
    });
   UI.bindMenuItem(Wings3D.action.tweakMoveFree.name, function(ev) {
      tweakSelect.setMode("tweakMove");
      const radio = document.querySelector('input[data-menuid="tweakMoveFree"');
      radio.checked = true;
    });
   UI.bindMenuItem(Wings3D.action.tweakMoveNormal.name, function(ev) {
      tweakSelect.setMode("tweakMoveNormal");
      const radio = document.querySelector('input[data-menuid="tweakMoveNormal"');
      radio.checked = true;
    });
   UI.bindMenuItem(Wings3D.action.tweakScaleFree.name, function(ev) {
      tweakSelect.setMode("tweakScale");
      const radio = document.querySelector('input[data-menuid="tweakScaleFree"');
      radio.checked = true;
    });
   UI.bindMenuItem(Wings3D.action.tweakScaleUniform.name, function(ev) {
      tweakSelect.setMode("tweakScaleUniform");
      const radio = document.querySelector('input[data-menuid="tweakScaleUniform"');
      radio.checked = true;
    });

   // Image List.
   _environment.imageList = TreeView.getImageList('#imageListLabel','#imageList');
   UI.bindMenuItem(Wings3D.action.importImageFileGUI.name, function(ev) {
      OpenSave.open(['bmp', 'jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'png', 'webp']).then(([files, _loadAsync])=>{
         for (let file of files) {
            const texture = createTexture(file.name);
            file.image().then(img=>{
               texture.setImage(img);
               return img;
            });
         }
       }).catch(error=>{
         alert(error);
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
      //_environment.materialList.editMaterial(ev, _environment.currentObjects);
      _environment.currentObjects[0].editMaterial(ev);
    });
   UI.bindMenuItem(Wings3D.action.deleteMaterial.name, function(_ev){
      // check if any alive polygon is using the tobe delete Material
      if (!_environment.currentObjects[0].isInUse()) {
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
         const cmd = new GenericEditCommand(currentMode(), currentMode().assignMaterial, [_environment.currentObjects[0].material],  // wings3d-material._mat
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
   //Material's textures.
   UI.bindMenuItem(Wings3D.action.deleteTexture.name, function(_ev){
      const obj = _environment.currentObjects[0];
      obj.ui.removeTexture(obj.textureType);
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
   gl.canvas.addEventListener("pointerenter", canvasHandleMouseEnter, false);
   gl.canvas.addEventListener("pointerdown", canvasHandleMouseDown, false); 
   gl.canvas.addEventListener("pointerup", canvasHandleMouseUp, false);
   gl.canvas.addEventListener("pointerleave", canvasHandleMouseLeave, false);
   gl.canvas.addEventListener("pointermove", canvasHandleMouseMove, false);
   gl.canvas.addEventListener("touchstart", canvasHandleTouchDown);
   gl.canvas.addEventListener("touchend", canvasHandleTouchUp);
   gl.canvas.addEventListener("touchmove", canvasHandleTouchMove);
   gl.canvas.addEventListener("wheel", canvasHandleWheel, false);
   // capture keydown
   gl.canvas.addEventListener("pointerover", function(evt) { gl.canvas.focus(); });
   gl.canvas.addEventListener("pointerout", function(evt) {gl.canvas.blur(); });
   gl.canvas.addEventListener("keydown", canvasHandleKeyDown, false);
   // bind context-menu
   const createObjectContextMenu = {menu: document.querySelector('#create-context-menu')};
   const tweakContextMenu = {menu: document.querySelector('#tweak-context-menu')};
   gl.canvas.addEventListener("contextmenu", function(e) {
      if(!canvasHandleContextMenu(e)) {
         e.preventDefault();
         let contextMenu;
         if (e.altKey) {
            contextMenu = tweakContextMenu;
         } else {
            contextMenu = currentMode().getContextMenu();
            if (!contextMenu || !contextMenu.menu) {
               contextMenu = createObjectContextMenu;
            }
         }
         UI.showContextMenu(contextMenu.menu, e);
         UI.positionDom(contextMenu.menu, UI.getPosition(e));
      }
   }, false);   

   // import/export
   ImportExporter.addLoadStore( new WavefrontObjImportExporter() );
   ImportExporter.addLoadStore( new STLImportExporter() );
   ImportExporter.addLoadStore( new GLTFImportExporter() );
   let X3d = new X3dImportExporter();
   ImportExporter.setDefault(X3d);
   // clearNew
   async function clearNew(evt) {
      if (undo.isModified &&  (_environment.world.numberOfCage() > 0)) {
         const [_form, answer] = await UI.execDialog('#askSaveDialog', null); // no, save, cancel
         let isCancel = answer.value === "cancel";
         if (answer.value === "ok") {  // call save.
            await OpenSave.save(X3d.extension()).then((file, saver)=>{
               return X3d.export(file, saver, getWorld());
            }).catch(error=>{
               isCancel = true;
               alert(error);
            });
         }
         if (isCancel) {
            return false;
         }
      }
      // deselect all, delete all
      OpenSave.reset();
      resetUndo();
      mode.current.resetSelection();
      _environment.world.empty();
      Render.needToRedraw();
      return true;
   }
   // plug into import/export menu
   async function open(evt, loader) {
      let cleared = await clearNew();
      if (cleared) {
         OpenSave.open(loader.fileTypes()).then(([files, loadAsync])=>{
            return loader.import(files, loadAsync);
          }).then(working=> {
            OpenSave.setWorkingFiles(working);
          }).catch(error=>{
            alert(error);
          });
      }
   }
   async function merge(evt, loader) {
      OpenSave.open(loader.fileTypes()).then(([files, loadAsync])=>{
         return loader.import(files, loadAsync);
       }).catch(error=>{
         alert(error);
       });
   }
   async function save(evt, saver) {
      if (_environment.world.numberOfCage() > 0) {
         OpenSave.save(saver.extension()).then(([file, saveAsync])=>{
            return saver.export(getWorld(), file, saveAsync);
          }).catch(error=>{
            alert(error);
          });
         
      }
   }
   async function saveAs(evt, saver, isExport=false) {
      if (_environment.world.numberOfCage() > 0) {
         OpenSave.saveAs(saver.extension()).then(([file, saveAsync])=>{
            return saver.export(getWorld(), file, saveAsync);
          }).then(workingFiles=>{
             if (!isExport) { // saved the workingFiles
               OpenSave.setWorkingFiles(workingFiles);
             }
          }).catch(error=>{
            alert(error);
          });
      }
   }
   for (let loadStore of ImportExporter.LOADSTORE) {
      if (loadStore.importMenuText) {
         const importMenuText = loadStore.importMenuText;
         // first get import Submenu.
         UI.addMenuItem('fileImport', 'import' + importMenuText.name, `${importMenuText.name} (.${importMenuText.ext})...`, function(evt) {
               merge(evt, loadStore);
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
      saveAs(evt, X3d);
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
      if (evt.altKey && evt.ctrlKey && evt.key === 'j') { // ctrl + alt + j
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
   _toggleVertexMode,
   toggleFaceMode,
   _toggleFaceMode,
   toggleEdgeMode,
   _toggleEdgeMode,
   toggleBodyMode,
   _toggleBodyMode,
   toggleMultiMode,
   _toggleMultiMode,
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
   createTexture,
   createGroup,
   createCage,
   createIntoWorld,
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
   drawWorld,
   render
}; 

// register for initialization
Wings3D.onReady(init);