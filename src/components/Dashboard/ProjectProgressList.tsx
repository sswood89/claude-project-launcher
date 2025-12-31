import type { ClaudeProject } from '../../types';
import { getStatusColor } from '../../utils/launchDetection';

interface ProjectProgressListProps {
  projects: ClaudeProject[];
  onSelectProject: (id: string) => void;
}

export function ProjectProgressList({ projects, onSelectProject }: ProjectProgressListProps) {
  // Sort by progress descending
  const sortedProjects = [...projects].sort((a, b) => b.pipeline.progress - a.pipeline.progress);

  return (
    <div className="space-y-3">
      {sortedProjects.map((project) => {
        const progress = project.pipeline.progress;
        const statusColor = getStatusColor(project.status);

        return (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className="w-full text-left bg-gray-750 hover:bg-gray-700 rounded-lg p-3 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full bg-${statusColor}-500`} />
                <span className="text-sm font-medium text-white">{project.name}</span>
              </div>
              <span className="text-xs text-gray-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  progress === 100
                    ? 'bg-green-500'
                    : progress >= 50
                    ? 'bg-blue-500'
                    : 'bg-yellow-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
