//
// x3d Loader and Writer.
//
//
import {ImportExporter} from "../wings3d_importexport.js";
import * as View from "../wings3d_view.js";
import {Material} from "../wings3d_material.js";
import * as UI from '../wings3d_ui.js';


class X3dImportExporter extends ImportExporter {
   constructor() {
      super("", 'Web3D (.x3d)...');  
   }

   extension() {
      return "x3d";
   }

   readAsText() {
      return true;
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
}

export {
   X3dImportExporter,
}
