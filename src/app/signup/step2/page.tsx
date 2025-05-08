// File: src/app/signup/step2/page.tsx

'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Image,
  InputGroup,
  ListGroup,
  ProgressBar,
  Row,
  Stack,
} from 'react-bootstrap';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircleFill,
  Circle,
  Envelope,
  Lock,
} from 'react-bootstrap-icons';
import SignupProgress from '../SignupProgress';

const checkPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

export default function SignupStep2Page() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const value = checkPasswordStrength(password);
    setPasswordStrength(value);
    setRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  useEffect(() => {
    if (error) {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Enforce hawaii.edu email
    if (!/^[^@]+@hawaii\.edu$/i.test(email)) {
      setError('Registration Only Available for Students with an @hawaii.edu Email');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profileapi/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: '/signup/step3',
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      router.push(signInResult?.url || '/signup/step3');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const variantOptions = ['danger', 'warning', 'info', 'success'];
  const strengthVariant = variantOptions[passwordStrength - 1] || 'secondary';
  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong'][passwordStrength - 1] || '';

  return (
    <Container
      ref={containerRef}
      fluid
      className="bg-light min-vh-100 d-flex flex-column overflow-auto py-4 py-md-5"
    >
      <SignupProgress currentStep={2} totalSteps={5} />

      <Row className="justify-content-center flex-grow-1 d-flex flex-column">
        <Col md={8} lg={6} xl={5} className="mx-auto">
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

              <Form onSubmit={handleSubmit}>
                <Stack gap={3}>
                  {error && <div className="text-danger small mb-2">{error}</div>}

                  <Form.Group controlId="signupFirstName">
                    <Form.Label>
                      First Name
                      {' '}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group controlId="signupLastName">
                    <Form.Label>
                      Last Name
                      {' '}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group controlId="signupEmail">
                    <Form.Label>
                      Email Address
                      {' '}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text><Envelope /></InputGroup.Text>
                      <Form.Control
                        type="email"
                        placeholder="your.email@hawaii.edu"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group controlId="signupPassword">
                    <Form.Label>
                      Password
                      {' '}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text><Lock /></InputGroup.Text>
                      <Form.Control
                        type="password"
                        placeholder="Create password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </InputGroup>
                    <ProgressBar
                      now={(passwordStrength / 4) * 100}
                      className="mt-2"
                      variant={strengthVariant}
                    />
                    <Form.Text className={`small text-${strengthVariant}`}>
                      Password strength:
                      {' '}
                      {strengthLabel}
                    </Form.Text>
                  </Form.Group>

                  <Form.Group controlId="confirmPassword">
                    <Form.Label>
                      Confirm Password
                      {' '}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text><Lock /></InputGroup.Text>
                      <Form.Control
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        isInvalid={confirmPassword.length > 0 && password !== confirmPassword}
                        disabled={loading}
                      />
                      <Form.Control.Feedback type="invalid">
                        Passwords do not match.
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>

                  <Card bg="light" body className="border">
                    <p className="small fw-medium text-dark mb-2">Password Requirements:</p>
                    <ListGroup variant="flush" className="small">
                      {[
                        { ok: requirements.length, text: 'At least 8 characters' },
                        { ok: requirements.uppercase, text: 'One uppercase letter' },
                        { ok: requirements.number, text: 'One number' },
                        { ok: requirements.special, text: 'One special character' },
                      ].map(({ ok, text }) => (
                        <ListGroup.Item
                          key={text}
                          className={`d-flex gap-2 px-0 py-1 bg-transparent ${
                            ok ? 'text-success' : 'text-muted'
                          }`}
                        >
                          {ok ? <CheckCircleFill /> : <Circle size={12} />}
                          {' '}
                          {text}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card>

                  <p className="small text-muted">
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
                    disabled={loading}
                  >
                    Create Account
                    {' '}
                    <ArrowRight className="ms-1" />
                  </Button>

                  <div className="text-center mt-2">
                    <Link
                      href="/signup/step1"
                      className="small text-muted text-decoration-none"
                    >
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
  );
}
