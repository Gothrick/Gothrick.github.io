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

// Pill colors by technology: [hue, saturation]. Unknown names fall back to navy.
// To add one, write its name in lowercase, e.g. "svelte": [14, 70].
const TECH_COLORS = {
  "react": [150, 45], "vue": [150, 45], "node.js": [120, 40], "mongodb": [130, 45], "android": [100, 45],
  "java": [24, 75], "html": [16, 75], "swift": [24, 75], "git": [8, 65], "angular": [0, 60],
  "python": [46, 80], "javascript": [48, 85], "firebase": [40, 85],
  "typescript": [212, 55], "css": [212, 55], "c": [212, 55], "c++": [212, 55], "docker": [205, 60],
  "postgresql": [220, 45], "mysql": [200, 50], "sql": [190, 45], "sqlite": [195, 40],
  "pytest": [200, 40], "blockchain": [35, 65], "ecdsa": [300, 35], "http": [175, 45], ".net 8": [262, 50], "tcp": [200, 40], "xunit": [140, 35], "react native": [200, 60], "graphql": [320, 60], "expo": [230, 15], "vite": [262, 70], "tailwind css": [190, 65], "laravel": [5, 65], "asp.net": [265, 40], "bootstrap": [262, 45], "electron": [185, 40], "mariadb": [30, 35], "tls": [215, 15],
  "c#": [270, 40], "kotlin": [270, 45], "php": [245, 35],
  "flask": [30, 12], "next.js": [30, 8], "go": [185, 55], "rust": [20, 40]
};

const pills = (list) => {
  const ul = el("ul", "pills");
  (list || []).forEach((name) => {
    const li = el("li", "", name);
    const color = TECH_COLORS[name.toLowerCase()];
    if (color) {
      li.style.setProperty("--pill-bg", `hsl(${color[0]} ${color[1]}% 87%)`);
      li.style.setProperty("--pill-fg", `hsl(${color[0]} ${color[1]}% 24%)`);
    }
    ul.append(li);
  });
  return ul;
};

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

let animateCards = true;
const io = "IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches
  ? new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 })
  : null;

function renderCard(project, index) {
  const card = el("article", "card reveal");
  const shot = project.image ? imageShot(project.image, project.title) : placeholderShot();

  const body = el("div", "card-body");
  const meta = el("div", "card-meta");
  const updated = el("span", "muted", dateText(index));
  updated.dataset.updated = index;
  meta.append(el("span", "num", pad(index)), updated);

  const title = el("h3");
  const open = el("button", "card-open", t(project.title));
  open.type = "button";
  open.addEventListener("click", () => openProject(index));
  title.append(open);

  const foot = el("div", "card-foot");
  foot.append(el("span", "more", s("viewDetails")));
  if (project.code) foot.append(link(project.code, s("code"), "ext"));
  else if (project.note) foot.append(el("span", "ext", s("privateRepo")));

  body.append(meta, title, el("p", "card-desc", t(project.description) || ""), pills(project.tech), foot);
  card.append(shot, body);

  if (io && animateCards) io.observe(card);
  else card.classList.add("visible");
  return card;
}

const grid = document.getElementById("project-grid");

function renderGrid() {
  grid.replaceChildren(...ALL_PROJECTS.map(renderCard));
  animateCards = false;
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

function renderDetail(index) {
  const p = ALL_PROJECTS[index];
  const wrap = el("div", "detail-inner");

  const head = el("div", "detail-head");
  head.append(el("span", "num big", pad(index)));
  const titleWrap = el("div");
  const h = el("h2", "", t(p.title));
  h.id = "detail-title";
  titleWrap.append(h, el("span", "muted", dateText(index)));
  head.append(titleWrap);
  wrap.append(head, pills(p.tech));

  const actions = el("div", "actions");
  if (p.code) actions.append(link(p.code, s("viewCode"), "btn btn-solid"));
  if (p.live) actions.append(link(p.live, s("liveDemo"), "btn"));
  if (!p.code && p.note) actions.append(el("span", "muted", t(p.note)));
  if (actions.children.length) wrap.append(actions);

  const shots = p.images && p.images.length ? p.images : p.image ? [p.image] : [];
  const gallery = el("div", "gallery");
  if (shots.length) shots.forEach((src) => gallery.append(imageShot(src, t(p.title))));
  else gallery.append(placeholderShot());
  wrap.append(gallery);

  const details = t(p.details);
  const paragraphs = details && details.length ? details : [t(p.description) || ""];
  const text = el("div", "detail-text");
  paragraphs.forEach((para) => text.append(el("p", "", para)));
  wrap.append(text);

  const highlights = t(p.highlights);
  if (highlights && highlights.length) {
    wrap.append(el("h3", "sub", s("highlights")));
    const ul = el("ul", "highlights");
    highlights.forEach((h) => ul.append(el("li", "", h)));
    wrap.append(ul);
  }

  const nav = el("div", "detail-nav");
  const step = (delta, label) => {
    const target = (index + delta + ALL_PROJECTS.length) % ALL_PROJECTS.length;
    const b = el("button", "btn", label);
    b.type = "button";
    b.addEventListener("click", () => openProject(target));
    return b;
  };
  if (ALL_PROJECTS.length > 1) nav.append(step(-1, s("prev")), step(1, s("next")));
  wrap.append(nav);

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

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = s(n.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((n) => { n.innerHTML = s(n.dataset.i18nHtml); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  document.getElementById("detail-close").setAttribute("aria-label", s("close"));
  renderGrid();
  if (dialog.open && current >= 0) renderDetail(current);
}

document.querySelectorAll("[data-lang]").forEach((b) =>
  b.addEventListener("click", () => {
    lang = b.dataset.lang;
    try { localStorage.setItem("lang", lang); } catch (e) {}
    applyLang();
  })
);

const skills = document.getElementById("skills");
SKILLS.forEach((name) => skills.append(el("li", "", name)));
document.getElementById("year").textContent = new Date().getFullYear();

applyLang();
syncFromHash();
