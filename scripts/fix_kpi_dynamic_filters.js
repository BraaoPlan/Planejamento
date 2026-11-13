const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'plataforma_qualidade.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('1. Ajustando classes HTML para que a tela inicie na Minha Pauta (Todo o Mês) com Filtros Abertos...');

// 1. Botões de modo de exibição no HTML
const oldBtnModeSetor = `<button id="btn-mode-setor" onclick="setPlanejamentoViewMode('setores')" class="px-3 py-1.5 rounded-lg bg-white text-emerald-900 shadow-xs flex items-center space-x-1.5 transition-all font-bold">`;
const newBtnModeSetor = `<button id="btn-mode-setor" onclick="setPlanejamentoViewMode('setores')" class="px-3 py-1.5 rounded-lg text-slate-600 hover:text-emerald-800 flex items-center space-x-1.5 transition-all font-semibold">`;
if (content.includes(oldBtnModeSetor)) {
  content = content.replace(oldBtnModeSetor, newBtnModeSetor);
}

const oldBtnModePauta = `<button id="btn-mode-minhapauta" onclick="setPlanejamentoViewMode('minhapauta')" class="px-3 py-1.5 rounded-lg text-slate-600 hover:text-emerald-800 flex items-center space-x-1.5 transition-all font-semibold">`;
const newBtnModePauta = `<button id="btn-mode-minhapauta" onclick="setPlanejamentoViewMode('minhapauta')" class="px-3 py-1.5 rounded-lg bg-white text-emerald-900 shadow-xs flex items-center space-x-1.5 transition-all font-bold">`;
if (content.includes(oldBtnModePauta)) {
  content = content.replace(oldBtnModePauta, newBtnModePauta);
}

// 2. Filtros Avançados abertos por padrão
const oldFiltersBody = `<div id="plan-filters-body" class="hidden pt-3 border-t border-slate-100 space-y-3">`;
const newFiltersBody = `<div id="plan-filters-body" class="pt-3 border-t border-slate-100 space-y-3">`;
if (content.includes(oldFiltersBody)) {
  content = content.replace(oldFiltersBody, newFiltersBody);
}

const oldToggleText = `<span id="btn-toggle-plan-filters-text">Filtros Avançados</span>`;
const newToggleText = `<span id="btn-toggle-plan-filters-text">Ocultar Filtros</span>`;
if (content.includes(oldToggleText)) {
  content = content.replace(oldToggleText, newToggleText);
}

// 3. Containers: Setores oculto, Minha Pauta visível
const oldContainerSetores = `<div id="plan-mode-container-setores" class="space-y-4">`;
const newContainerSetores = `<div id="plan-mode-container-setores" class="hidden space-y-4">`;
if (content.includes(oldContainerSetores)) {
  content = content.replace(oldContainerSetores, newContainerSetores);
}

const oldContainerPauta = `<div id="plan-mode-container-minhapauta" class="hidden space-y-4">`;
const newContainerPauta = `<div id="plan-mode-container-minhapauta" class="space-y-4">`;
if (content.includes(oldContainerPauta)) {
  content = content.replace(oldContainerPauta, newContainerPauta);
}

// 4. Botões de período da pauta: Todo o Mês ativo por padrão
const oldBtnHoje = `<button id="pauta-btn-hoje" onclick="setPautaPeriod('hoje')" class="px-3 py-1 rounded-lg bg-emerald-500 text-white font-black shadow-xs transition-all">Hoje</button>`;
const newBtnHoje = `<button id="pauta-btn-hoje" onclick="setPautaPeriod('hoje')" class="px-3 py-1 rounded-lg text-emerald-100 hover:text-white transition-all font-bold">Hoje</button>`;
if (content.includes(oldBtnHoje)) {
  content = content.replace(oldBtnHoje, newBtnHoje);
}

