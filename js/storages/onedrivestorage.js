/** 
 * https://hawramani.com/how-to-get-a-demo-of-the-onedrive-file-picker-javascript-sdk-to-work-on-a-local-development-server/
 * setup local server.
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
      // Retrieve the contents of the file and load it into our editor
      const downloadLink = this.file["@microsoft.graph.downloadUrl"];
      return CloudStorage.ezAjax(downloadLink);
   }

   upload(reponseType, data) {

   }

   get path() {
      return this.file.parentReference.path;
   }
};


function saveAuth(files) {
   if (!window.localStorage.getItem(ACCESSTOKEN)) {
      window.localStorage.setItem(ACCESSTOKEN, files.accessToken);
      window.localStorage.setItem(APIENDPOINT, files.apiEndpoint);
   }
};

function getAuth(advanced) {
   const accessToken = window.localStorage.getItem(ACCESSTOKEN);
   if (accessToken) {
      advanced.accessToken = accessToken;
      advanced.apiEndpoint = window.localStorage.getItem(APIENDPOINT);
      return true;
   }
   return false;
};


/**
 * got the svg logo from wikipedia's Microsoft Onedrive. no support for ie, so only encode '#' for firefox.
 */
const LOGO = 'data:image/svg+xml;charset=UTF-8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1030.04 659.922"><g><path fill="%230364B8" d="M622.292,445.338l212.613-203.327C790.741,69.804,615.338-33.996,443.13,10.168   C365.58,30.056,298.224,78.13,254.209,145.005C257.5,144.922,622.292,445.338,622.292,445.338z"/><path fill="%230078D4" d="M392.776,183.283l-0.01,0.035c-40.626-25.162-87.479-38.462-135.267-38.397   c-1.104,0-2.189,0.07-3.291,0.083C112.064,146.765-1.74,263.423,0.02,405.567c0.638,51.562,16.749,101.743,46.244,144.04   l318.528-39.894l244.209-196.915L392.776,183.283z"/><path fill="%231490DF" d="M834.905,242.012c-4.674-0.312-9.371-0.528-14.123-0.528c-28.523-0.028-56.749,5.798-82.93,17.117   l-0.006-0.022l-128.844,54.22l142.041,175.456l253.934,61.728c54.799-101.732,16.752-228.625-84.98-283.424   c-26.287-14.16-55.301-22.529-85.091-24.546V242.012z"/><path fill="%2328A8EA" d="M46.264,549.607C94.359,618.756,173.27,659.966,257.5,659.922h563.281   c76.946,0.022,147.691-42.202,184.195-109.937L609.001,312.798L46.264,549.607z"/></g></svg>';
const ACCESSTOKEN="onedriveAccessToken";
const APIENDPOINT="onedriveApiEndpoint";

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


async function saveAs(blob, ext) {

};


async function save(blob, filename) {

};


/**
 * map to FilePicker
 * @param {*} options - same as save options.
 */
function setupSaveButton(button) {
   if (button) {
      // get clientID from button.
      const clientID = button.getAttribute('data-app-key');
      if (clientID) {
         odStorage.applicationID = clientID;
      }
      button.querySelector('.home').src = LOGO;

      // return handling code.
      return save;
   }
   return null;
};


/**
 * given fileItem {selected: , filename: }
 * return promise that return CloudFile. the promise use graph api to access file directly.
 */
function open(fileItem) {
   const path = fileItem.selected.path;  // /drive/root:/path
   
   const apiEndPoint = window.localStorage.getItem(APIENDPOINT);
   const url = `${apiEndPoint}/me/${path}/${fileItem.filename}`;   // /me/drive/root:/path/to/file
   //const url = `${apiEndPoint}/me/drive/items/${id}:/${fileItem.filename}`;  // /me/drive/items:/{item-id}:/path/to/file

   const options = {
      method: "GET",
      responseType: 'json',
      headers: { Authorization: "Bearer " + window.localStorage.getItem(ACCESSTOKEN) }, 
   };
   return CloudStorage.ezAjax(url, options)
         .then(res=>{
            return [new OneDriveFile(res.data)];
         });
}


/**
 * let user select file, or supply filename
 */
function pick(fileItem) {
   if (fileItem) {
      return open(fileItem);
   }

   // get options.
   //openOptions.advanced.filter = CloudStorage.getOptions().filter;

   // convert to object
   return new Promise((resolve, reject)=> {
      openOptions.success = (files)=>{
         saveAuth(files);
         resolve(files.value.map(fileValue=>{return new OneDriveFile(fileValue);}));
      };
      openOptions.cancel = ()=> {
         // could we get auth token?
         reject("cancel");
      }
      openOptions.error = (error)=> {
         reject(error);
      }
      OneDrive.open(openOptions);
   });
};



function setupOpenButton(button) {
   if (button) {
      // get clientID from button.
      openOptions.clientId = button.getAttribute('data-app-key');
      button.querySelector('.home').src = LOGO;
      getAuth(openOptions.advanced);
      // return handling code.
      return [pick, null];
   }
   return null;
};



export {
   setupSaveButton,
   setupOpenButton,
}