import React, { useEffect } from 'react';
import KanbanBoard from '../components/kanban/KanbanBoard';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      if (!useAuthStore.getState().isAuthenticated) {
        navigate('/login');
      }
    };

    verifyAuth();
  }, [checkAuth, navigate]);

  if (!isAuthenticated) {
    return <div className="text-center p-5">Checking authentication...</div>;
  }

  return <KanbanBoard />;
};

export default DashboardPage;
