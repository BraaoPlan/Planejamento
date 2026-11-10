const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'plataforma_qualidade.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Atualizar cleanForFirestore e configurações do Firestore
const oldFbEngine = `    async function firebaseSaveActivity(actObj) {
      if (!firestoreDb) return;
      try {
        await firestoreDb.collection("atividades").doc(String(actObj.id)).set(actObj, { merge: true });
      } catch(err) {
        console.error("[SIGQ Firebase] Erro ao salvar atividade:", err);
      }
    }`;

const newFbEngine = `    function cleanForFirestore(obj) {
      if (!obj || typeof obj !== 'object') return obj;
      const clean = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) {
          clean[k] = null;
        } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
          clean[k] = cleanForFirestore(v);
        } else {
          clean[k] = v;
        }
      }
      return clean;
    }

    async function firebaseSaveActivity(actObj) {
      if (!firestoreDb) return;
      try {
        const sanitized = cleanForFirestore(actObj);
        await firestoreDb.collection("atividades").doc(String(actObj.id)).set(sanitized, { merge: true });
        console.log(\`[SIGQ Firebase] Atividade #\${actObj.id} sincronizada no Firestore.\`);
      } catch(err) {
        console.error("[SIGQ Firebase] Erro ao salvar atividade:", err);
      }
    }`;

if (html.includes(oldFbEngine)) {
  html = html.replace(oldFbEngine, newFbEngine);
  console.log('1. firebaseSaveActivity atualizado com cleanForFirestore');
}

// 2. Corrigir saveActivity para isolar modo Firebase vs modo SQLite
const oldSaveActBlock = `        let insertedIds = [];
        let recurringSaveError = null;
        try {
          const res = await fetch('/api/atividades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recurringPayload)
          });
          if (res.ok) {
            const resData = await res.json();
            if (resData && Array.isArray(resData.ids)) {
              insertedIds = resData.ids;
            }
          } else {
            recurringSaveError = \`Servidor retornou erro \${res.status}\`;
          }
        } catch(err) {
          recurringSaveError = err.message;
          console.warn("Erro ao salvar atividades recorrentes no backend:", err);
        }

        recurringPayload.forEach((item, idx) => {
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
        }

        saveState();
        closeModalActivity();

        if (recurringSaveError) {
          alert(\`⚠️ ATENÇÃO: As consultorias foram guardadas na memória deste computador, mas NÃO foram gravadas no banco de dados central da rede!\\n\\nMotivo: \${recurringSaveError}\\n\\nPara compartilhar com toda a equipe, utilize o botão "Sincronizar com Banco Central da Rede" no topo da tela ou acesse pelo atalho Abrir_QualiMed.url.\`);
        } else {
          alert(\`Sucesso: Foram agendadas \${recurringDates.length} consultorias recorrentes (\${freqRecorrencia.toLowerCase()}) até \${formatDisplayDate(dataFimRecorrencia)}!\`);
        }

        renderPlanejamento();
        applyFilters();
        return;
      }

      let targetRecordId = Number(id) || null;

      if (id) {
        const idx = activities.findIndex(a => a.id === Number(id));
        if (idx !== -1) {
          activities[idx] = { ...activities[idx], ...dataObj };
          if (typeof firebaseSaveActivity === 'function') {
            firebaseSaveActivity(activities[idx]);
          }
        }
        let updateError = null;
        try {
          const res = await fetch(\`/api/atividades/\${id}\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataObj)
          });
          if (!res.ok) updateError = \`Status HTTP \${res.status}\`;
        } catch(err) {
          updateError = err.message;
          console.warn("Erro ao atualizar atividade no backend:", err);
        }
        if (updateError) {
          alert(\`⚠️ ATENÇÃO: A alteração foi salva localmente, mas não pôde ser sincronizada com o banco central da rede (\${updateError}).\`);
        }
      } else {
        let serverId = null;
        let singleSaveError = null;
        try {
          const res = await fetch('/api/atividades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataObj)
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.id) serverId = data.id;
          } else {
            singleSaveError = \`Servidor retornou status HTTP \${res.status}\`;
          }
        } catch(err) {
          singleSaveError = err.message;
          console.warn("Erro ao persistir atividade no backend:", err);
        }

        const nextId = serverId || (activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1);
        targetRecordId = nextId;
        const newRecord = { id: nextId, ...dataObj };
        activities.push(newRecord);

        if (typeof firebaseSaveActivity === 'function') {
          firebaseSaveActivity(newRecord);
        }

        if (singleSaveError) {
          alert(\`⚠️ ATENÇÃO: O agendamento foi guardado na memória deste computador, mas NÃO pôde ser gravado no banco central da rede!\\n\\nMotivo: \${singleSaveError}\\n\\nPara compartilhar com toda a equipe, utilize o botão "Sincronizar com Banco Central da Rede" no topo da tela ou verifique se o servidor está rodando (INICIAR_QUALIMED.bat).\`);
        }
      }`;

