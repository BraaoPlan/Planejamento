const fs = require('fs');
const path = require('path');
const { db } = require('../database');

console.log('--- Iniciando atualização dos meses para Outubro em diante e limpeza visual ---');

// ====================================================================
// 1. ATUALIZAR BANCO DE DADOS SQLITE (atividades a partir de Outubro)
// ====================================================================
try {
  db.exec("BEGIN TRANSACTION;");
  db.exec("UPDATE atividades SET mes = 'OUTUBRO', data = REPLACE(data, '-04-', '-10-') WHERE mes = 'ABRIL';");
  db.exec("UPDATE atividades SET mes = 'NOVEMBRO', data = REPLACE(data, '-05-', '-11-') WHERE mes = 'MAIO';");
  db.exec("UPDATE atividades SET mes = 'DEZEMBRO', data = REPLACE(data, '-06-', '-12-') WHERE mes = 'JUNHO';");
  db.exec("UPDATE atividades SET mes = 'JANEIRO', data = REPLACE(REPLACE(data, '2026-07-', '2027-01-'), '-07-', '-01-') WHERE mes = 'JULHO';");
  db.exec("UPDATE atividades SET mes = 'FEVEREIRO', data = REPLACE(REPLACE(data, '2026-08-', '2027-02-'), '-08-', '-02-') WHERE mes = 'AGOSTO';");
  db.exec("UPDATE atividades SET mes = 'MARÇO', data = REPLACE(REPLACE(data, '2026-09-', '2027-03-'), '-09-', '-03-') WHERE mes = 'SETEMBRO';");
  db.exec("COMMIT;");

  const counts = db.prepare("SELECT mes, count(*) as count FROM atividades GROUP BY mes ORDER BY count DESC").all();
  console.log('Meses atualizados no SQLite:', counts);
} catch(err) {
  console.error('Erro ao atualizar SQLite:', err);
}

// Atualizar seed_sigq.json se existir
const seedPath = path.join(__dirname, '..', 'data', 'seed_sigq.json');
if (fs.existsSync(seedPath)) {
  try {
    let seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    if (Array.isArray(seed.activities)) {
      seed.activities.forEach(a => {
        if (a.mes === 'ABRIL') { a.mes = 'OUTUBRO'; a.data = (a.data || '').replace('-04-', '-10-'); }
        else if (a.mes === 'MAIO') { a.mes = 'NOVEMBRO'; a.data = (a.data || '').replace('-05-', '-11-'); }
        else if (a.mes === 'JUNHO') { a.mes = 'DEZEMBRO'; a.data = (a.data || '').replace('-06-', '-12-'); }
        else if (a.mes === 'JULHO') { a.mes = 'JANEIRO'; a.data = (a.data || '').replace('2026-07-', '2027-01-').replace('-07-', '-01-'); }
      });
      fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
      console.log('seed_sigq.json atualizado!');
    }
  } catch(e) {
    console.warn('Aviso seed_sigq:', e.message);
  }
}

// ====================================================================
// 2. ATUALIZAR plataforma_qualidade.html
// ====================================================================
const htmlPath = path.join(__dirname, '..', 'plataforma_qualidade.html');
let content = fs.readFileSync(htmlPath, 'utf8');

// A. Atualizar seletor de mês global (filter-mes) para iniciar de Outubro em diante
const oldFilterMes = `<select id="filter-mes" onchange="applyFilters()" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500">
            <option value="TODOS">Todos os Meses</option>
            <option value="ABRIL">Abril</option>
            <option value="MAIO">Maio</option>
            <option value="JUNHO">Junho</option>
            <option value="JULHO">Julho</option>
            <option value="AGOSTO">Agosto</option>
            <option value="SETEMBRO">Setembro</option>
            <option value="OUTUBRO">Outubro</option>
            <option value="NOVEMBRO">Novembro</option>
            <option value="DEZEMBRO">Dezembro</option>
            <option value="JANEIRO">Janeiro</option>
            <option value="FEVEREIRO">Fevereiro</option>
            <option value="MARÇO">Março</option>
          </select>`;

const newFilterMes = `<select id="filter-mes" onchange="applyFilters()" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500">
            <option value="TODOS">Todos os Meses (Outubro a Março)</option>
            <option value="OUTUBRO" selected>Outubro (Mês Atual)</option>
            <option value="NOVEMBRO">Novembro</option>
            <option value="DEZEMBRO">Dezembro</option>
            <option value="JANEIRO">Janeiro</option>
            <option value="FEVEREIRO">Fevereiro</option>
            <option value="MARÇO">Março</option>
          </select>`;