const oldBtnMes = `<button id="pauta-btn-mes" onclick="setPautaPeriod('mes')" class="px-3 py-1 rounded-lg text-emerald-100 hover:text-white transition-all font-bold">Todo o Mês</button>`;
const newBtnMes = `<button id="pauta-btn-mes" onclick="setPautaPeriod('mes')" class="px-3 py-1 rounded-lg bg-emerald-500 text-white font-black shadow-xs transition-all">Todo o Mês</button>`;
if (content.includes(oldBtnMes)) {
  content = content.replace(oldBtnMes, newBtnMes);
}

// 5. Variáveis de estado no JS
console.log('2. Atualizando variáveis de estado iniciais no JS...');
content = content.replace(
  `let currentPlanejamentoViewMode = 'setores'; // 'setores', 'tabela' ou 'minhapauta'`,
  `let currentPlanejamentoViewMode = 'minhapauta'; // 'setores', 'tabela' ou 'minhapauta'`
);
content = content.replace(
  `let currentPautaPeriod = 'hoje'; // 'hoje', 'semana' ou 'mes'`,
  `let currentPautaPeriod = 'mes'; // 'hoje', 'semana' ou 'mes'`
);
content = content.replace(
  `let isPlanFiltersHidden = true; // Inicia oculto para manter a tela limpa`,
  `let isPlanFiltersHidden = false; // Inicia aberto com filtros visíveis`
);

// 6. Atualização dinâmica dos 5 cards de KPI no topo baseada no filtro selecionado
console.log('3. Atualizando lógica de recálculo dos KPIs para responder dinamicamente aos filtros...');

const oldKpiGeneralFunc = `    function updatePlanejamentoKpiCardsForGeneral() {
      let totalHoras = 0, horasConcluidas = 0, acoesConcluidas = 0;
      let horasAndamento = 0, acoesAndamento = 0;
      let horasPendentes = 0, acoesPendentes = 0;
      let horasOutros = 0, acoesOutros = 0;

      activities.forEach(a => {
        const ch = parseFloat(a.ch) || 4;
        totalHoras += ch;
        if (a.status === 'CONCLUÍDO') {
          horasConcluidas += ch; acoesConcluidas++;
        } else if (a.status === 'EM ANDAMENTO') {
          horasAndamento += ch; acoesAndamento++;
        } else if (a.status === 'PENDENTE') {
          horasPendentes += ch; acoesPendentes++;
        } else {
          horasOutros += ch; acoesOutros++;
        }
      });

      const pctConcl = totalHoras > 0 ? ((horasConcluidas / totalHoras) * 100).toFixed(1) : "0.0";
      const pctAndam = totalHoras > 0 ? ((horasAndamento / totalHoras) * 100).toFixed(1) : "0.0";
      const pctPend = totalHoras > 0 ? ((horasPendentes / totalHoras) * 100).toFixed(1) : "0.0";
      const pctOutros = totalHoras > 0 ? ((horasOutros / totalHoras) * 100).toFixed(1) : "0.0";

      const elTotH = document.getElementById("plan-kpi-total-horas");
      const elTotA = document.getElementById("plan-kpi-total-acoes");
      if (elTotH) elTotH.innerText = \`\${totalHoras}h\`;
      if (elTotA) elTotA.innerText = \`\${activities.length} ações\`;

      const elConclH = document.getElementById("plan-kpi-horas-concluidas");
      const elConclP = document.getElementById("plan-kpi-pct-concluidas");
      const elConclA = document.getElementById("plan-kpi-acoes-concluidas");
      if (elConclH) elConclH.innerText = \`\${horasConcluidas}h\`;
      if (elConclP) elConclP.innerText = \`\${pctConcl}%\`;
      if (elConclA) elConclA.innerText = \`\${acoesConcluidas} ações concluídas\`;

      const elAndamH = document.getElementById("plan-kpi-horas-andamento");
      const elAndamP = document.getElementById("plan-kpi-pct-andamento");
      const elAndamA = document.getElementById("plan-kpi-acoes-andamento");
      if (elAndamH) elAndamH.innerText = \`\${horasAndamento}h\`;
      if (elAndamP) elAndamP.innerText = \`\${pctAndam}%\`;
      if (elAndamA) elAndamA.innerText = \`\${acoesAndamento} ações em andamento\`;

      const elPendH = document.getElementById("plan-kpi-horas-pendentes");
      const elPendP = document.getElementById("plan-kpi-pct-pendentes");
      const elPendA = document.getElementById("plan-kpi-acoes-pendentes");
      if (elPendH) elPendH.innerText = \`\${horasPendentes}h\`;
      if (elPendP) elPendP.innerText = \`\${pctPend}%\`;
      if (elPendA) elPendA.innerText = \`\${acoesPendentes} ações a iniciar\`;

      const elOutH = document.getElementById("plan-kpi-horas-outros");
      const elOutP = document.getElementById("plan-kpi-pct-outros");
      const elOutA = document.getElementById("plan-kpi-acoes-outros");
      if (elOutH) elOutH.innerText = \`\${horasOutros}h\`;
      if (elOutP) elOutP.innerText = \`\${pctOutros}%\`;
      if (elOutA) elOutA.innerText = \`\${acoesOutros} reprogramadas/canc.\`;
    }`;

