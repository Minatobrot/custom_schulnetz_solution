# GameManager - Central game state controller
extends Node

# Singleton pattern - this script should be set as AutoLoad in Project Settings

signal grade_updated(subject: String, new_grade: float)
signal level_up(new_level: int)
signal achievement_unlocked(achievement_id: String)

# Player stats
var player_hp: float = 100.0
var player_max_hp: float = 100.0
var player_xp: float = 0.0
var player_level: int = 1
var xp_to_next_level: float = 1000.0

# Grade data
var subjects_data: Dictionary = {}
var overall_average: float = 0.0
var total_grade_points: float = 0.0

# Game state
var current_semester: String = "HS24"  # Herbstsemester 2024
var days_until_next_exam: int = 7
var next_exam_subject: String = "Mathematik"

func _ready():
	# Initialize game data
	load_player_data()
	calculate_overall_stats()

# Swiss grade point calculation (from your extension)
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

# Update player HP based on grade performance
func update_hp_from_grade(grade: float):
	var points = calculate_grade_points(grade)
	var hp_change = points * 5  # Scale factor for HP impact
	
	player_hp = clamp(player_hp + hp_change, 0, player_max_hp)
	
	if hp_change > 0:
		print("Grade boost! HP increased by ", hp_change)
	elif hp_change < 0:
		print("Grade damage! HP decreased by ", abs(hp_change))

# Add XP and check for level up
func add_xp(amount: float):
	player_xp += amount
	
	while player_xp >= xp_to_next_level:
		handle_level_up()

func handle_level_up():
	player_level += 1
	player_xp -= xp_to_next_level
	player_max_hp += 10  # Increase max HP on level up
	player_hp = player_max_hp  # Full heal on level up
	xp_to_next_level *= 1.2  # Increase XP requirement
	
	level_up.emit(player_level)
	print("Level up! Now level ", player_level)

# Calculate weighted average for all subjects
func calculate_overall_stats():
	# Implementation similar to your extension's calculation
	pass

# Save/load functions
func save_player_data():
	var save_data = {
		"hp": player_hp,
		"xp": player_xp,
		"level": player_level,
		"subjects": subjects_data
	}
	# Save to file or user data
	pass

func load_player_data():
	# Load from file or initialize defaults
	pass
