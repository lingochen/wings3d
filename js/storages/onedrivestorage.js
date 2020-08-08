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

   download(responseType="arraybuffer") {
      const settings = {
         responseType: responseType,
      };
      // Retrieve the contents of the file and load it into our editor
      let downloadLink = this.file["@microsoft.graph.downloadUrl"];
      return CloudStorage.ezAjax(settings, downloadLink);
   }

   async upload(data, contentType) {
      if (data.size < (4*1024*1024)) { // smaller than 4MB bytes.
         return this._upload(data, contentType);
      } else { // now breakup the blob by multiple of 320KB, 6.4MB (5mb~10mb).
         return this._uploadSession(data, contentType);
      }
   }

   async _upload(data, contentType) {
      return getAuth()
         .then(account=>{
            let url;
            // generate url
            if (this.file.parentReference) {
               url = `${gAppInfo.graphApiRoot}me/drive/items/${this.file.id}/content`;
            } else {
               url = `${gAppInfo.graphApiRoot}me/drive/root:${this.file.directory}/${this.file.name}:/content`;
            }
      
            const settings = {
               method: 'PUT',
               responseType: 'json',
            }, headers = {
               Authorization: `Bearer ${account.access_token}`,
               'Content-Type': "application/octet-stream", //"text/plain",
            };
            return CloudStorage.ezAjax(settings, url, headers, data)
               .then(result=>{   
                  this.file = result.data; // update DriveItem.
                  return this.file.name;
               });
         });
   }

   /**
    * implemented session upload, for larger than 4MB file.
    */
   async _uploadSession(data, contentType) {
      return getAuth()
         .then(account=>{
            let url;
            // generate url
            if (this.file.parentReference) {
               url = `${gAppInfo.graphApiRoot}me/drive/items/${this.file.id}/createUploadSession`;
            } else {
               url = `${gAppInfo.graphApiRoot}me/drive/root:${this.file.directory}/${this.file.name}:/createUploadSession`;
            }
      
            const settings = {
               method: 'POST',
               responseType: 'json',
            }
            const headers= {
               Authorization: `Bearer ${account.access_token}`,
               'Content-Type': "application/json",
            };
            return CloudStorage.ezAjax(settings, url, headers, {"item": {"@microsoft.graph.conflictBehavior": "replace"}});
         }).then(async (result)=> {
            const settings = {
               method: 'PUT',
               responseType: 'json',
            }, headers = {
               'Content-Type': 'application/octet-stream',
               'Content-Length': kSize,
            };

            const uploadUrl = result.data.uploadUrl; // got the session upload url, now compute
            const kSize = 20*327.680;     // 6.4mb
            let count = Math.floor(data.size / kSize);
            for (let i = 0; i < count; ++i) {
               let start = i*kSize;
               let end = (i+1)*kSize-1;
               headers['Content-Range'] = `byte ${start}-${end}/${data.size}`;
               let result = await CloudStorage.ezAjax(settings, uploadUrl, headers, data.slice(start, end+1));
            }
            // upload the final non-multiple of 6.4mb, data.
            let start = count*kSize;
            let end = data.size-1;
            headers['Content-Length'] = data.size-start;
            headers['Content-Range'] = `byte ${start}-${end}/${data.size}`;
            return CloudStorage.ezAjax(settings, uploadUrl, headers, data.slice(start, data.size))
               .then(result=>{
                  this.file = result.data;
                  return this;
               });
         });
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
   "redirectUri": window.location.protocol + "//" + window.location.host  + '/oauth-redirect.html',
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
 * Reads the contents of a folder in the user's onedrive.  Fails if the given path does not point to a folder.
 * @params {string} - path as in '/test/dir/etc'
 * @params {array} - file types string. ie ['gltf', 'glb']
 * The data sent back is an array of objects with  attributes,
 */
async function readFolder(path, fileTypes) {
   return getAuth()
      .then(account=> {
         const settings = {
            method: 'GET',
            responseType: 'json',
          };
         const headers = {
            Authorization: `Bearer ${account.access_token}`,
            'Content-Type': "application/json;odata.metadata=none",
         }
 
         // build readFolder url
         let url = gAppInfo.graphApiRoot + "me/drive/root/children";
         if (path) {
            url =  gAppInfo.graphApiRoot + "me/drive/root:" + path + ":/children";
         }
 
         //let query = `?$filter=name eq '.${fileTypes}'`;
 
         const filter = CloudStorage.getFileTypesRegex(fileTypes);
         return CloudStorage.ezAjax(settings, url, headers)
            .then(res => CloudStorage.parseToJson(res))
            .then(([_res, data]) => {
               return buildPage(data, filter);
            });
      });
}


function readFolderMore(nextLink, filter) {
   return getAuth()
      .then(account=> {
         const settings = {method: 'GET', responseType: 'json',},
               headers = {
                  Authorization: `Bearer ${account.access_token}`,
                  'Content-Type': "application/json;odata.metadata=none",
               };
 
         return CloudStorage.ezAjax(settings, nextLink, headers)
            .then(res => CloudStorage.parseToJson(res))
            .then(([_res, data])=>{
               return buildPage(data, filter);
            });
      });
}


function buildPage(data, filter) {
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
   let nextPage;
   const nextLink = data["@odata.nextLink"];
   if (nextLink) {   // yes more stuff to do.
      nextPage = ()=> {
         return readFolderMore(nextLink, filter);
      };
   }
   // order by folders then files. continuation cursor if needed.
   return {folders: folders, files: files, cursor: nextPage};
}



/**
 * got the svg logo from wikipedia's Microsoft Onedrive. no support for ie, so only encode '#' for firefox.
 */
let LOGO = "#";
const ACCESSTOKEN="onedriveAccessToken";


/**
 * given a filename, return a fileItem with the given name.
 */
async function save(filename) {
   return new OneDriveFile( {name: filename, directory: CloudStorage.getOptions().currentDirectory} );
};


/**
 * filename is the suggested name. 
 */
async function saveAs(fileInfo) {
   return getAuth()
      .then(_account=>{
         return CloudStorage.contentSelectDialog(LOGO, readFolder, fileInfo)
            .then(file=>{
               if (file instanceof OneDriveFile) {  // select an existing file to save
                  return file;
               } else { // yes definitely saveAs a new name.
                  return new OneDriveFile(file);
               }
            });
      });
};


/**
 * map to FilePicker
 * @param {*} options - same as save options.
 */
function setupSaveButton(button) {
   if (button) {
      // get clientID from button.
      gAppInfo.clientId = button.getAttribute('data-app-key');
      LOGO = button.querySelector('.home').src;

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
         filename = CloudStorage.filenameWithPath(filename);
         const url = `${gAppInfo.graphApiRoot}/me/drive/root:${filename}`; // /me/drive/root:/path/to/file
      
         const settings = {
            method: "GET",
            responseType: 'json',
         }, headers = { Authorization: `Bearer ${account.access_token}`};
         return CloudStorage.ezAjax(settings, url, headers)
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
      gAppInfo.clientId = button.getAttribute('data-app-key');
      LOGO = button.querySelector('.home').src;
      // return handling code.
      return [pick, open, save];
   }
   return null;
};



export {
   setupSaveButton,
   setupOpenButton,
}