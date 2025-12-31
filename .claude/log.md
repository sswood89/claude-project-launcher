# Claude Project Launcher - Activity Log

## 2025-12-31 - Feature Expansion & Bug Fixes

**Outcome:** success
**Progress:** 60% -> 85%

### Summary
Major feature expansion session adding comprehensive project management capabilities. Implemented Services tab with start/stop controls, editable notes and focus fields, progress/burndown tracking visualization, and project editing. Fixed critical Tauri 2 bug where invoke commands weren't reaching Rust backend.

### Tasks Completed
- Added Services tab with running status indicators (green pulse for running)
- Implemented Start All / Stop All batch service controls
- Made project notes editable with persistence to project.json
- Made current focus editable with inline editing UI
- Added Recent Sessions display pulling from threads.json
- Created ProgressChart component showing:
  - Progress percentage
  - Tasks completed vs created
  - Velocity metrics
  - Burndown rate indicator
  - Mini bar chart of recent sessions
- Added ProjectEditor for status and progress editing
- Added Goals section with status indicators
- Fixed Tauri 2 invoke parameter naming issue
- Added `#[tauri::command(rename_all = "camelCase")]` to Rust commands

### Key Technical Fix
Tauri 2 requires explicit `rename_all = "camelCase"` attribute on commands with parameters. Without this, JavaScript's `projectPath` parameter wasn't mapping to Rust's `project_path` parameter, causing "missing required key" errors.

### Next Steps
- Add comprehensive testing for all features
- Consider adding project creation/deletion from UI
- Add port configuration editing
- Polish UI and error handling

---

## 2025-12-30 - Initial Creation

**Outcome:** success
**Progress:** 0% -> 60%

### Summary
Created new Tauri 2 desktop app combining project tracking with launcher functionality. Implemented dark theme UI, dashboard with stats, project list, and launch buttons for browser/iOS/Android/VS Code/Terminal.

### Tasks Completed
- Scaffolded Tauri 2 + React + TypeScript project
- Implemented Rust backend for reading registry.json
- Created Dashboard with stats cards
- Built ProjectList and ProjectCard components
- Added LaunchBar with context-aware buttons
- Implemented launch commands for all platforms
- Created custom rocket icon
- Fixed VS Code and Terminal launching from GUI app

---
