/**
 *  Render all objects and helpers (such as axes) in the scene.
 * Used for the Geometry. Original Erlang Version: Bjorn Gustavsson
 * 
 * expand it to handle multiple geometry panes. 2020/10/08
 * 
 * 2023/02/12 - start new web-component icons
 * change to use web-component, web-component icon/widget for zoom/pan/(rotate/mini-axis) icons. 
 * leverage html/css capabilities to layout/position icons/elements.
 * 
*/
import {gl} from './wings3d_gl.js';
import * as View from './wings3d_view.js';
import * as UI from './wings3d_ui.js';
import {Camera} from './wings3d_camera.js';
import {onReady, GROUND_GRID_SIZE} from './wings3d.js';
import * as ShaderProg from './wings3d_shaderprog.js';
import * as Util from './wings3d_util.js';
import {unProject, transformVertex, clipLine, Plane, Frustum} from './wings3d_geomutil.js';
const {vec3, vec4, mat4} = glMatrix;



const SVGNS = "http://www.w3.org/2000/svg";
// initPolygonStipple(); no webgl support. shader replacement? ignore for now
let m_lineProg;        // to be replaced
let m_groundAxisProg;  // to be replaced
let m_miniAxisVBO;
let m_svgUI;
let m_isRedraw = true;
function needToRedraw() {
   m_isRedraw = true;
};
function clearRedraw() {
   m_isRedraw = false;
}
class Renderport {
   constructor(viewport, isOrtho, showAxes, showGround) { // [x, y, width, height]
      this.lineEnd = {x: null, y: null, z: null};
      this.miniAxis = {x: null, y: null, z: null, pan: null,};

      for (let axis of Object.keys(this.lineEnd)) {
         this.lineEnd[axis] = document.createElementNS(SVGNS, 'text');
         this.lineEnd[axis].style.fontSize = "18px";
         this.lineEnd[axis].style.fontFamily = 'Arial';
         this.lineEnd[axis].textContent = axis;
         m_svgUI.appendChild(this.lineEnd[axis]);
      }

      this.camera = new Camera;
      this.viewport = viewport;
      this.canvasHeight = viewport[3];
      
      // references grid
      //this.axesVBO;
      //this.groundGridVBO;
      this._computeAxes();

      // groundplane, axes, orthogonal
      this.isOrtho = isOrtho;
      this.axesShow = showAxes;
      this.groundplaneShow = showGround;
   }

   setViewport(x, y, width, height, canvasHeight) {
      this.viewport = [x, y, width, height];
      this.canvasHeight = canvasHeight;
      this.isRedraw = true;
   }

   /**
    * out - {projection, modelView, useSceneLights};
    */
   loadMatrices(out, includeLights) {
      this.projection(out.projection, mat4.create()); // passed identity matrix.
      out.useSceneLights = this.modelView(out.modelView, includeLights);
      return out;
   };
   
   /**
    * build projection matrix, given current viewport and camera.
    */
   projection(out, inTransform) {
      const size = this.viewport;
      const aspect = size[2] / size[3];
      const ortho = this.isOrtho;
      if (!ortho && this.camera.alongAxis) {
         ortho = View.prop.force_ortho_along_axis;
      }
      const tp = mat4.create();
      if (ortho) {
         const sz = this.camera.distance * Math.tan(this.camera.fov * Math.PI  / 180 / 2);
         mat4.ortho(tp, -sz * aspect, sz * aspect, -sz, sz, this.camera.zNear, this.camera.zFar);      
      } else {
         mat4.perspective(tp, this.camera.fov, aspect, this.camera.zNear, this.camera.zFar);
      }
   
      mat4.mul(out, inTransform, tp);
   };
   
   modelView(modelView, includeLights = false) {
      let useSceneLights = false;
      if (includeLights) {
         useSceneLights = View.prop.useSceneLights; // && Wings3D.light.anyEnabledLights();
         if (!useSceneLights) {
            //Wings3D.light.cameraLights();
         }
      }
   
      // fromTranslation, identity * vec3. modelView rest.
      mat4.fromTranslation(modelView, vec3.fromValues(this.camera.panX, this.camera.panY, -this.camera.distance));
      mat4.rotateX(modelView, modelView, this.camera.elevation * Math.PI / 180);
      mat4.rotateY(modelView, modelView, this.camera.azimuth * Math.PI / 180);
      mat4.translate(modelView, modelView, this.camera.origin);
   
      if (useSceneLights) {
         //Wings3D.light.globalLights();
      }
      return useSceneLights;
   };

