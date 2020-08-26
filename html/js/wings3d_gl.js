/*
//
//     Append a few utilities and convenience functions. now to es6 module.
//
*/
"use strict";

let gl = null;
function createWebGLContext(canvasID, attrib) {
   var _pvt = {currentShader: null};

   // initialization
   var canvas = document.getElementById(canvasID);
   if (!canvas) {
      return null;
   }
      
   attrib = typeof attrib !== 'undefined' ? attrib : { depth: true, stencil: true, antialias: true };
//   gl = canvas.getContext("webgl2", attrib);
//   if (!gl) {
      gl = canvas.getContext("webgl", attrib);
      if (gl) {
         // init_extensions(), init_restrictions()
         let ext = gl.getExtension("OES_standard_derivatives"); // in webgl2 is standard.
         if (ext === null) {
            console.log("No OES_standard_derivatives");
            return null;   
         }
         ext = gl.getExtension("OES_element_index_uint");
         if (ext === null) {
            console.log("No OES_element_index_uint");
            return null;
         }
         // require float texture
         ext = gl.getExtension('OES_texture_float');
         if (ext === null) {
            console.log("No floating texture");
            return null;
         }
         // require half-float texture
         ext = gl.getExtension('OES_texture_half_float');
         if (ext === null) {
            console.log("No half float texture");
            return null;
         }
         // require 4 vertex texture unit
         let units = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
         if (units < 8) {  // we need at least (pos, edgeState, faceState, groupState, materialColor, attributeColor, attributeNormal, attributeUV, baseColorTexture)?
            console.log("Only " + units + " vertex texture units available");
            return null;
         }
         // get textureSize
         gl.textureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
         console.log("WebGL 1 init with extension");
      } else {
         alert("Unable to initialize WebGL");
         return null;
      }
//   } else {
//      console.log("WebGL 2 init successful");
//   }

   // set unpack alignment to 1; 2019-09-29: solve graphics problem.
   gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
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
   //gl.resizeToDisplaySize();

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
   gl.project = function(objx, objy, objz, modelView, projection) {
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

   gl.unProject = function(winx, winy, winz, modelView, projection, viewport) {
      //Transformation matrices
      var final = mat4.create(),
          input = vec4.create(),
          out = vec4.create();
      //Calculation for inverting a matrix, compute projection x modelview
      //and store in A[16]
      mat4.multiply(final, projection, modelView);
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
               let name = info.name;
               // eliminate array suffix.
               if (name.substr(-3) === "[0]") {
                  name = name.substr(0, name.length - 3);
               }
               uniform[name] = {loc: gl.getUniformLocation(progHandle, info.name),
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
      gl.bindBuffer(gl.ARRAY_BUFFER, attrib.handle);
      gl.vertexAttribPointer(progLoc, attrib.size, attrib.type, attrib.normalized, attrib.stride, attrib.offset);
      gl.enableVertexAttribArray(progLoc);
   };

   /**
    * bind index to current drawing.
    * @param {shaderData} - gpu data.
    * @param {string} - name of index
    */
   gl.bindIndex = function(data, name) {
      const handle = data.index[name];
      if (handle) {
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, handle);
      }
   };

   /**
    * bind attribute to current program
    * @param {shaderData} - gpu data
    * @param {array of strings} - the name of attributes to binds to program.
    */
   gl.bindAttribute = function(data, names) {
      _pvt.currentShader.bindAttribute(gl, data.attribute, names);
   };

   /**
    * bind uniform to current program
    * @param {shaderData} - gpu data.
    * @param {array of strings} - the name of uniforms to bind to program
    */
   gl.bindUniform = function(data, names) {
      _pvt.currentShader.bindUniform(gl, data.uniform, names);
   }
/*   gl.bindShaderData = function(data, useIndex=true) {
      // using current setShader, set shader, set indexbuffer
      _pvt.currentShader.bindAttribute(gl, data.attribute);
      _pvt.currentShader.bindUniform(gl, data.uniform);
      if (useIndex && typeof(data.index)!=="undefined" && data.index !== null) {
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, data.index.handle);
      }
   }; */

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


/**
 * 
 * @param {gl.FORMAT} format - format's size, number from (1-4)
 */
function getFormat(formatSize) {
   if (formatSize === 1) {
      return gl.LUMINANCE;
   } else if (formatSize === 2) {
      return gl.LUMINACE_ALPHA;
   } else if (formatSize === 3) {
      return gl.RGB;
   } else if (formatSize === 4) {
      return gl.RGBA;
   }
   console.log(`unsupport format size: ${formatSize}`);
}

/**
 * use 2d texture as 1d texture buffer. it is used in vertex shader for vertex pulling drawing.
 */
const SamplerBuffer = function(handle, textureUnit, formatChannelCount, type) {
   this.handle = handle;
   this.format = getFormat(formatChannelCount);
   this.formatChannel = formatChannelCount;
   this.type = type;
   this.height = 0;        // width === gl.textureSize;
   this.unit = textureUnit;
};


/**
 * return bufferSize with padding
 * Params {int} bufferSize - the given sampler's size
 */
SamplerBuffer.getSize = function(bufferSize, formatChannels=1) {
   const height = Math.ceil(bufferSize / gl.textureSize);
   return gl.textureSize * height * formatChannels;
};


SamplerBuffer.prototype.getSize = function() {
   return gl.textureSize * this.height * this.formatChannel;
}

SamplerBuffer.prototype.deleteBuffer = function() {
   gl.deleteTexture(this.handle);
};

/**
 * 
 */
SamplerBuffer.prototype.bufferData = function(buffer) { //, srcOffset, length) {
   this.height = Math.ceil(buffer.length / this.formatChannel / gl.textureSize);
   // texImage
   gl.bindTexture(gl.TEXTURE_2D, this.handle);
   gl.texImage2D(gl.TEXTURE_2D, 0, this.format, gl.textureSize, this.height, 0, this.format, this.type, buffer);
   // no mipmap
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
};

/**
 * 
 */
SamplerBuffer.prototype.bufferSubData = function(formatOffset, buffer, srcOffset, length) {
   if (!srcOffset) {
      srcOffset = 0;
      if (!length) {
         length = buffer.length;
      }
   } else { // get new view(rectangle) of the buffer
      if (!length) {
         length = buffer.length - srcOffset;
      } else {
         let end = srcOffset+length;
         srcOffset = Math.floor(srcOffset/this.formatChannel) * this.formatChannel;   // pad to structure
         end = Math.ceil(end/this.formatChannel) * this.formatChannel; 
         length = end - srcOffset;
      }
   }

   // compute update rectangle.
   const formatLength = Math.ceil(length/this.formatChannel);
   const yOffset = Math.floor(formatOffset / gl.textureSize);
   const yEnd = Math.ceil((formatOffset+formatLength) / gl.textureSize);
   const height = yEnd - yOffset;
   let xOffset = 0;
   let width = gl.textureSize;
   if (height === 1) {  // optimize for 1 line.
      xOffset = formatOffset % gl.textureSize;
      width = formatLength;
      buffer = buffer.subarray(srcOffset, srcOffset+length);
   } else { // big rectangle.
      buffer = buffer.subarray(yOffset*width*this.formatChannel, yEnd*width*this.formatChannel);
   }
   // update subData rectangle.
   gl.bindTexture(gl.TEXTURE_2D, this.handle);
   gl.texSubImage2D(gl.TEXTURE_2D, 0, xOffset, yOffset, width, height, this.format, this.type, buffer);
   if (gl.getError() !== gl.NO_ERROR) {
      console.log("error");
   }
   // nomipmap
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
};





//
// define ShaderProgram, ShaderData.
//

/**input to ShaderProgram.
 */
const ShaderData = function() {
   this.attribute = {};
   this.uniform = {};
   this.index = {};
   this.sampler = {};
};

ShaderData.attribLayout = function(attribSize=3, attribType=gl.FLOAT, normalized=false, stride=0, offset=0) {
   return {size: attribSize, type: attribType, normalized: normalized, stride: stride, offset: offset};
}


ShaderData.prototype.setupAttribute = function(name, layout, buffer, usage) {
   this.createAttribute(name, layout, usage);
   this.resizeAttribute(name, buffer.byteLength);
   this.uploadAttribute(name, 0, buffer);
}

ShaderData.prototype.createAttribute = function(name, layout, usage) {
   if (!this.attribute[name]) {
      var handle = gl.createBuffer();
      this.attribute[name] = {handle: handle,
                              byteLength: 0,
                              usage: usage,
                              size: layout.size,
                              type: layout.type,
                              normalized: layout.normalized,
                              stride: layout.stride,
                              offset: layout.offset
                             };
   } else {
      console.log("Shader Data: " + name + " already initialized");
   }
};

ShaderData.prototype.resizeAttribute = function(name, byteLength) {//, usage) {
   var attrib = this.attribute[name];
   if (attrib && attrib.byteLength != byteLength) {
      gl.bindBuffer(gl.ARRAY_BUFFER, attrib.handle);
      gl.bufferData(gl.ARRAY_BUFFER, byteLength, attrib.usage);
      attrib.byteLength = byteLength;
   }
};

ShaderData.prototype.deleteAttribute = function(name) {
   var attribute = this.attribute[name];
   if (attribute) {
      gl.deleteBuffer(attribute.handle);
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


ShaderData.prototype.uploadAttribute = function(name, byteOffset, typedArray)  {
   var attrb = this.attribute[name];
   if (attrb) {
      gl.bindBuffer(gl.ARRAY_BUFFER, attrb.handle);
      gl.bufferSubData(gl.ARRAY_BUFFER, byteOffset, typedArray);
   } else {
      console.log("Shader Data: " + name + " not initialized");
   }
};

/**
 * flush to gpu as attribute if modified.
 */
ShaderData.prototype.updateAttribute = function(name, bufferObj) {
   if (bufferObj.gpuSize !== bufferObj.usedSize) {  // should we use buffer.length? 
      bufferObj.gpuSize = bufferObj.usedSize;
      this.resizeAttribute(name, bufferObj.usedSize*4);
      this.uploadAttribute(name, 0, bufferObj.buffer.subarray(0, bufferObj.usedSize));
      bufferObj._resetCounter(); // clear altered buffer.
   } else if (bufferObj.isAltered()) {
      this.uploadAttribute(name, bufferObj.alteredMin*4, bufferObj.buffer.subarray(bufferObj.alteredMin, bufferObj.alteredMax+1));
      bufferObj._resetCounter();
   }
};

/** 
 * index is used for drawElement
 * @param {string} - index name
 * @param {typedArray} - array of unsigned int
 */
ShaderData.prototype.createIndex = function(name) {
   let handle = this.index[name];
   if (!handle) {
      this.index[name] = gl.createBuffer();
   } else {
      console.log("Shader Index: " + name + " already initialized");
   }
};

ShaderData.prototype.updateIndex = function(name, bufferObj, triangleSize, usage=gl.STATIC_DRAW) {
   let handle = this.index[name];
   if (handle) {
      if (bufferObj.isLengthAltered()) {  // should we use buffer.length? 
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, handle);
         const source = bufferObj.buffer.subarray(0, bufferObj.usedSize);
         const array = new Uint32Array(source);
         for (let i = 2; i < array.length; i+=3) {
            if (source[i] < 0) {
               array[i] = (-source[i] - 1) + triangleSize;  // convert to positive
            }
         }
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, usage);
         bufferObj._resetCounter(); // clear altered buffer.
         bufferObj._resetLength();
      } else if (bufferObj.isAltered()) {
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, handle);
         const data = bufferObj.getChanged();
         const array = new Uint32Array(data.array);
         for (let i = 2; i < array.length; i+=3) {
            if (data.array[i] < 0) {
               array[i] = (-data.array[i] - 1) + triangleSize; // convert to positive 
            }
         }
         gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, data.byteOffset, array);
         bufferObj._resetCounter();
      }
   } else {
      console.log("unknown index: " + name);
   }
};


