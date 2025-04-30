// src/components/EventCard.tsx
import React, { useState } from 'react'; // Import useState
import { Card, Button, Badge, Stack } from 'react-bootstrap'; // Import Badge and Stack
// Make sure your Prisma types are correctly imported/defined
import type { Event as PrismaEvent, Club, EventCategory, Category } from '@prisma/client';

// Define a more specific type for the event prop, including relations
type EventWithDetails = PrismaEvent & {
  categories?: (EventCategory & { category: Category })[];
  organizerClub?: Club | null;
};

// Define a list of Bootstrap background colors for variety (copied from ClubCard)
const badgeColors: string[] = [
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'dark',
];

// Helper function to get a color based on index (copied from ClubCard)
const getColorByIndex = (index: number): string => badgeColors[index % badgeColors.length];

interface EventCardProps {
  event: EventWithDetails;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const {
    title,
    description,
    startDateTime,
    location,
    categories = [], // Default to empty array if undefined
    organizerClub,
    eventUrl, // Use eventUrl from the schema
    eventPageUrl, // Or use this if eventUrl is often missing
  } = event;

  // --- Category Pagination Logic (adapted from ClubCard) ---
  const categoriesPerPage = 3;
  const totalPages = Math.ceil(categories.length / categoriesPerPage);
  const [currentPage, setCurrentPage] = useState(0);

  // Calculate the start and end index for the current page
  const startIndex = currentPage * categoriesPerPage;
  const endIndex = startIndex + categoriesPerPage;
  const currentCategories = categories.slice(startIndex, endIndex);

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };
  // --- End Category Pagination Logic ---

  const formattedDate = new Date(startDateTime).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = new Date(startDateTime).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Determine the link URL - prioritize eventUrl, fallback to eventPageUrl or disable
  const cardLink = eventUrl || eventPageUrl;

  return (
    <Card className="h-100 shadow-sm card-hover">
      {/* Optional: Add an image if you have one */}
      {/* <Card.Img variant="top" src={event.imageUrl || '/placeholder-event.jpg'} /> */}
      <Card.Body className="d-flex flex-column">
        <Card.Title>{title}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          {formattedDate}
          {' '}
          at
          {formattedTime}
        </Card.Subtitle>
        <Card.Text className="flex-grow-1">
          {description
            ? description.substring(0, 100) + (description.length > 100 ? '...' : '')
            : 'No description available.'}
        </Card.Text>
        <div className="mb-2">
          <small className="text-muted">
            <i className="fa-solid fa-location-dot me-1" />
            {' '}
            {location || 'Location TBD'}
          </small>
        </div>
        {organizerClub && (
          <div className="mb-2">
            <small className="text-muted">
              <i className="fa-solid fa-users me-1" />
              {' '}
              Hosted by:
              {organizerClub.name}
            </small>
          </div>
        )}

        {/* --- Category Pills Carousel (adapted from ClubCard) --- */}
        {categories.length > 0 && (
          <Stack direction="horizontal" gap={2} className="mb-3 align-items-center">
            {/* Previous Button */}
            {totalPages > 1 && (
              <Button
                variant="light"
                size="sm"
                onClick={handlePrev}
                disabled={currentPage === 0}
                className="p-0 border-0" // Minimal styling
                style={{ width: '20px', height: '20px', lineHeight: '1' }} // Adjust size
                aria-label="Previous categories"
              >
                <i className="fas fa-chevron-left small" />
                {' '}
                {/* Font Awesome */}
              </Button>
            )}

            {/* Badges */}
            <div className="flex-grow-1 overflow-hidden">
              {' '}
              {/* Container for badges */}
              {currentCategories.map((ec: EventCategory & { category: Category }, index: number) => (
                <Badge
                  key={ec.category.id} // Use category ID as key
                  bg={getColorByIndex(startIndex + index)} // Use color based on absolute index
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
                className="p-0 border-0" // Minimal styling
                style={{ width: '20px', height: '20px', lineHeight: '1' }} // Adjust size
                aria-label="Next categories"
              >
                <i className="fas fa-chevron-right small" />
                {' '}
                {/* Font Awesome */}
              </Button>
            )}
          </Stack>
        )}
        {/* Fallback if no categories */}
        {categories.length === 0 && (
          <div className="mb-3">
            <Badge bg="secondary" className="me-1 mb-1">
              {' '}
              {/* Use standard Badge */}
              General
            </Badge>
          </div>
        )}
        {/* --- End Category Pills Carousel --- */}

        {/* Link to the external event URL */}
        <Button
          variant="primary" // Changed back to primary as per original EventCard
          href={cardLink || '#'} // Provide a fallback href or handle differently
          target="_blank" // Open external links in a new tab
          rel="noopener noreferrer" // Security best practice for external links
          disabled={!cardLink} // Disable button if no URL is available
          className="mt-auto" // Keep button at the bottom
        >
          { cardLink ? 'View Event Source' : 'Details Unavailable' }
        </Button>
      </Card.Body>
    </Card>
  );
};

export default EventCard;
