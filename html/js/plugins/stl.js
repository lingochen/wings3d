//
// stl Loader and Writer.
//
//
import {ImportExporter} from "../wings3d_importexport.js";
import * as UI from "../wings3d_ui.js";
import * as View from "../wings3d_view.js";

function VerticesHelper(geometry, unify) {
   if (unify) {
      const vertices = new Map;
      return (vertex) => {
         let test = vertex.join();
         let pos = vertices.get(test);
         if (pos === undefined) {  // add to position if unique.
            pos = geometry.addVertex(vertex).index;   // z-up? todo: configurable options.
            vertices.set(test, pos);
         }
         return pos;
      }
   } else {
      return (vertex) => {
         return geometry.addVertex(vertex).index;
      };
   }
}


class STLImportExporter extends ImportExporter {
   constructor() {
      super(['STereoLithography', 'stl']);
   }
   
   extension() {
      return "stl";
   }

   readAsText() {
      return false;
   }

   /**
    * 
    * @param {*} data - arraybuffer
    */
   async _import(data) {   //
      // ask for unifying and z-up options first.
      const [form, answer] = await UI.execDialog('#askStlDialog', (form)=>{
         for (let [key, value] of Object.entries(STLImportExporter.options)) {
            let element = form[key];
            if (element) {
               element.checked = value;
            }
         }
       });
      if (answer.value === "ok") {  // get setting.
         for (let [key, _value] of Object.entries(STLImportExporter.options)) {
            let element = form[key];
            if (element) {
               STLImportExporter.options[key] = element.checked;
            }
         }
      }

      this.objs = [];
      const reader = new DataView(data);
      if (this._isBinary(reader)) {
         // binary .stl
         const cage = this._parseBinary(reader);
         if (cage) {
            cage.name = 'stlmesh';  // probably should get it from filename?
            this.objs.push(cage);
         }
      } else { // ASCII .stl, convert to string
         const decoder = new TextDecoder();  // default is 'utf-8'
         let decodedString = decoder.decode(reader);
         // load multiple solids because it actually exists in the wild.
         const solidPattern = /solid (\S*)([\S\s]*)endsolid[ ]*(\S*)/g;
         let matches;
         while (matches = solidPattern.exec(decodedString)) {
            let meshName = matches[1];
            const meshNameFromEnd = matches[3];
            if (meshName != meshNameFromEnd) {
               console.log(`Error in STL, solid ${meshName} != endsolid ${meshNameFromEnd}`);
            }
            // stl mesh name can be empty as well
            const cage = this._parseASCII(matches[2]);
            if (cage) {
               cage.name = meshName || "stlmesh";     // stl mesh name can be empty as well
               this.objs.push(cage);
            }
         }
      }
      // stl does not contain material
      return {world: this.objs, materialCatalog: []};
   }

   /** 
    * should we do this to check binary?
    * https://stackoverflow.com/questions/26171521/verifying-that-an-stl-file-is-ascii-or-binary
    */
   _isBinary(reader) {
      /*const check = "solid ";
      let i = 0;
      for (; i < check.length; i++) {
         if (reader.getUint8(i) !== check[i]) {
            break; 
         }
      }*/
      //if (i < check.length) { // yep, not ASCII 
         // check if file size is correct for binary stl
         const faceSize = (32 / 8 * 3) + ((32 / 8 * 3) * 3) + (16 / 8);
         const nTriangles = reader.getUint32(80, true);
         const fileLength = reader.byteLength;
         if (80 + (32 / 8) + (nTriangles * faceSize) === fileLength) {
            return true;
         }
      //}
      // not binary, let ASCII handle it.
      return false;
   }

   _addVertex(vertex) {
      if (STLImportExporter.options.unify) {

      } else {
         return this.obj.addVertex(vertex).index;
      }
   }

   /**
    * 
    * @param {*} solidData - a PreviewCage of triangle soup.
    */
   _parseASCII(solidData) {
      this.objView = View.putIntoWorld();
      this.obj = this.objView.geometry;

      const addVertex = VerticesHelper(this.obj, STLImportExporter.options.unify);
      const indices = [0, 1, 2];
      let index = 0;
      // we are only interest in vertex, and since everything is triangle, we can just ignore facet, outerloop. we compute our own normal.
      let vertexPattern = /vertex(?:\s+(.+))$/gm;
      let line;
      while (line = vertexPattern.exec(solidData)) {
         let vertex = line[1].match(/\S+/g).map(Number);   // get [x,y,z]
         if (STLImportExporter.options.zup) {
            let z = vertex[1];
            vertex[1] = vertex[2];
            vertex[2] = -z;
         }
         // addVertex and build index 
         indices[index++] = addVertex(vertex);
         if (index >= 3) { // ok, now we have triangle
            index = 0;
            if (!this.obj.addPolygon(indices)) {   // failed: non-manifold
               this.non_manifold.push( indices.slice() );
            }
         }
      }
      // ok, done. now return
      this.obj.clearAffected();

      return this.objView;
   }

   /**
    * 
    * @param {*} reader - pass in blobReader 
    */
   _parseBinary(reader) {
      this.objView = View.putIntoWorld();
      this.obj = this.objView.geometry;

      const addVertex = VerticesHelper(this.obj, STLImportExporter.options.unify);
      const faces = reader.getUint32(80, true);
      const dataOffset = 84;
      const faceLength = 12 * 4 + 2;
      let indices = [0, 0, 0];
      const vertex = [0, 0, 0];
      for (let face = 0; face < faces; face++) {
         let vertexStart = dataOffset + face * faceLength + 12;
         for (let i = 0; i < 3; i++, vertexStart+=12) {
            vertex[0] = reader.getFloat32(vertexStart, true);
            if (STLImportExporter.options.zup) {
               vertex[1] = reader.getFloat32(vertexStart + 8, true);
               vertex[2] = -reader.getFloat32(vertexStart + 4, true);
            } else {
               vertex[1] = reader.getFloat32(vertexStart + 4, true);
               vertex[2] = reader.getFloat32(vertexStart + 8, true);
            }
            indices[i] = addVertex(vertex);
         }
         if (!this.obj.addPolygon(indices)) {
            this.non_manifold.push( indices.slice() );
         }
      }
      // ok, done. now return
      this.obj.clearAffected();

      return this.objView;
   }
}
STLImportExporter.options = {unify: true, zup: true};

export {
   STLImportExporter
}
