/*
// Render all objects and helpers (such as axes) in the scene.
//     Used for the Geometry. Original Erlang Version: Bjorn Gustavsson
//
// expand it to handle multiple geometry panes. 2020/10/08
//
*/
import {gl} from './wings3d_gl.js';
import * as View from './wings3d_view.js';
import {Camera} from './wings3d_camera.js';
import {onReady, GROUND_GRID_SIZE} from './wings3d.js';
import * as ShaderProg from './wings3d_shaderprog.js';
import * as Util from './wings3d_util.js';
import {Plane, Frustum} from './wings3d_geomutil.js';
const {vec3, vec4, mat4} = glMatrix;



// my.shader = initShaders();
// wings_pref:set_default(multisample, true), <- why set default here? shouldn't bunch of defaults set together?
// initPolygonStipple(); no webgl support. shader replacement? ignore for now
let lineProg;        // to be replaced
let groundAxisProg;  // to be replaced
let svgUI;
let lineEnd = {x: null, y: null, z: null};
let camera = new Camera;

onReady(function() {
   redrawFlag = true;
   gl.enable(gl.DEPTH_TEST);
   gl.enable(gl.CULL_FACE);   // enable cull face (2018-05-30) back face culling is default
   // initialized glsl program, update data
   // program source ShaderProg
   // drawGrid, using LineProgram
   // compile and link program
   lineProg = gl.createShaderProgram(ShaderProg.uColorArray.vertexShader, ShaderProg.uColorArray.fragShader);

   // compile and link program.
   groundAxisProg = {handle: gl.compileGLSL(ShaderProg.colorArray.vertexShader, ShaderProg.colorArray.fragShader)};

   // get attribute handle.
   groundAxisProg.vertexPosition = gl.getAttribLocation(groundAxisProg.handle, "aVertexPosition");
   groundAxisProg.vertexColor = gl.getAttribLocation(groundAxisProg.handle, "aVertexColor");
   groundAxisProg.uPMatrix = gl.getUniformLocation(groundAxisProg.handle, "uPMatrix");
   groundAxisProg.uMVMatrix = gl.getUniformLocation(groundAxisProg.handle, "uMVMatrix");

   // compute grid and axis, and write to vbo.
   var mat = loadMatrices(true);
   var yon = computeGroundAndAxes(gl, mat.projection, mat.modelView);    
   initMiniAxis(gl, mat.modelView);

   // setup svgUI
   svgUI = document.getElementById('svgUI');
   lineEnd.x = document.createElementNS("http://www.w3.org/2000/svg", 'text');
   lineEnd.x.style.fontSize = "18px";
   lineEnd.x.style.fontFamily = 'Arial';
   lineEnd.x.textContent = 'x';
   svgUI.appendChild(lineEnd.x);
   lineEnd.y = document.createElementNS("http://www.w3.org/2000/svg", 'text');
   lineEnd.y.style.fontSize = "18px";
   lineEnd.y.style.fontFamily = 'Arial';
   lineEnd.y.textContent = 'y';
   svgUI.appendChild(lineEnd.y);
   lineEnd.z = document.createElementNS("http://www.w3.org/2000/svg", 'text');
   lineEnd.z.style.fontSize = "18px";
   lineEnd.z.style.fontFamily = 'Arial';
   lineEnd.z.textContent = 'z';
   svgUI.appendChild(lineEnd.z);
});


function screenPointToWorld(pt) {
   // handle pick selection
   var viewport = gl.getViewport();

   let winx = pt.x;
   let winy = viewport[3] - pt.y;   // y is upside-down
   // yes, sometimes mouse coordinate is outside of the viewport. firefox return values larger than width, height.
   if (winx < 0) { winx = 0; }
   if (winx > viewport[2]) { winx = viewport[2];}
   if (winy < 0) { winy = 0; }
   if (winy > viewport[3]) { winy = viewport[3];}
   
   const mat = loadMatrices(false);
   return [gl.unProject(winx, winy, 0.0, mat.modelView, mat.projection),
            gl.unProject(winx, winy, 1.0, mat.modelView, mat.projection)];
};

