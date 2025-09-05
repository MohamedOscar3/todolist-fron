import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import type { Task, TaskStage, CreateTaskDto, UpdateTaskDto } from '../../types';
import { TaskStages } from '../../types';
import useTaskStore from '../../store/taskStore';

interface TaskModalProps {
  show: boolean;
  onHide: () => void;
  task: Task | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ show, onHide, task }) => {
  const { createTask, updateTask } = useTaskStore();
  const [formData, setFormData] = useState<CreateTaskDto>({
    title: '',
    description: '',
    stage: TaskStages.BACKLOG,
  });
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        stage: task.stage,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        stage: TaskStages.BACKLOG,
      });
    }
    setValidated(false);
  }, [task, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    try {
      if (task) {
        // Update existing task
        const updateData: UpdateTaskDto = {
          title: formData.title,
          description: formData.description,
          stage: formData.stage as TaskStage,
        };
        await updateTask(task.id, updateData);
      } else {
        // Create new task
        await createTask(formData);
      }
      onHide();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{task ? 'Edit Task' : 'Add New Task'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="taskTitle">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter task title"
            />
            <Form.Control.Feedback type="invalid">
              Please provide a title.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="taskDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Enter task description"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="taskStage">
            <Form.Label>Stage</Form.Label>
            <Form.Select
              name="stage"
              value={formData.stage}
              onChange={handleChange}
              required
            >
              <option value={TaskStages.BACKLOG}>Backlog</option>
              <option value={TaskStages.IN_PROGRESS}>In Progress</option>
              <option value={TaskStages.REVIEW}>Review</option>
              <option value={TaskStages.DONE}>Done</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {task ? 'Update' : 'Create'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TaskModal;
