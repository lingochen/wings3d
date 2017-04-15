/*
//
//     Append a few utilities and convenience functions. Probably going to rename to glu?
//
*/
"use strict";

function createWebGLContext(canvasID, attrib) {
   var gl = undefined;
   var _pvt = {currentShader: null};

   // initialization
   var canvas = document.getElementById(canvasID);
   if (!canvas) {
      return null;
   }
      
   attrib = typeof attrib !== 'undefined' ? attrib : { depth: true, stencil: true, antialias: true };
//   gl = canvas.getContext("webgl2", attrib);
//   if (!gl) {
      gl = canvas.getContext("webgl", attrib) || canvas.getContext("experimental-webgl", attrib);
      if (gl) {
         // init_extensions(), init_restrictions()
         gl.getExtension("OES_standard_derivatives"); // webgl2 is standard.
         console.log("WebGL 1 init with extension");
      } else {
         alert("Unable to initialize WebGL");
         return null;
      }
//   } else {
//      console.log("WebGL 2 init successful");
//   }


   // make sure webgl framebuffer size matched real canvas size.
   gl.resizeToDisplaySize = function() {
      var canvas = gl.canvas;
      var displayWidth = canvas.clientWidth;
      var displayHeight = canvas.clientHeight;
      if (canvas.width != displayWidth ||
          canvas.height != displayHeight) {
         canvas.width = displayWidth;
         canvas.height = displayHeight;     
         gl.viewport(0, 0, displayWidth, displayHeight);
         return true;
      }
      return false;
   };
   gl.resizeToDisplaySize();

   // setup variables
   gl.projection = mat4.create();
   gl.modelView = mat4.create();

   // binder
   _pvt.transform = {
      projection: function(gl, loc) {
         gl.uniformMatrix4fv(loc, false, gl.projection);
      },
      worldView: function(gl, loc) {
         gl.uniformMatrix4fv(loc, false, gl.modelView);
      },
   };

   // utility functions
   // move from wings3d.wm.
   // return int32array[0,0, width, height] ...etc.
   gl.getViewport = function() {
      return gl.getParameter(gl.VIEWPORT);
   };
   // project() transform objectSpace vert to screenSpace,
   //   return vec4. vec4[3] == 0 meant failure, problems with input projection.
   gl.project = function(objx, objy, objz, modelview, projection) {
      //Transformation vectors
      var input = vec4.fromValues(objx, objy, objz, 1.0);
          out = vec4.create();
      //Modelview transform
      vec4.transformMat4(out, input, modelView);
      //Projection transform, 
      vec4.transformMat4(input, out, projection);
      if(input[3] == 0.0) {//The w value
         return input;
      }
      //Perspective division
      input[0] /= input[3];
      input[1] /= input[3];
      input[2] /= input[3];
      var viewport = gl.getViewport();
      //screenCoordinate, Map x, y to range 0-1
      out[0]=(input[0]*0.5+0.5)*viewport[2]+viewport[0];
      out[1]=(input[1]*0.5+0.5)*viewport[3]+viewport[1];
      //This is only correct when glDepthRange(0.0, 1.0)
      out[2]=input[2]*0.5 + 0.5;	//Between 0 and 1
      out[3]=1.0;             // out[w] determined success or failure.
      return out;
  };

   gl.unProject = function(winx, winy, winz, modelview, projection, viewport) {
      //Transformation matrices
      var final = mat4.create(),
          input = vec4.create(),
          out = vec4.create();
      //Calculation for inverting a matrix, compute projection x modelview
      //and store in A[16]
      mat4.multiply(final, projection, modelview);
      //Now compute the inverse of matrix A
      if(mat4.invert(final, final)==null) {
         out[3]=0.0;
         return out;
      }
      var viewport = gl.getViewport();
      //Transformation of normalized coordinates between -1 and 1
      input[0]=(winx-viewport[0])/viewport[2]*2.0 - 1.0;
      input[1]=(winy-viewport[1])/viewport[3]*2.0 - 1.0;
      input[2]=2.0*winz-1.0;
      input[3]=1.0;
      //Objects coordinates
      vec4.transformMat4(out, input, final);
      if(out[3]==0.0) {
         return out;
      }
      out[0]/=out[3];
      out[1]/=out[3];
      out[2]/=out[3];
      out[3] =1.0;
      return out;
   };
   gl.transformVertex = function(vertex4) {
       var out = vec4.create();
       return vec4.transformMat4(out, vec4.transformMat4(out, vertex4, gl.modelView), gl.projection);
   };

   // shader, programs.
   gl.compileGLSL = function(vshader, fshader) {
      // compile vertex and fragment shader
      var vertexShader = gl.loadShader(gl.VERTEX_SHADER, vshader);
      if (!vertexShader) {
         console.log("failed to compile vertex shader");
         return null;
      }
      var fragmentShader = gl.loadShader(gl.FRAGMENT_SHADER, fshader);
      if (!fragmentShader) {
         console.log("failed to compile fragment shader");
         return null;
      }

      // get program, attach, link
      var progHandle = gl.createProgram();
      gl.attachShader(progHandle, vertexShader);
      gl.attachShader(progHandle, fragmentShader);
      gl.linkProgram(progHandle);

      // check for error
      var linked = gl.getProgramParameter(progHandle, gl.LINK_STATUS);
      if (!linked) {
         var error = gl.getProgramInfoLog(progHandle);
         console.log('failed to link program: ' + error);
         gl.deleteProgram(progHandle);
         gl.deleteShader(fragmentShader);
         gl.deleteShader(vertexShader);
         return null;
      }
      return progHandle;
   };

   gl.loadShader = function(shaderType, shaderSource) {
      // createShader always work unless shaderType is wrong?
      var shaderHandle = gl.createShader(shaderType);

      // loading shaderSource then compile shader.
      gl.shaderSource(shaderHandle, shaderSource);
      gl.compileShader(shaderHandle);

      // check for successful compilation.
      var compiled = gl.getShaderParameter(shaderHandle, gl.COMPILE_STATUS);
      if (!compiled) {
         var error = gl.getShaderInfoLog(shaderHandle);
         console.log('failed to compile shader: ' + error);
         gl.deleteShader(shaderHandle);
         return null;
      }
      return shaderHandle;
   };

   gl.createShaderProgram = function(vShader, fShader) {
      var progHandle = gl.compileGLSL(vShader, fShader);
      if (progHandle) {
         var info;
         var attribute = {};
         var numCount = gl.getProgramParameter(progHandle, gl.ACTIVE_ATTRIBUTES);
         for (var i = 0; i < numCount; ++i) {
            info = gl.getActiveAttrib(progHandle, i);
            if (!info){
               console.log("Something wrong, getActiveAttrib failed");
               return null;
            }
            attribute[info.name] = {loc: gl.getAttribLocation(progHandle, info.name), type: info.type};
         }
         var uniform = {};
         var transform = {world: null, worldView: null, worldViewProjection: null, view: null, projection: null};
         numCount = gl.getProgramParameter(progHandle, gl.ACTIVE_UNIFORMS);
         for (i = 0; i < numCount; ++i) {
            info  = gl.getActiveUniform(progHandle, i);
            if (!info) {
               console.log("Something wrong, getActiveUniform failed");
               return null;
            }
            // check if it belongs to transform?
            if (transform.hasOwnProperty(info.name)) {
               transform[info.name] = gl.getUniformLocation(progHandle, info.name);
            } else {
               // check for array suffix?
               uniform[info.name] = {loc: gl.getUniformLocation(progHandle, info.name),
                                     size: info.size, type: info.type};
            }
         }
         return new ShaderProgram(progHandle, transform, attribute, uniform);
      }
      
   };

   // return buffer Handle.
   gl.createBufferHandle = function(typedArray, type = gl.ARRAY_BUFFER, draw = gl.STATIC_DRAW) {
      if (ArrayBuffer.isView(typedArray)) {
         var handle = gl.createBuffer();
         gl.bindBuffer(type, handle);
         gl.bufferData(type, typedArray, draw);
         gl.bindBuffer(type, null);
         return handle;
      } else {
         console.log("not typedArray");
         return null;
      }
   };

   gl.setBufferAndAttrib = function(handle, position, size=3) {
      gl.bindBuffer(gl.ARRAY_BUFFER, handle);
      gl.vertexAttribPointer(position, size, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(position);
   };
   
   gl.bindAttributeToProgram = function(progLoc, attrib) {
      gl.bindBuffer(attrib.target, attrib.handle);
      gl.vertexAttribPointer(progLoc, attrib.size, attrib.type, attrib.normalized, attrib.stride, attrib.offset);
      gl.enableVertexAttribArray(progLoc);
   }

   gl.bindShaderData = function(data, useIndex=true) {
      // using current setShader, set shader, set indexbuffer
      _pvt.currentShader.bindAttribute(gl, data.attribute);
      _pvt.currentShader.bindUniform(gl, data.uniform);
      if (useIndex && typeof(data.index)!=="undefined" && data.index !== null) {
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, data.index.handle);
      }
   };

   gl.bindTransform = function() {
      // current shader, set current transform
      _pvt.currentShader.bindTransform(gl, _pvt.transform);
   };
   gl.pushTransform = function(matrix) {

   };
   gl.popTransform = function() {
      // restore transform
   };
   gl.useShader = function(shader) {
      _pvt.currentShader = shader;
      gl.useProgram(shader.progHandle);
   };
   gl.disableShader = function() {
      // disable vertex attribute array
      if (_pvt.currentShader) {
         _pvt.currentShader.disableVertexAttributeArray(gl);
      }
   };

   gl.drawVertex =  function(drawObject) {
      gl.bindTransform();
      gl.bindShaderData(drawObject.shaderData, false);
      drawObject.drawVertex(gl);
   };

   gl.drawSelect = function(drawObject) {
      gl.bindTransform();
      drawObject.bindSelectorShaderData(gl);
      drawObject.drawSelect(gl);
   };

   gl.createShaderData = function() {
      return new ShaderData();
   };

   return gl;
};



