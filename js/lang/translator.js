let currentLanguage = localStorage.getItem('language') || 'en'; // Default to English

function loadTranslations(language) {
    fetch(`/js/lang/${language}.json`)
        .then(response => response.json())
        .then(data => {

            const elementsWithLangId = document.querySelectorAll('[data-lang-id]');
            elementsWithLangId.forEach(element => {
              const langId = element.dataset.langId; // Access the value of the attribute
              const format = element.dataset.langFormat || "%s"

                element.textContent = format.replace("%s", data[langId])
            });

            document.documentElement.lang = language; // Set the lang attribute
            localStorage.setItem('language', language); // Save preference

            // Set the select value after translations are loaded (optional, but good practice)
            const languageSelect = document.getElementById('language-select');
            if (languageSelect) {
                languageSelect.value = language;
            }
        })
        .catch(error => {
            console.error('Error loading translations:', error);
        });
}

function changeLanguage(language) {
    currentLanguage = language;
    loadTranslations(language);

}

// Initial language load
loadTranslations(currentLanguage);