extends Control

var setup_scene = null
var is_auto_login_in_progress = false
var real_grades_data = []
var student_info = {}

# Swiss Grade System (6-point scale)
func calculate_grade_points(grade: float) -> float:
	var rounded_grade = round(grade * 2) / 2.0
	
	if rounded_grade >= 6.0: return 2.0
	elif rounded_grade == 5.5: return 1.5
	elif rounded_grade == 5.0: return 1.0
	elif rounded_grade == 4.5: return 0.5
	elif rounded_grade == 4.0: return 0.0
	elif rounded_grade == 3.5: return -1.0
	elif rounded_grade == 3.0: return -2.0
	elif rounded_grade == 2.5: return -3.0
	elif rounded_grade == 2.0: return -4.0
	elif rounded_grade == 1.5: return -6.0
	else: return -8.0

# Fallback sample grade data (will be replaced with real data)
var sample_grade_data = [
	{"subject": "No grades available", "full_name": "Please log in to see your grades", "category": "general", "grades": [], "weights": []},
]

func _ready():
	setup_grade_display()
	$Header/HeaderContent/BackButton.pressed.connect(_on_back_button_pressed)
	
	# Connect to SchulnetzManager signals
	if SchulnetzManager:
		SchulnetzManager.setup_required.connect(_on_setup_required)
		SchulnetzManager.auto_login_started.connect(_on_auto_login_started)
		SchulnetzManager.auto_login_completed.connect(_on_auto_login_completed)
		SchulnetzManager.login_success.connect(_on_login_success)
		SchulnetzManager.data_received.connect(_on_data_received)
	
	# Load setup scene and add it as a child
	setup_scene = preload("res://scenes/ui/setup_scene.tscn").instantiate()
	add_child(setup_scene)
	setup_scene.setup_completed.connect(_on_setup_completed)
	setup_scene.setup_cancelled.connect(_on_setup_cancelled)
	
	# Try to load existing grades data
	load_existing_grades_data()

func load_existing_grades_data():
	var data_file = FileAccess.open("user://data/latest_grades.json", FileAccess.READ)
	if data_file:
		var json_text = data_file.get_as_text()
		data_file.close()
		var json = JSON.new()
		var parse_result = json.parse(json_text)
		if parse_result == OK:
			var data = json.data
			student_info = data.get("student", {})
			process_real_grades_data(data)
			print("📊 Loaded existing grades data with ", real_grades_data.size(), " subjects")
		else:
			print("❌ Failed to parse existing grades data")
	else:
		print("📝 No existing grades data found")

func _on_data_received(data_type: String, data: Dictionary):
	if data_type == "grades":
		print("🎓 Received grades data in grades scene")
		student_info = data.get("student_info", {})
		process_real_grades_data(data.get("raw_data", {}))
		setup_grade_display()  # Refresh the display

func process_real_grades_data(raw_data: Dictionary):
	real_grades_data.clear()
	var subjects = raw_data.get("subjects", [])
	
	for subject_data in subjects:
		var subject_entry = {
			"subject": subject_data.get("code", "Unknown"),
			"full_name": subject_data.get("name", "Unknown Subject"),
			"category": determine_subject_category(subject_data.get("name", "")),
			"grades": [],
			"weights": [],
			"grade_text": subject_data.get("grade", "-"),
			"confirmed": subject_data.get("confirmed", "-")
		}
		
		# If we have a numeric grade, add it
		var grade_text = subject_data.get("grade", "").strip_edges()
		if grade_text.is_valid_float():
			var grade_value = grade_text.to_float()
			if grade_value >= 1.0 and grade_value <= 6.0:
				subject_entry.grades.append(grade_value)
				subject_entry.weights.append(1.0)
		
		real_grades_data.append(subject_entry)

func determine_subject_category(subject_name: String) -> String:
	var name_lower = subject_name.to_lower()
	
	if "mathematik" in name_lower or "math" in name_lower:
		return "naturwissenschaften"
	elif "deutsch" in name_lower or "german" in name_lower:
		return "sprache"
	elif "englisch" in name_lower or "english" in name_lower or "français" in name_lower or "french" in name_lower:
		return "sprache"
	elif "physik" in name_lower or "chemie" in name_lower or "biologie" in name_lower:
		return "naturwissenschaften"
	elif "sport" in name_lower or "physical" in name_lower:
		return "sport"
	elif "kunst" in name_lower or "gestalt" in name_lower or "art" in name_lower:
		return "kunst"
	elif "geschichte" in name_lower or "history" in name_lower or "geografie" in name_lower:
		return "gesellschaft"
	else:
		return "general"

