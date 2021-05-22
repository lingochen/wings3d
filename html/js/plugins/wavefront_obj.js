//
// Wavefront Obj Loader and Writer.
//
//
import {ImportExporter} from "../wings3d_importexport.js";
import * as View from "../wings3d_view.js";
import {Material} from "../wings3d_material.js";
import {Attribute} from "../wings3d_wingededge.js";
import {getFilenameAndExtension} from "../storages/cloudstorage.js";
import * as UI from '../wings3d_ui.js';


class WavefrontObjImportExporter extends ImportExporter {
   constructor() {
      super(['Wavefront', 'obj'], ['Wavefront', 'obj']);
   }

   extension() {
      return "obj";
   }

   fileTypes() {
      return ['obj'];
   }

   _reset() {
      super._reset();
      this.mtl = new Map;
   }

   /**
    * 
    * @param {*} world - generator for iteration.
    */
   async _export(world, rootName) {
      let idx = 1;      // obj index start at 1;
      const remap = new Map();

      let text = "#wings3d.net wavefront export\n";
          text += `mtllib ${rootName}.mtl\n`;
      let materialCatalog = new Set;
      for (const cage of world) {
         const mesh = cage.geometry;
         text += "o " + cage.name + "\n";
         // now append the "v x y z\n"
         text += "\n#vertex total " + mesh.vertices.size + "\n";
         for (let vertex of mesh.vertices) {
            text += "v " + vertex[0] + " " + vertex[1] + " " + vertex[2] + "\n";
            if (!remap.has(vertex.index)) { // this should always true for now(2019/02/14), but not after we refactor to take care of non-manifold mesh
               remap.set(vertex.index, idx++);
            }
         }
         // sort by material.
         const materialList = new Map;
         for (let polygon of mesh.faces) {
            materialCatalog.add(polygon.material);
            let array = materialList.get(polygon.material);
            if (!array) {
               array = [];
               materialList.set(polygon.material, array);
            }
            array.push(polygon);
         }
         // now write out polygons grouping by material
         for (let [material, polygonArray] of materialList) {
            text += `\nusemtl ${material.name}\n`;
            // "f index+1 index+1 index+1"
            text += "#face list total " + polygonArray.length + "\n";
            for (let polygon of polygonArray) {
               text += "f";
               for (let hEdge of polygon.hEdges()) {
                  text += " " + remap.get(hEdge.origin.index);
               }
               text += "\n";
            }            
         }

      }
      const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
      const extBlob = WavefrontMtlImportExporter.exportBlob(materialCatalog);

      return [blob, {ext: 'mtl', blob: extBlob}];
   }

   async _import(file) {
      const objText = await file.text();
      // break the objText to lines we needs.
      const linesMatch = objText.match(/^([vfogs]|vt|usemtl|mtllib)(?:\s+(.+))$/gm);   //objText.match(/^v((?:\s+)[\d|\.|\+|\-|e|E]+){3}$/gm);

      if (linesMatch) {
         for (let line of linesMatch) {
            let split = line.match(/\S+/g);            // === line.trim().split(/\s+/);
            let tag = split.shift();
            if (typeof this[tag] === 'function') {
               this[tag](split);
            } else {
               console.log("unexpected tag: " + tag); // should not happened
            }
         }
         this._readAuxFiles();
         // done reading, return the object.
         return {world: this.objs, materialCatalog: Array.from(this.materialCatalog.values())};
      }
      return null;
   }

   /**
    * reading auxiliary files, material, images.
    * nice asynchronous file reading.
    */
   _readAuxFiles() {
      const linkedFiles = this.workingFiles.linked;
      const materialCatalog = this.materialCatalog;

      for (let mtl of this.mtl) {   // read all material.
         this.loadAsync(mtl[0]).then((files)=>{
            const reader = new WavefrontMtlImportExporter;
            reader.setMaterialCatalog(materialCatalog);
            reader.import(files, this.loadAsync);
            linkedFiles.set(mtl[0], files[0]);
          });
      }
      super._readAuxFiles();  // load image if any
   }

   o(objName) {
      this.objView = View.putIntoWorld();
      this.obj = this.objView.geometry;
      this.objs.push( this.objView );

      //this.obj.clearAffected();
      // assignedName
      this.objView.name = objName;
   }

   /**
    * how do we handle group? what is a group? needs to find out.
    * @param {*} groupNames 
    */
   g(groupNames) {
      //if (groupNames && (groupNames !== "(null)")) { // group is like object, except for empty and (null)
         if (!this.objView) {
            this.objView = View.putIntoWorld();
            this.obj = this.objView.geometry;
            this.objs.push( this.objView );
         }
      //}
   }

   s(groupNumber) {  // smooth group. probably not applicable ?
      // to be implemented later
   }

