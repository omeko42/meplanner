@echo off
title Push My Wedding Manager ke GitHub
echo =======================================================
echo [WEDDING MANAGER] MENGUNGGAH KODE KE GITHUB (omeko11/my_wedding_manager)...
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
