const fs = require('fs');
const path = require('path');

const targetDir = 'Z:/Qualidade e Gestão de Riscos/Qualimed/QualiMed-SIGQ-Release';
console.log('Iniciando cópia para:', targetDir);

if (!fs.existsSync(targetDir)) {
  console.error('Destino não encontrado!');
  process.exit(1);
}

const files = [
  { src: 'plataforma_qualidade.html', dest: 'plataforma_qualidade.html' },
  { src: 'views/index.html', dest: 'views/index.html' },
  { src: 'server.js', dest: 'server.js' },
  { src: 'database.js', dest: 'database.js' },
  { src: 'build.js', dest: 'build.js' },
  { src: 'INICIAR_QUALIMED.bat', dest: 'INICIAR_QUALIMED.bat' },
  { src: 'Abrir_QualiMed.url', dest: 'Abrir_QualiMed.url' },
  { src: '1_CLIQUE_AQUI_PARA_ABRIR.url', dest: '1_CLIQUE_AQUI_PARA_ABRIR.url' },
  { src: 'LIBERAR_ACESSO_REDE.bat', dest: 'LIBERAR_ACESSO_REDE.bat' },
  { src: 'COMO_ACESSAR_QUALIMED.txt', dest: 'COMO_ACESSAR_QUALIMED.txt' },
  { src: 'data/seed_sigq.json', dest: 'data/seed_sigq.json' }
];

for (const f of files) {
  const fullSrc = path.resolve(f.src);
  const fullDest = path.join(targetDir, f.dest);
  const parent = path.dirname(fullDest);
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
  fs.copyFileSync(fullSrc, fullDest);
  const stat = fs.statSync(fullDest);
  console.log(`[OK] ${f.dest} (${Math.round(stat.size / 1024)} KB)`);
}

console.log('Todos os arquivos foram implantados com sucesso no drive Z:!');