//
// define ShaderProgram, ShaderData.
//

/**input to ShaderProgram.
 */
var ShaderData = function() {
   this.attribute = {};
   this.uniform = {};
};

ShaderData.attribLayout = function(attribSize=3, attribType=Wings3D.gl.FLOAT, normalized=false, stride=0, offset=0) {
   return {size: attribSize, type: attribType, normalized: normalized, stride: stride, offset: offset};
}


ShaderData.prototype.createAttribute = function(name, target, buffLength, usage, layout) {
   if (!this.attribute[name]) {
      var gl = Wings3D.gl;
      var handle = gl.createBuffer();
      gl.bindBuffer(target, handle);
      gl.bufferData(target, buffLength, usage);
      this.attribute[name] = {handle: handle,
                              length: buffLength,
                              target: target,
                              //usage: usage,
                              size: layout.attribSize,
                              type: layout.attribType,
                              normalized: layout.normalized,
                              stride: layout.stride,
                              offset: layout.offset
                             };
   } else {
      console.log("Shader Data: " + name + " already initialized");
   }
};

ShaderData.prototype.deleteAttribute = function(name) {
   var attribute = this.attribute[name];
   if (attribute) {
      Wings3D.gl.deleteBuffer(attribute.handle);
      this.attribute[name] = null;
   }
};

