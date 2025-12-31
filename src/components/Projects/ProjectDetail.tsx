import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, AlertTriangle, Target, GitBranch, Calendar, Save, Edit2, MessageSquare, CheckCircle, Clock, FileText } from 'lucide-react';
import type { ClaudeProject, Thread } from '../../types';
import { LaunchBar } from '../Launcher';
import { getStatusColor } from '../../utils/launchDetection';
import { useProjectStore } from '../../stores/projectStore';
import { ProgressChart } from './ProgressChart';
import { ProjectEditor } from './ProjectEditor';
import toast from 'react-hot-toast';

interface ProjectDetailProps {
  project: ClaudeProject;
  onBack: () => void;
}

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const statusColor = getStatusColor(project.status);
  const progress = project.pipeline.progress;

  const { getThreads, updateProject } = useProjectStore();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(project.notes || '');
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [editedFocus, setEditedFocus] = useState(project.currentFocus || '');
  const [projectThreads, setProjectThreads] = useState<Thread[]>([]);

  useEffect(() => {
    // Load threads for this project
    getThreads(project).then(setProjectThreads);
  }, [project, getThreads]);

  const handleSaveNotes = async () => {
    try {
      await updateProject(project, { notes: editedNotes });
      setIsEditingNotes(false);
      toast.success('Notes saved');
    } catch (err) {
      toast.error('Failed to save notes');
    }
  };

  const handleSaveFocus = async () => {
    try {
      await updateProject(project, { currentFocus: editedFocus });
      setIsEditingFocus(false);
      toast.success('Focus updated!');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      // Show error in multiple ways for debugging
      console.error('UPDATE ERROR:', errorMsg);
      toast.error(errorMsg, { duration: 10000 });
    }
  };

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full bg-${statusColor}-500`} />
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">{project.description}</p>
        </div>
        <ProjectEditor project={project} />
      </div>

      {/* Progress */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Progress</span>
          <span className="text-lg font-bold text-white">{progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              progress === 100
                ? 'bg-green-500'
                : progress >= 50
                ? 'bg-blue-500'
                : 'bg-yellow-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>Stage: {project.pipeline.stage}</span>
          <span>Priority: {project.priority}</span>
        </div>
      </div>

      {/* Launch Actions */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
        <h3 className="text-sm font-semibold text-white mb-3">Launch</h3>
        <LaunchBar project={project} />
      </div>

      {/* Progress Chart */}
      <ProgressChart threads={projectThreads} currentProgress={progress} />

      {/* Current Focus (Editable) */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 text-blue-400 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-blue-400">Current Focus</h3>
              {isEditingFocus ? (
                <button
                  onClick={handleSaveFocus}
                  className="p-1 rounded hover:bg-blue-800/50 text-blue-400"
                >
                  <Save className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingFocus(true)}
                  className="p-1 rounded hover:bg-blue-800/50 text-blue-400"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {isEditingFocus ? (
              <input
                type="text"
                value={editedFocus}
                onChange={(e) => setEditedFocus(e.target.value)}
                className="w-full mt-1 px-2 py-1 bg-blue-900/30 border border-blue-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                placeholder="Enter current focus..."
                autoFocus
              />
            ) : (
              <p className="text-sm text-gray-300 mt-1">
                {project.currentFocus || <span className="text-gray-500 italic">No focus set</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Blockers */}
      {project.blockers.length > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-400">Blockers ({project.blockers.length})</h3>
              <ul className="mt-2 space-y-2">
                {project.blockers.map((blocker, i) => (
                  <li key={i} className="text-sm text-gray-300">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      blocker.severity === 'high' ? 'bg-red-500' :
                      blocker.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} />
                    {blocker.description}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Phases */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
        <h3 className="text-sm font-semibold text-white mb-3">Pipeline Phases</h3>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(project.pipeline.phases).map(([phase, status]) => (
            <div
              key={phase}
              className="text-center p-2 rounded-lg bg-gray-750"
            >
              <span
                className={`inline-block w-2 h-2 rounded-full mb-1 ${
                  status === 'done' ? 'bg-green-500' :
                  status === 'in-progress' ? 'bg-blue-500' :
                  status === 'blocked' ? 'bg-red-500' : 'bg-gray-500'
                }`}
              />
              <p className="text-xs text-gray-400 capitalize">{phase}</p>
              <p className="text-xs text-gray-500 capitalize">{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
        <h3 className="text-sm font-semibold text-white mb-3">Tech Stack</h3>
        <div className="flex flex-wrap gap-2">
          {project.tech.stack.map((tech, i) => (
            <span key={i} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Links */}
      {(project.links.repo || project.links.deployment || project.links.docs) && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
          <h3 className="text-sm font-semibold text-white mb-3">Links</h3>
          <div className="flex flex-wrap gap-2">
            {project.links.repo && (
              <a
                href={project.links.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                <GitBranch className="w-3.5 h-3.5" />
                Repository
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {project.links.deployment && (
              <a
                href={project.links.deployment}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                Deployment
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {project.links.docs && (
              <a
                href={project.links.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                Docs
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Milestones */}
      {project.milestones.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
          <h3 className="text-sm font-semibold text-white mb-3">Milestones</h3>
          <div className="space-y-2">
            {project.milestones.map((milestone, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${
                  milestone.status === 'done' ? 'bg-green-500' :
                  milestone.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-500'
                }`} />
                <span className="text-gray-300 flex-1">{milestone.name}</span>
                {(milestone.date || milestone.completedAt) && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {milestone.completedAt || milestone.date}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes (Editable) */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Notes
          </h3>
          {isEditingNotes ? (
            <button
              onClick={handleSaveNotes}
              className="p-1.5 rounded hover:bg-gray-700 text-green-400"
            >
              <Save className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
        {isEditingNotes ? (
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            className="w-full min-h-[100px] px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500 resize-y"
            placeholder="Add notes about this project..."
            autoFocus
          />
        ) : (
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {project.notes || <span className="text-gray-500 italic">No notes yet. Click edit to add notes.</span>}
          </p>
        )}
      </div>

      {/* Recent Sessions */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4" />
          Recent Sessions
        </h3>
        {projectThreads.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No session history found</p>
        ) : (
          <div className="space-y-3">
            {projectThreads.slice(0, 5).map((thread, i) => (
              <div
                key={thread.threadId || i}
                className="border-l-2 border-gray-600 pl-3 py-1"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-200">{thread.title}</h4>
                  <span className="text-xs text-gray-500">{thread.date}</span>
                </div>
                {thread.summary && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{thread.summary}</p>
                )}
                {thread.outcome && (
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                    thread.outcome === 'success' ? 'bg-green-900/30 text-green-400' :
                    thread.outcome === 'partial' ? 'bg-yellow-900/30 text-yellow-400' :
                    thread.outcome === 'blocked' ? 'bg-red-900/30 text-red-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {thread.outcome}
                  </span>
                )}
                {thread.tasksCompleted.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {thread.tasksCompleted.length} tasks completed
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {thread.tasksCompleted.slice(0, 3).map((task, j) => (
                        <li key={j} className="text-xs text-gray-400 pl-4">• {task}</li>
                      ))}
                      {thread.tasksCompleted.length > 3 && (
                        <li className="text-xs text-gray-500 pl-4">
                          +{thread.tasksCompleted.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                {thread.tasksCreated.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-blue-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {thread.tasksCreated.length} tasks created
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {thread.tasksCreated.slice(0, 3).map((task, j) => (
                        <li key={j} className="text-xs text-gray-400 pl-4">• {task}</li>
                      ))}
                      {thread.tasksCreated.length > 3 && (
                        <li className="text-xs text-gray-500 pl-4">
                          +{thread.tasksCreated.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {projectThreads.length > 5 && (
              <p className="text-xs text-gray-500 text-center pt-2">
                +{projectThreads.length - 5} more sessions
              </p>
            )}
          </div>
        )}
      </div>

      {/* Goals */}
      {project.goals.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Target className="w-4 h-4" />
            Goals
          </h3>
          <div className="space-y-2">
            {(Array.isArray(project.goals) ? project.goals : []).map((goal, i) => {
              if (typeof goal === 'string') {
                return (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                    <span className="text-gray-300">{goal}</span>
                  </div>
                );
              } else {
                return (
                  <div key={goal.id || i} className="border-l-2 border-gray-600 pl-3 py-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        goal.status === 'done' ? 'bg-green-500' :
                        goal.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-500'
                      }`} />
                      <span className="text-sm font-medium text-gray-200">{goal.title}</span>
                    </div>
                    {goal.description && (
                      <p className="text-xs text-gray-400 mt-1">{goal.description}</p>
                    )}
                    {goal.targetDate && (
                      <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Target: {goal.targetDate}
                      </span>
                    )}
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}
