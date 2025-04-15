'use client';

import React from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  // Stack, // Using Stack for vertical layout if needed, but Row/Col is primary here
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUsers } from '@fortawesome/free-solid-svg-icons'; // Example icons

// Define an interface for our event/club data
interface SuggestionItem {
  id: number;
  title: string;
  description: string; // Can include date/time or short blurb
  imageUrl: string;
  url: string; // Link to the event/club website
  tags: { label: string; bg: string; text: string }[]; // Category tags
  type: 'event' | 'club';
}

// Placeholder Data (replace with actual data source later)
const interestBasedSuggestions: SuggestionItem[] = [
  {
    id: 1,
    title: 'UH Esports Valorant Tournament',
    description: 'Compete or watch the finals! Sat, April 26th, 5 PM',
    imageUrl: 'https://placehold.co/600x400/3b82f6/white?text=Gaming+Event', // Placeholder image
    url: 'https://hawaii.edu/esports', // Placeholder URL
    tags: [
      { label: 'Gaming', bg: 'primary-subtle', text: 'primary-emphasis' },
      { label: 'Competition', bg: 'danger-subtle', text: 'danger-emphasis' },
    ],
    type: 'event',
  },
  {
    id: 2,
    title: 'ACM Mānoa Python Workshop',
    description: 'Learn web scraping basics. Free for students.',
    imageUrl: 'https://placehold.co/600x400/10b981/white?text=Coding+Workshop', // Placeholder image
    url: 'https://acmmanoa.org', // Placeholder URL
    tags: [
      { label: 'Tech', bg: 'info-subtle', text: 'info-emphasis' },
      { label: 'Workshop', bg: 'warning-subtle', text: 'warning-emphasis' },
    ],
    type: 'club', // Or event if it's a specific one-time thing
  },
  {
    id: 3,
    title: 'IEEE Robotics Club Meeting',
    description: 'Join us to work on the latest VEX U challenge.',
    imageUrl: 'https://placehold.co/600x400/8b5cf6/white?text=Robotics+Club', // Placeholder image
    url: 'https://ieee.studentorg.hawaii.edu/', // Placeholder URL
    tags: [
      { label: 'Engineering', bg: 'secondary-subtle', text: 'secondary-emphasis' },
      { label: 'Tech', bg: 'info-subtle', text: 'info-emphasis' },
    ],
    type: 'club',
  },
];

const branchOutSuggestions: SuggestionItem[] = [
  {
    id: 4,
    title: 'Mānoa Campus Arboretum Tour',
    description: 'Discover unique plants on campus. Every Friday, 10 AM.',
    imageUrl: 'https://placehold.co/600x400/22c55e/white?text=Nature+Tour', // Placeholder image
    url: 'https://manoa.hawaii.edu/lyonarboretum/', // Placeholder URL (using Lyon as example)
    tags: [
      { label: 'Nature', bg: 'success-subtle', text: 'success-emphasis' },
      { label: 'Campus', bg: 'light', text: 'dark' }, // Use light for neutral tags
    ],
    type: 'event',
  },
  {
    id: 5,
    title: 'East-West Center Gallery Exhibit',
    description: 'Featuring contemporary Asia Pacific artists.',
    imageUrl: 'https://placehold.co/600x400/f97316/white?text=Art+Exhibit', // Placeholder image
    url: 'https://www.eastwestcenter.org/education/ewc-gallery', // Placeholder URL
    tags: [
      { label: 'Art', bg: 'warning-subtle', text: 'warning-emphasis' },
      { label: 'Culture', bg: 'info-subtle', text: 'info-emphasis' },
    ],
    type: 'event',
  },
  {
    id: 6,
    title: 'Stargazing Night - Hawaiian Astronomical Society',
    description: 'Public viewing event at Kahala Community Park.',
    imageUrl: 'https://placehold.co/600x400/1f2937/white?text=Stargazing', // Placeholder image
    url: 'https://www.hawastsoc.org/events', // Placeholder URL
    tags: [
      { label: 'Science', bg: 'primary-subtle', text: 'primary-emphasis' },
      { label: 'Community', bg: 'secondary-subtle', text: 'secondary-emphasis' },
    ],
    type: 'event',
  },
];

const SuggestedEventsPage: React.FC = () => (
  <div className="gradient-background">
    <Container className="py-5">
      {/* --- Interest-Based Suggestions --- */}
      <section className="mb-5">
        <h2 className="mb-4">Based on Your Interests</h2>
        <Row xs={1} md={2} lg={3} className="g-4">
          {' '}
          {/* Adjust columns based on screen size, g-4 for gutters */}
          {interestBasedSuggestions.map((item) => (
            <Col key={item.id}>
              <Card
                as="a" // Make the entire card a link
                href={item.url}
                target="_blank" // Open in new tab
                rel="noopener noreferrer"
                className="h-100 shadow-sm text-decoration-none text-dark card-hover"
              >
                <Card.Img
                  variant="top"
                  src={item.imageUrl}
                  alt={`${item.title} image`}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <Card.Body className="d-flex flex-column">
                  {' '}
                  {/* Flex column for alignment */}
                  <Card.Title as="h5" className="mb-2">{item.title}</Card.Title>
                  <Card.Text className="text-muted small mb-3">
                    {/* Example: Add icon based on type */}
                    <FontAwesomeIcon icon={item.type === 'event' ? faCalendarAlt : faUsers} className="me-2" />
                    {item.description}
                  </Card.Text>
                  <div className="mt-auto">
                    {' '}
                    {/* Push tags to the bottom */}
                    {item.tags.map((tag) => (
                      <Badge key={`${item.id}-${tag.label}`} pill bg={tag.bg} text={tag.text} className="me-1 mb-1">
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                  {/* Optional: Add an explicit link icon/text if card-as-link isn't obvious enough */}
                  {/* <div className="mt-2 text-primary small">
                      <FontAwesomeIcon icon={faExternalLinkAlt} className="me-1" />
                      Visit Website
                    </div> */}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* --- Branch Out Suggestions --- */}
      <section>
        <h2 className="mb-4">Want to Branch Out?</h2>
        <Row xs={1} md={2} lg={3} className="g-4">
          {branchOutSuggestions.map((item) => (
            <Col key={item.id}>
              <Card
                as="a"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-100 shadow-sm text-decoration-none text-dark card-hover"
              >
                <Card.Img
                  variant="top"
                  src={item.imageUrl}
                  alt={`${item.title} image`}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <Card.Body className="d-flex flex-column">
                  <Card.Title as="h5" className="mb-2">{item.title}</Card.Title>
                  <Card.Text className="text-muted small mb-3">
                    <FontAwesomeIcon icon={item.type === 'event' ? faCalendarAlt : faUsers} className="me-2" />
                    {item.description}
                  </Card.Text>
                  <div className="mt-auto">
                    {item.tags.map((tag) => (
                      <Badge key={tag.label} pill bg={tag.bg} text={tag.text} className="me-1 mb-1">
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </Container>
  </div>
);

export default SuggestedEventsPage;
