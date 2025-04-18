'use client';

/* eslint-disable max-len */
import React from 'react';
import {
  Container, Row, Col, Image, Button, Card, Badge,
  ListGroup, Breadcrumb,
} from 'react-bootstrap';
import {
  ArrowLeft, Bookmark, Share, CalendarEvent, Clock, GeoAltFill,
  PeopleFill, Envelope, Globe, Instagram, Discord, Github,
} from 'react-bootstrap-icons';
import Link from 'next/link';

// TODO: Replace hardcoded data with actual data fetching (e.g., based on a club ID/slug)
// TODO: Implement functionality for buttons (Join Club, Bookmark, Share, View All Events)
// TODO: Implement actual social media links
// TODO: Check if user is already a member to potentially change "Join Club" button state
// TODO: Ensure proper routing for back button and breadcrumbs

const clubData = {
  name: 'Computer Science Club',
  logoUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/767a7da23e-ea7ee44144a2eff5ab99.png',
  logoAlt: 'modern tech club logo with computer and coding symbols in blue and white colors',
  tags: ['Technology', 'Programming', 'Academic'],
  description: 'The Computer Science Club at UH Manoa is dedicated to fostering a community of tech enthusiasts and future developers. We organize workshops, hackathons, and networking events to help students develop their programming skills and connect with industry professionals.',
  meetingDays: 'Every Tuesday & Thursday',
  meetingTime: '4:30 PM - 6:00 PM',
  meetingLocation: 'POST Building, Room 318',
  memberCount: 127,
  contactEmail: 'csclub@hawaii.edu',
  contactWebsite: 'www.uhcsclub.org',
  socialLinks: {
    instagram: '#', // Replace with actual URLs
    discord: '#',
    github: '#',
  },
  upcomingEvents: [
    {
      month: 'MAR',
      day: '15',
      title: 'Spring Hackathon 2025',
      description: 'A 24-hour coding competition with amazing prizes!',
      time: '9:00 AM - 9:00 AM (Next day)',
    },
    // Add more events if needed
  ],
};

