(() => {
  const PUBLIC_KEY = "T4jbmfBU1K4ne304U";
  const SERVICE_ID = "service_t8gwshd";
  const TEMPLATE_OWNER = "template_518knrl";
  const TEMPLATE_AUTOREPLY = "template_3ltfvw9";

  emailjs.init({ publicKey: PUBLIC_KEY });

  const form = document.getElementById("contact-form");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");
  const btn = document.getElementById("btn-submit");
  const statusEl = document.getElementById("form-status");
  const countEl = document.getElementById("msg-count");

  if (!form || !nameInput || !emailInput || !messageInput || !btn) return;

  // ---- ALERTA (Bootstrap) ----
  const setStatus = (msg = "", type = "info") => {
    if (!statusEl) return;

    statusEl.textContent = msg;
    statusEl.classList.remove("d-none", "alert-info", "alert-success", "alert-danger");
    statusEl.classList.add(
      type === "error" ? "alert-danger" :
      type === "ok" ? "alert-success" :
      "alert-info"
    );

    if (!msg) statusEl.classList.add("d-none");
  };

  // ---- helpers ----
  const sanitize = (s) => String(s || "").trim();
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(sanitize(email));
  const isValidName = (name) => {
    const v = sanitize(name);
    return v.length >= 2 && v.length <= 60;
  };
  const isValidMessage = (msg) => {
    const v = sanitize(msg);
    return v.length >= 10 && v.length <= 400;
  };

  // Filtro simple de groserías (puedes ampliar la lista)
  const hasBadWords = (text) => {
    const t = sanitize(text).toLowerCase();

    // evita falsos positivos por acentos / variaciones simples
    const normalized = t
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ");

    const bad = [
      "puta", "puto", "pendejo", "pendeja", "pinche", "mierda",
      "verga", "chingar", "chingada", "cabr[oó]n", "culero", "culo",
      "joder", "idiota", "imbecil", "estupido"
    ];

    // match por palabra completa
    const words = normalized.split(/\s+/).filter(Boolean);
    return words.some(w => bad.some(b => {
      // soporta "cabrón" con regex sencilla
      if (b.includes("[") || b.includes("\\")) return new RegExp(`^${b}$`, "i").test(w);
      return w === b;
    }));
  };

  const makeTitle = ({ name, message }) => {
    const preview = sanitize(message).replace(/\s+/g, " ").slice(0, 42);
    return `Nuevo mensaje web — ${sanitize(name)} — ${preview}${preview.length >= 42 ? "…" : ""}`;
  };

  const lockUI = (locked) => {
    btn.disabled = locked;
    nameInput.disabled = locked;
    emailInput.disabled = locked;
    messageInput.disabled = locked;
  };

  // ---- contador ----
  const updateCount = () => {
    if (!countEl) return;
    countEl.textContent = String(messageInput.value.length);
  };
  messageInput.addEventListener("input", updateCount);
  updateCount();

  // ---- submit ----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    form.classList.add("was-validated");

    const name = sanitize(nameInput.value);
    const email = sanitize(emailInput.value);
    const message = sanitize(messageInput.value);

    let ok = true;

    // nombre
    if (!isValidName(name)) {
      nameInput.classList.add("is-invalid");
      nameInput.classList.remove("is-valid");
      ok = false;
    } else {
      nameInput.classList.remove("is-invalid");
      nameInput.classList.add("is-valid");
    }

    // email
    if (!isValidEmail(email)) {
      emailInput.classList.add("is-invalid");
      emailInput.classList.remove("is-valid");
      ok = false;
    } else {
      emailInput.classList.remove("is-invalid");
      emailInput.classList.add("is-valid");
    }

    // mensaje (largo)
    if (!isValidMessage(message)) {
      messageInput.classList.add("is-invalid");
      messageInput.classList.remove("is-valid");
      ok = false;
    } else {
      messageInput.classList.remove("is-invalid");
      messageInput.classList.add("is-valid");
    }

    // groserías
    if (ok && hasBadWords(message)) {
      messageInput.classList.add("is-invalid");
      messageInput.classList.remove("is-valid");
      setStatus("Tu mensaje contiene palabras no permitidas. ¿Puedes reformularlo, porfa? 💛", "error");
      return;
    }

    if (!ok) {
      setStatus("Revisa los campos marcados, porfa.", "error");
      return;
    }

    const params = {
      name,
      email,
      message,
      title: makeTitle({ name, message }),
      time: new Date().toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }),
    };

    lockUI(true);
    setStatus("Enviando…", "info");

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_OWNER, params);
      await emailjs.send(SERVICE_ID, TEMPLATE_AUTOREPLY, params);

      setStatus("¡Listo! Hemos recibido tu mensaje 💛🌽", "ok");

      form.reset();
      updateCount();

      form.classList.remove("was-validated");
      [nameInput, emailInput, messageInput].forEach(el => {
        el.classList.remove("is-valid", "is-invalid");
      });

    } catch (err) {
      console.error(err);
      setStatus("Ups… no se pudo enviar. Intenta de nuevo en unos minutos.", "error");
    } finally {
      lockUI(false);
    }
  });
})();
