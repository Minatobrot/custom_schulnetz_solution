#!/usr/bin/env python3
"""
Schulnetz Headless Browser Automation
Runs a headless browser to interact with Schulnetz and exposes API endpoints
"""

import asyncio
import json
import argparse
import os
import re
from datetime import datetime
from typing import Dict, List, Optional
import aiohttp
from aiohttp import web
from playwright.async_api import async_playwright, Page, Browser
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SchulnetzAutomation:
    def __init__(self, port: int = 8765):
        self.port = port
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.session_active = False
        self.username = ""
        self.password = ""
        self.cookies = {}  # Store session cookies
        self.school_identifier = ""  # e.g., "ausserschwyz"
        self.config_file = "schulnetz_config.json"
        self.page_ids = {}  # Store discovered page IDs
        
    def load_config(self):
        """Load saved configuration"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
                    self.school_identifier = config.get('school_identifier', '')
                    logger.info(f"Loaded config: School identifier = {self.school_identifier}")
                    return True
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
        return False
    
    def save_config(self):
        """Save configuration"""
        try:
            config = {
                'school_identifier': self.school_identifier,
                'last_updated': datetime.now().isoformat()
            }
            with open(self.config_file, 'w') as f:
                json.dump(config, f, indent=2)
            logger.info(f"Saved config: School identifier = {self.school_identifier}")
        except Exception as e:
            logger.error(f"Failed to save config: {e}")
    
    def extract_school_identifier(self, url: str) -> str:
        """Extract school identifier from Schulnetz URL"""
        # Look for pattern like schul-netz.com/IDENTIFIER/
        match = re.search(r'schul-netz\.com/([^/]+)/', url)
        if match:
            return match.group(1)
        return ""
    
    def setup_school_configuration(self, schulnetz_url: str) -> Dict:
        """Set up school configuration from user's Schulnetz URL"""
        try:
            school_id = self.extract_school_identifier(schulnetz_url)
            if not school_id:
                return {
                    "success": False,
                    "error": "Could not extract school identifier from URL. Please provide a valid Schulnetz URL."
                }
            
            self.school_identifier = school_id
            self.save_config()
            
            return {
                "success": True,
                "school_identifier": school_id,
                "message": f"Configuration saved for school: {school_id}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_base_url(self) -> str:
        """Get base URL for the configured school"""
        if not self.school_identifier:
            raise ValueError("School identifier not configured")
        return f"https://www.schul-netz.com/{self.school_identifier}/"
    
    def clear_session_data(self):
        """Clear session cookies and page IDs for new login"""
        self.cookies = {}
        self.page_ids = {}
        self.session_active = False
        logger.info("Cleared session data")
        
    async def start_browser(self):
        """Initialize headless browser"""
        try:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            self.page = await self.browser.new_page()
            
            # Set user agent to avoid detection
            await self.page.set_user_agent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            
            logger.info("Browser started successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to start browser: {e}")
            return False
    
    async def login_to_schulnetz(self, username: str, password: str) -> Dict:
        """Login to Schulnetz"""
        try:
            # Check if school is configured
            if not self.school_identifier:
                return {
                    "type": "login",
                    "success": False,
                    "error": "School not configured. Please set up your Schulnetz URL first."
                }
            
            # Clear previous session data
            self.clear_session_data()
            
            self.username = username
            self.password = password
            
            # Navigate to school-specific login page
            login_url = f"{self.get_base_url()}loginto.php?pageid=1&mode=0&lang="
            logger.info(f"Navigating to login page: {login_url}")
            await self.page.goto(login_url)
            
            # Wait for login form
            await self.page.wait_for_selector('#username', timeout=10000)
            
            # Fill login form
            await self.page.fill('#username', username)
            await self.page.fill('#password', password)
            
            # Submit login
            await self.page.click('input[type="submit"]')
            
            # Wait for redirect or check if login was successful
            try:
                # Wait for successful login (redirect to main page)
                await self.page.wait_for_url('**/index.php**', timeout=10000)
                self.session_active = True
                
                # Get cookies for later use
                cookies = await self.page.context.cookies()
                self.cookies = {cookie['name']: cookie['value'] for cookie in cookies}
                logger.info(f"Stored {len(self.cookies)} session cookies")
                
                # Discover page IDs from the current page
                await self.discover_page_ids()
                
                # Test the login by making the scheduler API call
                test_result = await self.test_scheduler_api()
                
                return {
                    "type": "login",
                    "success": True,
                    "session_data": {
                        "user": username,
                        "school": self.school_identifier,
                        "login_time": datetime.now().isoformat(),
                        "page_ids": self.page_ids,
                        "test_api_result": test_result
                    }
                }
            except:
                # Check for error messages
                error_element = await self.page.query_selector('.error, .alert-danger')
                error_msg = "Invalid credentials"
                if error_element:
                    error_msg = await error_element.text_content()
                
                return {
                    "type": "login",
                    "success": False,
                    "error": error_msg
                }
                
        except Exception as e:
            logger.error(f"Login failed: {e}")
            return {
                "type": "login",
                "success": False,
                "error": str(e)
            }
    
    async def discover_page_ids(self):
        """Discover page IDs from the current page after login"""
        try:
            # Look for links that contain page IDs
            links = await self.page.query_selector_all('a[href*="pageid="]')
            
            for link in links:
                href = await link.get_attribute('href')
                text = await link.text_content()
                
                if href and 'pageid=' in href:
                    # Extract page ID
                    match = re.search(r'pageid=(\d+)', href)
                    if match:
                        page_id = match.group(1)
                        text_lower = text.lower().strip()
                        
                        # Map common page types
                        if any(keyword in text_lower for keyword in ['note', 'grade', 'bewertung']):
                            self.page_ids['grades'] = page_id
                            logger.info(f"Found grades page ID: {page_id}")
                        elif any(keyword in text_lower for keyword in ['agenda', 'termin', 'kalender']):
                            self.page_ids['agenda'] = page_id
                            logger.info(f"Found agenda page ID: {page_id}")
                        elif any(keyword in text_lower for keyword in ['stunden', 'schedule', 'plan']):
                            self.page_ids['schedule'] = page_id
                            logger.info(f"Found schedule page ID: {page_id}")
            
            # Also get current page ID
            current_url = self.page.url
            match = re.search(r'pageid=(\d+)', current_url)
            if match:
                self.page_ids['main'] = match.group(1)
                logger.info(f"Current main page ID: {match.group(1)}")
                
        except Exception as e:
            logger.error(f"Failed to discover page IDs: {e}")
    
    async def test_scheduler_api(self) -> Dict:
        """Test login by calling the scheduler API endpoint"""
        try:
            if not self.school_identifier:
                return {
                    "success": False,
                    "error": "School identifier not configured"
                }
                
            # Use a future date for testing (August 18, 2025)
            test_date = "2025-08-18"
            
            # Build the scheduler API URL with the school-specific identifier
            scheduler_url = (
                f"{self.get_base_url()}scheduler_processor.php"
                f"?view=week&curr_date={test_date}&min_date={test_date}"
                f"&max_date=2025-08-25&ansicht=klassenuebersicht"
                f"&showOnlyThisClass=-2&id=4a6f04eda5b1e943"
                f"&transid=6289a9&pageid=21312&timeshift=-330"
            )
            
            logger.info(f"Testing scheduler API: {scheduler_url}")
            
            # Make the API request using the current page context (with cookies)
            response = await self.page.evaluate(f"""
                fetch('{scheduler_url}', {{
                    method: 'GET',
                    headers: {{
                        'Accept': '*/*',
                        'Accept-Language': 'en-GB,en;q=0.8',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-origin'
                    }}
                }})
                .then(response => response.text())
                .catch(error => {{ throw error; }})
            """)
            
            logger.info(f"Scheduler API test response length: {len(response)}")
            
            return {
                "success": True,
                "response_length": len(response),
                "has_data": len(response) > 100,
                "preview": response[:200] if response else "No response",
                "school": self.school_identifier
            }
            
        except Exception as e:
            logger.error(f"Scheduler API test failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def fetch_grades(self) -> Dict:
        """Scrape grades from Schulnetz"""
        if not self.session_active:
            return {"type": "grades", "success": False, "error": "Not logged in"}
        
        if not self.school_identifier:
            return {"type": "grades", "success": False, "error": "School not configured"}
        
        try:
            # Use discovered grades page ID or default to known pattern
            grades_page_id = self.page_ids.get('grades', '21311')  # 21311 is default for grades
            grades_url = f"{self.get_base_url()}index.php?pageid={grades_page_id}"
            
            logger.info(f"Navigating to grades page: {grades_url}")
            await self.page.goto(grades_url)
            
            # Wait for grades table to load
            await self.page.wait_for_selector('.grades-table, table, .note', timeout=10000)
            
            # Extract grades data
            grades = []
            
            # Try multiple selectors for grades (Schulnetz uses different structures)
            grade_selectors = [
                'tr.grade-row',
                'tr[class*="note"]',
                'tr[class*="bewertung"]',
                'table tr:has(td)',
                '.note-row'
            ]
            
            grade_rows = []
            for selector in grade_selectors:
                elements = await self.page.query_selector_all(selector)
                if elements:
                    grade_rows = elements
                    logger.info(f"Found {len(elements)} grade rows using selector: {selector}")
                    break
            
            for row in grade_rows:
                try:
                    # Get all cells in the row
                    cells = await row.query_selector_all('td')
                    if len(cells) < 2:
                        continue
                    
                    # Extract text from cells
                    cell_texts = []
                    for cell in cells:
                        text = await cell.text_content()
                        cell_texts.append(text.strip() if text else "")
                    
                    # Try to identify subject, grade, date, theme from cell contents
                    subject = ""
                    grade_value = None
                    date = ""
                    theme = ""
                    
                    # Look for grade value (number between 1-6 typically)
                    for i, text in enumerate(cell_texts):
                        if re.match(r'^\d+([.,]\d+)?$', text):
                            try:
                                grade_value = float(text.replace(',', '.'))
                                if 1 <= grade_value <= 6:  # Swiss grading system
                                    # Subject is likely in earlier cells
                                    if i > 0:
                                        subject = cell_texts[i-1]
                                    # Theme might be in later cells
                                    if i + 1 < len(cell_texts):
                                        theme = cell_texts[i+1]
                                    break
                            except ValueError:
                                continue
                    
                    # Look for date pattern
                    for text in cell_texts:
                        if re.search(r'\d{1,2}[./]\d{1,2}[./]\d{2,4}', text):
                            date = text
                            break
                    
                    if subject and grade_value is not None:
                        grades.append({
                            "subject": subject,
                            "grade": grade_value,
                            "date": date,
                            "theme": theme,
                            "weight": 1.0,  # Default weight
                            "raw_cells": cell_texts  # For debugging
                        })
                        
                except Exception as e:
                    logger.warning(f"Failed to parse grade row: {e}")
                    continue
            
            return {
                "type": "grades",
                "success": True,
                "grades": grades,
                "count": len(grades),
                "page_id_used": grades_page_id
            }
            
        except Exception as e:
            logger.error(f"Failed to fetch grades: {e}")
            return {
                "type": "grades",
                "success": False,
                "error": str(e)
            }
    
    async def fetch_calendar(self) -> Dict:
        """Fetch calendar/exam data from Schulnetz scheduler API"""
        if not self.session_active:
            return {"type": "calendar", "success": False, "error": "Not logged in"}
        
        if not self.school_identifier:
            return {"type": "calendar", "success": False, "error": "School not configured"}
        
        try:
            # Get current date and calculate week range
            from datetime import datetime, timedelta
            current_date = datetime.now()
            start_date = current_date.strftime('%Y-%m-%d')
            end_date = (current_date + timedelta(days=7)).strftime('%Y-%m-%d')
            
            # Build the scheduler API URL with school-specific identifier
            scheduler_url = (
                f"{self.get_base_url()}scheduler_processor.php"
                f"?view=week&curr_date={start_date}&min_date={start_date}"
                f"&max_date={end_date}&ansicht=klassenuebersicht"
                f"&showOnlyThisClass=-2&id=4a6f04eda5b1e943"
                f"&transid=6289a9&pageid=21312&timeshift=-330"
            )
            
            logger.info(f"Fetching calendar from: {scheduler_url}")
            
            # Make the API request using the current page context (with cookies)
            response = await self.page.evaluate(f"""
                fetch('{scheduler_url}', {{
                    method: 'GET',
                    headers: {{
                        'Accept': '*/*',
                        'Accept-Language': 'en-GB,en;q=0.8',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-origin'
                    }}
                }})
                .then(response => response.text())
                .catch(error => {{ throw error; }})
            """)
            
            # Parse the response to extract exam/event information
            events = self.parse_scheduler_response(response)
            
            return {
                "type": "calendar",
                "success": True,
                "events": events,
                "count": len(events),
                "raw_response_length": len(response),
                "school": self.school_identifier
            }
            
        except Exception as e:
            logger.error(f"Failed to fetch calendar: {e}")
            return {
                "type": "calendar",
                "success": False,
                "error": str(e)
            }
    
    def parse_scheduler_response(self, response: str) -> List[Dict]:
        """Parse the scheduler API response to extract events/exams"""
        events = []
        
        try:
            # The response might be HTML or JSON, let's handle both
            if response.strip().startswith('{') or response.strip().startswith('['):
                # JSON response
                import json
                data = json.loads(response)
                # Extract events from JSON structure (adjust based on actual format)
                if isinstance(data, list):
                    for item in data:
                        events.append({
                            "title": item.get("title", "Exam/Event"),
                            "date": item.get("date", ""),
                            "time": item.get("time", ""),
                            "description": item.get("description", ""),
                            "type": "exam"
                        })
            else:
                # HTML response - extract using simple parsing
                import re
                
                # Look for exam patterns in HTML
                # This is a basic parser - adjust regex based on actual HTML structure
                exam_patterns = [
                    r'(?i)exam|test|prüfung|klausur',
                    r'(?i)assignment|homework|aufgabe',
                    r'(?i)deadline|abgabe|termin'
                ]
                
                lines = response.split('\n')
                for i, line in enumerate(lines):
                    for pattern in exam_patterns:
                        if re.search(pattern, line):
                            # Extract surrounding context for more info
                            context_start = max(0, i-2)
                            context_end = min(len(lines), i+3)
                            context = ' '.join(lines[context_start:context_end])
                            
                            # Try to extract date information
                            date_match = re.search(r'\d{1,2}[./]\d{1,2}[./]\d{2,4}', context)
                            date_str = date_match.group(0) if date_match else ""
                            
                            events.append({
                                "title": line.strip()[:100],  # Limit title length
                                "date": date_str,
                                "time": "",
                                "description": context.strip()[:200],  # Limit description
                                "type": "exam"
                            })
                            break
                
                # If no specific patterns found, create a general event
                if not events and len(response) > 50:
                    from datetime import datetime
                    events.append({
                        "title": "Scheduler Data Available",
                        "date": datetime.now().strftime('%Y-%m-%d'),
                        "time": "",
                        "description": f"Raw scheduler data received ({len(response)} characters)",
                        "type": "info"
                    })
                    
        except Exception as e:
            logger.error(f"Failed to parse scheduler response: {e}")
            # Fallback: create a basic event with the response info
            from datetime import datetime
            events.append({
                "title": "Scheduler API Response",
                "date": datetime.now().strftime('%Y-%m-%d'),
                "time": "",
                "description": f"Response received but parsing failed: {str(e)[:100]}",
                "type": "error"
            })
        
        return events
    
    async def fetch_assignments(self) -> Dict:
        """Scrape homework/assignments from Schulnetz"""
        if not self.session_active:
            return {"type": "assignments", "success": False, "error": "Not logged in"}
        
        try:
            # Navigate to assignments page
            await self.page.goto('https://schulnetz.com/assignments')  # Replace with actual URL
            
            # Wait for assignments to load
            await self.page.wait_for_selector('.assignments, .homework', timeout=10000)
            
            # Extract assignments
            assignments = []
            assignment_elements = await self.page.query_selector_all('.assignment-item')
            
            for assignment_elem in assignment_elements:
                title_elem = await assignment_elem.query_selector('.title')
                subject_elem = await assignment_elem.query_selector('.subject')
                due_date_elem = await assignment_elem.query_selector('.due-date')
                desc_elem = await assignment_elem.query_selector('.description')
                
                if title_elem and subject_elem:
                    title = await title_elem.text_content()
                    subject = await subject_elem.text_content()
                    due_date = await due_date_elem.text_content() if due_date_elem else ""
                    description = await desc_elem.text_content() if desc_elem else ""
                    
                    assignments.append({
                        "title": title.strip(),
                        "subject": subject.strip(),
                        "due_date": due_date.strip(),
                        "description": description.strip()
                    })
            
            return {
                "type": "assignments",
                "success": True,
                "assignments": assignments,
                "count": len(assignments)
            }
            
        except Exception as e:
            logger.error(f"Failed to fetch assignments: {e}")
            return {
                "type": "assignments",
                "success": False,
                "error": str(e)
            }
    
    async def get_status(self) -> Dict:
        """Get automation status"""
        return {
            "type": "status",
            "connected": self.browser is not None,
            "session_active": self.session_active,
            "timestamp": datetime.now().isoformat()
        }
    
    async def cleanup(self):
        """Cleanup browser resources"""
        if self.page:
            await self.page.close()
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()

# Web server handlers
automation = SchulnetzAutomation()

async def handle_status(request):
    """Handle status endpoint"""
    status = await automation.get_status()
    return web.json_response(status)

async def handle_setup(request):
    """Handle setup endpoint for configuring school"""
    try:
        data = await request.json()
        schulnetz_url = data.get('schulnetz_url', '')
        
        if not schulnetz_url:
            return web.json_response({
                "success": False,
                "error": "Schulnetz URL required"
            })
        
        result = automation.setup_school_configuration(schulnetz_url)
        return web.json_response(result)
        
    except Exception as e:
        return web.json_response({
            "success": False,
            "error": str(e)
        })

async def handle_config(request):
    """Handle getting current configuration"""
    return web.json_response({
        "school_identifier": automation.school_identifier,
        "configured": bool(automation.school_identifier),
        "session_active": automation.session_active
    })

async def handle_login(request):
    """Handle login endpoint"""
    try:
        data = await request.json()
        username = data.get('username', '')
        password = data.get('password', '')
        
        if not username or not password:
            return web.json_response({
                "type": "login",
                "success": False,
                "error": "Username and password required"
            })
        
        result = await automation.login_to_schulnetz(username, password)
        return web.json_response(result)
        
    except Exception as e:
        return web.json_response({
            "type": "login",
            "success": False,
            "error": str(e)
        })

async def handle_grades(request):
    """Handle grades endpoint"""
    result = await automation.fetch_grades()
    return web.json_response(result)

async def handle_calendar(request):
    """Handle calendar endpoint"""
    result = await automation.fetch_calendar()
    return web.json_response(result)

async def handle_assignments(request):
    """Handle assignments endpoint"""
    result = await automation.fetch_assignments()
    return web.json_response(result)

async def init_app():
    """Initialize web application"""
    app = web.Application()
    
    # Add CORS headers
    async def add_cors_headers(request, handler):
        response = await handler(request)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    app.middlewares.append(add_cors_headers)
    
    # Routes
    app.router.add_get('/api/status', handle_status)
    app.router.add_get('/api/config', handle_config)
    app.router.add_post('/api/setup', handle_setup)
    app.router.add_post('/api/login', handle_login)
    app.router.add_get('/api/grades', handle_grades)
    app.router.add_get('/api/calendar', handle_calendar)
    app.router.add_get('/api/assignments', handle_assignments)
    
    return app

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Schulnetz Browser Automation')
    parser.add_argument('--port', type=int, default=8765, help='Server port')
    parser.add_argument('--username', type=str, help='Schulnetz username')
    parser.add_argument('--password', type=str, help='Schulnetz password')
    parser.add_argument('--setup-url', type=str, help='Schulnetz URL for initial setup')
    
    args = parser.parse_args()
    
    # Initialize automation
    global automation
    automation = SchulnetzAutomation(args.port)
    
    # Load existing configuration
    automation.load_config()
    
    # Check if setup is needed
    if not automation.school_identifier:
        if args.setup_url:
            logger.info("Setting up school configuration from command line...")
            result = automation.setup_school_configuration(args.setup_url)
            if result['success']:
                logger.info(f"Setup successful: {result['message']}")
            else:
                logger.error(f"Setup failed: {result['error']}")
                return
        else:
            logger.warning("=" * 60)
            logger.warning("FIRST TIME SETUP REQUIRED")
            logger.warning("=" * 60)
            logger.warning("Please provide your Schulnetz URL to configure the automation.")
            logger.warning("Example: https://www.schul-netz.com/ausserschwyz/loginto.php?pageid=1&mode=0&lang=")
            logger.warning("")
            logger.warning("You can:")
            logger.warning("1. Restart with --setup-url <your_schulnetz_url>")
            logger.warning("2. Use the web API: POST /api/setup with {'schulnetz_url': 'your_url'}")
            logger.warning("3. The server will start anyway and wait for configuration via API")
            logger.warning("=" * 60)
    
    # Start browser
    if not await automation.start_browser():
        logger.error("Failed to start browser")
        return
    
    # Auto-login if credentials provided and school is configured
    if args.username and args.password and automation.school_identifier:
        logger.info("Auto-logging in...")
        result = await automation.login_to_schulnetz(args.username, args.password)
        if result.get('success'):
            logger.info("Auto-login successful")
            logger.info(f"School: {automation.school_identifier}")
            logger.info(f"Page IDs discovered: {automation.page_ids}")
        else:
            logger.warning(f"Auto-login failed: {result.get('error')}")
    elif args.username and args.password:
        logger.warning("Credentials provided but school not configured. Please set up school first.")
    
    # Start web server
    app = await init_app()
    runner = web.AppRunner(app)
    await runner.setup()
    
    site = web.TCPSite(runner, 'localhost', args.port)
    await site.start()
    
    logger.info(f"Schulnetz automation server started on port {args.port}")
    logger.info("Available endpoints:")
    logger.info("  GET  /api/status       - Server status")
    logger.info("  GET  /api/config       - Current configuration")
    logger.info("  POST /api/setup        - Setup school configuration")
    logger.info("  POST /api/login        - Login to Schulnetz")
    logger.info("  GET  /api/grades       - Fetch grades")
    logger.info("  GET  /api/calendar     - Fetch calendar/exams")
    logger.info("  GET  /api/assignments  - Fetch assignments")
    
    try:
        # Keep server running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        await automation.cleanup()
        await runner.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