ShaderData.prototype.createSampler = function(name, textureUnit, format, type) {
   let sampler = null;
   if (!this.sampler[name]) {
      const handle = gl.createTexture();
      sampler = new SamplerBuffer(handle, textureUnit, format, type);
      this.sampler[name] = sampler;
      this.setUniformSampler(name, sampler); // sampler is also uniform
   } else {
      console.log("Shader Data: " + name + " already initialized");
   }
   return sampler;
};

ShaderData.prototype.getSampler = function(name) {
   return this.sampler[name];
};

ShaderData.prototype.updateSampler = function(name, bufferObj) {
   const sampler = this.getSampler(name);
   if (sampler) {
      const nameHeight = name + "Height";
      if (sampler.getSize() !== bufferObj.buffer.length) { // resize texture
         sampler.bufferData(bufferObj.buffer);
         bufferObj._resetCounter();
         this.setUniform1f(nameHeight, sampler.height);
      } else if (bufferObj.isAltered()) {  // needs to update?
         let interval = bufferObj.getInterval(sampler.formatChannel);
         sampler.bufferSubData(interval.start/sampler.formatChannel, bufferObj.buffer, interval.start, interval.end - interval.start);
         bufferObj._resetCounter();
      }
   } else {
      console.log("unknown sampler: " + name);
   }
};