   v(vertex) {
      // should we do error check?
      const vert = this.obj.addVertex(vertex.slice(0,3));   // meshlab produced vertex with color. we want to support this tool
      this.realVertices.push(vert.index);
      this.vertexCount++;
   }

   vt(texCoord) {
      const index = Attribute.uv.reserve();
      this.texCoords.push(index);
      Attribute.uv.setChannel(index, 0, texCoord.slice(0,2));
   }

   /**
    * 
    * @param {*} index 
    */
   f(index) {
      const faceIndex = [];
      const uvIndex = [];
      for (let i of index) {
         let split = i.split('/');
         let idx = split[0] - 1;          // convert 1-based index to 0-based index.
         if (split.length > 1) {
            let uv = split[1] - 1;
            uvIndex.push(this.texCoords[uv]);
         }
         if ( (idx >= 0) && (idx < this.realVertices.length)) {
            faceIndex.push( this.realVertices[idx] );
         } else {
            console.log("face index out of bound: " + idx);
         }
      }
      let polygon = this.obj.addPolygon(faceIndex, this.currentMaterial);
      if (polygon === null) {
         this.non_manifold.push( this.polygonCount );    // addup failure.
      } else {
         let hEdge = polygon.halfEdge;
         if ((uvIndex.length > 0) && (uvIndex.length === faceIndex.length)) {
            for (let i = 0; i < uvIndex.length; ++i)  {
               hEdge.setUV(uvIndex[i]);
               hEdge = hEdge.next;
            }
         }
      }
      //if (!this.obj.sanityCheck()) {
      //   console.log("polygon # " + this.polygonCount + " not sane");
      //}
      this.polygonCount++;
   }

   usemtl(mat) {
      const materialName = mat[0];
      let material = this.materialCatalog.get(materialName);
      if (!material) {
         material = this.createMaterial(materialName);
         this.materialCatalog.set(materialName, material);
      }
      this.currentMaterial = material;
   }

   /**
    * hackup support for escape white space file name
    */
   mtllib(libraries) {
      let hackUp = "";
      for (let lib of libraries) {
         if (lib[lib.length-1] === '\\') {   // check if escape char at end;
            hackUp += lib.replace(/.$/," ");     // replace with white space
         } else if (hackUp) {
            lib = hackUp + lib;
            hackUp = "";
         }
         if (!hackUp) {
            this.mtl.set(lib, null);   // adds up
         }
      }
   }
}

// wavefront materialLib reader
class WavefrontMtlImportExporter extends ImportExporter {
   constructor() {
      //super('Wavefront (.mtl)...', 'Wavefront (.mtl)...');
      super(null, null);
      this.library = new Map;
      this.textureLibrary = new Map;
   }

   extension() {
      return "mtl";
   }

   fileTypes() {
      return ['mtl'];
   }

   setMaterialCatalog(catalog) {
      this.catalog = catalog;
   }

   // http://exocortex.com/blog/extending_wavefront_mtl_to_support_pbr
   static exportBlob(materialList) {
      let text = "#wings3d.net wavefront export\n";
      for (let material of materialList) {
         text += `newmtl ${material.name}\n`;
         text += `Kd ${material.pbr.baseColor[0]} ${material.pbr.baseColor[1]} ${material.pbr.baseColor[2]}\n`;
         text += `Pr ${material.pbr.roughness}\n`;
         text += `Pm ${material.pbr.metallic}\n`;
         text += `Ke ${material.pbr.emission[0]} ${material.pbr.emission[1]} ${material.pbr.emission[2]}\n`;
         let transparency = 1.0-material.pbr.opacity;
         text += `Tf ${transparency}\n`;
      }

      const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
      return blob;
   }

   async _import(blob) {
      this._reset();
      const mtlText = await blob.text();
      // break the objText to lines we needs.
      const linesMatch = mtlText.match(/^(newmtl|Ka|Kd|Pr|Pm|ke|Ks|Ns|Tr|d|illum|map_Kd)(?:\s+(.+))$/gm);   //objText.match(/^v((?:\s+)[\d|\.|\+|\-|e|E]+){3}$/gm);

      if (linesMatch) {
         for (let line of linesMatch) {
            line = line.match(/\S+/g);            // === line.trim().split(/\s+/);
            let tag = line[0];
            this[tag](line);
         }
         // now copy the library to catalog
         for (let [name, material] of this.library) {
            const pbr = this.catalog.get(name);
            if (pbr) {
               pbr.setValues( Material.convertTraditionalToMetallicRoughness(material.material) );
               if (material.texture.baseColorTexture) {
                  pbr.baseColorTexture = material.texture.baseColorTexture;
               }
            }
         }

         // done reading, return the object.
         return {world: [], materialCatalog: []};   
      } 
   }