if (content.includes(oldFilterMes)) {
  content = content.replace(oldFilterMes, newFilterMes);
  console.log('Filtro filter-mes atualizado para Outubro em diante!');
}

// B. Atualizar act-mes no formulário de nova atividade
const oldActMes = `<select id="act-mes" onchange="syncDateToSelectedMonth()" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500">
              <option value="ABRIL">Abril</option>
              <option value="MAIO">Maio</option>
              <option value="JUNHO">Junho</option>
              <option value="JULHO">Julho</option>
              <option value="AGOSTO">Agosto</option>
              <option value="SETEMBRO">Setembro</option>
              <option value="OUTUBRO">Outubro</option>
              <option value="NOVEMBRO">Novembro</option>
              <option value="DEZEMBRO">Dezembro</option>
              <option value="JANEIRO">Janeiro</option>
              <option value="FEVEREIRO">Fevereiro</option>
              <option value="MARÇO">Março</option>
            </select>`;

const newActMes = `<select id="act-mes" onchange="syncDateToSelectedMonth()" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500">
              <option value="OUTUBRO" selected>Outubro (Mês Atual)</option>
              <option value="NOVEMBRO">Novembro</option>
              <option value="DEZEMBRO">Dezembro</option>
              <option value="JANEIRO">Janeiro</option>
              <option value="FEVEREIRO">Fevereiro</option>
              <option value="MARÇO">Março</option>
            </select>`;

if (content.includes(oldActMes)) {
  content = content.replace(oldActMes, newActMes);
  console.log('Seletor act-mes atualizado para Outubro em diante!');
}

// C. Atualizar plan-filter-mes na aba de Planejamento
const oldPlanFilterMes = `<select id="plan-filter-mes" onchange="renderPlanejamento()" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500">
              <option value="TODOS">Todos os Meses</option>
              <option value="ABRIL">Abril</option>
              <option value="MAIO">Maio</option>
              <option value="JUNHO">Junho</option>
              <option value="JULHO">Julho</option>
              <option value="AGOSTO">Agosto</option>
              <option value="SETEMBRO">Setembro</option>
              <option value="OUTUBRO">Outubro</option>
              <option value="NOVEMBRO">Novembro</option>
              <option value="DEZEMBRO">Dezembro</option>
              <option value="JANEIRO">Janeiro</option>
              <option value="FEVEREIRO">Fevereiro</option>
              <option value="MARÇO">Março</option>
            </select>`;

const newPlanFilterMes = `<select id="plan-filter-mes" onchange="renderPlanejamento()" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500">
              <option value="TODOS">Todos os Meses (Outubro a Março)</option>
              <option value="OUTUBRO" selected>Outubro (Mês Atual)</option>
              <option value="NOVEMBRO">Novembro</option>
              <option value="DEZEMBRO">Dezembro</option>
              <option value="JANEIRO">Janeiro</option>
              <option value="FEVEREIRO">Fevereiro</option>
              <option value="MARÇO">Março</option>
            </select>`;

if (content.includes(oldPlanFilterMes)) {
  content = content.replace(oldPlanFilterMes, newPlanFilterMes);
  console.log('Filtro plan-filter-mes atualizado para Outubro em diante!');
}

// D. Atualizar report-mes na aba de Relatórios
const oldReportMes = `<select id="report-mes" onchange="generateReportPreview()" class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800">
              <option value="TODOS">Todos os Meses</option>
              <option value="ABRIL">Abril</option>
              <option value="MAIO">Maio</option>
              <option value="JUNHO">Junho</option>
              <option value="JULHO">Julho</option>
              <option value="AGOSTO">Agosto</option>
              <option value="SETEMBRO">Setembro</option>
              <option value="OUTUBRO">Outubro</option>
            </select>`;

const newReportMes = `<select id="report-mes" onchange="generateReportPreview()" class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800">
              <option value="TODOS">Todos os Meses (Outubro a Março)</option>
              <option value="OUTUBRO" selected>Outubro (Mês Atual)</option>
              <option value="NOVEMBRO">Novembro</option>
              <option value="DEZEMBRO">Dezembro</option>
              <option value="JANEIRO">Janeiro</option>
              <option value="FEVEREIRO">Fevereiro</option>
              <option value="MARÇO">Março</option>
            </select>`;

if (content.includes(oldReportMes)) {
  content = content.replace(oldReportMes, newReportMes);
  console.log('Seletor report-mes atualizado para Outubro em diante!');
}

