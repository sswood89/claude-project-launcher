import { useState } from 'react';
import { Settings, Save, X, Sliders } from 'lucide-react';
import type { ClaudeProject, ProjectStatus } from '../../types';
import { useProjectStore } from '../../stores/projectStore';
import toast from 'react-hot-toast';

interface ProjectEditorProps {
  project: ClaudeProject;
}

const STATUS_OPTIONS: ProjectStatus[] = ['backlog', 'in-progress', 'active', 'paused', 'completed', 'archived'];

export function ProjectEditor({ project }: ProjectEditorProps) {
  const { updateProject } = useProjectStore();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(project.status);
  const [progress, setProgress] = useState(project.pipeline.progress);

  const handleSave = async () => {
    try {
      await updateProject(project, {
        status,
        progress,
      });
      setIsEditing(false);
      toast.success('Project updated');
    } catch (err) {
      toast.error('Failed to update project');
    }
  };

  const handleCancel = () => {
    setStatus(project.status);
    setProgress(project.pipeline.progress);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
      >
        <Settings className="w-3.5 h-3.5" />
        Edit Project
      </button>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-blue-600 p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          Edit Project
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            className="p-1.5 rounded hover:bg-gray-700 text-green-400"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Progress */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Progress: {progress}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Quick Progress Buttons */}
        <div className="flex gap-2">
          {[0, 25, 50, 75, 100].map((val) => (
            <button
              key={val}
              onClick={() => setProgress(val)}
              className={`flex-1 py-1 text-xs rounded ${
                progress === val
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {val}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
