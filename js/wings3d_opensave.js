/**
 * wrapping up cloudStorage and local storage
 * 
 */

import * as UI from './wings3d_ui.js';
import * as CloudStorage from './storages/cloudstorage.js';
import * as Dropbox from './storages/dropboxstorage.js';
import * as OneDrive from './storages/onedrivestorage.js';




class LocalFile extends CloudStorage.CloudFile {
   constructor(fileData) {
      super(fileData);
   }

   async upload(blob, _contentType) {
      const filename = this.file.name + '.' + this.file.ext;
      window.saveAs(blob, filename);
   }
};


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
let _lastSave = {};
let _workingSave = {};
function reset() {
   _lastSave = {};
   _workingSave = {};
}
function setWorkingFiles(working) {
   _lastSave = Object.assign(_workingSave, working);
   _workingSave = {};
};


async function saveAs(extension) {
   // popup windows 
   if (!cloudSaveDialog) {
      cloudSaveDialog = document.getElementById('cloudSaveDialog');
      if (!cloudSaveDialog) {
         throw new Error('No Save Dialog');
      }
      // first, setOptions
      setOptions();
      // now setup dropbox/onedrive/yandex/google/box/pcloud buttons
      let button = document.getElementById('dropboxSave');
      if (button) {
         _save.set(button, Dropbox.setupSaveButton(button));
      }
      button = document.getElementById('onedriveSave');
      if (button) {
         _save.set(button, OneDrive.setupSaveButton(button));
      }
      // setup local file store
      button = document.getElementById('localSave');
      if (button) {
         _save.set(button, [async function(fileInfo) {   // saveAs
            
            return new LocalFile(fileInfo);
           }, async function(filename) {                 // save

           }]                
          );
      }
   }
      
   // show save storage selection dialog
   const [_form, button] = await UI.execDialog('#cloudSaveDialog', null);
   if (button.value === 'cancel') {
      throw new Error('No storage selected');
   }
   let [saveAsFn, saveFn] = _save.get(button);  // get the save routine
   _workingSave.saveFn = saveFn;
   
   // now get saveAs filename if possible
   const fileInfo = {path: "", name: "default", ext: extension};
   if (_lastSave.selected) {
      fileInfo.name = _lastSave.selected.name().split('.').shift;
      fileInfo.path = _lastSave.selected.path();
   }
   // run the selected Storage's saveAs function.
   return saveAsFn(fileInfo).then(file=>{
      return [file, saveFn];
    });
};
/**
 * 
 */
async function save(extension) {
   if (_lastSave.selected) {
      return [_lastSave.selected, _lastSave.saveFn];
   } else {
      return saveAs(extension);
   }
};
 


let cloudOpenDialog;
let _open = new Map;
async function open(extension) {
   // popup windows 
   if (!cloudOpenDialog) {
      cloudOpenDialog = document.getElementById('cloudOpenDialog');
      if (!cloudOpenDialog) {
         throw new Error('No OpenDialog');
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
         _open.set(button, [UI.openFileAsync, UI.openLinkedFileAsync, save]);
      }
   }

   // now show dialog
   const [_form, button] = await UI.execDialog('#cloudOpenDialog', null);
   if (button.value === "cancel") {
      throw new Error('No storage selected');
   }
   const [pick, open, saveFn] = _open.get(button);
   _workingSave.saveFn = saveFn;
   return pick(extension).then(files=>{
      return [files, open];
    });
};


export {
   reset,
   setWorkingFiles,
   save,
   saveAs,
   open,
}