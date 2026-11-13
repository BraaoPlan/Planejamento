const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'plataforma_qualidade.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('1. Verificando e adicionando helpers de data e código de rastreio...');

// Helper functions insertion
const helperMarker = '    const MONTH_REV_MAP = {';
const helperEndMarker = '    };';

const helperCode = `
    function getCurrentMonthName() {
      const curMonthNum = String(new Date().getMonth() + 1).padStart(2, '0');
      return MONTH_REV_MAP[curMonthNum] || "NOVEMBRO";
    }

    function generateActivityCode(seqOrId) {
      if (!seqOrId) return "#CONS-001";
      if (typeof seqOrId === 'string' && seqOrId.startsWith('#CONS-')) return seqOrId;
      const num = parseInt(seqOrId, 10);
      if (isNaN(num)) return "#CONS-001";
      return \`#CONS-\${String(num).padStart(3, '0')}\`;
    }

    function getNextActivityCode() {
      let maxNum = 0;
      if (Array.isArray(activities)) {
        activities.forEach(a => {
          let val = 0;
          if (a.codigo && typeof a.codigo === 'string') {
            const m = a.codigo.match(/#CONS-(\\d+)/i);
            if (m) val = parseInt(m[1], 10);
          }
          if (!val && a.id) {
            val = parseInt(a.id, 10);
          }
          if (val > maxNum) maxNum = val;
        });
      }
      return \`#CONS-\${String(maxNum + 1).padStart(3, '0')}\`;
    }

    function ensureActivityTrackingCodes() {
      if (!Array.isArray(activities)) return;
      activities.forEach((a, idx) => {
        if (!a.codigo) {
          const idNum = parseInt(a.id, 10) || (idx + 1);
          a.codigo = generateActivityCode(idNum);
        }
      });
    }

    function applyDynamicCurrentMonth() {
      const curMonth = getCurrentMonthName();
      const selectors = ['filter-mes', 'plan-filter-mes', 'desemp-filter-mes', 'report-mes', 'relatorio-select-mes', 'act-mes'];
      selectors.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const hasOption = Array.from(el.options).some(o => o.value === curMonth);
          if (hasOption) {
            el.value = curMonth;
          }
        }
      });
    }
`;

if (!content.includes('function getCurrentMonthName()')) {
  const revMapIndex = content.indexOf(helperMarker);
  if (revMapIndex !== -1) {
    const endMapIndex = content.indexOf(helperEndMarker, revMapIndex);
    if (endMapIndex !== -1) {
      const insertPos = endMapIndex + helperEndMarker.length;
      content = content.slice(0, insertPos) + '\n' + helperCode + content.slice(insertPos);
      console.log('-> Helpers inseridos com sucesso!');
    }
  }
}

// 2. Limpeza do analista padrão em populateAnalystDropdowns
console.log('2. Ajustando populateAnalystDropdowns para não pré-selecionar analista...');
const oldPopulateConsultor = `      const actConsultor = document.getElementById("act-consultor");
      if (actConsultor) {
        let actOpts = "";
        analysts.forEach(a => {
          const nome = getAnalystName(a);
          if (nome && nome !== "undefined") {
            actOpts += \`<option value="\${nome}">\${nome}</option>\`;
          }
        });
        actConsultor.innerHTML = actOpts;
      }`;

const newPopulateConsultor = `      const actConsultor = document.getElementById("act-consultor");
      if (actConsultor) {
        let actOpts = '<option value="">Selecione o analista...</option>';
        analysts.forEach(a => {
          const nome = getAnalystName(a);
          if (nome && nome !== "undefined") {
            actOpts += \`<option value="\${nome}">\${nome}</option>\`;
          }
        });
        actConsultor.innerHTML = actOpts;
        if (!authenticatedUser || authenticatedUser.role !== "ANALISTA") {
          actConsultor.value = "";
        }
      }`;

if (content.includes(oldPopulateConsultor)) {
  content = content.replace(oldPopulateConsultor, newPopulateConsultor);
  console.log('-> populateAnalystDropdowns atualizado!');
}

// 3. Limpeza do analista padrão em openModalNewActivity
console.log('3. Ajustando openModalNewActivity para iniciar sem analista pré-selecionado e com mês vigente...');
const oldModalNewActConsultor = `      const consultorSelect = document.getElementById("act-consultor");
      if (authenticatedUser?.role === "ANALISTA") {
        consultorSelect.value = authenticatedUser.nome;
      } else {
        consultorSelect.value = getAnalystName(analysts[0]) || "";
      }`;

