# SchulnetzManager - Direct Schulnetz connection (no Python required!)
extends Node

# Signals
signal login_success(session_data: Dictionary)
signal login_failed(error: String)
signal data_received(data_type: String, data: Dictionary)
signal setup_required()

# HTTP management
var http_client: HTTPRequest
var session_cookies: Dictionary = {}
var is_connected: bool = false
var session_active: bool = false
var current_request_type: String = ""

# User credentials and configuration
var username: String = ""
var password: String = ""
var school_identifier: String = ""  # e.g., "ausserschwyz"
var page_ids: Dictionary = {}  # Discovered page IDs
var config_file_path: String = "user://schulnetz_config.json"
@export var language: String = "de"  # Default UI language parameter (e.g., "de" or "en")

# Schulnetz URLs (will be dynamically built based on school)
var base_url: String = ""

func _ready():
	setup_http_client()
	load_config()

func setup_http_client():
	# Setup HTTP client for direct Schulnetz communication
	http_client = HTTPRequest.new()
	add_child(http_client)
	http_client.request_completed.connect(_on_http_response)
	
	# Configure for web scraping
	http_client.use_threads = true
	http_client.timeout = 30.0

func load_config():
	# Load saved school configuration
	if FileAccess.file_exists(config_file_path):
		var file = FileAccess.open(config_file_path, FileAccess.READ)
		if file:
			var json_text = file.get_as_text()
			file.close()
			
			var json = JSON.new()
			var parse_result = json.parse(json_text)
			if parse_result == OK:
				var config = json.data
				school_identifier = config.get("school_identifier", "")
				if school_identifier != "":
					base_url = "https://www.schul-netz.com/%s/" % school_identifier
					print("Loaded school configuration: ", school_identifier)
				else:
					setup_required.emit()
					print("School identifier missing in config file")
			else:
				print("Failed to parse config file: ", json_text)
				setup_required.emit()
		else:
			print("Failed to open config file")
	else:
		print("No configuration found. Setup required.")
		setup_required.emit()

func save_config():
	# Save school configuration
	var config = {
		"school_identifier": school_identifier,
		"last_updated": Time.get_datetime_string_from_system()
	}
	
	var file = FileAccess.open(config_file_path, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(config))
		file.close()
		print("Saved school configuration: ", school_identifier)

func setup_school_configuration(schulnetz_url: String) -> bool:
	# Extract and save school identifier from Schulnetz URL
	var regex = RegEx.new()
	# Match school identifier between domain and optional slash or end
	regex.compile("schul-netz\\.com/([^/]+)(?:/|$)")
	var result = regex.search(schulnetz_url)
	
	if result:
		school_identifier = result.get_string(1)
		base_url = "https://www.schul-netz.com/%s/" % school_identifier
		save_config()
		print("School configured: ", school_identifier)
		return true
	else:
		print("Could not extract school identifier from URL: ", schulnetz_url)
		return false

func login_to_schulnetz(user: String, password: String):
	# Login to Schulnetz directly via HTTP
	if school_identifier == "":
		setup_required.emit()
		return
	
	username = user
	password = password
	
	# Clear previous session
	clear_session_data()
	
	# Step 1: Get login page to establish session
	var login_url = base_url + "loginto.php?pageid=1&mode=0&lang=" + language
	print("Logging in to: ", login_url)
	
	var headers = [
		"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
		"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"Accept-Language: en-US,en;q=0.5"
	]
	
	current_request_type = "login_page"
	http_client.request(login_url, headers, HTTPClient.METHOD_GET)

func clear_session_data():
	# Clear only session data for new login; config persists
	session_cookies.clear()
	page_ids.clear()
	session_active = false
	print("Cleared session data")

func extract_cookies_from_headers(headers: PackedStringArray):
	# Extract session cookies from HTTP headers and keep in memory
	for header in headers:
		if header.to_lower().begins_with("set-cookie:"):
			var cookie_data = header.substr(header.find(":") + 1).strip_edges()
			var parts = cookie_data.split(";")[0].split("=")
			if parts.size() >= 2:
				session_cookies[parts[0]] = parts[1]
				print("Stored cookie: ", parts[0])

func build_cookie_header() -> String:
	# Build cookie header for requests from session_cookies dict
	var cookie_parts = []
	for name in session_cookies.keys():
		cookie_parts.append(name + "=" + session_cookies[name])
	return "Cookie: " + "; ".join(cookie_parts)

