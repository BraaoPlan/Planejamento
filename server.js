// Carregar variáveis de ambiente nativamente no Node.js 20+
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (e) {
    // Arquivo .env opcional se as variáveis forem injetadas pelo container/ambiente
  }
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { db, DB_PATH, recalculateDiagnostics, hashPassword, verifyPassword, logAudit } = require('./database');
const crypto = require('node:crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cabeçalhos de Segurança HTTP (Mitigação de XSS, Sniffing e Clickjacking em Localhost)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});


// ========================================================
// GERENCIAMENTO DE SESSÃO / TOKENS ASSINADOS (JWT LOCAL)
// ========================================================
const JWT_SECRET = process.env.JWT_SECRET || 'qualimed_local_security_secret_2026_medsenior';

function generateToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    nome: user.nome,
    perfil: user.perfil,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Validade de 24 horas
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  if (signature !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch(e) {
    return null;
  }
}

// ========================================================
// RATE LIMITING DE LOGIN (POL.SEG.INS.002, ITEM 10.1.6: MÁX 5 TENTATIVAS)
// ========================================================
const loginAttempts = new Map();

function checkLoginRateLimit(key) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (record) {
    if (record.lockUntil && record.lockUntil > now) {
      const waitMin = Math.ceil((record.lockUntil - now) / 60000);
      return `Limite de 5 tentativas excedido. Acesso bloqueado temporariamente por ${waitMin} minuto(s), conforme a Política de Segurança da Informação (Item 10.1.6).`;
    }
    if (record.lockUntil && record.lockUntil <= now) {
      loginAttempts.delete(key);
    }
  }
  return null;
}

function recordFailedLogin(key) {
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, lockUntil: null };
  record.count += 1;
  if (record.count >= 5) {
    record.lockUntil = now + 15 * 60 * 1000; // Bloqueio de 15 minutos
  }
  loginAttempts.set(key, record);
  return record.count;
}

function recordSuccessLogin(key) {
  loginAttempts.delete(key);
}

// ========================================================
// MIDDLEWARES DE PROTEÇÃO DE ACESSO (AUTENTICAÇÃO & ROLES)
// ========================================================
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
    }
    req.user = user;
    return next();
  }

  return res.status(401).json({ error: 'Acesso restrito. Faça login para continuar.' });
}

function requireGestor(req, res, next) {
  if (!req.user || req.user.perfil !== 'GESTOR') {
    return res.status(403).json({ error: 'Acesso restrito ao perfil de Gestão.' });
  }
  next();
}

// Helper de Tratamento Seguro de Erros (Evita vazamento de stack/SQL interno aos clientes)
function handleServerError(res, err, friendlyMsg = 'Erro interno ao processar a solicitação.') {
  console.error('[ERRO API]', new Date().toLocaleTimeString(), err && err.message ? err.message : err);
  res.status(500).json({ error: friendlyMsg });
}

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// ========================================================
// ROTAS DE PÁGINAS HTML (FRONTEND)
// ========================================================
// ========================================================
// ROTAS DE PÁGINAS HTML (FRONTEND - PLATAFORMA DA QUALIDADE SIGQ)
// ========================================================
app.get('/', (req, res) => {
  try {
    const indexPath = path.join(__dirname, 'views', 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('views/index.html não encontrado.');
    }
    let html = fs.readFileSync(indexPath, 'utf8');

    // Pré-carregamento instantâneo direto do SQLite para eliminar telas vazias
    const activities = db.prepare("SELECT * FROM atividades ORDER BY data ASC, horario ASC").all();
    const sectors = db.prepare("SELECT * FROM setores ORDER BY diretoria ASC, setor ASC").all();
    const diagnostics = db.prepare("SELECT * FROM diagnosticos ORDER BY processo ASC").all();
    const actions5w2h = db.prepare("SELECT * FROM planos_5w2h ORDER BY id DESC").all();

    const preloadedScript = `<script>
      window.SIGQ_PRELOADED_DATA = ${JSON.stringify({ activities, sectors, diagnostics, actions5w2h })};
    </script>`;

    if (html.includes('</head>')) {
      html = html.replace('</head>', `${preloadedScript}\n</head>`);
    } else {
      html = preloadedScript + html;
    }

    res.send(html);
  } catch (err) {
    console.error('[FRONTEND] Erro ao injetar pré-carregamento:', err);
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  }
});

// Redirecionamentos amigáveis
app.get('/qualidade', (req, res) => {
  res.redirect('/');
});

