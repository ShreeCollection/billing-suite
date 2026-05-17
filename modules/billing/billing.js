/* =========================================
   SHREEHUB BUSINESS SUITE
   modules/billing/billing.js
========================================= */

(() => {
  "use strict";

  /* =========================
     STORAGE KEYS
  ========================= */
  const KEYS = {
  BUSINESS: "shreehub_business_profile",
  CUSTOMERS: "shreehub_customers",
  PRODUCTS: "shreehub_products",
  DOCUMENTS: "shreehub_documents",
  SELECTED_CUSTOMER: "shreehub_selected_customer",
  SELECTED_PRODUCT: "shreehub_selected_product",

  EDIT_DOCUMENT: "shreehub_edit_document",
  DUPLICATE_DOCUMENT: "shreehub_duplicate_document",

  PRINT_DOCUMENT: "shreehub_print_document",
  EXPORT_DOCUMENT: "shreehub_export_document"
  };

  /* =========================
     STATE
  ========================= */
  let currentTotals = {
    subtotal: 0,
    tax1: 0,
    tax2: 0,
    discount: 0,
    shipping: 0,
    roundOff: 0,
    grandTotal: 0
  };

  /* =========================
     INIT
  ========================= */
  document.addEventListener("DOMContentLoaded", initBilling);

function initBilling() {
  initializeDefaults();
  bindEvents();
  loadBusinessProfile();

  const workflowLoaded = loadDocumentWorkflow();

  if (!workflowLoaded) {
    ensureAtLeastOneItem();
    loadSelectedCustomer();
    loadSelectedProduct();
  }

  syncAllPreview();
  calculateTotals();
}

  /* =========================
     STORAGE HELPERS
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

  /* =========================
     DOM HELPERS
  ========================= */
  function $(id) {
    return document.getElementById(id);
  }

  function getValue(id) {
    return $(id)?.value?.trim() || "";
  }

  function setValue(id, value) {
    const el = $(id);
    if (el) el.value = value || "";
  }

  function toast(message, type = "success") {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`[${type}] ${message}`);
    }
  }

  /* =========================
     DEFAULTS
  ========================= */
  function initializeDefaults() {
    const dateInput = $("docDate");

    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split("T")[0];
    }

    const currentType = getValue("documentType") || "invoice";

    const prefixes = {
      invoice: "INV",
      quotation: "QTN",
      receipt: "RCPT",
      proforma: "PRO",
      challan: "CHL",
      po: "PO",
      credit: "CN",
      debit: "DN"
    };

    const expectedPrefix = prefixes[currentType] || "DOC";
    const currentStored = sessionStorage.getItem("current_doc_number");

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayKey = `${yyyy}${mm}${dd}`;

    if (
      !currentStored ||
      !currentStored.includes(todayKey) ||
      !currentStored.startsWith(expectedPrefix + "-")
    ) {
      const docNo = generateDocumentNumber(currentType);
      sessionStorage.setItem("current_doc_number", docNo);
    } else {
      setValue("docNumber", currentStored);
    }

    updateDocumentTemplate();
    updateTaxLabels();
  }

  function generateDocumentNumber(docType = "invoice") {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const dateKey = `${yyyy}${mm}${dd}`;

    const prefixes = {
      invoice: "INV",
      quotation: "QTN",
      receipt: "RCPT",
      proforma: "PRO",
      challan: "CHL",
      po: "PO",
      credit: "CN",
      debit: "DN"
    };

    const prefix = prefixes[docType] || "DOC";
    const counterKey = `shreehub_doc_counter_${prefix}_${dateKey}`;

    let counter = parseInt(localStorage.getItem(counterKey) || "0", 10);
    counter += 1;

    localStorage.setItem(counterKey, counter);

    const serial = String(counter).padStart(4, "0");
    const docNumber = `${prefix}-${dateKey}-${serial}`;

    setValue("docNumber", docNumber);

    return docNumber;
  }

  /* =========================
     EVENTS
  ========================= */
  function bindEvents() {
    const watchedInputs = [
      "docNumber",
      "docDate",
      "documentType",
      "taxMode",
      "customerName",
      "customerGST",
      "customerPhone",
      "customerEmail",
      "customerAddress",
      "bankName",
      "accountNumber",
      "ifscCode",
      "upiId",
      "terms",
      "discount",
      "shipping",
      "roundOff"
    ];

    watchedInputs.forEach(id => {
      const el = $(id);
      if (!el) return;

      el.addEventListener("input", handleLiveUpdate);
      el.addEventListener("change", handleLiveUpdate);
    });

    $("addItemBtn")?.addEventListener("click", addItemRow);
    $("resetBillingBtn")?.addEventListener("click", resetBilling);
    $("saveDraftBtn")?.addEventListener("click", () => saveDocument("draft"));

    bindExistingRows();
  }

  function handleLiveUpdate(e) {
    if (e.target.id === "documentType") {
      updateDocumentTemplate();

      const newDoc = generateDocumentNumber(e.target.value);
      sessionStorage.setItem("current_doc_number", newDoc);
    }

    if (e.target.id === "taxMode") {
      updateTaxLabels();
    }

    syncAllPreview();
    calculateTotals();
  }

  /* =========================
     BUSINESS PROFILE
  ========================= */
  function loadBusinessProfile() {
    const business = getStorage(KEYS.BUSINESS, {});

    $("previewBusinessName").textContent =
      business.name || "ShreeHub Business";

    $("previewBusinessAddress").textContent =
      business.address || "Business Address";

    $("previewBusinessGST").textContent =
      business.gst || "--";

    $("previewBusinessPhone").textContent =
      business.phone || "--";

    $("previewBusinessEmail").textContent =
      business.email || "--";

    if (business.bankName) setValue("bankName", business.bankName);
    if (business.accountNumber) setValue("accountNumber", business.accountNumber);
    if (business.ifscCode) setValue("ifscCode", business.ifscCode);
    if (business.upiId) setValue("upiId", business.upiId);

    const logo = $("previewBusinessLogo");
    const logoWrap = $("businessLogoWrap");

    if (logo && logoWrap) {
      if (business.logo?.trim()) {
        logo.src = business.logo;
        logo.style.display = "block";
        logoWrap.classList.remove("hidden");
      } else {
        logo.removeAttribute("src");
        logo.style.display = "none";
        logoWrap.classList.add("hidden");
      }
    }

    const signature = $("previewSignature");
    const signatureWrap = $("signatureWrap");

    if (signature && signatureWrap) {
      if (business.signature?.trim()) {
        signature.src = business.signature;
        signature.style.display = "block";
        signatureWrap.classList.remove("hidden");
      } else {
        signature.removeAttribute("src");
        signature.style.display = "none";
        signatureWrap.classList.add("hidden");
      }
    }

    const qrBox = $("qrBox");

    if (qrBox) {
      if (business.qr?.trim()) {
        qrBox.classList.remove("hidden");
      } else {
        qrBox.classList.add("hidden");
      }
    }
  }

  /* =========================
     CUSTOMER
  ========================= */
  function loadSelectedCustomer() {
    const customer = getStorage(KEYS.SELECTED_CUSTOMER);

    if (!customer) return;

    setValue("customerName", customer.name);
    setValue("customerGST", customer.gst);
    setValue("customerPhone", customer.phone);
    setValue("customerEmail", customer.email);
    setValue("customerAddress", customer.address);

    removeStorage(KEYS.SELECTED_CUSTOMER);
  }

  /* =========================
     PRODUCTS
  ========================= */
  function loadSelectedProduct() {
    const product = getStorage(KEYS.SELECTED_PRODUCT);

    if (!product) return;

    const firstRow = document.querySelector(".item-row");

    if (firstRow) {
      firstRow.querySelector(".item-desc").value = product.name || "";
      firstRow.querySelector(".item-hsn").value = product.hsn || "";
      firstRow.querySelector(".item-qty").value = 1;
      firstRow.querySelector(".item-rate").value = product.price || 0;
      firstRow.querySelector(".item-gst").value = product.gst || 18;
    }

    removeStorage(KEYS.SELECTED_PRODUCT);
  }

  /* =========================
   DOCUMENT WORKFLOW
========================= */
function loadDocumentWorkflow() {
  const editDoc = getStorage(KEYS.EDIT_DOCUMENT);
  const duplicateDoc = getStorage(KEYS.DUPLICATE_DOCUMENT);
  const printDoc = getStorage(KEYS.PRINT_DOCUMENT);
  const exportDoc = getStorage(KEYS.EXPORT_DOCUMENT);

  if (editDoc) {
    populateDocument(editDoc, false);
    return true;
  }

  if (duplicateDoc) {
    populateDocument(duplicateDoc, true);
    removeStorage(KEYS.DUPLICATE_DOCUMENT);
    return true;
  }

  if (printDoc) {
    populateDocument(printDoc, false);
    removeStorage(KEYS.PRINT_DOCUMENT);

    setTimeout(() => {
      $("printBtn")?.click();
    }, 800);

    return true;
  }

  if (exportDoc) {
    populateDocument(exportDoc, false);
    removeStorage(KEYS.EXPORT_DOCUMENT);

    setTimeout(() => {
      $("pdfBtn")?.click();
    }, 1000);

    return true;
  }

  return false;
}

