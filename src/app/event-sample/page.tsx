'use client';

/* eslint-disable max-len */
import React from 'react';
import { Container, Row, Col, Image, Button, Card, Badge, ListGroup } from 'react-bootstrap';
// eslint-disable-next-line max-len
import { ArrowLeft, Bell, Calendar, CalendarPlus, Envelope, GeoAltFill, Globe, Heart, Share, TicketPerforated } from 'react-bootstrap-icons';
import Link from 'next/link';

// TODO: Replace hardcoded data with actual data fetching (e.g., based on an event ID)
// TODO: Implement functionality for buttons (RSVP, Add to Calendar, Favorite, Share, Get Directions)
// TODO: Replace map placeholder with an actual map component (e.g., React Leaflet, Google Maps Embed)
// TODO: Ensure proper routing for back button and profile image link

// eslint-disable-next-line max-len
const eventData = {
  title: 'UH Mānoa Spring Cultural Festival 2025',
  imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/1ee76558c3-465d4a6b77953789b4f6.png',
  // eslint-disable-next-line max-len
  altText: 'university campus cultural festival with students participating in activities, vibrant and lively atmosphere',
  tags: ['Cultural', 'Entertainment', 'Food'],
  date: 'Saturday, March 15, 2025',
  time: '10:00 AM - 4:00 PM HST',
  locationName: 'Campus Center Courtyard',
  locationAddress: '2465 Campus Road, Honolulu, HI 96822',
  cost: 'Free Entry',
  costDetails: 'Student ID Required',
  // eslint-disable-next-line max-len
  description: 'Join us for UH Mānoa\'s biggest cultural celebration of the year! Experience the diverse cultures represented on campus through performances, food, art, and interactive activities. This year\'s festival features over 20 cultural organizations, live performances, workshops, and a variety of food vendors.',
  schedule: [
    { time: '10:00 AM', activity: 'Opening Ceremony & Hawaiian Blessing' },
    { time: '11:00 AM', activity: 'Cultural Performances Begin' },
    { time: '12:00 PM', activity: 'Food Festival Opens' },
    { time: '3:30 PM', activity: 'Closing Performance' },
  ],
  mapImageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/60f2be2a81-ca7bedc51256311597fb.png',
  mapAltText: 'satellite map view of university campus with location pin',
  contactEmail: 'events@manoa.hawaii.edu',
  contactWebsite: 'manoa.hawaii.edu/events',
  // Example user avatar for header
  userAvatarUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
  clubName: 'Hawaiian Culture Club',
  clubSlug: 'hawaiian-culture-club',
  organizer: {
    name: 'Kumu Hula Mālia',
    avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
  },
};

// eslint-disable-next-line max-len
/*
const pageMetadata = {
  title: `${eventData.title} - ${eventData.clubName}`,
  // eslint-disable-next-line max-len
  description: `${eventData.description.substring(0, 150)}...`,
};
*/