const newKpiGeneralFunc = `    function updatePlanejamentoKpiCards(list) {
      const targetList = Array.isArray(list) ? list : activities;
      let totalHoras = 0, totalAcoes = targetList.length;
      let horasConcluidas = 0, acoesConcluidas = 0;
      let horasAndamento = 0, acoesAndamento = 0;
      let horasPendentes = 0, acoesPendentes = 0;
      let horasOutros = 0, acoesOutros = 0;

      targetList.forEach(a => {
        const ch = parseFloat(a.ch) || 4;
        totalHoras += ch;
        const status = (a.status || '').toUpperCase().trim();
        if (status === 'CONCLUÍDO' || status === 'CONCLUIDO') {
          horasConcluidas += ch;
          acoesConcluidas++;
        } else if (status === 'EM ANDAMENTO') {
          horasAndamento += ch;
          acoesAndamento++;
        } else if (status === 'PENDENTE') {
          horasPendentes += ch;
          acoesPendentes++;
        } else {
          horasOutros += ch;
          acoesOutros++;
        }
      });

      const pctConcl = totalHoras > 0 ? ((horasConcluidas / totalHoras) * 100).toFixed(1) : "0.0";
      const pctAndam = totalHoras > 0 ? ((horasAndamento / totalHoras) * 100).toFixed(1) : "0.0";
      const pctPend = totalHoras > 0 ? ((horasPendentes / totalHoras) * 100).toFixed(1) : "0.0";
      const pctOutros = totalHoras > 0 ? ((horasOutros / totalHoras) * 100).toFixed(1) : "0.0";

      const elTotH = document.getElementById("plan-kpi-total-horas");
      const elTotA = document.getElementById("plan-kpi-total-acoes");
      if (elTotH) elTotH.innerText = \`\${totalHoras}h\`;
      if (elTotA) elTotA.innerText = \`\${totalAcoes} ações\`;

      const elConclH = document.getElementById("plan-kpi-horas-concluidas");
      const elConclP = document.getElementById("plan-kpi-pct-concluidas");
      const elConclA = document.getElementById("plan-kpi-acoes-concluidas");
      if (elConclH) elConclH.innerText = \`\${horasConcluidas}h\`;
      if (elConclP) elConclP.innerText = \`\${pctConcl}%\`;
      if (elConclA) elConclA.innerText = \`\${acoesConcluidas} ações concluídas\`;

      const elAndamH = document.getElementById("plan-kpi-horas-andamento");
      const elAndamP = document.getElementById("plan-kpi-pct-andamento");
      const elAndamA = document.getElementById("plan-kpi-acoes-andamento");
      if (elAndamH) elAndamH.innerText = \`\${horasAndamento}h\`;
      if (elAndamP) elAndamP.innerText = \`\${pctAndam}%\`;
      if (elAndamA) elAndamA.innerText = \`\${acoesAndamento} ações em andamento\`;

      const elPendH = document.getElementById("plan-kpi-horas-pendentes");
      const elPendP = document.getElementById("plan-kpi-pct-pendentes");
      const elPendA = document.getElementById("plan-kpi-acoes-pendentes");
      if (elPendH) elPendH.innerText = \`\${horasPendentes}h\`;
      if (elPendP) elPendP.innerText = \`\${pctPend}%\`;
      if (elPendA) elPendA.innerText = \`\${acoesPendentes} ações a iniciar\`;

      const elOutH = document.getElementById("plan-kpi-horas-outros");
      const elOutP = document.getElementById("plan-kpi-pct-outros");
      const elOutA = document.getElementById("plan-kpi-acoes-outros");
      if (elOutH) elOutH.innerText = \`\${horasOutros}h\`;
      if (elOutP) elOutP.innerText = \`\${pctOutros}%\`;
      if (elOutA) elOutA.innerText = \`\${acoesOutros} reprogramadas/canc.\`;
    }

    function updatePlanejamentoKpiCardsForGeneral(filteredList) {
      if (Array.isArray(filteredList)) {
        updatePlanejamentoKpiCards(filteredList);
        return;
      }
      const fMes = document.getElementById("plan-filter-mes")?.value || "TODOS";
      const fAnalista = document.getElementById("plan-filter-analista")?.value || "TODOS";
      const fStatus = document.getElementById("plan-filter-status")?.value || "TODOS";
      const search = (document.getElementById("plan-filter-search")?.value || "").toLowerCase().trim();

      const filtered = activities.filter(item => {
        if (fMes !== "TODOS" && item.mes !== fMes) return false;
        if (fAnalista !== "TODOS" && (item.consultor || "").toLowerCase() !== fAnalista.toLowerCase()) return false;
        if (fStatus !== "TODOS" && item.status !== fStatus) return false;
        if (search) {
          const match = (item.atividade || "").toLowerCase().includes(search) ||
                        (item.consultor || "").toLowerCase().includes(search) ||
                        (item.responsavel || "").toLowerCase().includes(search) ||
                        (item.categoria || "").toLowerCase().includes(search) ||
                        (item.processo || "").toLowerCase().includes(search);
          if (!match) return false;
        }
        return true;
      });
      updatePlanejamentoKpiCards(filtered);
    }`;

