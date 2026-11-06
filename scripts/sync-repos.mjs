// Builds auto-projects.js from the owner's PUBLIC GitHub repositories.
//
// - Every public, non-fork, non-archived repo gets a basic card, unless:
//     * it already has a hand-written card in projects.js (matched by its `code` link),
//     * it is the site's own repo or the profile repo,
//     * it has the GitHub topic `no-portfolio`.
// - The card is filled from GitHub: description, languages, topics, homepage, README text,
//   and screenshots found in docs/screenshots/.
//
// Usage: node scripts/sync-repos.mjs        (set GITHUB_TOKEN for a higher API rate limit)
// Environment: GITHUB_OWNER (default "Gothrick"), SITE_REPO (default "<owner>.github.io")

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OWNER = process.env.GITHUB_OWNER || 'Gothrick';
const SITE_REPO = (process.env.SITE_REPO || `${OWNER}.github.io`).toLowerCase();
const TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'portfolio-sync',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function api(path, accept) {
  const response = await fetch('https://api.github.com' + path, {
    headers: accept ? { ...headers, Accept: accept } : headers,
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub API ${path} answered ${response.status}`);
  return accept ? response.text() : response.json();
}

// Repos that already have a curated card: their `code` link points at github.com/<owner>/<name>.
function curatedRepoNames() {
  const source = readFileSync(join(root, 'projects.js'), 'utf8');
  const pattern = new RegExp(`github\\.com/${OWNER}/([A-Za-z0-9._-]+)`, 'gi');
  return new Set([...source.matchAll(pattern)].map((m) => m[1].toLowerCase().replace(/\.git$/, '')));
}

// Turns README markdown into a list of clean plain-text paragraphs.
function readmeParagraphs(markdown) {
  if (!markdown) return [];
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, '').replace(/<!--[\s\S]*?-->/g, '');
  return withoutCode
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    // Keep prose only: skip headings, tables, quotes, lists, badges, and raw HTML.
    .filter((block) => block && !/^[#|>\-*+`<!]/.test(block) && !/^\d+\./.test(block) && !/^\[[^\]]+\]:/.test(block))
    .map((block) =>
      block
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/[*_`]/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((text) => text.length >= 40);
}

const humanize = (name) => name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
const shorten = (text, max) => (text.length <= max ? text : text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…');

async function buildCard(repo) {
  const [languages, readme, shots] = await Promise.all([
    api(`/repos/${OWNER}/${repo.name}/languages`),
    api(`/repos/${OWNER}/${repo.name}/readme`, 'application/vnd.github.raw'),
    api(`/repos/${OWNER}/${repo.name}/contents/docs/screenshots`),
  ]);

  const paragraphs = readmeParagraphs(readme);
  const topLanguages = Object.entries(languages ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, 3);
  const topics = (repo.topics ?? [])
    .filter((topic) => !topLanguages.some((l) => l.toLowerCase() === topic.toLowerCase()))
    .slice(0, 3);

  const images = (Array.isArray(shots) ? shots : [])
    .filter((file) => file.type === 'file' && /\.(png|jpe?g|webp|gif)$/i.test(file.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((file) => file.download_url)
    .slice(0, 6);

  const description = repo.description || (paragraphs[0] ? shorten(paragraphs[0], 140) : 'No description yet.');

  return {
    title: humanize(repo.name),
    description: shorten(description, 140),
    tech: [...topLanguages, ...topics],
    // Fallback: the preview card GitHub generates for any repository.
    image: images[0] ?? `https://opengraph.githubassets.com/1/${OWNER}/${repo.name}`,
    code: repo.html_url,
    live: repo.homepage || '',
    repo: `${OWNER}/${repo.name}`,
    updated: String(new Date(repo.pushed_at).getFullYear()),
    details: paragraphs.length ? paragraphs.slice(0, 3) : [description],
    highlights: [],
    images,
  };
}

async function listRepos() {
  const all = [];
  for (let page = 1; ; page++) {
    const batch = await api(`/users/${OWNER}/repos?type=owner&per_page=100&sort=pushed&page=${page}`);
    all.push(...batch);
    if (batch.length < 100) return all;
  }
}

const curated = curatedRepoNames();
const repos = (await listRepos()).filter(
  (repo) =>
    !repo.fork &&
    !repo.archived &&
    !repo.disabled &&
    !repo.private &&
    repo.name.toLowerCase() !== SITE_REPO &&
    repo.name.toLowerCase() !== OWNER.toLowerCase() &&
    !(repo.topics ?? []).includes('no-portfolio') &&
    !curated.has(repo.name.toLowerCase()),
);

const cards = [];
for (const repo of repos) cards.push(await buildCard(repo));

const output =
  '// Generated by scripts/sync-repos.mjs from the public GitHub repositories. Do not edit by hand.\n' +
  `const AUTO_PROJECTS = ${JSON.stringify(cards, null, 2)};\n`;
writeFileSync(join(root, 'auto-projects.js'), output);

console.log(`Owner ${OWNER}: ${repos.length} automatic card(s), ${curated.size} curated repo(s) skipped.`);
for (const card of cards) console.log(` - ${card.repo}: ${card.tech.join(', ') || 'no languages'}`);
