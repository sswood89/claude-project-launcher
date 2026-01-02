import type { LucideIcon } from 'lucide-react';

interface StatBoxProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'emerald' | 'purple' | 'orange';
  onClick?: () => void;
}

const colors = {
  blue: 'bg-blue-900/20 text-blue-400',
  green: 'bg-green-900/20 text-green-400',
  yellow: 'bg-yellow-900/20 text-yellow-400',
  red: 'bg-red-900/20 text-red-400',
  emerald: 'bg-emerald-900/20 text-emerald-400',
  purple: 'bg-purple-900/20 text-purple-400',
  orange: 'bg-orange-900/20 text-orange-400',
};

export function StatBox({ label, value, icon: Icon, color, onClick }: StatBoxProps) {
  const isClickable = !!onClick && value > 0;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`bg-gray-800 rounded-lg border border-gray-700 p-3 w-full text-left transition-all ${
        isClickable
          ? 'hover:bg-gray-750 hover:border-gray-600 cursor-pointer active:scale-[0.98]'
          : 'cursor-default'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
      </div>
    </button>
  );
}
