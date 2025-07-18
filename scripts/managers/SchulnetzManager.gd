# SchulnetzManager - Direct Schulnetz connection (no Python required!)
extends Node

signal login_success(session_data: Dictionary)
signal login_failed(error: String)
signal data_received(data_type: String, data: Dictionary)
signal setup_required()
signal auto_login_started()
signal auto_login_completed(success: bool)

var http_client: HTTPRequest
var session_cookies: Dictionary = {}
var is_connected: bool = false
var session_active: bool = false
var current_request_type: String = ""

var username: String = ""
var password: String = ""
var school_identifier: String = ""  # e.g., "ausserschwyz"
var page_ids: Dictionary = {}
var config_file_path: String = "user://schulnetz_config.json"
@export var language: String = "de"  # Default UI language parameter

var base_url: String = ""

func _ready() -> void:
	setup_http_client()
	ensure_data_directory()
	load_config()

func ensure_data_directory() -> void:
	# Create data directory if it doesn't exist
	if not DirAccess.dir_exists_absolute("user://data"):
		var dir = DirAccess.open("user://")
		if dir:
			dir.make_dir("data")
			print("📁 Created data directory")
		else:
			print("❌ Failed to create data directory")

func setup_http_client() -> void:
	http_client = HTTPRequest.new()
	add_child(http_client)
	http_client.request_completed.connect(_on_http_response)
	http_client.use_threads = true
	http_client.timeout = 30.0

func load_config() -> void:
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
					# Try to load and auto-login with saved credentials
					auto_login_if_credentials_exist()
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

func auto_login_if_credentials_exist() -> void:
	var credentials_path = "user://data/credentials.json"
	if FileAccess.file_exists(credentials_path):
		var file = FileAccess.open(credentials_path, FileAccess.READ)
		if file:
			var json_text = file.get_as_text()
			file.close()
			var json = JSON.new()
			var parse_result = json.parse(json_text)
			if parse_result == OK:
				var credentials = json.data
				var saved_username = credentials.get("username", "")
				var saved_password = credentials.get("password", "")
				if saved_username != "" and saved_password != "":
					print("🔑 Found saved credentials, attempting auto-login...")
					auto_login_started.emit()
					login_to_schulnetz(saved_username, saved_password)
					return
				else:
					print("📝 Credentials file exists but username/password are empty")
			else:
				print("❌ Failed to parse credentials file")
		else:
			print("❌ Failed to open credentials file")
	
	# No valid credentials found, trigger setup
	print("📂 No saved credentials found - setup required")
	setup_required.emit()

func save_config() -> void:
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
	var regex = RegEx.new()
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

func login_to_schulnetz(user: String, pw: String) -> void:
	if school_identifier == "":
		setup_required.emit()
		return

	username = user
	password = pw

	clear_session_data()

	var login_url = base_url + "loginto.php?pageid=1&mode=0&lang=" + language
	print("Logging in to: ", login_url)

	var headers = [
		"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
		"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"Accept-Language: en-US,en;q=0.5"
	]

	current_request_type = "login_page"
	http_client.request(login_url, headers, HTTPClient.METHOD_GET)

func clear_session_data() -> void:
	session_cookies.clear()
	page_ids.clear()
	session_active = false
	print("Cleared session data")

func extract_cookies_from_headers(headers: PackedStringArray) -> void:
	print("=== EXTRACTING COOKIES ===")
	for header in headers:
		if header.to_lower().begins_with("set-cookie:"):
			var cookie_data = header.substr(header.find(":") + 1).strip_edges()
			var parts = cookie_data.split(";")[0].split("=")
			if parts.size() >= 2:
				session_cookies[parts[0]] = parts[1]
				print("🍪 Stored cookie: ", parts[0], " = ", parts[1])
			else:
				print("⚠️ Invalid cookie format: ", cookie_data)
		else:
			print("📄 Other header: ", header)
	
	print("📊 Total cookies stored: ", session_cookies.size())
	print("🗂️ All cookies: ", session_cookies)
	print("=== END COOKIE EXTRACTION ===")

