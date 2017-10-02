/*
   n cube create. Use Dialog to create the cube.
   todo: to support spherize, rotate, translate, putOnGround. currently only numberOfCuts and size is working.
*/
document.addEventListener('DOMContentLoaded', function() {
   var api = Wings3D.apiExport;
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
         api.removeFromWorld(_pvt.previewCage);
         _pvt.previewCage.freeBuffer();
         _pvt.previewCage = null;
      } 
   };

   _pvt.updatePreview = function() {
      if (_pvt.previewCage !== null) {
         // remove it from world.
         api.removeFromWorld(_pvt.previewCage);
         _pvt.previewCage.freeBuffer();
         _pvt.previewCage = null;
      }
      api.createCube(_pvt.cubeParams.size, _pvt.cubeParams.numberOfCut);
   };

   api.createCube = api.createCube || function(size={x:2.0,y:2.0,z:2.0}, numberOfCut=5) {//, translate, rotate, aboveGround = false) {
      // create, one 
      var mesh = new WingedTopology;
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
         for (up = 0; up <= numberOfCut; ++up) {
            for (rt = 0; rt <= numberOfCut; ++rt) { // add vertex and get vertices index.
               vertexIndex.push( addVertexUnique(getVertexFN(up, rt)) );
            }
            if (up > 0) {   // add polygon faces, ccw order
               for (i = 0 ; i<numberOfCut; ++i) {
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

      // setup start, end
      var org = {x: -(size.x / 2.0), y: -(size.y / 2.0), z: -(size.z / 2.0)};
      var dest = {x: org.x+size.x, y: org.y+size.y, z: org.z+size.z};
      // creating step size for each cut
      var step = [];
      for (i = 0; i <= numberOfCut; ++i) {
         step.push( {x: size.x * (i/numberOfCut),
                     y: size.y * (i/numberOfCut),
                     z: size.z * (i/numberOfCut)
                    });
      }
      // front faces vertex (x, -y+, z-)
      makeFaces(function(up, rt) {
         return [dest.x, org.y+step[up].y, dest.z-step[rt].z];
      });

      // left face (-x+, -y+, z)
      makeFaces(function(up, rt) {
         return [org.x+step[rt].x, org.y+step[up].y, dest.z]; 
      });

      // right face (x-, -y+, -z)
      makeFaces(function(up, rt) {
         return [dest.x-step[rt].x, org.y+step[up].y, org.z];
      });

      // back face (-x, -y+, -z+)
      makeFaces(function(up, rt){
         return [org.x, org.y+step[up].y, org.z+step[rt].z];
      });

      // top face (x-, y, z-)
      makeFaces(function(up, rt){
         return [dest.x-step[up].x, dest.y, dest.z-step[rt].z];
      });

      // bottom face (x-, -y, -z+)
      makeFaces(function(up, rt){
         return [dest.x-step[up].x, org.y, org.z+step[rt].z];
      });

      _pvt.previewCage = api.putIntoWorld(mesh);
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
            <label><input type='radio' name='sphere' value='true'>Yes</label>
            <label><input type='radio' name='sphere' value='false' checked>No<label>
         </fieldset>
         <fieldset>
            <label>Rotate</label>
            <span>
               <label>X <input type="number" name="rotate_x" value="0.0" step="0.5"></label><br>
               <label>Y <input type="number" name="rotate_y" value="0.0" step="0.5"></label><br>
               <label>Z <input type="number" name="rotate_z" value="0.0" step="0.5"></label>    
            </span>
            <label>Move</label>
            <span>
               <label>X <input type="number" name="translate_x" value="0.0" step="0.5"></label><br>
               <label>Y <input type="number" name="translate_y" value="0.0" step="0.5"></label><br>
               <label>Z <input type="number" name="translate_z" value="0.0" step="0.5"></label>
            </span>
            <div>
               <label><input type="checkbox">Put on Ground</label>
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
         api.undoQueue( new CreatePreviewCageCommand(_pvt.previewCage) );
         Wings3D.log("createCube", _pvt.previewCage);
         _pvt.previewCage.name = "Cube" + (_pvt.creationCount+1);
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
      //
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
         var position = Wings3D.contextmenu.getPosition(ev);
         // run createCube dialog
         api.createCubeDialog(position);
         Wings3D.log("createCubeForm");
      })
   }
   //
   api.createCubeDialog = api.createCubeDialog || function(mousePosition) {
      // display dialog, shown at the mouse location.
      form.style.display = 'block';
      // position form.
      Wings3D.contextmenu.positionDom(form, mousePosition);
      _pvt.previewCage = null;
      // reset dialog value.
      form.reset();
      // get sphere value.
      // _pvt.cubeParams.spherize = form.querySelector('input[name="sphere"]:checked').value;
   };
}, false);
