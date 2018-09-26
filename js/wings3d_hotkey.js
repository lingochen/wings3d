//
// hotkey handling and remapping.
//
//
//
import {createMask, runAction} from './wings3d';


const keyMap = new Map;

function runHotkeyAction(mode, event) {
   // extract alt, ctrl, shift key
   const meta = createMask(event.altKey, event.ctrlKey, event.shiftKey);
   // extract key
   const hotkey = event.key.toLowerCase();
   // run the binding function
   let metaSet = keyMap.get(hotkey);
   if (metaSet) {
      // check mode specific first
      for (let value of metaSet) {
         if ( (meta === value.meta) && (value.mode === mode)) { // has all the meta
            runAction(0, value.id, event);
            return;
         }
      }
      // check for non-mode, if no mode specific found
      for (let value of metaSet) {
         if ( (meta === value.meta) && (value.mode === null)) { // has all the meta
            runAction(0, value.id, event);
            return;
         }
      }
   }
};


function setHotkey(mode, id, hotkey, meta='') {
      hotkey = hotkey.toLowerCase();
      meta = meta.toLowerCase();
      const metaMask = createMask(meta.indexOf('alt') > -1, meta.indexOf('ctrl') > -1, meta.indexOf('shift') > -1);
      if (!keyMap.has(hotkey)) {
         keyMap.set(hotkey, []);
      }
      keyMap.get(hotkey).unshift({mode: mode, meta: metaMask, id: id});
};


export {
   runHotkeyAction,
   setHotkey
}