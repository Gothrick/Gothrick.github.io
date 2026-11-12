const storedLang = () => {
  try { const v = localStorage.getItem("lang"); if (v === "en" || v === "fr") return v; } catch (e) {}
  return null;
};
let lang = storedLang() || ((navigator.language || "en").toLowerCase().startsWith("fr") ? "fr" : "en");

const s = (key) => STRINGS[lang][key];
// Hand-written cards first, then the cards built automatically from public GitHub repos.
const ALL_PROJECTS = [...PROJECTS, ...(typeof AUTO_PROJECTS !== "undefined" ? AUTO_PROJECTS : [])];
// A project field can be plain text or { en: "...", fr: "..." }.
const t = (v) => (v && typeof v === "object" && !Array.isArray(v) ? (v[lang] ?? v.en ?? "") : v);

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

const link = (href, label, className) => {
  const a = el("a", className || "", label);
  a.href = href;
  a.rel = "noopener";
  return a;
};

const pad = (i) => String(i + 1).padStart(2, "0");

// Pill colors by technology: [hue, saturation], shown as the bar on the left of each pill.
// To add one, write its name in lowercase, e.g. "svelte": [14, 70].
const TECH_COLORS = {
  "react": [190, 70], "vue": [150, 45], "node.js": [120, 40], "mongodb": [130, 45], "android": [100, 45],
  "java": [24, 75], "html": [16, 75], "swift": [24, 75], "git": [12, 75], "angular": [0, 60],
  "python": [212, 60], "javascript": [48, 85], "firebase": [40, 85],
  "typescript": [212, 55], "css": [212, 55], "c": [212, 55], "c++": [212, 55], "docker": [205, 70],
  "postgresql": [220, 45], "mysql": [200, 50], "sql": [190, 45], "sqlite": [195, 40],
  "pytest": [195, 60], "blockchain": [38, 80], "ecdsa": [300, 45], "http": [170, 55], ".net 8": [262, 50], "tcp": [200, 40], "xunit": [140, 40], "react native": [200, 70], "graphql": [320, 65], "expo": [230, 15], "vite": [262, 70], "tailwind css": [190, 65], "laravel": [5, 70], "asp.net": [265, 40], "bootstrap": [262, 45], "electron": [185, 40], "mariadb": [30, 35], "tls": [215, 15],
  "c#": [270, 50], "kotlin": [270, 45], "php": [245, 45],
  "flask": [30, 12], "next.js": [30, 8], "go": [185, 55], "rust": [20, 40]
};

// `max` limits how many pills are shown (cards); the rest become a "+N" pill.
const pills = (list, max) => {
  const ul = el("ul", "pills");
  const all = list || [];
  const shown = max ? all.slice(0, max) : all;
  shown.forEach((name) => {
    const li = el("li", "", name);
    const color = TECH_COLORS[name.toLowerCase()];
    if (color) li.style.setProperty("--bar", `hsl(${color[0]} ${color[1]}% 52%)`);
    ul.append(li);
  });
  if (all.length > shown.length) ul.append(el("li", "more", `+${all.length - shown.length}`));
  return ul;
};

// A number in the segment-display font, with every segment faintly lit behind it.
const seg = (value, minDigits) => {
  const text = String(value).padStart(minDigits || 2, "0");
  const node = el("span", "seg", text);
  node.dataset.ghost = text.replace(/\d/g, "8");
  return node;
};

// Count a segment number up from zero the first time it scrolls into view.
function countUp(node) {
  const target = Number(node.dataset.target ?? node.textContent);
  const width = node.textContent.length;
  if (reducedMotion || !Number.isFinite(target) || target === 0) return;
  const start = performance.now();
  const duration = 900;
  const frame = (now) => {
    const p = Math.min(1, (now - start) / duration);
    node.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3)))).padStart(width, "0");
    if (p < 1) requestAnimationFrame(frame);
  };
  node.textContent = "0".padStart(width, "0");
  requestAnimationFrame(frame);
}
const counted = new WeakSet();
const countObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !counted.has(e.target)) { counted.add(e.target); countUp(e.target); countObserver.unobserve(e.target); }
      });
    }, { threshold: 0.6 })
  : null;
let animateNumbers = true;
const watch = (node) => { if (countObserver && animateNumbers) countObserver.observe(node); return node; };

