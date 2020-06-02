/**
 * GLTF 2 - loader/writer
 * 
 */

import {ImportExporter} from "../wings3d_importexport.js";
import * as View from "../wings3d_view.js";
import {Material} from "../wings3d_material.js";
import * as UI from '../wings3d_ui.js';
import { PreviewCage } from "../wings3d_model.js";


const COMPONENT_TYPES = {
   5120: Int8Array,
   5121: Uint8Array,
   5122: Int16Array,
   5123: Uint16Array,
   5125: Uint32Array,
   5126: Float32Array
};
/*const COMPONENT_VIEWS = {
   5120: Int8View,
   5121: Uint8View,
   5122: Int16View,
   5123: Uint16View,
   5125: Uint32View,
   5126: Float32View
};*/
const TYPE_SIZES = {
   'SCALAR': 1,
   'VEC2': 2,
   'VEC3': 3,
   'VEC4': 4,
   'MAT2': 4,
   'MAT3': 9,
   'MAT4': 16
};

class GLTFImportExporter extends ImportExporter {
   constructor() {
      super(['GLTF', 'gltf'], ['GLTF', 'gltf']);
      this.cache = {};
   }

   extension() {
      return "gltf";
   }

   fileTypes() {
      return ['gltf', 'glb'];
   }

   _reset() {
      super._reset();
      this.def = new Map;
      this.count = {appearance: 0, cage: 0};
   }

   /**
    * 
    * @param {*} text - file content as text.
    * 		path: path || this.resourcePath || '',
				crossOrigin: this.crossOrigin,
				manager: this.manager
    */
   async _import(content) {
      this.json = JSON.parse( content );
      this.vertex = new Map;

      if ( this.json.asset === undefined || this.json.asset.version[ 0 ] < 2 ) {
         throw new Errorrror( 'Unsupported asset. glTF versions >=2.0 are supported.' );
      } if (this.json.scene === undefined) {
         throw new Error("No Scene");
      }

      // async pre load all buffers, images(texture) first.
      this.loadBuffers();

      // load (scenes, nodes, meshes, material)
      this._parse('scenes', this.json.scene);1
   }

   async _parse(tag, index) {
      if (typeof this[tag] === 'function') {
         if (index === "undefined") {  // impossible, throw error
            console.log("no index");
         } else {
            let ret; 
            if (this.cache[tag] === undefined) {
               this.cache[tag] = new Map;
            } else {
               ret = this.cache[tag].get(index);  // check if in cache
            }
            if (ret === undefined) {
               const data = this.json[tag] || [];
               if (data.length > index) {// check index is within range
                  ret = await this[tag](data[index]);
                  this.cache[tag].set(index, ret);
               } else { // throw error

               }
            }
            return ret;
         }
      }
   }

   
   loadBuffers() { // iterate over buffers.// _loadArrayBuffer(buffer.uri, loadArrayBufferCallback);
      const buffers = this.json.buffers || [];

      this.cache.buffers = new Map;
      let index = 0;
      for (let buffer of buffers) {  
         this.cache.buffers.set(index++, this.buffers(buffer));
      }  
   }

   async loadURI(url) {
      if (url === undefined) {
      }

      return fetch(url)
             .then(res =>{return res.arrayBuffer();});
   }

   async getBuffer(index) {
      if (index < 0 || index >= this.cache.buffers.length) {
         throw new Error("out of range buffer index");
      }

      let ret = this.cache.buffers.get(index);
      if (!(ret instanceof ArrayBuffer)) {   // await our promise to return ArrayBuffer.
         ret = await ret;
         this.cache.buffers.set(index, ret);
      }
      return ret;
   }

   buffers(buffer) { // loadarraybuffer
      return this.loadURI(buffer.uri);
   }

   async loadImage(image) {
      return new Promise(function(resolve){

       });
   }

   parseTexture(texture) {

   }


   /**
    * https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
    * @param {*} material 
    */
   materials(material) {
      const ret = Material.create(material.name || "NoName");
      const metal = material.pbrMetallicRoughness;
      if (metal) {
         const pbr = {};
         if (Array.isArray(metal.baseColorFactor)) {
            pbr.baseColor = [metal.baseColorFactor[0], metal.baseColorFactor[1], metal.baseColorFactor[2]];
            pbr.opacity = metal.baseColorFactor[3];
         }
         if (metal.metallicFactor) pbr.metallic = metal.metallicFactor;   // already have default
         if (metal.roughness) pbr.roughness = metal.roughnessFactor; // already have default
         ret.setValues(pbr);
      }
      /** todo:
      material.normalTexture = undefined;
      material.occlusionTexture = undefined;
      material.emissiveTexture = undefined;
      material.emissiveFactor = vec3.fromValues(0, 0, 0);
      material.alphaMode = "OPAQUE";
      material.alphaCutoff = 0.5;
      material.doubleSided = false;*/
      return ret;
   }

