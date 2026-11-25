// Page behaviour: language, the project tabs, skills, counters and the clock. Text is in i18n.js, projects in projects.js.

Object.assign(STRINGS.en, {
  heroFact1: "Internship, spring 2027",
  heroFact2: "Full-time developer after",
  heroFact3: "Web, desktop, mobile"
});
Object.assign(STRINGS.fr, {
  heroFact1: "Stage, printemps 2027",
  heroFact2: "Développeur à temps plein ensuite",
  heroFact3: "Web, bureau, mobile"
});

const storedLang = () => {
  try { const v = localStorage.getItem("lang"); if (v === "en" || v === "fr") return v; } catch (e) {}
  return null;
};
let lang = storedLang() || ((navigator.language || "en").toLowerCase().startsWith("fr") ? "fr" : "en");
const s = (key) => STRINGS[lang][key];
const t = (v) => (v && typeof v === "object" && !Array.isArray(v) ? (v[lang] ?? v.en ?? "") : v);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Hand-written cards first, then the cards built automatically from public GitHub repos.
const PROJECT_LIST = [...PROJECTS, ...(typeof AUTO_PROJECTS !== "undefined" ? AUTO_PROJECTS : [])];
const imgSrc = (src) => src;

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};
const link = (href, label, className) => { const a = el("a", className || "", label); a.href = href; a.rel = "noopener"; return a; };
const pad = (i) => String(i + 1).padStart(2, "0");

const TECH_COLORS = {
  "react": [190, 70], "vue": [150, 45], "node.js": [120, 40], "java": [24, 75], "html": [16, 75], "git": [12, 75],
  "python": [212, 60], "javascript": [48, 85], "typescript": [212, 55], "css": [212, 55], "c": [212, 55], "c++": [212, 55],
  "docker": [205, 70], "postgresql": [220, 45], "mysql": [200, 50], "sql": [190, 45], "sqlite": [195, 40],
  "pytest": [195, 60], "blockchain": [38, 80], "ecdsa": [300, 45], "http": [170, 55], ".net 8": [262, 50], "tcp": [200, 40],
  "xunit": [140, 40], "react native": [200, 70], "graphql": [320, 65], "expo": [230, 15], "vite": [262, 70],
  "tailwind css": [190, 65], "laravel": [5, 70], "asp.net": [265, 40], "electron": [185, 40], "tls": [215, 15],
  "c#": [270, 50], "php": [245, 45]
};
const pills = (list) => {
  const ul = el("ul", "pills");
  (list || []).forEach((name) => {
    const li = el("li", "", name);
    const color = TECH_COLORS[name.toLowerCase()];
    if (color) li.style.setProperty("--bar", `hsl(${color[0]} ${color[1]}% 58%)`);
    ul.append(li);
  });
  return ul;
};

// A number in the segment font, with every segment faintly lit behind it.
const seg = (value, digits) => {
  const text = String(value).padStart(digits || 2, "0");
  const node = el("span", "seg", text);
  node.dataset.ghost = text.replace(/\d/g, "8");
  node.dataset.target = value;
  return node;
};
function countUp(node) {
  const target = Number(node.dataset.target);
  const width = node.textContent.length;
  if (reducedMotion || !Number.isFinite(target) || target === 0) return;
  const start = performance.now(), duration = 800;
  const frame = (now) => {
    const p = Math.min(1, (now - start) / duration);
    node.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3)))).padStart(width, "0");
    if (p < 1) requestAnimationFrame(frame);
  };
  node.textContent = "".padStart(width, "0");
  requestAnimationFrame(frame);
}

const pushedAt = {};
const dateText = (i) =>
  pushedAt[i]
    ? `${s("updated")} ${new Date(pushedAt[i]).toLocaleDateString(lang, { month: "short", year: "numeric" })}`
    : t(PROJECT_LIST[i].updated) || "";

const tablist = document.getElementById("tablist");
const panel = document.getElementById("panel");
let current = 0;

function kindTag(p) {
  if (p.kind !== "solo" && p.kind !== "team") return null;
  return el("span", `kind ${p.kind}`, s(p.kind === "solo" ? "tagSolo" : "tagTeam"));
}