   screenPointToWorld(pt) {
      // handle pick selection
      const viewport = this.viewport;
      const x1 = viewport[0], y1 = viewport[1], x2 = x1 + viewport[2], y2 = y1 + viewport[3];

      let winx = pt.x;
      let winy = this.canvasHeight - pt.y;   // y is upside-down
      // yes, sometimes mouse coordinate is outside of the viewport. firefox return values larger than width, height.
      if (winx < x1) { winx = x1; }
      if (winx > x2) { winx = x2;}
      if (winy < y1) { winy = y1; }
      if (winy > y2) { winy = y2;}
      
      const mat =  {modelView: mat4.create(), projection: mat4.create()};
      this.loadMatrices(mat, false);
      return [unProject(winx, winy, 0.0, mat.modelView, mat.projection, viewport),
               unProject(winx, winy, 1.0, mat.modelView, mat.projection, viewport)];
   };


   /**
    * return screen space windows position for Canvas2D to draw. == gluProject
    * @param {*} pt - model 3d pt in the world transform.
    */
   worldToScreenPoint(pt) {
      const mat = {modelView: mat4.create(), projection: mat4.create()};
      this.loadMatrices(mat, false);   

      const point3D = [pt[0], pt[1], pt[2], 1.0];
      // to clipSpace
      Vec4.transformMat4(point3D, point3D, mat.modelView);
      Vec4.transformMat4(point3D, point3D, mat.projection);
      // to ndcSpacePos
      point3D[0] /= point3D[3];
      point3D[1] /= point3D[3];
      // return windowPos
      return [(point3D[0] *  0.5 + 0.5) * this.viewport[2] + this.viewport[0], 
              (point3D[1] * -0.5 + 0.5) * this.viewport[3] + this.viewport[1]];
   };

   isInside(mousePos) {
      const viewport = this.viewport;
      const x1 = viewport[0], y1 = viewport[1], x2 = x1 + viewport[2], y2 = y1 + viewport[3];

      const x = mousePos.x;
      const y = this.canvasHeight - mousePos.y;   // y is upside-down
      if ( (x >= x1) && (x <=x2) && (y>=y1) && (y <= y2)) {
         return true;
      }
      return false;
   }

   makeCurrent(isCurrent) {  // enable/disable 
      if (isCurrent) {  // update icons to reflect current state.         
         let checkbox = document.querySelector('input[id="toggleGroundFor"]');
         if (checkbox) {
            checkbox.checked = this.groundplaneShow;
         }
         checkbox = document.querySelector('input[id="toggleAxesFor"]');
         if (checkbox) {
            checkbox.checked = this.axesShow;
         }
         checkbox = document.querySelector('input[id="toggleOrthoFor"]');
         if (checkbox) {
            checkbox.checked = this.isOrtho;
         }
      }
   }

   orthogonalView(flag) {
      this.isOrtho = flag;
      this.isRedraw = true;
   }

   showAxes(flag) {
      this.axesShow = flag;
      this.isRedraw = true;
      if (!flag) {   // remember to hide text
         this._hideText();
      }
   }

   showGroundplane(flag) {
      this.groundplaneShow = flag;
      this.isRedraw = true;
   }

   // UI
   selectionBox(start, end) {
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
      const [leftBottomNear, leftBottomFar] = this.screenPointToWorld( {x: left, y: bottom} );
      const [leftTopNear, leftTopFar] = this.screenPointToWorld( {x: left, y: top} );
      const [rightTopNear, rightTopFar] = this.screenPointToWorld( {x: right, y: top} );
      const [rightBottomNear, rightBottomFar] = this.screenPointToWorld( {x: right, y: bottom} );

      // now compute frustum
      return new Frustum(Plane.fromPoints(leftTopNear, leftBottomNear, leftBottomFar),       // left
                        Plane.fromPoints(rightBottomNear, rightTopNear, rightTopFar),      // right
                        Plane.fromPoints(rightTopNear, leftTopNear, leftTopFar),           // top
                        Plane.fromPoints(leftBottomNear,rightBottomNear, rightBottomFar),   // bottom
                        Plane.fromPoints(rightBottomNear, leftBottomNear, leftTopNear),    // near
                        Plane.fromPoints(rightBottomFar, rightTopFar, leftTopFar)          // far
                        );
   }

