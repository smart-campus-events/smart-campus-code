'use client';

import React from 'react';
import { Container, Row, Col, Button, Image, Badge, Card, Breadcrumb } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faShare,
  faLocationDot,
  faUsers,
  faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import {
  faBookmark,
  faCalendar,
  faClock,
  faEnvelope,
} from '@fortawesome/free-regular-svg-icons';
import {
  faInstagram,
  faDiscord,
  faGithub,
} from '@fortawesome/free-brands-svg-icons';

// Import the custom CSS
import '../ClubInformationPage.css';

const ClubDetailPage: React.FC = () => (
  <div className="club-detail-page">
    {' '}
    {/* Apply custom class for background */}
    {/* Header Navigation */}
    <header className="bg-white shadow-sm py-3">
      {' '}
      {/* Adjusted padding */}
      <Container>
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <Button variant="link" className="text-secondary p-0 me-3">
              {' '}
              {/* Use Button for better semantics */}
              <FontAwesomeIcon icon={faArrowLeft} size="xl" />
            </Button>
            <Breadcrumb listProps={{ className: 'mb-0' }}>
              {' '}
              {/* Use Breadcrumb component */}
              <Breadcrumb.Item href="#">Clubs</Breadcrumb.Item>
              <Breadcrumb.Item active>Computer Science Club</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          <div className="d-flex align-items-center">
            <Button variant="link" className="text-secondary p-0 me-3">
              <FontAwesomeIcon icon={faBookmark} size="xl" />
            </Button>
            <Button variant="link" className="text-secondary p-0">
              <FontAwesomeIcon icon={faShare} size="xl" />
            </Button>
          </div>
        </div>
      </Container>
    </header>

    {/* Main Content */}
    <main>
      <Container className="py-4 py-md-5">
        {' '}
        {/* Added padding */}
        {/* Optional: Apply max-width constraint if needed */}
        <Row>
          <Col lg={10} xl={8} className="mx-auto">
            {' '}
            {/* Adjust Col size as needed */}
            {/* Club Header */}
            <div className="d-flex flex-column flex-md-row align-items-center mb-5">
              {' '}
              {/* Adjusted margin */}
              <Image
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/767a7da23e-ea7ee44144a2eff5ab99.png"
                alt="modern tech club logo"
                rounded // Changed from rounded-xl
                className="mb-3 mb-md-0 me-md-4"
                style={{ width: '128px', height: '128px', objectFit: 'cover' }}
              />
              <div>
                <h1 className="h3 fw-bold mb-2">Computer Science Club</h1>
                {' '}
                {/* Use Bootstrap heading classes */}
                <div className="mb-4">
                  {' '}
                  {/* Group badges */}
                  <Badge pill bg="info" className="me-2 text-dark">Technology</Badge>
                  <Badge pill bg="secondary" className="me-2">Programming</Badge>
                  <Badge pill bg="success" className="me-2">Academic</Badge>
                </div>
                <Button variant="success">
                  Join Club
                </Button>
              </div>
            </div>

            {/* Club Description */}
            <Card className="mb-4 shadow-sm">
              <Card.Body className="p-4">
                {' '}
                {/* Adjusted padding */}
                <Card.Title as="h2" className="h5 fw-bold mb-3">About</Card.Title>
                {' '}
                {/* Use h5 for semantic structure */}
                <Card.Text className="text-secondary">
                  {' '}
                  {/* text-gray-600 equivalent */}
                  The Computer Science Club at UH Manoa is dedicated to fostering a community of tech enthusiasts
                  and future developers. We organize workshops, hackathons, and networking events to help students
                  develop their programming skills and connect with industry professionals.
                </Card.Text>
              </Card.Body>
            </Card>

            {/* Meeting Information */}
            <Card className="mb-4 shadow-sm">
              <Card.Body className="p-4">
                <Card.Title as="h2" className="h5 fw-bold mb-4">Meeting Information</Card.Title>
                <Row xs={1} md={2} className="g-4">
                  {' '}
                  {/* Bootstrap Grid with gap */}
                  <Col>
                    <div className="d-flex align-items-start">
                      <FontAwesomeIcon icon={faCalendar} className="text-muted mt-1 me-3 icon-baseline" />
                      <div>
                        <h3 className="h6 fw-medium mb-1">Meeting Days</h3>
                        {' '}
                        {/* Use h6 */}
                        <p className="text-secondary mb-0">Every Tuesday & Thursday</p>
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex align-items-start">
                      <FontAwesomeIcon icon={faClock} className="text-muted mt-1 me-3 icon-baseline" />
                      <div>
                        <h3 className="h6 fw-medium mb-1">Time</h3>
                        <p className="text-secondary mb-0">4:30 PM - 6:00 PM</p>
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex align-items-start">
                      <FontAwesomeIcon icon={faLocationDot} className="text-muted mt-1 me-3 icon-baseline" />
                      <div>
                        <h3 className="h6 fw-medium mb-1">Location</h3>
                        <p className="text-secondary mb-0">POST Building, Room 318</p>
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex align-items-start">
                      <FontAwesomeIcon icon={faUsers} className="text-muted mt-1 me-3 icon-baseline" />
                      <div>
                        <h3 className="h6 fw-medium mb-1">Members</h3>
                        <p className="text-secondary mb-0">127 active members</p>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Contact Information */}
            <Card className="mb-4 shadow-sm">
              <Card.Body className="p-4">
                <Card.Title as="h2" className="h5 fw-bold mb-4">Contact Information</Card.Title>
                <div className="mb-3 d-flex align-items-center">
                  {' '}
                  {/* Space between items */}
                  <FontAwesomeIcon icon={faEnvelope} className="text-muted me-3 icon-baseline" />
                  <a href="mailto:csclub@hawaii.edu" className="text-primary">csclub@hawaii.edu</a>
                </div>
                <div className="mb-3 d-flex align-items-center">
                  <FontAwesomeIcon icon={faGlobe} className="text-muted me-3 icon-baseline" />
                  <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="btn btn-link text-primary p-0"
                  >
                    www.uhcsclub.org
                  </button>
                  {' '}
                  {/* Make it a link */}
                </div>
                <div className="d-flex align-items-center">
                  {' '}
                  {/* Social Icons */}
                  <button type="button" className="btn btn-link text-secondary me-3" aria-label="Instagram">
                    <FontAwesomeIcon icon={faInstagram} size="xl" />
                  </button>
                  <button type="button" className="btn btn-link text-secondary me-3" aria-label="Discord">
                    <FontAwesomeIcon icon={faDiscord} size="xl" />
                  </button>
                  <button type="button" className="btn btn-link text-secondary p-0" aria-label="Github">
                    <FontAwesomeIcon icon={faGithub} size="xl" />
                  </button>
                </div>
              </Card.Body>
            </Card>

            {/* Upcoming Events */}
            <Card className="shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h2 className="h5 fw-bold mb-0">Upcoming Events</h2>
                  <Button variant="link" size="sm" className="p-0">View All</Button>
                  {' '}
                  {/* Use Button */}
                </div>
                <div>
                  {' '}
                  {/* Event List container */}
                  {/* Single Event Example */}
                  <div className="d-flex align-items-start p-3 bg-light rounded">
                    {' '}
                    {/* bg-gray-50 approx */}
                    {/* Custom styled date box */}
                    <div className="event-date-box me-3">
                      <div className="month">MAR</div>
                      <div className="day">15</div>
                    </div>
                    <div>
                      <h3 className="h6 fw-medium mb-1">Spring Hackathon 2025</h3>
                      <p className="text-secondary small mb-2">A 24-hour coding competition with amazing prizes!</p>
                      <div className="d-flex align-items-center text-muted small">
                        <FontAwesomeIcon icon={faClock} className="me-2 icon-baseline" />
                        <span>9:00 AM - 9:00 AM (Next day)</span>
                      </div>
                    </div>
                  </div>
                  {/* Add more events here if needed */}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  </div>
);

export default ClubDetailPage;
