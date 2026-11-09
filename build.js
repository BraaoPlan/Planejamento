const fs = require('fs');
const path = require('path');

if (!fs.existsSync('views')) fs.mkdirSync('views');
if (!fs.existsSync('public')) fs.mkdirSync('public');

console.log('--- Construindo Plataforma da Qualidade (SIGQ) integrada ---');
console.log('Processando views/index.html, public/index.html e index.html...');

const sigqHtml = fs.readFileSync('plataforma_qualidade.html', 'utf8');

fs.writeFileSync(path.join('views', 'index.html'), sigqHtml, 'utf8');
fs.writeFileSync(path.join('public', 'index.html'), sigqHtml, 'utf8');
fs.writeFileSync('index.html', sigqHtml, 'utf8');

console.log('index.html gerado com sucesso para compatibilidade Vercel e local!');
console.log('--- Construção concluída com sucesso! ---');
