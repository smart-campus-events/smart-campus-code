/* eslint-disable react/no-unescaped-entities, react/no-array-index-key */

'use client';

import InitialAvatar from '@/components/InitialAvatar';
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
  firstName?: string;
  lastName?: string;
  avatar_url?: string;
  major?: string;
  interests: { id: string; name: string }[];
  age_range?: string;
  origin?: string;
  housingStatus?: string;
  comfortLevel?: number;
  graduation_year?: number;
  about_me?: string;
  createdAt: string;
}

// shape of each saved event coming back from your API
interface SavedEvent {
  id: string;
  title: string;
  startDateTime: string; // ISO string
  location: string;
}

interface FollowedClub {
  id: string;
  name: string;
  purpose?: string;
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followedClubs, setFollowedClubs] = useState<FollowedClub[]>([]);

  // dummy data for My RIOs
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
        // 1) load profile
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

        // 2) fetch all saved events
        const evRes = await fetch('/api/savedEvents', { credentials: 'include' });
        if (!evRes.ok) {
          throw new Error(`Could not fetch saved events: ${evRes.status}`);
        }
        const allEvents: SavedEvent[] = await evRes.json();
        const shuffledEvents = allEvents.sort(() => 0.5 - Math.random());
        setSavedEvents(shuffledEvents.slice(0, 2));

        // 3) fetch all followed clubs
        const fcRes = await fetch('/api/clubs/${club.id}/follow', { credentials: 'include' });
        if (!fcRes.ok) {
          throw new Error(`Could not fetch followed clubs: ${fcRes.status}`);
        }
        const allClubs: FollowedClub[] = await fcRes.json();
        const shuffledClubs = allClubs.sort(() => 0.5 - Math.random());
        setFollowedClubs(shuffledClubs.slice(0, 2));
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
  const comfortLevel = profile.comfortLevel ?? 0;
  const avatarSrc = profile.avatar_url?.trim() || '';
  const displayName = profile.firstName
    ? `${profile.firstName}${profile.lastName ? ` ${profile.lastName}` : ''}`
    : profile.email;

  // helper to format date/time
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="bg-light min-vh-100 overflow-auto">
      <Container className="py-4 py-md-5">
        {/* Profile Header */}
        <Row className="justify-content-center mb-5">
          <Col lg={8} className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt="Profile Picture"
                  roundedCircle
                  style={{ width: '80px', height: '80px', border: '4px solid var(--bs-success)' }}
                />
              ) : (
                <InitialAvatar name={displayName} size={80} />
              )}
              <div className="ms-3">
                <h1 className="h4 fw-bold mb-0">
                  {profile.firstName && profile.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile.name || profile.email}
                  's Profile
                </h1>
                <p className="text-muted mb-0">
                  Member since&nbsp;
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                    })
                    : 'Unknown'}
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
                Edit Profile
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => router.push('/api/auth/signout')}
              >
                <BoxArrowRight className="me-1" />
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
                    {profile.housingStatus && (
                      <Col sm={6} className="mb-3">
                        <p className="text-muted mb-1">Housing Status</p>
                        <p className="fw-medium mb-0">
                          {profile.housingStatus
                            .split('_')
                            .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
                            .join(' ')}
                        </p>
                      </Col>
                    )}
                    {profile.comfortLevel != null && (
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
                  {savedEvents.map((e) => {
                    const [month, dayNum] = fmtDate(e.startDateTime).split(' ');
                    return (
                      <div key={e.id} className="d-flex mb-3">
                        <div className="text-center me-3">
                          <h6 className="mb-0">{month}</h6>
                          <p className="h4 mb-0">{dayNum}</p>
                        </div>
                        <div>
                          <p className="fw-semibold mb-1">{e.title}</p>
                          <p className="text-muted mb-0">
                            {fmtTime(e.startDateTime)}
                            {' '}
                            –
                            {e.location}
                          </p>
                        </div>
                      </div>
                    );
                  })}

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
                  <Card.Title className="h5 mb-4">Followed Clubs</Card.Title>
                  {followedClubs.map((c) => (
                    <div key={c.id} className="mb-3">
                      <p className="fw-semibold mb-1">{c.name}</p>
                      {c.purpose && (
                        <p className="text-muted mb-0">
                          {c.purpose.length > 60
                            ? c.purpose.substring(0, 60) + '...'
                            : c.purpose}
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="text-center mt-3">
                    <Button variant="primary" size="sm" onClick={() => router.push('/clubs')}>
                      View All Clubs
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
