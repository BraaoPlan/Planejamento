const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'plataforma_qualidade.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Tamanho original do arquivo:', content.length);

// ====================================================================
// 1. ATUALIZAR VIEW-DASHBOARD (LIMPO, SEM POLUIÇÃO VISUAL)
// ====================================================================
const dashStartTag = '<div id="view-dashboard" class="space-y-6">';
const dashEndTag = '<!-- ============================================================== -->\n    <!-- TAB 2: PLANEJAMENTO DE CONSULTORIA DA QUALIDADE (UNIFICADO)    -->';

const newDashboardHtml = `<div id="view-dashboard" class="space-y-6">

      <!-- ======================================================== -->
      <!-- BARRA DE SELEÇÃO RÁPIDA DE MÊS (SUGESTÃO DO PAINEL)       -->
      <!-- ======================================================== -->
      <div class="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div class="flex items-center space-x-2.5">
            <span class="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </span>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-sm font-bold text-slate-800">Mês - Filtrar</h3>
                <span id="dash-active-month-badge" class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Todos os Meses</span>
              </div>
              <p class="text-xs text-slate-500">Selecione o mês para atualizar os indicadores e percentuais de consultoria</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span id="dash-active-count-badge" class="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
              0 consultorias
            </span>
          </div>
        </div>

        <!-- Chips de Mês com Rolagem Suave -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs" id="dash-month-chips">
          <button type="button" onclick="setDashboardMonth('TODOS')" data-month="TODOS" class="month-chip px-3 py-1.5 rounded-lg font-bold border transition-all bg-emerald-700 text-white border-emerald-700 shadow-xs shrink-0">Todos os Meses</button>
          <button type="button" onclick="setDashboardMonth('ABRIL')" data-month="ABRIL" class="month-chip px-3 py-1.5 rounded-lg font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shrink-0">Abril</button>
          <button type="button" onclick="setDashboardMonth('MAIO')" data-month="MAIO" class="month-chip px-3 py-1.5 rounded-lg font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shrink-0">Maio</button>
          <button type="button" onclick="setDashboardMonth('JUNHO')" data-month="JUNHO" class="month-chip px-3 py-1.5 rounded-lg font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shrink-0">Junho</button>
          <button type="button" onclick="setDashboardMonth('JULHO')" data-month="JULHO" class="month-chip px-3 py-1.5 rounded-lg font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shrink-0">Julho</button>
          <button type="button" onclick="setDashboardMonth('AGOSTO')" data-month="AGOSTO" class="month-chip px-3 py-1.5 rounded-lg font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shrink-0">Agosto</button>
          <button type="button" onclick="setDashboardMonth('SETEMBRO')" data-month="SETEMBRO" class="month-chip px-3 py-1.5 rounded-lg font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shrink-0">Setembro</button>
          <button type="button" onclick="setDashboardMonth('OUTUBRO')" data-month="OUTUBRO" class="month-chip px-3 py-1.5 rounded-lg font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shrink-0">Outubro</button>
          <button type="button" onclick="setDashboardMonth('NOVEMBRO')" data-month="NOVEMBRO" class="month-chip px-3 py-1.5 rounded-lg font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shrink-0">Novembro</button>
          <button type="button" onclick="setDashboardMonth('DEZEMBRO')" data-month="DEZEMBRO" class="month-chip px-3 py-1.5 rounded-lg font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shrink-0">Dezembro</button>
          <button type="button" onclick="setDashboardMonth('JANEIRO')" data-month="JANEIRO" class="month-chip px-3 py-1.5 rounded-lg font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shrink-0">Janeiro</button>
          <button type="button" onclick="setDashboardMonth('FEVEREIRO')" data-month="FEVEREIRO" class="month-chip px-3 py-1.5 rounded-lg font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shrink-0">Fevereiro</button>
          <button type="button" onclick="setDashboardMonth('MARÇO')" data-month="MARÇO" class="month-chip px-3 py-1.5 rounded-lg font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shrink-0">Março</button>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- 4 CARDS EXECUTIVOS: STATUS & CARGA HORÁRIA TOTAL        -->
      <!-- ======================================================== -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. Total Consultorias -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Consultorias</span>
            <span class="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </span>
          </div>
          <h3 id="kpi-total" class="text-3xl font-black text-slate-800 mt-2">0</h3>
          <p id="kpi-ch-total" class="text-xs text-slate-500 mt-1">0h planejadas no período</p>
        </div>

        <!-- 2. % CONCLUÍDAS -->
        <div class="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">% Concluídas</span>
            <span id="kpi-pct-concluido" class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">0%</span>
          </div>
          <h3 id="kpi-concluido" class="text-3xl font-black text-emerald-800 mt-2">0</h3>
          <p id="kpi-ch-executada-label" class="text-xs text-emerald-700 mt-1"><strong id="kpi-ch-executada">0h</strong> executadas</p>
        </div>

        <!-- 3. % REPROGRAMADAS -->
        <div class="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-800 uppercase tracking-wider">% Reprogramadas</span>
            <span id="kpi-pct-reprog" class="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">0%</span>
          </div>
          <h3 id="kpi-reprog" class="text-3xl font-black text-amber-900 mt-2">0</h3>
          <p class="text-xs text-amber-700 mt-1">Ajustes de data / reagendadas</p>
        </div>

        <!-- 4. % CANCELADAS -->
        <div class="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-rose-800 uppercase tracking-wider">% Canceladas</span>
            <span id="kpi-pct-cancel" class="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">0%</span>
          </div>
          <h3 id="kpi-cancel" class="text-3xl font-black text-rose-900 mt-2">0</h3>
          <p class="text-xs text-rose-700 mt-1">Desvios de execução</p>
        </div>
      </div>

      <!-- BARRA DE COMPOSIÇÃO DOS STATUS (LIMPA E MODERNA) -->
      <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div class="flex flex-wrap items-center justify-between text-xs mb-2.5 gap-2">
          <span class="font-bold text-slate-800 flex items-center">
            <svg class="w-4 h-4 text-emerald-700 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
            Distribuição Geral de Status das Consultorias:
          </span>
          <div class="flex flex-wrap items-center gap-3 text-xs">
            <span class="inline-flex items-center"><span class="w-2.5 h-2.5 rounded-full bg-emerald-600 mr-1.5"></span> Concluídas (<strong id="stack-pct-concluidas" class="ml-1 text-emerald-900">0%</strong>)</span>
            <span class="inline-flex items-center"><span class="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span> Reprogramadas (<strong id="stack-pct-reprog" class="ml-1 text-amber-900">0%</strong>)</span>
            <span class="inline-flex items-center"><span class="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5"></span> Canceladas (<strong id="stack-pct-canceladas" class="ml-1 text-rose-900">0%</strong>)</span>
            <span class="inline-flex items-center"><span class="w-2.5 h-2.5 rounded-full bg-teal-500 mr-1.5"></span> Em Andamento (<strong id="stack-pct-andamento" class="ml-1 text-teal-900">0%</strong>)</span>
            <span class="inline-flex items-center"><span class="w-2.5 h-2.5 rounded-full bg-slate-400 mr-1.5"></span> Pendentes (<strong id="stack-pct-pendente" class="ml-1 text-slate-700">0%</strong>)</span>
          </div>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex" id="global-status-stackbar">
          <div id="bar-concluidas" class="bg-emerald-600 h-full transition-all duration-500" style="width: 0%" title="Concluídas"></div>
          <div id="bar-reprog" class="bg-amber-500 h-full transition-all duration-500" style="width: 0%" title="Reprogramadas"></div>
          <div id="bar-canceladas" class="bg-rose-500 h-full transition-all duration-500" style="width: 0%" title="Canceladas"></div>
          <div id="bar-andamento" class="bg-teal-500 h-full transition-all duration-500" style="width: 0%" title="Em Andamento"></div>
          <div id="bar-pendente" class="bg-slate-400 h-full transition-all duration-500" style="width: 0%" title="Pendentes"></div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- 4 PILARES ANALÍTICOS (GRID 2x2 BALANCEADO)               -->
      <!-- ======================================================== -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- 1. ANALISTAS (COLUNA H): TOTAL E % DE CONSULTORIAS REALIZADAS -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" id="box-chart-analista">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <div class="flex items-center space-x-2">
                <h2 class="text-sm font-bold text-slate-800" id="chart-analista-title">Total e % de Consultorias por Analista (Coluna H)</h2>
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">Coluna H</span>
              </div>
              <p class="text-xs text-slate-500" id="chart-analista-sub">Total realizado e % de participação das consultorias concluídas pela equipe</p>
            </div>
          </div>
          <div id="chart-analista" class="space-y-3 max-h-96 overflow-y-auto pr-1">
            <!-- Dynamic items injected via JS -->
          </div>
        </div>

        <!-- 2. CATEGORIAS TÉCNICAS (COLUNA F): TOTAL E % POR TIPO DE CATEGORIA -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <div class="flex items-center space-x-2">
                <h2 class="text-sm font-bold text-slate-800">Total e % por Tipo de Categoria (Coluna F)</h2>
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">Coluna F</span>
              </div>
              <p class="text-xs text-slate-500">Documentos, Indicadores, Ocorrências, Ações e Processos</p>
            </div>
          </div>
          <div id="chart-categoria" class="space-y-3.5 max-h-96 overflow-y-auto pr-1">
            <!-- Dynamic items injected via JS -->
          </div>
        </div>

        <!-- 3. PROCESSOS / SETORES (COLUNA E): TOTAL E % DISTRIBUÍDO POR PROCESSO -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <div class="flex items-center space-x-2">
                <h2 class="text-sm font-bold text-slate-800">Total e % Distribuído por Processo (Coluna E)</h2>
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-md">Coluna E</span>
              </div>
              <p class="text-xs text-slate-500">Volume de consultorias e percentual por área de negócio</p>
            </div>
            <div class="flex items-center space-x-2">
              <input type="text" id="search-processo" oninput="filterProcessList()" placeholder="Buscar setor..." class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-36">
            </div>
          </div>
          <div id="chart-processo" class="space-y-3 max-h-96 overflow-y-auto pr-1">
            <!-- Dynamic items injected via JS -->
          </div>
        </div>

        <!-- 4. STATUS DAS CONSULTORIAS: % CONCLUÍDAS / % CANCELADAS / % REPROGRAMADAS -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <div class="flex items-center space-x-2">
                <h2 class="text-sm font-bold text-slate-800">% dos Status das Consultorias</h2>
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md">Status</span>
              </div>
              <p class="text-xs text-slate-500">% Concluídas / % Canceladas / % Reprogramadas / % Em Andamento</p>
            </div>
          </div>
          <div id="chart-status" class="space-y-3.5 max-h-96 overflow-y-auto pr-1">
            <!-- Dynamic items injected via JS -->
          </div>
        </div>

      </div>

      <!-- ======================================================== -->
      <!-- MATRIZ DE EFICÁCIA: % DE STATUS POR SETOR (EXPANSÍVEL)   -->
      <!-- ======================================================== -->
      <details class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs group" open>
        <summary class="p-5 cursor-pointer flex flex-wrap items-center justify-between gap-3 bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors select-none">
          <div>
            <div class="flex items-center space-x-2">
              <span class="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </span>
              <h2 class="text-sm font-bold text-slate-800">Matriz de Eficácia: % de Status por Setor</h2>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">Tabela Detalhada</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Detalhamento do % Concluídas, % Canceladas, % Reprogramadas e % Andamento/Pendente por departamento</p>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-xs font-semibold text-emerald-800 group-open:hidden">Clique para Expandir</span>
            <span class="text-xs font-semibold text-slate-500 hidden group-open:inline">Clique para Recolher</span>
            <svg class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
        </summary>
        
        <div class="p-5 border-t border-slate-100 space-y-4">
          <div class="flex justify-end">
            <input type="text" id="search-matrix-setor" oninput="filterMatrixSetores()" placeholder="Buscar setor na matriz..." class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-64">
          </div>
          <div class="overflow-x-auto max-h-96">
            <table class="w-full text-left text-xs text-slate-600">
              <thead class="bg-emerald-50/60 text-slate-700 font-semibold border-b border-emerald-100 uppercase tracking-wider text-[11px] sticky top-0 bg-white">
                <tr>
                  <th class="py-2.5 px-3">Processo / Setor</th>
                  <th class="py-2.5 px-3 text-center">Total Ativ.</th>
                  <th class="py-2.5 px-3 text-center">% Concluídas</th>
                  <th class="py-2.5 px-3 text-center">% Canceladas</th>
                  <th class="py-2.5 px-3 text-center">% Reprogramadas</th>
                  <th class="py-2.5 px-3 text-center">% Andamento / Pend.</th>
                  <th class="py-2.5 px-3">Distribuição Visual (100%)</th>
                </tr>
              </thead>
              <tbody id="matrix-setor-body" class="divide-y divide-slate-100">
                <!-- Injected by JS -->
              </tbody>
            </table>
          </div>
        </div>
      </details>

    </div>\n\n    `;

