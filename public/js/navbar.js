// ==========================================================
// QUALIMED - BARRA DE NAVEGAÇÃO SUPERIOR COM ABAS MODERNAS
// Padrão MedSênior: Zero Emojis, SVGs Modernos, Abas Autênticas
// ==========================================================
(function() {

  function getStoredUser() {
    try {
      const u1 = localStorage.getItem('QUALIMED_USER');
      if (u1) return JSON.parse(u1);
      const u2 = sessionStorage.getItem('SIGQ_AUTH_USER');
      if (u2) return JSON.parse(u2);
    } catch(e) {}
    return null;
  }

  function setStoredUser(user) {
    if (!user) {
      localStorage.removeItem('QUALIMED_USER');
      sessionStorage.removeItem('SIGQ_AUTH_USER');
    } else {
      localStorage.setItem('QUALIMED_USER', JSON.stringify(user));
      sessionStorage.setItem('SIGQ_AUTH_USER', JSON.stringify(user));
    }
  }

  // Exportar globalmente
  window.QualiMedSession = {
    getUser: getStoredUser,
    setUser: setStoredUser,
    logout: function() {
      setStoredUser(null);
      window.location.href = '/';
    }
  };

  function getCurrentTabKey() {
    const p = window.location.pathname;
    if (p.includes('/ocorrencias')) return 'ocorrencias';
    if (p.includes('/acoes')) return 'acoes';
    return 'qualidade';
  }

  function switchMainTab(tabKey, updateHistory = true) {
    // 1. Verificar se a página possui frames (Shell Master)
    const fQualidade = document.getElementById('frame-qualidade');
    const fOcorrencias = document.getElementById('frame-ocorrencias');
    const fAcoes = document.getElementById('frame-acoes');

    if (fQualidade && fOcorrencias && fAcoes) {
      // Alternar visual das abas
      document.querySelectorAll('.qm-nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabKey);
      });

      // Alternar frames
      document.querySelectorAll('.qm-tab-frame').forEach(frame => {
        frame.classList.toggle('active', frame.id === 'frame-' + tabKey || frame.dataset.tab === tabKey);
      });

      // Atualizar URL na barra de endereço
      if (updateHistory) {
        const targetPath = tabKey === 'qualidade' ? '/' : '/' + tabKey;
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ tab: tabKey }, '', targetPath);
        }
      }
      return;
    }

    // Se estiver em visualização isolada fora do shell, navegar diretamente
    const targetUrl = tabKey === 'qualidade' ? '/' : '/' + tabKey;
    if (window.location.pathname !== targetUrl) {
      window.location.href = targetUrl;
    }
  }

  window.switchMainTab = switchMainTab;

  // Escutar eventos de voltar/avançar no navegador
  window.addEventListener('popstate', function(e) {
    const tabKey = (e.state && e.state.tab) ? e.state.tab : getCurrentTabKey();
    switchMainTab(tabKey, false);
  });

  function renderNavbar() {
    // Se estiver embutido em iframe, não renderiza navbar duplicada
    if (window.self !== window.top || window.location.search.includes('embed=1')) {
      return;
    }

    const activeTab = getCurrentTabKey();
    const user = getStoredUser() || { nome: 'Abraao (Analista)', perfil: 'ANALISTA' };
    const initials = (user.nome || 'A').charAt(0).toUpperCase();

    const navHtml = `
      <header class="qm-navbar-header">
        <div class="qm-navbar-top">
          
          <!-- Marca / Logo MedSênior QualiMed com SVG -->
          <div class="qm-brand" onclick="window.switchMainTab('qualidade')">
            <div class="qm-brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="qm-brand-info">
              <span class="qm-brand-title">QualiMed • SIGQ & EPA</span>
              <span class="qm-brand-subtitle">Sistema Integrado de Gestão da Qualidade</span>
            </div>
          </div>

          <!-- Lado Direito: Status SQLite e Usuário Ativo com SVG -->
          <div class="qm-user-controls">
            <div class="qm-db-badge" title="Banco de dados SQLite interno conectado em tempo real">
              <span class="qm-db-dot"></span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              <span>SQLite Local</span>
            </div>

            <div class="qm-user-pill">
              <div class="qm-user-avatar">${initials}</div>
              <div class="qm-user-info">
                <span class="qm-user-name">${user.nome}</span>
                <span class="qm-user-role">${user.perfil}</span>
              </div>
            </div>

            
            <!-- Botão Modo Reunião / Comitê da Qualidade -->
            <button onclick="window.openMeetingMode()" class="qm-btn-meeting" title="Abrir Modo Reunião Executiva / Comitê da Qualidade">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h20v14H2z"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="m10 9 4 3-4 3z"/>
              </svg>
              <span>Modo Reunião</span>
            </button>

            <button onclick="window.QualiMedSession.logout()" class="qm-btn-switch-user" title="Alternar perfil ou encerrar sessão">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              <span>Trocar Perfil</span>
            </button>
          </div>
        </div>

        <!-- ========================================================
             BARRA DE ABAS PRINCIPAL (TABS)
             Visual 100% de ABAS modernas de enterprise conectadas
             ======================================================== -->
        <nav class="qm-tabs-bar" aria-label="Navegação Principal por Abas">
          <div class="qm-tabs-list">
            
            <!-- ABA 1: Plataforma da Qualidade -->
            <button class="qm-nav-tab ${activeTab === 'qualidade' ? 'active' : ''}" 
                    id="tab-qualidade" 
                    data-tab="qualidade" 
                    onclick="window.switchMainTab('qualidade')"
                    title="Plataforma Integrada de Gestão da Qualidade (SIGQ)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              <span class="qm-tab-title">Plataforma da Qualidade</span>
              <span class="qm-tab-badge">SIGQ</span>
            </button>

            <!-- ABA 2: Ocorrências do EPA -->
            <button class="qm-nav-tab ${activeTab === 'ocorrencias' ? 'active' : ''}" 
                    id="tab-ocorrencias" 
                    data-tab="ocorrencias" 
                    onclick="window.switchMainTab('ocorrencias')"
                    title="Dashboard Analítico de Ocorrências do EPA">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span class="qm-tab-title">Ocorrências do EPA</span>
              <span class="qm-tab-badge">2.704 Registros</span>
            </button>

            <!-- ABA 3: Ações e Análise -->
            <button class="qm-nav-tab ${activeTab === 'acoes' ? 'active' : ''}" 
                    id="tab-acoes" 
                    data-tab="acoes" 
                    onclick="window.switchMainTab('acoes')"
                    title="Acompanhamento de Ações e Ocorrências em Triagem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              <span class="qm-tab-title">Ações & Análise</span>
              <span class="qm-tab-badge">Qualidade</span>
            </button>

          </div>
        </nav>
      </header>
    `;

    const placeholder = document.getElementById('qualimed-navbar-root');
    if (placeholder) {
      placeholder.innerHTML = navHtml;
    } else {
      const container = document.createElement('div');
      container.id = 'qualimed-navbar-root';
      container.innerHTML = navHtml;
      document.body.insertBefore(container, document.body.firstChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNavbar);
  } else {
    renderNavbar();
  }
})();


  // ==========================================================
  // MODO REUNIÃO DE DIRETORIA / COMITÊ DA QUALIDADE
  // ==========================================================
  let meetingChartPareto = null;
  let meetingChartPhases = null;

  async function openMeetingMode() {
    let modal = document.getElementById('qm-meeting-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'qm-meeting-modal';
      modal.className = 'qm-meeting-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="qm-meeting-box">
        <div class="qm-meeting-loading">
          <svg class="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0E6838" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M4 12a8 8 0 018-8v8H4z" fill="#0E6838"></path></svg>
          <span>Preparando Relatório Executivo do Comitê da Qualidade...</span>
        </div>
      </div>
    `;
    modal.style.display = 'flex';

    try {
      // Carregar dados atualizados do banco SQLite
      const [resOcc, resAcoes, resDiag, resAnalise] = await Promise.all([
        fetch('/api/ocorrencias').then(r => r.json()).catch(() => []),
        fetch('/api/acoes').then(r => r.json()).catch(() => []),
        fetch('/api/diagnosticos').then(r => r.json()).catch(() => []),
        fetch('/api/ocorrencias-analise').then(r => r.json()).catch(() => [])
      ]);

      const occs = Array.isArray(resOcc) ? resOcc : [];
      const acoes = Array.isArray(resAcoes) ? resAcoes : [];
      const diags = Array.isArray(resDiag) ? resDiag : [];
      const analise = Array.isArray(resAnalise) ? resAnalise : [];

      // Cálculos Executivos
      const totalOcc = occs.length;
      let lateCount = 0;
      let ontimeCount = 0;
      let todayCount = 0;
      let agesSum = 0;
      let agesCount = 0;

      const typeCounts = {};
      const sectorCounts = {};

      occs.forEach(o => {
        const dRest = String(o['Dias Restantes'] || '').toLowerCase();
        if (dRest.includes('atras') || dRest.includes('-')) lateCount++;
        else if (dRest.includes('hoje') || dRest.trim() === '0') todayCount++;
        else ontimeCount++;

        // Tipo
        const t = (o['Tipo de Ocorrência'] || 'Incidente').trim();
        typeCounts[t] = (typeCounts[t] || 0) + 1;

        // Setor Notificado
        const sec = (o['Notificada'] || 'Geral').trim();
        sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;

        // Idade
        const dtStr = o['Data da ocorrência'];
        if (dtStr) {
          const match = dtStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
          if (match) {
            const dt = new Date(match[3], match[2] - 1, match[1]);
            const diff = Math.floor((new Date() - dt) / 86400000);
            if (diff >= 0 && diff < 365) {
              agesSum += diff;
              agesCount++;
            }
          }
        }
      });

      const avgAge = agesCount > 0 ? Math.round(agesSum / agesCount) : 0;
      const latePct = totalOcc > 0 ? Math.round((lateCount / totalOcc) * 100) : 0;
      const ontimePct = totalOcc > 0 ? Math.round((ontimeCount / totalOcc) * 100) : 0;

      // Fases em análise
      const fase1 = analise.filter(x => String(x.Fase || '').includes('1')).length;
      const fase3 = analise.filter(x => String(x.Fase || '').includes('3')).length;
      const fase5 = analise.filter(x => String(x.Fase || '').includes('5')).length;

      // Ações
      const totalAcoes = acoes.length;
      const acoesAtrasadas = acoes.filter(a => String(a.status || a.Status || '').toLowerCase().includes('atras')).length;
      const acoesNoPrazo = totalAcoes - acoesAtrasadas;

      // Top 5 Setores Notificados
      const topSectors = Object.entries(sectorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([setor, count]) => {
          const diag = diags.find(d => d.processo === setor) || {};
          return {
            setor,
            count,
            pct: totalOcc > 0 ? Math.round((count / totalOcc) * 1000) / 10 : 0,
            responsavel: diag.responsavel || 'Não Alocado',
            criticidade: diag.criticidade || (count > 80 ? 'ALTA' : 'MÉDIA'),
            recomendacao: diag.recomendacao || 'Intensificar acompanhamento de plano 5W2H e validação de causas.'
          };
        });

      // Dados do Pareto (Tipos)
      const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
      let cumSum = 0;
      const paretoLabels = [];
      const paretoFreqs = [];
      const paretoPcts = [];
      const paretoColors = [];
      let vitalCount = 0;
      let vitalSum = 0;

      sortedTypes.slice(0, 10).forEach(([tipo, count], i) => {
        cumSum += count;
        const pct = Math.round((cumSum / totalOcc) * 1000) / 10;
        paretoLabels.push(tipo.length > 25 ? tipo.slice(0, 25) + '...' : tipo);
        paretoFreqs.push(count);
        paretoPcts.push(pct);
        if (pct <= 80 || (i > 0 && paretoPcts[i-1] < 80)) {
          paretoColors.push('rgba(14, 104, 56, 0.9)');
          vitalCount++;
          vitalSum += count;
        } else {
          paretoColors.push('rgba(148, 163, 184, 0.6)');
        }
      });

      const vitalPct = totalOcc > 0 ? Math.round((vitalSum / totalOcc) * 1000) / 10 : 0;
      const todayFormatted = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      // Renderizar o Modal Executivo Completo
      modal.innerHTML = `
        <div class="qm-meeting-box" id="qm-meeting-print-area">
          
          <!-- CABEÇALHO EXECUTIVO DO COMITÊ -->
          <div class="qm-meeting-header">
            <div class="qm-meeting-brand">
              <div class="qm-meeting-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h1 class="qm-meeting-title">Comitê Executivo da Qualidade & Segurança do Paciente</h1>
                <p class="qm-meeting-sub">Painel Gerencial de Governança Clínica, Ocorrências do EPA e Eficácia das Ações • MedSênior</p>
                <div class="qm-meeting-meta">
                  <span>Data da Sessão: ${todayFormatted}</span>
                  <span class="qm-meeting-divider">•</span>
                  <span>Base Oficial Integrada: 2.704 Ocorrências (SQLite Local)</span>
                  <span class="qm-meeting-divider">•</span>
                  <span>115 Setores Monitorados</span>
                </div>
              </div>
            </div>

            <div class="qm-meeting-actions no-print">
              <button onclick="window.printMeetingReport()" class="qm-meeting-btn qm-btn-print" title="Imprimir ou Salvar PDF (A4 Oficial)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                <span>Exportar Relatório em PDF / Imprimir</span>
              </button>
              <button onclick="window.closeMeetingMode()" class="qm-meeting-btn qm-btn-close" title="Fechar Modo Reunião">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- LINHA 1: BIG NUMBERS EXECUTIVOS -->
          <div class="qm-meeting-kpis">
            <div class="qm-m-kpi">
              <span class="qm-m-kpi-label">TOTAL DE OCORRÊNCIAS</span>
              <strong class="qm-m-kpi-val">${totalOcc.toLocaleString('pt-BR')}</strong>
              <span class="qm-m-kpi-desc">Base consolidada do EPA</span>
            </div>
            <div class="qm-m-kpi green">
              <span class="qm-m-kpi-label">NO PRAZO REGULAMENTAR</span>
              <strong class="qm-m-kpi-val text-green">${ontimeCount.toLocaleString('pt-BR')}</strong>
              <span class="qm-m-kpi-desc">${ontimePct}% do volume geral</span>
            </div>
            <div class="qm-m-kpi red">
              <span class="qm-m-kpi-label">PRAZOS EXPIRADOS / ATRASO</span>
              <strong class="qm-m-kpi-val text-red">${lateCount.toLocaleString('pt-BR')}</strong>
              <span class="qm-m-kpi-desc">${latePct}% requerem cobrança ativa</span>
            </div>
            <div class="qm-m-kpi">
              <span class="qm-m-kpi-label">TEMPO MÉDIO DE RESOLUÇÃO</span>
              <strong class="qm-m-kpi-val">${avgAge} dias</strong>
              <span class="qm-m-kpi-desc">Permanência média das ocorrências</span>
            </div>
            <div class="qm-m-kpi gold">
              <span class="qm-m-kpi-label">TRIAGEM QUALIDADE (FASES 1, 3 e 5)</span>
              <strong class="qm-m-kpi-val text-gold">${analise.length}</strong>
              <span class="qm-m-kpi-desc">Pendências sob análise dos 10 consultores</span>
            </div>
          </div>

          <!-- LINHA 2: GRÁFICOS EXECUTIVOS (PARETO 80/20 & FASES) -->
          <div class="qm-meeting-charts-grid">
            
            <!-- CARD 1: PARETO 80/20 -->
            <div class="qm-m-chart-card">
              <div class="qm-m-chart-header">
                <div>
                  <h3 class="qm-m-chart-title">Princípio de Pareto (Regra 80/20) das Ocorrências</h3>
                  <p class="qm-m-chart-sub">Concentração de incidentes nos principais tipos de causas vitais</p>
                </div>
                <span class="qm-m-badge-green">${vitalCount} Tipos = ${vitalPct}% das Falhas</span>
              </div>
              <div class="qm-m-insight-callout">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span><strong>Foco Estratégico do Comitê:</strong> A atuação prioritária nos primeiros <strong>${vitalCount} tipos de ocorrência</strong> resolverá <strong>${vitalPct}%</strong> de todos os desvios da instituição.</span>
              </div>
              <div style="position:relative; height:260px; width:100%;">
                <canvas id="meetingParetoCanvas"></canvas>
              </div>
            </div>

            <!-- CARD 2: GARGALOS POR FASE -->
            <div class="qm-m-chart-card">
              <div class="qm-m-chart-header">
                <div>
                  <h3 class="qm-m-chart-title">Gargalos do Fluxo da Qualidade (Fases EPA)</h3>
                  <p class="qm-m-chart-sub">Volume de ocorrências aguardando validação técnica pelo time da Qualidade</p>
                </div>
                <span class="qm-m-badge-gold">Total: ${analise.length} Pendências</span>
              </div>
              <div style="position:relative; height:260px; width:100%; margin-top:16px;">
                <canvas id="meetingPhasesCanvas"></canvas>
              </div>
            </div>

          </div>

          <!-- LINHA 3: TOP 5 SETORES CRÍTICOS & RECOMENDAÇÕES EXECUTIVAS -->
          <div class="qm-m-table-section">
            <div class="qm-m-chart-header" style="margin-bottom:12px;">
              <div>
                <h3 class="qm-m-chart-title">Top 5 Setores com Maior Volume de Não Conformidades & Recomendações</h3>
                <p class="qm-m-chart-sub">Unidades que demandam plano de intervenção prioritário da equipe de consultoria</p>
              </div>
              <span class="qm-m-badge-slate">Acompanhamento Semanal</span>
            </div>
            
            <div class="qm-m-table-wrap">
              <table class="qm-m-table">
                <thead>
                  <tr>
                    <th>Setor Notificado</th>
                    <th style="text-align:center;">Volume EPA</th>
                    <th style="text-align:center;">% da Base</th>
                    <th>Consultor Titular</th>
                    <th style="text-align:center;">Criticidade</th>
                    <th>Diretriz / Recomendação do Comitê</th>
                  </tr>
                </thead>
                <tbody>
                  ${topSectors.map(s => `
                    <tr>
                      <td><strong>${s.setor}</strong></td>
                      <td style="text-align:center; font-weight:800; color:var(--qm-green-dark);">${s.count.toLocaleString('pt-BR')}</td>
                      <td style="text-align:center;">${s.pct}%</td>
                      <td><span class="qm-m-tag-analyst">${s.responsavel}</span></td>
                      <td style="text-align:center;"><span class="qm-m-crit ${s.criticidade === 'ALTA' ? 'crit-alta' : 'crit-media'}">${s.criticidade}</span></td>
                      <td style="font-size:12px; color:#334155;">${s.recomendacao}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- LINHA 4: RESUMO DE EFICÁCIA DAS AÇÕES 5W2H -->
          <div class="qm-m-actions-summary">
            <div class="qm-m-action-box">
              <span class="qm-m-kpi-label">TOTAL DE AÇÕES MONITORADAS</span>
              <strong>${totalAcoes} Planos</strong>
              <p>${acoesNoPrazo} ações no prazo regulamentar</p>
            </div>
            <div class="qm-m-action-box alert">
              <span class="qm-m-kpi-label">AÇÕES COM PRAZO VENCIDO</span>
              <strong style="color:#BE123C;">${acoesAtrasadas} Ações</strong>
              <p>Requerem disparo de alinhamento com os gestores setoriais</p>
            </div>
            <div class="qm-m-action-box green">
              <span class="qm-m-kpi-label">TAXA DE CUMPRIMENTO</span>
              <strong style="color:#0E6838;">${totalAcoes > 0 ? Math.round((acoesNoPrazo / totalAcoes) * 100) : 100}%</strong>
              <p>Índice de resolução dentro do prazo pactuado</p>
            </div>
          </div>

          <!-- RODAPÉ INSTITUCIONAL -->
          <div class="qm-meeting-footer">
            <span>Relatório Oficial Gerado pelo QualiMed • Sistema Integrado de Gestão da Qualidade & EPA • MedSênior</span>
            <span>Uso Exclusivo em Reuniões de Governança e Diretoria Executiva</span>
          </div>

        </div>
      `;

      // Renderizar Gráficos Chart.js do Modo Reunião
      setTimeout(() => {
        renderMeetingCharts(paretoLabels, paretoFreqs, paretoPcts, paretoColors, fase1, fase3, fase5);
      }, 50);

    } catch (err) {
      modal.innerHTML = `<div class="qm-meeting-box" style="padding:30px; text-align:center; color:#DC2626;">Erro ao carregar dados do comitê: ${err.message}</div>`;
    }
  }

  function renderMeetingCharts(paretoLabels, paretoFreqs, paretoPcts, paretoColors, fase1, fase3, fase5) {
    // 1. Gráfico de Pareto
    const cPareto = document.getElementById('meetingParetoCanvas');
    if (cPareto && typeof Chart !== 'undefined') {
      if (meetingChartPareto) meetingChartPareto.destroy();
      meetingChartPareto = new Chart(cPareto.getContext('2d'), {
        data: {
          labels: paretoLabels,
          datasets: [
            {
              type: 'line',
              label: '% Acumulado (Pareto)',
              data: paretoPcts,
              borderColor: '#E11D48',
              backgroundColor: '#E11D48',
              borderWidth: 2.5,
              pointRadius: 4,
              yAxisID: 'y1',
              tension: 0.15
            },
            {
              type: 'bar',
              label: 'Ocorrências',
              data: paretoFreqs,
              backgroundColor: paretoColors,
              borderRadius: 6,
              yAxisID: 'y'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: '700' } } }
          },
          scales: {
            x: { ticks: { font: { size: 10, weight: '600' }, maxRotation: 25 } },
            y: { title: { display: true, text: 'Qtd.', font: { size: 10, weight: '700' } }, beginAtZero: true },
            y1: { position: 'right', max: 100, ticks: { callback: v => v + '%' }, grid: { display: false } }
          }
        }
      });
    }

    // 2. Gráfico de Fases EPA
    const cPhases = document.getElementById('meetingPhasesCanvas');
    if (cPhases && typeof Chart !== 'undefined') {
      if (meetingChartPhases) meetingChartPhases.destroy();
      meetingChartPhases = new Chart(cPhases.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Fase 1: Avaliar Ocorrência', 'Fase 3: Validar Causa/Plano', 'Fase 5: Validar Execução'],
          datasets: [{
            data: [fase1, fase3, fase5],
            backgroundColor: ['#0E6838', '#D97706', '#2563EB'],
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11, weight: '600' } } }
          },
          cutout: '60%'
        }
      });
    }
  }

  function closeMeetingMode() {
    const modal = document.getElementById('qm-meeting-modal');
    if (modal) modal.style.display = 'none';
  }

  function printMeetingReport() {
    window.print();
  }

  window.openMeetingMode = openMeetingMode;
  window.closeMeetingMode = closeMeetingMode;
  window.printMeetingReport = printMeetingReport;
