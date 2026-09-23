/**
 * =====================================================================
 * KIRAWNSAN K — PORTFOLIO SCRIPT
 * =====================================================================
 * Rewritten as a set of small, single-responsibility classes. Every
 * interactive feature on the page owns its DOM references and state;
 * nothing here relies on module-level globals besides the shared
 * Environment flags. PortfolioApp is the single composition root that
 * wires everything together.
 *
 * Table of contents:
 *   1.  Environment            — shared feature-detection flags
 *   2.  TypingEffect            — terminal typing animation
 *   3.  ScrollReveal            — IntersectionObserver reveal-on-scroll
 *   4.  MobileNav               — hamburger menu toggle
 *   5.  SkillOrbit              — 3D skill tag orbit
 *   6.  CubeBurst               — click-triggered background pulse
 *   7.  NeuralNetBackground     — animated particle canvas
 *   8.  CustomCursor            — dot + ring cursor follower
 *   9.  HeroInteractions        — hero parallax + glitch title
 *   10. ProjectTilt             — 3D tilt on project cards
 *   11. WorldMapGlobe           — rotating dot-matrix globe
 *   12. ColorTransferKeyboard   — key-press → color visualizer
 *   13. ScrollProgress          — top scroll-position progress bar
 *   14. BackToTop               — floating scroll-to-top button
 *   15. InteractiveTerminal     — mini command-line lab experiment
 *   16. PortfolioApp            — composition root / bootstrap
 * =====================================================================
 */
'use strict';

/* ---------------------------------------------------------------------
   1. ENVIRONMENT — shared feature-detection flags
   --------------------------------------------------------------------- */
class Environment {
  static reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  static isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
}


/* ---------------------------------------------------------------------
   2. TERMINAL TYPING EFFECT
   --------------------------------------------------------------------- */
class TypingEffect {
  #phrases = [
    'whoami',
    '→ Kirawnsan K, Full-Stack Developer',
    'cat interests.txt',
    '→ full-stack engineering, cybersecurity research'
  ];

  #el;
  #phraseIndex = 0;
  #charIndex = 0;
  #deleting = false;

  /** @param {string} elementId - id of the element the typed text is written into */
  constructor(elementId = 'typed') {
    this.#el = document.getElementById(elementId);
  }

  init() {
    if (!this.#el) return;
    this.#tick();
  }

  #currentPhrase() {
    return this.#phrases[this.#phraseIndex];
  }

  #tick = () => {
    const current = this.#currentPhrase();

    if (!this.#deleting) {
      this.#el.textContent = current.slice(0, this.#charIndex + 1);
      this.#charIndex++;
      if (this.#charIndex === current.length) {
        this.#deleting = true;
        setTimeout(this.#tick, 1400);
        return;
      }
    } else {
      this.#el.textContent = current.slice(0, this.#charIndex - 1);
      this.#charIndex--;
      if (this.#charIndex === 0) {
        this.#deleting = false;
        this.#phraseIndex = (this.#phraseIndex + 1) % this.#phrases.length;
      }
    }
    setTimeout(this.#tick, this.#deleting ? 28 : 42);
  };
}


/* ---------------------------------------------------------------------
   3. SCROLL-REVEAL (IntersectionObserver)
   --------------------------------------------------------------------- */
class ScrollReveal {
  #selector;
  #threshold;
  #observer;

  /**
   * @param {string} selector - elements to reveal as they enter the viewport
   * @param {number} threshold - fraction of the element that must be visible
   */
  constructor(selector = '.reveal', threshold = 0.12) {
    this.#selector = selector;
    this.#threshold = threshold;
  }

  init() {
    this.#observer = new IntersectionObserver(this.#handleIntersect, { threshold: this.#threshold });
    document.querySelectorAll(this.#selector).forEach((el) => this.#observer.observe(el));
  }

  #handleIntersect = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        this.#observer.unobserve(entry.target);
      }
    });
  };
}


/* ---------------------------------------------------------------------
   4. MOBILE NAV TOGGLE
   --------------------------------------------------------------------- */
class MobileNav {
  #toggle;
  #links;
  #breakpoint;

  /**
   * @param {string} toggleId - id of the hamburger button
   * @param {string} linksId - id of the collapsible link list
   * @param {number} breakpoint - viewport width (px) above which the menu auto-closes
   */
  constructor(toggleId = 'navToggle', linksId = 'navLinks', breakpoint = 900) {
    this.#toggle = document.getElementById(toggleId);
    this.#links = document.getElementById(linksId);
    this.#breakpoint = breakpoint;
  }

  init() {
    if (!this.#toggle || !this.#links) return;
    this.#bindEvents();
  }

  #isOpen() {
    return this.#links.classList.contains('open');
  }

