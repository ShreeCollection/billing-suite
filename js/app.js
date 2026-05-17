/* =========================
   SHREEHUB BUSINESS SUITE
   APP
========================= */

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

/* =========================
   INIT
========================= */

function initApp() {
  bindSidebarEvents();
  bindModalEvents();
  bindBusinessEvents();
  bootstrapApp();
}

/* =========================
   BOOTSTRAP
========================= */

function bootstrapApp() {
  updateBusinessUI();

  if (!hasBusinessProfile()) {
    openModal("setupModal");
  } else {
    populateBusinessForm();
  }
}

/* =========================
   SIDEBAR
========================= */

function bindSidebarEvents() {
  $("#openSidebar")?.addEventListener("click", openSidebar);
  $("#closeSidebar")?.addEventListener("click", closeSidebar);
  $("#mobileOverlay")?.addEventListener("click", closeSidebar);
}

/* =========================
   MODALS
========================= */

function bindModalEvents() {
  $$(".close-modal").forEach(btn => {
    btn.addEventListener("click", closeAllModals);
  });

  $$(".secondary-btn").forEach(btn => {
    btn.addEventListener("click", closeAllModals);
  });

  $$(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) {
        closeAllModals();
      }
    });
  });
}

/* =========================
   BUSINESS EVENTS
========================= */

function bindBusinessEvents() {
  $("#setupBusinessBtn")?.addEventListener("click", () => {
    populateBusinessForm();
    openModal("setupModal");
  });

  $("#editBusinessBtn")?.addEventListener("click", () => {
    populateBusinessForm();
    openModal("setupModal");
  });

  const saveBtn = document.querySelector(".modal-footer .primary-btn");

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      const success = await saveBusinessFromForm();

      saveBtn.disabled = false;
      saveBtn.textContent = "Save Business Profile";

      if (success) {
        closeModal("setupModal");
      }
    });
  }
}