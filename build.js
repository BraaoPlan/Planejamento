const fs = require('fs');
const path = require('path');

if (!fs.existsSync('views')) fs.mkdirSync('views');

console.log('--- Construindo Plataforma da Qualidade (SIGQ) integrada ---');
console.log('Processando views/index.html...');

const sigqHtml = fs.readFileSync('plataforma_qualidade.html', 'utf8');

fs.writeFileSync(path.join('views', 'index.html'), sigqHtml, 'utf8');
console.log('views/index.html gerado com sucesso!');
console.log('--- Construção concluída com sucesso! ---');