  #open = () => {
    this.#links.classList.add('open');
    this.#toggle.setAttribute('aria-expanded', 'true');
  };

  #close = () => {
    this.#links.classList.remove('open');
    this.#toggle.setAttribute('aria-expanded', 'false');
  };

  #handleToggleClick = () => {
    this.#isOpen() ? this.#close() : this.#open();
  };

  #handleOutsideClick = (e) => {
    if (!this.#isOpen()) return;
    if (this.#links.contains(e.target) || this.#toggle.contains(e.target)) return;
    this.#close();
  };

  #handleResize = () => {
    if (window.innerWidth > this.#breakpoint) this.#close();
  };

  #bindEvents() {
    this.#toggle.addEventListener('click', this.#handleToggleClick);
    this.#links.querySelectorAll('a').forEach((a) => a.addEventListener('click', this.#close));
    document.addEventListener('click', this.#handleOutsideClick);
    window.addEventListener('resize', this.#handleResize);
  }
}


/* ---------------------------------------------------------------------
   5. 3D SKILL ORBIT
   --------------------------------------------------------------------- */
class SkillOrbit {
  #orbit;
  #wrap;
  #skills;
  #baseRadius;
  #resizeTimer;

  /**
   * @param {string} orbitId - id of the orbit container element
   * @param {string[]} skills - labels to place around the ring
   * @param {number} baseRadius - translateZ distance from the ring's center,
   *   tuned for the full-size (320px) desktop .orbit-wrap
   */
  constructor(orbitId = 'orbit', skills = ['JavaScript', 'React', 'Node.js', 'C#', '.NET', 'Python', 'Java', 'PHP'], baseRadius = 150) {
    this.#orbit = document.getElementById(orbitId);
    this.#skills = skills;
    this.#baseRadius = baseRadius;
  }

  init() {
    if (!this.#orbit) return;
    this.#wrap = this.#orbit.closest('.orbit-wrap');
    this.#renderNodes();
    // .orbit-wrap shrinks at narrower breakpoints (320px → 260px → 240px)
    // but this radius is a fixed 3D offset, not a CSS length — without this
    // it stays 150px on mobile and the skill labels spill outside the ring.
    window.addEventListener('resize', this.#handleResize);
  }

  #handleResize = () => {
    clearTimeout(this.#resizeTimer);
    this.#resizeTimer = setTimeout(() => this.#renderNodes(), 150);
  };

  #currentRadius() {
    if (!this.#wrap) return this.#baseRadius;
    const wrapSize = this.#wrap.clientWidth || 320;
    return Math.min(this.#baseRadius, this.#baseRadius * (wrapSize / 320));
  }

  #renderNodes() {
    this.#orbit.innerHTML = '';
    const radius = this.#currentRadius();
    this.#skills.forEach((skill, i) => {
      const angle = (360 / this.#skills.length) * i;
      const node = document.createElement('div');
      node.className = 'orbit-node';
      node.textContent = skill;
      node.style.transform = `translate(-50%,-50%) rotateY(${angle}deg) translateZ(${radius}px)`;
      this.#orbit.appendChild(node);
    });
  }
}


/* ---------------------------------------------------------------------
   6. SKILL CUBE — click sends a pulse through the whole page background
   --------------------------------------------------------------------- */
class CubeBurst {
  #cube;
  #grid;
  #glow;

  constructor(cubeId = 'skillCube', gridSelector = '.bg-grid', glowSelector = '.bg-glow') {
    this.#cube = document.getElementById(cubeId);
    this.#grid = document.querySelector(gridSelector);
    this.#glow = document.querySelector(glowSelector);
  }

  init() {
    if (!this.#cube) return;
    this.#cube.addEventListener('click', this.#trigger);
    this.#cube.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.#trigger();
      }
    });
  }

  #trigger = () => {
    const rect = this.#cube.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    this.#replay(this.#cube, 'cube-kick');
    this.#replay(this.#grid, 'warp', 700);
    this.#replay(this.#glow, 'warp', 700);
    this.#spawnRing(x, y);

    window.dispatchEvent(new CustomEvent('bg:pulse', { detail: { x, y } }));
  };

  #replay(el, className, autoRemoveAfter = 0) {
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth; // restart the animation/transition even on rapid clicks
    el.classList.add(className);
    if (autoRemoveAfter) setTimeout(() => el.classList.remove(className), autoRemoveAfter);
  }

  #spawnRing(x, y) {
    const ring = document.createElement('div');
    ring.className = 'warp-ring';
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    document.body.appendChild(ring);
    ring.addEventListener('animationend', () => ring.remove());
  }
}


/* ---------------------------------------------------------------------
   7. NEURAL-NETWORK BACKGROUND CANVAS
   --------------------------------------------------------------------- */
class NeuralNetBackground {
  #canvas;
  #ctx;
  #mouse = { x: null, y: null };
  #width = 0;
  #height = 0;
  #particles = [];

  #maxParticles = 70;
  #densityDivisor = 22000;
  #linkDistance = 140;
  #repelDistance = 120;
  #burst = null; // { x, y, time } — active click-triggered shockwave, if any

  /** @param {string} canvasId - id of the background <canvas> */
  constructor(canvasId = 'net-bg') {
    this.#canvas = document.getElementById(canvasId);
    this.#ctx = this.#canvas ? this.#canvas.getContext('2d') : null;
  }

