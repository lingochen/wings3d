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

function open() {

};


export {
   save,
   open
}