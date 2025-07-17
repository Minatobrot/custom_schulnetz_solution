# 🎮 Schulnetz RPG - Project Structure

## 📁 Folder Organization

### 🎬 `/scenes/`
Scene files (.tscn) organized by purpose

#### `/scenes/ui/`
- **main_menu.tscn** - Main dashboard and navigation
- **grades_scene.tscn** - Grade management and calculation (Swiss 6-point system)
- **calendar_scene.tscn** - Exam scheduler and calendar view
- **achievements_scene.tscn** - Achievement system and progress tracking
- **character_scene.tscn** - Character customization and stats
- **settings_scene.tscn** - Application settings and preferences

#### `/scenes/game/`
- **game_scene.tscn** - Main RPG game mode (exam boss battles)
- *Future: boss_battle.tscn, character_creator.tscn, world_map.tscn*

### 📜 `/scripts/`
GDScript files organized by functionality

#### `/scripts/managers/`
- *Future: GameManager.gd, GradeManager.gd, AchievementManager.gd*

#### `/scripts/ui/`
- *Future: Menu controllers, UI helpers*

#### `/scripts/game/`
- *Future: Player.gd, Enemy.gd, BossBattle.gd*

#### `/scripts/data/`
- *Future: Grade calculation utilities, data persistence*

### 🎨 `/assets/`
All visual and audio assets

#### `/assets/sprites/`
- `/characters/` - Player avatars, customization sprites
- `/enemies/` - Exam boss sprites (Math Monster, History Hydra, etc.)
- `/ui/` - Icons, buttons, UI elements

#### `/assets/audio/`
- `/music/` - Background music for different scenes
- `/sfx/` - Sound effects for actions, notifications

#### `/assets/fonts/`
- Custom fonts for UI theming

### 💾 `/data/`
Data storage and configuration

#### `/data/grades/`
- Grade data files, calculation configs

#### `/data/achievements/`
- Achievement definitions and progress

#### `/data/game_state/`
- Player progress, character data

### 🎨 `/themes/`
- Godot theme resources for consistent UI styling

### 📚 `/docs/`
- Documentation and guides

### 🔧 `/Schulnetz_Notenrechner/`
- Your original browser extension (kept for reference and integration)

## 🚀 Getting Started

1. **Main Entry Point**: `scenes/ui/main_menu.tscn`
2. **Grade System**: Based on Swiss 6-point scale (your extension logic)
3. **Navigation**: All scenes are connected via the main menu sidebar
4. **Future Development**: Organized structure makes it easy to add new features

## 🎯 Development Priorities

1. **Phase 1**: UI and Grade Management ✅
2. **Phase 2**: Game mechanics (boss battles, character progression)
3. **Phase 3**: Integration with browser extension
4. **Phase 4**: Achievement system and rewards
5. **Phase 5**: Character customization and art assets

## 🔗 Integration Notes

The project is designed to eventually integrate with your existing `Schulnetz_Notenrechner` extension:
- Grade data parsing and calculation
- Achievement system
- Button function equivalents in Godot UI
- Real-time grade updates from Schulnetz website