// The one number that sells a project, with plain words saying what it counts.
function statLine(project, className) {
  if (!project.stat) return null;
  const line = el("div", className);
  line.append(watch(seg(project.stat.value, 2)), el("span", "what", t(project.stat.label)));
  return line;
}

const pushedAt = {};
const dateText = (index) =>
  pushedAt[index]
    ? `${s("updated")} ${new Date(pushedAt[index]).toLocaleDateString(lang, { month: "short", year: "numeric" })}`
    : t(ALL_PROJECTS[index].updated) || "";

function placeholderShot() {
  return el("div", "shot", s("screenshot"));
}

function imageShot(src, title) {
  const shot = el("div", "shot");
  const img = el("img");
  img.src = src;
  img.alt = title;
  img.loading = "lazy";
  shot.append(img);
  return shot;
}

function renderCard(project, index) {
  const card = el("article", "card");
  const shot = project.image ? imageShot(project.image, project.title) : placeholderShot();

  const body = el("div", "card-body");
  const top = el("div", "card-top");
  const title = el("h3");
  const open = el("button", "card-open", t(project.title));
  open.type = "button";
  // event.detail is 0 for a keyboard "click" and 1 or more for a mouse or touch one.
  open.addEventListener("click", (event) => { openedByPointer = event.detail > 0; openProject(index); });
  title.append(open);
  const num = el("span", "idx", pad(index));
  num.setAttribute("aria-hidden", "true");
  top.append(title, num);

  const foot = el("div", "card-foot");
  foot.append(el("span", "", s("viewDetails")));
  if (project.code) foot.append(link(project.code, s("code"), "ext"));
  else if (project.note) foot.append(el("span", "muted", s("privateRepo")));

  // The number sits inside the card, between the description and the pills, so it is
  // clear which project it belongs to.
  const readout = statLine(project, "readout") || el("div", "readout empty");
  body.append(top, el("p", "card-desc", t(project.description) || ""), readout, pills(project.tech, 3), foot);
  card.append(shot, body);
  return card;
}

const grid = document.getElementById("project-grid");

function renderGrid() {
  grid.replaceChildren(...ALL_PROJECTS.map(renderCard));
  const n = ALL_PROJECTS.length;
  document.getElementById("projects-count").textContent = `${n} ${n === 1 ? s("projectOne") : s("projectMany")}`;
}

ALL_PROJECTS.forEach((p, i) => {
  if (!p.repo) return;
  fetch(`https://api.github.com/repos/${p.repo}`)
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      pushedAt[i] = data.pushed_at;
      document.querySelectorAll(`[data-updated="${i}"]`).forEach((n) => { n.textContent = dateText(i); });
    })
    .catch(() => {});
});

const dialog = document.getElementById("detail");
const detailBody = document.getElementById("detail-body");
let current = -1;
let openedByPointer = false;

function renderDetail(index) {
  const p = ALL_PROJECTS[index];
  const wrap = el("div", "detail-inner");

  const head = el("div", "detail-head");
  const num = el("span", "idx", pad(index));
  num.setAttribute("aria-hidden", "true");
  const h = el("h2", "", t(p.title));
  h.id = "detail-title";
  head.append(num, h);

  // Facts pane: on a phone it sits right under the title, before the long text.
  const aside = el("aside", "aside dark");
  const row = (label, content) => {
    const r = el("div", "row");
    r.append(el("div", "label", label), content);
    return r;
  };
  if (p.tech && p.tech.length) aside.append(row(s("factStack"), pills(p.tech)));
  if (p.role) aside.append(row(s("factRole"), el("div", "", t(p.role))));
  const when = el("div", "", dateText(index));
  when.dataset.updated = index;
  if (when.textContent) aside.append(row(s("factDate"), when));
  const proof = statLine(p, "proof");
  if (proof) aside.append(row(s("factNumber"), proof));
  const actions = el("div", "actions");
  if (p.code) actions.append(link(p.code, s("viewCode"), "btn btn-glow"));
  if (p.live) actions.append(link(p.live, s("liveDemo"), "btn"));
  if (!p.code && p.note) actions.append(el("span", "", t(p.note)));
  if (actions.children.length) aside.append(actions);

  const main = el("div", "detail-main");
  const details = t(p.details);
  const paragraphs = details && details.length ? details : [t(p.description) || ""];
  const text = el("div", "detail-text");
  paragraphs.forEach((para) => text.append(el("p", "", para)));
  main.append(text);

  const highlights = t(p.highlights);
  if (highlights && highlights.length) {
    main.append(el("h3", "sub", s("highlights")));
    const ul = el("ul", "highlights");
    highlights.forEach((item) => ul.append(el("li", "", item)));
    main.append(ul);
  }

  const shots = p.images && p.images.length ? p.images : p.image ? [p.image] : [];
  const gallery = el("div", "gallery");
  if (shots.length) shots.forEach((src) => gallery.append(imageShot(src, t(p.title))));
  else gallery.append(placeholderShot());
  main.append(gallery);

  const nav = el("div", "detail-nav");
  const step = (delta, label) => {
    const target = (index + delta + ALL_PROJECTS.length) % ALL_PROJECTS.length;
    const b = el("button", "btn", label);
    b.type = "button";
    b.addEventListener("click", () => openProject(target));
    return b;
  };
  if (ALL_PROJECTS.length > 1) nav.append(step(-1, s("prev")), step(1, s("next")));
  main.append(nav);

  wrap.append(head, aside, main);
  detailBody.replaceChildren(wrap);
  dialog.scrollTop = 0;
  detailBody.scrollTop = 0;
}