   // rendering, and it auxiliary 
   render(gl, drawWorldFn) {
      const saveViewport = gl.getViewport();
      if (this.isRedraw || this.camera.isModified || m_isRedraw) {
         gl.viewport(...this.viewport);
         gl.scissor(...this.viewport);
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
         const mat = this.loadMatrices(gl, true);
         if (this.camera.isModified || this.isRedraw) {
            this.camera.isModified = false;
            this.isRedraw = false;
            this._computeGround(mat.projection, mat.modelView);
         }
         const yon = this._renderGround(gl, mat.projection, mat.modelView);
         this._renderAxes(gl, mat.projection, mat.modelView);
         this._renderMiniAxes(gl, mat.modelView);
         //show_saved_bb(St),
         //show_bb_center(St),
         //user_clipping_planes(on),
         drawWorldFn(gl); // and scenelights.
         //user_clipping_planes(off),
         this._renderAxisLetter(gl, yon);
         //show_camera_image_plane(),
         //wings_develop:gl_error_check("Rendering scene")
         //m_isRedraw = false; 
      }
      gl.viewport(...saveViewport);
   };

   hide() { // render will auto-show
      this._hideText();
   }

   _hideText() { 
      for (let axis of Object.keys(this.lineEnd)) {
         if (this.lineEnd[axis].style.display !== "none") {
            this.lineEnd[axis].style.display = "none";
         }
         if (this.miniAxis[axis].style.display !== "none") {
            this.miniAxis[axis].style.display = "none";
         }
      }
   }

   _renderASCII(axis, color, origin, end) {
      if (clipLine(origin, end)) {
         // line inside view volume
         const viewport = this.viewport;
         //console.log(end[0], end[1], end[2], end[3]);
         const x = Math.trunc((0.5*end[0]/end[3]+0.5)*(viewport[2]-20) + 10);
         const y = Math.trunc((0.5*end[1]/end[3]+0.5)*(viewport[3]-16) + 7);
   
         this.lineEnd[axis].setAttributeNS(null, 'x', x+viewport[0]);
         this.lineEnd[axis].setAttributeNS(null, 'y', this.canvasHeight-(y+viewport[1]));
         this.lineEnd[axis].setAttributeNS(null, 'fill', color);
      }
   };

   
   _renderAxisLetter(gl, zFar) {
      if (this.axesShow){
         for (let axis of Object.keys(this.lineEnd)) { 
            if (this.lineEnd[axis].style.display === "none") { // unhideText,
               this.lineEnd[axis].style.display = "block";
            }
         }

         var start = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
         var origin = transformVertex(start, gl.modelView, gl.projection);
   
         zFar = zFar + GROUND_GRID_SIZE;
         //gl:polygonMode(?GL_FRONT_AND_BACK, ?GL_FILL),
         
         //var color = [Util.hexToRGB(View.theme.colorX), Util.hexToRGB(View.theme.colorY), Util.hexToRGB(View.theme.colorZ)];
         let endx = transformVertex(vec4.fromValues(zFar, 0.0, 0.0, 1.0), gl.modelView, gl.projection), 
             endy = transformVertex(vec4.fromValues(0.0, zFar, 0.0, 1.0), gl.modelView, gl.projection), 
             endz = transformVertex(vec4.fromValues(0.0, 0.0, zFar, 1.0), gl.modelView, gl.projection);

         this._renderASCII('x', View.theme.colorX, origin, endx);
         this._renderASCII('y', View.theme.colorY, origin, endy);
         this._renderASCII('z', View.theme.colorZ, origin, endz);
      }
   }

   _renderAxes(gl, projection, modelView) {
      if (this.axesShow) {
         // use line segment program
         gl.useProgram(m_groundAxisProg.handle);
         // bind attribute, vertex, color, matrix
         gl.uniformMatrix4fv(m_groundAxisProg.uPMatrix, false, projection);
         gl.uniformMatrix4fv(m_groundAxisProg.uMVMatrix, false, modelView);
         gl.setBufferAndAttrib(this.axesVBO.position, m_groundAxisProg.vertexPosition);
         gl.setBufferAndAttrib(this.axesVBO.color, m_groundAxisProg.vertexColor);
         // draw line segment
         gl.drawArrays(gl.LINES, 0,this.axesVBO.length);
      }
   }

   _renderMiniAxisLetter(projection, modelView) {
      if (View.prop.showMiniAxis) {
         let endx = transformVertex(vec4.fromValues(0.1, 0.0, 0.0, 1.0), modelView, projection), 
         endy = transformVertex(vec4.fromValues(0.0, 0.1, 0.0, 1.0), modelView, projection), 
         endz = transformVertex(vec4.fromValues(0.0, 0.0, 0.1, 1.0), modelView, projection);
      }
   }

