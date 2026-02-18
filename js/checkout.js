import { products } from "./data.js";
import {
  clearCheckoutDraft,
  getCartDetailed,
  getCartSubtotal,
  getCheckoutDraft,
  getProfile,
  placeOrder,
  saveCheckoutDraft,
} from "./store.js";
import { formatCurrency } from "./ui.js";

const SHIPPING = 7;
const PAYMENT_LINKS = {
  stripe: "https://buy.stripe.com/test_8wM00k4R7fR4e1ifYY",
  gumroad: "https://gumroad.com/",
};

let checkoutSnapshot = {
  items: [],
  subtotal: 0,
  shipping: 0,
  total: 0,
};
let currentDraft = null;

function makeSnapshotFingerprint(snapshot = checkoutSnapshot) {
  const itemKey = snapshot.items
    .map((row) => `${row.productId}::${row.variant}::${row.qty}::${row.lineTotal}`)
    .sort()
    .join("|");
  return `${itemKey}::${snapshot.subtotal}::${snapshot.shipping}::${snapshot.total}`;
}

function setButtonLinkState(enabled) {
  const payButton = document.getElementById("payNow");
  const completeButton = document.getElementById("completePayment");

  if (payButton) {
    payButton.classList.toggle("is-disabled", !enabled);
    payButton.setAttribute("aria-disabled", String(!enabled));
    if (!enabled) {
      payButton.setAttribute("tabindex", "-1");
    } else {
      payButton.removeAttribute("tabindex");
    }
  }

  if (completeButton instanceof HTMLButtonElement) {
    completeButton.disabled = !enabled;
  }
}

function setDraftStateText(text) {
  const draftState = document.getElementById("checkoutDraftState");
  if (draftState) {
    draftState.textContent = text;
  }
}

function renderSummary() {
  const list = document.getElementById("checkoutItems");
  const empty = document.getElementById("checkoutEmpty");
  const subtotalNode = document.getElementById("checkoutSubtotal");
  const shippingNode = document.getElementById("checkoutShipping");
  const totalNode = document.getElementById("checkoutTotal");
  const submit = document.getElementById("confirmOrder");

  if (!list) {
    return;
  }

  list.innerHTML = "";
  const items = getCartDetailed(products);
  const subtotal = getCartSubtotal(products);
  const shipping = items.length ? SHIPPING : 0;
  const total = subtotal + shipping;

  checkoutSnapshot = {
    items,
    subtotal,
    shipping,
    total,
  };

  subtotalNode.textContent = formatCurrency(subtotal);
  shippingNode.textContent = formatCurrency(shipping);
  totalNode.textContent = formatCurrency(total);

  if (!items.length) {
    empty?.classList.remove("hidden");
    submit?.setAttribute("disabled", "disabled");
    setButtonLinkState(false);
    setDraftStateText("No draft saved yet.");
    return;
  }

  empty?.classList.add("hidden");
  submit?.removeAttribute("disabled");

  items.forEach((row) => {
    const entry = document.createElement("article");
    entry.className = "list-row";

    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = row.product.name;
    const meta = document.createElement("p");
    meta.className = "row-meta";
    meta.textContent = `${row.variant} • Qty ${row.qty}`;
    info.append(title, meta);

    const line = document.createElement("strong");
    line.textContent = formatCurrency(row.lineTotal);

    entry.append(info, line);
    list.append(entry);
  });

  if (!currentDraft) {
    setButtonLinkState(false);
    setDraftStateText("No draft saved yet.");
    return;
  }

  if (currentDraft.fingerprint !== makeSnapshotFingerprint()) {
    setButtonLinkState(false);
    setDraftStateText("Draft is stale because cart changed. Save payment draft again.");
    return;
  }

  setButtonLinkState(true);
  setDraftStateText('Draft ready. Complete payment, then click "I completed payment".');
}

function syncPaymentLink() {
  const gateway = document.getElementById("paymentGateway");
  const payButton = document.getElementById("payNow");

  if (!gateway || !payButton) {
    return;
  }

  const selected = gateway.value === "gumroad" ? "gumroad" : "stripe";
  payButton.href = PAYMENT_LINKS[selected];
  payButton.textContent = `Open ${selected === "stripe" ? "Stripe" : "Gumroad"} checkout`;
}

