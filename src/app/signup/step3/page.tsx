'use client';

import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Form, Button, InputGroup, Stack,
} from 'react-bootstrap';
import {
  Search, ArrowLeft, ArrowRight,
  // Icons for interests (replace with appropriate React Bootstrap Icons)
  Book, // Academic Placeholder
  Sun, // Local Activities Placeholder
  Controller, // Hobbies Placeholder
  People, // Community Placeholder
} from 'react-bootstrap-icons';
import Link from 'next/link';
import SignupProgress from '../SignupProgress';

// TODO: Replace with actual list of majors (potentially fetched or from constants)
const popularMajors = ['Computer Science', 'Business', 'Psychology', 'Biology'];

// TODO: Define a more comprehensive list of interests with categories
const interestCategories = {
  Academic: ['Psychology', 'Marketing', 'Biology', 'Engineering', 'History', 'Art History'],
  'Local Activities': ['Hiking', 'Surfing', 'Culture', 'Beach Cleanup', 'Kayaking'],
  Hobbies: ['Music', 'Gaming', 'Sports', 'Photography', 'Cooking', 'Reading'],
  Community: ['Volunteering', 'Leadership', 'Mentorship', 'Advocacy'],
};

const MIN_INTERESTS = 3;

export default function SignupStep3Page() {
  const [majorSearch, setMajorSearch] = useState('');
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const handleMajorSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMajorSearch(e.target.value);
    setSelectedMajor(null); // Clear selection if searching
    // TODO: Implement major search/filter logic if needed
  };

  const handleMajorSelect = (major: string) => {
    setMajorSearch(major); // Update search bar for visual feedback
    setSelectedMajor(major);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => (prev.includes(interest)
      ? prev.filter(i => i !== interest)
      : [...prev, interest]));
  };

  const isInterestSelected = (interest: string) => selectedInterests.includes(interest);

  const canContinue = selectedMajor && selectedInterests.length >= MIN_INTERESTS;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canContinue) return;
    // TODO: Save selected major and interests to user profile/state management
    console.log('Profile Step 3 Data:', { major: selectedMajor, interests: selectedInterests });
    // TODO: Navigate to next step
    // router.push('/signup/step4');
  };

  // Simplified icon mapping - replace with better icons if available
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Academic': return <Book className="me-1" />;
      case 'Local Activities': return <Sun className="me-1" />;
      case 'Hobbies': return <Controller className="me-1" />;
      case 'Community': return <People className="me-1" />;
      default: return null;
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Container className="py-4 py-md-5 flex-grow-1 d-flex flex-column">
        {/* Progress Indicator */}
        <SignupProgress currentStep={3} totalSteps={5} />

        {/* Profile Setup Form */}
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <div className="text-center mb-4 mb-md-5">
              <h2 className="h3 fw-bold mb-2">Tell us about yourself</h2>
              <p className="text-muted">Help us personalize your experience at UHM.</p>
            </div>

            <Form onSubmit={handleSubmit}>
              <Stack gap={4}>
                {/* Major Selection */}
                <Form.Group controlId="majorSelect">
                  <Form.Label className="fw-medium">
                    Select Your Major
                    <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup className="mb-2">
                    <Form.Control
                      type="text"
                      placeholder="Search for your major..."
                      value={majorSearch}
                      onChange={handleMajorSearchChange}
                    />
                    <InputGroup.Text><Search /></InputGroup.Text>
                  </InputGroup>
                  <Stack direction="horizontal" gap={2} className="flex-wrap">
                    <span className="small text-muted me-1">Popular:</span>
                    {popularMajors.map(major => (
                      <Button
                        key={major}
                        variant={selectedMajor === major ? 'primary' : 'outline-secondary'}
                        size="sm"
                        className="rounded-pill"
                        onClick={() => handleMajorSelect(major)}
                      >
                        {major}
                      </Button>
                    ))}
                  </Stack>
                </Form.Group>

                {/* Interests Selection */}
                <Form.Group controlId="interestSelect">
                  <Form.Label className="fw-medium">
                    Select Your Interests
                    {' '}
                    <span className="text-danger">*</span>
                    <span className="text-muted small fw-normal ms-1">
                      (Select at least
                      {MIN_INTERESTS}
                      )
                    </span>
                  </Form.Label>
                  <Row className="g-3">
                    {Object.entries(interestCategories).map(([category, interests]) => (
                      <Col key={category} md={6}>
                        <Card className="h-100 border shadow-sm">
                          <Card.Body>
                            <Card.Title as="h6" className="text-muted small text-uppercase mb-3">
                              {getCategoryIcon(category)}
                              {' '}
                              {category}
                            </Card.Title>
                            <Stack direction="horizontal" gap={2} className="flex-wrap">
                              {interests.map(interest => (
                                <Button
                                  key={interest}
                                  variant={isInterestSelected(interest) ? 'primary' : 'outline-secondary'}
                                  size="sm"
                                  className="rounded-pill"
                                  onClick={() => toggleInterest(interest)}
                                >
                                  {interest}
                                </Button>
                              ))}
                            </Stack>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  {selectedInterests.length > 0 && selectedInterests.length < MIN_INTERESTS && (
                  <Form.Text className="text-danger d-block mt-2">
                    Please select at least
                    {' '}
                    {MIN_INTERESTS - selectedInterests.length}
                    {' '}
                    more interest(s).
                  </Form.Text>
                  )}
                </Form.Group>

                {/* Navigation Buttons */}
                <Stack direction="horizontal" gap={3} className="justify-content-between pt-3">
                  <Link href="/signup/step2" passHref legacyBehavior>
                    <Button variant="outline-secondary">
                      <ArrowLeft className="me-1" />
                      {' '}
                      Back
                    </Button>
                  </Link>
                  <Button type="submit" variant="success" disabled={!canContinue}>
                    Continue
                    {' '}
                    <ArrowRight className="ms-1" />
                  </Button>
                </Stack>
              </Stack>
            </Form>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
