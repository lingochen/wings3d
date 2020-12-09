//
// strategy:
//    use GPU as much as possible. use vertex pulling to compute all state. 
//     multiple passes for drawing. we have more than enough GPU power.
//
//    let GPU do all the work, cpu just supply state.
//
// drawing pass:
//    first pass: draw polygon.
//
//    second pass: draw edge.
//
//    third pass: draw vertex.
//
"use strict";
import {gl, ShaderData} from './wings3d_gl.js';
import * as ShaderProg from './wings3d_shaderprog.js';
import * as Util from './wings3d_util.js';
import {BoundingSphere} from './wings3d_boundingvolume.js';
import {MeshAllocator, WingedTopology, WingedEdge, HalfEdge, Polygon, Vertex, Attribute} from './wings3d_wingededge.js';
import {Material} from './wings3d_material.js';
const {vec3, quat, mat4} = glMatrix;



/**
 * 
 * @param {*} theme 
 * @param {*} prop 
 * @param {*} defaultSize
 * 
 * internal data. isAltered (index rebuilt). isModified(reupload data to gpu) 
 */
const DraftBench = function(theme, prop, materialList, defaultSize = 2048) {  // should only be created by View
   MeshAllocator.call(this, defaultSize); // constructor.
   this.materialList = materialList;

   this.preview = {centroid: {}, indexLength: 0, visibleLength: 0, isAltered: false};
   this.preview.shaderData = gl.createShaderData();
   var layoutVec = ShaderData.attribLayout(3);
   var layoutVec4 = ShaderData.attribLayout(4);
   //var layoutFloat = ShaderData.attribLayout(1);
   this.preview.shaderData.createAttribute('polygonIndex', layoutVec4, gl.STATIC_DRAW);
   this.preview.shaderData.createAttribute('a_AttributeIndex', layoutVec, gl.STATIC_DRAW);
   this.preview.shaderData.createSampler("faceState", 2, 3, gl.UNSIGNED_BYTE);
   this.preview.shaderData.createSampler("groupState", 3, 1, gl.UNSIGNED_BYTE);
   this.preview.shaderData.createSampler('positionBuffer', 0, 3, gl.FLOAT);
   this.preview.shaderData.createIndex('triangleList');
   this.setTheme(theme, prop);

   // previewFace selected
   this.preview.shaderData.createSampler('materialColor', 4, 3, gl.FLOAT);

   // previewEdge selected
   this.preview.shaderData.createAttribute('indexBuffer', layoutVec4, gl.STATIC_DRAW);
   this.preview.shaderData.createSampler("edgeState", 1, 1, gl.UNSIGNED_BYTE);
   this.preview.shaderData.createSampler("attributeColor", 5, 3, gl.UNSIGNED_BYTE);
   this.preview.shaderData.createSampler("attributeTexCoord", 6, 2, gl.HALF_FLOAT);

   // previewVertex
   this.preview.shaderData.createAttribute('vertexIndex', layoutVec, gl.DYNAMIC_DRAW);

   // body state.
   this.previewBody = {hilite: false};
   // shown plane normal
   this.previewPlane = {};
   this.previewPlane.shaderData = gl.createShaderData();
   this.previewPlane.shaderData.setUniform4fv("faceColor", [1.0, 0.0, 0.0, 1.0]);
   this.previewPlane.shaderData.createAttribute('position', layoutVec, gl.STATIC_DRAW);
   this.previewPlane.rectangle = new Float32Array(3*4);  // 
   this.previewPlane.shaderData.resizeAttribute('position', Float32Array.BYTES_PER_ELEMENT*3*4);
   this.previewPlane.pts = [];
   for (let i = 0; i < 4; ++i) {
      this.previewPlane.pts[i] = this.previewPlane.rectangle.subarray(i*3, (i+1)*3);
   }
};
// draftBench inherited from MeshAllocator, so we canintercept freeXXX and allocXXX call easier. It also makes logical sense.
DraftBench.prototype = Object.create(MeshAllocator.prototype);
Object.defineProperty(DraftBench.prototype, 'constructor', { 
   value: DraftBench,
   enumerable: false, // so that it does not appear in 'for in' loop
   writable: true });