ShaderData.prototype.freeAllAttributes = function() {
   var removeList = [];
   for (var key in this.attribute) {
      removeList.push(key);
   }
   for (var i = 0; i < removeList.length; ++i) {
      this.deleteAttribute(removeList[i]);
   }
};

ShaderData.prototype.resizeAttribute = function(name, buffLength) {
   var attrib = this.attribute[name];
   if (attrib && attrib.buffLength != buffLength) {
      var gl = Wings3D.gl;
      gl.bindBuffer(attrib.target, attrib.handle);
      gl.bufferData(attrib.target, buffLength, attrib.usage);
      attrib.buffLength = buffLength;
   }
};

ShaderData.prototype.uploadAttribute = function(name, byteOffset, typedArray)  {
   var attrb = this.attribute[name];
   if (attrib) {
      var gl = Wings3D.gl;
      gl.bindBuffer(attrib.target, attrb.handle);
      gl.bufferSubData(attrib.target, byteOffset, typedArray);
   } else {
      console.log("Shader Data: " + name + " not initialized");
   }
};

//ShaderData.prototype.setAttribute = function(name, value) {
//};
// index is used for drawElement, not used for input to shaderProgram
ShaderData.prototype.setIndex = function(index) {
   if ((typeof(this.index)!=="undefined") && (this.index !== null)) {
      Wings3D.gl.deleteBuffer(this.index.handle);
   }
   if (index !== null) {
      var handle = Wings3D.gl.createBufferHandle(index, Wings3D.gl.ELEMENT_ARRAY_BUFFER);
      this.index = {handle: handle, binder: function(gl, handle) {
                                              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, handle);
                                            }};
   }
};


