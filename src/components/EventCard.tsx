import React from 'react';
import { Card, Button } from 'react-bootstrap';
// Make sure your Prisma types are correctly imported/defined
import type { Event as PrismaEvent, Club, EventCategory, Category } from '@prisma/client';

// Define a more specific type for the event prop, including relations
type EventWithDetails = PrismaEvent & {
  categories?: (EventCategory & { category: Category })[];
  organizerClub?: Club | null;
};

interface EventCardProps {
  event: EventWithDetails;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const {
    title,
    description,
    startDateTime,
    location,
    categories,
    organizerClub,
    eventUrl, // Use eventUrl from the schema
    eventPageUrl, // Or use this if eventUrl is often missing
  } = event;

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
              {' '}
              {organizerClub.name}
            </small>
          </div>
        )}
        <div className="mb-3">
          {categories?.map((cat) => (
            <span key={cat.category.id} className="badge bg-info-subtle text-info-emphasis me-1">
              {cat.category.name}
            </span>
          ))}
        </div>
        {/* Link to the external event URL */}
        <Button
          variant="primary"
          href={cardLink || '#'} // Provide a fallback href or handle differently
          target="_blank" // Open external links in a new tab
          rel="noopener noreferrer" // Security best practice for external links
          disabled={!cardLink} // Disable button if no URL is available
          className="mt-auto"
        >
          { cardLink ? 'View Event Source' : 'Details Unavailable' }
        </Button>
      </Card.Body>
    </Card>
  );
};

export default EventCard;
