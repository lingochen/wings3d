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
      super(['Web3D', 'x3d'], ['Web3D', 'x3d']);
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
            coord = `${coord} ${vertex[0]} ${vertex[1]} ${vertex[2]}`;
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
         for (const [mat, indexedFaceSet] of materialList) {
            const shape = xml.createElement("Shape");
            group.appendChild(shape);
            // create material
            const materialName = mat.name+"PBR";
            const appearance = xml.createElement("Appearance");
            shape.appendChild(appearance);
            const material = xml.createElement("PhysicalMaterial");
            appearance.appendChild(material);
            if (def.has(materialName)) {
               material.setAttribute("USE", materialName);
            } else {
               material.setAttribute("DEF", materialName);
               const pbr = mat.pbr;
               material.setAttribute("baseColor", `${pbr.baseColor[0]} ${pbr.baseColor[1]} ${pbr.baseColor[2]}` );
               //material.setAttribute("emissiveColor", `${pbr.emissionMaterial[0]} ${pbr.emissionMaterial[1]} ${pbr.emissionMaterial[2]}`);
               material.setAttribute("roughnessFactor", `${pbr.roughness}`);
               material.setAttribute("metallicFactor", `${pbr.metallic}`);
               material.setAttribute("transparency",`${1.0-pbr.opacity}`);
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
         let current = {children:[]};
         for (let node of scene.children) {
            this._parseNode(node, current);
         }
         // now, put everthing into world
         for (let group of current.children) {
            View.addToWorld(group);
         }
         if (current.cage) {
            View.addToWorld(current.cage);
         }
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

   Group(groupNode, current) { // create and insert new stuff
      const group = {children: []};
      for (const node of groupNode.children) {
         this._parseNode(node, group);
      }
      // now we parse all the children, decide if we want cage or group?
      if (group.children.length > 0) { // yes, yes grouping. now create grouping and append
         // new Group
         // newGroup.name =
         // newGroup.append(group.children)
         // current.children.push( newGroup );

      } else if (group.cage) {   // cage is enough, so handle it.
         group.cage.name = groupNode.getAttribute('name');
         current.children.push( group.cage );
      }
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
    * new Physical based material.
    * @param {*} material 
    * @param {*} current 
    */
   PhysicalMaterial(material, current) {
      let mat = this._getUse(material);
      if (!mat) {
         let name = material.getAttribute("DEF");
         if (name) {
            this.def.set(name, material);
         }
         mat = material;
      }
      // set pbr
      const old = {};
      let value;
      if (value = material.getAttribute('baseColor')) {
         old.baseColor = value.trim().split(/[,\s]+/).map(Number);
      }
      if (value = material.getAttribute('roughnessFactor')) {
         old.roughness = value;
      }
      if (value = material.getAttribute('metallicFactor')) {
         old.metallic = value;
      }
      if (value = material.getAttribute('transparency')) {
         old.opacity = 1.0 - value; // transparency to opacity
      }
      current.appearance.setValues(old);
   };

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
      index = index.trim().split(/[,\s]+/);  // split by comma, or white space. todo: match "integer"
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
         pts = pts.trim().split(/[,\s]+/);                 // split by whitespaces or comma
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
