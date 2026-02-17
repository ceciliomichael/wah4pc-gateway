@echo off
echo Setting up permissions for Docker data directory...

REM Create data directory if it doesn't exist
if not exist "data" mkdir data

REM Set appropriate permissions for Windows
REM Note: Windows handles permissions differently than Linux
REM The Docker container will use UID 1001, so we need to ensure the volume mount works

echo Data directory created at: %cd%\data
echo.
echo IMPORTANT: On Windows, Docker Desktop handles file permissions automatically.
echo The container user (UID 1001) should be able to write to the mounted volume.
echo.
echo If you still encounter permission issues, try:
echo 1. Right-click on the 'data' folder → Properties → Security → Edit Permissionsecho 2. Add 'Everyone' with 'Full Control' (for development only)
echo 3. Or run Docker Desktop as Administrator
echo.
echo You can now run: docker-compose up --build
pause