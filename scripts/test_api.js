Promise.all([
  fetch('http://127.0.0.1:3000/api/sync/status').then(r => r.json()),
  fetch('http://127.0.0.1:3000/api/atividades').then(r => r.json()),
  fetch('http://127.0.0.1:3000/').then(r => r.text())
]).then(([sync, acts, html]) => {
  console.log('Status de sincronização:', JSON.stringify(sync));
  console.log('Quantidade de atividades retornadas pela API:', acts.length);
  acts.forEach((a, i) => {
    console.log(`[${i+1}] ${a.data} - ${a.horario} | ${a.consultor} | ${a.atividade} (${a.status})`);
  });
  const hasPreloaded = html.includes('window.SIGQ_PRELOADED_DATA');
  console.log('HTML raiz contém window.SIGQ_PRELOADED_DATA?:', hasPreloaded);
  if (hasPreloaded) {
    const match = html.match(/window\.SIGQ_PRELOADED_DATA\s*=\s*(\{.*?\});/s);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        console.log('Atividades pré-carregadas no HTML:', parsed.activities ? parsed.activities.length : 0);
      } catch(e) {
        console.log('Erro ao analisar JSON pré-carregado:', e.message);
      }
    }
  }
}).catch(err => console.error('Erro na requisição:', err.message));
