'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Image } from 'react-bootstrap';
import { Search, People } from 'react-bootstrap-icons';
import styles from './clubs.module.css';

const ClubsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Mock data for clubs
  const allClubs = [
    {
      id: 1,
      name: 'Computer Science Club',
      description: 'Weekly meetups, coding challenges, and tech talks.',
      members: 156,
      category: 'Technology',
      imageUrl: '/images/placeholder.svg',
    },
    {
      id: 2,
      name: 'Sustainability Club',
      description: 'Making UHM greener through community initiatives.',
      members: 89,
      category: 'Environment',
      imageUrl: '/images/placeholder.svg',
    },
    {
      id: 3,
      name: 'Hawaiian Culture Club',
      description: 'Learn about Hawaiian traditions and practices.',
      members: 203,
      category: 'Culture',
      imageUrl: '/images/placeholder.svg',
    },
    {
      id: 4,
      name: 'Business Leadership Association',
      description: 'Networking events and professional development workshops.',
      members: 142,
      category: 'Professional',
      imageUrl: '/images/placeholder.svg',
    },
    {
      id: 5,
      name: 'Anime & Manga Club',
      description: 'Weekly screenings and discussions about Japanese animation.',
      members: 98,
      category: 'Entertainment',
      imageUrl: '/images/placeholder.svg',
    },
    {
      id: 6,
      name: 'Marine Biology Society',
      description: 'Field trips and research opportunities related to marine life.',
      members: 76,
      category: 'Science',
      imageUrl: '/images/placeholder.svg',
    },
  ];

  // Categories for the filter
  const categories = ['All', 'Technology', 'Environment', 'Culture', 'Professional', 'Entertainment', 'Science'];

  // Filter clubs based on search term and category
  const filteredClubs = allClubs.filter((club) => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase())
                           || club.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Container className={styles.clubsContainer}>
      <Row className="mb-4">
        <Col>
          <h1 className={styles.pageTitle}>Explore Clubs</h1>
          <p className={styles.pageSubtitle}>Discover and join student organizations at UH Manoa</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text className={styles.searchIcon}>
              <Search />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search clubs by name or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.categoryFilter}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'All' ? 'All Categories' : category}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Row>
        {filteredClubs.map((club) => (
          <Col key={club.id} md={4} className="mb-4">
            <Card className={styles.clubCard}>
              <div className={styles.clubCardImageContainer}>
                <Image 
                  src={club.imageUrl} 
                  alt={club.name} 
                  className={styles.clubCardImage} 
                />
              </div>
              <div className={styles.categoryBadge}>{club.category}</div>
              <div className="card-body">
                <h5 className="card-title">{club.name}</h5>
                <p className="card-text">{club.description}</p>
                <div className={styles.memberCount}>
                  <People />
                  {' '}
                  {club.members}
                  {' '}
                  members
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default ClubsPage;
