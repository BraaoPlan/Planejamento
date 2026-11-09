const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'plataforma_qualidade.html');
let html = fs.readFileSync(filePath, 'utf8');

// Backup de segurança
fs.writeFileSync(filePath + '.bak_pre_firebase', html, 'utf8');
console.log('Backup criado: plataforma_qualidade.html.bak_pre_firebase');

// 1. Inclusão dos Scripts Firebase no <head>
const headMarker = '<script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>';
const firebaseHeadScripts = `  <!-- Firebase Web SDK (v10 compat) para Hospedagem Estática e Tempo Real (GitHub Pages) -->
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
  <script src="./firebase-config.js"></script>

  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>`;

if (!html.includes('firebase-firestore-compat.js')) {
  html = html.replace(headMarker, firebaseHeadScripts);
  console.log('1. Scripts Firebase injetados no <head>');
} else {
  console.log('1. Scripts Firebase já presentes no <head>');
}

// 2. Motor de Integração do Cloud Firestore (São Paulo)
const sqliteHeader = `    // ========================================================
    // CARREGAMENTO CENTRALIZADO DO BANCO SQLITE
    // ========================================================`;

const firebaseEngine = `    // ========================================================
    // INTEGRAÇÃO CLOUD FIRESTORE (TEMPO REAL - SÃO PAULO)
    // ========================================================
    let firestoreDb = null;
    let isFirebaseActive = false;

    function initFirebaseClient() {
      let cfg = window.FIREBASE_CONFIG;
      if (!cfg || !cfg.apiKey || cfg.apiKey.includes("SUA_API_KEY")) {
        try {
          const stored = localStorage.getItem("SIGQ_FIREBASE_CONFIG");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.apiKey && !parsed.apiKey.includes("SUA_API_KEY")) {
              cfg = parsed;
              window.FIREBASE_CONFIG = parsed;
            }
          }
        } catch(e) {}
      }

      if (typeof firebase !== 'undefined' && cfg && cfg.apiKey && !cfg.apiKey.includes("SUA_API_KEY")) {
        try {
          if (!firebase.apps.length) {
            firebase.initializeApp(cfg);
          }
          firestoreDb = firebase.firestore();
          try {
            firestoreDb.enablePersistence({ synchronizeTabs: true }).catch(() => {});
          } catch(e) {}

          isFirebaseActive = true;
          console.log("[SIGQ Firebase] Conectado ao Cloud Firestore na região southamerica-east1 (São Paulo)!");
          setupFirestoreRealtimeListeners();
          return true;
        } catch (err) {
          console.error("[SIGQ Firebase] Erro ao inicializar Firebase:", err);
          return false;
        }
      } else {
        console.log("[SIGQ] Firebase não configurado. Utilizando banco local SQLite ou cache.");
        return false;
      }
    }

    function setupFirestoreRealtimeListeners() {
      if (!firestoreDb) return;

      const badge = document.getElementById("realtime-sync-badge");
      const text = document.getElementById("realtime-sync-text");
      if (badge) badge.classList.remove("hidden");
      if (text) text.innerText = "Firebase Nuvem Ativo";

      // 1. Coleção 'atividades' em tempo real
      firestoreDb.collection("atividades").onSnapshot((snapshot) => {
        if (snapshot.empty && activities.length > 0) {
          syncLocalActivitiesToFirestore();
          return;
        }

        const list = [];
        snapshot.forEach(doc => {
          const d = doc.data();
          const docId = !isNaN(Number(doc.id)) ? Number(doc.id) : doc.id;
          list.push({ ...d, id: docId });
        });

        if (list.length > 0) {
          list.sort((a, b) => (a.data || '').localeCompare(b.data || '') || (a.id - b.id));
          activities = list;
          saveState();

          const isModalActiveOpen = !document.getElementById("modal-activity")?.classList.contains("hidden") ||
                                   !document.getElementById("modal-close-planning")?.classList.contains("hidden") ||
                                   !document.getElementById("modal-action-5w2h")?.classList.contains("hidden") ||
                                   !document.getElementById("modal-edit-diag")?.classList.contains("hidden");

          if (!isModalActiveOpen) {
            renderPlanejamento();
            if (currentPlanejamentoViewMode === 'minhapauta') renderMinhaPauta();
            renderActionPlan();
            if (typeof renderDashboard === 'function') renderDashboard();
            if (typeof renderDesempenhoTab === 'function') renderDesempenhoTab();
          }

          showNetworkSyncToast("Consultorias sincronizadas em tempo real (Firebase)!");
        }
      }, (err) => {
        console.warn("[SIGQ Firebase] Listener de atividades:", err);
      });

      // 2. Coleção 'setores' em tempo real
      firestoreDb.collection("setores").onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => list.push(doc.data()));
          if (list.length > 0) {
            sectors = list;
            saveState();
            populateProcessDropdown();
            populateActivitySectorSelect();
            populatePlanejamentoFilterSelects();
          }
        }
      });

      // 3. Coleção 'diagnosticos' em tempo real
      firestoreDb.collection("diagnosticos").onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => list.push(doc.data()));
          if (list.length > 0) {
            diagnostics = list;
            saveState();
            renderDiagnostics();
          }
        }
      });

      // 4. Coleção 'planos_5w2h' em tempo real
      firestoreDb.collection("planos_5w2h").onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => {
            const d = doc.data();
            list.push({ ...d, id: !isNaN(Number(doc.id)) ? Number(doc.id) : doc.id });
          });
          actions5w2h = list;
          saveState();
          renderActionPlan();
        }
      });

      // 5. Coleção 'usuarios' (analistas e gestor) em tempo real
      firestoreDb.collection("usuarios").onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => list.push(doc.data()));
          window.firebaseUsers = list;
        }
      });
    }

    async function syncLocalActivitiesToFirestore() {
      if (!firestoreDb || activities.length === 0) return;
      try {
        console.log(\`[SIGQ Firebase] Inicializando Firestore com \${activities.length} atividades...\`);
        const batch = firestoreDb.batch();
        activities.forEach(a => {
          const ref = firestoreDb.collection("atividades").doc(String(a.id));
          batch.set(ref, a, { merge: true });
        });
        await batch.commit();
        console.log("[SIGQ Firebase] Sincronização inicial concluída com sucesso!");
      } catch(e) {
        console.warn("[SIGQ Firebase] Erro ao sincronizar atividades locais:", e);
      }
    }

    async function firebaseSaveActivity(actObj) {
      if (!firestoreDb) return;
      try {
        await firestoreDb.collection("atividades").doc(String(actObj.id)).set(actObj, { merge: true });
      } catch(err) {
        console.error("[SIGQ Firebase] Erro ao salvar atividade:", err);
      }
    }

    async function firebaseDeleteActivity(id) {
      if (!firestoreDb) return;
      try {
        await firestoreDb.collection("atividades").doc(String(id)).delete();
      } catch(err) {
        console.error("[SIGQ Firebase] Erro ao deletar atividade:", err);
      }
    }

    async function firebaseSavePlan5w2h(planObj) {
      if (!firestoreDb) return;
      try {
        await firestoreDb.collection("planos_5w2h").doc(String(planObj.id)).set(planObj, { merge: true });
      } catch(err) {
        console.error("[SIGQ Firebase] Erro ao salvar plano 5W2H:", err);
      }
    }

    async function firebaseDeletePlan5w2h(id) {
      if (!firestoreDb) return;
      try {
        await firestoreDb.collection("planos_5w2h").doc(String(id)).delete();
      } catch(err) {
        console.error("[SIGQ Firebase] Erro ao deletar plano 5W2H:", err);
      }
    }

    window.initFirebaseClient = initFirebaseClient;
    window.firebaseSaveActivity = firebaseSaveActivity;
    window.firebaseDeleteActivity = firebaseDeleteActivity;
    window.firebaseSavePlan5w2h = firebaseSavePlan5w2h;
    window.firebaseDeletePlan5w2h = firebaseDeletePlan5w2h;

` + sqliteHeader;

