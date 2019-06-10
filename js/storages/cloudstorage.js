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
 * model after atomic.js.  a Promise based ajax.
 * use xhr instead of fetch is because fetch don't fully support progress yet (2019/05/30).
 * 
 * Default settings
 */
const defaults = {
	method: 'GET',
   username: null,
	password: null,
	data: {},
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
   const settings = Object.assign(defaults, options);
   
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
					responseText : request.responseText
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
   setStoreFn,
   gStoreObject as storeObject,
   setOptions,
   getOptions,
   ezAjax,
}