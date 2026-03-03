// ======================================================
// main.js - Lógica global del sitio (CORREGIDO)
// - i18n consistente (localStorage + <html lang>)
// - ver más/menos se actualiza al cambiar idioma SIN click extra
// - evita doble-bind de listeners
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  // 1) Inyectar header y footer
  await includeHTML("#site-header", "./header.html");
  await includeHTML("#site-footer", "./footer.html");

  // 2) Init features (ya existen elementos del header)
  initTheme();
  initThemeButtons();

  // 3) i18n inicial (porque header/footer se inyectaron después)
  refreshI18n();

  // 4) Ver más/menos (después de i18n)
  initVerMasButtons();

  // 5) Menú hamburguesa (después de inyectar header)
  initMobileMenu();
});

// ==============================
// Include HTML fragments
// ==============================
async function includeHTML(selector, url) {
  const host = document.querySelector(selector);
  if (!host) return;

  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);
    host.innerHTML = await res.text();
  } catch (err) {
    console.error(`No se pudo cargar ${url}:`, err);
  }
}

// ==============================
// Lang helpers (single source of truth)
// ==============================
function getLang() {
  const lang = (localStorage.getItem("lang") || document.documentElement.lang || "es").toLowerCase();
  return lang.startsWith("en") ? "en" : "es";
}

function syncHtmlLang(lang) {
  document.documentElement.lang = lang;
}

// ==============================
// Theme
// ==============================
function initTheme() {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("preferredTheme");
  const currentTheme = savedTheme || "light";

  root.setAttribute("data-bs-theme", currentTheme);
  updateThemeToggleText(currentTheme);
}

function updateThemeToggleText(theme) {
  const buttons = document.querySelectorAll("#theme-toggle, #theme-toggle-mobile");

  buttons.forEach((toggleBtn) => {
    const icon = toggleBtn?.querySelector("i");
    const textSpan = toggleBtn?.querySelector("span");
    if (!icon) return;

    const lang = getLang();
    const darkLabel = getT(lang, "theme.dark") ?? (lang === "en" ? "Dark mode" : "Modo oscuro");
    const lightLabel = getT(lang, "theme.light") ?? (lang === "en" ? "Light mode" : "Modo claro");

    if (theme === "dark") {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
      if (textSpan) textSpan.textContent = lightLabel;
      toggleBtn.setAttribute("aria-label", lightLabel);
    } else {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
      if (textSpan) textSpan.textContent = darkLabel;
      toggleBtn.setAttribute("aria-label", darkLabel);
    }
  });
}

function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute("data-bs-theme") || "light";
  const next = current === "light" ? "dark" : "light";

  root.setAttribute("data-bs-theme", next);
  localStorage.setItem("preferredTheme", next);
  updateThemeToggleText(next);
}

function initThemeButtons() {
  const btnDesktop = document.getElementById("theme-toggle");
  const btnMobile = document.getElementById("theme-toggle-mobile");

  if (btnDesktop && !btnDesktop.dataset.bound) {
    btnDesktop.addEventListener("click", toggleTheme);
    btnDesktop.dataset.bound = "true";
  }

  if (btnMobile && !btnMobile.dataset.bound) {
    btnMobile.addEventListener("click", toggleTheme);
    btnMobile.dataset.bound = "true";
  }
}

// ==============================
// Ver más / Ver menos (con data-text-* + i18n:refresh)
// Requiere en HTML:
// data-text-more-es / data-text-less-es / data-text-more-en / data-text-less-en
// ==============================
function initVerMasButtons() {
  const more = document.getElementById("history-more");
  const btn = document.getElementById("historyToggleBtn");
  if (!more || !btn) return;

  function render() {
    const lang = getLang();
    const isExpanded = more.classList.contains("show");
    const attr = isExpanded ? `data-text-less-${lang}` : `data-text-more-${lang}`;
    btn.textContent = btn.getAttribute(attr) || (isExpanded ? "Ver menos" : "Ver más");
  }

  // Evitar doble bind
  if (btn.dataset.bound === "true") {
    render();
    return;
  }

  more.addEventListener("shown.bs.collapse", render);
  more.addEventListener("hidden.bs.collapse", render);

  // Cuando cambias idioma (sin click extra)
  document.addEventListener("i18n:refresh", () => {
    render();
  });

  btn.dataset.bound = "true";
  render();
}

// ==============================
// i18n refresh after injecting header/footer
// - Asegura que <html lang> y localStorage estén alineados
// - Re-bindea toggles del header/footer inyectado
// - Dispara evento único para que otros componentes se actualicen
// ==============================
function refreshI18n() {
  const lang = getLang();

  // Alinear <html lang> (importante para cualquier lógica que lo use)
  syncHtmlLang(lang);

  // Traduce contenido
  if (typeof window.applyLanguage === "function") window.applyLanguage(lang);

  // Re-bind de toggles (header/footer recién inyectados)
  if (typeof window.bindLangToggles === "function") window.bindLangToggles();

  // Un solo evento (para alt, ver-mas, theme labels, etc.)
  document.dispatchEvent(new CustomEvent("i18n:refresh", { detail: { lang } }));
}

// ==============================
// helper: get translation by path
// ==============================
function getT(lang, path) {
  try {
    return path.split(".").reduce((acc, k) => acc?.[k], window.translations?.[lang]);
  } catch {
    return undefined;
  }
}

// ==============================
// ALT i18n
// ==============================
function refreshAltI18n() {
  const lang = getLang();
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.dataset.i18nAlt;
    const t = getT(lang, key);
    if (t !== undefined && t !== null) el.setAttribute("alt", t);
  });
}

document.addEventListener("i18n:refresh", () => {
  refreshAltI18n();

  // También refresca labels del toggle de tema (porque dependen de lang)
  const currentTheme = document.documentElement.getAttribute("data-bs-theme") || "light";
  updateThemeToggleText(currentTheme);
});

// ==============================
// Menú hamburguesa (móvil) + backdrop
// ==============================
function initMobileMenu() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  const backdrop = document.getElementById("navBackdrop");

  if (!toggle || !menu || !backdrop) return;

  // Evitar doble bind
  if (toggle.dataset.bound === "true") return;
  toggle.dataset.bound = "true";

  const OPEN_CLASS = "active";

  const open = () => {
    menu.classList.add(OPEN_CLASS);
    backdrop.classList.add(OPEN_CLASS);
    toggle.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    menu.classList.remove(OPEN_CLASS);
    backdrop.classList.remove(OPEN_CLASS);
    toggle.setAttribute("aria-expanded", "false");
  };

  const isOpen = () => menu.classList.contains(OPEN_CLASS);

  // Botón
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isOpen() ? close() : open();
  });

  // Click fuera (backdrop)
  backdrop.addEventListener("click", () => {
    if (isOpen()) close();
  });

  // Click en links del menú
  menu.addEventListener("click", (e) => {
    const link = e.target.closest("a, button");
    if (link && isOpen()) close();
  });

  // Resize a desktop -> cerrar
  window.matchMedia("(min-width: 768px)").addEventListener("change", () => close());
}