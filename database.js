const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente nativamente no Node.js 20+
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (e) {
    // Arquivo .env opcional se as variáveis forem injetadas pelo container/ambiente
  }
}

const NETWORK_DB_PATH = 'Z:/Qualidade e Gestão de Riscos/Qualimed/QualiMed-SIGQ-Release/qualimed.sqlite';
let DB_PATH = path.join(__dirname, 'qualimed.sqlite');

if (process.env.DATABASE_PATH && path.isAbsolute(process.env.DATABASE_PATH) && fs.existsSync(process.env.DATABASE_PATH)) {
  DB_PATH = path.resolve(process.env.DATABASE_PATH);
} else if (fs.existsSync(NETWORK_DB_PATH)) {
  DB_PATH = NETWORK_DB_PATH;
} else if (process.env.DATABASE_PATH) {
  DB_PATH = path.resolve(process.env.DATABASE_PATH);
}

console.log(`[BANCO SQLITE] Conectado ao arquivo: ${DB_PATH}`);
const db = new DatabaseSync(DB_PATH);

// Habilitar journal mode DELETE para máxima compatibilidade com pastas de rede (SMB, X:, Z:, UNC)
try {
  db.exec(`PRAGMA journal_mode = DELETE;`);
} catch (e) {
  try { db.exec(`PRAGMA journal_mode = TRUNCATE;`); } catch (_) {}
}

db.exec(`
  PRAGMA busy_timeout = 30000;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
`);

// Rotina leve de backup automático na inicialização
try {
  const backupsDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  const todayStr = new Date().toISOString().slice(0, 10);
  const dailyBackupPath = path.join(backupsDir, `qualimed_backup_${todayStr}.sqlite`);
  if (!fs.existsSync(dailyBackupPath) && fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, dailyBackupPath);
    console.log(`[BACKUP AUTOMÁTICO] Backup diário salvo em: ${dailyBackupPath}`);
  }
} catch (err) {
  console.warn('[BACKUP AUTOMÁTICO] Aviso ao gerar backup:', err.message);
}

