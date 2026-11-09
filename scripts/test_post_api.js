(async () => {
  try {
    const payload = {
      mes: 'NOVEMBRO',
      data: '2026-11-04',
      horario: '09:00',
      ch: 4,
      processo: 'Compliance',
      categoria: 'Gestão de Documentos',
      subcategoria: 'Mapeamento',
      atividade: 'Teste de validação de persistência central',
      consultor: 'Abraao',
      responsavel: 'Viviane Paiva',
      status: 'PENDENTE'
    };

    const res = await fetch('http://10.8.50.149:3000/api/atividades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Status HTTP:', res.status);
    const data = await res.json();
    console.log('Resposta POST:', data);

    const getRes = await fetch('http://10.8.50.149:3000/api/atividades');
    const ativs = await getRes.json();
    console.log('Total atividades no banco agora:', ativs.length);
    if (ativs.length > 0) {
      console.log('Primeira atividade gravada:', ativs[0].titulo || ativs[0].atividade, 'ID:', ativs[0].id);
    }
  } catch (err) {
    console.error('Erro no teste:', err.message);
  }
})();
