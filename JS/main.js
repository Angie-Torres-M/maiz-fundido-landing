// ======================================================
// main.js - Lógica global del sitio
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  // 1) Inyectar header y footer
  await includeHTML("#site-header", "./header.html");
  await includeHTML("#site-footer", "./footer.html");

  // 2) Init features (ya existen elementos del header)
  initTheme();
  initThemeButtons();

  // 3) Re-aplicar i18n (porque header/footer se inyectaron después)
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

// ==============================
// Ver más / Ver menos (traducible)
// ==============================
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

// ==============================
// ALT i18n (FIX: lang estaba fuera de scope)
// ==============================
function refreshAltI18n() {
  const lang = localStorage.getItem("lang") || document.documentElement.lang || "es";
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.dataset.i18nAlt;
    const t = getT(lang, key);
    if (t !== undefined && t !== null) el.setAttribute("alt", t);
  });
}

document.addEventListener("i18n:refresh", refreshAltI18n);

// ==============================
// Menú hamburguesa (móvil) + backdrop
// ==============================
function initMobileMenu() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  const backdrop = document.getElementById("navBackdrop");

  if (!toggle || !menu || !backdrop) return;

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

  // Opcional: si haces scroll y está abierto, cierra
  // window.addEventListener("scroll", () => { if (isOpen()) close(); }, { passive: true });
}