// Criação das tabelas
db.exec(`
    CREATE TABLE IF NOT EXISTS logs_auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT,
    perfil TEXT,
    acao TEXT NOT NULL,
    entidade TEXT NOT NULL,
    entidade_id INTEGER,
    detalhes TEXT,
    ip TEXT,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE,
    pin TEXT NOT NULL,
    perfil TEXT NOT NULL, -- 'ANALISTA' ou 'GESTOR'
    ativo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS setores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setor TEXT UNIQUE NOT NULL,
    diretoria TEXT,
    analista TEXT
  );

      CREATE TABLE IF NOT EXISTS atividades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mes TEXT NOT NULL,
    data TEXT NOT NULL,
    horario TEXT NOT NULL,
    ch INTEGER DEFAULT 4,
    processo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    atividade TEXT NOT NULL,
    consultor TEXT NOT NULL,
    responsavel TEXT,
    status TEXT DEFAULT 'PENDENTE',
    solicitante TEXT,
    why TEXT,
    how TEXT,
    resultado TEXT,
    acompanhamento TEXT,
    subcategoria TEXT,
    motivo_status TEXT,
    data_conclusao TEXT
  );

  CREATE TABLE IF NOT EXISTS diagnosticos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    processo TEXT UNIQUE NOT NULL,
    responsavel TEXT,
    ocorrencias INTEGER DEFAULT 0,
    acoes_pendentes INTEGER DEFAULT 0,
    docs_vencidos INTEGER DEFAULT 0,
    indicadores_no_prazo INTEGER DEFAULT 100,
    criticidade TEXT DEFAULT 'BAIXA',
    recomendacao TEXT
  );

  CREATE TABLE IF NOT EXISTS planos_5w2h (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    what TEXT NOT NULL,
    why TEXT,
    where_setor TEXT,
    who TEXT,
    when_date TEXT,
    how TEXT,
    status TEXT DEFAULT 'PENDENTE'
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

try { db.exec("ALTER TABLE atividades ADD COLUMN why TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE atividades ADD COLUMN how TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE atividades ADD COLUMN resultado TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE atividades ADD COLUMN acompanhamento TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE atividades ADD COLUMN subcategoria TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE atividades ADD COLUMN motivo_status TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE atividades ADD COLUMN data_conclusao TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE atividades ADD COLUMN recorrente INTEGER DEFAULT 0;"); } catch(e) {}
try { db.exec("ALTER TABLE atividades ADD COLUMN recorrencia_freq TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE atividades ADD COLUMN recorrencia_fim TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE atividades ADD COLUMN recorrencia_grupo TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE atividades ADD COLUMN link_teams TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE planos_5w2h ADD COLUMN categoria TEXT;"); } catch(e) {}
try { db.exec("ALTER TABLE planos_5w2h ADD COLUMN subcategoria TEXT;"); } catch(e) {}
try { db.exec("UPDATE atividades SET categoria = 'Documentos' WHERE categoria IN ('GESTÃO DE DOCUMENTOS', 'Gestão de Documentos', 'Mapa de Processo', 'MAPA DE PROCESSO (NOVO)', 'MAPA DE PROCESSO/CCF') OR categoria LIKE '%MAPA DE PROCESSO%';"); } catch(e) {}
try { db.exec("UPDATE atividades SET subcategoria = 'Elaboração / revisão de mapa de processo' WHERE subcategoria IN ('Elaboração / revisão de mapa de processo', 'Criação de Mapa de Processo', 'Atualização de Mapa de Processo') OR categoria = 'Mapa de Processo' OR categoria LIKE '%MAPA DE PROCESSO%';"); } catch(e) {}
try { db.exec("UPDATE planos_5w2h SET categoria = 'Documentos' WHERE categoria IN ('GESTÃO DE DOCUMENTOS', 'Gestão de Documentos', 'Mapa de Processo', 'MAPA DE PROCESSO (NOVO)', 'MAPA DE PROCESSO/CCF') OR categoria LIKE '%MAPA DE PROCESSO%';"); } catch(e) {}
try { db.exec("UPDATE planos_5w2h SET subcategoria = 'Elaboração / revisão de mapa de processo' WHERE subcategoria IN ('Elaboração / revisão de mapa de processo', 'Criação de Mapa de Processo', 'Atualização de Mapa de Processo') OR categoria = 'Mapa de Processo' OR categoria LIKE '%MAPA DE PROCESSO%';"); } catch(e) {}
try { db.exec("UPDATE atividades SET categoria = 'Indicadores' WHERE categoria = 'INDICADORES';"); } catch(e) {}
try { db.exec("UPDATE atividades SET categoria = 'Ocorrências' WHERE categoria = 'OCORRÊNCIAS';"); } catch(e) {}
try { db.exec("UPDATE atividades SET categoria = 'Plano de Melhorias' WHERE categoria = 'PLANO DE MELHORIA (AÇÕES)';"); } catch(e) {}
try { db.exec("UPDATE atividades SET subcategoria = 'Elaboração de documentos' WHERE subcategoria = 'Novo Documento';"); } catch(e) {}

try { db.exec("UPDATE atividades SET why = 'Padronização de processos e mitigação de não conformidades' WHERE why IS NULL OR why = '';"); } catch(e) {}
try { db.exec("UPDATE atividades SET how = 'Consultoria in loco, checagem de evidências e alinhamento de rotinas' WHERE how IS NULL OR how = '';"); } catch(e) {}
try { db.exec("UPDATE atividades SET resultado = 'Planejamento registrado. Pendente de registro do resultado da consultoria.' WHERE resultado IS NULL OR resultado = '';"); } catch(e) {}
try { db.exec("UPDATE atividades SET acompanhamento = 'Acompanhamento do setor em andamento conforme cronograma.' WHERE acompanhamento IS NULL OR acompanhamento = '';"); } catch(e) {}


// ========================================================
// CRIPTOGRAFIA DE SENHAS COM SALT (SCRYPT / NODE NATIVO)
// ========================================================
function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !password) return false;
  if (stored.includes(':')) {
    const [salt, hash] = stored.split(':');
    const computed = crypto.scryptSync(String(password), salt, 64).toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'));
    } catch(e) {
      return false;
    }
  }
  // Retrocompatibilidade temporária com senhas em texto puro
  return String(stored) === String(password);
}

// ========================================================
// TRILHA DE AUDITORIA & RASTREABILIDADE (POL.SEG.INS.002)
// ========================================================
function logAudit(usuario, perfil, acao, entidade, entidade_id = null, detalhes = '', ip = '') {
  try {
    const stmt = db.prepare(`
      INSERT INTO logs_auditoria (usuario, perfil, acao, entidade, entidade_id, detalhes, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      usuario || 'Sistema',
      perfil || 'SISTEMA',
      acao,
      entidade,
      entidade_id ? Number(entidade_id) : null,
      String(detalhes || ''),
      String(ip || '')
    );
  } catch(e) {
    console.warn('[AUDITORIA] Falha ao gravar log:', e.message);
  }
}

