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
let _save = new Map;
async function save(evt, storer, ext, flag=0) {
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
      let button = document.getElementById('dropboxSave');
      if (button) {
         _save.set(button, Dropbox.setupSaveButton(button));
      }
      // setup local file store
      button = document.getElementById('localSave');
      if (button) {
         _save.set(button, function(storer, ext, flag) {
            const blob = storer();
            window.saveAs(blob, "untitled." + ext);                // local file save, should give user a chance to give a name
         });
      }
   }
      
   // now show dialog
   try {
      const [_form, button] = await UI.execDialog('#cloudSaveDialog', null);
      const save = _save.get(button);
      return save(storer, ext, flag); // should we await?
   } finally {
      return null;   // not saved, so no filename.
   }
};
function saveAs(evt, storer, ext) {
   save(evt, storer, ext, 1);
};
function exportAs(evt, storer, ext) {
   save(evt, storer, ext, 2);
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
      Dropbox.setupOpenButton(document.getElementById('dropboxOpen'));
      // setup local file open
      const fileInput = document.querySelector('#importFile');    // <input id="importFile" style="display:none;" type='file'>
      if (fileInput) {  // hidden open file dialog
         fileInput.addEventListener('change', function ok(_ev) {
            let fileList = this.files;    // = ev.target.files;
            for (let file of fileList) {
               CloudStorage.loader(file);
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
function importAs(loader) {

};


export {
   save,
   saveAs,
   exportAs,
   open,
   importAs,
}