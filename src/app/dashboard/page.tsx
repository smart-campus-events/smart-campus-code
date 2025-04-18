'use client';

import React from 'react';
import {
  Container, Row, Col, Card, Button, ListGroup, Alert, Badge,
} from 'react-bootstrap';
import {
  ArrowRight, People, Clock, GeoAltFill, Megaphone, Search,
} from 'react-bootstrap-icons';
import Link from 'next/link';

// TODO: Replace hardcoded data with actual fetched data (user name, recommendations, events, announcements)
// TODO: Implement links for "See All", "View Calendar", "Find Connections", etc.
// TODO: Implement actual routing for club/event cards
// TODO: Integrate with real notification system

const dashboardData = {
  userName: 'Sarah', // Replace with actual user name
  userAvatarUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
  recommendedClubs: [
    {
      id: 1,
      name: 'Computer Science Club',
      members: 156,
      category: 'Technology',
      slug: 'computer-science-club',
      imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/2f4070b305-a7b95a7dc469081b9a92.png',
      imageAlt: 'students gathering in a computer science club meeting',
      description: 'Weekly meetups, coding challenges, and tech talks.',
    },
    {
      id: 2,
      name: 'Sustainability Club',
      members: 89,
      category: 'Environment',
      slug: 'sustainability-club',
      imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/f7feb3e199-956b2045405a446d1a70.png',
      imageAlt: 'environmental club students planting trees',
      description: 'Making UHM greener through community initiatives.',
    },
    {
      id: 3,
      name: 'Hawaiian Culture Club',
      members: 203,
      category: 'Culture',
      slug: 'hawaiian-culture-club',
      imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/1a823e2334-948c210f93d74a921b15.png',
      imageAlt: 'hawaiian cultural dance performance',
      description: 'Learn about Hawaiian traditions and practices.',
    },
  ],
  upcomingEvents: [
    {
      id: 1,
      month: 'MAR',
      day: '15',
      name: 'Spring Career Fair 2025',
      time: '9:00 AM - 3:00 PM',
      location: 'Campus Center Ballroom',
      slug: 'spring-career-fair-2025',
    },
    {
      id: 2,
      month: 'MAR',
      day: '18',
      name: 'Lei Making Workshop',
      time: '2:00 PM - 4:00 PM',
      location: 'Queen Liliʻuokalani Center',
      slug: 'lei-making-workshop',
    },
  ],
  announcements: [
    // eslint-disable-next-line max-len
    { id: 1, title: 'Spring Break Schedule Changes', details: 'Modified campus services hours during March 25-29, 2025' },
    { id: 2, title: 'Library Extended Hours', details: '24/7 access available during finals week' },
  ],
};

