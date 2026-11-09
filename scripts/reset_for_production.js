const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'qualimed.sqlite');
console.log('[RESET] Conectando ao banco SQLite em:', dbPath);

const db = new DatabaseSync(dbPath);

// Limpeza das tabelas operacionais
console.log('[RESET] Limpando atividades, planos 5W2H e logs de auditoria...');
db.exec('DELETE FROM atividades;');
db.exec('DELETE FROM planos_5w2h;');
db.exec('DELETE FROM logs_auditoria;');

try {
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('atividades', 'planos_5w2h', 'logs_auditoria');");
} catch (e) {
  // Ignora se sqlite_sequence não tiver os registros
}

// Atualizar diagnósticos para zerar pendências mantendo a lista de processos/setores
db.exec("UPDATE diagnosticos SET ocorrencias = 0, acoes_pendentes = 0, docs_vencidos = 0, criticidade = 'NORMAL', recomendacao = 'Em conformidade';");

// Checkpoint e compactação
try {
  db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
} catch (e) {}
db.exec('VACUUM;');

const ativCount = db.prepare('SELECT count(*) as c FROM atividades').get().c;
const planCount = db.prepare('SELECT count(*) as c FROM planos_5w2h').get().c;
const logCount = db.prepare('SELECT count(*) as c FROM logs_auditoria').get().c;
const setorCount = db.prepare('SELECT count(*) as c FROM setores').get().c;
const userCount = db.prepare('SELECT count(*) as c FROM usuarios').get().c;
const diagCount = db.prepare('SELECT count(*) as c FROM diagnosticos').get().c;

console.log('[RESET] Concluído com sucesso!');
console.log(JSON.stringify({
  atividades: ativCount,
  planos_5w2h: planCount,
  logs_auditoria: logCount,
  setores_cadastrados: setorCount,
  usuarios_ativos: userCount,
  diagnosticos_setores: diagCount
}, null, 2));