ShaderData.prototype.setUniform1f = function(name, float) {
   this.uniform[name] = {value: new Float32Array(1), binder: ShaderData.uniform1fFn};
   this.uniform[name].value = float;
};

ShaderData.uniform1fFn = function(gl, loc, value) {
   gl.uniform1f(loc, value);
};

ShaderData.prototype.setUniform1fv = function(name, array) {
   const val =  {value: new Float32Array(array), binder: ShaderData.uniform1fvFn};
   this.uniform[name] = val;
};

ShaderData.uniform1fvFn = function(gl, loc, value) {
   try {
      gl.uniform1fv(loc, value);
   } catch (e) {
      console.log(e);
   }
}

ShaderData.prototype.setUniform3fv = function(name, arry3) {   // 3fv === vec3
   const val = {value: new Float32Array(arry3), binder: ShaderData.uniform3fvFn};
   this.uniform[name] = val;
};

ShaderData.uniform3fvFn = function(gl, loc, value) {
   gl.uniform3fv(loc, value);
}; 

ShaderData.prototype.setUniform4fv = function(name, arry4) {
   const val = {value: new Float32Array(arry4), binder: ShaderData.uniform4fvFn};
   this.uniform[name] = val;
};

ShaderData.uniform4fvFn = function(gl, loc, value) {
   gl.uniform4fv(loc, value);
};

