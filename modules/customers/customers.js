/* =========================================
   SHREEHUB BUSINESS SUITE
   modules/customers/customers.js
   SELF-CONTAINED VERSION
========================================= */

(() => {
  "use strict";

  const STORAGE_KEY = "shreehub_customers";
  const SELECTED_CUSTOMER_KEY = "shreehub_selected_customer";

  let customers = [];
  let editingCustomerId = null;

  document.addEventListener("DOMContentLoaded", initCustomers);

  /* =========================
     INIT
  ========================= */
  function initCustomers() {
    loadCustomers();
    bindEvents();
    renderCustomers();
  }

  /* =========================
     STORAGE
  ========================= */
  function loadCustomers() {
    try {
      customers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      customers = [];
    }
  }

  function saveCustomers() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  }

  /* =========================
     EVENTS
  ========================= */
  function bindEvents() {
    bindClick("addCustomerBtn", openAddCustomerModal);
    bindClick("emptyAddCustomerBtn", openAddCustomerModal);
    bindClick("saveCustomerBtn", saveCustomer);
    bindClick("exportCustomersBtn", exportCustomers);

    const search = $("customerSearch");
    if (search) {
      search.addEventListener("input", handleSearch);
    }

    const importInput = $("importCustomersInput");
    if (importInput) {
      importInput.addEventListener("change", importCustomers);
    }

    document.querySelectorAll(".close-modal").forEach(btn => {
      btn.addEventListener("click", closeCustomerModal);
    });

    const modal = $("customerModal");
    if (modal) {
      modal.addEventListener("click", e => {
        if (e.target.id === "customerModal") {
          closeCustomerModal();
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
  function openAddCustomerModal() {
    editingCustomerId = null;
    clearCustomerForm();

    setText("customerModalTitle", "Add Customer");

    $("customerModal")?.classList.remove("hidden");
  }

  function openEditCustomerModal(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    editingCustomerId = id;
    setCustomerForm(customer);

    setText("customerModalTitle", "Edit Customer");

    $("customerModal")?.classList.remove("hidden");
  }

  function closeCustomerModal() {
    $("customerModal")?.classList.add("hidden");
  }

  /* =========================
     CRUD
  ========================= */
  function saveCustomer() {
    const customer = getCustomerFormData();

    if (!customer.name) {
      toast("Customer name is required", "error");
      return;
    }

    if (editingCustomerId) {
      const index = customers.findIndex(c => c.id === editingCustomerId);

      if (index !== -1) {
        customers[index] = {
          ...customers[index],
          ...customer,
          updatedAt: new Date().toISOString()
        };
      }

      toast("Customer updated");
    } else {
      customers.unshift({
        ...customer,
        id: generateCustomerId(),
        createdAt: new Date().toISOString()
      });

      toast("Customer added");
    }

    saveCustomers();
    renderCustomers();
    closeCustomerModal();
  }

  function deleteCustomer(id) {
    if (!confirm("Delete this customer?")) return;

    customers = customers.filter(c => c.id !== id);

    saveCustomers();
    renderCustomers();

    toast("Customer deleted");
  }

  /* =========================
     RENDER
  ========================= */
  function renderCustomers(list = customers) {
    const grid = $("customersGrid");
    const empty = $("customersEmptyState");

    if (!grid || !empty) return;

    if (!list.length) {
      grid.classList.add("hidden");
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");
    grid.classList.remove("hidden");

    grid.innerHTML = list.map(customerTemplate).join("");

    bindCardActions();
  }

  function customerTemplate(customer) {
    const initials = getInitials(customer.name);
    const type = (customer.type || "Retail").toLowerCase();

    return `
      <div class="customer-card">

        <div class="customer-card-header">
          <div class="customer-avatar">${initials}</div>

          <div class="customer-title">
            <h4>${escapeHtml(customer.name)}</h4>
            <span class="customer-type ${type}">
              ${escapeHtml(customer.type || "Retail")}
            </span>
          </div>
        </div>

        <div class="customer-info">
          ${
            customer.gst
              ? `
              <div class="customer-info-row">
                <i class="fa-solid fa-receipt"></i>
                <span><strong>GST:</strong> ${escapeHtml(customer.gst)}</span>
              </div>
            `
              : ""
          }

          ${
            customer.phone
              ? `
              <div class="customer-info-row">
                <i class="fa-solid fa-phone"></i>
                <span>${escapeHtml(customer.phone)}</span>
              </div>
            `
              : ""
          }

          ${
            customer.email
              ? `
              <div class="customer-info-row">
                <i class="fa-solid fa-envelope"></i>
                <span>${escapeHtml(customer.email)}</span>
              </div>
            `
              : ""
          }

          ${
            customer.address
              ? `
              <div class="customer-info-row">
                <i class="fa-solid fa-location-dot"></i>
                <span>${escapeHtml(customer.address)}</span>
              </div>
            `
              : ""
          }
        </div>

        <div class="customer-actions">
          <button class="secondary-btn use-btn" data-action="use" data-id="${customer.id}">
            Use in Billing
          </button>

          <button class="secondary-btn edit-btn" data-action="edit" data-id="${customer.id}">
            Edit
          </button>

          <button class="secondary-btn delete-btn" data-action="delete" data-id="${customer.id}">
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

        if (action === "edit") openEditCustomerModal(id);
        if (action === "delete") deleteCustomer(id);
        if (action === "use") useCustomerInBilling(id);
      };
    });
  }

  /* =========================
     BILLING
  ========================= */
  function useCustomerInBilling(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    localStorage.setItem(
      SELECTED_CUSTOMER_KEY,
      JSON.stringify(customer)
    );

    toast("Customer ready for billing");

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
      renderCustomers();
      return;
    }

    const filtered = customers.filter(customer =>
      [
        customer.name,
        customer.gst,
        customer.phone,
        customer.email,
        customer.city,
        customer.state
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );

    renderCustomers(filtered);
  }

  /* =========================
     IMPORT / EXPORT
  ========================= */
  function exportCustomers() {
    const blob = new Blob(
      [JSON.stringify(customers, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "shreehub-customers.json";
    a.click();

    URL.revokeObjectURL(url);

    toast("Customers exported");
  }

  function importCustomers(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);

        if (!Array.isArray(imported)) {
          throw new Error();
        }

        customers = imported;
        saveCustomers();
        renderCustomers();

        toast("Customers imported");
      } catch {
        toast("Invalid customer file", "error");
      }
    };

    reader.readAsText(file);
  }

  /* =========================
     FORM
  ========================= */
  function getCustomerFormData() {
    return {
      name: getValue("custName"),
      gst: getValue("custGST"),
      phone: getValue("custPhone"),
      email: getValue("custEmail"),
      city: getValue("custCity"),
      state: getValue("custState"),
      type: getValue("custType") || "Retail",
      address: getValue("custAddress"),
      notes: getValue("custNotes")
    };
  }

  function setCustomerForm(customer) {
    setValue("custName", customer.name);
    setValue("custGST", customer.gst);
    setValue("custPhone", customer.phone);
    setValue("custEmail", customer.email);
    setValue("custCity", customer.city);
    setValue("custState", customer.state);
    setValue("custType", customer.type);
    setValue("custAddress", customer.address);
    setValue("custNotes", customer.notes);
  }

  function clearCustomerForm() {
    [
      "custName",
      "custGST",
      "custPhone",
      "custEmail",
      "custCity",
      "custState",
      "custType",
      "custAddress",
      "custNotes"
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

  function generateCustomerId() {
    return "CUST-" + Date.now();
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

  function toast(message, type = "success") {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      alert(message);
    }
  }

})();