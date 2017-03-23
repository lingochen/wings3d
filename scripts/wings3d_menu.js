function createMenuHandler(view, contextClassName) {
  
  "use strict";

  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //
  // H E L P E R    F U N C T I O N S
  //
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  var _pvt = {};

  /**
   * Function to check if we clicked inside an element with a particular class
   * name.
   * 
   * @param {Object} e The event
   * @param {String} className The class name to check against
   * @return {Boolean}
   */
   var clickInsideElement = function( e, className ) {
    if ( e.target.classList.contains(className) ) {
      return e.target;
    } else {
      var target = e.target;
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
  _pvt.getPosition = function(e) {
    var posx = 0;
    var posy = 0;
    
    if (e.pageX || e.pageY) {
      posx = e.pageX;
      posy = e.pageY;
    } else if (e.clientX || e.clientY) {
      posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    return {
      x: posx,
      y: posy
    }
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
  var contextMenuLinkClassName = "context-menu__link";
  var contextMenuActive = "context-menu--active";

  _pvt.view = view;
//  _pvt.contextClassName = contextClassName;
  _pvt.menuState = 0;

  /**
   * Initialise our application's code.
   */
  function init() {
    contextListener();
    clickListener();
//    keyupListener();
//    resizeListener();
  }

  /**
   * Listens for contextmenu events.
   */
  function contextListener(className) {
    document.addEventListener( "contextmenu", function(e) {
      var canvasInContext = clickInsideElement( e, contextClassName );

      if ( canvasInContext ) {
        e.preventDefault();
        _pvt.contextMenu = _pvt.view.getContextMenu(e);
        positionMenu(e);
        toggleMenuOn();
      } else {
        toggleMenuOff();
      }
    }, false);
  }

  /**
   * Listens for click events.
   */
  function clickListener() {
    document.addEventListener( "click", function(e) {
      var clickeElIsLink = clickInsideElement( e, contextMenuLinkClassName );

      if ( clickeElIsLink ) {
        e.preventDefault();
        menuItemListener( clickeElIsLink );
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
    if ( _pvt.menuState !== 1 ) {
      _pvt.menuState = 1;
      _pvt.contextMenu.menu.classList.add( contextMenuActive );
    }
  }

  /**
   * Turns the custom context menu off.
   */
  function toggleMenuOff() {
    if ( _pvt.menuState !== 0 ) {
      _pvt.menuState = 0;
      _pvt.contextMenu.menu.classList.remove( contextMenuActive );
    }
  }

  /**
   * Positions the menu properly.
   * 
   * @param {Object} e The event
   */
  function positionMenu(e) {
    var clickCoords = _pvt.getPosition(e);

    var menuWidth = _pvt.contextMenu.menu.offsetWidth + 4;
    var menuHeight = _pvt.contextMenu.menu.offsetHeight + 4;

    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;

    if ( (windowWidth - clickCoords.x) < menuWidth ) {
      _pvt.contextMenu.menu.style.left = windowWidth - menuWidth + "px";
    } else {
      _pvt.contextMenu.menu.style.left = clickCoords.x + "px";
    }

    if ( (windowHeight - clickCoords.y) < menuHeight ) {
      _pvt.contextMenu.menu.style.top = windowHeight - menuHeight + "px";
    } else {
      _pvt.contextMenu.menu.style.top = clickCoords.y + "px";
    }
  }

  /**
   * Dummy action function that logs an action when a menu item link is clicked
   * 
   * @param {HTMLElement} link The link that was clicked
   */
  function menuItemListener( link ) {
    toggleMenuOff();
    help( "wings3d api - " + link.getAttribute("wings3d-api"));
    Wings3D.callApi(link.getAttribute("wings3d-api"));
  }
  /**
   * Run the app.
   */
   return {
      setup: init,
      // tearDown:
   };
}
