const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('Z:/Qualidade e Gestão de Riscos/Qualimed/QualiMed-SIGQ-Release/qualimed.sqlite');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:');
tables.forEach(t => {
  const count = db.prepare('SELECT COUNT(*) as c FROM ' + t.name).get().c;
  console.log('  ' + t.name + ': ' + count);
});
const acts = db.prepare('SELECT * FROM atividades').all();
console.log('Atividades rows count:', acts.length);
if (acts.length > 0) {
  console.log('Sample atividades:', JSON.stringify(acts.slice(0, 5), null, 2));
}
const logs = db.prepare('SELECT * FROM logs_auditoria ORDER BY id DESC LIMIT 15').all();
console.log('Recent audit logs:', JSON.stringify(logs, null, 2));
db.close();
