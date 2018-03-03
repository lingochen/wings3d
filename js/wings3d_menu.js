

import * as UI from './wings3d_ui';
import * as View from './wings3d_view';
import * as Wings3D from './wings3d';
  
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //
  // H E L P E R    F U N C T I O N S
  //
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////


  /**
   * Function to check if we clicked inside an element with a particular class
   * name.
   * 
   * @param {Object} e The event
   * @param {String} className The class name to check against
   * @return {Boolean}
   */
   function clickInsideElement( e, className ) {
    if ( e.target.classList.contains(className) ) {
      return e.target;
    } else {
      let target = e.target;
      while ( target = target.parentNode ) {
        if ( target.classList && target.classList.contains(className) ) {
          return target;
        }
      }
    }

    return false;
  };


  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //
  // C O R E    F U N C T I O N S
  //
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  
  /**
   * Variables.
   */
  let menuState = 0;
  let contextMenu = null;   // current context Menu

  /**
   * Initialise our application's code.
   */
  function init(contextClassName, contextMenuLinkClassName) {
    contextListener(contextClassName);
    clickListener(contextMenuLinkClassName);
//    keyupListener();
//    resizeListener();
   // init menubar, bind on hover function (mouseEnter, mouseLeave, )
      let dropdowns = document.querySelectorAll("#menubar .dropdown");
      for (let dropdown of dropdowns) {
         dropdown.addEventListener("mouseenter", function(ev) {
            dropdown.classList.add("hover");
         });
         dropdown.addEventListener("mouseleave", function(ev) {
            dropdown.classList.remove("hover");
         });
      }
  }


  /**
   * Listens for contextmenu events.
   */
function contextListener(className) {
    let createObjectContextMenu = {menu: document.querySelector('#context-menu')};
    function getContextMenu(ev) {
      let popupMenu = View.currentMode().getContextMenu();
      if (popupMenu && popupMenu.menu) {
         return popupMenu;
      } else {
         // return default create object menu
         return createObjectContextMenu;
      }
   }; 

    document.addEventListener("contextmenu", function(e) {
      let  canvasInContext = clickInsideElement( e, className );

      if ( canvasInContext ) {
        e.preventDefault();
        contextMenu = getContextMenu(e);
        UI.positionDom(contextMenu.menu, UI.getPosition(e));
        toggleMenuOn();
      } else {
        toggleMenuOff();
      }
    }, false);
};

  /**
   * Listens for click events.
   */
  function clickListener(contextMenuLinkClassName) {
    document.addEventListener( "click", function(e) {
      let clickeElIsLink = clickInsideElement( e, contextMenuLinkClassName );

      //if ( !clickeElIsLink ) {
        if ( (e.button == 0) || (e.button == 1) ) {
          toggleMenuOff();
        }
      //}
    }, false);
  }

  /**
   * Listens for keyup events.
   */
//  function keyupListener() {
//    window.onkeyup = function(e) {
//      if ( e.keyCode === 27 ) {
//        toggleMenuOff();
//      }
//    }
//  }

  /**
   * Window resize event listener
   */
//  function resizeListener() {
//    window.onresize = function(e) {
//      toggleMenuOff();
//    };
//  }

  /**
   * Turns the custom context menu on.
   */
  function toggleMenuOn() {
    if ( menuState !== 1 ) {
      menuState = 1;
      contextMenu.menu.style.display = "block";
      Wings3D.log(Wings3D.action.contextMenu, contextMenu.menu.id);   // needs to 
    }
  }

  /**
   * Turns the custom context menu off.
   */
  function toggleMenuOff() {
    if ( menuState !== 0 ) {
      menuState = 0;
      contextMenu.menu.style.display = "none";
    }
  }


Wings3D.onReady(function() {
//   init('content', 'popupmenu');
});