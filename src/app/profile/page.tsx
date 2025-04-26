/* eslint-disable react/no-unescaped-entities, react/no-array-index-key */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Image,
  Row,
  Spinner,
} from 'react-bootstrap';
import {
  BoxArrowRight,
  PencilSquare,
  Star,
  StarFill,
} from 'react-bootstrap-icons';

interface ProfileData {
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  major?: string;
  interests: { id: string; name: string }[];
  age_range?: string;
  origin?: string;
  housing_status?: string;
  comfort_level?: number;
  graduation_year?: number;
  about_me?: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // dummy data for Saved Events / My RIOs
  const savedEvents = [
    { month: 'MAR', day: '15', name: 'Tech Meetup', details: '6:00 PM – Campus Center' },
    { month: 'MAR', day: '20', name: 'Beach Cleanup', details: '9:00 AM – Ala Moana' },
  ];

  const myRios = [
    {
      imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
      name: 'ACM Manoa',
      description: 'Computer Science Club',
    },
    {
      imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
      name: 'Hiking Club',
      description: 'Outdoor Activities',
    },
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profileapi/profile', { credentials: 'include' });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }
        const data: ProfileData = await res.json();
        setProfile(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-danger">
        Failed to load profile:
        <br />
        {error}
      </div>
    );
  }

  if (!profile) {
    return <div className="p-4 text-center">No profile data.</div>;
  }

  // coalesce comfort_level for TS
  const comfortLevel = profile.comfort_level ?? 0;

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-4 py-md-5">
        {/* Profile Header */}
        <Row className="justify-content-center mb-5">
          <Col lg={8} className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <Image
                src={profile.avatar_url || '/default-avatar.png'}
                alt="Avatar"
                roundedCircle
                style={{ width: 80, height: 80, border: '4px solid var(--bs-success)' }}
              />
              <div className="ms-3">
                <h1 className="h4 fw-bold mb-0">
                  {profile.first_name && profile.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile.name || profile.email}
                  's Profile
                </h1>
                <p className="text-muted mb-0">
                  Member since
                  {' '}
                  {new Date(profile.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => router.push('/profile/edit')}
              >
                <PencilSquare className="me-1" />
                {' '}
                Edit Profile
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => router.push('/api/auth/signout')}
              >
                <BoxArrowRight className="me-1" />
                {' '}
                Logout
              </Button>
            </div>
          </Col>
        </Row>

        <Row className="justify-content-center">
          {/* Left Column */}
          <Col md={8} className="mb-4 mb-md-0">
            <div className="d-flex flex-column gap-4">
              {/* Basic Information */}
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title className="h5 mb-4">Basic Information</Card.Title>
                  <div className="mb-3">
                    <p className="text-muted mb-1">Email</p>
                    <p className="fw-medium mb-0">{profile.email}</p>
                  </div>
                  {profile.major && (
                    <div className="mb-3">
                      <p className="text-muted mb-1">Major</p>
                      <p className="fw-medium mb-0">{profile.major}</p>
                    </div>
                  )}
                  {profile.interests.length > 0 && (
                    <>
                      <p className="text-muted mb-1">Interests</p>
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {profile.interests.map((i) => (
                          <Badge key={i.id} pill bg="success-subtle" text="success-emphasis">
                            {i.name}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>

              {/* Additional Details */}
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title className="h5 mb-4">Additional Details</Card.Title>
                  <Row>
                    {profile.age_range && (
                      <Col sm={6} className="mb-3">
                        <p className="text-muted mb-1">Age Range</p>
                        <p className="fw-medium mb-0">{profile.age_range}</p>
                      </Col>
                    )}
                    {profile.origin && (
                      <Col sm={6} className="mb-3">
                        <p className="text-muted mb-1">Origin</p>
                        <p className="fw-medium mb-0">{profile.origin}</p>
                      </Col>
                    )}
                    {profile.graduation_year && (
                      <Col sm={6} className="mb-3">
                        <p className="text-muted mb-1">Graduation Year</p>
                        <p className="fw-medium mb-0">{profile.graduation_year}</p>
                      </Col>
                    )}
                    {profile.housing_status && (
                      <Col sm={6} className="mb-3">
                        <p className="text-muted mb-1">Housing Status</p>
                        <p className="fw-medium mb-0">
                          {profile.housing_status
                            .split('_')
                            .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
                            .join(' ')}
                        </p>
                      </Col>
                    )}
                    {profile.comfort_level != null && (
                      <Col sm={6} className="mb-3">
                        <p className="text-muted mb-1">Comfort Level</p>
                        <div className="d-flex text-warning">
                          {[...Array(5)].map((_, i) => (i < comfortLevel ? <StarFill key={i} /> : <Star key={i} />))}
                        </div>
                      </Col>
                    )}
                  </Row>
                  {profile.about_me && (
                    <Row className="mt-3">
                      <Col>
                        <p className="text-muted mb-1">About Me</p>
                        <p className="mb-0">{profile.about_me}</p>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Col>

          {/* Right Column */}
          <Col md={4}>
            <div className="d-flex flex-column gap-4">
              {/* Saved Events */}
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title className="h5 mb-4">Saved Events</Card.Title>
                  {savedEvents.map((e, idx) => (
                    <div key={idx} className="d-flex mb-3">
                      <div className="text-center me-3">
                        <h6 className="mb-0">{e.month}</h6>
                        <p className="h4 mb-0">{e.day}</p>
                      </div>
                      <div>
                        <p className="fw-semibold mb-1">{e.name}</p>
                        <p className="text-muted mb-0">{e.details}</p>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-3">
                    <Button variant="primary" size="sm" onClick={() => router.push('/events')}>
                      View All Events
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              {/* My RIOs */}
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title className="h5 mb-4">My RIOs</Card.Title>
                  {myRios.map((r, idx) => (
                    <div key={idx} className="d-flex mb-3">
                      <Image
                        src={r.imageUrl}
                        alt={r.name}
                        roundedCircle
                        style={{ width: 40, height: 40 }}
                        className="me-3"
                      />
                      <div>
                        <p className="fw-semibold mb-1">{r.name}</p>
                        <p className="text-muted mb-0">{r.description}</p>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-3">
                    <Button variant="primary" size="sm" onClick={() => router.push('/clubs')}>
                      View All RIOs
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
