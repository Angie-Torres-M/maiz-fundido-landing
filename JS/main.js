// ======================================================
// main.js - Lógica global del portafolio
// - Inyecta header.html y footer.html
// - Controla tema claro/oscuro (desktop + móvil)
// - Maneja "Ver más / Ver menos" (TRADUCIBLE)
// - Activa menú hamburguesa en móvil
// - Re-aplica i18n después de inyectar header/footer
// ======================================================


document.addEventListener("DOMContentLoaded", async () => {
  // 1) Inyectar header y footer
  await includeHTML("#site-header", "./header.html");
  await includeHTML("#site-footer", "./footer.html");

  // 2) Init features (ahora sí existen botones del header)
  initTheme();
  initThemeButtons();
  initHeader();

  // 3) Re-aplicar i18n (porque header/footer se inyectaron después)
  refreshI18n();

  // 4) Ver más/menos (después de i18n para tomar labels correctas)
  initVerMasButtons();
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
    const textSpan = toggleBtn?.querySelector("span"); // solo existe en desktop
    if (!icon) return;

    // Texto traducible desde translations
    const lang = localStorage.getItem("lang") || document.documentElement.lang || "es";
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


// Header menu (hamburguesa)

function initHeader() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");

  if (toggle && menu && !toggle.dataset.bound) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("active");
      const isOpen = menu.classList.contains("active");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    toggle.dataset.bound = "true";
  }
}


// Ver más / Ver menos (traducible)

function initVerMasButtons() {
  const buttons = document.querySelectorAll('[data-toggle="ver-mas"]');

  buttons.forEach((btn) => {
    const targetId = btn.getAttribute("data-target");
    const target = document.getElementById(targetId);
    if (!target) return;

    if (btn.dataset.bound) return;

    btn.addEventListener("click", () => {
      const lang = localStorage.getItem("lang") || document.documentElement.lang || "es";
      const labelMore = getT(lang, "buttons.more") ?? (lang === "en" ? "Show more" : "Ver más");
      const labelLess = getT(lang, "buttons.less") ?? (lang === "en" ? "Show less" : "Ver menos");

      const isHidden = target.classList.contains("d-none");

      if (isHidden) {
        target.classList.remove("d-none");
        btn.textContent = labelLess;
      } else {
        target.classList.add("d-none");
        btn.textContent = labelMore;
      }
    });

    btn.dataset.bound = "true";
  });
}

// ==============================
// i18n refresh after injecting header/footer
// ==============================

function refreshI18n() {
  const lang = localStorage.getItem("lang") || document.documentElement.lang || "es";

  if (typeof window.applyLanguage === "function") window.applyLanguage(lang);
  if (typeof window.bindLangToggles === "function") window.bindLangToggles();

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

// alt
document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
  const key = el.dataset.i18nAlt;
  const t = getNestedTranslation(window.translations[lang], key);
  if (t !== undefined && t !== null) el.setAttribute("alt", t);
});

// ==============================
// Ocultar header en móvil al hacer scroll hacia abajo
// ==============================
(() => {
  const header = document.querySelector(".header-fijo");
  if (!header) return;

  const mq = window.matchMedia("(max-width: 767.98px)");
  let lastY = window.scrollY;
  const delta = 8;
  const showAfterTop = 10;

  function onScroll() {
    if (!mq.matches) return;

    const y = window.scrollY;

    if (y <= showAfterTop) {
      header.classList.remove("is-hidden");
      lastY = y;
      return;
    }

    if (Math.abs(y - lastY) < delta) return;

    if (y > lastY) header.classList.add("is-hidden");
    else header.classList.remove("is-hidden");

    lastY = y;
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  mq.addEventListener?.("change", () => header.classList.remove("is-hidden"));
})();