function selectionBox(start, end) {
   // sort first
   let left = start.x;
   let right = end.x;
   if (start.x > end.x) {
      left = end.x;
      right = start.x;
   }
   let top = start.y;           // y-axis flip
   let bottom = end.y;
   if (start.y > end.y) {
      top = end.y;
      bottom = start.y;
   }

   // now get the 8 unProject.
   const [leftBottomNear, leftBottomFar] = screenPointToWorld( {x: left, y: bottom} );
   const [leftTopNear, leftTopFar] = screenPointToWorld( {x: left, y: top} );
   const [rightTopNear, rightTopFar] = screenPointToWorld( {x: right, y: top} );
   const [rightBottomNear, rightBottomFar] = screenPointToWorld( {x: right, y: bottom} );

   // now compute frustum
   return new Frustum(Plane.fromPoints(leftTopNear, leftBottomNear, leftBottomFar),       // left
                     Plane.fromPoints(rightBottomNear, rightTopNear, rightTopFar),      // right
                     Plane.fromPoints(rightTopNear, leftTopNear, leftTopFar),           // top
                     Plane.fromPoints(leftBottomNear,rightBottomNear, rightBottomFar),   // bottom
                     Plane.fromPoints(rightBottomNear, leftBottomNear, leftTopNear),    // near
                     Plane.fromPoints(rightBottomFar, rightTopFar, leftTopFar)          // far
                     );
};


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
   const ortho = View.prop.orthogonalView;
   if (!ortho && camera.alongAxis) {
      ortho = View.prop.force_ortho_along_axis;
   }
   var tp = mat4.create();
   if (ortho) {
      const sz = camera.distance * Math.tan(camera.fov * Math.PI  / 180 / 2);
      mat4.ortho(tp, -sz * aspect, sz * aspect, -sz, sz, camera.zNear, camera.zFar);      
   } else {
      mat4.perspective(tp, camera.fov, aspect, camera.zNear, camera.zFar);
   }

   mat4.mul(gl.projection, In, tp);
   return gl.projection;
};

function modelView(includeLights = false) {
   let useSceneLights = false;
   if (includeLights) {
      useSceneLights = View.prop.useSceneLights; // && Wings3D.light.anyEnabledLights();
      if (!useSceneLights) {
         //Wings3D.light.cameraLights();
      }
   }

   // fromTranslation, identity * vec3. modelView rest.
   mat4.fromTranslation(gl.modelView, vec3.fromValues(camera.panX, camera.panY, -camera.distance));
   mat4.rotateX(gl.modelView, gl.modelView, camera.elevation * Math.PI / 180);
   mat4.rotateY(gl.modelView, gl.modelView, camera.azimuth * Math.PI / 180);
   mat4.translate(gl.modelView, gl.modelView, camera.origin);

   if (useSceneLights) {
      //Wings3D.light.globalLights();
   }
   return {useScentLights: useSceneLights, modelView: gl.modelView};
};


/**
 * return screen space windows position for Canvas2D to draw. == gluProject
 * @param {*} pt - model 3d pt in the world transform.
 */
function worldToScreenPoint(pt) {
   const point3D = [pt[0], pt[1], pt[2], 1.0];
   // to clipSpace
   Vec4.transformMat4(point3D, point3D, viewMatrix);
   Vec4.transformMat4(point3D, point3D, projectionMatrix);
   // to ndcSpacePos
   point3D[0] /= point3D[3];
   point3D[1] /= point3D[3];
   // return windowPos
   return [(point3D[0] *  0.5 + 0.5) * gl.canvas.width, 
           (point3D[1] * -0.5 + 0.5) * gl.canvas.height];
};


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

function renderASCII(xyz, color, origin, end, viewport) {
   if (clipLine(origin, end)) {
      // line inside view volume
      //console.log(end[0], end[1], end[2], end[3]);
      const x = Math.trunc((0.5*end[0]/end[3]+0.5)*(viewport[2]-20) + 10);
      const y = viewport[3] - Math.trunc((0.5*end[1]/end[3]+0.5)*(viewport[3]-16) + 7);
      lineEnd[xyz].setAttributeNS(null, 'x', x);
      lineEnd[xyz].setAttributeNS(null, 'y', y);
      lineEnd[xyz].setAttributeNS(null, 'fill', color);
   }
};

