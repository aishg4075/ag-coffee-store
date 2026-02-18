import { isWishlisted, toggleWishlist } from "./store.js";

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

export function nextFridayAtSevenPM() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(19, 0, 0, 0);

  const daysUntilFriday = (5 - now.getDay() + 7) % 7;
  target.setDate(now.getDate() + daysUntilFriday);

  if (target <= now) {
    target.setDate(target.getDate() + 7);
  }

  return target;
}

export function initCountdown(nodes, targetDateFactory = nextFridayAtSevenPM) {
  if (!nodes?.days || !nodes?.hours || !nodes?.minutes || !nodes?.seconds) {
    return;
  }

  let target = targetDateFactory();

  const tick = () => {
    const now = new Date();
    if (now >= target) {
      target = targetDateFactory();
    }

    const diff = target.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    nodes.days.textContent = String(days).padStart(2, "0");
    nodes.hours.textContent = String(hours).padStart(2, "0");
    nodes.minutes.textContent = String(minutes).padStart(2, "0");
    nodes.seconds.textContent = String(seconds).padStart(2, "0");
  };

  tick();
  return window.setInterval(tick, 1000);
}

let quickModal;
let quickLastFocused;

function closeQuickView() {
  if (!quickModal) {
    return;
  }

  quickModal.classList.add("hidden");
  document.body.classList.remove("modal-open");

  if (quickLastFocused instanceof HTMLElement) {
    quickLastFocused.focus();
  }
}

function ensureQuickViewModal() {
  if (quickModal) {
    return quickModal;
  }

  const container = document.createElement("div");
  container.className = "quick-modal hidden";
  container.id = "quickViewModal";
  container.innerHTML = `
    <div class="quick-modal-backdrop" data-close="true"></div>
    <article class="quick-modal-card" role="dialog" aria-modal="true" aria-labelledby="quickViewTitle" tabindex="-1">
      <button class="quick-close" type="button" data-close="true" aria-label="Close quick view">✕</button>
      <div class="quick-grid">
        <img class="quick-image" alt="" />
        <div class="quick-content">
          <p class="quick-meta"></p>
          <h3 class="quick-title" id="quickViewTitle"></h3>
          <p class="quick-description"></p>
          <p class="quick-details"></p>
          <label>
            Variant
            <select class="quick-variant"></select>
          </label>
          <div class="quick-actions">
            <button type="button" class="btn btn-primary quick-add">Add to cart</button>
            <button type="button" class="btn btn-secondary quick-wish">Wishlist</button>
          </div>
        </div>
      </div>
    </article>
  `;

  container.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.dataset.close === "true") {
      closeQuickView();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !container.classList.contains("hidden")) {
      closeQuickView();
    }
  });

  container.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") {
      return;
    }

    const focusable = [
      ...container.querySelectorAll(
        "button:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ),
    ].filter((node) => node instanceof HTMLElement && !node.classList.contains("hidden"));

    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.body.append(container);
  quickModal = container;
  return container;
}

export function openQuickView(product, handlers = {}, initialVariant = "") {
  const modal = ensureQuickViewModal();
  const image = modal.querySelector(".quick-image");
  const meta = modal.querySelector(".quick-meta");
  const title = modal.querySelector(".quick-title");
  const description = modal.querySelector(".quick-description");
  const details = modal.querySelector(".quick-details");
  const variantSelect = modal.querySelector(".quick-variant");
  const addButton = modal.querySelector(".quick-add");
  const wishButton = modal.querySelector(".quick-wish");

  if (
    !(image instanceof HTMLImageElement) ||
    !(meta instanceof HTMLElement) ||
    !(title instanceof HTMLElement) ||
    !(description instanceof HTMLElement) ||
    !(details instanceof HTMLElement) ||
    !(variantSelect instanceof HTMLSelectElement) ||
    !(addButton instanceof HTMLButtonElement) ||
    !(wishButton instanceof HTMLButtonElement)
  ) {
    return;
  }

  image.src = product.imageUrl;
  image.alt = product.alt || product.name;
  image.width = 1200;
  image.height = 900;
  image.decoding = "async";
  meta.textContent = `${product.category} • ${product.drop} • ${formatCurrency(product.basePrice)}`;
  title.textContent = product.name;
  description.textContent = product.description;
  details.textContent = product.quickDetails;

  variantSelect.innerHTML = "";
  product.variants.forEach((variant) => {
    const option = document.createElement("option");
    option.value = variant;
    option.textContent = variant;
    variantSelect.append(option);
  });

  if (initialVariant && product.variants.includes(initialVariant)) {
    variantSelect.value = initialVariant;
  }

  const refreshWishText = () => {
    wishButton.textContent = isWishlisted(product.id) ? "Wishlisted" : "Wishlist";
  };

  refreshWishText();

  addButton.onclick = () => {
    if (typeof handlers.onAddToCart === "function") {
      handlers.onAddToCart(product, variantSelect.value);
    }
    addButton.textContent = "Added";
    window.setTimeout(() => {
      addButton.textContent = "Add to cart";
    }, 700);
  };

  wishButton.onclick = () => {
    toggleWishlist(product.id);
    refreshWishText();
    if (typeof handlers.onWishlistChanged === "function") {
      handlers.onWishlistChanged(product);
    }
  };

  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");

  quickLastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const closeButton = modal.querySelector(".quick-close");
  if (closeButton instanceof HTMLButtonElement) {
    closeButton.focus();
  } else {
    const card = modal.querySelector(".quick-modal-card");
    if (card instanceof HTMLElement) {
      card.focus();
    }
  }
}

