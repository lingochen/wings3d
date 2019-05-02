/*
//    Render all objects and helpers (such as axes) in the scene.
//     Used for the Geometry and AutoUV windows.
//
//  Original Erlang Version: Bjorn Gustavsson
*/
import {gl} from './wings3d_gl.js';
import * as View from './wings3d_view.js';
import * as Camera from './wings3d_camera.js';
import {onReady, GROUND_GRID_SIZE} from './wings3d.js';
import * as ShaderProg from './wings3d_shaderprog.js';
import * as Util from './wings3d_util.js';



// my.shader = initShaders();
// wings_pref:set_default(multisample, true), <- why set default here? shouldn't bunch of defaults set together?
// initPolygonStipple(); no webgl support. shader replacement? ignore for now
let lineProg;        // to be replaced
let groundAxisProg;  // to be replaced
let textProg;        // to be replaced

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
   var mat = View.loadMatrices(true);
   var yon = computeGroundAndAxes(gl, mat.projection, mat.modelView);    
   initMiniAxis(gl, mat.modelView);

   // init simpleText.
   // compile and link program.
   textProg = {handle: gl.compileGLSL(ShaderProg.textArray.vertexShader, ShaderProg.textArray.fragShader)};

   // get attribute handle.
   textProg.vertexPosition = gl.getAttribLocation(textProg.handle, "aVertexPosition");
   textProg.texCoord = gl.getAttribLocation(textProg.handle, "aTexCoord");
   textProg.uMVMatrix = gl.getUniformLocation(textProg.handle, "uMVMatrix");
   textProg.uPMatrix = gl.getUniformLocation(textProg.handle, "uPMatrix");
   textProg.uTexture = gl.getUniformLocation(textProg.handle, "u_texture");
   
   initSimpleASCII(gl);

 //  console.log("Render.init() success");
});

/**
 * return screen space windows position for Canvas2D to draw. == gluProject
 * @param {*} pt - model 3d pt in the world transform.
 */
/*function worldToScreenPoint(pt) {
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
};*/


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
   if (View.prop.showAxes){
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
      zFar = zFar + GROUND_GRID_SIZE;
      //gl:polygonMode(?GL_FRONT_AND_BACK, ?GL_FILL),
      
      var color = [Util.hexToRGB(View.theme.colorX), Util.hexToRGB(View.theme.colorY), Util.hexToRGB(View.theme.colorZ)];
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
function computeGroundAndAxes(gl, projection, modelView) {
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
      position: gl.createBufferHandle(getAxis()),
      color: gl.createBufferHandle(getAxisColor()),
      length: 3*2*2
   };

   return gridSize;
}
function getAxis() {
   var yon = Camera.view.zFar;
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
      var alongAxis = Camera.view.alongAxis;
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
      yon = Camera.view.zFar;
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
   if (gl.resizeToDisplaySize() || Camera.view.isModified || redrawFlag) {
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
      var mat = View.loadMatrices(true);
      if (Camera.view.isModified) {
         Camera.view.isModified = false;
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





export {
   renderText,
   needToRedraw,
   render,
};