   /**
    * spec - "newmtl material_name"
    * @param {*} array - line split to component.
    */
   newmtl(array) {
      const materialName = array[1];
      this.current = {material: {diffuseMaterial: [0.78, 0.81, 0.69], //Util.hexToRGB("#C9CFB1"),    // color, old style to be deleted.
                                 ambientMaterial: [0.78, 0.81, 0.69], //Util.hexToRGB("#C9CFB1"),    // color
                                 specularMaterial: [0, 0, 0],   // color
                                 emissionMaterial: [0, 0, 0],   // color
                                 },
                      texture: {},
                             };
      this.library.set(materialName, this.current);
   }

   /**
    * we could use unary + operator, but parseFloat is clearer.
    * always return valid number.
    * @param {*} array - 3 number starting at index 1.
    */
   _parseRGB(array) {
      return [parseFloat(array[1]) || 0.0, parseFloat(array[2]) || 0.0, parseFloat(array[3]) || 0.0];
   }

   Ka(ambient) {
      this.current.material.ambientMaterial = this._parseRGB(ambient);
   }

   Kd(diffuse) {
      this.current.material.diffuseMaterial = this._parseRGB(diffuse);
   }

   Ke(emission) {
      this.current.material.emissionMaterial = this._parseRGB(emission);
   }

   /**
    * specular color "Ks r g b"
    * @param {*} specular - rgb color is floating point.
    */
   Ks(specular) {
      this.current.material.specularMaterial = this._parseRGB(specular);
   }

   /**
    * specular exponent "Ns exponent"- exponent range (0, 1000) - convert to 0-1.0
    * @param {*} exponent - line split
    */
   Ns(exponent) {
      let shine = (parseFloat(exponent[1]) || 0.0) / 1000.0;
      this.current.material.shininessMaterial = Math.min(1.0, Math.max(0.0, shine))
   }

   Pr(roughness) {
      this.current.material.roughnessMaterial = this._parseRGB(roughness);
   }

   Pm(metallic) {
      this.current.material.metallicMaterial = parseFloat(metallic) || 0.1;
   }

   /**
    * transparent. fully opaque = 1.0, 
    * @param {*} array 
    */
   d(opacity) {
      this.current.material.opacityMaterial = parseFloat(opacity[1]) || 1.0;
   }

   /**
    * transparent, other implementation. Tr = 1-d
    * @param {*} array 
    */
   Tr(transparent) {
      this.current.material.opacityMaterial = 1 - (parseFloat(transparent[1]) || 0.0);
   }

   /**
    * 
    * @param {*} number - which illumination shader.
    */
   illum(number) {

   }

   /**
    * paulbourke.net/dataformats/mtl
    * 
    * @param {*} - array
    */
   map_Kd(params) {
      function extractUV(index, values) {
         let u = values[index+1];
         let v = values[index+2];
         let w = values[index+3];
         let spliceOff = 4;
         if (isNaN(v)) {
            spliceOff = 2;
            v = 0;
         } else if (isNaN(w)) {
            spliceOff = 3;
         }
         values.splice(index, spliceOff);   // -s u v w
         return [u, v];
      };


      params.shift();
      const options = {};
      let pos = params.indexOf('-s');
      if (pos >= 0) {
         options.scale = extractUV(pos, params);
      }
      pos = params.indexOf('-o');
      if (pos >= 0) {
         options.offset = extractUV(pos, params);
      }
      pos = params.indexOf('-bm');
      if (pos >= 0) {
         options.bumpScale = parseFloat(params[pos+1]);
         params.splice(pos, 2);
      }
      pos = params.indexOf('-clamp');  // -clamp on|off
      if (pos >= 0) {
         if (params[pos+1].localeCompare('on') === 0) {
            options.wrapS = gl.CLAMP_TO_EDGE;
            options.wrapT = gl.CLAMP_TO_EDGE;
         }
         params.splice(pos, 2);
      }
      // ignore
      pos = params.indexOf('-t');   // -t u v w, turbulence for textures
      if (pos >= 0) {
         extractUV(pos, params);
      }
      for (const ignore of ['-cc', '-mm', 'imfchan', 'texres', 'blendu', 'blendv', '-boost']) {
         pos = params.indexOf(ignore);
         if (pos >= 0) {
            params.splice(pos, 2);
         }
      }

      const uri = params.join('').trim();    // 
      const filename = getFilenameAndExtension(uri).join('.');  // uri
      let texture = this.textureLibrary.get(filename)
      if (!texture) {
         texture = this.createTexture(filename, {flipY: true});
         this.loadAsync(uri) 
                        .then(files=>{
                            return files[0].image();
                        }).then(img=>{
                           img.onload = ()=>{
                              texture.setImage(img);
                           }
                           return img;
                        });
         this.textureLibrary.set(filename, texture);
      }
      this.current.texture.baseColorTexture = texture;
   }
}

export {
   WavefrontObjImportExporter,
   WavefrontMtlImportExporter,
}