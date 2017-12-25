/*
// button toolbar for geometry ...etc. 
*/

   /*
   * variable 
   */   
const buttonBarClassName = {
         bar: ".button-bar",
         group: ".button-group",
         button: ".button",
         //link: , 
         //active: ".button-active",
      };

function executeApi(e) {
   let command = e.currentTarget.getAttribute("wings3d-api");
   if (command) {
      //e.preventDefault();
      help( "wings3d api - " + command);
      Wings3D.callApi(command);
   } else {
      console.log("no wings3d-api attribute defined");
   }
};

function clickListener() {
   const toolbar = document.querySelector(buttonBarClassName.bar);
   const buttons = toolbar.querySelectorAll(buttonBarClassName.button);
   for (let button of buttons) {
      button.addEventListener('click', executeApi, false);
   }
};


export {
   init as clickListener,
};