// temp structure
DraftBench.theme = {unselectedEdgeColor: [0.0, 0.0, 0.0, 1.0],
                    hardEdgeColor: [1.0, 0.5, 0.0, 1.0],
                    selectedColor: [0.65, 0.0, 0.0, 1.0],
                    selectedHilite: [0.7, 0.7, 0.0, 1.0],
                    unselectedHilite: [0.0, 0.65, 0.0, 1.0],
                    unselectedVertexColor: [0.0, 0.0, 0.0, 1.0],
                    maskedVertexColor: [0.5, 1.0, 0.0, 0.8],
                    faceColor: [0.7898538076923077, 0.8133333333333334, 0.6940444444444445, 1.0],
                    sculptMagnetColor: [0.0, 0.0, 1.0, 0.1],
                    tweakMagnetColor: [0.0, 0.0, 1.0, 0.06],
                    tweakVectorColor: [1.0, 0.5, 0.0],
                  };
DraftBench.pref = {unselectedVertexSize: 4.0,
                   selectedVertexSize: 5.0,
                   maskedVertexSize: 8.0,
                   unselectedEdgeWidth: 2.0,
                   selectedEdgeWidth: 2.0,
                   hardEdgeWidth: 2.0,
                  };
// temp structure for 
DraftBench.CONST = (function() {
   const constant = {};

   constant.EDGEWIDTH = 1.1;
   return constant;
}());

function getEdgeColor(theme) {
   const buffer = new Float32Array(4*8);
   const color = new Util.Vec4View(buffer);
   color.set(theme.unselectedEdgeColor).inc();  // 0 (none)
   color.set(theme.hardEdgeColor).inc();        // 1 (hardEdge)
   color.set(theme.selectedColor).inc();        // 2 (selected)
   color.set(theme.selectedColor).inc();        // 3 (select+hardEdge)
   color.set(theme.unselectedHilite).inc();     // 4 (hilite)
   color.set(theme.unselectedHilite).inc();     // 5 (hilite + hardEdge)
   color.set(theme.selectedHilite).inc();       // 6 (hilite + select)
   color.set(theme.selectedHilite);             // 7 (hilite + select + hardEdged)
   return buffer;
};
function getEdgeWidth(pref) {
   const size = new Float32Array(8);
   size[0] = pref.unselectedEdgeWidth;
   size[1] = pref.unselectedEdgeWidth;
   size[2] = pref.selectedEdgeWidth;
   size[3] = pref.selectedEdgeWidth;
   size[4] = pref.unselectedEdgeWidth;
   size[5] = pref.unselectedEdgeWidth;
   size[6] = pref.selectedEdgeWidth;
   size[7] = pref.selectedEdgeWidth;
   return size;
};
function getVertexColor(theme) {
   const buffer = new Float32Array(4*8);
   const color = new Util.Vec4View(buffer);
   color.set(theme.unselectedVertexColor).inc();   // 0 (none)
   color.set(theme.selectedColor).inc();          // 1 (select)
   color.set(theme.maskedVertexColor).inc();      // 2 (masked)
   color.set(theme.maskedVertexColor).inc();      // 3 (masked+select)
   color.set(theme.unselectedHilite).inc();       // 4 (hilite)
   color.set(theme.selectedHilite).inc();         // 5 (hilite + select)
   color.set(theme.unselectedHilite).inc();       // 6 (hilite + masked)
   color.set(theme.selectedHilite);               // 7 (hilite + masked + select)
   return buffer;
};
function getVertexSize(pref) {
   const size = new Float32Array(8);
   size[0] = pref.unselectedVertexSize;
   size[1] = pref.selectedVertexSize * 1.5;
   size[2] = pref.maskedVertexSize * 1.5;
   size[3] = pref.maskedVertexSize * 1.5;
   size[4] = pref.selectedVertexSize * 1.5;
   size[5] = pref.selectedVertexSize * 1.5;
   size[6] = pref.maskedVertexSize * 1.5;
   size[7] = pref.maskedVertexSize * 1.5;
   return size;
};
function getFaceColor(theme) {
   const buffer = new Float32Array(4*4);
   const color = new Util.Vec4View(buffer);
   color.set(theme.faceColor).inc();         // 0 (none), wont get used!
   color.set(theme.selectedColor).inc();     // 1 (selected)
   color.set(theme.unselectedHilite).inc();  // 2 (hilite)
   color.set(theme.selectedHilite);           // 3 (hilite+selected)
   return buffer;
};

