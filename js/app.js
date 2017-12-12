// app.js
//  for bundling and initialization
//

// import css, should bundle it to a different files.
import "../css/default.css";
import "../css/menu.css";
import "../css/button.css";
import "../css/form.css";
import "../css/bubble.css";

// import js
import * as Wings3D from "./wings3d"
import "../js/plugins/cubeshape.js";
import "../js/plugins/wavefront_obj.js";

(function ready(fn) {
   if (document.readyState != 'loading'){
     fn();
   } else {
     document.addEventListener('DOMContentLoaded', fn);
   }
 })(() => {Wings3D.start('glcanvas');});