//
// hotkey handling and remapping.
//
//
//
import {createMask} from './wings3d';


const keyMap = new Map;

document.addEventListener('keydown', function(event) {
   event.preventDefault();
   event.stopPropagation();
   //      Don't fire in text-accepting inputs that we didn't directly bind to

   // extract alt, ctrl, shift key
   const meta = createMask(event.altKey, event.ctrlKey, event.shiftKey);
   // extract key
   const hotkey = event.key.toLowerCase();
   // run the binding function
    if (keyMap.has(hotkey)) {
      const metaSet = keyMap.get(hotkey);
      for (let value of metaSet) {
         if ( (value.meta & meta) == value.meta) { // has all the meta
            Wings3D.runAction(valueId);
            break;
         }
      }
   }
}, true);

function setHotkey(id, hotkey, meta='') {
      hotkey = hotkey.toLowerCase();
      meta = meta.toLowerCase();
      const metaMask = createMask(meta.indexOf('alt') > -1, meta.indexOf('ctrl') > -1, meta.indexOf('shift') > -1);
      if (!keyMap.has(hotkey)) {
         keyMap.set(hotkey, []);
      }
      keyMap.get(hotkey).unshift({id: id, meta: metaMask});
};


export {
   setHotkey
}