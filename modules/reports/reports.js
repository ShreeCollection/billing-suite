/* =========================================
   SHREEHUB BUSINESS SUITE
   modules/reports/reports.js
========================================= */

(() => {
  "use strict";

  const DOC_KEY = "shreehub_documents";

  let documents = [];
  let monthlyChart = null;
  let typeChart = null;

  document.addEventListener("DOMContentLoaded", initReports);

  function initReports() {
    loadDocuments();
    bindEvents();

    if (!documents.length) {
      showEmptyState();
      return;
    }

    hideEmptyState();
    renderKPIs();
    renderCharts();
    renderTopCustomers();
    renderTopProducts();
    renderRecentDocuments();
  }

  /* =========================
     STORAGE
  ========================= */
  function loadDocuments() {
    try {
      documents = JSON.parse(localStorage.getItem(DOC_KEY)) || [];
    } catch {
      documents = [];
    }
  }

  /* =========================
     EVENTS
  ========================= */
  function bindEvents() {
    document
      .getElementById("exportReportsBtn")
      ?.addEventListener("click", exportReports);
  }

  /* =========================
     UI STATE
  ========================= */
  function showEmptyState() {
    document.getElementById("reportsEmptyState")?.classList.remove("hidden");
  }

  function hideEmptyState() {
    document.getElementById("reportsEmptyState")?.classList.add("hidden");
  }

  /* =========================
     KPI
  ========================= */
  function renderKPIs() {
    const totalDocs = documents.length;

    const invoices = documents.filter(d => d.type === "invoice").length;
    const quotations = documents.filter(d => d.type === "quotation").length;
    const receipts = documents.filter(d => d.type === "receipt").length;

    const revenue = documents
      .filter(d => ["invoice", "receipt"].includes(d.type))
      .reduce((sum, d) => sum + (d.totals?.grandTotal || 0), 0);

    const gst = documents.reduce((sum, d) => {
      const tax1 = d.totals?.tax1 || 0;
      const tax2 = d.totals?.tax2 || 0;
      return sum + tax1 + tax2;
    }, 0);

    setText("kpiTotalDocs", totalDocs);
    setText("kpiInvoices", invoices);
    setText("kpiQuotations", quotations + receipts);
    setText("kpiRevenue", formatCurrency(revenue));
    setText("kpiGST", formatCurrency(gst));
  }

  /* =========================
     CHARTS
  ========================= */
  function renderCharts() {
    renderMonthlyRevenueChart();
    renderDocumentTypeChart();
  }

  function renderMonthlyRevenueChart() {
    const ctx = document.getElementById("monthlyRevenueChart");
    if (!ctx) return;

    const monthlyData = {};

    documents.forEach(doc => {
      if (!["invoice", "receipt"].includes(doc.type)) return;

      const date = new Date(doc.createdAt);
      const key = date.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit"
      });

      monthlyData[key] =
        (monthlyData[key] || 0) + (doc.totals?.grandTotal || 0);
    });

    const labels = Object.keys(monthlyData);
    const values = Object.values(monthlyData);

    if (monthlyChart) monthlyChart.destroy();

    monthlyChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Revenue",
          data: values
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  function renderDocumentTypeChart() {
    const ctx = document.getElementById("documentTypeChart");
    if (!ctx) return;

    const counts = {};

    documents.forEach(doc => {
      counts[doc.type] = (counts[doc.type] || 0) + 1;
    });

    if (typeChart) typeChart.destroy();

    typeChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(counts),
        datasets: [{
          data: Object.values(counts)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  /* =========================
     TOP CUSTOMERS
  ========================= */
  function renderTopCustomers() {
    const container = document.getElementById("topCustomersList");
    if (!container) return;

    const customerMap = {};

    documents.forEach(doc => {
      const name = doc.customer?.name || "Unknown";

      customerMap[name] =
        (customerMap[name] || 0) + (doc.totals?.grandTotal || 0);
    });

    const top = Object.entries(customerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    container.innerHTML = top.map(([name, amount]) => `
      <div class="insight-item">
        <div class="insight-left">
          <div class="insight-avatar">${getInitials(name)}</div>
          <div class="insight-meta">
            <strong>${escapeHtml(name)}</strong>
            <span>Customer</span>
          </div>
        </div>
        <div class="insight-value">${formatCurrency(amount)}</div>
      </div>
    `).join("");
  }

  /* =========================
     TOP PRODUCTS
  ========================= */
  function renderTopProducts() {
    const container = document.getElementById("topProductsList");
    if (!container) return;

    const productMap = {};

    documents.forEach(doc => {
      (doc.items || []).forEach(item => {
        const name = item.description || "Item";

        productMap[name] =
          (productMap[name] || 0) + (item.qty || 0);
      });
    });

    const top = Object.entries(productMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    container.innerHTML = top.map(([name, qty]) => `
      <div class="insight-item">
        <div class="insight-left">
          <div class="insight-avatar">P</div>
          <div class="insight-meta">
            <strong>${escapeHtml(name)}</strong>
            <span>Product</span>
          </div>
        </div>
        <div class="insight-value">${qty} sold</div>
      </div>
    `).join("");
  }

  /* =========================
     RECENT DOCS
  ========================= */
  function renderRecentDocuments() {
    const tbody = document.getElementById("recentDocumentsBody");
    if (!tbody) return;

    const recent = documents.slice(0, 10);

    tbody.innerHTML = recent.map(doc => `
      <tr>
        <td>${escapeHtml(doc.number || "--")}</td>
        <td>${escapeHtml(doc.customer?.name || "--")}</td>
        <td>${formatDate(doc.createdAt)}</td>
        <td>
          <span class="status-badge status-${doc.status}">
            ${doc.status}
          </span>
        </td>
        <td>${formatCurrency(doc.totals?.grandTotal || 0)}</td>
      </tr>
    `).join("");
  }

  /* =========================
     EXPORT
  ========================= */
  function exportReports() {
    const report = {
      exportedAt: new Date().toISOString(),
      documents
    };

    const blob = new Blob(
      [JSON.stringify(report, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "shreehub-reports.json";
    a.click();

    URL.revokeObjectURL(url);

    toast("Reports exported");
  }

  /* =========================
     HELPERS
  ========================= */
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function formatCurrency(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
  }

  function formatDate(date) {
    if (!date) return "--";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function getInitials(name = "") {
    return name
      .split(" ")
      .map(w => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

  function escapeHtml(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function toast(msg) {
    if (window.showToast) {
      window.showToast(msg);
    } else {
      alert(msg);
    }
  }

})();