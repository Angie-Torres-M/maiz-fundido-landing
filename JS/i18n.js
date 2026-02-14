// i18n.js
const DEFAULT_LANG = "es";

function getNestedTranslation(obj, path) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function applyLanguage(lang) {
  // translations viene de translations.js
  if (!window.translations || !window.translations[lang]) {
    console.warn("No translations for lang:", lang);
    return;
  }

  document.documentElement.lang = lang;
  localStorage.setItem("lang", lang);

  // Aplica traducciones
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const t = getNestedTranslation(window.translations[lang], key);

    // Si no existe traducción, NO lo borres
    if (t !== undefined && t !== null) {
      el.innerHTML = t;
    }
  });

  // Estado visual del switch (desktop y móvil)
  const btnDesktop = document.getElementById("lang-toggle");
  if (btnDesktop) btnDesktop.classList.toggle("is-en", lang === "en");

  const btnMobile = document.getElementById("lang-toggle-mobile");
  if (btnMobile) btnMobile.classList.toggle("is-en", lang === "en");
}

function bindLangToggles() {
  const ids = ["lang-toggle", "lang-toggle-mobile"];

  ids.forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    if (btn.dataset.bound === "true") return;

    btn.addEventListener("click", () => {
      const current = localStorage.getItem("lang") || DEFAULT_LANG;
      const next = current === "es" ? "en" : "es";
      applyLanguage(next);
      console.log("Idioma cambiado a:", next); // para que lo veas clarito
    });

    btn.dataset.bound = "true";
  });
}

function initLanguage() {
  const saved = localStorage.getItem("lang") || DEFAULT_LANG;
  applyLanguage(saved);
  bindLangToggles();
}

// Exponer para main.js
window.applyLanguage = applyLanguage;
window.initLanguage = initLanguage;
window.bindLangToggles = bindLangToggles;

document.addEventListener("DOMContentLoaded", initLanguage);

document.addEventListener("i18n:refresh", (e) => {
  const lang = e?.detail?.lang || localStorage.getItem("lang") || DEFAULT_LANG;
  applyLanguage(lang);
  bindLangToggles();
});
