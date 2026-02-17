const DEFAULT_LANG = "es";

function getNestedTranslation(obj, path) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function applyLanguage(lang) {
  if (!window.translations || !window.translations[lang]) {
    console.warn("No translations for lang:", lang);
    return;
  }

  document.documentElement.lang = lang;
  localStorage.setItem("lang", lang);

  // Texto/HTML
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const t = getNestedTranslation(window.translations[lang], key);
    if (t !== undefined && t !== null) el.innerHTML = t;
  });

  // Placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    const t = getNestedTranslation(window.translations[lang], key);
    if (t !== undefined && t !== null) el.setAttribute("placeholder", t);
  });

  // aria-label
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria;
    const t = getNestedTranslation(window.translations[lang], key);
    if (t !== undefined && t !== null) el.setAttribute("aria-label", t);
  });

  // Estado visual del switch
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
    });

    btn.dataset.bound = "true";
  });
}

function initLanguage() {
  const saved = localStorage.getItem("lang") || DEFAULT_LANG;
  applyLanguage(saved);
  bindLangToggles();
}

// Exponer
window.applyLanguage = applyLanguage;
window.initLanguage = initLanguage;
window.bindLangToggles = bindLangToggles;

// Alias para tu main.js actual (evita bug por nombre)
window.bindLangToggle = bindLangToggles;

document.addEventListener("DOMContentLoaded", initLanguage);

document.addEventListener("i18n:refresh", (e) => {
  const lang = e?.detail?.lang || localStorage.getItem("lang") || DEFAULT_LANG;
  applyLanguage(lang);
  bindLangToggles();
});



(() => {
  const btn = document.getElementById("historyToggleBtn");
  const more = document.getElementById("history-more");
  if (!btn || !more) return;

  const keyMore = btn.getAttribute("data-i18n") || "";
  const keyLess = btn.getAttribute("data-i18n-alt-text") || "";

  const setLabel = (expanded) => {
    // si tu i18n.js ya traduce, usamos el texto actual como fallback
    const moreText = btn.dataset.moreText || btn.textContent || "Ver más";
    const lessText = btn.dataset.lessText || "Ver menos";
    btn.textContent = expanded ? lessText : moreText;
  };

  more.addEventListener("shown.bs.collapse", () => setLabel(true));
  more.addEventListener("hidden.bs.collapse", () => setLabel(false));
})();
