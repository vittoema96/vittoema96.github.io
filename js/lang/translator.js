localStorage.setItem('language', localStorage.getItem('language') || 'it');
let currentLanguage = localStorage.getItem('language');

let langData = {
    en: undefined,
    it: undefined
};

function translate (langId, langFormat) {
    const format = langFormat || "%s";
    let tier;
    [langId, tier] = langId.split(' ');

    let transl = langData[currentLanguage][langId];
    if(transl === undefined)
        transl = "!NO.TRANSL!";
    tier = tier ? ` ${tier}` : '';
    transl = `${transl}${tier}`

    return format.replace("%s", transl);
}

function spacedTranslate(langId, ...langIds) {
    const transl = translate(langId);
    let max = transl.length;
    langIds.forEach(lId => {
        const lSize = translate(lId).length
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

function underDevelopedWarningCheck(language){
    let changeLang = true;
    if (language === 'en')
        changeLang = confirm("Are you sure you want to change to English language?\nThis language is currently poorly supported.\n\n" +
                             "Sei sicuro di voler cambiare la lingua a Inglese?\nQuesta lingua è attualmente scarsamente supportata.");
    return changeLang;
}

function loadTranslations(language) {

    if(language === undefined){
        language = currentLanguage;
        }

    if(currentLanguage !== language && !underDevelopedWarningCheck(language)) {
        return;
    }

    currentLanguage = language;

    const elementsWithLangId = document.querySelectorAll(`[data-lang-id]:not([data-current-lang="${language}"])`);
    elementsWithLangId.forEach(element => {
        element.textContent = translate(element.dataset.langId, element.dataset.langFormat);
        element.dataset.currentLang = language;
    });

    document.documentElement.lang = language;
    localStorage.setItem('language', language);

    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = language;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    for(let language of Object.keys(langData)) {
        langData[language] = await (await fetch(`/js/lang/${language}.json`)).json()
    }
});