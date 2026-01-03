import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { ClaudeProject, DashboardStats, LaunchType, Thread, ProjectUpdate, CodeStats, GitStats, Screenshot, SessionAnalytics, ViewMode, StatusFilter, ProjectOrder, ProjectStatus } from '../types';
import { detectLaunchCapabilities } from '../utils/launchDetection';

interface ProjectStore {
  projects: ClaudeProject[];
  loading: boolean;
  error: string | null;
  selectedProjectId: string | null;
  serviceStatuses: Map<string, boolean>;
  threads: Map<string, Thread[]>;

  // View and filter state
  viewMode: ViewMode;
  statusFilter: StatusFilter;
  selectedStatuses: ProjectStatus[];
  projectOrder: ProjectOrder | null;

  // Actions
  fetchProjects: () => Promise<void>;
  selectProject: (id: string | null) => void;
  getDashboardStats: () => DashboardStats;
  launchProject: (project: ClaudeProject, type: LaunchType) => Promise<void>;

  // View and filter actions
  setViewMode: (mode: ViewMode) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  toggleStatus: (status: ProjectStatus) => void;
  getFilteredProjects: () => ClaudeProject[];
  fetchProjectOrder: () => Promise<void>;
  updateProjectOrder: (order: ProjectOrder) => Promise<void>;

  // New actions
  getThreads: (project: ClaudeProject) => Promise<Thread[]>;
  updateProject: (project: ClaudeProject, updates: ProjectUpdate) => Promise<void>;
  checkServiceStatus: (project: ClaudeProject) => Promise<boolean>;
  checkAllServices: () => Promise<void>;
  startService: (project: ClaudeProject) => Promise<void>;
  stopService: (project: ClaudeProject) => Promise<void>;
  startAllServices: () => Promise<void>;
  stopAllServices: () => Promise<void>;
  syncRegistry: () => Promise<void>;

  // Analytics actions
  getCodeStats: (project: ClaudeProject) => Promise<CodeStats>;
  getGitStats: (project: ClaudeProject) => Promise<GitStats>;
  getScreenshots: (project: ClaudeProject) => Promise<Screenshot[]>;
  addScreenshot: (project: ClaudeProject, sourcePath: string, description?: string) => Promise<Screenshot>;
  getSessionAnalytics: (project: ClaudeProject) => Promise<SessionAnalytics>;
}

// Default statuses (all except archived)
const DEFAULT_SELECTED_STATUSES: ProjectStatus[] = ['backlog', 'in-progress', 'active', 'live', 'paused', 'onhold', 'completed', 'cancelled'];

