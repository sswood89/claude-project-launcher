import { useState, useEffect } from 'react';
import {
  Code,
  GitCommit,
  Clock,
  FileCode,
  Image,
  Activity,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  RefreshCw,
  MessageSquare,
  Calendar,
  ListChecks,
} from 'lucide-react';
import type { ClaudeProject, CodeStats, GitStats, Screenshot, SessionAnalytics, Thread } from '../../types';
import { useProjectStore } from '../../stores/projectStore';
import toast from 'react-hot-toast';

interface AnalyticsProps {
  project: ClaudeProject;
}

export function Analytics({ project }: AnalyticsProps) {
  const { getCodeStats, getGitStats, getScreenshots, getSessionAnalytics, getThreads } = useProjectStore();

  const [codeStats, setCodeStats] = useState<CodeStats | null>(null);
  const [gitStats, setGitStats] = useState<GitStats | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Screenshot | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [code, git, screens, sessions, threadData] = await Promise.all([
        getCodeStats(project),
        getGitStats(project),
        getScreenshots(project),
        getSessionAnalytics(project),
        getThreads(project),
      ]);
      setCodeStats(code);
      setGitStats(git);
      setScreenshots(screens);
      setSessionAnalytics(sessions);
      setThreads(threadData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      toast.error('Failed to load analytics');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, [project.id]);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleAddScreenshot = () => {
    // For now, show instructions since we need the file dialog plugin for proper upload
    toast('Drag screenshots to .claude/screenshots/ folder, then refresh', {
      duration: 5000,
      icon: 'i',
    });
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="animate-spin text-blue-500">
          <RefreshCw className="w-8 h-8" />
        </div>
      </div>
    );
  }

  // Get top languages by lines
  const topLanguages = codeStats
    ? Object.entries(codeStats.byLanguage)
        .sort(([, a], [, b]) => b.lines - a.lines)
        .slice(0, 6)
    : [];

  // Get recent months for commit chart
  const commitMonths = gitStats
    ? Object.entries(gitStats.commitsByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
    : [];

  const maxCommits = Math.max(...commitMonths.map(([, count]) => count), 1);

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          Analytics: {project.name}
        </h2>
        <button
          onClick={loadAnalytics}
          className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title="Refresh analytics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Code className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">Lines of Code</span>
          </div>
          <p className="text-xl font-bold text-white">{formatNumber(codeStats?.codeLines || 0)}</p>
          <p className="text-xs text-gray-400">{codeStats?.fileCount || 0} files</p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <GitCommit className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-400 font-medium">Commits</span>
          </div>
          <p className="text-xl font-bold text-white">{formatNumber(gitStats?.totalCommits || 0)}</p>
          <p className="text-xs text-gray-400">{gitStats?.activeDays || 0} active days</p>
        </div>

        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400 font-medium">Time Spent</span>
          </div>
          <p className="text-xl font-bold text-white">{formatDuration(sessionAnalytics?.totalTimeMinutes || 0)}</p>
          <p className="text-xs text-gray-400">{sessionAnalytics?.totalSessions || 0} sessions</p>
        </div>

        <div className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 border border-amber-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">This Week</span>
          </div>
          <p className="text-xl font-bold text-white">{sessionAnalytics?.sessionsThisWeek || 0}</p>
          <p className="text-xs text-gray-400">sessions</p>
        </div>
      </div>

      {/* Code Stats by Language */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <FileCode className="w-4 h-4 text-blue-400" />
          Code by Language
        </h3>
        {topLanguages.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No code files found</p>
        ) : (
          <div className="space-y-2">
            {topLanguages.map(([lang, stats]) => {
              const percentage = codeStats ? (stats.lines / codeStats.totalLines) * 100 : 0;
              return (
                <div key={lang} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">{lang}</span>
                    <span className="text-gray-400">
                      {formatNumber(stats.lines)} lines ({stats.files} files)
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-400">
          <span>Total: {formatNumber(codeStats?.totalLines || 0)} lines</span>
          <span>Code: {formatNumber(codeStats?.codeLines || 0)} | Comments: {formatNumber(codeStats?.commentLines || 0)} | Blank: {formatNumber(codeStats?.blankLines || 0)}</span>
        </div>
      </div>

      {/* Git Activity Chart */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <GitCommit className="w-4 h-4 text-purple-400" />
          Commit Activity
        </h3>
        {commitMonths.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No git history found</p>
        ) : (
          <>
            <div className="flex items-end gap-2 h-24">
              {commitMonths.map(([month, count]) => {
                const height = (count / maxCommits) * 100;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end h-20">
                      <div
                        className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${count} commits`}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {month.split('-')[1]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-400">
              <span>First commit: {formatDate(gitStats?.firstCommitDate || null)}</span>
              <span>Last commit: {formatDate(gitStats?.lastCommitDate || null)}</span>
            </div>
          </>
        )}
      </div>

      {/* Session Analytics */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-green-400" />
          Session Analytics
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-750 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{sessionAnalytics?.totalSessions || 0}</p>
            <p className="text-xs text-gray-400">Total Sessions</p>
          </div>
          <div className="bg-gray-750 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{formatDuration(sessionAnalytics?.averageSessionMinutes || 0)}</p>
            <p className="text-xs text-gray-400">Avg Session</p>
          </div>
          <div className="bg-gray-750 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{formatDuration(sessionAnalytics?.longestSessionMinutes || 0)}</p>
            <p className="text-xs text-gray-400">Longest Session</p>
          </div>
        </div>

        {/* Outcome Distribution */}
        {sessionAnalytics && Object.keys(sessionAnalytics.outcomeDistribution).length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">Outcomes</p>
            <div className="flex gap-3">
              {Object.entries(sessionAnalytics.outcomeDistribution).map(([outcome, count]) => {
                const Icon = outcome === 'success' ? CheckCircle :
                           outcome === 'blocked' ? XCircle :
                           AlertCircle;
                const colorClass = outcome === 'success' ? 'text-green-400 bg-green-900/30' :
                                  outcome === 'blocked' ? 'text-red-400 bg-red-900/30' :
                                  'text-yellow-400 bg-yellow-900/30';
                return (
                  <div
                    key={outcome}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded ${colorClass}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium capitalize">{outcome}</span>
                    <span className="text-xs opacity-70">({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Session History */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          Session History
        </h3>
        {threads.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No session history found</p>
        ) : (
          <div className="space-y-4">
            {threads.map((thread, i) => {
              // Calculate duration if timestamps exist
              let duration = '';
              if (thread.createdAt && thread.updatedAt) {
                const start = new Date(thread.createdAt).getTime();
                const end = new Date(thread.updatedAt).getTime();
                const mins = Math.round((end - start) / (1000 * 60));
                if (mins > 0 && mins < 480) {
                  duration = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
                }
              }

              return (
                <div
                  key={thread.threadId || i}
                  className="bg-gray-750 rounded-lg p-3 border-l-4 border-cyan-500"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">{thread.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {thread.date}
                        </span>
                        {duration && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {duration}
                          </span>
                        )}
                      </div>
                    </div>
                    {thread.outcome && (
                      <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                        thread.outcome === 'success' ? 'bg-green-900/50 text-green-400' :
                        thread.outcome === 'partial' ? 'bg-yellow-900/50 text-yellow-400' :
                        thread.outcome === 'blocked' ? 'bg-red-900/50 text-red-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {thread.outcome}
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  {thread.summary && (
                    <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                      {thread.summary}
                    </p>
                  )}

                  {/* Tasks Completed */}
                  {thread.tasksCompleted && thread.tasksCompleted.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-green-400 flex items-center gap-1 mb-1">
                        <ListChecks className="w-3 h-3" />
                        {thread.tasksCompleted.length} Tasks Completed
                      </p>
                      <ul className="space-y-0.5 ml-4">
                        {thread.tasksCompleted.slice(0, 5).map((task, j) => (
                          <li key={j} className="text-xs text-gray-400 flex items-start gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{task}</span>
                          </li>
                        ))}
                        {thread.tasksCompleted.length > 5 && (
                          <li className="text-xs text-gray-500 ml-4">
                            +{thread.tasksCompleted.length - 5} more tasks
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Tasks Created */}
                  {thread.tasksCreated && thread.tasksCreated.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-400 flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3" />
                        {thread.tasksCreated.length} Tasks Created
                      </p>
                      <ul className="space-y-0.5 ml-4">
                        {thread.tasksCreated.slice(0, 3).map((task, j) => (
                          <li key={j} className="text-xs text-gray-400">• {task}</li>
                        ))}
                        {thread.tasksCreated.length > 3 && (
                          <li className="text-xs text-gray-500">
                            +{thread.tasksCreated.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Screenshots Gallery */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Image className="w-4 h-4 text-pink-400" />
            Screenshots ({screenshots.length})
          </h3>
          <button
            onClick={handleAddScreenshot}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            <Upload className="w-3 h-3" />
            Add
          </button>
        </div>
        {screenshots.length === 0 ? (
          <div className="text-center py-8">
            <Image className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No screenshots yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Add screenshots to .claude/screenshots/ folder
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {screenshots.slice(0, 6).map((screenshot) => (
              <div
                key={screenshot.id}
                className="relative group cursor-pointer"
                onClick={() => setSelectedImage(screenshot)}
              >
                <img
                  src={`asset://localhost/${screenshot.path}`}
                  alt={screenshot.description || screenshot.filename}
                  className="w-full h-24 object-cover rounded-lg border border-gray-600 group-hover:border-pink-500 transition-colors"
                  onError={(e) => {
                    // Fallback for image load errors
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <span className="text-xs text-white">View</span>
                </div>
              </div>
            ))}
            {screenshots.length > 6 && (
              <div className="w-full h-24 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                +{screenshots.length - 6} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Screenshot Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={`asset://localhost/${selectedImage.path}`}
              alt={selectedImage.description || selectedImage.filename}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-2 text-center">
              <p className="text-sm text-white">{selectedImage.filename}</p>
              {selectedImage.description && (
                <p className="text-xs text-gray-400 mt-1">{selectedImage.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(selectedImage.capturedAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