const startIdx = content.indexOf(dashStartTag);
const endIdx = content.indexOf(dashEndTag);

if (startIdx === -1 || endIdx === -1) {
  console.error('ERRO: Não foi possível localizar o bloco view-dashboard no arquivo.');
  process.exit(1);
}

content = content.slice(0, startIdx) + newDashboardHtml + content.slice(endIdx);
console.log('Bloco view-dashboard substituído com sucesso!');

// ====================================================================
// 2. ATUALIZAR INICIALIZAÇÃO E AUTENTICAÇÃO JS
// ====================================================================

// Saneamento de authenticatedUser:
const oldAuthInit = `    let authenticatedUser = null;
    try {
      authenticatedUser = JSON.parse(sessionStorage.getItem("SIGQ_AUTH_USER"));
      if (authenticatedUser && (!authenticatedUser.nome || authenticatedUser.nome === "undefined")) {
        authenticatedUser = null;
        sessionStorage.removeItem("SIGQ_AUTH_USER");
      }
    } catch(e) {
      authenticatedUser = null;
    }
    let selectedLoginType = "ANALISTA";`;

const newAuthInit = `    let authenticatedUser = { role: "EQUIPE", nome: "Equipe da Qualidade" };
    try {
      const savedUser = JSON.parse(sessionStorage.getItem("SIGQ_AUTH_USER"));
      if (savedUser && savedUser.role === "GESTOR") {
        authenticatedUser = savedUser;
      }
    } catch(e) {}
    let selectedLoginType = "EQUIPE";

    function openModalGestorLogin() {
      const modal = document.getElementById("modal-gestor-login");
      if (modal) modal.classList.remove("hidden");
      const input = document.getElementById("input-gestor-pass");
      if (input) {
        input.value = "";
        input.focus();
      }
      const err = document.getElementById("gestor-login-error");
      if (err) err.classList.add("hidden");
    }

    function closeModalGestorLogin() {
      const modal = document.getElementById("modal-gestor-login");
      if (modal) modal.classList.add("hidden");
    }

    function handleGestorLogin(e) {
      e.preventDefault();
      const input = document.getElementById("input-gestor-pass");
      const enteredPass = input ? input.value.trim() : "";
      const err = document.getElementById("gestor-login-error");

      if (enteredPass === gestorPassword || enteredPass === "gestao123") {
        authenticatedUser = { role: "GESTOR", nome: "Gestor da Qualidade" };
        sessionStorage.setItem("SIGQ_AUTH_USER", JSON.stringify(authenticatedUser));
        closeModalGestorLogin();
        applyRolePermissions();
      } else {
        if (err) err.classList.remove("hidden");
      }
    }

    function exitGestorMode() {
      authenticatedUser = { role: "EQUIPE", nome: "Equipe da Qualidade" };
      sessionStorage.removeItem("SIGQ_AUTH_USER");
      applyRolePermissions();
    }`;

