//
// x3d Loader and Writer.
//
//
import {ImportExporter} from "../wings3d_importexport.js";
import * as View from "../wings3d_view.js";
import {Material} from "../wings3d_material.js";
import * as UI from '../wings3d_ui.js';
import { PreviewCage } from "../wings3d_model.js";


class X3dImportExporter extends ImportExporter {
   constructor() {
      super('Web3D (.x3d)...', 'Web3D (.x3d)...');
   }

   extension() {
      return "x3d";
   }

   readAsText() {
      return true;
   }

   _reset() {
      super._reset();
      this.def = new Map;
      this.count = {appearance: 0, cage: 0};
   }

   /**
    * 
    * @param {*} world - generator for iteration.
    */
   _export(world) {
      const parser = new DOMParser();
      const xml = parser.parseFromString(`<?xml version="1.0" encoding="utf-8"?>
         <!DOCTYPE X3D PUBLIC "ISO//Web3D//DTD X3D 3.3//EN" "http://www.web3d.org/specifications/x3d-3.3.dtd">
         <X3D profile='Interchange' version='3.3'  xmlns:xsd='http://www.w3.org/2001/XMLSchema-instance' xsd:noNamespaceSchemaLocation =' http://www.web3d.org/specifications/x3d-3.0.xsd '>
         <head>
            <meta name='title' content=''/>
            <meta name='creator' content=''/>
            <meta name='created' content=''/>
            <meta name='modified' content=''/>
            <meta name='description' content=''/>
            <meta name='generator' content='Wings3D.net, https://www.wings3d.net'/>
            <meta name='license' content=''/>
         </head> 
         <Scene></Scene>
         </X3D>`, 
       "application/xml");
      // get with the Scene.
      const scene = xml.querySelector("Scene");

      const def = new Map;
      // now traversed the world, and update
      for (let cage of world) {
         // first get coordinate points, texture points if any, and colors if any.
         const mesh = cage.geometry;
         const mapCoord = new Map;    // remap coord
         let coord = "";
         let idx = 0;
         for (let vertex of mesh.vertices) { // guarantee to be lived.
            mapCoord.set(vertex.index, idx++);
            const vert = vertex.vertex;
            coord = `${coord} ${vert[0]} ${vert[1]} ${vert[2]}`;
         }
         let coordinate = xml.createElement('Coordinate');  // create first to be used
         const coordName = cage.name+"Coord";
         coordinate.setAttribute("DEF", coordName);
         coordinate.setAttribute("point", coord);
         def.set(coordName, coordinate);
         // now sort by material
         const materialList = new Map;
         for (let polygon of mesh.faces) {
            let array = materialList.get(polygon.material);
            if (!array) {
               array = [];
               materialList.set(polygon.material, array);
            }
            array.push(polygon);
         }
         // now create Group, sort by Material
         const group = xml.createElement("Group");
         const groupName = cage.name + "Group";
         group.setAttribute("DEF", groupName);
         scene.appendChild(group);
         def.set(groupName, group);
         for (let [mat, indexedFaceSet] of materialList) {
            const shape = xml.createElement("Shape");
            group.appendChild(shape);
            // create material
            const materialName = mat.name+"Material";
            const appearance = xml.createElement("Appearance");
            shape.appendChild(appearance);
            const material = xml.createElement("Material");
            appearance.appendChild(material);
            if (def.has(materialName)) {
               material.setAttribute("USE", materialName);
            } else {
               material.setAttribute("DEF", materialName);
               mat = mat.material;
               material.setAttribute("diffuseColor", `${mat.diffuseMaterial[0]} ${mat.diffuseMaterial[1]} ${mat.diffuseMaterial[2]}` );
               material.setAttribute("ambientIntensity", "0.2");  //`${mat.ambientMaterial}`);
               material.setAttribute("emissiveColor", `${mat.emissionMaterial[0]} ${mat.emissionMaterial[1]} ${mat.emissionMaterial[2]}`);
               material.setAttribute("shininess", `${mat.shininessMaterial}`);
               material.setAttribute("specularColor", `${mat.specularMaterial[0]} ${mat.specularMaterial[1]} ${mat.specularMaterial[2]}`)
               material.setAttribute("transparency",`${1.0-mat.opacityMaterial}`);
            }
            // create indexFaceSet
            let coordIndex = "";
            for (let polygon of indexedFaceSet) {
               for (let hEdge of polygon.hEdges()) {
                  coordIndex = `${coordIndex} ${mapCoord.get(hEdge.origin.index)}`;
               }
               coordIndex = `${coordIndex} -1`;    // close polygon
            }
            const geometry = xml.createElement("IndexedFaceSet");
            shape.appendChild(geometry);
            geometry.setAttribute("coordIndex", coordIndex);
            // add coordinate set
            if (!coordinate) {
               coordinate = xml.createElement("Coordinate");
               coordinate.setAttribute("USE", coordName);
            }
            geometry.appendChild(coordinate);
            coordinate = null;                              // used.
         }
      }
      // done creating dom, now write it out
      const s = new XMLSerializer;
      const blob = new Blob([s.serializeToString(xml)], {type: "text/plain;charset=utf-8"});
      return blob;
   }

