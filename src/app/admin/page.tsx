'use client';

import React, { useState, useEffect, useCallback } from 'react';
// Use client-side session fetching if needed for initial check, but rely on API protection
// import { getSession } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
import { Container, Card, Button, Spinner, Alert, Table, Badge, Row, Col } from 'react-bootstrap';
import type { Job, JobStatus, JobType } from '@prisma/client';

// Define a type for the job data we fetch for the status table
type JobStatusDisplay = {
  id: string;
  type: JobType;
  status: JobStatus;
  createdAt: Date;
  startedAt?: Date | null;
  endedAt?: Date | null;
  result?: any; // Keep it flexible to display error messages
};

function AdminPage() {
  const [eventLoading, setEventLoading] = useState(false);
  const [clubLoading, setClubLoading] = useState(false);
  const [eventMessage, setEventMessage] = useState<{
    type: 'success' | 'danger' | 'warning';
    text: string;
  } | null>(null);
  const [clubMessage, setClubMessage] = useState<{ type: 'success' | 'danger' | 'warning'; text: string } | null>(null);
  const [jobStatuses, setJobStatuses] = useState<JobStatusDisplay[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Optional: Client-side redirection if not admin (strengthen with server-side check)
  // const router = useRouter();
  // useEffect(() => {
  //   const checkAdmin = async () => {
  //     const session = await getSession();
  //     if (!session?.user?.isAdmin) {
  //       router.push('/not-authorized'); // Or your login/home page
  //     }
  //   };
  //   checkAdmin();
  // }, [router]);

  const fetchJobStatuses = useCallback(async () => {
    setStatusError(null);
    try {
      const response = await fetch('/api/admin/jobs/status');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch statuses');
      }
      const data: JobStatusDisplay[] = await response.json();
      // Convert date strings to Date objects
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
      setStatusLoading(false);
    }
  }, []);

  // Fetch statuses on initial load and set up interval polling
  useEffect(() => {
    fetchJobStatuses(); // Initial fetch
    const intervalId = setInterval(fetchJobStatuses, 30000); // Poll every 30 seconds
    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [fetchJobStatuses]);

  const handleRunEventScraper = async () => {
    setEventLoading(true);
    setEventMessage(null);
    try {
      const response = await fetch('/api/admin/import/events', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.status === 202) { // Job scheduled successfully
        setEventMessage({ type: 'success', text: data.message || 'Event scraping job scheduled successfully!' });
        setTimeout(fetchJobStatuses, 1000); // Refresh status list soon
      } else if (response.status === 409) { // Job already running/pending
        setEventMessage({ type: 'warning', text: data.message || 'Job already exists.' });
      } else { // Other errors
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
      const response = await fetch('/api/admin/import/clubs', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.status === 202) { // Job scheduled successfully
        setClubMessage({ type: 'success', text: data.message || 'Club scraping job scheduled successfully!' });
        setTimeout(fetchJobStatuses, 1000); // Refresh status list soon
      } else if (response.status === 409) { // Job already running/pending
        setClubMessage({ type: 'warning', text: data.message || 'Job already exists.' });
      } else { // Other errors
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Failed to schedule club scraper:', error);
      setClubMessage({ type: 'danger', text: `Failed to schedule club scraping: ${error.message}` });
    } finally {
      setClubLoading(false);
    }
  };

  // Helper to get badge variant based on status
  const getStatusBadgeVariant = (status: JobStatus) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'RUNNING': return 'primary';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'danger';
      default: return 'light';
    }
  };

  return (
    <Container className="my-4">
      <h1>Admin Dashboard</h1>
      <p>Use this page to manage application data and processes.</p>

      {/* Job Scheduling Section */}
      <Row>
        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Event Data Management</Card.Title>
              <Card.Text>
                Schedule the background job to scrape and update event data.
              </Card.Text>
              {eventMessage && (
              <Alert variant={eventMessage.type} className="mt-3">
                {eventMessage.text}
              </Alert>
              )}
              <Button
                variant="primary"
                onClick={handleRunEventScraper}
                disabled={eventLoading}
              >
                {eventLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Event Scraper Job'
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Club Data Management</Card.Title>
              <Card.Text>
                Schedule the background job to scrape and update club (RIO) data.
              </Card.Text>
              {clubMessage && (
              <Alert variant={clubMessage.type} className="mt-3">
                {clubMessage.text}
              </Alert>
              )}
              <Button
                variant="primary"
                onClick={handleRunClubScraper}
                disabled={clubLoading}
              >
                {clubLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Club Scraper Job'
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Job Status Section */}
      <Card className="mt-4">
        <Card.Header>
          <h2 className="h5 mb-0">Recent Job Statuses</h2>
        </Card.Header>
        <Card.Body>
          {statusLoading && <Spinner animation="border" size="sm" />}
          {statusError && (
          <Alert variant="danger">
            Error loading job statuses:
            {statusError}
          </Alert>
          )}
          {!statusLoading && !statusError && jobStatuses.length === 0 && <p>No recent jobs found.</p>}
          {!statusLoading && !statusError && jobStatuses.length > 0 && (
            <Table striped bordered hover responsive size="sm">
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
                    <td>{job.type.replace('_', ' ')}</td>
                    <td>
                      <Badge bg={getStatusBadgeVariant(job.status)}>
                        {job.status}
                      </Badge>
                    </td>
                    <td>{job.createdAt.toLocaleString()}</td>
                    <td>{job.startedAt ? job.startedAt.toLocaleString() : '-'}</td>
                    <td>{job.endedAt ? job.endedAt.toLocaleString() : '-'}</td>
                    <td style={{ fontSize: '0.8em', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
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
          <Button variant="outline-secondary" size="sm" onClick={fetchJobStatuses} disabled={statusLoading}>
            <i className={`bi bi-arrow-clockwise ${statusLoading ? 'animate-spin' : ''}`} />
            {' '}
            Refresh Status
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AdminPage;
