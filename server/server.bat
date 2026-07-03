::[Bat To Exe Converter]
::
::YAwzoRdxOk+EWAjk
::fBw5plQjdCyDJGyX8VAjFB5aHlPXaTiGILQK5/ry+++Unm4SWO46f47W37qaKdwy51XhZ5MR5H9Xkd8zABJWexeXfR03lXxXtH3LPsST0w==
::YAwzuBVtJxjWCl3EqQJgSA==
::ZR4luwNxJguZRRnk
::Yhs/ulQjdF+5
::cxAkpRVqdFKZSzk=
::cBs/ulQjdF+5
::ZR41oxFsdFKZSTk=
::eBoioBt6dFKZSTk=
::cRo6pxp7LAbNWATEpCI=
::egkzugNsPRvcWATEpCI=
::dAsiuh18IRvcCxnZtBJQ
::cRYluBh/LU+EWAnk
::YxY4rhs+aU+JeA==
::cxY6rQJ7JhzQF1fEqQJQ
::ZQ05rAF9IBncCkqN+0xwdVs0
::ZQ05rAF9IAHYFVzEqQJQ
::eg0/rx1wNQPfEVWB+kM9LVsJDGQ=
::fBEirQZwNQPfEVWB+kM9LVsJDGQ=
::cRolqwZ3JBvQF1fEqQJQ
::dhA7uBVwLU+EWDk=
::YQ03rBFzNR3SWATElA==
::dhAmsQZ3MwfNWATElA==
::ZQ0/vhVqMQ3MEVWAtB9wSA==
::Zg8zqx1/OA3MEVWAtB9wSA==
::dhA7pRFwIByZRRnk
::Zh4grVQjdCyDJGyX8VAjFB5aHlPXaTiGIrAP4/z0/9aqo10NVaw6YIq7
::YB416Ek+ZG8=
::
::
::978f952a14a936cc963da21a135fa983
@ECHO OFF

if "%b2eprogramfilename%"==""  (
	echo To see any results you need to convert this file into an exe
	pause
	goto :eof
)

:: variables
SET map_folder=%~dp0\server
SET conemu_exe=%CMDER_ROOT%\vendor\conemu-maximus5\ConEmu.exe
SET conemu_ico=%CMDER_ROOT%\icons\cmder.ico
SET conemu_cfgfile=%CMDER_ROOT%\config\ConEmu.xml
SET conemu_init=%CMDER_ROOT%\vendor\init.bat
SET bundle=C:\Ruby\bin\bundle.bat
SET GEM_HOME=C:\Ruby\lib\ruby\gems\2.5.0
SET argv=%*



IF NOT EXIST "%map_folder%" (
    ECHO %~n0: file not found - %map_folder% >&2
    EXIT /B 1
)
IF NOT EXIST "%bundle%" (
    %extd% /messagebox Error "File %bundle% non trovato installare ruby" 16
    EXIT /B 1
)

START %conemu_exe% /icon %conemu_ico% /title "Map"  /loadcfgfile %conemu_cfgfile% /cmd cmd /k "%conemu_init% && cd /D %MAP_FOLDER% && %bundle% exec puma -C .\config\puma_prod_wpws07133656.rb"

