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
import './wings3d_view';
import './wings3d_camera';
import './wings3d_interact';
import * as Wings3D from "./wings3d"
import './wings3d_ui';

// plugins
import "../js/plugins/cubeshape.js";
import "../js/plugins/wavefront_obj.js";


Wings3D.start('glcanvas');