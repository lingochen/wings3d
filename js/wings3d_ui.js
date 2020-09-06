/*
   wings3d, ui and ui utility functions. including tutor.

*/
import {getFilenameAndExtension} from "./storages/cloudstorage.js";
import * as Hotkey from './wings3d_hotkey.js';
import * as Wings3D from './wings3d.js';


const menuIdAttrib = "data-menuId";
function _bindMenuItem(mode, menuItems, button, id, fn, hotkey, meta) {
   Wings3D.bindAction(menuItems, button, id, fn);
   if (hotkey !== undefined) {
      Hotkey.setHotkey(mode, id, hotkey, meta);
      // now put it on meta
      const data = meta ? `${meta}+${hotkey}` : hotkey;
      for (let menuItem of menuItems) {
         menuItem.classList.add("hotkey");
         menuItem.setAttribute("data-hotkey", data.toUpperCase());
      }
   }
}

function bindMenuItem(id, fn, hotkey, meta) {
   const menuItems = document.querySelectorAll(`[${menuIdAttrib}="${id}"]`);
   if (menuItems) {
      _bindMenuItem(null, menuItems, 0, id, fn, hotkey, meta);
   } else {
      console.log("Click: could not find menuItem " + id);
   }
}
function bindMenuItemMMB(id, fn) {
   const menuItems = document.querySelectorAll(`[${menuIdAttrib}="${id}"]`);
   if (menuItems) {
      _bindMenuItem(null, menuItems, 1, id, fn);
   } else {
      console.log("AuxClick: could not find menuItem " + id);
   }
}
function bindMenuItemRMB(id, fn) {
   const menuItems = document.querySelectorAll(`[${menuIdAttrib}="${id}"]`);
   if (menuItems) {
      _bindMenuItem(null, menuItems, 2, id, fn);
   } else {
      console.log("ContextClick: could not find menuItem " + id);
   }
}
function bindMenuItemMode(id, fn, mode, hotkey, meta) {
   const menuItems = document.querySelectorAll(`[${menuIdAttrib}="${id}"]`);
   if (menuItems) {
      _bindMenuItem(mode, menuItems, 0, id, fn, hotkey, meta);
   } else {
      console.log("Click: could not find menuItem " + id);
   }
}



function addMenuItem(menuId, id, menuItemText, fn, hotkey, meta) {
   const menu = document.querySelector(`[${menuIdAttrib}="${menuId}"]`);
   // insert the menuItem 
   const menuItem = document.createElement('li');
   const a = document.createElement('a');
   a.setAttribute(menuIdAttrib, id);
   a.textContent = menuItemText;
   // append to submenu
   menuItem.appendChild(a);
   menu.appendChild(menuItem);
   Wings3D.addActionConstant(id);
   _bindMenuItem(null, [a], 0, id, fn, hotkey, meta); // [a], should be NodeList, but array is a passable substitute.
}


function getArrow(placement) {
      if (placement === "bottom") {
         return "top";
      } else if (placement === "bottom-start") {
         return "top";
      } else if (placement === "top") {
         return "bottom";
      } else if (placement === "top-start") {
         return "bottom";
      } else if (placement === "left") {
         return "right";
      } else if (placement === "right") {
         return "left";
      }
      return "";
};

function placeCenter(div) {
   let width = window.innerWidth;
   let height = window.innerHeight;

   let rect = div.getBoundingClientRect();

   div.style.left =  Math.round( (width-rect.width)/2 ) + 'px';
   div.style.top =  Math.round( (height-rect.height)/2 ) + 'px';
};