/**
 * 
 */
DraftBench.prototype.setTheme = function(theme, pref) {
   Object.entries(theme).forEach(([key, value]) => {
      // put the hex value to shader
      this.preview.shaderData.setUniform4fv(key, Util.hexToRGBA(value));
      DraftBench.theme[key] = Util.hexToRGBA(value);     // to be deleted
    });
   // set pref
   Object.entries(pref).forEach(([key, value]) => {
      DraftBench.pref[key] = value;
      this.preview.shaderData.setUniform1f(key, value);
    });

   // update shaderData
   this.preview.shaderData.setUniform4fv('edgeColor', getEdgeColor(DraftBench.theme));
   this.preview.shaderData.setUniform1fv('edgeWidth', getEdgeWidth(DraftBench.pref));
   this.preview.shaderData.setUniform4fv('vertexColor', getVertexColor(DraftBench.theme));
   this.preview.shaderData.setUniform1fv('sizeOfVertex', getVertexSize(DraftBench.pref));
   this.preview.shaderData.setUniform4fv('faceColor', getFaceColor(DraftBench.theme));
};

// free webgl buffer.
DraftBench.prototype.freeBuffer = function() {
   this.preview.shaderData.freeAllAttributes();
   this.preview.shaderData =  null;
   this.previewEdge.shaderData.freeAllAttributes();
   this.previewEdge.shaderData = null;
};


DraftBench.prototype.isModified = function() {
   return (Vertex.index.isAltered() ||
           HalfEdge.index.isAltered() ||
           HalfEdge.indexAttribute.isAltered() ||
           WingedEdge.index.isAltered() ||
           //Polygon.centerIndex.isAltered() ||
           Vertex.position.isAltered() ||
           //BoundingSphere.center.isAltered() ||
           Polygon.state.isAltered() ||
           WingedEdge.state.isAltered() ||
           WingedTopology.state.isAltered() ||
           Material.color.isAltered() ||
           HalfEdge.triangleList.isAltered() ||
           HalfEdge.color.isAltered() 
           );
};


/**
 * polygon drawing routines.
 * 
 * @param {gl} - drawing context.
 */
DraftBench.prototype.draw = function(gl, madsor) {
   try {
      // update polygon(including center) index if needed.
      this.preview.shaderData.updateAttribute("polygonIndex", HalfEdge.index);
      this.preview.shaderData.updateAttribute("a_AttributeIndex", HalfEdge.indexAttribute);

      // update positionBuffer texture if modified
      this.preview.shaderData.updateSampler("positionBuffer", Vertex.position); // this.position === Vertex.position

      // update vertex color if needed (it per hEdge)
      this.preview.shaderData.updateSampler("attributeColor", HalfEdge.color);
      this.preview.shaderData.updateSampler("attributeTexCoord", Attribute.uv);

      // update polygon, group state if needed
      this.preview.shaderData.updateSampler("faceState", Polygon.state);
      this.preview.shaderData.updateSampler("groupState", WingedTopology.state);

      // update material if needed
      this.preview.shaderData.updateSampler("materialColor", Material.color);

      // update index if needed,
      this.preview.shaderData.updateIndex("triangleList", HalfEdge.triangleList, HalfEdge.index.usedSize/4 - 1, gl.STATIC_DRAW);

      // bind polygonIndex
      gl.bindAttribute(this.preview.shaderData, ['polygonIndex']);
      gl.bindAttribute(this.preview.shaderData, ['a_AttributeIndex']);

      // bindUniform all
      gl.bindUniform(this.preview.shaderData, ['faceColor', 'faceState', 'faceStateHeight', 'groupState', 'groupStateHeight',
                                               'materialColor', 'materialColorHeight', "attributeColor", "attributeColorHeight",
                                               'attributeTexCoord', 'attributeTexCoordHeight',
                                               'positionBuffer', 'positionBufferHeight']);

      gl.bindIndex(this.preview.shaderData, 'triangleList');


      const textureSet = new Set;
      for (const mat of Material.getInUse()) {
         const hash = mat.textureHash();
         if (textureSet.has(hash)) {
            continue;   // skipped already drawn set
         }
         textureSet.add(hash);

         this.preview.shaderData.setUniform1f('currentBaseColorTexture', mat.pbr.baseColorTexture);
         this.preview.shaderData.setUniformTexture('baseColorTexture', mat.baseColorTexture.id, 7);

         // bindUniform changed.
         gl.bindUniform(this.preview.shaderData, ['currentBaseColorTexture', 'baseColorTexture']);

         gl.drawElements(gl.TRIANGLES, HalfEdge.triangleList.usedSize, gl.UNSIGNED_INT, 0);                                       
         //gl.drawArrays(gl.TRIANGLES,  0, HalfEdge.index.usedSize/4);
      }
   } catch (e) {
      console.log(e);
   }
};


