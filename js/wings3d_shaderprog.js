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
let drawSelectablePolygon = {
vertex: (index2TexCoord, materialIndex) =>
`  uniform mat4 projection;
   uniform mat4 worldView;
   uniform vec4 faceColor[4];
   uniform float currentBaseColorTexture;

   // (vertex, halfEdge, face, group) index
   attribute highp vec4 polygonIndex;
   // (color, normal, texCoord)
   attribute highp vec3 a_AttributeIndex;

   // positionTexture, stateTexture, faceTexture, materialTexture, edgeColorTexture, normalTexture, texCoordTexture.
   uniform highp sampler2D positionBuffer;
   uniform sampler2D groupState;
   uniform sampler2D faceState;
   uniform sampler2D materialColor;
   uniform sampler2D attributeColor;
   uniform sampler2D attributeTexCoord;
   uniform float positionBufferHeight;
   uniform float faceStateHeight;
   uniform float groupStateHeight;
   uniform float materialColorHeight;
   uniform float attributeColorHeight;
   uniform float attributeTexCoordHeight;


   varying vec4 color;                    // color of material * vertex 
   varying vec4 stateColor;               // selected, or hiliteColor, or just original color
   varying vec2 baseColorUV;

   ${index2TexCoord}

   ${materialIndex}

   void main() {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);         // culled as default.
      if ((polygonIndex.w < 0.0) || (polygonIndex.z < 0.0) || (polygonIndex.x < 0.0)) {  // non 
         return;
      }
      float gState = texture2D(groupState, index2TexCoord(polygonIndex.w, groupStateHeight)).x * 255.0; // luminance === {l, l, l, 1}; l is [0-1]
      if (gState < 8.0) {
         float transparency = 1.0;
         if (gState >= 4.0) {
            transparency = 0.0;
            gState -= 4.0;       // == gState & ~4;
         }
         vec3 polyState = texture2D(faceState, index2TexCoord(polygonIndex.z, faceStateHeight)).xyz;
         int state = int(max(gState, polyState.x * 255.0)); // luminance === {l, l, l, 1}; l is [0-1]         
         if (state < 4) {
            float matIndex = materialIndex(polyState) * 5.;

            if (texture2D(materialColor, index2TexCoord(matIndex+3.0, materialColorHeight)).x != currentBaseColorTexture) { // skipped if not the currentTexture
               return;
            }

            transparency = transparency * texture2D(materialColor, index2TexCoord(matIndex+1., materialColorHeight)).z;
            color = vec4(texture2D(materialColor, index2TexCoord(matIndex, materialColorHeight)).xyz, transparency);   // material color
            if (state == 0) {
               if (transparency == 0.0) { // whole triangle is transparent.
                  return;
               }
               stateColor = vec4(1.0, 1.0, 1.0, 1.0);//color;       // current Material color
            } else {
               for (int i = 1; i < 4; i++) {
                  if (i == state) {
                     stateColor = faceColor[i];
                     break;
                  }
               }
               //color = mix(stateColor, color, 0.5);
            }
            float channel = texture2D(materialColor, index2TexCoord(matIndex+4.0, materialColorHeight)).x;
            baseColorUV = texture2D(attributeTexCoord, index2TexCoord(a_AttributeIndex.z*4.0+channel, attributeTexCoordHeight)).ra;

            vec3 pos = texture2D(positionBuffer, index2TexCoord(polygonIndex.x, positionBufferHeight)).xyz;
            vec3 vertexColor = texture2D(attributeColor, index2TexCoord(a_AttributeIndex.x, attributeColorHeight)).rgb;
            gl_Position = projection * worldView * vec4(pos, 1.0);
            // modulate vertexColor;
            color = color * vec4(vertexColor, 1.0);
         }
      }
   }
`,
fragment:
`precision mediump float;     // stipple/screendoor shader
   varying vec4 color;
   varying vec4 stateColor;

   varying vec2 baseColorUV;
   uniform sampler2D baseColorTexture;


   void main(void) {
      //vec2 oddEven = floor( fract(gl_FragCoord.xy * 0.5) + 0.5 ); // floor( value + 0.5 ) == round( value );
      //float result = oddEven.x + oddEven.y;

      //if (result == 1.0) {
         gl_FragColor = stateColor * color * texture2D(baseColorTexture, baseColorUV);
      //} else {
         //gl_FragColor = stateColor * texture2D(baseColorTexture, baseColorUV);
      //}
   }
` 
};
let selectedWireframeLine = {   // http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
   vertex: index2TexCoord => `//#extension OES_texture_float : enable
      uniform mat4 projection; 
      uniform mat4 worldView;
      // color of various state
      uniform vec4 edgeColor[8];
      uniform float edgeWidth[8];

      // (vertex, wEdge, face, group)
      attribute highp vec4 indexBuffer;

      // position texture (x,y,z), state texture(uint8)
      uniform highp sampler2D positionBuffer;
      uniform sampler2D edgeState;
      uniform sampler2D groupState;
      uniform float positionBufferHeight;
      uniform float edgeStateHeight;
      uniform float groupStateHeight;

      varying vec3 vBC;
      varying float lineWidth;
      varying vec4 color;

      ${index2TexCoord}

      void main() {
         gl_Position = vec4(2.0, 2.0, 2.0, 1.0);         // culled as default.
         if ((indexBuffer.w < 0.0) || (indexBuffer.z < 0.0)) {  // no group, or no face
            return;
         }
         float gState = texture2D(groupState, index2TexCoord(indexBuffer.w, groupStateHeight)).x * 255.0; // luminance === {l, l, l, 1}; l is [0-1]
         if (gState < 8.0) {
            vBC = vec3(1.0, 0.0, 1.0);
            float indexBufferY = indexBuffer.y;
            if (indexBufferY < 0.0) {
               vBC.y = 1.0;
               indexBufferY = (-indexBufferY) - 1.0;     // convert to positive
            }
            int state = int(texture2D(edgeState, index2TexCoord(indexBufferY, edgeStateHeight)).x * 255.0); // luminance === {l, l, l, 1}; l is [0-1]
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
      attribute highp vec3 vertexIndex;                 // (vIndex, state, group)

      // attribute texture
      uniform highp sampler2D positionBuffer;
      uniform sampler2D groupState;
      uniform float positionBufferHeight;
      uniform float groupStateHeight;

      // output
      varying vec4 color;

      ${index2TexCoord}

      void main(void) {
         gl_Position = vec4(2.0, 2.0, 2.0, 1.0);         // culled as default.
         if (vertexIndex.z < 0.0) {
            return;
         }
         float gState = texture2D(groupState, index2TexCoord(vertexIndex.z, groupStateHeight)).x * 255.0; // luminance === {l, l, l, 1}; l is [0-1]
         if ((gState < 8.0) && (vertexIndex.y < 128.0)) {
            vec3 pos = texture2D(positionBuffer, index2TexCoord(vertexIndex.x, positionBufferHeight)).xyz;
            gl_Position = projection * worldView * vec4(pos, 1.0);

            int vState = int(vertexIndex.y);
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
let wireframeLine = {   // http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
   vertex: index2TexCoord => `//#extension OES_texture_float : enable
      uniform mat4 projection; 
      uniform mat4 worldView;
      // color of various state
      uniform vec4 edgeColor[8];

      // (vertex, wEdge, face, group)
      attribute highp vec4 indexBuffer;

      // position texture (x,y,z), state texture(uint8)
      uniform highp sampler2D positionBuffer;
      uniform sampler2D groupState;
      uniform float positionBufferHeight;
      uniform float groupStateHeight;

      varying vec3 vBC;
      varying vec4 color;

      ${index2TexCoord}

      void main() {
         gl_Position = vec4(2.0, 2.0, 2.0, 1.0);         // culled as default.
         if ((indexBuffer.w < 0.0) || (indexBuffer.z < 0.0)) {  // no group, or no face
            return;
         }

         float gState = texture2D(groupState, index2TexCoord(indexBuffer.w, groupStateHeight)).x * 255.0; // luminance === {l, l, l, 1}; l is [0-1]
         if (gState < 8.0) {
            vBC = vec3(1.0, 0.0, 1.0);
            if (indexBuffer.y < 0.0) {
               vBC.y = 1.0;
            }
            color = edgeColor[0];                        // unselected color
 
            vec3 pos = texture2D(positionBuffer, index2TexCoord(indexBuffer.x, positionBufferHeight)).xyz;
            gl_Position = projection * worldView * vec4(pos, 1.0);
         }
      }
   `,
   fragment: `#extension GL_OES_standard_derivatives : enable
      precision mediump float;
      varying vec3 vBC;
      varying vec4 color;

      float edgeFactor() {
         vec3 d = fwidth(vBC);
         vec3 a3 = smoothstep(vec3(0.0), d, vBC);
         return min(min(a3.x, a3.y), a3.z);
      }

      void main() {
         // coloring by edge
         float edge = edgeFactor();
         if (edge < 1.0) {
            gl_FragColor = vec4(color.rgb, (1.0-edge)*0.95);
         } else {
            discard;
         }
      }
   `
};

let pbrMaterial = {
   vertex:
      `attribute vec3 position;
      attribute vec3 normal;
      
      uniform mat4 worldView;
      uniform mat4 projection;

      varying vec3 vNormal;
      void main(void) {
         vNormal = normal;
         gl_Position = projection * worldView * vec4(position, 1.0);
      }`,
   fragment:
      `precision mediump float;

      struct Material {
         vec3 baseColor;
      };

      uniform Material mtl;
      uniform vec3 lightDir;
      varying vec3 vNormal; 

      void main(void) {
         float diff = max(dot(normalize(vNormal), lightDir), 0.0);
         gl_FragColor = vec4(diff * mtl.baseColor, 1);
      }`,
};


Wings3D.onReady(function() {
   const index2TexCoord = 
     `vec2 index2TexCoord(float index, float height) {
         return vec2( mod(index, float(${gl.textureSize})) / float(${gl.textureSize}), floor(index/float(${gl.textureSize})) / height);
      }
   `;
   const materialIndex =
     `float materialIndex(vec3 v) {
         return dot(v, vec3(0., 255., 255.*255.));
      }
     `;
   // compiled the program
   cameraLight = gl.createShaderProgram(cameraLight.vertex, cameraLight.fragment);

   solidColor = gl.createShaderProgram(solidColor.vertex, solidColor.fragment);

   colorPoint = gl.createShaderProgram(colorPoint.vertex, colorPoint.fragment);

   wireframeLine = gl.createShaderProgram(wireframeLine.vertex(index2TexCoord), wireframeLine.fragment);

   selectedWireframeLine = gl.createShaderProgram(selectedWireframeLine.vertex(index2TexCoord), selectedWireframeLine.fragment);

   selectedColorPoint = gl.createShaderProgram(selectedColorPoint.vertex(index2TexCoord), selectedColorPoint.fragment);

   drawSelectablePolygon = gl.createShaderProgram(drawSelectablePolygon.vertex(index2TexCoord, materialIndex), drawSelectablePolygon.fragment);

   pbrMaterial = gl.createShaderProgram(pbrMaterial.vertex, pbrMaterial.fragment);
});

export {
   uColorArray,
   colorArray,
   wireframeLine,
   selectedWireframeLine,
   selectedColorPoint,
   textArray,
   cameraLight,
   solidColor,
   colorPoint,
   drawSelectablePolygon,
   pbrMaterial,
};