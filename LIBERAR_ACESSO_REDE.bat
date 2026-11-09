@echo off
title QualiMed - Liberar Acesso na Rede (Firewall do Windows)
pushd "%~dp0"

echo ===================================================================
echo   QUALIMED - LIBERAR ACESSO DA REDE LOCAL NO FIREWALL DO WINDOWS
echo ===================================================================
echo.

:: 1. Verificar se ja esta rodando como Administrador
net session >nul 2>&1
if %errorlevel% equ 0 goto EXECUTAR_LIBERACAO

:: 2. Se nao for administrador, solicitar elevacao UAC automaticamente
echo [INFO] Solicitando permissao de Administrador para configurar o Firewall...
echo (Clique em "SIM" na janela de autorizacao do Windows)
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
exit /b

:EXECUTAR_LIBERACAO
echo [1/3] Configurando regra de entrada para a Porta 3000 (TCP)...
netsh advfirewall firewall delete rule name="QualiMed SIGQ Server (Porta 3000)" >nul 2>&1
netsh advfirewall firewall add rule name="QualiMed SIGQ Server (Porta 3000)" dir=in action=allow protocol=TCP localport=3000 profile=any >nul
if %errorlevel% equ 0 (
  echo    [OK] Regra da Porta 3000 criada com sucesso!
) else (
  echo    [AVISO] Verifique as permissoes do sistema.
)

echo.
echo [2/3] Liberando executavel do Node.js local...
if exist "%~dp0bin\node.exe" (
  netsh advfirewall firewall delete rule name="QualiMed Node Server (bin)" >nul 2>&1
  netsh advfirewall firewall add rule name="QualiMed Node Server (bin)" dir=in action=allow program="%~dp0bin\node.exe" enable=yes profile=any >nul
  echo    [OK] Node.js portatil (bin\node.exe) autorizado no Firewall!
)

echo.
echo [3/3] Verificando conexao de rede...
echo.
echo ===================================================================
echo  LIBERACAO CONCLUIDA COM SUCESSO!
echo  Os outros analistas agora podem acessar o sistema normalmente via:
echo  1. Atalho 'Abrir_QualiMed.url'
echo  2. Ou pelo endereco web informado no inicio do servidor.
echo ===================================================================
echo.
pause