// ========================================================
// API REST - BANCO DE DADOS LOCAL
// ========================================================

let lastDatabaseUpdate = Date.now();
const sseClients = new Set();

function notifyDatabaseUpdate(type = 'update') {
  lastDatabaseUpdate = Date.now();
  const payload = JSON.stringify({ type, lastUpdate: lastDatabaseUpdate, serverTime: Date.now() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// 0. SINCRONIZAÇÃO EM TEMPO REAL NA REDE (SSE + POLLING)
app.get('/api/sync/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', lastUpdate: lastDatabaseUpdate, serverTime: Date.now() })}\n\n`);
  sseClients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch(e) {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

const DB_SQLITE_FILE = (typeof DB_PATH !== 'undefined' && DB_PATH) ? DB_PATH : path.join(__dirname, 'qualimed.sqlite');

function getDatabaseMtime() {
  try {
    const stat = fs.statSync(DB_SQLITE_FILE);
    return Math.max(Math.floor(stat.mtimeMs), lastDatabaseUpdate);
  } catch (e) {
    return lastDatabaseUpdate;
  }
}

app.get('/api/sync/status', (req, res) => {
  res.json({
    lastUpdate: getDatabaseMtime(),
    serverTime: Date.now()
  });
});

// --------------------------------------------------------
// 1. AUTENTICAÇÃO E SESSÃO
// --------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { tipo, nome, pin } = req.body;
  const clientKey = `${req.ip}_${nome || tipo || 'anon'}`;

  const rateLimitMsg = checkLoginRateLimit(clientKey);
  if (rateLimitMsg) {
    return res.status(429).json({ success: false, error: rateLimitMsg });
  }

  if (tipo === 'GESTOR') {
    const user = db.prepare("SELECT * FROM usuarios WHERE perfil = 'GESTOR' AND ativo = 1 LIMIT 1").get();
    if (!user || !verifyPassword(pin, user.pin)) {
      const attempts = recordFailedLogin(clientKey);
      logAudit(nome || 'Gestor', 'GESTOR', 'LOGIN_FALHA', 'usuarios', null, `Tentativa ${attempts}/5 incorreta`, req.ip);
      const remaining = 5 - attempts;
      const warnMsg = remaining > 0 ? `Senha incorreta. Restam ${remaining} tentativa(s).` : 'Limite de 5 tentativas excedido. Bloqueado por 15 minutos.';
      return res.status(401).json({ success: false, error: warnMsg });
    }

    recordSuccessLogin(clientKey);
    logAudit(user.nome, 'GESTOR', 'LOGIN_SUCESSO', 'usuarios', user.id, 'Login efetuado com sucesso', req.ip);
    const token = generateToken(user);
    return res.json({
      success: true,
      token,
      user: { id: user.id, nome: user.nome, perfil: 'GESTOR' }
    });
  }

  // ANALISTA
  const user = db.prepare("SELECT * FROM usuarios WHERE nome = ? AND perfil = 'ANALISTA' AND ativo = 1").get(nome);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Analista não encontrado no sistema.' });
  }
  if (!verifyPassword(pin, user.pin)) {
    const attempts = recordFailedLogin(clientKey);
    logAudit(nome, 'ANALISTA', 'LOGIN_FALHA', 'usuarios', user.id, `Tentativa ${attempts}/5 incorreta`, req.ip);
    const remaining = 5 - attempts;
    const warnMsg = remaining > 0 ? `PIN incorreto. Restam ${remaining} tentativa(s).` : 'Limite de 5 tentativas excedido. Bloqueado por 15 minutos.';
    return res.status(401).json({ success: false, error: warnMsg });
  }

  recordSuccessLogin(clientKey);
  logAudit(user.nome, 'ANALISTA', 'LOGIN_SUCESSO', 'usuarios', user.id, 'Login efetuado com sucesso', req.ip);
  const token = generateToken(user);
  return res.json({
    success: true,
    token,
    user: { id: user.id, nome: user.nome, perfil: 'ANALISTA' }
  });
});

app.post('/api/auth/change-gestor-password', requireAuth, requireGestor, (req, res) => {
  const { novaSenha } = req.body;
  if (!novaSenha || String(novaSenha).trim().length < 4) {
    return res.status(400).json({ error: 'A nova senha de Gestão deve conter no mínimo 4 caracteres.' });
  }
  try {
    const user = db.prepare("SELECT id FROM usuarios WHERE perfil = 'GESTOR' LIMIT 1").get();
    if (!user) return res.status(404).json({ error: 'Usuário Gestor não encontrado.' });
    db.prepare("UPDATE usuarios SET pin = ? WHERE id = ?").run(hashPassword(String(novaSenha).trim()), user.id);
    logAudit(req.user?.nome || 'Gestor', 'GESTOR', 'ALTERAR_SENHA', 'usuarios', user.id, 'Senha mestra do gestor alterada', req.ip);
    res.json({ success: true, message: 'Senha mestra do Gestor atualizada com sucesso!' });
  } catch(err) {
    handleServerError(res, err);
  }
});

app.get('/api/auth/analysts', (req, res) => {
  const analysts = db.prepare("SELECT id, nome, perfil FROM usuarios WHERE perfil = 'ANALISTA' AND ativo = 1 ORDER BY nome ASC").all();
  res.json(analysts);
});



// --------------------------------------------------------
// 4. SETORES & DIRETORIAS (115 SETORES OFICIAIS)
// --------------------------------------------------------
app.get('/api/setores', (req, res) => {
  try {
    const sectors = db.prepare("SELECT * FROM setores ORDER BY setor ASC").all();
    res.json(sectors);
  } catch (err) {
    handleServerError(res, err);
  }
});

// Mapa de setores agrupados por analista para filtros rápidos
app.get('/api/setores/map', (req, res) => {
  try {
    const sectors = db.prepare("SELECT setor, analista FROM setores").all();
    const map = {};
    for (const s of sectors) {
      const a = (s.analista || '').trim();
      if (!a) continue;
      if (!map[a]) map[a] = [];
      map[a].push(s.setor);
    }
    res.json(map);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/setores/:id', requireAuth, requireGestor, (req, res) => {
  const { analista, diretoria } = req.body;
  try {
    db.prepare("UPDATE setores SET analista = ?, diretoria = ? WHERE id = ?").run(analista, diretoria, req.params.id);
    recalculateDiagnostics();
    notifyDatabaseUpdate('setores');
    res.json({ success: true });
  } catch (err) {
    handleServerError(res, err);
  }
});

// --------------------------------------------------------
// 5. ATIVIDADES & CRONOGRAMA DE TRABALHO (SIGQ)
// --------------------------------------------------------
app.get('/api/atividades', (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM atividades ORDER BY data ASC, horario ASC").all();
    res.json(rows);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/atividades', (req, res) => {
  const payload = req.body;
  if (!payload) {
    return res.status(400).json({ error: 'Corpo da requisição inválido.' });
  }

  const items = Array.isArray(payload) ? payload : [payload];
  if (items.length === 0) {
    return res.status(400).json({ error: 'Nenhuma atividade enviada.' });
  }

  try {
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

    const insertedIds = [];
    db.exec('BEGIN TRANSACTION');
    for (const a of items) {
      if (!a.atividade || !String(a.atividade).trim()) {
        continue;
      }
      let processoVal = a.processo ? String(a.processo).trim() : '';
      if (!processoVal && (a.categoria === 'Atividades Internas' || a.subcategoria === 'Levantamento de Ocorrências')) {
        processoVal = 'Atividades Internas';
      }
      if (!processoVal) {
        processoVal = 'Atividades Internas';
      }

      const result = insert.run(
        a.mes || '', a.data || '', a.horario || '', parseFloat(a.ch) || 4, processoVal, a.categoria || 'Gestão de Documentos',
        a.subcategoria || '', a.atividade || '', a.consultor || '', a.responsavel || '', a.status || 'PENDENTE',
        a.aprovado ? 1 : 0, a.solicitante || a.consultor || '',
        a.why || '', a.how || '',
        a.resultado || '', a.acompanhamento || '', a.motivo_status || '',
        a.data_conclusao || null,
        a.recorrente ? 1 : 0, a.recorrencia_freq || null, a.recorrencia_fim || null, a.recorrencia_grupo || null,
        a.link_teams || null
      );
      const rowId = result.lastInsertRowid;
      const code = a.codigo || `#CONS-${String(rowId).padStart(3, '0')}`;
      try {
        db.prepare('UPDATE atividades SET codigo = ? WHERE id = ?').run(code, rowId);
      } catch(_) {}
      insertedIds.push(rowId);
    }
    db.exec('COMMIT');

    const lastId = insertedIds[insertedIds.length - 1];
    logAudit(req.user?.nome, req.user?.perfil, 'CRIAR_ATIVIDADE', 'atividades', lastId, `${items.length} atividade(s) criada(s)`, req.ip);
    notifyDatabaseUpdate();
    
    // Disparar notificação no canal do Teams para as atividades criadas
    for (const a of items) {
      notifyTeamsChannel('CRIAR', a);
    }

    res.json({ success: true, id: lastId, ids: insertedIds, count: insertedIds.length });
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch(e) {}
    handleServerError(res, err);
  }
});

