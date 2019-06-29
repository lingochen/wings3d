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
 * return a Promise. that will resolve [accessToken, files] - files is an array of filename.
 * 
 * @param {string} accessToken 
 * @param {function} readFolder 
 * @param {string} path to query. 
 */
let contentDialog;
async function contentSelectDialog(readFolder, startingPath) {
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
         contentDialog = {main: main, nav: nav, filePane: filePane, selected: null, resolve: null, reject: null,
            updateFolder: async function(newPath) {
               function updateLabel(label, item) {
                     // get input
                     const input = label.querySelector('input');
                     input.dataset.filepath = item.path;
                     // get span, before, after.
                     let span = label.querySelector('span');
                     span.textContent = item.name;
                     span.setAttribute('data-after', '');   // modified date, size,
                     //span.setAttribute('data-before', '');  // folder, or not
               };
               const {fileItems, cursor} = await this.readFolder(newPath);
               const labelItems = this.filePane.querySelectorAll("label");
               if (labelItems.length < fileItems.length) {
                  let i = 0;
                  for (let item of fileItems) {
                     let label;
                     if (i >= labelItems.length) {   // create new <label><input><span></label>
                        const aFrag = document.createRange().createContextualFragment('<label class="fileItem"><input type="radio" name="selectFile"><span></span></label>');
                        label = aFrag.firstElementChild;
                        this.filePane.appendChild(aFrag);
                     } else {
                        label = labelItems[i];
                     }
                     updateLabel(label, item);
                     i++;
                  }
               } else {
                  let i = 0;
                  for (const label of labelItems) {
                     if (i >= fileItems.length) {
                        label.hidden = true;    // instead of display = none.
                     } else {
                        updateLabel(label, fileItems[i]);
                     }
                     i++;
                  }
               }
            },
            handleSubmit: function(evt) {
               evt.preventDefault();
               contentDialog.main.style.display = 'none';
               document.body.removeChild(contentDialog.main.parentNode);
               document.body.appendChild(contentDialog.main);
               if (this.submitButton.value === 'ok') {
                  this.resolve([this.selected.dataset.filepath]);
               } else if (this.submitButton.value === 'cancel') {
                  this.reject('cancel');
               }
             },
            handleNav: function(evt) { // click
               evt.stopPropagation();
               if (evt.target.matches('a')) {   // yes, navigate to the directory.
                  const target = evt.target.parentNode;
                  const path = [];
                  const directory = this.nav.querySelectorAll('li');
                  for (let li of directory) {
                     if (li === target) {
                        break;
                     }
                     path.push( li.textContent );
                  }
                  while (target.nextElementSibling) { // remove all element after target
                     this.nav.removeChild(target.nextElementSibling);
                  }
                  target.textContent = evt.target.textContent;  // remove <a>
               }
             },
            handleFileItems: function(evt) { // on change
               evt.stopPropagation();
               if (evt.target.matches('input')) {
                  if (evt.target.classList.contains('folder')) {  // we click on folder
                     this.updateFolder(etv.target.dataset.path);
                  } else { // click select file. click again to deselected.
                     if (this.selected && (this.selected !== evt.target)) {
                        this.selected.parentNode.classList.toggle('selected');
                     }
                     evt.target.parentNode.classList.toggle('selected');
                     if (evt.target.checked) {
                        this.selected = evt.target;
                     } else { // disabled ok button
                        this.main.querySelectorAll('[type="submit"][value="ok"]').forEach((ok)=>{ ok.disabled=true; });
                     }
                  }
                }
             },
          };
         // eventHandler
         contentDialog.filePane.addEventListener('change', (evt)=>{contentDialog.handleFileItems(evt);});
         contentDialog.nav.addEventListener('click', (evt)=>{contentDialog.handleNav(evt);});
         contentDialog.main.addEventListener('submit', (evt)=>{contentDialog.handleSubmit(evt);});
         for (let button of contentDialog.main.querySelectorAll('[type=submit]')) {
            button.addEventListener('click', (evt)=> {
               evt.stopPropagation();
               contentDialog.submitButton = button;
             });
         }
      }
      // update to current (resolve, reject, readFolder) functions.
      contentDialog.resolve = resolve;
      contentDialog.reject = reject;
      contentDialog.readFolder = readFolder;
      // startingPath first
      contentDialog.updateFolder(startingPath);
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
      // show
      document.body.appendChild(overlay);
    });
};




/**
 * model after atomic.js.  a Promise based ajax.
 * use xhr instead of fetch is because fetch don't fully support progress yet (2019/05/30).
 * 
 * Default settings
 */
const defaults = {
	method: 'GET',
   username: null,
	password: null,
	data: null,
	headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
   },
   responseType: '',
   timeout: null,
   withCredentials: false
};



/**
 * Make an XHR request, returne a Promise
 * @param  {String} url The request URL
 * @param  {Object} options - parameter for request [optional]
 * @return {Promise}    The XHR request Promise
*/
function ezAjax(url, options = {}, progress, cancel) {
   // Merge options into defaults
   let settings = Object.assign({}, defaults);
   settings = Object.assign(settings, options);
   
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
		for (const [header, value] of Object.entries(settings.headers)) {
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
		request.send(settings.data);
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

let gLoadObject = function() {};
function setLoadFn(fn) {
   gLoadObject = fn;
}

let gStoreObject = function() {};
function setStoreFn(fn) {
   gStoreObject = fn;
}

let _options;
function setOptions(options) {
   _options = options;
};
function getOptions() {
   return _options;
};



export {
   setLoadFn,
   gLoadObject as loader,
   setStoreFn,
   gStoreObject as storeFn,
   setOptions,
   getOptions,
   ezAjax,
   parseToJson,
   contentSelectDialog,
}