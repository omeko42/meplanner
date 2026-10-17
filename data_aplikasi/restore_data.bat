@echo off
setlocal enabledelayedexpansion

REM ==============================================================================
REM MY WEDDING MANAGER - SCRIPT RESTORE DATABASE LOKAL
REM ==============================================================================

echo =======================================================
echo [WEDDING DB] RESTORE DATABASE LOKAL MY WEDDING MANAGER
echo =======================================================

set ROOT_DIR=%~dp0..
set BACKUP_DIR=%~dp0backups
set LATEST_FILE=%BACKUP_DIR%\wedding_db_terbaru.json
set SEED_FILE=%BACKUP_DIR%\wedding_db_backup.json

if exist "%LATEST_FILE%" (
    set TARGET_FILE=%LATEST_FILE%
) else if exist "%SEED_FILE%" (
    set TARGET_FILE=%SEED_FILE%
) else (
    echo [ERROR] Tidak ada file backup database (.json) di folder %BACKUP_DIR%!
    pause
    exit /b 1
)

if not exist "%ROOT_DIR%\database" mkdir "%ROOT_DIR%\database"
if not exist "%ROOT_DIR%\.data" mkdir "%ROOT_DIR%\.data"

copy /y "%TARGET_FILE%" "%ROOT_DIR%\database\wedding_db.json" >nul
copy /y "%TARGET_FILE%" "%ROOT_DIR%\.data\wedding_db.json" >nul

echo =======================================================
echo [SUKSES] DATABASE LOKAL BERHASIL DI-RESTORE!
echo =======================================================
echo Sumber Restore : %TARGET_FILE%
echo Tujuan Aktif   : %ROOT_DIR%\database\wedding_db.json
echo =======================================================
pause
