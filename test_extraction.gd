extends Node

# Test script for verifying the SchulnetzManager functionality

func _ready():
	print("🧪 Testing SchulnetzManager Grade Processing...")
	
	# Test the JavaScript extraction code generation
	if SchulnetzManager:
		print("✅ SchulnetzManager is available")
		
		# Test getting the JavaScript code
		var js_code = SchulnetzManager.get_javascript_extraction_code()
		print("✅ JavaScript code generated (%d characters)" % js_code.length())
		
		# Test manual extraction guide
		print("📋 Generating manual extraction guide...")
		SchulnetzManager.show_manual_extraction_guide()
		
		# Test JSON parsing with sample data
		test_json_parsing()
		
	else:
		print("❌ SchulnetzManager not available")

func test_json_parsing():
	print("🔍 Testing JSON parsing with sample data...")
	
	var sample_data = {
		"timestamp": "2025-07-18T15:30:00.000Z",
		"student": {
			"name": "Test Student",
			"class": "M2a"
		},
		"subjects": [
			{
				"code": "MA-M2a-BuA",
				"name": "Mathematik",
				"grade": "5.5",
				"confirmed": "Ja"
			},
			{
				"code": "DE-M2a-MaN", 
				"name": "Deutsch",
				"grade": "4.0",
				"confirmed": "Ja"
			},
			{
				"code": "SP-M2a-WeS",
				"name": "Sport",
				"grade": "-",
				"confirmed": "-"
			}
		]
	}
	
	# Test the parsing function
	SchulnetzManager.parse_grades_data_from_json(sample_data)
	print("✅ Sample data parsing completed")
