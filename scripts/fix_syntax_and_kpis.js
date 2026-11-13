const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, '..', 'plataforma_qualidade.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the 13 dangling lines from renderPlanejamento
const lines = content.split('\n');
let foundIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('if (isAllSectorsMode) {') && 
      lines[i + 1] && lines[i + 1].includes('if (fMes !== "TODOS" && item.mes !== fMes)')) {
    foundIndex = i + 1;
    break;
  }
}

if (foundIndex !== -1) {
  console.log(`Found dangling block at index ${foundIndex}, checking end...`);
  // Check lines until });
  let endIndex = foundIndex;
  while (endIndex < lines.length && !lines[endIndex].trim().startsWith('});')) {
    endIndex++;
  }
  if (lines[endIndex] && lines[endIndex].trim().startsWith('});')) {
    console.log(`Removing from index ${foundIndex} to ${endIndex} (${endIndex - foundIndex + 1} lines)...`);
    lines.splice(foundIndex, endIndex - foundIndex + 1);
    content = lines.join('\n');
    console.log('Dangling block removed successfully!');
  }
}

// 2. Ensure saveActivityModal update branch handles isStaticHost
const oldSaveUpdate = `        if (!isFirebaseActive) {
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
        } else {`;

const newSaveUpdate = `        const isStaticHost = window.location.hostname.includes('github.io');
        if (!isFirebaseActive && !isStaticHost) {
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
        } else if (isFirebaseActive) {`;

if (content.includes(oldSaveUpdate)) {
  content = content.replace(oldSaveUpdate, newSaveUpdate);
  console.log('Updated saveActivityModal to handle isStaticHost on updates!');
}

// 3. Improve renderMinhaPauta so all filters (top month, analyst, status, search, sector) filter properly and sync
const oldMinhaPautaLogic = `      // Filtrar por analista e período
      let filtered = activities.filter(item => {
        // Filtro de analista
        if (selAnalyst !== "TODOS") {
          const sObj = sectors.find(s => s.setor === item.processo);
          const isConsultor = (item.consultor || '').toLowerCase() === selAnalyst.toLowerCase();
          const isTitular = (sObj?.analista || '').toLowerCase() === selAnalyst.toLowerCase();
          if (!isConsultor && !isTitular) return false;
        }

        // Filtro de período
        if (currentPautaPeriod === 'hoje') {
          return item.data === todayStr;
        } else if (currentPautaPeriod === 'semana') {
          if (!item.data) return false;
          const actDate = new Date(item.data + 'T00:00:00');
          const todayDate = new Date(todayStr + 'T00:00:00');
          const maxDate = new Date(todayDate);
          maxDate.setDate(maxDate.getDate() + 7);
          return actDate >= todayDate && actDate <= maxDate;
        } else if (currentPautaPeriod === 'mes') {
          const selMes = document.getElementById("plan-filter-mes")?.value || "OUTUBRO";
          if (selMes !== "TODOS" && item.mes !== selMes) return false;
          return true;
        }
        return true;
      });`;

const newMinhaPautaLogic = `      // Captura todos os filtros ativos (mês, analista, status, busca, setor)
      const topAnalyst = document.getElementById("plan-filter-analista")?.value || "TODOS";
      const activeAnalyst = (selAnalyst !== "TODOS") ? selAnalyst : topAnalyst;
      const fStatus = document.getElementById("plan-filter-status")?.value || "TODOS";
      const search = (document.getElementById("plan-filter-search")?.value || "").toLowerCase().trim();
      const isAllSectors = !currentSelectedSector || currentSelectedSector === "TODOS";

      // Filtrar por analista, setor, status, busca e período
      let filtered = activities.filter(item => {
        // Setor
        if (!isAllSectors && (item.processo || '').trim().toLowerCase() !== currentSelectedSector.trim().toLowerCase()) return false;

        // Analista
        if (activeAnalyst !== "TODOS") {
          const sObj = sectors.find(s => s.setor === item.processo);
          const isConsultor = (item.consultor || '').toLowerCase() === activeAnalyst.toLowerCase();
          const isTitular = (sObj?.analista || '').toLowerCase() === activeAnalyst.toLowerCase();
          if (!isConsultor && !isTitular) return false;
        }

        // Status
        if (fStatus !== "TODOS" && item.status !== fStatus) return false;

        // Busca
        if (search) {
          const match = (item.atividade || "").toLowerCase().includes(search) ||
                        (item.consultor || "").toLowerCase().includes(search) ||
                        (item.responsavel || "").toLowerCase().includes(search) ||
                        (item.categoria || "").toLowerCase().includes(search) ||
                        (item.processo || "").toLowerCase().includes(search);
          if (!match) return false;
        }

        // Filtro de período
        if (currentPautaPeriod === 'hoje') {
          return item.data === todayStr;
        } else if (currentPautaPeriod === 'semana') {
          if (!item.data) return false;
          const actDate = new Date(item.data + 'T00:00:00');
          const todayDate = new Date(todayStr + 'T00:00:00');
          const maxDate = new Date(todayDate);
          maxDate.setDate(maxDate.getDate() + 7);
          return actDate >= todayDate && actDate <= maxDate;
        } else if (currentPautaPeriod === 'mes') {
          const selMes = document.getElementById("plan-filter-mes")?.value || "OUTUBRO";
          if (selMes !== "TODOS" && item.mes !== selMes) return false;
          return true;
        }
        return true;
      });`;

if (content.includes(oldMinhaPautaLogic)) {
  content = content.replace(oldMinhaPautaLogic, newMinhaPautaLogic);
  console.log('Updated renderMinhaPauta filtering logic!');
}

// 4. Validate syntax of all script blocks
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let blockCount = 0;
let errors = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  blockCount++;
  const code = match[1];
  if (!code.trim() || match[0].includes('src=')) continue;
  try {
    new vm.Script(code, { filename: `block_${blockCount}.js` });
    console.log(`Script block ${blockCount}: Syntax OK`);
  } catch(e) {
    console.error(`SYNTAX ERROR in script block ${blockCount}:`, e.message);
    errors++;
  }
}

if (errors === 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully written clean plataforma_qualidade.html!');
} else {
  console.error(`Aborting write: ${errors} syntax errors found.`);
  process.exit(1);
}
