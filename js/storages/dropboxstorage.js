import * as CloudStorage from "./cloudstorage.js";

/*
 * This file provides a new "class" (okay, constructor and prototype) that
 * can be instantiated and used as the filesystem object the client gives to
 * the API in cloud-storage.js.
 *
 * Furthermore, the pattern shown herein can be imitated to define back ends
 * for other cloud storage providers as well, such as Google Drive.
 *
 * The class defined hereing obeys the constraints set out in the
 * documentation at the top of the file cloud-storage.js in this folder.
 */



class DropboxFile extends CloudStorage.CloudFile {
   constructor(fileData) {
      super(fileData);
   }

   async download() {
      const options = CloudStorage.getOptions();
      return getAuth() 
         .then(account=>{
            const ajaxOptions = {
               method: 'POST',
               responseType: 'arraybuffer',
               headers: {
                 Authorization: `Bearer ${account.access_token}`,
                 'Dropbox-API-Arg': JSON.stringify({path: this.file.path_display}),   // open one file only, 
               },
             };
            return CloudStorage.ezAjax('https://content.dropboxapi.com/2/files/download', ajaxOptions, options.progress, options.cancel)
               .then(res=> {
                  // save JSON in the Dropbox-API-Result response header.
                  this.file = JSON.parse(res.xhr.getResponseHeader('Dropbox-API-Result'));
                  return res;
               });
         });

   }

   async upload(data, _contentType) {
      return getAuth()
         .then(account=>{
            const options = CloudStorage.getOptions();
         
            const ajaxOptions = {
               method: 'POST',
               headers: {
                  Authorization: `Bearer ${account.access_token}`,
                  'Content-Type': 'application/octet-stream',
                  'Dropbox-API-Arg': JSON.stringify({
                     path: this.file.path_display,           // path : '/' + fullPath.join( '/' ),
                     mode: 'overwrite',                      // 'overwrite', shorthand for {'.tag': 'add' };
                     autorename: false,
                     mute: false
                  }),
               },
               data: data,                            
            };
      
            return CloudStorage.ezAjax('https://content.dropboxapi.com/2/files/upload', ajaxOptions, options.progress, options.cancel)
               .then( result => {
                  // save result
                  let info = JSON.parse(result.xhr.response); //.getResponseHeader('Dropbox-API-Result'));
                  this.file = info; // update
                  return info.name;
               }); 
         });
   }

  
   get isFile() {
      return !(this.file['.tag'] === 'folder');
   }

   get modified() {
      return new Date(this.file.client_modified);;
   }

   get size() {
      return this.file.size;
   }   

   get directory() {
      return this.file.path_display.substring(0, this.file.path_display.lastIndexOf('/'));
   }

   get name() {
      return this.file.name;
   }
};


  /**
   * Copy from Dropbox js SDK.
   * Get a URL that can be used to authenticate users for the Dropbox API.
   * @arg {String} [state] - State that will be returned in the redirect URL to help
   * prevent cross site scripting attacks.
   */
function getAuthenticationUrl() {
   if (!clientID) {
      throw new Error('A client id is required. You can set the client id using .setClientId().');
   }

   const baseUrl = 'https://www.dropbox.com/oauth2/authorize';
   const redirectUri = window.location.protocol + "//" + window.location.host  + '/dropbox-login.html';

   const authUrl = `${baseUrl}?response_type=token&client_id=${clientID}&redirect_uri=${redirectUri}`;
   return authUrl;
}

function createLoginWin() {
   const h = 780, w = 580;
   const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
   const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
   const loginWindow = window.open("", '_blank', `alwaysRaised=1, toolbar=0, menubar=0, status=0, height=${h}, width=${w}, top=${y}, left=${x}`);
   return loginWindow;
};


let clientID;
/*
 * Opens a new tab/window in the browser showing the Dropbox login page for
 * the app.  If the user logs in successfully, then the success callback will be called, and all
 * requisite data stored inside this object for use by the other functions
 * defined below to access the user's Dropbox.  Upon successful login, the
 * login window is also closed, bringing the user back to the page in which
 * this script was run (your app).
 *
 * Note that this requires the `dropbox-login.html` page to be present in
 * the same folder as the page calling this function.  If you are running
 * this code from a CDN, you will at least need to download that login page
 * and place it in your project's web space.
 */
async function getAuth() {
   let account;
   if (account = window.localStorage.getItem("dropboxAccessToken")) {   // check if already in localStorage.
      account = JSON.parse(account);
      return account;
   }

   // otherwise get new token
   return CloudStorage.getAuth(createLoginWin, getAuthenticationUrl)
      .then(account=>{ // expire_in is second, adds up
           window.localStorage.setItem("dropboxAccessToken", JSON.stringify(account));
           return account;
      });
}


/** 
 * Reads the contents of a folder in the user's Dropbox.  Fails if the given path does not point to a folder.
 * @params {string} - path as in '/test/dir/etc'
 * @params {array} - file types string. ie ['gltf', 'glb']
 * The data sent back is an array of objects with  attributes,
 */