// expect, float32array, vec3 data type. convenient functions
ShaderData.prototype.setPosition = function(arry, size=3) {
   this.setAttribute('position', arry, size);
};

ShaderData.prototype.setColor = function(data, size=3) {
   this.setAttribute('color', data, size);
};


ShaderData.prototype.setAttribute = function(name, arry, size=3) {
   if (typeof(this.attribute[name]) !== "undefined" && this.attribute[name] !== null) {
      // free gpu handle. todo, if size is smaller or equal, just do subdata to write the data
      Wings3D.gl.deleteBuffer(this.attribute[name].handle);
   }
   if (arry !== null) { // create new gpu handle
      var handle = Wings3D.gl.createBufferHandle(arry);
      this.attribute[name] = {handle: handle,
                              length: arry.length,
                              size: size,
                              binder: ShaderData.setAttributeFn,
                             };
   }
};

ShaderData.setAttributeFn = function(gl, loc, bufferHndl, size) {
   gl.setBufferAndAttrib(bufferHndl, loc, size);
};

// expect, float32array, convenience functions
ShaderData.prototype.updatePosition = function(data, byteoffset=0) {
   this.updateAttribute('position', byteoffset, data);
};

ShaderData.prototype.updateColor = function(data, byteoffset=0) {
   this.updateAttribute('color', byteoffset, data);
};

ShaderData.prototype.updateAttribute = function(name, byteoffset, data)  {
   var attrb = this.attribute[name];
   if (typeof(attrb) !== "undefined" && attrb !== null) {
      Wings3D.gl.bindBuffer(Wings3D.gl.ARRAY_BUFFER, attrb.handle);
      Wings3D.gl.bufferSubData(Wings3D.gl.ARRAY_BUFFER, byteoffset, data);
   } else {
      console.log("Shader Data: " + name + " not initialized");
   }
}

ShaderData.prototype.setUniform3fv = function(name, arry3) {   // 3fv === vec3
   this.uniform[name] = {value: new Float32Array(arry3), binder: ShaderData.uniform3fvFn};
};

ShaderData.uniform3fvFn = function(gl, loc, value) {
   gl.uniform3fv(loc, value);
}; 

ShaderData.prototype.setUniform4fv = function(name, arry4) {
   this.uniform[name] = {value: new Float32Array(arry4), binder: ShaderData.uniform4fvFn};
};

ShaderData.uniform4fvFn = function(gl, loc, value) {
   gl.uniform4fv(loc, value);
};

// a few predefine var. 
//        attributes: ["position", "normal", "uv"],
//        uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"] ? how about inverse?
var ShaderProgram = function(progHandle, transform, attribute, uniform) {
   this.progHandle = progHandle;
   this.transform = transform;
   this.attribute = attribute;
   this.uniform = uniform;
};

ShaderProgram.prototype.disableVertexAttributeArray = function(gl) {
   for (var key in this.attribute) {
      if (this.attribute.hasOwnProperty(key)) {
         gl.disableVertexAttribArray(this.attribute[key].loc);
      }
   }
};

