'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import React, { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Row,
  Stack,
} from 'react-bootstrap';
import {
  ArrowLeft,
  ArrowRight,
  Envelope,
  Lock,
} from 'react-bootstrap-icons';

/** The sign in page. */
const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    // Redirect to dashboard on success
    const result = await signIn('credentials', {
      callbackUrl: '/dashboard',
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      console.error('Sign in failed: ', result.error);
      const errorMessage = result.error === 'CredentialsSignin'
        ? 'Invalid email or password.'
        : 'Sign in failed. Please try again.';
      setError(errorMessage);
    } else if (result?.ok) {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Container className="py-4 py-md-5 flex-grow-1 d-flex flex-column">
        <Row className="justify-content-center">
          <Col md={10} lg={8} xl={6}>
            <Card className="shadow-sm border-light rounded-4">
              <Card.Body className="p-4 p-md-5">
                <Stack direction="horizontal" gap={3} className="mb-4 align-items-center">
                  <Card.Title as="h2" className="h4 mb-0 fw-bold">
                    Welcome Back
                  </Card.Title>
                </Stack>

                <Form onSubmit={handleSubmit}>
                  <Stack gap={3}>
                    {error && (
                      <div className="alert alert-danger small py-2" role="alert">
                        {error}
                      </div>
                    )}
                    <Form.Group controlId="loginEmail">
                      <Form.Label>
                        Email Address
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Envelope /></InputGroup.Text>
                        <Form.Control
                          type="email"
                          placeholder="your.email@hawaii.edu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </InputGroup>
                    </Form.Group>

                    <Form.Group controlId="loginPassword">
                      <Form.Label>
                        Password
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Lock /></InputGroup.Text>
                        <Form.Control
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </InputGroup>
                    </Form.Group>

                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Check
                        type="checkbox"
                        id="rememberMe"
                        label="Remember me"
                        disabled={isLoading}
                      />
                      <Link href="/auth/change-password" className="text-decoration-none">
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      variant="success"
                      size="lg"
                      className="w-100"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in...' : (
                        <>
                          Sign In
                          {' '}
                          <ArrowRight className="ms-1" />
                        </>
                      )}
                    </Button>

                    <div className="text-center mt-2">
                      <Link
                        href="/signup/step1"
                        className="text-muted small text-decoration-none"
                      >
                        <ArrowLeft className="me-1" size={12} />
                        {' '}
                        Create an account
                      </Link>
                    </div>
                  </Stack>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SignIn;
