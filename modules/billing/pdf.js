/* =========================================
   SHREEHUB BUSINESS SUITE
   BILLING PDF / PRINT
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  initPdfModule();
});

/* =========================
   INIT
========================= */

function initPdfModule() {
  bindPrintAction();
  bindPdfAction();
}

/* =========================
   PRINT
========================= */

function bindPrintAction() {
  const printBtn = document.getElementById("printBtn");

  if (!printBtn) return;

  printBtn.addEventListener("click", () => {
    window.syncAllPreview?.();
    window.calculateTotals?.();

    setTimeout(() => {
      const invoice = document.getElementById("invoicePreview");

      if (!invoice) {
        showToast("Invoice preview not found", "error");
        return;
      }

      const docNumber =
        document.getElementById("docNumber")?.value?.trim() || "Document";

      if (window.saveBillingDocument) {
        window.saveBillingDocument("printed");
      }

      const iframe = document.createElement("iframe");

      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;

      doc.open();
      doc.write(`
        <html>
          <head>
            <title>${docNumber}</title>

            <link rel="stylesheet" href="modules/billing/invoice.css">

            <style>
              body {
                margin: 0;
                padding: 0;
                background: white;
              }

              .invoice-sheet {
                transform: none !important;
                width: 100% !important;
                min-height: auto !important;
                margin: 0 !important;
                padding: 20px !important;
                box-shadow: none !important;
                border: none !important;
              }

              .hidden {
                display: none !important;
              }

              .invoice-company-logo.hidden,
              .signature-block.hidden,
              .qr-box.hidden {
                display: none !important;
              }

              @page {
                size: A4 portrait;
                margin: 10mm;
              }
            </style>
          </head>

          <body>
            ${invoice.outerHTML}
          </body>
        </html>
      `);

      doc.close();

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();

          setTimeout(() => {
            iframe.remove();
          }, 1000);
        }, 500);
      };

    }, 300);
  });
}

/* =========================
   PDF EXPORT
========================= */

function bindPdfAction() {
  const pdfBtn = document.getElementById("pdfBtn");

  if (!pdfBtn) return;

  pdfBtn.addEventListener("click", exportInvoicePdf);
}

async function exportInvoicePdf() {
  const preview = document.getElementById("invoicePreview");

  if (!window.html2canvas) {
    showToast("html2canvas library missing", "error");
    return;
  }

  if (!window.jspdf) {
    showToast("jsPDF library missing", "error");
    return;
  }

  if (!preview) {
    showToast("Invoice preview not found", "error");
    return;
  }

  const pdfBtn = document.getElementById("pdfBtn");
  const originalHtml = pdfBtn.innerHTML;

  try {
    setLoadingState(pdfBtn, true);

    await waitForImages(preview);

    const canvas = await html2canvas(preview, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0
    });

    const imgData = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = 210;
    const pdfHeight = 297;

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    /* SINGLE PAGE */
    if (imgHeight <= pdfHeight - 2) {
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        imgWidth,
        imgHeight
      );
    } else {
      /* MULTI PAGE */
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(
        imgData,
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );

      heightLeft -= pdfHeight;

      while (heightLeft > 5) {
        position -= pdfHeight;

        pdf.addPage();

        pdf.addImage(
          imgData,
          "PNG",
          0,
          position,
          imgWidth,
          imgHeight
        );

        heightLeft -= pdfHeight;
      }
    }

    const fileName = generatePdfFileName();

    pdf.save(fileName);

    if (window.saveBillingDocument) {
      window.saveBillingDocument("exported");
    }

    showToast("PDF exported successfully");

  } catch (error) {
    console.error(error);
    showToast("PDF export failed", "error");
  } finally {
    setLoadingState(pdfBtn, false, originalHtml);
  }
}

/* =========================
   HELPERS
========================= */

function generatePdfFileName() {
  const docNumber =
    document.getElementById("docNumber")?.value?.trim();

  if (docNumber) {
    return `${sanitizeFileName(docNumber)}.pdf`;
  }

  return "document.pdf";
}

function sanitizeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}

function setLoadingState(button, loading, originalHtml = "") {
  if (!button) return;

  if (loading) {
    button.disabled = true;
    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Exporting...
    `;
  } else {
    button.disabled = false;
    button.innerHTML = originalHtml;
  }
}

function waitForImages(container) {
  const images = container.querySelectorAll("img");

  const promises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();

    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  });

  return Promise.all(promises);
}