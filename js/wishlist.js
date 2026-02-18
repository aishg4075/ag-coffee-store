import { products } from "./data.js";
import { addToCart, getWishlist, removeFromWishlist } from "./store.js";
import { createProductCard } from "./ui.js";

function renderWishlist() {
  const grid = document.getElementById("wishlistGrid");
  const empty = document.getElementById("wishlistEmpty");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";
  const wishlistIds = new Set(getWishlist());
  const items = products.filter((product) => wishlistIds.has(product.id));

  if (!items.length) {
    empty?.classList.remove("hidden");
    return;
  }

  empty?.classList.add("hidden");

  items.forEach((product) => {
    const card = createProductCard(product, {
      onAddToCart: (item, variant) => addToCart(item.id, variant, 1),
      onWishlistChanged: () => {
        renderWishlist();
      },
      addButtonLabel: "Move to cart",
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-secondary";
    removeBtn.textContent = "Remove from wishlist";
    removeBtn.addEventListener("click", () => {
      removeFromWishlist(product.id);
      renderWishlist();
    });

    const actions = card.querySelector(".product-actions");
    if (actions) {
      actions.append(removeBtn);
      actions.classList.add("single-col");
    }

    grid.append(card);
  });
}

function init() {
  renderWishlist();

  window.addEventListener("ag-store-update", (event) => {
    if (["wishlist", "cart"].includes(event.detail.type)) {
      renderWishlist();
    }
  });
}

init();