if (!html.includes('initFirebaseClient')) {
  html = html.replace(sqliteHeader, firebaseEngine);
  console.log('2. Motor Firebase adicionado antes de loadDataFromSQLite');
} else {
  console.log('2. Motor Firebase já presente');
}

// 3. Atualizar deleteActivity para sincronizar no Firebase
const deleteActivityTarget = `        activities = activities.filter(a => a.id !== id);

        // Sincroniza SQLite backend`;
const deleteActivityReplacement = `        activities = activities.filter(a => a.id !== id);

        // Sincroniza Cloud Firestore (São Paulo)
        if (typeof firebaseDeleteActivity === 'function') {
          firebaseDeleteActivity(id);
        }

        // Sincroniza SQLite backend`;

if (html.includes(deleteActivityTarget)) {
  html = html.replace(deleteActivityTarget, deleteActivityReplacement);
  console.log('3. deleteActivity atualizado com firebaseDeleteActivity');
}

// 4. Atualizar saveActivity para sincronizar no Firebase
const recurringSaveTarget = `        recurringPayload.forEach((item, idx) => {
          const newId = insertedIds[idx] || ((activities.length > 0 ? Math.max(...activities.map(a => a.id)) : 0) + 1 + idx);
          activities.push({ id: newId, ...item });
        });`;

