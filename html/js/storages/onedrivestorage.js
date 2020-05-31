/** 
 * https://github.com/OneDrive/onedrive-explorer-js
 * rewrite. giveup filepicker since it useless for saving.
 * follow dropboxstorage example, auth() then use cloudstorage's filepicker to open/save.
 * 
 * https://github.com/OneDrive/onedrive-texteditor-js
 * show us how to use FilePicker, get accessToken, and use REST api 
*/

import * as CloudStorage from "./cloudstorage.js";



class OneDriveFile extends CloudStorage.CloudFile {
   constructor(fileData) {
      super(fileData);
   }

   download() {
      const options = {
         responseType: "arraybuffer",
      };
      // Retrieve the contents of the file and load it into our editor
      let downloadLink = this.file["@microsoft.graph.downloadUrl"];
      return CloudStorage.ezAjax(downloadLink, options);
   }

   upload(reponseType, data) {

   }

   get isFile() {
      return (this.file.folder === undefined);
   }

   get modified() {
      return new Date(this.file.lastModifiedDateTime);
   }

   get name() {
      return this.file.name;
   }

   static rootPath(fileData) {
      let path = `${fileData.parentReference.path}/${fileData.name}`;
      return path.split(":").pop(); 
   }

   get directory() {
      return this.file.parentReference.path.split(":").pop();  // full directory, but without the "/drive/root:" part.
   }

   get size() {
      return this.file.size;
   }
};




const gAppInfo = {
   "clientId": "",
   "redirectUri": window.location.protocol + "//" + window.location.host  + '/onedrive-redirect.html',
   "scopes": "user.read files.readWrite files.readWrite.all", // sites.readWrite.all",
   "authServiceUri": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
   "graphApiRoot": "https://graph.microsoft.com/v1.0/",
 };
function getAuthUrl() {
   // get auth url   
   let url =
     gAppInfo.authServiceUri +
     "?client_id=" + gAppInfo.clientId +
     "&response_type=token" +
     "&redirect_uri=" + encodeURIComponent(gAppInfo.redirectUri);
 
   if (gAppInfo.scopes)
      url = url + "&scope=" + encodeURIComponent(gAppInfo.scopes);
   if (gAppInfo.resourceUri)
      url = url + "&resource=" + encodeURIComponent(gAppInfo.resourceUri);

   return url;
}
function popup() {
   // setup window
   let width = 525,
      height = 525,
      screenX = window.screenX,
      screenY = window.screenY,
      outerWidth = window.outerWidth,
      outerHeight = window.outerHeight;

   let left = screenX + Math.max(outerWidth - width, 0) / 2;
   let top = screenY + Math.max(outerHeight - height, 0) / 2;

   let features = ["width=" + width,"height=" + height,"top=" + top,"left=" + left,
               "alwaysRaised=1","status=no","resizable=yes","toolbar=no","menubar=no","scrollbars=yes"];
   
   return window.open("", "_blank", features.join(","));
 };


async function getAuth() {
   let account;
   if (account = window.localStorage.getItem(ACCESSTOKEN)) {   // check if already in localStorage.
      account = JSON.parse(account);
      if (!CloudStorage.isExpired(account.expires_in)) {
         return account;
      }
   }
   // otherwise get new token
   return CloudStorage.getAuth(popup, getAuthUrl)
          .then(account=>{ // expire_in is second, adds up
               account.expires_in = CloudStorage.getExpireTime(account.expires_in);
               window.localStorage.setItem(ACCESSTOKEN, JSON.stringify(account));
               return Promise.resolve(account);
          });
};


/** 
 * Reads the contents of a folder in the user's Dropbox.  Fails if the given path does not point to a folder.
 * @params {string} - path as in '/test/dir/etc'
 * @params {array} - file types string. ie ['gltf', 'glb']
 * The data sent back is an array of objects with  attributes,
 */
async function readFolder(path, fileTypes) {
   return getAuth()
      .then(account=> {
         const ajaxOptions = {
            method: 'GET',
            responseType: 'json',
            headers: {
               Authorization: `Bearer ${account.access_token}`,
               'Content-Type': "application/json;odata.metadata=none",
            },
            data: {},
          };
 
         // build readFolder url
         let url = gAppInfo.graphApiRoot + "me/drive/root/children";
         if (path) {
            url =  gAppInfo.graphApiRoot + "me/drive/root:" + path + ":/children";
         }
 
         //let query = `?$filter=name eq '.${fileTypes}'`;
 
         const filter = CloudStorage.getFileTypesRegex(fileTypes);
         return CloudStorage.ezAjax(url, ajaxOptions)
            .then(res => CloudStorage.parseToJson(res))
            .then(([_res, data]) => {
               const folders = [], files = [];
               for (let entry of data.value) {
                  if (entry.folder) {
                     folders.push( new OneDriveFile(entry) );
                  } else {
                     if (entry.name.match(filter)) {  // todo: how to get graph api to filter filename's extension?
                        files.push( new OneDriveFile(entry) );
                     }
                  }
               }
               let cursor;
               /*if (data.entries.has_more) {
                  cursor = data.entries.cursor;
               } */
               // order by folders then files. continuation cursor if needed.
               return {fileItems: folders.concat(files), cursor: cursor};
            });
      });
}



