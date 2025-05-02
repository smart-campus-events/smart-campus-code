'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Badge, Button, Spinner, Alert, ListGroup, Tab, Nav,
} from 'react-bootstrap';
import {
  GeoAlt, Calendar3, Link45deg, EnvelopeAt, People, Instagram, Facebook, Twitter,
  BookmarkFill, Bookmark,
} from 'react-bootstrap-icons';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

// Define types
interface Category {
  id: string;
  name: string;
}

interface ClubCategory {
  category: Category;
}

interface Event {
  id: string;
  title: string;
  startDateTime: string;
  location: string | null;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Club {
  id: string;
  name: string;
  purpose: string;
  logoUrl: string | null;
  primaryContactName: string | null;
  contactEmail: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  meetingTime: string | null;
  meetingLocation: string | null;
  joinInfo: string | null;
  categories: ClubCategory[];
  submittedBy: User | null;
  hostedEvents: Event[];
  _count: {
    favoritedBy: number;
    hostedEvents: number;
  };
}

export default function ClubDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as string;

  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  useEffect(() => {
    // Fetch club details
    const fetchClubDetails = async () => {
      if (!clubId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/clubs/${clubId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Club not found');
          } else if (response.status === 403) {
            throw new Error('You do not have permission to view this club');
          } else {
            throw new Error('Failed to load club details');
          }
        }

        const data = await response.json();
        setClub(data);
      } catch (err: any) {
        console.error('Error fetching club details:', err);
        setError(err.message || 'Failed to load club details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubDetails();
  }, [clubId]);

  // Check if the club is favorited by the user
  useEffect(() => {
    const checkFavoriteStatus = () => {
      // Use localStorage for favorites
      if (typeof window !== 'undefined' && clubId) {
        try {
          const storedFavorites = localStorage.getItem('favoriteClubs');
          if (storedFavorites) {
            const favorites = JSON.parse(storedFavorites);
            setIsFavorited(favorites.includes(clubId));
          }
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };

    checkFavoriteStatus();
  }, [clubId]);

  const handleFollowClub = async () => {
    // No login required for now
    try {
      // Optimistically update UI
      setIsFavorited(!isFavorited);
      if (club) {
        setClub({
          ...club,
          _count: {
            ...club._count,
            favoritedBy: isFavorited
              ? club._count.favoritedBy - 1
              : club._count.favoritedBy + 1,
          },
        });
      }

      // Update localStorage
      if (typeof window !== 'undefined' && clubId) {
        try {
          const storedFavorites = localStorage.getItem('favoriteClubs');
          let favorites = storedFavorites ? JSON.parse(storedFavorites) : [];

          if (isFavorited) {
            // Remove from favorites
            favorites = favorites.filter((id: string) => id !== clubId);
          } else {
            // Add to favorites
            favorites.push(clubId);
          }

          localStorage.setItem('favoriteClubs', JSON.stringify(favorites));
        } catch (error) {
          console.error('Error updating favorites in localStorage:', error);
        }
      }

      // Make the API call (currently just a stub)
      const method = isFavorited ? 'DELETE' : 'POST';
      await fetch(`/api/clubs/${clubId}/favorite`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (err: any) {
      console.error('Error following club:', err);

      // Revert the optimistic updates on error
      setIsFavorited(!isFavorited);
      if (club) {
        setClub({
          ...club,
          _count: {
            ...club._count,
            favoritedBy: isFavorited
              ? club._count.favoritedBy + 1
              : club._count.favoritedBy - 1,
          },
        });
      }

      alert(`Error: ${err.message}`);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading club details...</p>
      </Container>
    );
  }

  // Error State
  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-primary" onClick={() => router.push('/clubs')}>
            Return to Club Directory
          </Button>
        </Alert>
      </Container>
    );
  }

  // No Club Found State
  if (!club) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          <Alert.Heading>Club Not Found</Alert.Heading>
          <p>We couldn't find the club you're looking for.</p>
          <Button variant="outline-primary" onClick={() => router.push('/clubs')}>
            Return to Club Directory
          </Button>
        </Alert>
      </Container>
    );
  }

  // Render Club Details
  return (
    <Container className="my-4">
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <Link href="/clubs" className="text-decoration-none">
          ← Back to Clubs Directory
        </Link>
      </div>

      {/* Club Header */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={2} className="text-center mb-3 mb-md-0">
              {club.logoUrl ? (
                <Image
                  src={club.logoUrl}
                  alt={`${club.name} logo`}
                  width={100}
                  height={100}
                  className="rounded-circle"
                />
              ) : (
                <div
                  className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '100px', height: '100px', margin: '0 auto' }}
                >
                  <span className="h3 text-secondary m-0">
                    {club.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </Col>

            <Col md={7}>
              <h1 className="h2 mb-1">{club.name}</h1>
              <div className="mb-2">
                {club.categories.map(cat => (
                  <Badge
                    key={cat.category.id}
                    bg="secondary"
                    className="me-1"
                  >
                    {cat.category.name}
                  </Badge>
                ))}
              </div>
              <div className="text-muted small d-flex align-items-center flex-wrap">
                {club.meetingLocation && (
                  <span className="me-3 d-flex align-items-center">
                    <GeoAlt className="me-1" />
                    {' '}
                    {club.meetingLocation}
                  </span>
                )}
                {club.meetingTime && (
                  <span className="me-3 d-flex align-items-center">
                    <Calendar3 className="me-1" />
                    {' '}
                    {club.meetingTime}
                  </span>
                )}
                <span className="d-flex align-items-center">
                  <People className="me-1" />
                  {' '}
                  {club._count.favoritedBy}
                  {' '}
                  followers
                </span>
              </div>
            </Col>

            <Col md={3} className="text-md-end">
              <Button
                variant={isFavorited ? 'outline-primary' : 'primary'}
                className="mb-2 w-100"
                onClick={handleFollowClub}
                disabled={isLoadingFavorite}
              >
                {isLoadingFavorite ? (
                  <Spinner size="sm" animation="border" role="status" />
                ) : (
                  <>
                    {isFavorited ? <BookmarkFill className="me-1" /> : <Bookmark className="me-1" />}
                    {isFavorited ? 'Following' : 'Follow Club'}
                  </>
                )}
              </Button>
              <div className="d-flex justify-content-md-end justify-content-center gap-2">
                {club.websiteUrl && (
                  <a
                    href={club.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-secondary"
                  >
                    <Link45deg />
                    {' '}
                    Website
                  </a>
                )}
                {club.instagramUrl && (
                  <a
                    href={club.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-secondary"
                  >
                    <Instagram />
                  </a>
                )}
                {club.facebookUrl && (
                  <a
                    href={club.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-secondary"
                  >
                    <Facebook />
                  </a>
                )}
                {club.twitterUrl && (
                  <a
                    href={club.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-secondary"
                  >
                    <Twitter />
                  </a>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Club Content */}
      <Row>
        <Col lg={8}>
          <Tab.Container id="club-tabs" defaultActiveKey="about">
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white">
                <Nav variant="tabs" className="border-bottom-0">
                  <Nav.Item>
                    <Nav.Link eventKey="about">About</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="events">
                      Events
                      {' '}
                      {club._count.hostedEvents > 0 && `(${club._count.hostedEvents})`}
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>
              <Card.Body>
                <Tab.Content>
                  <Tab.Pane eventKey="about">
                    <h3 className="h5 mb-3">About This Club</h3>
                    <p className="mb-4">{club.purpose}</p>

                    {club.joinInfo && (
                      <>
                        <h3 className="h5 mb-3">How To Join</h3>
                        <p className="mb-4">{club.joinInfo}</p>
                      </>
                    )}
                  </Tab.Pane>
                  <Tab.Pane eventKey="events">
                    <h3 className="h5 mb-3">Upcoming Events</h3>
                    {club.hostedEvents && club.hostedEvents.length > 0 ? (
                      <ListGroup variant="flush">
                        {club.hostedEvents.map(event => (
                          <ListGroup.Item key={event.id} className="px-0">
                            <Link href={`/events/${event.id}`} className="text-decoration-none">
                              <h4 className="h6 mb-1">{event.title}</h4>
                              <div className="small text-muted">
                                <span className="me-3">
                                  <Calendar3 className="me-1" />
                                  {new Date(event.startDateTime).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {event.location && (
                                  <span>
                                    <GeoAlt className="me-1" />
                                    {event.location}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <p>No upcoming events scheduled. Check back later!</p>
                    )}
                    <div className="mt-3">
                      <Link href="/events" className="btn btn-outline-primary btn-sm">
                        See All Events
                      </Link>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Tab.Container>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h3 className="h5 mb-3">Contact Information</h3>
              <ListGroup variant="flush">
                {club.primaryContactName && (
                  <ListGroup.Item className="px-0 border-0">
                    <div className="fw-bold mb-1">Contact Person</div>
                    <div>{club.primaryContactName}</div>
                  </ListGroup.Item>
                )}
                {club.contactEmail && (
                  <ListGroup.Item className="px-0 border-0">
                    <div className="fw-bold mb-1">Email</div>
                    <a href={`mailto:${club.contactEmail}`}>
                      <EnvelopeAt className="me-1" />
                      {club.contactEmail}
                    </a>
                  </ListGroup.Item>
                )}
                {club.meetingLocation && (
                  <ListGroup.Item className="px-0 border-0">
                    <div className="fw-bold mb-1">Meeting Location</div>
                    <div>
                      <GeoAlt className="me-1" />
                      {club.meetingLocation}
                    </div>
                  </ListGroup.Item>
                )}
                {club.meetingTime && (
                  <ListGroup.Item className="px-0 border-0">
                    <div className="fw-bold mb-1">Meeting Time</div>
                    <div>
                      <Calendar3 className="me-1" />
                      {club.meetingTime}
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
