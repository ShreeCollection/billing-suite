/* =========================================
   SHREEHUB BUSINESS SUITE
   DOCUMENTS MODULE
========================================= */

(() => {
  "use strict";

  const KEYS = {
    DOCUMENTS: "shreehub_documents",
    BUSINESS: "shreehub_business_profile",

    EDIT_DOCUMENT: "shreehub_edit_document",
    DUPLICATE_DOCUMENT: "shreehub_duplicate_document",
    PRINT_DOCUMENT: "shreehub_print_document",
    EXPORT_DOCUMENT: "shreehub_export_document"
  };

  let documents = [];
  let filteredDocuments = [];
  let activeDocument = null;

  document.addEventListener("DOMContentLoaded", initDocuments);

  /* =========================
     INIT
  ========================= */

  function initDocuments() {
    loadDocuments();
    bindEvents();
    renderDashboard();
  }

  /* =========================
     STORAGE
  ========================= */

  function getStorage(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function removeStorage(key) {
    localStorage.removeItem(key);
  }

  function loadDocuments() {
    documents = getStorage(KEYS.DOCUMENTS, []);
    filteredDocuments = [...documents];
  }

  function saveDocuments() {
    setStorage(KEYS.DOCUMENTS, documents);
  }

  /* =========================
     EVENTS
  ========================= */

  function bindEvents() {
    $("searchInput")?.addEventListener("input", applyFilters);
    $("typeFilter")?.addEventListener("change", applyFilters);
    $("statusFilter")?.addEventListener("change", applyFilters);
    $("dateFilter")?.addEventListener("change", applyFilters);

    $("clearFiltersBtn")?.addEventListener("click", clearFilters);
    $("clearAllDocsBtn")?.addEventListener("click", clearAllDocuments);

    $("closeModalBtn")?.addEventListener("click", closeModal);
    $("modalPrintBtn")?.addEventListener("click", printModalInvoice);
    $("modalPdfBtn")?.addEventListener("click", exportModalPdf);

    document
      .querySelector(".modal-overlay")
      ?.addEventListener("click", closeModal);
  }

  /* =========================
     FILTERS
  ========================= */

  function applyFilters() {
    const search =
      $("searchInput")?.value?.toLowerCase()?.trim() || "";

    const type =
      $("typeFilter")?.value || "";

    const status =
      $("statusFilter")?.value || "";

    const date =
      $("dateFilter")?.value || "";

    filteredDocuments = documents.filter(doc => {
      const matchSearch =
        !search ||
        (doc.number || "").toLowerCase().includes(search) ||
        (doc.customer?.name || "").toLowerCase().includes(search);

      const matchType =
        !type || doc.type === type;

      const matchStatus =
        !status || doc.status === status;

      const matchDate =
        !date || (doc.date || "").startsWith(date);

      return (
        matchSearch &&
        matchType &&
        matchStatus &&
        matchDate
      );
    });

    renderTable();
  }

  function clearFilters() {
    setValue("searchInput", "");
    setValue("typeFilter", "");
    setValue("statusFilter", "");
    setValue("dateFilter", "");

    filteredDocuments = [...documents];
    renderDashboard();
  }

  /* =========================
     DASHBOARD
  ========================= */

  function renderDashboard() {
    renderStats();
    renderTable();
  }

  function renderStats() {
    const totalDocs = documents.length;

    const totalRevenue = documents.reduce((sum, doc) => {
      return sum + Number(doc.totals?.grandTotal || 0);
    }, 0);

    const printed = documents.filter(
      d => d.status === "printed"
    ).length;

    const exported = documents.filter(
      d => d.status === "exported"
    ).length;

    setText("totalDocsCount", totalDocs);
    setText("totalRevenue", formatCurrency(totalRevenue));
    setText("printedDocsCount", printed);
    setText("exportedDocsCount", exported);
  }

  /* =========================
     TABLE
  ========================= */

  function renderTable() {
    const tbody = $("documentsTableBody");
    const empty = $("emptyState");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!filteredDocuments.length) {
      empty?.classList.remove("hidden");
      return;
    }

    empty?.classList.add("hidden");

    filteredDocuments.forEach(doc => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td><strong>${escapeHtml(doc.number || "--")}</strong></td>

        <td>
          <span class="type-badge">
            ${getTypeLabel(doc.type)}
          </span>
        </td>

        <td>${escapeHtml(doc.customer?.name || "--")}</td>

        <td>${formatDate(doc.date)}</td>

        <td>
          <span class="status-badge status-${doc.status}">
            ${capitalize(doc.status || "draft")}
          </span>
        </td>

        <td>${formatCurrency(doc.totals?.grandTotal || 0)}</td>

        <td>
          <div class="action-buttons">

            <button class="action-btn view"
              data-id="${doc.id}"
              data-action="view"
              title="View">
              <i class="fa-solid fa-eye"></i>
            </button>

            <button class="action-btn edit"
              data-id="${doc.id}"
              data-action="edit"
              title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>

            <button class="action-btn edit"
              data-id="${doc.id}"
              data-action="duplicate"
              title="Duplicate">
              <i class="fa-solid fa-copy"></i>
            </button>

            <button class="action-btn print"
              data-id="${doc.id}"
              data-action="print"
              title="Print">
              <i class="fa-solid fa-print"></i>
            </button>

            <button class="action-btn print"
              data-id="${doc.id}"
              data-action="pdf"
              title="Export PDF">
              <i class="fa-solid fa-file-pdf"></i>
            </button>

            <button class="action-btn delete"
              data-id="${doc.id}"
              data-action="delete"
              title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>

          </div>
        </td>
      `;

      tbody.appendChild(row);
    });

    bindTableActions();
  }

  function bindTableActions() {
    document.querySelectorAll(".action-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = e.currentTarget.dataset.id;
        const action = e.currentTarget.dataset.action;

        if (action === "view") viewDocument(id);
        if (action === "edit") editDocument(id);
        if (action === "duplicate") duplicateDocument(id);
        if (action === "print") printDocument(id);
        if (action === "pdf") exportDocumentPdf(id);
        if (action === "delete") deleteDocument(id);
      });
    });
  }

  function clearAllDocuments() {
  if (!confirm("Delete ALL saved documents? This cannot be undone.")) {
    return;
  }

  documents = [];
  filteredDocuments = [];

  saveDocuments();

  closeModal();
  renderDashboard();
}
  /* =========================
     MODAL PREVIEW
  ========================= */

  function viewDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    activeDocument = doc;

    renderModalInvoice(doc);

    $("documentModal")?.classList.remove("hidden");
  }

  function renderModalInvoice(doc) {
    const business = getStorage(KEYS.BUSINESS, {});

    renderBusinessInfo(business);
    renderDocumentMeta(doc);
    renderCustomerInfo(doc);
    renderPaymentInfo(doc);
    renderItems(doc);
    renderTotals(doc);
    renderNotes(doc);
    renderSignature(business);
  }
    function renderBusinessInfo(business) {
    setText("modalBusinessName", business.name || "ShreeHub Business");
    setText("modalBusinessAddress", business.address || "Business Address");
    setText("modalBusinessGST", business.gst || "--");
    setText("modalBusinessPhone", business.phone || "--");
    setText("modalBusinessEmail", business.email || "--");

    const logo = $("modalBusinessLogo");
    const wrap = $("modalLogoWrap");

    if (business.logo?.trim()) {
      logo.src = business.logo;
      wrap?.classList.remove("hidden");
    } else {
      if (logo) logo.removeAttribute("src");
      wrap?.classList.add("hidden");
    }
  }

  function renderSignature(business) {
    const signature = $("modalSignature");
    const wrap = $("modalSignatureWrap");

    if (business.signature?.trim()) {
      signature.src = business.signature;
      wrap?.classList.remove("hidden");
    } else {
      if (signature) signature.removeAttribute("src");
      wrap?.classList.add("hidden");
    }
  }

  function renderDocumentMeta(doc) {
    const configs = {
      invoice: ["TAX INVOICE", "BILL TO"],
      quotation: ["QUOTATION", "QUOTATION FOR"],
      receipt: ["PAYMENT RECEIPT", "RECEIVED FROM"],
      proforma: ["PROFORMA INVOICE", "BILL TO"],
      challan: ["DELIVERY CHALLAN", "DELIVER TO"],
      po: ["PURCHASE ORDER", "SUPPLIER"],
      credit: ["CREDIT NOTE", "CUSTOMER"],
      debit: ["DEBIT NOTE", "CUSTOMER"]
    };

    const config = configs[doc.type] || configs.invoice;

    setText("modalDocumentTitle", config[0]);
    setText("modalCustomerTitle", config[1]);
    setText("modalDocNumber", doc.number || "--");
    setText("modalDocDate", formatDate(doc.date));

    const tax1 = Number(doc.totals?.tax1 || 0);
    const tax2 = Number(doc.totals?.tax2 || 0);

    if (tax1 > 0 && tax2 > 0) {
      setText("modalTaxMode", "CGST + SGST");
      setText("modalTaxLabel1", "CGST");
      setText("modalTaxLabel2", "SGST");
      $("modalTaxRow2").style.display = "";
    } else if (tax1 > 0 && tax2 === 0) {
      setText("modalTaxMode", "IGST");
      setText("modalTaxLabel1", "IGST");
      $("modalTaxRow2").style.display = "none";
    } else {
      setText("modalTaxMode", "No Tax");
      setText("modalTaxLabel1", "Tax");
      $("modalTaxRow2").style.display = "none";
    }
  }

  function renderCustomerInfo(doc) {
    setText("modalCustomerName", doc.customer?.name || "Customer");
    setText("modalCustomerGST", doc.customer?.gst || "--");
    setText("modalCustomerPhone", doc.customer?.phone || "--");
    setText("modalCustomerEmail", doc.customer?.email || "--");
    setText("modalCustomerAddress", doc.customer?.address || "Customer Address");
  }

  function renderPaymentInfo(doc) {
    setText("modalBankName", doc.payment?.bankName || "--");
    setText("modalAccountNumber", doc.payment?.accountNumber || "--");
    setText("modalIFSC", doc.payment?.ifscCode || "--");
    setText("modalUPI", doc.payment?.upiId || "--");
  }

  function renderItems(doc) {
    const tbody = $("modalItemsBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    (doc.items || []).forEach((item, index) => {
      const total =
        Number(item.qty || 0) *
        Number(item.rate || 0) *
        (1 + Number(item.gst || 0) / 100);

      tbody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.description || "Item")}</td>
          <td>${escapeHtml(item.hsn || "--")}</td>
          <td>${item.qty || 0}</td>
          <td>${formatCurrency(item.rate || 0)}</td>
          <td>${item.gst || 0}%</td>
          <td>${formatCurrency(total)}</td>
        </tr>
      `;
    });
  }

  function renderTotals(doc) {
    const totals = doc.totals || {};

    setText("modalSubtotal", formatCurrency(totals.subtotal || 0));
    setText("modalTaxValue1", formatCurrency(totals.tax1 || 0));
    setText("modalTaxValue2", formatCurrency(totals.tax2 || 0));
    setText("modalDiscount", formatCurrency(totals.discount || 0));
    setText("modalShipping", formatCurrency(totals.shipping || 0));
    setText("modalGrandTotal", formatCurrency(totals.grandTotal || 0));
  }

  function renderNotes(doc) {
    setText(
      "modalTerms",
      doc.notes || "Thank you for doing business with us."
    );
  }

  function printModalInvoice() {
    if (!activeDocument) return;

    const content = $("modalInvoicePreview");
    if (!content) return;

    const win = window.open("", "_blank");

    win.document.write(`
      <html>
        <head>
          <title>${activeDocument.number}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: white;
              font-family: Inter, Arial, sans-serif;
            }

            .invoice-sheet {
              max-width: 1000px;
              margin: 0 auto;
              background: white;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th, td {
              padding: 10px;
              border: 1px solid #e2e8f0;
            }

            .grand-total td {
              font-weight: 800;
            }

            @page {
              size: A4 portrait;
              margin: 10mm;
            }
          </style>
        </head>
        <body>
          ${content.outerHTML}
        </body>
      </html>
    `);

    win.document.close();

    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  }

  function exportModalPdf() {
    if (!activeDocument) return;

    setStorage(KEYS.EXPORT_DOCUMENT, activeDocument);
    window.location.href = "billing.html";
  }

  function closeModal() {
    $("documentModal")?.classList.add("hidden");
    activeDocument = null;
  }

  /* =========================
     ACTIONS
  ========================= */

  function editDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    setStorage(KEYS.EDIT_DOCUMENT, doc);
    window.location.href = "billing.html";
  }

  function duplicateDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    setStorage(KEYS.DUPLICATE_DOCUMENT, doc);
    window.location.href = "billing.html";
  }

  function printDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    setStorage(KEYS.PRINT_DOCUMENT, doc);
    window.location.href = "billing.html";
  }

  function exportDocumentPdf(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    setStorage(KEYS.EXPORT_DOCUMENT, doc);
    window.location.href = "billing.html";
  }

  function deleteDocument(id) {
    if (!confirm("Delete this document?")) return;

    documents = documents.filter(d => d.id !== id);
    saveDocuments();
    filteredDocuments = [...documents];
    renderDashboard();
  }

  /* =========================
     HELPERS
  ========================= */

  function $(id) {
    return document.getElementById(id);
  }

  function setValue(id, value) {
    const el = $(id);
    if (el) el.value = value;
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function formatCurrency(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
  }

  function formatDate(value) {
    if (!value) return "--";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
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

  function getTypeLabel(type) {
    const labels = {
      invoice: "GST Invoice",
      quotation: "Quotation",
      receipt: "Receipt",
      proforma: "Proforma",
      challan: "Challan",
      po: "Purchase Order",
      credit: "Credit Note",
      debit: "Debit Note"
    };

    return labels[type] || "Document";
  }

})();