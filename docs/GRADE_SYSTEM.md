# Swiss Grade System - Documentation

## 📊 Grade Scale (6-Point System)

### Grade Values
- **6.0**: Excellent (Sehr gut)
- **5.5**: Very Good (Gut+)
- **5.0**: Good (Gut)
- **4.5**: Satisfactory+ (Genügend+)
- **4.0**: Sufficient/Passing (Genügend)
- **3.5**: Insufficient (Ungenügend)
- **3.0**: Poor (Schwach)
- **2.5**: Very Poor (Sehr schwach)
- **2.0**: Bad (Schlecht)
- **1.5**: Very Bad (Sehr schlecht)
- **1.0**: Terrible (Katastrophal)

## 🎮 RPG Point System

### Point Conversion 
```javascript
function calculate_grade_points(grade) {
    var rounded_grade = round(grade * 2) / 2.0
    
    if rounded_grade >= 6.0: return 2.0      // Excellent
    elif rounded_grade == 5.5: return 1.5   // Very Good
    elif rounded_grade == 5.0: return 1.0   // Good
    elif rounded_grade == 4.5: return 0.5   // Satisfactory+
    elif rounded_grade == 4.0: return 0.0   // Sufficient (neutral)
    elif rounded_grade == 3.5: return -1.0  // Insufficient
    elif rounded_grade == 3.0: return -2.0  // Poor
    elif rounded_grade == 2.5: return -3.0  // Very Poor
    elif rounded_grade == 2.0: return -4.0  // Bad
    elif rounded_grade == 1.5: return -6.0  // Very Bad
    else: return -8.0                        // Terrible
}
```

## 🎯 RPG Mechanics

### HP System
- **Starting HP**: 100
- **Grade Impact**: 
  - Good grades (4.0+) = Heal HP
  - Bad grades (3.5-) = Lose HP
  - Points directly affect HP change

### XP System
- **XP Gain**: Based on positive grade points
- **Level Up**: Every 1000 XP
- **Bonuses**: Higher levels provide grade bonuses

### Status Effects
- **Excellent Streak**: Damage bonus in boss battles
- **Failing**: Reduced XP gain
- **Burnout**: Low HP affects performance

## 📚 Subject Categories

### Naturwissenschaften (Sciences)
- Mathematik, Physik, Chemie, Biologie, Informatik

### Sprache (Languages)  
- Deutsch, Englisch, Französisch, Spanisch, Latein

### Gesellschaft (Social Studies)
- Geschichte, Geografie, Wirtschaft und Recht

### Kunst (Arts)
- Bildnerisches Gestalten, Musik, Theater

### Sport (Physical Education)
- Sport, Leichtathletik, Schwimmen

### Wahlfächer (Electives)
- Projektarbeit, Ergänzungsfach, Schach

## 🏆 Boss Battle System

### Subject Bosses
- **Math Monster**: Weak to logic, strong against panic
- **History Hydra**: Multiple heads (different eras)
- **English Elemental**: Grammar spells and vocabulary attacks
- **Science Golem**: Experiment-based abilities
- **Art Phoenix**: Creative inspiration vs. technical precision

### Battle Mechanics
- **Preparation Phase**: Study time = battle buffs
- **Grade Input**: Real exam grade determines damage dealt
- **Victory Rewards**: XP, achievements, cosmetic unlocks
- **Defeat Consequences**: HP loss, status debuffs

## 🎲 Calculation Examples

### Weighted Average
```
Subject: Mathematik
Grades: [4.0, 3.5, 5.0]
Weights: [2.0, 1.0, 2.0]

Calculation: (4.0*2 + 3.5*1 + 5.0*2) / (2+1+2) = 21.5/5 = 4.3

Points: 0 + (-1) + 1 = 0 total points
Effect: Neutral (slight HP loss from 3.5, balanced by 5.0)
```

### Semester Progress
```
Overall Average: 4.8/6.0
Total Points: +12.5
HP: 85/100 (good overall performance)
Level: 3 (1250/2000 XP)
Next Boss: Mathematics (in 3 days)
```