function detectTaxMode(doc) {
  const tax1 = Number(doc?.totals?.tax1 || 0);
  const tax2 = Number(doc?.totals?.tax2 || 0);

  if (tax1 > 0 && tax2 > 0) {
    setValue("taxMode", "cgst");
  } else if (tax1 > 0 && tax2 === 0) {
    setValue("taxMode", "igst");
  } else {
    setValue("taxMode", "none");
  }
}

function populateDocument(doc, generateNewNumber = false) {
  if (!doc) return;

  setValue("documentType", doc.type || "invoice");

  if (generateNewNumber) {
    const newDoc = generateDocumentNumber(doc.type || "invoice");
    sessionStorage.setItem("current_doc_number", newDoc);

    const today = new Date().toISOString().split("T")[0];
    setValue("docDate", today);
  } else {
    setValue("docNumber", doc.number || "");
    setValue("docDate", doc.date || "");

    sessionStorage.setItem(
      "current_doc_number",
      doc.number || ""
    );
  }

  /* CUSTOMER */
  setValue("customerName", doc.customer?.name || "");
  setValue("customerGST", doc.customer?.gst || "");
  setValue("customerPhone", doc.customer?.phone || "");
  setValue("customerEmail", doc.customer?.email || "");
  setValue("customerAddress", doc.customer?.address || "");

  /* PAYMENT */
  setValue("bankName", doc.payment?.bankName || "");
  setValue("accountNumber", doc.payment?.accountNumber || "");
  setValue("ifscCode", doc.payment?.ifscCode || "");
  setValue("upiId", doc.payment?.upiId || "");

  /* NOTES */
  setValue("terms", doc.notes || "");

  /* TOTAL SETTINGS */
  setValue("discount", doc.totals?.discount || 0);
  setValue("shipping", doc.totals?.shipping || 0);
  setValue("roundOff", doc.totals?.roundOff || 0);

  detectTaxMode(doc);

  /* ITEMS */
  rebuildItems(doc.items || []);

  updateDocumentTemplate();
  updateTaxLabels();
}

  /* =========================
     TEMPLATE
  ========================= */
  function updateDocumentTemplate() {
    const type = getValue("documentType") || "invoice";

    const configs = {
      invoice: ["TAX INVOICE", "BILL TO", "doc-invoice"],
      quotation: ["QUOTATION", "QUOTATION FOR", "doc-quotation"],
      receipt: ["PAYMENT RECEIPT", "RECEIVED FROM", "doc-receipt"],
      proforma: ["PROFORMA INVOICE", "BILL TO", "doc-proforma"],
      challan: ["DELIVERY CHALLAN", "DELIVER TO", "doc-challan"],
      po: ["PURCHASE ORDER", "SUPPLIER", "doc-po"],
      credit: ["CREDIT NOTE", "CUSTOMER", "doc-credit"],
      debit: ["DEBIT NOTE", "CUSTOMER", "doc-debit"]
    };

    const config = configs[type] || configs.invoice;

    $("previewDocumentTitle").textContent = config[0];
    $("customerBlockTitle").textContent = config[1];

    const preview = $("invoicePreview");
    if (preview) {
      preview.className = `invoice-sheet ${config[2]}`;
    }
  }

  function updateTaxLabels() {
    const mode = getValue("taxMode") || "cgst";

    if (mode === "igst") {
      $("previewTaxLabel1").textContent = "IGST";
      $("previewTaxLabel2").textContent = "";
      $("previewTaxMode").textContent = "IGST";
    } else if (mode === "none") {
      $("previewTaxLabel1").textContent = "Tax";
      $("previewTaxLabel2").textContent = "";
      $("previewTaxMode").textContent = "No Tax";
    } else {
      $("previewTaxLabel1").textContent = "CGST";
      $("previewTaxLabel2").textContent = "SGST";
      $("previewTaxMode").textContent = "CGST + SGST";
    }
  }
  /* =========================
     PREVIEW SYNC
  ========================= */
  function syncAllPreview() {
    syncDocumentMeta();
    syncCustomerPreview();
    syncPaymentPreview();
    syncNotesPreview();
    renderPreviewItems();
  }

  function syncDocumentMeta() {
    $("previewDocNumber").textContent = getValue("docNumber") || "--";
    $("previewDocDate").textContent = formatDate(getValue("docDate"));
  }

  function syncCustomerPreview() {
    $("previewCustomerName").textContent =
      getValue("customerName") || "Customer Name";

    $("previewCustomerGST").textContent =
      getValue("customerGST") || "--";

    $("previewCustomerPhone").textContent =
      getValue("customerPhone") || "--";

    $("previewCustomerEmail").textContent =
      getValue("customerEmail") || "--";

    $("previewCustomerAddress").textContent =
      getValue("customerAddress") || "Customer Address";
  }

  function syncPaymentPreview() {
    $("previewBankName").textContent =
      getValue("bankName") || "--";

    $("previewAccountNumber").textContent =
      getValue("accountNumber") || "--";

    $("previewIFSC").textContent =
      getValue("ifscCode") || "--";

    $("previewUPI").textContent =
      getValue("upiId") || "--";
  }

  function syncNotesPreview() {
    $("previewTerms").textContent =
      getValue("terms") || "Thank you for doing business with us.";
  }

  /* =========================
     ITEMS
  ========================= */
  function ensureAtLeastOneItem() {
  const rows = document.querySelectorAll(".item-row");

  if (!rows.length) {
    addItemRow();
  }
}

