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
let _lastSave;
function reset() {
   _lastSave = null;
}
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
   let save = _lastSave;
   if ((flag > 0) || !save) {  // check if not saveAs && already saved.
      const [_form, button] = await UI.execDialog('#cloudSaveDialog', null);
      if (button.value === 'cancel') {
         return "";
      }
      save = _save.get(button);  // get the save routine
   }
   const ret = save(storer, ext, flag); // should we await?
   if (flag < 2) {   // export() will not be reused.
      _lastSave = save;
   }
   return ret;
};
 
let cloudOpenDialog;
let _open = new Map;
async function open(evt, loader, importFlag=0) {
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
      let button = document.getElementById('dropboxOpen');
      if (button) {
         _open.set(button, Dropbox.setupOpenButton(button));
      }
      // setup local file open
      button = document.getElementById('localOpen');
      if (button) {
         _open.set(button, [UI.openFileAsync, null]);
       }
   }

   // now show dialog
   const [_form, button] = await UI.execDialog('#cloudOpenDialog', null);
   if (button.value === "cancel") {
      return false;
   }
   const [open, save] = _open.get(button);
   const files = await open("");
   for (let file of files) {
      loader(file);
   }
   if (!importFlag) {   // import won't save fileName
      _lastSave = save;
   }
   return true;
};


export {
   save,
   open,
   reset,
}