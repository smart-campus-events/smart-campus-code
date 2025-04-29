'use client';

// Required for useState and useEffect

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { Event as PrismaEvent } from '@prisma/client'; // Or import your specific type
import EventCard from '@/components/EventCard'; // Adjust path if needed

// Define the structure of the expected API response
interface ApiResponse {
  topRecommendations: PrismaEvent[];
  branchOutSuggestions: PrismaEvent[];
}

const EVENTS_PER_PAGE = 3;

const SuggestedEventsPage: React.FC = () => {
  const [topEvents, setTopEvents] = useState<PrismaEvent[]>([]);
  const [branchOutEvents, setBranchOutEvents] = useState<PrismaEvent[]>([]);
  const [currentTopIndex, setCurrentTopIndex] = useState(0);
  const [currentBranchOutIndex, setCurrentBranchOutIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        // Replace with your actual API endpoint that calls the AI
        const response = await fetch('/api/recommendations/ai-suggested');
        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
        }
        const data: ApiResponse = await response.json();
        // Ensure the data structure matches ApiResponse
        setTopEvents(data.topRecommendations || []);
        setBranchOutEvents(data.branchOutSuggestions || []);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setTopEvents([]); // Clear events on error
        setBranchOutEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  // --- Pagination Logic ---
  const handleNext = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    currentIndex: number,
    totalEvents: number,
  ) => {
    const nextIndex = currentIndex + EVENTS_PER_PAGE;
    if (nextIndex < totalEvents) {
      setter(nextIndex);
    }
  };

  const handlePrev = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    currentIndex: number,
  ) => {
    const prevIndex = currentIndex - EVENTS_PER_PAGE;
    if (prevIndex >= 0) {
      setter(prevIndex);
    }
  };

  // Helper to render a section
  const renderEventSection = (
    title: string,
    events: PrismaEvent[],
    currentIndex: number,
    setIndex: React.Dispatch<React.SetStateAction<number>>,
  ) => {
    const displayedEvents = events.slice(
      currentIndex,
      currentIndex + EVENTS_PER_PAGE,
    );
    const totalEvents = events.length;
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex + EVENTS_PER_PAGE < totalEvents;

    return (
      <section className="mb-5">
        <h2>{title}</h2>
        {events.length === 0 && !loading && (
        <p>No suggestions found in this category right now.</p>
        )}
        {events.length > 0 && (
        <Row className="align-items-center g-3">
          <Col xs="auto" className="d-flex align-items-center">
            <Button
              variant="outline-secondary"
              onClick={() => handlePrev(setIndex, currentIndex)}
              disabled={!canGoPrev}
              aria-label={`Previous ${title} events`}
            >
              <i className="fa-solid fa-chevron-left" />
            </Button>
          </Col>

          <Col>
            <Row xs={1} md={2} lg={3} className="g-4">
              {displayedEvents.map((event) => (
                <Col key={event.id}>
                  <EventCard event={event} />
                </Col>
              ))}
              {/* Add placeholder cards if fewer than 3 are displayed */}
              {Array.from({ length: EVENTS_PER_PAGE - displayedEvents.length }).map(() => (
                <Col key={`placeholder-${title}-${crypto.randomUUID()}`} />
              ))}
            </Row>
          </Col>

          <Col xs="auto" className="d-flex align-items-center">
            <Button
              variant="outline-secondary"
              onClick={() => handleNext(setIndex, currentIndex, totalEvents)}
              disabled={!canGoNext}
              aria-label={`Next ${title} events`}
            >
              <i className="fa-solid fa-chevron-right" />
            </Button>
          </Col>
        </Row>
        )}
      </section>
    );
  };

  return (
    <Container fluid="lg" className="py-4">
      <h1>Suggested Events For You</h1>
      <p className="lead mb-4">Discover events tailored to your interests.</p>

      {loading && (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading recommendations...</p>
        </div>
      )}

      {error && (
      <Alert variant="danger">
        Error loading recommendations:
        {error}
      </Alert>
      )}

      {!loading && !error && (
        <>
          {renderEventSection(
            'Top Recommendations',
            topEvents,
            currentTopIndex,
            setCurrentTopIndex,
          )}
          {renderEventSection(
            'Want to Branch Out?',
            branchOutEvents,
            currentBranchOutIndex,
            setCurrentBranchOutIndex,
          )}
        </>
      )}
    </Container>
  );
};

export default SuggestedEventsPage;