   _renderMiniAxes(gl, inModelView) {
      if (View.prop.showMiniAxis) {
         let ratio = this.viewport[2]/ this.viewport[3];//gl.canvas.clientWidth / gl.canvas.clientHeight;
         // set current rotation.
         const modelView = mat4.create();//m_miniAxisVBO.modelView;
         mat4.copy(modelView, inModelView);
         modelView[12] = -ratio+0.15;
         modelView[13] = -1.0+0.15;
         modelView[14] = 0.0;
         // set current projection
         const projection = mat4.create();
         mat4.ortho(projection, -ratio, ratio, -1.0, 1.0, 0.00001,  10000000.0);

         // update letters location.
         this._renderMiniAxisLetter(projection, modelView);
         
         // save attribute
         const length = m_miniAxisVBO.length;
         // render mini axis, use groundAxisProg
         gl.useProgram(m_groundAxisProg.handle);
         // bind attribute, vertex, color, matrix
         gl.uniformMatrix4fv(m_groundAxisProg.uPMatrix, false, projection);
         gl.uniformMatrix4fv(m_groundAxisProg.uMVMatrix, false, modelView);
         gl.setBufferAndAttrib(m_miniAxisVBO.position, m_groundAxisProg.vertexPosition);
         gl.setBufferAndAttrib(m_miniAxisVBO.color, m_groundAxisProg.vertexColor);
         // draw line segments
         gl.drawArrays(gl.LINES, 0, length);
         // pop attribute
      }
   }

   _renderGround(gl, projection, modelView) {
      // draw groundPlane
         //(wings_pref:get_value(force_show_along_grid) andalso
         //(Camera.view.alongAxis =/= none);      
      if (this.groundplaneShow) {
         //var alongAxis = Camera.view.alongAxis;
         const color = Util.hexToRGBA(View.theme.gridColor);
            //case view.AlongAxis of
            // x -> gl:rotatef(90.0, 0.0, 1.0, 0.0);
            // z -> ok;
            // _ -> gl:rotatef(90.0, 1.0, 0.0, 0.0)
         var length = this.groundGridVBO.length;
         if ( this.axesShow ) {
            length -= 4;            // skip the axes line
         }
         // data
         // use line segment program
         gl.useProgram(m_lineProg.progHandle);
         // bind attribute, vertex, color, matrix
         gl.setBufferAndAttrib(this.groundGridVBO.position, m_lineProg.attribute.position.loc);
         gl.uniform4fv(m_lineProg.uniform.uColor.loc, color);
         gl.uniformMatrix4fv(m_lineProg.transform.projection, false, projection);
         gl.uniformMatrix4fv(m_lineProg.transform.worldView, false, modelView);
         // draw line segments
         gl.drawArrays(gl.LINES, 0, length);
      }
   
      var yon;
      //if (View.prop.constrainAxes) {
      //   yon = gridSize;
      //} else {
         yon = this.camera.zFar;
      //}
   
   
      return yon;
   };
   
   // compute axes
   _computeAxes() {
      function getAxis(yon) {
         var arry = [[yon, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [-yon, 0.0, 0.0], 
                     [0.0, yon, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -yon, 0.0],
                     [0.0, 0.0, yon], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, -yon]];
         return new Float32Array([].concat.apply([],arry));
      }
      function getAxisColor() {
         const color = [Util.hexToRGB(View.theme.colorX), Util.hexToRGB(View.theme.colorY), Util.hexToRGB(View.theme.colorZ)],
             negColor = [Util.hexToRGB(View.theme.negColorX), Util.hexToRGB(View.theme.negColorY), Util.hexToRGB(View.theme.negColorZ)];
         let arry = [];
         for (let i = 0; i < 3; i++) {
            arry = arry.concat(color[i], color[i], negColor[i], negColor[i]);
         }
         return new Float32Array(arry);
      }
   
      // compute Axes, bindVBO.
      this.axesVBO = {
         position: gl.createBufferHandle(getAxis(this.camera.zFar)),
         color: gl.createBufferHandle(getAxisColor()),
         length: 3*2*2
      };
   }