const newSaveActBlock = `        if (isFirebaseActive) {
          // Lote Recorrente no Firebase Cloud Firestore
          recurringPayload.forEach((item, idx) => {
            const newId = ((activities.length > 0 ? Math.max(...activities.map(a => Number(a.id) || 0)) : 0) + 1 + idx);
            item.id = newId;
            activities.push(item);
          });

          if (firestoreDb) {
            const batch = firestoreDb.batch();
            recurringPayload.forEach(item => {
              const ref = firestoreDb.collection("atividades").doc(String(item.id));
              batch.set(ref, cleanForFirestore(item), { merge: true });
            });
            batch.commit().catch(e => console.warn("Erro ao salvar recorrentes no Firestore:", e));
          }

          saveState();
          closeModalActivity();
          alert(\`Sucesso: Foram agendadas \${recurringDates.length} consultorias recorrentes (\${freqRecorrencia.toLowerCase()}) até \${formatDisplayDate(dataFimRecorrencia)}!\`);
          renderPlanejamento();
          applyFilters();
          return;
        }

        // Modo Local SQLite (INICIAR_QUALIMED.bat)
        let insertedIds = [];
        let recurringSaveError = null;
        try {
          const res = await fetch('/api/atividades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recurringPayload)
          });
          if (res.ok) {
            const resData = await res.json();
            if (resData && Array.isArray(resData.ids)) {
              insertedIds = resData.ids;
            }
          } else {
            recurringSaveError = \`Servidor retornou erro \${res.status}\`;
          }
        } catch(err) {
          recurringSaveError = err.message;
          console.warn("Erro ao salvar atividades recorrentes no backend:", err);
        }

        recurringPayload.forEach((item, idx) => {
          const newId = insertedIds[idx] || ((activities.length > 0 ? Math.max(...activities.map(a => a.id)) : 0) + 1 + idx);
          activities.push({ id: newId, ...item });
        });

        saveState();
        closeModalActivity();

        if (recurringSaveError) {
          alert(\`⚠️ ATENÇÃO: As consultorias foram guardadas na memória deste computador, mas NÃO foram gravadas no banco de dados central da rede!\\n\\nMotivo: \${recurringSaveError}\\n\\nPara compartilhar com toda a equipe, utilize o botão "Sincronizar com Banco Central da Rede" no topo da tela ou acesse pelo atalho Abrir_QualiMed.url.\`);
        } else {
          alert(\`Sucesso: Foram agendadas \${recurringDates.length} consultorias recorrentes (\${freqRecorrencia.toLowerCase()}) até \${formatDisplayDate(dataFimRecorrencia)}!\`);
        }

        renderPlanejamento();
        applyFilters();
        return;
      }

      let targetRecordId = Number(id) || null;

      if (id) {
        const idx = activities.findIndex(a => a.id === Number(id));
        if (idx !== -1) {
          activities[idx] = { ...activities[idx], ...dataObj };
          if (typeof firebaseSaveActivity === 'function') {
            firebaseSaveActivity(activities[idx]);
          }
        }

        if (!isFirebaseActive) {
          let updateError = null;
          try {
            const res = await fetch(\`/api/atividades/\${id}\`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dataObj)
            });
            if (!res.ok) updateError = \`Status HTTP \${res.status}\`;
          } catch(err) {
            updateError = err.message;
            console.warn("Erro ao atualizar atividade no backend:", err);
          }
          if (updateError) {
            alert(\`⚠️ ATENÇÃO: A alteração foi salva localmente, mas não pôde ser sincronizada com o banco central da rede (\${updateError}).\`);
          }
        } else {
          showNetworkSyncToast("Consultoria atualizada no Cloud Firestore!");
        }
      } else {
        if (isFirebaseActive) {
          // Modo Nuvem Firebase (GitHub Pages): Salva diretamente no Firestore sem chamar /api/
          const nextId = (activities.length > 0 ? Math.max(...activities.map(a => Number(a.id) || 0)) + 1 : 1);
          targetRecordId = nextId;
          const newRecord = { id: nextId, ...dataObj };
          activities.push(newRecord);

          if (typeof firebaseSaveActivity === 'function') {
            firebaseSaveActivity(newRecord);
          }
          showNetworkSyncToast("Consultoria salva com sucesso no Cloud Firestore!");
        } else {
          // Modo Local SQLite (INICIAR_QUALIMED.bat)
          let serverId = null;
          let singleSaveError = null;
          try {
            const res = await fetch('/api/atividades', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dataObj)
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.id) serverId = data.id;
            } else {
              singleSaveError = \`Servidor retornou status HTTP \${res.status}\`;
            }
          } catch(err) {
            singleSaveError = err.message;
            console.warn("Erro ao persistir atividade no backend:", err);
          }

          const nextId = serverId || (activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1);
          targetRecordId = nextId;
          const newRecord = { id: nextId, ...dataObj };
          activities.push(newRecord);

          if (singleSaveError) {
            alert(\`⚠️ ATENÇÃO: O agendamento foi guardado na memória deste computador, mas NÃO pôde ser gravado no banco central da rede!\\n\\nMotivo: \${singleSaveError}\\n\\nPara compartilhar com toda a equipe, utilize o botão "Sincronizar com Banco Central da Rede" no topo da tela ou verifique se o servidor está rodando (INICIAR_QUALIMED.bat).\`);
          }
        }
      }`;

