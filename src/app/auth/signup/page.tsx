'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Form, Button, InputGroup,
  ProgressBar, ListGroup, Stack, Image,
} from 'react-bootstrap';
import {
  Envelope, Lock, CheckCircleFill, Circle, ArrowRight, ArrowLeft, Google,
} from 'react-bootstrap-icons';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

// Simple password strength check (example)
const checkPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength; // Max 4
};

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    const strengthValue = checkPasswordStrength(password);
    setPasswordStrength(strengthValue);
    setRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const getStrengthLabel = (strength: number) => {
    switch (strength) {
      case 0: return ' '; // No label initially or for empty password
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const getStrengthVariant = (strength: number) => {
    switch (strength) {
      case 0: return 'secondary';
      case 1: return 'danger';
      case 2: return 'warning';
      case 3: return 'info';
      case 4: return 'success';
      default: return 'secondary';
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }
    if (passwordStrength < 3) {
      setSubmitError('Password does not meet the requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Account creation attempt with email/password:', { email });
      await new Promise(resolve => { setTimeout(resolve, 1000); });

      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/list',
      });

      if (signInResult?.error) {
        setSubmitError('Account created, but sign-in failed. Please try signing in manually.');
      } else if (signInResult?.ok) {
        window.location.href = signInResult.url || '/list';
      }
    } catch (err) {
      console.error('Account creation failed:', err);
      setSubmitError('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    setSubmitError(null);
    try {
      await signIn('google', {
        callbackUrl: '/list',
        redirect: true,
      });
    } catch (err) {
      console.error('Google sign up failed:', err);
      setGoogleError('An unexpected error occurred during Google sign up.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Container className="py-4 py-md-5 flex-grow-1 d-flex flex-column">
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <Card className="shadow-sm border-light rounded-4">
              <Card.Body className="p-4 p-md-5">
                <Stack direction="horizontal" gap={3} className="mb-4 align-items-center">
                  <Image
                    src="https://storage.googleapis.com/uxpilot-auth.appspot.com/d8899fadb3-5df15300b4c172c2ef67.png"
                    alt="Manoa Compass Logo"
                    style={{ width: '40px', height: 'auto' }}
                  />
                  <Card.Title as="h2" className="h4 mb-0 fw-bold">
                    Create Your Account
                  </Card.Title>
                </Stack>

                <div className="text-center mb-4">
                  <Button
                    variant="outline-primary"
                    onClick={handleGoogleSignUp}
                    className="w-100"
                    disabled={isGoogleLoading || isSubmitting}
                  >
                    {isGoogleLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        <Google className="me-2" />
                        Sign up with Google
                      </>
                    )}
                  </Button>
                  {googleError && !submitError && (
                    <div className="text-danger mt-2 small">{googleError}</div>
                  )}
                  <div className="mt-3">
                    <span className="text-muted">or</span>
                  </div>
                </div>

                <Form onSubmit={handleSubmit}>
                  <Stack gap={3}>
                    {submitError && (
                    <div className="alert alert-danger small py-2" role="alert">
                      {submitError}
                    </div>
                    )}
                    <Form.Group controlId="signupEmail">
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
                          disabled={isSubmitting || isGoogleLoading}
                        />
                      </InputGroup>
                    </Form.Group>

                    <Form.Group controlId="signupPassword">
                      <Form.Label>
                        Password
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Lock /></InputGroup.Text>
                        <Form.Control
                          type="password"
                          placeholder="Create password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isSubmitting || isGoogleLoading}
                        />
                      </InputGroup>
                      <ProgressBar
                        variant={getStrengthVariant(passwordStrength)}
                        now={(passwordStrength / 4) * 100}
                        style={{ height: '6px' }}
                        className="mt-2"
                      />
                      <Form.Text
                        className={`text-${getStrengthVariant(passwordStrength)} small`}
                      >
                        Password strength:
                        {' '}
                        {getStrengthLabel(passwordStrength)}
                      </Form.Text>
                    </Form.Group>

                    <Form.Group controlId="confirmPassword">
                      <Form.Label>
                        Confirm Password
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Lock /></InputGroup.Text>
                        <Form.Control
                          type="password"
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          isInvalid={
                            submitError === 'Passwords do not match.'
                            || (confirmPassword.length > 0 && password !== confirmPassword)
                          }
                          disabled={isSubmitting || isGoogleLoading}
                        />
                        <Form.Control.Feedback type="invalid">
                          {submitError === 'Passwords do not match.' ? submitError : 'Passwords do not match.'}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>

                    {password.length > 0 && (
                      <Card bg="light" body className="border">
                        <p className="small fw-medium text-dark mb-2">
                          Password Requirements:
                        </p>
                        <ListGroup variant="flush" className="small">
                          <ListGroup.Item
                            className={`d-flex align-items-center gap-2 px-0 py-1 border-0 bg-transparent ${
                              requirements.length ? 'text-success' : 'text-muted'
                            }`}
                          >
                            {requirements.length ? <CheckCircleFill /> : <Circle size={12} />}
                            {' '}
                            At least 8 characters
                          </ListGroup.Item>
                          <ListGroup.Item
                            className={`d-flex align-items-center gap-2 px-0 py-1 border-0 bg-transparent ${
                              requirements.uppercase ? 'text-success' : 'text-muted'
                            }`}
                          >
                            {requirements.uppercase ? <CheckCircleFill /> : <Circle size={12} />}
                            {' '}
                            One uppercase letter
                          </ListGroup.Item>
                          <ListGroup.Item
                            className={`d-flex align-items-center gap-2 px-0 py-1 border-0 bg-transparent ${
                              requirements.number ? 'text-success' : 'text-muted'
                            }`}
                          >
                            {requirements.number ? <CheckCircleFill /> : <Circle size={12} />}
                            {' '}
                            One number
                          </ListGroup.Item>
                          <ListGroup.Item
                            className={`d-flex align-items-center gap-2 px-0 py-1 border-0 bg-transparent ${
                              requirements.special ? 'text-success' : 'text-muted'
                            }`}
                          >
                            {requirements.special ? <CheckCircleFill /> : <Circle size={12} />}
                            {' '}
                            One special character
                          </ListGroup.Item>
                        </ListGroup>
                      </Card>
                    )}

                    <p className="text-muted small">
                      By creating an account, you agree to our
                      {' '}
                      <Link href="/terms" className="text-decoration-none">
                        Terms of Service
                      </Link>
                      {' '}
                      and
                      {' '}
                      <Link href="/privacy" className="text-decoration-none">
                        Privacy Policy
                      </Link>
                      .
                    </p>

                    <Button
                      type="submit"
                      variant="success"
                      size="lg"
                      className="w-100"
                      disabled={isSubmitting || isGoogleLoading}
                    >
                      {isSubmitting ? 'Creating Account...' : (
                        <>
                          Create Account
                          {' '}
                          <ArrowRight className="ms-1" />
                        </>
                      )}
                    </Button>

                    <div className="text-center mt-2">
                      <Link
                        href="/auth/signin"
                        className="text-muted small text-decoration-none"
                      >
                        <ArrowLeft className="me-1" size={12} />
                        {' '}
                        Back to Sign In
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
}
