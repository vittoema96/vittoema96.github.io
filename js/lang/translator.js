localStorage.setItem('language', localStorage.getItem('language') || 'it');
let currentLanguage = localStorage.getItem('language');



class Translator {
    #langData

    constructor() {
        this.#langData = {
            en: undefined,
            it: undefined
        };
    }

    async init(){
        for(let language of Object.keys(this.#langData)) {
            this.#langData[language] = await (await fetch(`/js/lang/${language}.json`)).json()
        }
    }

    translate (langId, langFormat) {
        const format = langFormat || "%s";
        let extra;
        [langId, extra] = langId.split(' ');

        let transl = this.#langData[currentLanguage][langId];
        if(transl === undefined)
            transl = `ID:${langId}`;
        extra = extra ? ` ${extra}` : '';
        transl = `${transl}${extra}`

        return format.replace("%s", transl);
    }


    spacedTranslate(langId, ...langIds) {
        const transl = this.translate(langId);
        let max = transl.length;
        langIds.forEach(lId => {
            const lSize = this.translate(lId).length
            if(lSize > max){
                max = lSize;
            }
        });
        const lSize = transl.length;
        if(lSize >= max){
            return transl;
        } else {
            const diff = max - lSize;
            return `&nbsp;`.repeat(Math.floor(diff/2)) + transl + `&nbsp;`.repeat(Math.ceil(diff/2));
        }
    }

    loadTranslations(language) {

        if(language === undefined){
            language = currentLanguage;
        }

        if(currentLanguage !== language && !this.#underDevelopedWarningCheck(language)) {
            return;
        }

        currentLanguage = language;

        const elementsWithLangId = document.querySelectorAll(`[data-lang-id]:not([data-current-lang="${language}"])`);
        elementsWithLangId.forEach(element => {
            element.textContent = this.translate(element.dataset.langId, element.dataset.langFormat);
            element.dataset.currentLang = language;
        });

        document.documentElement.lang = language;
        localStorage.setItem('language', language);

        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = language;
        }
    }



    #underDevelopedWarningCheck(language){
        let changeLang = true;
        if (language === 'en')
            changeLang = confirm("Are you sure you want to change to English language?\nThis language is currently poorly supported.\n\n" +
                                 "Sei sicuro di voler cambiare la lingua a Inglese?\nQuesta lingua è attualmente scarsamente supportata.");
        return changeLang;
    }
}