const recurringSaveReplacement = `        recurringPayload.forEach((item, idx) => {
          const newId = insertedIds[idx] || ((activities.length > 0 ? Math.max(...activities.map(a => a.id)) : 0) + 1 + idx);
          activities.push({ id: newId, ...item });
        });

        // Sincroniza lote de recorrentes no Cloud Firestore (São Paulo)
        if (isFirebaseActive && firestoreDb) {
          const batch = firestoreDb.batch();
          recurringPayload.forEach(item => {
            const ref = firestoreDb.collection("atividades").doc(String(item.id));
            batch.set(ref, item, { merge: true });
          });
          batch.commit().catch(e => console.warn("Erro ao salvar recorrentes no Firestore:", e));
        }`;

if (html.includes(recurringSaveTarget) && !html.includes('Sincroniza lote de recorrentes no Cloud Firestore')) {
  html = html.replace(recurringSaveTarget, recurringSaveReplacement);
  console.log('4a. saveActivity (recorrentes) atualizado com Firestore');
}

const singleUpdateTarget = `        if (idx !== -1) {
          activities[idx] = { ...activities[idx], ...dataObj };
        }`;

const singleUpdateReplacement = `        if (idx !== -1) {
          activities[idx] = { ...activities[idx], ...dataObj };
          if (typeof firebaseSaveActivity === 'function') {
            firebaseSaveActivity(activities[idx]);
          }
        }`;

if (html.includes(singleUpdateTarget) && !html.includes('firebaseSaveActivity(activities[idx])')) {
  html = html.replace(singleUpdateTarget, singleUpdateReplacement);
  console.log('4b. saveActivity (edição) atualizado com Firestore');
}

const singleNewTarget = `        const nextId = serverId || (activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1);
        targetRecordId = nextId;
        const newRecord = { id: nextId, ...dataObj };
        activities.push(newRecord);`;

const singleNewReplacement = `        const nextId = serverId || (activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1);
        targetRecordId = nextId;
        const newRecord = { id: nextId, ...dataObj };
        activities.push(newRecord);

        if (typeof firebaseSaveActivity === 'function') {
          firebaseSaveActivity(newRecord);
        }`;

if (html.includes(singleNewTarget) && !html.includes('firebaseSaveActivity(newRecord)')) {
  html = html.replace(singleNewTarget, singleNewReplacement);
  console.log('4c. saveActivity (novo) atualizado com Firestore');
}

// 5. Conclusão, Reprogramação e Reabertura de Atividades
const submitConclusaoTarget = `      // Sincroniza SQLite backend
      try {
        fetch(\`/api/atividades/\${id}\`, {`;

const submitConclusaoReplacement = `      // Sincroniza Cloud Firestore (São Paulo)
      if (typeof firebaseSaveActivity === 'function') {
        firebaseSaveActivity(act);
      }

      // Sincroniza SQLite backend
      try {
        fetch(\`/api/atividades/\${id}\`, {`;

if (html.includes(submitConclusaoTarget) && !html.includes('// Sincroniza Cloud Firestore (São Paulo)\n      if (typeof firebaseSaveActivity === \'function\')')) {
  html = html.replace(submitConclusaoTarget, submitConclusaoReplacement);
  console.log('5. submitConclusao atualizado com Firestore');
}

// 6. Notas de Acompanhamento
const noteAddTarget = `      try {
        fetch(\`/api/atividades/\${act.id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(act)
        }).catch(() => {});
      } catch(err) {}

      saveState();
      renderActivityNotesFeed(act);`;