   /**
    * 
    * @param {*} text - file content as text.
    */
   _import(text) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "application/xml");
      // extract start from Scene?, or just querySelectAll("Scene > Group")? for now, no transform or subgroup.
      const scene = xmlDoc.querySelector("Scene");
      if (scene) {
         let current = {};
         this.Scene(scene, current);
      }
   }

   /**
    * parse recognizable node.
    * @param {*} node 
    */
   _parseNode(node, current) {
      if (typeof this[node.tagName] === 'function') {
         this[node.tagName](node, current);
      }
   }

   _getUse(node) {
      // first check if already defined.
      let attr = node.getAttribute("USE");
      if (attr && this.def.has(attr)) {
         return this.def.get(attr);
      }
      return null;
   }

   Scene(scene, current) {
      for (let node of scene.children) {
         this._parseNode(node, current);
      }
      // let 
   }

   Group(group, current) { // create and insert new stuff

   }

   /**
    * 
    * @param {*} shape - geometry with material. 
    */
   Shape(shape, current) {
      // check existence of PreviewCage
      if (!current.cage) {
         current.cage = View.putIntoWorld();
         current.coords = new Map;
      }
      for (const node of shape.children) {
         this._parseNode(node, current);
      }
   }

   /**
    * Appearance===Material. own material, texture, textureTransform .., create new Material if any.
    * @param {*} appearance 
    */
   Appearance(appearance, current) {
      let appear = this._getUse(appearance);
      if (!appear) { // create and stuffing
         let name = appearance.getAttribute("DEF");
         const def = name;
         if (!name) {
            name = "Material_" + this.count.appearance++;   // supply generic name
         }
         appear = Material.create(name);
         if (def) {
            this.def.set(name, appear);
         }
      }
      current.appearance = appear;
      for (const node of appearance.children) {   // parse material.... etc
         this._parseNode(node, current);
      }
   }

   /**
    * old style material for now
    * @param {*} material 
    */
   Material(material, current) { // 
      let mat = this._getUse(material);
      if (!mat) {
         let name = material.getAttribute("DEF");
         if (name) {
            this.def.set(name, material);
         }
         mat = material;
      }
      // get old style blinn-phong material.
      const old = {};
      old.diffuseMaterial = material.getAttribute("diffuseColor") || [1.0, 1.0, 1.0];
      old.specularMaterial = material.getAttribute("specularColor") || [0.0, 0.0, 0.0];
      old.shininessMaterial = material.getAttribute("shininess") || 0;
      old.emissionMaterial = material.getAttribute("emissiveColor") || [0.0, 0.0, 0.0];
      old.opacityMaterial = 1 - (material.getAttribute("transparency") || 0);
      //old.ambientMaterial = material.getAttribute("ambientIntensity");   // not needed.
      current.appearance.pbr = Material.convertTraditionalToMetallicRoughness(old);
   }

   IndexedFaceSet(faceSet, current) {
      let reuse = this._getUse(faceSet);
      if (!reuse) {
         let name = faceSet.getAttribute("DEF");   
         if (name) {
            this.def.set(name, faceSet);
         }
      } else { // we don't do instance, so we will always create new one.
         faceSet = reuse;
      }
      // get child coord, color, normal first.
      for (const node of faceSet.children) {
         this._parseNode(node, current);
      }
      // ok, now build polygons using index.
      const appearance = current.appearance || Material.default;
      let start = 0;
      let index = faceSet.getAttribute("coordIndex");
      index = index.split(/[,\s]+/);                      // split by comma, or white space
      for (let i = 0; i < index.length; ++i) {
         const value = parseInt(index[i], 10);
         if (value === -1) {  // done, have polygon.
            current.cage.geometry._addPolygon(start, i, index, appearance);
            start = i+1;
         } else {
            index[i] = current.remapIndex[value];
         }
      }
      // add color?

   }

   Coordinate(coordinate, current) {
      let coord = this._getUse(coordinate);
      if (!coord || !current.coords.has(coord)) {   // if we are reusing, do we have same parent Cage? if not we have to add to current cage
         if (!coord) {
            coord = coordinate;
            let name = coord.getAttribute("DEF");  // set coordSet   
            if (name) {
               this.def.set(name, coord);
            }
         }
         // now add coordinate
         let index = [];
         let pts = coord.getAttribute("point");
         pts = pts.split(/[,\s]+/);                 // split by whitespaces or comma
         const vertex = [0.0, 0.0, 0.0];
         for (let i = 0; i < pts.length; i+=3) {
            vertex[0] = parseFloat(pts[i]) || 0.0;
            vertex[1] = parseFloat(pts[i+1]) || 0.0;
            vertex[2] = parseFloat(pts[i+2]) || 0.0;
            index.push( current.cage.geometry.addVertex(vertex).index );
         }
         // add the remap index.
         current.remapIndex = index;
         current.coords.set(coordinate, index);
      } else { // do we actully need next?
         //current.rempIndex = current.coords.get(coord);   // make sure we have the correct one?
      }
   }

   Color(rgb) {

   }

   ColorRGBA(rgba) {

   }

   TextureCoordinate() {

   }

   MultiTextureCoordinate() {

   }
}

export {
   X3dImportExporter,
}