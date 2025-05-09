// src/app/suggestions/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { Alert, Col, Container, Row, Spinner, Carousel } from 'react-bootstrap'; // Assuming use of react-bootstrap
// Import your EventCard component (adjust path as needed)
import EventCard from '@/components/EventCard';
// Import the NEW ClubCard component (adjust path as needed)
import ClubCard from '@/components/ClubCard';
// Import types (adjust paths as needed)
import type { ClubWithDetails, EventWithDetails } from '@/types/prismaExtendedTypes';

interface ApiResponse {
  topRecommendations: EventWithDetails[];
  branchOutSuggestions: EventWithDetails[];
  topClubRecommendations: ClubWithDetails[];
  branchOutClubSuggestions: ClubWithDetails[];
}

export default function SuggestionsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ... (fetchSuggestions remains the same) ...
    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/recommendations/ai-suggested');
        if (!response.ok) {
          throw new Error(`Failed to fetch suggestions: ${response.statusText}`);
        }
        const result: ApiResponse = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const renderEventSection = (title: string, events: EventWithDetails[]) => {
    const itemsPerPage = 3;
    const chunkedEvents: EventWithDetails[][] = [];
    for (let i = 0; i < events.length; i += itemsPerPage) {
      chunkedEvents.push(events.slice(i, i + itemsPerPage));
    }

    if (events.length === 0) {
      return (
        <div className="mb-5">
          <h2>{title}</h2>
          <p>No event suggestions in this category right now.</p>
        </div>
      );
    }

    return (
      <div className="mb-5">
        <h2>{title}</h2>
        <Carousel
          interval={null}
          variant="dark"
          indicators={chunkedEvents.length > 1}
          // Add a custom class for specific styling
          className={`custom-suggestions-carousel ${chunkedEvents.length <= 1 ? 'no-navigation-arrows' : ''}`}
        >
          {chunkedEvents.map((eventChunk, index) => (
            <Carousel.Item key={index}>
              {/* Add a specific class to this Row for padding */}
              <Row className="g-4 py-3 suggestions-carousel-item-row">
                {eventChunk.map((event) => (
                  <Col key={event.id} md={4}>
                    <EventCard event={event} />
                  </Col>
                ))}
                {Array(itemsPerPage - eventChunk.length).fill(null).map((_, placeholderIndex) => (
                  <Col key={`placeholder-event-${index}-${placeholderIndex}`} md={4} />
                ))}
              </Row>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    );
  };

  const renderClubSection = (title: string, clubs: ClubWithDetails[]) => {
    const itemsPerPage = 3;
    const chunkedClubs: ClubWithDetails[][] = [];
    for (let i = 0; i < clubs.length; i += itemsPerPage) {
      chunkedClubs.push(clubs.slice(i, i + itemsPerPage));
    }

    if (clubs.length === 0) {
      return (
        <div className="mb-5">
          <h2>{title}</h2>
          <p>No club suggestions in this category right now.</p>
        </div>
      );
    }

    return (
      <div className="mb-5">
        <h2>{title}</h2>
        <Carousel
          interval={null}
          variant="dark"
          indicators={chunkedClubs.length > 1}
          // Add the same custom class
          className={`custom-suggestions-carousel ${chunkedClubs.length <= 1 ? 'no-navigation-arrows' : ''}`}
        >
          {chunkedClubs.map((clubChunk, index) => (
            <Carousel.Item key={index}>
              {/* Add the same specific class to this Row */}
              <Row className="g-4 py-3 suggestions-carousel-item-row">
                {clubChunk.map((club) => (
                  <Col key={club.id} md={4}>
                    <ClubCard club={club} />
                  </Col>
                ))}
                {Array(itemsPerPage - clubChunk.length).fill(null).map((_, placeholderIndex) => (
                  <Col key={`placeholder-club-${index}-${placeholderIndex}`} md={4} />
                ))}
              </Row>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    );
  };

  return (
    <Container className="py-4">
      <h1>AI Suggestions</h1>
      <p>Discover events and clubs tailored just for you!</p>

      {loading && (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading suggestions...</p>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && data && (
        <>
          {/* Render Event Sections */}
          {renderEventSection('Top Event Recommendations', data.topRecommendations)}
          {renderEventSection('Branch Out Events', data.branchOutSuggestions)}

          {/* Render Club Sections */}
          {renderClubSection('Top Club Recommendations', data.topClubRecommendations)}
          {renderClubSection('Branch Out Clubs', data.branchOutClubSuggestions)}

          {(data.topRecommendations.length === 0 && data.branchOutSuggestions.length === 0
                      && data.topClubRecommendations.length === 0 && data.branchOutClubSuggestions.length === 0) && (
                        <Alert variant="info">
                          No suggestions available at the moment.
                          Explore events and clubs manually!
                        </Alert>
          )}
        </>
      )}
    </Container>
  );
}
