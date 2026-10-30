@echo off
setlocal
set "META_PROJECT=D:\sito-fra2-copia"
if exist "%~dp0package.json" set "META_PROJECT=%~dp0"
if not exist "%META_PROJECT%\package.json" (
  echo La cartella del progetto non e stata trovata: %META_PROJECT%
  pause
  exit /b 1
)
cd /d "%META_PROJECT%"
echo Avvio di MetaHistoria con libro sfogliabile e mappamondo.
echo Indirizzo: http://127.0.0.1:4182/geopolitica-classica
echo Lascia aperta questa finestra mentre usi il sito. Ctrl+C per chiuderlo.
call npm.cmd run dev -- --host 127.0.0.1 --port 4182 --strictPort --open /geopolitica-classica
if errorlevel 1 pause
endlocal
