/*
 *
 * MADS (Modify, Add, Delete, Select) operation. 
 *
**/
"use strict";

class Madsor { // Modify, Add, Delete, Select, (Mads)tor. Model Object.
   constructor() {
      this.currentEdge = null;
      this.shaderData = Wings3D.gl.createShaderData();
      this.shaderData.setUniform4fv("uColor", [0.0, 1.0, 0.0, 0.3]); // hilite green, selected hilite yellow.
   }

   setPreview(preview) {
      this.preview = preview;
   }

   setCurrent(edge, intersect, center) {
      if (this.currentEdge !== edge) {
         if (this.currentEdge !== null) {
            this.hideOldHilite();
         }
         if (edge !== null) {
            this.showNewHilite(edge, intersect, center);
         }
         this.currentEdge = edge;
      }
   }

   hideOldHilite() {}

   draw(gl) {
      if (this.currentEdge) {
         this.useShader(gl);
         gl.bindTransform();
         gl.bindShaderData(this.shaderData, false);
         this.drawObject(gl);
      }
   }
}


class FaceMadsor extends Madsor {
   constructor() {
      super();
      // setup highlite face, at most 18 triangles.
      var buf = new Float32Array(3*20);
      this.trianglefan = {data: buf, length: 0};
      this.shaderData.setPosition(this.trianglefan.data);      
   }

   select(preview) {
      // check not null, shouldn't happened
      if (this.currentEdge !== null) {
         preview.selectFace(this.currentEdge);
      }    
   }

   showNewHilite(edge, intersect, center) {
      if ((this.currentEdge === null) || (this.currentEdge.face !== edge.face)) {   // make sure it new face
         if (edge.face.numberOfVertex < 17) {
            var position = this.trianglefan.data;
            var i = 0;
            position[i++] = center[0];
            position[i++] = center[1];
            position[i++] = center[2];
            edge.face.eachVertex( function(vertex) {
               position[i++] = vertex.vertex[0];
               position[i++] = vertex.vertex[1];
               position[i++] = vertex.vertex[2];
            });
            // copied the first vertex to complete fan
            position[i++] = position[3];
            position[i++] = position[4];
            position[i++] = position[5];
            this.trianglefan.length = i / 3;
            // update vbo buffer
            this.shaderData.updatePosition(this.trianglefan.data);
         }
      }
   }

   drawObject(gl) {
      // draw hilite
      gl.drawArrays(gl.TRIANGLE_FAN, 0, this.trianglefan.length);
   }

   previewShader(gl) {
      gl.useShader(Wings3D.shaderProg.colorSolidWireframe);
   }

   useShader(gl) {
      gl.useShader(Wings3D.shaderProg.solidColor);
   }
}


// 
class EdgeMadsor extends Madsor {
   constructor() {
      super();
      // saved the selectedEdge here.
      this.selectedMap = new Map;
   }

   select(preview) {
      //
      if (this.currentEdge !== null) {
         preview.selectEdge(this.currentEdge);
         var wingedEdge = this.currentEdge.wingedEdge;
         if (wingedEdge.selected === true) {
            this.selectedMap.set(wingedEdge.index, wingedEdge);
            // checked if
         } else {
            this.selectedMap.delete(wingedEdge.index);
         }
      }
   }

   hideOldHilite() {
      //if (this.currentEdge) {
         this.preview.hiliteEdge(this.currentEdge, false);
      //}
   }

   showNewHilite(edge, intersect, _center) {
      // setting of setCurrentEdge
      //if (this.currentEdge) {
         this.preview.hiliteEdge(edge, true);
      //}
   }

   draw(gl) {
      //if (this.currentEdge) {
         this.useShader(gl);
         gl.bindTransform();
         if (this.preview) {
            this.preview.drawEdge(gl);
         }
      //}
   }

   previewShader(gl) {
      gl.useShader(Wings3D.shaderProg.solidWireframe);
   }

   useShader(gl) {
      //gl.useShader(Wings3D.shaderProg.solidColor);
      gl.useShader(Wings3D.shaderProg.selectedColorLine);
   }
}

class VertexMadsor extends Madsor {
   constructor() {
      super();
      this.currentVertex = null;
   }

   select(preview) {
      //
      if (this.currentVertex !== null) {
         this.preview.selectVertex(this.currentVertex);
      }
   }

   setCurrent(edge, intersect, center) {
      // find out origin, dest. which is closer.
      var currentVertex = null;
      if (edge !== null) {
         currentVertex = edge.destination();
         var distance0 = vec3.distance(edge.origin.vertex, intersect);
         var distance1 = vec3.distance(currentVertex.vertex, intersect);
         if (distance0 < distance1) {
            currentVertex = edge.origin;
         }
      }
      if (currentVertex !== this.currentVertex) {
         if (this.currentVertex !== null) {
            this.preview.hiliteVertex(this.currentVertex, false);
         }
         if (currentVertex !== null) {
            this.preview.hiliteVertex(currentVertex, true);
         }
         this.currentVertex = currentVertex;
      }
      this.currentEdge = edge;
   }


   draw(gl) {
      // draw hilite
      //if (this.currentEdge) {
         this.useShader(gl);
         gl.bindTransform();
         if (this.preview) {
            this.preview.drawVertex(gl);
         }
      //}
   }

   previewShader(gl) {
      gl.useShader(Wings3D.shaderProg.solidWireframe);
   }

   useShader(gl) {
      gl.useShader(Wings3D.shaderProg.selectedColorPoint);
   }
} 
