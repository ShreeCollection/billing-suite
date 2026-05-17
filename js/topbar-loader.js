/* =========================================
   SHREEHUB SHARED TOPBAR LOADER
========================================= */

(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", initTopbar);

  async function initTopbar() {
    const mount = document.getElementById("topbarMount");
    if (!mount) return;

    try {
      const res = await fetch("components/topbar.html");

      if (!res.ok) {
        throw new Error("Failed to load topbar component");
      }

      const html = await res.text();

      mount.innerHTML = html;

      setPageMeta();
      loadBusinessProfile();
      bindTopbarActions();
      bindGlobalSearch();

    } catch (err) {
      console.error("Topbar load failed:", err);
    }
  }

  function setPageMeta() {
    const body = document.body;

    const title =
      body.dataset.pageTitle || "Dashboard";

    const subtitle =
      body.dataset.pageSubtitle ||
      "Welcome to ShreeHub Business Suite";

    const titleEl =
      document.getElementById("dynamicPageTitle");

    const subtitleEl =
      document.getElementById("dynamicPageSubtitle");

    if (titleEl) {
      titleEl.textContent = title;
    }

    if (subtitleEl) {
      subtitleEl.textContent = subtitle;
    }
  }

  function loadBusinessProfile() {
    let business = {};

    try {
      business =
        JSON.parse(
          localStorage.getItem("shreehub_business_profile")
        ) || {};
    } catch {
      business = {};
    }

    const name =
      business.name?.trim() || "ShreeHub";

    const profileName =
      document.getElementById("profileBusinessName");

    const profileAvatar =
      document.getElementById("profileAvatar");

    const profileBox =
      document.querySelector(".profile-box");

    if (profileName) {
      profileName.textContent = name;
      profileName.title = name;
    }

    if (profileBox) {
      profileBox.title = name;
    }

    if (profileAvatar) {
      profileAvatar.textContent =
        name.charAt(0).toUpperCase();
    }
  }

  function bindTopbarActions() {
    const editBtn =
      document.getElementById("editBusinessBtn");

    editBtn?.addEventListener("click", () => {
      window.location.href = "settings.html";
    });
  }

  function bindGlobalSearch() {
    const input =
      document.getElementById("globalSearch");

    if (!input) return;

    input.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;

      const query =
        input.value.trim().toLowerCase();

      if (!query) return;

      const routes = {
        dashboard: "index.html",
        home: "index.html",

        billing: "billing.html",
        invoice: "billing.html",
        invoices: "billing.html",
        quotation: "billing.html",
        quotations: "billing.html",
        receipt: "billing.html",
        receipts: "billing.html",

        documents: "documents.html",
        document: "documents.html",
        docs: "documents.html",

        customers: "customers.html",
        customer: "customers.html",

        products: "products.html",
        product: "products.html",

        reports: "reports.html",
        report: "reports.html",

        settings: "settings.html",
        business: "settings.html",
        profile: "settings.html"
      };

      const route = routes[query];

      if (route) {
        window.location.href = route;
      }
    });
  }

})();