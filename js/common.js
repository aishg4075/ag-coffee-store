import { products } from "./data.js";
import { getCartCount, getTheme, getWishlistCount, toggleTheme } from "./store.js";

const navLinks = [
  { key: "home", label: "Home", href: "./index.html" },
  { key: "shop", label: "Shop", href: "./shop.html" },
  { key: "drops", label: "Drops", href: "./drops.html" },
  { key: "guides", label: "Brew Guides", href: "./guides.html" },
  { key: "about", label: "About", href: "./about.html" },
];

const ICONS = {
  logo: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4.5 12.75h9a3.75 3.75 0 0 0 0-7.5h-1.5" />
      <path d="M6 14.25h6.5a4 4 0 0 1 4 4V19.5H6v-5.25Z" />
      <path d="M11 4.5c.6 1.3.55 2.2-.2 3.2" />
      <path d="M14.5 4.5c.6 1.3.55 2.2-.2 3.2" />
      <path d="M18.5 8.25h1a2.5 2.5 0 0 1 0 5h-1" />
    </svg>
  `,
  wishlist: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 20.25s-6.75-4.35-8.7-8.17a4.72 4.72 0 0 1 .9-5.4 4.78 4.78 0 0 1 6.63.26L12 8.12l1.17-1.18a4.78 4.78 0 0 1 6.63-.26 4.72 4.72 0 0 1 .9 5.4C18.75 15.9 12 20.25 12 20.25Z" />
    </svg>
  `,
  cart: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6.75 7.5h10.5l-1.1 10.25H7.85L6.75 7.5Z" />
      <path d="M9.25 7.5V6.75a2.75 2.75 0 1 1 5.5 0v.75" />
      <circle cx="9.5" cy="19.75" r="1" />
      <circle cx="14.5" cy="19.75" r="1" />
    </svg>
  `,
  profile: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.25 19a7.2 7.2 0 0 1 13.5 0" />
    </svg>
  `,
  moon: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M15.5 3.75a8.4 8.4 0 1 0 4.75 15.2 8.65 8.65 0 0 1-10.2-10.2A8.3 8.3 0 0 0 15.5 3.75Z" />
    </svg>
  `,
  sun: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4.1" />
      <path d="M12 2.75v2.1M12 19.15v2.1M21.25 12h-2.1M4.85 12h-2.1M18.9 5.1l-1.5 1.5M6.6 17.4l-1.5 1.5M18.9 18.9l-1.5-1.5M6.6 6.6 5.1 5.1" />
    </svg>
  `,
};

function getNormalizedPageKey(page) {
  if (page === "contact") {
    return "about";
  }
  if (page === "checkout") {
    return "cart";
  }
  return page;
}

function renderHeader() {
  const header = document.getElementById("siteHeader");
  if (!header) {
    return;
  }

  const currentPage = getNormalizedPageKey(document.body.dataset.page || "home");

  const linkMarkup = navLinks
    .map((link) => {
      const activeClass = currentPage === link.key ? "is-active" : "";
      const ariaCurrent = currentPage === link.key ? ' aria-current="page"' : "";
      return `<a href="${link.href}" data-nav="${link.key}" class="${activeClass}"${ariaCurrent}>${link.label}</a>`;
    })
    .join("");

  header.className = "site-header";
  header.innerHTML = `
    <div class="nav-shell">
      <a class="brand" href="./index.html" aria-label="AG Brew Lab home" title="AG Brew Lab">
        <span class="brand-mark">${ICONS.logo}</span>
      </a>

      <div class="nav-center">
        <nav class="nav-links" aria-label="Primary navigation">${linkMarkup}</nav>
        <div class="search-wrap" id="globalSearchWrap">
          <label for="globalSearchInput" class="sr-only">Search products</label>
          <input id="globalSearchInput" type="search" placeholder="Search products, drops, categories" autocomplete="off" />
          <div id="globalSearchSuggestions" class="search-suggestions hidden" role="listbox" aria-label="Suggested products"></div>
        </div>
      </div>

      <div class="nav-actions">
        <a class="icon-btn ${currentPage === "wishlist" ? "is-active" : ""}" href="./wishlist.html" data-nav="wishlist" aria-label="Wishlist" title="Wishlist">
          ${ICONS.wishlist}
          <span class="count" id="navWishlistCount">0</span>
        </a>

        <a class="icon-btn ${currentPage === "cart" ? "is-active" : ""}" href="./cart.html" data-nav="cart" aria-label="Cart" title="Cart">
          ${ICONS.cart}
          <span class="count" id="navCartCount">0</span>
        </a>

        <a class="icon-btn ${currentPage === "profile" ? "is-active" : ""}" href="./profile.html" data-nav="profile" aria-label="Profile" title="Profile">
          ${ICONS.profile}
        </a>

        <button id="themeToggle" class="icon-btn" type="button" aria-label="Toggle theme" title="Toggle theme">
          <span id="themeIcon" class="icon-glyph" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  `;
}

