'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Button, Tab, Nav, Image } from 'react-bootstrap';
import { Search, Calendar, PinMap, People } from 'react-bootstrap-icons';
import styles from './events.module.css';

const EventsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for events
  const allEvents = [
    {
      id: 1,
      name: 'Spring Career Fair 2025',
      date: 'MAR 15',
      time: '9:00 AM - 3:00 PM',
      location: 'Campus Center Ballroom',
      description: 'Connect with employers from various industries for internship and job opportunities.',
      attendees: 320,
      imageUrl: '/images/placeholder.svg',
    },
    {
      id: 2,
      name: 'Lei Making Workshop',
      date: 'MAR 18',
      time: '2:00 PM - 4:00 PM',
      location: 'Queen Liliʻuokalani Center',
      description: 'Learn how to create traditional Hawaiian lei with native plants and flowers.',
      attendees: 45,
      imageUrl: '/images/placeholder.svg',
    },
    {
      id: 3,
      name: 'Blockchain Technology Seminar',
      date: 'MAR 22',
      time: '1:00 PM - 3:00 PM',
      location: 'POST Building Room 318',
      description: 'Industry experts discuss the future of blockchain and its applications.',
      attendees: 78,
      imageUrl: '/images/placeholder.svg',
    },
    {
      id: 4,
      name: 'Campus Sustainability Fair',
      date: 'MAR 25',
      time: '10:00 AM - 2:00 PM',
      location: 'McCarthy Mall',
      description: 'Join campus organizations to learn about environmental initiatives and how to get involved.',
      attendees: 156,
      imageUrl: '/images/placeholder.svg',
    },
    {
      id: 5,
      name: 'Art Exhibition Opening',
      date: 'APR 2',
      time: '5:00 PM - 8:00 PM',
      location: 'Art Building Gallery',
      description: 'Opening reception for the spring student art exhibition featuring works from various mediums.',
      attendees: 92,
      imageUrl: '/images/placeholder.svg',
    },
  ];

  // Filter events based on search term
  const filteredEvents = allEvents.filter((event) => {
    return event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.location.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Container className={styles.eventsContainer}>
      <Row className="mb-4">
        <Col>
          <h1 className={styles.pageTitle}>Campus Events</h1>
          <p className={styles.pageSubtitle}>Discover what&apos;s happening at UH Manoa</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text className={styles.searchIcon}>
              <Search />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search events by name, description, or location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </InputGroup>
        </Col>
        <Col md={4} className="d-flex justify-content-end align-items-center">
          <Button variant="success" className={styles.addEventButton}>
            <Calendar className="me-2" />
            {' '}
            Add Event
          </Button>
        </Col>
      </Row>

      <Tab.Container defaultActiveKey="upcoming">
        <Row className="mb-4">
          <Col>
            <Nav variant="tabs" className={styles.eventsTabs}>
              <Nav.Item>
                <Nav.Link eventKey="upcoming">Upcoming</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="this-week">This Week</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="this-month">This Month</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="past">Past Events</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>

        <Tab.Content>
          <Tab.Pane eventKey="upcoming">
            <Row>
              {filteredEvents.map((event) => (
                <Col key={event.id} md={6} className="mb-4">
                  <Card className={styles.eventCard}>
                    <Row>
                      <Col md={4}>
                        <div className={styles.eventImageContainer}>
                          <Image 
                            src={event.imageUrl} 
                            alt={event.name} 
                            className={styles.eventImage} 
                          />
                        </div>
                      </Col>
                      <Col md={8}>
                        <div className="card-body">
                          <div className={styles.eventDate}>
                            <div className={styles.eventMonth}>{event.date.split(' ')[0]}</div>
                            <div className={styles.eventDay}>{event.date.split(' ')[1]}</div>
                          </div>
                          <h5 className={`card-title ${styles.eventTitle}`}>{event.name}</h5>
                          <p className={`card-text ${styles.eventTime}`}>
                            <Calendar className="me-2" />
                            {' '}
                            {event.time}
                          </p>
                          <p className={`card-text ${styles.eventLocation}`}>
                            <PinMap className="me-2" />
                            {' '}
                            {event.location}
                          </p>
                          <div className={styles.eventAttendees}>
                            <People className="me-2" />
                            {' '}
                            {event.attendees}
                            {' '}
                            attending
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>
          </Tab.Pane>
          <Tab.Pane eventKey="this-week">
            <p className="text-center py-5">Events this week will appear here.</p>
          </Tab.Pane>
          <Tab.Pane eventKey="this-month">
            <p className="text-center py-5">Events this month will appear here.</p>
          </Tab.Pane>
          <Tab.Pane eventKey="past">
            <p className="text-center py-5">Past events will appear here.</p>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default EventsPage;
