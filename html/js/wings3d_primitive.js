/**
 * primitives maker
 * 
 */

import * as UI from './wings3d_ui.js';
import * as Wings3D from './wings3d.js';
import * as View from './wings3d_view.js';
import {i18nElement, i18nSetup} from './wings3d_i18n.js';
import {Material} from './wings3d_material.js';
import {CreatePreviewCageCommand} from './wings3d_model.js';
import * as Shape from './wings3d_shape.js';
import * as OpenSave from './wings3d_opensave.js'
const {quat, mat4} = glMatrix;


/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
const htmlToElement = (function() {
   const template = document.createElement('template');

   return function(html, ...handlers) {
      //const template = document.getElementById("shapeParameters");
      //html = html.trim(); // Never return a text node of whitespace as the result
      template.innerHTML = html;
      const element = template.content.firstChild;
      if (handlers) {
         handlers.map(function(handler){
            element.addEventListener(handler[0], handler[1]);
          });
      }

      return element;
   };
})();

function tag(html, ...theElems) {
   
   const ret = htmlToElement(html);

   theElems.map((element)=>{
      ret.appendChild(element);
    });
   return ret;
}

function listener(element, ...handlers) {
   for (let [event, listener] of handlers) {
      element.addEventListener(event, handler);
    }

   return element;
}

function hr() {
   return document.createElement('hr');
}

function sliderInput(name, value, handler) {
   let attribute = "";
   for (let [key, val] of Object.entries(value)) {
      attribute += ` ${key}='${val}'`;
   }
   const slider = tag("<fieldset>",
      htmlToElement('<legend data-i18n>Number of Cuts</legend>'),
      htmlToElement(`<input type='range' name=${name}${attribute} onchange="this.nextElementSibling.value=this.value">`, ['change', handler]),
      htmlToElement(`<input type='number' name=${name}${attribute} onchange="this.previousElementSibling.value=this.value">`, ['change', handler])  
   );
   return slider;
}

function labelCheckbox(name, value, handler) {
   const label = document.createElement("label");
   let attribute = "";
   for (let [key, val] of Object.entries(value)) {
      attribute += ` ${key}='${val}'`;
   }
   const input = htmlToElement(`<input type='checkbox'${attribute}>`, ['change', handler]);

   label.appendChild(input);
   label.appendChild(htmlToElement(`<span data-i18n>${name}</span>`));
   return label;
};

function labelRadio(name, group, handler, checked="") {
   const label = document.createElement("label");
   const input = htmlToElement(`<input type="radio" name=${group} ${checked}>`, ['change', handler]);
   label.appendChild(input);
   label.appendChild(htmlToElement(`<span data-i18n>${name}</span>`));
   return label;
};

function numberInput(name, value, handler, isTranslate=true) {
   let i18nDat = isTranslate ? 'data-i18n' : '';
   const label = htmlToElement(`<label><span ${i18nDat}>${name}</span></label>`)
   let attribute = "";
   for (let [key, val] of Object.entries(value)) {
      attribute += ` ${key}='${val}'`;
   }
   const input = htmlToElement(`<input type='number'${attribute}>`, ['change', handler]);

   label.appendChild(input);
   return label;
};

function textInput(name, value, handler) {
   const label = htmlToElement(`<label><span data-i18n>${name}</span></label>`)
   let attribute = "";
   for (let [key, val] of Object.entries(value)) {
      attribute += ` ${key}='${val}'`;
   }
   const input = htmlToElement(`<input type='text'${attribute}>`, ['change', handler]);

   label.appendChild(input);
   return label;
}