function populateForm(form, payload) {
  if (form.fullName) {
    form.fullName.value = payload.fullName || "";
  }
  if (form.email) {
    form.email.value = payload.email || "";
  }
  if (form.city) {
    form.city.value = payload.city || "";
  }
  if (form.notes) {
    form.notes.value = payload.notes || "";
  }
}

function initForm() {
  const form = document.getElementById("checkoutForm");
  const feedback = document.getElementById("checkoutFeedback");
  const gateway = document.getElementById("paymentGateway");
  const completePayment = document.getElementById("completePayment");
  const discardDraft = document.getElementById("discardDraft");
  const payNow = document.getElementById("payNow");

  if (!form || !feedback || !gateway || !payNow) {
    return;
  }

  const draft = getCheckoutDraft();
  currentDraft = draft;

  if (draft) {
    populateForm(form, draft.customer);
    gateway.value = draft.paymentGateway === "gumroad" ? "gumroad" : "stripe";
  } else {
    const profile = getProfile();
    populateForm(form, profile);
    gateway.value = "stripe";
  }

  gateway.addEventListener("change", syncPaymentLink);
  syncPaymentLink();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!checkoutSnapshot.items.length) {
      feedback.textContent = "Cart is empty. Add products before confirming checkout.";
      return;
    }

    const formData = new FormData(form);
    const draftPayload = {
      customer: {
        fullName: String(formData.get("fullName") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        city: String(formData.get("city") || "").trim(),
        notes: String(formData.get("notes") || "").trim(),
      },
      paymentGateway: gateway.value,
      items: checkoutSnapshot.items.map((row) => ({
        productId: row.productId,
        name: row.product.name,
        variant: row.variant,
        qty: row.qty,
        lineTotal: row.lineTotal,
      })),
      totals: {
        subtotal: checkoutSnapshot.subtotal,
        shipping: checkoutSnapshot.shipping,
        total: checkoutSnapshot.total,
      },
      fingerprint: makeSnapshotFingerprint(),
    };

    currentDraft = saveCheckoutDraft(draftPayload);
    feedback.textContent = 'Draft saved. Complete payment via the link, then click "I completed payment".';
    renderSummary();
  });

  payNow.addEventListener("click", (event) => {
    const disabled = payNow.getAttribute("aria-disabled") === "true";
    if (disabled) {
      event.preventDefault();
      feedback.textContent = "Save a payment draft first.";
    }
  });

  completePayment?.addEventListener("click", () => {
    if (!currentDraft) {
      feedback.textContent = "Save a payment draft first.";
      return;
    }

    if (currentDraft.fingerprint !== makeSnapshotFingerprint()) {
      feedback.textContent = "Draft no longer matches your cart. Save a fresh payment draft.";
      setButtonLinkState(false);
      setDraftStateText("Draft is stale because cart changed. Save payment draft again.");
      return;
    }

    const order = placeOrder({
      customer: currentDraft.customer,
      paymentGateway: currentDraft.paymentGateway,
      items: currentDraft.items,
      totals: currentDraft.totals,
    });
    clearCheckoutDraft();
    currentDraft = null;
    feedback.textContent = `Order ${order.id} saved locally after payment confirmation.`;
    renderSummary();
  });

  discardDraft?.addEventListener("click", () => {
    clearCheckoutDraft();
    currentDraft = null;
    feedback.textContent = "Checkout draft discarded.";
    renderSummary();
  });

  if (currentDraft) {
    setDraftStateText("Draft loaded. Verify details, complete payment, then finalize.");
  }

  renderSummary();
}

function init() {
  renderSummary();
  initForm();

  window.addEventListener("ag-store-update", (event) => {
    if (event.detail.type === "cart" || event.detail.type === "checkout-draft") {
      if (event.detail.type === "checkout-draft") {
        currentDraft = getCheckoutDraft();
      }
      renderSummary();
    }
  });
}

init();