func _on_auto_login_started():
	is_auto_login_in_progress = true
	print("🔄 Auto-login started in grades scene")

func _on_auto_login_completed(success: bool):
	is_auto_login_in_progress = false
	if success:
		print("✅ Auto-login successful in grades scene - fetching real grades...")
		# Trigger grades fetch after successful login
		if SchulnetzManager and SchulnetzManager.session_active:
			SchulnetzManager.fetch_grades()
	else:
		print("❌ Auto-login failed in grades scene")

func _on_login_success(session_data: Dictionary):
	print("✅ Login successful in grades scene - fetching real grades...")
	# Trigger grades fetch after successful login
	if SchulnetzManager:
		SchulnetzManager.fetch_grades()

func _on_setup_required():
	print("Setup required - showing setup dialog in grades scene")
	if setup_scene:
		setup_scene.show_setup()

func _on_setup_completed():
	print("Setup completed successfully in grades scene")

func _on_setup_cancelled():
	print("Setup cancelled by user in grades scene")

func calculate_weighted_average(grades: Array, weights: Array) -> float:
	var total_weight = 0.0
	var weighted_sum = 0.0
	
	for i in range(grades.size()):
		weighted_sum += grades[i] * weights[i]
		total_weight += weights[i]
	
	return weighted_sum / total_weight if total_weight > 0 else 0.0

func setup_grade_display():
	var subjects_container = $MainContainer/ScrollContainer/SubjectsContainer
	
	# Clear existing children
	for child in subjects_container.get_children():
		child.queue_free()
	
	# Update header with student info
	if student_info.has("name") and student_info.name != "Unknown":
		var header_title = $Header/HeaderContent/Title
		header_title.text = "📊 GRADES - " + student_info.name
		if student_info.has("class") and student_info.class != "Unknown":
			header_title.text += " (" + student_info.class + ")"
	
	# Use real data if available, otherwise fallback to sample data
	var data_to_display = real_grades_data if real_grades_data.size() > 0 else sample_grade_data
	
	# Add subjects
	for subject_data in data_to_display:
		var subject_card = create_subject_card(subject_data)
		subjects_container.add_child(subject_card)
	
	# Update overall statistics
	update_overall_statistics(data_to_display)

func update_overall_statistics(grade_data: Array):
	var total_grades = 0
	var total_points = 0.0
	var total_weight = 0.0
	var grade_sum = 0.0
	
	for subject in grade_data:
		if subject.grades.size() > 0:
			var avg = calculate_weighted_average(subject.grades, subject.weights)
			total_grades += subject.grades.size()
			total_points += calculate_grade_points(avg)
			grade_sum += avg
			total_weight += 1.0
	
	var overall_average = grade_sum / total_weight if total_weight > 0 else 0.0
	
	# Update UI elements
	var overall_avg_label = $MainContainer/StatsPanel/StatsContent/OverallStats/OverallAverage
	var total_points_label = $MainContainer/StatsPanel/StatsContent/OverallStats/TotalPoints
	
	if overall_average > 0:
		overall_avg_label.text = "Average: " + str(round(overall_average * 100) / 100.0) + " / 6.0"
		total_points_label.text = "Total Points: " + str(round(total_points * 10) / 10.0)
	else:
		overall_avg_label.text = "Average: Not available"
		total_points_label.text = "Total Points: Not available"