ShaderProgram.prototype.bindAttribute = function(gl, attribute) {
   try {
   for (var key in this.attribute) {
      if (attribute.hasOwnProperty(key)) {   // don't need to check this.attribute' inherited property, cannot possibley exist
         var attrb = attribute[key];
         if (attrb.binder) {
            attrb.binder(gl, this.attribute[key].loc, attrb.handle, attrb.size);
         } else {
            gl.bindAttributeToProgram(this.attribute[key].loc, attrb);
         }
      } else {
         // don't have property. console.log?
         console.log("shaderData don't have shader attribute: " + key);
      }
   }
   }
   catch (e) {
      console.log(e);
   }
};

ShaderProgram.prototype.bindUniform = function(gl, uniform) {
   try {
   for (var key in this.uniform) {
      if (uniform.hasOwnProperty(key)) {
         var uni = uniform[key];
         uni.binder(gl, this.uniform[key].loc, uni.value);
      } else {
         // don't have property. console.log?
      }
   }
   }
   catch (e) {
      console.log(e);
   }
};

ShaderProgram.prototype.bindTransform = function(gl, transform) {
   try {
     for (var key in this.transform) {
      if (transform.hasOwnProperty(key)) {
         var binder = transform[key];
         binder(gl, this.transform[key]);
      }
   } 
   }
   catch (e) {
      console.log(e);
   }
};

ShaderProgram.prototype.getTypeByName = function(type) {
/*	  var FLOAT = 0x1406;
	  var FLOAT_VEC2 = 0x8B50;
	  var FLOAT_VEC3 = 0x8B51;
	  var FLOAT_VEC4 = 0x8B52;
	  var INT = 0x1404;
	  var INT_VEC2 = 0x8B53;
	  var INT_VEC3 = 0x8B54;
	  var INT_VEC4 = 0x8B55;
	  var BOOL = 0x8B56;
	  var BOOL_VEC2 = 0x8B57;
	  var BOOL_VEC3 = 0x8B58;
	  var BOOL_VEC4 = 0x8B59;
	  var FLOAT_MAT2 = 0x8B5A;
	  var FLOAT_MAT3 = 0x8B5B;
	  var FLOAT_MAT4 = 0x8B5C;
	  var SAMPLER_2D = 0x8B5E;
	  var SAMPLER_CUBE = 0x8B60;
	  var SAMPLER_3D = 0x8B5F;
	  var SAMPLER_2D_SHADOW = 0x8B62;
	  var FLOAT_MAT2x3 = 0x8B65;
	  var FLOAT_MAT2x4 = 0x8B66;
	  var FLOAT_MAT3x2 = 0x8B67;
	  var FLOAT_MAT3x4 = 0x8B68;
	  var FLOAT_MAT4x2 = 0x8B69;
	  var FLOAT_MAT4x3 = 0x8B6A;
	  var SAMPLER_2D_ARRAY = 0x8DC1;
	  var SAMPLER_2D_ARRAY_SHADOW = 0x8DC4;
	  var SAMPLER_CUBE_SHADOW = 0x8DC5;
	  var UNSIGNED_INT = 0x1405;
	  var UNSIGNED_INT_VEC2 = 0x8DC6;
	  var UNSIGNED_INT_VEC3 = 0x8DC7;
	  var UNSIGNED_INT_VEC4 = 0x8DC8;
	  var INT_SAMPLER_2D = 0x8DCA;
	  var INT_SAMPLER_3D = 0x8DCB;
	  var INT_SAMPLER_CUBE = 0x8DCC;
	  var INT_SAMPLER_2D_ARRAY = 0x8DCF;
	  var UNSIGNED_INT_SAMPLER_2D = 0x8DD2;
	  var UNSIGNED_INT_SAMPLER_3D = 0x8DD3;
	  var UNSIGNED_INT_SAMPLER_CUBE = 0x8DD4;
	  var UNSIGNED_INT_SAMPLER_2D_ARRAY = 0x8DD7;

	  var TEXTURE_2D = 0x0DE1;
	  var TEXTURE_CUBE_MAP = 0x8513;
	  var TEXTURE_3D = 0x806F;
	  var TEXTURE_2D_ARRAY = 0x8C1A;*/

};
