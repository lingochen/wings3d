/**
 * yandex oauth
 * https://tech.yandex.com/oauth/
 * 
 * support for yandex disk. rest api.
 * https://tech.yandex.com/disk/rest/
 * no cors support. wait for yandex's response. (2020-06-15)
 * 
 */

import * as CloudStorage from "./cloudstorage.js";


class YandexDiskFile extends CloudStorage.CloudFile {
   constructor(fileData) {
      super(fileData);
   }

   async download() {
      return getAuth() 
         .then(account=>{
            const settings = {
               method: 'GET',
               responseType: 'json',
             }, headers = {
               Authorization: `OAuth ${account.access_token}`,
               'Content-Type': "application/json",
             };

            let path = encodeURIComponent(this.file.path);
            let url = `${gAppInfo.restApiRoot}/download?path=${path}`;
            return CloudStorage.ezAjax(settings, url, headers)
            .then(res => CloudStorage.parseToJson(res))
            .then(([_res, data]) => {  // got the download link in {href}
                  const settings = {
                     method: data.method,
                     //responseType: 'arraybuffer',
                   }, headers = {
                     Authorization: `OAuth ${account.access_token}`,
                   };
                  return CloudStorage.ezAjax(settings, data.href);// headers);
               });
         });
   }

   get isFile() {
      return (this.file.type == 'file');
   }

   get modified() {
      return new Date(this.file.modified);
   }

   get name() {
      return this.file.name;
   }

   get path() {
      return this.file.path.split(":").pop();  // full directory, but without the "disk:" part.
   }

   get directory() {
      let path = this.file.path.split(":").pop();  // full directory, but without the "disk:" part.
      return path.substring(0, path.lastIndexOf("/"));
   }

   get size() {
      return this.file.size;
   }
}




let LOGO;
const ACCESSTOKEN="yandexAccessToken";
const gAppInfo = {
   "clientId": "",
   "redirectUri": window.location.protocol + "//" + window.location.host  + '/oauth-redirect.html',
   //"scopes": "user.read files.readWrite files.readWrite.all", // sites.readWrite.all",
   "authServiceUri": "https://oauth.yandex.com/authorize",
   "restApiRoot": "https://cloud-api.yandex.net/v1/disk/resources",
 };
function getAuthUrl() {
   // get auth url   
   let url =
     gAppInfo.authServiceUri +
     "?client_id=" + gAppInfo.clientId +
     "&response_type=token" +
     "&redirect_uri=" + encodeURIComponent(gAppInfo.redirectUri)
     "&display=popup" 
 
   if (gAppInfo.scopes)
      url = url + "&scope=" + encodeURIComponent(gAppInfo.scopes);

   return url;
}
function popup() {
   // setup window
   let width = 525,
      height = 725,
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
async function listFolder(path, fileTypes) {
   return getAuth()
      .then(account=> {
         const settings = {
            method: 'GET',
            responseType: 'json',
          };
         const headers = {
            Authorization: `OAuth ${account.access_token}`,
            'Content-Type': "application/json",
         }
 
         // build readFolder url
         let url;
         if (path) {
            path = encodeURIComponent(path);
            url = `${gAppInfo.restApiRoot}?path=disk:${path}`;
         } else {
            url = `${gAppInfo.restApiRoot}?path=app:/`;
         }

         let query = '';
         //query = '&limit=1';
 
         const filter = CloudStorage.getFileTypesRegex(fileTypes);
         return CloudStorage.ezAjax(settings, url+query, headers)
            .then(res => CloudStorage.parseToJson(res))
            .then(([_res, data]) => {
               return buildPage(data, filter);
            });
      });
}


function listFolderMore(prev, filter) {
   return getAuth()
      .then(account=> {
         const settings = {method: 'GET', responseType: 'json',},
               headers = {
                  Authorization: `OAuth ${account.access_token}`,
                  'Content-Type': "application/json",
               };
         
         let url = '';
         return CloudStorage.ezAjax(settings, url, headers)
            .then(res => CloudStorage.parseToJson(res))
            .then(([_res, data])=>{
               return buildPage(data, filter);
            });
      });
}

function buildPage(data, filter) {
   const folders = [], files = [];
   for (let entry of data._embedded.items) {
      if (entry.type == 'dir') {
         folders.push( new YandexDiskFile(entry) );
      } else {
         if (entry.name.match(filter)) {  // todo: how to get graph api to filter filename's extension?
            files.push( new YandexDiskFile(entry) );
         }
      }
   }
   let nextPage;
   if ((data.offset+1) < data.total) {   // yes more stuff to do.
      nextPage = ()=> {
         return listFolderMore(data, filter);
      };
   }
   // order by folders then files. continuation cursor if needed.
   return {folders: folders, files: files, cursor: nextPage};
}






async function save() {

}


async function open() {

}


/**
 * let user select file, or supply filename
 */
async function pick(fileTypes) {
   // now ask picker to selected a file.
   return getAuth()
      .then(_account=>{
         return CloudStorage.contentSelectDialog(LOGO, listFolder, {path:"", ext: fileTypes})
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
   setupOpenButton,
   //setupSaveButton,
}