// draw vertex, select color, 
DraftBench.prototype.drawVertex = function(gl, madsor) {
   try {
      // indexBuffer upload if needed, 
      this.preview.shaderData.updateAttribute("vertexIndex", Vertex.index);
      // now bind Attribute
      gl.bindAttribute(this.preview.shaderData, ['vertexIndex']);

      // update groupState if needed
      this.preview.shaderData.updateSampler("groupState", WingedTopology.state);

      // update positionBuffer texture if modified
      this.preview.shaderData.updateSampler("positionBuffer", Vertex.position); // this.position === Vertex.position

      // bindUniform all
      gl.bindUniform(this.preview.shaderData, ['vertexColor', 'sizeOfVertex', 'groupState', 'groupStateHeight',
                                               'positionBuffer', 'positionBufferHeight']);

      gl.drawArrays(gl.POINTS,  0, Vertex.index.usedSize/3);
   } catch (e) {
      console.log(e);
   }
};


/** 
 * draw selected, hilite, hard and normal edges.
 * @param {gl} - drawing context
 */
DraftBench.prototype.drawEdge = function(gl, madsor) {
   try {
      // indexBuffer upload if needed
      this.preview.shaderData.updateAttribute('indexBuffer', WingedEdge.index);
      // now bind attribute
      gl.bindAttribute(this.preview.shaderData, ['indexBuffer']);

      // update positionBuffer texture if modified
      this.preview.shaderData.updateSampler("positionBuffer", Vertex.position);

      // update edgeState. should refactored.
      this.preview.shaderData.updateSampler("edgeState", WingedEdge.state);
      // update polygon, group state if needed
      //this.preview.shaderData.updateSampler("faceState", Polygon.state);
      this.preview.shaderData.updateSampler("groupState", WingedTopology.state);

      // bindUniform all
      gl.bindUniform(this.preview.shaderData, ['edgeColor', 'edgeWidth', 'groupState', 'groupStateHeight',
                                               'positionBuffer', 'positionBufferHeight', 'edgeState', 'edgeStateHeight']);

      gl.drawArrays(gl.TRIANGLES,  0, WingedEdge.index.usedSize/4);
   } catch (e) {
      console.log(e);
   }
};

