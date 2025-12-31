use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use tauri::State;

// Match the registry.json schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeProject {
    pub id: String,
    pub name: String,
    pub description: String,
    pub version: String,
    pub status: String,
    pub priority: String,
    pub category: String,
    pub tags: Vec<String>,
    pub pipeline: Pipeline,
    pub goals: serde_json::Value,
    pub milestones: Vec<Milestone>,
    #[serde(rename = "currentFocus")]
    pub current_focus: Option<String>,
    pub blockers: Vec<Blocker>,
    pub notes: String,
    pub links: ProjectLinks,
    pub tech: TechStack,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pipeline {
    pub stage: String,
    pub progress: u32,
    pub phases: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Milestone {
    pub name: String,
    pub status: String,
    #[serde(default)]
    pub date: Option<String>,
    #[serde(rename = "completedAt", default)]
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Blocker {
    pub description: String,
    pub severity: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectLinks {
    pub repo: String,
    pub docs: String,
    pub deployment: String,
    pub figma: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TechStack {
    pub stack: Vec<String>,
    pub ports: Vec<u16>,
    pub dependencies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Registry {
    #[serde(rename = "$schema")]
    pub schema: Option<String>,
    pub version: String,
    #[serde(rename = "lastUpdated")]
    pub last_updated: String,
    pub projects: Vec<ClaudeProject>,
}

// Thread/Session tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Thread {
    #[serde(rename = "threadId")]
    pub thread_id: String,
    pub date: String,
    pub title: String,
    #[serde(default)]
    pub context: Option<String>,
    #[serde(default)]
    pub summary: Option<String>,
    #[serde(default)]
    pub outcome: Option<String>,
    #[serde(rename = "tasksCompleted", default)]
    pub tasks_completed: Vec<String>,
    #[serde(rename = "tasksCreated", default)]
    pub tasks_created: Vec<String>,
    #[serde(rename = "filesModified", default)]
    pub files_modified: Vec<String>,
    #[serde(rename = "updatedAt", default)]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadsFile {
    pub threads: Vec<Thread>,
}

// Service/Process tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunningService {
    pub project_id: String,
    pub pid: u32,
    pub port: u16,
    pub command: String,
    pub started_at: String,
}

pub struct AppState {
    pub running_services: Mutex<HashMap<String, RunningService>>,
}

// Project update payload
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectUpdate {
    pub notes: Option<String>,
    pub current_focus: Option<String>,
    pub status: Option<String>,
    pub progress: Option<u32>,
}

fn get_home_dir() -> PathBuf {
    directories::UserDirs::new()
        .map(|dirs| dirs.home_dir().to_path_buf())
        .unwrap_or_else(|| PathBuf::from("/Users/shaka"))
}

fn get_registry_path() -> PathBuf {
    let home = directories::UserDirs::new()
        .map(|dirs| dirs.home_dir().to_path_buf())
        .unwrap_or_else(|| PathBuf::from("/Users/shaka"));
    home.join(".claude-projects").join("registry.json")
}

#[tauri::command]
fn get_projects() -> Result<Vec<ClaudeProject>, String> {
    let registry_path = get_registry_path();

    let content = fs::read_to_string(&registry_path)
        .map_err(|e| format!("Failed to read registry.json: {}", e))?;

    let registry: Registry = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse registry.json: {}", e))?;

    Ok(registry.projects)
}

#[tauri::command]
fn get_project(id: String) -> Result<ClaudeProject, String> {
    let projects = get_projects()?;
    projects
        .into_iter()
        .find(|p| p.id == id)
        .ok_or_else(|| format!("Project not found: {}", id))
}

// Helper to run commands in Terminal.app so user can see output
fn run_in_terminal(command: &str, working_dir: &str) -> Result<(), String> {
    let script = format!(
        r#"tell application "Terminal"
            activate
            do script "cd '{}' && {}"
        end tell"#,
        working_dir, command
    );

    Command::new("osascript")
        .args(["-e", &script])
        .spawn()
        .map_err(|e| format!("Failed to run command: {}", e))?;
    Ok(())
}

// Helper for simple shell commands (VS Code, etc)
fn run_shell_command(command: &str) -> Result<(), String> {
    Command::new("/bin/zsh")
        .args(["-l", "-c", command])
        .spawn()
        .map_err(|e| format!("Failed to run command '{}': {}", command, e))?;
    Ok(())
}

#[tauri::command]
fn launch_browser(url: String) -> Result<(), String> {
    Command::new("open")
        .arg(&url)
        .spawn()
        .map_err(|e| format!("Failed to open browser: {}", e))?;
    Ok(())
}

#[tauri::command]
fn launch_ios_simulator(path: String, framework: String) -> Result<(), String> {
    let command = match framework.as_str() {
        "expo" => "npx expo run:ios",
        "capacitor" => "npx cap open ios",
        _ => return Err(format!("Unknown framework: {}", framework)),
    };

    run_in_terminal(command, &path)
        .map_err(|e| format!("Failed to launch iOS simulator: {}", e))
}

#[tauri::command]
fn launch_android_emulator(path: String, framework: String) -> Result<(), String> {
    let command = match framework.as_str() {
        "expo" => "npx expo run:android",
        "capacitor" => "npx cap open android",
        _ => return Err(format!("Unknown framework: {}", framework)),
    };

    run_in_terminal(command, &path)
        .map_err(|e| format!("Failed to launch Android emulator: {}", e))
}

#[tauri::command]
fn open_in_vscode(path: String) -> Result<(), String> {
    // Try common VS Code locations
    let code_paths = [
        "/opt/homebrew/bin/code",
        "/usr/local/bin/code",
        "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
    ];

    for code_path in &code_paths {
        if std::path::Path::new(code_path).exists() {
            return Command::new(code_path)
                .arg(&path)
                .spawn()
                .map(|_| ())
                .map_err(|e| format!("Failed to open VS Code: {}", e));
        }
    }

    // Fallback to 'open' command
    Command::new("open")
        .args(["-a", "Visual Studio Code", &path])
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("Failed to open VS Code: {}", e))
}

#[tauri::command]
fn open_in_terminal(path: String) -> Result<(), String> {
    Command::new("open")
        .args(["-a", "Terminal", &path])
        .spawn()
        .map_err(|e| format!("Failed to open Terminal: {}", e))?;
    Ok(())
}

// Get threads/sessions for a project
#[tauri::command(rename_all = "camelCase")]
fn get_threads(project_path: String) -> Result<Vec<Thread>, String> {
    let threads_path = PathBuf::from(&project_path).join(".claude").join("threads.json");

    if !threads_path.exists() {
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&threads_path)
        .map_err(|e| format!("Failed to read threads.json: {}", e))?;

    let threads_file: ThreadsFile = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse threads.json: {}", e))?;

    Ok(threads_file.threads)
}

// Update project data (notes, focus, status, progress)
#[tauri::command(rename_all = "camelCase")]
fn update_project(project_path: String, updates: ProjectUpdate) -> Result<(), String> {
    let project_json_path = PathBuf::from(&project_path).join(".claude").join("project.json");

    let content = fs::read_to_string(&project_json_path)
        .map_err(|e| format!("Failed to read project.json at {:?}: {}", project_json_path, e))?;

    let mut project: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse project.json: {}", e))?;

    // Apply updates
    if let Some(notes) = updates.notes {
        project["notes"] = serde_json::Value::String(notes);
    }
    if let Some(focus) = updates.current_focus {
        project["currentFocus"] = serde_json::Value::String(focus);
    }
    if let Some(status) = updates.status {
        project["status"] = serde_json::Value::String(status);
    }
    if let Some(progress) = updates.progress {
        project["pipeline"]["progress"] = serde_json::Value::Number(progress.into());
    }

    // Update timestamp
    let now = chrono::Utc::now().to_rfc3339();
    project["updatedAt"] = serde_json::Value::String(now);

    // Write back
    let updated_content = serde_json::to_string_pretty(&project)
        .map_err(|e| format!("Failed to serialize project.json: {}", e))?;

    fs::write(&project_json_path, &updated_content)
        .map_err(|e| format!("Failed to write project.json: {}", e))?;

    println!("Successfully updated project.json");
    Ok(())
}

// Check if a port is in use
#[tauri::command]
fn check_port(port: u16) -> Result<bool, String> {
    let output = Command::new("lsof")
        .args(["-i", &format!(":{}", port), "-t"])
        .output()
        .map_err(|e| format!("Failed to check port: {}", e))?;

    Ok(!output.stdout.is_empty())
}

// Start a service for a project
#[tauri::command(rename_all = "camelCase")]
fn start_service(project_path: String, project_id: String, port: u16) -> Result<(), String> {
    // Detect package manager and start command
    let pnpm_lock = PathBuf::from(&project_path).join("pnpm-lock.yaml");
    let npm_lock = PathBuf::from(&project_path).join("package-lock.json");

    let (pm, cmd) = if pnpm_lock.exists() {
        ("pnpm", "dev")
    } else if npm_lock.exists() {
        ("npm", "run dev")
    } else {
        ("npm", "run dev")
    };

    let command = format!("{} {}", pm, cmd);
    run_in_terminal(&command, &project_path)
        .map_err(|e| format!("Failed to start service: {}", e))
}

// Stop a service by port
#[tauri::command]
fn stop_service(port: u16) -> Result<(), String> {
    let output = Command::new("lsof")
        .args(["-i", &format!(":{}", port), "-t"])
        .output()
        .map_err(|e| format!("Failed to find process: {}", e))?;

    let pids = String::from_utf8_lossy(&output.stdout);
    for pid in pids.lines() {
        if let Ok(pid_num) = pid.trim().parse::<i32>() {
            Command::new("kill")
                .arg(pid_num.to_string())
                .spawn()
                .map_err(|e| format!("Failed to kill process: {}", e))?;
        }
    }

    Ok(())
}

// Get activity log for a project
#[tauri::command]
fn get_activity_log(project_path: String) -> Result<String, String> {
    let log_path = PathBuf::from(&project_path).join(".claude").join("log.md");

    if !log_path.exists() {
        return Ok(String::new());
    }

    fs::read_to_string(&log_path)
        .map_err(|e| format!("Failed to read log.md: {}", e))
}

// Sync registry (call sync-registry.sh)
#[tauri::command]
fn sync_registry() -> Result<(), String> {
    let home = get_home_dir();
    let script_path = home.join("claude-project-tracker").join("sync-registry.sh");

    Command::new("/bin/zsh")
        .args(["-l", "-c", &script_path.to_string_lossy()])
        .spawn()
        .map_err(|e| format!("Failed to sync registry: {}", e))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            running_services: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            get_projects,
            get_project,
            launch_browser,
            launch_ios_simulator,
            launch_android_emulator,
            open_in_vscode,
            open_in_terminal,
            get_threads,
            update_project,
            check_port,
            start_service,
            stop_service,
            get_activity_log,
            sync_registry
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
