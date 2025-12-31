import { useEffect } from 'react';
import { Play, Square, RefreshCw, PlayCircle, StopCircle } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import toast from 'react-hot-toast';

export function Services() {
  const {
    projects,
    serviceStatuses,
    fetchProjects,
    checkAllServices,
    startService,
    stopService,
    startAllServices,
    stopAllServices,
  } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter to projects with ports
  const servicesProjects = projects.filter(p => p.tech.ports.length > 0);
  const runningCount = Array.from(serviceStatuses.values()).filter(Boolean).length;

  const handleStart = async (project: typeof projects[0]) => {
    try {
      await startService(project);
      toast.success(`Starting ${project.name}...`);
    } catch (err) {
      toast.error(`Failed to start ${project.name}`);
    }
  };

  const handleStop = async (project: typeof projects[0]) => {
    try {
      await stopService(project);
      toast.success(`Stopped ${project.name}`);
    } catch (err) {
      toast.error(`Failed to stop ${project.name}`);
    }
  };

  const handleStartAll = async () => {
    toast.success('Starting all services...');
    await startAllServices();
  };

  const handleStopAll = async () => {
    toast.success('Stopping all services...');
    await stopAllServices();
  };

  const handleRefresh = () => {
    checkAllServices();
    toast.success('Refreshed service statuses');
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Services</h2>
          <p className="text-sm text-gray-400">
            {runningCount} of {servicesProjects.length} running
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            title="Refresh statuses"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleStartAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
          >
            <PlayCircle className="w-4 h-4" />
            Start All
          </button>
          <button
            onClick={handleStopAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
          >
            <StopCircle className="w-4 h-4" />
            Stop All
          </button>
        </div>
      </div>

      {/* Service list */}
      <div className="space-y-2">
        {servicesProjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No projects with configured ports
          </div>
        ) : (
          servicesProjects.map(project => {
            const isRunning = serviceStatuses.get(project.id) || false;
            const port = project.tech.ports[0];

            return (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {/* Status indicator */}
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                    }`}
                  />
                  <div>
                    <h3 className="font-medium text-white">{project.name}</h3>
                    <p className="text-xs text-gray-400">
                      Port {port} • {isRunning ? 'Running' : 'Stopped'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isRunning ? (
                    <button
                      onClick={() => handleStop(project)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm transition-colors"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStart(project)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-900/30 hover:bg-green-900/50 text-green-400 text-sm transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