func create_subject_card(subject_data: Dictionary) -> Panel:
	var card = Panel.new()
	# Use theme from resource instead of loading from main scene
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.9, 0.95, 1, 1)
	style.corner_radius_top_left = 12
	style.corner_radius_top_right = 12
	style.corner_radius_bottom_right = 12
	style.corner_radius_bottom_left = 12
	card.add_theme_stylebox_override("panel", style)
	card.custom_minimum_size = Vector2(0, 140)
	
	var vbox = VBoxContainer.new()
	vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vbox.offset_left = 15
	vbox.offset_top = 10
	vbox.offset_right = -15
	vbox.offset_bottom = -10
	
	# Subject header
	var header = HBoxContainer.new()
	
	var subject_label = Label.new()
	subject_label.text = subject_data.full_name
	subject_label.label_settings = LabelSettings.new()
	subject_label.label_settings.font_size = 16
	subject_label.label_settings.font_color = Color(1, 1, 1, 1)
	header.add_child(subject_label)
	
	var spacer = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(spacer)
	
	# Calculate average or show grade text
	var avg_label = Label.new()
	avg_label.label_settings = LabelSettings.new()
	avg_label.label_settings.font_size = 18
	
	if subject_data.grades.size() > 0:
		var average = calculate_weighted_average(subject_data.grades, subject_data.weights)
		avg_label.text = "⌀ " + str(round(average * 100) / 100.0)
		avg_label.label_settings.font_color = Color(1, 0.8, 0.4, 1) if average >= 4.0 else Color(1, 0.4, 0.4, 1)
	else:
		# Show the grade text from Schulnetz if no numeric grades
		var grade_text = subject_data.get("grade_text", "-")
		avg_label.text = grade_text if grade_text != "" else "No grade"
		avg_label.label_settings.font_color = Color(0.7, 0.7, 0.7, 1)
	
	header.add_child(avg_label)
	vbox.add_child(header)
	
	# Subject code
	var code_label = Label.new()
	code_label.text = subject_data.subject
	code_label.label_settings = LabelSettings.new()
	code_label.label_settings.font_size = 12
	code_label.label_settings.font_color = Color(0.7, 0.8, 0.9, 1)
	vbox.add_child(code_label)
	
	# Grades display or info
	if subject_data.grades.size() > 0:
		var grades_container = HBoxContainer.new()
		for i in range(subject_data.grades.size()):
			var grade = subject_data.grades[i]
			var weight = subject_data.weights[i]
			
			var grade_badge = Panel.new()
			var grade_style = StyleBoxFlat.new()
			grade_style.bg_color = Color(0.15, 0.39, 0.61, 1) if grade >= 4.0 else Color(0.8, 0.3, 0.3, 1)
			grade_style.corner_radius_top_left = 4
			grade_style.corner_radius_top_right = 4
			grade_style.corner_radius_bottom_right = 4
			grade_style.corner_radius_bottom_left = 4
			grade_badge.add_theme_stylebox_override("panel", grade_style)
			grade_badge.custom_minimum_size = Vector2(50, 25)
			
			var grade_label = Label.new()
			grade_label.text = str(grade)
			grade_label.label_settings = LabelSettings.new()
			grade_label.label_settings.font_size = 12
			grade_label.label_settings.font_color = Color(1, 1, 1, 1)
			grade_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			grade_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
			grade_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
			
			grade_badge.add_child(grade_label)
			grades_container.add_child(grade_badge)
			
			if i < subject_data.grades.size() - 1:
				var space = Control.new()
				space.custom_minimum_size = Vector2(5, 0)
				grades_container.add_child(space)
		
		vbox.add_child(grades_container)
	else:
		# Show subject information when no grades are available
		var info_container = VBoxContainer.new()
		
		var grade_info = Label.new()
		var grade_text = subject_data.get("grade_text", "-")
		var confirmed = subject_data.get("confirmed", "-")
		grade_info.text = "Grade: " + grade_text + (" (" + confirmed + ")" if confirmed != "-" else "")
		grade_info.label_settings = LabelSettings.new()
		grade_info.label_settings.font_size = 12
		grade_info.label_settings.font_color = Color(0.6, 0.7, 0.8, 1)
		info_container.add_child(grade_info)
		
		var status_info = Label.new()
		status_info.text = "Status: " + ("Confirmed" if confirmed != "-" and confirmed.to_lower() != "no" else "Pending")
		status_info.label_settings = LabelSettings.new()
		status_info.label_settings.font_size = 11
		status_info.label_settings.font_color = Color(0.5, 0.6, 0.7, 1)
		info_container.add_child(status_info)
		
		vbox.add_child(info_container)
	
	# Points display
	var points_label = Label.new()
	if subject_data.grades.size() > 0:
		var average = calculate_weighted_average(subject_data.grades, subject_data.weights)
		var points = calculate_grade_points(average)
		points_label.text = "Points: " + str(points) + " (" + get_grade_description(average) + ")"
	else:
		points_label.text = "Category: " + subject_data.get("category", "general").capitalize()
	points_label.label_settings = LabelSettings.new()
	points_label.label_settings.font_size = 11
	points_label.label_settings.font_color = Color(0.6, 0.7, 0.8, 1)
	vbox.add_child(points_label)
	
	card.add_child(vbox)
	return card

func get_grade_description(grade: float) -> String:
	if grade >= 6.0: return "Excellent"
	elif grade >= 5.5: return "Very Good"
	elif grade >= 5.0: return "Good"
	elif grade >= 4.5: return "Satisfactory+"
	elif grade >= 4.0: return "Sufficient"
	elif grade >= 3.5: return "Insufficient"
	elif grade >= 3.0: return "Poor"
	elif grade >= 2.5: return "Very Poor"
	elif grade >= 2.0: return "Bad"
	elif grade >= 1.5: return "Very Bad"
	else: return "Terrible"

func _on_back_button_pressed():
	get_tree().change_scene_to_file("res://scenes/ui/main_menu.tscn")