async function readFolder(path, fileTypes) {
   return getAuth()
      .then(account=>{
         const ajaxOptions = {
            method: 'POST',
            responseType: 'json',
            headers: {
               Authorization: `Bearer ${account.access_token}`,
               'Content-Type': 'application/json',
            },
            data: JSON.stringify({"path": path,
                                  "recursive": false,
                                  "include_deleted": false,
                                  "include_has_explicit_shared_members": false,
                                  "include_mounted_folders": true,
                                  "include_non_downloadable_files": true
                                  }),
          };
 
         const filter = CloudStorage.getFileTypesRegex(fileTypes);
         return CloudStorage.ezAjax('https://api.dropboxapi.com/2/files/list_folder', ajaxOptions)
            .then(res => CloudStorage.parseToJson(res))
            .then(([_res, data]) => {
               const folders = [], files = [];
               for (let entry of data.entries) {
                  if (entry['.tag'] === 'folder') {
                     folders.push( new DropboxFile(entry) );
                  } else {
                     if (entry.name.match(filter)) {
                        files.push( new DropboxFile(entry)  );
                     }
                  }
               }
               let cursor;
               if (data.entries.has_more) {
                  cursor = data.entries.cursor;
               }
               // order by folders then files. continuation cursor if needed.
               return {fileItems: folders.concat(files), cursor: cursor};
            });
      });
}


/**
 * get file descriptor using filename.
 */
async function save(filename) {

};


/*
 * Write the given text to a file in the user's Dropbox.  Fails if the user
 * has not yet logged in, or if the given path does not point to a file, or
 * if something goes wrong with the write operation on the server.  The
 * path should be provided as an array, as in the previous two functions.
 * The data sent to the success callback is the raw response from the
 * Dropbox API.  Files are silently overwritten, so only pass a path that
 * you know you actually want to overwrite.
 * 
 * @param {*} options
 * options = {
 *    files: [
 *       {'blob': '...', 'filename': '...'},
 *     ],
 *    success: function(files) {  success handler  },
      progress: function(percent) { progress handler  },
      cancel: function() {  cancel handler  },
      error: function (errorMessage) {}
 * } 
 * @param {file} fileObject - single fileObject to save.
 */
async function saveAs(fileInfo) {
   return getAuth()
      .then(_account=>{
         return CloudStorage.contentSelectDialog(logo, readFolder, fileInfo)
            .then(file=>{
               if (file instanceof DropboxFile) {  // select an existing file to save
                  return file;
               } else { // yes definitely saveAs a new name.
                  file.path_display = file.directory + '/' + file.name;
                  return new DropboxFile(file);
               }
            });
      });
};


/**
 * model after chooser/saver
 * @param {*} options - same as save options.

 */
function setupSaveButton(button) {
   if (button) {
      // get clientID from button.
      clientID = button.getAttribute('data-app-key');
      button.querySelector('.home').src = logo;

      // return handling code.
      return [saveAs, save];
   }
   return null;
};


/**
 * got the svg logo from dropbox official branding. uriencode(#), utf-8
 */
const logo = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 235.45 200"><defs><style>.cls-1{fill:%230061ff;}</style></defs><title>DropboxGlyph</title><polygon class="cls-1" points="58.86 0 0 37.5 58.86 75 117.73 37.5 58.86 0"/><polygon class="cls-1" points="176.59 0 117.73 37.5 176.59 75 235.45 37.5 176.59 0"/><polygon class="cls-1" points="0 112.5 58.86 150 117.73 112.5 58.86 75 0 112.5"/><polygon class="cls-1" points="176.59 75 117.73 112.5 176.59 150 235.45 112.5 176.59 75"/><polygon class="cls-1" points="58.86 162.5 117.73 200 176.59 162.5 117.73 125 58.86 162.5"/></svg>';
/*
 * Reads the contents of a file in the user's Dropbox.  
 * Fails if the given path does not point to a file.
 * The path should be provided as an array.
 */
async function open(filename) {
   return getAuth()
      .then(account=>{
         if (filename && filename[0] !== '/') {
            const dir = CloudStorage.getOptions().currentDirectory;
            filename = `${dir}/${filename}`;
         }
      
         // get_metadata, if exists then return DropboxFile.
         const options = CloudStorage.getOptions();
         const ajaxOptions = {
            method: 'POST',
            responseType: '',
            headers: {
              Authorization: `Bearer ${account.access_token}`,
              "Content-Type": "application/json"
            },
            data: JSON.stringify({
               'path': filename,
               'include_media_info': false,
               'include_deleted': false,
               'include_has_explicit_shared_members': false
            })
          };
         return CloudStorage.ezAjax('https://api.dropboxapi.com/2/files/get_metadata', ajaxOptions, options.progress, options.cancel)
            .then(res=> {
               const fileInfo = JSON.parse(res.data);
               return [new DropboxFile(fileInfo)];   
            });
      })

};


/**
 * model after dropbox chooser
 * @param {*} options
 * options = {
    files: [filename, ...], 
 
    // Required. Called when a user selects an item in the Chooser.
    success: function(files) {alert("Here's the file link: " + files[0].link)},

    // Optional. Called when the user closes the dialog without selecting a file
    // and does not include any parameters.
    cancel: function() {},
};
 */
async function pick(fileTypes) {
   // now ask picker to selected a file.
   return getAuth()
      .then(_account=>{
         return CloudStorage.contentSelectDialog(logo, readFolder, {path:"", ext: fileTypes})
         .then(file=>{
            return [file];
         });
      });
};


function setupOpenButton(button) {
   if (button) {
      // get clientID from button.
      clientID = button.getAttribute('data-app-key');
      button.querySelector('.home').src = logo;

      // return handling code.
      return [pick, open, save];
   }
   return null;
};



export {
   setupSaveButton,
   setupOpenButton,
}