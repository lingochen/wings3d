/*
 routines for translation. l10n.

 stub for i18n, other stuff, like number, date format.
*/

import {ezFetch, onReady} from './wings3d.js';
import { BodyMadsor } from './wings3d_bodymads.js';


const i18nAttrib = "data-i18n";
const tooltipAttrib = "data-tooltip";
const menuIdAttrib = "data-menuid";
const newLine = "\n";
let LMB = "LMB: ";
let MMB = "MMB: ";
let RMB = "RMB: ";
let currentCountry = "US";
let currentLanguage = "en";
let defaultMessages;
let currentMessages;

function getTemplate(key, help="") {
   let template = currentMessages.msgstr.get(key+help);
   if (!template && defaultMessages) {
      return defaultMessages.msgstr.get(key+help);
   }
   return template;
}
function setTooltip(elem, tooltip) {
   // now prepare tooltips
   let content = getTemplate(tooltip, "-help");
   if (content) {
      let contentM = getTemplate(tooltip, "-helpM");
      let contentR = getTemplate(tooltip, "-helpR");
      let text = "";
      if (contentM || contentR) {
         text += LMB + content;
         if (contentM) {
            text += newLine + MMB + contentM;
         }
         if (contentR) {
            text += newLine + RMB + contentR;
         }
      } else { // must be string
         text = content;
      }
      elem.setAttribute("title", text);   // use title tooltip directl
   } else {
      elem.setAttribute("title", "");  // set title to nothing
   }
}

function* entries(obj) {
   for (let key in obj) {
      yield [key, obj[key]];
   }
}
function resetStaticElements(langObj) {
   // instantiated category
   currentMessages = {msgstr: new Map};            // provide empty default
   for (let [key, value] of entries(langObj)) {
      currentMessages[key] = new Map(entries(value));
   }
   if (!defaultMessages) {
      defaultMessages = currentMessages;
   }
   
   // set the resources staticElement
   //console.log(langJson);
   let allDom = document.querySelectorAll(`[${i18nAttrib}]`);
   for (let elem of allDom) {
      let warning = true;
      let key = elem.getAttribute(i18nAttrib);
      let content = getTemplate(key);
      if (content) {
         elem.textContent = content;
         warning = false;
      } 
      if (warning) {
         console.log(`Warning: ${key} has no translation`);
      }
   }
   // set tooltip.
   allDom = document.querySelectorAll(`[${menuIdAttrib}]`);
   for (let elem of allDom) {
      let tooltip = elem.getAttribute(menuIdAttrib);
      setTooltip(elem, tooltip);
   }
   // set tooltip for data-tooltip
   allDom = document.querySelectorAll(`[${tooltipAttrib}]`);
   for (let elem of allDom) {
      let tooltip = elem.getAttribute(tooltipAttrib);
      setTooltip(elem, tooltip);
   }
}

function loadResource(language, ver, successCallback){
   ezFetch(`./resources/${language}.json?v=${ver}`)
      .then(data => {
         resetStaticElements(data);
         if (successCallback) {
            successCallback();
         }
      })
      .catch(err => {
         console.log('Fetch Error :-S', err);
      });
} 

function getCurrentLocale() {
   return {country: currentCountry, language: currentLanguage};
}

/**
  * Sets the current language/locale and does any application initialization after loading language.
  *
  * @method load
  * @param {language} The two-letter ISO language code.
  * @param {country} The two-letter ISO conuntry code.
  * @param {successCallback} The function to be called when the language/locale has been loaded. 
  */
function setCurrentLocale(language, ver, country, successCallback) {
   currentCountry = country || 'unknown';
   currentLanguage = language || 'unknown';

   loadResource(currentLanguage, ver, successCallback);
};

/*
 * wonderfully simple template engine.
 * https://stackoverflow.com/questions/30003353/can-es6-template-literals-be-substituted-at-runtime-or-reused
*/
const fillTemplate = function(template, templateVars){
   return new Function(`return \`${template}\`;`).call(templateVars);
}
   /**
     * Replaces each format item in a specified localized string 
     * e.g. key = 'helloFirstNameLastName'
            localised value of key = "Hello ${this.firstname} ${this.lastname}!"
     *      _('helloFirstNameLastName', {firstname: 'John', lastname:'Smith'});
     *      returns "Hello John Smith!"
     *
     * @method _
     * @param {key} The unique identifier for the resource name (using object notation).
     * @return {String} Returns the localized value based on the provided key and optional arguments.
     */
function i18n(key, templateVars) {
   let template = getTemplate(key);
   if (template) {
      if (templateVars) {
         return fillTemplate(template, templateVars);
      }
      return template;
   }
   return `Error: ${key} don't exist`;
};


 
export {
   i18n,          // translate service
   setCurrentLocale,
   getCurrentLocale,
};

// init
onReady(()=> {
   // init i18n-data with textContent.
   let allDom = document.querySelectorAll(`[${i18nAttrib}]`);
   for (let elem of allDom) {
      let i18n = elem.getAttribute(i18nAttrib);
      if (!i18n) { // not empty string
         i18n = elem.textContent.replace(/ /g,'');
         i18n = i18n.replace(/^.{1}/g, i18n[0].toLowerCase());
         elem.setAttribute(i18nAttrib, i18n);
      }
      if (elem.hasAttribute(tooltipAttrib)) {
         elem.setAttribute(tooltipAttrib, i18n);
      }
   }
   // init tooltip - 
   allDom = document.querySelectorAll(`[${tooltipAttrib}=""]`);
   for (let elem of allDom) {
      let str = elem.getAttribute(tooltipAttrib);
      if (!str) { // empty tooltip, needs to setup again.
         str = elem.textContent.replace(/ /g,'');
         str = str.replace(/^.{1}/g, str[0].toLowerCase());
         elem.setAttribute(tooltipAttrib, str);
      }
   }
   // hookup to language select
   let selectLang = document.querySelector('#selectLanguage');
   if (selectLang) {
      const defaultSelect = JSON.parse(selectLang.value);
      setCurrentLocale(defaultSelect.lang, defaultSelect.ver); // default locale
      selectLang.addEventListener('change', function(ev) {
         const select = JSON.parse(selectLang.value);
         setCurrentLocale(select.lang, select.ver); // change locale
       });
   } else {
      // now set locale.
      setCurrentLocale("en");
   }
   // hookup help message handler for title tooltip
   document.body.addEventListener("mouseover", function(ev) {
      const text = ev.target.getAttribute("title");
      if (text !== null) {
         const helpText = text.replace(newLine, "    ");
         help(helpText);
      }
    });
});