const fs = require('fs');
const path = require('path');

const FEED_URL = 'https://gamemonetize.com/feed.php?format=0&num=50&page=1';
const OUT_DIR = 'dist';
const SITE_NAME = 'ArcadeGames';
const DOMAIN = 'admingamex1000.my.id';

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function baseStyles() {
  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #12141c; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
  .layout { display: flex; min-height: 100vh; }
  .sidebar { width: 64px; background: #1a1d29; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 22px; }
  .sidebar .icon { font-size: 18px; color: #8892b0; }
  @media (max-width: 700px) { .sidebar { display: none; } }
  .main { flex: 1; min-width: 0; }
  .topbar { background: linear-gradient(135deg, #7b2ff7, #4f8cff); padding: 20px 24px 30px; }
  .topbar-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 12px; }
  .logo { font-size: 22px; font-weight: 800; text-decoration:none; color:#fff; display: flex; align-items: center; gap: 8px; white-space: nowrap; }
  #searchBox { flex: 1; min-width: 200px; max-width: 600px; background: rgba(20,22,35,0.55); border: none; border-radius: 10px; padding: 12px 16px; color: #fff; font-size: 14px; outline: none; }
  main.content { max-width: 1300px; margin: 0 auto; padding: 24px; }
  #game-feed-container, .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }
  .game-card { background: #1a1d29; border-radius: 12px; overflow: hidden; text-decoration: none; color: #fff; display: block; border: 1px solid #262a38; }
  .thumb-wrap { position: relative; aspect-ratio: 1/1; background: #262a38; overflow: hidden; }
  .thumb-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .game-info { padding: 10px 12px; }
  .game-title { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .player-wrap { position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 10px; overflow: hidden; margin-bottom: 24px; }
  .player-wrap iframe { width: 100%; height: 100%; border: 0; }
  .back-link { color: #c7cbe6; text-decoration: none; font-size: 14px; }
  h1.game-h1 { font-size: 22px; margin: 16px 0; }
  h2.section-h2 { font-size: 16px; margin: 24px 0 12px; }
  footer { text-align: center; color: #5c6070; font-size: 12px; padding: 30px 20px; border-top: 1px solid #1a1d29; margin-top: 30px; }
  `;
}

function sidebarHtml() {
  return `<div class="sidebar">
    <div class="icon">🏠</div><div class="icon">⭐</div><div class="icon">🕹️</div>
    <div class="icon">🧩</div><div class="icon">🏁</div><div class="icon">🔥</div>
  </div>`;
}

function topbarHtml() {
  return `<div class="topbar">
    <div class="topbar-row">
      <a href="/" class="logo">🕹️ ${SITE_NAME}</a>
      <input type="text" id="searchBox" placeholder="Search" onkeyup="filterGames(this.value)">
    </div>
  </div>`;
}

function cardHtml(game, slug) {
  return `<a href="/game/${slug}/" class="game-card">
    <div class="thumb-wrap"><img src="${game.thumb}" alt="${game.title}" loading="lazy"></div>
    <div class="game-info"><div class="game-title">${game.title}</div></div>
  </a>`;
}

function pageShell(title, bodyContent, extraHead = '') {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
${extraHead}
<style>${baseStyles()}</style>
</head>
<body>
<div class="layout">
  ${sidebarHtml()}
  <div class="main">
    ${topbarHtml()}
    <main class="content">${bodyContent}</main>
    <footer>&copy; 2026 ${SITE_NAME}. Powered by GameMonetize.</footer>
  </div>
</div>
</body>
</html>`;
}

async function main() {
  console.log('Fetching feed...');
  const res = await fetch(FEED_URL);
  const games = await res.json();
  console.log(`Got ${games.length} games`);

  const usedSlugs = new Set();
  const gamesWithSlug = games.map(g => {
    let slug = slugify(g.title);
    let i = 2;
    while (usedSlugs.has(slug)) { slug = slugify(g.title) + '-' + i; i++; }
    usedSlugs.add(slug);
    return { ...g, slug };
  });

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Index page
  const cardsHtml = gamesWithSlug.map(g => cardHtml(g, g.slug)).join('\n');
  const indexBody = `<div id="game-feed-container">${cardsHtml}</div>`;
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), pageShell(`${SITE_NAME} - Main Game Gratis`, indexBody));

  // Game detail pages
  for (const game of gamesWithSlug) {
    const others = gamesWithSlug.filter(g => g.slug !== game.slug)
      .sort(() => Math.random() - 0.5).slice(0, 12);
    const relatedHtml = others.map(g => cardHtml(g, g.slug)).join('\n');
    const body = `
      <a href="/" class="back-link">&larr; Kembali</a>
      <h1 class="game-h1">${game.title}</h1>
      <div class="player-wrap"><iframe src="${game.url}" allow="fullscreen; autoplay" allowfullscreen loading="lazy"></iframe></div>
      <h2 class="section-h2">Game Lainnya</h2>
      <div class="related-grid">${relatedHtml}</div>
    `;
    const dir = path.join(OUT_DIR, 'game', game.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), pageShell(`${game.title} - ${SITE_NAME}`, body));
  }

  // Custom domain file
  fs.writeFileSync(path.join(OUT_DIR, 'CNAME'), DOMAIN);

  console.log('Build done:', gamesWithSlug.length, 'game pages generated.');
}

main().catch(err => { console.error(err); process.exit(1); });
