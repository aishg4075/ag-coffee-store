const ASSISTANT_ENDPOINT = "/api/coffee-assistant";
const REQUEST_TIMEOUT_MS = 8000;
const BROWSER_MODEL_LOAD_TIMEOUT_MS = 45000;
const BROWSER_MODEL_TIMEOUT_MS = 16000;
const BROWSER_MODEL_ID = "Xenova/flan-t5-small";
const BROWSER_MODEL_TASK = "text2text-generation";
const BREW_SIGNAL_RE = /\b(coffee|espresso|matcha|brew|grind|ratio|temperature|v60|pour[- ]?over|aeropress|chemex|french press|extraction|latte|cappuccino|filter|dripper|beans?|roast|caramel|syrup|sweetener|vanilla|mocha)\b/i;
const GREETING_ONLY_RE = /^(hi|hey|hello|hey assistant|yo|hiya|sup|what's up)[\s!?.]*$/i;

const state = {
  open: false,
  busy: false,
  mode: "browser",
  lastBrewBase: "",
  queue: [],
};
let browserGeneratorPromise = null;

function canUseLocalServer() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
}

function normalizePrompt(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function classifyPrompt(message) {
  const normalized = normalizePrompt(message);
  if (!normalized) {
    return "empty";
  }
  if (GREETING_ONLY_RE.test(normalized)) {
    return "greeting";
  }
  if (BREW_SIGNAL_RE.test(normalized)) {
    return "brew";
  }
  return "unknown";
}

function detectBrewBase(message) {
  const normalized = normalizePrompt(message);
  if (!normalized) {
    return "";
  }
  if (/\bmatcha\b/.test(normalized)) {
    return "matcha";
  }
  if (/\bespresso\b/.test(normalized)) {
    return "espresso";
  }
  if (/\b(v60|pour[- ]?over|filter|dripper|chemex|french press|aeropress)\b/.test(normalized)) {
    return "filter coffee";
  }
  if (/\b(coffee|beans?|roast|latte|cappuccino)\b/.test(normalized)) {
    return "coffee";
  }
  return "";
}

function updateContextFromUser(message) {
  const base = detectBrewBase(message);
  if (base) {
    state.lastBrewBase = base;
  }
}

function createGreetingReply() {
  const options = [
    "Hey! I can help with V60, espresso, matcha, ratios, grind size, and extraction fixes. What are you brewing?",
    "Hi. Tell me your brew method and taste issue, and I’ll give a tight dial-in plan.",
    "Hey there. Want help with V60, espresso, matcha, or grinder/ratio setup?",
  ];
  return options[Math.floor(Math.random() * options.length)];
}

function createScopeReply() {
  return "I’m focused on coffee and matcha brewing at AG Brew Lab. Ask me about recipes, extraction, grind, temperature, or brew ratios.";
}

function roundTo(num, step = 1) {
  return Math.round(num / step) * step;
}

function createBrowserReply(message, contextBase = state.lastBrewBase) {
  const prompt = message.trim().toLowerCase();
  const type = classifyPrompt(prompt);

  if (!prompt) {
    return "Ask a specific brew question and I will give a precise step plan.";
  }
  if (type === "greeting") {
    return createGreetingReply();
  }
  if (type === "unknown") {
    return createScopeReply();
  }

  if (prompt.includes("caramel")) {
    if (prompt.includes("matcha") || contextBase === "matcha") {
      return [
        "Leftover matcha + caramel iced recipe:",
        "1. Sift 2g matcha into a bowl.",
        "2. Add 65ml water at 80C and whisk for 20s.",
        "3. Thin 8-12g caramel sauce with 10ml warm water.",
        "4. Add caramel to a glass, then ice + 150ml cold milk.",
        "5. Pour in matcha and stir lightly.",
        "6. Optional: a tiny pinch of salt to balance sweetness.",
      ].join("\n");
    }

    return [
      "Caramel add-in guide:",
      "1. Start with 8-10g caramel per 240ml drink.",
      "2. Dissolve caramel in hot espresso/coffee first for smooth mixing.",
      "3. For iced drinks, add 10-15ml warm water to thin the caramel.",
      "4. If sweetness is high, add 20-30ml extra milk/water.",
    ].join("\n");
  }

  if (prompt.includes("sour") && (prompt.includes("v60") || prompt.includes("pour"))) {
    return [
      "Fix sour V60 extraction:",
      "1. Keep dose 18g and water 300g (1:16.7).",
      "2. Grind 1-2 clicks finer.",
      "3. Raise water temp to 94C.",
      "4. Extend total brew time to ~2:50-3:05.",
      "5. Pour slower in smaller pulses after bloom.",
    ].join("\n");
  }

  if (prompt.includes("bitter")) {
    return [
      "Fix bitterness quickly:",
      "1. Go 1 step coarser.",
      "2. Drop water temp by 1-2C.",
      "3. Reduce agitation and finish 10-20s earlier.",
      "4. Recheck target ratio: start at 1:16 for filter.",
    ].join("\n");
  }

  if (prompt.includes("ratio")) {
    return [
      "Useful brew ratios:",
      "- V60: 1:16 to 1:17",
      "- French press: 1:15",
      "- AeroPress: 1:14 to 1:16",
      "- Cold brew concentrate: 1:6",
      "- Matcha usucha: 2g to 70ml",
    ].join("\n");
  }

  if (prompt.includes("matcha")) {
    const strong = prompt.includes("strong") || prompt.includes("latte");
    if (strong) {
      return [
        "Strong iced matcha (AG style):",
        "1. Sift 2.5g matcha.",
        "2. Add 60ml water at 80C and whisk 20s.",
        "3. Pour over 140-170ml cold milk + ice.",
        "4. Optional: 6-8g syrup for balance.",
      ].join("\n");
    }
    return [
      "Matcha baseline:",
      "1. Sift 2g matcha.",
      "2. Add 70ml water at 79-82C.",
      "3. Whisk zig-zag until microfoam forms (~20s).",
    ].join("\n");
  }

  if (prompt.includes("espresso")) {
    return [
      "Espresso starter profile:",
      "- Dose: 18g in",
      "- Yield: 36g out",
      "- Time: 27-31s",
      "- Temp: 92-94C",
      "Tune finer for sour, coarser for bitter/astringent.",
    ].join("\n");
  }

  if (prompt.includes("time") || prompt.includes("brew time")) {
    return [
      "Target brew windows:",
      "- V60 (18g/300g): 2:40-3:05",
      "- AeroPress: 1:45-2:15 total",
      "- French press: 4:00 steep",
      "- Espresso: 27-31s",
    ].join("\n");
  }

  if (prompt.includes("temperature") || prompt.includes("temp")) {
    return [
      "Temperature guide:",
      "- Light roasts: 93-96C",
      "- Medium roasts: 91-94C",
      "- Dark roasts: 88-92C",
      "- Matcha: 79-82C",
    ].join("\n");
  }

  const grams = prompt.match(/(\d+(?:\.\d+)?)\s*g\b/);
  if (grams && prompt.includes("v60")) {
    const dose = Number(grams[1]);
    const water = roundTo(dose * 16.5, 1);
    return `For ${dose}g coffee on V60, start with ${water}g water (1:16.5), 93C, and target 2:45-3:00 total drawdown.`;
  }

  return [
    "AG Brew Lab quick plan:",
    "1. Choose method + dose (example: 18g V60).",
    "2. Start at 1:16.5 ratio.",
    "3. Dial grind using taste: sour=finer, bitter=coarser.",
    "4. Tune temp by roast level (90-95C range).",
  ].join("\n");
}

function withTimeout(promise, ms, label = "request") {
  let timer = 0;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = window.setTimeout(() => reject(new Error(`${label}_timeout`)), ms);
    }),
  ]).finally(() => window.clearTimeout(timer));
}

