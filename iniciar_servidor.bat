@echo off
chcp 65001 > nul
title QualiMed - Plataforma de Gestao da Qualidade (SIGQ)
color 0A
cls
echo ========================================================
echo  QUALIMED - PLATAFORMA DE GESTAO DA QUALIDADE (SIGQ)
echo ========================================================
echo.
echo Compilando views mais recentes...
node build.js
echo.
echo Iniciando servidor integrado na porta 3000...
echo.
node server.js
pause