const noteAddReplacement = `      if (typeof firebaseSaveActivity === 'function') {
        firebaseSaveActivity(act);
      }

      try {
        fetch(\`/api/atividades/\${act.id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(act)
        }).catch(() => {});
      } catch(err) {}

      saveState();
      renderActivityNotesFeed(act);`;

if (html.includes(noteAddTarget) && !html.includes('if (typeof firebaseSaveActivity === \'function\') {\n        firebaseSaveActivity(act);\n      }\n\n      try {\n        fetch(`/api/atividades/${act.id}`')) {
  html = html.replace(noteAddTarget, noteAddReplacement);
  console.log('6. addNoteToCurrentActivity atualizado com Firestore');
}

// 7. Planos 5W2H
const planSaveTarget = `      const finalId = newId || (actions5w2h.length > 0 ? Math.max(...actions5w2h.map(a => a.id)) + 1 : 1);
      actions5w2h.unshift({
        id: finalId,
        what,
        why,
        where,
        who,
        when,
        how,
        status,
        categoria,
        subcategoria
      });`;

const planSaveReplacement = `      const finalId = newId || (actions5w2h.length > 0 ? Math.max(...actions5w2h.map(a => a.id)) + 1 : 1);
      const newPlanObj = {
        id: finalId,
        what,
        why,
        where,
        who,
        when,
        how,
        status,
        categoria,
        subcategoria
      };
      actions5w2h.unshift(newPlanObj);
      if (typeof firebaseSavePlan5w2h === 'function') {
        firebaseSavePlan5w2h(newPlanObj);
      }`;

if (html.includes(planSaveTarget) && !html.includes('firebaseSavePlan5w2h(newPlanObj)')) {
  html = html.replace(planSaveTarget, planSaveReplacement);
  console.log('7a. saveAction5w2h atualizado com Firestore');
}

const planToggleTarget = `        try {
          await fetch(\`/api/planos5w2h/\${id}\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: a.status })
          });
        } catch(err) {
          console.warn("Erro ao atualizar status do plano 5w2h no backend:", err);
        }

        saveState();
        renderActionPlan();`;

const planToggleReplacement = `        if (typeof firebaseSavePlan5w2h === 'function') {
          firebaseSavePlan5w2h(a);
        }

        try {
          await fetch(\`/api/planos5w2h/\${id}\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: a.status })
          });
        } catch(err) {
          console.warn("Erro ao atualizar status do plano 5w2h no backend:", err);
        }

        saveState();
        renderActionPlan();`;

if (html.includes(planToggleTarget) && !html.includes('firebaseSavePlan5w2h(a)')) {
  html = html.replace(planToggleTarget, planToggleReplacement);
  console.log('7b. toggleAction5w2h atualizado com Firestore');
}

// 8. startRealtimeSyncPoller bypass se Firebase estiver ativo
const pollerTarget = `    function startRealtimeSyncPoller() {
      // 1. Conexão instantânea Server-Sent Events (SSE)`;

const pollerReplacement = `    function startRealtimeSyncPoller() {
      if (isFirebaseActive) {
        console.log("[SIGQ Real-Time] Conexão ativa via Cloud Firestore (São Paulo).");
        return;
      }

      // 1. Conexão instantânea Server-Sent Events (SSE)`;

if (html.includes(pollerTarget)) {
  html = html.replace(pollerTarget, pollerReplacement);
  console.log('8. startRealtimeSyncPoller ajustado para priorizar Firebase');
}

// 9. DOMContentLoaded inicialização
const domLoadedTarget = `      // 2. Carregar dados centralizados do banco SQLite
      loadDataFromSQLite();`;

const domLoadedReplacement = `      // 1. Inicializar Firebase se configurado
      const fbRunning = initFirebaseClient();

      // 2. Carregar dados centralizados do banco SQLite se Firebase não estiver ativo
      if (!fbRunning) {
        loadDataFromSQLite();
      }`;

if (html.includes(domLoadedTarget)) {
  html = html.replace(domLoadedTarget, domLoadedReplacement);
  console.log('9. DOMContentLoaded ajustado com inicialização Firebase');
}

// Salva o arquivo atualizado
fs.writeFileSync(filePath, html, 'utf8');
console.log('\n[SUCESSO] plataforma_qualidade.html atualizado com suporte Firebase Tempo Real!');