ShaderData.prototype.setUniformSampler = function(name, sampler) {
   this.uniform[name] = {value: {unit: sampler.unit, 
                                 handle: sampler.handle}, 
                        binder: ShaderData.uniformSampler};
   // also bind "nameHeight".
   this.uniform[name+"Height"] = {value: sampler.height, binder: ShaderData.uniform1f};
};

/*ShaderData.unifomr1i = function(gl, loc, value) {
   gl.uniform1i(loc, value);
};*/

ShaderData.uniformSampler = function(gl, loc, value) {
  // Tell WebGL we want to affect texture unit (0+unit)
  gl.activeTexture(gl.TEXTURE0+value.unit);

  // Bind the texture to texture unit (0+unit)
  gl.bindTexture(gl.TEXTURE_2D, value.handle);

  // Tell the shader we bound the texture to texture unit (0+unit)
  gl.uniform1i(loc, value.unit);
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

ShaderProgram.prototype.bindAttribute = function(gl, attribute, names) {
   try {
      for (let key of names) {
         if (attribute.hasOwnProperty(key) && this.attribute.hasOwnProperty(key)) {   // don't need to check this.attribute' inherited property, cannot possibley exist
            const attrb = attribute[key];
            gl.bindAttributeToProgram(this.attribute[key].loc, attrb);
         } else {
            // don't have property. console.log?
            //console.log("shaderData don't have shader attribute: " + key);
         }
      }
   }
   catch (e) {
      console.log(e);
   }
};

ShaderProgram.prototype.bindUniform = function(gl, uniform, names) {
   try {
   for (let key of names) {
      if (uniform.hasOwnProperty(key) && this.uniform.hasOwnProperty(key)) {
         var uni = uniform[key];
         uni.binder(gl, this.uniform[key].loc, uni.value);
      } else {
         // don't have property. console.log?
         //console.log("shaderData don't have shader uniform: " + key);
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


const BufferObject = function(componentSize) {
   this.buffer = null;
   this.component = componentSize;
   this.usedSize = 0;
   this.gpuSize = 0;
   this.alteredMin = 0;
   this.alteredMax = -1;
};


BufferObject.prototype.byteLength = function() {
   return this.usedSize * this.byteSize();
};

BufferObject.prototype.getBuffer = function() {
   return this.buffer.subarray(0, this.usedSize);
};

// aligned to componentSize, much easier to reason about.
BufferObject.prototype.getChanged = function() {
   let start = Math.floor(this.alteredMin/this.component) * this.component;
   let end =  (Math.floor(this.alteredMax/this.component)+1) * this.component;
   return {byteOffset: start*this.byteSize(),
           array: this.buffer.subarray(start, end)};
};

BufferObject.prototype.getInterval = function(formatChannel) {
   const ret = {start: 0, end: 0};
   if (this.isAltered()) {
      ret.start = Math.floor(this.alteredMin/formatChannel) * formatChannel;
      ret.end =  (Math.floor(this.alteredMax/formatChannel)+1) * formatChannel;
   }
   return ret;
}


BufferObject.prototype.alloc = function() {
   const index = this.usedSize;
   this.usedSize += this.component;
   if (this.usedSize > this.buffer.length) {
      this.expand();
   }
   return index;
};

BufferObject.prototype.computeAllocateSize = function(size) {
   return Math.ceil(size / gl.textureSize) * gl.textureSize * this.component;
};

/**
 * expand by 1.5x.
 */
BufferObject.prototype.expand = function() {
   const oldSize = this.buffer.length;
   let newSize = Math.ceil((oldSize/this.component) * 1.5);
   // resize to larger by 1.5x;
   const oldBuffer = this.buffer;
   this.buffer = this._allocateBuffer(newSize);
   this.buffer.set(oldBuffer);
};

BufferObject.prototype.get = function(index) {
   return this.buffer[index];
}

BufferObject.prototype.set = function(index, newValue) {
   if (this.buffer[index] !== newValue) {
      this.buffer[index] = newValue;
      if (index < this.alteredMin) {
         this.alteredMin = index;
      }
      if (index > this.alteredMax) {
         this.alteredMax = index;
      }
      return true;
   }
   return false;
}

/**
 * after copying memory to gpu, reset the alteredXXX.
 */
BufferObject.prototype._resetCounter = function() {
   this.alteredMin = this.buffer ? this.buffer.length : 0;
   this.alteredMax = -1;
}

BufferObject.prototype._resetLength = function() {
   this.gpuSize = this.usedSize;
};

BufferObject.prototype.isAltered = function() {
   return (this.alteredMin <= this.alteredMax);
};

BufferObject.prototype.isLengthAltered = function() {
   return (this.gpuSize !== this.usedSize); 
};



const Float32Buffer = function(componentSize, allocationSize) {
   BufferObject.call(this, componentSize);
   if (!allocationSize) {
      allocationSize = gl.textureSize;
   }
   this.buffer = this._allocateBuffer(allocationSize);
};
Float32Buffer.prototype = Object.create(BufferObject.prototype);
Object.defineProperty(Float32Buffer.prototype, 'constructor', { 
   value: Float32Buffer,
   enumerable: false, // so that it does not appear in 'for in' loop
   writable: true });

Float32Buffer.prototype._allocateBuffer = function(size) {
   return new Float32Array(this.computeAllocateSize(size));
};

Float32Buffer.prototype.byteSize = function() {
   return 4;
};


const ByteBuffer = function(componentSize, allocationSize) {
   BufferObject.call(this, componentSize);
   if (!allocationSize) {
      allocationSize = gl.textureSize;
   }
   this.buffer = this._allocateBuffer(allocationSize);
};
ByteBuffer.prototype = Object.create(BufferObject.prototype);
Object.defineProperty(ByteBuffer.prototype, 'constructor', { 
   value: ByteBuffer,
   enumerable: false, // so that it does not appear in 'for in' loop
   writable: true });

ByteBuffer.prototype._allocateBuffer = function(size) {
   return new Uint8Array(this.computeAllocateSize(size));
};

ByteBuffer.prototype.byteSize = function() {
   return 1;
};


const Int32Buffer = function(componentSize, allocationSize) {
   BufferObject.call(this, componentSize);
   if (!allocationSize) {
      allocationSize = gl.textureSize;
   }
   this.buffer = this._allocateBuffer(allocationSize);
};
Int32Buffer.prototype = Object.create(BufferObject.prototype);
Object.defineProperty(Int32Buffer.prototype, 'constructor', { 
   value: Int32Buffer,
   enumerable: false, // so that it does not appear in 'for in' loop
   writable: true });

Int32Buffer.prototype._allocateBuffer = function(size) {
   return new Int32Array(this.computeAllocateSize(size));
};

Int32Buffer.prototype.byteSize = function() {
   return 4;
};


const Uint32Buffer = function(componentSize, allocationSize) {
   BufferObject.call(this, componentSize);
   if (!allocationSize) {
      allocationSize = gl.textureSize;
   }
   this.buffer = this._allocateBuffer(allocationSize);
};
Uint32Buffer.prototype = Object.create(BufferObject.prototype);
Object.defineProperty(Uint32Buffer.prototype, 'constructor', { 
   value: Uint32Buffer,
   enumerable: false, // so that it does not appear in 'for in' loop
   writable: true });

Uint32Buffer.prototype._allocateBuffer = function(size) {
   return new Uint32Array(this.computeAllocateSize(size));
};

Uint32Buffer.prototype.byteSize = function() {
   return 4;
}


/**
 * Candidate for WASM.
 * https://stackoverflow.com/questions/32633585/how-do-you-convert-to-half-floats-in-javascript
 */
const toHalf = (function() {
   let floatView = new Float32Array(1);
   let int32View = new Int32Array(floatView.buffer);
 
   /* This method is faster than the OpenEXR implementation (very often
    * used, eg. in Ogre), with the additional benefit of rounding, inspired
    * by James Tursa?s half-precision code. */
   return function toHalf(value) {
     floatView[0] = value;     // float32 conversion here
     var x = int32View[0];
 
     var bits = (x >> 16) & 0x8000; /* Get the sign */
     var m = (x >> 12) & 0x07ff; /* Keep one extra bit for rounding */
     var e = (x >> 23) & 0xff; /* Using int is faster here */
 
     /* If zero, or denormal, or exponent underflows too much for a denormal half, return signed zero. */
     if (e < 103) {
       return bits;
     }
 
     /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
     if (e > 142) {
       bits |= 0x7c00;
       /* If exponent was 0xff and one mantissa bit was set, it means NaN, not Inf, so make sure we set one mantissa bit too. */
       bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff);
       return bits;
     }
 
     /* If exponent underflows but not too much, return a denormal */
     if (e < 113) {
       m |= 0x0800;
       /* Extra rounding may overflow and set mantissa to 0 and exponent to 1, which is OK. */
       bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
       return bits;
     }
 
     bits |= ((e - 112) << 10) | (m >> 1);
     /* Extra rounding. An overflow will set mantissa to 0 and increment the exponent, which is OK. */
     bits += m & 1;
     return bits;
   }
}());

/**
 * 
 * https://stackoverflow.com/questions/5678432/decompressing-half-precision-floats-in-javascript
 */
const fromHalf = function(binary) {
   let exponent = (binary & 0x7C00) >> 10, 
       fraction = binary & 0x03FF;
   return (binary >> 15 ? -1 : 1) * 
           (exponent ? 
               (exponent === 0x1F ? (fraction ? NaN : Infinity) : Math.pow(2, exponent - 15) * (1 + fraction / 0x400)) 
               : 6.103515625e-5 * (fraction / 0x400)
            );
};


/**
 * AttributeBuffer. currently we have (normal, colorRGBA, uv(8)). todo: tangentBasis? joint? weight? 
 *  should be use by HalfEdge. in webgl1, we use float16 to store value.
 * rgb=(4)
 * normal=(4)
 * uv(4)=(8) - we could stuff extra UV under unused (normal[3], rgb[3]) for ambient textures? that uv(5)
 * 16 float16. 4(rgba)/attribute
 */
const AttributeBuffer = function(componentSize, allocationSize) {
   BufferObject.call(this, componentSize);
   if (!allocationSize) {
      allocationSize = gl.textureSize;
   }
   this.buffer = this._allocateBuffer(allocationSize);
   this.freePool = new Set;
   this.refCount = [];
};
AttributeBuffer.prototype = Object.create(BufferObject.prototype);
Object.defineProperty(AttributeBuffer.prototype, 'constructor', { 
   value: AttributeBuffer,
   enumerable: false, // so that it does not appear in 'for in' loop
   writable: true });

AttributeBuffer.prototype.reserve = function(delIndex) {
   if (delIndex) {
      if (!this.freePool.delete(delIndex)) {
         throw( new Error('non-existence deleted Index found: ' + delIndex) );
      }
      return delIndex;
   } else {
      let index;
      if (this.freePool.size > 0) {
         index = this.freePool.values().next().value;
         this.freePool.delete(index);
         this.refCount[index] = 0;  
      } else { // create new one.
         index = BufferObject.prototype.alloc.call(this) / this.component;
         this.refCount.push( 0 );
      }
      return index;
   }
};
AttributeBuffer.prototype.bind = function(index) {
   this.refCount[index]++;
};
AttributeBuffer.prototype.prune = function(index) {
   const refCount = --this.refCount[index];
   if (refCount === 0) {
      this.freePool.add(index);
   } else if (refCount < 0) {
      throw(new Error("RefCount error"));
   }
};
AttributeBuffer.prototype.pruneGet = function(oldIndex) {
   const asset = {index: oldIndex};
   if (this.prune(oldIndex)) {
      asset.value = this.create();
      this.getValue(oldIndex, asset.value);
   }
   return asset;
}
/*AttributeBuffer.prototype.getNormal = function(index) {
   index = index * AttributeBuffer.kSIZE + 3;
   return [fromHalf(this.buffer[index++]),
           fromHalf(this.buffer[index++]),
           fromHalf(this.buffer[index])];   
}
AttributeBuffer.prototype.setNormal = function(index, normal) {
   index = index * AttributeBuffer.kSIZE + 3;
   this.set(index++, toHalf(normal[0]) );
   this.set(index++, toHalf(normal[1]) );
   this.set(index,   toHalf(normal[2]) );   
}
*/


class ColorAttribute extends AttributeBuffer {
   constructor(allocationSize) {
      super(3, allocationSize);
   }

   _allocateBuffer(size) {
      return new Uint8Array(this.computeAllocateSize(size));
   };

   byteSize() {
      return 1;
   };
   
   create() {
      return [255, 255, 255];
   }
   
   setValue(index, rgb) {
      index = index * this.component;
      this.set(index++, rgb[0] );
      this.set(index++, rgb[1] );
      this.set(index,   rgb[2] );
   };
   
   getValue(index, rgb) {
      index = index * this.component;
      rgb[0] = this.buffer[index++];
      rgb[1] = this.buffer[index++];
      rgb[2] = this.buffer[index];
      return rgb;
   };

}



//NormalAttribute


class TexCoordAttribute extends AttributeBuffer {
   constructor(allocationSize) {
      super(8, allocationSize);
   }

   _allocateBuffer(size) {
      return new Uint16Array(this.computeAllocateSize(size));
   };

   byteSize() {
      return 2;
   };

   create() {
      return [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
   }

   getChannel(index, channel, value) {
      index = index * this.component + channel * 2;
      value[0] = fromHalf(this.buffer[index++]);
      value[1] = fromHalf(this.buffer[index]);   
   }

   getValue(index, value) {
      index = index * this.component;
      for (let i = 0; i < this.component; ++i) {
         value[i] = fromHalf(this.buffer[index+i]);
      }
   }

   setChannel(index, channel, uv) {
      index = index * AttributeBuffer.kSIZE + 6 + channel*2;
      this.set(index++, toHalf(uv[0]) );
      this.set(index,   toHalf(uv[1]) );
   };

   setValue(index, value) {
      index = index * this.component;
      for (let i = 0; i < this.component; ++i) {
         this.set(index+i, toHalf(value[i]));
      }
   }

};




/**
 * 
 * @param {number} type - manage the buffer here.
 */
const TriangleIndexBuffer = function() {
   this.freePool = [];
   this.array = new Uint32Array(3); 
};


/**
 * @param {number} size - return an array of given size for setting triangle index.
 */
TriangleIndexBuffer.prototype.alloc = function(size) {

};

TriangleIndexBuffer.prototype.free = function(indexArray) {

};

/**
 * @param {array} indexArray - an array that from alloc
 * @param {array} newVals - triangle index list correspond to the indexArray
 */
TriangleIndexBuffer.prototype.set = function(indexArray, newVals) {

};


export {
   createWebGLContext,
   ColorAttribute,
   TexCoordAttribute,
   TriangleIndexBuffer,
   Float32Buffer,
   Int32Buffer,
   Uint32Buffer,
   ByteBuffer,
   ShaderData,
   SamplerBuffer,
   ShaderProgram,
   gl
}
