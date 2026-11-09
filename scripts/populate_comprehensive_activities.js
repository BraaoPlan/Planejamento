const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '..', 'qualimed.sqlite');
const db = new DatabaseSync(dbPath);

const sectors = db.prepare("SELECT analista, setor FROM setores WHERE analista IS NOT NULL AND analista != '' ORDER BY analista, setor").all();

// Group sectors by analyst
const sectorsByAnalyst = {};
sectors.forEach(s => {
  if (!sectorsByAnalyst[s.analista]) sectorsByAnalyst[s.analista] = [];
  sectorsByAnalyst[s.analista].push(s.setor);
});

const analysts = Object.keys(sectorsByAnalyst);
console.log(`Carregados ${sectors.length} setores distribuídos entre ${analysts.length} analistas.`);

const categories = [
  'GESTÃO DE DOCUMENTOS',
  'INDICADORES',
  'OCORRÊNCIAS',
  'PLANO DE MELHORIA (AÇÕES)',
  'MAPA DE PROCESSO/CCF'
];

const categoryTemplates = {
  'GESTÃO DE DOCUMENTOS': [
    'Revisão e padronização dos POPs e Instruções de Trabalho',
    'Auditoria de conformidade documental e validação de manuais',
    'Validação dos fluxogramas e políticas setoriais vigentes',
    'Atualização de rotinas operacionais e formulários da unidade'
  ],
  'INDICADORES': [
    'Análise crítica mensal de desempenho e metas dos KPIs',
    'Auditoria e validação de dashboards e tempos de atendimento',
    'Definição de plano de melhoria para metas não atingidas',
    'Acompanhamento do SLA de resolução e taxa de conformidade'
  ],
  'OCORRÊNCIAS': [
    'Investigação de não-conformidade e análise de causa raiz com 5 Porquês',
    'Acompanhamento da execução de ações corretivas no sistema EPA',
    'Reunião técnica para contenção e mitigação de reincidências',
    'Auditoria de fechamento e verificação de eficácia de ocorrências'
  ],
  'PLANO DE MELHORIA (AÇÕES)': [
    'Estruturação e monitoramento do plano de ação 5W2H',
    'Validação das evidências de implementação das ações estratégicas',
    'Auditoria de prazos de entregas e replanejamento de metas',
    'Acompanhamento de melhoria contínua e reporte à diretoria'
  ],
  'MAPA DE PROCESSO/CCF': [
    'Mapeamento da cadeia de valor e identificação de gargalos',
    'Elaboração de CCF (Controle de Características Críticas do Fluxo)',
    'Otimização do fluxo de trabalho e redução de desperdícios',
    'Alinhamento do fluxo intersetorial com unidades assistenciais'
  ]
};

const hours = [2, 3, 4, 4, 4, 6];
const schedules = [
  '08:00 - 12:00',
  '08:30 - 12:30',
  '13:30 - 17:30',
  '14:00 - 18:00',
  '09:00 - 12:00',
  '13:00 - 17:00'
];

// Distribuição de status realista: ~60% Concluído, ~15% Reprogramado, ~8% Cancelado, ~10% Em Andamento, ~7% Pendente
const statusesPool = [
  'CONCLUÍDO', 'CONCLUÍDO', 'CONCLUÍDO', 'CONCLUÍDO', 'CONCLUÍDO', 'CONCLUÍDO', 'CONCLUÍDO',
  'REPROGRAMADO', 'REPROGRAMADO',
  'CANCELADO',
  'EM ANDAMENTO',
  'PENDENTE'
];

const monthsConfig = [
  { mes: 'ABRIL', year: '2026', mNum: '04', actsPerAnalyst: 4, daysInMonth: 30 },
  { mes: 'MAIO', year: '2026', mNum: '05', actsPerAnalyst: 3, daysInMonth: 31 },
  { mes: 'JUNHO', year: '2026', mNum: '06', actsPerAnalyst: 3, daysInMonth: 30 },
  { mes: 'JULHO', year: '2026', mNum: '07', actsPerAnalyst: 2, daysInMonth: 31 }
];

let globalId = 1;
const generatedActivities = [];

monthsConfig.forEach(mCfg => {
  analysts.forEach((analista, aIdx) => {
    const analystSectors = sectorsByAnalyst[analista] || ['Qualidade Geral'];
    for (let k = 0; k < mCfg.actsPerAnalyst; k++) {
      const processo = analystSectors[(k + aIdx) % analystSectors.length];
      const cat = categories[(k + aIdx) % categories.length];
      const templates = categoryTemplates[cat];
      const descTemplate = templates[(k + aIdx) % templates.length];
      const atividade = `${descTemplate} - ${processo}`;

      const dayNum = ((aIdx * 3 + k * 7) % (mCfg.daysInMonth - 2)) + 1;
      const day = String(dayNum).padStart(2, '0');
      const data = `${mCfg.year}-${mCfg.mNum}-${day}`;
      const horario = schedules[(aIdx + k) % schedules.length];
      const ch = hours[(aIdx + k) % hours.length];

      const status = statusesPool[globalId % statusesPool.length];

      generatedActivities.push({
        id: globalId++,
        mes: mCfg.mes,
        data: data,
        horario: horario,
        ch: ch,
        processo: processo,
        categoria: cat,
        atividade: atividade,
        consultor: analista,
        responsavel: `Coordenação / ${processo}`,
        status: status,
        aprovado: true,
        solicitante: analista
      });
    }
  });
});

console.log(`Geradas ${generatedActivities.length} atividades de consultoria.`);

// Salvar no SQLite
db.exec('DELETE FROM atividades');
const insertStmt = db.prepare(`
  INSERT INTO atividades (mes, data, horario, ch, processo, categoria, atividade, consultor, responsavel, status, aprovado, solicitante)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

db.exec('BEGIN TRANSACTION');
generatedActivities.forEach(a => {
  insertStmt.run(
    a.mes, a.data, a.horario, a.ch, a.processo, a.categoria,
    a.atividade, a.consultor, a.responsavel, a.status,
    a.aprovado ? 1 : 0, a.solicitante
  );
});
db.exec('COMMIT');

console.log('Banco de dados SQLite atualizado com sucesso!');

// Atualizar seed_sigq.json
const seedSigqPath = path.join(__dirname, '..', 'data', 'seed_sigq.json');
if (fs.existsSync(seedSigqPath)) {
  const data = JSON.parse(fs.readFileSync(seedSigqPath, 'utf8'));
  data.activities = generatedActivities;
  fs.writeFileSync(seedSigqPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('data/seed_sigq.json atualizado com sucesso!');
}

// Relatório rápido
const statsStatus = db.prepare('SELECT status, count(*) as count FROM atividades GROUP BY status').all();
console.log('Status no SQLite:', statsStatus);
const statsMes = db.prepare('SELECT mes, count(*) as count FROM atividades GROUP BY mes').all();
console.log('Meses no SQLite:', statsMes);
const statsAnalysts = db.prepare("SELECT consultor, count(*) as total, sum(CASE WHEN status = 'CONCLUÍDO' THEN 1 ELSE 0 END) as concluidas FROM atividades GROUP BY consultor").all();
console.log('Analistas no SQLite:', statsAnalysts);