function bindExistingRows() {
  document.querySelectorAll(".item-row").forEach(bindItemRow);
}

function addItemRow() {
  const container = $("itemsContainer");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "item-row";

  row.innerHTML = `
    <input type="text" placeholder="Product / Service Description" class="item-desc" />
    <input type="text" placeholder="HSN / SAC Code" class="item-hsn" />
    <input type="number" placeholder="Quantity" class="item-qty" value="1" min="1" />
    <input type="number" placeholder="Rate (₹)" class="item-rate" value="0" min="0" />
    <input type="number" placeholder="GST %" class="item-gst" value="18" min="0" />

    <button type="button" class="remove-item-btn">
      Remove Item
    </button>
  `;

  container.appendChild(row);

  bindItemRow(row);

  syncAllPreview();
  calculateTotals();
}

function bindItemRow(row) {
  row.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      syncAllPreview();
      calculateTotals();
    });
  });

  row.querySelector(".remove-item-btn")?.addEventListener("click", () => {
    if (document.querySelectorAll(".item-row").length <= 1) return;

    row.remove();

    syncAllPreview();
    calculateTotals();
  });
}

function rebuildItems(items = []) {
  const container = $("itemsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!items.length) {
    addItemRow();
    return;
  }

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "item-row";

    row.innerHTML = `
      <input type="text" placeholder="Product / Service Description" class="item-desc" />
      <input type="text" placeholder="HSN / SAC Code" class="item-hsn" />
      <input type="number" placeholder="Quantity" class="item-qty" value="1" min="1" />
      <input type="number" placeholder="Rate (₹)" class="item-rate" value="0" min="0" />
      <input type="number" placeholder="GST %" class="item-gst" value="18" min="0" />

      <button type="button" class="remove-item-btn">
        Remove Item
      </button>
    `;

    container.appendChild(row);

    row.querySelector(".item-desc").value =
      item.description || "";

    row.querySelector(".item-hsn").value =
      item.hsn || "";

    row.querySelector(".item-qty").value =
      item.qty || 1;

    row.querySelector(".item-rate").value =
      item.rate || 0;

    row.querySelector(".item-gst").value =
      item.gst || 0;

    bindItemRow(row);
  });

  syncAllPreview();
  calculateTotals();
}

