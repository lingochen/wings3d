//
// Wavefront Obj Loader and Writer.
//
//


class WavefrontObjImportExporter extends ImportExporter {
   constructor() {
      super('Wavefront (.obj)...');
   }

   _import(objText) {
      // break the objText to lines we needs.
      const linesMatch = objText.match(/^([vfogs])(?:\s+(.+))$/gm);   //objText.match(/^v((?:\s+)[\d|\.|\+|\-|e|E]+){3}$/gm);

      if (linesMatch) {
         for (let line of linesMatch) {
            let split = line.split(/\s+/);
            let tag = split.shift();
            if (typeof this[tag] === 'function') {
               this[tag](split);
            } else {
               console.log("unexpected tag: " + tag);
            }
         }
         // done reading, return the object.
         return this.obj;
      }
   }

   o(objName) {
      if (this.obj) {   //

      }
      this.obj = new WingedTopology;
      // create new obj
      return objName;
   }

   g(groupNames) {

   }

   s(groupNumber) {

   }

   v(vertex) {
      // should we do error check?
      this.obj.addVertex(vertex);
   }

   f(index) {
      const faceIndex = [];
      for (let i of index) {
         let split = i.split('/');
         let idx = split[0] - 1;          // convert 1-based index to 0-based index.
         if ( (idx >= 0) && (idx < this.obj.vertices.length)) {
            faceIndex.push( idx );
         } else {
            console.log("face index out of bound: " + idx);
         }
      }
      this.obj.addPolygon(faceIndex);
   }
}

//document.addEventListener('DOMContentLoaded', function() {

//}, false);