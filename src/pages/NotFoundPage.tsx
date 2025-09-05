import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';

const NotFoundPage: React.FC = () => {
  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="text-center">
        <Alert variant="warning">
          <Alert.Heading>Page Not Found</Alert.Heading>
          <p>The page you are looking for does not exist.</p>
        </Alert>
        <Button variant="primary" onClick={() => window.location.href = '/'}>
          Go to Home
        </Button>
      </div>
    </Container>
  );
};

export default NotFoundPage;
