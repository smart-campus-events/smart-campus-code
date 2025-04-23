
'use client';

/* eslint-disable max-len */
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  FloatingLabel,
  Form,
  Row,
} from 'react-bootstrap';
import { X } from 'react-bootstrap-icons';

const MAX_ABOUT_ME_LENGTH = 500;

// Simplified user shape returned from /api/profile
interface ProfileData {
  name?: string;
  first_name?: string;
  email: string;
  major?: string;
  interests: { id: string; name: string }[];
  origin?: string;
  housing_status?: string;
  comfort_level?: number;
  graduation_year?: number;
  email_notifications: boolean;
}

const availableMajors = [
  'Computer Science',
  'Marine Biology',
  'Hawaiian Studies',
  'Business Administration',
  'Psychology',
  'Engineering',
  'Art',
];
const housingStatuses = ['On-Campus Dorm', 'Off-Campus Commuter'];

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [major, setMajor] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [origin, setOrigin] = useState('');
  const [housingStatus, setHousingStatus] = useState('');
  const [comfortLevel, setComfortLevel] = useState(0);
  const [graduationYear, setGraduationYear] = useState<number | ''>('');

  // Load existing profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data: ProfileData = await res.json();
        setProfile(data);
        setFullName(data.name ?? data.first_name ?? '');
        setMajor(data.major ?? '');
        setInterests(data.interests.map((i) => i.name));
        setOrigin(data.origin ?? '');
        // Convert enum format to human text
        setHousingStatus(
          data.housing_status
            ? data.housing_status
                .toLowerCase()
                .split('_')
                .map((w) => w[0].toUpperCase() + w.slice(1))
                .join(' ')
            : ''
        );
        setComfortLevel(data.comfort_level ?? 0);
        setGraduationYear(data.graduation_year ?? '');
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleRemoveInterest = (interest: string) => {
    setInterests((prev) => prev.filter((i) => i !== interest));
  };

  const handleAddInterest = () => {
    // Launch a modal or prompt here
    const newInterest = prompt('Enter new interest:');
    if (newInterest) setInterests((prev) => [...prev, newInterest]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const body = {
      fullName,
      major,
      origin,
      housingStatus,
      comfortLevel,
      graduationYear,
      interests,
    };
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const { error } = await res.json();
      alert('Update failed: ' + error);
      return;
    }
    window.location.href = '/profile';
  };

  if (loading) return <div className="p-4">Loading profile...</div>;
  if (error) return <div className="p-4">Error: {error}</div>;
  if (!profile) return <div className="p-4">No profile data.</div>;

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-4 py-md-5">
        <Row className="justify-content-center">
          <Col lg={8} xl={7}>
            <div className="mb-4 text-center text-md-start">
              <h1 className="h2 fw-bold mb-2">Edit Profile</h1>
              <p className="text-muted">
                Update your information to get better recommendations.
              </p>
            </div>
            <Card className="shadow-sm">
              <Card.Body className="p-4 p-md-5">
                <Form onSubmit={handleSubmit}>
                  {/* Basic Info */}
                  <h2 className="h5 fw-semibold pb-2 mb-4 border-bottom">
                    Basic Information
                  </h2>
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <FloatingLabel label="Full Name">
                        <Form.Control
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </FloatingLabel>
                    </Col>
                    <Col md={6}>
                      <FloatingLabel label="Email Address">
                        <Form.Control
                          type="email"
                          value={profile.email}
                          readOnly
                          disabled
                        />
                      </FloatingLabel>
                    </Col>
                    <Col md={12}>
                      <FloatingLabel label="Major">
                        <Form.Select
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                        >
                          <option value="">Select major</option>
                          {availableMajors.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </Form.Select>
                      </FloatingLabel>
                    </Col>
                  </Row>

                  {/* Interests */}
                  <h2 className="h5 fw-semibold pb-2 mb-4 border-bottom">
                    Interests
                  </h2>
                  <Form.Group className="mb-4">
                    <Form.Label>Select your interests</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {interests.map((i) => (
                        <Badge
                          key={i}
                          pill
                          bg="success-subtle"
                          text="success-emphasis"
                          className="d-inline-flex align-items-center py-2 px-3"
                        >
                          {i}
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 ms-2 lh-1"
                            onClick={() => handleRemoveInterest(i)}
                          >
                            <X size={16} />
                          </Button>
                        </Badge>
                      ))}
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="rounded-pill"
                        onClick={handleAddInterest}
                      >
                        + Add Interest
                      </Button>
                    </div>
                  </Form.Group>

                  {/* Additional Details */}
                  <h2 className="h5 fw-semibold pb-2 mb-4 border-bottom">
                    Additional Details
                  </h2>
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <FloatingLabel label="Origin">
                        <Form.Control
                          type="text"
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                        />
                      </FloatingLabel>
                    </Col>
                    <Col md={6}>
                      <FloatingLabel label="Housing Status">
                        <Form.Select
                          value={housingStatus}
                          onChange={(e) => setHousingStatus(e.target.value)}
                        >
                          <option value="">Select housing</option>
                          {housingStatuses.map((hs) => (
                            <option key={hs} value={hs}>
                              {hs}
                            </option>
                          ))}
                        </Form.Select>
                      </FloatingLabel>
                    </Col>
                    <Col md={4}>
                      <FloatingLabel label="Comfort Level">
                        <Form.Select
                          value={comfortLevel}
                          onChange={(e) => setComfortLevel(parseInt(e.target.value, 10))}
                        >
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </Form.Select>
                      </FloatingLabel>
                    </Col>
                    <Col md={4}>
                      <FloatingLabel label="Graduation Year">
                        <Form.Control
                          type="number"
                          value={graduationYear}
                          onChange={(e) => setGraduationYear(parseInt(e.target.value, 10) || '')}
                        />
                      </FloatingLabel>
                    </Col>
                  </Row>

                  {/* Actions */}
                  <div className="d-flex justify-content-end gap-2 pt-4 border-top">
                    <Link href="/profile" passHref>
                      <Button variant="outline-secondary">Cancel</Button>
                    </Link>
                    <Button type="submit" variant="success">
                      Save Changes
                    </Button>
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