@echo off
title Push MEPlan (My Event Planner) ke GitHub
echo =======================================================
echo [MEPLAN] MENGUNGGAH KODE KE GITHUB (omeko11/meplan)...
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
