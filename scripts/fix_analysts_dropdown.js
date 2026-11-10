const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'plataforma_qualidade.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Garantir que initUI() seja chamado no DOMContentLoaded antes ou junto ao Firebase
const oldDomLoaded = `    window.addEventListener("DOMContentLoaded", () => {
      // 1. Detectar protocolo local (file://) e exibir banner explicativo
      if (window.location.protocol === 'file:') {
        const fileBanner = document.getElementById("file-protocol-warning-banner");
        if (fileBanner) fileBanner.classList.remove("hidden");
        const urlCode = document.getElementById("file-mode-server-url");
        if (urlCode) urlCode.innerText = getApiBaseUrl();
        const openBtn = document.getElementById("btn-open-network-url");
        if (openBtn) openBtn.href = getApiBaseUrl();
      }

      // 1. Inicializar Firebase se configurado
      const fbRunning = initFirebaseClient();

      // 2. Carregar dados centralizados do banco SQLite se Firebase não estiver ativo
      if (!fbRunning) {
        loadDataFromSQLite();
      }`;

const newDomLoaded = `    window.addEventListener("DOMContentLoaded", () => {
      // 1. Inicialização completa da interface (popula dropdowns de analistas, setores, filtros e pautas)
      initUI();

      // 2. Detectar protocolo local (file://) e exibir banner explicativo
      if (window.location.protocol === 'file:') {
        const fileBanner = document.getElementById("file-protocol-warning-banner");
        if (fileBanner) fileBanner.classList.remove("hidden");
        const urlCode = document.getElementById("file-mode-server-url");
        if (urlCode) urlCode.innerText = getApiBaseUrl();
        const openBtn = document.getElementById("btn-open-network-url");
        if (openBtn) openBtn.href = getApiBaseUrl();
      }

      // 3. Inicializar Firebase se configurado
      const fbRunning = initFirebaseClient();

      // 4. Carregar dados centralizados do banco SQLite se Firebase não estiver ativo
      if (!fbRunning) {
        loadDataFromSQLite();
      }`;

if (html.includes(oldDomLoaded)) {
  html = html.replace(oldDomLoaded, newDomLoaded);
  console.log('1. DOMContentLoaded atualizado para chamar initUI() no início');
} else {
  console.log('1. DOMContentLoaded: padrão não encontrado exatamente, verificando alternativo');
}

// 2. Garantir populateAnalystDropdowns() em openModalNewActivity
const oldOpenAct = `      populateTimeSelectors();
      populateActivitySectorSelect();
      populateActivityCategoryCatalog();

      const sectorToUse = preselectedSector || (currentSelectedSector !== 'TODOS' ? currentSelectedSector : '');
      if (sectorToUse) {
        document.getElementById("act-processo").value = sectorToUse;
      }

      const consultorSelect = document.getElementById("act-consultor");`;

const newOpenAct = `      populateTimeSelectors();
      populateActivitySectorSelect();
      populateActivityCategoryCatalog();
      populateAnalystDropdowns();

      const sectorToUse = preselectedSector || (currentSelectedSector !== 'TODOS' ? currentSelectedSector : '');
      if (sectorToUse) {
        document.getElementById("act-processo").value = sectorToUse;
      }

      const consultorSelect = document.getElementById("act-consultor");`;

if (html.includes(oldOpenAct)) {
  html = html.replace(oldOpenAct, newOpenAct);
  console.log('2. openModalNewActivity atualizado com populateAnalystDropdowns()');
}

// 3. Garantir populateAnalystDropdowns() em editActivity
const oldEditAct = `      populateActivitySectorSelect();
      document.getElementById("act-processo").value = act.processo;

      populateActivityCategoryCatalog();`;

const newEditAct = `      populateAnalystDropdowns();
      populateActivitySectorSelect();
      document.getElementById("act-processo").value = act.processo;

      populateActivityCategoryCatalog();`;

if (html.includes(oldEditAct)) {
  html = html.replace(oldEditAct, newEditAct);
  console.log('3. editActivity atualizado com populateAnalystDropdowns()');
}

// 4. Atualizar listener de usuarios no Firebase
const oldUsuariosListener = `      // 5. Coleção 'usuarios' (analistas e gestor) em tempo real
      firestoreDb.collection("usuarios").onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => list.push(doc.data()));
          window.firebaseUsers = list;
        }
      });`;

const newUsuariosListener = `      // 5. Coleção 'usuarios' (analistas e gestor) em tempo real
      firestoreDb.collection("usuarios").onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => list.push(doc.data()));
          window.firebaseUsers = list;
          const analistasDocs = list.filter(u => u.perfil === 'ANALISTA' && (u.ativo === 1 || u.ativo === true));
          if (analistasDocs.length > 0) {
            analysts = analistasDocs.map(u => ({ nome: u.nome, pin: u.pin || "1234" }));
            saveState();
            populateAnalystDropdowns();
            populateLoginAnalystSelect();
            if (typeof populatePlanejamentoFilterSelects === 'function') populatePlanejamentoFilterSelects();
          }
        }
      });`;

if (html.includes(oldUsuariosListener)) {
  html = html.replace(oldUsuariosListener, newUsuariosListener);
  console.log('4. setupFirestoreRealtimeListeners atualizado para carregar analistas do Firestore');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Arquivo plataforma_qualidade.html salvo com sucesso.');
