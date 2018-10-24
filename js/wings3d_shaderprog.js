// program as text .

import {gl} from './wings3d_gl';
import * as Wings3D from './wings3d';

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
      'uniform vec4 unselectedHilite;',
      'uniform vec4 selectedColor;',

      'void main(void) {',
      '   if (vColor == 0.0) {',
      '      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);',     // black dotted.             
      '   } else if (vColor == 0.25) {',
      '      gl_FragColor = selectedColor;',
      '   } else if (vColor == 0.5) {',
      '      gl_FragColor = unselectedHilite;',
      '   } else {',
      '      gl_FragColor = vec4(unselectedHilite.xyz+selectedColor.xyz, 1.0);',     // blended 
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
      'uniform vec4 faceColor;',
      'varying vec3 vBC;',

      'float edgeFactor(){',
         'vec3 d = fwidth(vBC);',
         'vec3 a3 = smoothstep(vec3(0.0), d*1.5, vBC);',
         'return min(min(a3.x, a3.y), a3.z);',
      '}',

      'void main(){',
         // coloring by edge
         'gl_FragColor.rgb = mix(vec3(0.0), vec3(faceColor), edgeFactor());',
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
   // compiled the program
   cameraLight = gl.createShaderProgram(cameraLight.vertex, cameraLight.fragment);

   solidColor = gl.createShaderProgram(solidColor.vertex, solidColor.fragment);

   simplePoint = gl.createShaderProgram(simplePoint.vertex, simplePoint.fragment);

   colorPoint = gl.createShaderProgram(colorPoint.vertex, colorPoint.fragment);

   solidWireframe = gl.createShaderProgram(solidWireframe.vertex, solidWireframe.fragment);

   colorWireframe = gl.createShaderProgram(colorWireframe.vertex, colorWireframe.fragment);

   colorSolidWireframe = gl.createShaderProgram(colorSolidWireframe.vertex, colorSolidWireframe.fragment);

   selectedColorLine = gl.createShaderProgram(selectedColorLine.vertex, selectedColorLine.fragment);

   selectedColorPoint = gl.createShaderProgram(selectedColorPoint.vertex, selectedColorPoint.fragment);
});

export {
   uColorArray,
   colorArray,
   selectedColorLine,
   selectedColorPoint,
   textArray,
   cameraLight,
   solidColor,
   simplePoint,
   colorPoint,
   solidWireframe,
   colorWireframe,
   colorSolidWireframe,
};