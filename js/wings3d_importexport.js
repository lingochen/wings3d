//
// file handling. 
// 1) handling local file upload. and simple file download.
// todo
// 2) dropbox, yandex.
// 3) google drive, microsoft onedrive, baidupan to come later.
//
import {PreviewCage, CreatePreviewCageCommand} from './wings3d_model.js';
import {WingedTopology, HalfEdge} from './wings3d_wingededge.js';
import {Material} from "./wings3d_material.js";
import * as View from './wings3d_view.js';



class ImportExporter {
   constructor(importMenuText, exportMenuText) {
      if (importMenuText) {
         this.importMenuText = {name: importMenuText[0],
                                ext: importMenuText[1]};
      }
      if (exportMenuText) {
         this.exportMenuText = {name: exportMenuText[0],
                                ext: exportMenuText[1]};
      }
   }

   createCage(name = "") {
      return View.createCage(name);
   }

   createGroup(name = "") {
      return View.createGroup(name);
   }

   createMaterial(name, pbr) {
      const mat = Material.create(name);
      mat.setValues(pbr);
      return mat;
   }

   createMaterialTraditional(name, old) {
      const pbr = Material.convertTraditionalToMetallicRoughness(old);
      return this.createMaterial(name, pbr);
   }

   createTexture(name, sampler) {
      return View.createTexture(name, sampler);
   }

   createColor(color) { // [r,g,b] - three 8bit values
      let rgba = (color[0] << 24) + (color[1] << 16) + (color[0] << 8);
      let index = this.reservedColors.get(rgba);
      if (index === undefined) {
         index = HalfEdge.color.reserve();
         HalfEdge.color.setValue(index, color);
         this.reservedColors.set(rgba, index);
      }
      return index;
   }

   async export(world, file, saveAsync) {
      this.saveAsync = saveAsync;

      this._reset();    // init before save.
      this.workingFiles.selected = file;
      return this._export(world, file.root).then(([blob, extra])=>{
         file.uploadBlob(blob);
         if (extra) {
            saveAsync(file.root + '.' + extra.ext).then(file=>{
               file.uploadBlob(extra.blob);
            });
         }
         return this.workingFiles;
      });
   }

   async import(files, loadAsync) {
      this.loadAsync = loadAsync;
      this._reset();
      this.files = files;
      this.workingFiles.selected = files[0];
      this.reservedColors = new Map;

      return this._import(files[0]).then((objs)=>{  // put into world.
         if (objs) {
            let cages = [];
            for (let cage of objs.world) {
               let command = new CreatePreviewCageCommand(cage);
               cages.push( command );
               command.doIt();
            }
            if (cages.length > 1) {
               // combo
               View.undoQueueCombo( cages );
            } else if (cages.length > 0) {
               View.undoQueue(cages[0]);
            }
            // put materialCatalog to UItree
            for (let material of objs.materialCatalog) {
               View.addMaterial(material);
            }
            // finalized and update
            View.updateWorld();
            // show import stat, # of vertex, edges, faces, and !!boundary edges!!
            let stat = {vertices: 0, edges: 0, faces: 0, boundary: 0};
            for (let group of objs.world) {
               for (let cage of group.getCage()) {
                  cage.geometry.getStat(stat);
               }
            }
            geometryStatus(`${stat.vertices} vertices, ${stat.edges} edges, ${stat.faces} faces, ${stat.boundary} boundary, ${this.non_manifold.length} non-manifold`);
         }
         const workingFiles = this.workingFiles;
         this._reset();
         return Promise.resolve(workingFiles);
       });  // catch error.
   }

   /**
    * read images file.
    */
   _readAuxFiles() {

   }

   _reset() {
      this.objs = [];
      this.obj = null;
      this.objView = null;
      this.materialCatalog = new Map;
      this.currentMaterial = Material.default;
      this.realVertices = []; // convert index
      this.texCoords = [];
      this.polygonCount = 0;
      this.vertexCount = 0;
      this.non_manifold = [];
      this.files = [];
      this.workingFiles = {selected: null, linked: new Map};
   }

   static decodeText(dataView) {
      // The TextDecoder interface is documented at http://encoding.spec.whatwg.org/#interface-textdecoder
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(dataView);   
   }

   static addLoadStore(create) {
      const loadStore = create();
      if (loadStore.importMenuText || loadStore.exportMenuText) {
         ImportExporter.LOADSTORE.add(create);
      }
   }

   static setDefault(create) {
      if (ImportExporter.DEFAULT) {
         ImportExporter.LOADSTORE.add(ImportExporter.DEFAULT);
      }
      ImportExporter.DEFAULT = create;
      // remove from LOADER, STORER.
      ImportExporter.LOADSTORE.delete(create);
   }
};
ImportExporter.LOADSTORE = new Set;
ImportExporter.DEFAULT = null;

export {
   ImportExporter
};