const newModalNewActConsultor = `      const consultorSelect = document.getElementById("act-consultor");
      if (authenticatedUser?.role === "ANALISTA") {
        consultorSelect.value = authenticatedUser.nome;
      } else {
        consultorSelect.value = "";
      }`;

if (content.includes(oldModalNewActConsultor)) {
  content = content.replace(oldModalNewActConsultor, newModalNewActConsultor);
  console.log('-> openModalNewActivity analista atualizado!');
}

// Mês em openModalNewActivity
content = content.replace(
  'const targetMonth = (currentFilteredMonth && currentFilteredMonth !== "TODOS") ? currentFilteredMonth : "OUTUBRO";',
  'const targetMonth = (currentFilteredMonth && currentFilteredMonth !== "TODOS") ? currentFilteredMonth : getCurrentMonthName();'
);

// Fallback de consultor linha 3104
content = content.replace(
  '        a.consultor = "Abraao";',
  '        a.consultor = "";'
);

// 4. clearFilters atualizado para data vigente
content = content.replace(
  'if (document.getElementById("filter-mes")) document.getElementById("filter-mes").value = "OUTUBRO";',
  'if (document.getElementById("filter-mes")) document.getElementById("filter-mes").value = getCurrentMonthName();'
);

// 5. Suporte a código e busca direta em openModalClosePlanning
console.log('4. Ajustando openModalClosePlanning para aceitar id ou codigo...');
const oldOpenModalClose = `    function openModalClosePlanning(id, initialMode) {
      const act = activities.find(a => a.id === Number(id));
      if (!act) return;`;

const newOpenModalClose = `    function openModalClosePlanning(idOrCode, initialMode) {
      let act = null;
      if (typeof idOrCode === 'string' && idOrCode.startsWith('#CONS-')) {
        act = activities.find(a => a.codigo === idOrCode);
        if (!act) {
          const num = parseInt(idOrCode.replace('#CONS-', ''), 10);
          act = activities.find(a => a.id === num);
        }
      } else {
        act = activities.find(a => a.id === Number(idOrCode)) || activities.find(a => a.codigo === String(idOrCode));
      }
      if (!act) return;
      const id = act.id;`;

if (content.includes(oldOpenModalClose)) {
  content = content.replace(oldOpenModalClose, newOpenModalClose);
  console.log('-> openModalClosePlanning atualizado!');
}

// Atualizar o badge de código no cabeçalho do modal de acompanhamento
const oldBadgeSet = 'document.getElementById("close-act-categoria-tag").innerText = act.categoria || "Consultoria";';
const newBadgeSet = `const codBadge = document.getElementById("close-act-codigo-badge");
      if (codBadge) codBadge.innerText = act.codigo || generateActivityCode(act.id);
      document.getElementById("close-act-categoria-tag").innerText = act.categoria || "Consultoria";`;

if (content.includes(oldBadgeSet) && !content.includes('close-act-codigo-badge')) {
  content = content.replace(oldBadgeSet, newBadgeSet);
  console.log('-> close-act-codigo-badge atualizado no modal!');
}

// 6. Geração de código no salvamento de atividades (saveActivity)
console.log('5. Inserindo geração sequencial de código no saveActivity...');
const oldSingleSave = `          const nextId = serverId || (activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1);
          targetRecordId = nextId;
          const newRecord = { id: nextId, ...dataObj };
          activities.push(newRecord);`;

const newSingleSave = `          const nextId = serverId || (activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1);
          targetRecordId = nextId;
          const assignedCode = dataObj.codigo || getNextActivityCode();
          const newRecord = { id: nextId, ...dataObj, codigo: assignedCode };
          activities.push(newRecord);`;

if (content.includes(oldSingleSave)) {
  content = content.replace(oldSingleSave, newSingleSave);
  console.log('-> saveActivity (single SQLite) atualizado com código!');
}

const oldFbSingleSave = `          const nextId = (activities.length > 0 ? Math.max(...activities.map(a => Number(a.id) || 0)) + 1 : 1);
          targetRecordId = nextId;
          const newRecord = { id: nextId, ...dataObj };
          activities.push(newRecord);`;

const newFbSingleSave = `          const nextId = (activities.length > 0 ? Math.max(...activities.map(a => Number(a.id) || 0)) + 1 : 1);
          targetRecordId = nextId;
          const assignedCode = dataObj.codigo || getNextActivityCode();
          const newRecord = { id: nextId, ...dataObj, codigo: assignedCode };
          activities.push(newRecord);`;

if (content.includes(oldFbSingleSave)) {
  content = content.replace(oldFbSingleSave, newFbSingleSave);
  console.log('-> saveActivity (single Firebase) atualizado com código!');
}