// add common putOn
function commonPutOn(maker) {
   let translateY;
   return tag('<fieldset>',
         tag('<div class="horizontalPref alignCenter">',
            htmlToElement('<label data-i18n>Rotate</label>'),
            tag('<span class="verticalPref">', numberInput('X', {value: 0, step: 1, name: 'rotate_x'}, function(evt) {maker.rotate(0, evt.target.value);}, false), 
               numberInput('Y', {value: 0, step: 1, name: 'rotate_y'}, function(evt) {maker.rotate(1, evt.target.value);}, false), 
               numberInput('Z', {value: 0, step: 1, name: 'rotate_z'}, function(evt) {maker.rotate(2, evt.target.value);}, false)),
            htmlToElement('<label data-i18n>Move</label>'),
            tag('<span class="verticalPref">', numberInput('X', {value: 0, step: 1, name: 'translate_x'}, function(evt) {maker.translate(0, evt.target.value);}, false), 
               translateY = numberInput('Y', {value: 0, step: 1, name: 'translate_y'}, function(evt) {maker.translate(1, evt.target.value);}, false), 
               numberInput('Z', {value: 0, step: 1, name: 'translate_z'}, function(evt) {maker.translate(2, evt.target.value);}, false))),
         labelCheckbox('Put on Ground', {name: 'ground'}, function(evt){
            const checked = evt.target.checked;
            translateY.disabled = checked;         // no translateY when we are attach to the ground.
            maker.putOnGround(checked);
          }));
}

function draggable(container, dragItem) {
   let currentX;
   let currentY;

   dragItem.addEventListener("pointerdown", dragStart, false);
   dragItem.addEventListener("pointerup", dragEnd, false);
   dragItem.classList.add("draggable");

   function dragStart(e) {
      currentX = e.clientX;
      currentY = e.clientY;
      document.body.addEventListener("pointermove", drag, false);   // if attach to dragItem, mousemove could move out of focus.
      dragItem.classList.add("dragging");
   }

   function dragEnd(e) {
      dragItem.classList.remove("dragging");
      document.body.removeEventListener("pointermove", drag);
   }

   function drag(e) {
      e.preventDefault();
     
      container.style.top = (container.offsetTop + e.clientY - currentY) + "px";
      container.style.left = (container.offsetLeft + e.clientX - currentX) + "px";

      currentX = e.clientX;
      currentY = e.clientY;
   }
};




function makePrimitive(evt, name, maker, ...theDoms) {
   const panelDiv = document.getElementById("shapeParameters");
   if (!panelDiv) {
      console.log("no place for form");
      return;
   }
   const form = htmlToElement('<form class="dialog small"></form>', 
                              ['submit', function(evt){
                                 evt.preventDefault();
                                 if (evt.submitter.value === 'Ok') {
                                    maker.confirm();
                                 } else {
                                    maker.cancel();
                                 } 
                                 panelDiv.removeChild(form);
                              }]);
   let header;
   form.appendChild(header = tag(`<h3 class="primitiveHeader"><span data-i18n>${name}</span></h3>`,
                               htmlToElement('<span class="close">&times;</span>', 
                              ['click', function(evt){maker.cancel(); document.body.removeChild(form);}]))
                               );
   if (theDoms) {
      for (let dom of theDoms) {
         form.appendChild(dom);
      }
   }

   // now add ok, cancel button
   form.appendChild(tag('<div>', htmlToElement('<button type="submit" value="Cancel">Cancel</button>'), 
                               htmlToElement('<button type="submit" value="Ok">Ok</button>')
                       ));

   //draggable(form, header);
   i18nElement(i18nSetup(form));
   // display dialog, shown at the mouse location.   
   form.style.display = 'flex';
   //UI.positionDom(form, UI.getPosition(evt));
   panelDiv.appendChild(form);
};



class PrimitiveMaker {
   constructor(name, maker, options) {
      this._originalName = name;
      this.name = name;
      this._textureName = "";
      this._useTextureName = {material: false, object: false};
      this.cage = null;
      this.maker = maker;
      this.options = Object.assign({}, options);
      this.rotation = [0, 0, 0];
      this._orientation = [0, 0, 0];
      this._scale = [1, 1, 1];
      this._origin = [0, 0, 0];
      this.translation = [0, 0, 0];
      this.ground = false;
      this.default = {};
      Object.assign(this.default, options);
   }

