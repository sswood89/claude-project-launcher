import { useEffect, useState, useMemo } from 'react';
import { FolderKanban, Clock, Zap, CheckCircle, X } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { StatBox } from './StatBox';
import { StageDistributionChart } from './StageDistributionChart';
import { ProjectProgressList } from './ProjectProgressList';

type FilterType = 'all' | 'in-progress' | 'active' | 'completed' | string;

interface DashboardProps {
  onSelectProject: (id: string) => void;
}

export function Dashboard({ onSelectProject }: DashboardProps) {
  const { projects, fetchProjects, getDashboardStats } = useProjectStore();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredProjects = useMemo(() => {
    if (filter === 'all') return projects;
    if (filter === 'in-progress') return projects.filter(p => p.status === 'in-progress');
    if (filter === 'active') return projects.filter(p => p.status === 'active');
    if (filter === 'completed') return projects.filter(p => p.status === 'completed');
    // Filter by stage
    return projects.filter(p => p.pipeline.stage === filter);
  }, [projects, filter]);

  const getFilterLabel = (f: FilterType) => {
    if (f === 'all') return 'All Projects';
    if (f === 'in-progress') return 'In Progress';
    if (f === 'active') return 'Active';
    if (f === 'completed') return 'Completed';
    return f.charAt(0).toUpperCase() + f.slice(1);
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const stats = getDashboardStats();

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Active Filter Badge */}
      {filter !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Filtered by:</span>
          <button
            onClick={() => setFilter('all')}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs hover:bg-blue-600/30 transition-colors"
          >
            {getFilterLabel(filter)}
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox
          label="Projects"
          value={stats.totalProjects}
          icon={FolderKanban}
          color="blue"
          onClick={() => setFilter('all')}
        />
        <StatBox
          label="In Progress"
          value={stats.inProgressProjects}
          icon={Clock}
          color="yellow"
          onClick={() => setFilter('in-progress')}
        />
        <StatBox
          label="Active"
          value={stats.activeProjects}
          icon={Zap}
          color="green"
          onClick={() => setFilter('active')}
        />
        <StatBox
          label="Completed"
          value={stats.completedProjects}
          icon={CheckCircle}
          color="emerald"
          onClick={() => setFilter('completed')}
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
              stats.averageProgress >= 75
                ? 'bg-green-500'
                : stats.averageProgress >= 40
                ? 'bg-blue-500'
                : 'bg-orange-500'
            }`}
            style={{ width: `${stats.averageProgress}%` }}
          />
        </div>
      </div>

      {/* Stage Distribution */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Stage Distribution</h3>
        <StageDistributionChart
          distribution={stats.stageDistribution}
          onStageClick={(stage) => setFilter(stage)}
        />
      </div>

      {/* Project Progress */}
      {filteredProjects.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              Projects {filter !== 'all' && `(${filteredProjects.length})`}
            </h3>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Show all
              </button>
            )}
          </div>
          <ProjectProgressList projects={filteredProjects} onSelectProject={onSelectProject} />
        </div>
      )}

      {filteredProjects.length === 0 && filter !== 'all' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
          <p className="text-gray-400 text-sm">No projects match this filter</p>
          <button
            onClick={() => setFilter('all')}
            className="mt-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}
