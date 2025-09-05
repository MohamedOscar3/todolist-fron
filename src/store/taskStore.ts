import { create } from 'zustand';
import type {
  CreateTaskDto,
  Task,
  TaskStage,
  TasksState,
  UpdateTaskDto,
  TaskGroup,
} from '../types';
import { taskService } from '../services/api';
import { TaskStages } from '../types';

interface GroupedTasks {
  [key: string]: TaskGroup;
}

interface ExtendedTasksState extends TasksState {
  groupedTasks: GroupedTasks;
  isLoadingGrouped: boolean;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  fetchTasks: (page?: number) => Promise<void>;
  fetchGroupedTasks: (perPage?: number, keyword?: string) => Promise<void>;
  fetchTasksByStage: (stage: TaskStage, page?: number) => Promise<void>;
  fetchMoreTasks: () => Promise<void>;
  getTaskById: (id: number) => Promise<Task | undefined>;
  createTask: (task: CreateTaskDto) => Promise<void>;
  updateTask: (id: number, task: UpdateTaskDto) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  moveTask: (taskId: number, newStage: TaskStage, dropIndex?: number) => Promise<void>;
  searchTasks: (query: string) => Promise<void>;
}

const useTaskStore = create<ExtendedTasksState>((set, get) => ({
  tasks: [],
  groupedTasks: {
    [TaskStages.BACKLOG]: {
      name: 'BACKLOG',
      tasks: [],
      meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    },
    [TaskStages.IN_PROGRESS]: {
      name: 'IN_PROGRESS',
      tasks: [],
      meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    },
    [TaskStages.REVIEW]: {
      name: 'REVIEW',
      tasks: [],
      meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    },
    [TaskStages.DONE]: {
      name: 'DONE',
      tasks: [],
      meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    },
  },
  isLoading: false,
  isLoadingGrouped: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  hasMore: false,

  fetchTasks: async (page = 1) => {
    set({ isLoading: true });
    try {
      const response = await taskService.getAllTasks(page);
      set({
        tasks: page === 1 ? response.data : [...get().tasks, ...response.data],
        currentPage: response.meta.current_page,
        totalPages: response.meta.last_page,
        hasMore: response.meta.current_page < response.meta.last_page,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch tasks',
        isLoading: false,
      });
    }
  },

  fetchGroupedTasks: async (perPage = 10, keyword?: string) => {
    set({ isLoadingGrouped: true });
    try {
      console.log('Fetching grouped tasks with perPage:', perPage, 'keyword:', keyword);
      const response = await taskService.getAllTasksGrouped(perPage, keyword);
      console.log('API Response for grouped tasks:', response);

      // Initialize default grouped tasks structure
      const defaultGroupedTasks: GroupedTasks = {
        [TaskStages.BACKLOG]: {
          name: 'BACKLOG',
          tasks: [] as Task[],
          meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
        },
        [TaskStages.IN_PROGRESS]: {
          name: 'IN_PROGRESS',
          tasks: [] as Task[],
          meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
        },
        [TaskStages.REVIEW]: {
          name: 'REVIEW',
          tasks: [] as Task[],
          meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
        },
        [TaskStages.DONE]: {
          name: 'DONE',
          tasks: [] as Task[],
          meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
        },
      };

      if (response.success) {
        // Handle both possible API response structures
        let groupedData: GroupedTasks;

        // If the API returns a flat list of tasks, group them by stage
        if (Array.isArray(response.data)) {
          console.log('API returned a flat array of tasks, grouping by stage');
          const tasks = response.data as Task[];

          // Group tasks by stage
          tasks.forEach(task => {
            const stage = task.stage as string;
            if (!defaultGroupedTasks[stage]) {
              defaultGroupedTasks[stage] = {
                name: stage.toUpperCase(),
                tasks: [] as Task[],
                meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
              };
            }
            defaultGroupedTasks[stage].tasks.push(task);
          });

          groupedData = defaultGroupedTasks;
        } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          console.log('API returned a grouped tasks object');
          // Ensure all expected stages exist in the response
          groupedData = {
            ...defaultGroupedTasks,
            ...(response.data as GroupedTasks),
          };
        } else {
          // Fallback to default if data format is unexpected
          groupedData = defaultGroupedTasks;
        }

        console.log('Final grouped tasks data:', groupedData);
        set({
          groupedTasks: groupedData,
          isLoadingGrouped: false,
          error: null,
        });
      } else {
        console.error('Failed to fetch grouped tasks:', response.message);
        set({
          error: response.message || 'Failed to fetch grouped tasks',
          isLoadingGrouped: false,
        });
      }
    } catch (error: any) {
      console.error('Error fetching grouped tasks:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch grouped tasks',
        isLoadingGrouped: false,
      });
    }
  },

  fetchTasksByStage: async (stage: TaskStage, page = 1) => {
    set({ isLoading: true });
    try {
      const response = await taskService.getTasksByStage(stage, page);

      // Update the specific stage in groupedTasks
      const currentTasks = get().groupedTasks[stage]?.tasks || [];
      const newTasks = page === 1 ? response.data : [...currentTasks, ...response.data];

      set(state => ({
        groupedTasks: {
          ...state.groupedTasks,
          [stage]: {
            ...state.groupedTasks[stage],
            tasks: newTasks,
            meta: response.meta,
          },
        },
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || `Failed to fetch ${stage} tasks`,
        isLoading: false,
      });
    }
  },

  getTaskById: async id => {
    try {
      const response = await taskService.getTaskById(id);
      return response.data;
    } catch (error) {
      return undefined;
    }
  },

  createTask: async task => {
    set({ isLoading: true });
    try {
      const response = await taskService.createTask(task);

      // Update both tasks array and groupedTasks
      set(state => {
        const newTask = response.data;
        const stage = newTask.stage;

        return {
          tasks: [...state.tasks, newTask],
          groupedTasks: {
            ...state.groupedTasks,
            [stage]: {
              ...state.groupedTasks[stage],
              tasks: [newTask, ...state.groupedTasks[stage].tasks],
              meta: {
                ...state.groupedTasks[stage].meta,
                total: state.groupedTasks[stage].meta.total + 1,
              },
            },
          },
          isLoading: false,
        };
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create task',
        isLoading: false,
      });
    }
  },

  updateTask: async (id, task) => {
    set({ isLoading: true });
    try {
      const response = await taskService.updateTask(id, task);
      const updatedTask = response.data;

      set(state => {
        // Find the task to update
        const oldTask = state.tasks.find(t => t.id === id);
        const oldStage = oldTask?.stage;
        const newStage = updatedTask.stage;

        // Update the tasks array
        const updatedTasks = state.tasks.map(t => (t.id === id ? updatedTask : t));

        // If stage changed, we need to update both old and new stage groups
        if (oldStage && oldStage !== newStage) {
          // Remove from old stage
          const oldStageTasks = state.groupedTasks[oldStage].tasks.filter(t => t.id !== id);

          // Add to new stage
          const newStageTasks = [updatedTask, ...state.groupedTasks[newStage].tasks];

          return {
            tasks: updatedTasks,
            groupedTasks: {
              ...state.groupedTasks,
              [oldStage]: {
                ...state.groupedTasks[oldStage],
                tasks: oldStageTasks,
                meta: {
                  ...state.groupedTasks[oldStage].meta,
                  total: state.groupedTasks[oldStage].meta.total - 1,
                },
              },
              [newStage]: {
                ...state.groupedTasks[newStage],
                tasks: newStageTasks,
                meta: {
                  ...state.groupedTasks[newStage].meta,
                  total: state.groupedTasks[newStage].meta.total + 1,
                },
              },
            },
            isLoading: false,
          };
        } else {
          // Just update the task in its current stage
          return {
            tasks: updatedTasks,
            groupedTasks: {
              ...state.groupedTasks,
              [newStage]: {
                ...state.groupedTasks[newStage],
                tasks: state.groupedTasks[newStage].tasks.map(t => (t.id === id ? updatedTask : t)),
              },
            },
            isLoading: false,
          };
        }
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update task',
        isLoading: false,
      });
    }
  },

  deleteTask: async id => {
    set({ isLoading: true });
    try {
      await taskService.deleteTask(id);

      set(state => {
        // Find the task to delete
        const taskToDelete = state.tasks.find(t => t.id === id);
        const stage = taskToDelete?.stage;

        if (!stage) {
          return {
            tasks: state.tasks.filter(task => task.id !== id),
            isLoading: false,
          };
        }

        return {
          tasks: state.tasks.filter(task => task.id !== id),
          groupedTasks: {
            ...state.groupedTasks,
            [stage]: {
              ...state.groupedTasks[stage],
              tasks: state.groupedTasks[stage].tasks.filter(t => t.id !== id),
              meta: {
                ...state.groupedTasks[stage].meta,
                total: Math.max(0, state.groupedTasks[stage].meta.total - 1),
              },
            },
          },
          isLoading: false,
        };
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete task',
        isLoading: false,
      });
    }
  },

  moveTask: async (taskId, newStage, dropIndex) => {
    set({ isLoading: true });
    try {
      // Always include position/index in the update
      // Make sure dropIndex is a valid number and not undefined or null
      const position = typeof dropIndex === 'number' && !isNaN(dropIndex) ? dropIndex : 0;

      const updateData: UpdateTaskDto = {
        stage: newStage,
        index: position,
      };

      console.log(`Updating task ${taskId} with:`, JSON.stringify(updateData));
      const response = await taskService.updateTask(taskId, updateData);
      const updatedTask = response.data;

      set(state => {
        // Find the task to update
        const oldTask = state.tasks.find(t => t.id === taskId);
        const oldStage = oldTask?.stage;

        // Update the tasks array
        const updatedTasks = state.tasks.map(t => (t.id === taskId ? updatedTask : t));

        // If stage changed, we need to update both old and new stage groups
        if (oldStage && oldStage !== newStage) {
          // Remove from old stage
          const oldStageTasks = state.groupedTasks[oldStage].tasks.filter(t => t.id !== taskId);

          // Add to new stage at the specified index if provided
          let newStageTasks;
          if (
            typeof dropIndex === 'number' &&
            dropIndex >= 0 &&
            dropIndex <= state.groupedTasks[newStage].tasks.length
          ) {
            // Insert at specific position
            newStageTasks = [...state.groupedTasks[newStage].tasks];
            newStageTasks.splice(dropIndex, 0, updatedTask);
          } else {
            // Default to adding at the beginning
            newStageTasks = [updatedTask, ...state.groupedTasks[newStage].tasks];
          }

          return {
            tasks: updatedTasks,
            groupedTasks: {
              ...state.groupedTasks,
              [oldStage]: {
                ...state.groupedTasks[oldStage],
                tasks: oldStageTasks,
              },
              [newStage]: {
                ...state.groupedTasks[newStage],
                tasks: newStageTasks,
              },
            },
          };
        } else {
          // Same stage, just reorder
          const stageTasks = [...state.groupedTasks[newStage].tasks];
          // Remove the task from its current position
          const currentIndex = stageTasks.findIndex(t => t.id === taskId);
          if (currentIndex !== -1) {
            stageTasks.splice(currentIndex, 1);
          }

          // Insert at the new position
          if (typeof dropIndex === 'number' && dropIndex >= 0) {
            // If the task was removed from before the drop position, adjust the index
            const adjustedDropIndex =
              currentIndex !== -1 && currentIndex < dropIndex
                ? Math.min(dropIndex - 1, stageTasks.length)
                : Math.min(dropIndex, stageTasks.length);

            stageTasks.splice(adjustedDropIndex, 0, updatedTask);
          } else {
            // Default to adding at the beginning
            stageTasks.unshift(updatedTask);
          }

          return {
            tasks: updatedTasks,
            groupedTasks: {
              ...state.groupedTasks,
              [newStage]: {
                ...state.groupedTasks[newStage],
                tasks: stageTasks,
              },
            },
          };
        }
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to move task',
        isLoading: false,
      });
    }
  },

  searchTasks: async query => {
    set({ isLoading: true });
    try {
      await get().fetchGroupedTasks(10, query);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to search tasks',
        isLoading: false,
      });
    }
  },

  fetchMoreTasks: async () => {
    const state = get();
    set({ isLoading: true });

    try {
      console.log('Fetching more tasks for all stages');

      // Check if any stage has more pages to load
      const hasMorePages = Object.values(state.groupedTasks).some(
        group => group.meta.current_page < group.meta.last_page
      );

      if (!hasMorePages) {
        console.log('No more pages to load for any stage');
        set({
          hasMore: false,
          isLoading: false,
        });
        return;
      }

      // For each stage that has more pages, fetch the next page
      const stagesWithMorePages = Object.entries(state.groupedTasks).filter(
        ([_, group]) => group.meta.current_page < group.meta.last_page
      );

      console.log(
        'Stages with more pages:',
        stagesWithMorePages.map(([stage]) => stage)
      );

      // Fetch next page for each stage with more pages
      await Promise.all(
        stagesWithMorePages.map(async ([stage, group]) => {
          const nextPage = group.meta.current_page + 1;
          console.log(`Fetching page ${nextPage} for stage ${stage}`);

          try {
            const response = await taskService.getTasksByStage(
              stage as TaskStage,
              nextPage,
              group.meta.per_page
            );

            if (response.success && response.data) {
              set(state => ({
                groupedTasks: {
                  ...state.groupedTasks,
                  [stage]: {
                    ...state.groupedTasks[stage],
                    tasks: [...state.groupedTasks[stage].tasks, ...response.data],
                    meta: {
                      ...response.meta,
                      current_page: nextPage,
                    },
                  },
                },
              }));
            }
          } catch (error) {
            console.error(`Error fetching more tasks for stage ${stage}:`, error);
          }
        })
      );

      // Check if there are still more pages to load after this fetch
      const updatedState = get();
      const stillHasMorePages = Object.values(updatedState.groupedTasks).some(
        group => group.meta.current_page < group.meta.last_page
      );

      set({
        hasMore: stillHasMorePages,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Error in fetchMoreTasks:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch more tasks',
        isLoading: false,
      });
    }
  },
}));

export default useTaskStore;
