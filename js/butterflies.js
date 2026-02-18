const page = document.body.dataset.page;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const enabledPages = new Set(["home", "about"]);
const RAD_TO_DEG = 180 / Math.PI;
const TWO_PI = Math.PI * 2;

const behaviorByPage = {
  home: {
    count: 5,
    spawnZ: [-210, -70],
    spawnXRange: [0.08, 0.92],
    spawnYRange: [0.08, 0.92],
    targetXRange: [0.04, 0.96],
    targetYRange: [0.08, 0.92],
    traverseChance: 0.2,
    traverseMargin: [120, 180],
    scale: [0.56, 0.72],
    speed: [1.15, 1.95],
    flapHz: [4.5, 5.9],
    flapAmp: [30, 44],
    opacity: [0.54, 0.74],
    wander: 0.008,
    retargetMs: [2300, 4200],
  },
  about: {
    count: 5,
    spawnZ: [-220, -80],
    spawnXRange: [0.08, 0.92],
    spawnYRange: [0.1, 0.9],
    targetXRange: [0.06, 0.94],
    targetYRange: [0.1, 0.9],
    traverseChance: 0.16,
    traverseMargin: [120, 180],
    scale: [0.54, 0.68],
    speed: [1.05, 1.78],
    flapHz: [4.2, 5.4],
    flapAmp: [28, 42],
    opacity: [0.5, 0.68],
    wander: 0.007,
    retargetMs: [2400, 4300],
  },
};

