const KEYS = {
  theme: "ag-theme-v2",
  cart: "ag-cart-v2",
  wishlist: "ag-wishlist-v2",
  profile: "ag-profile-v2",
  contacts: "ag-contacts-v1",
  orders: "ag-orders-v1",
  checkoutDraft: "ag-checkout-draft-v1",
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson(key, fallback) {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function emitUpdate(type) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("ag-store-update", { detail: { type } }));
}

function sanitizeQty(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(99, Math.floor(parsed)));
}

function sanitizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const clean = value.trim();
  return clean || fallback;
}

function normalizeCart(rawCart) {
  if (!Array.isArray(rawCart)) {
    return [];
  }

  const acc = new Map();
  rawCart.forEach((row) => {
    if (!row || typeof row !== "object") {
      return;
    }

    const productId = sanitizeText(row.productId);
    const variant = sanitizeText(row.variant, "Standard");
    const qty = sanitizeQty(row.qty);
    if (!productId || qty <= 0) {
      return;
    }

    const key = `${productId}::${variant}`;
    const existing = acc.get(key);
    if (existing) {
      existing.qty = Math.min(99, existing.qty + qty);
    } else {
      acc.set(key, { productId, variant, qty });
    }
  });

  return [...acc.values()];
}

function makeOrderId() {
  const time = new Date();
  const datePart = [
    time.getFullYear(),
    String(time.getMonth() + 1).padStart(2, "0"),
    String(time.getDate()).padStart(2, "0"),
  ].join("");

  let rand = "";
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    rand = array[0].toString(36).slice(0, 6).toUpperCase();
  } else {
    rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  return `AG-${datePart}-${rand}`;
}

export function getTheme() {
  if (!canUseStorage()) {
    return "dark";
  }

  const saved = window.localStorage.getItem(KEYS.theme);
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return "dark";
}

export function setTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  if (canUseStorage()) {
    window.localStorage.setItem(KEYS.theme, nextTheme);
  }

  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", nextTheme);
  }

  emitUpdate("theme");
  return nextTheme;
}

export function toggleTheme() {
  return setTheme(getTheme() === "dark" ? "light" : "dark");
}

export function getCart() {
  return normalizeCart(readJson(KEYS.cart, []));
}

function saveCart(cart) {
  writeJson(KEYS.cart, normalizeCart(cart));
  emitUpdate("cart");
}

export function addToCart(productId, variant, qty = 1) {
  const cleanProductId = sanitizeText(productId);
  const cleanVariant = sanitizeText(variant, "Standard");
  const cleanQty = sanitizeQty(qty);
  if (!cleanProductId || cleanQty <= 0) {
    return;
  }

  const cart = getCart();
  const existing = cart.find((item) => item.productId === cleanProductId && item.variant === cleanVariant);

  if (existing) {
    existing.qty = Math.min(99, existing.qty + cleanQty);
  } else {
    cart.push({ productId: cleanProductId, variant: cleanVariant, qty: cleanQty });
  }

  saveCart(cart);
}

export function updateCartItem(productId, variant, qty) {
  const cleanProductId = sanitizeText(productId);
  const cleanVariant = sanitizeText(variant, "Standard");
  const cart = getCart();
  const target = cart.find((item) => item.productId === cleanProductId && item.variant === cleanVariant);

  if (!target) {
    return;
  }

  target.qty = sanitizeQty(qty);
  const next = cart.filter((item) => item.qty > 0);
  saveCart(next);
}

export function removeFromCart(productId, variant) {
  const next = getCart().filter((item) => !(item.productId === productId && item.variant === variant));
  saveCart(next);
}

export function clearCart() {
  saveCart([]);
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + sanitizeQty(item.qty), 0);
}

export function getCartDetailed(products) {
  const productMap = new Map(products.map((product) => [product.id, product]));

  return getCart()
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        return null;
      }

      return {
        ...item,
        product,
        qty: sanitizeQty(item.qty),
        lineTotal: sanitizeQty(item.qty) * product.basePrice,
      };
    })
    .filter(Boolean);
}

export function getCartSubtotal(products) {
  return getCartDetailed(products).reduce((sum, row) => sum + row.lineTotal, 0);
}

