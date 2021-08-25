/**
 * Wings3D .wings file format reader
 * 
 * https://en.wikibooks.org/wiki/Wings_3D/User_Manual/Wings_File_Format
 * 
 */
import {ImportExporter} from "../wings3d_importexport.js";



class etfParser { // erlang external term format
   constructor(raw) {   // raw is a DataView
      this.raw = raw;
      this.pos = 0;
   }

   readNil() {
      const nil = this.readNext();
      if (nil.type !== "NIL") {
         throw("ETF: expected List end NIL");
      }
   }

   readTuple() {
      const tuple = this.readNext();
      if (tuple.type === "tuple") {
         return tuple.len;
      }
      throw("ETF: expected tuple");
      //return 0;
   }

   readList() {
      const list = this.readNext();
      if (list.type === 'list') {
         return list.len;
      } else if (list.type === 'NIL') {
         return 0;
      }
      throw("ETF: expected list");
      //return 0;
   }

   readNext() {
      if (!this.read) {
         this.read = this.readElement();
      }
      return this.read.next().value;
   }

   * readElement() {
      const type = this.raw.getUint8(this.pos++);
      if (this[type]) {
         yield* this[type]();
      } else {
         console.log("warn: wings3d file unexpected term type: " + type);
         this.pos += this.raw.getUint8(this.pos++);
         yield* this.readElement();
      }
   }

   * _readUint8(len) {
      while (len--) {
         yield this.raw.getUint8(this.pos++);
      }
   }

   * 70() { // new_float_ext
      const double = this.raw.getFloat64(this.pos);
      this.pos += 8;
      yield double;
   }

   * 97() {   // small_integer_ext
      yield this.raw.getUint8(this.pos++);
   }

   * 98() {   // integer_ext
      const integer = this.raw.getUint32(this.pos); this.pos+=4;
      yield integer;
   }

   * 99() {   // float_ext
      //let float = this.raw.buffer.slice(this.pos, this.pos += 31);
      let float = String.fromCharCode(...this._readUint8(31));
      yield parseFloat( float );
   }

   * 100() {  // atom_ext
      const len = this.raw.getUint16(this.pos); this.pos += 2;
      if (len) {
         yield String.fromCharCode(...this._readUint8(len));
      } else {
         yield "";
      }
   }

   * 104() {  // SMALL_TUPLE_EXT
      let len = this.raw.getUint8(this.pos++);
      yield {type: "tuple", len: len};
      while (len--) {
         yield* this.readElement();
      }
   }

   * 106() {  // NIL_EXT
      yield {type: "NIL"};
   }

   * 107() {  // STRING_EXT
      const len = this.raw.getUint16(this.pos); this.pos += 2;
      if (len) {
         yield String.fromCharCode(...this._readUint8(len));
      } else {
         yield "";
      }
   }

   * 108() {  // LIST_EXT
      let len = this.raw.getUint32(this.pos); this.pos += 4;
      yield {type: "list", len: len};
      while (len--) {
         yield* this.readElement();
      }
      yield* this.readElement();  // tail
   }

   * 109() {  // BINARY_EXT
      let len = this.raw.getUint32(this.pos); this.pos += 4;
      yield this.raw.buffer.slice(this.pos, this.pos += len);
   }
}



class WingsImportExporter extends ImportExporter {
   constructor() {
      super(['Wings3D', 'wings']);
   }
   
   extension() {
      return "wings";
   }

   fileTypes() {
      return ['wings'];
   }

   _reset() {
      super._reset();
      this.def = new Map;
      this.count = {appearance: 0, cage: 0};
   }


   _inspectUnknown(parser) {  // for inspecting/discover values.
      const unknown = parser.readNext();
      if (unknown.type === "tuple") {  // a tuple
         const obj = {};
         for (let i = 0; i < unknown.len;++i) {
            obj[i] = this._inspectUnknown(parser);
         }
         return obj;
      } else if (unknown.type === "list") {  // a list
         const list = [];
         for (let i = 0; i< unknown.len; ++i) {
            list.push( this._inspectUnknown(parser) );
         }
         parser.readNil();
         return list;
      } else {
         return unknown;
      }
   }

