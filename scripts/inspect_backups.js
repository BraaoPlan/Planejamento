const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');

const backups = [
  'backups/qualimed_backup_2026-10-30.sqlite',
  'backups/qualimed_backup_2026-11-03.sqlite',
  'backups/qualimed_backup_checkpoint.sqlite',
  'Z:/Qualidade e Gestão de Riscos/Qualimed/QualiMed-SIGQ-Release/backups/qualimed_backup_2026-10-30.sqlite',
  'Z:/Qualidade e Gestão de Riscos/Qualimed/QualiMed-SIGQ-Release/backups/qualimed_backup_2026-11-03.sqlite'
];

for (const b of backups) {
  if (fs.existsSync(b)) {
    try {
      const db = new DatabaseSync(b);
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      console.log('=== ' + b + ' ===');
      for (const t of tables) {
        try {
          const count = db.prepare('SELECT COUNT(*) as c FROM ' + t.name).get().c;
          console.log('  ' + t.name + ': ' + count);
        } catch(e) {}
      }
      db.close();
    } catch(e) {
      console.log('Erro ' + b + ': ' + e.message);
    }
  }
}