  init() {
    if (!this.#canvas) return;

    this.#resize();
    this.#seedParticles();

    window.addEventListener('resize', () => {
      this.#resize();
      this.#seedParticles();
    });
    window.addEventListener('mousemove', (e) => {
      this.#mouse.x = e.clientX;
      this.#mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
      this.#mouse.x = null;
      this.#mouse.y = null;
    });
    window.addEventListener('bg:pulse', (e) => {
      this.#burst = { x: e.detail.x, y: e.detail.y, time: performance.now() };
    });

    // still draw a single static frame under reduced motion, just don't animate it
    if (!Environment.reduceMotion) {
      requestAnimationFrame(this.#drawFrame);
    } else {
      this.#drawFrame();
    }
  }

  #resize = () => {
    this.#width = this.#canvas.width = window.innerWidth;
    this.#height = this.#canvas.height = window.innerHeight;
  };

  #seedParticles = () => {
    const count = Math.min(this.#maxParticles, Math.floor((this.#width * this.#height) / this.#densityDivisor));
    this.#particles = Array.from({ length: count }, () => ({
      x: Math.random() * this.#width,
      y: Math.random() * this.#height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35
    }));
  };

  #updateParticle(particle) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    if (particle.x < 0 || particle.x > this.#width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > this.#height) particle.vy *= -1;

    if (this.#mouse.x !== null) {
      const dx = particle.x - this.#mouse.x;
      const dy = particle.y - this.#mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < this.#repelDistance) {
        particle.x += (dx / dist) * 0.6;
        particle.y += (dy / dist) * 0.6;
      }
    }

    // decaying outward shove from a click-triggered pulse — the whole
    // field of particles briefly moves outward from that point
    if (this.#burst) {
      const elapsed = performance.now() - this.#burst.time;
      const duration = 900;
      if (elapsed < duration) {
        const dx = particle.x - this.#burst.x;
        const dy = particle.y - this.#burst.y;
        const dist = Math.max(Math.hypot(dx, dy), 1);
        const decay = 1 - elapsed / duration;
        const push = (30 / dist) * decay * 6;
        particle.x += (dx / dist) * push;
        particle.y += (dy / dist) * push;
      } else {
        this.#burst = null;
      }
    }
  }

  #drawLinks() {
    const ctx = this.#ctx;
    for (let i = 0; i < this.#particles.length; i++) {
      for (let j = i + 1; j < this.#particles.length; j++) {
        const a = this.#particles[i];
        const b = this.#particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < this.#linkDistance) {
          ctx.strokeStyle = `rgba(73,217,199,${0.16 * (1 - dist / this.#linkDistance)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(73,217,199,0.55)';
      ctx.beginPath();
      ctx.arc(this.#particles[i].x, this.#particles[i].y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  #drawFrame = () => {
    this.#ctx.clearRect(0, 0, this.#width, this.#height);
    this.#particles.forEach((p) => this.#updateParticle(p));
    this.#drawLinks();
    requestAnimationFrame(this.#drawFrame);
  };
}


/* ---------------------------------------------------------------------
   8. CUSTOM CURSOR
   --------------------------------------------------------------------- */
class CustomCursor {
  #dot;
  #ring;
  #ringX = 0;
  #ringY = 0;
  #targetX = 0;
  #targetY = 0;
  #ease = 0.18;
  #hoverTargets = 'a, .project, .skill-card, .orbit-node, .avatar-ring, .key, .globe-wrap, .cube-wrap';

  /**
   * @param {string} dotId - id of the small cursor dot element
   * @param {string} ringId - id of the trailing cursor ring element
   */
  constructor(dotId = 'cursorDot', ringId = 'cursorRing') {
    this.#dot = document.getElementById(dotId);
    this.#ring = document.getElementById(ringId);
  }

  init() {
    if (Environment.isTouch || !this.#dot || !this.#ring) return;

    window.addEventListener('mousemove', this.#handleMouseMove);
    this.#bindHoverTargets();
    requestAnimationFrame(this.#easeRing);
  }

  #handleMouseMove = (e) => {
    this.#dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
    this.#targetX = e.clientX;
    this.#targetY = e.clientY;
  };

  #easeRing = () => {
    this.#ringX += (this.#targetX - this.#ringX) * this.#ease;
    this.#ringY += (this.#targetY - this.#ringY) * this.#ease;
    this.#ring.style.transform = `translate(${this.#ringX}px, ${this.#ringY}px) translate(-50%,-50%)`;
    requestAnimationFrame(this.#easeRing);
  };

  #bindHoverTargets() {
    document.querySelectorAll(this.#hoverTargets).forEach((el) => {
      el.addEventListener('mouseenter', () => this.#ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => this.#ring.classList.remove('hover'));
    });
  }
}


/* ---------------------------------------------------------------------
   9. HERO PARALLAX + GLITCH TITLE TRIGGER
   --------------------------------------------------------------------- */
class HeroInteractions {
  #hero;
  #heroTerminal;
  #heroTitle;
  #parallaxStrength = 10;

  constructor(heroSelector = '.hero', terminalId = 'heroTerminal', titleId = 'heroTitle') {
    this.#hero = document.querySelector(heroSelector);
    this.#heroTerminal = document.getElementById(terminalId);
    this.#heroTitle = document.getElementById(titleId);
  }

  init() {
    if (!this.#hero || !this.#heroTerminal || !this.#heroTitle) return;

    if (!Environment.isTouch && !Environment.reduceMotion) {
      this.#hero.addEventListener('mousemove', this.#handleParallax);
    }
    this.#heroTitle.addEventListener('mouseenter', this.#triggerGlitch);
  }

  #handleParallax = (e) => {
    const rect = this.#hero.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width - 0.5;
    const my = (e.clientY - rect.top) / rect.height - 0.5;
    this.#heroTerminal.style.transform = `translate(${mx * this.#parallaxStrength}px, ${my * this.#parallaxStrength}px)`;
  };

  #triggerGlitch = () => {
    this.#heroTitle.classList.remove('glitch-active');
    void this.#heroTitle.offsetWidth; // restart the CSS animation
    this.#heroTitle.classList.add('glitch-active');
  };
}


/* ---------------------------------------------------------------------
   10. 3D TILT ON PROJECT CARDS
   --------------------------------------------------------------------- */
class ProjectTilt {
  #cardSelector;
  #maxTiltDeg = 4;

  /** @param {string} cardSelector - selector matching each tiltable card */
  constructor(cardSelector = '.project') {
    this.#cardSelector = cardSelector;
  }

  init() {
    if (Environment.isTouch || Environment.reduceMotion) return;
    document.querySelectorAll(this.#cardSelector).forEach((card) => this.#bindCard(card));
  }

  #bindCard(card) {
    card.addEventListener('mousemove', (e) => this.#handleMove(card, e));
    card.addEventListener('mouseleave', () => this.#resetTilt(card));
  }

  #handleMove(card, e) {
    const rect = card.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const rx = ((py - 50) / 50) * -this.#maxTiltDeg;
    const ry = ((px - 50) / 50) * this.#maxTiltDeg;

    card.style.setProperty('--mx', `${px}%`);
    card.style.setProperty('--my', `${py}%`);
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  #resetTilt(card) {
    card.style.transform = 'rotateX(0deg) rotateY(0deg)';
  }
}


/* ---------------------------------------------------------------------
   11. ROTATING WORLD MAP (dot-matrix globe)
   --------------------------------------------------------------------- */
class WorldMapGlobe {
  // Rough continent outlines as [lon, lat] polygons — stylised, not survey-accurate,
  // but enough to render a recognisable dot-matrix globe.
  static #CONTINENTS = [
    // Africa
    [[-17, 35], [10, 37], [20, 32], [32, 31], [44, 12], [51, 12], [48, 2], [42, -1],
     [40, -15], [35, -25], [27, -33], [18, -35], [12, -18], [8, 4], [-6, 5], [-10, 15], [-17, 20]],
    // Europe
    [[-10, 44], [-9, 53], [-5, 58], [5, 61], [15, 66], [28, 70], [35, 66], [45, 60],
     [45, 48], [38, 42], [27, 40], [15, 42], [5, 44], [-2, 44]],
    // Asia
    [[27, 40], [35, 45], [45, 48], [45, 60], [55, 68], [70, 72], [95, 74], [120, 72],
     [140, 60], [143, 50], [135, 42], [122, 32], [112, 22], [98, 10], [92, 5], [78, 8],
     [68, 18], [58, 25], [48, 30], [38, 35]],
    // North America
    [[-165, 68], [-155, 71], [-130, 71], [-95, 68], [-83, 58], [-80, 48], [-70, 45],
     [-65, 44], [-75, 32], [-80, 25], [-97, 18], [-105, 20], [-115, 30], [-124, 40],
     [-124, 49], [-135, 58], [-155, 60]],
    // South America
    [[-80, 10], [-70, 12], [-60, 10], [-50, 0], [-35, -6], [-38, -15], [-40, -23],
     [-48, -28], [-58, -35], [-68, -45], [-73, -42], [-75, -20], [-81, -5]],
    // Australia
    [[113, -22], [122, -18], [130, -12], [142, -11], [147, -19], [153, -28],
     [150, -34], [140, -38], [130, -32], [118, -33], [113, -26]]
  ];

  // Batticaloa, Sri Lanka
  static #PIN = { lon: 81.7, lat: 7.7 };

  #wrap;
  #canvas;
  #pinLabel;
  #gctx;
  #dots;
  #dpr;

  #rotationDeg = -80;   // current globe rotation
  #autoTarget = null;   // when set, eases rotation toward Sri Lanka
  #dragging = false;
  #lastPointerX = 0;
  #canvasWidth = 0;
  #canvasHeight = 0;
  #sphereRadius = 0;
  #resumeTimer = null;

  /**
   * @param {string} wrapId - id of the globe's wrapping container
   * @param {string} canvasId - id of the globe <canvas>
   * @param {string} pinLabelId - id of the floating pin-label element
   */
  constructor(wrapId = 'globeWrap', canvasId = 'globeCanvas', pinLabelId = 'globePinLabel') {
    this.#wrap = document.getElementById(wrapId);
    this.#canvas = document.getElementById(canvasId);
    this.#pinLabel = document.getElementById(pinLabelId);
    this.#gctx = this.#canvas ? this.#canvas.getContext('2d') : null;
    this.#dpr = Math.min(window.devicePixelRatio || 1, 2);
  }

  init() {
    if (!this.#wrap || !this.#canvas || !this.#pinLabel) return;

    this.#dots = this.#buildDotField();
    this.#resize();

    window.addEventListener('resize', this.#resize);
    this.#wrap.addEventListener('mousedown', (e) => this.#pointerDown(e.clientX));
    window.addEventListener('mousemove', (e) => this.#pointerMove(e.clientX));
    window.addEventListener('mouseup', this.#pointerUp);
    this.#wrap.addEventListener('touchstart', (e) => this.#pointerDown(e.touches[0].clientX), { passive: true });
    this.#wrap.addEventListener('touchmove', (e) => this.#pointerMove(e.touches[0].clientX), { passive: true });
    this.#wrap.addEventListener('touchend', this.#pointerUp);

    this.#tick();
  }

  /** Ray-casting point-in-polygon test. */
  static #pointInPolygon(lon, lat, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      const intersects = ((yi > lat) !== (yj > lat)) &&
        (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  /** Build the dot field once — a lat/lon grid filtered down to continent shapes. */
  #buildDotField() {
    const dots = [];
    for (let lat = -80; lat <= 80; lat += 3.2) {
      const lonStep = Math.max(3.2, 3.2 / Math.max(0.18, Math.cos((lat * Math.PI) / 180)));
      for (let lon = -180; lon < 180; lon += lonStep) {
        for (const poly of WorldMapGlobe.#CONTINENTS) {
          if (WorldMapGlobe.#pointInPolygon(lon, lat, poly)) {
            dots.push([lon, lat]);
            break;
          }
        }
      }
    }
    return dots;
  }

  #resize = () => {
    const rect = this.#wrap.getBoundingClientRect();
    this.#canvasWidth = rect.width;
    this.#canvasHeight = rect.height;
    this.#canvas.width = this.#canvasWidth * this.#dpr;
    this.#canvas.height = this.#canvasHeight * this.#dpr;
    this.#canvas.style.width = `${this.#canvasWidth}px`;
    this.#canvas.style.height = `${this.#canvasHeight}px`;
    this.#gctx.setTransform(this.#dpr, 0, 0, this.#dpr, 0, 0);
    this.#sphereRadius = Math.min(this.#canvasWidth, this.#canvasHeight) * 0.42;
  };

  /** Project a lat/lon point onto the unit sphere, given the current rotation. */
  #projectToSphere(lon, lat) {
    const theta = ((lon + this.#rotationDeg) * Math.PI) / 180;
    const phi = (lat * Math.PI) / 180;
    return {
      x: Math.cos(phi) * Math.sin(theta),
      y: Math.sin(phi),
      z: Math.cos(phi) * Math.cos(theta)
    };
  }

  #drawContinents(cx, cy) {
    const ctx = this.#gctx;
    for (const [lon, lat] of this.#dots) {
      const p = this.#projectToSphere(lon, lat);
      if (p.z < -0.05) continue;

      const px = cx + p.x * this.#sphereRadius;
      const py = cy - p.y * this.#sphereRadius;
      const depth = (p.z + 0.05) / 1.05;

      ctx.beginPath();
      ctx.arc(px, py, 0.9 + depth * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(73,217,199,${0.12 + depth * 0.65})`;
      ctx.fill();
    }
  }

  #drawPin(cx, cy) {
    const ctx = this.#gctx;
    const pin = this.#projectToSphere(WorldMapGlobe.#PIN.lon, WorldMapGlobe.#PIN.lat);
    const pinVisible = pin.z > 0.15;

    if (pinVisible) {
      const px = cx + pin.x * this.#sphereRadius;
      const py = cy - pin.y * this.#sphereRadius;
      const pulse = 3 + Math.sin(Date.now() / 260) * 1.4;

      ctx.beginPath();
      ctx.arc(px, py, pulse + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,180,84,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffb454';
      ctx.shadowColor = '#ffb454';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      this.#pinLabel.style.left = `${px}px`;
      this.#pinLabel.style.top = `${py}px`;
    }
    this.#pinLabel.classList.toggle('on', pinVisible);
  }

  #drawGlobe() {
    const ctx = this.#gctx;
    const cx = this.#canvasWidth / 2;
    const cy = this.#canvasHeight / 2;

    ctx.clearRect(0, 0, this.#canvasWidth, this.#canvasHeight);

    // sphere rim
    ctx.beginPath();
    ctx.arc(cx, cy, this.#sphereRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(73,217,199,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    this.#drawContinents(cx, cy);
    this.#drawPin(cx, cy);
  }

  #tick = () => {
    if (!this.#dragging) {
      if (this.#autoTarget !== null) {
        const diff = ((this.#autoTarget - this.#rotationDeg + 540) % 360) - 180;
        this.#rotationDeg += diff * 0.03;
        if (Math.abs(diff) < 0.3) this.#autoTarget = null;
      } else {
        this.#rotationDeg += Environment.reduceMotion ? 0 : 0.12;
      }
    }
    this.#drawGlobe();
    requestAnimationFrame(this.#tick);
  };

  // --- drag-to-spin, then auto-resume toward Sri Lanka ---
  #pointerDown(x) {
    this.#dragging = true;
    this.#lastPointerX = x;
    this.#autoTarget = null;
    clearTimeout(this.#resumeTimer);
  }

  #pointerMove(x) {
    if (!this.#dragging) return;
    this.#rotationDeg += (x - this.#lastPointerX) * 0.4;
    this.#lastPointerX = x;
  }

  #pointerUp = () => {
    if (!this.#dragging) return;
    this.#dragging = false;
    clearTimeout(this.#resumeTimer);
    this.#resumeTimer = setTimeout(() => {
      const target = -WorldMapGlobe.#PIN.lon; // rotation that brings the pin to front-center
      this.#autoTarget = ((target % 360) + 360) % 360;
    }, 1200);
  };
}


/* ---------------------------------------------------------------------
   12. COLOR TRANSFER KEYBOARD
   --------------------------------------------------------------------- */
class ColorTransferKeyboard {
  static #KEY_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];
  static #MAX_TRAIL_LENGTH = 60;
  static #TRAIL_APPEND_DELAY = 480;
  static #KEY_ACTIVE_DURATION = 320;

  #kbViz;
  #swatch;
  #hexOut;
  #charOut;
  #trail;
  #kbGlow;
  #keyEls = {};

  /**
   * @param {Object} ids - element ids for the widget's parts
   */
  constructor(ids = {}) {
    const {
      keyboardVizId = 'keyboardViz',
      swatchId = 'keySwatch',
      hexId = 'keyHex',
      charId = 'keyChar',
      trailId = 'colorTrail',
      glowId = 'kbGlow'
    } = ids;

    this.#kbViz = document.getElementById(keyboardVizId);
    this.#swatch = document.getElementById(swatchId);
    this.#hexOut = document.getElementById(hexId);
    this.#charOut = document.getElementById(charId);
    this.#trail = document.getElementById(trailId);
    this.#kbGlow = document.getElementById(glowId);
  }

  init() {
    if (!this.#kbViz || !this.#swatch || !this.#hexOut || !this.#charOut || !this.#trail) return;

    this.#buildKeyboard();

    window.addEventListener('keydown', (e) => {
      if (e.key.length === 1 && /[a-z0-9]/i.test(e.key)) this.#transferKeyToColor(e.key);
    });

    Object.entries(this.#keyEls).forEach(([label, keyEl]) => {
      keyEl.addEventListener('click', () => this.#transferKeyToColor(label, keyEl));
    });
  }

  /** Build the on-screen keyboard once. */
  #buildKeyboard() {
    ColorTransferKeyboard.#KEY_ROWS.forEach((row) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      row.forEach((label) => {
        const keyEl = document.createElement('div');
        keyEl.className = 'key';
        keyEl.textContent = label;
        keyEl.dataset.key = label;
        rowEl.appendChild(keyEl);
        this.#keyEls[label] = keyEl;
      });
      this.#kbViz.appendChild(rowEl);
    });
  }

  /** Deterministic char → hue mapping, so a given key always produces the same color. */
  static #hueForChar(ch) {
    const code = ch.toUpperCase().charCodeAt(0);
    return (code * 47) % 360;
  }

  static #hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  }

  /** A short-lived ripple ring inside the pressed key. */
  #spawnRipple(keyEl) {
    const ripple = document.createElement('span');
    ripple.className = 'key-ripple';
    keyEl.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  /** Animate the picked color flying from the key to the trail strip. */
  #spawnFlyingOrb(fromEl, color, cardEl) {
    if (Environment.reduceMotion || !fromEl || !cardEl) return;

    const cardRect = cardEl.getBoundingClientRect();
    const startRect = fromEl.getBoundingClientRect();
    const endRect = this.#trail.getBoundingClientRect();

    const startX = startRect.left + startRect.width / 2 - cardRect.left;
    const startY = startRect.top + startRect.height / 2 - cardRect.top;
    const endX = Math.min(endRect.left + endRect.width + 6, cardRect.right - 12) - cardRect.left;
    const endY = (endRect.top + Math.min(endRect.height, 10) / 2 - cardRect.top) ||
      (endRect.top - cardRect.top + 8);
    const midX = (startX + endX) / 2 + (Math.random() * 30 - 15);
    const midY = Math.min(startY, endY) - 46;

    const orb = document.createElement('div');
    orb.className = 'flying-orb';
    orb.style.background = color;
    orb.style.color = color;
    orb.style.left = `${startX}px`;
    orb.style.top = `${startY}px`;
    cardEl.appendChild(orb);

    const animation = orb.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0 },
      { transform: `translate(${midX - startX}px, ${midY - startY}px) translate(-50%,-50%) scale(0.75)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${endX - startX}px, ${endY - startY}px) translate(-50%,-50%) scale(0.25)`, opacity: 0.15, offset: 1 }
    ], { duration: 560, easing: 'cubic-bezier(.3,.7,.4,1)' });

    animation.onfinish = () => orb.remove();
  }

  /** Briefly wash the whole card with the pressed key's color. */
  #pulseGlow(color) {
    if (!this.#kbGlow) return;
    this.#kbGlow.style.background = `radial-gradient(circle at 50% 20%, ${color}55, transparent 65%)`;
    this.#kbGlow.animate(
      [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }],
      { duration: 450, easing: 'ease-out' }
    );
  }

  /** Restart a CSS animation on an element by toggling its class. */
  #flashText(el) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  #updateReadout(ch, color) {
    this.#swatch.style.background = color;
    this.#swatch.style.color = color;
    this.#swatch.style.animation = 'none';
    void this.#swatch.offsetWidth;
    this.#swatch.style.animation = '';

    this.#hexOut.textContent = color;
    this.#charOut.textContent = `"${ch}"`;
    this.#flashText(this.#hexOut);
    this.#flashText(this.#charOut);
  }

  #applyKeyFeedback(keyEl, color) {
    if (!keyEl) return;
    keyEl.style.background = color;
    keyEl.classList.remove('active');
    void keyEl.offsetWidth;
    keyEl.classList.add('active');
    keyEl.style.boxShadow = `0 0 14px ${color}aa`;
    this.#spawnRipple(keyEl);
    setTimeout(() => {
      keyEl.classList.remove('active');
      keyEl.style.background = '';
      keyEl.style.boxShadow = '';
    }, ColorTransferKeyboard.#KEY_ACTIVE_DURATION);
  }

  #appendToTrail(color) {
    setTimeout(() => {
      const swatchEl = document.createElement('div');
      swatchEl.className = 'trail-swatch';
      swatchEl.style.background = color;
      swatchEl.style.color = color;
      this.#trail.appendChild(swatchEl);
      while (this.#trail.children.length > ColorTransferKeyboard.#MAX_TRAIL_LENGTH) {
        this.#trail.removeChild(this.#trail.firstChild);
      }
    }, Environment.reduceMotion ? 0 : ColorTransferKeyboard.#TRAIL_APPEND_DELAY);
  }

  /** Core effect: map a character to a color and animate it through the widget. */
  #transferKeyToColor(ch, sourceEl) {
    const key = ch.toUpperCase();
    const color = ColorTransferKeyboard.#hslToHex(ColorTransferKeyboard.#hueForChar(key), 70, 58);
    const keyEl = sourceEl || this.#keyEls[key];
    const cardEl = this.#kbViz.closest('.lab-card');

    this.#updateReadout(ch, color);
    this.#pulseGlow(color);
    this.#spawnFlyingOrb(keyEl, color, cardEl);
    this.#applyKeyFeedback(keyEl, color);
    this.#appendToTrail(color);
  }
}


/* ---------------------------------------------------------------------
   13. SCROLL PROGRESS BAR
   --------------------------------------------------------------------- */
class ScrollProgress {
  #bar;

  constructor(elementId = 'scrollProgress') {
    this.#bar = document.getElementById(elementId);
  }

  init() {
    if (!this.#bar) return;
    window.addEventListener('scroll', this.#update, { passive: true });
    this.#update();
  }

  #update = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
    this.#bar.style.width = `${pct}%`;
  };
}


/* ---------------------------------------------------------------------
   14. BACK-TO-TOP BUTTON
   --------------------------------------------------------------------- */
class BackToTop {
  static #SHOW_AFTER_PX = 480;

  #button;

  constructor(elementId = 'backToTop') {
    this.#button = document.getElementById(elementId);
  }

  init() {
    if (!this.#button) return;
    window.addEventListener('scroll', this.#update, { passive: true });
    this.#button.addEventListener('click', this.#scrollToTop);
    this.#update();
  }

  #update = () => {
    this.#button.classList.toggle('show', window.scrollY > BackToTop.#SHOW_AFTER_PX);
  };

  #scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: Environment.reduceMotion ? 'auto' : 'smooth' });
  };
}


/* ---------------------------------------------------------------------
   15. INTERACTIVE TERMINAL — mini command-line lab experiment
   --------------------------------------------------------------------- */
class InteractiveTerminal {
  #output;
  #input;
  #history = [];
  #historyIndex = -1;

  #commands = {
    help: () => [
      'available commands:',
      '  whoami       — who runs this site',
      '  about        — a short bio',
      '  skills       — languages & frameworks',
      '  projects     — selected work',
      '  experience   — what I\'m building now',
      '  education    — background',
      '  contact      — how to reach me',
      '  ls           — list this page as files',
      '  sudo hire-me — you know you want to',
      '  clear        — clear the screen'
    ],
    whoami: () => ['Kirawnsan K — Junior Full-Stack Developer, Batticaloa, Sri Lanka.'],
    about: () => [
      'Full-stack dev bridging backend logic and clean UI — React/Node.js,',
      'C#/.NET, Python, Java. Currently seeking full-stack internships and',
      'junior roles, with a growing interest in cybersecurity research.'
    ],
    skills: () => [
      'languages   : JavaScript, C#, Python, Java, PHP',
      'frameworks  : .NET, React, Node.js',
      'also        : database design, computer network operations'
    ],
    projects: () => [
      '01 Ransomware Impact & Patch Management Research  [RESEARCH]',
      '02 Clothing E-Commerce Platform                   [SHIPPED]',
      '03 Food Ordering System (React + Node.js)          [SHIPPED]',
      '04 C#/.NET Pre-Booking Application                 [SHIPPED]'
    ],
    experience: () => ['Undergraduate Student, ESOFT UNI — Jan 2025 to Jul 2026, hybrid.'],
    education: () => ['Pearson BTEC HND in Computing — ESOFT Metro Campus (in progress).'],
    contact: () => ['→ linkedin.com/in/kirawnsan-k-a34030354  (see the buttons below too)'],
    ls: () => ['about.md  experience.log  skills.json  projects/  education.txt  contact.sh'],
    date: () => [new Date().toString()],
    'sudo hire-me': () => ['permission granted. opening linkedin…'],
    clear: () => null
  };

  constructor(outputId = 'termOutput', inputId = 'termInput') {
    this.#output = document.getElementById(outputId);
    this.#input = document.getElementById(inputId);
  }

  init() {
    if (!this.#output || !this.#input) return;
    this.#printWelcome();
    this.#input.addEventListener('keydown', this.#handleKeydown);
  }

  #printWelcome() {
    this.#printLine("welcome. type 'help' to see what's here.", 'out');
  }

  #printLine(text, kind = 'out') {
    const line = document.createElement('div');
    line.className = `line ${kind}`;
    line.textContent = text;
    this.#output.appendChild(line);
    this.#output.scrollTop = this.#output.scrollHeight;
  }

  #handleKeydown = (e) => {
    if (e.key === 'Enter') {
      const raw = this.#input.value.trim();
      this.#input.value = '';
      if (!raw) return;
      this.#history.push(raw);
      this.#historyIndex = this.#history.length;
      this.#runCommand(raw);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.#historyIndex > 0) {
        this.#historyIndex--;
        this.#input.value = this.#history[this.#historyIndex];
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.#historyIndex < this.#history.length - 1) {
        this.#historyIndex++;
        this.#input.value = this.#history[this.#historyIndex];
      } else {
        this.#historyIndex = this.#history.length;
        this.#input.value = '';
      }
    }
  };

  #runCommand(raw) {
    this.#printLine(raw, 'cmd');
    const key = raw.toLowerCase();

    if (key === 'clear') {
      this.#output.innerHTML = '';
      return;
    }

    const handler = this.#commands[key];
    if (!handler) {
      this.#printLine(`command not found: ${raw} — type 'help'`, 'err');
      return;
    }

    const lines = handler();
    if (lines) lines.forEach((l) => this.#printLine(l, 'out'));

    if (key === 'sudo hire-me') {
      setTimeout(() => {
        window.open('https://www.linkedin.com/in/kirawnsan-k-a34030354', '_blank', 'noopener');
      }, 700);
    }
  }
}


/* ---------------------------------------------------------------------
   16. BOOTSTRAP — composition root
   --------------------------------------------------------------------- */
class PortfolioApp {
  #features;

  constructor() {
    this.#features = [
      new TypingEffect(),
      new ScrollReveal(),
      new MobileNav(),
      new SkillOrbit('orbit', ['JavaScript', 'C#', 'Python', 'Java', 'PHP'], 150),
      new SkillOrbit('orbitInner', ['React', 'Node.js', '.NET', 'Database', 'Networking'], 95),
      new CubeBurst(),
      new NeuralNetBackground(),
      new CustomCursor(),
      new HeroInteractions(),
      new ProjectTilt(),
      new WorldMapGlobe(),
      new WorldMapGlobe('heroGlobeWrap', 'heroGlobeCanvas', 'heroGlobePinLabel'),
      new ColorTransferKeyboard(),
      new ScrollProgress(),
      new BackToTop(),
      new InteractiveTerminal()
    ];
  }

  init() {
    this.#features.forEach((feature) => feature.init());
  }
}

function bootstrap() {
  new PortfolioApp().init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
