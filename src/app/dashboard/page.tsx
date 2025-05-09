'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Button, Spinner, Alert,
} from 'react-bootstrap';
import {
  ArrowRight, Lightbulb,
} from 'react-bootstrap-icons';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ClubCard from '@/components/ClubCard';
import EventCard from '@/components/EventCard';
import type { ClubWithDetails, EventWithDetails } from '@/types/prismaExtendedTypes';

// Define interfaces for API responses
interface ClubsResponse {
  clubs: ClubWithDetails[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface EventsResponse {
  events: EventWithDetails[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface AiSuggestionsResponse {
  topRecommendations: EventWithDetails[];
  branchOutSuggestions: EventWithDetails[];
  topClubRecommendations: ClubWithDetails[];
  branchOutClubSuggestions: ClubWithDetails[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(' ')[0] || 'there';

  // State for clubs
  const [clubs, setClubs] = useState<ClubWithDetails[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubsError, setClubsError] = useState<string | null>(null);

  // State for events
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // State for AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestionsResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);

  // Fetch clubs
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setClubsLoading(true);
        const response = await fetch('/api/clubs?limit=3');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ClubsResponse = await response.json();
        setClubs(data.clubs);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        setClubsError('Failed to load clubs');
      } finally {
        setClubsLoading(false);
      }
    };

    fetchClubs();
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        const response = await fetch('/api/events?limit=2');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: EventsResponse = await response.json();
        setEvents(data.events);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEventsError('Failed to load events');
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Fetch AI suggestions
  useEffect(() => {
    const fetchAiSuggestions = async () => {
      try {
        setAiLoading(true);
        const response = await fetch('/api/recommendations/ai-suggested');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: AiSuggestionsResponse = await response.json();
        setAiSuggestions(data);
      } catch (error) {
        console.error('Error fetching AI suggestions:', error);
        setAiError('Failed to load AI suggestions');
      } finally {
        setAiLoading(false);
      }
    };

    fetchAiSuggestions();
  }, []);

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-4 py-md-5">
        {/* Welcome Banner */}
        <div className="mb-4 mb-md-5">
          <h1 className="h2 fw-bold mb-1">
            Aloha,
            {' '}
            {userName}
            !
          </h1>
          <p className="text-muted">Here&apos;s what&apos;s happening around campus.</p>
        </div>

        {/* AI Suggestions Section */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <Lightbulb size={20} className="text-info me-2" />
              <h2 className="h4 fw-bold mb-0">AI-Powered Suggestions</h2>
            </div>
            <Link href="/suggestions" passHref legacyBehavior>
              <Button variant="link" size="sm" className="text-decoration-none fw-medium">
                See All
                {' '}
                <ArrowRight className="ms-1" size={16} />
              </Button>
            </Link>
          </div>

          {aiLoading && (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading AI suggestions...</span>
              </Spinner>
            </div>
          )}

          {aiError && <Alert variant="danger">{aiError}</Alert>}

          {!aiLoading && !aiError && aiSuggestions && (
            <div>
              {/* Show top club recommendations */}
              {aiSuggestions.topClubRecommendations && aiSuggestions.topClubRecommendations.length > 0 && (
                <div className="mb-4">
                  <h3 className="h5 mb-3">Recommended Clubs</h3>
                  <Row className="g-4 row-cols-1 row-cols-md-2 row-cols-lg-3">
                    {aiSuggestions.topClubRecommendations.slice(0, 3).map(club => (
                      <Col key={club.id}>
                        <ClubCard club={club} />
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {/* Show top event recommendations */}
              {aiSuggestions.topRecommendations && aiSuggestions.topRecommendations.length > 0 && (
                <div>
                  <h3 className="h5 mb-3">Recommended Events</h3>
                  <Row className="g-4 row-cols-1 row-cols-md-2 row-cols-lg-3">
                    {aiSuggestions.topRecommendations.slice(0, 3).map(event => (
                      <Col key={event.id}>
                        <EventCard event={event} />
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {(aiSuggestions.topClubRecommendations?.length === 0 || !aiSuggestions.topClubRecommendations)
               && (aiSuggestions.topRecommendations?.length === 0 || !aiSuggestions.topRecommendations) && (
               <Alert variant="info">
                 No AI suggestions available yet. Complete your profile to get personalized recommendations.
               </Alert>
              )}
            </div>
          )}
        </section>

        {/* Recommended Clubs Section */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h4 fw-bold mb-0">Clubs You Might Like</h2>
            <Link href="/clubs" passHref legacyBehavior>
              <Button variant="link" size="sm" className="text-decoration-none fw-medium">
                See All
                {' '}
                <ArrowRight className="ms-1" size={16} />
              </Button>
            </Link>
          </div>

          {clubsLoading && (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading clubs...</span>
              </Spinner>
            </div>
          )}

          {clubsError && <Alert variant="danger">{clubsError}</Alert>}

          {!clubsLoading && !clubsError && clubs.length === 0 && (
            <Alert variant="info">No clubs found. Explore the clubs directory to discover organizations.</Alert>
          )}

          {!clubsLoading && !clubsError && clubs.length > 0 && (
            <Row className="g-4 row-cols-1 row-cols-md-2 row-cols-lg-3">
              {clubs.map(club => (
                <Col key={club.id}>
                  <ClubCard club={club} />
                </Col>
              ))}
            </Row>
          )}
        </section>

        {/* Upcoming Events Section */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h4 fw-bold mb-0">Events Happening Soon</h2>
            <Link href="/events" passHref legacyBehavior>
              <Button variant="link" size="sm" className="text-decoration-none fw-medium">
                See All
                {' '}
                <ArrowRight className="ms-1" size={16} />
              </Button>
            </Link>
          </div>

          {eventsLoading && (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading events...</span>
              </Spinner>
            </div>
          )}

          {eventsError && <Alert variant="danger">{eventsError}</Alert>}

          {!eventsLoading && !eventsError && events.length === 0 && (
            <Alert variant="info">No upcoming events found. Check back later for new events.</Alert>
          )}

          {!eventsLoading && !eventsError && events.length > 0 && (
            <Row className="g-4 row-cols-1 row-cols-md-2">
              {events.map(event => (
                <Col key={event.id}>
                  <EventCard event={event} />
                </Col>
              ))}
            </Row>
          )}
        </section>
      </Container>
    </div>
  );
}
