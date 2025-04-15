'use client';

import { Container, Row, Col, Card, Button, Image } from 'react-bootstrap';
import Link from 'next/link';
import { ArrowRight, Calendar, People, PinMap, Megaphone } from 'react-bootstrap-icons';
import styles from './page.module.css';

/** The Home page for Manoa Compass */
const Home = () => {
  // Mock data for clubs
  const recommendedClubs = [
    {
      id: 1,
      name: 'Computer Science Club',
      description: 'Weekly meetups, coding challenges, and tech talks.',
      members: 156,
      category: 'Technology',
      imageUrl: '/images/placeholder.svg',
    },
    {
      id: 2,
      name: 'Sustainability Club',
      description: 'Making UHM greener through community initiatives.',
      members: 89,
      category: 'Environment',
      imageUrl: '/images/placeholder.svg',
    },
    {
      id: 3,
      name: 'Hawaiian Culture Club',
      description: 'Learn about Hawaiian traditions and practices.',
      members: 203,
      category: 'Culture',
      imageUrl: '/images/placeholder.svg',
    },
  ];

  // Mock data for events
  const upcomingEvents = [
    {
      id: 1,
      name: 'Spring Career Fair 2025',
      date: 'MAR 15',
      time: '9:00 AM - 3:00 PM',
      location: 'Campus Center Ballroom',
    },
    {
      id: 2,
      name: 'Lei Making Workshop',
      date: 'MAR 18',
      time: '2:00 PM - 4:00 PM',
      location: 'Queen Liliʻuokalani Center',
    },
  ];

  // Mock data for announcements
  const announcements = [
    {
      id: 1,
      title: 'Spring Break Schedule Changes',
      description: 'Modified campus services hours during March 25-29, 2025',
    },
    {
      id: 2,
      title: 'Library Extended Hours',
      description: '24/7 access available during finals week',
    },
  ];

  return (
    <main className={styles.mainContent}>
      <Container className={styles.welcomeSection}>
        <Row className="mb-4">
          <Col>
            <h1 className={styles.welcomeHeading}>Aloha, Sarah!</h1>
            <p className={styles.welcomeSubheading}>Here&apos;s what&apos;s happening around campus</p>
          </Col>
        </Row>

        {/* Clubs You Might Like Section */}
        <Row className="mb-4">
          <Col className="d-flex justify-content-between align-items-center mb-3">
            <h2 className={styles.sectionHeading}>Clubs You Might Like</h2>
            <Link href="/clubs" className={styles.seeAllLink}>
              See All
              {' '}
              <ArrowRight size={16} />
            </Link>
          </Col>
        </Row>
        <Row>
          {recommendedClubs.map((club) => (
            <Col key={club.id} md={4} className="mb-4">
              <Card className={styles.clubCard}>
                <div className={styles.clubCardImageContainer}>
                  <Image 
                    src={club.imageUrl} 
                    alt={club.name} 
                    className={styles.clubCardImage} 
                  />
                </div>
                <div className={styles.categoryBadge}>{club.category}</div>
                <div className="card-body">
                  <h5 className="card-title">{club.name}</h5>
                  <p className="card-text">{club.description}</p>
                  <div className={styles.memberCount}>
                    <People />
                    {' '}
                    {club.members}
                    {' '}
                    members
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Events Happening Soon Section */}
        <Row className="mb-4 mt-5">
          <Col className="d-flex justify-content-between align-items-center mb-3">
            <h2 className={styles.sectionHeading}>Events Happening Soon</h2>
            <Link href="/events" className={styles.seeAllLink}>
              View Calendar
              {' '}
              <ArrowRight size={16} />
            </Link>
          </Col>
        </Row>
        <Row>
          {upcomingEvents.map((event) => (
            <Col key={event.id} md={6} className="mb-4">
              <Card className={styles.eventCard}>
                <div className="card-body d-flex">
                  <div className={styles.eventDate}>
                    <div className={styles.eventMonth}>MAR</div>
                    <div className={styles.eventDay}>{event.date.split(' ')[1]}</div>
                  </div>
                  <div className={styles.eventDetails}>
                    <h5 className="card-title">{event.name}</h5>
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
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Connect with Peers Section */}
        <Row className="mb-4 mt-5">
          <Col>
            <Card className={styles.connectCard}>
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h2 className={styles.connectHeading}>Connect with Peers</h2>
                  <p className={styles.connectSubheading}>Find students with similar interests</p>
                </div>
                <Button variant="success" className={styles.connectButton}>Find Connections</Button>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Important Announcements Section */}
        <Row className="mb-4 mt-5">
          <Col>
            <h2 className={styles.sectionHeading}>
              <Megaphone className="me-2" />
              {' '}
              Important Announcements
            </h2>
          </Col>
        </Row>
        <Row>
          {announcements.map((announcement) => (
            <Col key={announcement.id} md={12} className="mb-3">
              <Card className={styles.announcementCard}>
                <div className="card-body">
                  <h5 className="card-title">{announcement.title}</h5>
                  <p className="card-text">{announcement.description}</p>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </main>
  );
};

export default Home;
