@echo off
echo Setting up Schulnetz Browser Automation...

echo.
echo [1/3] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo [2/3] Installing Python dependencies...
cd /d "%~dp0"
python -m pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo [3/3] Installing Playwright browser...
python -m playwright install chromium

if %errorlevel% neq 0 (
    echo ERROR: Failed to install Playwright browser
    pause
    exit /b 1
)

echo.
echo ✓ Setup completed successfully!
echo.
echo You can now run the Schulnetz app from Godot.
echo The browser automation will start automatically when needed.
echo.
pause
