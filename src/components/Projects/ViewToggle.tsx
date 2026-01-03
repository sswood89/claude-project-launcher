import { LayoutGrid, List } from 'lucide-react';
import type { ViewMode } from '../../types';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1">
      <button
        onClick={() => onViewModeChange('card')}
        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
          viewMode === 'card'
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
        aria-pressed={viewMode === 'card'}
        aria-label="Card view"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
          viewMode === 'list'
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
        aria-pressed={viewMode === 'list'}
        aria-label="List view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
