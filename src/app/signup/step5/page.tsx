'use client';

/* eslint-disable max-len */
import React from 'react';
import { Container, Row, Col, Card, Button, Stack, Image, Badge } from 'react-bootstrap';
import { CheckCircleFill, HouseDoorFill /* QuestionCircle */ } from 'react-bootstrap-icons';
import Link from 'next/link';
import SignupProgress from '../SignupProgress';

// TODO: Fetch actual user data (name, major, interests, avatar) to display
// TODO: Ensure links for Dashboard and Quick Guide are correct

// Placeholder data - replace with actual user data from state/context/fetch
const userData = {
  name: 'John Doe',
  major: 'Computer Science',
  interests: ['Hiking', 'Gaming', 'Surfing', 'Music'],
  avatarUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
};

export default function SignupStep5Page() {
  // TODO: Potentially trigger final setup/API calls if needed

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Container className="py-4 py-md-5 flex-grow-1 d-flex flex-column">
        {/* Progress Indicator */}
        <SignupProgress currentStep={5} totalSteps={5} />

        {/* Completion Content */}
        <Row className="justify-content-center">
          <Col md={9} lg={7} xl={6} className="text-center">

            {/* Success Message */}
            <div className="mb-4 mb-md-5">
              <div className="bg-success-subtle rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
                <CheckCircleFill size={40} className="text-success" />
              </div>
              <h1 className="h2 fw-bold mb-2">Profile Setup Complete!</h1>
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              <p className="lead text-muted">
                You&apos;re all set to explore everything UH Mānoa has to offer.
              </p>
            </div>

            {/* Profile Summary Card */}
            <Card className="shadow-sm border-light rounded-4 mb-4 mb-md-5">
              <Card.Body className="p-4 p-md-5">
                <Stack gap={3} className="align-items-center">
                  <Image
                    src={userData.avatarUrl}
                    alt="Profile Picture"
                    roundedCircle
                    style={{ width: '80px', height: '80px', border: '4px solid var(--bs-success)' }}
                  />
                  <h3 className="h5 fw-semibold mb-0">{userData.name}</h3>
                  <p className="text-muted mb-2">
                    {userData.major}
                    {' '}
                    Major
                  </p>
                  <Stack direction="horizontal" gap={2} className="flex-wrap justify-content-center">
                    {userData.interests.map(interest => (
                      <Badge key={interest} pill bg="primary-subtle" text="primary-emphasis">
                        {interest}
                      </Badge>
                    ))}
                  </Stack>
                </Stack>
              </Card.Body>
            </Card>

            {/* Action Buttons */}
            <Stack gap={3} className="align-items-center col-md-8 mx-auto">
              {/* TODO: Ensure link goes to the correct dashboard page */}
              <Link href="/dashboard" passHref legacyBehavior>
                <Button variant="success" size="lg" className="w-100">
                  Go to Dashboard
                  {' '}
                  <HouseDoorFill className="ms-1" />
                </Button>
              </Link>
              <p className="text-muted small mb-0">
                Need help getting started? Check out our
                {' '}
                {' '}
                {/* TODO: Link to actual guide */}
                <Link href="/guide" className="fw-medium">quick guide</Link>
                .
              </p>
            </Stack>

          </Col>
        </Row>
      </Container>
    </div>
  );
}
