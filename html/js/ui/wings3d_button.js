/**
 * wings3d-checkbox
 * wings3d-radio
 * 
 * wrap up <input /><label><slot></slot></label>
 * 
 * the benefit is that we don't have to write extra <input> tag to get the functionality.
 * 
 * use wings3d-radio and wingsd-tab-panel with css can implement "tabs" easily.
 * 
 * wings3d-tab-panel
 *    "for" point to id(input[radio], radio-button). add/remove "selected" attribute depend on 
 * "for" target "checked" attribute.
 * 
 * 
 */


let InputElement = {
   set name(value) {


   },

   get name() {

   },
   
   set checked(bool) {
      if (bool) {
         this.setAttribute('checked', '');
      } else {
         this.removeAttribute('checked');
      }
   },

   get checked() {
      return this.hasAttribute('checked');
   },

   handleCheck(e) {
      if (e.target.checked) {
         if (!this.checked) {
            this.checked = true;
         }
      } else {
         if (this.checked) {
            this.checked = false;
         }
      }
   },

};



const radioTemplate = document.createElement("template");
radioTemplate.innerHTML =`
<style>
  :host > input {
    display: none;
  }
</style>
<input id="radioButtonFOR" type="radio" />
<label for="radioButtonFOR"">
  <slot></slot>
</label>`;
class RadioButton extends HTMLElement {
   constructor() {
      super();
      // this.shadowRoot auto;
      const shadowOpen = this.attachShadow({ mode: "open" });

      shadowOpen.appendChild(radioTemplate.content.cloneNode(true));
      
      // forced bind(arrow function) because inside eventListener, "this" is the element that triggered the event.
      this.handleCheck = this.handleCheck.bind(this);
   }

   // attribute
   static get observedAttributes() {
      return ['checked', ];
   }

   attributeChangedCallback(name, oldVal, newValue) {
      switch (name) {
         case 'checked':
            const event = new Event("change");
            this.dispatchEvent(event);
         break;
      }
   }

   // life cycle
   connectedCallback() {
      const inputElem = this.shadowRoot.querySelector('input');
      // copy name group to input
      inputElem.name = this.name;
      
      // attach change(input?) eventHandler, watching checked event.
      inputElem.addEvenLiistener('change', this.handleCheck);
   }

   disconnectedCallback() {
      const inputElem = this.shadowRoot.querySelector('input');
      inputElem.removeEventListener('change', this.handleCheck);
   }
   
}
Object.assign(RadioButton.prototype, InputElement);
customElements.define("wings3d-radio", RadioButton);
/**
 * example
 * <wings3d-radio name="group0">
 *    <icon> </icon>
 *    <span> </span>
 * </wings3d-radio>
 * 
 */





const checkboxTemplate = document.createElement("template");
checkboxTemplate.innerHTML =`
<style>
  :host > input {
    display: none;
  }
</style>
<input id="checkBoxButtonFOR" type="checkbox" />
<label for="checkBoxButtonFOR"">
  <slot></slot>
</label>`;
class Checkbox extends HTMLElement {
   constructor() {
      super();
      // this.shadowRoot auto;
      const shadowOpen = this.attachShadow({ mode: "open" });

      shadowOpen.appendChild(checkboxTemplate.content.cloneNode(true));
      
      // forced bind(arrow function) because inside eventListener, "this" is the element that triggered the event.
      this.handleCheck = this.handleCheck.bind(this);
   }

   // attribute
   static get observedAttributes() {
      return ['checked', ];
   }

   attributeChangedCallback(name, oldVal, newValue) {
      switch (name) {
         case 'checked':
            const event = new Event("change");
            this.dispatchEvent(event);
         break;
      }
   }

   // life cycle
   connectedCallback() {
      const inputElem = this.shadowRoot.querySelector('input');
      // copy name group to input
      inputElem.name = this.name;
      
      // attach change(input?) eventHandler, watching checked event.
      inputElem.addEvenLiistener('change', this.handleCheck);
   }

   disconnectedCallback() {
      const inputElem = this.shadowRoot.querySelector('input');
      inputElem.removeEventListener('change', this.handleCheck);
   }
}
Object.assign(Checkbox.prototype, InputElement);
customElements.define("wings3d-checkbox", Checkbox);
/**
 * example
 * <wings3d-checkbox name="group0">
 *    <icon> </icon>
 *    <span> </span>
 * </wings3d-checkbox>
 * 
 */
