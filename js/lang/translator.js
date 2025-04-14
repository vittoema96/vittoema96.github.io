localStorage.setItem('language', localStorage.getItem('language') || 'it');
let currentLanguage = localStorage.getItem('language');

let langData = {
    en: undefined,
    it: undefined
};

function loadTranslations(language) {



        const elementsWithLangId = document.querySelectorAll('[data-lang-id]');
        elementsWithLangId.forEach(element => {
          const langId = element.dataset.langId; // Access the value of the attribute
          const format = element.dataset.langFormat || "%s"

            const transl = langData[language][langId] === undefined ? "!Transl.Missing!" : langData[language][langId];
            element.textContent = format.replace("%s", transl)
        });

        document.documentElement.lang = language; // Set the lang attribute
        localStorage.setItem('language', language); // Save preference

        // Set the select value after translations are loaded (optional, but good practice)
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = language;
        }

        // Reorder the skill elements alphabetically after translations
        orderSkillsAlphabetically();

}

function changeLanguage(language) {
    let changeLang = true;
    if (language === 'en')
        changeLang = confirm("Are you sure you want to change to English language?\nThis language is currently poorly supported.\n\n" +
                             "Sei sicuro di voler cambiare la lingua a Inglese?\nQuesta lingua è attualmente scarsamente supportata.")
    if(changeLang) {
        currentLanguage = language;
        loadTranslations(language);
    } else {
        document.getElementById('language-select').value = currentLanguage;
    }

}

function orderSkillsAlphabetically() {
    const skillsContainer = document.getElementById('skills');
    if (!skillsContainer) {
        console.error("Skills container not found.");
        return;
    }

    const skillElements = Array.from(skillsContainer.querySelectorAll('.skill'));

    skillElements.sort((a, b) => {
        const skillNameA = a.querySelector('.skill-name').textContent.trim().toLowerCase();
        const skillNameB = b.querySelector('.skill-name').textContent.trim().toLowerCase();
        return skillNameA.localeCompare(skillNameB);
    });

    // Remove existing skill elements from the container
    skillElements.forEach(skill => skillsContainer.removeChild(skill));

    // Append the sorted skill elements back to the container
    skillElements.forEach(skill => skillsContainer.appendChild(skill));
}

document.addEventListener("DOMContentLoaded", async () => {
    for(let language of Object.keys(langData)) {
        langData[language] = await (await fetch(`/js/lang/${language}.json`)).json()
    }
});