if (enabledPages.has(page) && !reduceMotion.matches) {
  const behavior = behaviorByPage[page];
  const field = document.createElement("div");
  field.className = "butterfly-field";
  field.setAttribute("aria-hidden", "true");
  document.body.append(field);

  let width = window.innerWidth;
  let height = window.innerHeight;
  let rafId = 0;
  let last = performance.now();
  const butterflies = [];

  function rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  function inRange(range) {
    return rnd(range[0], range[1]);
  }

  function makeId(index) {
    return `${page}-${index}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pickTarget(state, forceTraverse = false) {
    const traverse = forceTraverse || Math.random() < behavior.traverseChance;

    if (traverse) {
      const margin = rnd(behavior.traverseMargin[0], behavior.traverseMargin[1]);
      state.targetX = Math.random() < 0.5 ? -margin : width + margin;
      state.targetY = height * rnd(behavior.targetYRange[0], behavior.targetYRange[1]);
      state.direction = state.targetX > state.x ? 1 : -1;
    } else {
      state.targetX = width * rnd(behavior.targetXRange[0], behavior.targetXRange[1]);
      state.targetY = height * rnd(behavior.targetYRange[0], behavior.targetYRange[1]);
      state.direction = state.targetX > state.x ? 1 : -1;
    }

    state.targetZ = inRange(behavior.spawnZ);
    state.nextRetarget = performance.now() + rnd(behavior.retargetMs[0], behavior.retargetMs[1]);
  }

  function createButterfly(index) {
    const id = makeId(index);
    const node = document.createElement("div");
    node.className = "butterfly";
    node.style.setProperty("--hue", `${rnd(-3, 3).toFixed(2)}deg`);
    node.style.setProperty("--wing-a", `hsl(${rnd(206, 228).toFixed(1)} 82% ${rnd(52, 67).toFixed(1)}%)`);
    node.style.setProperty("--wing-b", `hsl(${rnd(314, 338).toFixed(1)} 84% ${rnd(58, 73).toFixed(1)}%)`);
    node.style.setProperty("--wing-c", `hsl(${rnd(262, 286).toFixed(1)} 78% ${rnd(48, 64).toFixed(1)}%)`);

    node.innerHTML = `
      <div class="butterfly-inner">
        <svg class="butterfly-svg" viewBox="0 0 96 76" role="presentation" focusable="false">
          <defs>
            <linearGradient id="wing-upper-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--wing-a)" />
              <stop offset="54%" stop-color="var(--wing-b)" />
              <stop offset="100%" stop-color="var(--wing-c)" />
            </linearGradient>
            <linearGradient id="wing-lower-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--wing-c)" />
              <stop offset="100%" stop-color="var(--wing-b)" />
            </linearGradient>
          </defs>

          <g class="wing wing-left-upper">
            <path d="M47 38 C34 10, 10 6, 8 26 C7 44, 24 52, 40 50 C45 49, 49 44, 47 38 Z" fill="url(#wing-upper-${id})" />
            <path d="M43 31 C33 19, 22 18, 17 30 C16 34, 18 38, 22 41 C29 45, 37 42, 43 31 Z" fill="#f8f4df" opacity="0.2" />
          </g>

          <g class="wing wing-left-lower">
            <path d="M45 40 C26 42, 17 54, 23 68 C29 76, 44 73, 50 62 C53 56, 51 48, 45 40 Z" fill="url(#wing-lower-${id})" />
            <circle cx="33" cy="56" r="3.4" fill="#1c140d" opacity="0.32" />
          </g>

          <g class="wing wing-right-upper">
            <path d="M49 38 C62 10, 86 6, 88 26 C89 44, 72 52, 56 50 C51 49, 47 44, 49 38 Z" fill="url(#wing-upper-${id})" />
            <path d="M53 31 C63 19, 74 18, 79 30 C80 34, 78 38, 74 41 C67 45, 59 42, 53 31 Z" fill="#f8f4df" opacity="0.2" />
          </g>

          <g class="wing wing-right-lower">
            <path d="M51 40 C70 42, 79 54, 73 68 C67 76, 52 73, 46 62 C43 56, 45 48, 51 40 Z" fill="url(#wing-lower-${id})" />
            <circle cx="63" cy="56" r="3.4" fill="#1c140d" opacity="0.32" />
          </g>

          <path class="body-shadow" d="M48 15 C45 15, 43.5 18.2, 43.5 21.8 V53.8 C43.5 58.5, 52.5 58.5, 52.5 53.8 V21.8 C52.5 18.2, 51 15, 48 15 Z" />
          <path class="body-main" d="M48 14 C45.2 14, 44 17.2, 44 21 V54 C44 58, 52 58, 52 54 V21 C52 17.2, 50.8 14, 48 14 Z" />
          <path class="antenna" d="M48 14 C45 9.5, 41 8.5, 38.5 8" />
          <path class="antenna" d="M48 14 C51 9.5, 55 8.5, 57.5 8" />
        </svg>
      </div>
    `;

    field.append(node);

    const direction = Math.random() < 0.5 ? -1 : 1;
    const spawnX = width * rnd(behavior.spawnXRange[0], behavior.spawnXRange[1]);
    const spawnY = height * rnd(behavior.spawnYRange[0], behavior.spawnYRange[1]);
    const state = {
      node,
      inner: node.querySelector(".butterfly-inner"),
      wingLU: node.querySelector(".wing-left-upper"),
      wingLL: node.querySelector(".wing-left-lower"),
      wingRU: node.querySelector(".wing-right-upper"),
      wingRL: node.querySelector(".wing-right-lower"),
      x: spawnX,
      y: spawnY,
      z: inRange(behavior.spawnZ),
      vx: inRange(behavior.speed) * direction * rnd(0.34, 0.86),
      vy: rnd(-0.22, 0.22),
      vz: rnd(-0.18, 0.18),
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      nextRetarget: 0,
      direction,
      personalSpace: rnd(20, 40),
      maxSpeed: inRange(behavior.speed),
      minSpeed: 0.45,
      scale: inRange(behavior.scale),
      flapHz: inRange(behavior.flapHz),
      flapAmp: inRange(behavior.flapAmp),
      phase: rnd(0, TWO_PI),
      steer: rnd(0.016, 0.028),
      drag: rnd(0.988, 0.994),
      seed: rnd(0, 1000),
      wander: behavior.wander * rnd(0.85, 1.25),
      opacity: inRange(behavior.opacity),
      nextX: 0,
      nextY: 0,
      nextZ: 0,
      rx: 0,
      ry: 0,
      rz: 0,
    };

    node.style.setProperty("--opacity", String(state.opacity));
    if (Math.abs(state.vx) < 0.38) {
      state.vx = (state.vx < 0 ? -1 : 1) * 0.38;
    }
    state.nextX = state.x;
    state.nextY = state.y;
    state.nextZ = state.z;
    state.rx = state.x;
    state.ry = state.y;
    state.rz = state.z;
    state.node.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, ${state.z.toFixed(2)}px) scale(${state.scale.toFixed(3)})`;

    pickTarget(state);
    butterflies.push(state);
  }

  for (let i = 0; i < behavior.count; i += 1) {
    createButterfly(i);
  }

  function advanceButterfly(state, dt, nowMs) {
    const dx = state.targetX - state.x;
    const dy = state.targetY - state.y;
    const dz = state.targetZ - state.z;
    const dist = Math.hypot(dx, dy, dz) || 1;

    if (dist < 120) {
      pickTarget(state);
    } else if (nowMs > state.nextRetarget) {
      pickTarget(state);
    }

    const desiredVX = (dx / dist) * state.maxSpeed;
    const desiredVY = (dy / dist) * state.maxSpeed;
    const desiredVZ = (dz / dist) * state.maxSpeed * 0.6;

    state.vx += (desiredVX - state.vx) * state.steer * dt;
    state.vy += (desiredVY - state.vy) * state.steer * dt;
    state.vz += (desiredVZ - state.vz) * (state.steer * 0.85) * dt;

    const t = nowMs * 0.001;
    state.vx += Math.sin(t * 1.7 + state.seed) * state.wander * dt;
    state.vy += Math.cos(t * 1.4 + state.seed * 0.7) * state.wander * dt;
    state.vz += Math.sin(t * 1.25 + state.seed * 0.55) * state.wander * 0.7 * dt;

    state.vx *= state.drag;
    state.vy *= state.drag;
    state.vz *= state.drag;

    let speed = Math.hypot(state.vx, state.vy, state.vz);
    if (speed > state.maxSpeed) {
      const ratio = state.maxSpeed / speed;
      state.vx *= ratio;
      state.vy *= ratio;
      state.vz *= ratio;
      speed = state.maxSpeed;
    } else if (speed < state.minSpeed) {
      const ratio = state.minSpeed / (speed || 0.001);
      state.vx *= ratio;
      state.vy *= ratio;
      state.vz *= ratio;
      speed = state.minSpeed;
    }

    state.nextX = state.x + state.vx * dt * 1.74;
    state.nextY = state.y + state.vy * dt * 1.94;
    state.nextZ = state.z + state.vz * dt * 1.38;
  }

  function enforceMandatoryGap(dt) {
    const passes = 3;

    for (let pass = 0; pass < passes; pass += 1) {
      for (let i = 0; i < butterflies.length; i += 1) {
        for (let j = i + 1; j < butterflies.length; j += 1) {
          const a = butterflies[i];
          const b = butterflies[j];
          const minGap = Math.max(a.personalSpace, b.personalSpace);
          let dx = b.nextX - a.nextX;
          let dy = b.nextY - a.nextY;
          let dist = Math.hypot(dx, dy);

          if (dist >= minGap) {
            continue;
          }

          if (dist < 0.001) {
            const angle = rnd(0, TWO_PI);
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            dist = 1;
          }

          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minGap - dist;
          const pushA = overlap * 0.52;
          const pushB = overlap * 0.48;

          a.nextX -= nx * pushA;
          a.nextY -= ny * pushA;
          b.nextX += nx * pushB;
          b.nextY += ny * pushB;

          const velPush = 0.034 * dt;
          a.vx -= nx * velPush;
          a.vy -= ny * velPush;
          b.vx += nx * velPush;
          b.vy += ny * velPush;
        }
      }

      for (const state of butterflies) {
        state.nextY = clamp(state.nextY, -160, height + 160);
      }
    }
  }

  function finalizeButterfly(state, dt) {
    state.x = state.nextX;
    state.y = state.nextY;
    state.z = state.nextZ;

    const hardMargin = behavior.traverseMargin[1] + 90;
    if (state.x < -hardMargin || state.x > width + hardMargin || state.y < -220 || state.y > height + 220) {
      state.x = width * rnd(behavior.spawnXRange[0], behavior.spawnXRange[1]);
      state.y = height * rnd(behavior.spawnYRange[0], behavior.spawnYRange[1]);
      state.z = inRange(behavior.spawnZ);
      state.direction = Math.random() < 0.5 ? -1 : 1;
      state.vx = inRange(behavior.speed) * state.direction * rnd(0.34, 0.86);
      state.vy = rnd(-0.22, 0.22);
      state.vz = rnd(-0.16, 0.16);
      state.nextX = state.x;
      state.nextY = state.y;
      state.nextZ = state.z;
      state.rx = state.x;
      state.ry = state.y;
      state.rz = state.z;
      pickTarget(state);
    }

    if (state.y < -120) {
      state.y = -120;
      state.vy = Math.abs(state.vy) * 0.75;
    } else if (state.y > height + 120) {
      state.y = height + 120;
      state.vy = -Math.abs(state.vy) * 0.75;
    }
    state.z = Math.max(-300, Math.min(90, state.z));

    const speed = Math.hypot(state.vx, state.vy, state.vz);
    const wingRate = state.flapHz + Math.min(speed / state.maxSpeed, 1.3) * 1.05;
    state.phase = (state.phase + wingRate * TWO_PI * (dt / 60)) % TWO_PI;

    const upperFlap = Math.sin(state.phase) * state.flapAmp;
    const lowerFlap = Math.sin(state.phase + 0.36) * state.flapAmp * 0.64;
    const bank = Math.max(-12, Math.min(12, state.vy * 9.5));
    const pitch = -Math.atan2(state.vz, Math.hypot(state.vx, state.vy) || 1) * RAD_TO_DEG;
    const yaw = Math.atan2(state.vy, state.vx) * RAD_TO_DEG;
    const depthScale = Math.max(0.48, Math.min(0.88, state.scale + state.z / 1400));
    const bobY = Math.sin(state.phase * 0.46 + state.seed) * 1.8;
    const themeOpacityFactor = document.documentElement.getAttribute("data-theme") === "light" ? 0.86 : 1;

    const depthOpacity = Math.max(0.58, Math.min(1, state.opacity - Math.abs(state.z) / 1250)) * themeOpacityFactor;
    const blur = Math.max(0, (Math.abs(state.z) - 90) / 420);
    const shadowAlpha = Math.max(0.14, Math.min(0.32, 0.3 - Math.abs(state.z) / 1650 + speed * 0.012));

    state.rx += (state.x - state.rx) * 0.44;
    state.ry += (state.y - state.ry) * 0.44;
    state.rz += (state.z - state.rz) * 0.44;

    state.node.style.opacity = depthOpacity.toFixed(3);
    state.node.style.setProperty("--blur", `${blur.toFixed(3)}px`);
    state.node.style.setProperty("--shadow-alpha", shadowAlpha.toFixed(3));
    state.node.style.transform = `translate3d(${state.rx.toFixed(2)}px, ${state.ry.toFixed(2)}px, ${state.rz.toFixed(2)}px) rotateZ(${yaw.toFixed(2)}deg) rotateX(${(pitch * 0.74).toFixed(2)}deg) rotateY(${bank.toFixed(2)}deg) scale(${depthScale.toFixed(3)})`;
    state.inner.style.transform = `translate3d(0, ${bobY.toFixed(2)}px, 0) rotateX(${(Math.cos(state.phase * 0.34) * 4.5).toFixed(2)}deg)`;
    state.wingLU.style.transform = `rotateY(${upperFlap.toFixed(2)}deg) rotateX(${(2.2 + Math.abs(bank) * 0.12).toFixed(2)}deg)`;
    state.wingRU.style.transform = `rotateY(${(-upperFlap).toFixed(2)}deg) rotateX(${(2.2 + Math.abs(bank) * 0.12).toFixed(2)}deg)`;
    state.wingLL.style.transform = `rotateY(${lowerFlap.toFixed(2)}deg) rotateX(${(1.4 + Math.abs(bank) * 0.1).toFixed(2)}deg)`;
    state.wingRL.style.transform = `rotateY(${(-lowerFlap).toFixed(2)}deg) rotateX(${(1.4 + Math.abs(bank) * 0.1).toFixed(2)}deg)`;
  }

  function tick(now) {
    const delta = Math.min(34, now - last);
    last = now;
    const dt = delta / (1000 / 60);

    if (!document.hidden) {
      butterflies.forEach((butterfly) => advanceButterfly(butterfly, dt, now));
      enforceMandatoryGap(dt);
      butterflies.forEach((butterfly) => finalizeButterfly(butterfly, dt));
    }

    rafId = window.requestAnimationFrame(tick);
  }

  const onResize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
  };

  window.addEventListener("resize", onResize, { passive: true });
  rafId = window.requestAnimationFrame(tick);

  window.addEventListener("pagehide", () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
  });
}
