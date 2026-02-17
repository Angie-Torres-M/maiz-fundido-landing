(() => {
  const PUBLIC_KEY = "T4jbmfBU1K4ne304U";
  const SERVICE_ID = "service_t8gwshd";
  const TEMPLATE_OWNER = "template_518knrl";
  const TEMPLATE_AUTOREPLY = "template_3ltfww9"; // ✅ OJO: doble "w" (como en tu dashboard)

  // Asegura que el SDK exista
  if (!window.emailjs) {
    console.error("EmailJS SDK no cargó. Revisa el <script> del CDN.");
    return;
  }

  emailjs.init({ publicKey: PUBLIC_KEY });

  // DOM
  const form = document.getElementById("contact-form");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const typeInput = document.getElementById("requestType");
  const messageInput = document.getElementById("message");

  const btn = document.getElementById("btn-submit");
  const statusEl = document.getElementById("form-status");
  const countEl = document.getElementById("msg-count");

  if (!form || !nameInput || !emailInput || !typeInput || !messageInput || !btn) return;

  // UI status
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

  // Helpers
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
  const isValidType = (t) => ["custom", "collab", "resell"].includes(t);

  const hasBadWords = (text) => {
    const t = sanitize(text).toLowerCase();
    const normalized = t
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ");
    const bad = ["puta","puto","pendejo","pendeja","pinche","mierda","verga","chingar","chingada","culero","culo","joder","idiota","imbecil","estupido"];
    const words = normalized.split(/\s+/).filter(Boolean);
    return words.some(w => bad.includes(w));
  };

  // Contador
  const updateCount = () => {
    if (!countEl) return;
    countEl.textContent = String(messageInput.value.length);
  };
  messageInput.addEventListener("input", updateCount);
  updateCount();

  const lockUI = (locked) => {
    btn.disabled = locked;
    [nameInput, emailInput, typeInput, messageInput].forEach(el => {
      if (el) el.disabled = locked;
    });
  };

  const humanizeType = (value) => {
    const v = sanitize(value);
    if (v === "custom") return "Pedido personalizado";
    if (v === "collab") return "Colaboración";
    if (v === "resell") return "Quiero vender tus productos (comisión)";
    return v || "-";
  };

  const makeTitle = ({ name, requestTypeLabel, message }) => {
    const preview = sanitize(message).replace(/\s+/g, " ").slice(0, 42);
    return `Nuevo mensaje web — ${sanitize(name)} — ${requestTypeLabel} — ${preview}${preview.length >= 42 ? "…" : ""}`;
  };

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");
    form.classList.add("was-validated");

    const name = sanitize(nameInput.value);
    const email = sanitize(emailInput.value);
    const requestType = sanitize(typeInput.value);
    const message = sanitize(messageInput.value);

    let ok = true;

    // Nombre
    if (!isValidName(name)) { nameInput.classList.add("is-invalid"); nameInput.classList.remove("is-valid"); ok = false; }
    else { nameInput.classList.remove("is-invalid"); nameInput.classList.add("is-valid"); }

    // Email
    if (!isValidEmail(email)) { emailInput.classList.add("is-invalid"); emailInput.classList.remove("is-valid"); ok = false; }
    else { emailInput.classList.remove("is-invalid"); emailInput.classList.add("is-valid"); }

    // Tipo
    if (!isValidType(requestType)) { typeInput.classList.add("is-invalid"); typeInput.classList.remove("is-valid"); ok = false; }
    else { typeInput.classList.remove("is-invalid"); typeInput.classList.add("is-valid"); }

    // Mensaje
    if (!isValidMessage(message)) { messageInput.classList.add("is-invalid"); messageInput.classList.remove("is-valid"); ok = false; }
    else { messageInput.classList.remove("is-invalid"); messageInput.classList.add("is-valid"); }

    // Groserías
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

    const requestTypeLabel = humanizeType(requestType);

    // Variables para ambos templates
    const params = {
      name,
      email,                 // Auto-Reply: To Email = {{email}}
      reply_to: email,       // Owner template: Reply-To (si lo usas)
      requestType,
      requestTypeLabel,      // ✅ esto llena {{requestTypeLabel}} en ambos templates
      message,
      time: new Date().toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }),
      title: makeTitle({ name, requestTypeLabel, message }),
      website_url: "https://angie-torres-m.github.io/maiz-fundido-landing/"
    };

    lockUI(true);
    setStatus("Enviando…", "info");

    try {
      // 1) Correo al dueño
      const r1 = await emailjs.send(SERVICE_ID, TEMPLATE_OWNER, params);
      console.log("Owner OK:", r1);

      // 2) Auto-reply
      const r2 = await emailjs.send(SERVICE_ID, TEMPLATE_AUTOREPLY, params);
      console.log("Auto-reply OK:", r2);

      setStatus("¡Listo! Hemos recibido tu mensaje 💛🌽", "ok");

      form.reset();
      updateCount();
      form.classList.remove("was-validated");
      [nameInput, emailInput, typeInput, messageInput].forEach(el => el.classList.remove("is-valid", "is-invalid"));

    } catch (err) {
      console.error("EmailJS error:", err);
      const status = err?.status ? ` (status ${err.status})` : "";
      const text = err?.text || err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      setStatus(`Ups… no se pudo enviar${status}: ${text}`, "error");
    } finally {
      lockUI(false);
    }
  });
})();
