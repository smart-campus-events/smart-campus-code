'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, InputGroup,
  Dropdown, Pagination, Breadcrumb, ButtonGroup,
  Alert,
} from 'react-bootstrap';
import {
  Search, Funnel, X, CalendarEvent, GeoAlt, // Changed Clock to CalendarEvent, Added GeoAlt
  Grid3x3GapFill, ListUl, ChevronLeft, ChevronRight, Star, StarFill, // Added Star as an alternative bookmark icon
} from 'react-bootstrap-icons';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate, formatTime } from '@/lib/utils/dateUtils'; // Import date utils

// Define types for our API responses
interface Category {
  id: string;
  name: string;
}

interface EventCategory {
  category: Category;
}

interface Event {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string | null;
  allDay: boolean | null;
  description: string | null;
  costAdmission: string | null;
  attendanceType: string;
  location: string | null;
  locationVirtualUrl: string | null;
  organizerSponsor: string | null;
  categories: EventCategory[];
  _count: {
    rsvps: number;
  };
}

interface ApiResponse {
  events: Event[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// TODO: Replace hardcoded data with actual data fetching, filtering, sorting, pagination
// TODO: Implement filter modal/offcanvas functionality
// TODO: Implement search, sort, filter removal, view toggle, save event, pagination logic
// TODO: Use proper linking for event cards

const initialActiveFilters: string[] = []; // Empty initial filters

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState(initialActiveFilters);
  const [sortBy, setSortBy] = useState('Date: Soonest'); // Default sort for events
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 0,
  });
  const [favoriteEventIds, setFavoriteEventIds] = useState<string[]>([]);

  // Fetch events from the API
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: '9', // Show 9 events per page for grid layout
          ...(searchTerm ? { q: searchTerm } : {}),
          ...(sortBy ? { sort: sortBy } : {}),
        });

        const response = await fetch(`/api/events?${queryParams.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data: ApiResponse = await response.json();
        setEvents(data.events);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [currentPage, searchTerm, sortBy]);

  // Fetch user's favorite events from localStorage
  const fetchFavoriteEvents = useCallback(() => {
    try {
      // Get favorites from localStorage if available
      if (typeof window !== 'undefined') {
        const storedFavorites = localStorage.getItem('favoriteEvents');
        if (storedFavorites) {
          setFavoriteEventIds(JSON.parse(storedFavorites));
        }
      }
    } catch (err) {
      console.error('Failed to fetch favorite events from localStorage:', err);
    }
  }, []);

  // Add this useEffect hook to load favorites when component mounts
  useEffect(() => {
    fetchFavoriteEvents();
  }, [fetchFavoriteEvents]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterClick = () => {
    // TODO: Open filter modal/offcanvas
    console.log('Filter button clicked');
  };

  const handleSortSelect = (eventKey: string | null) => {
    if (eventKey) {
      setSortBy(eventKey);
      setCurrentPage(1); // Reset to first page when sorting changes
    }
  };

  const handleRemoveFilter = (filterToRemove: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filterToRemove));
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveEvent = async (eventId: string) => {
    try {
      const isCurrentlyFavorited = favoriteEventIds.includes(eventId);

      // Optimistically update the UI
      let updatedFavorites;
      if (isCurrentlyFavorited) {
        updatedFavorites = favoriteEventIds.filter(id => id !== eventId);
      } else {
        updatedFavorites = [...favoriteEventIds, eventId];
      }

      // Update state
      setFavoriteEventIds(updatedFavorites);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('favoriteEvents', JSON.stringify(updatedFavorites));
      }

      // Make the API call (currently just a stub that returns success)
      const method = isCurrentlyFavorited ? 'DELETE' : 'POST';
      await fetch(`/api/events/${eventId}/favorite`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (err: any) {
      console.error('Error starring/favoriting event:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Generate pagination items
  const paginationItems = [];
  if (pagination.totalPages <= 5) {
    for (let number = 1; number <= pagination.totalPages; number++) {
      paginationItems.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>,
      );
    }
  } else {
    // Basic ellipsis logic for more than 5 pages
    paginationItems.push(
      <Pagination.Item
        key={1}
        active={currentPage === 1}
        onClick={() => handlePageChange(1)}
      >
        {1}
      </Pagination.Item>,
    );
    if (currentPage > 3) paginationItems.push(<Pagination.Ellipsis key="ell-start" disabled />);
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(pagination.totalPages - 1, currentPage + 1);
    if (currentPage <= 3) endPage = 3;
    if (currentPage >= pagination.totalPages - 2) startPage = pagination.totalPages - 2;

    for (let number = startPage; number <= endPage; number++) {
      paginationItems.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>,
      );
    }
    if (currentPage < pagination.totalPages - 2) paginationItems.push(<Pagination.Ellipsis key="ell-end" disabled />);
    paginationItems.push(
      <Pagination.Item
        key={pagination.totalPages}
        active={pagination.totalPages === currentPage}
        onClick={() => handlePageChange(pagination.totalPages)}
      >
        {pagination.totalPages}
      </Pagination.Item>,
    );
  }

  // Helper function to format event date
  const formatEventDate = (event: Event) => {
    if (!event.startDateTime) return 'Date TBD';

    const startDate = new Date(event.startDateTime);
    let dateStr = formatDate(startDate);

    if (event.allDay) {
      return `${dateStr} (All day)`;
    }

    dateStr += ` at ${formatTime(startDate)}`;
    return dateStr;
  };

  return (
    <div className="bg-light min-vh-100">
      {/* Assuming Header/Navigation is handled by the main layout */}

      <Container className="py-4 py-md-5">
        {/* Breadcrumb - Assuming Dashboard exists */}
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item linkAs={Link} href="/dashboard">Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item active>Events</Breadcrumb.Item>
        </Breadcrumb>

        {/* Page Header */}
        <div className="mb-4 mb-md-5">
          <h1 className="h2 fw-bold mb-2">Upcoming Events</h1>
          <p className="text-muted">Discover exciting events happening on and around campus.</p>
        </div>

        {/* Search and Filters Card */}
        <Card className="shadow-sm mb-4 mb-md-5">
          <Card.Body className="p-4">
            <Row className="g-3 mb-3">
              <Col lg={7} xl={8}>
                <Form onSubmit={handleSearchSubmit}>
                  <InputGroup>
                    <InputGroup.Text><Search /></InputGroup.Text>
                    <Form.Control
                      type="search"
                      placeholder="Search events by name, host, or keyword..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                    <Button type="submit" variant="outline-secondary">Search</Button>
                  </InputGroup>
                </Form>
              </Col>
              <Col lg={5} xl={4} className="d-flex gap-2">
                <Button variant="outline-secondary" onClick={handleFilterClick} className="flex-shrink-0">
                  <Funnel className="me-1" />
                  {' '}
                  Filters
                </Button>
                <Dropdown onSelect={handleSortSelect} className="flex-grow-1">
                  <Dropdown.Toggle
                    variant="outline-secondary"
                    id="dropdown-sort"
                    className="w-100 d-flex justify-content-between align-items-center"
                  >
                    Sort:
                    {' '}
                    {sortBy}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    <Dropdown.Item eventKey="Date: Soonest">Sort: Date: Soonest</Dropdown.Item>
                    <Dropdown.Item eventKey="Date: Latest">Sort: Date: Latest</Dropdown.Item>
                    <Dropdown.Item eventKey="A-Z">Sort: A-Z</Dropdown.Item>
                    <Dropdown.Item eventKey="Z-A">Sort: Z-A</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>

            {/* Active Filters Display */}
            {activeFilters.length > 0 && (
              <div className="d-flex flex-wrap gap-2">
                <span className="text-muted small me-2 align-self-center">Active:</span>
                {activeFilters.map(filter => (
                  <Badge
                    key={filter}
                    pill
                    bg="info-subtle" // Using a different color for event filters
                    text="info-emphasis"
                    className="d-inline-flex align-items-center gap-1 py-1 px-2"
                  >
                    {filter}
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 lh-1 text-info-emphasis"
                      onClick={() => handleRemoveFilter(filter)}
                      aria-label={`Remove ${filter} filter`}
                    >
                      <X size={16} />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Results Count & View Toggle */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <p className="text-muted mb-0">
            Showing
            {' '}
            <span className="fw-medium">{events.length}</span>
            {' '}
            of
            {' '}
            <span className="fw-medium">{pagination.total}</span>
            {' '}
            events
          </p>
          <ButtonGroup size="sm">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'outline-secondary'}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid3x3GapFill />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'outline-secondary'}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <ListUl />
            </Button>
          </ButtonGroup>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert variant="danger" className="my-4">
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && events.length === 0 && (
          <Alert variant="info" className="my-4">
            <Alert.Heading>No Events Found</Alert.Heading>
            <p>There are no events matching your search criteria. Try adjusting your filters or search terms.</p>
          </Alert>
        )}

        {/* Events Grid/List */}
        {!isLoading && !error && events.length > 0 && (
          <Row className={`g-4 ${viewMode === 'list' ? 'row-cols-1' : 'row-cols-1 row-cols-md-2 row-cols-lg-3'}`}>
            {events.map(event => (
              <Col key={event.id}>
                <Card className="h-100 shadow-sm hover-lift">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Link href={`/events/${event.id}`} className="text-decoration-none text-dark stretched-link">
                        <Card.Title as="h6" className="mb-1 fw-semibold">{event.title}</Card.Title>
                      </Link>

                      <Button
                        variant="light"
                        size="sm"
                        className="p-1 ms-2 flex-shrink-0 position-relative z-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleSaveEvent(event.id);
                        }}
                        aria-label={`${favoriteEventIds.includes(event.id) ? 'Remove from favorites' : 'Add to favorites'}: ${event.title}`}
                      >
                        {favoriteEventIds.includes(event.id) ? <StarFill className="text-warning" /> : <Star />}
                      </Button>
                    </div>

                    {/* Grid View Specific Layout */}
                    {viewMode === 'grid' && (
                      <>
                        <Card.Text className="small text-muted flex-grow-1 mb-3">
                          {event.description ? (
                            <>
                              {event.description.substring(0, 80)}
                              {event.description.length > 80 ? '...' : ''}
                            </>
                          ) : (
                            <span className="fst-italic">No description provided</span>
                          )}
                        </Card.Text>
                        <div className="mt-auto">
                          <div className="d-flex align-items-center text-muted small mb-2">
                            <CalendarEvent size={12} className="me-1 flex-shrink-0" />
                            <span title={event.startDateTime}>
                              {formatEventDate(event)}
                            </span>
                          </div>
                          {event.location && (
                            <div className="d-flex align-items-center text-muted small mb-3">
                              <GeoAlt size={12} className="me-1 flex-shrink-0" />
                              <span className="text-truncate" title={event.location}>{event.location}</span>
                            </div>
                          )}
                          <div className="d-flex flex-wrap gap-1">
                            {event.categories.slice(0, 3).map(cat => (
                              <Badge key={cat.category.id} pill bg="light" text="dark" className="fw-normal">
                                {cat.category.name}
                              </Badge>
                            ))}
                            {event.categories.length > 3 && (
                              <Badge pill bg="light" text="dark" className="fw-normal">
                                +
                                {' '}
                                {event.categories.length - 3}
                                {' '}
                                more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* List View Specific Layout */}
                    {viewMode === 'list' && (
                      <div className="d-flex justify-content-between align-items-start mt-2">
                        <div className="flex-grow-1 me-3">
                          <p className="small text-muted mb-1">
                            {event.description ? (
                              <>
                                {event.description.substring(0, 120)}
                                {event.description.length > 120 ? '...' : ''}
                              </>
                            ) : (
                              <span className="fst-italic">No description provided</span>
                            )}
                          </p>
                          <div className="d-flex align-items-center text-muted small mb-1">
                            <CalendarEvent size={12} className="me-1 flex-shrink-0" />
                            <span>{formatEventDate(event)}</span>
                          </div>
                          {event.location && (
                            <div className="d-flex align-items-center text-muted small">
                              <GeoAlt size={12} className="me-1 flex-shrink-0" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-end flex-shrink-0" style={{ minWidth: '100px' }}>
                          <div className="d-flex flex-wrap gap-1 justify-content-end">
                            {event.categories.map(cat => (
                              <Badge key={cat.category.id} pill bg="light" text="dark" className="fw-normal">
                                {cat.category.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Pagination */}
        {!isLoading && !error && pagination.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-5">
          <Pagination size="sm">
            <Pagination.Prev
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} />
            </Pagination.Prev>
            {paginationItems}
            <Pagination.Next
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
            >
              <ChevronRight size={14} />
            </Pagination.Next>
          </Pagination>
        </div>
        )}
      </Container>

      {/* Optional: Add Footer if needed, or rely on global layout */}
      {/* <footer className="bg-dark text-white text-center py-3 mt-auto">...</footer> */}

    </div>
  );
}

// Add custom CSS for hover effect if needed (same as clubs example):
/*
.hover-lift {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.hover-lift:hover {
  transform: translateY(-3px);
  box-shadow: var(--bs-card-box-shadow), 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}
*/
