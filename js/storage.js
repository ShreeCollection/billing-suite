/* =========================
   SHREEHUB BUSINESS SUITE
   STORAGE
========================= */

function getBusinessProfile() {
  return loadFromStorage(SHREEHUB_KEYS.BUSINESS_PROFILE, null);
}

function saveBusinessProfile(profile) {
  return saveToStorage(SHREEHUB_KEYS.BUSINESS_PROFILE, profile);
}

function hasBusinessProfile() {
  return !!getBusinessProfile();
}

/* =========================
   BUSINESS PROFILE UI
========================= */

function updateBusinessUI() {
  const profile = getBusinessProfile();

  const nameEl = $(".business-details h4");
  const descEl = $(".business-details p");
  const logoEl = $(".business-logo img");

  if (!profile) {
    if (nameEl) nameEl.textContent = "Business Not Configured";
    if (descEl) descEl.textContent = "Add your GST/business details to start billing.";
    if (logoEl) logoEl.src = "assets/logo/logo.png";
    return;
  }

  if (nameEl) {
    nameEl.textContent = profile.name || "ShreeHub Business";
  }

  if (descEl) {
    descEl.textContent =
      profile.gst
        ? `GSTIN: ${profile.gst}`
        : "Business profile configured";
  }

  if (logoEl && profile.logo) {
    logoEl.src = profile.logo;
  }
}

/* =========================
   FORM PREFILL
========================= */

function populateBusinessForm() {
  const profile = getBusinessProfile();
  if (!profile) return;

  $("#businessName").value = profile.name || "";
  $("#businessGST").value = profile.gst || "";
  $("#businessPhone").value = profile.phone || "";
  $("#businessEmail").value = profile.email || "";
  $("#businessAddress").value = profile.address || "";
}

/* =========================
   SAVE FROM FORM
========================= */

async function saveBusinessFromForm() {
  const name = $("#businessName")?.value.trim();
  const gst = $("#businessGST")?.value.trim();
  const phone = $("#businessPhone")?.value.trim();
  const email = $("#businessEmail")?.value.trim();
  const address = $("#businessAddress")?.value.trim();

  const logoFile = $("#businessLogo")?.files?.[0];
  const signatureFile = $("#businessSignature")?.files?.[0];

  const existing = getBusinessProfile() || {};

  const profile = {
    name,
    gst,
    phone,
    email,
    address,
    logo: existing.logo || null,
    signature: existing.signature || null,
    updatedAt: new Date().toISOString()
  };

  if (!validateBusinessProfile(profile)) {
    return false;
  }

  if (logoFile) {
    profile.logo = await fileToBase64(logoFile);
  }

  if (signatureFile) {
    profile.signature = await fileToBase64(signatureFile);
  }

  saveBusinessProfile(profile);
  updateBusinessUI();

  showToast("Business profile saved successfully");

  return true;
}