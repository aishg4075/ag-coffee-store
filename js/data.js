const baseDropThemes = [
  {
    key: "neon-bloom",
    name: "Neon Bloom",
    priceShift: 0,
    qtyShift: 0,
    flavorNote: "electric citrus and high-clarity finish",
  },
  {
    key: "midnight-chrome",
    name: "Midnight Chrome",
    priceShift: 1,
    qtyShift: -2,
    flavorNote: "dense texture with chrome-dark roast contour",
  },
  {
    key: "solar-dust",
    name: "Solar Dust",
    priceShift: 2,
    qtyShift: 4,
    flavorNote: "bright honey top-notes and daytime energy profile",
  },
  {
    key: "founder-cut",
    name: "Founder Cut",
    priceShift: 3,
    qtyShift: -4,
    flavorNote: "founder-selected calibration with precise extraction windows",
  },
  {
    key: "velocity-core",
    name: "Velocity Core",
    priceShift: 2,
    qtyShift: 3,
    flavorNote: "core lineup tuned for repeatable daily rituals",
  },
];

function nextFridayAtSevenPMDate() {
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

function toIsoDate(date) {
  const local = new Date(date);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const rollingDropStart = nextFridayAtSevenPMDate();
const dropThemes = baseDropThemes.map((theme, index) => {
  const releaseDate = new Date(rollingDropStart);
  releaseDate.setDate(releaseDate.getDate() + index * 7);

  return {
    ...theme,
    releaseDate: toIsoDate(releaseDate),
  };
});

const coffeeStyles = [
  {
    key: "rift-espresso",
    name: "Rift Espresso",
    profile: "deep",
    basePrice: 24,
    limitedQty: 50,
    description: "Dark cacao, red berry, and thick crema built for high-focus starts.",
    quickDetails:
      "Calibrated for 1:2 espresso pulls with low bitterness and heavy body for milk or straight shots.",
    variants: ["250g whole bean", "250g espresso grind", "1kg whole bean"],
    imageUrl: "assets/products/coffee-rift-espresso.jpg",
    alt: "espresso coffee shot pouring into a ceramic cup",
  },
  {
    key: "chrome-house-blend",
    name: "Chrome House Blend",
    profile: "deep",
    basePrice: 22,
    limitedQty: 0,
    description: "Toasted walnut and black cocoa with smooth low-acid finish.",
    quickDetails:
      "Built as the daily house profile for moka pot, espresso, and balanced milk-based drinks.",
    variants: ["250g whole bean", "250g filter grind", "1kg whole bean"],
    imageUrl: "assets/products/coffee-midnight-chrome.jpg",
    alt: "roasted coffee bean bag and coffee product shot",
  },
  {
    key: "solar-decaf-roast",
    name: "Solar Decaf Roast",
    profile: "balanced",
    basePrice: 23,
    limitedQty: 80,
    description: "Honey sweetness and orange peel without caffeine spikes.",
    quickDetails:
      "Swiss-water decaf profile optimized for evening filter brews and late creative sessions.",
    variants: ["250g whole bean", "250g pour-over grind"],
    imageUrl: "assets/products/coffee-solar-dust-decaf.jpg",
    alt: "open coffee bean bag with roasted coffee",
  },
  {
    key: "pulse-drip-bags",
    name: "Pulse Drip Brew Bags",
    profile: "bright",
    basePrice: 20,
    limitedQty: 100,
    description: "Single-serve drip coffee bags with berry-citrus snap.",
    quickDetails:
      "Designed for travel and office brewing, with no grinder required and fast clean extraction.",
    variants: ["10-pack", "20-pack"],
    imageUrl: "assets/products/coffee-pulse-cold-brew.jpg",
    alt: "single serve drip coffee bag over a cup",
  },
  {
    key: "founder-filter-roast",
    name: "Founder Filter Roast",
    profile: "bright",
    basePrice: 26,
    limitedQty: 60,
    description: "Peach acidity and floral finish tuned for V60 clarity.",
    quickDetails:
      "Founder-selected filter profile for precise pulse pours and high-aroma brews.",
    variants: ["250g whole bean", "250g filter grind"],
    imageUrl: "assets/products/coffee-founder-cut-filter.jpg",
    alt: "pour over filter coffee setup with dripper and scale",
  },
  {
    key: "apex-cold-concentrate",
    name: "Apex Cold Brew Concentrate",
    profile: "deep",
    basePrice: 27,
    limitedQty: 70,
    description: "Dense concentrate profile for iced coffee dilution workflows.",
    quickDetails:
      "Steep strong and cut with water or milk for repeatable cold coffee energy builds.",
    variants: ["250g coarse grind", "500g coarse grind"],
    imageUrl: "assets/products/coffee-pulse-cold-brew.jpg",
    alt: "cold brew style coffee drip and cup setup",
  },
  {
    key: "trackside-aeropress",
    name: "Trackside AeroPress Roast",
    profile: "balanced",
    basePrice: 25,
    limitedQty: 65,
    description: "Balanced roast for short travel brews and compact setups.",
    quickDetails:
      "Works across immersion methods with clean sweetness and low astringency.",
    variants: ["250g whole bean", "250g aeropress grind"],
    imageUrl: "assets/products/coffee-founder-cut-filter.jpg",
    alt: "manual brew coffee setup with filtered coffee",
  },
  {
    key: "gravity-nitro-blend",
    name: "Gravity Nitro Blend",
    profile: "deep",
    basePrice: 28,
    limitedQty: 55,
    description: "Chocolate-forward blend designed for nitro and chilled keg service.",
    quickDetails:
      "Higher body profile keeps texture stable after chilling and nitrogen infusion.",
    variants: ["250g whole bean", "1kg whole bean"],
    imageUrl: "assets/products/coffee-rift-espresso.jpg",
    alt: "espresso coffee extraction and crema texture",
  },
];

const matchaStyles = [
  {
    key: "zero-cloud-ceremonial",
    name: "Zero Cloud Ceremonial Matcha",
    profile: "umami",
    basePrice: 39,
    limitedQty: 50,
    description: "First-flush ceremonial matcha with creamy umami lift.",
    quickDetails:
      "Stone-milled ceremonial grade for direct whisking and bright green foam.",
    variants: ["30g tin", "60g tin"],
    imageUrl: "assets/products/matcha-zero-cloud.jpg",
    alt: "ceremonial matcha bowl with whisk and tea powder",
  },
  {
    key: "neon-whisk-daily",
    name: "Neon Whisk Daily Matcha",
    profile: "balanced",
    basePrice: 26,
    limitedQty: 0,
    description: "Daily matcha blend for reliable latte texture and foam.",
    quickDetails:
      "Balanced flavor profile for milk-based matcha with clean sweetness.",
    variants: ["60g pouch", "120g pouch"],
    imageUrl: "assets/products/matcha-neon-whisk.jpg",
    alt: "iced matcha latte in glass",
  },
  {
    key: "citrus-shift",
    name: "Citrus Shift Matcha Blend",
    profile: "bright",
    basePrice: 31,
    limitedQty: 70,
    description: "Yuzu-led matcha blend for bright iced builds.",
    quickDetails:
      "Designed for sparkling matcha tonics and citrus-forward cold whisk routines.",
    variants: ["50g can", "100g can"],
    imageUrl: "assets/products/matcha-citrus-shift.jpg",
    alt: "citrus matcha tea drink with orange garnish",
  },
  {
    key: "founder-roasted-tea",
    name: "Founder Roasted Tea Latte",
    profile: "deep",
    basePrice: 28,
    limitedQty: 90,
    description: "Roasted tea profile with cocoa depth and low-caffeine finish.",
    quickDetails:
      "Crafted for evening latte rituals when warmth is needed without heavy stimulation.",
    variants: ["80g bag", "160g bag"],
    imageUrl: "assets/products/matcha-founder-roasted-latte.jpg",
    alt: "roasted tea latte in ceramic cup",
  },
  {
    key: "mint-velocity",
    name: "Mint Velocity Matcha",
    profile: "bright",
    basePrice: 32,
    limitedQty: 75,
    description: "Mint-edged matcha profile for post-workout recovery drinks.",
    quickDetails:
      "Smooth on ice with elevated freshness and a clean cooling finish.",
    variants: ["50g can", "100g can"],
    imageUrl: "assets/products/matcha-citrus-shift.jpg",
    alt: "bright green matcha beverage with fresh tea styling",
  },
  {
    key: "vanilla-oat-base",
    name: "Vanilla Oat Matcha Base",
    profile: "balanced",
    basePrice: 29,
    limitedQty: 85,
    description: "Round vanilla note blended for oat milk matcha routines.",
    quickDetails:
      "Easy daily base for cafe-style matcha lattes and quick at-home prep.",
    variants: ["70g pouch", "140g pouch"],
    imageUrl: "assets/products/matcha-neon-whisk.jpg",
    alt: "creamy matcha latte with smooth foam",
  },
  {
    key: "matcha-shot-concentrate",
    name: "Matcha Shot Concentrate",
    profile: "umami",
    basePrice: 34,
    limitedQty: 60,
    description: "High-density matcha concentrate for compact energy shots.",
    quickDetails:
      "Formulated for short, intense whisked shots and layered matcha drinks.",
    variants: ["40g tin", "80g tin"],
    imageUrl: "assets/products/matcha-zero-cloud.jpg",
    alt: "matcha shot ritual with bamboo whisk and bowl",
  },
];

const gearStyles = [
  {
    key: "chrome-pourover-system",
    name: "Chrome Pour-Over System",
    profile: "balanced",
    basePrice: 74,
    limitedQty: 35,
    description: "Steel dripper, server and scale base in one workflow kit.",
    quickDetails:
      "Engineered to reduce setup friction and maintain consistent manual extraction.",
    variants: ["6-piece set"],
    imageUrl: "assets/products/gear-chrome-pourover.jpg",
    alt: "pour over coffee gear with dripper and scale",
  },
  {
    key: "carbon-french-press",
    name: "Carbon French Press",
    profile: "deep",
    basePrice: 48,
    limitedQty: 0,
    description: "Double-wall press with strong thermal retention.",
    quickDetails:
      "Built for full-body immersion brews and low-effort daily preparation.",
    variants: ["600ml", "1L"],
    imageUrl: "assets/products/gear-carbon-press.jpg",
    alt: "french press coffee brewer with cup",
  },
  {
    key: "bamboo-ritual-kit",
    name: "Bamboo Matcha Ritual Kit",
    profile: "umami",
    basePrice: 52,
    limitedQty: 40,
    description: "Whisk, scoop, bowl and sifter for complete matcha prep.",
    quickDetails:
      "Ceremonial starter kit for repeatable matcha texture and foam quality.",
    variants: ["4-piece set"],
    imageUrl: "assets/products/gear-ritual-matcha-kit.jpg",
    alt: "matcha whisk bowl and tea preparation kit",
  },
  {
    key: "atlas-pour-station",
    name: "Atlas Pour Station",
    profile: "balanced",
    basePrice: 69,
    limitedQty: 45,
    description: "Compact pour station for dripper, kettle and scale alignment.",
    quickDetails:
      "Keeps manual brew tools organized for cleaner extraction workflow.",
    variants: ["Station set"],
    imageUrl: "assets/editorial/hero-pourover-station.jpg",
    alt: "coffee pour over station with brew equipment",
  },
  {
    key: "thermal-brew-server",
    name: "Thermal Brew Server",
    profile: "balanced",
    basePrice: 44,
    limitedQty: 55,
    description: "Thermal glass server for hot and iced pour-over transitions.",
    quickDetails:
      "Maintains serving temperature while preserving aroma for tasting flights.",
    variants: ["500ml", "800ml"],
    imageUrl: "assets/products/gear-chrome-pourover.jpg",
    alt: "coffee server and pour over brewing setup",
  },
];

const addonStyles = [
  {
    key: "neon-brew-tote",
    name: "Neon Brew Tote",
    profile: "balanced",
    basePrice: 18,
    limitedQty: 120,
    description: "Heavy canvas tote for beans, tins and ritual gear runs.",
    quickDetails:
      "Structured carry design sized for one full weekly drop loadout.",
    variants: ["One size"],
    imageUrl: "assets/products/addon-neon-tote.jpg",
    alt: "canvas tote bag product shot",
  },
  {
    key: "ceramic-cup-duo",
    name: "Ceramic Tasting Cup Duo",
    profile: "balanced",
    basePrice: 22,
    limitedQty: 60,
    description: "Stackable ceramic cups for espresso and matcha shot service.",
    quickDetails:
      "Thick-wall cups tuned for heat retention during tasting and ritual builds.",
    variants: ["2-cup set"],
    imageUrl: "assets/products/addon-tasting-cup-duo.jpg",
    alt: "ceramic espresso tasting cups on table",
  },
  {
    key: "matcha-lab-socks",
    name: "AG Matcha Lab Socks",
    profile: "balanced",
    basePrice: 16,
    limitedQty: 90,
    description: "Rib-knit performance socks for training and streetwear layers.",
    quickDetails:
      "Cotton-rich stretch blend with breathable structure and daily wear comfort.",
    variants: ["S/M", "L/XL"],
    imageUrl: "assets/products/addon-ag-socks.jpg",
    alt: "sport socks apparel product photo",
  },
  {
    key: "espresso-spoon-set",
    name: "Espresso Spoon Set",
    profile: "balanced",
    basePrice: 14,
    limitedQty: 110,
    description: "Mini serving spoon set for espresso and matcha preparations.",
    quickDetails:
      "Utility add-on for measuring, stirring and table-side tasting service.",
    variants: ["2-piece set", "4-piece set"],
    imageUrl: "assets/products/addon-tasting-cup-duo.jpg",
    alt: "espresso accessories with ceramic cup setup",
  },
];

function shiftDate(baseDate, daysToAdd) {
  const date = new Date(`${baseDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}

function buildCategoryProducts(category, styles) {
  const list = [];

  dropThemes.forEach((theme, themeIndex) => {
    styles.forEach((style, styleIndex) => {
      list.push({
        id: `${category}-${theme.key}-${style.key}`,
        name: `${theme.name} ${style.name}`,
        category,
        profile: style.profile,
        drop: theme.name,
        releaseDate: shiftDate(theme.releaseDate, styleIndex),
        limitedQty: style.limitedQty === 0 ? 0 : Math.max(20, style.limitedQty + theme.qtyShift),
        basePrice: style.basePrice + theme.priceShift,
        description: style.description,
        quickDetails: `${style.quickDetails} Theme note: ${theme.flavorNote}.`,
        variants: style.variants,
        checkoutUrl: "https://gumroad.com/",
        imageUrl: style.imageUrl,
        alt: style.alt,
      });
    });
  });

  return list;
}

export const products = [
  ...buildCategoryProducts("coffee", coffeeStyles),
  ...buildCategoryProducts("matcha", matchaStyles),
  ...buildCategoryProducts("gear", gearStyles),
  ...buildCategoryProducts("add-on", addonStyles),
];

export const guideRecipes = [
  {
    id: "guide-espresso-reset",
    title: "90s Espresso Reset",
    type: "coffee",
    method: "Espresso",
    ratio: "1:2",
    tempC: "93",
    grind: "Fine",
    brewTime: "28-32s",
    steps: [
      "Dose 18g espresso-fine coffee into a pre-heated basket.",
      "Distribute and tamp level with consistent pressure.",
      "Extract to 36g output in around 30 seconds.",
      "Serve straight or flash-cool over one large cube.",
    ],
  },
  {
    id: "guide-v60-flow",
    title: "V60 Focus Flow",
    type: "coffee",
    method: "V60 Pour Over",
    ratio: "1:16",
    tempC: "92",
    grind: "Medium",
    brewTime: "2:40-3:00",
    steps: [
      "Rinse filter and warm server, then add 20g ground coffee.",
      "Bloom with 60g water for 40 seconds.",
      "Pulse pour to 320g total in two controlled circles.",
      "Finish drawdown before 3:00 for clean clarity.",
    ],
  },
  {
    id: "guide-cloud-matcha",
    title: "Cloud Matcha Protocol",
    type: "matcha",
    method: "Usucha",
    ratio: "2g / 70ml",
    tempC: "80",
    grind: "N/A",
    brewTime: "45s",
    steps: [
      "Sift 2g matcha into a dry warm bowl.",
      "Add 70ml water at 80C.",
      "Whisk in a fast zig-zag until microfoam forms.",
      "Finish with a gentle circular polish and serve.",
    ],
  },
  {
    id: "guide-iced-matcha-latte",
    title: "Iced Matcha Engine",
    type: "matcha",
    method: "Iced Latte",
    ratio: "2g / 230ml",
    tempC: "80",
    grind: "N/A",
    brewTime: "1:30",
    steps: [
      "Whisk 2g matcha with 50ml warm water until smooth.",
      "Fill a glass with ice and add 180ml cold milk.",
      "Slowly pour matcha over milk for layered texture.",
      "Stir before drinking for balanced flavor.",
    ],
  },
  {
    id: "guide-aeropress-drive",
    title: "AeroPress Drive Shot",
    type: "coffee",
    method: "AeroPress",
    ratio: "1:14",
    tempC: "90",
    grind: "Medium-Fine",
    brewTime: "1:45",
    steps: [
      "Add 16g coffee into inverted AeroPress chamber.",
      "Pour 220g water at 90C and stir 8 seconds.",
      "Steep until 1:00, cap filter and flip safely.",
      "Press steadily for 30-40 seconds.",
    ],
  },
  {
    id: "guide-french-press-balance",
    title: "French Press Balance",
    type: "coffee",
    method: "French Press",
    ratio: "1:15",
    tempC: "94",
    grind: "Coarse",
    brewTime: "4:00",
    steps: [
      "Dose 30g coarse coffee into press.",
      "Pour 450g hot water and stir gently once.",
      "Steep 4 minutes, skim crust for cleaner body.",
      "Press slowly and decant immediately.",
    ],
  },
  {
    id: "guide-cold-brew-core",
    title: "Cold Brew Core",
    type: "coffee",
    method: "Cold Brew",
    ratio: "1:8",
    tempC: "Cold",
    grind: "Coarse",
    brewTime: "12h",
    steps: [
      "Combine 100g coarse coffee with 800ml cold water.",
      "Agitate briefly and seal container.",
      "Steep in fridge for 10-12 hours.",
      "Filter through paper for smooth concentrate.",
    ],
  },
  {
    id: "guide-moka-intensity",
    title: "Moka Pot Intensity",
    type: "coffee",
    method: "Moka Pot",
    ratio: "1:7",
    tempC: "Boiling Base",
    grind: "Fine-Medium",
    brewTime: "3:30",
    steps: [
      "Fill bottom chamber with pre-heated water to valve.",
      "Fill basket loosely with 18g coffee, no tamp.",
      "Assemble and brew on medium-low heat.",
      "Remove from heat once stream blonds.",
    ],
  },
  {
    id: "guide-matcha-shot",
    title: "Matcha Shot Protocol",
    type: "matcha",
    method: "Koicha Shot",
    ratio: "3g / 45ml",
    tempC: "78",
    grind: "N/A",
    brewTime: "50s",
    steps: [
      "Sift 3g ceremonial matcha into a narrow bowl.",
      "Add 45ml water at 78C.",
      "Whisk slower than usucha for dense texture.",
      "Serve as a concentrated energy shot.",
    ],
  },
  {
    id: "guide-sparkling-matcha",
    title: "Sparkling Matcha Tonic",
    type: "matcha",
    method: "Sparkling Build",
    ratio: "2g / 220ml",
    tempC: "80",
    grind: "N/A",
    brewTime: "1:20",
    steps: [
      "Whisk 2g matcha in 50ml warm water.",
      "Add ice to a highball glass.",
      "Pour 170ml sparkling water and top with matcha.",
      "Finish with citrus peel for aroma.",
    ],
  },
  {
    id: "guide-oat-matcha-cream",
    title: "Oat Matcha Cream",
    type: "matcha",
    method: "Cream Latte",
    ratio: "2.5g / 240ml",
    tempC: "80",
    grind: "N/A",
    brewTime: "2:00",
    steps: [
      "Whisk 2.5g matcha in 60ml warm water.",
      "Steam or shake 180ml oat milk until silky.",
      "Layer milk and matcha, then fold together.",
      "Finish with light vanilla dust if desired.",
    ],
  },
  {
    id: "guide-flash-chill-filter",
    title: "Flash Chill Filter",
    type: "coffee",
    method: "Flash Brew",
    ratio: "1:15",
    tempC: "93",
    grind: "Medium",
    brewTime: "3:00",
    steps: [
      "Load server with 130g ice and set dripper above.",
      "Brew 20g coffee with 170g hot water.",
      "Use 35 second bloom then continuous pour.",
      "Swirl to chill and serve immediately.",
    ],
  },
  {
    id: "guide-batch-brew-team",
    title: "Batch Brew Team Carafe",
    type: "coffee",
    method: "Batch Brewer",
    ratio: "1:16",
    tempC: "93",
    grind: "Medium",
    brewTime: "5:30",
    steps: [
      "Dose 60g coffee into batch brewer basket.",
      "Brew with 960g filtered water.",
      "Open bypass only if extraction tastes too dense.",
      "Hold in thermal server and serve within 45 minutes.",
    ],
  },
  {
    id: "guide-matcha-recovery-night",
    title: "Recovery Night Matcha",
    type: "matcha",
    method: "Low-Caffeine Blend",
    ratio: "2g / 200ml",
    tempC: "75",
    grind: "N/A",
    brewTime: "1:40",
    steps: [
      "Whisk 2g roasted tea-matcha blend in 60ml water.",
      "Add 140ml warm milk alternative.",
      "Sweeten lightly with honey if needed.",
      "Sip slowly as a low-stim evening ritual.",
    ],
  },
];

export const dropCalendar = dropThemes.map((theme) => ({
  name: theme.name,
  date: `${theme.releaseDate}T19:00:00`,
  story: `Limited capsule focused on ${theme.flavorNote}.`,
}));
