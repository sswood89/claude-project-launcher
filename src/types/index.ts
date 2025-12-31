// Match the registry.json schema

export type ProjectStatus = 'backlog' | 'in-progress' | 'active' | 'paused' | 'completed' | 'complete' | 'archived';
export type Priority = 'high' | 'medium' | 'low';
export type PipelineStage = 'planning' | 'design' | 'development' | 'testing' | 'deployment' | 'maintenance' | 'deployed';
export type PhaseStatus = 'pending' | 'in-progress' | 'done' | 'blocked';

export interface Pipeline {
  stage: PipelineStage;
  progress: number;
  phases: Record<string, PhaseStatus>;
}

export interface Milestone {
  name: string;
  status: string;
  date?: string;
  completedAt?: string;
}

export interface Blocker {
  description: string;
  severity: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface ProjectLinks {
  repo: string;
  docs: string;
  deployment: string;
  figma: string;
}

export interface TechStack {
  stack: string[];
  ports: number[];
  dependencies: string[];
}

export interface ClaudeProject {
  id: string;
  name: string;
  description: string;
  version: string;
  status: ProjectStatus;
  priority: Priority;
  category: string;
  tags: string[];
  pipeline: Pipeline;
  goals: string[] | { id: string; title: string; description: string; status: string; targetDate?: string }[];
  milestones: Milestone[];
  currentFocus: string | null;
  blockers: Blocker[];
  notes: string;
  links: ProjectLinks;
  tech: TechStack;
  createdAt: string;
  updatedAt: string;
  path: string;
}

export type LaunchType = 'browser' | 'ios' | 'android' | 'vscode' | 'terminal';

export interface LaunchCapabilities {
  hasBrowser: boolean;
  browserUrl?: string;
  hasIos: boolean;
  hasAndroid: boolean;
  framework?: 'expo' | 'capacitor';
}

export interface DashboardStats {
  totalProjects: number;
  inProgressProjects: number;
  activeProjects: number;
  completedProjects: number;
  averageProgress: number;
  stageDistribution: Record<string, number>;
}

// Thread/Session from threads.json
export interface Thread {
  threadId: string;
  date: string;
  title: string;
  context?: string;
  summary?: string;
  outcome?: string;
  tasksCompleted: string[];
  tasksCreated: string[];
  filesModified: string[];
  updatedAt?: string;
}

// Project update payload
export interface ProjectUpdate {
  notes?: string;
  currentFocus?: string;
  status?: string;
  progress?: number;
}

// Service status
export interface ServiceStatus {
  projectId: string;
  port: number;
  running: boolean;
}