/**
 * got the svg logo from wikipedia's Microsoft Onedrive. no support for ie, so only encode '#' for firefox.
 */
const LOGO = 'data:image/svg+xml;charset=UTF-8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1030.04 659.922"><g><path fill="%230364B8" d="M622.292,445.338l212.613-203.327C790.741,69.804,615.338-33.996,443.13,10.168   C365.58,30.056,298.224,78.13,254.209,145.005C257.5,144.922,622.292,445.338,622.292,445.338z"/><path fill="%230078D4" d="M392.776,183.283l-0.01,0.035c-40.626-25.162-87.479-38.462-135.267-38.397   c-1.104,0-2.189,0.07-3.291,0.083C112.064,146.765-1.74,263.423,0.02,405.567c0.638,51.562,16.749,101.743,46.244,144.04   l318.528-39.894l244.209-196.915L392.776,183.283z"/><path fill="%231490DF" d="M834.905,242.012c-4.674-0.312-9.371-0.528-14.123-0.528c-28.523-0.028-56.749,5.798-82.93,17.117   l-0.006-0.022l-128.844,54.22l142.041,175.456l253.934,61.728c54.799-101.732,16.752-228.625-84.98-283.424   c-26.287-14.16-55.301-22.529-85.091-24.546V242.012z"/><path fill="%2328A8EA" d="M46.264,549.607C94.359,618.756,173.27,659.966,257.5,659.922h563.281   c76.946,0.022,147.691-42.202,184.195-109.937L609.001,312.798L46.264,549.607z"/></g></svg>';
const ACCESSTOKEN="onedriveAccessToken";

const openOptions = {
   clientId: 0,            // application ID
   action: "download",
   multiSelect: false,
   advanced: {
      /* Filter the files that are available for selection */
      //filter: ".md,.mdown,.txt",
      /* Request a few additional properties */
      queryParameters: "select=*,name,size",
      /* Request a read-write scope for the access token */
      scopes: ["Files.ReadWrite"],
      // redirectURI
      redirectUri: window.location.protocol + "//" + window.location.host  + '/onedrive-redirect.html'
  },
   success: function(files) { /* success handler */ },
   cancel: function() { /* cancel handler */ },
   error: function(error) { /* error handler */ }
};

const gSaveOptions = {
   clientId: 0,
   action: "query",

   advanced: {
      // Request additional parameters when we save the file
      queryParameters: "select=id,name,size,parentReference",
      // redirectURI
      redirectUri: window.location.protocol + "//" + window.location.host  + '/onedrive-redirect.html'
   },
};


/**
 * open filepicker to selected the fileItem to save. Not saving at this time. 
 */
async function saveAs(filename) {

   return new Promise((resolve, reject)=>{
      let options = Object.assign({ // Build the picker options to query for a folder where the file should be saved.
         success: (selection)=>{
            // The return here is the folder where we need to upload the item
            let folder = selection.value[0]; 
                
            // Store the access token from the file picker, so we don't need to get a new one
            gSaveOptions.accessToken = selection.accessToken;

            resolve(new OneDriveFile( { 
               id: null,
               name: filename,
               parentReference: {
                  driveId: folder.parentReference.driveId,
                  id: folder.id
               }
            }));
         },
         error: (e)=>{ reject( new Error("An error occurred while saving the file: " + e, e) ); }
      }, gSaveOptions);

      // Launch the picker
      OneDrive.save(options);
    });
};


/**
 * given a filename, return a fileItem with the given name.
 */
async function save(filename) {

};


/**
 * map to FilePicker
 * @param {*} options - same as save options.
 */
function setupSaveButton(button) {
   if (button) {
      // get clientID from button.
      gSaveOptions.clientId = button.getAttribute('data-app-key');
      gAppInfo.clientId = gSaveOptions.clientId;
      button.querySelector('.home').src = LOGO;

      // return handling code.
      return [saveAs, save];
   }
   return null;
};


/**
 * given filename (including path).
 * return promise that return OneDriveFile. the promise use graph api to access file directly.
 */
function open(filename) {
   return getAuth()
      .then(account=> {
         if (filename && filename[0] !== '/') {
            const dir = CloudStorage.getOptions().currentDirectory;
            filename = `${dir}/${filename}`;
         }
         const url = `${gAppInfo.graphApiRoot}/me/drive/root:${filename}`; // /me/drive/root:/path/to/file
      
         const options = {
            method: "GET",
            responseType: 'json',
            headers: { Authorization: "Bearer " + account.access_token }, 
         };
         return CloudStorage.ezAjax(url, options)
               .then(res=>{
                  return [new OneDriveFile(res.data)];
               });
      });
}


/**
 * let user select file, or supply filename
 */
async function pick(fileTypes) {
   // now ask picker to selected a file.
   return getAuth()
      .then(_account=>{
         return CloudStorage.contentSelectDialog(LOGO, readFolder, {path:"", ext: fileTypes})
            .then(file=>{
               return [file];
            });
      });

};



function setupOpenButton(button) {
   if (button) {
      // get clientID from button.
      openOptions.clientId = button.getAttribute('data-app-key');
      gAppInfo.clientId = openOptions.clientId;
      button.querySelector('.home').src = LOGO;
      //getAuth(openOptions.advanced);
      // return handling code.
      return [pick, open, save];
   }
   return null;
};



export {
   setupSaveButton,
   setupOpenButton,
}