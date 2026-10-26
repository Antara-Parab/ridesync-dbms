@echo off
title MySQL Server Launcher
echo ==================================================
echo Starting MySQL Server on localhost:3306...
echo Keep this window open in the background!
echo ==================================================
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="C:\ProgramData\MySQL\MySQL Server 8.4\Data" --port=3306 --console
pause
