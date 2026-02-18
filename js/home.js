import { products } from "./data.js";
import { addToCart } from "./store.js";
import { createProductCard, initCountdown } from "./ui.js";

function renderFeatured() {
  const grid = document.getElementById("homeFeatured");
  if (!grid) {
    return;
  }

  const featured = [...products]
    .sort((a, b) => {
      if (a.limitedQty && !b.limitedQty) {
        return -1;
      }
      if (!a.limitedQty && b.limitedQty) {
        return 1;
      }
      return new Date(b.releaseDate) - new Date(a.releaseDate);
    })
    .slice(0, 6);

  grid.innerHTML = "";

  featured.forEach((product) => {
    const card = createProductCard(product, {
      onAddToCart: (item, variant) => addToCart(item.id, variant, 1),
      addButtonLabel: "Quick add",
    });
    grid.append(card);
  });
}

function initHomeCountdown() {
  initCountdown({
    days: document.getElementById("homeDays"),
    hours: document.getElementById("homeHours"),
    minutes: document.getElementById("homeMinutes"),
    seconds: document.getElementById("homeSeconds"),
  });
}

function init() {
  renderFeatured();
  initHomeCountdown();
}

init();