if (content.includes(oldKpiGeneralFunc)) {
  content = content.replace(oldKpiGeneralFunc, newKpiGeneralFunc);
  console.log('-> updatePlanejamentoKpiCards implementado com sucesso!');
}

// 7. Em renderPlanejamento, calcular globalFilteredActs antes e atualizar os cards com a lista filtrada
const oldRenderPlanKpiCall = `      if (isAllSectorsMode) {
        // ATUALIZAR KPIS GERAIS DA QUALIDADE
        updatePlanejamentoKpiCardsForGeneral();

        // Filtro global para cálculo geral
        let globalFilteredActs = activities.filter(item => {`;

const newRenderPlanKpiCall = `      // Filtro global para cálculo geral conforme seletores ativos
      let globalFilteredActs = activities.filter(item => {
        if (!isAllSectorsMode && (item.processo || '').trim().toLowerCase() !== currentSelectedSector.trim().toLowerCase()) return false;
        if (fMes !== "TODOS" && item.mes !== fMes) return false;
        if (fAnalista !== "TODOS" && (item.consultor || "").toLowerCase() !== fAnalista.toLowerCase()) return false;
        if (fStatus !== "TODOS" && item.status !== fStatus) return false;
        if (search) {
          const match = (item.atividade || "").toLowerCase().includes(search) ||
                        (item.consultor || "").toLowerCase().includes(search) ||
                        (item.responsavel || "").toLowerCase().includes(search) ||
                        (item.categoria || "").toLowerCase().includes(search) ||
                        (item.processo || "").toLowerCase().includes(search);
          if (!match) return false;
        }
        return true;
      });

      // ATUALIZAR KPIS GERAIS DA QUALIDADE DINAMICAMENTE CONFORME FILTRO SELECIONADO
      updatePlanejamentoKpiCards(globalFilteredActs);

      if (currentPlanejamentoViewMode === 'minhapauta') {
        renderMinhaPauta();
      }

      if (isAllSectorsMode) {`;

