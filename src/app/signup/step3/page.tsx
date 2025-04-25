// app/signup/step3/page.tsx

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Row,
  Stack,
} from 'react-bootstrap';
import {
  ArrowLeft,
  ArrowRight,
  Book,
  Controller,
  People,
  Search,
  Sun,
} from 'react-bootstrap-icons';
import SignupProgress from '../SignupProgress';

const popularMajors = ['Computer Science', 'Business', 'Psychology', 'Biology'];
const interestCategories = {
  Academic: ['Psychology', 'Marketing', 'Biology', 'Engineering', 'History', 'Art History'],
  'Local Activities': ['Hiking', 'Surfing', 'Culture', 'Beach Cleanup', 'Kayaking'],
  Hobbies: ['Music', 'Gaming', 'Sports', 'Photography', 'Cooking', 'Reading'],
  Community: ['Volunteering', 'Leadership', 'Mentorship', 'Advocacy'],
};
const MIN_INTERESTS = 3;

export default function SignupStep3Page() {
  const router = useRouter();
  const [majorSearch, setMajorSearch] = useState('');
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMajorSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMajorSearch(e.target.value);
    setSelectedMajor(null);
  };

  const handleMajorSelect = (major: string) => {
    setMajorSearch(major);
    setSelectedMajor(major);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => (prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]));
  };

  const isInterestSelected = (interest: string) => selectedInterests.includes(interest);

  const canContinue = !!selectedMajor && selectedInterests.length >= MIN_INTERESTS;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Academic': return <Book className="me-1" />;
      case 'Local Activities': return <Sun className="me-1" />;
      case 'Hobbies': return <Controller className="me-1" />;
      case 'Community': return <People className="me-1" />;
      default: return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canContinue) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/profileapi/profile', { // ← now points at your App-Router route
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          major: selectedMajor,
          interests: selectedInterests,
        }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      if (!res.ok) {
        throw new Error(data.error || `Server returned ${res.status}`);
      }

      router.push('/signup/step4');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Container className="py-4 py-md-5 flex-grow-1 d-flex flex-column">
        <SignupProgress currentStep={3} totalSteps={5} />

        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <div className="text-center mb-4 mb-md-5">
              <h2 className="h3 fw-bold mb-2">Tell us about yourself</h2>
              <p className="text-muted">Help us personalize your experience at UHM.</p>
            </div>

            {error && <div className="text-danger mb-3 text-center">{error}</div>}

            <Form onSubmit={handleSubmit}>
              <Stack gap={4}>
                {/* Major selector */}
                <Form.Group controlId="majorSelect">
                  <Form.Label className="fw-medium">
                    Select Your Major
                    {' '}
                    <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup className="mb-2">
                    <Form.Control
                      type="text"
                      placeholder="Search for your major..."
                      value={majorSearch}
                      onChange={handleMajorSearchChange}
                      disabled={loading}
                    />
                    <InputGroup.Text><Search /></InputGroup.Text>
                  </InputGroup>
                  <Stack direction="horizontal" gap={2} className="flex-wrap">
                    <span className="small text-muted me-1">Popular:</span>
                    {popularMajors.map(mj => (
                      <Button
                        key={mj}
                        variant={selectedMajor === mj ? 'primary' : 'outline-secondary'}
                        size="sm"
                        className="rounded-pill"
                        onClick={() => handleMajorSelect(mj)}
                        disabled={loading}
                      >
                        {mj}
                      </Button>
                    ))}
                  </Stack>
                </Form.Group>

                {/* Interests selector */}
                <Form.Group controlId="interestSelect">
                  <Form.Label className="fw-medium">
                    Select Your Interests
                    {' '}
                    <span className="text-danger">*</span>
                    <span className="text-muted small fw-normal ms-1">
                      (Select at least
                      {' '}
                      {MIN_INTERESTS}
                      )
                    </span>
                  </Form.Label>
                  <Row className="g-3">
                    {Object.entries(interestCategories).map(([cat, ints]) => (
                      <Col key={cat} md={6}>
                        <Card className="h-100 border shadow-sm">
                          <Card.Body>
                            <Card.Title
                              as="h6"
                              className="text-muted small text-uppercase mb-3"
                            >
                              {getCategoryIcon(cat)}
                              {' '}
                              {cat}
                            </Card.Title>
                            <Stack direction="horizontal" gap={2} className="flex-wrap">
                              {ints.map(int => (
                                <Button
                                  key={int}
                                  variant={
                                    isInterestSelected(int)
                                      ? 'primary'
                                      : 'outline-secondary'
                                  }
                                  size="sm"
                                  className="rounded-pill"
                                  onClick={() => toggleInterest(int)}
                                  disabled={loading}
                                >
                                  {int}
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

                {/* Navigation buttons */}
                <Stack
                  direction="horizontal"
                  gap={3}
                  className="justify-content-between pt-3"
                >
                  <Link href="/signup/step2" passHref>
                    <Button variant="outline-secondary" disabled={loading}>
                      <ArrowLeft className="me-1" />
                      {' '}
                      Back
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    variant="success"
                    disabled={!canContinue || loading}
                  >
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