function getItemRows() {
  return [...document.querySelectorAll(".item-row")];
}

function collectItems() {
  return getItemRows()
    .map(row => ({
      description:
        row.querySelector(".item-desc")?.value.trim() || "",

      hsn:
        row.querySelector(".item-hsn")?.value.trim() || "",

      qty:
        Number(row.querySelector(".item-qty")?.value || 0),

      rate:
        Number(row.querySelector(".item-rate")?.value || 0),

      gst:
        Number(row.querySelector(".item-gst")?.value || 0)
    }))
    .filter(item =>
      item.description !== "" ||
      item.hsn !== "" ||
      item.rate > 0
    );
}

function renderPreviewItems() {
  const tbody = $("previewItemsBody");
  if (!tbody) return;

  const items = collectItems();

  tbody.innerHTML = "";

  items.forEach((item, index) => {
    const total =
      item.qty * item.rate * (1 + item.gst / 100);

    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.description || "Item")}</td>
        <td>${escapeHtml(item.hsn || "--")}</td>
        <td>${item.qty}</td>
        <td>${formatCurrency(item.rate)}</td>
        <td>${item.gst}%</td>
        <td>${formatCurrency(total)}</td>
      </tr>
    `;
  });
}

  /* =========================
     CALCULATIONS
  ========================= */
  function calculateTotals() {
    const items = collectItems();

    let subtotal = 0;
    let taxTotal = 0;

    items.forEach(item => {
      const line = item.qty * item.rate;
      const tax = (line * item.gst) / 100;

      subtotal += line;
      taxTotal += tax;
    });

    const discount = Number(getValue("discount") || 0);
    const shipping = Number(getValue("shipping") || 0);
    const roundOff = Number(getValue("roundOff") || 0);

    const taxMode = getValue("taxMode") || "cgst";

    let tax1 = 0;
    let tax2 = 0;

    if (taxMode === "igst") {
      tax1 = taxTotal;
    } else if (taxMode === "none") {
      tax1 = 0;
      tax2 = 0;
    } else {
      tax1 = taxTotal / 2;
      tax2 = taxTotal / 2;
    }

    const grandTotal =
      subtotal +
      tax1 +
      tax2 +
      shipping -
      discount +
      roundOff;

    currentTotals = {
      subtotal,
      tax1,
      tax2,
      discount,
      shipping,
      roundOff,
      grandTotal
    };

    updateTotalsPreview();
  }

  function updateTotalsPreview() {
    $("previewSubtotal").textContent =
      formatCurrency(currentTotals.subtotal);

    $("previewTaxValue1").textContent =
      formatCurrency(currentTotals.tax1);

    const taxRow2 =
      $("previewTaxValue2")?.closest("tr");

    if (currentTotals.tax2 > 0) {
      $("previewTaxValue2").textContent =
        formatCurrency(currentTotals.tax2);

      if (taxRow2) taxRow2.style.display = "";
    } else {
      $("previewTaxValue2").textContent = "";

      if (taxRow2) taxRow2.style.display = "none";
    }

    $("previewDiscount").textContent =
      formatCurrency(currentTotals.discount);

    $("previewShipping").textContent =
      formatCurrency(currentTotals.shipping);

    $("previewGrandTotal").textContent =
      formatCurrency(currentTotals.grandTotal);

    $("previewAmountWords").textContent =
      numberToWords(Math.round(currentTotals.grandTotal)) +
      " Rupees Only";
  }

  /* =========================
     DOCUMENT HISTORY
  ========================= */
  function saveDocument(status = "draft") {
    const documents = getStorage(KEYS.DOCUMENTS, []);

    const doc = {
      id: getStorage(KEYS.EDIT_DOCUMENT)?.id ||
      "DOC-" + Date.now(),
      type: getValue("documentType"),
      number: getValue("docNumber"),
      date: getValue("docDate"),
      customer: {
        name: getValue("customerName"),
        gst: getValue("customerGST"),
        phone: getValue("customerPhone"),
        email: getValue("customerEmail"),
        address: getValue("customerAddress")
      },
      payment: {
        bankName: getValue("bankName"),
        accountNumber: getValue("accountNumber"),
        ifscCode: getValue("ifscCode"),
        upiId: getValue("upiId")
      },
     
      items: collectItems(),

      totals: currentTotals,
      notes: getValue("terms"),
      status,
      createdAt:
      getStorage(KEYS.EDIT_DOCUMENT)?.createdAt ||
      new Date().toISOString()
    };

const existingIndex = documents.findIndex(
  d => d.id === doc.id
);

if (existingIndex >= 0) {
  documents[existingIndex] = doc;
} else {
  documents.unshift(doc);
}

    setStorage(KEYS.DOCUMENTS, documents);
    removeStorage(KEYS.EDIT_DOCUMENT);

    sessionStorage.removeItem("current_doc_number");

    toast(`Document saved (${status})`);
  }

  /* =========================
     RESET
  ========================= */
  function resetBilling() {
    if (!confirm("Reset billing form?")) return;

    sessionStorage.removeItem("current_doc_number");

    location.reload();
  }

  /* =========================
     HELPERS
  ========================= */
  function formatCurrency(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
  }

  function formatDate(value) {
    if (!value) return "--";

    const date = new Date(value);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function escapeHtml(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function numberToWords(num) {
    const ones = [
      "", "One", "Two", "Three", "Four", "Five",
      "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen",
      "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];

    const tens = [
      "", "", "Twenty", "Thirty", "Forty",
      "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    if (num === 0) return "Zero";

    if (num < 20) return ones[num];

    if (num < 100) {
      return tens[Math.floor(num / 10)] + " " + ones[num % 10];
    }

    if (num < 1000) {
      return (
        ones[Math.floor(num / 100)] +
        " Hundred " +
        numberToWords(num % 100)
      );
    }

    if (num < 100000) {
      return (
        numberToWords(Math.floor(num / 1000)) +
        " Thousand " +
        numberToWords(num % 1000)
      );
    }

    if (num < 10000000) {
      return (
        numberToWords(Math.floor(num / 100000)) +
        " Lakh " +
        numberToWords(num % 100000)
      );
    }

    return String(num);
  }

  /* =========================
     GLOBAL EXPORTS
  ========================= */
  window.saveBillingDocument = saveDocument;
  window.syncAllPreview = syncAllPreview;
  window.calculateTotals = calculateTotals;
})();