// Prevenir erro HTTP 405 em GitHub Pages quando Firebase não estiver ativo
const oldHttp405Branch = `          // Modo Local SQLite (INICIAR_QUALIMED.bat)
          let serverId = null;
          let singleSaveError = null;
          try {
            const res = await fetch('/api/atividades', {`;

const newHttp405Branch = `          // Modo Local SQLite (INICIAR_QUALIMED.bat) ou Nuvem Estática
          let serverId = null;
          let singleSaveError = null;
          const isStaticHost = window.location.hostname.includes('github.io');
          if (isStaticHost) {
            // Em GitHub Pages sem backend local, grava em memória e tenta sincronizar via Firebase
            if (typeof firebaseSaveActivity === 'function') {
              try { firebaseSaveActivity(dataObj); } catch(_) {}
            }
          } else {
            try {
              const res = await fetch('/api/atividades', {`;

if (content.includes(oldHttp405Branch)) {
  content = content.replace(oldHttp405Branch, newHttp405Branch);
  // fechar o else do fetch
  content = content.replace(
    `            console.warn("Erro ao persistir atividade no backend:", err);\n          }\n\n          const nextId = serverId`,
    `            console.warn("Erro ao persistir atividade no backend:", err);\n            }\n          }\n\n          const nextId = serverId`
  );
  console.log('-> Proteção contra HTTP 405 em GitHub Pages aplicada!');
}

// 7. Exibição de código no card de atividades (renderPlanejamento)
console.log('6. Adicionando badge do código no card de atividades...');
const oldCardMeta = `                <!-- Linha de Metadados: Categoria, Horário, Analista, Cumprimento -->
                <div class="flex items-center flex-wrap gap-1.5 text-[11px]">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                    \${escapeHtml(item.categoria || 'Consultoria')}\${item.subcategoria ? ' • ' + escapeHtml(item.subcategoria) : ''}
                  </span>`;

const newCardMeta = `                <!-- Linha de Metadados: Categoria, Horário, Analista, Cumprimento -->
                <div class="flex items-center flex-wrap gap-1.5 text-[11px]">
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px]">
                    \${escapeHtml(item.codigo || generateActivityCode(item.id))}
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                    \${escapeHtml(item.categoria || 'Consultoria')}\${item.subcategoria ? ' • ' + escapeHtml(item.subcategoria) : ''}
                  </span>`;

if (content.includes(oldCardMeta)) {
  content = content.replace(oldCardMeta, newCardMeta);
  console.log('-> Badge do código adicionado no card!');
}

// 8. Relatórios: Adicionar coluna Código e clique para abrir modal diretamente
console.log('7. Ajustando relatórios para abertura direta da atividade via código...');

// Relatório planejado-nao-feito
const oldTheadNaoFeito = `      } else if (repType === "planejado-nao-feito") {
        title.innerText = "Auditoria de Cumprimento Mensal: O que foi Planejado para o Setor e Não foi Feito";
        thead.innerHTML = \`
          <tr>
            <th class="py-2.5 px-3">Setor / Processo</th>`;

const newTheadNaoFeito = `      } else if (repType === "planejado-nao-feito") {
        title.innerText = "Auditoria de Cumprimento Mensal: O que foi Planejado para o Setor e Não foi Feito";
        thead.innerHTML = \`
          <tr>
            <th class="py-2.5 px-3">Código</th>
            <th class="py-2.5 px-3">Setor / Processo</th>`;

if (content.includes(oldTheadNaoFeito)) {
  content = content.replace(oldTheadNaoFeito, newTheadNaoFeito);
}

const oldRowNaoFeito = `          naoFeitas.forEach(a => {
            const comp = getActivityMonthCompliance(a);
            rows += \`
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-2.5 px-3 font-bold text-slate-900">\${a.processo}</td>`;

const newRowNaoFeito = `          naoFeitas.forEach(a => {
            const comp = getActivityMonthCompliance(a);
            const cod = a.codigo || generateActivityCode(a.id);
            rows += \`
              <tr onclick="openModalClosePlanning('\${cod}')" class="hover:bg-emerald-50/80 transition-colors cursor-pointer group" title="Clique para ver os detalhes da consultoria \${cod}">
                <td class="py-2.5 px-3 font-mono font-black text-emerald-800 text-xs whitespace-nowrap">
                  <span class="inline-flex items-center space-x-1 underline decoration-emerald-400 group-hover:text-emerald-950 font-bold">
                    <span>\${cod}</span>
                    <svg class="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  </span>
                </td>
                <td class="py-2.5 px-3 font-bold text-slate-900">\${a.processo}</td>`;

