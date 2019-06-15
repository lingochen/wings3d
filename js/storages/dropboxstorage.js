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



let clientID;
let dropboxToken;
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
function getAuth() {

   const tokenPromise = new Promise(function (resolve, reject) {
      if (dropboxToken) {
         resolve(dropboxToken);
      } else {
         const url = window.location.protocol + "//" + window.location.host  + '/dropbox-login.html';// + "/" + window.location.pathname;
         const loginWindow = window.open( url );
      
         window.addEventListener('message', function eventHandler(evt) {
            try {
               const message = JSON.parse( evt.data );
               if ( !( message instanceof Array ) ) return;
               const command = message.shift();
               if ( command === 'dialogLogin' ) {
                  loginWindow.close();
                  const accountData = message.shift();
                  if ( accountData.access_token ) {
                     dropboxToken = accountData.access_token;
                     resolve(dropboxToken);
                  } else {
                     reject( accountData );
                  }
                  window.removeEventListener('message', eventHandler);   // cleanup
               }
            } catch ( e ) { }
         });

         loginWindow.addEventListener('load', () => {
            loginWindow.postMessage( ['setClientID', clientID], '*');
         });

         loginWindow.addEventListener('unload', () => {  // do cleanup if close without authorization
            if (!dropboxToken) {
               window.removeEventListener('message', eventHandler);   // now cleanup
               reject( "Authorization failed" );
            }
         });
      }
   });
   return tokenPromise;
}


/*
 * Reads the contents of a folder in the user's Dropbox.  Fails if the user
 * has not yet logged in, or if the given path does not point to a folder.
 * The path should be provided as an array of steps in the path.  E.g.,
 * `/foo/bar` should be `['foo','bar']`.  The data sent to the success
 * callback is an array of objects with `type` and `name` attributes,
 * suitable for handing to the `showList()` method of the file dialog
 * defined in `dialog.js`.
 */
function readFolder( fullPath, successCB, failureCB ) {
    if ( !dropboxToken ) {
      getAuth(readFolder, failureFn, fullPath);
    } else {
         const ajaxOptions = {
           method: 'POST',
           headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
           },
           data: JSON.stringify({ path : fullPath.join('/') }),
         };

         ezAjax('https://content.dropboxapi.com/2/files/list_folder', ajaxOptions)
           .then(res => parseResponseToJson(res))
           .then(([res, response]) => {
             // maintaining existing API for error codes not equal to 200 range
             let result = [ ];
             for ( var i = 0 ; i < response.entries.length ; i++ )
                result.push( {
                    type : response.entries[i]['.tag'],
                    name : response.entries[i].name
                } );
            successCB( result );
             if (!res.ok) {
               // eslint-disable-next-line no-throw-literal
               throw {
                 error: data,
                 response: res,
                 status: res.status,
               };
             }
     
             return data;
           });


      ezAjax(ajaxOptions)
      .filesListFolder( { path : fullPath.join( '/' ) } )
      .then( function ( response ) {

    } )
    .catch( failureCB );
   }
}

/*
 * Reads the contents of a file in the user's Dropbox.  Fails if the user
 * has not yet logged in, or if the given path does not point to a file.
 * The path should be provided as an array, as in the previous function.
 * The data sent to the success callback is the contents of the file as
 * text.
 */
/*DropboxFileSystem.prototype.readFile =
    function ( fullPath, successCB, failureCB )
{
    if ( !this.dropbox )
        failureCB( 'The user has not logged in to Dropbox.' );
    this.dropbox.filesDownload( {
        path : '/' + fullPath.join( '/' )
    } )
    .then( function ( response ) {
        var savedFile = response.fileBlob;
        var reader = new FileReader();
        reader.onload = function () { successCB( reader.result ); };
        reader.onerror = function () { failureCB( reader.error ); };
        reader.readAsText( savedFile );
    } ).catch( function ( error ) {
        failureCB( error );
    } );
}*/

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
function save(getDataFn) {
   const options = CloudStorage.getOptions();
   return getAuth()
          .then(function(accessToken) {
      const {blob, filename} = getDataFn();
      const ajaxOptions = {
         method: 'POST',
         headers: {
            Authorization: 'Bearer ' + accessToken,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
               path: '/' + filename,           // path : '/' + fullPath.join( '/' ),
               mode: 'add',                     // 'overwrite', shorthand for {'.tag': 'add' };
               autorename: true,
               mute: false
            }),
         },
         data: blob,                            
      };

      return CloudStorage.ezAjax('https://content.dropboxapi.com/2/files/upload', ajaxOptions, options.progress, options.cancel)
             .then( result => {
         // format result then return it
         return result.data;
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

      // add handling code.
      button.addEventListener('click', function(evt) {
         //evt.preventDefault(); // <- this prevent submit.
         // we really should call SaveAs dialog?
         CloudStorage.setStoreFn(save);  // pass save function as callBack.
       });
   }
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
function open(loader) {
   const options = CloudStorage.getOptions();
   if (!dropboxToken) {   // check login, if not do it now.
      getAuth(open, loader, options.error);
   } else { // we have access, now save one by one.
         const ajaxOptions = {
            method: 'POST',
            headers: {
               Authorization: 'Bearer ' + dropboxToken,
               'Content-Type': 'application/octet-stream',
               'Dropbox-API-Arg': JSON.stringify({
                  path: '/' + filename,           // path : '/' + fullPath.join( '/' ),
                  mode: 'add',                     // 'overwrite', shorthand for {'.tag': 'add' };
                  autorename: true,
                  mute: false
                }),
            },
            data: blob,                            
          };

      CloudStorage.ezAjax('https://content.dropboxapi.com/2/files/upload', ajaxOptions, options.progress, options.cancel)
       .then( result => {
         if (options.sucess) {
            options.sucess(result.data);
         }
       }).catch( error => {
         if (options.error) {
            options.error(error.statusText);
         }
       });
   }
};

function setupOpenButton(options) {

};

export {
   setupSaveButton,
   setupOpenButton,
}