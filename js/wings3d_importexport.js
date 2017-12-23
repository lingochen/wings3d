//
// file handling. 
// 1) handling local file upload. and simple file download.
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
            let target = ev.target;
            while ( target = target.parentNode ) {
               if ( target.classList && target.classList.contains("hover") ) {
                 target.classList.remove("hover");
                 break;
               }
            }
         });
         fileInput.addEventListener('change', function(ev) {
            let fileList = this.files;    // = ev.target.files;
            for (let file of fileList) {
               self.import(file);
            }
         });
      }
      if (exportMenuText) {
         const submenu = document.querySelector('#fileExport');
         // insert simple menuItem.
         const menuItem = document.createElement('li');
         const a = document.createElement('a');
         a.textContent = exportMenuText;
         menuItem.appendChild(a);
         submenu.appendChild(menuItem);
         const form = Wings3D.setupDialog('#exportFile', function(data) {
            if (data['Filename']) {
               self.export(data['Filename']);
            }
         });

         if (form) {
            menuItem.addEventListener('click', function(ev){
               let target = ev.target;
               while ( target = target.parentNode ) {
                  if ( target.classList && target.classList.contains("hover") ) {
                    target.classList.remove("hover");
                    break;
                  }
               }
               // popup dialog.
               // position then show form;
               Wings3D.contextmenu.positionDom(form, Wings3D.contextmenu.getPosition(ev));
               form.style.display = 'block';
               form.reset();
            });
         }
      }
      // init at beginning.
      this._reset();
   }


   export(filename) {
      const blob = this._export(Wings3D.apiExport.getWorld());
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

export {
   ImportExporter
}