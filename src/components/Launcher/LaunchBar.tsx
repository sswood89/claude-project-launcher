import { Globe, Smartphone, Monitor, Terminal } from 'lucide-react';
import type { ClaudeProject, LaunchType } from '../../types';
import { detectLaunchCapabilities } from '../../utils/launchDetection';
import { useProjectStore } from '../../stores/projectStore';
import toast from 'react-hot-toast';

interface LaunchBarProps {
  project: ClaudeProject;
}

interface LaunchButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'ios' | 'android';
}

function LaunchButton({ icon: Icon, label, onClick, disabled, variant = 'default' }: LaunchButtonProps) {
  const baseClasses = "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    default: "bg-gray-700 hover:bg-gray-600 text-gray-200",
    ios: "bg-blue-900/30 hover:bg-blue-900/50 text-blue-400",
    android: "bg-green-900/30 hover:bg-green-900/50 text-green-400",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
      title={label}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function LaunchBar({ project }: LaunchBarProps) {
  const { launchProject } = useProjectStore();
  const capabilities = detectLaunchCapabilities(project);

  const handleLaunch = async (type: LaunchType) => {
    try {
      await launchProject(project, type);
      toast.success(`Launched ${type} for ${project.name}`);
    } catch (err) {
      toast.error(`Failed to launch: ${String(err)}`);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Browser */}
      <LaunchButton
        icon={Globe}
        label="Browser"
        onClick={() => handleLaunch('browser')}
        disabled={!capabilities.hasBrowser}
      />

      {/* iOS Simulator */}
      <LaunchButton
        icon={Smartphone}
        label="iOS"
        onClick={() => handleLaunch('ios')}
        disabled={!capabilities.hasIos}
        variant="ios"
      />

      {/* Android Emulator */}
      <LaunchButton
        icon={Smartphone}
        label="Android"
        onClick={() => handleLaunch('android')}
        disabled={!capabilities.hasAndroid}
        variant="android"
      />

      {/* VS Code */}
      <LaunchButton
        icon={Monitor}
        label="VS Code"
        onClick={() => handleLaunch('vscode')}
      />

      {/* Terminal */}
      <LaunchButton
        icon={Terminal}
        label="Terminal"
        onClick={() => handleLaunch('terminal')}
      />
    </div>
  );
}