// E. REMOVER O BLOCO "MÊS - FILTRAR" DENTRO DO DASHBOARD (REDUNDANTE E POLUÍDO)
const oldDashMonthBlockStart = '<!-- ======================================================== -->\n      <!-- BARRA DE SELEÇÃO RÁPIDA DE MÊS (SUGESTÃO DO PAINEL)       -->\n      <!-- ======================================================== -->';
const oldDashMonthBlockEnd = '<!-- ======================================================== -->\n      <!-- 4 CARDS EXECUTIVOS: STATUS & CARGA HORÁRIA TOTAL        -->';

const bStart = content.indexOf(oldDashMonthBlockStart);
const bEnd = content.indexOf(oldDashMonthBlockEnd);
if (bStart !== -1 && bEnd !== -1) {
  content = content.slice(0, bStart) + content.slice(bEnd);
  console.log('Bloco Mês - Filtrar removido com sucesso do dashboard!');
} else {
  console.warn('Aviso: bloco Mês - Filtrar não encontrado exatamente pelos marcadores.');
}

// F. REMOVER O "%" NA FRENTE DOS NOMES DOS INDICADORES E COLUNAS
// 1. Cards de KPI no topo do dashboard
content = content.replace(
  '<span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">% Concluídas</span>',
  '<span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">Concluídas</span>'
);
content = content.replace(
  '<span class="text-xs font-bold text-amber-800 uppercase tracking-wider">% Reprogramadas</span>',
  '<span class="text-xs font-bold text-amber-800 uppercase tracking-wider">Reprogramadas</span>'
);
content = content.replace(
  '<span class="text-xs font-bold text-rose-800 uppercase tracking-wider">% Canceladas</span>',
  '<span class="text-xs font-bold text-rose-800 uppercase tracking-wider">Canceladas</span>'
);

// 2. Título e subtítulo do Box 4 de Status
content = content.replace(
  '<h2 class="text-sm font-bold text-slate-800">% dos Status das Consultorias</h2>',
  '<h2 class="text-sm font-bold text-slate-800">Status das Consultorias</h2>'
);
content = content.replace(
  '<p class="text-xs text-slate-500">% Concluídas / % Canceladas / % Reprogramadas / % Em Andamento</p>',
  '<p class="text-xs text-slate-500">Concluídas, Canceladas, Reprogramadas e Em Andamento</p>'
);

// 3. Matriz de Eficácia
content = content.replace(
  '<h2 class="text-sm font-bold text-slate-800">Matriz de Eficácia: % de Status por Setor</h2>',
  '<h2 class="text-sm font-bold text-slate-800">Matriz de Eficácia: Status por Setor</h2>'
);
content = content.replace(
  '<p class="text-xs text-slate-500 mt-0.5">Detalhamento do % Concluídas, % Canceladas, % Reprogramadas e % Andamento/Pendente por departamento</p>',
  '<p class="text-xs text-slate-500 mt-0.5">Detalhamento de Concluídas, Canceladas, Reprogramadas e Em Andamento por departamento</p>'
);
content = content.replace(
  '<th class="py-2.5 px-3 text-center">% Concluídas</th>',
  '<th class="py-2.5 px-3 text-center">Concluídas</th>'
);
content = content.replace(
  '<th class="py-2.5 px-3 text-center">% Canceladas</th>',
  '<th class="py-2.5 px-3 text-center">Canceladas</th>'
);
content = content.replace(
  '<th class="py-2.5 px-3 text-center">% Reprogramadas</th>',
  '<th class="py-2.5 px-3 text-center">Reprogramadas</th>'
);
content = content.replace(
  '<th class="py-2.5 px-3 text-center">% Andamento / Pend.</th>',
  '<th class="py-2.5 px-3 text-center">Andamento / Pend.</th>'
);

// G. REMOVER OS NOMES DE COLUNA (Coluna H, Coluna F, Coluna E)
content = content.replace(
  '<h2 class="text-sm font-bold text-slate-800" id="chart-analista-title">Total e % de Consultorias por Analista (Coluna H)</h2>\n                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">Coluna H</span>',
  '<h2 class="text-sm font-bold text-slate-800" id="chart-analista-title">Consultorias por Analista</h2>'
);
content = content.replace(
  '<h2 class="text-sm font-bold text-slate-800">Total e % por Tipo de Categoria (Coluna F)</h2>\n                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">Coluna F</span>',
  '<h2 class="text-sm font-bold text-slate-800">Consultorias por Categoria Técnica</h2>'
);
content = content.replace(
  '<h2 class="text-sm font-bold text-slate-800">Total e % Distribuído por Processo (Coluna E)</h2>\n                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-md">Coluna E</span>',
  '<h2 class="text-sm font-bold text-slate-800">Consultorias por Processo / Setor</h2>'
);
content = content.replace(
  '<span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md">Status</span>',
  ''
);

