@echo off
title Push MEPlanner (My Event Planner) ke GitHub
echo =======================================================
echo [MEPLANNER] MENGUNGGAH KODE KE GITHUB (omeko42/meplanner)...
echo =======================================================
echo.
cd /d "%~dp0"
git push -u origin main
echo.
echo =======================================================
if %ERRORLEVEL% equ 0 (
    echo [SUKSES] Seluruh kode berhasil ter-upload ke GitHub!
) else (
    echo [INFO] Jika muncul jendela login, silakan klik 'Sign in with your browser'.
)
echo =======================================================
pause