if (content.includes(oldRenderPlanKpiCall)) {
  content = content.replace(oldRenderPlanKpiCall, newRenderPlanKpiCall);
  console.log('-> renderPlanejamento atualizado para recalcular KPIs!');
}

// Quando um setor específico estiver selecionado
const oldSectorKpiCall = `updatePlanejamentoKpiCardsForSector(secTotalHoras, allActsInSector.length, secConcluidas, secAndamento, secPendentes, secOutros);`;
const newSectorKpiCall = `updatePlanejamentoKpiCards(allActsInSector);`;
if (content.includes(oldSectorKpiCall)) {
  content = content.replace(oldSectorKpiCall, newSectorKpiCall);
}

// 8. Em renderMinhaPauta, sincronizar os KPIs superiores com o período e filtros ativos
const oldMinhaPautaMetric = `      // Renderizar Resumo Strip
      if (summaryStrip) {`;

const newMinhaPautaMetric = `      // Sincronizar dinamicamente os KPIs superiores com as atividades filtradas na Pauta
      updatePlanejamentoKpiCards(filtered);

      // Renderizar Resumo Strip
      if (summaryStrip) {`;

if (content.includes(oldMinhaPautaMetric)) {
  content = content.replace(oldMinhaPautaMetric, newMinhaPautaMetric);
  console.log('-> renderMinhaPauta sincronizado com os cards superiores!');
}

// 9. Em populatePautaAnalystSelect, iniciar com TODOS
const oldPautaAnalystDefault = `      } else if (analystNames.length > 0) {
        sel.value = analystNames[0];
      }`;

const newPautaAnalystDefault = `      } else {
        sel.value = "TODOS";
      }`;

if (content.includes(oldPautaAnalystDefault)) {
  content = content.replace(oldPautaAnalystDefault, newPautaAnalystDefault);
  console.log('-> populatePautaAnalystSelect atualizado para padrão TODOS!');
}

// 10. Em setPlanejamentoViewMode, garantir que ao alternar modos renderize o correto
const oldSetViewMode = `      if (isPauta) {
        populatePautaAnalystSelect();
        renderMinhaPauta();
      }
    }`;

const newSetViewMode = `      if (isPauta) {
        populatePautaAnalystSelect();
        renderMinhaPauta();
      } else {
        renderPlanejamento();
      }
    }`;

if (content.includes(oldSetViewMode)) {
  content = content.replace(oldSetViewMode, newSetViewMode);
}

// 11. Em initUI, chamar setPlanejamentoViewMode('minhapauta') e setPautaPeriod('mes')
const oldInitUIEnd = `      applyRolePermissions();
      switchTab("planejamento");
    }`;

const newInitUIEnd = `      applyRolePermissions();
      switchTab("planejamento");
      setPlanejamentoViewMode("minhapauta");
      setPautaPeriod("mes");
    }`;

if (content.includes(oldInitUIEnd)) {
  content = content.replace(oldInitUIEnd, newInitUIEnd);
  console.log('-> initUI atualizado para abrir diretamente na tela da Pauta com Todo o Mês!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Concluído com sucesso!');