DraftBench.prototype.drawPlane = (function() {
   const diagonal = vec3.create();   // a diagonal [1,0,1] normalize vector
   const up = vec3.fromValues(0, 1, 0);
   const rotate = quat.create();
   const transform = mat4.create();
   const halfSize = vec3.create();
   
   return function(gl, plane) {   // the real function
      vec3.copy(halfSize, plane.halfSize);
      vec3.normalize(halfSize, halfSize);
      vec3.cross(diagonal, halfSize, up);
      vec3.normalize(diagonal, diagonal);
      // find rotation between planeNormal and Axis alignment
      quat.rotationTo(rotate, diagonal, plane.normal);//, diagonal);
      mat4.fromQuat(transform, rotate);
      //vec3.transformMat4(halfSize, plane.halfSize, transform);
      vec3.copy(halfSize, plane.halfSize);
      // setup halfSize, 
      vec3.negate(this.previewPlane.pts[0], halfSize);
      let pt = this.previewPlane.pts[1];
      pt[0] = halfSize[0];
      pt[1] = -halfSize[1];
      pt[2] = halfSize[2];
      vec3.copy(this.previewPlane.pts[2], halfSize);
      vec3.negate(this.previewPlane.pts[3], pt);
      // update position.
      for (let i = 0; i < 4; ++i) {
         const pt = this.previewPlane.pts[i];
         vec3.transformMat4(pt, pt, transform);
         vec3.add(pt, plane.center, pt);
      }
      // upload result
      this.previewPlane.shaderData.uploadAttribute('position', 0, this.previewPlane.rectangle);
      if (plane.hilite) {  // set color
         this.previewPlane.shaderData.setUniform4fv("faceColor", [0.0, 1.0, 0.0, 1.0]);
      } else {
         this.previewPlane.shaderData.setUniform4fv("faceColor", [0.1, 0.1, 0.1, 1.0]);
      }
      // draw the rectangle plane
      gl.disable(gl.CULL_FACE);
      gl.useShader(ShaderProg.solidColor);
      gl.bindTransform();
      gl.bindAttribute(this.previewPlane.shaderData, ['position']);
      gl.bindUniform(this.previewPlane.shaderData, ['faceColor']);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      gl.disableShader();
      gl.enable(gl.CULL_FACE);
   };
})();


/**
 * return a snapshot of DraftBench's current state.
 */
DraftBench.prototype.checkPoint = function() {
   // map the (vertices, edges, faces) value.
   const vertices = [];
   for (let vertex of this.vertices) {
      // outEdge index, need real pt?
      if (vertex.isLive()) {
         vertices.push( vertex.outEdge.index );
      } else {
         vertices.push( -1 );
      }
   }
   const edges = [];
   for (let wEdge of this.edges) {
      // left->next index, right->next index, origin index, dest index.
      if (wEdge.isLive()) {
         edges.push( wEdge.left.next.index, wEdge.right.next.index, wEdge.left.origin.index, wEdge.right.origin.index);
      } else {
         edges.push( -1, -1, -1, -1 );
      }
   }
   const faces = [];
   for (let polygon of this.faces) {
      // halfEdge index.
      if (polygon.isLive()) {
         faces.push( polygon.halfEdge.index );
      } else {
         faces.push( -1 );
      }
   }
   return {faces: faces, edges: edges, vertices: vertices};
};

/**
 * given the checkPoint, check if it matches the current state of DraftBench.
 */
DraftBench.prototype.checkup = function(checkPoint) {
   // now check draftBench and our saved value.
   // use index because draftBench could have more faces(all dead) than our Saved one due to expansion.
   for (let i = 0; i < checkPoint.faces.length; ++i) {   // check polygon first, most like to have problems
      const polygon = this.faces[i];
      if (polygon.isLive()) {
         if (polygon.halfEdge.index != checkPoint.faces[i]) {
            throw("CheckPoint failed: non matching polygon halfEdge");
         }
      } else {
         if (checkPoint.faces[i] !== -1) {
            throw("CheckPoint failed: unexpected face");
         }
      }
   }
   for (let i = 0; i < checkPoint.vertices.length; ++i ) {   // check vertex next because of simplicity.
      const vertex = this.vertices[i];
      if (vertex.isLive()) {
         if (vertex.outEdge.index != checkPoint.vertices[i]) {
            throw("CheckPoint failed: non-matching vertex outEdge");
         }
      } else {
         if (checkPoint.vertices[i] !== -1) {
            throw("CheckPoint failed: unexpected vertex");
         }
      }
   }
   // check wEdges
   for (let i=0, j=0; i < checkPoint.edges.length; i+=4, j++) {
      const wEdge = this.edges[j];
      if (wEdge.isLive()) {
         if (wEdge.left.next.index != checkPoint.edges[i] || wEdge.right.next.index != checkPoint.edges[i+1] ||
               wEdge.left.origin.index != checkPoint.edges[i+2] || wEdge.right.origin.index != checkPoint.edges[i+3]) {
            throw("CheckPoint failed: non matching wEdge");
         }
      } else {
         if (checkPoint.edges[i] !== -1) {
            throw("CheckPoint failed: unexpected wEdge");
         }
      }
   }
};


export {
   DraftBench
};