if (content.includes(oldAuthInit)) {
  content = content.replace(oldAuthInit, newAuthInit);
  console.log('Inicialização de autenticação atualizada!');
} else {
  console.warn('Aviso: oldAuthInit não encontrado exatamente.');
}

// ====================================================================
// 3. ATUALIZAR applyRolePermissions
// ====================================================================
const oldRolePermissionsStart = `    function applyRolePermissions() {`;
const oldRolePermissionsEnd = `    // ==============================================
    // GESTÃO DE CARTEIRA DE SETORES (GESTOR)`;

const newRolePermissions = `    function applyRolePermissions() {
      if (!authenticatedUser) {
        authenticatedUser = { role: "EQUIPE", nome: "Equipe da Qualidade" };
      }

      const isGestor = authenticatedUser.role === "GESTOR";
      const sessionBadge = document.getElementById("session-badge");
      const headerUserDesc = document.getElementById("header-user-description");
      const btnEnterGestor = document.getElementById("btn-enter-gestor");
      const gestorActiveBadge = document.getElementById("gestor-active-badge");
      const btnManageSectors = document.getElementById("btn-manage-sectors");
      const btnManageAnalysts = document.getElementById("btn-manage-analysts");
      const filterAnalistaContainer = document.getElementById("filter-analista-container");
      const tabTitleDash = document.getElementById("tab-title-dashboard");
      const cardLabelTotal = document.getElementById("card-label-total");

      if (isGestor) {
        if (sessionBadge) {
          sessionBadge.className = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200";
          sessionBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span> Modo Gestão (Acesso Total)';
        }
        if (headerUserDesc) headerUserDesc.innerText = "Gestão da Qualidade • Carteiras de Setores & Equipe";
        if (btnEnterGestor) btnEnterGestor.classList.add("hidden");
        if (gestorActiveBadge) gestorActiveBadge.classList.remove("hidden");
        if (btnManageSectors) btnManageSectors.classList.remove("hidden");
        if (btnManageAnalysts) btnManageAnalysts.classList.remove("hidden");
      } else {
        if (sessionBadge) {
          sessionBadge.className = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200";
          sessionBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span> Equipe da Qualidade';
        }
        if (headerUserDesc) headerUserDesc.innerText = "Levantamento de Pendências • Planejamento de Consultoria";
        if (btnEnterGestor) btnEnterGestor.classList.remove("hidden");
        if (gestorActiveBadge) gestorActiveBadge.classList.add("hidden");
        if (btnManageSectors) btnManageSectors.classList.add("hidden");
        if (btnManageAnalysts) btnManageAnalysts.classList.add("hidden");
      }

      if (filterAnalistaContainer) filterAnalistaContainer.classList.remove("hidden");
      if (tabTitleDash) tabTitleDash.innerText = "Dashboard de Gestão";
      if (cardLabelTotal) cardLabelTotal.innerText = "Total Consultorias";

      populateProcessDropdown();
      populateActivitySectorSelect();
      populatePlanejamentoFilterSelects();
      renderDiagnostics();
      renderActionPlan();
      renderPlanejamento();
      applyFilters();
    }\n\n`;

