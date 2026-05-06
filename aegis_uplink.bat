@echo off
:: ==========================================
:: PROJECT AEGIS: AUTONOMOUS UPLINK PROTOCOL
:: TARGET: dev branch (Continuous Loop)
:: ==========================================
COLOR 0B
cd /d "D:\Project\Project AEGIS"

:SYNC_LOOP
echo.
echo    [/// AEGIS TELEMETRY SYNC INITIATED ///]
echo.

git checkout dev
git add .

set TIMESTAMP=%DATE:~-4%-%DATE:~4,2%-%DATE:~7,2%_%TIME:~0,2%:%TIME:~3,2%:%TIME:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

git commit -m "Automated Telemetry Uplink: %TIMESTAMP%"
git push origin dev

echo.
echo    [/// UPLINK COMPLETE. VAULT SECURED. ///]
echo    [/// SLEEPING FOR 5 MINUTES... ///]
echo.
timeout /t 15 /nobreak
goto SYNC_LOOP