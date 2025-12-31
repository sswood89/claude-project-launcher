import { useState, useEffect } from 'react';
import { LayoutDashboard, FolderKanban, RefreshCw, Server } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { Dashboard } from './components/Dashboard';
import { ProjectList, ProjectDetail } from './components/Projects';
import { Services } from './components/Services';
import { useProjectStore } from './stores/projectStore';

type Tab = 'dashboard' | 'projects' | 'services';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { projects, fetchProjects, serviceStatuses } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const selectedProject = selectedProjectId
    ? projects.find(p => p.id === selectedProjectId)
    : null;

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
  };

  const handleBack = () => {
    setSelectedProjectId(null);
  };

  const handleRefresh = () => {
    fetchProjects();
  };

  // Count running services
  const runningCount = Array.from(serviceStatuses.values()).filter(Boolean).length;

  // If a project is selected, show detail view
  if (selectedProject) {
    return (
      <div className="h-screen flex flex-col bg-gray-900">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
            },
          }}
        />
        <ProjectDetail project={selectedProject} onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
          },
        }}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">Claude Projects</h1>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          title="Refresh projects"
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 px-4 py-2 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'projects'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Projects
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'services'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Server className="w-4 h-4" />
          Services
          {runningCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-600 rounded-full">
              {runningCount}
            </span>
          )}
        </button>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && (
          <Dashboard onSelectProject={handleSelectProject} />
        )}
        {activeTab === 'projects' && (
          <ProjectList onSelectProject={handleSelectProject} />
        )}
        {activeTab === 'services' && <Services />}
      </main>
    </div>
  );
}

export default App;
