// program as text .

import {gl} from './wings3d_gl.js';
import * as Wings3D from './wings3d.js';

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
// gl_Position = vec4(2.0,2.0,2.0, 1.0);
let wireframeLine = {   // http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
   vertex: index2TexCoord => `//#extension OES_texture_float : enable
      uniform mat4 projection; 
      uniform mat4 worldView;
      // color of various state
      uniform vec4 edgeColor[8];
      uniform float edgeWidth[8];

      // draw triangle array.
      attribute highp vec3 indexBuffer;

      // position texture (x,y,z), state texture(uint8)
      uniform highp sampler2D positionBuffer;
      uniform sampler2D edgeState;
      uniform float positionBufferHeight;
      uniform float edgeStateHeight;

      varying vec3 vBC;
      varying float lineWidth;
      varying vec4 color;

      ${index2TexCoord}

      void main() {
         gl_Position = vec4(2.0, 2.0, 2.0, 1.0);         // culled as default.
         if (indexBuffer.z >= 0.0) {
            vBC = vec3(1.0, indexBuffer.z, 1.0);
  
            int state = int(texture2D(edgeState, index2TexCoord(indexBuffer.y, edgeStateHeight)).x * 255.0); // luminance === {l, l, l, 1}; l is [0-1]
            for (int i = 0; i < 8; i++) {
               if (i == state) {
                  color = edgeColor[i];
                  lineWidth = edgeWidth[i];
                  break;
               }
            }
            vec3 pos = texture2D(positionBuffer, index2TexCoord(indexBuffer.x, positionBufferHeight)).xyz;
            gl_Position = projection * worldView * vec4(pos, 1.0);
         }
      }
   `,
   fragment: `#extension GL_OES_standard_derivatives : enable
      precision mediump float;
      varying vec3 vBC;
      varying float lineWidth;
      varying vec4 color;

      float edgeFactor() {
         vec3 d = fwidth(vBC);
         vec3 a3 = smoothstep(vec3(0.0), d*lineWidth, vBC);
         return min(min(a3.x, a3.y), a3.z);
      }

      void main() {
         // coloring by edge
         float edge = edgeFactor();
         if (edge < 1.0) {
            gl_FragColor = vec4(color.rgb, (1.0-edge)*0.95);
            //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
         } else {
            discard;
         }
      }
   `
};
// we could put positionBuffer into attribute, but that meant we have to manage positionBuffer update separately.
// there is no method for treating a texture2d as vertex array attribute.
let selectedColorPoint = {  
   vertex: index2TexCoord =>
     `uniform mat4 worldView;
      uniform mat4 projection;

      uniform vec4 vertexColor[8];
      uniform float sizeOfVertex[8];

      // draw point array;
      attribute highp float vertexIndex;                 // klutch 
      attribute float vertexState;

      // attribute texture
      uniform highp sampler2D positionBuffer;
      uniform float positionBufferHeight;

      // output
      varying vec4 color;

      ${index2TexCoord}

      void main(void) {
         gl_Position = vec4(2.0, 2.0, 2.0, 1.0);         // culled as default.
         if (vertexState < 128.0) {
            vec3 pos = texture2D(positionBuffer, index2TexCoord(vertexIndex, positionBufferHeight)).xyz;
            gl_Position = projection * worldView * vec4(pos, 1.0);

            int vState = int(vertexState);
            for (int i = 0; i < 8; ++i) {
               if (i == vState) {
                  color = vertexColor[i];
                  gl_PointSize = sizeOfVertex[i];
                  break;
               }
            }
         }
      }
   `,
   fragment:
     `precision lowp float;
      varying vec4 color;

      void main(void) {
         gl_FragColor = color;
      }
   `
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

Wings3D.onReady(function() {
   const index2TexCoord = 
     `vec2 index2TexCoord(float index, float height) {
         return vec2( mod(index, float(${gl.textureSize})) / float(${gl.textureSize}), (index/float(${gl.textureSize})) / height);
      }
   `;
   // compiled the program
   cameraLight = gl.createShaderProgram(cameraLight.vertex, cameraLight.fragment);

   solidColor = gl.createShaderProgram(solidColor.vertex, solidColor.fragment);

   simplePoint = gl.createShaderProgram(simplePoint.vertex, simplePoint.fragment);

   colorPoint = gl.createShaderProgram(colorPoint.vertex, colorPoint.fragment);

   solidWireframe = gl.createShaderProgram(solidWireframe.vertex, solidWireframe.fragment);

   edgeSolidWireframe = gl.createShaderProgram(edgeSolidWireframe.vertex, edgeSolidWireframe.fragment);

   colorSolidWireframe = gl.createShaderProgram(colorSolidWireframe.vertex, colorSolidWireframe.fragment);

   selectedColorLine = gl.createShaderProgram(selectedColorLine.vertex, selectedColorLine.fragment);

   wireframeLine = gl.createShaderProgram(wireframeLine.vertex(index2TexCoord), wireframeLine.fragment);

   selectedColorPoint = gl.createShaderProgram(selectedColorPoint.vertex(index2TexCoord), selectedColorPoint.fragment);
});

export {
   uColorArray,
   colorArray,
   selectedColorLine,
   wireframeLine,
   selectedColorPoint,
   textArray,
   cameraLight,
   solidColor,
   simplePoint,
   colorPoint,
   solidWireframe,
   edgeSolidWireframe,
   colorSolidWireframe,
};