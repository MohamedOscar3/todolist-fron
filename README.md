# Todo List Application

A modern Kanban-style Todo List application built with React, TypeScript, Zustand, and React Query.

## Features

- User authentication (Register/Login)
- Kanban-style dashboard with 4 columns (Backlog, In Progress, Review, Done)
- Drag-and-drop task movement between columns
- Create, update, and delete tasks
- Search tasks by title/description
- Responsive design with Bootstrap

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **State Management**: Zustand
- **Data Fetching**: React Query
- **UI Framework**: Bootstrap
- **Routing**: React Router
- **Drag and Drop**: React Beautiful DnD

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API server running (Laravel)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd todo-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
The application uses environment variables for configuration. Create a `.env` file in the root directory with the following content:
```
VITE_API_URL=http://localhost:8000/api
```

You can also create environment-specific files:
- `.env.development` for development environment
- `.env.production` for production environment

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── assets/        # Static assets
├── components/    # Reusable components
│   ├── auth/      # Authentication components
│   ├── common/    # Common UI components
│   └── kanban/    # Kanban board components
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── services/      # API services
├── store/         # Zustand stores
├── types/         # TypeScript types and interfaces
└── utils/         # Utility functions
```

## API Integration

This frontend application is designed to work with a Laravel backend API. Make sure your backend provides the following endpoints:

- Authentication: `/api/login`, `/api/register`, `/api/logout`
- Tasks: `/api/tasks`, `/api/tasks/{id}`, `/api/tasks/search`

## License

This project is licensed under the MIT License.
