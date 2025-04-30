// src/app/suggestions/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Alert, Spinner, Container, Row, Col } from 'react-bootstrap'; // Assuming use of react-bootstrap
// Import your EventCard component (adjust path as needed)
import EventCard from '@/components/EventCard';
// Import the NEW ClubCard component (adjust path as needed)
import ClubCard from '@/components/ClubCard';
// Import types (adjust paths as needed)
import type { EventWithDetails, ClubWithDetails } from '@/types/prismaExtendedTypes';

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
    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/recommendations/ai-suggested'); // Use the correct endpoint
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

  const renderEventSection = (title: string, events: EventWithDetails[]) => (
    <div className="mb-5">
      <h2>{title}</h2>
      {events.length > 0 ? (
        <Row xs={1} md={2} lg={3} className="g-4">
          {events.map((event) => (
            <Col key={event.id}>
              <EventCard event={event} />
            </Col>
          ))}
        </Row>
      ) : (
        <p>No event suggestions in this category right now.</p>
      )}
    </div>
  );

  // New function to render club sections
  const renderClubSection = (title: string, clubs: ClubWithDetails[]) => (
    <div className="mb-5">
      <h2>{title}</h2>
      {clubs.length > 0 ? (
        <Row xs={1} md={2} lg={3} className="g-4">
          {clubs.map((club) => (
            <Col key={club.id}>
              {/* Use the new ClubCard component */}
              <ClubCard club={club} />
            </Col>
          ))}
        </Row>
      ) : (
        <p>No club suggestions in this category right now.</p>
      )}
    </div>
  );

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

// --- Helper Type Definition (Place in a types file e.g., src/types/prismaExtendedTypes.ts) ---
/*
import type {
  Event as PrismaEvent,
  Club as PrismaClub,
  Category,
  EventCategory,
  ClubCategory
} from '@prisma/client';

export type EventWithDetails = PrismaEvent & {
  categories: (EventCategory & { category: Category })[];
  organizerClub: { name: string } | null;
};

export type ClubWithDetails = PrismaClub & {
  categories: (ClubCategory & { category: Category })[];
  // Add other relations if needed, e.g., submittedBy, favoritedBy count
};
*/