export function getWishlist() {
  const list = readJson(KEYS.wishlist, []);
  if (!Array.isArray(list)) {
    return [];
  }

  return [...new Set(list.filter((id) => typeof id === "string" && id.trim()).map((id) => id.trim()))];
}

function saveWishlist(ids) {
  writeJson(KEYS.wishlist, ids);
  emitUpdate("wishlist");
}

export function isWishlisted(productId) {
  return getWishlist().includes(productId);
}

export function toggleWishlist(productId) {
  const list = getWishlist();
  if (list.includes(productId)) {
    saveWishlist(list.filter((id) => id !== productId));
    return false;
  }

  saveWishlist([...list, productId]);
  return true;
}

export function removeFromWishlist(productId) {
  saveWishlist(getWishlist().filter((id) => id !== productId));
}

export function getWishlistCount() {
  return getWishlist().length;
}

const defaultProfile = {
  fullName: "Aishwarya Gawali",
  email: "",
  city: "",
  role: "",
  favoriteBrew: "Matcha",
  notes: "",
};

export function getProfile() {
  const profile = readJson(KEYS.profile, defaultProfile);
  return {
    ...defaultProfile,
    ...(profile && typeof profile === "object" ? profile : {}),
  };
}

export function saveProfile(profile) {
  const next = {
    ...defaultProfile,
    ...(profile && typeof profile === "object" ? profile : {}),
  };

  writeJson(KEYS.profile, next);
  emitUpdate("profile");
  return next;
}

export function saveContactMessage(message) {
  const current = readJson(KEYS.contacts, []);
  const next = Array.isArray(current) ? current : [];
  next.unshift({
    ...message,
    id: `msg-${Date.now()}`,
    createdAt: new Date().toISOString(),
  });

  writeJson(KEYS.contacts, next.slice(0, 40));
  emitUpdate("contacts");
}

export function getOrders() {
  const orders = readJson(KEYS.orders, []);
  return Array.isArray(orders) ? orders : [];
}

export function placeOrder(orderPayload) {
  const orders = getOrders();
  const nextOrder = {
    id: makeOrderId(),
    createdAt: new Date().toISOString(),
    ...orderPayload,
  };

  writeJson(KEYS.orders, [nextOrder, ...orders].slice(0, 25));
  clearCart();
  emitUpdate("orders");
  return nextOrder;
}

const defaultDraft = {
  customer: {
    fullName: "",
    email: "",
    city: "",
    notes: "",
  },
  paymentGateway: "stripe",
  items: [],
  totals: {
    subtotal: 0,
    shipping: 0,
    total: 0,
  },
  fingerprint: "",
  createdAt: "",
};

export function getCheckoutDraft() {
  const draft = readJson(KEYS.checkoutDraft, null);
  if (!draft || typeof draft !== "object") {
    return null;
  }

  return {
    ...defaultDraft,
    ...draft,
    customer: {
      ...defaultDraft.customer,
      ...(draft.customer && typeof draft.customer === "object" ? draft.customer : {}),
    },
    totals: {
      ...defaultDraft.totals,
      ...(draft.totals && typeof draft.totals === "object" ? draft.totals : {}),
    },
    items: Array.isArray(draft.items) ? draft.items : [],
  };
}

export function saveCheckoutDraft(draftPayload) {
  const next = {
    ...defaultDraft,
    ...(draftPayload && typeof draftPayload === "object" ? draftPayload : {}),
    customer: {
      ...defaultDraft.customer,
      ...(draftPayload?.customer && typeof draftPayload.customer === "object" ? draftPayload.customer : {}),
    },
    totals: {
      ...defaultDraft.totals,
      ...(draftPayload?.totals && typeof draftPayload.totals === "object" ? draftPayload.totals : {}),
    },
    createdAt: new Date().toISOString(),
    items: Array.isArray(draftPayload?.items) ? draftPayload.items : [],
  };

  writeJson(KEYS.checkoutDraft, next);
  emitUpdate("checkout-draft");
  return next;
}

export function clearCheckoutDraft() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(KEYS.checkoutDraft);
  emitUpdate("checkout-draft");
}