function renderAxisLetter(gl, zFar) {
   if (View.prop.showAxes){
      var viewPort = gl.getViewport();
      var start = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
      var origin = gl.transformVertex(start);

      //gl:matrixMode(?GL_PROJECTION),
      //gl:loadIdentity(),
      //{_,_,W,H} = ViewPort,
      //glu:ortho2D(0.0, W, H, 0.0, -1, 1);
      //mat4.ortho(textProg.bitmapTextVBO.projection, 0.0, viewPort[2], viewPort[3], 0.0, -1.0,  1.0);
      //gl:matrixMode(?GL_MODELVIEW),
      //gl:loadIdentity(),
      zFar = zFar + GROUND_GRID_SIZE;
      //gl:polygonMode(?GL_FRONT_AND_BACK, ?GL_FILL),
      
      var color = [Util.hexToRGB(View.theme.colorX), Util.hexToRGB(View.theme.colorY), Util.hexToRGB(View.theme.colorZ)];
      var endx = gl.transformVertex(vec4.fromValues(zFar, 0.0, 0.0, 1.0)), 
          endy = gl.transformVertex(vec4.fromValues(0.0, zFar, 0.0, 1.0)), 
          endz = gl.transformVertex(vec4.fromValues(0.0, 0.0, zFar, 1.0));
      renderASCII('x', View.theme.colorX, origin, endx, viewPort);
      renderASCII('y', View.theme.colorY, origin, endy, viewPort);
      renderASCII('z', View.theme.colorZ, origin, endz, viewPort);
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
   var clr = [Util.hexToRGB(View.theme.colorX), Util.hexToRGB(View.theme.colorY), Util.hexToRGB(View.theme.colorZ)];
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
   if (View.prop.showMiniAxis) {
      var ratio = gl.canvas.clientWidth / gl.canvas.clientHeight;
      // set current rotation.
      var modelView = groundAxisProg.miniAxisVBO.modelView;
      mat4.copy(modelView, inModelView);
      modelView[12] = 0.11-ratio;
      modelView[13] = -1.0+0.11;
      modelView[14] = 0.0;
      // set current projection
      mat4.ortho(groundAxisProg.miniAxisVBO.projection, -ratio, ratio, -1.0, 1.0, 0.00001,  10000000.0);
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
   let w = Math.min(gl.canvas.clientWidth, gl.canvas.clientHeight);
   if (size*16 > w) {
      gridSize *= (size*16) / w;
   }
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
   var width = gl.canvas.clientWidth;
   var height = gl.canvas.clientHeight;
   var w1 = Math.max(width, height);// /2.0;
   var coord = gl.unProject(w1, 0.0, 0.0, modelView, projection, [0, 0, width, height]);
   var ret = GROUND_GRID_SIZE * 
           Math.max(Math.round(Math.max(Math.max(Math.abs(coord[0]), Math.abs(coord[1])), Math.abs(coord[2]))), 10.0);
   // hacked an value that just cover the screen space.
   ret *= width/height * 0.7;
   return Math.round(ret);
}
function computeGroundAndAxes(projection, modelView) {
   var gridSize = calcGridSize(projection, modelView);
   //console.log("gridsize " + gridSize.toString());
   var data = computeGroundGrid(gridSize, GROUND_GRID_SIZE);
   // bindVBO.
   lineProg.groundGridVBO = {
      position: gl.createBufferHandle(new Float32Array(data)),
      length: data.length/3
   };

   // compute Axes, bindVBO.
   groundAxisProg.axisVBO = {
      position: gl.createBufferHandle(getAxis(camera.zFar)),
      color: gl.createBufferHandle(getAxisColor()),
      length: 3*2*2
   };

   return gridSize;
}
function getAxis(yon) {
   var arry = [[yon, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [-yon, 0.0, 0.0], 
               [0.0, yon, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -yon, 0.0],
               [0.0, 0.0, yon], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, -yon]];
   return new Float32Array([].concat.apply([],arry));
}
function getAxisColor() {
    const color = [Util.hexToRGB(View.theme.colorX), Util.hexToRGB(View.theme.colorY), Util.hexToRGB(View.theme.colorZ)],
       negColor = [Util.hexToRGB(View.theme.negColorX), Util.hexToRGB(View.theme.negColorY), Util.hexToRGB(View.theme.negColorZ)];
   var arry = [];
   for (var i = 0; i < 3; i++) {
      arry = arry.concat(color[i], color[i], negColor[i], negColor[i]);
   }
   return new Float32Array(arry);
}
function renderGroundAndAxes(gl, projection, modelView) {
   const showAxes = View.prop.showAxes;
   // draw groundPlane
   const show = View.prop.showGroundplane; // || 
      //(wings_pref:get_value(force_show_along_grid) andalso
      //(Camera.view.alongAxis =/= none);      
   if (show) {
      //var alongAxis = Camera.view.alongAxis;
      const color = Util.hexToRGBA(View.theme.gridColor);
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
      yon = camera.zFar;
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
   if (gl.resizeToDisplaySize() || camera.isModified || redrawFlag) {
      redrawFlag = false; 
      const backColor = Util.hexToRGBA(View.theme.geometryBackground);
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
      const mat = loadMatrices(true);
      if (camera.isModified) {
         camera.isModified = false;
         computeGroundAndAxes(gl, mat.projection, mat.modelView);
      }
      const yon = renderGroundAndAxes(gl, mat.projection, mat.modelView);
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





export {
   needToRedraw,
   render,
   worldToScreenPoint,
   screenPointToWorld,
   selectionBox,
   svgUI,
   camera,
};