function renderFooter() {
  const footer = document.getElementById("siteFooter");
  if (!footer) {
    return;
  }

  const year = new Date().getFullYear();
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="footer-shell">
      <p>AG Brew Lab © ${year} • Founder-led by Aishwarya Gawali</p>
      <div class="footer-links">
        <a href="./shop.html">Shop</a>
        <a href="./drops.html">Drops</a>
        <a href="./checkout.html">Checkout</a>
      </div>
    </div>
  `;
}

function updateCounts() {
  const cartNode = document.getElementById("navCartCount");
  const wishNode = document.getElementById("navWishlistCount");

  if (cartNode) {
    cartNode.textContent = String(getCartCount());
  }

  if (wishNode) {
    wishNode.textContent = String(getWishlistCount());
  }
}

function updateThemeToggleLabel() {
  const button = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");
  if (!button || !icon) {
    return;
  }

  const current = getTheme();
  const next = current === "dark" ? "light" : "dark";

  icon.innerHTML = current === "dark" ? ICONS.sun : ICONS.moon;
  button.setAttribute("aria-label", `Switch to ${next} mode`);
  button.setAttribute("title", `Switch to ${next} mode`);
}

function goToShopWithQuery(query, focusId = "") {
  const nextQuery = query.trim();
  if (!nextQuery) {
    window.location.href = "./shop.html";
    return;
  }

  const params = new URLSearchParams({ q: nextQuery });
  if (focusId) {
    params.set("focus", focusId);
  }

  window.location.href = `./shop.html?${params.toString()}`;
}

function createSuggestionRow(product, query) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "suggestion-row";
  row.setAttribute("role", "option");

  const name = document.createElement("strong");
  name.textContent = product.name;

  const sub = document.createElement("small");
  sub.textContent = `${product.category} • ${product.drop}`;

  row.append(name, sub);

  row.addEventListener("click", () => {
    goToShopWithQuery(query, product.id);
  });

  return row;
}

function bindSearchAutocomplete() {
  const wrap = document.getElementById("globalSearchWrap");
  const input = document.getElementById("globalSearchInput");
  const suggestions = document.getElementById("globalSearchSuggestions");

  if (!wrap || !(input instanceof HTMLInputElement) || !suggestions) {
    return;
  }

  suggestions.id = "globalSearchSuggestions";
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", suggestions.id);
  input.setAttribute("aria-haspopup", "listbox");

  const renderSuggestions = (query) => {
    const clean = query.trim().toLowerCase();
    suggestions.innerHTML = "";
    input.removeAttribute("aria-activedescendant");
    activeIndex = -1;

    if (!clean) {
      suggestions.classList.add("hidden");
      input.setAttribute("aria-expanded", "false");
      return [];
    }

    const matches = products
      .filter((product) => {
        const text = `${product.name} ${product.description} ${product.category} ${product.drop}`.toLowerCase();
        return text.includes(clean);
      })
      .slice(0, 6);

    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "suggestion-empty";
      empty.textContent = "No direct match. Press Enter to search full catalog.";
      suggestions.append(empty);
      suggestions.classList.remove("hidden");
      input.setAttribute("aria-expanded", "true");
      return [];
    }

    matches.forEach((product, index) => {
      const row = createSuggestionRow(product, query);
      row.id = `search-option-${index}`;
      row.setAttribute("aria-selected", "false");
      row.dataset.index = String(index);
      suggestions.append(row);
    });

    suggestions.classList.remove("hidden");
    input.setAttribute("aria-expanded", "true");
    return matches;
  };

  const setActive = (index) => {
    const rows = [...suggestions.querySelectorAll(".suggestion-row")];
    rows.forEach((row, idx) => {
      row.setAttribute("aria-selected", idx === index ? "true" : "false");
      row.classList.toggle("is-active", idx === index);
    });
    activeIndex = index;
    if (index >= 0 && rows[index]) {
      input.setAttribute("aria-activedescendant", rows[index].id);
      rows[index].scrollIntoView({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  };

  const closeSuggestions = () => {
    suggestions.classList.add("hidden");
    input.setAttribute("aria-expanded", "false");
    setActive(-1);
  };

  let currentMatches = [];
  let activeIndex = -1;

  input.addEventListener("input", (event) => {
    currentMatches = renderSuggestions(event.currentTarget.value);
  });

  input.addEventListener("focus", () => {
    currentMatches = renderSuggestions(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      if (currentMatches.length > 0) {
        event.preventDefault();
        const next = activeIndex < currentMatches.length - 1 ? activeIndex + 1 : 0;
        setActive(next);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      if (currentMatches.length > 0) {
        event.preventDefault();
        const next = activeIndex > 0 ? activeIndex - 1 : currentMatches.length - 1;
        setActive(next);
      }
      return;
    }

    if (event.key === "Escape") {
      closeSuggestions();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && currentMatches[activeIndex]) {
        goToShopWithQuery(input.value, currentMatches[activeIndex].id);
        return;
      }
      if (currentMatches.length > 0) {
        goToShopWithQuery(input.value, currentMatches[0].id);
        return;
      }
      goToShopWithQuery(input.value);
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!wrap.contains(target)) {
      closeSuggestions();
    }
  });

  suggestions.addEventListener("mousemove", (event) => {
    const target = event.target instanceof Element ? event.target.closest(".suggestion-row") : null;
    if (!target) {
      return;
    }
    const idx = Number(target.dataset.index);
    if (Number.isFinite(idx)) {
      setActive(idx);
    }
  });
}

function bindThemeToggle() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) {
    return;
  }

  toggle.addEventListener("click", () => {
    toggleTheme();
    updateThemeToggleLabel();
  });
}

function loadEnhancements(pageKey) {
  const load = () => {
    void import("./assistant.js");
    if (pageKey === "home" || pageKey === "about") {
      void import("./butterflies.js");
    }
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(load, { timeout: 1200 });
    return;
  }

  window.setTimeout(load, 500);
}

function init() {
  const page = document.body.dataset.page || "home";
  document.documentElement.setAttribute("data-theme", getTheme());

  renderHeader();
  renderFooter();
  updateCounts();
  updateThemeToggleLabel();
  bindThemeToggle();
  bindSearchAutocomplete();
  loadEnhancements(page);

  window.addEventListener("ag-store-update", () => {
    updateCounts();
    updateThemeToggleLabel();
  });
}

init();
