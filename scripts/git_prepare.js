const { execSync } = require('child_process');
const path = require('path');

const repoDir = 'C:/Users/abraao.luiz/OneDrive - MEDSENIOR/Documentos/Dashboard qualidade/QualiMed/QualiMed';
const gitExe = 'C:/Users/abraao.luiz/AppData/Local/Programs/MinGit/cmd/git.exe';

function run(cmd) {
  console.log(`> ${cmd}`);
  const out = execSync(`"${gitExe}" ${cmd}`, { cwd: repoDir, encoding: 'utf8' });
  if (out.trim()) console.log(out.trim());
}

try {
  run('init -b main');
  run('config user.name "BraaoPlan"');
  run('config user.email "abraao.luiz@medsenior.com.br"');
  
  // Remover remote antigo se já existir
  try {
    run('remote remove origin');
  } catch(e) {}
  
  run('remote add origin https://github.com/BraaoPlan/Planejamento.git');
  run('add .');
  run('status -s');
  run('commit -m "feat: implantacao oficial da plataforma QualiMed (SIGQ) com dados reais das consultorias"');
  console.log('--- Commit criado com sucesso localmente! ---');
} catch (err) {
  console.error('Erro na preparação do repositório Git:', err.message);
  if (err.stdout) console.log('stdout:', err.stdout);
  if (err.stderr) console.log('stderr:', err.stderr);
}
