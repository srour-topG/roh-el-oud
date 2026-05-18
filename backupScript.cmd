@echo off
:: Set variables
set DB_NAME=roh_system
set DB_USER=root
set DB_PASS=cardio@123
set BACKUP_DIR=E:\cardio\backup
set DATESTAMP=%DATE:~10,4%-%DATE:~4,2%-%DATE:~7,2%_%TIME:~0,2%-%TIME:~3,2%

:: Ensure backup directory xists


:: Dump the database
"C:\Program Files\MySQL\MySQL Server 5.7\bin\mysqldump.exe" -u%DB_USER% -p%DB_PASS% %DB_NAME% > "%BACKUP_DIR%\%DB_NAME%_%DATESTAMP%.sql"


echo Backup complete: %DB_NAME% at %DATESTAMP%