   _deleteCage() {
      if (this.cage) {
         View.removeFromWorld(this.cage);
         this.cage.freeBuffer();
         this.cage = null;
      }
   }

   cancel() {
      this._deleteCage();
      if (this.newMaterial) { // does the same to new material if exists.
         View.deleteMaterial(this.newMaterial);
         this.newMaterial = null;
      }
   }

   confirm() {
      View.undoQueue( new CreatePreviewCageCommand(this.cage) );
      PrimitiveMaker.creationCount++;
      //this.cage.name = this.name + PrimitiveMaker.creationCount;
   }

   make() {
      this._deleteCage();   // remove object first if any
      
      View.createIntoWorld((cage)=> {
         this.cage = cage;
         this.updateName(this._originalName);
         let material = (this.newMaterial ? this.newMaterial : Material.default);
         this.originY = this.maker(cage.geometry, material, this.options);
         
         // transform.
         this.snapshot = cage.snapshotTransformBodyGroup(true);
         this.transform();         
       });
   }

   transform(restore) { // rotate and translate 
      let update = false;
      if (restore) {
         this.cage.restoreMoveSelection(restore);
         update = true;
      }
      // compute transform
      let angleQ = quat.create();
      quat.fromEuler(angleQ, this.rotation[0]+this._orientation[0], this.rotation[1]+this._orientation[1], this.rotation[2]+this._orientation[2]);
      const transform = mat4.create();
      mat4.fromRotationTranslationScaleOrigin(transform, angleQ, this.translation, this._scale, this._origin);
      if (this.ground) {
         transform[13] = -this.originY;   // move origin to (y=0)
      }

      // transform cage, if not identity.
      const identMat4 = mat4.create();
      mat4.identity(identMat4);
      if (!mat4.exactEquals(identMat4, transform)) {
         this.cage.transformSelection(this.snapshot, (working, _center)=> {
            mat4.copy(working, transform);
          });
          update = true;
      }
      if (update) {
         this.cage.updatePosition(this.snapshot);
      }
    }

   putOnGround(checked) {
      this.ground = checked;
      this.transform(this.snapshot);
   }

   reset() {
      Object.assign(this.options, this.default);
      this.ground = false;
      this.rotation = [0,0,0];
      this.translation = [0,0,0];
      this._scale = [1, 1, 1];
      this.make();
   }

   setMaterial(material) {
      this.newMaterial = material;
   }

   getMaterialName() {
      if (this.newMaterial) {
         return this.newMaterial.name;
      }
      return "";
   }

   origin(index, value) {
      this._origin[index] = value;
      this.transform(this.snapshot);
   }

   rotate(index, value) {
      this.rotation[index] = value;
      this.transform(this.snapshot);
   }
   
   orientation(rotate) {
      this._orientation[0] = rotate[0];
      this._orientation[1] = rotate[1];
      this._orientation[2] = rotate[2];
      this.transform(this.snapshot);
   }

   scale(index, value) {
      this._scale[index] = value;
      this.transform(this.snapshot);
   }

   translate(index, value) {
      this.translation[index] = value;
      this.transform(this.snapshot);
   }

   update(option, value) {
      this.options[option] = value;
      this.make();
   }

   updateName(newName) {
      this.name = newName;
      if (this._originalName == newName) {
         this.name += (PrimitiveMaker.creationCount + 1);
      }
      if (!this._useTextureName.material) {
         if (this.newMaterial) {
            this.newMaterial.name = this.name;
         }
      }
      if (!this._useTextureName.object) {
         if (this.cage) {
            this.cage.name = this.name;
         }
      }
   }

   useTextureName(material, object) {
      this._useTextureName.material = material;
      this._useTextureName.object = object;
      if (this.newMaterial) {
         if (material) {
            this.newMaterial.name = this._textureName;
         } else {
            this.newMaterial.name = this.name;
         }
      }
      if (this.cage) {
         if (object) {
            this.cage.name = this._textureName;
         } else {
            this.cage.name = this.name;
         }
      }
   }
}
PrimitiveMaker.creationCount = 0;