app.put('/api/atividades/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID da atividade inválido.' });
  const a = req.body;
  let processoVal = a.processo ? String(a.processo).trim() : '';
  if (!processoVal && (a.categoria === 'Atividades Internas' || a.subcategoria === 'Levantamento de Ocorrências')) {
    processoVal = 'Atividades Internas';
  }
  if (!processoVal) processoVal = 'Atividades Internas';

  try {
    db.prepare(`
      UPDATE atividades SET
        mes = ?, data = ?, horario = ?, ch = ?, processo = ?, categoria = ?, subcategoria = ?,
        atividade = ?, consultor = ?, responsavel = ?, status = ?, aprovado = ?,
        why = ?, how = ?, resultado = ?, acompanhamento = ?, motivo_status = ?, data_conclusao = ?,
        recorrente = ?, recorrencia_freq = ?, recorrencia_fim = ?, recorrencia_grupo = ?,
        link_teams = ?
      WHERE id = ?
    `).run(
      a.mes || '', a.data || '', a.horario || '', parseFloat(a.ch) || 4, processoVal, a.categoria || 'Gestão de Documentos',
      a.subcategoria || '', a.atividade || '', a.consultor || '', a.responsavel || '', a.status || 'PENDENTE',
      a.aprovado ? 1 : 0, a.why || '', a.how || '',
      a.resultado || '', a.acompanhamento || '', a.motivo_status || '',
      a.data_conclusao || null,
      a.recorrente ? 1 : 0, a.recorrencia_freq || null, a.recorrencia_fim || null, a.recorrencia_grupo || null,
      a.link_teams !== undefined ? a.link_teams : null,
      id
    );
    logAudit(req.user?.nome, req.user?.perfil, 'EDITAR_ATIVIDADE', 'atividades', id, a.atividade || a.status, req.ip);
    notifyDatabaseUpdate();

    if (a.status === 'CONCLUÍDO') notifyTeamsChannel('CONCLUIDO', a);
    else if (a.status === 'REPROGRAMADO') notifyTeamsChannel('REPROGRAMADO', a);
    else if (a.status === 'CANCELADO') notifyTeamsChannel('CANCELADO', a);

    res.json({ success: true });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.patch('/api/atividades/:id/resultado', (req, res) => {
  const { resultado, acompanhamento, status, motivo_status, data_conclusao } = req.body;
  try {
    db.prepare(`
      UPDATE atividades SET
        resultado = COALESCE(?, resultado),
        acompanhamento = COALESCE(?, acompanhamento),
        status = COALESCE(?, status),
        motivo_status = COALESCE(?, motivo_status),
        data_conclusao = COALESCE(?, data_conclusao)
      WHERE id = ?
    `).run(
      resultado !== undefined ? resultado : null,
      acompanhamento !== undefined ? acompanhamento : null,
      status !== undefined ? status : null,
      motivo_status !== undefined ? motivo_status : null,
      data_conclusao !== undefined ? data_conclusao : null,
      req.params.id
    );
    notifyDatabaseUpdate();

    // Notificar se mudou status
    if (status) {
      const act = db.prepare("SELECT * FROM atividades WHERE id = ?").get(req.params.id);
      if (act) {
        if (status === 'CONCLUÍDO') notifyTeamsChannel('CONCLUIDO', act);
        else if (status === 'REPROGRAMADO') notifyTeamsChannel('REPROGRAMADO', act);
        else if (status === 'CANCELADO') notifyTeamsChannel('CANCELADO', act);
      }
    }

    res.json({ success: true });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/atividades/:id/approve', requireAuth, requireGestor, (req, res) => {
  try {
    db.prepare("UPDATE atividades SET aprovado = 1 WHERE id = ?").run(req.params.id);
    notifyDatabaseUpdate();
    res.json({ success: true });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/atividades/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID da atividade inválido.' });
  try {
    db.prepare("DELETE FROM atividades WHERE id = ?").run(id);
    logAudit(req.user?.nome, req.user?.perfil, 'EXCLUIR_ATIVIDADE', 'atividades', id, 'Atividade removida', req.ip);
    notifyDatabaseUpdate();
    res.json({ success: true });
  } catch (err) {
    handleServerError(res, err);
  }
});

// Fechamento de Mês - Reprogramação em Lote
app.post('/api/atividades/batch-reprogram', (req, res) => {
  const { ids, novoMes, novaData, motivo_status } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Nenhum item selecionado para reprogramação.' });
  }
  try {
    db.exec('BEGIN TRANSACTION');
    const updateStmt = db.prepare(`
      UPDATE atividades SET
        mes = COALESCE(?, mes),
        data = COALESCE(?, data),
        status = 'REPROGRAMADO',
        motivo_status = ?
      WHERE id = ?
    `);
    for (const id of ids) {
      updateStmt.run(novoMes || null, novaData || null, motivo_status || 'Reprogramado no fechamento mensal', id);
    }
    db.exec('COMMIT');
    notifyDatabaseUpdate();
    res.json({ success: true, count: ids.length, message: `${ids.length} atividades reprogramadas com sucesso.` });
  } catch (err) {
    db.exec('ROLLBACK');
    handleServerError(res, err);
  }
});

// Fechamento de Mês - Cancelamento em Lote
app.post('/api/atividades/batch-cancel', (req, res) => {
  const { ids, motivo_status } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Nenhum item selecionado para cancelamento.' });
  }
  try {
    db.exec('BEGIN TRANSACTION');
    const updateStmt = db.prepare(`
      UPDATE atividades SET
        status = 'CANCELADO',
        motivo_status = ?
      WHERE id = ?
    `);
    for (const id of ids) {
      updateStmt.run(motivo_status || 'Cancelado no fechamento mensal', id);
    }
    db.exec('COMMIT');
    notifyDatabaseUpdate();
    res.json({ success: true, count: ids.length, message: `${ids.length} atividades canceladas com sucesso.` });
  } catch (err) {
    db.exec('ROLLBACK');
    handleServerError(res, err);
  }
});

// --------------------------------------------------------
// 6. LEVANTAMENTO DE PENDÊNCIAS / DIAGNÓSTICOS (SIGQ)
// --------------------------------------------------------
app.get('/api/diagnosticos', (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM diagnosticos ORDER BY criticidade DESC, ocorrencias DESC").all();
    res.json(rows);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/diagnosticos/recalculate', (req, res) => {
  try {
    recalculateDiagnostics();
    notifyDatabaseUpdate('diagnosticos');
    const rows = db.prepare("SELECT * FROM diagnosticos ORDER BY criticidade DESC, ocorrencias DESC").all();
    res.json({ success: true, data: rows });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/diagnosticos/:id', (req, res) => {
  const d = req.body;
  try {
    db.prepare(`
      UPDATE diagnosticos SET
        ocorrencias = ?, acoes_pendentes = ?, docs_vencidos = ?,
        indicadores_no_prazo = ?, criticidade = ?, recomendacao = ?, responsavel = ?
      WHERE id = ?
    `).run(
      d.ocorrencias, d.acoes_pendentes, d.docs_vencidos,
      d.indicadores_no_prazo, d.criticidade, d.recomendacao, d.responsavel,
      req.params.id
    );
    notifyDatabaseUpdate('diagnosticos');
    res.json({ success: true });
  } catch (err) {
    handleServerError(res, err);
  }
});

// --------------------------------------------------------
// 7. PLANOS DE AÇÃO 5W2H
// --------------------------------------------------------
app.get('/api/planos5w2h', (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM planos_5w2h ORDER BY id DESC").all();
    const formatted = rows.map(r => ({
      id: r.id,
      what: r.what,
      why: r.why,
      where: r.where_setor,
      where_setor: r.where_setor,
      who: r.who,
      when: r.when_date,
      when_date: r.when_date,
      how: r.how,
      status: r.status,
      categoria: r.categoria || '',
      subcategoria: r.subcategoria || ''
    }));
    res.json(formatted);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/planos5w2h', (req, res) => {
  const p = req.body;
  if (!p || typeof p !== 'object' || !p.what || !String(p.what).trim()) {
    return res.status(400).json({ error: "O campo 'O que sera feito (What)' e obrigatorio." });
  }
  try {
    const insert = db.prepare(`
      INSERT INTO planos_5w2h (what, why, where_setor, who, when_date, how, status, categoria, subcategoria)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insert.run(
      p.what || '',
      p.why || '',
      p.where || p.where_setor || '',
      p.who || '',
      p.when || p.when_date || '',
      p.how || '',
      p.status || 'PENDENTE',
      p.categoria || '',
      p.subcategoria || ''
    );
    notifyDatabaseUpdate('plano5w2h_criado');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/planos5w2h/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID do plano 5W2H inválido.' });
  const p = req.body;
  try {
    db.prepare(`
      UPDATE planos_5w2h SET
        what = COALESCE(?, what),
        why = COALESCE(?, why),
        where_setor = COALESCE(?, where_setor),
        who = COALESCE(?, who),
        when_date = COALESCE(?, when_date),
        how = COALESCE(?, how),
        status = COALESCE(?, status),
        categoria = COALESCE(?, categoria),
        subcategoria = COALESCE(?, subcategoria)
      WHERE id = ?
    `).run(
      p.what !== undefined ? p.what : null,
      p.why !== undefined ? p.why : null,
      p.where !== undefined ? p.where : (p.where_setor !== undefined ? p.where_setor : null),
      p.who !== undefined ? p.who : null,
      p.when !== undefined ? p.when : (p.when_date !== undefined ? p.when_date : null),
      p.how !== undefined ? p.how : null,
      p.status !== undefined ? p.status : null,
      p.categoria !== undefined ? p.categoria : null,
      p.subcategoria !== undefined ? p.subcategoria : null,
      req.params.id
    );
    notifyDatabaseUpdate('plano5w2h_atualizado');
    res.json({ success: true });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/planos5w2h/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID do plano 5W2H inválido.' });
  try {
    db.prepare("DELETE FROM planos_5w2h WHERE id = ?").run(id);
    notifyDatabaseUpdate('plano5w2h_removido');
    res.json({ success: true });
  } catch (err) {
    handleServerError(res, err);
  }
});

// --------------------------------------------------------
// 8. HUB DE DADOS: BACKUP & RESTAURAÇÃO COMPLETA
// --------------------------------------------------------
app.get('/api/database/backup', (req, res) => {
  try {
    const backup = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      usuarios: db.prepare("SELECT id, nome, pin, perfil, ativo FROM usuarios").all(),
      setores: db.prepare("SELECT id, setor, diretoria, analista FROM setores").all(),
                  atividades: db.prepare("SELECT * FROM atividades").all(),
      diagnosticos: db.prepare("SELECT * FROM diagnosticos").all(),
      planos_5w2h: db.prepare("SELECT * FROM planos_5w2h").all()
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=qualimed_backup_${Date.now()}.json`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    handleServerError(res, err);
  }
});


// --------------------------------------------------------
// 9. TRILHA DE AUDITORIA & RASTREABILIDADE
// --------------------------------------------------------
app.get('/api/audit-logs', requireAuth, requireGestor, (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM logs_auditoria ORDER BY id DESC LIMIT 100").all();
    res.json(rows);
  } catch(err) {
    handleServerError(res, err, 'Erro ao carregar trilha de auditoria.');
  }
});

// --------------------------------------------------------
// 10. INTEGRAÇÃO MICROSOFT TEAMS (CANAL DA QUALIDADE)
// --------------------------------------------------------
app.get('/api/settings/teams-webhook', (req, res) => {
  try {
    const row = db.prepare("SELECT value FROM config WHERE key = 'teams_webhook_url'").get();
    res.json({ url: row ? (row.value || '') : '' });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/settings/teams-webhook', requireAuth, requireGestor, (req, res) => {
  const { url } = req.body;
  try {
    db.prepare(`
      INSERT INTO config (key, value) VALUES ('teams_webhook_url', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(url ? String(url).trim() : '');
    logAudit(req.user?.nome, req.user?.perfil, 'CONFIG_TEAMS', 'config', null, 'Webhook do Teams atualizado', req.ip);
    res.json({ success: true, message: 'Configuração do Teams salva com sucesso.' });
  } catch (err) {
    handleServerError(res, err);
  }
});

// Gerador Universal de Cartão do Microsoft Teams (Compatível com Teams Workflows e Webhooks Legados)
function buildTeamsPayload({ title, subtitle, themeColor = '0284c7', facts = [], actions = [] }) {
  let cardColor = 'Accent';
  if (themeColor === '10b981' || themeColor === 'Good') cardColor = 'Good';
  else if (themeColor === 'ef4444' || themeColor === 'Attention') cardColor = 'Attention';
  else if (themeColor === 'f59e0b' || themeColor === 'Warning') cardColor = 'Warning';

  // 1. Adaptive Card nativo exigido pelo Microsoft Teams Workflows (Power Automate)
  const adaptiveCardContent = {
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.4",
    "msteams": { "width": "Full" },
    "body": [
      {
        "type": "Container",
        "style": "emphasis",
        "bleed": true,
        "items": [
          {
            "type": "TextBlock",
            "text": title,
            "weight": "Bolder",
            "size": "Medium",
            "color": cardColor,
            "wrap": true
          },
          ...(subtitle ? [{
            "type": "TextBlock",
            "text": subtitle,
            "size": "Small",
            "isSubtle": true,
            "spacing": "None",
            "wrap": true
          }] : [])
        ]
      },
      {
        "type": "FactSet",
        "spacing": "Medium",
        "facts": facts.map(f => ({
          "title": String(f.name || '').replace(/:$/, '') + ':',
          "value": String(f.value || '-')
        }))
      }
    ],
    "actions": actions.map(act => ({
      "type": "Action.OpenUrl",
      "title": act.name,
      "url": act.url
    }))
  };

  return {
    // Envelope para Microsoft Teams Workflows (garante que attachments não seja nulo)
    "type": "message",
    "attachments": [
      {
        "contentType": "application/vnd.microsoft.card.adaptive",
        "contentUrl": null,
        "content": adaptiveCardContent
      }
    ],
    // Fallback completo para conectores legados MessageCard
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": title,
    "themeColor": themeColor,
    "title": title,
    "sections": [
      {
        "activityTitle": subtitle ? `**${subtitle}**` : title,
        "facts": facts.map(f => ({ "name": f.name, "value": f.value })),
        "markdown": true
      }
    ],
    "potentialAction": actions.map(act => ({
      "@type": "OpenURIOperation",
      "name": act.name,
      "targets": [{ "os": "default", "uri": act.url }]
    }))
  };
}

app.post('/api/settings/teams-webhook/test', requireAuth, requireGestor, async (req, res) => {
  const { url } = req.body;
  const webhookUrl = url ? String(url).trim() : '';
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return res.status(400).json({ error: 'URL do Webhook inválida.' });
  }

  try {
    const testPayload = buildTeamsPayload({
      title: '🎉 Conexão QualiMed SIGQ com Microsoft Teams Ativa!',
      subtitle: 'Sistema Integrado de Gestão da Qualidade - MedSênior',
      themeColor: '0284c7',
      facts: [
        { name: 'Status', value: 'Conectado e Operacional' },
        { name: 'Servidor', value: `http://${LOCAL_IP}:${PORT}` },
        { name: 'Disparado por', value: req.user?.nome || 'Gestor QualiMed' },
        { name: 'Data e Hora', value: new Date().toLocaleString('pt-BR') }
      ],
      actions: [
        { name: 'Acessar QualiMed', url: `http://${LOCAL_IP}:${PORT}` }
      ]
    });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    if (response.ok || response.status === 200 || response.status === 202) {
      return res.json({ success: true, message: 'Mensagem de teste enviada com sucesso para o Teams!' });
    } else {
      const errText = await response.text();
      return res.status(502).json({ error: `O Teams retornou código ${response.status}: ${errText}` });
    }
  } catch (err) {
    return res.status(500).json({ error: `Falha ao conectar com o Teams: ${err.message}` });
  }
});

// Função para disparo assíncrono de notificações no canal do Teams
async function notifyTeamsChannel(eventType, act) {
  try {
    const row = db.prepare("SELECT value FROM config WHERE key = 'teams_webhook_url'").get();
    if (!row || !row.value || !row.value.trim().startsWith('http')) return;
    const webhookUrl = row.value.trim();

    let title = '📅 Nova Consultoria Agendada - QualiMed';
    let themeColor = '0284c7'; // Azul MedSênior

    if (eventType === 'CRIAR') {
      title = '📅 Nova Consultoria Agendada - QualiMed';
      themeColor = '0284c7';
    } else if (eventType === 'CONCLUIDO') {
      title = '✅ Consultoria Concluída com Sucesso - QualiMed';
      themeColor = '10b981'; // Verde
    } else if (eventType === 'REPROGRAMADO') {
      title = '⏳ Consultoria Reprogramada - QualiMed';
      themeColor = 'f59e0b'; // Âmbar
    } else if (eventType === 'CANCELADO') {
      title = '❌ Consultoria Cancelada - QualiMed';
      themeColor = 'ef4444'; // Vermelho
    }

    const facts = [
      { name: 'Setor', value: act.processo || 'Consultoria' },
      { name: 'Analista da Qualidade', value: act.consultor || 'Qualidade' },
      { name: 'Gestor / Responsável', value: act.responsavel || 'Não informado' },
      { name: 'Atividade / Pauta', value: act.atividade || '-' },
      { name: 'Data e Horário', value: `${act.data || '-'} às ${act.horario || '09:00'} (${act.ch || 4}h)` },
      { name: 'Categoria', value: `${act.categoria || 'Geral'}${act.subcategoria ? ' - ' + act.subcategoria : ''}` },
      { name: 'Status Atual', value: act.status || 'PENDENTE' },
      ...(act.resultado ? [{ name: 'Resultado / Entregas', value: act.resultado }] : []),
      ...(act.motivo_status ? [{ name: 'Justificativa', value: act.motivo_status }] : [])
    ];

    const actions = [
      { name: 'Abrir no QualiMed', url: `http://${LOCAL_IP}:${PORT}` },
      ...(act.link_teams ? [{ name: 'Entrar na Reunião Teams', url: act.link_teams }] : [])
    ];

    const payload = buildTeamsPayload({
      title,
      subtitle: `Setor: ${act.processo || 'Consultoria'} • Analista: ${act.consultor || 'Qualidade'}`,
      themeColor,
      facts,
      actions
    });

    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.warn('[TEAMS WEBHOOK] Aviso ao enviar notificação:', err.message));
  } catch (err) {
    console.warn('[TEAMS WEBHOOK] Erro interno:', err.message);
  }
}

