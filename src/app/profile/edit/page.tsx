'use client';

/* eslint-disable max-len */
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, FloatingLabel } from 'react-bootstrap';
import { X } from 'react-bootstrap-icons';
import Link from 'next/link';

// TODO: Replace hardcoded data with actual data fetched from user profile
// TODO: Implement form submission logic (e.g., API call to update profile)
// TODO: Implement actual interest adding functionality (e.g., modal with search/select)
// TODO: Add form validation (e.g., using react-hook-form and yup/zod)
// TODO: Consider using react-hook-form for better state management and validation

const MAX_ABOUT_ME_LENGTH = 500;

// TODO: Replace with actual data fetching for the user
// eslint-disable-next-line max-len
/*
const currentUserData = {
  name: 'Sarah K.',
  email: 'sarahk@hawaii.edu',
  // ... existing code ...
};
*/

// TODO: Replace with actual data fetching for available majors/interests
const availableMajors = ['Computer Science', 'Marine Biology', 'Hawaiian Studies', 'Business Administration', 'Psychology', 'Engineering', 'Art'];
// eslint-disable-next-line max-len
/*
const availableInterests = [
  { id: 'tech', name: 'Technology & Programming' },
  { id: 'hiking', name: 'Hiking & Outdoors' },
  // ... existing code ...
];
*/

const ageRanges = ['19-21', '22-24', '25+'];
const origins = ['Hawaiʻi Resident', 'US Mainland', 'International'];
const housingStatuses = ['On-Campus Dorm', 'Off-Campus Commuter'];

