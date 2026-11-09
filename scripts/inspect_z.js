const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbPath = path.resolve('Z:/Qualidade e Gestão de Riscos/Qualimed/QualiMed-SIGQ-Release/qualimed.sqlite');
console.log('Verificando DB em:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('Arquivo DB não existe!');
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tabelas encontradas:', tables.map(t => t.name));

try {
  const ativs = db.prepare('SELECT * FROM atividades').all();
  console.log(`Total atividades: ${ativs.length}`);
  ativs.forEach(a => {
    console.log(`- ID: ${a.id} | Titulo: ${a.titulo} | Responsavel: ${a.responsavel} | CriadoEm: ${a.criado_em} | AtualizadoEm: ${a.atualizado_em}`);
  });
} catch (e) {
  console.error('Erro ao ler atividades:', e.message);
}

try {
  const logs = db.prepare('SELECT * FROM logs_auditoria ORDER BY id DESC LIMIT 20').all();
  console.log(`\nÚltimos logs (${logs.length}):`);
  logs.forEach(l => {
    console.log(`- [${l.criado_em}] Ação: ${l.acao} | Tabela: ${l.tabela} | RegID: ${l.registro_id} | Usuário: ${l.usuario}`);
  });
} catch (e) {
  console.error('Erro ao ler logs:', e.message);
}
