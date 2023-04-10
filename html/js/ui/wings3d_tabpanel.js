/**
 *
 * wings3d-tab-panel
 *    "for" point to id(radio-button). add/remove "selected" attribute depend on
 * "for" target "checked" attribute. 
 *
 * TODO: we handle the "deselect" here, but long term plan is to implement radio-button, which fire
 * "deselect" custom event. using <input> is a temporary kludge.
 */

function changeStylesheetRule(styleSheet, selector, property, value) {
	selector = selector.toLowerCase();
	property = property.toLowerCase();
	value = value.toLowerCase();

	for(let i = 0; i < styleSheet.cssRules.length; i++) {
	   const rule = styleSheet.cssRules[i];
		if(rule.selectorText === selector) {
			rule.style[property] = value;
			return;
		}
	}
  
   const rule = `${selector} { ${property}: ${value}; }`;
	styleSheet.insertRule(rule, 0);
}
changeStylesheetRule(document.styleSheets[1], "wings3d-tabpanel:not([selected])", "display", "none");



const _selectedPanelSet = new Set;


class TabPanel extends HTMLElement {
   constructor() {
      super();
      // forced bind(arrow function) because inside eventListener, "this" is the element that triggered the event.
      this.handleCheck = this.handleCheck.bind(this);
   }

   // attribute
   static get observedAttributes() {
      return ['for', 'selected', ];
   }

   attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
         case 'for':
            // remove oldVal handling
            let elem = document.querySelector(`#${oldValue}`);
            if (elem) {
               elem.removeEventListener('input', this.handleCheck);
            }
            elem = document.querySelector(`#${newValue}`);
            if (elem) {
               elem.removeEventListener('input', this.handleCheck);
            }
         break;
         case 'selected':
            if (newValue !== null) {
               const groupName = this.groupName();
               for (let selected of _selectedPanelSet) {
                  if (groupName.localeCompare(selected.groupName(), undefined, { sensitivity: 'base' }) === 0) {
                     _selectedPanelSet.delete(selected);
                     selected.selected = false;
                     break;
                  }
               }
               _selectedPanelSet.add(this);                  
            }
         break;
      }
   }
   
   groupName() {
      const elem = document.querySelector(`#${this.for}`);
      return elem?.name ?? '';
   }

   get for() {
      return this.getAttribute('for');
   }

   set for(newID) {
      this.setAttribute('for', newID);
   }

   get selected() {
      return this.getAttribute('selected');
   }

   set selected(boolVar) {
      if (boolVar) {
         this.setAttribute('selected', '');
      } else {
         this.removeAttribute('selected');
      }
   }

   connectedCallback() {
      const elem = document.querySelector(`#${this.for}`);
      if (elem) {
         elem.addEventListener("input", this.handleCheck);
         if (elem.checked) {
            this.selected = true;
         }
      }
   }

   disconnectedCallback() {
      const elem = document.querySelector(`#${this.for}`);
      if (elem) {
         elem.removeEventListener('input', this.handleCheck);
      }
      _selectedPanelSet.delete(this);
   }


   handleCheck(e) {
      // only checked=true event fired,
      this.selected = e.target.checked;
      // so we have to unselect first
      
      // now 
   }
}
customElements.define("wings3d-tabpanel", TabPanel);
/*
 * example
 * <div>
 *    <input id="edgeToggle" type="radio">
 * </div>
 * <div >
 *    <wings3d-tabpanel for="edgeToggle">
 *    </wings3d-tabpanel>
 * </div>
 *
 */
