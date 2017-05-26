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
   }


   export() {
   }

   import(file) {
      const self = this;
      let reader = new FileReader();

      reader.onload = function(ev) {
         const text = reader.result;
         const mesh = self._import(text);
         const cage = Wings3D.apiExport.putIntoWorld(mesh);
         Wings3D.apiExport.undoQueue( new CreatePreviewCageCommand(cage) );
      }

      reader.readAsText(file);
   }
}