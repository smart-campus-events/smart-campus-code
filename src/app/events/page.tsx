'use client';

import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, InputGroup,
  Dropdown, Pagination, Breadcrumb, ButtonGroup,
} from 'react-bootstrap';
import {
  Search, Funnel, X, CalendarEvent, GeoAlt, // Changed Clock to CalendarEvent, Added GeoAlt
  Grid3x3GapFill, ListUl, ChevronLeft, ChevronRight, Star, // Added Star as an alternative bookmark icon
} from 'react-bootstrap-icons';
import Link from 'next/link';

// TODO: Replace hardcoded data with actual data fetching, filtering, sorting, pagination
// TODO: Implement filter modal/offcanvas functionality
// TODO: Implement search, sort, filter removal, view toggle, save event, pagination logic
// TODO: Use proper linking for event cards

const sampleEvents = [
  {
    id: 1,
    name: 'Spring Fling Music Fest',
    tags: ['Music', 'Social', 'Outdoor', 'Free'],
    description: 'Enjoy live bands, food trucks, and games on the main lawn. Kick off the semester!',
    dateTime: 'Apr 25, 2025 - 4:00 PM - 8:00 PM',
    location: 'Campus Center Lawn',
    slug: 'spring-fling-2025',
    imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/placeholder-event-1.png', // Example placeholder
    imageAlt: 'Students enjoying an outdoor music festival on a sunny day.',
  },
  {
    id: 2,
    name: 'Career Fair Prep Workshop',
    tags: ['Workshop', 'Career', 'Academic', 'Professional'],
    description: 'Get your resume reviewed and practice your elevator pitch before the big career fair.',
    dateTime: 'May 2, 2025 - 1:00 PM - 3:00 PM',
    location: 'QLC Room 412',
    slug: 'career-fair-prep-workshop',
    imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/placeholder-event-2.png', // Example placeholder
    imageAlt: 'Students sitting at tables working on resumes with a presenter.',
  },
  {
    id: 3,
    name: 'Guest Lecture: AI in Modern Art',
    tags: ['Lecture', 'Technology', 'Arts', 'Academic'],
    description: 'Visiting Professor Dr. Evelyn Reed discusses the impact of artificial intelligence '
      + 'on creative fields.',
    dateTime: 'May 5, 2025 - 6:00 PM - 7:30 PM',
    location: 'Art Building Auditorium',
    slug: 'guest-lecture-ai-art',
    imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/placeholder-event-3.png', // Example placeholder
    imageAlt: 'Lecture hall with a speaker presenting slides about AI and art.',
  },
  {
    id: 4,
    name: 'International Students Potluck',
    tags: ['Social', 'Cultural', 'Food', 'Community'],
    description: 'Share a dish from your home country and meet fellow international and local students.',
    dateTime: 'May 10, 2025 - 5:30 PM onwards',
    location: 'Hemenway Hall Courtyard',
    slug: 'international-potluck-spring',
  },
  {
    id: 5,
    name: 'Beach Cleanup Day',
    tags: ['Volunteer', 'Environment', 'Community', 'Outdoor'],
    description: 'Join the Environmental Warriors club to help keep our nearby beaches clean.',
    dateTime: 'May 12, 2025 - 9:00 AM - 12:00 PM',
    location: 'Meet at Kapiolani Park Beach Center',
    slug: 'beach-cleanup-may',
  },
  {
    id: 6,
    name: 'End-of-Semester Board Game Night',
    tags: ['Social', 'Games', 'Entertainment', 'Indoor'],
    description: 'De-stress before finals with board games, card games, and good company.',
    dateTime: 'May 15, 2025 - 7:00 PM - 10:00 PM',
    location: 'Campus Center Ballroom',
    slug: 'board-game-night-finals',
  },
];

