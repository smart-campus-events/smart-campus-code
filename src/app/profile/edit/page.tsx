'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

const MAX_ABOUT_ME_LENGTH = 500;

interface ProfileData {
  email: string;
  first_name?: string;
  last_name?: string;
  major?: string;
  interests: { id: string; name: string }[];
  origin?: string;
  housing_status?: string;
  comfort_level?: number;
  graduation_year?: number;
  email_notifications: boolean;
  about_me?: string;
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

const availableInterests = [
  'Hiking',
  'Volunteering',
  'Music',
  'Gaming',
  'Culture',
  'Surfing',
  'Art',
  'Leadership',
];

const housingStatuses = [
  { label: 'On-Campus Dorm', value: 'on_campus_dorm' },
  { label: 'On-Campus Apartment', value: 'on_campus_apt' },
  { label: 'Off-Campus', value: 'off_campus' },
  { label: 'Commuter', value: 'commuter' },
  { label: 'With Family', value: 'with_family' },
  { label: 'Other', value: 'other' },
];

const prismaHousingStatusMap: Record<string, string> = {
  on_campus_dorm: 'ON_CAMPUS_DORM',
  on_campus_apt: 'ON_CAMPUS_APT',
  off_campus: 'OFF_CAMPUS',
  commuter: 'COMMUTER',
  with_family: 'WITH_FAMILY',
  other: 'OTHER',
};

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [major, setMajor] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [origin, setOrigin] = useState('');
  const [housingStatus, setHousingStatus] = useState('');
  const [comfortLevel, setComfortLevel] = useState(0);
  const [graduationYear, setGraduationYear] = useState<number | ''>('');
  const [aboutMe, setAboutMe] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/profileapi/profile', {
          credentials: 'include',
        });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!res.ok) throw new Error(`Error ${res.status}`);

        const data: ProfileData = await res.json();
        setProfile(data);

        setFirstName(data.first_name ?? '');
        setLastName(data.last_name ?? '');
        setMajor(data.major ?? '');
        setInterests(data.interests.map((i) => i.name));
        setOrigin(data.origin ?? '');
        setHousingStatus(data.housing_status ?? '');
        setComfortLevel(data.comfort_level ?? 0);
        setGraduationYear(data.graduation_year ?? '');
        setAboutMe(data.about_me ?? '');
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleToggleInterest = (interest: string) => {
    setInterests((prev) => (prev.includes(interest)
      ? prev.filter((i) => i !== interest)
      : [...prev, interest]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const body = {
      first_name: firstName,
      last_name: lastName,
      major,
      origin,
      housing_status: prismaHousingStatusMap[housingStatus] ?? null,
      comfort_level: comfortLevel,
      graduation_year: graduationYear,
      about_me: aboutMe,
      interests,
    };

    const res = await fetch('/profileapi/profile', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      router.push('/login');
      return;
    }

    if (!res.ok) {
      const errorData = await res.json();
      alert(`Update failed: ${errorData.error || res.statusText}`);
      return;
    }

    router.push('/profile');
  };

  if (loading) return <div className="p-4">Loading profile...</div>;
  if (error) {
    return (
      <div className="p-4 text-danger">
        Error:
        {error}
      </div>
    );
  }
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
                  <h2 className="h5 fw-semibold pb-2 mb-4 border-bottom">
                    Basic Information
                  </h2>
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <FloatingLabel label="First Name">
                        <Form.Control
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </FloatingLabel>
                    </Col>
                    <Col md={6}>
                      <FloatingLabel label="Last Name">
                        <Form.Control
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </FloatingLabel>
                    </Col>
                    <Col md={12}>
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

                  <h2 className="h5 fw-semibold pb-2 mb-4 border-bottom">Interests</h2>
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {availableInterests.map((interest) => (
                      <Badge
                        key={interest}
                        pill
                        bg={
                          interests.includes(interest)
                            ? 'success'
                            : 'secondary-subtle'
                        }
                        text={interests.includes(interest) ? 'light' : 'dark'}
                        className="py-2 px-3 cursor-pointer"
                        onClick={() => handleToggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>

                  <h2 className="h5 fw-semibold pb-2 mb-4 border-bottom">Additional Details</h2>
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
                            <option key={hs.value} value={hs.value}>
                              {hs.label}
                            </option>
                          ))}
                        </Form.Select>
                      </FloatingLabel>
                    </Col>
                    <Col md={4}>
                      <FloatingLabel label="Comfort Level">
                        <Form.Select
                          value={comfortLevel}
                          onChange={(e) => setComfortLevel(+e.target.value)}
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

                  <h2 className="h5 fw-semibold pb-2 mb-4 border-bottom">About Me</h2>
                  <FloatingLabel label="Write a few sentences about yourself..." className="mb-4">
                    <Form.Control
                      as="textarea"
                      style={{ height: '150px' }}
                      maxLength={MAX_ABOUT_ME_LENGTH}
                      value={aboutMe}
                      onChange={(e) => setAboutMe(e.target.value)}
                    />
                    <div className="text-end text-muted small mt-1">
                      {aboutMe.length}
                      /
                      {MAX_ABOUT_ME_LENGTH}
                    </div>
                  </FloatingLabel>

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