export default function SampleClubPage() {
  const handleJoinClub = () => console.log('Join Club clicked');
  const handleBookmark = () => console.log('Bookmark clicked');
  const handleShare = () => console.log('Share clicked');

  return (
    <div className="bg-light min-vh-100">
      {/* Simplified Header - Adapt or remove if using a global layout header */}
      <header className="bg-white shadow-sm py-3">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              {/* TODO: Make this link back to the clubs list page */}
              <Link href="/clubs" passHref legacyBehavior>
                <Button variant="light" size="sm" aria-label="Back">
                  <ArrowLeft size={20} />
                </Button>
              </Link>
              <Breadcrumb listProps={{ className: 'mb-0' }}>
                {/* TODO: Make Breadcrumb links active */}
                <Breadcrumb.Item href="/clubs">Clubs</Breadcrumb.Item>
                <Breadcrumb.Item active>{clubData.name}</Breadcrumb.Item>
              </Breadcrumb>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Button variant="light" size="sm" onClick={handleBookmark} aria-label="Bookmark Club">
                <Bookmark size={18} />
              </Button>
              <Button variant="light" size="sm" onClick={handleShare} aria-label="Share Club">
                <Share size={18} />
              </Button>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <Container className="py-4 py-md-5">
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            {' '}
            {/* Slightly wider column for club page content */}
            {/* Club Header */}
            <div className="d-flex flex-column flex-md-row align-items-center gap-4 mb-4 mb-md-5">
              <Image
                src={clubData.logoUrl}
                alt={clubData.logoAlt}
                rounded
                style={{ width: '128px', height: '128px', objectFit: 'cover' }}
              />
              <div className="text-center text-md-start">
                <h1 className="h2 fw-bold mb-2">{clubData.name}</h1>
                <div className="d-flex flex-wrap justify-content-center justify-content-md-start gap-2 mb-3">
                  {clubData.tags.map((tag) => (
                    <Badge key={tag} pill bg="info-subtle" text="info-emphasis">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button variant="success" onClick={handleJoinClub}>Join Club</Button>
              </div>
            </div>

            {/* Club Details Grid/Sections */}
            <div className="d-flex flex-column gap-4">
              {/* About Section */}
              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <Card.Title className="h5 mb-3">About</Card.Title>
                  <p className="text-body-secondary">{clubData.description}</p>
                </Card.Body>
              </Card>

              {/* Meeting Information */}
              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <Card.Title className="h5 mb-4">Meeting Information</Card.Title>
                  <Row className="g-4">
                    <Col sm={6}>
                      <div className="d-flex align-items-start">
                        <CalendarEvent size={20} className="text-muted me-3 mt-1 flex-shrink-0" />
                        <div>
                          <h6 className="mb-1 fw-medium">Meeting Days</h6>
                          <p className="text-body-secondary mb-0">{clubData.meetingDays}</p>
                        </div>
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div className="d-flex align-items-start">
                        <Clock size={20} className="text-muted me-3 mt-1 flex-shrink-0" />
                        <div>
                          <h6 className="mb-1 fw-medium">Time</h6>
                          <p className="text-body-secondary mb-0">{clubData.meetingTime}</p>
                        </div>
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div className="d-flex align-items-start">
                        <GeoAltFill size={20} className="text-muted me-3 mt-1 flex-shrink-0" />
                        <div>
                          <h6 className="mb-1 fw-medium">Location</h6>
                          <p className="text-body-secondary mb-0">{clubData.meetingLocation}</p>
                        </div>
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div className="d-flex align-items-start">
                        <PeopleFill size={20} className="text-muted me-3 mt-1 flex-shrink-0" />
                        <div>
                          <h6 className="mb-1 fw-medium">Members</h6>
                          <p className="text-body-secondary mb-0">{`${clubData.memberCount} active members`}</p>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Contact Information */}
              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <Card.Title className="h5 mb-4">Contact Information</Card.Title>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex align-items-center border-0 ps-0">
                      <Envelope size={18} className="text-muted me-3" />
                      <Link href={`mailto:${clubData.contactEmail}`} className="text-decoration-none">{clubData.contactEmail}</Link>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex align-items-center border-0 ps-0">
                      <Globe size={18} className="text-muted me-3" />
                      <Link href={`//${clubData.contactWebsite}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none">{clubData.contactWebsite}</Link>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex align-items-center border-0 ps-0 pt-3">
                      <Link href={clubData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-muted me-3" aria-label="Instagram">
                        <Instagram size={20} />
                      </Link>
                      <Link href={clubData.socialLinks.discord} target="_blank" rel="noopener noreferrer" className="text-muted me-3" aria-label="Discord">
                        <Discord size={20} />
                      </Link>
                      <Link href={clubData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-muted" aria-label="Github">
                        <Github size={20} />
                      </Link>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>

              {/* Upcoming Events */}
              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Card.Title className="h5 mb-0">Upcoming Events</Card.Title>
                    {/* TODO: Link to full list of club events - Replace placeholder href */}
                    <Link href="/club-events-placeholder" passHref legacyBehavior>
                      {/* Adding href directly to satisfy linter with legacyBehavior */}
                      <a href="/club-events-placeholder" className="text-decoration-none">
                        <Button variant="link" size="sm">View All</Button>
                      </a>
                    </Link>
                  </div>
                  <ListGroup variant="flush">
                    {clubData.upcomingEvents.map((event) => (
                      <ListGroup.Item key={event.title} className="d-flex align-items-start border-0 px-0 py-3">
                        <div className="bg-primary-subtle text-primary-emphasis rounded p-2 text-center me-3" style={{ minWidth: '60px' }}>
                          <div className="small fw-medium text-uppercase">{event.month}</div>
                          <div className="h5 fw-bold mb-0">{event.day}</div>
                        </div>
                        <div>
                          <h6 className="fw-medium mb-1">{event.title}</h6>
                          <p className="text-body-secondary small mb-1">{event.description}</p>
                          <div className="d-flex align-items-center text-muted small">
                            <Clock size={12} className="me-1" />
                            {' '}
                            {event.time}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                    {clubData.upcomingEvents.length === 0 && (
                      <ListGroup.Item className="border-0 px-0 text-muted">
                        No upcoming events scheduled.
                      </ListGroup.Item>
                    )}
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
