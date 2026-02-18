import { products } from "./data.js";
import { getCartDetailed, getCartSubtotal, removeFromCart, updateCartItem } from "./store.js";
import { formatCurrency } from "./ui.js";

const SHIPPING = 7;

function renderCart() {
  const list = document.getElementById("cartList");
  const empty = document.getElementById("cartEmpty");
  const subtotalNode = document.getElementById("cartSubtotal");
  const shippingNode = document.getElementById("cartShipping");
  const totalNode = document.getElementById("cartTotal");
  const checkoutButton = document.getElementById("goCheckout");

  if (!list) {
    return;
  }

  const rows = getCartDetailed(products);
  list.innerHTML = "";

  const subtotal = getCartSubtotal(products);
  const shipping = rows.length ? SHIPPING : 0;
  const total = subtotal + shipping;

  if (subtotalNode) {
    subtotalNode.textContent = formatCurrency(subtotal);
  }

  if (shippingNode) {
    shippingNode.textContent = formatCurrency(shipping);
  }

  if (totalNode) {
    totalNode.textContent = formatCurrency(total);
  }

  if (!rows.length) {
    empty?.classList.remove("hidden");
    if (checkoutButton) {
      checkoutButton.disabled = true;
      checkoutButton.classList.add("is-disabled");
    }
    return;
  }

  empty?.classList.add("hidden");
  if (checkoutButton) {
    checkoutButton.disabled = false;
    checkoutButton.classList.remove("is-disabled");
  }

  rows.forEach((row) => {
    const item = document.createElement("article");
    item.className = "list-row";

    const content = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = row.product.name;

    const meta = document.createElement("p");
    meta.className = "row-meta";
    meta.textContent = `${row.variant} • ${formatCurrency(row.product.basePrice)} each`;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-secondary";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      removeFromCart(row.productId, row.variant);
      renderCart();
    });

    content.append(title, meta, remove);

    const controlsWrap = document.createElement("div");
    controlsWrap.className = "row-controls";

    const qty = document.createElement("div");
    qty.className = "qty";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", `Decrease quantity for ${row.product.name}`);
    minus.addEventListener("click", () => {
      updateCartItem(row.productId, row.variant, row.qty - 1);
      renderCart();
    });

    const qtyValue = document.createElement("span");
    qtyValue.textContent = String(row.qty);

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", `Increase quantity for ${row.product.name}`);
    plus.addEventListener("click", () => {
      updateCartItem(row.productId, row.variant, row.qty + 1);
      renderCart();
    });

    qty.append(minus, qtyValue, plus);

    const linePrice = document.createElement("strong");
    linePrice.textContent = formatCurrency(row.lineTotal);

    controlsWrap.append(qty, linePrice);

    item.append(content, controlsWrap);
    list.append(item);
  });
}

function init() {
  const checkoutButton = document.getElementById("goCheckout");
  checkoutButton?.addEventListener("click", () => {
    if (checkoutButton instanceof HTMLButtonElement && checkoutButton.disabled) {
      return;
    }
    window.location.href = "./checkout.html";
  });

  renderCart();

  window.addEventListener("ag-store-update", (event) => {
    if (["cart", "wishlist", "orders"].includes(event.detail.type)) {
      renderCart();
    }
  });
}

init();
