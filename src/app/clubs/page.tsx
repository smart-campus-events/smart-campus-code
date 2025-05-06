'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, InputGroup,
  Dropdown, Pagination, Breadcrumb, ButtonGroup, Spinner, Alert,
} from 'react-bootstrap';
import {
  Search, X, Bookmark, BookmarkFill, Clock, Grid3x3GapFill, ListUl,
  ChevronLeft, ChevronRight,
} from 'react-bootstrap-icons';
import Link from 'next/link';
import debounce from 'lodash/debounce';
import CategoryFilter from '@/components/filters/CategoryFilter';

// Define the Club type based on expected API response
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
  categories: ClubCategory[];
  _count: {
    favoritedBy: number;
    hostedEvents: number;
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

const CLUBS_PER_PAGE = 30; // Increased from 9 to show more clubs per page

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>([]);
  const [activeFilterNames, setActiveFilterNames] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('A-Z');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [favoriteClubIds, setFavoriteClubIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);

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
  const fetchClubsData = useCallback(async (page = 1, search = '', sort = 'A-Z', categoryIds: string[] = []) => {
    setIsLoading(true);
    setError(null);
    try {
      // Build URL with multiple category parameters if needed
      let url = `/api/clubs?page=${page}&limit=${CLUBS_PER_PAGE}&q=${search}&sort=${sort}`;
      categoryIds.forEach(id => {
        url += `&category=${id}`;
      });

      const response = await fetch(url);
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
  }, []);

  // Fetch user's favorite clubs
  const fetchFavoriteClubs = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const storedFavorites = localStorage.getItem('favoriteClubs');
        if (storedFavorites) {
          setFavoriteClubIds(JSON.parse(storedFavorites));
        }
      }
    } catch (err) {
      console.error('Failed to fetch favorite clubs from localStorage:', err);
    }
  }, []);

  // Function that uses the current sortBy and filter values
  const fetchClubs = useCallback((page: number, search: string) => {
    fetchClubsData(page, search, sortBy, activeFilterIds);
  }, [fetchClubsData, sortBy, activeFilterIds]);

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
    fetchClubs(currentPage, searchTerm);
  }, [currentPage, fetchClubs, searchTerm, activeFilterIds]);

  // Fetch user's favorite clubs when component mounts
  useEffect(() => {
    fetchFavoriteClubs();
    fetchCategories();
  }, [fetchFavoriteClubs, fetchCategories]);

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

  // Search Event Handler
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    debouncedSearch(newSearchTerm, fetchClubs);
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

  const handleBookmark = async (clubId: string) => {
    try {
      const isCurrentlyFavorited = favoriteClubIds.includes(clubId);

      let updatedFavorites;
      if (isCurrentlyFavorited) {
        updatedFavorites = favoriteClubIds.filter(id => id !== clubId);
      } else {
        updatedFavorites = [...favoriteClubIds, clubId];
      }

      setFavoriteClubIds(updatedFavorites);

      if (typeof window !== 'undefined') {
        localStorage.setItem('favoriteClubs', JSON.stringify(updatedFavorites));
      }

      const method = isCurrentlyFavorited ? 'DELETE' : 'POST';
      await fetch(`/api/clubs/${clubId}/favorite`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (err: any) {
      console.error('Error bookmarking club:', err);
      alert(`Error: ${err.message}`);
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
    return `Showing ${start}–${end} of ${total} clubs`;
  };

  // Main Render
  return (
    <div className="bg-light py-5 min-vh-100">
      <Container>
        {/* Page Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">Browse Clubs</h1>
            <Breadcrumb className="mb-0">
              <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
              <Breadcrumb.Item active>Clubs</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          <div className="d-flex gap-2 align-items-center">
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
                    placeholder="Search clubs..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  {searchTerm && (
                    <Button
                      variant="light"
                      onClick={() => { setSearchTerm(''); fetchClubs(1, ''); }}
                    >
                      <X />
                    </Button>
                  )}
                </InputGroup>
              </Col>
              <Col md={4}>
                <CategoryFilter
                  onApplyFilters={handleCategoryFiltersChange}
                  activeFilters={activeFilterIds}
                />
              </Col>
              <Col md={3}>
                <Dropdown onSelect={handleSortSelect}>
                  <Dropdown.Toggle variant="light" className="w-100 text-start" id="sort-dropdown">
                    Sort:
                    {' '}
                    {sortBy}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="A-Z" active={sortBy === 'A-Z'}>A-Z</Dropdown.Item>
                    <Dropdown.Item eventKey="Z-A" active={sortBy === 'Z-A'}>Z-A</Dropdown.Item>
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
            <p className="mt-2 text-muted">Loading clubs...</p>
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
                      <Link
                        href={`/clubs/${club.id}`}
                        passHref
                        className="text-decoration-none text-dark stretched-link"
                      >
                        <Card.Title as="h6" className="mb-1 fw-semibold">{club.name}</Card.Title>
                      </Link>
                      <Button
                        variant="light"
                        size="sm"
                        className="p-1 ms-2 flex-shrink-0 position-relative z-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleBookmark(club.id);
                        }}
                        aria-label={
                          `${favoriteClubIds.includes(club.id)
                            ? 'Remove from favorites'
                            : 'Add to favorites'}: ${club.name}`
                        }
                      >
                        {favoriteClubIds.includes(club.id) ? <BookmarkFill className="text-primary" /> : <Bookmark />}
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
