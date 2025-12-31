import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { ClaudeProject, DashboardStats, LaunchType, Thread, ProjectUpdate } from '../types';
import { detectLaunchCapabilities } from '../utils/launchDetection';

interface ProjectStore {
  projects: ClaudeProject[];
  loading: boolean;
  error: string | null;
  selectedProjectId: string | null;
  serviceStatuses: Map<string, boolean>;
  threads: Map<string, Thread[]>;

  // Actions
  fetchProjects: () => Promise<void>;
  selectProject: (id: string | null) => void;
  getDashboardStats: () => DashboardStats;
  launchProject: (project: ClaudeProject, type: LaunchType) => Promise<void>;

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
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loading: false,
  error: null,
  selectedProjectId: null,
  serviceStatuses: new Map(),
  threads: new Map(),

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
}));