// Função de Seeding automático
function seedDatabase() {
  // 1. Usuários e Analistas
  const countUsers = db.prepare('SELECT count(*) as count FROM usuarios').get().count;
  if (countUsers === 0) {
    console.log('Populando usuários e analistas...');
    const insertUser = db.prepare('INSERT OR IGNORE INTO usuarios (nome, pin, perfil, ativo) VALUES (?, ?, ?, 1)');
    
    // Gestor Mestre
    const defaultGestorPass = process.env.ADMIN_DEFAULT_PASSWORD || 'gestao123';
    insertUser.run('Gestor da Qualidade', hashPassword(defaultGestorPass), 'GESTOR');

    // 10 Analistas
    const defaultAnalysts = [
      { nome: "Abraao", pin: "1234" },
      { nome: "Aline Pimenta Motta", pin: "1234" },
      { nome: "Amanda", pin: "1234" },
      { nome: "Ana Carol", pin: "1234" },
      { nome: "Dairiane", pin: "1234" },
      { nome: "Fernanda", pin: "1234" },
      { nome: "Larissa", pin: "1234" },
      { nome: "Luana", pin: "1234" },
      { nome: "Tainá", pin: "1234" },
      { nome: "Viviane Paiva", pin: "1234" }
    ];

    for (const a of defaultAnalysts) {
      insertUser.run(a.nome, hashPassword(a.pin), 'ANALISTA');
    }
  }

  // 2. Setores e Diretoria
  const countSectors = db.prepare('SELECT count(*) as count FROM setores').get().count;
  if (countSectors === 0) {
    console.log('Populando setores oficiais...');
    const seedSigqPath = path.join(__dirname, 'data', 'seed_sigq.json');
    if (fs.existsSync(seedSigqPath)) {
      const sigqData = JSON.parse(fs.readFileSync(seedSigqPath, 'utf8'));
      const insertSector = db.prepare('INSERT OR IGNORE INTO setores (setor, diretoria, analista) VALUES (?, ?, ?)');
      for (const s of sigqData.sectors || []) {
        insertSector.run(s.setor, s.diretoria, s.analista);
      }
    }
  }

  // 4. Atividades Oficiais (garante a persistência e restauração dos agendamentos reais dos analistas)
  const countAtividades = db.prepare('SELECT count(*) as count FROM atividades').get().count;
  if (countAtividades === 0) {
    const seedSigqPath = path.join(__dirname, 'data', 'seed_sigq.json');
    if (fs.existsSync(seedSigqPath)) {
      try {
        const sigqData = JSON.parse(fs.readFileSync(seedSigqPath, 'utf8'));
        if (Array.isArray(sigqData.activities) && sigqData.activities.length > 0) {
          console.log(`[SEED] Restaurando ${sigqData.activities.length} atividade(s) oficial(is) dos analistas...`);
          const insert = db.prepare(`
            INSERT INTO atividades (
              mes, data, horario, ch, processo, categoria, subcategoria, atividade,
              consultor, responsavel, status, aprovado, solicitante, why, how,
              resultado, acompanhamento, motivo_status, data_conclusao,
              recorrente, recorrencia_freq, recorrencia_fim, recorrencia_grupo,
              link_teams
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          db.exec('BEGIN TRANSACTION');
          for (const a of sigqData.activities) {
            insert.run(
              a.mes || '', a.data || '', a.horario || '', parseFloat(a.ch) || 1, a.processo || '', a.categoria || 'Documentos',
              a.subcategoria || '', a.atividade || '', a.consultor || '', a.responsavel || '', a.status || 'PENDENTE',
              a.aprovado ? 1 : 0, a.solicitante || 'Equipe da Qualidade',
              a.why || '', a.how || '',
              a.resultado || '', a.acompanhamento || '', a.motivo_status || '',
              a.data_conclusao || null,
              a.recorrente ? 1 : 0, a.recorrencia_freq || null, a.recorrencia_fim || null, a.recorrencia_grupo || null,
              a.link_teams || null
            );
          }
          db.exec('COMMIT');
        }
      } catch (e) {
        console.warn('Aviso ao carregar seed de atividades:', e.message);
      }
    }
  }
}

// Recalcular pendências por setor
function recalculateDiagnostics() {
  const sectors = db.prepare('SELECT setor, analista FROM setores').all();
  const upsertDiag = db.prepare(`
    INSERT INTO diagnosticos (processo, responsavel, ocorrencias, acoes_pendentes, docs_vencidos, indicadores_no_prazo, criticidade, recomendacao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(processo) DO UPDATE SET
      responsavel = excluded.responsavel,
      ocorrencias = 0,
      acoes_pendentes = 0,
      criticidade = excluded.criticidade
  `);

  db.exec('BEGIN TRANSACTION');
  for (const s of sectors) {
    const actRow = db.prepare(`
      SELECT count(*) as count 
      FROM atividades 
      WHERE (processo = ? OR processo LIKE ?)
        AND status IN ('EM ANDAMENTO', 'PENDENTE')
    `).get(s.setor, `%${s.setor}%`);
    const totalPendentes = actRow ? actRow.count : 0;

    let criticidade = 'BAIXA';
    if (totalPendentes > 5) criticidade = 'ALTA';
    else if (totalPendentes > 2) criticidade = 'MÉDIA';

    let rec = `Planejamento de rotina com analista ${s.analista || 'designado'}.`;
    if (criticidade === 'ALTA') {
      rec = `Consultoria prioritária necessária (${totalPendentes} atividades planejadas).`;
    }

    upsertDiag.run(s.setor, s.analista || 'Qualidade', 0, 0, 0, 100, criticidade, rec);
  }
  db.exec('COMMIT');
}

// Inicializar banco
seedDatabase();

// Migração automática de senhas legadas em texto plano para Hash com Salt
try {
  const users = db.prepare('SELECT id, pin FROM usuarios').all();
  for (const u of users) {
    if (u.pin && !u.pin.includes(':')) {
      db.prepare('UPDATE usuarios SET pin = ? WHERE id = ?').run(hashPassword(u.pin), u.id);
    }
  }
} catch(e) {}


module.exports = {
  db,
  DB_PATH,
  recalculateDiagnostics,
  hashPassword,
  verifyPassword,
  logAudit
};
