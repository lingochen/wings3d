/**
 * wrapping up cloudStorage. 
 * 
 */

import * as UI from './wings3d_ui.js';
import * as CloudStorage from './storages/cloudstorage.js';
import * as Dropbox from './storages/dropboxstorage.js';

function setOptions() {
   let options = {
      success: function(file) {  
         //success handler  
      },
      progress: function(percent) { 
         //progress handler  
      },
      cancel: function() {  
         //cancel handler  
      },
      error: function (errorMessage) {

      }
   };
   CloudStorage.setOptions(options);
};

let cloudSaveDialog;
function save(evt, storeFn) {
   // popup windows 
   if (!cloudSaveDialog) {
      cloudSaveDialog = document.getElementById('cloudSaveDialog');
      if (!cloudSaveDialog) {
         alert('Error: no SaveDialog');
         return false;
      }
      // first, setOptions
      setOptions();
      // now setup dropbox/onedrive/yandex/google/box/pcloud buttons
      Dropbox.setupSaveButton(document.getElementById('dropboxSave'));
      // setup local file store
      const button = document.getElementById('localSave');
      button.addEventListener('click', function(evt) {
         /*UI.runDialog('#exportFile', ev, function(form) {
            const data = form.querySelector('input[name="Filename"');
            if (data) {
               loadStore.export(data.value);
            }
          });*/
          CloudStorage.storeObject(function(blob, filename) {
            saveAs(blob, filename);   // FileSaver.js
           });
       });
   }

   // store function callback. but we are doing repeatly, not good.
   CloudStorage.setStoreFn(storeFn);
   
   // now show dialog, 
   UI.runDialogCenter('#cloudSaveDialog', function() {}, null, evt);
};

let cloudOpenDialog;
function open(evt, loader) {
   // popup windows 
   if (!cloudOpenDialog) {
      cloudOpenDialog = document.getElementById('cloudOpenDialog');
      if (!cloudOpenDialog) {
         alert('Error: no OpenDialog');
         return false;
      }
      // first, setOptions
      setOptions();
      // now setup dropbox/onedrive/yandex/google/box/pcloud buttons
      //Dropbox.setupOpenButton(document.getElementById('dropboxOpen'));
      // setup local file open
      const fileInput = document.querySelector('#importFile');    // <input id="importFile" style="display:none;" type='file'>
      if (fileInput) {  // hidden open file dialog
         fileInput.addEventListener('change', function ok(_ev) {
            let fileList = this.files;    // = ev.target.files;
            for (let file of fileList) {
               CloudStorage.loader.import(file);
            }
            // reset value
            fileInput.value = "";
         });
         const button = document.getElementById('localOpen');
         if (button) {
            button.addEventListener('click', function(_evt) {
               fileInput.click();      // open file dialog.
             });
         }
      }
   }
   CloudStorage.setLoadFn(loader);

   // now show dialog, 
   UI.runDialogCenter('#cloudOpenDialog', function() {}, null, evt);
};


export {
   save,
   open
}