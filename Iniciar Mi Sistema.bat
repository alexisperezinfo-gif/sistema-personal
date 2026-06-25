@echo off
title Mi Sistema Personal
cd /d "%~dp0"

REM Si todavia no se instalaron las dependencias, instalarlas
if not exist "node_modules" (
  echo Instalando por primera vez, esto puede tardar un minuto...
  call npm install
)

REM Si no existe el build, generarlo
if not exist "dist\index.html" (
  echo Preparando la aplicacion por primera vez...
  call npm run build
)

echo.
echo  Abriendo Mi Sistema Personal en tu navegador...
echo  (Deja esta ventana abierta mientras usas la app)
echo.
node serve.mjs
pause
