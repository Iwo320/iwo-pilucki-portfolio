const language = document.querySelector('.language');
const menu = document.querySelector('.menu');
const nav = document.querySelector('.nav');

function setLanguage(locale) {
  document.documentElement.lang = locale;
  document.querySelectorAll('[data-en]').forEach(element => {
    element.innerHTML = element.dataset[locale];
  });
  language.textContent = locale === 'en' ? 'PL' : 'EN';
  language.setAttribute('aria-label', locale === 'en' ? 'Zmień język na polski' : 'Change language to English');
}

language.addEventListener('click', () => setLanguage(document.documentElement.lang === 'en' ? 'pl' : 'en'));
menu.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  menu.setAttribute('aria-expanded', String(isOpen));
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => nav.classList.remove('is-open')));
