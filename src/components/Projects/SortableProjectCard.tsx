'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ClaudeProject, ViewMode } from '../../types';
import { ProjectCard } from './ProjectCard';
import { ProjectListItem } from './ProjectListItem';

interface SortableProjectCardProps {
  project: ClaudeProject;
  viewMode: ViewMode;
  onClick: () => void;
}

export function SortableProjectCard({ project, viewMode, onClick }: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 scale-102' : ''} ${project.status === 'archived' ? 'opacity-60 grayscale-[30%] hover:opacity-100 hover:grayscale-0 transition-all' : ''}`}
    >
      {viewMode === 'list' ? (
        <ProjectListItem project={project} onClick={onClick} />
      ) : (
        <ProjectCard project={project} onClick={onClick} />
      )}
    </div>
  );
}
