'use client';

import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Stack,
} from 'react-bootstrap';
import { ArrowLeft, ArrowRight } from 'react-bootstrap-icons';
import Link from 'next/link';
import SignupProgress from '../SignupProgress';

// TODO: Save these optional details to user profile/state management
// TODO: Navigate to the final step

const ageRanges = ['17-18', '19-21', '22-24', '25+'];
const origins = {
  hawaii: 'Hawaiʻi Resident',
  mainland: 'US Mainland',
  international: 'International',
};
const housingStatuses = {
  'on-campus': 'On-Campus Dorm',
  'off-campus': 'Off-Campus Housing',
  commuter: 'Commuter',
};
const comfortLevels = [
  { value: 1, label: 'Reserved' },
  { value: 2, label: 'Shy' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Outgoing' },
  { value: 5, label: 'Very Social' },
];
const MAX_ABOUT_ME_LENGTH = 200;

export default function SignupStep4Page() {
  const [ageRange, setAgeRange] = useState('');
  const [origin, setOrigin] = useState('');
  const [housingStatus, setHousingStatus] = useState('');
  const [comfortLevel, setComfortLevel] = useState(3); // Default to Moderate
  const [aboutMe, setAboutMe] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Save data (even if empty, backend might handle defaults)
    console.log('Profile Step 4 Data:', { ageRange, origin, housingStatus, comfortLevel, aboutMe });
    // TODO: Navigate to next step (e.g., final confirmation/summary)
    // router.push('/signup/step5');
  };

  const getComfortLabel = (level: number) => comfortLevels.find(l => l.value === level)?.label || 'Moderate';

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Container className="py-4 py-md-5 flex-grow-1 d-flex flex-column">
        {/* Progress Indicator */}
        <SignupProgress currentStep={4} totalSteps={5} />

        {/* Optional Details Form */}
        <Row className="justify-content-center">
          <Col md={10} lg={8} xl={7}>
            <div className="text-center mb-4 mb-md-5">
              <h2 className="h3 fw-bold mb-2">Tell us more about yourself</h2>
              <p className="text-muted">These details are optional but help us provide better recommendations.</p>
            </div>

            <Card className="shadow-sm border-light rounded-4">
              <Card.Body className="p-4 p-md-5">
                <Form onSubmit={handleSubmit}>
                  <Stack gap={4}>
                    {/* Age Range */}
                    <Form.Group controlId="ageRange">
                      <Form.Label>
                        Age Range
                        {' '}
                        <span className="text-muted small fw-normal">(Optional)</span>
                      </Form.Label>
                      <Form.Select value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
                        <option value="" disabled>Select age range</option>
                        {ageRanges.map(range => (
                          <option key={range} value={range}>
                            {range}
                            {' '}
                            years
                          </option>
                        ))}
                        <option value="prefer-not-say">Prefer not to say</option>
                      </Form.Select>
                    </Form.Group>

                    {/* Origin */}
                    <Form.Group controlId="origin">
                      <Form.Label>
                        Origin
                        {' '}
                        <span className="text-muted small fw-normal">(Optional)</span>
                      </Form.Label>
                      <Form.Select value={origin} onChange={(e) => setOrigin(e.target.value)}>
                        <option value="" disabled>Select your origin</option>
                        {Object.entries(origins).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                        <option value="prefer-not-say">Prefer not to say</option>
                      </Form.Select>
                    </Form.Group>

                    {/* Housing Status */}
                    <Form.Group controlId="housingStatus">
                      <Form.Label>
                        Housing Status
                        {' '}
                        <span className="text-muted small fw-normal">(Optional)</span>
                      </Form.Label>
                      <Form.Select value={housingStatus} onChange={(e) => setHousingStatus(e.target.value)}>
                        <option value="" disabled>Select housing status</option>
                        {Object.entries(housingStatuses).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                        <option value="prefer-not-say">Prefer not to say</option>
                      </Form.Select>
                    </Form.Group>

                    {/* Social Comfort Level */}
                    <Form.Group controlId="comfortLevel">
                      <Form.Label>
                        Social Comfort Level
                        {' '}
                        <span className="text-muted small fw-normal">(Optional)</span>
                      </Form.Label>
                      <Stack direction="horizontal" gap={3} className="align-items-center">
                        <Form.Range
                          min={1}
                          max={5}
                          step={1}
                          value={comfortLevel}
                          onChange={(e) => setComfortLevel(parseInt(e.target.value, 10))}
                          className="flex-grow-1"
                          aria-describedby="comfortLevelHelp"
                        />
                        <span className="text-muted small" style={{ minWidth: '70px', textAlign: 'right' }}>
                          {getComfortLabel(comfortLevel)}
                        </span>
                      </Stack>
                      <div id="comfortLevelHelp" className="d-flex justify-content-between text-muted small px-1">
                        <span>Reserved</span>
                        <span>Very Social</span>
                      </div>
                    </Form.Group>

                    {/* About Me */}
                    <Form.Group controlId="aboutMe">
                      <Form.Label>
                        About Me
                        {' '}
                        <span className="text-muted small fw-normal">
                          (Optional - Max
                          {MAX_ABOUT_ME_LENGTH}
                          {' '}
                          characters)
                        </span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Share a brief introduction about yourself..."
                        value={aboutMe}
                        onChange={(e) => setAboutMe(e.target.value)}
                        maxLength={MAX_ABOUT_ME_LENGTH}
                      />
                      <Form.Text muted>
                        Remaining:
                        {' '}
                        {MAX_ABOUT_ME_LENGTH - aboutMe.length}
                        {' '}
                        characters. Helps tailor recommendations.
                      </Form.Text>
                    </Form.Group>

                    {/* Navigation Buttons */}
                    <Stack direction="horizontal" gap={3} className="justify-content-between pt-3 mt-2">
                      <Link href="/signup/step3" passHref legacyBehavior>
                        <Button variant="outline-secondary">
                          <ArrowLeft className="me-1" />
                          {' '}
                          Back
                        </Button>
                      </Link>
                      <Button type="submit" variant="success">
                        Continue
                        {' '}
                        <ArrowRight className="ms-1" />
                      </Button>
                    </Stack>
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
