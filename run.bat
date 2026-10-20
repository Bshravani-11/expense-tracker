@echo off
title Expense Tracker
echo ========================================================
echo   Starting Expense Tracker Web Application...
echo   Once started, open: http://localhost:8080
echo   To stop the server, press Ctrl + C
echo ========================================================
echo.

call "%~dp0mvnw.cmd" spring-boot:run
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Attempting to run via packaged JAR...
    java -jar "%~dp0target\expense-tracker-1.0.0.jar"
)

pause