function bindMenuPrimitive(maker) {
   const name = maker.getName();
   let id = Wings3D.action['create'+name].name;
   UI.bindMenuItem(id, maker.handler);

   // preference option dialog
   UI.bindMenuItemRMB(id, maker.optionHandler);
   UI.bindMenuItem(Wings3D.action['create'+name+'Pref'].name, maker.optionHandler);
};

function shapeMaker(name, makeFn, options, optionsDom) {
   return {
      getName: ()=>{return name;},

      handler: (evt)=>{
         const maker = new PrimitiveMaker(name, makeFn, options);
         maker.make();
         maker.confirm();
      },

      optionHandler: (evt)=>{
         const maker = new PrimitiveMaker(name, makeFn, options);
         maker.make();
         const doms = optionsDom(maker);
         doms.push( commonPutOn(maker) );
         makePrimitive(evt, name + " Options", maker, ...doms); 
      }
   };
};

function imagePlaneMaker(name, makeFn, options, optionsDom) {
   return {
      getName: ()=>{return name;},

      handler: (evt)=> {
         const maker = new PrimitiveMaker(name, makeFn, options);
         loadImage(maker).then(material=>{
            maker.setMaterial(material);
            maker.make();
            maker.confirm();
          });
      },

      optionHandler: (evt)=> {
         const maker = new PrimitiveMaker(name, makeFn, options);
         loadImage(maker).then(material=>{
            maker.setMaterial(material);
            maker.make();
            const doms = optionsDom(maker);
            makePrimitive(evt, name + " Options", maker, ...doms); 
          });
      }
   };
};



function makeCone(mesh, material, options) {
   let centerY = -(options.height/2);
   Shape.makeCone(mesh, material, options.sections, options.height, centerY, options.r1, options.r2);
   return centerY;
};

function makeCube(mesh, material, options) {
   let originX = -(options.sizeX/2);
   let originY = -(options.sizeY/2);
   let originZ = -(options.sizeZ/2);
   Shape.makeCube(mesh, material, originX, originY, originZ, options.sizeX, options.sizeY, options.sizeZ, options.cut);
   return originY;
};

function makeCylinder(mesh, material, options) {
   let centerY = -(options.height/2);
   Shape.makeCylinder(mesh, material, options.sections, options.height, centerY, options.bottomR1, options.bottomR2, options.topR1, options.topR2);
   return centerY;
};


function makeSphere(mesh, material, options) { 
   Shape.makeSphere(mesh, material, options.sections, options.slices, options.radialX, options.radialY);
   return -options.radialX;
};


function makeTorus(mesh, material, options) { 
   Shape.makeTorus(mesh, material, options.sections, options.slices, options.r1, options.r2, options.rMinor);
   return -options.rMinor;
};


function makePlane(mesh, material, options) {
   Shape.makePlane(mesh, material, options.resolution, options.size, options.thickness);
   return -options.thickness;
}

function makeSpiral(mesh, material, options) {
   Shape.makeSpiral(mesh, material, options.segments, options.sections*2, options.loops);
   return -1;
};


function makeSpring(mesh, material, options) {
   Shape.makeSpring(mesh, material, options.segments, options.sections*2, options.loops);
   return -1;
};


function makeTetrahedron(mesh, material, options) {
   return Shape.makeTetrahedron(mesh, material, options.length);
};


function makeOctahedron(mesh, material, options) {
   return Shape.makeOctahedron(mesh, material, options.height);
};


function makeOctotoad(mesh, material, options) {
   return Shape.makeOctotoad(mesh, material, options.height);
};


function makeDodecahedron(mesh, material, options) {
   return Shape.makeDodecahedron(mesh, material, options.length);
};


function makeIcosahedron(mesh, material, options) {
   return Shape.makeIcosahedron(mesh, material, options.length);
};


function makeImagePlane(mesh, material, options) {
   return Shape.makeImagePlane(mesh, material, options.width, options.height);
};

