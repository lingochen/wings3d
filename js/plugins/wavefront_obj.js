//
// Wavefront Obj Loader and Writer.
//
//
import {ImportExporter} from "../wings3d_importexport";
import * as View from "../wings3d_view";


class WavefrontObjImportExporter extends ImportExporter {
   constructor() {
      super('Wavefront (.obj)...', 'Wavefront (.obj)...');
   }

   extension() {
      return "obj";
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
      const linesMatch = objText.match(/^([vfogs])(?:\s+(.+))$/gm);   //objText.match(/^v((?:\s+)[\d|\.|\+|\-|e|E]+){3}$/gm);

      if (linesMatch) {
         for (let line of linesMatch) {
            line = line.trim();            // how can we remove end of space in regex?
            let split = line.split(/\s+/);
            let tag = split.shift();
            if (typeof this[tag] === 'function') {
               this[tag](split);
            } else {
               console.log("unexpected tag: " + tag); // should not happened
            }
         }
         // done reading, return the object.
         return this.objs;
      }
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
      if (!this.objView) {
         this.objView = View.putIntoWorld();
         this.obj = this.objView.geometry;
         this.objs.push( this.objView );
      }
      // to be implemented later

   }

   s(groupNumber) {
      // to be implemented later
   }

   v(vertex) {
      // should we do error check?
      const vert = this.obj.addVertex(vertex);
      this.realVertices.push(vert.index);
      this.vertexCount++;
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
      let polygonIndex = this.obj.addPolygon(faceIndex);
      if (polygonIndex === null) {
         this.non_manifold.push( this.polygonCount );    // addup failure.
      }
      //if (!this.obj.sanityCheck()) {
      //   console.log("polygon # " + this.polygonCount + " not sane");
      //}
      this.polygonCount++;
   }
}


export {
   WavefrontObjImportExporter,
}