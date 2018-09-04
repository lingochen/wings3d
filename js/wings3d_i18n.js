/*
 routines for translation. l10n.

 stub for i18n, other stuff, like number, date format.
*/

import {ezFetch, onReady} from './wings3d';


const i18nAttrib = "data-i18n";
let currentCountry = "US";
let currentLanguage = "en";
let defaultMessages;
let currentMessages;

function getTemplate(key) {
   let template = currentMessages.get(key);
   if (!template && defaultMessages) {
      return defaultMessages.get(key);
   }
   return template;
}

function* entries(obj) {
   for (let key in obj) {
      yield [key, obj[key]];
   }
}
function resetStaticElements(langObj) {  
   // first copy to currentMessages.
   currentMessages = new Map(entries(langObj));
   
   // set the resources staticElement
   //console.log(langJson);
   let allDom = document.querySelectorAll(`[${i18nAttrib}]`);
   for (let elem of allDom) {
      let key = elem.getAttribute(i18nAttrib);
      let content = getTemplate(key);
      if (content) {
         elem.textContent = content;
      } else {
         console.log(`Warning: ${key} has no translation`);
      }
   }
}

function loadResource(language, successCallback){
   ezFetch(`./resources/${language}.json`)
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
function setCurrentLocale(language, country, successCallback) {
   currentCountry = country || 'unknown';
   currentLanguage = language || 'unknown';

   loadResource(currentLanguage, successCallback);
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
   // init
   setCurrentLocale("en");
   defaultMessages = currentMessages;
   // hookup to language select
   let selectLang = document.querySelector('#selectLanguage');
   if (selectLang) {
      selectLang.addEventListener('change', function(ev) {
         setCurrentLocale(selectLang.value); // change locale
       });
   }
});