/* =========================================
   SHREEHUB BUSINESS SUITE
   BILLING TEMPLATES
========================================= */

const DOCUMENT_TYPES = {
  invoice: {
    title: "TAX INVOICE",
    cssClass: "doc-invoice",
    customerLabel: "BILL TO"
  },
  quotation: {
    title: "QUOTATION",
    cssClass: "doc-quotation",
    customerLabel: "QUOTATION FOR"
  },
  receipt: {
    title: "PAYMENT RECEIPT",
    cssClass: "doc-receipt",
    customerLabel: "RECEIVED FROM"
  },
  proforma: {
    title: "PROFORMA INVOICE",
    cssClass: "doc-proforma",
    customerLabel: "BILL TO"
  },
  challan: {
    title: "DELIVERY CHALLAN",
    cssClass: "doc-challan",
    customerLabel: "DELIVER TO"
  },
  po: {
    title: "PURCHASE ORDER",
    cssClass: "doc-po",
    customerLabel: "SUPPLIER"
  },
  credit: {
    title: "CREDIT NOTE",
    cssClass: "doc-credit",
    customerLabel: "CUSTOMER"
  },
  debit: {
    title: "DEBIT NOTE",
    cssClass: "doc-debit",
    customerLabel: "CUSTOMER"
  }
};

/* =========================
   DOCUMENT TYPE
========================= */

function getDocumentTypeConfig(type) {
  return DOCUMENT_TYPES[type] || DOCUMENT_TYPES.invoice;
}

function updateDocumentTemplate(type) {
  const config = getDocumentTypeConfig(type);

  const invoiceSheet = document.getElementById("invoicePreview");
  const titleEl = document.getElementById("previewDocumentTitle");
  const customerLabel = document.getElementById("customerBlockTitle");

  if (!invoiceSheet || !titleEl || !customerLabel) return;

  /* Remove old doc classes */
  Object.values(DOCUMENT_TYPES).forEach(doc => {
    invoiceSheet.classList.remove(doc.cssClass);
  });

  /* Apply new class */
  invoiceSheet.classList.add(config.cssClass);

  /* Update title */
  titleEl.textContent = config.title;

  /* Update customer label */
  customerLabel.textContent = config.customerLabel;

  /* Optional body marker */
  document.body.setAttribute("data-doc", type);
}

/* =========================
   TAX LABELS
========================= */

function updateTaxLabels(mode) {
  const label1 = document.getElementById("previewTaxLabel1");
  const label2 = document.getElementById("previewTaxLabel2");
  const value1 = document.getElementById("previewTaxValue1");
  const value2 = document.getElementById("previewTaxValue2");
  const taxMode = document.getElementById("previewTaxMode");

  if (!label1 || !label2 || !value1 || !value2 || !taxMode) return;

  switch (mode) {
    case "igst":
      label1.textContent = "IGST";
      label2.textContent = "";
      value2.textContent = "";
      taxMode.textContent = "IGST";
      break;

    case "none":
      label1.textContent = "Tax";
      label2.textContent = "";
      value1.textContent = "₹0";
      value2.textContent = "";
      taxMode.textContent = "No Tax";
      break;

    default:
      label1.textContent = "CGST";
      label2.textContent = "SGST";
      taxMode.textContent = "CGST + SGST";
      break;
  }
}

/* =========================
   DATE FORMAT
========================= */

function formatPreviewDate(dateValue) {
  if (!dateValue) return "--";

  const date = new Date(dateValue);

  if (isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}