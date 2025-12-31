import { useProjectStore } from '../../stores/projectStore';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
  onSelectProject: (id: string) => void;
}

export function ProjectList({ onSelectProject }: ProjectListProps) {
  const { projects, loading, error } = useProjectStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading projects...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        Error: {error}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No projects found
      </div>
    );
  }

  // Sort by priority (high first) then by progress descending
  const sortedProjects = [...projects].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    return b.pipeline.progress - a.pipeline.progress;
  });

  return (
    <div className="p-4 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 overflow-y-auto h-full">
      {sortedProjects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={() => onSelectProject(project.id)}
        />
      ))}
    </div>
  );
}
