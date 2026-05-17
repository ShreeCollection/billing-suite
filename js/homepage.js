/* =========================================
   SHREEHUB DASHBOARD
========================================= */

(() => {
  "use strict";

  const KEYS = {
    DOCUMENTS: "shreehub_documents",
    BUSINESS: "shreehub_business_profile"
  };

  document.addEventListener("DOMContentLoaded", initDashboard);

  function initDashboard() {
    loadMetrics();
    loadRecentActivity();
    loadBusinessProfile();
    bindActions();
  }

  function getStorage(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function loadMetrics() {
    const docs = getStorage(KEYS.DOCUMENTS, []);

    const metricValues =
      document.querySelectorAll(".metric-card h3");

    if (!metricValues.length) return;

    const totalDocs = docs.length;

    const revenue = docs
      .filter(doc =>
        ["invoice", "receipt"].includes(doc.type)
      )
      .reduce((sum, doc) => {
        return sum + Number(doc.totals?.grandTotal || 0);
      }, 0);

    const draftDocs = docs.filter(
      doc => doc.status === "draft"
    ).length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyDocs = docs.filter(doc => {
      if (!doc.date) return false;

      const d = new Date(doc.date);

      return (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    }).length;

    metricValues[0].textContent = totalDocs;
    metricValues[1].textContent = draftDocs;
    metricValues[2].textContent = monthlyDocs;
    metricValues[3].textContent =
      formatCurrency(revenue);

    const labels =
      document.querySelectorAll(".metric-card p");

    if (labels.length >= 4) {
      labels[0].textContent = "Total Documents";
      labels[1].textContent = "Draft Documents";
      labels[2].textContent = "This Month";
      labels[3].textContent = "Total Revenue";
    }
  }

  function loadRecentActivity() {
    const docs = getStorage(KEYS.DOCUMENTS, []);

    const activityCard =
      document.querySelector(
        ".dashboard-left .dashboard-card"
      );

    if (!activityCard) return;

    const recentDocs = docs.slice(0, 5);

    if (!recentDocs.length) return;

    const emptyState =
      activityCard.querySelector(".empty-state");

    if (emptyState) {
      emptyState.remove();
    }

    const existingList =
      activityCard.querySelector(".recent-doc-list");

    if (existingList) {
      existingList.remove();
    }

    const list = document.createElement("div");
    list.className = "recent-doc-list";

    list.innerHTML = recentDocs
      .map(doc => `
        <div class="recent-doc-item">
          <div>
            <strong>${escapeHtml(doc.number || "--")}</strong>
            <p>
              ${capitalize(doc.type || "document")} •
              ${escapeHtml(doc.customer?.name || "Customer")}
            </p>
          </div>

          <div class="recent-doc-right">
            <strong>${formatCurrency(
              doc.totals?.grandTotal || 0
            )}</strong>
            <span>${formatDate(doc.date)}</span>
          </div>
        </div>
      `)
      .join("");
      
    activityCard.appendChild(list);
  }

  function loadBusinessProfile() {
    const business =
      getStorage(KEYS.BUSINESS, {});

    const name =
      document.querySelector(".business-details h4");

    const desc =
      document.querySelector(".business-details p");

    if (!name || !desc) return;

    if (!business.name) {
      return;
    }

    name.textContent = business.name;

    desc.textContent =
      [
        business.gst,
        business.phone,
        business.email
      ]
      .filter(Boolean)
      .join(" • ") || "Business configured";
  }

  function bindActions() {
    document
      .getElementById("editBusinessBtn")
      ?.addEventListener("click", () => {
        window.location.href = "settings.html";
      });

    document
      .getElementById("setupBusinessBtn")
      ?.addEventListener("click", () => {
        window.location.href = "settings.html";
      });

    document
      .querySelector(".text-btn")
      ?.addEventListener("click", () => {
        window.location.href = "documents.html";
      });
  }

  function formatCurrency(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
  }

  function formatDate(value) {
    if (!value) return "--";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short"
    });
  }

  function capitalize(str = "") {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

})();