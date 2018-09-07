/*
   n cube create. Use Dialog to create the cube.
   todo: to support spherize, rotate, translate, putOnGround. currently only numberOfCuts and size is working.
*/
import * as UI from '../wings3d_ui';
import * as Wings3D from '../wings3d';
import * as View from '../wings3d_view';
import {WingedTopology} from '../wings3d_wingededge';
import {CreatePreviewCageCommand} from '../wings3d_model';


let createCube, createCubeDialog;
document.addEventListener('DOMContentLoaded', function() {
   var _pvt = {previewCage: null};
   _pvt.cubeParams = { numberOfCut: 1,
                       spherize: false,
                       size: {x: 2.0, y: 2.0, z: 2.0},
                       rotate: {x: 0.0, y: 0.0, z: 0.0},
                       translate: {x: 0.0, y: 0.0, z: 0.0},
                       putOnGround: false,

   };
   _pvt.creationCount = 0;

   _pvt.resetCubeParams = function() {
      // reset.cubeParams.
      _pvt.cubeParams.numberOfCut = 1;
      _pvt.cubeParams.spherize = false;
      _pvt.cubeParams.size.x = _pvt.cubeParams.size.y = _pvt.cubeParams.size.z = 2.0;
      _pvt.cubeParams.rotate.x = _pvt.cubeParams.rotate.y = _pvt.cubeParams.rotate.z = 0.0;
      _pvt.cubeParams.translate.x = _pvt.cubeParams.translate.y = _pvt.cubeParams.translate.z = 0.0;    
      _pvt.cubeParams.putOnGround = false;
   };

   _pvt.cancelPreview = function() {
      if (_pvt.previewCage !== null) {
         // remove it from world.
         View.removeFromWorld(_pvt.previewCage);
         _pvt.previewCage.freeBuffer();
         _pvt.previewCage = null;
      } 
   };

   _pvt.updatePreview = function() {
      if (_pvt.previewCage !== null) {
         // remove it from world.
         View.removeFromWorld(_pvt.previewCage);
         _pvt.previewCage.freeBuffer();
         _pvt.previewCage = null;
      }
      createCube(_pvt.cubeParams.size, _pvt.cubeParams.numberOfCut, _pvt.cubeParams.translate, _pvt.cubeParams.rotate, _pvt.cubeParams.putOnGround);
   };

   createCube = function(size, numberOfCut, translate, rotate, onGround) {
      // create, one 
      let preview = View.putIntoWorld();    //new WingedTopology; create WingedTopology(PreviewCage) and putIntoWorld.
      let mesh = preview.geometry;
      var map = {};
      function addVertexUnique(pt) {
         var x = pt[0], y = pt[1], z = pt[2];
         var key = x.toFixed(6) + "," + y.toFixed(6) + "," + z.toFixed(6); // convert to fixed decimal, so no needs for (x-x1<epsilon)
         if (!map.hasOwnProperty(key)) {
            map[key] = mesh.addVertex(pt);
         }
         return map[key].index;
      }
      function makeFaces(getVertexFN) {
         var offset = 0;
         var vertexIndex = [];
         var polygon = [];
         for (let up = 0; up <= numberOfCut; ++up) {
            for (let rt = 0; rt <= numberOfCut; ++rt) { // add vertex and get vertices index.
               vertexIndex.push( addVertexUnique(getVertexFN(up, rt)) );
            }
            if (up > 0) {   // add polygon faces, ccw order
               for (let i = 0 ; i<numberOfCut; ++i) {
                  polygon.push( vertexIndex[offset+i] );
                  polygon.push( vertexIndex[offset+i+1] );
                  polygon.push( vertexIndex[offset+i+1+numberOfCut+1] );
                  polygon.push( vertexIndex[offset+i+numberOfCut+1] );
                  mesh.addPolygon(polygon);
                  polygon.length = 0;
               }
               offset += numberOfCut+1;  // done, add offset 
            }
         }
      }
      // get rotation
      let angleQ = quat.create();
      quat.fromEuler(angleQ, rotate.x, rotate.y, rotate.z);
      const rotateM3 = mat3.create();
      mat3.fromQuat(rotateM3, angleQ);

      // setup start, end
      const org = vec3.fromValues( -(size.x / 2.0), -(size.y / 2.0), -(size.z / 2.0));
      const offset = vec3.fromValues(translate.x, translate.y, translate.z);
      if (onGround) {
         offset[1] = -org[1];
      }
      const x = vec3.fromValues(size.x, 0.0, 0.0);
      const y = vec3.fromValues(0.0, size.y, 0.0);
      const z = vec3.fromValues(0.0, 0.0, size.z);
      vec3.transformMat3(org, org, rotateM3);
      vec3.transformMat3(x, x, rotateM3);
      vec3.transformMat3(y, y, rotateM3);
      vec3.transformMat3(z, z, rotateM3);
      const dest = vec3.create();

      // creating step size for each cut
      const stepX = [], stepY = [], stepZ = [];
      for (let i = 0; i <= numberOfCut; ++i) {
         const cut = i / numberOfCut;
         const xStep = vec3.create();
         vec3.scale(xStep, x, cut);
         stepX.push( xStep );
         const yStep = vec3.create();
         vec3.scale(yStep, y, cut);
         stepY.push( yStep );
         const zStep = vec3.create();
         vec3.scale(zStep, z, cut);
         stepZ.push( zStep );
      }
      // right face (x-, -y+, -z)
      vec3.add(dest, org, x);
      makeFaces(function(up, rt) {
         return vec3.fromValues(dest[0]-stepX[rt][0]+stepY[up][0]+offset[0], 
                                dest[1]-stepX[rt][1]+stepY[up][1]+offset[1], 
                                dest[2]-stepX[rt][2]+stepY[up][2]+offset[2]);
      });

      // bottom face (x-, -y, -z+)
      makeFaces(function(up, rt){
         return [dest[0]-stepX[up][0]+stepZ[rt][0]+offset[0], 
                 dest[1]-stepX[up][1]+stepZ[rt][1]+offset[1], 
                 dest[2]-stepX[up][2]+stepZ[rt][2]+offset[2]];
      });

      // front faces vertex (x, -y+, z-)
      //vec3.add(dest, org, x);
      vec3.add(dest, dest, z);
      makeFaces(function(up, rt) {
         return [dest[0]+stepY[up][0]-stepZ[rt][0]+offset[0], 
                 dest[1]+stepY[up][1]-stepZ[rt][1]+offset[1], 
                 dest[2]+stepY[up][2]-stepZ[rt][2]+offset[2]];
      });

      // left face (-x+, -y+, z)
      vec3.add(dest, org, z);
      makeFaces(function(up, rt) {
         return [dest[0]+stepX[rt][0]+stepY[up][0]+offset[0], 
                 dest[1]+stepX[rt][1]+stepY[up][1]+offset[1], 
                 dest[2]+stepX[rt][2]+stepY[up][2]+offset[2]]; 
      });

      // back face (-x, -y+, -z+)
      makeFaces(function(up, rt){
         return [org[0]+stepY[up][0]+stepZ[rt][0]+offset[0], 
                 org[1]+stepY[up][1]+stepZ[rt][1]+offset[1], 
                 org[2]+stepY[up][2]+stepZ[rt][2]+offset[2]];
      });

      // top face (x-, y, z-)
      vec3.add(dest, org, x);
      vec3.add(dest, dest, y);
      vec3.add(dest, dest, z);
      makeFaces(function(up, rt){
         return [dest[0]-stepX[up][0]-stepZ[rt][0]+offset[0], 
                 dest[1]-stepX[up][1]-stepZ[rt][1]+offset[1], 
                 dest[2]-stepX[up][2]-stepZ[rt][2]+offset[2]];
      });

      _pvt.previewCage = preview;   //View.putIntoWorld(); already.
      View.updateWorld();
   }; 

   // insert a hidden form into document
   var form = document.getElementById('createCubeForm');
   if (form === null) {
      form = document.createElement('form');
      form.setAttribute('id', 'createCubeForm');
      form.innerHTML = `
         <span class="close">&times;</span>
         <h3>Cube Options</h3>
         <fieldset> 
            <legend>Number of Cuts</legend>
            <input name="numberOfCuts" type="range" min="1" max="20" value="1" onchange="this.nextElementSibling.value=this.value" />
            <input name="numberOfCuts" type="number" min="1" max="20" value="1" step="1" onchange="this.previousElementSibling.value=this.value" />
         </fieldset>
         <div>
            <label>X <input type="number" name="size_x" value="2.0" step="0.5"></label><br>
            <label>Y <input type="number" name="size_y" value="2.0" step="0.5"></label><br>
            <label>Z <input type="number" name="size_z" value="2.0" step="0.5"></label>
         </div>
         <fieldset>
            <legend>Spherize</legend>
            <label><input type='radio' name='sphere' value='true' disabled>Yes</label>
            <label><input type='radio' name='sphere' value='false' checked disabled>No<label>
         </fieldset>
         <fieldset>
            <label>Rotate</label>
            <span>
               <label>X <input type="number" name="rotate_x" value="0.0" step="1"></label><br>
               <label>Y <input type="number" name="rotate_y" value="0.0" step="1"></label><br>
               <label>Z <input type="number" name="rotate_z" value="0.0" step="1"></label>    
            </span>
            <label>Move</label>
            <span>
               <label>X <input type="number" name="translate_x" value="0.0" step="0.5"></label><br>
               <label>Y <input type="number" name="translate_y" value="0.0" step="0.5"></label><br>
               <label>Z <input type="number" name="translate_z" value="0.0" step="0.5"></label>
            </span>
            <div>
               <label><input type="checkbox" name="ground">Put on Ground</label>
            </div>
         </fieldset>
          <button type="reset" value="Reset">Reset</button>
          <button type="submit" value="Ok">Ok</button>
      `;
      // hide, then append into document.body.
      form.style.display = 'none'; 
      form.style.position = 'absolute';
      form.className += 'dialog';
      document.body.appendChild(form);
      // handlingEvent.
      var close = form.getElementsByClassName("close")[0];
      close.addEventListener('click',function(e) {
         form.style.display = 'none';
         // remove object from world.
         _pvt.cancelPreview();
      });
      // submit button.
      form.addEventListener('submit', function(ev) {
         ev.preventDefault();
         form.style.display = 'none';
         // accept previewCage to the world
         View.undoQueue( new CreatePreviewCageCommand(_pvt.previewCage) );
         _pvt.previewCage.name = "Cube" + (_pvt.creationCount+1);
         Wings3D.log("createCube", _pvt.previewCage);
         _pvt.previewCage = null;
         _pvt.creationCount++;
      });
      var cutHandler = function(ev) {
         _pvt.cubeParams.numberOfCut = Number(ev.target.value);
         _pvt.updatePreview();
      };
      // var inputs = form.getElementsByTagName('input');
      var cut = document.querySelectorAll('#createCubeForm input[name="numberOfCuts"]');
      cut[0].addEventListener('change', cutHandler);
      cut[1].addEventListener('change', cutHandler);
      var size = document.querySelectorAll('#createCubeForm input[name^="size_"]');
      size[0].addEventListener('change', function(ev) { 
         _pvt.cubeParams.size.x = Number(ev.target.value);
         _pvt.updatePreview();
      });
      size[1].addEventListener('change', function(ev) { 
         _pvt.cubeParams.size.y = Number(ev.target.value);
         _pvt.updatePreview();
      });
      size[2].addEventListener('change', function(ev) {
         _pvt.cubeParams.size.z = Number(ev.target.value);
         _pvt.updatePreview();
      });
      const translate = document.querySelectorAll('#createCubeForm input[name^="translate_"]');
      translate[0].addEventListener('change', function(ev) {
         _pvt.cubeParams.translate.x = Number(ev.target.value);
         _pvt.updatePreview();
      });
      translate[1].addEventListener('change', function(ev) {
         _pvt.cubeParams.translate.y = Number(ev.target.value);
         _pvt.updatePreview();
      });
      translate[2].addEventListener('change', function(ev) {
         _pvt.cubeParams.translate.z = Number(ev.target.value);
         _pvt.updatePreview();
      });
      // putonGround
      const ground = document.querySelectorAll('#createCubeForm input[name="ground"]');
      ground[0].addEventListener('change', function(ev) {
         if (ground[0].checked) {
            translate[1].disabled = true;
            _pvt.cubeParams.putOnGround = true;
         } else {
            translate[1].disabled = false;
            _pvt.cubeParams.putOnGround = false;
         }
         _pvt.updatePreview();
      });
      // rotation
      const rotate = document.querySelectorAll('#createCubeForm input[name^="rotate_"]');
      rotate[0].addEventListener('change', function(ev) {
         _pvt.cubeParams.rotate.x = Number(ev.target.value);
         _pvt.updatePreview();
      });
      rotate[1].addEventListener('change', function(ev) {
         _pvt.cubeParams.rotate.y = Number(ev.target.value);
         _pvt.updatePreview();
      });
      rotate[2].addEventListener('change', function(ev) {
         _pvt.cubeParams.rotate.z = Number(ev.target.value);
         _pvt.updatePreview();
      });
      form.addEventListener('change', function(ev) {
         ev.stopPropagation();
         if (ev.target.name !== null) {
            help(ev.target.name + " = " + ev.target.value);    
         }
      });
      form.addEventListener('reset', function(ev) {
         _pvt.resetCubeParams();
         // setup the first one.
         _pvt.updatePreview();
      });
   }

   // attach to click event.
   var menuItem = document.querySelector("#createCube");
   if (menuItem) {
      menuItem.addEventListener("click", function(ev) {
         // get exact position,
         var position = UI.getPosition(ev);
         // run createCube dialog
         createCubeDialog(position);
         Wings3D.log(Wings3D.action.createCubeDialog);
      })
   }
   menuItem = document.querySelector("#createCubePref"); // preference optional dialog
   if (menuItem) {
      menuItem.addEventListener("click", function(ev) {
         // get exact position,
         var position = UI.getPosition(ev);
         // run createCube dialog
         createCubeDialog(position);
         Wings3D.log(Wings3D.action.createCubeDialog);
      })
   }

   //
   createCubeDialog = function(mousePosition) {
      // display dialog, shown at the mouse location.
      form.style.display = 'block';
      // position form.
      UI.positionDom(form, mousePosition);
      _pvt.previewCage = null;
      // reset dialog value.
      form.reset();
      // get sphere value.
      // _pvt.cubeParams.spherize = form.querySelector('input[name="sphere"]:checked').value;
   };
}, false);


export {
   createCube,
   createCubeDialog,
}