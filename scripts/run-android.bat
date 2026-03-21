@echo off
REM Run Android build from monorepo root when `npm` is not on PATH in this shell.
REM Uses default Node.js install location; adjust NODEJS if needed.
set "NODEJS=%ProgramFiles%\nodejs\npm.cmd"
if not exist "%NODEJS%" set "NODEJS=npm.cmd"
cd /d "%~dp0\.."
"%NODEJS%" run android --workspace=apps/mobile %*
