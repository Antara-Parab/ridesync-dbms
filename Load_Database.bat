@echo off
title Load RideSync Database
echo Loading RideSync database into MySQL...
type "%~dp0ridesync_pure_mysql.sql" | "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root
if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================================
    echo SUCCESS: Database ridesync_db loaded successfully!
    echo Open MySQL Workbench and load VIVA_DEMO_MASTER.sql
    echo =======================================================
) else (
    echo.
    echo =======================================================
    echo ERROR: Could not connect to MySQL Server.
    echo Make sure Start_MySQL_Server.bat is running in background!
    echo =======================================================
)
pause