const permStartIdx = content.indexOf(oldRolePermissionsStart);
const permEndIdx = content.indexOf(oldRolePermissionsEnd);
if (permStartIdx !== -1 && permEndIdx !== -1) {
  content = content.slice(0, permStartIdx) + newRolePermissions + content.slice(permEndIdx);
  console.log('applyRolePermissions substituído com sucesso!');
} else {
  console.warn('Aviso: marcadores de applyRolePermissions não localizados.');
}

// ====================================================================
// 4. ATUALIZAR DIVISÃO DE SETORES POR ANALISTA NOS DROPDOWNS
// ====================================================================
const oldDropdownsStart = `    // PREENCHE OS SETORES (103 SETORES) NO FORMULÁRIO E FILTRO`;
const oldDropdownsEnd = `    function populateTimeSelectors() {`;

const newDropdowns = `    // PREENCHE OS SETORES COM AGRUPAMENTO POR CARTEIRA DE ANALISTA ("CADA ANALISTA COM SEUS SETORES")
    function populateProcessDropdown() {
      const selProcesso = document.getElementById("filter-processo");
      if (!selProcesso) return;
      const currentProcesso = selProcesso.value;
      let processoOpts = \`<option value="TODOS">Todos os Setores (\${sectors.length})</option>\`;
      
      const sortedSectors = [...sectors].sort((a,b) => a.setor.localeCompare(b.setor));
      const analystsList = analysts.map(a => getAnalystName(a)).filter(Boolean);

      analystsList.forEach(analystName => {
        const analystSectors = sortedSectors.filter(s => (s.analista || "").toLowerCase() === analystName.toLowerCase());
        if (analystSectors.length > 0) {
          processoOpts += \`<optgroup label="Carteira de \${analystName} (\${analystSectors.length} setores)">\`;
          analystSectors.forEach(s => {
            processoOpts += \`<option value="\${s.setor}">\${s.setor}</option>\`;
          });
          processoOpts += \`</optgroup>\`;
        }
      });

      const unassigned = sortedSectors.filter(s => !s.analista || !analystsList.some(a => a.toLowerCase() === s.analista.toLowerCase()));
      if (unassigned.length > 0) {
        processoOpts += \`<optgroup label="Outros Setores (\${unassigned.length})">\`;
        unassigned.forEach(s => {
          processoOpts += \`<option value="\${s.setor}">\${s.setor}</option>\`;
        });
        processoOpts += \`</optgroup>\`;
      }

      selProcesso.innerHTML = processoOpts;
      if (sortedSectors.some(s => s.setor === currentProcesso)) selProcesso.value = currentProcesso;
    }

    function populateActivitySectorSelect() {
      const actProc = document.getElementById("act-processo");
      if (!actProc) return;
      const currentVal = actProc.value;
      let html = '<option value="">Selecione um setor...</option>';

      const sortedSectors = [...sectors].sort((a,b) => a.setor.localeCompare(b.setor));
      const analystsList = analysts.map(a => getAnalystName(a)).filter(Boolean);

      analystsList.forEach(analystName => {
        const analystSectors = sortedSectors.filter(s => (s.analista || "").toLowerCase() === analystName.toLowerCase());
        if (analystSectors.length > 0) {
          html += \`<optgroup label="Carteira de \${analystName} (\${analystSectors.length} setores)">\`;
          analystSectors.forEach(s => {
            html += \`<option value="\${s.setor}">\${s.setor}</option>\`;
          });
          html += \`</optgroup>\`;
        }
      });

      const unassigned = sortedSectors.filter(s => !s.analista || !analystsList.some(a => a.toLowerCase() === s.analista.toLowerCase()));
      if (unassigned.length > 0) {
        html += \`<optgroup label="Outros Setores (\${unassigned.length})">\`;
        unassigned.forEach(s => {
          html += \`<option value="\${s.setor}">\${s.setor}</option>\`;
        });
        html += \`</optgroup>\`;
      }

      actProc.innerHTML = html;
      if (currentVal && sortedSectors.some(s => s.setor === currentVal)) actProc.value = currentVal;
    }\n\n`;

