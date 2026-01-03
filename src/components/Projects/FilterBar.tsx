import { useState } from 'react';
import { Filter } from 'lucide-react';
import type { ProjectStatus, StatusFilter } from '../../types';

interface FilterBarProps {
  statusFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  selectedStatuses: ProjectStatus[];
  onStatusToggle: (status: ProjectStatus) => void;
  archivedCount: number;
}

// Status configuration with labels and colors
const STATUS_CONFIG: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'in-progress', label: 'In Progress', color: 'yellow' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'live', label: 'Live', color: 'emerald' },
  { value: 'backlog', label: 'Backlog', color: 'gray' },
  { value: 'paused', label: 'Paused', color: 'orange' },
  { value: 'onhold', label: 'On Hold', color: 'amber' },
  { value: 'completed', label: 'Completed', color: 'emerald' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'archived', label: 'Archived', color: 'gray' },
];

// Preset filter options
type PresetFilter = 'all' | 'hide-archived' | 'active-only' | 'custom';

const presetOptions: { value: PresetFilter; label: string }[] = [
  { value: 'hide-archived', label: 'Hide Archived' },
  { value: 'active-only', label: 'Active Only' },
  { value: 'all', label: 'Show All' },
  { value: 'custom', label: 'Custom...' },
];

export function FilterBar({
  statusFilter,
  onFilterChange,
  selectedStatuses,
  onStatusToggle,
  archivedCount
}: FilterBarProps) {
  const [showCustom, setShowCustom] = useState(Array.isArray(statusFilter));

  // Determine current preset or custom mode
  const currentPreset = Array.isArray(statusFilter) ? 'custom' : statusFilter;

  const handlePresetChange = (preset: PresetFilter) => {
    if (preset === 'custom') {
      setShowCustom(true);
      // Initialize with current visible statuses if switching to custom
      if (!Array.isArray(statusFilter)) {
        // Default custom selection based on current filter
        const defaultStatuses: ProjectStatus[] = statusFilter === 'all'
          ? STATUS_CONFIG.map(s => s.value)
          : statusFilter === 'active-only'
            ? ['in-progress', 'active', 'live']
            : STATUS_CONFIG.filter(s => s.value !== 'archived').map(s => s.value);
        onFilterChange(defaultStatuses);
      }
    } else {
      setShowCustom(false);
      onFilterChange(preset as StatusFilter);
    }
  };

  return (
    <div className="space-y-2">
      {/* Preset filters row */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400 flex items-center gap-1">
          <Filter className="w-4 h-4" />
          Filter:
        </span>
        <div className="flex gap-1">
          {presetOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handlePresetChange(option.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                currentPreset === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {archivedCount > 0 && currentPreset !== 'all' && currentPreset !== 'custom' && (
          <span className="text-sm text-gray-500">
            ({archivedCount} archived hidden)
          </span>
        )}
      </div>

      {/* Custom status toggles */}
      {showCustom && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
          {STATUS_CONFIG.map(({ value, label, color }) => {
            const isSelected = selectedStatuses.includes(value);
            return (
              <button
                key={value}
                onClick={() => onStatusToggle(value)}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  isSelected
                    ? `bg-${color}-600/30 text-${color}-400 border border-${color}-500`
                    : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                  isSelected ? `bg-${color}-500` : 'bg-gray-600'
                }`} />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
