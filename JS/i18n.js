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

  applySeoMeta(lang);
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



// SEO Básico
function applySeoMeta(lang) {
  const tRoot = window.translations?.[lang];
  if (!tRoot) return;

  const title = getNestedTranslation(tRoot, "meta.title") || "Maíz Fundido";
  const desc =
    getNestedTranslation(tRoot, "meta.description") ||
    "Accesorios y piezas impresas en 3D, armadas a mano en México. Diseños cute/geek, colecciones temáticas y pedidos personalizados.";

  document.title = title;

  const descEl = document.getElementById("meta-description");
  if (descEl) descEl.setAttribute("content", desc);

  const canonical = document.getElementById("canonical");
  if (canonical) canonical.setAttribute("href", "https://maizfundido.pages.dev/");

  const ogUrl = document.getElementById("og-url");
  if (ogUrl) ogUrl.setAttribute("content", "https://maizfundido.pages.dev/");

  const ogTitle = document.getElementById("og-title");
  if (ogTitle) ogTitle.setAttribute("content", title);

  const ogDesc = document.getElementById("og-description");
  if (ogDesc) ogDesc.setAttribute("content", desc);
}