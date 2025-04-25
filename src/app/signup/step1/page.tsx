'use client';

import Link from 'next/link';
import { Button, Col, Container, Row } from 'react-bootstrap';
import SignupProgress from '../SignupProgress';

export default function SignupStep1Page() {
  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Container className="py-4 py-md-5 flex-grow-1 d-flex flex-column">
        {/* Progress Indicator */}
        <SignupProgress currentStep={1} totalSteps={5} />

        {/* Welcome Content */}
        <Row className="justify-content-center align-items-center flex-grow-1">
          <Col md={8} lg={6} className="text-center">
            <img
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/d8899fadb3-5df15300b4c172c2ef67.png"
              alt="Manoa Compass Logo"
              style={{ maxWidth: '180px', height: 'auto' }}
              className="mb-4"
            />

            <h1 className="h2 fw-bold mb-3">Aloha! Welcome to Manoa Compass</h1>
            <p className="lead text-muted mb-4">
              Your personalized guide to clubs, events, and connections at UHM.
            </p>

            <div className="d-grid gap-3 col-md-8 mx-auto">
              {/* Wrap the Button in a Next.js Link and render it as an <a> */}
              <Link href="/signup/step2" passHref legacyBehavior>
                <Button as="a" variant="success" size="lg">
                  Get Started
                </Button>
              </Link>

              <p className="text-muted small mb-0">
                Already have an account?
                {' '}
                <Link href="/login" passHref legacyBehavior>
                  <Button as="a" variant="link" className="p-0 fw-medium">
                    Login
                  </Button>
                </Link>
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
