const { spawn } = require('child_process');
const path = require('path');

const nodeExe = process.execPath;
const serverJs = path.join(__dirname, 'server.js');

const child = spawn(nodeExe, [serverJs], {
  detached: true,
  stdio: 'ignore',
  cwd: __dirname,
  windowsHide: true
});

child.unref();

console.log(`[DAEMON] Servidor QualiMed iniciado com sucesso no background!`);
console.log(`[PID] ${child.pid}`);
process.exit(0);
