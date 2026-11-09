const fs = require('fs');
const path = require('path');

const seedData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'seed_sigq.json'), 'utf8'));
let html = fs.readFileSync(path.join(__dirname, '..', 'plataforma_qualidade.html'), 'utf8');

// Replace DEFAULT_ACTIVITIES
const startMarker = 'const DEFAULT_ACTIVITIES = [';
const endMarker = 'const DEFAULT_DIAGNOSTICS = [';

const sIdx = html.indexOf(startMarker);
const eIdx = html.indexOf(endMarker);

if (sIdx !== -1 && eIdx !== -1) {
  const activitiesJson = JSON.stringify(seedData.activities, null, 2);
  const replacement = `const DEFAULT_ACTIVITIES = ${activitiesJson};\n\n    `;
  html = html.slice(0, sIdx) + replacement + html.slice(eIdx);
  console.log('DEFAULT_ACTIVITIES atualizado em plataforma_qualidade.html!');
} else {
  console.error('Marcadores de DEFAULT_ACTIVITIES não encontrados.');
}

// Atualizar SIGQ_DATA_VERSION
html = html.replace(/const SIGQ_DATA_VERSION = "[^"]+";/, 'const SIGQ_DATA_VERSION = "2026.10.01_v8_dashboard";');

fs.writeFileSync(path.join(__dirname, '..', 'plataforma_qualidade.html'), html, 'utf8');
console.log('plataforma_qualidade.html sincronizado com sucesso!');