function renderTabs() {
  tablist.replaceChildren(...PROJECT_LIST.map((p, i) => {
    const tab = el("button", "tab");
    tab.type = "button"; tab.id = `tab-${i}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "panel");
    tab.setAttribute("aria-selected", String(i === current));
    tab.tabIndex = i === current ? 0 : -1;
    const idx = el("span", "idx", pad(i)); idx.setAttribute("aria-hidden", "true");
    tab.append(idx, el("span", "name", t(p.title)));
    const tag = kindTag(p); if (tag) tab.append(tag); else tab.append(el("span"));
    tab.addEventListener("click", () => select(i));
    return tab;
  }));
  panel.setAttribute("aria-labelledby", `tab-${current}`);
}

function renderPanel() {
  const p = PROJECT_LIST[current];
  const head = el("div", "panel-head");
  const titleWrap = el("div");
  const meta = [t(p.role), dateText(current)].filter(Boolean).join("  ·  ");
  titleWrap.append(el("h3", "", t(p.title)), el("div", "meta", meta));
  const headActions = el("div", "actions");
  if (p.code) headActions.append(link(p.code, s("viewCode"), "btn btn-main"));
  if (p.live) headActions.append(link(p.live, s("liveDemo"), "btn"));
  head.append(titleWrap, headActions);

  const shots = p.images && p.images.length ? p.images : p.image ? [p.image] : [];
  const main = el("div", "shot");
  const setMain = (i) => {
    main.replaceChildren();
    if (!shots.length) { main.textContent = s("screenshot"); return; }
    const img = el("img"); img.src = imgSrc(shots[i]); img.alt = `${t(p.title)} ${i + 1}`; main.append(img);
    thumbs.querySelectorAll(".thumb").forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
  };
  const thumbs = el("div", "thumbs");
  if (shots.length > 1) shots.forEach((src, i) => {
    const b = el("button", "thumb"); b.type = "button"; b.setAttribute("aria-label", `${t(p.title)} ${i + 1}`);
    const img = el("img"); img.src = imgSrc(src); img.alt = ""; img.loading = "lazy"; b.append(img);
    b.addEventListener("click", () => setMain(i));
    thumbs.append(b);
  });
  setMain(0);

  const left = el("div", "prose");
  const details = t(p.details);
  (details && details.length ? details : [t(p.description) || ""]).forEach((para) => left.append(el("p", "", para)));
  const highlights = t(p.highlights);
  if (highlights && highlights.length) {
    left.append(el("h4", "sub-h", s("highlights")));
    const ul = el("ul", "highlights");
    highlights.forEach((h) => ul.append(el("li", "", h)));
    left.append(ul);
  }

  const side = el("div", "side");
  const row = (label, content, cls) => { const r = el("div", "row " + (cls || "")); r.append(el("div", "label", label), content); return r; };
  if (p.stat) {
    const box = el("div"); const n = seg(p.stat.value, 2); box.append(n, el("div", "what", t(p.stat.label)));
    side.append(row(s("factNumber"), box, "stat"));
    countUp(n);
  }
  if (p.tech && p.tech.length) side.append(row(s("factStack"), pills(p.tech)));

  const cols = el("div", "panel-cols");
  cols.append(left, side);
  panel.replaceChildren(head, main, thumbs, cols);
}

function select(i, { focus = false, updateHash = true } = {}) {
  current = i;
  renderTabs(); renderPanel();
  if (focus) document.getElementById(`tab-${i}`).focus();
  if (updateHash) history.replaceState(null, "", `#project-${i + 1}`);
}
tablist.addEventListener("keydown", (e) => {
  const n = PROJECT_LIST.length;
  const next = { ArrowDown: (current + 1) % n, ArrowRight: (current + 1) % n, ArrowUp: (current + n - 1) % n, ArrowLeft: (current + n - 1) % n, Home: 0, End: n - 1 }[e.key];
  if (next === undefined) return;
  e.preventDefault(); select(next, { focus: true });
});

function syncFromHash() {
  const m = location.hash.match(/^#project-(\d+)$/);
  const i = m ? Number(m[1]) - 1 : -1;
  if (i >= 0 && i < PROJECT_LIST.length) { select(i, { updateHash: false }); document.getElementById("projects").scrollIntoView(); }
}
window.addEventListener("hashchange", syncFromHash);

PROJECT_LIST.forEach((p, i) => {
  if (!p.repo) return;
  fetch(`https://api.github.com/repos/${p.repo}`)
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => { pushedAt[i] = data.pushed_at; if (i === current) renderPanel(); })
    .catch(() => {});
});

function renderSkills() {
  document.getElementById("skills").replaceChildren(...SKILL_GROUPS.map((g) => {
    const row = el("div"); row.append(el("dt", "", t(g.label)), el("dd", "", g.items.join(", "))); return row;
  }));
}

function setNumber(id, value, digits) {
  const node = document.getElementById(id);
  const text = String(value).padStart(digits, "0");
  node.textContent = text; node.dataset.ghost = text.replace(/\d/g, "8"); node.dataset.target = value;
}
const clock = document.getElementById("clock");
function tick() {
  const text = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
  clock.textContent = reducedMotion ? text.slice(0, 5) : text;
  clock.dataset.ghost = clock.textContent.replace(/\d/g, "8");
}

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = s(n.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((n) => { n.innerHTML = s(n.dataset.i18nHtml); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  // The résumé comes in both languages: the link follows the language of the page.
  document.querySelectorAll("[data-resume]").forEach((a) => { a.href = lang === "fr" ? "resume.pdf" : "resume-en.pdf"; });
  const n = PROJECT_LIST.length;
  document.getElementById("projects-count").textContent = `${n} ${n === 1 ? s("projectOne") : s("projectMany")}`;
  renderTabs(); renderPanel(); renderSkills();
}
document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
  lang = b.dataset.lang;
  try { localStorage.setItem("lang", lang); } catch (e) {}
  applyLang();
}));

document.getElementById("year").textContent = new Date().getFullYear();
setNumber("stat-days", Math.max(0, Math.ceil((new Date(INTERNSHIP_START) - new Date()) / 86400000)), 3);
tick(); setInterval(tick, reducedMotion ? 30000 : 1000);
applyLang();
countUp(document.getElementById("stat-days"));
syncFromHash();