export default function DashboardPage() {
  // TODO: Fetch real data here

  return (
    <div className="bg-light min-vh-100">
      {/* Assuming Header/Navigation is handled by the main layout */}
      {/* Example simplified header if needed */}
      {/* <header className="bg-white shadow-sm py-3">
        <Container className="d-flex justify-content-between align-items-center">
           <div>Logo/Nav</div>
           <div className="d-flex align-items-center gap-3">
            <Button variant="light" size="sm" aria-label="Notifications"><Bell size={20} /></Button>
             <Link href="/profile" passHref legacyBehavior>
                 <Image src={dashboardData.userAvatarUrl} alt="Profile" roundedCircle width={32} height={32} />
            </Link>
           </div>
        </Container>
       </header> */}

      <Container className="py-4 py-md-5">
        {/* Welcome Banner */}
        <div className="mb-4 mb-md-5">
          <h1 className="h2 fw-bold mb-1">
            Aloha,
            {dashboardData.userName}
            !
          </h1>
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          <p className="text-muted">Here&apos;s what&apos;s happening around campus.</p>
        </div>

        {/* Recommended Clubs Section */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h4 fw-bold mb-0">Clubs You Might Like</h2>
            {/* TODO: Link to the main clubs page */}
            <Link href="/clubs" passHref legacyBehavior>
              <Button variant="link" size="sm" className="text-decoration-none fw-medium">
                See All
                {' '}
                <ArrowRight className="ms-1" size={16} />
              </Button>
            </Link>
          </div>
          <Row className="g-4 row-cols-1 row-cols-md-2 row-cols-lg-3">
            {dashboardData.recommendedClubs.map(club => (
              <Col key={club.id}>
                <Card className="h-100 shadow-sm hover-lift">
                  {/* TODO: Link entire card to club page */}
                  <Link href={`/club/${club.slug}`} passHref legacyBehavior>
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                    <a className="text-decoration-none text-dark stretched-link">
                      <Card.Img
                        variant="top"
                        src={club.imageUrl}
                        alt={club.imageAlt}
                        style={{ height: '150px', objectFit: 'cover' }}
                      />
                      {club.category && (
                      // eslint-disable-next-line max-len
                      <Badge bg="success-subtle" text="success-emphasis" className="position-absolute top-0 end-0 m-2">{club.category}</Badge>
                      )}
                      <Card.Body className="d-flex flex-column">
                        <Card.Title as="h6" className="mb-2 fw-semibold">{club.name}</Card.Title>
                        <Card.Text className="small text-muted flex-grow-1 mb-3">
                          {club.description}
                        </Card.Text>
                        <div className="d-flex align-items-center text-muted small mt-auto">
                          <People size={14} className="me-2" />
                          <span>
                            {club.members}
                            {' '}
                            members
                          </span>
                        </div>
                      </Card.Body>
                    </a>
                  </Link>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Upcoming Events Section */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h4 fw-bold mb-0">Events Happening Soon</h2>
            {/* TODO: Link to the main events page/calendar */}
            <Link href="/events" passHref legacyBehavior>
              <Button variant="link" size="sm" className="text-decoration-none fw-medium">
                View Calendar
                {' '}
                <ArrowRight className="ms-1" size={16} />
              </Button>
            </Link>
          </div>
          <Row className="g-4 row-cols-1 row-cols-md-2">
            {dashboardData.upcomingEvents.map(event => (
              <Col key={event.id}>
                {/* TODO: Link entire card to event page */}
                <Card className="h-100 shadow-sm hover-lift">
                  <Link href={`/event/${event.slug}`} passHref legacyBehavior>
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                    <a className="text-decoration-none text-dark stretched-link">
                      <Card.Body className="d-flex align-items-start">
                        {/* eslint-disable-next-line max-len */}
                        <div className="bg-success-subtle text-success-emphasis rounded p-3 text-center me-3 flex-shrink-0" style={{ minWidth: '70px' }}>
                          <div className="small fw-medium text-uppercase">{event.month}</div>
                          <div className="h4 fw-bold mb-0">{event.day}</div>
                        </div>
                        <div className="flex-grow-1">
                          <Card.Title as="h6" className="mb-2 fw-semibold">{event.name}</Card.Title>
                          <div className="small text-muted d-flex flex-column gap-1">
                            <div className="d-flex align-items-center">
                              <Clock size={12} className="me-2" />
                              <span>{event.time}</span>
                            </div>
                            <div className="d-flex align-items-center">
                              <GeoAltFill size={12} className="me-2" />
                              <span>{event.location}</span>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </a>
                  </Link>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Connect with Peers Section */}
        <section className="mb-5">
          <Alert variant="primary" className="shadow-sm">
            <Row className="align-items-center">
              <Col md>
                <Alert.Heading as="h5">Connect with Peers</Alert.Heading>
                <p className="mb-md-0">Find students with similar interests and build your network.</p>
              </Col>
              <Col md="auto" className="mt-2 mt-md-0">
                {/* TODO: Link to connections/peer finding page */}
                <Link href="/connections" passHref legacyBehavior>
                  <Button variant="primary">
                    <Search className="me-1" />
                    {' '}
                    Find Connections
                  </Button>
                </Link>
              </Col>
            </Row>
          </Alert>
        </section>

        {/* Campus Announcements */}
        <section>
          <div className="d-flex align-items-center mb-3">
            <Megaphone size={20} className="text-primary me-2" />
            <h2 className="h4 fw-bold mb-0">Important Announcements</h2>
          </div>
          <ListGroup variant="flush">
            {dashboardData.announcements.map(announcement => (
              <ListGroup.Item key={announcement.id} className="bg-white rounded shadow-sm mb-2 p-3">
                <h6 className="fw-semibold mb-1">{announcement.title}</h6>
                <p className="small text-muted mb-0">{announcement.details}</p>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </section>
      </Container>
    </div>
  );
}

// Add custom CSS for hover effect if needed (same as clubs page):
/*
.hover-lift {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.hover-lift:hover {
  transform: translateY(-3px);
  box-shadow: var(--bs-card-box-shadow), 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}
*/
