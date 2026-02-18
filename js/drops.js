import { dropCalendar, products } from "./data.js";
import { addToCart } from "./store.js";
import { createProductCard, formatDate, initCountdown, nextFridayAtSevenPM, openQuickView } from "./ui.js";

function getNextDropDate() {
  const now = new Date();
  const upcoming = dropCalendar
    .map((drop) => ({ ...drop, asDate: new Date(drop.date) }))
    .filter((drop) => drop.asDate > now)
    .sort((a, b) => a.asDate - b.asDate);

  return upcoming[0]?.asDate ?? nextFridayAtSevenPM();
}

function renderDropTimeline() {
  const timeline = document.getElementById("dropTimeline");
  if (!timeline) {
    return;
  }

  timeline.innerHTML = "";

  dropCalendar.forEach((drop) => {
    const node = document.createElement("article");
    node.className = "timeline-item";

    const title = document.createElement("strong");
    title.textContent = `${drop.name} • ${formatDate(drop.date)}`;

    const body = document.createElement("p");
    body.textContent = drop.story;

    node.append(title, body);
    timeline.append(node);
  });
}

function renderDropProducts() {
  const grid = document.getElementById("dropProductGrid");
  if (!grid) {
    return;
  }

  grid.innerHTML = "";
  const limited = products
    .filter((product) => product.limitedQty > 0)
    .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
    .slice(0, 24);

  limited.forEach((product) => {
    const card = createProductCard(product, {
      onAddToCart: (item, variant) => addToCart(item.id, variant, 1),
      showQuickView: true,
      onQuickView: (item, variant) => {
        openQuickView(item, {
          onAddToCart: (target, selectedVariant) => addToCart(target.id, selectedVariant, 1),
        }, variant);
      },
    });

    grid.append(card);
  });
}

function initDropCountdown() {
  initCountdown(
    {
      days: document.getElementById("dropDays"),
      hours: document.getElementById("dropHours"),
      minutes: document.getElementById("dropMinutes"),
      seconds: document.getElementById("dropSeconds"),
    },
    getNextDropDate,
  );
}

function init() {
  renderDropTimeline();
  renderDropProducts();
  initDropCountdown();
}

init();
