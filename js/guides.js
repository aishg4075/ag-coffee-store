import { guideRecipes } from "./data.js";

const state = {
  filter: "all",
};

function getFilteredGuides() {
  if (state.filter === "all") {
    return guideRecipes;
  }

  return guideRecipes.filter((guide) => guide.type === state.filter);
}

function buildFilterButtons() {
  const container = document.getElementById("guideFilters");
  if (!container) {
    return;
  }

  const types = ["all", ...new Set(guideRecipes.map((guide) => guide.type))];
  container.innerHTML = "";

  types.forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip-btn${state.filter === type ? " is-active" : ""}`;
    button.textContent = type === "all" ? "All" : type[0].toUpperCase() + type.slice(1);
    button.addEventListener("click", () => {
      state.filter = type;
      buildFilterButtons();
      renderGuides();
    });
    container.append(button);
  });
}

function renderGuides() {
  const list = document.getElementById("guideList");
  if (!list) {
    return;
  }

  const guides = getFilteredGuides();
  list.innerHTML = "";

  guides.forEach((guide) => {
    const card = document.createElement("article");
    card.className = "guide-option";

    const top = document.createElement("div");
    top.className = "guide-top";

    const titleWrap = document.createElement("div");

    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = `${guide.type} • ${guide.method}`;

    const title = document.createElement("h3");
    title.textContent = guide.title;

    titleWrap.append(pill, title);

    const meta = document.createElement("div");
    meta.className = "guide-meta";

    const metaEntries = [
      ["Ratio", guide.ratio],
      ["Temp", `${guide.tempC}°C`],
      ["Grind", guide.grind],
      ["Time", guide.brewTime],
    ];

    metaEntries.forEach(([label, value]) => {
      const item = document.createElement("div");
      const small = document.createElement("small");
      small.textContent = label;
      const strong = document.createElement("strong");
      strong.textContent = value;
      item.append(small, strong);
      meta.append(item);
    });

    top.append(titleWrap, meta);

    const steps = document.createElement("ol");
    steps.className = "guide-steps";
    guide.steps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      steps.append(li);
    });

    card.append(top, steps);
    list.append(card);
  });
}

function initCalculator() {
  const form = document.getElementById("brewCalcForm");
  const output = document.getElementById("brewCalcOutput");

  if (!form || !output) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const brewType = String(formData.get("brewType") || "coffee");
    const servings = Number(formData.get("servings") || 1);
    const strength = String(formData.get("strength") || "medium");

    if (!servings || servings <= 0) {
      output.textContent = "Enter a valid number of servings.";
      return;
    }

    if (brewType === "matcha") {
      const gramsMap = {
        light: 1.8,
        medium: 2,
        strong: 2.6,
      };
      const waterMap = {
        light: 80,
        medium: 70,
        strong: 60,
      };

      const grams = (gramsMap[strength] * servings).toFixed(1);
      const water = Math.round(waterMap[strength] * servings);
      output.textContent = `${grams}g matcha + ${water}ml water at 78-80C (${strength} profile).`;
      return;
    }

    const ratioMap = {
      light: 17,
      medium: 16,
      strong: 14,
    };

    const water = servings * 300;
    const coffee = (water / ratioMap[strength]).toFixed(1);
    output.textContent = `${coffee}g coffee + ${water}ml water (1:${ratioMap[strength]} ${strength} profile).`;
  });
}

function init() {
  buildFilterButtons();
  renderGuides();
  initCalculator();
}

init();
