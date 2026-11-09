const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '..', 'qualimed.sqlite');
const db = new DatabaseSync(dbPath);

const sectors = db.prepare("SELECT analista, setor FROM setores WHERE analista IS NOT NULL AND analista != '' ORDER BY analista, setor").all();
console.log('Total mapped sectors:', sectors.length);

const byAnalyst = {};
sectors.forEach(s => {
  if (!byAnalyst[s.analista]) byAnalyst[s.analista] = [];
  byAnalyst[s.analista].push(s.setor);
});

console.log('Analysts found:', Object.keys(byAnalyst));
for (const [a, sets] of Object.entries(byAnalyst)) {
  console.log(`- ${a} (${sets.length} setores): ${sets.slice(0, 3).join(', ')}...`);
}
