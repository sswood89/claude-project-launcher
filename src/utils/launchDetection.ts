import type { ClaudeProject, LaunchCapabilities } from '../types';

export function detectLaunchCapabilities(project: ClaudeProject): LaunchCapabilities {
  const stack = project.tech.stack.join(' ').toLowerCase();
  const tags = project.tags.join(' ').toLowerCase();

  // Detect mobile framework
  let framework: 'expo' | 'capacitor' | undefined;
  if (stack.includes('expo') || tags.includes('expo')) {
    framework = 'expo';
  } else if (stack.includes('capacitor') || tags.includes('capacitor')) {
    framework = 'capacitor';
  }

  // Determine browser URL
  let browserUrl: string | undefined;
  if (project.links.deployment) {
    browserUrl = project.links.deployment;
  } else if (project.tech.ports.length > 0) {
    browserUrl = `http://localhost:${project.tech.ports[0]}`;
  }

  return {
    hasBrowser: Boolean(browserUrl),
    browserUrl,
    hasIos: Boolean(framework),
    hasAndroid: Boolean(framework),
    framework,
  };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'backlog':
      return 'gray';
    case 'in-progress':
      return 'yellow';
    case 'active':
      return 'green';
    case 'paused':
      return 'orange';
    case 'completed':
    case 'complete':
      return 'emerald';
    case 'archived':
      return 'gray';
    default:
      return 'blue';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'red';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'green';
    default:
      return 'gray';
  }
}

export function getStageColor(stage: string): string {
  switch (stage) {
    case 'planning':
      return '#f97316'; // orange-500
    case 'design':
      return '#fb923c'; // orange-400
    case 'development':
      return '#3b82f6'; // blue-500
    case 'testing':
      return '#60a5fa'; // blue-400
    case 'deployment':
      return '#f97316'; // orange-500
    case 'maintenance':
    case 'deployed':
      return '#22c55e'; // green-500
    default:
      return '#6b7280'; // gray
  }
}