const dropStartIdx = content.indexOf(oldDropdownsStart);
const dropEndIdx = content.indexOf(oldDropdownsEnd);
if (dropStartIdx !== -1 && dropEndIdx !== -1) {
  content = content.slice(0, dropStartIdx) + newDropdowns + content.slice(dropEndIdx);
  console.log('Dropdowns com agrupamento por carteira substituídos com sucesso!');
} else {
  console.warn('Aviso: marcadores de dropdowns não localizados.');
}

// ====================================================================
// 5. ATUALIZAR checkSectorOwnership
// ====================================================================
const oldCheckSectorStart = `    function checkSectorOwnership() {`;
const oldCheckSectorEnd = `    // ==============================================
    // GESTÃO DA EQUIPE DE ANALISTAS`;

const newCheckSector = `    function checkSectorOwnership() {
      const selSector = document.getElementById("act-processo")?.value;
      const feedback = document.getElementById("sector-ownership-feedback");
      const btnSave = document.getElementById("btn-save-activity");
      const consultorSelect = document.getElementById("act-consultor");

      if (!selSector) {
        if (feedback) feedback.classList.add("hidden");
        return;
      }

      const sectorObj = sectors.find(s => s.setor === selSector);
      const titular = sectorObj ? sectorObj.analista : "";

      // Auto-seleciona analista titular no dropdown de consultor se disponível
      if (titular && consultorSelect) {
        const optExists = Array.from(consultorSelect.options).some(o => o.value === titular);
        if (optExists) consultorSelect.value = titular;
      }

      if (feedback) {
        feedback.className = "mt-1.5 p-2 rounded-xl text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 block";
        feedback.innerHTML = \`Setor da carteira de: <strong class="text-emerald-950 font-bold">\${titular || "Não Atribuído"}</strong> • Consultor sugerido automaticamente\`;
        feedback.classList.remove("hidden");
      }

      if (btnSave) {
        btnSave.innerText = "Salvar Planejamento de Consultoria";
      }
    }\n\n`;

