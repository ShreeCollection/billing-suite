/* =========================================
   SHREEHUB BUSINESS SUITE
   SETTINGS MODULE
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  initSettingsModule();
});

/* =========================
   INIT
========================= */

function initSettingsModule() {
  loadSettingsData();
  bindSettingsEvents();
}

/* =========================
   EVENTS
========================= */

function bindSettingsEvents() {
  document
    .getElementById("saveSettingsBtn")
    ?.addEventListener("click", saveSettings);

  document
    .getElementById("businessLogo")
    ?.addEventListener("change", handleLogoUpload);

  document
    .getElementById("businessSignature")
    ?.addEventListener("change", handleSignatureUpload);

  document
    .getElementById("exportBackupBtn")
    ?.addEventListener("click", exportBackup);

  document
    .getElementById("importBackupInput")
    ?.addEventListener("change", importBackup);

  document
    .getElementById("resetAppBtn")
    ?.addEventListener("click", resetApplication);
}

/* =========================
   LOAD
========================= */

function loadSettingsData() {
  const business = getBusinessProfile() || {};

  setValue("businessName", business.name);
  setValue("businessGST", business.gst);
  setValue("businessPhone", business.phone);
  setValue("businessEmail", business.email);
  setValue("businessWebsite", business.website);
  setValue("businessPincode", business.pincode);
  setValue("businessCity", business.city);
  setValue("businessState", business.state);
  setValue("businessAddress", business.address);

  setValue("bankName", business.bankName);
  setValue("accountNumber", business.accountNumber);
  setValue("ifscCode", business.ifscCode);
  setValue("upiId", business.upiId);

  setValue("invoicePrefix", business.invoicePrefix || "INV");
  setValue("quotationPrefix", business.quotationPrefix || "QTN");
  setValue("receiptPrefix", business.receiptPrefix || "RCT");

  if (business.logo) {
    document.getElementById("logoPreview").src = business.logo;
  }

  if (business.signature) {
    document.getElementById("signaturePreview").src = business.signature;
  }
}

/* =========================
   SAVE
========================= */

async function saveSettings() {
  const btn = document.getElementById("saveSettingsBtn");
  const original = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Saving...
    `;

    const existing = getBusinessProfile() || {};

    const profile = {
      ...existing,

      name: getValue("businessName"),
      gst: getValue("businessGST"),
      phone: getValue("businessPhone"),
      email: getValue("businessEmail"),
      website: getValue("businessWebsite"),
      pincode: getValue("businessPincode"),
      city: getValue("businessCity"),
      state: getValue("businessState"),
      address: getValue("businessAddress"),

      bankName: getValue("bankName"),
      accountNumber: getValue("accountNumber"),
      ifscCode: getValue("ifscCode"),
      upiId: getValue("upiId"),

      invoicePrefix: getValue("invoicePrefix"),
      quotationPrefix: getValue("quotationPrefix"),
      receiptPrefix: getValue("receiptPrefix"),

      updatedAt: new Date().toISOString()
    };

    if (!validateBusinessProfile(profile)) {
      return;
    }

    saveBusinessProfile(profile);

    showToast("Settings saved successfully");

  } catch (error) {
    console.error(error);
    showToast("Failed to save settings", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

/* =========================
   UPLOADS
========================= */

async function handleLogoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const base64 = await fileToBase64(file);

    document.getElementById("logoPreview").src = base64;

    const profile = getBusinessProfile() || {};
    profile.logo = base64;

    saveBusinessProfile(profile);

    showToast("Logo updated");
  } catch (error) {
    showToast("Logo upload failed", "error");
  }
}

async function handleSignatureUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const base64 = await fileToBase64(file);

    document.getElementById("signaturePreview").src = base64;

    const profile = getBusinessProfile() || {};
    profile.signature = base64;

    saveBusinessProfile(profile);

    showToast("Signature updated");
  } catch (error) {
    showToast("Signature upload failed", "error");
  }
}

/* =========================
   BACKUP
========================= */

function exportBackup() {
  try {
    const backup = {
      business: getBusinessProfile(),
      customers: loadFromStorage(SHREEHUB_KEYS.CUSTOMERS, []),
      products: loadFromStorage(SHREEHUB_KEYS.PRODUCTS, []),
      documents: loadFromStorage(SHREEHUB_KEYS.DOCUMENTS, []),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "shreehub-business-backup.json";
    a.click();

    URL.revokeObjectURL(url);

    showToast("Backup exported");
  } catch (error) {
    console.error(error);
    showToast("Backup export failed", "error");
  }
}

function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    try {
      const backup = JSON.parse(e.target.result);

      if (backup.business) {
        saveBusinessProfile(backup.business);
      }

      if (backup.customers) {
        saveToStorage(SHREEHUB_KEYS.CUSTOMERS, backup.customers);
      }

      if (backup.products) {
        saveToStorage(SHREEHUB_KEYS.PRODUCTS, backup.products);
      }

      if (backup.documents) {
        saveToStorage(SHREEHUB_KEYS.DOCUMENTS, backup.documents);
      }

      loadSettingsData();

      showToast("Backup restored successfully");

    } catch (error) {
      console.error(error);
      showToast("Invalid backup file", "error");
    }
  };

  reader.readAsText(file);
}

/* =========================
   RESET
========================= */

function resetApplication() {
  const confirmed = confirm(
    "This will permanently erase all local business data. Continue?"
  );

  if (!confirmed) return;

  localStorage.clear();

  showToast("Application reset complete");

  setTimeout(() => {
    location.reload();
  }, 1200);
}

/* =========================
   HELPERS
========================= */

function getValue(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.value = value || "";
  }
}