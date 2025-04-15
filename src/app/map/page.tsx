'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Form, InputGroup, Button, ListGroup } from 'react-bootstrap';
import { Search, GeoAlt, Buildings, BookmarkStar } from 'react-bootstrap-icons';
import styles from './map.module.css';

const MapPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data for locations
  const campusLocations = [
    {
      id: 1,
      name: 'Hamilton Library',
      category: 'Academic',
      address: '2550 McCarthy Mall',
      description: 'Main library facility with study spaces, computer labs, and research resources.',
    },
    {
      id: 2,
      name: 'Campus Center',
      category: 'Facility',
      address: '2465 Campus Rd',
      description: 'Student hub with food court, meeting rooms, and student organization offices.',
    },
    {
      id: 3,
      name: 'POST Building',
      category: 'Academic',
      address: '1680 East-West Rd',
      description: 'Home to the Information and Computer Sciences department and classrooms.',
    },
    {
      id: 4,
      name: 'Stan Sheriff Center',
      category: 'Athletics',
      address: '1355 Lower Campus Rd',
      description: 'Multipurpose arena hosting basketball, volleyball, and campus events.',
    },
    {
      id: 5,
      name: 'Kennedy Theatre',
      category: 'Arts',
      address: '1770 East-West Rd',
      description: 'Performance venue for theatre, dance, and musical productions.',
    },
  ];
  
  // Filter locations based on search term
  const filteredLocations = campusLocations.filter((location) => {
    return location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           location.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
           location.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Container fluid className={styles.mapContainer}>
      <Row>
        <Col md={4} className={styles.sidebarCol}>
          <div className={styles.searchContainer}>
            <h2 className={styles.sidebarTitle}>Campus Map</h2>
            <InputGroup className="mb-3">
              <InputGroup.Text className={styles.searchIcon}>
                <Search />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search locations"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </InputGroup>
            
            <div className={styles.filterButtons}>
              <Button variant="outline-secondary" className={styles.filterButton}>
                <Buildings className="me-2" /> Buildings
              </Button>
              <Button variant="outline-secondary" className={styles.filterButton}>
                <GeoAlt className="me-2" /> Points of Interest
              </Button>
              <Button variant="outline-secondary" className={styles.filterButton}>
                <BookmarkStar className="me-2" /> Saved
              </Button>
            </div>
          </div>
          
          <div className={styles.locationsList}>
            <h3 className={styles.locationsTitle}>Locations</h3>
            <ListGroup>
              {filteredLocations.map((location) => (
                <ListGroup.Item key={location.id} className={styles.locationItem}>
                  <h4 className={styles.locationName}>{location.name}</h4>
                  <div className={styles.locationCategory}>{location.category}</div>
                  <div className={styles.locationAddress}>
                    <GeoAlt className="me-1" /> {location.address}
                  </div>
                  <p className={styles.locationDescription}>
                    {location.description}
                  </p>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        </Col>
        
        <Col md={8} className={styles.mapCol}>
          <div className={styles.mapPlaceholder}>
            <div className={styles.mapContent}>
              <h3 className="mb-4">Interactive Campus Map</h3>
              <p>This area would contain an interactive map of the UH Manoa campus.</p>
              <p>The map would allow users to:</p>
              <ul className="text-start">
                <li>Find buildings and points of interest</li>
                <li>Get directions between locations</li>
                <li>View information about campus facilities</li>
                <li>Save favorite locations</li>
              </ul>
              <p className="text-muted">
                (Map implementation would require a mapping API like Google Maps or Mapbox)
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default MapPage;
