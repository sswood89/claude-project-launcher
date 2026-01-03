import { useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useProjectStore } from '../../stores/projectStore';
import { ProjectCard } from './ProjectCard';
import { ProjectListItem } from './ProjectListItem';
import { SortableProjectCard } from './SortableProjectCard';
import { ViewToggle } from './ViewToggle';
import { FilterBar } from './FilterBar';
import type { ClaudeProject } from '../../types';

interface ProjectListProps {
  onSelectProject: (id: string) => void;
}

export function ProjectList({ onSelectProject }: ProjectListProps) {
  const {
    projects,
    loading,
    error,
    viewMode,
    statusFilter,
    selectedStatuses,
    setViewMode,
    setStatusFilter,
    toggleStatus,
    getFilteredProjects,
    updateProjectOrder,
  } = useProjectStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [localProjects, setLocalProjects] = useState<ClaudeProject[]>([]);

  // Sync localProjects with projects from store
  useMemo(() => {
    setLocalProjects(projects);
  }, [projects]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get active project for drag overlay
  const activeProject = activeId ? localProjects.find(p => p.id === activeId) : null;

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find projects
    const activeProject = localProjects.find(p => p.id === activeId);
    const overProject = localProjects.find(p => p.id === overId);

    if (!activeProject || !overProject) return;

    const fromStatus = activeProject.status;
    const toStatus = overProject.status;

    // Optimistically update local state
    setLocalProjects(prev => {
      const updated = [...prev];
      const activeIndex = updated.findIndex(p => p.id === activeId);

      if (activeIndex !== -1) {
        if (fromStatus === toStatus) {
          // Same status - reorder within group
          const statusProjects = updated.filter(p => p.status === fromStatus);
          const oldIndex = statusProjects.findIndex(p => p.id === activeId);
          const newIndex = statusProjects.findIndex(p => p.id === overId);

          if (oldIndex !== -1 && newIndex !== -1) {
            const reordered = arrayMove(statusProjects, oldIndex, newIndex);
            let reorderIdx = 0;
            return updated.map(p => {
              if (p.status === fromStatus) {
                return reordered[reorderIdx++];
              }
              return p;
            });
          }
        } else {
          // Different status - update project status
          updated[activeIndex] = { ...updated[activeIndex], status: toStatus };
        }
      }
      return updated;
    });

    // Persist order to backend
    try {
      const order = {
        backlog: localProjects.filter(p => p.status === 'backlog').map(p => p.id),
        'in-progress': localProjects.filter(p => p.status === 'in-progress').map(p => p.id),
        active: localProjects.filter(p => p.status === 'active').map(p => p.id),
        live: localProjects.filter(p => p.status === 'live').map(p => p.id),
        paused: localProjects.filter(p => p.status === 'paused').map(p => p.id),
        onhold: localProjects.filter(p => p.status === 'onhold').map(p => p.id),
        completed: localProjects.filter(p => p.status === 'completed').map(p => p.id),
        cancelled: localProjects.filter(p => p.status === 'cancelled').map(p => p.id),
        archived: localProjects.filter(p => p.status === 'archived').map(p => p.id),
      };
      await updateProjectOrder(order);
    } catch (error) {
      console.error('Failed to persist order:', error);
      // Revert on error
      setLocalProjects(projects);
    }
  }, [localProjects, projects, updateProjectOrder]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Get filtered and sorted projects
  const displayProjects = useMemo(() => {
    const filtered = getFilteredProjects();

    // Sort by priority (high first) then by progress descending
    return [...filtered].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      return b.pipeline.progress - a.pipeline.progress;
    });
  }, [getFilteredProjects]);

  // Count archived for display
  const archivedCount = projects.filter(p => p.status === 'archived').length;

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

  // Get sorting strategy based on view mode
  const sortingStrategy = viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy;
  const projectIds = displayProjects.map(p => p.id);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-700">
        <FilterBar
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
          selectedStatuses={selectedStatuses}
          onStatusToggle={toggleStatus}
          archivedCount={archivedCount}
        />
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Project List with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {displayProjects.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            No projects match the current filter
          </div>
        ) : (
          <SortableContext items={projectIds} strategy={sortingStrategy}>
            <div className={
              viewMode === 'list'
                ? 'p-4 space-y-2 overflow-y-auto flex-1'
                : 'p-4 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 overflow-y-auto flex-1'
            }>
              {displayProjects.map((project) => (
                <SortableProjectCard
                  key={project.id}
                  project={project}
                  viewMode={viewMode}
                  onClick={() => onSelectProject(project.id)}
                />
              ))}
            </div>
          </SortableContext>
        )}

        <DragOverlay>
          {activeProject ? (
            <div className="opacity-90">
              {viewMode === 'list' ? (
                <ProjectListItem
                  project={activeProject}
                  onClick={() => {}}
                />
              ) : (
                <ProjectCard
                  project={activeProject}
                  onClick={() => {}}
                />
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
