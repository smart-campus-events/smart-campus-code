'use client';

import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Form, Button, InputGroup,
  Stack, Image,
} from 'react-bootstrap';
import {
  Envelope, Lock, ArrowRight, ArrowLeft,
} from 'react-bootstrap-icons';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

/** The sign in page. */
const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await signIn('credentials', {
      callbackUrl: '/list',
      email,
      password,
    });

    if (result?.error) {
      console.error('Sign in failed: ', result.error);
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
                    Welcome Back
                  </Card.Title>
                </Stack>

                <Form onSubmit={handleSubmit}>
                  <Stack gap={3}>
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
                        />
                      </InputGroup>
                    </Form.Group>

                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Check
                        type="checkbox"
                        id="rememberMe"
                        label="Remember me"
                      />
                      <Link href="/auth/forgot-password" className="text-decoration-none">
                        Forgot password?
                      </Link>
                    </div>

                    <Button type="submit" variant="success" size="lg" className="w-100">
                      Sign In
                      {' '}
                      <ArrowRight className="ms-1" />
                    </Button>

                    <div className="text-center mt-2">
                      <Link
                        href="/auth/signup"
                        className="text-muted small text-decoration-none"
                      >
                        <ArrowLeft className="me-1" size={12} />
                        {' '}
                        Create an account
                      </Link>
                    </div>

                    <div className="text-center mt-3">
                      <p className="mb-2">Or</p>
                      <Button
                        variant="outline-primary"
                        onClick={() => signIn('google', {
                          callbackUrl: '/list',
                        })}
                        className="w-100"
                      >
                        Sign in with Google
                      </Button>
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
