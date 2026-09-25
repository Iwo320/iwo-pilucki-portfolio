const language = document.querySelector('.language');
const loginForm = document.querySelector('.login-form');
const loginStatus = document.querySelector('.login-status');

function setLanguage(locale) {
  document.documentElement.lang = locale;
  document.querySelectorAll('[data-en]').forEach(element => {
    element.innerHTML = element.dataset[locale];
  });
  language.textContent = locale === 'en' ? 'PL' : 'EN';
  language.setAttribute('aria-label', locale === 'en' ? 'Zmień język na polski' : 'Change language to English');
}

language.addEventListener('click', () => setLanguage(document.documentElement.lang === 'en' ? 'pl' : 'en'));

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginStatus.textContent = document.documentElement.lang === 'pl' ? 'Logowanie...' : 'Signing in...';
  const form = new FormData(loginForm);
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') })
    });
    if (response.ok) {
      window.location.assign('admin.html');
      return;
    }
    loginStatus.textContent = document.documentElement.lang === 'pl'
      ? 'Nieprawidłowy e-mail lub hasło.'
      : 'Incorrect email or password.';
  } catch {
    loginStatus.textContent = document.documentElement.lang === 'pl'
      ? 'Serwer niedostępny. Uruchom stronę przez npm start.'
      : 'Server unavailable. Run the site with npm start.';
  }
});

fetch('/api/session')
  .then(response => (response.ok ? response.json() : { isAdmin: false }))
  .then(session => {
    if (session.isAdmin) window.location.replace('admin.html');
  })
  .catch(() => {});