   /**
    * 
    * @param {*} binary - file content as binary
    * 		path: path || this.resourcePath || '',
				crossOrigin: this.crossOrigin,
				manager: this.manager
    */
   async _import(file) {
      const data = await file.arrayBuffer(); // get promise.
      const reader = new DataView(data);
      let pos = 0;
      // check magical header
      let magic = "#!WINGS-1.0\r\n";// 0D 0A 1A 04";
      let text = "";
      while ((pos < reader.byteLength) && (pos < magic.length)){
          let val = reader.getUint8(pos++);
          text += String.fromCharCode(val);
      }

      this.textureCache = new Map;
      let world = [];
      let catalogue = [];
      if ((text === magic) && (reader.byteLength-19 === reader.getUint32(pos))) {   // magicHeader, dataSize
         pos+=6;   // skipp size(4 bytes), erlang header (2 bytes)
         let dataSize = reader.getUint32(pos);
         pos+=4;
         // now decompressed the real data
         let raw = pako.inflate(data.slice(pos));
         if (raw.byteLength === dataSize) {
            // let read erlang-term-data now.
            const parser = new etfParser(new DataView(raw.buffer));
            let header = parser.readNext();
            if ((header.type === "tuple") && (header.len === 3) &&
                 (parser.readNext() === "wings") && (parser.readNext() === 2)) {
               if (parser.readTuple() === 3) {
                  const objs = this.readShape(parser);
                  const catalog = this.readMaterial(parser);
                  let prop = this.readProps(parser);
                  //console.log(prop);
                  [world, catalogue] = this.buildShape(objs, catalog);
               }
            }
         } else {
            console.log("error: wings3d file corrupted");
         }
      }
  
      return {world: world, materialCatalog: catalogue};
   }

   buildShape(shapes, catalog) {
      const objs = [];
      const catalogue = new Set;
      for (let shape of shapes) {
         const ret = this.createCage(shape.name);
         let geometry = ret.geometry;
         let position = [];                  // translate
         for (let vertex of shape.vertices) {
            position.push( geometry.addVertex(vertex).index );
         }
         // now walk through the faces
         let visited = 0;
         for (let i = 0; i < shape.geometry.length && visited < shape.faces.length; ++i) {
            const wEdge = shape.geometry[i];
            let face =  shape.faces[ wEdge.left.face ];
            if (face.wEdge === null) {
               face.wEdge = i;
               visited++;
            }
            face = shape.faces[ wEdge.right.face ];
            if (face.wEdge === null) {
               face.wEdge = i;
               visited++;
            }
         }
         // yes, now we can traverse the face's edge

         for (let i = 0; i < shape.faces.length; ++i) {
            let pts = [], colors = [], uv = [];
            const face = shape.faces[i];
            const material = catalog.get(face.material);
            catalogue.add(material);
            const start = face.wEdge;
            let current = start;
            do {
               let wEdge = shape.geometry[current];
               if (wEdge.left.face === i) {
                  pts.push( position[wEdge.start] );
                  colors.push( wEdge.left.color );
                  uv.push( wEdge.left.uv );
                  current = wEdge.left.prev;
               } else {
                  pts.push( position[wEdge.end] );
                  colors.push( wEdge.right.color );
                  uv.push( wEdge.right.uv );
                  current = wEdge.right.prev;
               }
            } while (start !== current);
            const result = geometry.addPolygonEx(0, pts.length, pts, material);
            if (result) {
               const hLoop = result.hLoop;  
               for (let i = 0; i < hLoop.length; ++i) {
                  if (colors[i]) {
                     hLoop[i].setVertexColor(colors[i]);
                  }
                  if (uv[i]) {
                     hLoop[i].setUV(uv[i]);
                  }
               }
            }
         }
         objs.push( ret );
      }

      return [objs, catalogue];
   }

   readKeyValue(parser, tupleLen) {  // needs to guarantee key, value
      if (tupleLen === undefined) {
         tupleLen = parser.readTuple();
      }
      if (tupleLen !== 2) {
         throw("ETF: bad {key, value}");
      }
      const key = parser.readNext();
      let value = parser.readNext();
      if (value.type === "tuple") {  // a tuple
         let [subKey, subValue] = this.readKeyValue(parser, value.len);
         value = {};
         value[subKey] = subValue;
      } else if (value.type === "list") {  // a list
         let len = value.len;
         value = {};
         for (let i = 0; i < len; ++i) {
            let [key_, value_] = this.readKeyValue(parser);
            value[key_] = value_;
         }
         parser.readNil();
      }

      return [key, value];
   }

