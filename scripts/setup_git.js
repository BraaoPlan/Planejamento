const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(process.env.LOCALAPPDATA, 'Programs', 'MinGit');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

const zipPath = path.join(process.env.TEMP, 'mingit.zip');
const url = 'https://github.com/git-for-windows/git/releases/download/v2.56.0.windows.4/MinGit-2.56.0.4-64-bit.zip';

console.log('Baixando MinGit...');
execSync(`curl.exe -L -o "${zipPath}" "${url}"`, { stdio: 'inherit' });

console.log('Extraindo MinGit...');
execSync(`tar.exe -xf "${zipPath}" -C "${targetDir}"`, { stdio: 'inherit' });

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

const gitExe = path.join(targetDir, 'cmd', 'git.exe');
console.log('Verificando git:', gitExe);
const ver = execSync(`"${gitExe}" --version`, { encoding: 'utf8' });
console.log('Sucesso!', ver.trim());