// Inicialização do servidor

function getLocalIpAddress() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

const LOCAL_IP = getLocalIpAddress();

app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================================');
  console.log('[QUALIMED] Plataforma Integrada de Gestao da Qualidade (SIGQ)');
  console.log(`[ACESSO LOCAL]      http://localhost:${PORT}`);
  console.log(`[ACESSO EM REDE]    http://${LOCAL_IP}:${PORT}`);
  console.log(`[BANCO]             Banco interno SQLite: qualimed.sqlite ativo.`);
  console.log('========================================================');

  // Grava automaticamente o atalho de acesso da rede e status centralizado
  try {
    const networkUrl = `http://${LOCAL_IP}:${PORT}`;
    
    // 1. Cria ou atualiza os atalhos nativos do Windows (.url) apontando para localhost
    const shortcutContent = `[InternetShortcut]\r\nURL=http://localhost:${PORT}\r\nIconIndex=0\r\n`;
    fs.writeFileSync(path.join(__dirname, 'Abrir_QualiMed.url'), shortcutContent, 'utf8');
    fs.writeFileSync(path.join(__dirname, '1_CLIQUE_AQUI_PARA_ABRIR.url'), shortcutContent, 'utf8');

    // 2. Cria arquivo de informacoes do servidor ativo imediatamente
    const statusPayload = JSON.stringify({
      url: networkUrl,
      ip: LOCAL_IP,
      port: PORT,
      host: os.hostname(),
      status: 'ONLINE',
      updatedAt: new Date().toISOString()
    }, null, 2);
    fs.writeFileSync(path.join(__dirname, 'servidor_ativo.json'), statusPayload, 'utf8');
    console.log(`[REDE] Atalho 'Abrir_QualiMed.url' pronto para acesso de toda a equipe.`);
  } catch (err) {
    console.warn('[REDE] Aviso ao gerar atalho na pasta de rede:', err.message);
  }

  // Heartbeat periódico (a cada 10s) para manter o status de atividade atualizado na pasta de rede
  setInterval(() => {
    try {
      const statusPayload = JSON.stringify({
        url: `http://${LOCAL_IP}:${PORT}`,
        ip: LOCAL_IP,
        port: PORT,
        host: os.hostname(),
        status: 'ONLINE',
        updatedAt: new Date().toISOString()
      }, null, 2);
      fs.writeFileSync(path.join(__dirname, 'servidor_ativo.json'), statusPayload, 'utf8');
    } catch (_) {}
  }, 10000);
});

// Encerramento gracioso limpando o registro de servidor ativo
function cleanupServer() {
  try {
    const statusFile = path.join(__dirname, 'servidor_ativo.json');
    if (fs.existsSync(statusFile)) {
      fs.unlinkSync(statusFile);
    }
  } catch (_) {}
}

process.on('SIGINT', () => {
  console.log('\n[SERVIDOR] Encerrando servidor QualiMed...');
  cleanupServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanupServer();
  process.exit(0);
});

process.on('exit', () => {
  cleanupServer();
});
