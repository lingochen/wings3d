//
// hotkey handling and remapping.
//
//
//

(function(Wings3D) {

   const _private = {keyMap: new Map, idMap: new Map};

   document.addEventListener('keydown', function(event) {
      //      Don't fire in text-accepting inputs that we didn't directly bind to

      // extract alt, ctrl, shift key
      const meta = Wings3D.createMask(event.altKey, event.ctrlKey, event.shiftKey);
      // extract key
      const hotkey = event.key;
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
   });

   Wings3D.setHotkey = function(id, hotkey, meta='') {
      hotkey = hotkey.toLowerCase();
      meta = meta.toLowerCase();
      const metaMask = Wings3D.createMask(meta.indexOf('alt') > -1, meta.indexOf('ctrl') > -1, meta.indexOf('shift') > -1);
      if (!_private.keyMap.has(hotkey)) {
         _private.keyMap.set(hotkey, []);
      }
      _private.keyMap.get(hotkey).unshift({id: id, meta: metaMask});
   };
   Wings3D.bindHotkey = function(id, fn) {
      _private.idMap.set(id, fn);
   };

}(Wings3D));