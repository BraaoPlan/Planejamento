const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const staging = path.join(rootDir, '.release_staging');
const zipFile = path.join(rootDir, 'QualiMed-SIGQ-Release.zip');

console.log('--- Preparando pacote de distribuicao para TI ---');

if (fs.existsSync(staging)) {
  fs.rmSync(staging, { recursive: true, force: true });
}
fs.mkdirSync(staging, { recursive: true });

const items = [
  'package.json',
  'package-lock.json',
  'server.js',
  'database.js',
  'build.js',
  'plataforma_qualidade.html',
  'qualimed.sqlite',
  '.env.example',
  '.gitignore',
  'README.md',
  'DOSSIE_TECNICO_SIGQ_QUALIMED.md',
  'INICIAR_QUALIMED.bat',
  'INICIAR_EM_SEGUNDO_PLANO.vbs',
  'ENCERRAR_QUALIMED.bat',
  'INSTALAR_INICIALIZACAO_AUTOMATICA.bat',
  'DESINSTALAR_INICIALIZACAO_AUTOMATICA.bat',
  'DIAGNOSTICO_REDE.bat',
  'LIBERAR_ACESSO_REDE.bat',
  'Abrir_QualiMed.url',
  'views',
  'public',
  'data',
  'scripts',
  'bin',
  'node_modules'
];

for (const item of items) {
  const src = path.join(rootDir, item);
  const dest = path.join(staging, item);
  if (fs.existsSync(src)) {
    console.log(`Incluindo: ${item}`);
    fs.cpSync(src, dest, { recursive: true });
  }
}

// Remover scripts de geracao de zip de dentro do pacote
const destZipPs1 = path.join(staging, 'scripts', 'create_release_zip.ps1');
if (fs.existsSync(destZipPs1)) fs.unlinkSync(destZipPs1);
const destZipJs = path.join(staging, 'scripts', 'build_release_zip.js');
if (fs.existsSync(destZipJs)) fs.unlinkSync(destZipJs);

if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

console.log('Compactando...');
cp.execSync(`tar -a -cf "${zipFile}" *`, { cwd: staging, stdio: 'inherit' });

fs.rmSync(staging, { recursive: true, force: true });

const stat = fs.statSync(zipFile);
console.log('--- Pacote ZIP criado com sucesso! ---');
console.log(`Arquivo: ${zipFile}`);
console.log(`Tamanho: ${Math.round(stat.size / 1024)} KB`);