   skipUnknown(parser) {   // 
      const unknown = parser.readNext();
      if (unknown.type === "tuple") {  // a tuple
         for (let i = 0; i < unknown.len;++i) {
            this.skipUnknown(parser);
         }
      } else if (unknown.type === "list") {  // a list
         for (let i = 0; i< unknown.len; ++i) {
            this.skipUnknown(parser);
         }
         parser.readNil();
      } 
   }

   readShape(parser) {  // list_tuple
      const objs = [];
      let len = parser.readList();
      for (let i = 0; i < len; ++i) {
         if (parser.readTuple() === 4) {  // winged tuple
            objs.push( this.readObject(parser));
            this.skipUnknown(parser);
         }
      }
      parser.readNil();
      return objs;
   }

   readObject(parser) {
      const tag = parser.readNext();   // "object" tag
      const name = parser.readNext();
      if (parser.readTuple()=== 5) {
         const tag = parser.readNext();   // "winged" tag
         const geometry = this.readGeometry(parser);
         const faces = this.readFaceMaterial(parser);
         const vertices = this.readVertex(parser);
         this.skipUnknown(parser);   // skipped [nil]
         return {name, geometry, faces, vertices};
      }
      throw("Object: unexpected read error");
   }

   readGeometry(parser) {
      const wingedList = parser.readNext();
      const geometry = [];
      for (let i = 0; i < wingedList.len; ++i) {
         let wEdge = {left: {}, right: {}};
         let edge = parser.readNext();
         for (let j = 0; j < edge.len; ++j) {
            this.readWingedEdge(parser, wEdge);
         }
         const nil = parser.readNext();   // check end
         geometry.push( wEdge );
      }
      parser.readNil();   // check end
      return geometry;
   }

   readFaceMaterial(parser) {
      // face material
      const faceList = parser.readNext();
      const faces = [];
      for (let i = 0; i < faceList.len; ++i) {
         let material = parser.readNext();
         if (material.type && material.type === "NIL") {
            faces.push({material:"default", wEdge: null});
         } else {
            if (material.len === 1) {  // [{material, "material_name"}]
               parser.readTuple();  
               parser.readNext();               // atom="material"
               material = parser.readNext();    // string="name"
               faces.push({material, wEdge: null});
            } else {
               throw("ETF: unknown face material type");
            }
            parser.readNil();
         }
      }
      parser.readNil();
      return faces;
   }

   readVertex(parser) {
      const vertexList = parser.readNext();
      const vertices = [];
      for (let i = 0; i < vertexList.len; ++i) {
         const vertTag = parser.readNext();
         let vertex = new DataView(parser.readNext());   // 3 of doubles(big endian), but we are using little endian
         parser.readNil();
         vertices.push( [vertex.getFloat64(0,false), vertex.getFloat64(8,false), vertex.getFloat64(16,false)] );
      }
      parser.readNil();
      return vertices;
   }

   readWingedEdge(parser, wEdge) {
      const buffer = new ArrayBuffer(4);
      const convert = new DataView(buffer);
      let tuple = parser.readNext();
      let atom = parser.readNext();
      let color, uv;
      switch (atom) {
         case 'color_lt':
            color = new DataView(parser.readNext());
            wEdge.left.color = this.createColor( [color.getFloat32(0,false)*255, color.getFloat32(4,false)*255, color.getFloat32(8,false)*255] );
            break;
         case 'color_rt':
            color = new DataView(parser.readNext());
            wEdge.right.color =  this.createColor( [color.getFloat32(0,false)*255, color.getFloat32(4,false)*255, color.getFloat32(8,false)*255] );
            break;
         case 'uv_rt':
            uv = new DataView(parser.readNext());
            wEdge.right.uv = this.createUV(0, [uv.getFloat64(0,false), uv.getFloat64(8,false)]);
            break;
         case 'uv_lt':
            uv = new DataView(parser.readNext());
            wEdge.left.uv = this.createUV(0, [uv.getFloat64(0,false), uv.getFloat64(8,false)]);
            break;
         case 'edge':
            wEdge.start = parser.readNext();
            wEdge.end = parser.readNext();
            wEdge.left.face = parser.readNext();
            wEdge.right.face = parser.readNext();
            wEdge.left.prev = parser.readNext();
            wEdge.left.next = parser.readNext();
            wEdge.right.prev = parser.readNext();
            wEdge.right.next = parser.readNext();
            break;
         default:
            console.log(atom);
      };
   }