function getRoot(fileName) {
   let i = fileName.lastIndexOf('.');
   if (i >= 0) {
      return fileName.substring(0, i);
   } else {
      return fileName;
   }
}

async function loadImage(maker) {
   let mat = View.createMaterial(maker.name);
   // load from disk/cloud.
   return OpenSave.open(['bmp', 'jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'png', 'webp']).then(([files, _loadAsync])=>{
      let file = files[0];
      const root = getRoot(file.name);
      const texture = View.createTexture(root, {flipY: true});
      maker._textureName = root;
      file.image().then(img=>{
         img.onload = ()=>{
            texture.setImage(img);
            mat.baseColorTexture = texture;
            // readjust mesh'size.
            if (img.width > img.height) {
               maker.scale(0, img.width/img.height * 2); // scale (x) axis
            } else {
               maker.scale(1, img.height/img.width * 2); // scale (y) axis
            }
         }
         return img;
       });
      return mat;
    }).catch(error=>{
      alert(error);
    });
}


/**
 * bind menu
 */
Wings3D.onReady(function() {
   bindMenuPrimitive(shapeMaker("Cone", makeCone, {sections: 16, height: 2, r1: 1, r2: 1}, maker =>        
      [tag('<div class="primitiveOptions"></div>',
            numberInput("Sections", {min: 3, value: 16, step: 1}, function(evt) {
               maker.update("sections", Number(evt.target.value));
            }),
            numberInput("Height", {min: 0, value: 2}, function(evt) {
               maker.update("height", Number(evt.target.value));
            }),
            numberInput("X Diameter", {min: 0, value: 2}, function(evt) {
               maker.update("r1", Number(evt.target.value)/2);
            }),
            numberInput("Z Diameter", {min: 0, value: 2}, function(evt) {
            maker.update("r2", Number(evt.target.value)/2);
         }))]
   ));

   // Cube
   bindMenuPrimitive(shapeMaker("Cube", makeCube, {sizeX: 2, sizeY: 2, sizeZ: 2, cut: 1}, maker=>
         [sliderInput("numberOfCuts", {min: 1, max: 20, value:1, step:1}, function(evt){
            maker.update("cut", Number(evt.target.value));
          }),
         tag('<div class="primitiveOptions"></div>',
            numberInput("X", {min: 0, step: 'any', value: 2}, function(evt) {
               maker.update("sizeX", Number(evt.target.value));
            }, false),
            numberInput("Y", {min: 0, step: 'any', value: 2}, function(evt) {
               maker.update("sizeY", Number(evt.target.value));
            }, false),
            numberInput("Z", {min: 0, step: 'any', value: 2}, function(evt) {
               maker.update("sizeZ", Number(evt.target.value));
            }, false)),
            tag(`<fieldset>
               <legend data-i18n>Spherize</legend>
               <label><input type='radio' name='sphere' value='true' disabled><span data-i18n>Yes</span></label>
               <label><input type='radio' name='sphere' value='false' checked disabled><span data-i18n>No</span></label>
             </fieldset>`)]
   ));

   // cylinder
   bindMenuPrimitive(shapeMaker("Cylinder", makeCylinder, {sections: 16, height: 2, bottomR1: 1, bottomR2: 1, topR1: 1, topR2: 1}, maker=>
         [tag('<div class="primitiveOptions cylinder"></div>',
            numberInput("Sections", {min: 3, value: 16, step: 1}, function(evt) {
               maker.update("sections", Number(evt.target.value));
            }),
            numberInput("Height", {min: 0, value: 2}, function(evt) {
               maker.update("height", Number(evt.target.value));
            }),
            numberInput("Top X Radius", {min: 0, value: 1}, function(evt) {
               maker.update("topR1", Number(evt.target.value));
            }),
            numberInput("Top Z Radius", {min: 0, value: 1}, function(evt) {
               maker.update("topR2", Number(evt.target.value));
            }),
            numberInput("Bottom X Radius", {min: 0, value: 1}, function(evt) {
               maker.update("bottomR1", Number(evt.target.value));
            }),
            numberInput("Bottom Z Radius", {min: 0, value: 1}, function(evt) {
               maker.update("bottomR2", Number(evt.target.value));
            })
          )]
   ));

   // sphere
   bindMenuPrimitive(shapeMaker("Sphere", makeSphere, {sections: 16, slices: 8, radialX: 1, radialY: 1}, maker=>
         [tag('<div class="primitiveOptions"></div>',
            numberInput("Sections", {min: 3, value: 16, step: 1}, function(evt) {
               maker.update("sections", Number(evt.target.value));
            }),
            numberInput("Slices", {min: 3, value: 8}, function(evt) {
               maker.update("slices", Number(evt.target.value));
            }),
            numberInput("X Radial", {min: 0, value: 2}, function(evt) {
               maker.update("radialX", Number(evt.target.value)/2);
            }),
            numberInput("Y Radial", {min: 0, value: 2}, function(evt) {
               maker.update("radialY", Number(evt.target.value)/2);
            }))]
   ));

   // torus
   bindMenuPrimitive(shapeMaker("Torus", makeTorus, {sections: 16, slices: 8, r1: 1, r2: 1, rMinor: 0.25}, maker=>
         [tag('<div class="primitiveOptions"></div>',
            numberInput("Sections", {min: 3, value: 16, step: 1}, function(evt) {
               maker.update("sections", Number(evt.target.value));
            }),
            numberInput("Slices", {min: 3, value: 8}, function(evt) {
               maker.update("slices", Number(evt.target.value));
            }),
            numberInput("Major X Radius", {min: 0, value: 2}, function(evt) {
               maker.update("r1", Number(evt.target.value));
            }),
            numberInput("Major Z Radius", {min: 0, value: 2}, function(evt) {
               maker.update("r2", Number(evt.target.value));
            }),
            numberInput("Minor Radius", {min: 0, value: 0.25, step: 0.25}, function(evt) {
               maker.update("rMinor", Number(evt.target.value));
            })
         )]
   ));

   // plane
   bindMenuPrimitive(shapeMaker("Plane", makePlane, {resolution: 40, size: 2, thickness: 0.2}, maker=>
         [tag('<div class="primitiveOptions"></div>',
            numberInput("Resolution", {min: 3, value: 40, step: 1}, function(evt) {
               maker.update("resolution", Number(evt.target.value));
            }),
            numberInput("Size", {min: 0, value: 2}, function(evt) {
               maker.update("size", Number(evt.target.value));
            }),
            numberInput("Thickness", {min: 0, value: 0.2, step: 0.2}, function(evt) {
               maker.update("thickness", Number(evt.target.value));
            }))]
   ));

   // spiral
   bindMenuPrimitive(shapeMaker("Spiral", makeSpiral, {loops: 2, segments: 16, sections: 8}, maker=>
         [tag('<div class="primitiveOptions"></div>',
            numberInput("Loops", {min: 1, max: 32, value: 2}, function(evt) {
               maker.update("loops", Number(evt.target.value));
            }),
            numberInput("Segments", {min: 3, max: 128, value: 16}, function(evt) {
               maker.update("segments", Number(evt.target.value));
            }),
            numberInput("Sections", {min: 2, max: 64, value: 8}, function(evt) {
               maker.update("sections", Number(evt.target.value));
            }))]
   ));

   // spring.
   bindMenuPrimitive(shapeMaker("Spring", makeSpring, {loops: 2, segments: 16, sections: 8}, maker=>
         [tag('<div class="primitiveOptions"></div>',
            numberInput("Loops", {min: 1, max: 32, value: 2, step:1}, function(evt) {
               maker.update("loops", Number(evt.target.value));
            }),
            numberInput("Segments", {min: 3, max: 128, value: 16, step:1}, function(evt) {
               maker.update("segments", Number(evt.target.value));
            }),
            numberInput("Sections", {min: 2, max: 64, value: 8, step:1}, function(evt) {
               maker.update("sections", Number(evt.target.value));
            }))]
   ));

   // tetrahedron
   bindMenuPrimitive(shapeMaker("Tetrahedron", makeTetrahedron, {length: 2}, maker=>
         [tag('<div class="primitiveOptions"></div>',
            numberInput("Length", {min: 0, value: 2.0, step:'any'}, function(evt) {
            maker.update("length", Number(evt.target.value));
         }))]  
   ));

   // Octahedron
   bindMenuPrimitive(shapeMaker("Octahedron", makeOctahedron, {height: 2}, maker=>
         [tag('<div class="primitiveOptions"></div>',
            numberInput("Height", {min: 0, value: 2.0, step:'any'}, function(evt) {
            maker.update("height", Number(evt.target.value));
         }))]  
   ));

   // octotoad
   bindMenuPrimitive(shapeMaker("Octotoad", makeOctotoad, {height: 2}, maker=>
      [tag('<div class="primitiveOptions"></div>',
         numberInput("Height", {min: 0, value: 2.0, step:'any'}, function(evt) {
         maker.update("height", Number(evt.target.value));
      }))]  
   ));

   // octotoad
   bindMenuPrimitive(shapeMaker("Dodecahedron", makeDodecahedron, {length: 1}, maker=>
      [tag('<div class="primitiveOptions"></div>',
         numberInput("Edge Length", {min: 0, value: 1.0, step:'any'}, function(evt) {
         maker.update("length", Number(evt.target.value));
      }))]  
    ));

   // octotoad
   bindMenuPrimitive(shapeMaker("Icosahedron", makeIcosahedron, {length: 1}, maker=>
      [tag('<div class="primitiveOptions"></div>',
         numberInput("Edge Length", {min: 0, value: 1.0, step:'any'}, function(evt) {
         maker.update("length", Number(evt.target.value));
      }))]
   ));

   // ImagePlane
   bindMenuPrimitive(imagePlaneMaker("ImagePlane", makeImagePlane, {width: 1, height: 1}, maker=>
      [tag('<fieldset class="verticalPref"></fieldset>',
         htmlToElement('<legend data-i18n>Aligned With...</legend>'),
         labelRadio("Front", "alignedWith", function(evt) {
            const rotateY = maker.rotation[1];
            maker.orientation([0, 0, 0]);
          }, "checked"),
          labelRadio("Right", "alignedWith", function(evt) {
            maker.orientation([0, 90, 0]);
          }),
          labelRadio("Top", "alignedWith", function(evt) {
            maker.orientation([-90, 0, 0]);
          }),
          labelRadio("Back", "alignedWith", function(evt) {
            maker.orientation([0, 180, 0]);
          }),
          labelRadio("Left", "alignedWith", function(evt) {
            maker.orientation([0, -90, 0]);
          }),
          labelRadio("Bottom", "alignedWith", function(evt) {
            maker.orientation([90, 0, 0]);
          }),
          // how about View
       ), // naming, 
      tag(`<p>${maker._textureName}</p>`), 
      tag('<fieldset>',
         htmlToElement('<legend data-i18n>Use image name with</legend>'),
         labelRadio("Material", "useImageName", function(evt) {
            maker.useTextureName(true, false);
          }),
         labelRadio("Material and Object", "useImageName", function(evt) {
            maker.useTextureName(true, true);
          }),
         labelRadio("None", "useImageName", function(evt) {
            maker.useTextureName(false, false);
          }, "checked")),
      textInput("Name:", {value: "ImagePlane"}, function(evt) {
         maker.updateName(evt.target.value);
       }),
      tag('<div>',
         numberInput("Offset:", {value: "0"}, function(evt) {
            const offset = Number(evt.target.value);
            maker.origin(2, offset);
            maker.translate(2, -offset);
          }),
         numberInput("Rotation:", {value: "0"}, function(evt) {
            const rotate = Number(evt.target.value);
            maker.rotate(1, rotate);
          })
       ),
      tag('<hr>')
      ],
   ));
});

export {
   bindMenuPrimitive
}