const chkStartIdx = content.indexOf(oldCheckSectorStart);
const chkEndIdx = content.indexOf(oldCheckSectorEnd);
if (chkStartIdx !== -1 && chkEndIdx !== -1) {
  content = content.slice(0, chkStartIdx) + newCheckSector + content.slice(chkEndIdx);
  console.log('checkSectorOwnership atualizado com sucesso!');
} else {
  console.warn('Aviso: checkSectorOwnership não localizado.');
}

// ====================================================================
// 6. ATUALIZAR applyFilters, clearFilters E renderDashboardMetrics
// ====================================================================
const oldFiltersStart = `    // APLICAR FILTROS (SOMENTE ATIVIDADES APROVADAS SÃO EXIBIDAS NO DASH/CRONOGRAMA)`;
const oldFiltersEnd = `    function renderMonthlyGoals(data, chConcluida) {`;

const newFiltersAndMetrics = `    function applyFilters() {
      const fMes = document.getElementById("filter-mes")?.value || "TODOS";
      const fAnalista = document.getElementById("filter-analista")?.value || "TODOS";
      const fProcesso = document.getElementById("filter-processo")?.value || "TODOS";
      const fCategoria = document.getElementById("filter-categoria")?.value || "TODOS";
      const fStatus = document.getElementById("filter-status")?.value || "TODOS";

      const filtered = activities.filter(item => {
        if (fMes !== "TODOS" && item.mes !== fMes) return false;
        if (fAnalista !== "TODOS" && item.consultor !== fAnalista) return false;
        if (fProcesso !== "TODOS" && item.processo !== fProcesso) return false;
        if (fCategoria !== "TODOS" && item.categoria !== fCategoria) return false;
        if (fStatus !== "TODOS" && item.status !== fStatus) return false;
        return true;
      });

      renderDashboardMetrics(filtered);
      renderTable(filtered);
    }

    function clearFilters() {
      if (document.getElementById("filter-mes")) document.getElementById("filter-mes").value = "TODOS";
      if (document.getElementById("filter-analista")) document.getElementById("filter-analista").value = "TODOS";
      if (document.getElementById("filter-processo")) document.getElementById("filter-processo").value = "TODOS";
      if (document.getElementById("filter-categoria")) document.getElementById("filter-categoria").value = "TODOS";
      if (document.getElementById("filter-status")) document.getElementById("filter-status").value = "TODOS";
      updateMonthChipsUI("TODOS");
      applyFilters();
    }

    function updateGoalMetrics() {
      const val = parseInt(document.getElementById("team-monthly-goal")?.value) || 120;
      teamGoalHours = val;
      saveState();
      applyFilters();
    }

    function setDashboardMonth(mes) {
      const sel = document.getElementById("filter-mes");
      if (sel) {
        sel.value = mes;
      }
      updateMonthChipsUI(mes);
      applyFilters();
    }

    function updateMonthChipsUI(mes) {
      const chips = document.querySelectorAll(".month-chip");
      chips.forEach(btn => {
        const m = btn.getAttribute("data-month");
        if (m === mes) {
          btn.className = "month-chip px-3 py-1.5 rounded-lg font-bold border transition-all bg-emerald-700 text-white border-emerald-700 shadow-xs shrink-0";
        } else {
          btn.className = "month-chip px-3 py-1.5 rounded-lg font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shrink-0";
        }
      });

      const badge = document.getElementById("dash-active-month-badge");
      if (badge) {
        badge.innerText = mes === "TODOS" ? "Todos os Meses" : \`Mês: \${mes}\`;
      }
    }

    function renderDashboardMetrics(data) {
      window.currentDashboardData = data;
      const total = data.length;
      const concluidas = data.filter(d => (d.status || '').trim().toUpperCase() === "CONCLUÍDO").length;
      const canceladas = data.filter(d => (d.status || '').trim().toUpperCase() === "CANCELADO").length;
      const reprog = data.filter(d => (d.status || '').trim().toUpperCase() === "REPROGRAMADO").length;
      const andamento = data.filter(d => (d.status || '').trim().toUpperCase() === "EM ANDAMENTO").length;
      const pendentes = data.filter(d => (d.status || '').trim().toUpperCase() === "PENDENTE").length;

      const pct = (val) => total > 0 ? Math.round((val / total) * 100) : 0;

      // 4 Cards Executivos de Status
      const kpiTotal = document.getElementById("kpi-total");
      if (kpiTotal) kpiTotal.innerText = total;

      const kpiConcluido = document.getElementById("kpi-concluido");
      if (kpiConcluido) kpiConcluido.innerText = concluidas;
      const kpiPctConcluido = document.getElementById("kpi-pct-concluido");
      if (kpiPctConcluido) kpiPctConcluido.innerText = pct(concluidas) + "%";

      const kpiCancel = document.getElementById("kpi-cancel");
      if (kpiCancel) kpiCancel.innerText = canceladas;
      const kpiPctCancel = document.getElementById("kpi-pct-cancel");
      if (kpiPctCancel) kpiPctCancel.innerText = pct(canceladas) + "%";

      const kpiReprog = document.getElementById("kpi-reprog");
      if (kpiReprog) kpiReprog.innerText = reprog;
      const kpiPctReprog = document.getElementById("kpi-pct-reprog");
      if (kpiPctReprog) kpiPctReprog.innerText = pct(reprog) + "%";

      const chTotal = data.reduce((acc, curr) => acc + (Number(curr.ch) || 0), 0);
      const chConcluida = data.filter(d => (d.status || '').trim().toUpperCase() === "CONCLUÍDO").reduce((acc, curr) => acc + (Number(curr.ch) || 0), 0);

      const kpiChTotal = document.getElementById("kpi-ch-total");
      if (kpiChTotal) kpiChTotal.innerText = \`\${chTotal}h planejadas no período\`;
      const kpiChExecutada = document.getElementById("kpi-ch-executada");
      if (kpiChExecutada) kpiChExecutada.innerText = \`\${chConcluida}h\`;

      // Barra de Composição Global Multi-Segmento
      const barConcluidas = document.getElementById("bar-concluidas");
      if (barConcluidas) barConcluidas.style.width = pct(concluidas) + "%";
      const barCanceladas = document.getElementById("bar-canceladas");
      if (barCanceladas) barCanceladas.style.width = pct(canceladas) + "%";
      const barReprog = document.getElementById("bar-reprog");
      if (barReprog) barReprog.style.width = pct(reprog) + "%";
      const barAndamento = document.getElementById("bar-andamento");
      if (barAndamento) barAndamento.style.width = pct(andamento) + "%";
      const barPendente = document.getElementById("bar-pendente");
      if (barPendente) barPendente.style.width = pct(pendentes) + "%";

      const sConcluidas = document.getElementById("stack-pct-concluidas");
      if (sConcluidas) sConcluidas.innerText = \`\${pct(concluidas)}% (\${concluidas})\`;
      const sCanceladas = document.getElementById("stack-pct-canceladas");
      if (sCanceladas) sCanceladas.innerText = \`\${pct(canceladas)}% (\${canceladas})\`;
      const sReprog = document.getElementById("stack-pct-reprog");
      if (sReprog) sReprog.innerText = \`\${pct(reprog)}% (\${reprog})\`;
      const sAndamento = document.getElementById("stack-pct-andamento");
      if (sAndamento) sAndamento.innerText = \`\${pct(andamento)}% (\${andamento})\`;
      const sPendente = document.getElementById("stack-pct-pendente");
      if (sPendente) sPendente.innerText = \`\${pct(pendentes)}% (\${pendentes})\`;

      const activeCount = document.getElementById("dash-active-count-badge");
      if (activeCount) activeCount.innerText = \`\${total} consultorias\`;

      const currentMonth = document.getElementById("filter-mes")?.value || "TODOS";
      updateMonthChipsUI(currentMonth);

      renderAnalystPerformance("chart-analista", data);
      renderProcessDistribution("chart-processo", data);
      renderCategoryDistribution("chart-categoria", data);
      renderStatusBreakdownChart("chart-status", data);
      renderProcessStatusMatrix(data);
    }\n\n`;

