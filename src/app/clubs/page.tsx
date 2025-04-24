'use client';

/* eslint-disable max-len */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, InputGroup,
  Dropdown, Pagination, Breadcrumb, ButtonGroup, Spinner, Alert,
} from 'react-bootstrap';
import {
  Search, Funnel, X, Bookmark, Clock, Grid3x3GapFill, ListUl,
  ChevronLeft, ChevronRight,
} from 'react-bootstrap-icons';
import Link from 'next/link';
import debounce from 'lodash/debounce';

// Define the Club type based on expected API response (adjust as needed)
// This should ideally align with Prisma types, possibly using Prisma.ClubGetPayload
interface Category {
  id: string;
  name: string;
}

interface ClubCategory {
  category: Category;
}

interface Club {
  id: string;
  name: string;
  purpose: string;
  meetingTime: string | null;
  meetingLocation: string | null;
  logoUrl: string | null;
  categories: ClubCategory[]; // Updated to match include
  _count: {
    favoritedBy: number;
    hostedEvents: number;
  };
  // Add slug if available/needed, or generate dynamically
  // slug: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CLUBS_PER_PAGE = 9; // Adjust as needed

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]); // Store category IDs or names
  const [sortBy, setSortBy] = useState('A-Z'); // Add more sort options later
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);

  // --- Data Fetching ---
  // Step 1: Create a stable fetch function that doesn't recreate with sortBy changes
  const fetchClubsData = useCallback(async (page = 1, search = '', sort = 'A-Z') => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: CLUBS_PER_PAGE.toString(),
        q: search,
        // Add sort param directly
        ...(sort && { sort }),
      });

      const response = await fetch(`/api/clubs?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setClubs(data.clubs);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Failed to fetch clubs:', err);
      setError(err.message || 'Failed to load clubs. Please try refreshing.');
      setClubs([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies - this function never changes

  // Step 2: Create a function that uses the current sortBy value
  const fetchClubs = useCallback((page: number, search: string) => {
    fetchClubsData(page, search, sortBy);
  }, [fetchClubsData, sortBy]);

  // Step 3: Create a debounced search handler using useMemo (created only once)
  const debouncedSearch = useMemo(
    () => debounce((searchText: string, fetchFn: (page: number, search: string) => void) => {
      setCurrentPage(1);
      fetchFn(1, searchText);
    }, 500),
    [],
  );

  // Step 4: Cleanup the debounced function on component unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Initial fetch when component mounts or page/sortBy changes
  useEffect(() => {
    fetchClubs(currentPage, searchTerm);
  }, [currentPage, fetchClubs]); // fetchClubs already depends on sortBy

  // --- Event Handlers ---
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    debouncedSearch(newSearchTerm, fetchClubs);
  };

  const handleFilterClick = () => {
    // TODO: Implement filter modal/offcanvas
    console.log('Filter button clicked - Not implemented');
    // When filters change, reset page and call fetchClubs
    // setCurrentPage(1);
    // fetchClubs(1, searchTerm, newFilters);
  };

  const handleSortSelect = (eventKey: string | null) => {
    if (eventKey && eventKey !== sortBy) {
      setSortBy(eventKey);
      setCurrentPage(1); // Reset page on sort change
      // fetchClubs will be called by the useEffect due to sortBy dependency
    }
  };

  const handleRemoveFilter = (filterToRemove: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filterToRemove));
    // TODO: Refetch/filter data based on new filters
    setCurrentPage(1);
    // fetchClubs(1, searchTerm, updatedFilters);
    console.log('Remove filter - Not fully implemented');
  };

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber !== currentPage) {
      setCurrentPage(pageNumber);
      // Fetching is handled by the useEffect dependency on currentPage
    }
  };

  const handleBookmark = (clubId: string) => {
    // TODO: Implement bookmarking logic (API call)
    console.log(`Bookmark clicked for club ${clubId} - Not implemented`);
  };

  // --- Pagination Rendering ---
  const renderPaginationItems = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const items = [];
    const { totalPages } = pagination;
    const maxPagesToShow = 5; // Adjust number of page links shown

    if (totalPages <= maxPagesToShow + 2) { // Show all pages if not too many
      for (let number = 1; number <= totalPages; number++) {
        items.push(
          <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
            {number}
          </Pagination.Item>,
        );
      }
    } else {
      // Logic for showing ellipsis
      items.push(<Pagination.Item key={1} active={currentPage === 1} onClick={() => handlePageChange(1)}>{1}</Pagination.Item>);

      const startEllipsisNeeded = currentPage > maxPagesToShow - 1;
      const endEllipsisNeeded = currentPage < totalPages - (maxPagesToShow - 2);

      if (startEllipsisNeeded) {
        items.push(<Pagination.Ellipsis key="ell-start" disabled />);
      }

      let startPage = Math.max(2, currentPage - Math.floor((maxPagesToShow - 2) / 2));
      let endPage = Math.min(totalPages - 1, currentPage + Math.ceil((maxPagesToShow - 2) / 2));

      // Adjust start/end if near beginning or end
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

      items.push(<Pagination.Item key={totalPages} active={totalPages === currentPage} onClick={() => handlePageChange(totalPages)}>{totalPages}</Pagination.Item>);
    }
    return items;
  };

  // --- Helper for rendering results count ---
  const renderResultsCount = () => {
    if (isLoading) {
      return 'Loading clubs...';
    }
    if (!pagination || pagination.total === 0) {
      return 'No clubs found';
    }
    const startItem = ((pagination.page - 1) * pagination.limit) + 1;
    const endItem = Math.min(pagination.page * pagination.limit, pagination.total);
    return (
      <>
        Showing
        <span className="fw-medium">
          {' '}
          {startItem}
        </span>
        -
        <span className="fw-medium">
          {' '}
          {endItem}
        </span>
        {' '}
        of
        <span className="fw-medium">
          {' '}
          {pagination.total}
        </span>
        {' '}
        clubs
      </>
    );
  };

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-4 py-md-5">
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item linkAs={Link} href="/dashboard">Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item active>Clubs (RIOs)</Breadcrumb.Item>
        </Breadcrumb>

        <div className="mb-4 mb-md-5">
          <h1 className="h2 fw-bold mb-2">Find Your ʻOhana: Explore Clubs & Organizations</h1>
          <p className="text-muted">Discover and join clubs that match your interests at UH Mānoa.</p>
        </div>

        <Card className="shadow-sm mb-4 mb-md-5">
          <Card.Body className="p-4">
            <Row className="g-3 mb-3">
              <Col lg={7} xl={8}>
                <InputGroup>
                  <InputGroup.Text><Search /></InputGroup.Text>
                  <Form.Control
                    type="search"
                    placeholder="Search clubs by name or keyword..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    aria-label="Search clubs"
                  />
                </InputGroup>
              </Col>
              <Col lg={5} xl={4} className="d-flex gap-2">
                <Button variant="outline-secondary" onClick={handleFilterClick} className="flex-shrink-0">
                  <Funnel className="me-1" />
                  Filters
                </Button>
                <Dropdown onSelect={handleSortSelect} className="flex-grow-1">
                  <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort" className="w-100 d-flex justify-content-between align-items-center">
                    Sort:
                    {' '}
                    {sortBy}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    <Dropdown.Item eventKey="A-Z">Sort: A-Z</Dropdown.Item>
                    <Dropdown.Item eventKey="Z-A">Sort: Z-A</Dropdown.Item>
                    {/* <Dropdown.Item eventKey="Relevance">Sort: Relevance</Dropdown.Item> */}
                    {/* Add other sort options like popularity, recent */}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>

            {activeFilters.length > 0 && (
              <div className="d-flex flex-wrap gap-2">
                <span className="text-muted small me-2 align-self-center">Active:</span>
                {activeFilters.map(filter => (
                  <Badge
                    key={filter}
                    pill
                    bg="success-subtle"
                    text="success-emphasis"
                    className="d-inline-flex align-items-center gap-1 py-1 px-2"
                  >
                    {filter}
                    {' '}
                    {/* Display filter name, might need mapping from ID */}
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 lh-1 text-success-emphasis"
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

        <div className="d-flex justify-content-between align-items-center mb-4">
          <p className="text-muted mb-0">
            {renderResultsCount()}
          </p>
          <ButtonGroup size="sm">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'outline-secondary'} onClick={() => setViewMode('grid')} aria-label="Grid view">
              <Grid3x3GapFill />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'outline-secondary'} onClick={() => setViewMode('list')} aria-label="List view">
              <ListUl />
            </Button>
          </ButtonGroup>
        </div>

        {/* Loading and Error States */}
        {isLoading && (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}

        {/* Clubs Grid/List */}
        {!isLoading && !error && clubs.length === 0 && (
        <Col xs={12}>
          {' '}
          <Alert variant="info">No clubs match the current criteria.</Alert>
          {' '}
        </Col>
        )}
        {!isLoading && !error && clubs.length > 0 && (
          <Row className={`g-4 ${viewMode === 'list' ? 'row-cols-1' : 'row-cols-1 row-cols-md-2 row-cols-lg-3'}`}>
            {clubs.map(club => (
              <Col key={club.id}>
                <Card className="h-100 shadow-sm hover-lift">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      {/* Removed legacyBehavior, wrapping Card.Title directly */}
                      <Link href={`/clubs/${club.id}`} passHref className="text-decoration-none text-dark stretched-link">
                        <Card.Title as="h6" className="mb-1 fw-semibold">{club.name}</Card.Title>
                      </Link>
                      <Button variant="light" size="sm" className="p-1 ms-2 flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleBookmark(club.id); }} aria-label={`Bookmark ${club.name}`}>
                        <Bookmark />
                      </Button>
                    </div>

                    {viewMode === 'grid' && (
                      <>
                        <Card.Text className="small text-muted flex-grow-1 mb-3">
                          {club.purpose.substring(0, 100)}
                          {club.purpose.length > 100 ? '...' : ''}
                        </Card.Text>
                        <div className="mt-auto">
                          {(club.meetingTime || club.meetingLocation) && (
                          <div className="d-flex align-items-center text-muted small mb-2">
                            <Clock size={12} className="me-1" />
                            {/* Display meeting info concisely */}
                            <span>
                              {club.meetingTime || 'Meeting time TBD'}
                              {club.meetingLocation ? ` @ ${club.meetingLocation}` : ''}
                            </span>
                          </div>
                          )}
                          <div className="d-flex flex-wrap gap-1">
                            {club.categories.slice(0, 3).map(cc => (
                              <Badge key={cc.category.id} pill bg="light" text="dark" className="fw-normal">
                                {cc.category.name}
                              </Badge>
                            ))}
                            {club.categories.length > 3 && (
                              <Badge pill bg="light" text="dark" className="fw-normal">
                                +
                                {' '}
                                {club.categories.length - 3}
                                {' '}
                                more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {viewMode === 'list' && (
                      <div className="d-flex justify-content-between align-items-center">
                        <p className="small text-muted mb-0 me-3">
                          {club.purpose.substring(0, 150)}
                          {club.purpose.length > 150 ? '...' : ''}
                        </p>
                        <div className="text-end flex-shrink-0">
                          {(club.meetingTime || club.meetingLocation) && (
                            <div className="d-flex align-items-center text-muted small mb-2 justify-content-end">
                              <Clock size={12} className="me-1" />
                              <span>
                                {club.meetingTime || 'Meeting time TBD'}
                                {club.meetingLocation ? ` @ ${club.meetingLocation}` : ''}
                              </span>
                            </div>
                          )}
                          <div className="d-flex flex-wrap gap-1 justify-content-end">
                            {club.categories.map(cc => (
                              <Badge key={cc.category.id} pill bg="light" text="dark" className="fw-normal">
                                {cc.category.name}
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
        {pagination && pagination.totalPages > 1 && (
          <div className="d-flex justify-content-center mt-5">
            <Pagination size="sm">
              <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={14} /></Pagination.Prev>
              {renderPaginationItems()}
              <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages}><ChevronRight size={14} /></Pagination.Next>
            </Pagination>
          </div>
        )}
      </Container>
    </div>
  );
}

// Note: You might want to add custom CSS for hover-lift effect if not globally defined.
// .hover-lift {
//   transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
// }
// .hover-lift:hover {
//   transform: translateY(-3px);
//   box-shadow: var(--bs-card-box-shadow), 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
// }
