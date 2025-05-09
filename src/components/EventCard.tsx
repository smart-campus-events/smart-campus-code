// src/components/EventCard.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Spinner, Stack } from 'react-bootstrap';

// --- Import the SHARED type definition from your central types file ---
// This ensures consistency across your application.
import type { EventWithDetails } from '@/types/prismaExtendedTypes';
// Assuming EventWithDetails defines categories as:
//   categories: (EventCategory & { category: Category })[];
// and organizerClub as:
//   organizerClub: { name: string } | null;
// and includes rsvps: { userId: string }[]

// --- You might not need these individual imports anymore if EventWithDetails covers everything ---
// import type { Event as PrismaEvent, Club, EventCategory, Category, RSVP } from '@prisma/client';

import { useSession } from 'next-auth/react';

// Define a list of Bootstrap background colors for category badges
const badgeColors: string[] = [
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'dark',
];

// Helper function to cycle through badge colors
const getColorByIndex = (index: number): string => badgeColors[index % badgeColors.length];

interface EventCardProps {
  event: EventWithDetails;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // --- RSVP state & handlers ---
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [loadingRSVP, setLoadingRSVP] = useState(false);

  // initialize RSVP state from event.rsvps once on mount
  useEffect(() => {
    if (userId) {
      setIsRSVPed(event.rsvps.some((r) => r.userId === userId));
    }
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle RSVP status (optimistic UI + API call)
  const toggleRSVP = async () => {
    if (!userId) {
      // Optionally redirect to login
      return;
    }

    const nextStatus = !isRSVPed;
    setIsRSVPed(nextStatus);
    setLoadingRSVP(true);

    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, {
        method: nextStatus ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('RSVP request failed');
    } catch (err) {
      console.error('RSVP toggle failed:', err);
      // revert on error
      setIsRSVPed(!nextStatus);
    } finally {
      setLoadingRSVP(false);
    }
  };
  // --- End RSVP logic ---

  // Destructure properties from the event object.
  // Type safety comes from the EventWithDetails interface.
  const {
    title,
    description,
    startDateTime,
    location,
    categories = [], // Default to empty array if undefined
    organizerClub, // { name: string } | null
    eventUrl,
    eventPageUrl,
  } = event;

  // --- State and handlers for Category Pagination ---
  const categoriesPerPage = 3;
  const totalPages = Math.ceil(categories.length / categoriesPerPage);
  const [currentPage, setCurrentPage] = useState(0);

  const startIndex = currentPage * categoriesPerPage;
  const currentCategories = categories.slice(
    startIndex,
    startIndex + categoriesPerPage,
  );

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 0));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  // --- End Category Pagination Logic ---

  // Format date and time for display
  const formattedDate = new Date(startDateTime).toLocaleDateString(
    undefined,
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    },
  );
  const date = new Date(startDateTime);

  // Add 10 hours
  date.setHours(date.getHours() + 10);

  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Determine the link for the main button (prefer eventUrl)
  const cardLink = eventUrl || eventPageUrl;

  return (
    <Card className="h-100 shadow-sm card-hover">
      {/* Optional Image Placeholder */}
      {/* <Card.Img variant="top" src={event.imageUrl || '/placeholder-event.jpg'} /> */}
      <Card.Body className="d-flex flex-column">
        <Card.Title>{title || 'Untitled Event'}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          {formattedDate}
          {' '}
          at
          {' '}
          {formattedTime}
        </Card.Subtitle>

        {/* Display truncated description */}
        <Card.Text className="flex-grow-1">
          {description
            ? description.substring(0, 100)
              + (description.length > 100 ? '...' : '')
            : 'No description available.'}
        </Card.Text>

        {/* Display Location */}
        <div className="mb-2">
          <small className="text-muted">
            <i className="fa-solid fa-location-dot me-1" aria-hidden="true" />
            {location || 'Location TBD'}
          </small>
        </div>

        {/* Display Organizer Club Name if available */}
        {organizerClub && (
          <div className="mb-2">
            <small className="text-muted">
              <i className="fa-solid fa-users me-1" aria-hidden="true" />
              Hosted by:
              {' '}
              {organizerClub.name}
            </small>
          </div>
        )}

        {/* --- Category Pills with Pagination --- */}
        {categories.length > 0 ? (
          <Stack direction="horizontal" gap={2} className="mb-3 align-items-center">
            {/* Previous Button */}
            {totalPages > 1 && (
              <Button
                variant="light"
                size="sm"
                onClick={handlePrev}
                disabled={currentPage === 0}
                className="p-0 border-0"
                style={{ width: 20, height: 20 }}
                aria-label="Previous categories"
              >
                <i className="fas fa-chevron-left small" aria-hidden="true" />
              </Button>
            )}

            {/* Badges Container */}
            <div className="flex-grow-1 overflow-hidden">
              {currentCategories.map((ec, idx) => (
                <Badge
                  key={ec.category.id}
                  bg={getColorByIndex(startIndex + idx)}
                  className="me-1 mb-1"
                >
                  {ec.category.name}
                </Badge>
              ))}
            </div>

            {/* Next Button */}
            {totalPages > 1 && (
              <Button
                variant="light"
                size="sm"
                onClick={handleNext}
                disabled={currentPage === totalPages - 1}
                className="p-0 border-0"
                style={{ width: 20, height: 20 }}
                aria-label="Next categories"
              >
                <i className="fas fa-chevron-right small" aria-hidden="true" />
              </Button>
            )}
          </Stack>
        ) : (
          <div className="mb-3">
            <Badge bg="secondary" className="me-1 mb-1">
              General
            </Badge>
          </div>
        )}
        {/* --- End Category Pills --- */}

        {/* RSVP + View Source Buttons */}
        <Stack direction="horizontal" gap={2} className="mt-auto">
          <Button
            onClick={toggleRSVP}
            disabled={loadingRSVP}
            variant={isRSVPed ? 'success' : 'outline-primary'}
          >
            {(() => {
              if (loadingRSVP) return <Spinner animation="border" size="sm" />;
              if (isRSVPed) return 'RSVP’d';
              return 'RSVP';
            })()}
          </Button>

          <Button
            variant="primary"
            href={cardLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!cardLink}
          >
            {cardLink ? 'View Event Source' : 'Details Unavailable'}
          </Button>
        </Stack>
      </Card.Body>
    </Card>
  );
};

export default EventCard;
