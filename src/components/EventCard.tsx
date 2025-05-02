// src/components/EventCard.tsx
import React, { useState } from 'react';
import { Card, Button, Badge, Stack } from 'react-bootstrap';

// --- Import the SHARED type definition from your central types file ---
// This ensures consistency across your application.
import type { EventWithDetails } from '@/types/prismaExtendedTypes';
// Assuming EventWithDetails defines categories as:
// categories: (EventCategory & { category: Category })[];
// and organizerClub as:
// organizerClub: { name: string } | null;

// --- You might not need these individual imports anymore if EventWithDetails covers everything ---
// import type { Event as PrismaEvent, Club, EventCategory, Category } from '@prisma/client';

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

// Define the props interface using the imported shared type
interface EventCardProps {
  event: EventWithDetails;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  // Destructure properties from the event object.
  // Type safety comes from the EventWithDetails interface.
  const {
    title,
    description,
    startDateTime,
    location,
    categories = [], // Default to empty array handles case if categories is optional or empty
    organizerClub, // Correctly typed as { name: string } | null from imported type
    eventUrl,
    eventPageUrl,
  } = event;

  // --- State and handlers for Category Pagination ---
  const categoriesPerPage = 3;
  // Safely calculate total pages, handling potentially undefined/empty categories
  const totalPages = Math.ceil((categories || []).length / categoriesPerPage);
  const [currentPage, setCurrentPage] = useState(0);

  // Calculate the slice of categories to display for the current page
  const startIndex = currentPage * categoriesPerPage;
  const endIndex = startIndex + categoriesPerPage;
  // Safely slice categories
  const currentCategories = (categories || []).slice(startIndex, endIndex);

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };
  // --- End Category Pagination Logic ---

  // Format date and time for display
  const formattedDate = new Date(startDateTime).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = new Date(startDateTime).toLocaleTimeString(undefined, {
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
          {formattedTime}
        </Card.Subtitle>

        {/* Display truncated description */}
        <Card.Text className="flex-grow-1">
          {description
            ? description.substring(0, 100) + (description.length > 100 ? '...' : '')
            : 'No description available.'}
        </Card.Text>

        {/* Display Location */}
        <div className="mb-2">
          <small className="text-muted">
            <i className="fa-solid fa-location-dot me-1" aria-hidden="true" />
            {' '}
            {location || 'Location TBD'}
          </small>
        </div>

        {/* Display Organizer Club Name if available */}
        {/* This check works correctly with the imported type */}
        {organizerClub && (
          <div className="mb-2">
            <small className="text-muted">
              <i className="fa-solid fa-users me-1" aria-hidden="true" />
              {' '}
              Hosted by:
              {' '}
              {organizerClub.name}
            </small>
          </div>
        )}

        {/* --- Category Pills with Pagination --- */}
        {(categories || []).length > 0 ? (
          <Stack direction="horizontal" gap={2} className="mb-3 align-items-center">
            {/* Previous Button */}
            {totalPages > 1 && (
              <Button
                variant="light"
                size="sm"
                onClick={handlePrev}
                disabled={currentPage === 0}
                className="p-0 border-0"
                style={{ width: '20px', height: '20px', lineHeight: '1' }}
                aria-label="Previous categories"
              >
                <i className="fas fa-chevron-left small" aria-hidden="true" />
              </Button>
            )}

            {/* Badges Container */}
            <div className="flex-grow-1 overflow-hidden">
              {/* Map through the categories for the current page */}
              {/* Ensure 'ec' type matches the structure in EventWithDetails */}
              {currentCategories.map((ec, index) => (
                <Badge
                  key={ec.category.id} // Use the unique category ID
                  bg={getColorByIndex(startIndex + index)} // Get color based on overall index
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
                style={{ width: '20px', height: '20px', lineHeight: '1' }}
                aria-label="Next categories"
              >
                <i className="fas fa-chevron-right small" aria-hidden="true" />
              </Button>
            )}
          </Stack>
        ) : (
          // Fallback if no categories are present
          <div className="mb-3">
            <Badge bg="secondary" className="me-1 mb-1">
              General
            </Badge>
          </div>
        )}
        {/* --- End Category Pills --- */}

        {/* Button to link to external event source */}
        <Button
          variant="primary"
          href={cardLink || '#'} // Fallback href to prevent errors, button is disabled below if no link
          target="_blank"
          rel="noopener noreferrer"
          disabled={!cardLink} // Disable if no valid link exists
          className="mt-auto" // Push button to the bottom
        >
          {cardLink ? 'View Event Source' : 'Details Unavailable'}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default EventCard;
