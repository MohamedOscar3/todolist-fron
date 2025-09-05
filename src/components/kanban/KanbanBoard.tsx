import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, InputGroup } from 'react-bootstrap';
import Column from './Column';
import TaskModal from './TaskModal';
import { TaskStages } from '../../types';
import type { Task, TaskStage } from '../../types';
import useTaskStore from '../../store/taskStore';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import './kanban.css';

const KanbanBoard: React.FC = () => {
  const {
    groupedTasks,
    isLoadingGrouped,
    fetchGroupedTasks,
    moveTask,
    searchTasks,
  } = useTaskStore();
  const [showModal, setShowModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Use fetchGroupedTasks instead of fetchTasks
    fetchGroupedTasks();
  }, [fetchGroupedTasks]);

  // Set up drag and drop monitoring
  useEffect(() => {
    // Set up global drag and drop monitoring
    const cleanup = monitorForElements({
      onDrop: ({ source, location }) => {
        if (!source.data) {
          return;
        }

        const data = source.data;

        if (data.type !== 'task') {
          return;
        }

        // Find the target column
        const targetElement = location.current.dropTargets[0];
        if (!targetElement || !targetElement.data) {
          return;
        }

        const targetColumnId = targetElement.data.columnId as TaskStage;
        const dropIndex = targetElement.data.index as number;
        const taskId = data.taskId as number;

        // Always call moveTask with the correct dropIndex, even if the source and target are the same
        // This ensures the position is always sent to the server
        moveTask(taskId, targetColumnId, dropIndex);
      },
    });

    return cleanup;
  }, [moveTask]);


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchTasks(query);
    } else {
      fetchGroupedTasks();
    }
  };

  // Handler for Add Task button
  const handleAddTask = () => {
    setCurrentTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentTask(null);
  };

  // Get tasks from the grouped tasks structure
  const getTasksByStage = (stage: TaskStage) => {
    return groupedTasks[stage] || [];
  };

  if (
    isLoadingGrouped &&
    !Object.values(groupedTasks).some((group: any) => group.tasks.length > 0)
  ) {
    return <div className="text-center p-5">Loading tasks...</div>;
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Kanban Board</h2>
            <Button variant="primary" onClick={handleAddTask}>
              Add Task
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <InputGroup>
            <Form.Control
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchQuery('');
                  fetchGroupedTasks();
                }}>
                Clear
              </Button>
            )}
          </InputGroup>
        </Col>
      </Row>

      <div className="kanban-board">
        <div className="kanban-columns-wrapper">
          <div className="kanban-column">
            <Column
              title="Backlog"
              stageTasks={getTasksByStage(TaskStages.BACKLOG)}
              stage={TaskStages.BACKLOG}
              onEditTask={handleEditTask}
              onDeleteTask={id => useTaskStore.getState().deleteTask(id)}
            />
          </div>
          <div className="kanban-column">
            <Column
              title="In Progress"
              stageTasks={getTasksByStage(TaskStages.IN_PROGRESS)}
              stage={TaskStages.IN_PROGRESS}
              onEditTask={handleEditTask}
              onDeleteTask={id => useTaskStore.getState().deleteTask(id)}
            />
          </div>
          <div className="kanban-column">
            <Column
              title="Review"
              stageTasks={getTasksByStage(TaskStages.REVIEW)}
              stage={TaskStages.REVIEW}
              onEditTask={handleEditTask}
              onDeleteTask={id => useTaskStore.getState().deleteTask(id)}
            />
          </div>
          <div className="kanban-column">
            <Column
              title="Done"
              stageTasks={getTasksByStage(TaskStages.DONE)}
              stage={TaskStages.DONE}
              onEditTask={handleEditTask}
              onDeleteTask={id => useTaskStore.getState().deleteTask(id)}
            />
          </div>
        </div>
      </div>


      <TaskModal show={showModal} onHide={handleCloseModal} task={currentTask} />
    </Container>
  );
};

export default KanbanBoard;
