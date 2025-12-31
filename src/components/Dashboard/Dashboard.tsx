import { useEffect } from 'react';
import { FolderKanban, Clock, Zap, CheckCircle } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { StatBox } from './StatBox';
import { StageDistributionChart } from './StageDistributionChart';
import { ProjectProgressList } from './ProjectProgressList';

interface DashboardProps {
  onSelectProject: (id: string) => void;
}

export function Dashboard({ onSelectProject }: DashboardProps) {
  const { projects, fetchProjects, getDashboardStats } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const stats = getDashboardStats();

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox
          label="Projects"
          value={stats.totalProjects}
          icon={FolderKanban}
          color="blue"
        />
        <StatBox
          label="In Progress"
          value={stats.inProgressProjects}
          icon={Clock}
          color="yellow"
        />
        <StatBox
          label="Active"
          value={stats.activeProjects}
          icon={Zap}
          color="green"
        />
        <StatBox
          label="Completed"
          value={stats.completedProjects}
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Overall Progress</span>
          <span className="text-sm font-bold text-white">{stats.averageProgress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              stats.averageProgress === 100
                ? 'bg-green-500'
                : stats.averageProgress >= 50
                ? 'bg-blue-500'
                : 'bg-yellow-500'
            }`}
            style={{ width: `${stats.averageProgress}%` }}
          />
        </div>
      </div>

      {/* Stage Distribution */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Stage Distribution</h3>
        <StageDistributionChart distribution={stats.stageDistribution} />
      </div>

      {/* Project Progress */}
      {projects.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Projects</h3>
          <ProjectProgressList projects={projects} onSelectProject={onSelectProject} />
        </div>
      )}
    </div>
  );
}
