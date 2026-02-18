import { products } from "./data.js";
import { addToCart } from "./store.js";
import { createProductCard, openQuickView } from "./ui.js";

const PAGE_SIZE = 24;

const state = {
  search: "",
  category: "all",
  profile: "all",
  sort: "featured",
  visibleCount: PAGE_SIZE,
};

const params = new URLSearchParams(window.location.search);
const initialQuery = params.get("q") || "";
const initialFocusId = params.get("focus") || "";
let focusApplied = false;

const nodes = {
  grid: document.getElementById("shopGrid"),
  empty: document.getElementById("shopEmpty"),
  count: document.getElementById("shopCount"),
  search: document.getElementById("filterSearch"),
  category: document.getElementById("filterCategory"),
  profile: document.getElementById("filterProfile"),
  sort: document.getElementById("filterSort"),
  loadMore: document.getElementById("shopLoadMore"),
};

function applyFilters() {
  let filtered = products.filter((product) => {
    const searchText = `${product.name} ${product.description} ${product.drop} ${product.category}`.toLowerCase();
    const searchMatch = !state.search || searchText.includes(state.search);
    const categoryMatch = state.category === "all" || product.category === state.category;
    const profileMatch = state.profile === "all" || product.profile === state.profile;
    return searchMatch && categoryMatch && profileMatch;
  });

  if (state.sort === "low-high") {
    filtered.sort((a, b) => a.basePrice - b.basePrice);
  } else if (state.sort === "high-low") {
    filtered.sort((a, b) => b.basePrice - a.basePrice);
  } else if (state.sort === "newest") {
    filtered.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  } else {
    filtered.sort((a, b) => {
      if (a.limitedQty > 0 && b.limitedQty === 0) {
        return -1;
      }
      if (a.limitedQty === 0 && b.limitedQty > 0) {
        return 1;
      }
      return new Date(b.releaseDate) - new Date(a.releaseDate);
    });
  }

  return filtered;
}

function syncQueryParam() {
  const next = new URL(window.location.href);
  if (state.search) {
    next.searchParams.set("q", state.search);
  } else {
    next.searchParams.delete("q");
  }
  next.searchParams.delete("focus");
  window.history.replaceState({}, "", next);
}

function maybeOpenInitialFocus(productsToRender) {
  if (!initialFocusId || focusApplied) {
    return;
  }

  const matchIndex = productsToRender.findIndex((product) => product.id === initialFocusId);
  if (matchIndex === -1) {
    return;
  }

  if (matchIndex >= state.visibleCount) {
    state.visibleCount = matchIndex + 1;
  }

  const match = productsToRender[matchIndex];
  if (!match) {
    return;
  }

  focusApplied = true;
  openQuickView(match, {
    onAddToCart: (item, variant) => addToCart(item.id, variant, 1),
  });
}

function render() {
  if (!nodes.grid) {
    return;
  }

  const filtered = applyFilters();
  maybeOpenInitialFocus(filtered);
  const visible = filtered.slice(0, state.visibleCount);
  nodes.grid.innerHTML = "";

  if (nodes.count) {
    const visibleText = filtered.length > visible.length ? ` • showing ${visible.length}` : "";
    nodes.count.textContent = `${filtered.length} items${visibleText}`;
  }

  if (!filtered.length) {
    nodes.empty?.classList.remove("hidden");
    nodes.loadMore?.classList.add("hidden");
    return;
  }

  nodes.empty?.classList.add("hidden");

  visible.forEach((product) => {
    const card = createProductCard(product, {
      onAddToCart: (item, variant) => addToCart(item.id, variant, 1),
      showQuickView: true,
      onQuickView: (item, variant) => {
        openQuickView(item, {
          onAddToCart: (target, variant) => addToCart(target.id, variant, 1),
        }, variant);
      },
    });

    nodes.grid.append(card);
  });

  if (nodes.loadMore) {
    const hasMore = filtered.length > visible.length;
    nodes.loadMore.classList.toggle("hidden", !hasMore);
    nodes.loadMore.disabled = !hasMore;
    if (hasMore) {
      nodes.loadMore.textContent = `Load more (${filtered.length - visible.length} remaining)`;
    }
  }
}

function resetVisibleCount() {
  state.visibleCount = PAGE_SIZE;
}

function bind() {
  nodes.search?.addEventListener("input", (event) => {
    state.search = event.currentTarget.value.trim().toLowerCase();
    syncQueryParam();
    resetVisibleCount();
    render();
  });

  nodes.category?.addEventListener("change", (event) => {
    state.category = event.currentTarget.value;
    resetVisibleCount();
    render();
  });

  nodes.profile?.addEventListener("change", (event) => {
    state.profile = event.currentTarget.value;
    resetVisibleCount();
    render();
  });

  nodes.sort?.addEventListener("change", (event) => {
    state.sort = event.currentTarget.value;
    resetVisibleCount();
    render();
  });

  nodes.loadMore?.addEventListener("click", () => {
    state.visibleCount += PAGE_SIZE;
    render();
  });
}

function initFromQuery() {
  if (!initialQuery) {
    return;
  }

  state.search = initialQuery.trim().toLowerCase();
  if (nodes.search) {
    nodes.search.value = initialQuery;
  }
}

function init() {
  initFromQuery();
  bind();
  render();
}

init();
