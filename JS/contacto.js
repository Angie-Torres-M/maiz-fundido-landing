(() => {
  const PUBLIC_KEY = "T4jbmfBU1K4ne304U";
  const SERVICE_ID = "service_t8gwshd";
  const TEMPLATE_OWNER = "template_518knrl";
  const TEMPLATE_AUTOREPLY = "template_3ltfvw9";

  emailjs.init({ publicKey: PUBLIC_KEY });

  const form = document.getElementById("contact-form");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const typeInput = document.getElementById("requestType");
  const messageInput = document.getElementById("message");
  const imgInput = document.getElementById("refImage");
  const imgPreview = document.getElementById("img-preview");
  const imgInvalid = document.getElementById("img-invalid");

  const btn = document.getElementById("btn-submit");
  const statusEl = document.getElementById("form-status");
  const countEl = document.getElementById("msg-count");

  if (!form || !nameInput || !emailInput || !typeInput || !messageInput || !btn) return;

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
  const isValidType = (t) => ["custom", "collab", "resell"].includes(t);

  // Imagen: JPG/PNG max 3MB
  const MAX_IMG_BYTES = 3 * 1024 * 1024;
  const isValidImageFile = (file) => {
    if (!file) return true; // opcional
    const okType = ["image/jpeg", "image/png"].includes(file.type);
    const okExt = /\.(jpe?g|png)$/i.test(file.name || "");
    const okSize = file.size <= MAX_IMG_BYTES;
    return (okType || okExt) && okSize;
  };

  // (Opcional) filtro simple de groserías
  const hasBadWords = (text) => {
    const t = sanitize(text).toLowerCase();
    const normalized = t
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ");
    const bad = ["puta","puto","pendejo","pendeja","pinche","mierda","verga","chingar","chingada","culero","culo","joder","idiota","imbecil","estupido"];
    const words = normalized.split(/\s+/).filter(Boolean);
    return words.some(w => bad.includes(w));
  };

  const makeTitle = ({ name, requestType, message }) => {
    const preview = sanitize(message).replace(/\s+/g, " ").slice(0, 42);
    return `Nuevo mensaje web — ${sanitize(name)} — ${requestType} — ${preview}${preview.length >= 42 ? "…" : ""}`;
  };

  const lockUI = (locked) => {
    btn.disabled = locked;
    [nameInput, emailInput, typeInput, messageInput, imgInput].forEach(el => {
      if (el) el.disabled = locked;
    });
  };

  // ---- contador ----
  const updateCount = () => {
    if (!countEl) return;
    countEl.textContent = String(messageInput.value.length);
  };
  messageInput.addEventListener("input", updateCount);
  updateCount();

  // ---- preview imagen ----
  const clearImgUI = () => {
    if (imgPreview) {
      imgPreview.src = "";
      imgPreview.classList.add("d-none");
    }
    if (imgInvalid) imgInvalid.style.display = "none";
    imgInput?.classList.remove("is-invalid", "is-valid");
  };

  const showImgInvalid = () => {
    if (imgInvalid) imgInvalid.style.display = "block";
    imgInput?.classList.add("is-invalid");
    imgInput?.classList.remove("is-valid");
    if (imgPreview) imgPreview.classList.add("d-none");
  };

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  imgInput?.addEventListener("change", async () => {
    clearImgUI();
    const file = imgInput.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      showImgInvalid();
      return;
    }

    imgInput.classList.add("is-valid");
    imgInput.classList.remove("is-invalid");

    // preview
    const url = URL.createObjectURL(file);
    imgPreview.src = url;
    imgPreview.classList.remove("d-none");
  });

  // ---- submit ----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    form.classList.add("was-validated");

    const name = sanitize(nameInput.value);
    const email = sanitize(emailInput.value);
    const requestType = sanitize(typeInput.value);
    const message = sanitize(messageInput.value);
    const file = imgInput?.files?.[0] || null;

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

    // tipo
    if (!isValidType(requestType)) {
      typeInput.classList.add("is-invalid");
      typeInput.classList.remove("is-valid");
      ok = false;
    } else {
      typeInput.classList.remove("is-invalid");
      typeInput.classList.add("is-valid");
    }

    // mensaje
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

    // imagen opcional
    if (file && !isValidImageFile(file)) {
      showImgInvalid();
      ok = false;
    }

    if (!ok) {
      setStatus("Revisa los campos marcados, porfa.", "error");
      return;
    }

    // Si hay imagen, la convertimos a base64 para mandarla en el email
    // (en EmailJS debes mapear image_base64 e image_name en tu template)
    let image_base64 = "";
    let image_name = "";
    if (file) {
      image_base64 = await readFileAsBase64(file);
      image_name = file.name;
    }

    const params = {
      name,
      email,
      requestType,
      message,
      image_name,
      image_base64,
      title: makeTitle({ name, requestType, message }),
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
      clearImgUI();

      form.classList.remove("was-validated");
      [nameInput, emailInput, typeInput, messageInput].forEach(el => el.classList.remove("is-valid", "is-invalid"));

    } catch (err) {
      console.error(err);
      setStatus("Ups… no se pudo enviar. Intenta de nuevo en unos minutos.", "error");
    } finally {
      lockUI(false);
    }
  });
})();
