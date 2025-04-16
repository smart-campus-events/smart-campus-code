'use client';

/* eslint-disable max-len */
import React from 'react';
import { Container, Row, Col, Image, Button, Card, Badge, Form } from 'react-bootstrap';
import { /* Bell, */ BoxArrowRight, PencilSquare, Star, StarFill } from 'react-bootstrap-icons';
// import Link from 'next/link'; // Assuming navigation will use Next.js Link

// TODO: Replace hardcoded data with actual data fetching and state management
// TODO: Implement functionality for buttons (Edit Profile, Logout, Change Password, etc.)
// TODO: Replace placeholder links/buttons (View All Events/RIOs) with actual links or modals
// TODO: Integrate with actual authentication status for Logout button visibility/functionality
// TODO: Verify icon names correspond correctly to the desired Font Awesome icons

export default function ProfilePage() {
  // Placeholder data matching the mockup
  const profile = {
    name: 'Sarah Connor',
    memberSince: 'January 2025',
    avatarUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
    email: 'sarah.connor@hawaii.edu',
    major: 'Computer Science',
    interests: ['Programming', 'Hiking', 'Photography', 'Surfing', 'Gaming'],
    ageRange: '19-21',
    origin: 'US Mainland',
    housingStatus: 'On-Campus Dorm',
    comfortLevel: 4, // Representing 4 out of 5 stars
    aboutMe: 'Enthusiastic Computer Science student looking to connect with fellow tech enthusiasts and explore the beautiful island of Oahu. Always up for a coding challenge or a hiking adventure!',
  };

  const savedEvents = [
    { month: 'MAR', day: '15', name: 'Tech Meetup', details: '6:00 PM - Campus Center' },
    { month: 'MAR', day: '20', name: 'Beach Cleanup', details: '9:00 AM - Ala Moana' },
  ];

  const myRios = [
    { imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg', name: 'ACM Manoa', description: 'Computer Science Club' },
    { imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg', name: 'Hiking Club', description: 'Outdoor Activities' },
  ];

  const settings = {
    emailNotifications: true,
    pushNotifications: false,
  };

  return (
    // Mimicking the gradient background from the mock might require custom CSS or inline styles
    // For now, using a simple light background
    <div className="bg-light min-vh-100">
      {/* Header/Navigation - Assuming a shared layout component handles the main nav */}
      {/* This is a simplified header based on the mock's content area header */}

      {/* Main Content */}
      <Container className="py-4 py-md-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            {/* Profile Header */}
            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-4 mb-md-5">
              <div className="d-flex align-items-center mb-3 mb-md-0">
                <Image
                  src={profile.avatarUrl}
                  alt="Profile"
                  roundedCircle
                  style={{ width: '80px', height: '80px', border: '4px solid var(--bs-success)' }} // Using Bootstrap success color variable
                />
                <div className="ms-3">
                  <h1 className="h4 fw-bold mb-0">{`${profile.name}'s Profile`}</h1>
                  <p className="text-muted mb-0">{`Member since ${profile.memberSince}`}</p>
                </div>
              </div>
              <div className="d-flex gap-2">
                {/* TODO: Link to actual edit page */}
                <Button variant="outline-secondary" size="sm">
                  <PencilSquare className="me-2" />
                  Edit Profile
                </Button>
                {/* TODO: Implement logout functionality */}
                <Button variant="outline-danger" size="sm">
                  <BoxArrowRight className="me-2" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Profile Content Grid */}
            <Row>
              {/* Left Column */}
              <Col md={8} className="mb-4 mb-md-0">
                <div className="d-flex flex-column gap-4">
                  {/* Basic Information */}
                  <Card className="shadow-sm">
                    <Card.Body>
                      <Card.Title className="h5 mb-4">Basic Information</Card.Title>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <p className="text-muted mb-1">Email</p>
                            <p className="fw-medium mb-0">{profile.email}</p>
                          </div>
                          {/* TODO: Implement Change Password */}
                          <Button variant="link" size="sm" className="p-0">Change Password</Button>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-muted mb-1">Major</p>
                        <p className="fw-medium mb-0">{profile.major}</p>
                      </div>
                      <div>
                        <p className="text-muted mb-1">Interests</p>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {profile.interests.map((interest) => (
                            <Badge key={interest} pill bg="success-subtle" text="success-emphasis">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Additional Details */}
                  <Card className="shadow-sm">
                    <Card.Body>
                      <Card.Title className="h5 mb-4">Additional Details</Card.Title>
                      <Row>
                        <Col sm={6} className="mb-3">
                          <p className="text-muted mb-1">Age Range</p>
                          <p className="fw-medium mb-0">{profile.ageRange}</p>
                        </Col>
                        <Col sm={6} className="mb-3">
                          <p className="text-muted mb-1">Origin</p>
                          <p className="fw-medium mb-0">{profile.origin}</p>
                        </Col>
                        <Col sm={6} className="mb-3">
                          <p className="text-muted mb-1">Housing Status</p>
                          <p className="fw-medium mb-0">{profile.housingStatus}</p>
                        </Col>
                        <Col sm={6} className="mb-3">
                          <p className="text-muted mb-1">Comfort Level</p>
                          <div className="d-flex align-items-center">
                            {[...Array(5)].map((_, i) => (
                              i < profile.comfortLevel
                                // eslint-disable-next-line react/no-array-index-key
                                ? <StarFill key={i} className="text-warning me-1" />
                                // eslint-disable-next-line react/no-array-index-key
                                : <Star key={i} className="text-warning me-1" />
                            ))}
                          </div>
                        </Col>
                      </Row>
                      <div className="mt-2">
                        <p className="text-muted mb-1">About Me</p>
                        <p className="mb-0">{profile.aboutMe}</p>
                      </div>
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
                      <div className="d-flex flex-column gap-3">
                        {savedEvents.map((event) => (
                          <div key={event.name} className="d-flex align-items-center gap-3">
                            <div
                              className="bg-primary-subtle text-primary-emphasis rounded p-2 text-center flex-shrink-0"
                              style={{ width: '50px' }}
                            >
                              <div className="small text-uppercase">{event.month}</div>
                              <div className="fw-bold">{event.day}</div>
                            </div>
                            <div>
                              <p className="fw-medium mb-0">{event.name}</p>
                              <p className="small text-muted mb-0">{event.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* TODO: Link to actual events page */}
                      <Button variant="link" size="sm" className="w-100 mt-3 p-0 text-decoration-none">View All Events</Button>
                    </Card.Body>
                  </Card>

                  {/* My RIOs */}
                  <Card className="shadow-sm">
                    <Card.Body>
                      <Card.Title className="h5 mb-4">My RIOs</Card.Title>
                      <div className="d-flex flex-column gap-3">
                        {myRios.map((rio) => (
                          <div key={rio.name} className="d-flex align-items-center gap-3">
                            <Image src={rio.imageUrl} alt="RIO" roundedCircle style={{ width: '40px', height: '40px' }} />
                            <div>
                              <p className="fw-medium mb-0">{rio.name}</p>
                              <p className="small text-muted mb-0">{rio.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* TODO: Link to actual RIOs list */}
                      <Button variant="link" size="sm" className="w-100 mt-3 p-0 text-decoration-none">View All RIOs</Button>
                    </Card.Body>
                  </Card>

                  {/* Settings */}
                  <Card className="shadow-sm">
                    <Card.Body>
                      <Card.Title className="h5 mb-4">Settings</Card.Title>
                      <Form>
                        <Form.Group className="mb-3 d-flex justify-content-between align-items-center">
                          <Form.Label className="mb-0">Email Notifications</Form.Label>
                          <Form.Check
                            type="switch"
                            id="email-notifications-switch"
                            // checked={settings.emailNotifications} // TODO: Use actual setting state
                            defaultChecked={settings.emailNotifications}
                          />
                        </Form.Group>
                        <Form.Group className="d-flex justify-content-between align-items-center">
                          <Form.Label className="mb-0">Push Notifications</Form.Label>
                          <Form.Check
                            type="switch"
                            id="push-notifications-switch"
                            // checked={settings.pushNotifications} // TODO: Use actual setting state
                            defaultChecked={settings.pushNotifications}
                          />
                        </Form.Group>
                      </Form>
                    </Card.Body>
                  </Card>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