export default function SampleEventPage() {
  // TODO: Add state for liked/RSVP status
  const handleRsvp = () => console.log('RSVP clicked');
  const handleAddToCalendar = () => console.log('Add to Calendar clicked');
  const handleFavorite = () => console.log('Favorite clicked');
  const handleShare = () => console.log('Share clicked');
  const handleGetDirections = () => console.log('Get Directions clicked');

  return (
    <div className="bg-light min-vh-100">
      {/* Simplified Header - Adapt or remove if using a global layout header */}
      <header className="bg-white shadow-sm py-3">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              {/* TODO: Make this link back to the previous page or events list */}
              <Link href="/dashboard" passHref legacyBehavior>
                <Button variant="light" size="sm" aria-label="Back">
                  <ArrowLeft size={20} />
                </Button>
              </Link>
              {/* Optional: Logo if needed here */}
              {/* <Image src="/path/to/logo.png" alt="Logo" height={30} /> */}
            </div>
            <div className="d-flex align-items-center gap-3">
              <Button variant="light" size="sm" aria-label="Notifications">
                <Bell size={20} />
              </Button>
              {/* TODO: Link to user profile */}
              <Link href="/profile" passHref legacyBehavior>
                {/* eslint-disable-next-line max-len */}
                <Image src={eventData.userAvatarUrl} alt="Profile" roundedCircle width={32} height={32} />
              </Link>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <Container className="py-4 py-md-5">
        {/* Event Header Section */}
        <div className="mb-4 mb-md-5">
          <Card className="border-0 position-relative mb-4">
            <Image src={eventData.imageUrl} alt={eventData.altText} fluid rounded />
            <div className="position-absolute top-0 end-0 p-2 d-flex gap-2">
              {/* eslint-disable-next-line max-len */}
              <Button variant="light" size="sm" className="rounded-circle p-2" onClick={handleFavorite} aria-label="Favorite">
                <Heart size={18} />
              </Button>
              {/* eslint-disable-next-line max-len */}
              <Button variant="light" size="sm" className="rounded-circle p-2" onClick={handleShare} aria-label="Share">
                <Share size={18} />
              </Button>
            </div>
          </Card>

          <h1 className="h2 fw-bold mb-3">{eventData.title}</h1>

          <div className="d-flex flex-wrap gap-2 mb-4">
            {eventData.tags.map((tag) => (
              <Badge key={tag} pill bg="primary-subtle" text="primary-emphasis">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Event Details Grid */}
        <Row className="g-4">
          {/* Left Column - Main Details */}
          <Col md={7} lg={8}>
            <div className="d-flex flex-column gap-4">
              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <Card.Title className="h5 mb-4">Event Information</Card.Title>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex align-items-start border-0 ps-0">
                      <Calendar size={20} className="text-muted me-3 mt-1 flex-shrink-0" />
                      <div>
                        <div className="fw-medium">{eventData.date}</div>
                        <div className="text-muted small">{eventData.time}</div>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex align-items-start border-0 ps-0">
                      <GeoAltFill size={20} className="text-muted me-3 mt-1 flex-shrink-0" />
                      <div>
                        <div className="fw-medium">{eventData.locationName}</div>
                        <div className="text-muted small">{eventData.locationAddress}</div>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex align-items-start border-0 ps-0">
                      <TicketPerforated size={20} className="text-muted me-3 mt-1 flex-shrink-0" />
                      <div>
                        <div className="fw-medium">{eventData.cost}</div>
                        <div className="text-muted small">{eventData.costDetails}</div>
                      </div>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>

              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <Card.Title className="h5 mb-4">About the Event</Card.Title>
                  <p className="text-body-secondary" style={{ whiteSpace: 'pre-line' }}>
                    {eventData.description}
                  </p>
                </Card.Body>
              </Card>

              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <Card.Title className="h5 mb-4">Event Schedule</Card.Title>
                  <ListGroup variant="flush">
                    {eventData.schedule.map((item) => (
                      <ListGroup.Item key={item.time} className="d-flex border-0 ps-0">
                        {/* eslint-disable-next-line max-len */}
                        <div className="fw-medium text-muted me-4" style={{ minWidth: '70px' }}>{item.time}</div>
                        <div>{item.activity}</div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            </div>
          </Col>

          {/* Right Column - Map & Actions */}
          <Col md={5} lg={4}>
            <div className="d-flex flex-column gap-4 position-sticky" style={{ top: '2rem' }}>
              {' '}
              {/* Sticky column */}
              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-grid gap-2">
                    <Button variant="success" size="lg" onClick={handleRsvp}>RSVP to Event</Button>
                    <Button variant="outline-secondary" onClick={handleAddToCalendar}>
                      <CalendarPlus className="me-2" />
                      {' '}
                      Add to Calendar
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <Card.Title className="h5 mb-3">Location</Card.Title>
                  {/* Map Placeholder */}
                  <div className="mb-3 bg-secondary-subtle rounded" style={{ height: '250px' }}>
                    {/* eslint-disable-next-line max-len */}
                    <Image src={eventData.mapImageUrl} alt={eventData.mapAltText} fluid rounded className="w-100 h-100 object-fit-cover" />
                  </div>
                  <div className="d-grid">
                    <Button variant="outline-secondary" onClick={handleGetDirections}>Get Directions</Button>
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <Card.Title className="h5 mb-3">Contact Information</Card.Title>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="border-0 px-0">
                      {/* eslint-disable-next-line max-len */}
                      <Link href={`mailto:${eventData.contactEmail}`} className="d-flex align-items-center text-decoration-none">
                        <Envelope className="me-2" />
                        {' '}
                        {eventData.contactEmail}
                      </Link>
                    </ListGroup.Item>
                    <ListGroup.Item className="border-0 px-0">
                      {/* TODO: Verify website link format/validity */}
                      {/* eslint-disable-next-line max-len */}
                      <Link href={`//${eventData.contactWebsite}`} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center text-decoration-none">
                        <Globe className="me-2" />
                        {' '}
                        {eventData.contactWebsite}
                      </Link>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
