const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const paths = [
  path.resolve('./qualimed.sqlite'),
  path.resolve('Z:/Qualidade e Gestão de Riscos/Qualimed/QualiMed-SIGQ-Release/qualimed.sqlite')
];

for (const dbPath of paths) {
  if (!fs.existsSync(dbPath)) {
    console.log(`Arquivo não existe: ${dbPath}`);
    continue;
  }
  console.log(`Limpando consultorias em: ${dbPath}`);
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = DELETE; PRAGMA busy_timeout = 30000;');
  
  db.exec('DELETE FROM atividades;');
  db.exec('DELETE FROM planos_5w2h;');
  try {
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('atividades', 'planos_5w2h');");
  } catch(e) {}
  
  db.exec("UPDATE diagnosticos SET ocorrencias = 0, acoes_pendentes = 0, docs_vencidos = 0, criticidade = 'NORMAL', recomendacao = 'Em conformidade';");
  db.exec('VACUUM;');
  
  const ativCount = db.prepare('SELECT count(*) as c FROM atividades').get().c;
  console.log(`[OK] ${dbPath} -> Atividades restantes: ${ativCount}`);
}

console.log('Todos os bancos de dados foram limpos com sucesso!');