// H. ATUALIZAR STATUS NO JAVASCRIPT renderStatusBreakdownChart
const oldStatusArray = `      const statuses = [
        { name: "CONCLUÍDO", label: "% CONCLUÍDAS", subtitle: "Realizadas com êxito", color: "bg-emerald-600", text: "text-emerald-800", bg: "bg-emerald-50/70", border: "border-emerald-200" },
        { name: "CANCELADO", label: "% CANCELADAS", subtitle: "Canceladas pelo setor / analista", color: "bg-rose-500", text: "text-rose-800", bg: "bg-rose-50/70", border: "border-rose-200" },
        { name: "REPROGRAMADO", label: "% REPROGRAMADAS", subtitle: "Reagendadas para nova data", color: "bg-amber-500", text: "text-amber-800", bg: "bg-amber-50/70", border: "border-amber-200" },
        { name: "EM ANDAMENTO", label: "% EM ANDAMENTO", subtitle: "Em execução ativa no momento", color: "bg-teal-500", text: "text-teal-800", bg: "bg-teal-50/70", border: "border-teal-200" },
        { name: "PENDENTE", label: "% PENDENTES", subtitle: "Aguardando data prevista", color: "bg-slate-500", text: "text-slate-800", bg: "bg-slate-50", border: "border-slate-200" }
      ];`;

const newStatusArray = `      const statuses = [
        { name: "CONCLUÍDO", label: "Concluídas", subtitle: "Realizadas com êxito", color: "bg-emerald-600", text: "text-emerald-800", bg: "bg-emerald-50/70", border: "border-emerald-200" },
        { name: "CANCELADO", label: "Canceladas", subtitle: "Canceladas pelo setor / analista", color: "bg-rose-500", text: "text-rose-800", bg: "bg-rose-50/70", border: "border-rose-200" },
        { name: "REPROGRAMADO", label: "Reprogramadas", subtitle: "Reagendadas para nova data", color: "bg-amber-500", text: "text-amber-800", bg: "bg-amber-50/70", border: "border-amber-200" },
        { name: "EM ANDAMENTO", label: "Em Andamento", subtitle: "Em execução ativa no momento", color: "bg-teal-500", text: "text-teal-800", bg: "bg-teal-50/70", border: "border-teal-200" },
        { name: "PENDENTE", label: "Pendentes", subtitle: "Aguardando data prevista", color: "bg-slate-500", text: "text-slate-800", bg: "bg-slate-50", border: "border-slate-200" }
      ];`;

if (content.includes(oldStatusArray)) {
  content = content.replace(oldStatusArray, newStatusArray);
  console.log('Status array atualizado sem o % na frente dos nomes!');
}

// I. Sincronização de datas para começar em Outubro/2026
content = content.replace(
  'const targetMonth = (currentFilteredMonth && currentFilteredMonth !== "TODOS") ? currentFilteredMonth : "ABRIL";',
  'const targetMonth = (currentFilteredMonth && currentFilteredMonth !== "TODOS") ? currentFilteredMonth : "OUTUBRO";'
);

content = content.replace(
  'const monthNum = MONTH_MAP[mes] || "04";\n      const year = "2026";',
  'const monthNum = MONTH_MAP[mes] || "10";\n      const year = ["JANEIRO", "FEVEREIRO", "MARÇO"].includes(mes) ? "2027" : "2026";'
);

// J. Atualizar DEFAULT_ACTIVITIES inline para Outubro em diante
content = content.replace(/"mes": "ABRIL"/g, '"mes": "OUTUBRO"');
content = content.replace(/"data": "2026-04-/g, '"data": "2026-10-');
content = content.replace(/"mes": "MAIO"/g, '"mes": "NOVEMBRO"');
content = content.replace(/"data": "2026-05-/g, '"data": "2026-11-');
content = content.replace(/"mes": "JUNHO"/g, '"mes": "DEZEMBRO"');
content = content.replace(/"data": "2026-06-/g, '"data": "2026-12-');
content = content.replace(/"mes": "JULHO"/g, '"mes": "JANEIRO"');
content = content.replace(/"data": "2026-07-/g, '"data": "2027-01-');

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('plataforma_qualidade.html atualizado e salvo com sucesso!');
