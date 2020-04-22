//
// Wavefront Obj Loader and Writer.
//
//
import {ImportExporter} from "../wings3d_importexport.js";
import * as View from "../wings3d_view.js";
import {Material} from "../wings3d_material.js";
import * as UI from '../wings3d_ui.js';


class WavefrontObjImportExporter extends ImportExporter {
   constructor() {
      super(['Wavefront', 'obj'], ['Wavefront', 'obj']);
   }

   extension() {
      return "obj";
   }

   readAsText() {
      return true;
   }

   /**
    * 
    * @param {*} world - generator for iteration.
    */
   _export(world) {
      let idx = 1;      // obj index start at 1;
      const remap = new Map();

      let text = "#wings3d.net wavefront export\n";

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

      return blob;
   }

   _import(objText) {
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
         // done reading, return the object.
         return {world: this.objs, material: this.material};
      }
   }

   /**
    * reading auxiliary files, material, images.
    * nice asynchronous file reading.
    */
   _readAuxFiles() {
      for (let mtl of this.mtl) {   // read all material.
         UI.openFileAsync(mtl[0]).then((files)=>{
            let reader = new FileReader();
            reader.readAsText(files[0]);
            return new Promise((resolve, reject)=>{
               reader.onload = () => resolve(reader.result);
             });
          }).then((fileContent)=>{
            let reader = new WavefrontMtlImportExporter;
            reader.setMaterialCatalog(this.materialCatalog);
            reader._import(fileContent);
          });
      }
      super._readAuxFiles();  // load image if any
   }

   _reset() {
      super._reset();
      this.mtl = new Map;
   }

   o(objName) {
      this.objView = View.putIntoWorld();
      this.obj = this.objView.geometry;
      this.objs.push( this.objView );

      this.obj.clearAffected();
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

   vt(textureVert) {

   }

   /**
    * 
    * @param {*} index 
    */
   f(index) {
      const faceIndex = [];
      for (let i of index) {
         let split = i.split('/');
         let idx = split[0] - 1;          // convert 1-based index to 0-based index.
         if ( (idx >= 0) && (idx < this.obj.vertices.size)) {
            faceIndex.push( this.realVertices[idx] );
         } else {
            console.log("face index out of bound: " + idx);
         }
      }
      let polygonIndex = this.obj.addPolygon(faceIndex, this.currentMaterial);
      if (polygonIndex === null) {
         this.non_manifold.push( this.polygonCount );    // addup failure.
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
         material = Material.create(materialName);
         this.materialCatalog.set(materialName, material);
      }
      this.currentMaterial = material;
   }

   mtllib(libraries) {
      for (let lib of libraries) {
         this.mtl.set(lib, null);   // adds up
      }
   }
}

// wavefront materialLib reader
class WavefrontMtlImportExporter extends ImportExporter {
   constructor() {
      //super('Wavefront (.mtl)...', 'Wavefront (.mtl)...');
      super(null, null);
      this.library = new Map;
   }

   extension() {
      return "mtl";
   }

   setMaterialCatalog(catalog) {
      this.catalog = catalog;
   }

   _import(mtlText) {
      this._reset();
      // break the objText to lines we needs.
      const linesMatch = mtlText.match(/^(newmtl|Ka|Kd|Ks|Ns|Tr|d|illum)(?:\s+(.+))$/gm);   //objText.match(/^v((?:\s+)[\d|\.|\+|\-|e|E]+){3}$/gm);

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
               pbr.setPBR( Material.convertTraditionalToMetallicRoughness(material) );
            }
         }

         // done reading, return the object.
         return {}; //{world: this.objs, material: this.material};    
      } 
   }

   /**
    * spec - "newmtl material_name"
    * @param {*} array - line split to component.
    */
   newmtl(array) {
      const materialName = array[1];
      this.currentMaterial = {diffuseMaterial: [0.78, 0.81, 0.69], //Util.hexToRGB("#C9CFB1"),    // color, old style to be deleted.
                              ambientMaterial: [0.78, 0.81, 0.69], //Util.hexToRGB("#C9CFB1"),    // color
                              specularMaterial: [0, 0, 0],   // color
                              emissionMaterial: [0, 0, 0],   // color
                             };
      this.library.set(materialName, this.currentMaterial);
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
      this.currentMaterial.ambientMaterial = this._parseRGB(ambient);
   }

   Kd(diffuse) {
      this.currentMaterial.diffuseMaterial = this._parseRGB(diffuse);
   }

   /**
    * specular color "Ks r g b"
    * @param {*} specular - rgb color is floating point.
    */
   Ks(specular) {
      this.currentMaterial.specularMaterial = this._parseRGB(specular);
   }

   /**
    * specular exponent "Ns exponent"- exponent range (0, 1000) - convert to 0-1.0
    * @param {*} exponent - line split
    */
   Ns(exponent) {
      let shine = (parseFloat(exponent[1]) || 0.0) / 1000.0;
      this.currentMaterial.shininessMaterial = Math.min(1.0, Math.max(0.0, shine))
   }

   /**
    * transparent. fully opaque = 1.0, 
    * @param {*} array 
    */
   d(opacity) {
      this.currentMaterial.opacityMaterial = parseFloat(opacity[1]) || 1.0;
   }

   /**
    * transparent, other implementation. Tr = 1-d
    * @param {*} array 
    */
   Tr(transparent) {
      this.currentMaterial.opacityMaterial = 1 - (parseFloat(transparent[1]) || 0.0);
   }

   /**
    * 
    * @param {*} number - which illumination shader.
    */
   illum(number) {

   }

}

export {
   WavefrontObjImportExporter,
   WavefrontMtlImportExporter,
}