   // recompute groundplanegrid, given the size of grid. size is mutiple of GROUND_GRID_SIZE. default
   // GROUND_GRID_SIZE=1, so size=10, grid is 10x10.
   _computeGround(projection, modelView) {
      function calcGridSize(width, height, projection, modelView) {
         var w1 = Math.max(width, height);// /2.0;
         var coord = unProject(w1, 0.0, 0.0, modelView, projection, [0, 0, width, height]);
         var ret = GROUND_GRID_SIZE * 
               Math.max(Math.round(Math.max(Math.max(Math.abs(coord[0]), Math.abs(coord[1])), Math.abs(coord[2]))), 10.0);
         // hacked an value that just cover the screen space.
         ret *= width/height * 0.7;
         return Math.round(ret);
      }
      function computeGroundGrid(width, height, size, gridSize) {
         let w = Math.min(width, height);
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

      const width = this.viewport[2], height = this.viewport[3];
      const gridSize = calcGridSize(width, height, projection, modelView);
      //console.log("gridsize " + gridSize.toString());
      const data = computeGroundGrid(width, height, gridSize, GROUND_GRID_SIZE);
      // bindVBO.
      this.groundGridVBO = {
         position: gl.createBufferHandle(new Float32Array(data)),
         length: data.length/3
      };

      return gridSize;
   } 
}




// ignore along_axis for now. fixed it later when we get to set the preference.
function initMiniAxis(gl) {
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
   
   return {
       position: new Float32Array(arry),
       color: new Float32Array(color),
       length: 3*2 + 3*4
   };
   /*// compute ortho projection, and modelView.
   var ratio = gl.canvas.clientWidth / gl.canvas.clientHeight;
   var modelView = mat4.clone(inModelView);
   modelView[12] = 0.11-ratio;
   modelView[13] = -1.0+0.11;
   modelView[14] = 0.0;
   groundAxisProg.miniAxisVBO.modelView = modelView;
   groundAxisProg.miniAxisVBO.projection = mat4.create();
   mat4.ortho(groundAxisProg.miniAxisVBO.projection, -ratio, ratio, -1.0, 1.0, 0.00001,  10000000.0);*/
}

const arrowIcon = `
<symbol id="upArrowIcon" viewBox="0 0 30 35" xmlns="http://www.w3.org/2000/svg">
  <polygon points="15 0, 0 15, 10 15, 10 35, 20 35, 20 15, 30 15, 15 0" />
</symbol>
`;
const iconDefs = `
<defs xmlns="http://www.w3.org/2000/svg">
  <g id='panCameraIcon'>
    <rect width="30" height="34" stroke="blue" stroke-width="1px" fill="currentColor"/>
    <use href="#upArrowIcon" x='8' width='13' height='15' transform="rotate(0, 14.5, 7.5)" />
    <use href="#upArrowIcon" x='16' y='9' width='13' height='15' transform="rotate(90, 22.5,16.5)" />
    <use href="#upArrowIcon" y='9' width='13' height='15' transform="rotate(-90, 6.5, 16.5)" />
    <use href="#upArrowIcon" x='8' y='18' width='13' height='15' transform="rotate(180, 14.5, 25.5)" />
  </g>
</defs>`;
onReady(function() {
   gl.enable(gl.DEPTH_TEST);
   gl.enable(gl.CULL_FACE);   // enable cull face (2018-05-30) back face culling is default
   gl.enable(gl.SCISSOR_TEST);
   // initialized glsl program, update data
   // program source ShaderProg
   // drawGrid, using LineProgram
   // compile and link program
   m_lineProg = gl.createShaderProgram(ShaderProg.uColorArray.vertexShader, ShaderProg.uColorArray.fragShader);

   // compile and link program.
   m_groundAxisProg = {handle: gl.compileGLSL(ShaderProg.colorArray.vertexShader, ShaderProg.colorArray.fragShader)};

   // get attribute handle.
   m_groundAxisProg.vertexPosition = gl.getAttribLocation(m_groundAxisProg.handle, "aVertexPosition");
   m_groundAxisProg.vertexColor = gl.getAttribLocation(m_groundAxisProg.handle, "aVertexColor");
   m_groundAxisProg.uPMatrix = gl.getUniformLocation(m_groundAxisProg.handle, "uPMatrix");
   m_groundAxisProg.uMVMatrix = gl.getUniformLocation(m_groundAxisProg.handle, "uMVMatrix");

   // compute grid and axis, and write to vbo. 
   m_miniAxisVBO = initMiniAxis();
   m_miniAxisVBO.position = gl.createBufferHandle(m_miniAxisVBO.position);
   m_miniAxisVBO.color =  gl.createBufferHandle(m_miniAxisVBO.color);

   // setup svgUI
   m_svgUI = document.getElementById('svgUI');
   // setup defs arrow
   const parser = new DOMParser();
   let doc =parser.parseFromString(arrowIcon, "image/svg+xml");
   m_svgUI.appendChild(doc.documentElement);
   doc = parser.parseFromString(iconDefs, "image/svg+xml");
   m_svgUI.appendChild(doc.documentElement);
});



export {
   needToRedraw,
   clearRedraw,
   Renderport,
   m_svgUI as svgUI,
};

