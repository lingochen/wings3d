/**
 * We want to load/store blob(images,binary files) to 3rd party cloud drive from browser directly, with minimal assistant from server.
 * So that user's data won't get lock down by our app.
 * 
 * Requirement:
 * direct load/store BLOB. (binary files), dataurl not good enough.
 * open with file dialog.
 * save as with file dialog.
 * save directly (load from cloud drive then save back)
 * 
 * this implement folder traversal, dialog handling/rendering. common stuffs for all 
 */


 /**
  * https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
  * format bytes size to human readable (bytes, kb, mb, gb...)
  *
  * @param {number} bytes - number of bytes
  * @param {number} decimals - number of decimal after 0.
  * @param {string} - size in (b, kb, mb, gb...), the most appropriate one.
  */
function formatBytes(bytes, decimals = 1) {
   if (bytes === 0) return '0 Bytes';

   const k = 1024;
   const dm = decimals < 0 ? 0 : decimals;
   const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

   const i = Math.floor(Math.log(bytes) / Math.log(k));

   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getFilenameAndExtension(pathfilename) {
   const filenameextension = pathfilename.replace(/^.*[\\\/]/, '');
   const index = filenameextension.lastIndexOf('.');
   let ext = "";
   let filename = filenameextension;
   if (index >= 0) {
      filename = filenameextension.substring(0, index);
      ext = filenameextension.substring(index+1, filenameextension.length);
   }
   return [filename, ext];
};

function getFileTypesString(filetypes) {
   let ret = "";
   for (let type of filetypes) {
      if (ret.length > 0) {
         ret =  ret + ', .' + type;
      } else {
         ret = '.' + type;
      }
   }
   return ret;
};

function getFileTypesRegex(filetypes) {
   let regex = "";
   for(let type of filetypes) {
      if (regex.length > 0) {
         regex = regex + '|' + type;
      } else {
         regex = type;
      }
   }

   return new RegExp(`\.(${regex})$`, "i");
}


function isExpired(expireTime) {
   const expired = new Date(expireTime);
   const current = new Date;
   return (expired < current);
};


function getExpireTime(elapseSeconds) {
   const t = new Date;
   t.setTime(t.getTime() + elapseSeconds * 1000);
   return t;
};

function filenameWithPath(filename) {
   if (filename && filename[0] !== '/') {
      const dir = getOptions().currentDirectory;
      filename = `${dir}/${filename}`;
   }
   return filename;
}

/*
 * Opens a new tab/window in the browser showing the XXXX login page(popupFn) for
 * the app.  If the user logs in successfully, then the success callback will be called, and all
 * requisite data stored inside this object for use by the other functions
 * defined below to access the user's Dropbox.  Upon successful login, the
 * login window is also closed, bringing the user back to the page in which
 * this script was run (your app).
 *
 * Note that this requires a "redirect.html"`page to be present as defined in the 
 * "dropbox/onedrive/yandex" system.
 */
function getAuth(popupWin, authUrl) {
   return new Promise(function (resolve, reject) {
      const loginWin = popupWin();
      if (!loginWin) {
         reject( new Error("open window failed, popup blocked?") );
      } else {
         let eventHandler;
         loginWin.focus();
         loginWin.location.href = authUrl(); // switch to oauth2 url. Cannot popup directly to oauth2 url (blocked popup) in promise even inside click event.
         // wait for accessToken
         window.addEventListener('message', eventHandler = function(evt) {
            const message = evt.data;
            if ( !( message instanceof Array ) ) {
               return;
            }
            const command = message.shift();
            if ( command === 'oauth2Login' ) {
               loginWin.close();
               const accountData = message.shift();
               if ( accountData.access_token ) {
                  resolve(accountData);
               } else { // no authorization.
                  reject( new Error(accountData) );
               }
               window.removeEventListener('message', eventHandler);   // cleanup
            }
         });

         // check for closed Window without authorization. (unload event don't work after redirect)
         const timer = setInterval(function() { 
            if (loginWin.closed) {
               clearInterval(timer);
               window.removeEventListener('message', eventHandler);   // now cleanup
               reject( new Error("Authorization failed") );
            }
         }, 1000);
      }
   });
}



/**
 * return a Promise. that will resolve(file) 
 * 
 * @param {string} accessToken 
 * @param {function} readFolder 
 * @param {string} path to query. 
 */
let contentDialog;
async function contentSelectDialog(logo, readFolder, fileInfo) {
   return new Promise( function(resolve, reject) {
      if (!contentDialog) {
         const main = document.getElementById('contentPicker');
         if (!main) { // now reject
            reject("No dialog exist");
         }
         // now attach nav event.
         const nav = main.querySelector('.breadcrumb');
         if (!nav) {
            reject("No contentSelect Nav");
         }
         const filePane = main.querySelector('.filePicker');
         if (!filePane) {
            reject("No contentSelect fileList Pane");
         }
         const nameInput = main.querySelector('.fileSelected');
         if (!nameInput) {
            reject("no fileSelected input");
         }
         const extLabel = main.querySelector('.fileExt');
         if (!extLabel) {
            reject("no fileExt label");
         }
         contentDialog = {main: main, nav: nav, filePane: filePane, selected: null, nameInput: nameInput, ext: extLabel, resolve: null, reject: null, logoClass: "",
            updateNav: function(path) {   // 
               setOptions({currentDirectory: path});
               const newPath = path.split('/');
               let oldPath = this.nav.querySelectorAll("a");
               let addition = newPath.length - oldPath.length;
               if (addition > 0) {  // handle the addition first.
                  const crumbs = document.createRange().createContextualFragment('<li><a></a></li>'.repeat(addition));
                  this.nav.appendChild(crumbs);
                  oldPath = this.nav.querySelectorAll("a");
               } else if (addition < 0) {
                  while (addition++ < 0) {
                     this.nav.removeChild(this.nav.lastChild);
                  }
                  oldPath = this.nav.querySelectorAll("a");
               }
               let pathCurrent = "";              // constructing path along breadcrumb
               let a;
               for (let i = 0; i < newPath.length; ++i) {   // check and update stuff
                  a = oldPath[i];
                  const name = newPath[i];
                  const flag = (a.textContent !== name);
                  a.classList.remove('current');
                  if (name.length > 0) {  // not the root
                     pathCurrent += "/" + name;
                  }
                  a.dataset.filepath = pathCurrent;
                  if (flag) {
                     a.textContent = name;   // update value
                  }
               }
               oldPath[oldPath.length-1].classList.add('current');   // last one is the current. and we guarantee at least we have root.
               this.nav.dataset.filepath = path;
            },
            updateFolder: async function(newPath) {   // newPath is array of string.
               function row(item) {
                  const label = document.createElement('label');
                  label.classList.add('fileItem');
                  label.dataset.filepath = item.path;
                  label.dataset.filename = item.name;
                  label.fileInfo = item;
                  return label;
               }
               function folderRows(aFrag, folders) {
                  for (let item of folders) {
                     const label = row(item);
                     label.classList.add('folder');
                     const folderSVG = getOptions().folderSVG || "#";
                     label.insertAdjacentHTML('beforeend',
                                          `<input type="radio" name="selectFile"><img src='${folderSVG}'><span class="filename">${item.name}</span>`);
                     aFrag.appendChild(label);
                  }
                  return folders.length > 0;
               }
               function fileRows(aFrag, files) {
                  for (let item of files) {
                     const label = row(item);
                     const size = formatBytes(item.size);
                     const date = item.modified.toLocaleString('en-US', {year: '2-digit', month: 'short', day: 'numeric' });      // modified date
                     label.insertAdjacentHTML('beforeend',
                           `<input type="radio" name="selectFile"><img src='#'><span class="filename">${item.name}</span><span class="size">${size}</span><span class="date">${date}</span>`);
                     aFrag.appendChild(label);
                  }
                  return files.length > 0;
               }
               this.updateNav(newPath);   // update breadcrumb navigation
               this.currentDirectory = newPath;
               let {folders, files, cursor} = await this.readFolder(newPath, this.fileTypes);
               const aFrag = document.createDocumentFragment();
               folderRows(aFrag, folders);
               fileRows(aFrag, files);
               this.filePane.innerHTML = '';
               this.filePane.appendChild(aFrag);
               // do pages if any
               while (cursor) {
                  let page = await cursor();
                  if (newPath !== this.currentDirectory) {  // to another directory, we are too late, break.
                     break;
                  }
                  if (folderRows(aFrag, page.folders)) {
                     let last = this.filePane.querySelectorAll('.folder:last-child');
                     if (last.length) {
                        this.filePane.insertBefore(aFrag, last[0].nextSibling);
                     } else {
                        this.filePane.insertBefore(aFrag, this.filePane.firstChild);
                     }
                  }
                  fileRows(aFrag, page.files);
                  this.filePane.appendChild(aFrag);
                  cursor = page.cursor;
               }

            },
            handleNav: function(evt) { // click
               evt.stopPropagation();
               let target;
               for (target = evt.target; !target.matches('a'); target = target.parentNode) {} 
               // yes, navigate to the directory.
               if (!target.classList.contains('current')) {
                  this.updateFolder(target.dataset.filepath);
               }
             },
            handleFileItems: function(evt) { // on change
               evt.stopPropagation();
               if (evt.target.matches('input')) {
                  const label = evt.target.parentNode;
                  if (label.classList.contains('folder')) {  // we click on folder
                     evt.target.checked = false;
                     this.updateFolder(label.dataset.filepath);
                  } else { // click select file
                     if (this.selected && (this.selected !== label)) {
                        this.selected.classList.toggle('selected');
                     }
                     label.classList.toggle('selected');
                     this.selected = label;
                     this.nameInput.value = label.dataset.filename;
                  }
                }
             },
            handleSaveAs: function(evt) { // user input something, now enabled input
               evt.stopPropagation();
               // deselect current selected
               if (this.selected) {
                  //this.selected.checked = false;
                  this.selected.classList.toggle('selected');
                  this.selected = null;
               }
               // make sure we enabled button
               this.main.querySelectorAll('[type="submit"][value="ok"]').forEach((ok)=>{ ok.disabled=false; });
             },
            handleSubmit: function(evt) {
               evt.preventDefault();
               contentDialog.main.style.display = 'none';
               document.body.removeChild(contentDialog.main.parentNode);
               document.body.appendChild(contentDialog.main);
               this.reset();
               if (this.submitButton.value === 'ok') {
                  if (this.selected) {
                     const fileInfo = this.selected.fileInfo;
                     this.selected = null;
                     this.resolve(fileInfo);
                  } else { // it saveAs from nameInput's value
                     let [name, ext] = getFilenameAndExtension(this.nameInput.value);
                     if (name.length > 0) {
                        if (ext.length === 0) {
                           ext = this.fileTypes[0];
                        }
                        const filename = name + '.' + ext;
                        this.resolve({isFile: true, directory: this.nav.dataset.filepath, name: filename});
                     }
                  }
               } 
               this.reject(new Error("No file selected"));
             },
            reset: function() {
               while (this.filePane.firstChild) {  // clean pane
                  this.filePane.removeChild(this.filePane.lastChild);
               }
            },
          };
         // eventHandler
         contentDialog.filePane.addEventListener('change', (evt)=>{contentDialog.handleFileItems(evt);});
         contentDialog.nav.addEventListener('click', (evt)=>{contentDialog.handleNav(evt);});
         contentDialog.main.addEventListener('submit', (evt)=>{contentDialog.handleSubmit(evt);});
         contentDialog.nameInput.addEventListener('change', (evt)=>{contentDialog.handleSaveAs(evt)});
         contentDialog.nameInput.addEventListener('keypress', (evt)=>{contentDialog.handleSaveAs(evt)});
         for (let button of contentDialog.main.querySelectorAll('[type=submit]')) {
            button.addEventListener('click', (evt)=> {
               evt.stopPropagation();
               contentDialog.submitButton = button;
             });
         }
      }
      // update to current (resolve, reject, readFolder) functions.'
      contentDialog.resolve = resolve;
      contentDialog.reject  = reject;
      contentDialog.readFolder = readFolder;
      // logo
      contentDialog.nav.querySelector(".home").src = logo;
      // startingPath first
      contentDialog.fileTypes = fileInfo.ext;
      contentDialog.updateFolder(fileInfo.path);
      // show dialog 
      const overlay = document.createElement("div");
      overlay.classList.add("overlay");
      overlay.addEventListener('keydown', function(ev) { // prevent document handling hotkey.
         ev.stopPropagation();
       });
      overlay.appendChild(contentDialog.main); 
      contentDialog.main.style.display = 'block';
      overlay.classList.add("realCenterModal");
      contentDialog.main.reset();
      contentDialog.ext.textContent = getFileTypesString( fileInfo.ext );
      // title (open, or save), nameInput(readonly, or editable)
      if (typeof(fileInfo.name) === 'undefined') {  // open for no saveAs
         contentDialog.main.querySelector(".title").textContent = "Open";
         contentDialog.nameInput.value = "";
         contentDialog.nameInput.disabled = true;
      } else { // use the saveAs "string"
         contentDialog.main.querySelector(".title").textContent = "SaveAs";
         contentDialog.nameInput.value = fileInfo.name;
         contentDialog.nameInput.disabled = false;
      }
      // show
      document.body.appendChild(overlay);
    });
};




/**
 * model after atomic.js.  a Promise based ajax.
 * use xhr instead of fetch is because fetch don't fully support progress yet (2019/05/30).
 * 
 * Make an XHR request, returne a Promise
 * @param  {Object} userSettings - various ajax setting.
 * @param  {String} url The request URL
 * @param  {Object} headers - request header
 * @param  {Blob} bodyData - body of ajax request.
 * @return {Promise}    The XHR request Promise
*/
function ezAjax(userSettings, url, userHeaders, bodyData) {
   // Merge options into defaults
   const settings = Object.assign({method: 'GET',
                                 username: null,
	                              password: null,
                                 responseType: '',
                                 //timeout: null,
                                 withCredentials: false,}, userSettings);
   const headers = Object.assign({}, userHeaders);
   const progress = getOptions().progress, cancel = getOptions().cancel;
   
   // Create the XHR request
   const request = new XMLHttpRequest();

	// Setup the Promise
	const xhrPromise = new Promise(function (resolve, reject) {
      // handling progress.
      if (progress) {
         request.addEventListener('progress', function(evt) {
            if (evt.lengthComputable) {
               const percentComplete = parseInt(100.0 * evt.loaded / evt.total);
               // Upload in progress. Do something here with the percent complete.
               progress(percentComplete);
            }
         });
      }
        
      // handling loaded
      request.addEventListener('load', function() {
         // Process the response
			if (request.status >= 200 && request.status < 300) {
				// If successful
				resolve( {data: request.response, xhr: request} ); // assuming json already handle. ie11 won't work? without additional handling
			} else {
				// If failed
				reject({
					status: request.status,
					statusText: request.statusText,
					responseText : request.response
				});
			}
      });

		// Setup our HTTP request
		request.open(settings.method, url, true, settings.username, settings.password);
		request.responseType = settings.responseType;

      // Add headers
		for (const [header, value] of Object.entries(headers)) {
			request.setRequestHeader(header, value);
      }

		// Set timeout
		if (settings.timeout) {
			request.timeout = settings.timeout;
			request.ontimeout = function (e) {
				reject({
					status: 408,
					statusText: 'Request timeout'
				});
			};
		}

		// Add withCredentials
		if (settings.withCredentials) {
			request.withCredentials = true;
		}

		// Send the request
		request.send(bodyData);
	});   // end of promise

	// Cancel the XHR request
	xhrPromise.cancel = function () {
      request.abort();
      if (cancel) {
         cancel();
      }
	};

	// Return the request as a Promise
	return xhrPromise;
};

function parseToJson(res) {
   if (res.xhr.responseType === 'json') {
     return [res, res.data];
   }
   return [res, JSON.parse(res.data)];
}

let _options = {currentDirectory:"", folderSVG: "#"};
function setOptions(options) {
   _options = Object.assign(_options, options);
};
function getOptions() {
   return _options;
};


class CloudFile {
   constructor(fileData) {
      this.file = fileData;
   }

   static _createImage(blob) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(blob);
      img.onload = function() {
         URL.revokeObjectURL(this.src);
      }
      return img;
   }

   image() {
      return this.download('blob')
         .then(res=>{
            return CloudFile._createImage(res.data);
         });
   }

   arrayBuffer() {
      return this.download()
      .then(res=>{
         return res.data;
      });
   }

   text() {
      return this.download()
         .then(res=>{
            // The decode() method takes a DataView as a parameter, which is a wrapper on top of the ArrayBuffer.
            const dataView = new DataView(res.data);
            // The TextDecoder interface is documented at http://encoding.spec.whatwg.org/#interface-textdecoder
            const decoder = new TextDecoder('utf-8');
            return decoder.decode(dataView);   
         });
   }

   async uploadBlob(blob) {
      if (blob.type.indexOf('text') >= 0) {
         return this.upload(blob, 'text/plain; charset=dropbox-cor s-hack');
      } else {
         return this.upload(blob, 'application/octet-stream');
      }
   }

   get path() {
      return `${this.directory}/${this.name}`;
   }

   get root() {
      let i = this.name.lastIndexOf('.');
      if (i >= 0) {
         return this.name.substring(0, i);
      } else {
         return this.name;
      }
   }
};



export {
   setOptions,
   getOptions,
   ezAjax,
   parseToJson,
   getAuth,
   contentSelectDialog,
   CloudFile,
   getFilenameAndExtension,
   getFileTypesString,
   getFileTypesRegex,
   isExpired,
   getExpireTime,
   filenameWithPath,
}