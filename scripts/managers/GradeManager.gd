# GradeManager - Handles grade calculations and data
extends Node

# Subject categories (from your extension)
const SUBJECT_CATEGORIES = {
	"naturwissenschaften": ["Mathematik", "Physik", "Chemie", "Biologie", "Informatik"],
	"sprache": ["Deutsch", "Englisch", "Französisch", "Spanisch", "Latein"],
	"gesellschaft": ["Geschichte", "Geografie", "Wirtschaft und Recht", "Politik"],
	"kunst": ["Bildnerisches Gestalten", "Musik", "Theater", "Kunst"],
	"sport": ["Sport", "Leichtathletik", "Schwimmen"],
	"wahlfaecher": ["Projektarbeit", "Ergänzungsfach", "Schach"]
}

# Grade data structure
var grade_data: Array = []

func add_grade(subject: String, grade: float, weight: float = 1.0, date: String = "", theme: String = ""):
	var grade_entry = {
		"subject": subject,
		"grade": grade,
		"weight": weight,
		"date": date,
		"theme": theme,
		"points": GameManager.calculate_grade_points(grade)
	}
	
	grade_data.append(grade_entry)
	GameManager.grade_updated.emit(subject, grade)
	GameManager.update_hp_from_grade(grade)
	
	# Award XP for positive grades
	if grade >= 4.0:
		var xp_reward = (grade - 4.0) * 100 * weight
		GameManager.add_xp(xp_reward)

func calculate_subject_average(subject: String) -> float:
	var subject_grades = []
	var subject_weights = []
	
	for entry in grade_data:
		if entry.subject == subject:
			subject_grades.append(entry.grade)
			subject_weights.append(entry.weight)
	
	return calculate_weighted_average(subject_grades, subject_weights)

func calculate_weighted_average(grades: Array, weights: Array) -> float:
	if grades.is_empty() or weights.is_empty():
		return 0.0
	
	var total_weight = 0.0
	var weighted_sum = 0.0
	
	for i in range(grades.size()):
		weighted_sum += grades[i] * weights[i]
		total_weight += weights[i]
	
	return weighted_sum / total_weight if total_weight > 0 else 0.0

func get_subject_category(subject_name: String) -> String:
	for category in SUBJECT_CATEGORIES:
		for subject in SUBJECT_CATEGORIES[category]:
			if subject_name.to_lower().contains(subject.to_lower()):
				return category
	return "sonstige"

func get_subjects_by_category() -> Dictionary:
	var categorized = {}
	
	for category in SUBJECT_CATEGORIES:
		categorized[category] = []
	categorized["sonstige"] = []
	
	# Group existing grades by category
	var unique_subjects = []
	for entry in grade_data:
		if not unique_subjects.has(entry.subject):
			unique_subjects.append(entry.subject)
	
	for subject in unique_subjects:
		var category = get_subject_category(subject)
		categorized[category].append(subject)
	
	return categorized

# Import grades from browser extension format
func import_extension_data(extension_data: Array):
	grade_data.clear()
	
	for subject_data in extension_data:
		var subject = subject_data.get("fach", "Unknown")
		var grades = subject_data.get("noten", [])
		var weights = subject_data.get("gewichtungen", [])
		var dates = subject_data.get("daten", [])
		
		for i in range(grades.size()):
			var date = dates[i] if i < dates.size() else ""
			add_grade(subject, grades[i], weights[i], date)

# Export current grades to save format
func export_grade_data() -> Dictionary:
	return {
		"version": "1.0",
		"timestamp": Time.get_unix_time_from_system(),
		"grades": grade_data
	}
