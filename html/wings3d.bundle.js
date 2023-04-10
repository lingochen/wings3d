// app.js
//  for bundling and initialization
//

// import js
import './js/wings3d_view.js';
import './js/wings3d_camera.js';
import './js/wings3d_interact.js';
import * as Wings3D from "./js/wings3d.js"
import './js/wings3d_ui.js';
import './js/wings3d_i18n.js';
import './js/wings3d_primitive.js';
import './js/wings3d_uicore.js';
import './js/ui/wings3d_tabpanel.js';

// plugins
import "./js/plugins/wavefront_obj.js";


Wings3D.start('glcanvas');
