# Schulnetz Grades Extraction - Complete Guide

## Overview
This Godot application now supports **real grades extraction** from your Schulnetz account using a JavaScript-based method. No more placeholder data!

## Quick Start (3 Simple Steps)

### Step 1: Run the App
1. Open the Schulnetz app in Godot
2. Click "📋 EXTRACT GRADES" button in the main menu
3. This will generate the JavaScript extraction code

### Step 2: Manual Grade Extraction
1. Open your web browser
2. Login to your Schulnetz account
3. Navigate to the grades page (Noten/Bewertungen)
4. Open Developer Console (F12)
5. Copy and paste the JavaScript code from the extraction script
6. Press Enter - a JSON file will download automatically

### Step 3: Import Your Grades
1. Save the downloaded JSON file as `latest_grades.json`
2. Place it in your app's data directory (shown in the app)
3. Restart the app - your real grades will appear!

## File Locations

### App Data Directory
```
Windows: C:\Users\[Username]\AppData\Roaming\Godot\app_userdata\Schulnetz App\data\
```

### Required Files
- `latest_grades.json` - Your extracted grades data
- `extraction_script.js` - Generated JavaScript code
- `INSTRUCTIONS.txt` - Detailed instructions

## JavaScript Extraction Method

The app generates a JavaScript function that:
1. Extracts student information (name, class)
2. Parses the grades table on the Schulnetz page
3. Collects subject codes, names, grades, and confirmation status
4. Downloads the data as a formatted JSON file

### Example Extracted Data
```json
{
  "timestamp": "2025-07-18T15:30:00.000Z",
  "student": {
    "name": "Max Mustermann",
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
    }
  ]
}
```

## Features

### ✅ What Works
- **Real grade extraction** from Schulnetz
- **Automatic data parsing** (student info, subjects, grades)
- **Gamified display** with RPG elements
- **Swiss grading system** support (1-6 scale)
- **Grade point calculation** for performance tracking
- **Subject categorization** (languages, sciences, arts, etc.)
- **Automatic data backup** and storage

### 🎮 Gamification Elements
- **Grade points system** (excellent grades = positive points)
- **RPG-style health/XP** based on academic performance
- **Achievement system** for grade improvements
- **Character progression** tied to academic success

### 📊 Grade Analysis
- **Weighted averages** calculation
- **Performance trends** tracking
- **Subject category grouping**
- **Grade confirmation** status tracking

## Troubleshooting

### No Grades Appearing?
1. Check if `latest_grades.json` exists in the data folder
2. Verify the JSON format matches the expected structure
3. Restart the app after placing the file
4. Check the console output for parsing errors

### JavaScript Errors?
1. Make sure you're on the correct Schulnetz grades page
2. Check that you're logged in to your account
3. Try refreshing the page before running the script
4. Ensure your browser allows downloads

### File Access Issues?
1. Check folder permissions in the app data directory
2. Run the app as administrator if needed
3. Verify the file path is correct for your system

## Technical Details

### Pure GDScript Implementation
- **No Python dependencies** required
- **Direct HTTP requests** to Schulnetz
- **Built-in JSON parsing** for data processing
- **Native file operations** for data storage

### Security & Privacy
- **Local data storage** only
- **No external servers** involved
- **Manual extraction** ensures data control
- **Encrypted credential storage** (optional)

## Advanced Usage

### Multiple Extractions
- Files are timestamped automatically
- Previous extractions are backed up
- Latest data always takes priority

### Custom Data Processing
- Modify `SchulnetzManager.gd` for custom parsing
- Add new subject categories as needed
- Adjust grade point calculations

### Integration with Other Tools
- Export data to external grade calculators
- Backup to cloud storage manually
- Share anonymized data for analysis

## Support

### Common Issues
1. **Login problems**: Use the setup wizard in the app
2. **Extraction failures**: Check browser console for errors  
3. **Data parsing issues**: Verify JSON format validity
4. **Performance problems**: Clear old extraction files

### Getting Help
- Check the console output for error messages
- Verify all file paths and permissions
- Test with the provided sample data first
- Review the generated instruction files

## Future Enhancements

### Planned Features
- **Automatic login** integration (in development)
- **Calendar/exam extraction** from scheduler
- **Enhanced analytics** and reporting
- **Multi-semester** grade tracking
- **Achievement system** expansion

### Contributing
- Improve grade parsing accuracy
- Add new gamification elements
- Enhance UI/UX design
- Optimize performance

---

**Note**: This method respects Schulnetz's terms of service by using manual, user-initiated data extraction rather than automated scraping.

**Enjoy your gamified grades experience! 🎮📚**
