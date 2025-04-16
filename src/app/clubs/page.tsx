'use client';

import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, InputGroup,
  Dropdown, Pagination, Breadcrumb, ButtonGroup,
} from 'react-bootstrap';
import {
  Search, Funnel, X, Bookmark, Clock, Grid3x3GapFill, ListUl,
  ChevronLeft, ChevronRight,
} from 'react-bootstrap-icons';
import Link from 'next/link';

// TODO: Replace hardcoded data with actual data fetching, filtering, sorting, pagination
// TODO: Implement filter modal/offcanvas functionality
// TODO: Implement search, sort, filter removal, view toggle, bookmark, pagination logic
// TODO: Use proper linking for club cards

const sampleClubs = [
  // eslint-disable-next-line max-len
  { id: 1, name: 'Hawaiʻi Programming Club', tags: ['Technology', 'Academic'], description: 'A community of students passionate about coding and software development...', meetingInfo: 'Meets Weekly Thursdays', slug: 'hawaii-programming-club' }, // Added slug for linking
  // eslint-disable-next-line max-len
  { id: 2, name: 'Mānoa Dance Crew', tags: ['Arts', 'Performance'], description: 'Express yourself through dance! All styles and skill levels welcome...', meetingInfo: 'Meets Tuesdays & Fridays', slug: 'manoa-dance-crew' },
  // eslint-disable-next-line max-len
  { id: 3, name: 'Environmental Warriors', tags: ['Environment', 'Community'], description: 'Join us in protecting Hawaii\'s natural environment through action...', meetingInfo: 'Monthly Events', slug: 'environmental-warriors' },
  // eslint-disable-next-line max-len
  { id: 4, name: 'Debate Club', tags: ['Academic', 'Speech'], description: 'Hone your critical thinking and public speaking skills.', meetingInfo: 'Meets Mondays', slug: 'debate-club' },
  // eslint-disable-next-line max-len
  { id: 5, name: 'Photography Club', tags: ['Arts', 'Hobby'], description: 'Capture moments and learn new techniques.', meetingInfo: 'Bi-weekly Workshops', slug: 'photography-club' },
  // eslint-disable-next-line max-len
  { id: 6, name: 'Gaming Guild', tags: ['Social', 'Entertainment'], description: 'Connect with fellow gamers on campus.', meetingInfo: 'Weekly Meetups', slug: 'gaming-guild' },
  {
    id: 7,
    name: 'Anime Club',
    category: 'Hobbies & Interests',
    memberCount: 110,
    tags: ['Anime', 'Manga', 'Japanese Culture', 'Social'],
    imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/e6c4d9a8f7-c508362619687f52d7f2.png',
    imageAlt: 'group of students watching anime together in a classroom setting, colorful posters on the wall',
    description: 'Screenings, discussions, and events related to Japanese animation and comics.',
    slug: 'anime-club',
  },
  {
    id: 8,
    name: 'Business Professionals Club',
    category: 'Academic & Professional',
    memberCount: 155,
    tags: ['Business', 'Networking', 'Career Development', 'Professional'],
    imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/a9d3b1c7e0-a4f9a8e7d6e5b4c3a2b1.png',
    imageAlt: 'students in business attire networking at a professional event, shaking hands',
    description: 'Connect with peers and professionals, gain insights into various industries.',
    slug: 'business-professionals-club',
  },
  {
    id: 9,
    name: 'Yoga & Wellness Club',
    category: 'Health & Wellness',
    memberCount: 75,
    tags: ['Yoga', 'Meditation', 'Mindfulness', 'Health', 'Fitness'],
    imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/f1b8e7a6d5-c3b2a1f9e8d7c6b5a4f3.png',
    imageAlt: 'students participating in an outdoor yoga session on a sunny day',
    description: 'Promoting physical and mental well-being through yoga and mindfulness practices.',
    slug: 'yoga-wellness-club',
  },
];

const initialActiveFilters = ['Academic', 'Cultural']; // Example
const totalClubs = 124; // Example total count
const clubsPerPage = 6; // Example items per page