if (html.includes(oldSaveActBlock)) {
  html = html.replace(oldSaveActBlock, newSaveActBlock);
  console.log('2. saveActivity atualizado com separação estrita de modos Firebase e SQLite');
} else {
  console.log('2. oldSaveActBlock não encontrado exatamente, tentando bloco reduzido');
}

// 3. Proteger deleteActivity para não chamar /api/atividades quando isFirebaseActive for true
const oldDeleteAct = `        // Sincroniza Cloud Firestore (São Paulo)
        if (typeof firebaseDeleteActivity === 'function') {
          firebaseDeleteActivity(id);
        }

        // Sincroniza SQLite backend
        try {
          fetch(\`/api/atividades/\${id}\`, { method: 'DELETE' }).catch(() => {});
        } catch(err) {}`;

const newDeleteAct = `        // Sincroniza Cloud Firestore (São Paulo)
        if (typeof firebaseDeleteActivity === 'function') {
          firebaseDeleteActivity(id);
        }

        // Sincroniza SQLite backend apenas se não estiver operando via Firebase
        if (!isFirebaseActive) {
          try {
            fetch(\`/api/atividades/\${id}\`, { method: 'DELETE' }).catch(() => {});
          } catch(err) {}
        }`;

if (html.includes(oldDeleteAct)) {
  html = html.replace(oldDeleteAct, newDeleteAct);
  console.log('3. deleteActivity atualizado para ignorar /api/ em modo Firebase');
}

// 4. Proteger submitConclusao para não chamar /api/atividades quando isFirebaseActive for true
const oldSubmitConcl = `      // Sincroniza Cloud Firestore (São Paulo)
      if (typeof firebaseSaveActivity === 'function') {
        firebaseSaveActivity(act);
      }

      // Sincroniza SQLite backend
      try {
        fetch(\`/api/atividades/\${id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(act)
        }).catch(() => {});
      } catch(err) {}`;

const newSubmitConcl = `      // Sincroniza Cloud Firestore (São Paulo)
      if (typeof firebaseSaveActivity === 'function') {
        firebaseSaveActivity(act);
      }

      // Sincroniza SQLite backend apenas se não estiver operando via Firebase
      if (!isFirebaseActive) {
        try {
          fetch(\`/api/atividades/\${id}\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(act)
          }).catch(() => {});
        } catch(err) {}
      }`;

if (html.includes(oldSubmitConcl)) {
  html = html.replace(oldSubmitConcl, newSubmitConcl);
  console.log('4. submitConclusao atualizado para ignorar /api/ em modo Firebase');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Sucesso ao atualizar plataforma_qualidade.html.');
