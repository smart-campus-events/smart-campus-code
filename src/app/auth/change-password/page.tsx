'use client';

import { useState } from 'react';
import swal from 'sweetalert';
import { Card, Col, Container, Button, Form, Row } from 'react-bootstrap';
import LoadingSpinner from '@/components/LoadingSpinner';

type ChangePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ChangePasswordPage = () => {
  const [formState, setFormState] = useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // To display form errors

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value,
    }));
    setError(null); // Clear error on change
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Basic client-side validation
    if (formState.newPassword !== formState.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (formState.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formState.currentPassword,
          newPassword: formState.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Use message from API response if available, otherwise generic error
        throw new Error(result.message || `Error: ${response.statusText}`);
      }

      // Success
      swal('Success', 'Password changed successfully!', 'success');
      setFormState({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Clear form
    } catch (err: any) {
      console.error('Change password error:', err);
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage); // Display error message near the form
      swal('Error', errorMessage, 'error'); // Also show in popup
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Header as="h4">Change Password</Card.Header>
            <Card.Body>
              <Form noValidate onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="currentPassword">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={formState.currentPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="newPassword">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={formState.newPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="confirmPassword">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formState.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </Form.Group>
                {error && <p className="text-danger small mb-3">{error}</p>}
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? <LoadingSpinner /> : 'Change Password'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ChangePasswordPage;