export function createProductCard(product, options = {}) {
  const {
    onAddToCart = () => {},
    onWishlistChanged = () => {},
    addButtonLabel = "Add to cart",
    showQuickView = false,
    onQuickView = () => {},
  } = options;

  const card = document.createElement("article");
  card.className = "product-card";

  const visual = document.createElement("div");
  visual.className = "product-visual";

  const image = document.createElement("img");
  image.className = "product-image";
  image.src = product.imageUrl;
  image.alt = product.alt || product.name;
  image.loading = "lazy";
  image.decoding = "async";
  image.width = 1200;
  image.height = 900;
  image.sizes = "(max-width: 780px) 100vw, (max-width: 1100px) 50vw, 33vw";
  visual.append(image);

  if (product.limitedQty > 0) {
    const badge = document.createElement("span");
    badge.className = "limit-badge";
    badge.textContent = `Only ${product.limitedQty} made`;
    visual.append(badge);
  }

  const body = document.createElement("div");
  body.className = "product-body";

  const meta = document.createElement("p");
  meta.className = "product-meta";
  meta.textContent = `${product.category} • ${product.drop}`;

  const title = document.createElement("h3");
  title.className = "product-title";
  title.textContent = product.name;

  const desc = document.createElement("p");
  desc.className = "product-desc";
  desc.textContent = product.description;

  const variantRow = document.createElement("div");
  variantRow.className = "variant-price-row";

  const variantLabel = document.createElement("label");
  variantLabel.textContent = "Variant";

  const variantSelect = document.createElement("select");
  product.variants.forEach((variant) => {
    const option = document.createElement("option");
    option.value = variant;
    option.textContent = variant;
    variantSelect.append(option);
  });

  variantLabel.append(variantSelect);

  const price = document.createElement("strong");
  price.className = "price";
  price.textContent = formatCurrency(product.basePrice);

  variantRow.append(variantLabel, price);

  const actions = document.createElement("div");
  actions.className = "product-actions";

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "btn btn-primary";
  addButton.textContent = addButtonLabel;
  addButton.addEventListener("click", () => {
    onAddToCart(product, variantSelect.value);
    const prevText = addButton.textContent;
    addButton.textContent = "Added";
    window.setTimeout(() => {
      addButton.textContent = prevText;
    }, 700);
  });

  const wishButton = document.createElement("button");
  wishButton.type = "button";
  wishButton.className = "btn btn-secondary";

  const refreshWishText = () => {
    wishButton.textContent = isWishlisted(product.id) ? "Wishlisted" : "Wishlist";
  };

  refreshWishText();

  wishButton.addEventListener("click", () => {
    toggleWishlist(product.id);
    refreshWishText();
    onWishlistChanged(product);
  });

  actions.append(addButton, wishButton);

  if (showQuickView) {
    const quickButton = document.createElement("button");
    quickButton.type = "button";
    quickButton.className = "btn btn-secondary";
    quickButton.textContent = "Quick view";
    quickButton.addEventListener("click", () => onQuickView(product, variantSelect.value));
    actions.append(quickButton);
    actions.classList.add("three-col");
  }

  body.append(meta, title, desc, variantRow, actions);
  card.append(visual, body);

  return card;
}
