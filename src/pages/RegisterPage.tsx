import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import { Container } from 'react-bootstrap';

const RegisterPage: React.FC = () => {
  return (
    <Container>
      <RegisterForm />
    </Container>
  );
};

export default RegisterPage;