const fltStartIdx = content.indexOf(oldFiltersStart);
const fltEndIdx = content.indexOf(oldFiltersEnd);
if (fltStartIdx !== -1 && fltEndIdx !== -1) {
  content = content.slice(0, fltStartIdx) + newFiltersAndMetrics + content.slice(fltEndIdx);
  console.log('applyFilters e renderDashboardMetrics atualizados!');
} else {
  console.warn('Aviso: marcadores de filtros não localizados.');
}

// ====================================================================
// 7. ATUALIZAR saveActivity (SEM TRAVA DE APROVAÇÃO, DIRETAMENTE ATIVA)
// ====================================================================
const oldSaveActStart = `    function saveActivity(e) {`;
const oldSaveActEnd = `      applyFilters();\n      renderPlanejamento();\n    }`;

const newSaveAct = `    function saveActivity(e) {
      e.preventDefault();
      const id = document.getElementById("act-id").value;
      const hStart = document.getElementById("act-hora-inicio").value;
      const hEnd = document.getElementById("act-hora-fim").value;
      const calculatedCH = Number(document.getElementById("act-ch").value) || 4;
      const chosenSector = document.getElementById("act-processo").value;

      const whyVal = document.getElementById("act-why")?.value.trim() || 'Apoio na melhoria contínua e mitigação de pendências';
      const howVal = document.getElementById("act-how")?.value.trim() || 'Consultoria presencial, treinamento e alinhamento de processos';

      const dataObj = {
        mes: document.getElementById("act-mes").value,
        data: document.getElementById("act-data").value,
        horario: \`\${hStart} - \${hEnd}\`,
        ch: calculatedCH,
        processo: chosenSector,
        categoria: document.getElementById("act-categoria").value,
        atividade: document.getElementById("act-atividade").value.trim(),
        why: whyVal,
        how: howVal,
        consultor: document.getElementById("act-consultor").value.trim(),
        responsavel: document.getElementById("act-responsavel").value.trim(),
        status: document.getElementById("act-status").value,
        aprovado: true,
        solicitante: authenticatedUser?.nome || "Equipe da Qualidade"
      };

      if (id) {
        const idx = activities.findIndex(a => a.id === Number(id));
        if (idx !== -1) {
          activities[idx] = { ...activities[idx], ...dataObj };
        }
        try {
          fetch(\`/api/atividades/\${id}\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataObj)
          }).catch(() => {});
        } catch(err) {}
      } else {
        const nextId = activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1;
        const newRecord = { id: nextId, ...dataObj };
        activities.push(newRecord);
        try {
          fetch('/api/atividades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataObj)
          }).then(r => r.json()).then(res => {
            if (res.id) newRecord.id = res.id;
          }).catch(() => {});
        } catch(err) {}
      }

      saveState();
      closeModalActivity();

      const fMes = document.getElementById("filter-mes");
      if (fMes) fMes.value = dataObj.mes;
      const planMes = document.getElementById("plan-filter-mes");
      if (planMes) planMes.value = dataObj.mes;

      applyFilters();
      renderPlanejamento();
    }`;

