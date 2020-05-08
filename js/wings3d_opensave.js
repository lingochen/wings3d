/**
 * wrapping up cloudStorage and local storage
 * 
 */

import * as UI from './wings3d_ui.js';
import * as CloudStorage from './storages/cloudstorage.js';
import * as Dropbox from './storages/dropboxstorage.js';
import * as OneDrive from './storages/onedrivestorage.js';


let _workingFiles = {selected:null, linked:new Map};
function setWorkingFiles(working) {
   _workingFiles = working;
   _lastSave = _workingSave;  // now we are sure open successfully.
};


function setFilter(extensions) {
   CloudStorage.setOptions({filter: extensions});
}

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
let _workingSave;
function reset() {
   _lastSave = _workingSave = null;
}
async function save(evt, flag) {
   // popup windows 
   if (!cloudSaveDialog) {
      cloudSaveDialog = document.getElementById('cloudSaveDialog');
      if (!cloudSaveDialog) {
         throw new Error('Error: no SaveDialog');
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
         _save.set(button, function(blob, ext, _flag) {
            window.saveAs(blob, "untitled." + ext);                // local file save, should give user a chance to give a name
         });
      }
   }
      
   // now show dialog
   let save = _lastSave;
   if ((flag > 0) || !save) {  // check if not saveAs && already saved.
      const [_form, button] = await UI.execDialog('#cloudSaveDialog', null);
      if (button.value === 'cancel') {
         throw new Error('cancel');
      }
      save = _save.get(button);  // get the save routine
   }
   if (flag < 2) {   // export() will not be reused.
      _lastSave = save;
   }
   return (storeObj, ext)=>{save(storeObj, ext, flag)};
};
 


let cloudOpenDialog;
let _open = new Map;
async function open(evt) {
   // popup windows 
   if (!cloudOpenDialog) {
      cloudOpenDialog = document.getElementById('cloudOpenDialog');
      if (!cloudOpenDialog) {
         throw new Error('no OpenDialog');
      }
      // first, setOptions
      setOptions();
      // now setup dropbox/onedrive/yandex/google/box/pcloud buttons
      let button = document.getElementById('dropboxOpen');
      if (button) {
         _open.set(button, Dropbox.setupOpenButton(button));
      }
      button = document.getElementById('onedriveOpen');
      if (button) {
         _open.set(button, OneDrive.setupOpenButton(button));
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
      throw new Error('cancel');
   }
   const [open, save] = _open.get(button);
   _workingSave = save;
   return open;
};


export {
   reset,
   setFilter,
   setWorkingFiles,
   save,
   //saveAs,
   open,
}