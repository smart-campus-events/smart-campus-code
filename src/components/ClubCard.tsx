// src/components/ClubCard.tsx
import React, { useState } from 'react';
import { Card, Badge, Button, Stack } from 'react-bootstrap'; // Import Bootstrap components
import Link from 'next/link';
import type { ClubWithDetails } from '@/types/prismaExtendedTypes'; // Adjust path

// Define a list of Bootstrap background colors for variety
const badgeColors: string[] = [
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'dark',
];

// Helper function to get a color based on index
const getColorByIndex = (index: number): string => badgeColors[index % badgeColors.length];

interface ClubCardProps {
  club: ClubWithDetails;
}

const ClubCard: React.FC<ClubCardProps> = ({ club }) => {
  const categories = club.categories || [];
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

  return (
    <Card className="h-100 shadow-sm card-hover">
      <Card.Body className="d-flex flex-column">
        <Card.Title>{club.name}</Card.Title>
        <Card.Text className="text-muted flex-grow-1">
          {club.purpose?.substring(0, 100)}
          {club.purpose?.length > 100 ? '...' : ''}
        </Card.Text>

        {/* Category Pills Carousel */}
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
            {currentCategories.map((ec: { categoryId: string; category: { name: string } }, index: number) => (
              <Badge
                key={ec.categoryId} // Use index within the *current page* + startIndex
                                    // for consistent coloring if desired
                                    // Or just use the absolute index `startIndex + index`
                bg={getColorByIndex(startIndex + index)}
                                    // pill // Optional: make pills round
                className="me-1 mb-1"
              >
                {ec.category.name}
              </Badge>
            ))}
            {categories.length === 0 && (
            <Badge pill bg="secondary" className="me-1 mb-1">
              General
            </Badge>
            )}
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
              General
            </Badge>
          </div>
        )}

        <Link href={`/info/club/${club.id}`} legacyBehavior>
          <a href={`/info/club/${club.id}`} className="btn btn-outline-primary mt-auto">
            View Club
          </a>
        </Link>
      </Card.Body>
    </Card>
  );
};

export default ClubCard;
