/*
//
// introductory tutorials. 
/// later expand to our own tutorial format and editor?
//
*/
import * as Tutor from './wings3d_interact';
import * as UI from './wings3d_ui';
import * as Wings3D from './wings3d';

const tours = {};

function createGuideTour() {
   //tutor.addStep();

   tours.about = () => {
      Tutor.cancel();
      Tutor.addStep("Welcome", "", "<p>Wings3D4Web is a web implementation of Wings3D modeller</p>" +
       "<p>Use Help's interactive learning aid</p>" +
       "<p>Or goto <a target='_blank' href='http://www.wings3d.com/?page_id=87'>Wings3D documentation page</a> for more instruction.</p>",
       "helpMenu", "bottom"
      );
      Tutor.startTour();
   };

   tours.introduction = () => {
      Tutor.cancel();
      // add step into tutor
      Tutor.addStep("Welcome", "Interface Essential", `Wings 3D interface keeps the focus on modeling. It consists of 
         <ul>
          <li>Menubar</li>
          <li>Toolbar</li>
          <li>Geometry Info</li>
          <li>Modelling Area</li>
          <li>Information Line</li>
         </ul>`,
         "", "top"
      );
      Tutor.addStep("Status", "Geometry Info", "Shown information about the current Model if any",
       "statusbar", "bottom-start"
      );
      Tutor.addStep("Information", "Information Line", 
       `<ul>
         <li>Hovering over almost anything in Wings displays its function in the info line.</li>
         <li><mark>L, M</mark>, and <mark>R</mark> are used in the info line to indicate commands initiated by the <em>Left, Middle</em>, and <em>Right</em> mouse buttons.</li>
         <li>Uppercase letters in square brackets represent keyboard keys like <mark>[C]</mark>.</li>
         <li>Numbers in square brackets represent number keys on the keyboard like <mark>[1], [2], [3]</mark>.</li>
         <li><mark>[Shift], [Ctrl]</mark>, and <mark>[Alt]</mark> are keyboard modifier keys.</li>
        </ul>`,
       "helpbar", "top-start"
      );
      Tutor.addStep("Undo", "undo/redo", "undo button revert the last operation",
       "undoEdit", "bottom"
      );
      Tutor.addStep("Redo", "undo/redo", "redo button revert the last undo operation",
       "redoEdit", "bottom"
     );
   
      // show 
      Tutor.startTour();
   };
   tours.basicCommands = () => {
      Tutor.cancel();   // clear tours.
      Tutor.addZoomStep("Welcome", "Zoom", "Mouse wheel scroll in Canvas will zoom in/out",
       "", "top");
      Tutor.addExpectStep(Wings3D.action.cameraModeEnter, "Camera", "Camera Mode", "Let <em>M</em>, click middle mouse button anywhere in the Canvas to enter camera mode",       
       "", "right");
      Tutor.addExpectStep(Wings3D.action.cameraModeExit, "MoveCamera", "Move Camera", "Information Line shows you how to move camera, exit Camera Mode, and you can still zoom in/out",
       "helpbar", "top-start");
      Tutor.addMultiStep("Cube Creation", "Create Cube Steps", "Steps to create a Cube", "", "top",
         [Tutor.expectStep(Wings3D.action.contextMenu, "CreateMenu", "ContextMenu", "Let <em>R</em> click right mouse button in the Canvas empty place to bring up CreateObject Menu",
           "", "left"),
          Tutor.expectStep(Wings3D.action.createCubeDialog, "CreateCubeForm", "Great Job", "Click Cube MenuItem to create Cube",
           "createCube", "right"),
          Tutor.expectStep("createCube", "CreateCube", "Cube Form", "You can adjust the cube's parameter",
           "createCubeForm", "top")]
         );
      Tutor.addFaceSelectStep(1, "selectFace", "Select any Face", "Try to click/select face",
         "left");
      Tutor.addStep("Congratulation", "Congratulation", "<em>R</em>, Right click mouse button will bring up Face tools. Now you know the basic steps.",
           "", "bottom");

/*
      Tutor.addExpectStep(Wings3D.action.contextMenu, "CreateMenu", "ContextMenu", "Let <em>R</em> click right mouse button in the Canvas empty place to bring up CreateObject Menu",
       "", "left");
      Tutor.addExpectStep(Wings3D.action.createCubeDialog, "CreateCubeForm", "Great Job", "Click Cube MenuItem to create Cube",
       "createCube", "right");
      Tutor.addExpectStep("createCube", "CreateCube", "Cube Form", "You can adjust the cube's parameter",
       "createCubeForm", "top");
      Tutor.addFaceSelectStep(1, "selectFace", "Select any Face", "Try to click/select face",
       "left");
      Tutor.addStep("Congratulation", "Congratulation", "<em>R</em>, Right click mouse button will bring up Face tools. Now you know the basic steps.",
       "", "bottom"); */

       // start tour
       Tutor.startTour();
   };
   tours.tableTutor = () => {
      Tutor.cancel();   // clear tours.
      Tutor.addExpectStep("Make a simple table", "Cube", "RMB (anywhere in geometry window) to display the primitives menu and select cube with LMB.", 
      "", "top");

      Tutor.startTour();
   };
   UI.bindMenuItem("#about", (ev) => {
      tours.about();
   });
   UI.bindMenuItem("#introduction", (ev) => {
      tours.introduction();
   });
   UI.bindMenuItem("#basicCommands", (ev) => {
      tours.basicCommands();
   });

   UI.bindMenuItem("#tableTutor", (ev) => {
      tours.tableTutor();
   });
}

Wings3D.onReady(createGuideTour);

export {
   tours
}