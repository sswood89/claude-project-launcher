import { AlertTriangle } from 'lucide-react';
import type { ClaudeProject } from '../../types';
import { getStatusColor, getPriorityColor } from '../../utils/launchDetection';

interface ProjectListItemProps {
  project: ClaudeProject;
  onClick: () => void;
}

const statusLabels: Record<string, string> = {
  'backlog': 'Backlog',
  'in-progress': 'In Progress',
  'active': 'Active',
  'paused': 'Paused',
  'completed': 'Completed',
  'complete': 'Complete',
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

export function ProjectListItem({ project, onClick }: ProjectListItemProps) {
  const statusColor = getStatusColor(project.status);
  const priorityColor = getPriorityColor(project.priority);
  const progress = project.pipeline.progress;
  const isArchived = project.status === 'archived';

  return (
    <button
      onClick={onClick}
      className={`w-full bg-gray-800 rounded-lg border border-gray-700 p-3
                  hover:border-gray-600 transition-colors text-left
                  grid grid-cols-12 gap-3 items-center
                  ${isArchived ? 'opacity-60' : ''}`}
    >
      {/* Name + Priority (4 cols) */}
      <div className="col-span-12 sm:col-span-4 flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 bg-${statusColor}-500`} />
        <span className="font-medium text-white truncate">{project.name}</span>
        {project.blockers.length > 0 && (
          <span className="text-red-400 text-xs flex-shrink-0 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {project.blockers.length}
          </span>
        )}
        {isArchived && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-600 text-gray-300 flex-shrink-0">
            Archived
          </span>
        )}
      </div>

      {/* Status (2 cols) */}
      <div className="col-span-4 sm:col-span-2 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs bg-${statusColor}-900/30 text-${statusColor}-400`}>
          {statusLabels[project.status] || project.status}
        </span>
      </div>

      {/* Stage (2 cols) */}
      <div className="col-span-4 sm:col-span-2 text-sm text-gray-400">
        {stageLabels[project.pipeline.stage] || project.pipeline.stage}
      </div>

      {/* Progress (2 cols) */}
      <div className="col-span-4 sm:col-span-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-700 rounded-full h-1.5">
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
          <span className="text-xs font-mono text-gray-400 w-8 text-right">
            {progress}%
          </span>
        </div>
      </div>

      {/* Priority (2 cols - hidden on mobile) */}
      <div className="hidden sm:block col-span-2">
        <span className={`px-2 py-0.5 rounded text-xs bg-${priorityColor}-900/30 text-${priorityColor}-400 capitalize`}>
          {project.priority}
        </span>
      </div>
    </button>
  );
}
