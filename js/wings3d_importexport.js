//
// file handling. 
// 1) handling local file upload. and simple file download.
// todo
// 2) dropbox, yandex.
// 3) google drive, microsoft onedrive, baidupan to come later.
//
import {PreviewCage, CreatePreviewCageCommand} from './wings3d_model.js';
import {WingedTopology} from './wings3d_wingededge.js';
import {Material} from "./wings3d_material.js";
import * as View from './wings3d_view.js';



class ImportExporter {
   constructor(importMenuText, exportMenuText) {
      if (importMenuText) {
         this.importMenuText = {name: importMenuText[0],
                                ext: importMenuText[1]};
      }
      if (exportMenuText) {
         this.exportMenuText = {name: exportMenuText[0],
                                ext: exportMenuText[1]};
      }
   }

   export(world, filename) {
      this._reset();    // init before save.
      const blob = this._export(world);
      return {blob: blob, filename: filename + '.' + this.extension()};
   }

   import(file) {
      this._reset(); // init before import
      const self = this;
      let reader = new FileReader;
      
      reader.onload = function(ev) {
         const data = reader.result;
         self._import(data);
         const world = self.objs;
         const cages = [];
         for (let cage of world) {
            cages.push( new CreatePreviewCageCommand(cage) );
         }
         if (cages.length > 1) {
            // combo
            View.undoQueueCombo( cages );
         } else if (cages.length > 0) {
            View.undoQueue(cages[0]);
         }
         // put materialCatalog to UItree
         for (let [_name, material] of self.materialCatalog) {
            View.addMaterial(material);
         }
         // read associate Material/Images, if needed.
         self._readAuxFiles();
         // finalized and update
         View.updateWorld();
      }

      // non-blocking read.
      if (this.readAsText()) {   // to be implemented by subclass, either As binary or Text
         reader.readAsText(file);
      } else {
         reader.readAsArrayBuffer(file);
      }
   }

   /**
    * read images file.
    */
   _readAuxFiles() {

   }

   _reset() {
      this.objs = [];
      this.obj = null;
      this.objView = null;
      this.materialCatalog = new Map;
      this.currentMaterial = Material.default;
      this.realVertices = []; // convert index
      this.polygonCount = 0;
      this.vertexCount = 0;
      this.non_manifold = [];
   }


   static addLoadStore(loadStore) {
      if (loadStore.importMenuText || loadStore.exportMenuText) {
         ImportExporter.LOADSTORE.add(loadStore);
      }
   }

   static setDefault(loadstore) {
      if (ImportExporter.DEFAULT) {
         ImportExporter.LOADSTORE.add(ImportExporter.DEFAULT);
      }
      ImportExporter.DEFAULT = loadstore;
      // remove from LOADER, STORER.
      ImportExporter.LOADSTORE.delete(loadstore);
   }
};
ImportExporter.LOADSTORE = new Set;
ImportExporter.DEFAULT = null;

export {
   ImportExporter
};