export default function EditProfilePage() {
  // Placeholder state - replace with actual profile data and state management
  const [fullName, setFullName] = useState('Sarah Johnson');
  const [major, setMajor] = useState('Computer Science');
  const [interests, setInterests] = useState(['Hiking', 'Technology', 'Photography']);
  const [ageRange, setAgeRange] = useState('19-21');
  const [origin, setOrigin] = useState('US Mainland');
  const [housingStatus, setHousingStatus] = useState('On-Campus Dorm');
  const [aboutMe, setAboutMe] = useState('Enthusiastic Computer Science student looking to connect with fellow tech enthusiasts and explore the beautiful islands!');

  const email = 'sarah.j@hawaii.edu'; // Assuming email is not editable

  const handleRemoveInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  const handleAddInterest = () => {
    // TODO: Implement modal or input for adding new interests
    console.log('Add interest clicked');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Gather form data and submit to backend
    console.log('Form submitted:', { fullName, major, interests, ageRange, origin, housingStatus, aboutMe });
    // Potentially redirect to profile page on success
  };

  return (
    <div className="bg-light min-vh-100">
      {/* Assuming Header/Navigation is handled by the main layout */}
      <Container className="py-4 py-md-5">
        <Row className="justify-content-center">
          <Col lg={8} xl={7}>
            {/* Page Header */}
            <div className="mb-4 mb-md-5 text-center text-md-start">
              <h1 className="h2 fw-bold mb-2">Edit Profile</h1>
              <p className="text-muted">Update your information to get better recommendations for events and connections.</p>
            </div>

            {/* Profile Form */}
            <Card className="shadow-sm">
              <Card.Body className="p-4 p-md-5">
                <Form onSubmit={handleSubmit}>

                  {/* Basic Information Section */}
                  <h2 className="h5 fw-semibold pb-2 mb-4 border-bottom">Basic Information</h2>
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <FloatingLabel controlId="floatingFullName" label="Full Name">
                        <Form.Control
                          type="text"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </FloatingLabel>
                    </Col>
                    <Col md={6}>
                      <FloatingLabel controlId="floatingEmail" label="Email Address">
                        <Form.Control
                          type="email"
                          placeholder="your.email@hawaii.edu"
                          value={email}
                          disabled
                          readOnly
                        />
                      </FloatingLabel>
                    </Col>
                    <Col md={12}>
                      <FloatingLabel controlId="floatingMajor" label="Major">
                        <Form.Select
                          aria-label="Select your major"
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                        >
                          <option value="">Select your major</option>
                          {availableMajors.map(m => <option key={m} value={m}>{m}</option>)}
                          {/* Add an "Other" option if needed */}
                        </Form.Select>
                      </FloatingLabel>
                    </Col>
                  </Row>

                  {/* Interests Section */}
                  <h2 className="h5 fw-semibold pb-2 mb-4 border-bottom">Interests</h2>
                  <Form.Group className="mb-4">
                    <Form.Label className="mb-2">Select your interests (minimum 3)</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {interests.map((interest) => (
                        <Badge key={interest} pill bg="success-subtle" text="success-emphasis" className="d-inline-flex align-items-center py-2 px-3">
                          {interest}
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 ms-2 lh-1 text-success-emphasis"
                            onClick={() => handleRemoveInterest(interest)}
                            aria-label={`Remove ${interest} interest`}
                          >
                            <X size={16} />
                          </Button>
                        </Badge>
                      ))}
                      {/* TODO: Replace with a proper add mechanism */}
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="rounded-pill"
                        onClick={handleAddInterest}
                      >
                        + Add Interest
                      </Button>
                    </div>
                    <Form.Text muted>
                      Adding diverse interests helps us find relevant RIOs and events for you.
                    </Form.Text>
                  </Form.Group>

                  {/* Additional Details Section */}
                  <h2 className="h5 fw-semibold pb-2 mb-4 border-bottom">Additional Details</h2>
                  <Row className="g-3 mb-4">
                    <Col md={4}>
                      <FloatingLabel controlId="floatingAgeRange" label="Age Range">
                        <Form.Select
                          aria-label="Select your age range"
                          value={ageRange}
                          onChange={(e) => setAgeRange(e.target.value)}
                        >
                          <option value="">Select...</option>
                          {ageRanges.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                        </Form.Select>
                      </FloatingLabel>
                    </Col>
                    <Col md={4}>
                      <FloatingLabel controlId="floatingOrigin" label="Origin">
                        <Form.Select
                          aria-label="Select your origin"
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                        >
                          <option value="">Select...</option>
                          {origins.map(o => <option key={o} value={o}>{o}</option>)}
                        </Form.Select>
                      </FloatingLabel>
                    </Col>
                    <Col md={4}>
                      <FloatingLabel controlId="floatingHousing" label="Housing Status">
                        <Form.Select
                          aria-label="Select your housing status"
                          value={housingStatus}
                          onChange={(e) => setHousingStatus(e.target.value)}
                        >
                          <option value="">Select...</option>
                          {housingStatuses.map(hs => <option key={hs} value={hs}>{hs}</option>)}
                        </Form.Select>
                      </FloatingLabel>
                    </Col>
                    <Col md={12}>
                      <FloatingLabel controlId="floatingAboutMe" label="About Me">
                        <Form.Control
                          as="textarea"
                          placeholder="Tell us about yourself..."
                          style={{ height: '100px' }}
                          value={aboutMe}
                          onChange={(e) => setAboutMe(e.target.value)}
                          maxLength={MAX_ABOUT_ME_LENGTH} // Added based on mock text
                        />
                      </FloatingLabel>
                      <Form.Text muted>
                        Max
                        {' '}
                        {MAX_ABOUT_ME_LENGTH}
                        {' '}
                        characters. Helps tailor recommendations.
                      </Form.Text>
                    </Col>
                  </Row>

                  {/* Action Buttons */}
                  <div className="d-flex justify-content-end gap-2 pt-4 border-top">
                    {/* TODO: Link Cancel button back to profile page or previous page */}
                    <Link href="/profile" passHref legacyBehavior>
                      <Button variant="outline-secondary">Cancel</Button>
                    </Link>
                    <Button type="submit" variant="success">Save Changes</Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