const initialActiveFilters = ['Social', 'Free']; // Example event filters
const totalEvents = 58; // Example total count
const eventsPerPage = 6; // Example items per page

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState(initialActiveFilters);
  const [sortBy, setSortBy] = useState('Date: Soonest'); // Default sort for events
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);

  // Placeholder logic - replace with actual data fetching and filtering
  const filteredEvents = sampleEvents;
  const totalPages = Math.ceil(totalEvents / eventsPerPage);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // TODO: Implement search logic (likely debounced)
  };

  const handleFilterClick = () => {
    // TODO: Open filter modal/offcanvas
    console.log('Filter button clicked');
  };

  const handleSortSelect = (eventKey: string | null) => {
    if (eventKey) {
      setSortBy(eventKey);
      // TODO: Implement sorting logic
    }
  };

  const handleRemoveFilter = (filterToRemove: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filterToRemove));
    // TODO: Refetch/filter data based on new filters
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // TODO: Fetch data for the new page
  };

  const handleSaveEvent = (eventId: number) => {
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
          </Card.Body>
        </Card>

        {/* Results Count & View Toggle */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <p className="text-muted mb-0">
            Showing
            {' '}
            <span className="fw-medium">{filteredEvents.length}</span>
            {' '}
            of
            {' '}
            <span className="fw-medium">{totalEvents}</span>
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

        {/* Events Grid/List */}
        <Row className={`g-4 ${viewMode === 'list' ? 'row-cols-1' : 'row-cols-1 row-cols-md-2 row-cols-lg-3'}`}>
          {filteredEvents.map(event => (
            <Col key={event.id}>
              {/* TODO: Link entire card to event details page */}
              <Card className="h-100 shadow-sm hover-lift">
                {/* Optional Image Header for Grid View */}
                {viewMode === 'grid' && event.imageUrl && (
                  <Card.Img
                    variant="top"
                    src={event.imageUrl}
                    alt={event.imageAlt
                     || `Image for ${event.name}`}
                    style={{ height: '180px', objectFit: 'cover' }}
                  />
                )}
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Link href={`/event/${event.slug}`} passHref legacyBehavior>
                      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                      <a className="text-decoration-none text-dark stretched-link">
                        <Card.Title as="h6" className="mb-1 fw-semibold">{event.name}</Card.Title>
                      </a>
                    </Link>
                    {/* Using Star icon for saving events */}
                    <Button
                      variant="light"
                      size="sm"
                      className="p-1 ms-2 flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleSaveEvent(event.id); }}
                      aria-label={`Save ${event.name}`}
                    >
                      <Star />
                      {/* Or use Bookmark: <Bookmark /> */}
                    </Button>
                  </div>

                  {/* Grid View Specific Layout */}
                  {viewMode === 'grid' && (
                    <>
                      <Card.Text className="small text-muted flex-grow-1 mb-3">
                        {event.description.substring(0, 80)}
                        {event.description.length > 80 ? '...' : ''}
                      </Card.Text>
                      <div className="mt-auto">
                        <div className="d-flex align-items-center text-muted small mb-2">
                          <CalendarEvent size={12} className="me-1 flex-shrink-0" />
                          <span title={event.dateTime}>
                            {event.dateTime.split('-')[0].trim()}
                            {' '}
                            {/* Show only date part for brevity */}
                          </span>
                        </div>
                        <div className="d-flex align-items-center text-muted small mb-3">
                          <GeoAlt size={12} className="me-1 flex-shrink-0" />
                          <span className="text-truncate" title={event.location}>{event.location}</span>
                        </div>
                        <div className="d-flex flex-wrap gap-1">
                          {event.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} pill bg="light" text="dark" className="fw-normal">
                              {tag}
                            </Badge>
                          ))}
                          {event.tags.length > 3 && (
                            <Badge pill bg="light" text="dark" className="fw-normal">
                              +
                              {' '}
                              {event.tags.length - 3}
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
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      {/* Optional Thumbnail for List View */}
                      {event.imageUrl && (
                      <img
                        src={event.imageUrl}
                        alt={event.imageAlt || ''}
                        style={{ width: '100px',
                          height: '70px',
                          objectFit: 'cover',
                          borderRadius: 'var(--bs-border-radius)',
                          marginRight: '1rem' }}
                      />
                      )}
                      <div className="flex-grow-1 me-3">
                        <p className="small text-muted mb-1">
                          {event.description.substring(0, 120)}
                          {event.description.length > 120 ? '...' : ''}
                        </p>
                        <div className="d-flex align-items-center text-muted small mb-1">
                          <CalendarEvent size={12} className="me-1 flex-shrink-0" />
                          <span>{event.dateTime}</span>
                        </div>
                        <div className="d-flex align-items-center text-muted small">
                          <GeoAlt size={12} className="me-1 flex-shrink-0" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <div className="text-end flex-shrink-0" style={{ minWidth: '100px' }}>
                        {' '}
                        {/* Ensure tags don't get too squished */}

                        <div className="d-flex flex-wrap gap-1 justify-content-end">
                          {event.tags.map(tag => (
                            <Badge key={tag} pill bg="light" text="dark" className="fw-normal">
                              {tag}
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

        {/* Pagination */}
        {totalPages > 1 && (
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