// Helper to get persisted preferences from localStorage
const getPersistedPreferences = () => {
  try {
    const stored = localStorage.getItem('project-tracker-preferences');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        viewMode: parsed.viewMode || 'card',
        statusFilter: parsed.statusFilter || 'hide-archived',
        selectedStatuses: parsed.selectedStatuses || DEFAULT_SELECTED_STATUSES,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return {
    viewMode: 'card' as ViewMode,
    statusFilter: 'hide-archived' as StatusFilter,
    selectedStatuses: DEFAULT_SELECTED_STATUSES,
  };
};

const persistPreferences = (viewMode: ViewMode, statusFilter: StatusFilter, selectedStatuses: ProjectStatus[]) => {
  try {
    localStorage.setItem('project-tracker-preferences', JSON.stringify({ viewMode, statusFilter, selectedStatuses }));
  } catch {
    // Ignore storage errors
  }
};

export const useProjectStore = create<ProjectStore>((set, get) => {
  const initialPrefs = getPersistedPreferences();

  return {
  projects: [],
  loading: false,
  error: null,
  selectedProjectId: null,
  serviceStatuses: new Map(),
  threads: new Map(),
  viewMode: initialPrefs.viewMode,
  statusFilter: initialPrefs.statusFilter,
  selectedStatuses: initialPrefs.selectedStatuses,
  projectOrder: null,

  setViewMode: (mode) => {
    set({ viewMode: mode });
    persistPreferences(mode, get().statusFilter, get().selectedStatuses);
  },

  setStatusFilter: (filter) => {
    // If setting to an array (custom filter), also update selectedStatuses
    if (Array.isArray(filter)) {
      set({ statusFilter: filter, selectedStatuses: filter });
      persistPreferences(get().viewMode, filter, filter);
    } else {
      set({ statusFilter: filter });
      persistPreferences(get().viewMode, filter, get().selectedStatuses);
    }
  },

  toggleStatus: (status) => {
    const { selectedStatuses, viewMode } = get();
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    set({ selectedStatuses: newStatuses, statusFilter: newStatuses });
    persistPreferences(viewMode, newStatuses, newStatuses);
  },

  getFilteredProjects: () => {
    const { projects, statusFilter } = get();

    // If statusFilter is an array, use it directly for custom filtering
    if (Array.isArray(statusFilter)) {
      return projects.filter(p => statusFilter.includes(p.status as ProjectStatus));
    }

    // Otherwise use preset filters
    switch (statusFilter) {
      case 'hide-archived':
        return projects.filter(p => p.status !== 'archived');
      case 'active-only':
        return projects.filter(p => ['in-progress', 'active', 'live'].includes(p.status));
      case 'all':
      default:
        return projects;
    }
  },

  fetchProjectOrder: async () => {
    try {
      const order = await invoke<ProjectOrder>('get_project_order');
      set({ projectOrder: order });
    } catch (err) {
      console.error('Failed to fetch project order:', err);
    }
  },

  updateProjectOrder: async (order) => {
    try {
      await invoke('update_project_order', { order });
      set({ projectOrder: order });
    } catch (err) {
      console.error('Failed to update project order:', err);
      throw err;
    }
  },

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await invoke<ClaudeProject[]>('get_projects');
      set({ projects, loading: false });
      // Check service statuses after fetching
      get().checkAllServices();
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  selectProject: (id) => {
    set({ selectedProjectId: id });
  },

  getDashboardStats: () => {
    const { projects } = get();

    const inProgressProjects = projects.filter(p => p.status === 'in-progress').length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p =>
      p.status === 'completed' || p.status === 'complete'
    ).length;

    const averageProgress = projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.pipeline.progress, 0) / projects.length)
      : 0;

    const stageDistribution: Record<string, number> = {};
    projects.forEach(p => {
      const stage = p.pipeline.stage;
      stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
    });

    return {
      totalProjects: projects.length,
      inProgressProjects,
      activeProjects,
      completedProjects,
      averageProgress,
      stageDistribution,
    };
  },

  launchProject: async (project, type) => {
    const capabilities = detectLaunchCapabilities(project);

    try {
      switch (type) {
        case 'browser':
          if (capabilities.browserUrl) {
            await invoke('launch_browser', { url: capabilities.browserUrl });
          }
          break;
        case 'ios':
          if (capabilities.framework) {
            await invoke('launch_ios_simulator', {
              path: project.path,
              framework: capabilities.framework,
            });
          }
          break;
        case 'android':
          if (capabilities.framework) {
            await invoke('launch_android_emulator', {
              path: project.path,
              framework: capabilities.framework,
            });
          }
          break;
        case 'vscode':
          await invoke('open_in_vscode', { path: project.path });
          break;
        case 'terminal':
          await invoke('open_in_terminal', { path: project.path });
          break;
      }
    } catch (err) {
      console.error(`Failed to launch ${type}:`, err);
      throw err;
    }
  },

  getThreads: async (project) => {
    try {
      const threads = await invoke<Thread[]>('get_threads', { projectPath: project.path });
      set(state => {
        const newThreads = new Map(state.threads);
        newThreads.set(project.id, threads);
        return { threads: newThreads };
      });
      return threads;
    } catch (err) {
      console.error('Failed to get threads:', err);
      return [];
    }
  },

  updateProject: async (project, updates) => {
    try {
      await invoke('update_project', { projectPath: project.path, updates });
      // Sync registry and refresh
      await get().syncRegistry();
      await get().fetchProjects();
    } catch (err) {
      console.error('Failed to update project:', err);
      throw err;
    }
  },

  checkServiceStatus: async (project) => {
    if (project.tech.ports.length === 0) return false;

    try {
      const running = await invoke<boolean>('check_port', { port: project.tech.ports[0] });
      set(state => {
        const newStatuses = new Map(state.serviceStatuses);
        newStatuses.set(project.id, running);
        return { serviceStatuses: newStatuses };
      });
      return running;
    } catch (err) {
      console.error('Failed to check service status:', err);
      return false;
    }
  },

  checkAllServices: async () => {
    const { projects } = get();
    const newStatuses = new Map<string, boolean>();

    for (const project of projects) {
      if (project.tech.ports.length > 0) {
        try {
          const running = await invoke<boolean>('check_port', { port: project.tech.ports[0] });
          newStatuses.set(project.id, running);
        } catch {
          newStatuses.set(project.id, false);
        }
      }
    }

    set({ serviceStatuses: newStatuses });
  },

  startService: async (project) => {
    if (project.tech.ports.length === 0) {
      throw new Error('No port configured for this project');
    }

    try {
      await invoke('start_service', {
        projectPath: project.path,
        projectId: project.id,
        port: project.tech.ports[0],
      });
      // Wait a bit then check status
      setTimeout(() => get().checkServiceStatus(project), 3000);
    } catch (err) {
      console.error('Failed to start service:', err);
      throw err;
    }
  },

  stopService: async (project) => {
    if (project.tech.ports.length === 0) return;

    try {
      await invoke('stop_service', { port: project.tech.ports[0] });
      set(state => {
        const newStatuses = new Map(state.serviceStatuses);
        newStatuses.set(project.id, false);
        return { serviceStatuses: newStatuses };
      });
    } catch (err) {
      console.error('Failed to stop service:', err);
      throw err;
    }
  },

  startAllServices: async () => {
    const { projects } = get();
    for (const project of projects) {
      if (project.tech.ports.length > 0) {
        try {
          await get().startService(project);
        } catch (err) {
          console.error(`Failed to start ${project.name}:`, err);
        }
      }
    }
  },

  stopAllServices: async () => {
    const { projects } = get();
    for (const project of projects) {
      if (project.tech.ports.length > 0) {
        try {
          await get().stopService(project);
        } catch (err) {
          console.error(`Failed to stop ${project.name}:`, err);
        }
      }
    }
  },

  syncRegistry: async () => {
    try {
      await invoke('sync_registry');
    } catch (err) {
      console.error('Failed to sync registry:', err);
    }
  },

  getCodeStats: async (project) => {
    try {
      return await invoke<CodeStats>('get_code_stats', { projectPath: project.path });
    } catch (err) {
      console.error('Failed to get code stats:', err);
      return {
        totalLines: 0,
        codeLines: 0,
        blankLines: 0,
        commentLines: 0,
        fileCount: 0,
        byLanguage: {},
      };
    }
  },

  getGitStats: async (project) => {
    try {
      return await invoke<GitStats>('get_git_stats', { projectPath: project.path });
    } catch (err) {
      console.error('Failed to get git stats:', err);
      return {
        totalCommits: 0,
        lastCommitDate: null,
        firstCommitDate: null,
        activeDays: 0,
        commitsByMonth: {},
      };
    }
  },

  getScreenshots: async (project) => {
    try {
      return await invoke<Screenshot[]>('get_screenshots', { projectPath: project.path });
    } catch (err) {
      console.error('Failed to get screenshots:', err);
      return [];
    }
  },

  addScreenshot: async (project, sourcePath, description) => {
    try {
      return await invoke<Screenshot>('add_screenshot', {
        projectPath: project.path,
        sourcePath,
        description,
      });
    } catch (err) {
      console.error('Failed to add screenshot:', err);
      throw err;
    }
  },

  getSessionAnalytics: async (project) => {
    const threads = await get().getThreads(project);

    // Calculate session analytics from threads
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let totalTimeMinutes = 0;
    let longestSessionMinutes = 0;
    const outcomeDistribution: Record<string, number> = {};

    threads.forEach(thread => {
      // Calculate duration if we have timestamps
      if (thread.createdAt && thread.updatedAt) {
        const start = new Date(thread.createdAt).getTime();
        const end = new Date(thread.updatedAt).getTime();
        const durationMinutes = Math.round((end - start) / (1000 * 60));
        if (durationMinutes > 0 && durationMinutes < 480) { // Cap at 8 hours
          totalTimeMinutes += durationMinutes;
          if (durationMinutes > longestSessionMinutes) {
            longestSessionMinutes = durationMinutes;
          }
        }
      }

      // Count outcomes
      if (thread.outcome) {
        outcomeDistribution[thread.outcome] = (outcomeDistribution[thread.outcome] || 0) + 1;
      }
    });

    const sessionsThisWeek = threads.filter(t => new Date(t.date) >= oneWeekAgo).length;
    const sessionsThisMonth = threads.filter(t => new Date(t.date) >= oneMonthAgo).length;

    return {
      totalSessions: threads.length,
      totalTimeMinutes,
      averageSessionMinutes: threads.length > 0 ? Math.round(totalTimeMinutes / threads.length) : 0,
      sessionsThisWeek,
      sessionsThisMonth,
      longestSessionMinutes,
      lastSessionDate: threads.length > 0 ? threads[0].date : null,
      outcomeDistribution,
    };
  },
}});
