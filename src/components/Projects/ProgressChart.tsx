import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { Thread } from '../../types';

interface ProgressChartProps {
  threads: Thread[];
  currentProgress: number;
}

export function ProgressChart({ threads, currentProgress }: ProgressChartProps) {
  // Calculate metrics from threads
  const totalTasksCompleted = threads.reduce((sum, t) => sum + t.tasksCompleted.length, 0);
  const totalTasksCreated = threads.reduce((sum, t) => sum + t.tasksCreated.length, 0);
  const totalSessions = threads.length;

  // Calculate velocity (tasks completed per session)
  const velocity = totalSessions > 0 ? (totalTasksCompleted / totalSessions).toFixed(1) : '0';

  // Calculate burndown ratio
  const burndownRatio = totalTasksCreated > 0
    ? ((totalTasksCompleted / totalTasksCreated) * 100).toFixed(0)
    : totalTasksCompleted > 0 ? '100' : '0';

  // Get recent sessions for mini chart (last 10)
  const recentSessions = threads.slice(-10);
  const maxTasks = Math.max(
    ...recentSessions.map(t => Math.max(t.tasksCompleted.length, t.tasksCreated.length)),
    1
  );

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4" />
        Progress Tracking
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-gray-900 rounded-lg">
          <p className="text-lg font-bold text-blue-400">{currentProgress}%</p>
          <p className="text-xs text-gray-500">Progress</p>
        </div>
        <div className="text-center p-2 bg-gray-900 rounded-lg">
          <p className="text-lg font-bold text-green-400">{totalTasksCompleted}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="text-center p-2 bg-gray-900 rounded-lg">
          <p className="text-lg font-bold text-yellow-400">{totalTasksCreated}</p>
          <p className="text-xs text-gray-500">Created</p>
        </div>
        <div className="text-center p-2 bg-gray-900 rounded-lg">
          <p className="text-lg font-bold text-purple-400">{velocity}</p>
          <p className="text-xs text-gray-500">Velocity</p>
        </div>
      </div>

      {/* Burndown Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Burndown Rate</span>
          <span className={`text-xs font-medium flex items-center gap-1 ${
            Number(burndownRatio) >= 100 ? 'text-green-400' :
            Number(burndownRatio) >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {Number(burndownRatio) >= 100 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {burndownRatio}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              Number(burndownRatio) >= 100 ? 'bg-green-500' :
              Number(burndownRatio) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(Number(burndownRatio), 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {Number(burndownRatio) >= 100
            ? 'Completing more tasks than creating - great progress!'
            : Number(burndownRatio) >= 50
            ? 'Making progress, but scope is growing'
            : 'Task creation outpacing completion'}
        </p>
      </div>

      {/* Mini Session Chart */}
      {recentSessions.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Recent Sessions</p>
          <div className="flex items-end gap-1 h-16">
            {recentSessions.map((session, i) => {
              const completedHeight = (session.tasksCompleted.length / maxTasks) * 100;
              const createdHeight = (session.tasksCreated.length / maxTasks) * 100;

              return (
                <div key={session.threadId || i} className="flex-1 flex gap-0.5" title={session.title}>
                  <div
                    className="flex-1 bg-green-500/50 rounded-t"
                    style={{ height: `${completedHeight}%` }}
                  />
                  <div
                    className="flex-1 bg-yellow-500/50 rounded-t"
                    style={{ height: `${createdHeight}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500/50 rounded" /> Completed
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500/50 rounded" /> Created
            </span>
          </div>
        </div>
      )}

      {recentSessions.length === 0 && (
        <p className="text-sm text-gray-500 italic text-center py-4">
          No session data yet. Start logging sessions to track progress!
        </p>
      )}
    </div>
  );
}
