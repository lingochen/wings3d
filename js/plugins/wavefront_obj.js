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
      super('Wavefront (.obj)...', 'Wavefront (.obj)...');
   }

   extension() {
      return "obj";
   }

   readAsText() {
      return true;
   }

   _export(world) {      
      let text = "#wings3d-web wavefront export\n";
      const fn = function(vertex) {
         text += " " + (vertex.index+1);
      };
      for (const [index, cage] of world.entries()) {
         const mesh = cage.geometry;
         text += "o " + index.toString() + "\n";
         // now append the "v x y z\n"
         text += "\n#vertex total " + mesh.vertices.size + "\n";
         for (let vertex of mesh.vertices) {
            const vert = vertex.vertex;
            text += "v " + vert[0] + " " + vert[1] + " " + vert[2] + "\n";
         }
         // "f index+1 index+1 index+1"
         text += "\n#face list total " + mesh.faces.size + "\n";
         for (let polygon of mesh.faces) {
            text += "f";
            polygon.eachVertex(fn);
            text += "\n";
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
    * https://stackoverflow.com/questions/50485929/read-multiple-files-with-javascript-and-wait-for-result
    */
   _readAuxFiles() {
      const superReadAuxFiles = super._readAuxFiles.bind(this);

      UI.openMultipleFiles(this.mtl, (fileNameMap)=>{
         let promises = [];
         for (let [name, file] of fileNameMap) {
             let filePromise = new Promise(resolve => {
                 let reader = new FileReader();
                 reader.readAsText(file);
                 reader.onload = () => resolve(reader.result);
             });
             promises.push(filePromise);
         }

         Promise.all(promises).then(fileContents => {
            // parse mtl
            let reader = new WavefrontMtlImportExporter;
            reader.setMaterialCatalog(this.materialCatalog);
            for (let content of fileContents) {
               reader._import(content);
            }
            // load Images if any
            superReadAuxFiles();
          });
       });
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

   g(groupNames) {
      if (groupNames && (groupNames !== "(null)")) { // group is like object, except for empty and (null)
         if (!this.objView) {
            this.objView = View.putIntoWorld();
            this.obj = this.objView.geometry;
            this.objs.push( this.objView );
         }
      }
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
         // done reading, return the object.
         return {world: this.objs, material: this.material};    
      } 
   }

   /**
    * spec - "newmtl material_name"
    * @param {*} array - line split to component.
    */
   newmtl(array) {
      const materialName = array[1];
      this.currentMaterial = null;
      if (this.catalog) {
         this.currentMaterial = this.catalog.get(materialName); // get material by name.
      }
      if (!this.currentMaterial) {  // set, or reset material
         this.currentMaterial = Material.create(materialName);
         this.materialCatalog.set(materialName, this.currentMaterial);
      }
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
      this.currentMaterial.material.ambientMaterial = this._parseRGB(ambient);
   }

   Kd(diffuse) {
      this.currentMaterial.setDiffuse(this._parseRGB(diffuse));
   }

   /**
    * specular color "Ks r g b"
    * @param {*} specular - rgb color is floating point.
    */
   Ks(specular) {
      this.currentMaterial.material.specularMaterial = this._parseRGB(specular);
   }

   /**
    * specular exponent "Ns exponent"- exponent range (0, 1000)
    * @param {*} exponent - line split
    */
   Ns(exponent) {

   }

   /**
    * transparent. fully opaque = 1.0, 
    * @param {*} array 
    */
   d(opacity) {
      this.currentMaterial.material.opacityMaterial = parseFloat(opacity[1]) || 1.0;
   }

   /**
    * transparent, other implementation. Tr = 1-d
    * @param {*} array 
    */
   Tr(transparent) {
      this.currentMaterial.material.opacityMaterial = 1 - (parseFloat(transparent[1]) || 0.0);
   }

   /**
    * 
    * @param {*} number 
    */
   illum(number) {

   }

}

export {
   WavefrontObjImportExporter,
   WavefrontMtlImportExporter,
}