const saveStartIdx = content.indexOf(oldSaveActStart);
const saveEndIdx = content.indexOf(oldSaveActEnd);
if (saveStartIdx !== -1 && saveEndIdx !== -1) {
  content = content.slice(0, saveStartIdx) + newSaveAct + content.slice(saveEndIdx + oldSaveActEnd.length);
  console.log('saveActivity atualizado com sucesso!');
} else {
  console.warn('Aviso: marcadores de saveActivity não localizados.');
}

// ====================================================================
// 8. ATUALIZAR populatePlanejamentoFilterSelects E renderPlanejamento
// ====================================================================
const oldPlanFilterStart = `    function populatePlanejamentoFilterSelects() {`;
const oldPlanFilterEnd = `    function clearPlanejamentoFilters() {`;

const newPlanFilter = `    function populatePlanejamentoFilterSelects() {
      const selSetor = document.getElementById("plan-filter-setor");
      if (selSetor) {
        const cur = selSetor.value;
        const sorted = [...sectors].sort((a,b) => a.setor.localeCompare(b.setor));
        let opts = \`<option value="TODOS">Todos os Setores (\${sectors.length})</option>\`;

        const analystsList = analysts.map(a => getAnalystName(a)).filter(Boolean);
        analystsList.forEach(analystName => {
          const list = sorted.filter(s => (s.analista || "").toLowerCase() === analystName.toLowerCase());
          if (list.length > 0) {
            opts += \`<optgroup label="Carteira de \${analystName} (\${list.length} setores)">\`;
            list.forEach(s => { opts += \`<option value="\${s.setor}">\${s.setor}</option>\`; });
            opts += \`</optgroup>\`;
          }
        });

        const unassigned = sorted.filter(s => !s.analista || !analystsList.some(a => a.toLowerCase() === s.analista.toLowerCase()));
        if (unassigned.length > 0) {
          opts += \`<optgroup label="Outros Setores (\${unassigned.length})">\`;
          unassigned.forEach(s => { opts += \`<option value="\${s.setor}">\${s.setor}</option>\`; });
          opts += \`</optgroup>\`;
        }

        selSetor.innerHTML = opts;
        if (cur && Array.from(selSetor.options).some(o => o.value === cur)) selSetor.value = cur;
      }

      const selAnalista = document.getElementById("plan-filter-analista");
      if (selAnalista) {
        const cur = selAnalista.value;
        let opts = '<option value="TODOS">Todos os Analistas</option>';
        analysts.forEach(a => {
          const nome = getAnalystName(a);
          if (nome && nome !== "undefined") {
            opts += \`<option value="\${nome}">\${nome}</option>\`;
          }
        });
        selAnalista.innerHTML = opts;
        if (cur && Array.from(selAnalista.options).some(o => o.value === cur)) {
          selAnalista.value = cur;
        }
      }
    }\n\n`;

const pfStartIdx = content.indexOf(oldPlanFilterStart);
const pfEndIdx = content.indexOf(oldPlanFilterEnd);
if (pfStartIdx !== -1 && pfEndIdx !== -1) {
  content = content.slice(0, pfStartIdx) + newPlanFilter + content.slice(pfEndIdx);
  console.log('populatePlanejamentoFilterSelects atualizado com sucesso!');
} else {
  console.warn('Aviso: populatePlanejamentoFilterSelects não localizado.');
}

// Remover o bloqueio de login em initUI:
const oldInitUIAuth = `      if (authenticatedUser) {
        applyRolePermissions();
      } else {
        document.getElementById("login-screen").classList.remove("hidden");
        setLoginProfileType("ANALISTA");
      }`;

const newInitUIAuth = `      applyRolePermissions();`;

if (content.includes(oldInitUIAuth)) {
  content = content.replace(oldInitUIAuth, newInitUIAuth);
  console.log('initUI atualizado para abrir diretamente sem tela de login!');
} else {
  console.warn('Aviso: oldInitUIAuth não encontrado exatamente.');
}

// Salvar arquivo atualizado
fs.writeFileSync(filePath, content, 'utf8');
console.log('Arquivo plataforma_qualidade.html salvo com sucesso! Novo tamanho:', content.length);
