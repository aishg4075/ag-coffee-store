import { getCartCount, getOrders, getProfile, getWishlistCount, saveProfile } from "./store.js";

function populateForm(form, profile) {
  form.fullName.value = profile.fullName;
  form.email.value = profile.email;
  form.city.value = profile.city;
  form.role.value = profile.role;
  form.favoriteBrew.value = profile.favoriteBrew;
  form.notes.value = profile.notes;
}

function renderStats() {
  const cartNode = document.getElementById("profileCartCount");
  const wishNode = document.getElementById("profileWishCount");
  const orderNode = document.getElementById("profileOrderCount");
  const lastOrderNode = document.getElementById("profileLastOrder");

  const orders = getOrders();

  if (cartNode) {
    cartNode.textContent = String(getCartCount());
  }

  if (wishNode) {
    wishNode.textContent = String(getWishlistCount());
  }

  if (orderNode) {
    orderNode.textContent = String(orders.length);
  }

  if (lastOrderNode) {
    const latest = orders[0];
    lastOrderNode.textContent = latest
      ? `${latest.id} • ${new Date(latest.createdAt).toLocaleDateString("en-US")}`
      : "No completed orders yet";
  }
}

function bindProfileForm() {
  const form = document.getElementById("profileForm");
  const feedback = document.getElementById("profileFeedback");

  if (!form || !feedback) {
    return;
  }

  populateForm(form, getProfile());

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const next = saveProfile({
      fullName: String(formData.get("fullName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      role: String(formData.get("role") || "").trim(),
      favoriteBrew: String(formData.get("favoriteBrew") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
    });

    feedback.textContent = `Saved profile for ${next.fullName}.`;
    renderStats();
  });
}

function init() {
  bindProfileForm();
  renderStats();

  window.addEventListener("ag-store-update", () => {
    renderStats();
  });
}

init();
