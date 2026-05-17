/* =========================================
   SHREEHUB BUSINESS SUITE
   modules/products/products.js
   SELF-CONTAINED VERSION
========================================= */

(() => {
  "use strict";

  const STORAGE_KEY = "shreehub_products";
  const SELECTED_PRODUCT_KEY = "shreehub_selected_product";

  let products = [];
  let editingProductId = null;

  document.addEventListener("DOMContentLoaded", initProducts);

  /* =========================
     INIT
  ========================= */
  function initProducts() {
    loadProducts();
    bindEvents();
    renderProducts();
  }

  /* =========================
     STORAGE
  ========================= */
  function loadProducts() {
    try {
      products = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      products = [];
    }
  }

  function saveProducts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }

  /* =========================
     EVENTS
  ========================= */
  function bindEvents() {
    bindClick("addProductBtn", openAddProductModal);
    bindClick("emptyAddProductBtn", openAddProductModal);
    bindClick("saveProductBtn", saveProduct);
    bindClick("exportProductsBtn", exportProducts);

    const search = $("productSearch");
    if (search) {
      search.addEventListener("input", handleSearch);
    }

    const importInput = $("importProductsInput");
    if (importInput) {
      importInput.addEventListener("change", importProducts);
    }

    document.querySelectorAll(".close-modal").forEach(btn => {
      btn.addEventListener("click", closeProductModal);
    });

    const modal = $("productModal");
    if (modal) {
      modal.addEventListener("click", e => {
        if (e.target.id === "productModal") {
          closeProductModal();
        }
      });
    }
  }

  function bindClick(id, handler) {
    const el = $(id);
    if (el) el.addEventListener("click", handler);
  }

  /* =========================
     MODAL
  ========================= */
  function openAddProductModal() {
    editingProductId = null;
    clearProductForm();

    setText("productModalTitle", "Add Product");

    $("productModal")?.classList.remove("hidden");
  }

  function openEditProductModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    setProductForm(product);

    setText("productModalTitle", "Edit Product");

    $("productModal")?.classList.remove("hidden");
  }

  function closeProductModal() {
    $("productModal")?.classList.add("hidden");
  }

  /* =========================
     CRUD
  ========================= */
  function saveProduct() {
    const product = getProductFormData();

    if (!product.name) {
      toast("Product name is required", "error");
      return;
    }

    if (!product.price || Number(product.price) <= 0) {
      toast("Valid price is required", "error");
      return;
    }

    if (editingProductId) {
      const index = products.findIndex(p => p.id === editingProductId);

      if (index !== -1) {
        products[index] = {
          ...products[index],
          ...product,
          updatedAt: new Date().toISOString()
        };
      }

      toast("Product updated");
    } else {
      products.unshift({
        ...product,
        id: generateProductId(),
        createdAt: new Date().toISOString()
      });

      toast("Product added");
    }

    saveProducts();
    renderProducts();
    closeProductModal();
  }

  function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;

    products = products.filter(p => p.id !== id);

    saveProducts();
    renderProducts();

    toast("Product deleted");
  }

  /* =========================
     RENDER
  ========================= */
  function renderProducts(list = products) {
    const grid = $("productsGrid");
    const empty = $("productsEmptyState");

    if (!grid || !empty) return;

    if (!list.length) {
      grid.classList.add("hidden");
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");
    grid.classList.remove("hidden");

    grid.innerHTML = list.map(productTemplate).join("");

    bindCardActions();
  }

  function productTemplate(product) {
    const icon =
      product.unit === "service"
        ? "fa-briefcase"
        : "fa-box";

    return `
      <div class="product-card">

        <div class="product-card-header">
          <div class="product-icon">
            <i class="fa-solid ${icon}"></i>
          </div>

          <div class="product-title">
            <h4>${escapeHtml(product.name)}</h4>
            <span class="product-category">
              ${escapeHtml(product.category || "General")}
            </span>
          </div>
        </div>

        <div class="product-price-box">
          <span>Price</span>
          <strong>${formatCurrency(product.price)}</strong>
        </div>

        <div class="product-badges">
          ${product.sku ? `<span class="product-badge">SKU: ${escapeHtml(product.sku)}</span>` : ""}
          ${product.hsn ? `<span class="product-badge">HSN: ${escapeHtml(product.hsn)}</span>` : ""}
          <span class="product-badge">GST: ${product.gst || 0}%</span>
          <span class="product-badge">Unit: ${escapeHtml(product.unit)}</span>
        </div>

        <div class="product-description">
          ${escapeHtml(product.description || "No description")}
        </div>

        <div class="product-actions">
          <button class="secondary-btn" data-action="use" data-id="${product.id}">
            Use in Billing
          </button>

          <button class="secondary-btn" data-action="edit" data-id="${product.id}">
            Edit
          </button>

          <button class="secondary-btn" data-action="delete" data-id="${product.id}">
            Delete
          </button>
        </div>

      </div>
    `;
  }

  function bindCardActions() {
    document.querySelectorAll("[data-action]").forEach(btn => {
      btn.onclick = () => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === "edit") openEditProductModal(id);
        if (action === "delete") deleteProduct(id);
        if (action === "use") useProductInBilling(id);
      };
    });
  }

  /* =========================
     BILLING
  ========================= */
  function useProductInBilling(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    localStorage.setItem(
      SELECTED_PRODUCT_KEY,
      JSON.stringify(product)
    );

    toast("Product ready for billing");

    setTimeout(() => {
      window.location.href = "billing.html";
    }, 500);
  }

  /* =========================
     SEARCH
  ========================= */
  function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    if (!query) {
      renderProducts();
      return;
    }

    const filtered = products.filter(product =>
      [
        product.name,
        product.sku,
        product.hsn,
        product.category,
        product.description
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );

    renderProducts(filtered);
  }

  /* =========================
     IMPORT / EXPORT
  ========================= */
  function exportProducts() {
    const blob = new Blob(
      [JSON.stringify(products, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "shreehub-products.json";
    a.click();

    URL.revokeObjectURL(url);

    toast("Products exported");
  }

  function importProducts(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);

        if (!Array.isArray(imported)) {
          throw new Error();
        }

        products = imported;
        saveProducts();
        renderProducts();

        toast("Products imported");
      } catch {
        toast("Invalid product file", "error");
      }
    };

    reader.readAsText(file);
  }

  /* =========================
     FORM
  ========================= */
  function getProductFormData() {
    return {
      name: getValue("prodName"),
      sku: getValue("prodSKU"),
      hsn: getValue("prodHSN"),
      unit: getValue("prodUnit") || "pcs",
      price: Number(getValue("prodPrice")),
      gst: Number(getValue("prodGST")) || 0,
      category: getValue("prodCategory"),
      description: getValue("prodDescription")
    };
  }

  function setProductForm(product) {
    setValue("prodName", product.name);
    setValue("prodSKU", product.sku);
    setValue("prodHSN", product.hsn);
    setValue("prodUnit", product.unit);
    setValue("prodPrice", product.price);
    setValue("prodGST", product.gst);
    setValue("prodCategory", product.category);
    setValue("prodDescription", product.description);
  }

  function clearProductForm() {
    [
      "prodName",
      "prodSKU",
      "prodHSN",
      "prodUnit",
      "prodPrice",
      "prodGST",
      "prodCategory",
      "prodDescription"
    ].forEach(id => setValue(id, ""));
  }

  /* =========================
     HELPERS
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

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function generateProductId() {
    return "PROD-" + Date.now();
  }

  function formatCurrency(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
  }

  function escapeHtml(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function toast(message, type = "success") {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      alert(message);
    }
  }

})();