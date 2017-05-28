//
// file handling. 
// 1) handling local file upload and download
// todo
// 2) dropbox, yandex.
// 3) google drive, microsoft onedrive, baidupan to come later.
//




class ImportExporter {
   constructor(importMenuText, exportMenuText) {
      const self = this;
      // plug into import/export menu
      if (importMenuText) {
         // first get import Submenu.
         const submenu = document.querySelector('#fileImport');
         // insert the menuItem 
         const menuItem = document.createElement('li');
         const a = document.createElement('a');
         const fileInput = document.createElement('input');    // <input type="file" id="wavefrontObj" style="display:none"/> 
         fileInput.setAttribute('type', 'file');
         fileInput.style.display = 'none';
         //a.setAttribute('onmouseover', '');
         a.textContent = importMenuText;
         // append to subment.
         menuItem.appendChild(fileInput);
         menuItem.appendChild(a);
         submenu.appendChild(menuItem);
         // capture click
         a.addEventListener('click', function(ev) {
            ev.preventDefault();
            fileInput.click();      // open file Dialog
         });
         fileInput.addEventListener('change', function(ev) {
            let fileList = this.files;    // = ev.target.files;
            for (let file of fileList) {
               self.import(file);
            }
         });
      }
      // init at beginning.
      this._reset();
   }


   export() {
   }

   import(file) {
      const self = this;
      let reader = new FileReader();

      reader.onload = function(ev) {
         const text = reader.result;
         const meshes = self._import(text);
         const cages = [];
         for (let mesh of meshes) {
            let cage = Wings3D.apiExport.putIntoWorld(mesh);
            cages.push( new CreatePreviewCageCommand(cage) );
         }
         if (cages.length > 1) {
            // combo
            Wings3D.apiExport.undoQueueCombo( cages );
         } else if (cages.length > 0) {
            Wings3D.apiExport.undoQueue(cages[0]);
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
}