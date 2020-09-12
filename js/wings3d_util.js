



function getAxisOrder(extent) {
   let size = vec3.create();
   vec3.sub(size, extent.max, extent.min);
   let first, second, third;
   if (size[0] > size[1]) {
      if (size[0] > size[2]) {
         first = 0;
         if (size[1] > size[2]) {
            second = 1;
            third = 2;
         } else {
            second = 2;
            third = 1;
         }
      }
   } else if (size[1] > size[2]) {

   } else {

   }

   return [first, second, third];
};

function hexToRGB(hex) {
   return [parseInt(hex.slice(1, 3), 16)/255,
           parseInt(hex.slice(3, 5), 16)/255,
           parseInt(hex.slice(5, 7), 16)/255];
};
function hexToRGB8(hex) {
   return [parseInt(hex.slice(1, 3), 16),
           parseInt(hex.slice(3, 5), 16),
           parseInt(hex.slice(5, 7), 16)];
};
function hexToRGBA(hex) {
  return [parseInt(hex.slice(1, 3), 16)/255,
          parseInt(hex.slice(3, 5), 16)/255,
          parseInt(hex.slice(5, 7), 16)/255,
          1.0];
};

function hexToCssRGBA(hex) {  // microsft edge don't support #rrggbbaa format yet, so we convert to rgba() 2018/09/24.
   const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
   const a = parseInt(hex.slice(7, 9), 16) / 255;
   return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/**
 * convert float to hex value guarantee 2 digits. range(0, 255)
 * @param {*} value - between 0.0 - 1.0 
 */
function floatToHex(value) {
   value = Math.min(Math.max(value, 0.0), 1.0); // capped to (0.0, 1.0);
   return Math.round(value*255).toString(16).padStart(2, '0');
}

function rgbToHex(r, g, b) {
   r = floatToHex(r);
   g = floatToHex(g);
   b = floatToHex(b);
   return `#${r}${g}${b}`;
}

function rgbaToHex(r, g, b, a) {
   r = floatToHex(r);
   g = floatToHex(g);
   b = floatToHex(b);
   a = floatToHex(a);
   return `#${r}${g}${b}${a}`;
}

/**
 * https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 * generate unique id using crypto functions to avoid collision.
 */
function get_uuidv4() {
   return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
     (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
   )
 };

function clamp(number, min, max) {
   return Math.min(max, Math.max(min, number));
};

const Vec3View = function(buffer, offset = 0) {
   this.buffer = buffer;
   this.offset = offset;
};

Vec3View.prototype.init = function(buffer, offset = 0) {
   this.buffer = buffer;
   this.offset = offset;
   return this;
}

Vec3View.prototype.reset = function() {
   this.offset = 0;
   return this;
}

Vec3View.uint8resize = function(oldBuffer) {
   const buffer = new Uint8Array(oldBuffer.length*1.5);
   buffer.set(oldBuffer);
   return buffer;
}

Vec3View.prototype.alloc = function(resize) {
   if (this.offset >= this.buffer.length) {
      this.buffer = resize(this.buffer);
   };
   return this.buffer;
};

Vec3View.prototype.inc = function() {
   this.offset += 3;
   return this;
};

Vec3View.prototype.dec = function() {
   this.offset -= 3;
   return this;
};

Vec3View.prototype.set = function(inVec3) {
   this.buffer[this.offset] = inVec3[0];
   this.buffer[this.offset+1] = inVec3[1];
   this.buffer[this.offset+2] = inVec3[2];
   return this;
}

// faked array [0,1,2]
Object.defineProperties(Vec3View.prototype, {
   0: { get: function() {return this.buffer[this.offset];},
        set: function(value) {this.buffer[this.offset] = value; return value;} },
   1: { get: function() {return this.buffer[this.offset+1];},
        set: function(value) {this.buffer[this.offset+1] = value; return value;} },
   2: { get: function() {return this.buffer[this.offset+2];},
        set: function(value) {this.buffer[this.offset+2] = value; return value;} },
   length: { get: function() { return 3;},
             set: function(_value) {}}
});


const Vec4View = function(buffer, offset = 0) {
   this.buffer = buffer;
   this.offset = offset;
};

Vec4View.prototype.inc = function() {
   this.offset += 4;
   return this;
};

Vec4View.prototype.dec = function() {
   this.offset -= 4;
   return this;
};

Vec4View.prototype.set = function(inVec4) {
   this.buffer[this.offset] = inVec4[0];
   this.buffer[this.offset+1] = inVec4[1];
   this.buffer[this.offset+2] = inVec4[2];
   this.buffer[this.offset+3] = inVec4[3];
   return this;
}

// faked array [0,1,2,3]
Object.defineProperties(Vec4View.prototype, {
   0: { get: function() {return this.buffer[this.offset];},
        set: function(value) {this.buffer[this.offset] = value; return value;} },
   1: { get: function() {return this.buffer[this.offset+1];},
        set: function(value) {this.buffer[this.offset+1] = value; return value;} },
   2: { get: function() {return this.buffer[this.offset+2];},
        set: function(value) {this.buffer[this.offset+2] = value; return value;} },
   3: { get: function() {return this.buffer[this.offset+3];},
        set: function(value) {this.buffer[this.offset+3] = value; return value;} },
   length: { get: function() { return 4;},
             set: function(_value) {}} 
});


export {
   getAxisOrder,
   hexToRGB,
   hexToRGB8,
   hexToRGBA,
   hexToCssRGBA,
   rgbToHex,
   rgbaToHex,
   get_uuidv4,
   clamp,
   Vec3View,
   Vec4View,
};
