import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, Badge, Spinner } from 'react-bootstrap';
import TaskCard from './TaskCard';
import type { Task, TaskStage, TaskGroup } from '../../types';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import useTaskStore from '../../store/taskStore';

interface ColumnProps {
  title: string;
  stageTasks: TaskGroup;
  stage: TaskStage;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: number) => void;
}

const Column: React.FC<ColumnProps> = ({ title, stageTasks, stage, onEditTask, onDeleteTask }) => {
  const columnRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Use a ref to store the current drop index so it's accessible in the getData callback
  const dropIndicatorIndexRef = useRef<number | null>(null);
  // Ref to track the last loaded page to prevent duplicate requests
  const lastLoadedPageRef = useRef<number>(1);
  // Ref to debounce scroll events
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { fetchTasksByStage, isLoading } = useTaskStore();
  const tasks = stageTasks.tasks;
  const meta = stageTasks.meta;
  const hasMorePages = meta.current_page < meta.last_page;
  // Function to calculate drop position based on mouse Y coordinate
  const calculateDropPosition = (clientY: number) => {
    if (!columnRef.current) return;

    const taskCards = Array.from(columnRef.current.querySelectorAll('.task-card') || []);

    // If there are no tasks, set the drop index to 0
    if (taskCards.length === 0) {
      setDropIndicatorIndex(0);
      dropIndicatorIndexRef.current = 0;
      return;
    }

    // Check if we're above the first task
    const firstCard = taskCards[0];
    const firstCardRect = firstCard.getBoundingClientRect();

    if (clientY < firstCardRect.top) {
      // Drop at the beginning
      setDropIndicatorIndex(0);
      dropIndicatorIndexRef.current = 0;
      return;
    }

    // Check if we're below the last task
    const lastCard = taskCards[taskCards.length - 1];
    const lastCardRect = lastCard.getBoundingClientRect();

    if (clientY > lastCardRect.bottom) {
      // Drop at the end
      const endIndex = taskCards.length;
      setDropIndicatorIndex(endIndex);
      dropIndicatorIndexRef.current = endIndex;
      return;
    }

    // Find the closest position between tasks
    let dropIndex = 0;

    for (let i = 0; i < taskCards.length; i++) {
      const card = taskCards[i];
      const rect = card.getBoundingClientRect();
      const cardMiddleY = rect.top + rect.height / 2;

      if (clientY < cardMiddleY) {
        dropIndex = i;
        break;
      } else {
        dropIndex = i + 1;
      }
    }

    // Update both the state and the ref
    console.log('Setting drop index to:', dropIndex, 'for stage:', stage);
    setDropIndicatorIndex(dropIndex);
    dropIndicatorIndexRef.current = dropIndex;
  };

  useEffect(() => {
    if (!columnRef.current) return undefined;

    const element = columnRef.current;

    // Add mouse move listener to track position during drag
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault(); // Allow drop
      if (isDraggingOver) {
        calculateDropPosition(e.clientY);
      }
    };

    element.addEventListener('dragover', handleDragOver);

    const dropTargetCleanup = dropTargetForElements({
      element: columnRef.current,
      getData: () => {
        // Always return the most current drop index
        const dropIndex = dropIndicatorIndexRef.current ?? tasks.length;
        console.log(
          'Column getData called for stage:',
          stage,
          'dropIndex:',
          dropIndex,
          'ref value:',
          dropIndicatorIndexRef.current
        );
        return { columnId: stage, dropIndex };
      },
      onDragEnter: () => {
        setIsDraggingOver(true);
      },
      onDragLeave: () => {
        setIsDraggingOver(false);
        setDropIndicatorIndex(null);
        dropIndicatorIndexRef.current = null;
      },
      onDrop: () => {
        // Reset visual state - the actual drop handling is done in KanbanBoard monitor
        setIsDraggingOver(false);
        setDropIndicatorIndex(null);
        // Don't reset dropIndicatorIndexRef here - let the monitor access it
      },
    });

    return () => {
      element.removeEventListener('dragover', handleDragOver);
      dropTargetCleanup();
    };
  }, [isDraggingOver, tasks.length, stage, calculateDropPosition]);

  // Column-specific infinite scroll handler with debouncing
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isLoadingMore || !hasMorePages || isLoading) {
      return;
    }

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounce the scroll event
    scrollTimeoutRef.current = setTimeout(async () => {
      if (!scrollContainerRef.current || isLoadingMore || !hasMorePages || isLoading) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      const nextPage = meta.current_page + 1;

      // Trigger load more when scrolled to 90% of the content
      // Also check if we haven't already loaded this page
      if (scrollPercentage > 0.9 && nextPage > lastLoadedPageRef.current) {
        setIsLoadingMore(true);
        lastLoadedPageRef.current = nextPage;

        try {
          console.log(`Loading more tasks for ${stage}, page ${nextPage}`);
          await fetchTasksByStage(stage, nextPage);
        } catch (error) {
          console.error(`Error loading more tasks for ${stage}:`, error);
          // Reset the last loaded page on error so it can be retried
          lastLoadedPageRef.current = nextPage - 1;
        } finally {
          setIsLoadingMore(false);
        }
      }
    }, 300); // 300ms debounce
  }, [stage, meta.current_page, hasMorePages, isLoadingMore, isLoading, fetchTasksByStage]);

  // Update last loaded page when meta changes
  useEffect(() => {
    lastLoadedPageRef.current = meta.current_page;
  }, [meta.current_page]);

  // Add scroll event listener to the column
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      // Clear timeout on cleanup
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  return (
    <Card className="kanban-column-card">
      <Card.Header className="d-flex justify-content-between align-items-center column-header">
        <h5 className="mb-0">{title}</h5>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="secondary" pill className="task-count">
            {tasks.length}
          </Badge>
          <Badge bg="primary" pill className="total-count">
            {meta.total}
          </Badge>
        </div>
      </Card.Header>
      <div
        ref={scrollContainerRef}
        className={`task-column-content ${isDraggingOver ? 'dragging-over' : ''}`}
        data-column-id={stage}
        style={{
          maxHeight: '70vh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
        <div ref={columnRef}>
          {tasks.length === 0 ? (
            <div className="empty-column-placeholder">
              <p>No tasks</p>
              <p className="text-muted small">Drag tasks here</p>
            </div>
          ) : (
            <>
              {tasks.map((task, index) => {
                // Show drop indicator before this item if needed
                const showIndicatorBefore = dropIndicatorIndex === index;

                return (
                  <React.Fragment key={`fragment-${task.id}`}>
                    {showIndicatorBefore && <div className="drop-indicator" />}
                    <TaskCard
                      key={`task-${task.id}`}
                      task={task}
                      index={task.index ?? 0}
                      columnId={stage}
                      onEdit={() => onEditTask(task)}
                      onDelete={() => onDeleteTask(task.id)}
                    />
                  </React.Fragment>
                );
              })}

              {/* Show indicator at the end if needed */}
              {dropIndicatorIndex === tasks.length && <div className="drop-indicator" />}

              {/* Loading indicator for column infinite scroll */}
              {isLoadingMore && (
                <div className="d-flex justify-content-center py-3">
                  <Spinner animation="border" size="sm" />
                  <span className="ms-2 small">Loading page {meta.current_page + 1}...</span>
                </div>
              )}

              {/* End of list indicator */}
              {!hasMorePages && tasks.length > 0 && (
                <div className="text-center py-2 text-muted small">
                  All {meta.total} tasks loaded
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default Column;
