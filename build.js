const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const viewsDir = path.join(rootDir, 'views');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(viewsDir)) fs.mkdirSync(viewsDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

console.log('--- Construindo Plataforma da Qualidade (SIGQ) integrada ---');
console.log('Processando views/index.html, public/index.html e index.html...');

const sigqHtmlPath = path.join(rootDir, 'plataforma_qualidade.html');
const sigqHtml = fs.readFileSync(sigqHtmlPath, 'utf8');

fs.writeFileSync(path.join(viewsDir, 'index.html'), sigqHtml, 'utf8');
fs.writeFileSync(path.join(publicDir, 'index.html'), sigqHtml, 'utf8');
fs.writeFileSync(path.join(rootDir, 'index.html'), sigqHtml, 'utf8');

// Copiar firebase-config.js e firebase-config.example.js para public/ se existirem
const fbCfg = path.join(rootDir, 'firebase-config.js');
if (fs.existsSync(fbCfg)) {
  fs.copyFileSync(fbCfg, path.join(publicDir, 'firebase-config.js'));
}

console.log('index.html e public/index.html gerados com sucesso para GitHub Pages, Vercel e local!');
console.log('--- Construção concluída com sucesso! ---');