   readProps(parser) {
      let size = parser.readList();
      const prefs = this._inspectUnknown(parser);
      const plugin = this._inspectUnknown(parser);
      const curretView = this._inspectUnknown(parser);
      const views = this._inspectUnknown(parser);
      this.loadImage(parser);
   }

   loadImage(parser) {
      const size = parser.readTuple();
      const imagesAtom = parser.readNext();
      let images = parser.readList();
      for (let i = 0; i < images; ++i) {
         let [index, image] = this.readKeyValue(parser);
         const texture = this.textureCache.get(index);
         if (texture) { 
            texture.name = image.name;
            if (image.filename) {
               this.loadAsync(image.filename).then(files=>{
                  return files[0].image();
               }).then(img=>{
                  img.onload = ()=>{
                     texture.setImage(img);
                  }
                  return img;
               });
            } else if (image.pixels) { // process internal image.
               let pixels = new Uint8ClampedArray(image.pixels);
               if (image.samples_per_pixel === 3) {   // FixMe: how about 2, or 1?
                  const size = 4 * image.width * image. height;   // copy rgb to rgba
                  let data = new Uint8ClampedArray(size);
                  let s = 0, d = 0;
                  while (d < size) {
                     data[d++] = pixels[s++];
                     data[d++] = pixels[s++];
                     data[d++] = pixels[s++];
                     data[d++] = 255;
                  }
                  pixels = data;
               }
               // now put into texture
               texture.setSampler({flipY: false});
               const imageData = new ImageData(pixels, image.width, image.height);
               texture.setImageData(imageData);
            }
         }
      }
      parser.readNil();
   }


   readMaterial(parser) {
      const catalog = new Map;
      let len = parser.readList();
      for (let i = 0; i < len; ++i) {
         parser.readTuple();
         const mat = {};
         mat.name = parser.readNext();
         let length = parser.readList();
         for (let j = 0; j < length; ++j) {
            const valid = parser.readTuple() === 2;
            const type = parser.readNext();  // maps, opengl
            const typeList = parser.readNext();
            if (typeList.type === 'list') {  // read (map, opengl)
               const internalMaterial = {};
               for (let k = 0; k < typeList.len; ++k) {  // {ambient, diffuse ....}
                  if ( parser.readTuple() === 2) {
                     let atom = parser.readNext();
                     let tuple = parser.readNext();
                     let value = tuple;            // assume 1 value
                     if (tuple.type === "tuple") { // 4 value tuple.
                        value = [];
                        for (let i = 0; i < tuple.len; ++i) {
                           value.push( parser.readNext() );
                        }
                     }
                     internalMaterial[atom] = value;
                  }                 
               }
               parser.readNil();
               mat[type] = internalMaterial;
            }
         }
         parser.readNil();
         // instantiated material
         const opengl = mat.opengl;
         let material;
         if (opengl.metallic) {
            material = this.createMaterial(mat.name, {baseColor: opengl.diffuse, 
                                                      emission: opengl.emission,
                                                      metallic: opengl.metallic,
                                                      roughness: opengl.roughness,});

         } else { // convert old
            const old = {diffuseMaterial: opengl.diffuse || [0.3, 0.3, 0.3, 1],
                         emissionMaterial: opengl.emission || [0, 0, 0, 1],
                         specularMaterial: opengl.specular || [0, 0, 0, 1],
                         shininessMaterial: opengl.shininess || 0,
                          }; 
            material = this.createMaterialTraditional(mat.name, old);
         }
         // image map
         if (mat.maps) {
            const maps = mat.maps;
            // FixMe: needs to support metallic texture
            const types = [["diffuse", "baseColorTexture"], ["roughness", "roughnessTexture"], ["normal", "normalTexture"], 
                           ["occlusion", "occlusionTexture"], ["emission", "emissionTexture"]]; // [metallic, "metallicTexture"];
            for (const [inType, outType] of types) {
               if (maps[inType]) {
                  let texture = this.textureCache.get(maps[inType]);
                  if (texture === undefined) {
                     texture = this.createTexture(maps[inType], {flipY: true});
                     this.textureCache.set(maps[inType], texture);
                  }
                  material[outType] = texture;
               }
            }
         }

         catalog.set( mat.name, material );
      }
      parser.readNil();
      // catalog of material;
      return catalog;
   }
}



export {
   WingsImportExporter
}
