'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Form, Button, InputGroup,
  ProgressBar, ListGroup, Stack, Image,
} from 'react-bootstrap';
import {
  Envelope, Lock, CheckCircleFill, Circle, ArrowRight, ArrowLeft,
} from 'react-bootstrap-icons';
import Link from 'next/link';
import SignupProgress from '../SignupProgress'; // Assuming a shared progress component

// TODO: Implement proper form validation (e.g., yup/zod with react-hook-form)
// TODO: Implement actual account creation API call
// TODO: Implement robust password strength checking
// TODO: Link to actual Terms of Service and Privacy Policy pages

// Simple password strength check (example)
const checkPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength; // Max 4
};

export default function SignupStep2Page() {
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Add validation (e.g., email format, password match)
    if (password !== confirmPassword) {
      // alert('Passwords do not match!'); // Replace with better error handling
      return;
    }
    // TODO: Call API to create account
    console.log('Account creation attempt:', { email });
    // On success, navigate to next step (e.g., using Next.js router)
    // router.push('/signup/step3');
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Container className="py-4 py-md-5 flex-grow-1 d-flex flex-column">
        {/* Progress Indicator */}
        <SignupProgress currentStep={2} totalSteps={5} />

        {/* Account Creation Form Box */}
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
                  <Card.Title as="h2" className="h4 mb-0 fw-bold">Create Your Account</Card.Title>
                </Stack>

                <Form onSubmit={handleSubmit}>
                  <Stack gap={3}>
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
                        />
                      </InputGroup>
                      <ProgressBar
                        variant={getStrengthVariant(passwordStrength)}
                        now={(passwordStrength / 4) * 100}
                        style={{ height: '6px' }}
                        className="mt-2"
                      />
                      <Form.Text className={`text-${getStrengthVariant(passwordStrength)} small`}>
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
                          isInvalid={confirmPassword.length > 0 && password !== confirmPassword}
                        />
                        <Form.Control.Feedback type="invalid">
                          Passwords do not match.
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>

                    {/* Password Requirements */}
                    <Card bg="light" body className="border">
                      <p className="small fw-medium text-dark mb-2">Password Requirements:</p>
                      <ListGroup variant="flush" className="small">
                        {/* eslint-disable-next-line max-len */}
                        <ListGroup.Item className={`d-flex align-items-center gap-2 px-0 py-1 border-0 bg-transparent ${requirements.length ? 'text-success' : 'text-muted'}`}>
                          {requirements.length ? <CheckCircleFill /> : <Circle size={12} />}
                          {' '}
                          At least 8 characters
                        </ListGroup.Item>
                        {/* eslint-disable-next-line max-len */}
                        <ListGroup.Item className={`d-flex align-items-center gap-2 px-0 py-1 border-0 bg-transparent ${requirements.uppercase ? 'text-success' : 'text-muted'}`}>
                          {requirements.uppercase ? <CheckCircleFill /> : <Circle size={12} />}
                          {' '}
                          One uppercase letter
                        </ListGroup.Item>
                        {/* eslint-disable-next-line max-len */}
                        <ListGroup.Item className={`d-flex align-items-center gap-2 px-0 py-1 border-0 bg-transparent ${requirements.number ? 'text-success' : 'text-muted'}`}>
                          {requirements.number ? <CheckCircleFill /> : <Circle size={12} />}
                          {' '}
                          One number
                        </ListGroup.Item>
                        {/* eslint-disable-next-line max-len */}
                        <ListGroup.Item className={`d-flex align-items-center gap-2 px-0 py-1 border-0 bg-transparent ${requirements.special ? 'text-success' : 'text-muted'}`}>
                          {requirements.special ? <CheckCircleFill /> : <Circle size={12} />}
                          {' '}
                          One special character
                        </ListGroup.Item>
                      </ListGroup>
                    </Card>

                    <p className="text-muted small">
                      By creating an account, you agree to our
                      {' '}
                      {/* TODO: Link to actual terms */}
                      <Link href="/terms" className="text-decoration-none">Terms of Service</Link>
                      {' '}
                      and
                      {' '}
                      {/* TODO: Link to actual policy */}
                      <Link href="/privacy" className="text-decoration-none">Privacy Policy</Link>
                      .
                    </p>

                    {/* TODO: Link to next step on successful submission */}
                    <Button type="submit" variant="success" size="lg" className="w-100">
                      Create Account
                      {' '}
                      <ArrowRight className="ms-1" />
                    </Button>

                    <div className="text-center mt-2">
                      <Link href="/signup/step1" className="text-muted small text-decoration-none">
                        <ArrowLeft className="me-1" size={12} />
                        {' '}
                        Back to Welcome
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
