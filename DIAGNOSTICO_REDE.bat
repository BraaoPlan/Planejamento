@echo off
title QualiMed - Diagnostico de Rede e Inicializacao
pushd "%~dp0"

echo ===================================================================
echo   QUALIMED - DIAGNOSTICO DE REDE E TESTE DE INICIALIZACAO
echo ===================================================================
echo.

echo 1. Diretorio de Execucao:
echo    %CD%
echo.

echo 2. Verificando executavel do Node.js...
set "NODE_CMD="
where node >nul 2>nul
if %errorlevel% equ 0 set "NODE_CMD=node"

if "%NODE_CMD%"=="" if exist "%~dp0bin\node.exe" set "NODE_CMD=%~dp0bin\node.exe"
if "%NODE_CMD%"=="" if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_CMD=%LOCALAPPDATA%\Programs\nodejs\node.exe"
if "%NODE_CMD%"=="" if exist "C:\Program Files\nodejs\node.exe" set "NODE_CMD=C:\Program Files\nodejs\node.exe"
if "%NODE_CMD%"=="" if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODE_CMD=C:\Program Files (x86)\nodejs\node.exe"
if "%NODE_CMD%"=="" if exist "%USERPROFILE%\Downloads\node-v24.21.0-win-x64\node-v24.21.0-win-x64\node.exe" set "NODE_CMD=%USERPROFILE%\Downloads\node-v24.21.0-win-x64\node-v24.21.0-win-x64\node.exe"

if not "%NODE_CMD%"=="" goto NODE_OK

echo    [FALHA] Node.js nao foi encontrado no sistema!
echo    Para rodar como servidor nesta maquina, instale o Node.js em: https://nodejs.org/
goto FIM

:NODE_OK
echo    [OK] Node.js encontrado: "%NODE_CMD%"
"%NODE_CMD%" -v
echo.

echo 3. Verificando modulos de dependencias - pasta node_modules...
if not exist "node_modules\express" goto SEM_EXPRESS
echo    [OK] Modulo express presente.
goto CHECK_CORS

:SEM_EXPRESS
echo    [FALHA] Pasta node_modules\express ausente!
echo    Voce precisa extrair a pasta node_modules que vem dentro do QualiMed-SIGQ-Release.zip.
goto FIM

:CHECK_CORS
if not exist "node_modules\cors" goto SEM_CORS
echo    [OK] Modulo cors presente.
goto CHECK_DB

:SEM_CORS
echo    [FALHA] Pasta node_modules\cors ausente!
goto FIM

:CHECK_DB
echo.
echo 4. Verificando banco de dados SQLite e permissoes de escrita...
if not exist "qualimed.sqlite" goto SEM_DB
echo    [OK] Arquivo qualimed.sqlite encontrado.
goto TESTAR_ESCRITA

:SEM_DB
echo    [AVISO] qualimed.sqlite ainda nao existe nesta pasta - sera criado na subida.

:TESTAR_ESCRITA
echo teste > teste_permissao.tmp 2>nul
if not exist teste_permissao.tmp goto SEM_PERMISSAO
del /f /q teste_permissao.tmp >nul 2>nul
echo    [OK] Permissao de escrita na pasta confirmada.
goto CHECK_PORTA

:SEM_PERMISSAO
echo    [ALERTA] A pasta de rede parece estar com restricao de gravacao para este usuario!

:CHECK_PORTA
echo.
echo 5. Verificando status da Porta 3000...
netstat -ano | findstr ":3000 " >nul
if %errorlevel% neq 0 goto PORTA_LIVRE
echo    [INFO] A porta 3000 ja esta ocupada por outro processo.
goto START_SERVER

:PORTA_LIVRE
echo    [OK] Porta 3000 livre para uso.

:START_SERVER
echo.
echo ===================================================================
echo  TENTANDO INICIAR O SERVIDOR AGORA - MODO DIAGNOSTICO:
echo  Se houver erro, ele aparecera abaixo sem fechar a janela.
echo ===================================================================
echo.

"%NODE_CMD%" server.js

:FIM
echo.
echo ===================================================================
echo  O processo terminou. Esta janela ficara aberta para leitura.
echo ===================================================================
pause
