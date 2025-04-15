import React from 'react';
import {
  Container,
  Row,
  Col,
  Image,
  Button,
  Card,
  Badge,
  Stack, // Useful for vertical spacing like space-y-6
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faLocationDot,
  faDirections,
  faGlobe,
  // faPlus, // For add to calendar
} from '@fortawesome/free-solid-svg-icons';
import {
  faBell,
  faHeart,
  faShareFromSquare,
  faCalendar,
  faMoneyBill1,
  faEnvelope,
  faCalendarPlus, // regular variant if preferred
} from '@fortawesome/free-regular-svg-icons';

// Define interface for component props if needed in the future
// interface EventDetailPageProps {}

const EventDetailPage: React.FC = () => (
  // Apply gradient using a wrapper div and custom CSS class
  <div className="gradient-background">
    {/* --- Header/Navigation --- */}
    {/* Using simple divs as Navbar component might be overkill if it's just this */}
    <header className="bg-white shadow-sm py-3">
      {' '}
      {/* Adjusted padding */}
      <Container>
        <Row className="align-items-center justify-content-between">
          {/* Left side */}
          <Col xs="auto" className="d-flex align-items-center">
            <Button variant="link" className="text-secondary p-0 me-3">
              <FontAwesomeIcon icon={faArrowLeft} className="icon-lg" />
            </Button>
            <Image
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/d8899fadb3-5df15300b4c172c2ef67.png"
              alt="Manoa Compass Logo"
              style={{ height: '32px' }}
            />
          </Col>

          {/* Right side */}
          <Col xs="auto" className="d-flex align-items-center">
            <Button variant="link" className="text-secondary p-0 me-3">
              <FontAwesomeIcon icon={faBell} className="icon-lg" />
            </Button>
            <Image
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
              alt="Profile"
              roundedCircle
              style={{ width: '32px', height: '32px' }}
            />
          </Col>
        </Row>
      </Container>
    </header>

    {/* --- Main Content --- */}
    <main>
      <Container className="py-5">
        {' '}
        {/* Adjusted padding */}
        {/* --- Event Header --- */}
        <div className="mb-5">
          {' '}
          {/* mb-8 equivalent */}
          <div className="position-relative rounded mb-4 overflow-hidden">
            {' '}
            {/* Adjusted mb */}
            <Image
              className="event-header-image" // Use custom class for specific height/fit
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/1ee76558c3-465d4a6b77953789b4f6.png"
              alt="university campus cultural festival with students participating in activities, vibrant
               and lively atmosphere"
              fluid
            />
            <div className="position-absolute top-0 end-0 p-3 d-flex gap-2">
              {' '}
              {/* top-4 right-4 space-x-2 */}
              <Button
                variant="light" // bg-white/90 needs custom style or use light
                className="rounded-circle p-2" // Adjust padding if needed
                style={{ opacity: 0.9 }}
              >
                <FontAwesomeIcon icon={faHeart} className="icon-lg text-secondary" />
              </Button>
              <Button
                variant="light"
                className="rounded-circle p-2"
                style={{ opacity: 0.9 }}
              >
                <FontAwesomeIcon icon={faShareFromSquare} className="icon-lg text-secondary" />
              </Button>
            </div>
          </div>

          <h1 className="display-5 fw-bold mb-4">UH Mānoa Spring Cultural Festival 2025</h1>
          {' '}
          {/* text-3xl font-bold */}

          <div className="d-flex flex-wrap gap-2 mb-4">
            {/* Using Bootstrap badge backgrounds - colors might differ from Tailwind */}
            <Badge pill bg="primary-subtle" text="primary-emphasis">Cultural</Badge>
            <Badge pill bg="secondary-subtle" text="secondary-emphasis">Entertainment</Badge>
            <Badge pill bg="success-subtle" text="success-emphasis">Food</Badge>
          </div>
        </div>

        {/* --- Event Details Grid --- */}
        <Row className="g-5">
          {' '}
          {/* gap-8 equivalent using grid gutters */}
          {/* Left Column */}
          <Col md={8}>
            <Stack gap={4}>
              {' '}
              {/* space-y-6 equivalent */}
              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  {' '}
                  {/* Adjusted padding */}
                  <Card.Title as="h2" className="h4 mb-4">Event Information</Card.Title>
                  {' '}
                  {/* text-xl font-semibold */}
                  <Stack gap={4}>
                    {' '}
                    {/* space-y-4 */}
                    <div className="d-flex align-items-start">
                      <FontAwesomeIcon icon={faCalendar} className="icon-lg text-secondary me-3 mt-1" />
                      <div>
                        <p className="fw-medium mb-1">Saturday, March 15, 2025</p>
                        <p className="text-muted mb-0">10:00 AM - 4:00 PM HST</p>
                      </div>
                    </div>

                    <div className="d-flex align-items-start">
                      <FontAwesomeIcon icon={faLocationDot} className="icon-lg text-secondary me-3 mt-1" />
                      <div>
                        <p className="fw-medium mb-1">Campus Center Courtyard</p>
                        <p className="text-muted mb-0">2465 Campus Road, Honolulu, HI 96822</p>
                      </div>
                    </div>

                    <div className="d-flex align-items-start">
                      <FontAwesomeIcon icon={faMoneyBill1} className="icon-lg text-secondary me-3 mt-1" />
                      <div>
                        <p className="fw-medium mb-1">Free Entry</p>
                        <p className="text-muted mb-0">Student ID Required</p>
                      </div>
                    </div>
                  </Stack>
                </Card.Body>
              </Card>

              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <Card.Title as="h2" className="h4 mb-4">About the Event</Card.Title>
                  <p className="text-dark lh-relaxed">
                    {' '}
                    {/* text-gray-700 leading-relaxed */}
                    Join us for UH Mānoa&apos;s biggest cultural celebration of the year! Experience the diverse
                    cultures represented on campus through performances, food, art, and interactive activities.
                    This year&apos;s festival features over 20 cultural organizations, live performances, workshops,
                    and a variety of food vendors.
                  </p>
                </Card.Body>
              </Card>

              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <Card.Title as="h2" className="h4 mb-4">Event Schedule</Card.Title>
                  <Stack gap={3}>
                    {' '}
                    {/* space-y-4 */}
                    <div className="d-flex">
                      <div className="text-muted me-4" style={{ flexBasis: '6rem', flexShrink: 0 }}>10:00 AM</div>
                      {' '}
                      {/* w-24 */}
                      <div>Opening Ceremony & Hawaiian Blessing</div>
                    </div>
                    <div className="d-flex">
                      <div className="text-muted me-4" style={{ flexBasis: '6rem', flexShrink: 0 }}>11:00 AM</div>
                      <div>Cultural Performances Begin</div>
                    </div>
                    <div className="d-flex">
                      <div className="text-muted me-4" style={{ flexBasis: '6rem', flexShrink: 0 }}>12:00 PM</div>
                      <div>Food Festival Opens</div>
                    </div>
                    <div className="d-flex">
                      <div className="text-muted me-4" style={{ flexBasis: '6rem', flexShrink: 0 }}>3:30 PM</div>
                      <div>Closing Performance</div>
                    </div>
                  </Stack>
                </Card.Body>
              </Card>
            </Stack>
          </Col>

          {/* Right Column */}
          <Col md={4}>
            <Stack gap={4}>
              {' '}
              {/* space-y-6 */}
              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  {/* d-grid makes buttons full width and adds gap */}
                  <div className="d-grid gap-3">
                    <Button variant="success" size="lg" className="fw-medium">
                      {' '}
                      {/* bg-green-600 */}
                      RSVP to Event
                    </Button>
                    <Button variant="outline-secondary" size="lg" className="fw-medium">
                      {' '}
                      {/* border border-gray-300 text-gray-700 */}
                      <FontAwesomeIcon icon={faCalendarPlus} className="me-2" />
                      {' '}
                      Add to Calendar
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <Card.Title as="h2" className="h4 mb-4">Location</Card.Title>
                  <div className="mb-4 rounded">
                    {' '}
                    {/* bg-gray-100 applied by Card if needed */}
                    <Image
                      className="map-image" // Use custom class for specific height/fit
                      src="https://storage.googleapis.com/uxpilot-auth.appspot.com/60f2be2a81-ca7bedc51256311597fb.png"
                      alt="satellite map view of university campus with location pin"
                      fluid
                      rounded
                    />
                  </div>
                  <div className="d-grid">
                    <Button variant="outline-secondary" className="fw-medium">
                      <FontAwesomeIcon icon={faDirections} className="me-2" />
                      {' '}
                      Get Directions
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <Card.Title as="h2" className="h4 mb-4">Contact Information</Card.Title>
                  <Stack gap={3}>
                    {' '}
                    {/* space-y-3 */}
                    <a href="mailto:events@manoa.hawaii.edu" className="d-flex align-items-center text-decoration-none">
                      <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />
                      <span className="text-primary hover-underline">events@manoa.hawaii.edu</span>
                    </a>
                    <a
                      href="https://manoa.hawaii.edu/events"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-flex align-items-center text-decoration-none"
                    >
                      <FontAwesomeIcon icon={faGlobe} className="me-2 text-primary" />
                      <span className="text-primary hover-underline">manoa.hawaii.edu/events</span>
                    </a>
                  </Stack>
                </Card.Body>
              </Card>
            </Stack>
          </Col>
        </Row>
      </Container>
    </main>
  </div>
);

export default EventDetailPage;