   async accessors(accessor) {   // return typedarray: todo: how to solved interleaved one
      const itemSize = TYPE_SIZES[accessor.type];
      const TypedArray = COMPONENT_TYPES[accessor.componentType];
      if (!TypedArray || !itemSize) {
         // throw?   
      }
      const bufferView = await this._parse("bufferViews", accessor.bufferView);
      const itemBytes = TypedArray.BYTES_PER_ELEMENT * itemSize;
      const byteOffset = (accessor.byteOffset || 0) + (bufferView.byteOffset || 0);
      const byteStride = bufferView.byteStride || itemBytes;
      const arrayLength = accessor.count * itemSize;
      if (byteStride !== itemBytes) {  // interleaved array
         throw new UserException('No interleaved array support'); // todo: get support
      } else {
         return new TypedArray( bufferView.buffer, byteOffset, arrayLength);
      }
   }

   async bufferViews(view) {  // load cached buffer
      //view.buffer = undefined;
      //view.byteOffset = 0;
      //view.byteLength = undefined;
      //view.byteStride = 0;
      //view.target = undefined;
      //view.name = undefined;
      view.buffer = await this.getBuffer(view.buffer);
      return view;
   }

   addTriangles(index, pos, material) {
      if (index) {
         for (let i = 0; i < index.length; i+=3) {
            this.geometry.addPolygon([pos[index[i]], pos[index[i+1]], pos[index[i+2]]], material);
         }
      } else { // array of triangles, no index.

      }
   }

   async meshes(mesh) {
      const ret = View.putIntoWorld();
      this.geometry = ret.geometry;
      for (let primitive of mesh.primitives) {
         const attr = primitive.attributes || {};
         let index = await this._parse('accessors', primitive.indices);
         let material = await this._parse('materials', primitive.material);
         
         // position
         let position = await this._parse('accessors', attr.POSITION);
         let pos = this.vertex.get(position);
         if (pos === undefined) { 
            pos = [];
            for (let i = 0; i < position.length; i+=3) {
               pos.push( this.geometry.addVertex([position[i], position[i+1], position[i+2]]).index );
            }
            this.vertex.set(position, pos);
         }
         // texcoord, todo.

         if ((primitive.mode === undefined) || (primitive.mode === 4)) {   // only mode 4 currently
            this.addTriangles(index, pos, material);
         }  // todo: mode 5, mode 6
      }
      ret.updateAffected();
      return ret;
   }

   async nodes(node) {
      // recursive load children if any
      if (node.children !== undefined) {
         let group = View.createGroup(node.name);
         for (let child of node.children) {
            await this._parse('nodes', child);
            //group.insert( await this._parse('nodes', child) );
         }
         return group;
      } else {
         if (node.mesh !== undefined) {
            return await this._parse('meshes', node.mesh);
         }
      }
      return null;
   }

   scenes(scene) {   // load scene, using nodes
      //this.scene = View.putIntoWorld();
      for (let i of scene.nodes) {
         this._parse("nodes", i);
      }
      //return this.scene;
      return null;
   }

};

export {
   GLTFImportExporter
}

/* CONSTANTS 

	var WEBGL_CONSTANTS = {
		FLOAT: 5126,
		//FLOAT_MAT2: 35674,
		FLOAT_MAT3: 35675,
		FLOAT_MAT4: 35676,
		FLOAT_VEC2: 35664,
		FLOAT_VEC3: 35665,
		FLOAT_VEC4: 35666,
		LINEAR: 9729,
		REPEAT: 10497,
		SAMPLER_2D: 35678,
		POINTS: 0,
		LINES: 1,
		LINE_LOOP: 2,
		LINE_STRIP: 3,
		TRIANGLES: 4,
		TRIANGLE_STRIP: 5,
		TRIANGLE_FAN: 6,
		UNSIGNED_BYTE: 5121,
		UNSIGNED_SHORT: 5123
	};



	var WEBGL_FILTERS = {
		9728: THREE.NearestFilter,
		9729: THREE.LinearFilter,
		9984: THREE.NearestMipmapNearestFilter,
		9985: THREE.LinearMipmapNearestFilter,
		9986: THREE.NearestMipmapLinearFilter,
		9987: THREE.LinearMipmapLinearFilter
	};

	var WEBGL_WRAPPINGS = {
		33071: THREE.ClampToEdgeWrapping,
		33648: THREE.MirroredRepeatWrapping,
		10497: THREE.RepeatWrapping
	};



	var ATTRIBUTES = {
		POSITION: 'position',
		NORMAL: 'normal',
		TANGENT: 'tangent',
		TEXCOORD_0: 'uv',
		TEXCOORD_1: 'uv2',
		COLOR_0: 'color',
		WEIGHTS_0: 'skinWeight',
		JOINTS_0: 'skinIndex',
	};

	var PATH_PROPERTIES = {
		scale: 'scale',
		translation: 'position',
		rotation: 'quaternion',
		weights: 'morphTargetInfluences'
	};

	var INTERPOLATION = {
		CUBICSPLINE: undefined, // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
		                        // keyframe track will be initialized with a default interpolation type, then modified.
		LINEAR: THREE.InterpolateLinear,
		STEP: THREE.InterpolateDiscrete
	};

	var ALPHA_MODES = {
		OPAQUE: 'OPAQUE',
		MASK: 'MASK',
		BLEND: 'BLEND'
	};

	var MIME_TYPE_FORMATS = {
		'image/png': THREE.RGBAFormat,
		'image/jpeg': THREE.RGBFormat
	};

*/