func submit_login_credentials(login_page_html: String):
	# Submit login credentials via POST
	var form_data = "login=" + username.uri_encode() + "&passwort=" + password.uri_encode()

	var headers = [
		"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
		"Content-Type: application/x-www-form-urlencoded",
		"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"Referer: " + base_url + "loginto.php?pageid=1&mode=0&lang=" + language
	]

	# Add cookies if we have any from initial GET
	if session_cookies.size() > 0:
		headers.append(build_cookie_header())
	
	# Parse hidden fields (e.g., loginhash)
	var hidden_field_regex = RegEx.new()
	hidden_field_regex.compile("<input[^>]*type=\"hidden\"[^>]*name=\"([^\"]+)\"[^>]*value=\"([^\"]+)\"[^>]*>")
	var hidden_fields = hidden_field_regex.search_all(login_page_html)
	for field in hidden_fields:
		var name = field.get_string(1)
		var value = field.get_string(2)
		form_data += "&" + name + "=" + value.uri_encode()
		print("Found hidden field: ", name, " = ", value)
	
	var login_submit_url = base_url + "loginto.php?pageid=1&mode=0&lang=" + language
	print("Submitting login credentials...")
	current_request_type = "login_submit"
	http_client.request(login_submit_url, headers, HTTPClient.METHOD_POST, form_data)

func _on_http_response(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray):
	# Handle HTTP responses
	var response_text = body.get_string_from_utf8()
	print("HTTP Response: ", response_code, " - Length: ", response_text.length(), " - Type: ", current_request_type)
	print("Raw Response Body: ", response_text)
	
	if response_code == 200:
		# Extract cookies from headers
		extract_cookies_from_headers(headers)
		
		# Handle different request types
		match current_request_type:
			"login_page":
				# Got login page, now submit credentials
				submit_login_credentials(response_text)
			"login_submit":
				# Check if login was successful
				if "index.php" in response_text or response_text.find("pageid=") != -1:
					# Login successful - extract page IDs
					discover_page_ids(response_text)
					session_active = true
					var session_data = {
						"user": username,
						"school": school_identifier,
						"login_time": Time.get_datetime_string_from_system(),
						"page_ids": page_ids
					}
					login_success.emit(session_data)
				else:
					# Login failed
					login_failed.emit("Invalid credentials or login error")
			"grades":
				parse_grades_data(response_text)
			"calendar":
				parse_calendar_data(response_text)
			"scheduler_api":
				parse_scheduler_response(response_text)
	else:
		print("HTTP Error: ", response_code)
		if response_code == 401 or response_code == 403:
			login_failed.emit("Invalid credentials")
		else:
			login_failed.emit("Connection error: " + str(response_code))

func discover_page_ids(html_content: String):
	# Discover page IDs from HTML content
	var regex = RegEx.new()
	regex.compile("pageid=(\\d+)")
	
	var results = regex.search_all(html_content)
	for result in results:
		var page_id = result.get_string(1)
		
		# Try to identify what kind of page this is based on surrounding text
		var start_pos = max(0, result.get_start() - 200)
		var end_pos = min(html_content.length(), result.get_end() + 200)
		var context = html_content.substr(start_pos, end_pos - start_pos).to_lower()
		
		if "note" in context or "grade" in context or "bewertung" in context:
			page_ids["grades"] = page_id
			print("Found grades page ID: ", page_id)
		elif "agenda" in context or "termin" in context or "kalender" in context:
			page_ids["agenda"] = page_id
			print("Found agenda page ID: ", page_id)
		elif "stunden" in context or "schedule" in context or "plan" in context:
			page_ids["schedule"] = page_id
			print("Found schedule page ID: ", page_id)
	
	# Also extract current page ID from URL patterns
	var url_regex = RegEx.new()
	url_regex.compile("index\\.php\\?pageid=(\\d+)")
	var url_result = url_regex.search(html_content)
	if url_result:
		page_ids["main"] = url_result.get_string(1)
		print("Current main page ID: ", url_result.get_string(1))

func fetch_grades():
	# Fetch grades from Schulnetz
	if not session_active:
		login_failed.emit("No active session")
		return
	var headers = ["User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"]
	if session_cookies.size() > 0:
		headers.append(build_cookie_header())
	var grades_page_id = page_ids.get("grades", "21311")  # Default grades page ID
	var grades_url = base_url + "index.php?pageid=" + grades_page_id
	
	print("Fetching grades from: ", grades_url)
	current_request_type = "grades"
	http_client.request(grades_url, headers, HTTPClient.METHOD_GET)

