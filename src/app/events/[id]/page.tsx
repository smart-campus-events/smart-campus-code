'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Badge, Button, Spinner, Alert, ListGroup, Tab, Nav,
} from 'react-bootstrap';
import {
  GeoAlt, Calendar3, Clock, Link45deg, EnvelopeAt, PeopleFill, Building,
  XCircleFill, CalendarCheck, Cash, InfoCircle, PinMapFill, Star, StarFill,
} from 'react-bootstrap-icons';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate, formatTime } from '@/lib/utils/dateUtils'; // This assumes you have these utility functions

// Define types
interface Category {
  id: string;
  name: string;
}

interface EventCategory {
  category: Category;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Club {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface Event {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string | null;
  allDay: boolean | null;
  description: string | null;
  costAdmission: string | null;
  attendanceType: string; // 'IN_PERSON', 'VIRTUAL', or 'HYBRID'
  location: string | null;
  locationVirtualUrl: string | null;
  organizerSponsor: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  eventUrl: string | null;
  eventPageUrl: string | null;
  categories: EventCategory[];
  submittedBy: User | null;
  organizerClub: Club | null;
  _count: {
    rsvps: number;
  };
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    // Fetch event details
    const fetchEventDetails = async () => {
      if (!eventId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Event not found');
          } else if (response.status === 403) {
            throw new Error('You do not have permission to view this event');
          } else {
            throw new Error('Failed to load event details');
          }
        }
        
        const data = await response.json();
        setEvent(data);
      } catch (err: any) {
        console.error('Error fetching event details:', err);
        setError(err.message || 'Failed to load event details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [eventId]);

  // Check if the event is favorited by the user
  useEffect(() => {
    // Use localStorage for favorites
    if (typeof window !== 'undefined' && eventId) {
      try {
        const storedFavorites = localStorage.getItem('favoriteEvents');
        if (storedFavorites) {
          const favorites = JSON.parse(storedFavorites);
          setIsFavorited(favorites.includes(eventId));
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    }
  }, [eventId]);

  const handleRSVP = async () => {
    if (!eventId) return;
    
    setRsvpStatus('loading');
    
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to RSVP');
      }
      
      // Update the RSVP count locally
      if (event) {
        setEvent({
          ...event,
          _count: {
            ...event._count,
            rsvps: event._count.rsvps + 1,
          },
        });
      }
      
      setRsvpStatus('success');
    } catch (err) {
      console.error('Error RSVPing to event:', err);
      setRsvpStatus('error');
    }
    
    // Reset status after showing feedback
    setTimeout(() => {
      setRsvpStatus(null);
    }, 3000);
  };

  const handleFavoriteToggle = async () => {
    try {
      // Optimistically update UI
      setIsFavorited(!isFavorited);
      
      // Update localStorage
      if (typeof window !== 'undefined' && eventId) {
        try {
          const storedFavorites = localStorage.getItem('favoriteEvents');
          let favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
          
          if (isFavorited) {
            // Remove from favorites
            favorites = favorites.filter((id: string) => id !== eventId);
          } else {
            // Add to favorites
            favorites.push(eventId);
          }
          
          localStorage.setItem('favoriteEvents', JSON.stringify(favorites));
        } catch (error) {
          console.error('Error updating favorites in localStorage:', error);
        }
      }
      
      // Make the API call (currently just a stub)
      const method = isFavorited ? 'DELETE' : 'POST';
      await fetch(`/api/events/${eventId}/favorite`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (err: any) {
      console.error('Error saving event:', err);
      
      // Revert the optimistic update on error
      setIsFavorited(!isFavorited);
      
      alert(`Error: ${err.message}`);
    }
  };

  // Helper function to format event date/time
  const formatEventDateTime = (event: Event) => {
    if (!event.startDateTime) return 'Date TBD';
    
    const startDate = new Date(event.startDateTime);
    let dateTimeStr = formatDate(startDate);
    
    if (!event.allDay) {
      dateTimeStr += ` at ${formatTime(startDate)}`;
      
      if (event.endDateTime) {
        const endDate = new Date(event.endDateTime);
        if (formatDate(startDate) === formatDate(endDate)) {
          // Same day, just show end time
          dateTimeStr += ` - ${formatTime(endDate)}`;
        } else {
          // Different days, show full end date and time
          dateTimeStr += ` - ${formatDate(endDate)} at ${formatTime(endDate)}`;
        }
      }
    } else {
      dateTimeStr += ' (All day)';
    }
    
    return dateTimeStr;
  };

  // Helper function to get attendance type label
  const getAttendanceTypeLabel = (type: string) => {
    switch (type) {
      case 'IN_PERSON':
        return { text: 'In Person', icon: <PinMapFill className="me-2" /> };
      case 'VIRTUAL':
        return { text: 'Virtual', icon: <Link45deg className="me-2" /> };
      case 'HYBRID':
        return { text: 'Hybrid', icon: <InfoCircle className="me-2" /> };
      default:
        return { text: 'In Person', icon: <PinMapFill className="me-2" /> };
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading event details...</p>
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
          <Button variant="outline-primary" onClick={() => router.push('/events')}>
            Return to Events Directory
          </Button>
        </Alert>
      </Container>
    );
  }

  // No Event Found State
  if (!event) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          <Alert.Heading>Event Not Found</Alert.Heading>
          <p>We couldn't find the event you're looking for.</p>
          <Button variant="outline-primary" onClick={() => router.push('/events')}>
            Return to Events Directory
          </Button>
        </Alert>
      </Container>
    );
  }

  const attendanceType = getAttendanceTypeLabel(event.attendanceType);

  // Render Event Details
  return (
    <Container className="my-4">
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <Link href="/events" className="text-decoration-none">
          ← Back to Events
        </Link>
      </div>

      {/* Event Header */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <Row>
            <Col md={8}>
              <h1 className="h2 mb-3">{event.title}</h1>

              <div className="mb-4">
                {event.categories.map(cat => (
                  <Badge 
                    key={cat.category.id} 
                    bg="info-subtle"
                    text="info-emphasis"
                    className="me-2 px-3 py-2"
                  >
                    {cat.category.name}
                  </Badge>
                ))}
              </div>

              <div className="d-flex flex-column gap-2 text-secondary mb-4">
                <div className="d-flex align-items-center">
                  <Calendar3 className="me-2 flex-shrink-0" />
                  <span>{formatEventDateTime(event)}</span>
                </div>

                <div className="d-flex align-items-center">
                  {attendanceType.icon}
                  <span>{attendanceType.text}</span>
                </div>

                {event.location && (
                  <div className="d-flex align-items-center">
                    <GeoAlt className="me-2 flex-shrink-0" />
                    <span>{event.location}</span>
                  </div>
                )}

                {event.costAdmission && (
                  <div className="d-flex align-items-center">
                    <Cash className="me-2 flex-shrink-0" />
                    <span>{event.costAdmission}</span>
                  </div>
                )}

                {event.organizerSponsor && (
                  <div className="d-flex align-items-center">
                    <Building className="me-2 flex-shrink-0" />
                    <span>Organized by: {event.organizerSponsor}</span>
                  </div>
                )}
              </div>
            </Col>

            <Col md={4} className="d-flex flex-column align-items-end">
              <div className="d-flex flex-column align-items-end mb-3">
                <span className="text-muted">{event._count.rsvps} people attending</span>
                
                <Button 
                  variant="link" 
                  className="p-0 text-decoration-none" 
                  onClick={handleFavoriteToggle}
                  aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  {isFavorited ? (
                    <span className="text-warning d-flex align-items-center">
                      <StarFill className="me-1" /> Saved to favorites
                    </span>
                  ) : (
                    <span className="text-muted d-flex align-items-center">
                      <Star className="me-1" /> Save to favorites
                    </span>
                  )}
                </Button>
              </div>

              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleRSVP}
                disabled={rsvpStatus === 'loading'}
                className="w-100 mb-2"
              >
                {rsvpStatus === 'loading' ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CalendarCheck className="me-2" />
                    RSVP to this event
                  </>
                )}
              </Button>

              {rsvpStatus === 'success' && (
                <Alert variant="success" className="w-100 py-2 mb-0">
                  Successfully RSVP'd to event!
                </Alert>
              )}

              {rsvpStatus === 'error' && (
                <Alert variant="danger" className="w-100 py-2 mb-0">
                  Failed to RSVP. Please try again.
                </Alert>
              )}

              {event.eventPageUrl && (
                <Button 
                  variant="outline-secondary" 
                  className="w-100 mt-2"
                  as="a"
                  href={event.eventPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Link45deg className="me-2" />
                  Official Event Page
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Event Content */}
      <Row className="g-4">
        <Col md={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <h2 className="h4 mb-3">About This Event</h2>
              
              {event.description ? (
                <p className="mb-0">{event.description}</p>
              ) : (
                <p className="text-muted fst-italic mb-0">No description provided.</p>
              )}
            </Card.Body>
          </Card>

          {/* Virtual Link Section (only for VIRTUAL or HYBRID events) */}
          {(event.attendanceType === 'VIRTUAL' || event.attendanceType === 'HYBRID') && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h2 className="h4 mb-3">Virtual Attendance</h2>
                
                {event.locationVirtualUrl ? (
                  <div>
                    <p>This event can be attended virtually. Use the link below to join:</p>
                    <div className="d-grid">
                      <Button 
                        variant="outline-primary" 
                        as="a"
                        href={event.locationVirtualUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Link45deg className="me-2" />
                        Join Virtual Event
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted fst-italic mb-0">
                    Virtual attendance link will be provided closer to the event.
                  </p>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col md={4}>
          {/* Contact Information */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <h2 className="h5 mb-3">Contact Information</h2>
              
              <ListGroup variant="flush" className="mb-0">
                {event.contactName && (
                  <ListGroup.Item className="px-0 py-2 border-top-0">
                    <div className="d-flex align-items-center">
                      <PeopleFill className="me-2 text-secondary" />
                      <span>{event.contactName}</span>
                    </div>
                  </ListGroup.Item>
                )}
                
                {event.contactEmail && (
                  <ListGroup.Item className="px-0 py-2">
                    <div className="d-flex align-items-center">
                      <EnvelopeAt className="me-2 text-secondary" />
                      <a 
                        href={`mailto:${event.contactEmail}`}
                        className="text-decoration-none"
                      >
                        {event.contactEmail}
                      </a>
                    </div>
                  </ListGroup.Item>
                )}
                
                {event.contactPhone && (
                  <ListGroup.Item className="px-0 py-2">
                    <div className="d-flex align-items-center">
                      <Link45deg className="me-2 text-secondary" />
                      <a 
                        href={`tel:${event.contactPhone}`}
                        className="text-decoration-none"
                      >
                        {event.contactPhone}
                      </a>
                    </div>
                  </ListGroup.Item>
                )}

                {/* If no contact info is provided */}
                {!event.contactName && !event.contactEmail && !event.contactPhone && (
                  <ListGroup.Item className="px-0 py-2 border-top-0 text-muted fst-italic">
                    No contact information provided.
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Organizing Club (if present) */}
          {event.organizerClub && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h2 className="h5 mb-3">Organized By</h2>
                
                <div className="d-flex align-items-center">
                  {event.organizerClub.logoUrl ? (
                    <img 
                      src={event.organizerClub.logoUrl} 
                      alt={event.organizerClub.name}
                      width={40}
                      height={40}
                      className="rounded-circle me-3"
                    />
                  ) : (
                    <div 
                      className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '40px', height: '40px' }}
                    >
                      <span className="text-secondary">
                        {event.organizerClub.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="h6 mb-0">{event.organizerClub.name}</h3>
                    <Link 
                      href={`/clubs/${event.organizerClub.id}`} 
                      className="small"
                    >
                      View club page
                    </Link>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
} 