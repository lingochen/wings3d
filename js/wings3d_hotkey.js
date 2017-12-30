//
// hotkey handling and remapping.
//
//
//
import {createMask} from './wings3d';


const _private = {keyMap: new Map, idMap: new Map};

document.addEventListener('keydown', function(event) {
   event.preventDefault();
   event.stopPropagation();
   //      Don't fire in text-accepting inputs that we didn't directly bind to

   // extract alt, ctrl, shift key
   const meta = createMask(event.altKey, event.ctrlKey, event.shiftKey);
   // extract key
   const hotkey = event.key.toLowerCase();
   // run the binding function
    if (_private.keyMap.has(hotkey)) {
      const metaSet = _private.keyMap.get(hotkey);
      for (let value of metaSet) {
         if ( (value.meta & meta) == value.meta) { // has all the meta
            if (_private.idMap.has(value.id)) {
               const fn = _private.idMap.get(value.id);
               fn(event);
               break;
            }
         }
      }
   }
}, true);

function setHotkey(id, hotkey, meta='') {
      hotkey = hotkey.toLowerCase();
      meta = meta.toLowerCase();
      const metaMask = createMask(meta.indexOf('alt') > -1, meta.indexOf('ctrl') > -1, meta.indexOf('shift') > -1);
      if (!_private.keyMap.has(hotkey)) {
         _private.keyMap.set(hotkey, []);
      }
      _private.keyMap.get(hotkey).unshift({id: id, meta: metaMask});
};
function bindHotkey(id, fn) {
   _private.idMap.set(id, fn);
};

export {
   setHotkey,
   bindHotkey,
}