// placement.
function placement(targetId, placement, bubble) {
      // get the size of bubble.
      const bubbleRect = bubble.getBoundingClientRect();

      let target;
      let targetRect;
      if (targetId === "") { // no target, then point at the workarea's center
         target = document.getElementById("glcanvas");
         const rect = target.getBoundingClientRect();
         targetRect = {left: Math.round(rect.left+rect.width/2), 
                       top: Math.round(rect.top+rect.height/2), 
                       width: 1, height: 1};
      } else {
         target = document.getElementById(targetId);
         // get the location and size of target
         targetRect = target.getBoundingClientRect();
      }

      let x=targetRect.left - window.scrollX, y=targetRect.top - window.scrollY;
      // now compute the target position.
      if (placement === "bottom") {
         x += Math.round((targetRect.width / 2) - (bubbleRect.width /2));
         y += targetRect.height;
         return { top: y, left: x };
      } else if (placement ==="bottom-start") {
         x += Math.round((targetRect.width / 8) - (bubbleRect.width /2));
         y += targetRect.height;
         return { top: y, left: x};
      } else if (placement === "top") {
         x += Math.round((targetRect.width / 2) - (bubbleRect.width /2));
         y -= bubbleRect.height;
         return { top: y, left: x };
      } else if (placement === "top-start") {
         x += Math.round((targetRect.width / 8) - (bubbleRect.width /2));
         y -= bubbleRect.height;
         return { top: y, left: x};
      } else if (placement === "right") {
         x += targetRect.width;
         y += Math.round((targetRect.height/2) - (bubbleRect.height/2));
         return {top: y, left: x};
      } else if (placement === "left") {        
         x -= bubbleRect.width;
         y += Math.round((targetRect.height/2) - (bubbleRect.height/2));
         return {top: y, left: x};
      }
};


