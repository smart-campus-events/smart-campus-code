// src/app/admin/page.tsx

'use client';

// Required for client-side hooks

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Card,
  Button,
  Spinner,
  Alert,
  Table,
  Badge,
  Row,
  Col,
  Tabs, // Import Tabs component
  Tab, // Import Tab component
} from 'react-bootstrap';
import type { JobStatus, JobType } from '@prisma/client'; // Import types from Prisma
import ManageContentStatus from '@/components/admin/ManageContentStatus'; // Import the content management component
import ManageUsers from '@/components/admin/ManageUsers'; // Import the user management component
import ManageCategories from '@/components/admin/ManageCategories'; // Import the category management component

// Optional: Import bootstrap icons if used in child components or here
// You might need this if you use icons like <i className="bi bi-arrow-clockwise"></i>
// import 'bootstrap-icons/font/bootstrap-icons.css';

// Define a type for the job data we fetch for the status table
type JobStatusDisplay = {
  id: string;
  type: JobType;
  status: JobStatus;
  createdAt: Date; // Expect Date objects after parsing
  startedAt?: Date | null;
  endedAt?: Date | null;
  result?: any; // Keep it flexible to display error messages
};

function AdminPage() {
  // --- State for Background Job Scheduling & Status ---
  const [eventLoading, setEventLoading] = useState(false); // Loading state for scheduling event job
  const [clubLoading, setClubLoading] = useState(false); // Loading state for scheduling club job
  const [eventMessage, setEventMessage] = useState<{
    type: 'success' | 'danger' | 'warning'; text: string } | null>(null); // Feedback for event scheduling
  const [clubMessage, setClubMessage] = useState<{
    type: 'success' | 'danger' | 'warning'; text: string } | null>(null); // Feedback for club scheduling
  const [jobStatuses, setJobStatuses] = useState<JobStatusDisplay[]>([]); // List of recent jobs
  const [statusLoading, setStatusLoading] = useState(true); // Loading state for the job status table
  const [statusError, setStatusError] = useState<string | null>(null); // Error fetching job statuses

  // --- Fetch Job Statuses Function ---
  const fetchJobStatuses = useCallback(async () => {
    // Only set loading on initial load maybe? Or keep it for refresh indication
    // setStatusLoading(true);
    setStatusError(null);
    try {
      const response = await fetch('/api/admin/jobs/status'); // Fetch from the dedicated status API
      if (!response.ok) {
        const data = await response.json().catch(() => ({})); // Try to parse error, default empty
        throw new Error(data.message || `Failed to fetch job statuses (${response.status})`);
      }
      const data: any[] = await response.json(); // Assume API returns array of jobs

      // Convert date strings from JSON to Date objects
      const formattedData = data.map(job => ({
        ...job,
        createdAt: new Date(job.createdAt),
        startedAt: job.startedAt ? new Date(job.startedAt) : null,
        endedAt: job.endedAt ? new Date(job.endedAt) : null,
      }));
      setJobStatuses(formattedData);
    } catch (error: any) {
      console.error('Status fetch error:', error);
      setStatusError(error.message);
    } finally {
      setStatusLoading(false); // Ensure loading is set to false after fetch attempt
    }
  }, []); // Empty dependency array means this function definition is stable

  // --- Effect for Initial Load and Polling Job Statuses ---
  useEffect(() => {
    setStatusLoading(true); // Set loading true on initial mount
    fetchJobStatuses(); // Fetch on initial load
    const intervalId = setInterval(fetchJobStatuses, 30000); // Poll every 30 seconds
    // Cleanup function to clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, [fetchJobStatuses]); // Depend on the stable fetchJobStatuses function

  // --- Handlers for Scheduling Jobs ---
  const handleRunEventScraper = async () => {
    setEventLoading(true);
    setEventMessage(null);
    try {
      const response = await fetch('/api/admin/import/events', { method: 'POST' });
      const data = await response.json();

      if (response.status === 202) {
        setEventMessage({ type: 'success', text: data.message || 'Event scraping job scheduled!' });
        setTimeout(fetchJobStatuses, 1500); // Refresh status list shortly after scheduling
      } else if (response.status === 409) {
        setEventMessage({ type: 'warning', text: data.message || 'Job already pending/running.' });
      } else {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Failed to schedule event scraper:', error);
      setEventMessage({ type: 'danger', text: `Failed to schedule event scraping: ${error.message}` });
    } finally {
      setEventLoading(false);
    }
  };

  const handleRunClubScraper = async () => {
    setClubLoading(true);
    setClubMessage(null);
    try {
      const response = await fetch('/api/admin/import/clubs', { method: 'POST' });
      const data = await response.json();

      if (response.status === 202) {
        setClubMessage({ type: 'success', text: data.message || 'Club scraping job scheduled!' });
        setTimeout(fetchJobStatuses, 1500); // Refresh status list
      } else if (response.status === 409) {
        setClubMessage({ type: 'warning', text: data.message || 'Job already pending/running.' });
      } else {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Failed to schedule club scraper:', error);
      setClubMessage({ type: 'danger', text: `Failed to schedule club scraping: ${error.message}` });
    } finally {
      setClubLoading(false);
    }
  };

  // --- Helper Function for Job Status Badge Variant ---
  const getJobStatusBadgeVariant = (status: JobStatus) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'RUNNING': return 'primary';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'danger';
      default: return 'light';
    }
  };

  // --- Render Logic ---
  return (
    <Container className="my-4">
      <h1 className="mb-4">Admin Dashboard</h1>

      {/* Tabs for Different Admin Sections */}
      {/* `fill` makes tabs occupy the full width */}
      {/* Consider `defaultActiveKey` based on most frequent use */}
      <Tabs defaultActiveKey="manageContent" id="admin-dashboard-tabs" className="mb-3 mt-4" fill>

        {/* Tab 1: Manage Events & Clubs */}
        <Tab eventKey="manageContent" title="Manage Content">
          {/* The ManageContentStatus component handles Events/Clubs internally */}
          <ManageContentStatus />
        </Tab>

        {/* Tab 2: Manage Categories */}
        <Tab eventKey="categories" title="Manage Categories">
          <ManageCategories />
        </Tab>

        {/* Tab 3: Manage Users */}
        <Tab eventKey="users" title="Manage Users">
          {/* The ManageUsers component handles fetching and displaying users */}
          <ManageUsers />
        </Tab>

        {/* Tab 4: Background Job Scheduling & Status */}
        <Tab eventKey="jobs" title="Background Jobs">
          <p className="text-muted mt-3">Schedule scraping jobs and monitor their status.</p>
          {/* --- Job Scheduling Section --- */}
          <Row className="mb-4">
            <Col md={6} className="mb-3 mb-md-0">
              <Card>
                <Card.Body>
                  <Card.Title>Event Scraper Job</Card.Title>
                  <Card.Text>Manually schedule the event scraping and processing job.</Card.Text>
                  {eventMessage && <Alert variant={eventMessage.type} className="mt-3">{eventMessage.text}</Alert>}
                  <Button variant="primary" onClick={handleRunEventScraper} disabled={eventLoading}>
                    {eventLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Scheduling...
                      </>
                    ) : (
                      'Schedule Event Scrape'
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Club Scraper Job</Card.Title>
                  <Card.Text>Manually schedule the club scraping and processing job.</Card.Text>
                  {clubMessage && <Alert variant={clubMessage.type} className="mt-3">{clubMessage.text}</Alert>}
                  <Button variant="primary" onClick={handleRunClubScraper} disabled={clubLoading}>
                    {clubLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Scheduling...
                      </>
                    ) : (
                      'Schedule Club Scrape'
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* --- Job Status Section --- */}
          <Card>
            <Card.Header>
              <Row className="align-items-center">
                <Col><h2 className="h5 mb-0">Recent Job Statuses</h2></Col>
                <Col xs="auto">
                  <Button variant="outline-secondary" size="sm" onClick={fetchJobStatuses} disabled={statusLoading}>
                    {statusLoading ? (
                      <Spinner
                        as="span"
                        size="sm"
                        animation="border"
                        className="me-1"
                      />
                    ) : <i className="bi bi-arrow-clockwise" />}
                    {/* Add bootstrap-icons if using */}
                    Refresh
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              {statusLoading && jobStatuses.length === 0 && (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" />
                  {' '}
                  Loading statuses...
                </div>
              )}
              {statusError && (
                <Alert variant="danger">
                  Error loading job statuses:
                  {statusError}
                </Alert>
              )}
              {!statusLoading && !statusError
              && jobStatuses.length === 0 && <Alert variant="info">No recent jobs found.</Alert>}
              {!statusLoading && !statusError && jobStatuses.length > 0 && (
                <Table striped bordered hover responsive size="sm" className="align-middle">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Scheduled At</th>
                      <th>Started At</th>
                      <th>Ended At</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobStatuses.map((job) => (
                      <tr key={job.id}>
                        <td className="text-nowrap">{job.type.replace('_', ' ')}</td>
                        <td>
                          <Badge bg={getJobStatusBadgeVariant(job.status)}>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="text-nowrap">{job.createdAt.toLocaleString()}</td>
                        <td className="text-nowrap">{job.startedAt ? job.startedAt.toLocaleString() : '-'}</td>
                        <td className="text-nowrap">{job.endedAt ? job.endedAt.toLocaleString() : '-'}</td>
                        <td style={{ fontSize: '0.8em',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxWidth: '300px' }}
                        >
                          {(() => {
                            if (job.status === 'FAILED' && job.result?.error) {
                              return `Error: ${job.result.error}`;
                            }
                            if (job.status === 'COMPLETED' && job.result?.message) {
                              return job.result.message;
                            }
                            return '-';
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

      </Tabs>
    </Container>
  );
}

export default AdminPage;
