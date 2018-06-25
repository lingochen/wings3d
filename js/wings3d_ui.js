/*
   wings3d, ui and ui utility functions. including tutor.

*/
import * as Hotkey from './wings3d_hotkey';
import * as Wings3D from './wings3d';


function _bindMenuItem(menuItem, id, fn, hotkey, meta) {
   menuItem.addEventListener('click', function(ev) {
      // now run functions
      Wings3D.runAction(id, ev);
   });
   Wings3D.bindAction(id, fn);
   if (hotkey !== undefined) {
      Hotkey.setHotkey(id, hotkey, meta);
   }
}


function bindMenuItem(id, fn, hotkey, meta) {
   const menuItem = document.querySelector('#' + id);
   if (menuItem) {
      _bindMenuItem(menuItem, id, fn, hotkey, meta);
   } else {
      console.log("could not find menuItem " + id);
   }
}


function addMenuItem(menuId, id, menuItemText, fn, hotkey, meta) {
   const menu = document.querySelector(menuId);
   // insert the menuItem 
   const menuItem = document.createElement('li');
   const a = document.createElement('a');
   //a.setAttribute('onmouseover', '');
   a.textContent = menuItemText;
   // append to subment
   menuItem.appendChild(a);
   menu.appendChild(menuItem);
   Wings3D.addActionConstant(id);
   _bindMenuItem(menuItem, id, fn, hotkey, meta);
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

function runDialog(formID, ev, submitCallback, setup) {
   const _pvt = {submitSuccess: false};

   const form = document.querySelector(formID);
   if (form) {
      positionDom(form, getPosition(ev));
      form.style.display = 'block';
      form.reset();
      if (setup) {
         setup();
      }
      const submits = document.querySelectorAll(formID + ' [type="submit"]');
      for (let submit of submits) {
         if ('ok'.localeCompare(submit.value, 'en', {'sensitivity': 'base'}) == 0) {
            submit.addEventListener('click', function oked(ev) {
               _pvt.submitSuccess = true;
               submit.removeEventListener('click', oked);
            });
         } else if ('cancel'.localeCompare(submit.value, 'en', {'sensitivity': 'base'}) == 0) {

         } else {
            console.log('submit ' + submit.value + ' type not supported');
         }
      }
      
      // wait for handling event.
      form.addEventListener('submit', function submitted(ev) {
         if (_pvt.submitSuccess) {
            // get form's input data.
            const elements = form.elements;
            const obj = {};
            for (let element of elements) {
               if ((element.name) && (element.value)) {  // should we check the existence of .name? no name elements automatically excludede? needs to find out.
                  obj[element.name] = element.value;
               }
            }
            submitCallback(obj);     // ask function to handle value
         }
         // hide the dialog, prevent default.
         ev.preventDefault();
         form.style.display = 'none';
         form.removeEventListener('submit', submitted);
      });
   }
};


// fileInput helper
function openFile(fn) {
   const fileInput = document.querySelector('#importFile');    // <input type="file" id="wavefrontObj" style="display:none"/> 
   if (fileInput) {
      fileInput.click();
      fileInput.addEventListener('change', function ok(ev) {
         let fileList = this.files;    // = ev.target.files;
         for (let file of fileList) {
            fn(file);
         }
      });
   }
};


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
   // hide all dropside sibling 
   const grandParent = dropside.parentElement;
   let element = grandParent.firstElementChild;
   do {
      //if (element !== dropside) {
         element.style.display = "block";
      //}
   } while (element = element.nextElementSibling);
   if (submenu.length > 0) {
      const grandA = grandParent.previousElementSibling;
      if (grandA && grandA.tagName == "A") { 
         //grandA.classList.remove("collapse");
         grandA.style.display = "block";
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
      // hide grandParent if needed 
      const grandParent = dropside.parentElement;
      if (submenu.length > 0) {
         const grandA = grandParent.previousElementSibling;
         if (grandA && grandA.tagName == "A") {
            //grandA.classList.add("collapse");
            grandA.style.display = "none";
         }
      }
      // hide all dropside Siblig
      let element = grandParent.firstElementChild;
      do {
         if (element !== dropside) {
            element.style.display = "none";
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
function clickListener() {
   function callBack(e) {
      //let clickeElIsLink = clickInsideElement( e, popupMenuClass );
      //if ( !clickeElIsLink ) {
         if ( (e.button == 0) || (e.button == 1) ) {  // somehow, any click should 
            toggleMenuOff();
            if (!currentMenu) {
               // remove listening event
               document.removeEventListener("click", callBack);
            }
         }
      }

   document.addEventListener( "click", callBack, false);
};
function showContextMenu(popupMenu) {
   if (currentMenu) {
      toggleMenuOff();
   } else {
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




export {
   styleSheet,
   getArrow,
   placement,
   getPosition,
   positionDom,
   addMenuItem,
   bindMenuItem,
   setupDialog,
   runDialog,
   openFile,
   showContextMenu,
   queuePopupMenu,
   toggleSubmenu,
}