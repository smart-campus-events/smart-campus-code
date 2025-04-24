'use client';

import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Form, Button, InputGroup,
  Stack, Image, Alert, Spinner,
} from 'react-bootstrap';
import { Envelope, Lock, Google } from 'react-bootstrap-icons';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router

// TODO: Implement proper form validation (e.g., yup/zod with react-hook-form)
// TODO: Link to actual Forgot Password page
// TODO: Handle errors from API calls and Google Sign-In more gracefully

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setGoogleError(null);

    console.log('Login attempt:', { email });

    try {
      const result = await signIn('credentials', {
        redirect: false, // Handle redirect manually based on result
        email, // Use property shorthand
        password, // Use property shorthand
      });

      if (result?.error) {
        // Handle authentication errors (e.g., invalid credentials)
        setSubmitError(result.error || 'Invalid email or password.');
        setIsSubmitting(false);
      } else if (result?.ok) {
        // Successful login
        console.log('Login successful!');
        // Redirect to dashboard or desired page
        router.push('/dashboard'); // Adjust the target route as needed
      } else {
        // Other unexpected issues
        setSubmitError('An unexpected error occurred during login.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Login failed:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    setSubmitError(null);
    try {
      // Redirect to Google sign-in page, NextAuth handles the rest
      await signIn('google', {
        callbackUrl: '/dashboard', // Redirect after successful Google login
        redirect: true, // Let NextAuth handle the redirect
      });
      // Note: If redirect is true, code below this line in the try block
      // might not execute if the redirect happens immediately.
    } catch (err) {
      console.error('Google sign in failed:', err);
      // Provide more specific error message if possible, else generic
      const genericError = 'An unexpected error occurred during Google sign in.';
      const message = typeof err === 'string' ? err : genericError;
      setGoogleError(message);
      setIsGoogleLoading(false); // Only reached if signIn throws an error before redirecting
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Container className="py-4 py-md-5 flex-grow-1 d-flex align-items-center justify-content-center">
        <Row className="justify-content-center w-100">
          <Col md={8} lg={6} xl={5}>
            <Card className="shadow-sm border-light rounded-4">
              <Card.Body className="p-4 p-md-5">
                <Stack
                  direction="horizontal"
                  gap={3}
                  className="mb-4 align-items-center justify-content-center"
                >
                  <Image
                    src="https://storage.googleapis.com/uxpilot-auth.appspot.com/d8899fadb3-5df15300b4c172c2ef67.png"
                    alt="Manoa Compass Logo"
                    style={{ width: '40px', height: 'auto' }}
                  />
                  <Card.Title as="h1" className="h3 mb-0 fw-bold text-center">
                    Welcome Back!
                  </Card.Title>
                </Stack>

                <div className="text-center mb-4">
                  <Button
                    variant="outline-primary"
                    onClick={handleGoogleLogin}
                    className="w-100"
                    disabled={isGoogleLoading || isSubmitting}
                  >
                    {isGoogleLoading ? (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                    ) : (
                      <Google className="me-2" />
                    )}
                    {isGoogleLoading ? 'Processing...' : 'Log in with Google'}
                  </Button>
                  {googleError && (
                    <Alert variant="danger" className="mt-3 small py-2">
                      {googleError}
                    </Alert>
                  )}
                  <div className="mt-3">
                    <span className="text-muted small">or log in with your email</span>
                  </div>
                </div>

                <Form onSubmit={handleSubmit}>
                  {submitError && (
                    <Alert variant="danger" className="mb-3 small py-2">
                      {submitError}
                    </Alert>
                  )}
                  <Stack gap={3}>
                    <Form.Group controlId="loginEmail">
                      <Form.Label className="small fw-medium">Email Address</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Envelope /></InputGroup.Text>
                        <Form.Control
                          type="email"
                          placeholder="your.email@hawaii.edu" // Use email as username
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isSubmitting || isGoogleLoading}
                          autoComplete="email"
                        />
                      </InputGroup>
                    </Form.Group>

                    <Form.Group controlId="loginPassword">
                      <Form.Label className="small fw-medium">Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Lock /></InputGroup.Text>
                        <Form.Control
                          type="password"
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isSubmitting || isGoogleLoading}
                          autoComplete="current-password"
                        />
                      </InputGroup>
                      <div className="text-end mt-1">
                        <Link href="/forgot-password" passHref legacyBehavior>
                          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                          <a className="text-decoration-none small">Forgot password?</a>
                        </Link>
                      </div>
                    </Form.Group>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 mt-3"
                      disabled={isSubmitting || isGoogleLoading}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Logging in...
                        </>
                      ) : (
                        'Log In'
                      )}
                    </Button>
                  </Stack>
                </Form>

                <div className="mt-4 text-center small">
                  Don&apos;t have an account?
                  {' '}
                  <Link href="/signup" passHref legacyBehavior>
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                    <a className="text-decoration-none fw-medium">Sign up here</a>
                  </Link>
                </div>

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
