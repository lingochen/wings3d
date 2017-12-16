

import * as view from './wings3d_view';
  
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
      const target = e.target;
      while ( target = target.parentNode ) {
        if ( target.classList && target.classList.contains(className) ) {
          return target;
        }
      }
    }

    return false;
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
    document.addEventListener( "contextmenu", function(e) {
      var canvasInContext = clickInsideElement( e, className );

      if ( canvasInContext ) {
        e.preventDefault();
        contextMenu = view.getContextMenu(e);
        positionDom(contextMenu.menu, getPosition(e));
        toggleMenuOn();
      } else {
        toggleMenuOff();
      }
    }, false);
  }

  /**
   * Listens for click events.
   */
  function clickListener(contextMenuLinkClassName) {
    document.addEventListener( "click", function(e) {
      let clickeElIsLink = clickInsideElement( e, contextMenuLinkClassName );

      if ( clickeElIsLink ) {
        //e.preventDefault();
        menuItemListener( clickeElIsLink, e );
      } else {
        if ( (e.button == 0) || (e.button == 1) ) {
          toggleMenuOff();
        }
      }
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
      //Wings3D.log("contextMenu", contextMenu.menu.id);
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

  /**
   * Dummy action function that logs an action when a menu item link is clicked
   * 
   * @param {HTMLElement} link The link that was clicked
   */
  function menuItemListener( link, ev ) {
    toggleMenuOff();
    help( "wings3d api - " + link.getAttribute("wings3d-api"));
    //Wings3D.callApi(link.getAttribute("wings3d-api", getPosition(ev)));
  }
  /**
   * Run the app.
   */

export {
   init,
   getPosition,
   positionDom,
}