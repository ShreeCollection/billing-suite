/* =========================================
   SHREEHUB SHARED SIDEBAR LOADER
========================================= */

(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", initSidebar);

  async function initSidebar() {
    const mount = document.getElementById("sidebarMount");
    if (!mount) return;

    try {
      const res = await fetch("components/sidebar.html");
      const html = await res.text();

      mount.innerHTML = html;

      setActiveNav();
      bindSidebarToggle();

    } catch (err) {
      console.error("Sidebar load failed:", err);
    }
  }

  function setActiveNav() {
    const path = window.location.pathname.split("/").pop() || "index.html";

    const map = {
      "index.html": "dashboard",
      "billing.html": "billing",
      "documents.html": "documents",
      "customers.html": "customers",
      "products.html": "products",
      "reports.html": "reports",
      "settings.html": "settings"
    };

    const current = map[path];

    if (!current) return;

    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.remove("active");
    });

    document
      .querySelector(`.nav-link[data-page="${current}"]`)
      ?.classList.add("active");
  }

  function bindSidebarToggle() {
    const sidebar = document.getElementById("sidebar");
    const openBtn = document.getElementById("openSidebar");
    const closeBtn = document.getElementById("closeSidebar");
    const overlay = document.getElementById("mobileOverlay");

    openBtn?.addEventListener("click", () => {
      sidebar?.classList.add("open");
      overlay?.classList.add("show");
    });

    closeBtn?.addEventListener("click", () => {
      sidebar?.classList.remove("open");
      overlay?.classList.remove("show");
    });

    overlay?.addEventListener("click", () => {
      sidebar?.classList.remove("open");
      overlay?.classList.remove("show");
    });
  }

})();