function openProject(index) {
  current = index;
  renderDetail(index);
  if (!dialog.open) dialog.showModal();
  history.replaceState(null, "", `#project-${index + 1}`);
}

dialog.addEventListener("close", () => {
  // The browser hands focus back to the card. After a mouse click that would leave it
  // looking selected, so let go of it; keyboard users keep their place.
  if (openedByPointer && document.activeElement) document.activeElement.blur();
  openedByPointer = false;
  if (location.hash.startsWith("#project-")) history.replaceState(null, "", location.pathname + location.search);
});
document.getElementById("detail-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

function syncFromHash() {
  const m = location.hash.match(/^#project-(\d+)$/);
  const i = m ? Number(m[1]) - 1 : -1;
  if (i >= 0 && i < ALL_PROJECTS.length) openProject(i);
  else if (dialog.open) dialog.close();
}
window.addEventListener("hashchange", syncFromHash);

function renderSkills() {
  const list = document.getElementById("skills");
  list.replaceChildren(...SKILL_GROUPS.map((group) => {
    const row = el("div");
    row.append(el("dt", "", t(group.label)), el("dd", "", group.items.join(", ")));
    return row;
  }));
}

// Hero numbers. The internship start date is set in i18n.js (INTERNSHIP_START).
function setNumber(id, value, digits) {
  const node = document.getElementById(id);
  const text = String(value).padStart(digits, "0");
  node.textContent = text;
  node.dataset.ghost = text.replace(/\d/g, "8");
  node.dataset.target = value;
}
function renderHeroNumbers() {
  const days = Math.max(0, Math.ceil((new Date(INTERNSHIP_START) - new Date()) / 86400000));
  setNumber("stat-days", days, 3);
  setNumber("stat-projects", ALL_PROJECTS.length, 2);
}

// Footer clock: the time in Québec. Without motion it shows hours and minutes only.
const clock = document.getElementById("clock");
function tick() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).format(new Date());
  const text = reducedMotion ? parts.slice(0, 5) : parts;
  clock.textContent = text;
  clock.dataset.ghost = text.replace(/\d/g, "8");
}

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = s(n.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((n) => { n.innerHTML = s(n.dataset.i18nHtml); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  document.getElementById("detail-close").setAttribute("aria-label", s("close"));
  renderGrid();
  renderSkills();
  if (dialog.open && current >= 0) renderDetail(current);
  animateNumbers = false; // count up once, not again on every language switch
}

document.querySelectorAll("[data-lang]").forEach((b) =>
  b.addEventListener("click", () => {
    lang = b.dataset.lang;
    try { localStorage.setItem("lang", lang); } catch (e) {}
    applyLang();
  })
);

document.getElementById("year").textContent = new Date().getFullYear();
const modified = new Date(document.lastModified);
document.getElementById("site-updated").textContent =
  `${String(modified.getMonth() + 1).padStart(2, "0")}.${modified.getFullYear()}`;

renderHeroNumbers();
["stat-days", "stat-projects"].forEach((id) => countUp(document.getElementById(id)));
tick();
setInterval(tick, reducedMotion ? 30000 : 1000);

applyLang();
syncFromHash();
