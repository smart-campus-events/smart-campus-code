// src/components/ClubCard.tsx
import type { ClubWithDetails } from '@/types/prismaExtendedTypes'; // Adjust path
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Stack } from 'react-bootstrap'; // Import Bootstrap components
import { Bookmark, BookmarkFill } from 'react-bootstrap-icons'; // Icons for follow/unfollow

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
  const { data: session } = useSession();
  const router = useRouter();

  // Track follow state
  const [isFollowed, setIsFollowed] = useState(false);

  // Initialize follow state if the club comes with a list of followers
  useEffect(() => {
    if (session?.user && club.favoritedBy) {
      setIsFollowed(
        club.favoritedBy.some(f => f.id === session.user?.id)
        );
    }
  }, [session, club.favoritedBy]);

  // Toggle follow/unfollow
  const handleFollow = async () => {
    if (!session) {
      // Redirect to sign-in if not logged in
      router.push('/auth/signin');
      return;
    }

    try {
      await fetch('/api/clubs/${club.id}', {
        method: isFollowed ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId: club.id }),
      });
      setIsFollowed((prev) => !prev);
    } catch (error) {
      console.error('Failed to update follow status', error);
    }
  };

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
        <Card.Title className="d-flex justify-content-between align-items-start">
          <span>{club.name}</span>
          {/* Bookmark button */}
          <Button
            variant="light"
            size="sm"
            onClick={handleFollow}
            className="p-0 border-0"
            aria-label={isFollowed ? 'Unfollow club' : 'Follow club'}
          >
            {isFollowed ? <BookmarkFill /> : <Bookmark />}
          </Button>
        </Card.Title>

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
                className="p-0 border-0"
                style={{ width: '20px', height: '20px', lineHeight: '1' }}
                aria-label="Previous categories"
              >
                <i className="fas fa-chevron-left small" />{' '}
              </Button>
            )}

            {/* Badges */}
            <div className="flex-grow-1 overflow-hidden">
              {currentCategories.map(
                (ec: { categoryId: string; category: { name: string } }, index: number) => (
                  <Badge
                    key={ec.categoryId}
                    bg={getColorByIndex(startIndex + index)}
                    className="me-1 mb-1"
                  >
                    {ec.category.name}
                  </Badge>
                )
              )}
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
                <i className="fas fa-chevron-right small" />{' '}
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
