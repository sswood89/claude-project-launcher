import { AlertTriangle, Target } from 'lucide-react';
import type { ClaudeProject } from '../../types';
import { LaunchBar } from '../Launcher';
import { getStatusColor, getPriorityColor } from '../../utils/launchDetection';

interface ProjectCardProps {
  project: ClaudeProject;
  onClick: () => void;
}

const statusLabels: Record<string, string> = {
  'backlog': 'Backlog',
  'in-progress': 'In Progress',
  'active': 'Active',
  'live': 'Live',
  'paused': 'Paused',
  'onhold': 'On Hold',
  'completed': 'Completed',
  'complete': 'Complete',
  'cancelled': 'Cancelled',
  'archived': 'Archived',
};

const stageLabels: Record<string, string> = {
  'planning': 'Planning',
  'design': 'Design',
  'development': 'Development',
  'testing': 'Testing',
  'deployment': 'Deployment',
  'maintenance': 'Maintenance',
  'deployed': 'Deployed',
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const statusColor = getStatusColor(project.status);
  const priorityColor = getPriorityColor(project.priority);
  const progress = project.pipeline.progress;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <button
          onClick={onClick}
          className="text-left flex-1"
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full bg-${statusColor}-500`} />
            <h3 className="text-base font-semibold text-white hover:text-blue-400 transition-colors">
              {project.name}
            </h3>
          </div>
        </button>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">{progress}%</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
        {project.description}
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-1.5 mb-3">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            progress === 100
              ? 'bg-green-500'
              : progress >= 50
              ? 'bg-blue-500'
              : 'bg-yellow-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-3 text-xs">
        <span className={`px-2 py-0.5 rounded bg-${statusColor}-900/30 text-${statusColor}-400`}>
          {statusLabels[project.status] || project.status}
        </span>
        <span className="text-gray-500">
          {stageLabels[project.pipeline.stage] || project.pipeline.stage}
        </span>
        <span className={`px-2 py-0.5 rounded bg-${priorityColor}-900/30 text-${priorityColor}-400 capitalize`}>
          {project.priority}
        </span>
      </div>

      {/* Blockers */}
      {project.blockers.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-red-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{project.blockers.length} blocker{project.blockers.length > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Current Focus */}
      {project.currentFocus && (
        <div className="flex items-start gap-1.5 mb-3 text-xs text-blue-400">
          <Target className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{project.currentFocus}</span>
        </div>
      )}

      {/* Launch Buttons */}
      <LaunchBar project={project} />
    </div>
  );
}
