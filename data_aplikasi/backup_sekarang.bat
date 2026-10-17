@echo off
setlocal enabledelayedexpansion

REM ==============================================================================
REM MY WEDDING MANAGER - SCRIPT BACKUP DATABASE LOKAL OTOMATIS
REM ==============================================================================

echo =======================================================
echo [WEDDING DB] MEMULAI PROSES BACKUP DATABASE LOKAL...
echo =======================================================

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

set ROOT_DIR=%~dp0..
set DB_PRIMARY=%ROOT_DIR%\database\wedding_db.json
set DB_RUNTIME=%ROOT_DIR%\.data\wedding_db.json
set BACKUP_DIR=%~dp0backups

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set BACKUP_FILE=%BACKUP_DIR%\wedding_db_backup_%TIMESTAMP%.json
set LATEST_FILE=%BACKUP_DIR%\wedding_db_terbaru.json

if exist "%DB_PRIMARY%" (
    copy /y "%DB_PRIMARY%" "%BACKUP_FILE%" >nul
    copy /y "%DB_PRIMARY%" "%LATEST_FILE%" >nul
) else if exist "%DB_RUNTIME%" (
    copy /y "%DB_RUNTIME%" "%BACKUP_FILE%" >nul
    copy /y "%DB_RUNTIME%" "%LATEST_FILE%" >nul
) else (
    echo [ERROR] File database lokal belum ditemukan!
    pause
    exit /b 1
)

echo =======================================================
echo [SUKSES] DATABASE LOKAL BERHASIL DI-BACKUP!
echo =======================================================
echo Lokasi File Backup:
echo -^> %BACKUP_FILE%
echo -^> %LATEST_FILE%
echo =======================================================
pause
