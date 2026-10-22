@echo off
rem Chay server local + mo trinh duyet tu dong
chcp 65001 >nul
cd /d "%~dp0"

set PORT=8000

rem Kiem tra port dang ban -> dung port khac
:findport
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul
if not errorlevel 1 (
    set /a PORT+=1
    goto findport
)

echo Server chay tai: http://localhost:%PORT%

rem Python co san -> dung http.server
where python >nul 2>&1
if not errorlevel 1 (
    start "" "http://localhost:%PORT%"
    python -m http.server %PORT%
    goto end
)

rem Fallback: npx serve
where npx >nul 2>&1
if not errorlevel 1 (
    start "" "http://localhost:%PORT%"
    npx serve -l %PORT% .
    goto end
)

echo Khong tim thay python hoac npx. Cai dat Python de chay script nay.
pause

:end
