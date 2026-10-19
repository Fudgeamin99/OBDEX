'use strict';
// Bundles the app into one self-contained HTML file (inline CSS, JS and
// images) for sharing a demo. The bundle runs on demo data only.
const fs = require('fs');
const path = require('path');

const pub = path.join(__dirname, '..', 'public');
const read = (p) => fs.readFileSync(path.join(pub, p), 'utf8');
const dataUri = (p) => 'data:image/png;base64,' + fs.readFileSync(path.join(pub, p)).toString('base64');

let html = read('index.html');
let css = read('css/app.css').replace('url("../assets/icon.png")', `url("${dataUri('assets/icon.png')}")`);
html = html
  .replace('<link rel="stylesheet" href="css/app.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script src="js/plate.js"></script>', () => `<script>\n${read('js/plate.js')}\n</script>`)
  .replace('<script src="js/mock.js"></script>', () => `<script>\n${read('js/mock.js')}\n</script>`)
  .replace('<script src="js/app.js"></script>', () => `<script>\n${read('js/app.js')}\n</script>`)
  .replace(/src="(assets\/[^"]+\.png)"/g, (_, p) => `src="${dataUri(p)}"`)
  .replace(/<link rel="(icon|apple-touch-icon|manifest)"[^>]*>\n/g, '');

const bare = process.argv.includes('--fragment');
if (bare) {
  // Body-level fragment for hosts that supply their own document wrapper.
  html = html.replace(/<!doctype html>\s*<html[^>]*>\s*<head>\s*/i, '')
    .replace(/<meta charset[^>]*>\n|<meta name="viewport"[^>]*>\n/g, '')
    .replace(/<\/head>\s*<body>\s*/i, '').replace(/<\/body>\s*<\/html>\s*$/i, '');
}
const out = path.join(__dirname, '..', 'dist', bare ? 'obdex-preview-fragment.html' : 'obdex-preview.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('Wrote', out, Math.round(html.length / 1024) + ' KB');