function getClientPosition(e) {
   const rect = e.target.getBoundingClientRect();
   return {x: e.clientX - rect.left,   //x position within the element.
           y: e.clientY - rect.top};   //y position within the element.
};

  /**
   * Get's exact position of event.
   * 
   * @param {Object} e The event passed in
   * @return {Object} Returns the x and y position
   */
  function getPosition(e) {
   const pos = {x: 0, y: 0};
    
    if (e.pageX || e.pageY) {
      pos.x = e.pageX;
      pos.y = e.pageY;
    } else if (e.clientX || e.clientY) {
      pos.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      pos.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    return pos;
  }
  /**
   * Positions the menu properly. If outside the windows, tried to move backin.
   * 
   * @param {Object} e The event
   */
function positionDom(element, mousePosition) {
   var elementWidth = element.offsetWidth + 4;
   var elementHeight = element.offsetHeight + 4;

   var windowWidth = window.innerWidth;
   var windowHeight = window.innerHeight;

   if ( (windowWidth - mousePosition.x) < elementWidth ) {
      element.style.left = windowWidth - elementWidth + "px";
   } else {
      element.style.left = mousePosition.x + "px";
   }

   if ( (windowHeight - mousePosition.y) < elementHeight ) {
      element.style.top = windowHeight - elementHeight + "px";
   } else {
      element.style.top = mousePosition.y + "px";
   }
};


function addLabelInput(form, array) {
   const content = form.querySelector('div');
   // reset, clear all old input.
   let labels = form.querySelectorAll('label');
   for (let label of labels) {
      content.removeChild(label);
   }
   // add input name 
   for (let object of array) {
      const label = document.createElement('label');
      label.textContent = object.name;
      const input = document.createElement('input');
      input.type = "text";
      input.name = object.uuid;
      input.placeholder = object.name;
      label.appendChild(input);
      content.appendChild(label);
   }
};
function extractDialogValue(form) {
   // get form's input data.
   const obj = {};
   for (let element of form.elements) {
      if ((element.name) && (element.value)) {  // should we check the existence of .name? no name elements automatically excludede? needs to find out.
         obj[element.name] = element.value;
      }
   }
   return obj;
};
function runDialog(formID, ev, submitCallback, setup) {
   runDialogCenter(formID, submitCallback, setup, ev);
};

// prevent "ENTER" key submitted event in form.
/*document.queraddEventListener("keydown", ":input:not(textarea):not(:submit)", function(event) {
      if (event.key == "Enter") {
         event.preventDefault();
      }
   });*/
function preventEnter(event) {
   if (event.key == "Enter") {
      event.preventDefault();
   }
}
let gOverlay;
function runDialogCenter(formID, submitCallback, setup, _ev, notOk) {
   const form = document.querySelector(formID);
   if (form) {
      // create overlay if not already
      if (!gOverlay) {
         gOverlay = document.createElement("div");
         gOverlay.classList.add("overlay");
         gOverlay.addEventListener('keydown', function(ev) { // prevent document handling hotkey.
            ev.stopPropagation();
         });
      }
 
      gOverlay.appendChild(form); 
      form.style.display = 'block';
      if (_ev) {
         gOverlay.classList.add("realCenterModal");
      } else {
         gOverlay.classList.add("centerModal");
      }
      form.reset();
      if (setup) {
         setup(form);
      }
      document.body.appendChild(gOverlay);  

      // handling event
      form.addEventListener("keydown", preventEnter, true);
      const _pvt = {submitSuccess: false};
      // we need this because submit event won't tell which submit buttons we clicked.
      const submits = form.querySelectorAll('[type=submit]');
      function handleOk(ev) {
         _pvt.submitSuccess = true;
         _pvt.button = this;
      }
      function handleCancel(ev) {
         _pvt.submitSuccess = false;
         _pvt.button = this;
      }
      const removeOk = [], removeCancel = [];
      for (let submit of submits) {
         if ('ok'.localeCompare(submit.value, 'en', {'sensitivity': 'base'}) == 0) {
            submit.addEventListener('click', handleOk);
            removeOk.push(submit);
         } else { // all else, no, cancel
            submit.addEventListener('click', handleCancel);
            removeCancel.push(submit);
         }
      }
      // wait for handling event.
      form.addEventListener('submit', function submitted(ev) {
         // hide the dialog, prevent default.
         ev.preventDefault();
         form.style.display = 'none';
         form.removeEventListener('submit', submitted);
         form.removeEventListener('keydown', preventEnter);
         document.body.appendChild(form);
         document.body.removeChild(gOverlay);
         for (let submit of removeOk) {
            submit.removeEventListener('click', handleOk);
         }
         for (let submit of removeCancel) {
            submit.removeEventListener('click', handleCancel);
         }
         // get form's input data.
         if (_pvt.submitSuccess) { 
            submitCallback(form, _pvt.button);     // ask function to extract element's value.
         } else {
            if (notOk) {
               notOk(form, _pvt.button);
            }
         }
      });
   }
};
/**
 * there is not reject, only resolve and return the pressed button, because cancel button is not an error. (2019-08-06)
 * @param {*} formID 
 * @param {*} setup 
 */
async function execDialog(formID, setup) {
   let promise = new Promise((resolve, reject) => {
      runDialogCenter(formID, function(form, button) {
         resolve([form, button]);
      }, setup, "ev", function(form, button){
         resolve([form, button]);
      });
    });

  return promise;
}


async function openFileAsync(extension) {
   return new Promise((resolve, reject)=>{
      openFile(extension, (files)=> {
         resolve(files);
       }, (error)=> {
         reject(error);
       });
    });
}

// fileInput helper
function openFile(extension, fn, reject) {
   const fileInput = document.querySelector('#importFile');    // <input id="importFile" style="display:none;" type='file'>
   if (fileInput) {
      fileInput.accept = extension;
      fileInput.value = "";   // reset value
      fileInput.click();
      fileInput.addEventListener('change', function ok(ev) {
         fn(Array.from(fileInput.files));    // = ev.target.files;
       });
   }
};


function openLinkedFileAsync(filename) {
   return new Promise((resolve, reject)=>{
      openLinkedFile((files)=> {
         resolve(files);
       }, filename);
    });
}
const multiFilesForm = {form: undefined, input: undefined, ul: undefined, close: undefined, fileNames: new Map};
function openLinkedFile(callBack, filename) {
   if (!multiFilesForm.form) {   // init
      const form = document.forms['importFileListForm'];
      if (form) {
         multiFilesForm.form = form;
         const fileInput = form['fileListInput'];  // access the file input directly. bad form?
         if (fileInput) {
            fileInput.addEventListener('change', function(_ev) {
               // callback if the file of filename is selected.
               for (let file of fileInput.files) {
                  if (multiFilesForm.fileNames.has(file.name)) {
                     const [li, callBackFn] = multiFilesForm.fileNames.get(file.name);
                     // remove the selected filename and callBack.
                     multiFilesForm.ul.removeChild(li);
                     callBackFn([file]);
                     multiFilesForm.fileNames.delete(file.name);
                  }
               }
               if (multiFilesForm.fileNames.size === 0) {   // now close
                  multiFilesForm.close.click();
               }
             });
            multiFilesForm.input = fileInput;
            multiFilesForm.ul = form.querySelector('ul');
            multiFilesForm.close = form.querySelector('button');
         }
      }
   }

   // runDialog if not already run.
   if (multiFilesForm.fileNames.size === 0) {
      // reset everything first, remove all .multiFilesForm.form.reset();
      multiFilesForm.input.value = null;
      // now run
      runDialog('#importFileListForm', null, ()=>{
         multiFilesForm.fileNames.clear();
         multiFilesForm.ul.innerHTML = "";
       });
   }

   // add to ul lists.
   if (multiFilesForm.ul) {
      const li = document.createElement('li');
      li.textContent = filename;
      multiFilesForm.ul.appendChild(li);
      // break the filename to 
      const nameextension = getFilenameAndExtension(filename).join('.');
      multiFilesForm.fileNames.set(nameextension, [li, callBack]);
   }
}


let styleSheet = (function(){
   let style = document.createElement('style');
   document.head.appendChild(style);
   // webkit hack, still needs in 2018?
   style.appendChild(document.createTextNode(''));
   return style.sheet;
}());


const submenu = [];
function slideBack() {
   if (submenu.length === 0) {
      return false;
   }
   // hide current ul
   const ul = submenu.pop();
   ul.style.visibility = "hidden";
   // now toggle parent sibling
   const dropside = ul.parentElement;  
   dropside.classList.remove('hideAfter', 'showBefore');
   // hide all dropside sibling 
   const grandParent = dropside.parentElement;
   let element = grandParent.firstElementChild;
   do {
      //if (element !== dropside) {
         element.style.visibility = "inherit";
      //}
   } while (element = element.nextElementSibling);
   if (submenu.length > 0) {
      const grandA = grandParent.previousElementSibling;
      if (grandA && grandA.tagName == "A") { 
         grandA.style.visibility = "inherit";
         grandA.parentElement.style.visibility = "inherit";
      }
   }
   return true;
};
//dropside, slide in/out
function toggleSubmenu(ul) {
   if ((submenu.length > 0) && (submenu[submenu.length-1] === ul)) { // is toggling
      slideBack();
   } else {
      // now toggle on
      const dropside = ul.parentElement;
      dropside.classList.add("showBefore", "hideAfter");
      // hide grandParent if needed 
      const grandParent = dropside.parentElement;
      if (submenu.length > 0) {
         const grandA = grandParent.previousElementSibling;
         if (grandA && grandA.tagName == "A") {
            grandA.style.visibility = "hidden";
            grandA.parentElement.style.visibility = "hidden";
         }
      }
      // hide all dropside Sibling
      let element = grandParent.firstElementChild;
      do {
         if (element !== dropside) {
            element.style.visibility = "hidden";
         }
      } while (element = element.nextElementSibling);
      submenu.push(ul);
      ul.style.visibility = "visible";
   }
};

// show popupMenu
function clickInsideElement( e, className ) {
   let target = e.target;
   do {
      if ( target.classList && target.classList.contains(className) ) {
         return target;
      }
   } while ( target = target.parentNode )
   return false;
};

let currentMenu=false;
let nextPopup=false;
function toggleMenuOff() {
   if (currentMenu) {
      currentMenu.style.visibility = "hidden";
      currentMenu=false;
      while (slideBack()) {}
   }
   if (nextPopup) {
      currentMenu = nextPopup;
      nextPopup=false;
      currentMenu.style.visibility = "visible";   // toggleMenuOn
   }
};
let firstClick = 0;
function clickListener() {
   function callBack(e) {
      if (firstClick) {
         firstClick--;
      } else {
      //let clickeElIsLink = clickInsideElement( e, popupMenuClass );
      //if ( !clickeElIsLink ) {
         //if ( (e.button == 0) || (e.button == 1) ) {  // somehow, any click should 
            toggleMenuOff();
            if (!currentMenu) {
               // remove listening event
               document.removeEventListener("mouseup", callBack);
            }
         //}
      }
    }

   document.addEventListener("mouseup", callBack, false);
};
function showContextMenu(popupMenu) {
   if (currentMenu) {
      toggleMenuOff();
   } else {
      firstClick++;
      clickListener();
   }
   currentMenu = popupMenu;
   currentMenu.style.visibility = "visible";   // toggleMenuOn
};
function queuePopupMenu(popupMenu) {
   if (popupMenu !==currentMenu) {
      nextPopup = popupMenu;
      if (!currentMenu) {
         clickListener();
      }
   }
};

const dragMove = (function() {
   let isDown = false;
   let offset = [0, 0];
   let  div = null;;
   const ret = {};
   ret.mouseDown = function(ev, newDiv) {
      isDown = true;
      div = newDiv;
      offset = [div.offsetLeft - ev.clientX, div.offsetTop - ev.clientY];
   };
   ret.mouseUp = function(_ev) {
      isDown = false;
      div = null;
   }
   ret.mouseMove = function(ev) {
      ev.preventDefault();
      if (isDown) {
          const mousePosition = {x : ev.clientX, y : ev.clientY};
          div.style.left = (mousePosition.x + offset[0]) + 'px';
          div.style.top  = (mousePosition.y + offset[1]) + 'px';
      }
   }
   return ret;
}());
// moveable popup box,
function showPopup(dom, name) {
   // create div to wrap dom, 
   let div = document.createElement('div');
   div.classList.add('popup');
   // create 'x' to close.
   let span = document.createRange().createContextualFragment('<span class="close">&times;</span>');
   span.firstElementChild.addEventListener('click', function(_ev){
      document.body.removeChild(div);     // div.style.display = 'none';
    });
   div.appendChild(span);
   // create label to drag move
   let h3 = document.createElement('h3');
   h3.addEventListener('mousedown', (ev)=>{dragMove.mouseDown(ev, div);});
   document.addEventListener('mouseup', dragMove.mouseUp);        // same function
   document.addEventListener('mousemove', dragMove.mouseMove);    // won't get addEvent again and again.
   h3.textContent = name;
   div.appendChild(h3);
   // now insert dom
   let wrap = document.createElement('div');
   wrap.classList.add('wrap');
   wrap.appendChild(dom);
   div.appendChild(wrap);

   // float div on the middle of screen
   document.body.appendChild(div);  
   placeCenter(div);                   // must be on screen to get the correct center.
   document.body.removeChild(div);
   return div;
};




export {
   styleSheet,
   getArrow,
   placement,
   getClientPosition,
   getPosition,
   positionDom,
   addMenuItem,
   bindMenuItem,
   bindMenuItemMMB,
   bindMenuItemRMB,
   bindMenuItemMode,
   addLabelInput,
   extractDialogValue,
   runDialog,
   runDialogCenter,
   execDialog,
   openFileAsync,
   openFile,
   openLinkedFileAsync,
   showContextMenu,
   showPopup,
   queuePopupMenu,
   toggleSubmenu,
}