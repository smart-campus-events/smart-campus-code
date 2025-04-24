'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, InputGroup,
  Dropdown, Pagination, Breadcrumb, ButtonGroup,
} from 'react-bootstrap';
import {
  Search, Funnel, X, CalendarEvent, GeoAlt,
  Grid3x3GapFill, ListUl, ChevronLeft, ChevronRight, Star,
} from 'react-bootstrap-icons';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

interface EventCategory {
  eventId: string;
  categoryId: string;
  category: Category;
}

interface Club {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  startDateTime: string;
  endDateTime: string | null;
  location: string | null;
  status: string;
  categories: EventCategory[];
  organizerClub: Club | null;
}

// TODO: Replace hardcoded data with actual data fetching, filtering, sorting, pagination
// TODO: Implement filter modal/offcanvas functionality
// TODO: Implement search, sort, filter removal, view toggle, save event, pagination logic
// TODO: Use proper linking for event cards

// Initial data for state management
const eventsPerPage = 6; // Example items per page

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('Date: Soonest'); // Default sort for events
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch events from API
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        // Use status=all to show both approved and pending events
        const response = await fetch('/api/events?status=all');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data);
        setLoading(false);
      } catch (err) {
        setError('Error loading events. Please try again later.');
        setLoading(false);
        console.error('Error fetching events:', err);
      }
    }

    fetchEvents();
  }, []);

  // Get all unique category names from events
  const allCategories = events
    .flatMap(event => event.categories.map(ec => ec.category.name))
    .filter((value, index, self) => self.indexOf(value) === index);

  // Filtered events based on search and active filters
  const filteredEvents = events.filter(event => {
    // Search filter
    const matchesSearch = searchTerm === ''
      || event.title.toLowerCase().includes(searchTerm.toLowerCase())
      || (event.description
        && event.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Category filters
    const matchesFilters = activeFilters.length === 0
      || event.categories.some(ec => activeFilters.includes(ec.category.name));

    return matchesSearch && matchesFilters;
  });

  // Sort events based on the selected sort option
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'Date: Soonest':
        return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
      case 'Date: Latest':
        return new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime();
      case 'A-Z':
        return a.title.localeCompare(b.title);
      case 'Relevance':
        // For relevance sorting, if search term exists, prioritize items with title matches
        // Otherwise, fall back to date sorting
        if (searchTerm) {
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();
          const searchTermLower = searchTerm.toLowerCase();

          // If one title contains the search term and the other doesn't, prioritize the one that does
          const aContains = aTitle.includes(searchTermLower);
          const bContains = bTitle.includes(searchTermLower);

          if (aContains && !bContains) return -1;
          if (!aContains && bContains) return 1;

          // If both or neither contain the search term, sort alphabetically
          return aTitle.localeCompare(bTitle);
        }
        // Default to date sorting if no search term
        return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);

  // Paginated events
  const paginatedEvents = sortedEvents.slice(
    (currentPage - 1) * eventsPerPage,
    currentPage * eventsPerPage,
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleFilterClick = () => {
    // TODO: Implement filter modal/offcanvas
    console.log('Filter button clicked');
  };

  const handleSortSelect = (eventKey: string | null) => {
    if (eventKey) {
      setSortBy(eventKey);
    }
  };

  const handleRemoveFilter = (filterToRemove: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filterToRemove));
  };

  const handleAddFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };

  const handleSaveEvent = (eventId: string) => {
    // TODO: Implement saving/bookmarking logic for events
    console.log(`Save event clicked for event ${eventId}`);
  };

  // TODO: Implement actual pagination item generation
  const paginationItems = [];
  if (totalPages <= 5) {
    for (let number = 1; number <= totalPages; number++) {
      paginationItems.push(
        <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
          {number}
        </Pagination.Item>,
      );
    }
  } else {
    // Basic ellipsis logic (same as clubs example)
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
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 3) endPage = 3;
    if (currentPage >= totalPages - 2) startPage = totalPages - 2;

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
    if (currentPage < totalPages - 2) paginationItems.push(<Pagination.Ellipsis key="ell-end" disabled />);
    paginationItems.push(
      <Pagination.Item
        key={totalPages}
        active={totalPages === currentPage}
        onClick={() => handlePageChange(totalPages)}
      >
        {totalPages}
      </Pagination.Item>,
    );
  }

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
                <InputGroup>
                  <InputGroup.Text><Search /></InputGroup.Text>
                  <Form.Control
                    type="search"
                    placeholder="Search events by name, host, or keyword..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </InputGroup>
              </Col>
              <Col lg={5} xl={4} className="d-flex gap-2">
                <Button variant="outline-secondary" onClick={handleFilterClick} className="flex-shrink-0">
                  <Funnel className="me-1" />
                  Filters
                </Button>
                <Dropdown onSelect={handleSortSelect} className="flex-grow-1">
                  <Dropdown.Toggle
                    variant="outline-secondary"
                    id="dropdown-sort"
                    className="w-100 d-flex justify-content-between align-items-center"
                  >
                    Sort:
                    {sortBy}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    <Dropdown.Item eventKey="Date: Soonest">Sort: Date: Soonest</Dropdown.Item>
                    <Dropdown.Item eventKey="Date: Latest">Sort: Date: Latest</Dropdown.Item>
                    <Dropdown.Item eventKey="A-Z">Sort: A-Z</Dropdown.Item>
                    <Dropdown.Item eventKey="Relevance">Sort: Relevance</Dropdown.Item>
                    {/* Add other sort options if needed */}
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

            {/* Available Categories */}
            <div className="mt-3">
              <span className="text-muted small me-2">Categories:</span>
              <div className="d-flex flex-wrap gap-2 mt-1">
                {allCategories.map(category => (
                  <Badge
                    key={category}
                    pill
                    bg={activeFilters.includes(category) ? 'info' : 'light'}
                    text={activeFilters.includes(category) ? 'white' : 'dark'}
                    className="d-inline-flex align-items-center py-1 px-2 cursor-pointer"
                    onClick={() => (
                      activeFilters.includes(category)
                        ? handleRemoveFilter(category)
                        : handleAddFilter(category)
                    )}
                    style={{ cursor: 'pointer' }}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading events...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger my-5" role="alert">
            {error}
          </div>
        )}

        {/* Results Count & View Toggle */}
        {!loading && !error && (
          <div className="d-flex justify-content-between align-items-center mb-4">
            <p className="text-muted mb-0">
              Showing
              {' '}
              <span className="fw-medium">{paginatedEvents.length}</span>
              {' '}
              of
              {' '}
              <span className="fw-medium">{sortedEvents.length}</span>
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
        )}

        {/* No Results Message */}
        {!loading && !error && sortedEvents.length === 0 && (
          <div className="text-center my-5">
            <p className="text-muted">No events found matching your criteria.</p>
          </div>
        )}

        {/* Events Grid/List */}
        {!loading && !error && sortedEvents.length > 0 && (
          <Row className={`g-4 ${viewMode === 'list' ? 'row-cols-1' : 'row-cols-1 row-cols-md-2 row-cols-lg-3'}`}>
            {paginatedEvents.map(event => (
              <Col key={event.id}>
                {/* TODO: Link entire card to event details page */}
                <Card className="h-100 shadow-sm hover-lift">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Link href={`/event/${event.id}`} passHref legacyBehavior>
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a className="text-decoration-none text-dark stretched-link">
                          <Card.Title as="h6" className="mb-1 fw-semibold">{event.title}</Card.Title>
                        </a>
                      </Link>
                      {/* Using Star icon for saving events */}
                      <Button
                        variant="light"
                        size="sm"
                        className="p-1 ms-2 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleSaveEvent(event.id); }}
                        aria-label={`Save ${event.title}`}
                      >
                        <Star />
                      </Button>
                    </div>

                    {/* Grid View Specific Layout */}
                    {viewMode === 'grid' && (
                      <>
                        <Card.Text className="small text-muted flex-grow-1 mb-3">
                          {event.description
                            ? (event.description.substring(0, 80) + (event.description.length > 80 ? '...' : ''))
                            : 'No description available'}
                        </Card.Text>
                        <div className="mt-auto">
                          <div className="d-flex align-items-center text-muted small mb-2">
                            <CalendarEvent size={12} className="me-1 flex-shrink-0" />
                            <span title={new Date(event.startDateTime).toLocaleString()}>
                              {new Date(event.startDateTime).toLocaleDateString()}
                              {' '}
                              {new Date(event.startDateTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="d-flex align-items-center text-muted small mb-3">
                            <GeoAlt size={12} className="me-1 flex-shrink-0" />
                            <span className="text-truncate" title={event.location || 'No location specified'}>
                              {event.location || 'No location specified'}
                            </span>
                          </div>
                          <div className="d-flex flex-wrap gap-1">
                            {event.categories.slice(0, 3).map(ec => (
                              <Badge key={ec.categoryId} pill bg="light" text="dark" className="fw-normal">
                                {ec.category.name}
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
                          {event.organizerClub && (
                            <div className="mt-2 small text-muted">
                              Organized by:
                              {' '}
                              {event.organizerClub.name}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* List View Specific Layout */}
                    {viewMode === 'list' && (
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="flex-grow-1 me-3">
                          <p className="small text-muted mb-1">
                            {event.description
                              ? (event.description.substring(0, 120) + (event.description.length > 120 ? '...' : ''))
                              : 'No description available'}
                          </p>
                          <div className="d-flex align-items-center text-muted small mb-1">
                            <CalendarEvent size={12} className="me-1 flex-shrink-0" />
                            <span>{new Date(event.startDateTime).toLocaleString()}</span>
                          </div>
                          <div className="d-flex align-items-center text-muted small">
                            <GeoAlt size={12} className="me-1 flex-shrink-0" />
                            <span>{event.location || 'No location specified'}</span>
                          </div>
                          {event.organizerClub && (
                            <div className="mt-1 small text-muted">
                              Organized by:
                              {' '}
                              {event.organizerClub.name}
                            </div>
                          )}
                        </div>
                        <div className="text-end flex-shrink-0" style={{ minWidth: '100px' }}>
                          <div className="d-flex flex-wrap gap-1 justify-content-end">
                            {event.categories.map(ec => (
                              <Badge key={ec.categoryId} pill bg="light" text="dark" className="fw-normal">
                                {ec.category.name}
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
        {!loading && !error && totalPages > 1 && (
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
                disabled={currentPage === totalPages}
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