func fetch_calendar():
	# Fetch calendar data via scheduler API
	if not session_active:
		login_failed.emit("No active session")
		return
	
	# Use scheduler API for calendar data
	var current_date = Time.get_date_string_from_system()
	var scheduler_url = base_url + "scheduler_processor.php"
	scheduler_url += "?view=week&curr_date=" + current_date
	scheduler_url += "&min_date=" + current_date
	scheduler_url += "&ansicht=klassenuebersicht&showOnlyThisClass=-2"
	scheduler_url += "&id=4a6f04eda5b1e943&transid=6289a9&pageid=21312&timeshift=-330"
	
	var headers = [
		"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
		"Accept: */*",
		"X-Requested-With: XMLHttpRequest"
	]
	
	if session_cookies.size() > 0:
		headers.append(build_cookie_header())
	
	print("Fetching calendar from: ", scheduler_url)
	current_request_type = "scheduler_api"
	http_client.request(scheduler_url, headers, HTTPClient.METHOD_GET)

func parse_grades_data(html_content: String):
	# Parse grades from HTML content
	var grades = []
	
	# Look for table rows with grade data
	var regex = RegEx.new()
	regex.compile("<tr[^>]*>.*?</tr>")
	
	var row_results = regex.search_all(html_content)
	for row_result in row_results:
		var row_html = row_result.get_string()
		
		# Extract cell data from row
		var cell_regex = RegEx.new()
		cell_regex.compile("<td[^>]*>(.*?)</td>")
		var cell_results = cell_regex.search_all(row_html)
		
		if cell_results.size() >= 2:
			var cells = []
			for cell_result in cell_results:
				var cell_text = cell_result.get_string(1)
				# Remove HTML tags
				var clean_regex = RegEx.new()
				clean_regex.compile("<[^>]+>")
				cell_text = clean_regex.sub(cell_text, "", true)
				cells.append(cell_text.strip_edges())
			
			# Try to identify grade data
			var grade_value = null
			var subject = ""
			var date = ""
			var theme = ""
			
			for i in range(cells.size()):
				var cell = cells[i]
				# Look for grade pattern (number between 1-6)
				if cell.is_valid_float():
					var grade_float = cell.to_float()
					if grade_float >= 1.0 and grade_float <= 6.0:
						grade_value = grade_float
						if i > 0:
							subject = cells[i-1]
						if i + 1 < cells.size():
							theme = cells[i+1]
						break
				
				# Look for date pattern
				if cell.match("*.*.*") and cell.length() <= 10:
					date = cell
			
			if grade_value != null and subject != "":
				grades.append({
					"subject": subject,
					"grade": grade_value,
					"date": date,
					"theme": theme,
					"weight": 1.0
				})
	
	print("Parsed ", grades.size(), " grades")
	var result_data = {
		"type": "grades",
		"success": true,
		"grades": grades,
		"count": grades.size()
	}
	data_received.emit("grades", result_data)

func parse_calendar_data(html_content: String):
	# Parse calendar events from HTML
	var events = []
	
	# Look for calendar events in HTML
	# This is a basic implementation - would need to be adjusted based on actual HTML structure
	var event_patterns = [
		"exam", "test", "prüfung", "klausur",
		"assignment", "homework", "aufgabe",
		"deadline", "abgabe", "termin"
	]
	
	for pattern in event_patterns:
		var regex = RegEx.new()
		regex.compile("(?i)" + pattern + "[^<]*")
		var results = regex.search_all(html_content)
		
		for result in results:
			var title = result.get_string()
			events.append({
				"title": title,
				"date": Time.get_date_string_from_system(),
				"type": "event"
			})
	
	print("Parsed ", events.size(), " calendar events")
	var result_data = {
		"type": "calendar",
		"success": true,
		"events": events,
		"count": events.size()
	}
	data_received.emit("calendar", result_data)

func parse_scheduler_response(response_text: String):
	# Parse scheduler API response
	var events = []
	
	# The scheduler API returns raw data - parse it for events
	if response_text.length() > 50:
		# Create a general event indicating data was received
		events.append({
			"title": "Scheduler Data Available",
			"date": Time.get_date_string_from_system(),
			"description": "Raw scheduler data received (%d characters)" % response_text.length(),
			"type": "info"
		})
	
	print("Scheduler API response length: ", response_text.length())
	var result_data = {
		"type": "calendar", 
		"success": true,
		"events": events,
		"count": events.size(),
		"raw_response_length": response_text.length()
	}
	data_received.emit("calendar", result_data)
