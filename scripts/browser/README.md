# Schulnetz Browser Automation

This directory contains the headless browser automation system that allows the Godot app to connect to Schulnetz without requiring users to manually open a browser.

## How It Works

1. **Headless Browser**: Uses Playwright to run a headless Chrome browser in the background
2. **Web Scraping**: Automatically logs into Schulnetz and extracts data (grades, calendar, assignments)
3. **API Server**: Exposes a local HTTP API that the Godot app communicates with
4. **Session Management**: Maintains login session and handles re-authentication as needed

## Setup Instructions

### Automatic Setup (Recommended)
1. Run `setup.bat` in this directory
2. Follow the prompts to install dependencies

### Manual Setup
1. Install Python 3.8+ from https://python.org
2. Install dependencies: `pip install -r requirements.txt`
3. Install Playwright browser: `playwright install chromium`

## Usage

The browser automation starts automatically when the Godot app needs to connect to Schulnetz. Users will be prompted to enter their Schulnetz credentials the first time.

## Files

- `schulnetz_automation.py` - Main automation script
- `requirements.txt` - Python dependencies
- `setup.bat` - Automatic setup script
- `README.md` - This file

## Configuration

The automation script can be configured by modifying the selectors and URLs in `schulnetz_automation.py` to match your specific Schulnetz instance.

## Troubleshooting

### Browser fails to start
- Ensure Python is installed and in PATH
- Run setup script again
- Check if antivirus is blocking Playwright

### Login fails
- Verify Schulnetz URL is correct
- Check if Schulnetz has changed their login form
- Update selectors in the automation script

### Data extraction fails
- Schulnetz may have changed their page structure
- Update the scraping selectors in the automation script
- Check browser console for JavaScript errors

## Security Notes

- Credentials are only stored temporarily in memory
- Communication happens over localhost only
- Browser runs in headless mode for security
- No persistent storage of sensitive data

## Customization

To adapt this for different Schulnetz instances:

1. Update the base URL in `schulnetz_automation.py`
2. Modify the CSS selectors to match your Schulnetz's HTML structure
3. Adjust the data extraction logic as needed

## Dependencies

- **aiohttp**: Async HTTP server framework
- **playwright**: Browser automation framework
- **asyncio**: Async programming support