export default function ClubsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState(initialActiveFilters);
  const [sortBy, setSortBy] = useState('A-Z');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);

  // Placeholder logic - replace with actual data fetching and filtering
  const filteredClubs = sampleClubs;
  const totalPages = Math.ceil(totalClubs / clubsPerPage);

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

  const handleBookmark = (clubId: number) => {
    // TODO: Implement bookmarking logic
    console.log(`Bookmark clicked for club ${clubId}`);
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
    // eslint-disable-next-line max-len
    paginationItems.push(<Pagination.Item key={1} active={currentPage === 1} onClick={() => handlePageChange(1)}>{1}</Pagination.Item>);
    if (currentPage > 3) paginationItems.push(<Pagination.Ellipsis key="ell-start" disabled />);
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 3) endPage = 3;
    if (currentPage >= totalPages - 2) startPage = totalPages - 2;

    for (let number = startPage; number <= endPage; number++) {
      // eslint-disable-next-line max-len
      paginationItems.push(<Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>{number}</Pagination.Item>);
    }
    if (currentPage < totalPages - 2) paginationItems.push(<Pagination.Ellipsis key="ell-end" disabled />);
    // eslint-disable-next-line max-len
    paginationItems.push(<Pagination.Item key={totalPages} active={totalPages === currentPage} onClick={() => handlePageChange(totalPages)}>{totalPages}</Pagination.Item>);
  }

  return (
    <div className="bg-light min-vh-100">
      {/* Assuming Header/Navigation is handled by the main layout */}
      {/* Add a placeholder Header if needed or rely on global layout */}
      {/* <header className="bg-white shadow-sm py-3">...</header> */}

      <Container className="py-4 py-md-5">
        {/* Breadcrumb - Assuming Dashboard exists */}
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item linkAs={Link} href="/dashboard">Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item active>Clubs (RIOs)</Breadcrumb.Item>
        </Breadcrumb>

        {/* Page Header */}
        <div className="mb-4 mb-md-5">
          <h1 className="h2 fw-bold mb-2">Find Your ʻOhana: Explore Clubs & Organizations</h1>
          <p className="text-muted">Discover and join clubs that match your interests at UH Mānoa.</p>
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
                    placeholder="Search clubs by name or keyword..."
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
                  {/* eslint-disable-next-line max-len */}
                  <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort" className="w-100 d-flex justify-content-between align-items-center">
                    Sort:
                    {' '}
                    {sortBy}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    <Dropdown.Item eventKey="A-Z">Sort: A-Z</Dropdown.Item>
                    <Dropdown.Item eventKey="Z-A">Sort: Z-A</Dropdown.Item>
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
                    bg="success-subtle"
                    text="success-emphasis"
                    className="d-inline-flex align-items-center gap-1 py-1 px-2"
                  >
                    {filter}
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

        {/* Results Count & View Toggle */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <p className="text-muted mb-0">
            Showing
            <span className="fw-medium">{filteredClubs.length}</span>
            {' '}
            of
            <span className="fw-medium">{totalClubs}</span>
            {' '}
            clubs
          </p>
          <ButtonGroup size="sm">
            {/* eslint-disable-next-line max-len */}
            <Button variant={viewMode === 'grid' ? 'secondary' : 'outline-secondary'} onClick={() => setViewMode('grid')} aria-label="Grid view">
              <Grid3x3GapFill />
            </Button>
            {/* eslint-disable-next-line max-len */}
            <Button variant={viewMode === 'list' ? 'secondary' : 'outline-secondary'} onClick={() => setViewMode('list')} aria-label="List view">
              <ListUl />
            </Button>
          </ButtonGroup>
        </div>

        {/* Clubs Grid/List */}
        <Row className={`g-4 ${viewMode === 'list' ? 'row-cols-1' : 'row-cols-1 row-cols-md-2 row-cols-lg-3'}`}>
          {filteredClubs.map(club => (
            <Col key={club.id}>
              {/* TODO: Link entire card to club details page */}
              <Card className="h-100 shadow-sm hover-lift">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Link href={`/club/${club.slug}`} passHref legacyBehavior>
                      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                      <a className="text-decoration-none text-dark stretched-link">
                        <Card.Title as="h6" className="mb-1 fw-semibold">{club.name}</Card.Title>
                      </a>
                    </Link>
                    {/* eslint-disable-next-line max-len */}
                    <Button variant="light" size="sm" className="p-1 ms-2 flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleBookmark(club.id); }} aria-label={`Bookmark ${club.name}`}>
                      <Bookmark />
                    </Button>
                  </div>

                  {viewMode === 'grid' && (
                    <>
                      {/* eslint-disable-next-line max-len */}
                      <Card.Text className="small text-muted flex-grow-1 mb-3">
                        {club.description.substring(0, 100)}
                        {club.description.length > 100 ? '...' : ''}
                      </Card.Text>
                      <div className="mt-auto">
                        <div className="d-flex align-items-center text-muted small mb-2">
                          <Clock size={12} className="me-1" />
                          <span>{club.meetingInfo}</span>
                        </div>
                        <div className="d-flex flex-wrap gap-1">
                          {club.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} pill bg="light" text="dark" className="fw-normal">
                              {tag}
                            </Badge>
                          ))}
                          {club.tags.length > 3 && (
                            <Badge pill bg="light" text="dark" className="fw-normal">
                              +
                              {' '}
                              {club.tags.length - 3}
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
                      {/* eslint-disable-next-line max-len */}
                      <p className="small text-muted mb-0 me-3">
                        {club.description.substring(0, 150)}
                        {club.description.length > 150 ? '...' : ''}
                      </p>
                      <div className="text-end flex-shrink-0">
                        <div className="d-flex align-items-center text-muted small mb-2 justify-content-end">
                          <Clock size={12} className="me-1" />
                          <span>{club.meetingInfo}</span>
                        </div>
                        <div className="d-flex flex-wrap gap-1 justify-content-end">
                          {club.tags.map(tag => (
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
            {/* eslint-disable-next-line max-len */}
            <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={14} /></Pagination.Prev>
            {paginationItems}
            {/* eslint-disable-next-line max-len */}
            <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight size={14} /></Pagination.Next>
          </Pagination>
        </div>
        )}
      </Container>
    </div>
  );
}

// Add custom CSS for hover effect if needed:
/*
.hover-lift {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.hover-lift:hover {
  transform: translateY(-3px);
  box-shadow: var(--bs-card-box-shadow), 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}
*/
