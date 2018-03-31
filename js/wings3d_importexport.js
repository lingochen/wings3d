//
// file handling. 
// 1) handling local file upload. and simple file download.
// todo
// 2) dropbox, yandex.
// 3) google drive, microsoft onedrive, baidupan to come later.
//
import {PreviewCage, CreatePreviewCageCommand} from './wings3d_model';
import {WingedTopology} from './wings3d_wingededge';
import * as UI from './wings3d_ui';
import * as View from './wings3d_view';



class ImportExporter {
   constructor(importMenuText, exportMenuText) {
      const self = this;
      // plug into import/export menu
      if (importMenuText) {
         // first get import Submenu.
         UI.addMenuItem('#fileImport', '#import' + importMenuText, importMenuText, function(ev) {
               UI.openFile(function(file) { // open file Dialog, and retrive data
                     self.import(file);
                  });      
            });
      }
      if (exportMenuText) {
         UI.addMenuItem('#fileExport', '#export' + exportMenuText, exportMenuText, function(ev) {
            UI.runDialog('#exportFile', ev, function(data) {
               if (data['Filename']) {
                  self.export(data['Filename']);
               }
             });
         });
      }
      // init at beginning.
      this._reset();
   }


   export(filename) {
      const blob = this._export(View.getWorld());
      saveAs(blob, filename + '.' + this.extension());
   }

   import(file) {
      const self = this;
      let reader = new FileReader();

      reader.onload = function(ev) {
         const text = reader.result;
         const meshes = self._import(text);
         const cages = [];
         for (let mesh of meshes) {
            let cage = View.putIntoWorld(mesh);
            cages.push( new CreatePreviewCageCommand(cage) );
         }
         if (cages.length > 1) {
            // combo
            View.undoQueueCombo( cages );
         } else if (cages.length > 0) {
            View.undoQueue(cages[0]);
         }
         // after we finisehd _reset too.
         self._reset();
      }

      reader.readAsText(file);
   }

   _reset() {
      this.objs = [];
      this.obj = new WingedTopology;
      this.polygonCount = 0;
      this.vertexCount = 0;
      this.non_manifold = [];
   }
};

export {
   ImportExporter
};