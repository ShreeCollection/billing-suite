/* =========================
   SHREEHUB BUSINESS SUITE
   UTILS
========================= */

const SHREEHUB_KEYS = {
  BUSINESS_PROFILE: "shreehub_business_profile",
  APP_SETTINGS: "shreehub_app_settings",
  CUSTOMERS: "shreehub_customers",
  PRODUCTS: "shreehub_products",
  DOCUMENTS: "shreehub_documents"
};

/* =========================
   DOM HELPERS
========================= */

function $(selector, scope = document) {
  return scope.querySelector(selector);
}

function $$(selector, scope = document) {
  return scope.querySelectorAll(selector);
}

/* =========================
   STORAGE HELPERS
========================= */

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Storage save failed:", error);
    return false;
  }
}

function loadFromStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.error("Storage load failed:", error);
    return fallback;
  }
}

function removeFromStorage(key) {
  localStorage.removeItem(key);
}

/* =========================
   FILE HELPERS
========================= */

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

/* =========================
   MODALS
========================= */

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function closeAllModals() {
  $$(".modal").forEach(modal => {
    modal.classList.add("hidden");
  });

  document.body.style.overflow = "";
}

/* =========================
   SIDEBAR
========================= */

function openSidebar() {
  $("#sidebar")?.classList.add("active");
  $("#mobileOverlay")?.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  $("#sidebar")?.classList.remove("active");
  $("#mobileOverlay")?.classList.remove("active");
  document.body.style.overflow = "";
}

/* =========================
   UI HELPERS
========================= */

function setText(selector, value) {
  const el = $(selector);
  if (el) el.textContent = value;
}

function setHTML(selector, value) {
  const el = $(selector);
  if (el) el.innerHTML = value;
}

function setImage(selector, src, fallback = "assets/logo/logo.png") {
  const el = $(selector);
  if (!el) return;

  el.src = src || fallback;
}

/* =========================
   VALIDATION
========================= */

function isEmpty(value) {
  return !value || !String(value).trim();
}

function validateBusinessProfile(data) {
  if (isEmpty(data.name)) {
    showToast("Business name is required");
    return false;
  }

  return true;
}

/* =========================
   TOAST
========================= */

function showToast(message, type = "success") {
  let toast = document.getElementById("appToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.right = "24px";
    toast.style.padding = "14px 18px";
    toast.style.borderRadius = "14px";
    toast.style.color = "#fff";
    toast.style.fontWeight = "600";
    toast.style.zIndex = "99999";
    toast.style.boxShadow = "0 20px 50px rgba(0,0,0,0.2)";
    toast.style.transition = "all 0.3s ease";

    document.body.appendChild(toast);
  }

  toast.style.background =
    type === "error"
      ? "#dc2626"
      : "#0f766e";

  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
  }, 2500);
}

/* =========================
   DEBOUNCE
========================= */

function debounce(fn, delay = 300) {
  let timer;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}