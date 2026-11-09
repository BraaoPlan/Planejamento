' ===================================================================
' QualiMed - Iniciar em Segundo Plano (Modo Invisivel / Sem Janela)
' Executa o servidor QualiMed como servico em segundo plano para
' evitar que alguem feche a janela do terminal por engano.
' ===================================================================

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

strScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strScriptDir

' Executa INICIAR_QUALIMED.bat no diretorio corrente (evita problemas com espacos em caminhos de rede)
' O parametro 0 indica modo totalmente oculto / sem janela preta
WshShell.Run "cmd.exe /c INICIAR_QUALIMED.bat", 0, False
