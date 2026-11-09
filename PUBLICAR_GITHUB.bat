@echo off
title Publicar Projeto no GitHub
pushd "%~dp0"

echo ===================================================================
echo   PUBLICAR PROJETO NO GITHUB - QUALIMED (SIGQ)
echo   Repositorio: https://github.com/BraaoPlan/Planejamento.git
echo ===================================================================
echo.

set "GIT_EXE=C:\Users\abraao.luiz\AppData\Local\Programs\MinGit\cmd\git.exe"

if not exist "%GIT_EXE%" (
    where git >nul 2>nul
    if %errorlevel% equ 0 set "GIT_EXE=git"
)

if not exist "%GIT_EXE%" if not "%GIT_EXE%"=="git" (
    echo [ERRO] Git nao encontrado em %GIT_EXE%.
    pause
    exit /b
)

echo [1/3] Verificando status do repositorio...
"%GIT_EXE%" status

echo.
echo [2/3] Enviando commits para o GitHub (ramo main)...
echo OBS: Se for a primeira vez, o Git abrira uma janela no seu navegador
echo para voce autorizar o acesso ao GitHub (conta BraaoPlan).
echo.
"%GIT_EXE%" push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================================
    echo   SUCESSO! O projeto foi publicado no GitHub:
    echo   https://github.com/BraaoPlan/Planejamento
    echo ===================================================================
) else (
    echo.
    echo [AVISO] Ocorreu uma pendencia de autenticacao com o GitHub.
    echo Certifique-se de que voce esta conectado na conta BraaoPlan.
)

echo.
pause
