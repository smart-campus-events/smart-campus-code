'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
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

// Simple password‑strength check
const checkPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength; // Max 4
};

export default function SignupStep2Page() {
  const router = useRouter();
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

  const getStrengthLabel = (strength: number) => {
    switch (strength) {
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };
  const getStrengthVariant = (strength: number) => {
    switch (strength) {
      case 1: return 'danger';
      case 2: return 'warning';
      case 3: return 'info';
      case 4: return 'success';
      default: return 'secondary';
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // 1) Create the user in your DB
      const res = await fetch('/profileapi/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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

      // 2) Immediately sign them in via NextAuth
      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      // 3) Now they’re authenticated—go to step 3
      router.push('/signup/step3');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Container className="py-4 py-md-5 flex-grow-1 d-flex flex-column">
        <SignupProgress currentStep={2} totalSteps={5} />
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
                <Form onSubmit={handleSubmit}>
                  <Stack gap={3}>
                    {error && <div className="text-danger small mb-2">{error}</div>}
                    {/* Email */}
                    <Form.Group controlId="signupEmail">
                      <Form.Label>Email Address <span className="text-danger">*</span></Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Envelope /></InputGroup.Text>
                        <Form.Control
                          type="email"
                          placeholder="your.email@hawaii.edu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </InputGroup>
                    </Form.Group>
                    {/* Password */}
                    <Form.Group controlId="signupPassword">
                      <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Lock /></InputGroup.Text>
                        <Form.Control
                          type="password"
                          placeholder="Create password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </InputGroup>
                      <ProgressBar
                        variant={getStrengthVariant(passwordStrength)}
                        now={(passwordStrength / 4) * 100}
                        style={{ height: '6px' }}
                        className="mt-2"
                      />
                      <Form.Text className={`text-${getStrengthVariant(passwordStrength)} small`}>
                        Password strength: {getStrengthLabel(passwordStrength)}
                      </Form.Text>
                    </Form.Group>
                    {/* Confirm Password */}
                    <Form.Group controlId="confirmPassword">
                      <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Lock /></InputGroup.Text>
                        <Form.Control
                          type="password"
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          isInvalid={confirmPassword.length > 0 && password !== confirmPassword}
                          disabled={loading}
                        />
                        <Form.Control.Feedback type="invalid">
                          Passwords do not match.
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                    {/* Requirements */}
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
                            className={`d-flex align-items-center gap-2 px-0 py-1 bg-transparent ${
                              ok ? 'text-success' : 'text-muted'
                            }`}
                          >
                            {ok ? <CheckCircleFill /> : <Circle size={12} />} {text}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Card>
                    <p className="text-muted small">
                      By creating an account, you agree to our{' '}
                      <Link href="/terms" className="text-decoration-none">Terms of Service</Link> and{' '}
                      <Link href="/privacy" className="text-decoration-none">Privacy Policy</Link>.
                    </p>
                    <Button type="submit" variant="success" size="lg" className="w-100" disabled={loading}>
                      Create Account <ArrowRight className="ms-1" />
                    </Button>
                    <div className="text-center mt-2">
                      <Link href="/signup/step1" className="text-muted small text-decoration-none">
                        <ArrowLeft className="me-1" size={12} /> Back to Welcome
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
