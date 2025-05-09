'use client';

/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-nested-ternary */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, InputGroup,
  Dropdown, Pagination, Breadcrumb, ButtonGroup, Spinner, Alert,
} from 'react-bootstrap';
import {
  Search, X, Bookmark, BookmarkFill, GeoAlt, Grid3x3GapFill, ListUl,
  ChevronLeft, ChevronRight, Calendar2Event, Globe,
} from 'react-bootstrap-icons';
import Link from 'next/link';
import debounce from 'lodash/debounce';
import CategoryFilter from '@/components/filters/CategoryFilter';
import EventTypeFilter from '@/components/filters/EventTypeFilter';
import { format } from 'date-fns';

// Define the Event type based on expected API response
interface Category {
  id: string;
  name: string;
}

interface EventCategory {
  category: Category;
}

interface Club {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  startDateTime: string;
  endDateTime: string | null;
  location: string | null;
  locationVirtualUrl: string | null;
  attendanceType: 'IN_PERSON' | 'ONLINE' | 'HYBRID';
  organizerSponsor: string | null;
  organizerClub: Club | null;
  categories: EventCategory[];
  eventUrl: string | null;
  eventPageUrl: string | null;
  _count: {
    rsvps: number;
  };
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface for the API-returned category with count
interface CategoryWithCount extends Category {
  count: number;
}

const EVENTS_PER_PAGE = 30;

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>([]);
  const [activeFilterNames, setActiveFilterNames] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('date-asc');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [favoriteEventIds, setFavoriteEventIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [attendanceType, setAttendanceType] = useState<string | null>(null);

  // Fetch categories for the filter
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Create a stable fetch function
  const fetchEventsData = useCallback(async (
    page = 1,
    search = '',
    sort = 'date-asc',
    categoryIds: string[] = [],
    pastEvents = false,
    eventType: string | null = null,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      // Build URL with multiple category parameters if needed
      let url = `/api/events?page=${page}&limit=${EVENTS_PER_PAGE}&q=${search}&sort=${sort}&pastEvents=${pastEvents}`;

      // Add category filters
      categoryIds.forEach(id => {
        url += `&category=${id}`;
      });

      // Add attendance type filter if selected
      if (eventType) {
        url += `&attendanceType=${eventType}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEvents(data.events);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      setError(err.message || 'Failed to load events. Please try refreshing.');
      setEvents([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user's favorite events
  const fetchFavoriteEvents = useCallback(async () => {
    try {
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

  // Function that uses the current sortBy and filter values
  const fetchEvents = useCallback((page: number, search: string) => {
    fetchEventsData(page, search, sortBy, activeFilterIds, showPastEvents, attendanceType);
  }, [fetchEventsData, sortBy, activeFilterIds, showPastEvents, attendanceType]);

  // Create a debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((searchText: string, fetchFn: (page: number, search: string) => void) => {
      setCurrentPage(1);
      fetchFn(1, searchText);
    }, 500),
    [],
  );

  // Cleanup the debounced function on component unmount
  useEffect(() => () => {
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Initial fetch when component mounts or page/sortBy/filters changes
  useEffect(() => {
    fetchEvents(currentPage, searchTerm);
  }, [currentPage, fetchEvents, searchTerm, activeFilterIds, showPastEvents, attendanceType]);

  // Fetch user's favorite events and categories when component mounts
  useEffect(() => {
    fetchFavoriteEvents();
    fetchCategories();
  }, [fetchFavoriteEvents, fetchCategories]);

  // Filter Event Handlers
  const handleCategoryFiltersChange = (selectedCategoryIds: string[]) => {
    setActiveFilterIds(selectedCategoryIds);

    const selectedNames = selectedCategoryIds.map(id => {
      const category = categories.find(c => c.id === id);
      return category ? category.name : '';
    }).filter(Boolean);

    setActiveFilterNames(selectedNames);
    setCurrentPage(1);
  };

  const handleRemoveFilter = (filterNameToRemove: string) => {
    const category = categories.find(c => c.name === filterNameToRemove);
    if (!category) return;

    const updatedFilterIds = activeFilterIds.filter(id => id !== category.id);
    setActiveFilterIds(updatedFilterIds);

    setActiveFilterNames(activeFilterNames.filter(name => name !== filterNameToRemove));
    setCurrentPage(1);
  };

  // Event Type Filter Handler
  const handleEventTypeChange = (type: string | null) => {
    setAttendanceType(type);
    setCurrentPage(1);
  };

  // Past/Upcoming Events Toggle Handler
  const handleTimeframeToggle = (isPast: boolean) => {
    setShowPastEvents(isPast);
    setCurrentPage(1);
  };

  // Search Event Handler
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    debouncedSearch(newSearchTerm, fetchEvents);
  };

  const handleSortSelect = (eventKey: string | null) => {
    if (eventKey && eventKey !== sortBy) {
      setSortBy(eventKey);
      setCurrentPage(1);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber !== currentPage) {
      setCurrentPage(pageNumber);
    }
  };

  const handleBookmark = async (eventId: string) => {
    try {
      const isCurrentlyFavorited = favoriteEventIds.includes(eventId);

      let updatedFavorites;
      if (isCurrentlyFavorited) {
        updatedFavorites = favoriteEventIds.filter(id => id !== eventId);
      } else {
        updatedFavorites = [...favoriteEventIds, eventId];
      }

      setFavoriteEventIds(updatedFavorites);

      if (typeof window !== 'undefined') {
        localStorage.setItem('favoriteEvents', JSON.stringify(updatedFavorites));
      }

      // If you have an API for favorite events, uncomment this section
      /*
      const method = isCurrentlyFavorited ? 'DELETE' : 'POST';
      await fetch(`/api/events/${eventId}/favorite`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      */
    } catch (err: any) {
      console.error('Error bookmarking event:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Format event dates for display
  const formatEventDate = (event: Event) => {
    try {
      // Use this to display in Hawaii time
      const options = { timeZone: 'Pacific/Honolulu' };

      const start = new Date(event.startDateTime);

      // Create formatter for Hawaii time
      const formatInHST = (date: Date, pattern: string) => {
        // Convert to Hawaii time string
        const dateInHST = new Date(date.toLocaleString('en-US', options));
        // Format using the pattern
        return format(dateInHST, pattern);
      };

      // Check if time is midnight (likely a default/placeholder)
      const hawaiiStart = new Date(start.toLocaleString('en-US', options));
      const isMidnight = hawaiiStart.getHours() === 0 && hawaiiStart.getMinutes() === 0;

      // If midnight, only show the date
      if (isMidnight) {
        return formatInHST(start, 'MMM d, yyyy');
      }

      // Just show the date and start time, no end time (matching UH Manoa calendar style)
      return formatInHST(start, 'MMM d, yyyy - h:mm a');
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Date information unavailable';
    }
  };

  // Get icon for event type
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'ONLINE':
        return <Globe className="me-1" />;
      case 'HYBRID':
        return (
          <>
            <GeoAlt className="me-1" />
            <Globe className="ms-1 me-1" />
          </>
        );
      case 'IN_PERSON':
      default:
        return <GeoAlt className="me-1" />;
    }
  };

  // Pagination Rendering
  const renderPaginationItems = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const items = [];
    const { totalPages } = pagination;
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow + 2) {
      for (let number = 1; number <= totalPages; number++) {
        items.push(
          <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
            {number}
          </Pagination.Item>,
        );
      }
    } else {
      items.push(
        <Pagination.Item
          key={1}
          active={currentPage === 1}
          onClick={() => handlePageChange(1)}
        >
          {1}
        </Pagination.Item>,
      );

      const startEllipsisNeeded = currentPage > maxPagesToShow - 1;
      const endEllipsisNeeded = currentPage < totalPages - (maxPagesToShow - 2);

      if (startEllipsisNeeded) {
        items.push(<Pagination.Ellipsis key="ell-start" disabled />);
      }

      let startPage = Math.max(2, currentPage - Math.floor((maxPagesToShow - 2) / 2));
      let endPage = Math.min(totalPages - 1, currentPage + Math.ceil((maxPagesToShow - 2) / 2));

      if (currentPage < maxPagesToShow - 1) {
        endPage = maxPagesToShow - 1;
      }
      if (currentPage > totalPages - (maxPagesToShow - 2)) {
        startPage = totalPages - (maxPagesToShow - 2);
      }

      for (let number = startPage; number <= endPage; number++) {
        items.push(
          <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
            {number}
          </Pagination.Item>,
        );
      }

      if (endEllipsisNeeded) {
        items.push(<Pagination.Ellipsis key="ell-end" disabled />);
      }

      items.push(
        <Pagination.Item
          key={totalPages}
          active={currentPage === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>,
      );
    }
    return items;
  };

  // Results Count Renderer
  const renderResultsCount = () => {
    if (!pagination) return null;

    const { total, page, limit } = pagination;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    if (total === 0) {
      return 'No results found';
    }
    if (end === 1) {
      return '1 result';
    }
    return `Showing ${start}–${end} of ${total} events`;
  };

  // Main Render
  return (
    <div className="bg-light py-5 min-vh-100">
      <Container>
        {/* Page Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">Browse Events</h1>
            <Breadcrumb className="mb-0">
              <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
              <Breadcrumb.Item active>Events</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <ButtonGroup className="me-2">
              <Button
                variant={!showPastEvents ? 'primary' : 'outline-primary'}
                onClick={() => handleTimeframeToggle(false)}
              >
                Upcoming
              </Button>
              <Button
                variant={showPastEvents ? 'primary' : 'outline-primary'}
                onClick={() => handleTimeframeToggle(true)}
              >
                Past
              </Button>
            </ButtonGroup>
            <ButtonGroup>
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline-primary'}
                onClick={() => setViewMode('grid')}
                aria-label="Grid View"
              >
                <Grid3x3GapFill size={18} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
                onClick={() => setViewMode('list')}
                aria-label="List View"
              >
                <ListUl size={18} />
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Row className="g-3 align-items-center">
              <Col md={5}>
                <InputGroup>
                  <InputGroup.Text><Search /></InputGroup.Text>
                  <Form.Control
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  {searchTerm && (
                    <Button
                      variant="light"
                      onClick={() => { setSearchTerm(''); fetchEvents(1, ''); }}
                    >
                      <X />
                    </Button>
                  )}
                </InputGroup>
              </Col>
              <Col md={3}>
                <CategoryFilter
                  onApplyFilters={handleCategoryFiltersChange}
                  activeFilters={activeFilterIds}
                  context="events"
                />
              </Col>
              <Col md={2}>
                <EventTypeFilter
                  onTypeChange={handleEventTypeChange}
                  activeType={attendanceType}
                />
              </Col>
              <Col md={2}>
                <Dropdown onSelect={handleSortSelect}>
                  <Dropdown.Toggle variant="light" className="w-100 text-start" id="sort-dropdown">
                    Sort:
                    {' '}
                    {sortBy === 'date-asc' ? 'Date: Soonest'
                      : sortBy === 'date-desc' ? 'Date: Latest'
                        : sortBy === 'title-asc' ? 'Title: A-Z'
                          : 'Title: Z-A'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="date-asc" active={sortBy === 'date-asc'}>Date: Soonest</Dropdown.Item>
                    <Dropdown.Item eventKey="date-desc" active={sortBy === 'date-desc'}>Date: Latest</Dropdown.Item>
                    <Dropdown.Item eventKey="title-asc" active={sortBy === 'title-asc'}>Title: A-Z</Dropdown.Item>
                    <Dropdown.Item eventKey="title-desc" active={sortBy === 'title-desc'}>Title: Z-A</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Active Filter Pills (if any) */}
        {activeFilterNames.length > 0 && (
          <div className="mb-4 d-flex flex-wrap gap-2">
            {activeFilterNames.map(filter => (
              <Badge
                key={filter}
                pill
                bg="light"
                text="dark"
                className="py-2 px-3 d-flex align-items-center"
              >
                {filter}
                <Button
                  variant="link"
                  className="p-0 ms-2 text-danger"
                  onClick={() => handleRemoveFilter(filter)}
                  aria-label={`Remove ${filter} filter`}
                >
                  <X size={14} />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Results Count */}
        <p className="text-muted small mb-4">
          {renderResultsCount()}
        </p>

        {/* Loading/Error States */}
        {isLoading && (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2 text-muted">Loading events...</p>
          </div>
        )}
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}

        {/* Events Grid/List */}
        {!isLoading && !error && events.length === 0 && (
        <Col xs={12}>
          <Alert variant="info">No events match the current criteria.</Alert>
        </Col>
        )}
        {!isLoading && !error && events.length > 0 && (
          <Row className={`g-4 ${viewMode === 'list' ? 'row-cols-1' : 'row-cols-1 row-cols-md-2 row-cols-lg-3'}`}>
            {events.map(event => (
              <Col key={event.id}>
                <Card className="h-100 shadow-sm hover-lift">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Link
                        href={`/events/${event.id}`}
                        passHref
                        className="text-decoration-none text-dark stretched-link"
                      >
                        <Card.Title as="h6" className="mb-1 fw-semibold">{event.title}</Card.Title>
                      </Link>
                      <Button
                        variant="light"
                        size="sm"
                        className="p-1 ms-2 flex-shrink-0 position-relative z-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleBookmark(event.id);
                        }}
                        aria-label={
                          `${favoriteEventIds.includes(event.id)
                            ? 'Remove from favorites'
                            : 'Add to favorites'}: ${event.title}`
                        }
                      >
                        {favoriteEventIds.includes(event.id) ? <BookmarkFill className="text-primary" /> : <Bookmark />}
                      </Button>
                    </div>

                    {viewMode === 'grid' && (
                      <>
                        <div className="d-flex align-items-center text-muted small mb-2">
                          <Calendar2Event size={12} className="me-1" />
                          <span>{formatEventDate(event)}</span>
                        </div>
                        {event.location && (
                          <div className="d-flex align-items-center text-muted small mb-2">
                            {getEventTypeIcon(event.attendanceType)}
                            <span>{event.attendanceType === 'ONLINE' ? 'Online Event' : event.location}</span>
                          </div>
                        )}
                        <Card.Text className="small text-muted flex-grow-1 mb-3">
                          {event.description ? (
                            <>
                              {event.description.substring(0, 100)}
                              {event.description.length > 100 ? '...' : ''}
                            </>
                          ) : (
                            <span className="text-muted fst-italic">No description available</span>
                          )}
                        </Card.Text>
                        <div className="mt-auto">
                          {event.organizerSponsor && (
                          <div className="d-flex align-items-center text-muted small mb-2">
                            <span>
                              Organized by:
                              {event.organizerClub ? event.organizerClub.name : event.organizerSponsor}
                            </span>
                          </div>
                          )}
                          <div className="d-flex flex-wrap gap-1">
                            {event.categories.slice(0, 3).map(ec => (
                              <Badge key={ec.category.id} pill bg="light" text="dark" className="fw-normal">
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
                          {event.eventUrl && (
                            <div className="mt-2">
                              <a
                                href={event.eventUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline-secondary btn-sm position-relative z-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Globe size={12} className="me-1" />
                                Original Event
                              </a>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {viewMode === 'list' && (
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="me-3">
                          <div className="d-flex align-items-center text-muted small mb-2">
                            <Calendar2Event size={12} className="me-1" />
                            <span>{formatEventDate(event)}</span>
                          </div>
                          {event.location && (
                            <div className="d-flex align-items-center text-muted small mb-2">
                              {getEventTypeIcon(event.attendanceType)}
                              <span>{event.attendanceType === 'ONLINE' ? 'Online Event' : event.location}</span>
                            </div>
                          )}
                          <p className="small text-muted mb-0">
                            {event.description ? (
                              <>
                                {event.description.substring(0, 150)}
                                {event.description.length > 150 ? '...' : ''}
                              </>
                            ) : (
                              <span className="text-muted fst-italic">No description available</span>
                            )}
                          </p>
                        </div>
                        <div className="text-end flex-shrink-0">
                          {event.organizerSponsor && (
                            <div className="text-muted small mb-2">
                              <span>
                                By:
                                {event.organizerClub ? event.organizerClub.name : event.organizerSponsor}
                              </span>
                            </div>
                          )}
                          <div className="d-flex flex-wrap gap-1 justify-content-end">
                            {event.categories.map(ec => (
                              <Badge key={ec.category.id} pill bg="light" text="dark" className="fw-normal">
                                {ec.category.name}
                              </Badge>
                            ))}
                          </div>
                          {event.eventUrl && (
                            <div className="mt-2">
                              <a
                                href={event.eventUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline-secondary btn-sm position-relative z-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Globe size={12} className="me-1" />
                                Original Event
                              </a>
                            </div>
                          )}
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
        {pagination && pagination.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-5">
          <Pagination size="sm">
            <Pagination.Prev
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} />
            </Pagination.Prev>
            {renderPaginationItems()}
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
    </div>
  );
}
