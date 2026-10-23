(() => {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const requested = params.get('lang');
  const lang = requested === 'en' || requested === 'es'
    ? requested : (localStorage.getItem('lang') === 'en' ? 'en' : 'es');
  const theme = localStorage.getItem('preferredTheme') === 'dark' ? 'dark' : 'light';

  function setLanguage(value) {
    const next = value === 'en' ? 'en' : 'es';
    localStorage.setItem('lang', next);
    root.lang = next;
    document.querySelectorAll('[data-legal-lang]').forEach(el => {
      el.hidden = el.getAttribute('data-legal-lang') !== next;
    });
    document.querySelectorAll('[data-switch-lang]').forEach(el => {
      el.textContent = next === 'es' ? 'English' : 'Español';
      el.setAttribute('aria-label', next === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish');
    });
    const name = document.body.getAttribute('data-page') === 'privacy';
    document.title = next === 'es'
      ? (name ? 'Aviso de privacidad' : 'Términos y condiciones') + ' | Maíz Fundido'
      : (name ? 'Privacy notice' : 'Terms and conditions') + ' | Maíz Fundido';
    document.querySelectorAll('[data-legal-es][data-legal-en]').forEach(el => {
      el.textContent = el.getAttribute(next === 'es' ? 'data-legal-es' : 'data-legal-en');
    });
  }
  function setTheme(value) {
    const next = value === 'dark' ? 'dark' : 'light';
    localStorage.setItem('preferredTheme', next);
    root.setAttribute('data-bs-theme', next);
    document.querySelectorAll('[data-switch-theme]').forEach(el => {
      el.textContent = next === 'dark' ? '☀' : '☾';
      el.setAttribute('aria-label', next === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro');
    });
  }
  setTheme(theme);
  setLanguage(lang);
  document.querySelectorAll('[data-switch-lang]').forEach(el => {
    el.addEventListener('click', () => setLanguage(root.lang === 'es' ? 'en' : 'es'));
  });
  document.querySelectorAll('[data-switch-theme]').forEach(el => {
    el.addEventListener('click', () => setTheme(root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark'));
  });
})();