func build_cookie_header() -> String:
	var cookie_parts = []
	for name in session_cookies.keys():
		cookie_parts.append("%s=%s" % [name, session_cookies[name]])
	
	# Add layout and menu settings as in the real browser request
	cookie_parts.append("layout-size=md")
	cookie_parts.append("menuHidden=0")
	
	var cookie_header = "Cookie: " + "; ".join(cookie_parts)
	print("🔗 Built cookie header: ", cookie_header)
	return cookie_header

func submit_login_credentials(login_page_html: String) -> void:
	var form_data = "login=" + username.uri_encode() + "&passwort=" + password.uri_encode()
	var headers = [
		"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
		"Content-Type: application/x-www-form-urlencoded",
		"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"Referer: " + base_url + "loginto.php?pageid=1&mode=0&lang=" + language
	]
	if session_cookies.size() > 0:
		headers.append(build_cookie_header())
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

func _on_http_response(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	var response_text = body.get_string_from_utf8()
	print("HTTP Response: ", response_code, " - Length: ", response_text.length(), " - Type: ", current_request_type)
	print("Raw Response Body: ", response_text)
	if response_code == 200:
		extract_cookies_from_headers(headers)
		match current_request_type:
			"login_page":
				submit_login_credentials(response_text)
			"login_submit":
				if "index.php" in response_text or response_text.find("pageid=") != -1:
					discover_page_ids(response_text)
					session_active = true
					var session_data = {
						"user": username,
						"school": school_identifier,
						"login_time": Time.get_datetime_string_from_system(),
						"page_ids": page_ids
					}
					print("✅ Login successful!")
					login_success.emit(session_data)
					auto_login_completed.emit(true)
				else:
					print("❌ Login failed - invalid credentials")
					login_failed.emit("Invalid credentials or login error")
					auto_login_completed.emit(false)
			"grades":
				parse_grades_data(response_text)
			"calendar":
				parse_calendar_data(response_text)
			"scheduler_api":
				parse_scheduler_response(response_text)
	else:
		print("HTTP Error: ", response_code)
		if response_code == 401 or response_code == 403:
			print("❌ Login failed - invalid credentials (HTTP ", response_code, ")")
			login_failed.emit("Invalid credentials")
			auto_login_completed.emit(false)
		else:
			print("❌ Login failed - connection error (HTTP ", response_code, ")")
			login_failed.emit("Connection error: " + str(response_code))
			auto_login_completed.emit(false)

func discover_page_ids(html_content: String) -> void:
	var regex = RegEx.new()
	regex.compile("pageid=(\\d+)")
	var results = regex.search_all(html_content)
	for result in results:
		var page_id = result.get_string(1)
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
	var url_regex = RegEx.new()
	url_regex.compile("index\\.php\\?pageid=(\\d+)")
	var url_result = url_regex.search(html_content)
	if url_result:
		page_ids["main"] = url_result.get_string(1)
		print("Current main page ID: ", url_result.get_string(1))

func fetch_grades() -> void:
	if not session_active:
		login_failed.emit("No active session")
		return
	var headers = [
		"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
		"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
	]
	if session_cookies.size() > 0:
		headers.append(build_cookie_header())
	var grades_page_id = page_ids.get("grades", "21311")
	var grades_url = base_url + "index.php?pageid=" + grades_page_id
	print("Fetching grades from: ", grades_url)
	current_request_type = "grades"
	http_client.request(grades_url, headers, HTTPClient.METHOD_GET)

func fetch_calendar() -> void:
	if not session_active:
		login_failed.emit("No active session")
		return
	
	# Get current date and calculate one year from now for comprehensive exam coverage
	var current_time = Time.get_datetime_dict_from_system()
	var current_date = "%04d-%02d-%02d" % [current_time.year, current_time.month, current_time.day]
	var future_time = Time.get_datetime_dict_from_system()
	future_time.year += 1  # One year from now to catch all future exams
	var max_date = "%04d-%02d-%02d" % [future_time.year, future_time.month, future_time.day]
	
	var scheduler_url = base_url + "scheduler_processor.php"
	scheduler_url += "?view=week&curr_date=" + current_date
	scheduler_url += "&min_date=" + current_date
	scheduler_url += "&max_date=" + max_date  # Extended range to one year
	scheduler_url += "&ansicht=klassenuebersicht&showOnlyThisClass=-2"
	scheduler_url += "&id=4a6f04eda5b1e943&transid=6289a9&pageid=21312&timeshift=-330"
	
	var headers = [
		"Accept: */*",
		"Accept-Encoding: gzip, deflate, br, zstd", 
		"Accept-Language: en-GB,en;q=0.8",
		"Connection: keep-alive",
		"Sec-Fetch-Dest: empty",
		"Sec-Fetch-Mode: cors", 
		"Sec-Fetch-Site: same-origin",
		"Sec-GPC: 1",
		"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
		"X-Requested-With: XMLHttpRequest",
		"sec-ch-ua: \"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Brave\";v=\"138\"",
		"sec-ch-ua-mobile: ?0",
		"sec-ch-ua-platform: \"Windows\""
	]
	
	if session_cookies.size() > 0:
		headers.append(build_cookie_header())
	
	print("📅 Fetching calendar data from %s to %s (1 year range)" % [current_date, max_date])
	print("🌐 Scheduler URL: ", scheduler_url)
	current_request_type = "scheduler_api"
	http_client.request(scheduler_url, headers, HTTPClient.METHOD_GET)

func parse_grades_data(html_content: String) -> void:
	var grades = []
	var regex = RegEx.new()
	regex.compile("<tr[^>]*>.*?</tr>")
	var row_results = regex.search_all(html_content)
	for row_result in row_results:
		var row_html = row_result.get_string()
		var cell_regex = RegEx.new()
		cell_regex.compile("<td[^>]*>(.*?)</td>")
		var cell_results = cell_regex.search_all(row_html)
		if cell_results.size() >= 2:
			var cells = []
			for cell_result in cell_results:
				var cell_text = cell_result.get_string(1)
				var clean_regex = RegEx.new()
				clean_regex.compile("<[^>]+>")
				cell_text = clean_regex.sub(cell_text, "", true)
				cells.append(cell_text.strip_edges())
			var grade_value = null
			var subject = ""
			var date = ""
			var theme = ""
			for i in range(cells.size()):
				var cell = cells[i]
				if cell.is_valid_float():
					var grade_float = cell.to_float()
					if grade_float >= 1.0 and grade_float <= 6.0:
						grade_value = grade_float
						if i > 0:
							subject = cells[i-1]
						if i + 1 < cells.size():
							theme = cells[i+1]
						break
				# Use regex for dates, not .match
				var date_regex = RegEx.new()
				date_regex.compile("\\d{2}\\.\\d{2}\\.\\d{4}")
				if date_regex.search(cell) and cell.length() <= 10:
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

func parse_calendar_data(html_content: String) -> void:
	var events = []
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

func save_scheduler_data_to_files(response_text: String) -> void:
	var timestamp = Time.get_datetime_string_from_system().replace(":", "-").replace(" ", "_")
	var filename = "scheduler_data_%s.html" % timestamp
	
	# Create data directories if they don't exist
	if not DirAccess.dir_exists_absolute("user://data"):
		DirAccess.open("user://").make_dir("data")
	
	var external_path = "C:/Users/minos/Documents/gradedata"
	if not DirAccess.dir_exists_absolute(external_path):
		DirAccess.open("C:/Users/minos/Documents").make_dir("gradedata")
	
	# Save to internal app data folder
	var internal_file_path = "user://data/" + filename
	var internal_file = FileAccess.open(internal_file_path, FileAccess.WRITE)
	if internal_file:
		internal_file.store_string(response_text)
		internal_file.close()
		print("💾 Scheduler data saved to internal storage: %s" % internal_file_path)
	else:
		print("❌ Failed to save scheduler data to internal storage")
	
	# Save to external backup location
	var external_file_path = external_path + "/" + filename
	var external_file = FileAccess.open(external_file_path, FileAccess.WRITE)
	if external_file:
		external_file.store_string(response_text)
		external_file.close()
		print("💾 Scheduler data backed up to: %s" % external_file_path)
	else:
		print("❌ Failed to save scheduler data to external backup location")
	
	# Also save a "latest" copy for easy access
	var latest_internal = FileAccess.open("user://data/scheduler_latest.html", FileAccess.WRITE)
	if latest_internal:
		latest_internal.store_string(response_text)
		latest_internal.close()
	
	var latest_external = FileAccess.open(external_path + "/scheduler_latest.html", FileAccess.WRITE)
	if latest_external:
		latest_external.store_string(response_text)
		latest_external.close()
	
	print("📊 Total response size: %d characters (%d KB)" % [response_text.length(), response_text.length() / 1024])
	
	# Create metadata summary
	create_data_summary(filename, response_text.length())

func create_data_summary(filename: String, data_size: int) -> void:
	var current_time = Time.get_datetime_dict_from_system()
	var date_range_start = "%04d-%02d-%02d" % [current_time.year, current_time.month, current_time.day]
	var future_time = current_time.duplicate()
	future_time.year += 1
	var date_range_end = "%04d-%02d-%02d" % [future_time.year, future_time.month, future_time.day]
	
	var summary = {
		"fetch_timestamp": Time.get_datetime_string_from_system(),
		"filename": filename,
		"data_size_bytes": data_size,
		"data_size_kb": data_size / 1024,
		"date_range_start": date_range_start,
		"date_range_end": date_range_end,
		"school_url": base_url,
		"request_type": "scheduler_processor.php",
		"coverage_months": 12,
		"purpose": "Future exam and event data extraction"
	}
	
	# Save summary to both locations
	var summary_json = JSON.stringify(summary, "\t")
	
	var internal_summary = FileAccess.open("user://data/scheduler_summary.json", FileAccess.WRITE)
	if internal_summary:
		internal_summary.store_string(summary_json)
		internal_summary.close()
	
	var external_summary = FileAccess.open("C:/Users/minos/Documents/gradedata/scheduler_summary.json", FileAccess.WRITE)
	if external_summary:
		external_summary.store_string(summary_json)
		external_summary.close()
	
	print("📋 Data summary created with 12-month coverage (%s to %s)" % [date_range_start, date_range_end])

func parse_scheduler_response(response_text: String) -> void:
	print("🗓️ Parsing scheduler response (%d characters)" % response_text.length())
	
	# Save raw data to both locations for backup and analysis
	save_scheduler_data_to_files(response_text)
	
	var events = []
	
	# Look for exam/event patterns in the HTML
	var exam_patterns = [
		# Look for exam entries with various patterns
		r'(?i)prüfung|exam|test|klausur|schularbeit',
		r'(?i)<div[^>]*class="[^"]*event[^"]*"[^>]*>',
		r'(?i)<td[^>]*class="[^"]*exam[^"]*"[^>]*>',
		# Look for time slots with content
		r'(?i)<div[^>]*class="[^"]*time[^"]*"[^>]*>.*?<\/div>',
		# Look for subject abbreviations
		r'(?i)\b(MATHE?|DEUTSCH|ENGLISCH|PHYSIK|CHEMIE|BIOLOGIE|GESCHICHTE|GEOGRAFIE|INFORMATIK|RELIGION|SPORT|KUNST|MUSIK)\b'
	]
	
	# Parse HTML structure for events
	var lines = response_text.split("\n")
	var current_event = {}
	var in_event_block = false
	
	for i in range(lines.size()):
		var line = lines[i].strip_edges()
		
		# Look for time information (HH:MM format)
		var time_regex = RegEx.new()
		time_regex.compile(r'(\d{1,2}):(\d{2})')
		var time_match = time_regex.search(line)
		
		# Look for date information
		var date_regex = RegEx.new()
		date_regex.compile(r'(\d{1,2})\.(\d{1,2})\.(\d{4})')
		var date_match = date_regex.search(line)
		
		# Look for subject/exam content
		var subject_regex = RegEx.new()
		subject_regex.compile(r'(?i)(MATHE?|DEUTSCH|ENGLISCH|PHYSIK|CHEMIE|BIOLOGIE|GESCHICHTE|GEOGRAFIE|INFORMATIK|RELIGION|SPORT|KUNST|MUSIK)')
		var subject_match = subject_regex.search(line)
		
		# Look for exam keywords
		var exam_regex = RegEx.new()
		exam_regex.compile(r'(?i)(prüfung|exam|test|klausur|schularbeit|quiz|probe)')
		var exam_match = exam_regex.search(line)
		
		# Check for div/td tags that might contain events
		if line.contains('<div') or line.contains('<td'):
			if subject_match or exam_match or time_match:
				if not current_event.is_empty():
					# Finalize previous event
					if current_event.has("title") and current_event.has("date"):
						events.append(current_event.duplicate())
				
				# Start new event
				current_event = {
					"title": "",
					"date": "",
					"time": "",
					"subject": "",
					"type": "event",
					"description": "",
					"room": "",
					"teacher": ""
				}
				in_event_block = true
		
		# Extract information when in an event block
		if in_event_block:
			if time_match:
				current_event["time"] = time_match.get_string()
			
			if date_match:
				current_event["date"] = date_match.get_string()
			
			if subject_match:
				current_event["subject"] = subject_match.get_string()
				if current_event["title"].is_empty():
					current_event["title"] = subject_match.get_string()
			
			if exam_match:
				var exam_type = exam_match.get_string()
				current_event["type"] = "exam"
				if current_event["title"].is_empty():
					current_event["title"] = exam_type
				else:
					current_event["title"] = current_event["subject"] + " " + exam_type
			
			# Look for room information (pattern like "R123" or "Raum 456")
			var room_regex = RegEx.new()
			room_regex.compile(r'(?i)(R\d+|Raum\s*\d+|Zimmer\s*\d+)')
			var room_match = room_regex.search(line)
			if room_match:
				current_event["room"] = room_match.get_string()
			
			# Look for teacher information (usually 2-4 uppercase letters)
			var teacher_regex = RegEx.new()
			teacher_regex.compile(r'\b[A-Z]{2,4}\b')
			var teacher_match = teacher_regex.search(line)
			if teacher_match and not subject_match: # Avoid matching subject abbreviations
				current_event["teacher"] = teacher_match.get_string()
		
		# Check if we're leaving an event block
		if in_event_block and (line.contains('</div>') or line.contains('</td>')):
			in_event_block = false
			if not current_event.is_empty() and current_event.has("title") and not current_event["title"].is_empty():
				events.append(current_event.duplicate())
			current_event = {}
	
	# Finalize last event if any
	if not current_event.is_empty() and current_event.has("title") and not current_event["title"].is_empty():
		events.append(current_event)
	
	# If no specific events found, create sample events or parse more liberally
	if events.is_empty():
		print("⚠️ No specific events found, creating sample data from response content")
		
		# Look for any time patterns and create basic events
		var time_regex = RegEx.new()
		time_regex.compile(r'(\d{1,2}):(\d{2})')
		var time_matches = time_regex.search_all(response_text)
		
		for match in time_matches.slice(0, 5): # Limit to first 5 time slots
			events.append({
				"title": "📚 Schulnetz Event",
				"date": Time.get_date_string_from_system(),
				"time": match.get_string(),
				"subject": "Unknown",
				"type": "event",
				"description": "Event found in scheduler data",
				"room": "",
				"teacher": ""
			})
		
		# If still no events, create a default info event
		if events.is_empty():
			events.append({
				"title": "📋 Scheduler Data Available",
				"date": Time.get_date_string_from_system(),
				"time": Time.get_time_string_from_system().substr(0, 5),
				"subject": "System",
				"type": "info",
				"description": "Raw scheduler data received (%d characters). Data parsing needs refinement." % response_text.length(),
				"room": "",
				"teacher": ""
			})
	
	print("📅 Parsed %d events from scheduler response" % events.size())
	for event in events:
		print("  - %s: %s at %s" % [event.get("type", "event"), event.get("title", "No title"), event.get("time", "No time")])
	
	var result_data = {
		"type": "calendar",
		"success": true,
		"events": events,
		"count": events.size(),
		"raw_response_length": response_text.length()
	}
	data_received.emit("calendar", result_data)
