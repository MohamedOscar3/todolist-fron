import React, { useRef } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import type { Task, TaskStage } from '../../types';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  columnId: string; // Column ID for drag and drop context
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index, onEdit, onDelete, columnId }) => {
  const getStageBadgeColor = (stage: TaskStage) => {
    switch (stage) {
      case 'backlog':
        return 'secondary';
      case 'in_progress':
        return 'primary';
      case 'review':
        return 'warning';
      case 'done':
        return 'success';
      default:
        return 'info';
    }
  };

  // Create a unique ID for this task
  const taskId = `task-${task.id.toString()}`;
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Set up draggable behavior
  React.useEffect(() => {
    if (!cardRef.current) return;
    
    const cleanup = draggable({
      element: cardRef.current,
      dragHandle: cardRef.current,
      getInitialData: () => {
        return {
          taskId: task.id,
          type: 'task',
          index,
          sourceColumnId: columnId,
          task: task
        };
      }
    });
    
    return cleanup;
  }, [task.id, index, columnId, task]);
  
  return (
    <div
      ref={cardRef}
      className={`task-card`}
      data-task-id={taskId}
    >
      <Card.Body>
        <div className="task-card-header">
          <h5 className="task-title">{task.title}</h5>
          <Badge bg={getStageBadgeColor(task.stage)} className="task-badge">
            {task.stage.replace('_', ' ')}
          </Badge>
        </div>

        <div className="task-description">
          {task.description.length > 80
            ? `${task.description.substring(0, 80)}...`
            : task.description}
        </div>

        <div className="task-actions">
          <Button
            variant="outline-primary"
            size="sm"
            className="task-button"
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              onEdit();
            }}>
            Edit
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            className="task-button"
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              onDelete();
            }}>
            Delete
          </Button>
        </div>
      </Card.Body>
    </div>
  );
};

export default TaskCard;
