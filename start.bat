@echo off
title Otam Fermasi - Ishga tushirish
echo ====================================================
echo        OTAM FERMASI - QO'YCHILIK TIZIMI
echo ====================================================
echo.

set AGY_NODE="C:\Users\Abduaziz\AppData\Roaming\Antigravity\bin\agy-node.cmd"

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Node.js topildi, server ishga tushirilmoqda...
    start "" http://localhost:3000
    node server.js
    goto end
)

if exist %AGY_NODE% (
    echo Antigravity Node topildi, server ishga tushirilmoqda...
    start "" http://localhost:3000
    %AGY_NODE% server.js
    goto end
)

echo Server rejimi uchun Node topilmadi.
echo Brauzerda bevosita index.html ochilmoqda...
start "" "%~dp0index.html"

:end