if (content.includes(oldRowNaoFeito)) {
  content = content.replace(oldRowNaoFeito, newRowNaoFeito);
  console.log('-> Relatório planejado-nao-feito atualizado com Código e clique direto!');
}

// Relatório cronograma
const oldTheadCronograma = `      if (repType === "cronograma") {
        title.innerText = "Relatório Geral do Cronograma de Consultorias";
        thead.innerHTML = \`
          <tr>
            <th class="py-2.5 px-3">Mês</th>`;

const newTheadCronograma = `      if (repType === "cronograma") {
        title.innerText = "Relatório Geral do Cronograma de Consultorias";
        thead.innerHTML = \`
          <tr>
            <th class="py-2.5 px-3">Código</th>
            <th class="py-2.5 px-3">Mês</th>`;

if (content.includes(oldTheadCronograma)) {
  content = content.replace(oldTheadCronograma, newTheadCronograma);
}

const oldRowCronograma = `        filteredActs.forEach(a => {
          rows += \`
            <tr class="hover:bg-slate-50">
              <td class="py-2.5 px-3 font-semibold">\${a.mes}</td>`;

const newRowCronograma = `        filteredActs.forEach(a => {
          const cod = a.codigo || generateActivityCode(a.id);
          rows += \`
            <tr onclick="openModalClosePlanning('\${cod}')" class="hover:bg-emerald-50/80 transition-colors cursor-pointer group" title="Clique para ver os detalhes da consultoria \${cod}">
              <td class="py-2.5 px-3 font-mono font-black text-emerald-800 text-xs whitespace-nowrap">
                <span class="inline-flex items-center space-x-1 underline decoration-emerald-400 group-hover:text-emerald-950 font-bold">
                  <span>\${cod}</span>
                  <svg class="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </span>
              </td>
              <td class="py-2.5 px-3 font-semibold">\${a.mes}</td>`;

if (content.includes(oldRowCronograma)) {
  content = content.replace(oldRowCronograma, newRowCronograma);
  console.log('-> Relatório cronograma atualizado com Código e clique direto!');
}

// 9. Inicialização da Interface (initUI e DOMContentLoaded):
// - Aplicar mês vigente dinamicamente
// - Assegurar códigos retroativos
// - Definir Landing View padrão como "Planejamento" (Atividades do Mês)
console.log('8. Configurando landing view e inicialização dinâmica...');
const oldInitUIEnd = `      applyRolePermissions();
    }`;

const newInitUIEnd = `      ensureActivityTrackingCodes();
      applyDynamicCurrentMonth();
      applyRolePermissions();
      switchTab("planejamento");
    }`;

if (content.includes(oldInitUIEnd)) {
  content = content.replace(oldInitUIEnd, newInitUIEnd);
  console.log('-> initUI atualizado com ensureActivityTrackingCodes, applyDynamicCurrentMonth e switchTab(planejamento)!');
}

// Chamar switchTab("planejamento") no DOMContentLoaded
const oldDomLoaded = `      // 1. Inicialização completa da interface (popula dropdowns de analistas, setores, filtros e pautas)
      initUI();`;

const newDomLoaded = `      // 1. Inicialização completa da interface (popula dropdowns de analistas, setores, filtros e pautas)
      initUI();
      switchTab("planejamento");`;

if (content.includes(oldDomLoaded)) {
  content = content.replace(oldDomLoaded, newDomLoaded);
  console.log('-> DOMContentLoaded configurado para landing view em planejamento!');
}

// Inserir fallback inline de FIREBASE_CONFIG para garantir que mesmo em falha de arquivo externo o objeto exista
if (!content.includes('window.FIREBASE_CONFIG = window.FIREBASE_CONFIG ||')) {
  const headScript = `<script src="./firebase-config.js"></script>`;
  const inlineFbConfig = `<script src="./firebase-config.js"></script>
  <script>
    window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || {
      apiKey: "AIzaSyAXcoKrSFAY1AceZPHaeQA34RoFe-wT1zE",
      authDomain: "plannerx-4e4ac.firebaseapp.com",
      projectId: "plannerx-4e4ac",
      storageBucket: "plannerx-4e4ac.firebasestorage.app",
      messagingSenderId: "298021409964",
      appId: "1:298021409964:web:af085e7d97b262159cfb09",
      measurementId: "G-Y72X5M944M"
    };
  </script>`;
  content = content.replace(headScript, inlineFbConfig);
  console.log('-> Fallback inline do Firebase adicionado ao head!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Atualização de plataforma_qualidade.html concluída com sucesso!');
