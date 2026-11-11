@echo off
rem Projet Plume : construit le site puis l'ouvre dans le navigateur.
rem Double-cliquez sur ce fichier. Fermez la fenetre noire pour arreter.
chcp 65001 >nul
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
echo Construction du site...
python -I outils\construire.py
if errorlevel 1 (
  echo.
  echo La construction a echoue : lisez le message ci-dessus.
  pause
  exit /b 1
)
echo.
echo Le site s'ouvre dans votre navigateur : http://localhost:8000
echo Laissez cette fenetre ouverte pendant que vous utilisez le site.
start "" http://localhost:8000
python -I outils\servir.py 8000
pause
