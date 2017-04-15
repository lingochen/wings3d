/*
//     This module implements most of the commands in the View menu. 
//
// Original Erlang Version: Bjorn Gustavsson
*/
"use strict";

function createView(gl) {
   var my = {};
   var _pvt = { world: [],
                handler: {camera: null, mousemove: null},
                faceMode: new FaceMadsor, 
                edgeMode: new EdgeMadsor,
                vertexMode: new VertexMadsor,
                currentMode: null,
                currentMouseHandler: null};
   _pvt.currentMode = _pvt.faceMode;
   _pvt.faceMode.setWorld(_pvt.world);
   _pvt.edgeMode.setWorld(_pvt.world);
   _pvt.vertexMode.setWorld(_pvt.world);
   _pvt.curretMouseHandler = _pvt;

   _pvt.toggleVertexMode = function() {
      // change current mode to 
      if (_pvt.currentMode !== _pvt.vertexMode) {
         _pvt.currentMode.toggleFunc(_pvt.vertexMode);
         _pvt.currentMode = _pvt.vertexMode;
         my.renderWorld.needToRedraw();
      }
   };

   _pvt.toggleFaceMode = function() {
      if (_pvt.currentMode !== _pvt.faceMode) {
         _pvt.currentMode.toggleFunc(_pvt.faceMode);
         _pvt.currentMode = _pvt.faceMode;
         my.renderWorld.needToRedraw();
      }
   };

   _pvt.toggleEdgeMode = function(restore=false) {
      if (_pvt.currentMode !== _pvt.edgeMode) {
         _pvt.currentMode.toggleFunc(_pvt.edgeMode);
         _pvt.currentMode = _pvt.edgeMode;
         my.renderWorld.needToRedraw();
      }
   };

   _pvt.restoreVertexMode = function(snapshots) {
      if (_pvt.currentMode !== _pvt.vertexMode) {
         _pvt.currentMode.restoreMode(_pvt.vertexMode, snapshots);
         _pvt.currentMode = _pvt.vertexMode;
         my.renderWorld.needToRedraw();
      } else {
         // bad state. should always be in other mode. 
      }
   };

   _pvt.restoreFaceMode = function(snapshots) {
      if (_pvt.currentMode !== _pvt.faceMode) {
         _pvt.currentMode.restoreMode(_pvt.faceMode, snapshots);
         _pvt.currentMode = _pvt.faceMode;
         my.renderWorld.needToRedraw();
      } else {
         // bad state. should always be in other mode. 
      }
   };

   _pvt.restoreEdgeMode = function(snapshots) {
      if (_pvt.currentMode !== _pvt.edgeMode) {
         _pvt.currentMode.restoreMode(_pvt.edgeMode, snapshots);
         _pvt.currentMode = _pvt.edgeMode;
         my.renderWorld.needToRedraw();
      } else {
         // bad state. should always be in other mode. 
      }
   };

   Wings3D.apiExport.toggleVertexMode = _pvt.toggleVertexMode;
   Wings3D.apiExport.toggleFaceMode = _pvt.toggleFaceMode;
   Wings3D.apiExport.toggleEdgeMode = _pvt.toggleEdgeMode;
   Wings3D.apiExport.restoreVertexMode = _pvt.restoreVertexMode;
   Wings3D.apiExport.restoreFaceMode = _pvt.restoreFaceMode;
   Wings3D.apiExport.restoreEdgeMode = _pvt.restoreEdgeMode;

   my.loadMatrices = function(includeLights) {
      var projection = my.projection(mat4.create()); // passed identity matrix.
      var tmm = my.modelView(includeLights);
      return { projection: projection, modelView: tmm.modelView, useSceneLights: tmm.useSceneLights };
   };

   //projection() ->
   //     OP0 = gl:getDoublev(?GL_PROJECTION_MATRIX),
   //     projection(e3d_transform:init(list_to_tuple(OP0))).
   my.projection = function(In) {
      var size = Wings3D.gl.getViewport();
      var aspect = (size[2]-size[0]) / (size[3]-size[1]);
      var view = Wings3D.cam.view;
      var ortho = view.orthogonalView;
      if (!ortho && view.alongAxis) {
         ortho = prop.force_ortho_along_axis;
      }
      var tp = mat4.create();
      if (ortho) {
         var sz = view.distance * Math.tan(view.fov * Math.PI  / 180 / 2);
         mat4.ortho(tp, -sz * aspect, sz * aspect, -sz, sz, view.zNear, view.zFar);      
      } else {
         mat4.perspective(tp, view.fov, aspect, view.zNear, view.zFar);
      }

      mat4.mul(Wings3D.gl.projection, In, tp);
      return Wings3D.gl.projection;
   };

   my.modelView = function(includeLights = false) {
      var view = Wings3D.cam.view;

      var useSceneLights = false;
      if (includeLights) {
         useSceneLights = my.prop.useSceneLights; // && Wings3D.light.anyEnabledLights();
         if (!useSceneLights) {
            //Wings3D.light.cameraLights();
         }
      }

      // fromTranslation, identity * vec3. modelView rest.
      mat4.fromTranslation(Wings3D.gl.modelView, vec3.fromValues(view.panX, view.panY, -view.distance));
      mat4.rotateX(Wings3D.gl.modelView, Wings3D.gl.modelView, view.elevation * Math.PI / 180);
      mat4.rotateY(Wings3D.gl.modelView, Wings3D.gl.modelView, view.azimuth * Math.PI / 180);
      mat4.translate(Wings3D.gl.modelView, Wings3D.gl.modelView, view.origin);

      if (useSceneLights) {
         //Wings3D.light.globalLights();
      }
      return {useScentLights: useSceneLights, modelView: Wings3D.gl.modelView};
   };

   my.init = function(gl) {
       my.renderWorld.init(gl, my.drawWorld);

      // capture click mouse event.
      Wings3D.gl.canvas.addEventListener("mousedown", _pvt.canvasHandleMouseDown, false); 
      Wings3D.gl.canvas.addEventListener("mouseup", _pvt.canvasHandleMouseUp, false);
      Wings3D.gl.canvas.addEventListener("mouseleave", _pvt.canvasHandleMouseLeave, false);
      Wings3D.gl.canvas.addEventListener("mousemove", _pvt.canvasHandleMouseMove, false);
      Wings3D.gl.canvas.addEventListener("wheel", _pvt.canvasHandleWheel, false);
      Wings3D.gl.canvas.addEventListener("contextmenu", _pvt.canvasHandleContextMenu, false);
   };

   my.drawWorld = function(gl) {
      if (_pvt.world.length > 0) {
         gl.polygonOffset(1.0, 1.0);          // Set the polygon offset
         gl.enable(gl.POLYGON_OFFSET_FILL);
         _pvt.currentMode.previewShader(gl);
         _pvt.world.forEach(function(model, _index, _array){
            gl.bindTransform();
            model.draw(gl);
         });
         gl.disableShader();
         gl.disable(gl.POLYGON_OFFSET_FILL);


         gl.enable(gl.BLEND);
         gl.blendFunc(gl.SRC_COLOR, gl.DST_COLOR);
         // draw Current Select Mode (vertex, edge, or face)
         _pvt.currentMode.draw(gl);
         gl.disable(gl.BLEND);
      }
   }

   my.render = function(gl) {
      my.renderWorld.render(gl, my.drawWorld);
   };

   my.putIntoWorld = function(mesh) {
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
      var model = new PreviewCage(mesh);
      //
      return my.addToWorld(model);
   };

   my.addToWorld = function(model) {
      _pvt.world.push( model );
      my.renderWorld.needToRedraw();
      return model;
   }

   my.removeFromWorld = function(previewCage) {
      var index = _pvt.world.indexOf(previewCage);
      if (index >= 0) {
         _pvt.world.splice(index, 1);
         my.renderWorld.needToRedraw();
      }
   };
   Wings3D.apiExport.putIntoWorld = my.putIntoWorld;
   Wings3D.apiExport.removeFromWorld = my.removeFromWorld;
   
   _pvt.lastPick = null;

   my.rayPick = function(ray) {
      var pick = null;
      for (var i =0; i < _pvt.world.length; ++i) {
         var newPick = _pvt.world[i].rayPick(ray);
         if (newPick !== null) {
            if ((pick === null) || (pick.t > newPick.t)) {
               pick = newPick;
            }
         }
      }
      if (pick !== null) {
         _pvt.currentMode.setPreview(pick.model);
         //if (_pvt.lastPick !== null && _pvt.lastPick.model !== pick.model) {
         //   _pvt.lastPick.model.setCurrentSelect(null);
         //}
         // now set current edge again.
         _pvt.lastPick = pick;
         var intersect = vec3.create();
         vec3.scaleAndAdd(intersect, ray.origin, ray.direction, pick.t);
         _pvt.currentMode.setCurrent(pick.edge, intersect, pick.center);
         my.renderWorld.needToRedraw();
      } else {
         if (_pvt.lastPick !== null) {
            // no current selection.
            _pvt.currentMode.setCurrent(null);
            my.renderWorld.needToRedraw();
         }
      }
      // now the currentPick will be the next lastPick.
      _pvt.lastPick = pick;
   };

   _pvt.dragMode = null;

   _pvt.selectStart = function() {
      if (_pvt.lastPick !== null) {
         _pvt.dragMode = _pvt.currentMode.selectStart(_pvt.lastPick.model);
         my.renderWorld.needToRedraw();
      }
   };

   _pvt.selectDrag = function() {
      if ((_pvt.dragMode !== null) ){// &&
          if ((_pvt.lastPick !== null)) {
         _pvt.dragMode.dragSelect(_pvt.lastPick.model);
         my.renderWorld.needToRedraw();
      } }
   }

   _pvt.selectFinish = function() {
      if (_pvt.dragMode !== null) {
         my.undoQueue(_pvt.dragMode.finish());
         _pvt.dragMode = null;
      }
   }

   _pvt.canvasHandleMouseDown = function(ev) {
      if (ev.button == 0) {
         if (_pvt.handler.camera !== null) {
            _pvt.handler.camera.commit(my);
            _pvt.handler.camera = null;
         } else if (_pvt.handler.mousemove !== null) {
            _pvt.handler.mousemove.commit(my);
            _pvt.handler.mousemove = null;
         } else {
            //e.stopImmediatePropagation();
            // ask view to select current hilite if any.
            _pvt.selectStart();
         }
      }
   };

   _pvt.canvasHandleMouseLeave = function(ev) {
      _pvt.selectFinish();       // we can't caputre mouseup when mouse leave, so force to finish the selection.
   };

   // event handling, switching state if needs to be
   _pvt.canvasHandleMouseUp = function(ev) {
      if (ev.button == 0) {
         _pvt.selectFinish();
      } else if (ev.button == 1) { // check for middle button down
         if (_pvt.handler.camera === null) {
            ev.stopImmediatePropagation();
            // let camera handle the mouse event until it quit.
            _pvt.handler.camera = Wings3D.cam.getMouseMoveHandler();
            // disable mouse cursor
            //document.body.style.cursor = 'none';
         } 
      }
   };

   _pvt.canvasHandleMouseMove = function(e) {
      if (_pvt.handler.camera !== null) {
         _pvt.handler.camera.handleMouseMove(e);
      } else if (_pvt.handler.mousemove !== null) {
         _pvt.handler.mousemove.handleMouseMove(e);
         my.renderWorld.needToRedraw();
      } else {
         // handle pick selection
         var viewport = Wings3D.gl.getViewport();
         var winx = e.pageX - e.currentTarget.offsetLeft;
         var winy = (viewport[3]+1) - (e.pageY - e.currentTarget.offsetTop);   // y is upside-down
         // yes, sometimes mouse coordinate is outside of the viewport. firefox is larger than width, height.
         if (winx < 0) { winx = 0; }
         if (winx > viewport[2]) { winx = viewport[2];}
         if (winy < 0) { winy = 0; }
         if (winy > viewport[3]) { winy = viewport[3];}

         var mat = my.loadMatrices(false);
         var ptNear = Wings3D.gl.unProject(winx, winy, 0.0, mat.modelView, mat.projection);
         var ptFar = Wings3D.gl.unProject(winx, winy, 1.0, mat.modelView, mat.projection);

         vec3.sub(ptFar, ptFar, ptNear);
         vec3.normalize(ptFar, ptFar);
         var ray = {origin: ptNear, direction: ptFar};
         //geometryStatus("mouse position: " + ptNear[0] + ", " + ptNear[1] + "," + ptNear[2] + ", <br />"+ ptFar[0] + ", " + ptFar[1] + ", " + ptFar[2]);
         my.rayPick(ray);
         // selectDrag if left button mousedown
         _pvt.selectDrag();
      }
   };

   // contextMenu, mouse right click.
   _pvt.canvasHandleContextMenu = function(ev) {
      if (_pvt.handler.camera !== null || _pvt.handler.mousemove !== null) {
         // prevent propagation.
         ev.preventDefault();
         ev.stopImmediatePropagation();      // prevent document's contextmenu popup
         if (_pvt.handler.camera !== null) {
            _pvt.handler.camera.cancel();
            _pvt.handler.camera = null;
         } else {
            _pvt.handler.mousemove.cancel();
            _pvt.handler.mousemove = null;
            my.renderWorld.needToRedraw();
         }
         return false;
      }
      // let wings3d_contextmenu handle the event.
   };

   // handling in reverse order. the newest one will handle the event. (should be at most 2 handler)
   my.attachHandlerMouseMove = function(handler) {
      // should we make sure _pvt.handler.mousemove is null?
      _pvt.handler.mousemove = handler;
   };
   
   _pvt.canvasHandleWheel = function(e) {
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
      Wings3D.cam.zoomStep(py);
   };

   
   var contextMenuClassName = "context-menu";
   var contextMenuItemClassName = ".context-menu__item";
   _pvt.contextMenu = {menu: document.querySelector("#context-menu")};
   _pvt.contextMenu.menuItems = _pvt.contextMenu.menu.querySelectorAll(".context-menu__item");

   my.getContextMenu = function(ev) {
      // 
      var contextMenu = _pvt.currentMode.getContextMenu();
      if (contextMenu && contextMenu.menu) {
         return contextMenu;
      } else {
         // return default
         return _pvt.contextMenu;
      }
   };

   _pvt.undo = {queue: [], current: -1};
   // undo queue
   my.undoQueue = function(editCommand) {
      if ( (_pvt.undo.queue.length-1) > _pvt.undo.current ) {
         // remove branch not taken
         _pvt.undo.queue.length = _pvt.undo.current+1;
      }
      // now push the new command back
      _pvt.undo.queue.push(editCommand);
      _pvt.undo.current++;
   }

   my.redoEdit = function() {
      if ( (_pvt.undo.queue.length-1) > _pvt.undo.current) {
         _pvt.undo.queue[++_pvt.undo.current].doIt();
         my.renderWorld.needToRedraw();
      }
   }

   my.undoEdit = function() {
      if (_pvt.undo.current >= 0) {
         _pvt.undo.queue[_pvt.undo.current--].undo();
         my.renderWorld.needToRedraw();
      }
   }
   Wings3D.apiExport.redoEdit = my.redoEdit;
   Wings3D.apiExport.undoEdit = my.undoEdit;
   Wings3D.apiExport.undoQueue = my.undoQueue;

   // init Prop
   my.prop = {
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
   my.nativeTheme = {
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
   my.theme = my.nativeTheme;
   console.log("Workspace init successful");
   my.renderWorld = createRenderWorld();
   return my;
};