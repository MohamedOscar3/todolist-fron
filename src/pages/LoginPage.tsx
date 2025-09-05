import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { Container } from 'react-bootstrap';

const LoginPage: React.FC = () => {
  return (
    <Container>
      <LoginForm />
    </Container>
  );
};

export default LoginPage;