function buildBrowserPrompt(message) {
  const clean = message.replace(/\s+/g, " ").trim();
  const context = state.lastBrewBase ? `Context: user is currently discussing ${state.lastBrewBase}.` : "";
  return [
    "You are the AG Brew Lab assistant for coffee and matcha only.",
    "Rules:",
    "- Stay on-topic: coffee, espresso, filter brewing, matcha, grinder, ratios, extraction.",
    "- If greeting: give a short friendly greeting and ask what they are brewing.",
    "- If out-of-scope: politely redirect to coffee/matcha topics.",
    "- Keep responses concise and practical.",
    "- Include exact numbers only when relevant.",
    context,
    "User question:",
    clean,
    "Answer:",
  ].join("\n");
}

function sanitizeModelReply(raw) {
  if (typeof raw !== "string") {
    return "";
  }

  const cleaned = raw
    .replace(/^(answer:|assistant:)\s*/i, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[_]{3,}/g, " ")
    .trim();

  if (!cleaned || cleaned.length < 18) {
    return "";
  }

  return cleaned.slice(0, 820);
}

function looksLikeGarbage(text) {
  if (!text || text.length < 12) {
    return true;
  }
  if (/(___|<unk>|```|https?:\/\/|@@@)/i.test(text)) {
    return true;
  }
  if (/(.)\1{7,}/.test(text)) {
    return true;
  }
  const printable = (text.match(/[\x20-\x7E\n\r\t]/g) || []).length;
  if (printable / text.length < 0.96) {
    return true;
  }
  const alphaNum = (text.match(/[a-z0-9]/gi) || []).length;
  if (alphaNum / Math.max(text.length, 1) < 0.36) {
    return true;
  }
  return false;
}

function isReplyUseful(message, reply) {
  if (looksLikeGarbage(reply)) {
    return false;
  }

  const promptType = classifyPrompt(message);
  if (promptType === "greeting") {
    return /\b(hey|hi|hello|brew|coffee|matcha)\b/i.test(reply);
  }
  if (promptType === "unknown") {
    return /\b(coffee|matcha|brew)\b/i.test(reply);
  }

  return BREW_SIGNAL_RE.test(reply) || /\d+\s?(g|ml|c|°c|sec|min)/i.test(reply);
}

async function getBrowserGenerator() {
  if (browserGeneratorPromise) {
    return browserGeneratorPromise;
  }

  browserGeneratorPromise = withTimeout(
    (async () => {
      const mod = await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2");
      const { pipeline, env } = mod;
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      return pipeline(BROWSER_MODEL_TASK, BROWSER_MODEL_ID, { quantized: true });
    })(),
    BROWSER_MODEL_LOAD_TIMEOUT_MS,
    "model_load",
  );

  try {
    return await browserGeneratorPromise;
  } catch (error) {
    browserGeneratorPromise = null;
    throw error;
  }
}

async function requestBrowserModelReply(message) {
  const generator = await getBrowserGenerator();
  const prompt = buildBrowserPrompt(message);

  const output = await withTimeout(
    generator(prompt, {
      max_new_tokens: 130,
      do_sample: true,
      temperature: 0.55,
      top_p: 0.92,
      repetition_penalty: 1.08,
      return_full_text: false,
    }),
    BROWSER_MODEL_TIMEOUT_MS,
    "generation",
  );

  const raw = Array.isArray(output) && output[0] && typeof output[0].generated_text === "string"
    ? output[0].generated_text
    : "";

  const cleaned = sanitizeModelReply(raw);
  if (!cleaned || !isReplyUseful(message, cleaned)) {
    throw new Error("model_low_confidence_or_off_topic");
  }

  return cleaned;
}

async function requestServerReply(message) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(ASSISTANT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        page: document.body.dataset.page || "unknown",
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
    }

    const reply = typeof payload.reply === "string" && payload.reply.trim()
      ? payload.reply.trim()
      : "";

    if (!reply) {
      throw new Error("empty_reply");
    }

    return reply;
  } finally {
    window.clearTimeout(timer);
  }
}

function buildAssistantShell() {
  if (document.getElementById("brewAssistantFab")) {
    return;
  }

  const shell = document.createElement("div");
  shell.className = "brew-assistant-shell";
  shell.innerHTML = `
    <button id="brewAssistantFab" class="brew-assistant-fab" type="button" aria-label="Open brew assistant" title="Brew assistant">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4.75 12.5h9.25a3.75 3.75 0 0 0 0-7.5h-1.5" />
        <path d="M6.5 14h6.75a4 4 0 0 1 4 4v1.25H6.5V14Z" />
        <path d="M10.5 4.5c.55 1.15.5 2-.2 2.9" />
        <path d="M14 4.5c.55 1.15.5 2-.2 2.9" />
        <path d="M18.5 8h.75a2.3 2.3 0 1 1 0 4.6h-.75" />
      </svg>
      <span>Brew AI</span>
    </button>

    <section id="brewAssistantPanel" class="brew-assistant-panel hidden" aria-live="polite">
      <header>
        <strong>Coffee Assistant</strong>
        <button id="brewAssistantClose" type="button" aria-label="Close assistant">✕</button>
      </header>

      <div class="brew-assistant-quick" id="brewAssistantQuick">
        <button type="button" data-prompt="How do I fix sour V60 extraction?">Fix sour V60</button>
        <button type="button" data-prompt="Give me a strong iced matcha recipe.">Strong iced matcha</button>
        <button type="button" data-prompt="Recommend an evening low-caffeine drink.">Evening ritual</button>
      </div>

      <div id="brewAssistantLog" class="brew-assistant-log">
        <article class="assistant-msg assistant">Ask anything about brewing, ratios, extraction, or matching AG products to your routine.</article>
      </div>

      <form id="brewAssistantForm" class="brew-assistant-form">
        <textarea id="brewAssistantInput" name="message" rows="3" placeholder="Ask a brewing question..." required></textarea>
        <button type="submit">Send</button>
      </form>

      <p id="brewAssistantStatus" class="brew-assistant-status">Assistant ready.</p>
    </section>
  `;

  document.body.append(shell);
}

function setOpen(open) {
  const panel = document.getElementById("brewAssistantPanel");
  const fab = document.getElementById("brewAssistantFab");
  if (!panel || !fab) {
    return;
  }

  state.open = open;
  panel.classList.toggle("hidden", !open);
  fab.setAttribute("aria-expanded", String(open));

  if (open) {
    const input = document.getElementById("brewAssistantInput");
    if (input instanceof HTMLTextAreaElement) {
      input.focus();
    }
  }
}

function appendMessage(text, role = "assistant") {
  const log = document.getElementById("brewAssistantLog");
  if (!log) {
    return;
  }

  const item = document.createElement("article");
  item.className = `assistant-msg ${role}`;
  item.textContent = text;
  log.append(item);
  log.scrollTop = log.scrollHeight;
}

function setStatus(text) {
  const status = document.getElementById("brewAssistantStatus");
  if (status) {
    status.textContent = text;
  }
}

async function askAssistant(message) {
  if (state.busy) {
    state.queue.push(message);
    setStatus(`Processing current reply. Queued: ${state.queue.length}`);
    return;
  }

  state.busy = true;
  setStatus("Thinking...");

  const submitButton = document.querySelector("#brewAssistantForm button[type='submit']");
  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = true;
  }
  updateContextFromUser(message);

  try {
    let reply = "";
    let mode = "guided";
    const promptType = classifyPrompt(message);

    if (promptType === "greeting") {
      reply = createGreetingReply();
    } else if (promptType === "unknown") {
      reply = createScopeReply();
    } else {
      if (canUseLocalServer()) {
        try {
          reply = await requestServerReply(message);
          if (!isReplyUseful(message, reply)) {
            throw new Error("server_reply_low_confidence");
          }
          mode = "server";
        } catch {
          try {
            setStatus("Loading on-device assistant...");
            reply = await requestBrowserModelReply(message);
            mode = "browser-model";
          } catch {
            reply = createBrowserReply(message, state.lastBrewBase);
            mode = "browser";
          }
        }
      } else {
        try {
          setStatus("Loading on-device assistant...");
          reply = await requestBrowserModelReply(message);
          mode = "browser-model";
        } catch {
          reply = createBrowserReply(message, state.lastBrewBase);
          mode = "browser";
        }
      }

      if (!isReplyUseful(message, reply)) {
        reply = createBrowserReply(message, state.lastBrewBase);
        mode = "browser";
      }
    }

    state.mode = mode;
    appendMessage(reply, "assistant");
    if (mode === "server") {
      setStatus("AI server mode active.");
    } else if (mode === "browser-model") {
      setStatus("On-device AI mode active.");
    } else if (mode === "guided") {
      setStatus("Brew guidance mode active.");
    } else {
      setStatus("Smart browser mode active.");
    }
  } catch {
    appendMessage("I hit an issue generating that. Please try rephrasing your brew question.", "assistant");
    setStatus("Temporary issue. Try again.");
  } finally {
    state.busy = false;
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = false;
    }

    if (state.queue.length > 0) {
      const next = state.queue.shift();
      if (typeof next === "string" && next.trim()) {
        askAssistant(next);
      }
    }
  }
}

function bindEvents() {
  const fab = document.getElementById("brewAssistantFab");
  const close = document.getElementById("brewAssistantClose");
  const form = document.getElementById("brewAssistantForm");
  const quick = document.getElementById("brewAssistantQuick");
  const input = document.getElementById("brewAssistantInput");

  fab?.addEventListener("click", () => {
    setOpen(!state.open);
  });

  close?.addEventListener("click", () => {
    setOpen(false);
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const input = document.getElementById("brewAssistantInput");
    if (!(input instanceof HTMLTextAreaElement)) {
      return;
    }

    const message = input.value.trim();
    if (!message) {
      return;
    }

    appendMessage(message, "user");
    input.value = "";
    askAssistant(message);
  });

  input?.addEventListener("keydown", (event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      form?.requestSubmit();
    }
  });

  quick?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const prompt = target.dataset.prompt;
    if (!prompt) {
      return;
    }

    appendMessage(prompt, "user");
    askAssistant(prompt);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.open) {
      setOpen(false);
    }
  });
}

function init() {
  buildAssistantShell();
  bindEvents();
  setStatus("Smart browser mode active.");
}

init();
