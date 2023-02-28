/**
 * tab_toggle
 */



const tabTemplate = document.createElement("template");
tabTemplate.innerHTML =
`<style>
:host {display: flex;}
:host > ::slotted(*) {
   padding: 1rem 2rem;
   flex: 1 1 auto;
   color: lightgrey;
   border-bottom: 2px solid lightgrey;
   text-align: center;               
}
:host > ::slotted([selected]) {
   border-color: black;               
}
</style>
<slot></slot>`;
/**
 * 
 */
class TabToggle extends HTMLElement {
   constructor() {
      super();

      // this.shadowRoot auto;
      const shadowOpen = this.attachShadow({ mode: "open" });

      shadowOpen.appendChild(tabTemplate.content.cloneNode(true));

      // frequently used attributes.
      this._tabIndex = 0;
      this._dom = {tabAll:[]};

      // cache tabDom. and build tabIndex
      let slot = this.shadowRoot.querySelector('slot');
      slot.addEventListener('slotchange', (e)=> {
         let tabIndex = -1;
         // rebuild map. since we are caching might as well use Map to avoid linear scanning.
         let nodes = slot.assignedElements();
         for (let i = 0; i < nodes.length; ++i) {
            const tab = nodes[i];
            if (tabIndex < 0) {
               tab.hasAttribute('selected');
               tabIndex = i;
            }
         }
         this._dom.tabAll = nodes;
         if (tabIndex < 0) {
            tabIndex = 0;
         }
         this._setTabIndex(tabIndex);
      })
      // forced bind(arrow function) because inside eventListener, "this" is the element that triggered the event.
      this.handleSelect = this.handleSelect.bind(this);
   }

   static get observedAttributes() {
      return ['for', ];
   }

   attributeChangedCallback(name, oldVal, newValue) {
      /*switch (name) {
         case 'for':

         break;
      }*/
   }

   set for(val) {
      this.setAttribute('for', val);
   }

   get for() {
      return this.getAttribute('for');
   }

   // life cycle
   connectedCallback() {
      this.addEventListener('click', this.handleSelect);
   }

   disconnectedCallback() {
      this.removeEventListener('click', this.handleSelect);
   }

   /**
    * 
    */
   handleSelect(e) {
      let current = e.target;
      while (current.parentNode !== this) {
         current = current.parentNode;
      }
      if (current.parentNode === this) {  // always true
         const tabAll = this.getTabAll();
         this._setTabIndex(tabAll.indexOf(e.target));
      } else {
         console.log("impossible wings3d-tab clicked");
      }
   }

   get tabIndex() {
      return this._tabIndex;
   }

   set tabIndex(index) {
      if (tabIndex !== this._tabIndex) {
         this._setTabIndex(index);
      }
   }

   _setTabIndex(index) {
      const tabAll = this.getTabAll();
      if (index >= 0 && index < tabAll.length) {
         this._tabIndex = index;
         for (const tab of tabAll) {
            tab.removeAttribute("selected");    // make sure it cleaned.
         }
         tabAll[index].setAttribute("selected", "");

         // check the panel too
         const panelAll = this.getPanelAll();
         if (index < panelAll.length) {      
            for (const panel of panelAll) {
               panel.removeAttribute("selected");
            }
            panelAll[index].setAttribute("selected", "");
   
            // now dispatch onchange event.
            const event = new Event('change');
            this.dispatchEvent(event);
         }
      }
   }

   getTabAll() {
      return this._dom.tabAll;
   }

   getPanelAll() {
      const dom = document.getElementById(this.for);
      if (dom) {  // check existence
         return dom.children;
      }
      return [];
   }
}

customElements.define("wings3d-tab", TabToggle);
/**
 * example
 * <wings3d-tab-toggle for="targetID">
 *    <label slot="tab"> </label>
 *    <icon slot="tab"> </icon>
 * </wings3d-tab-toggle>
 * 
 * <div id="targetID">
 *    <div>panel 1</div>
 *    <div>panel 2</div>
 * </div>
 */

