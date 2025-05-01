'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Tab, Table, Button, Badge, Spinner, Alert, Form, Pagination, ButtonGroup } from 'react-bootstrap';
import type { ContentStatus } from '@prisma/client'; // Import the enum

// Define interfaces for the data we expect
interface ManagedEvent {
  id: string;
  name: string;
  description?: string | null;
  status: ContentStatus;
  createdAt: string | Date; // Can be string initially from JSON
  hostClub?: { name: string } | null;
}

interface ManagedClub {
  id: string;
  name: string;
  purpose?: string | null; // Description field for clubs
  status: ContentStatus;
  createdAt: string | Date; // Can be string initially from JSON
  contactEmail?: string | null;
}

type ItemType = 'events' | 'clubs';

function ManageContentStatus() {
  const [activeTab, setActiveTab] = useState<ItemType>('events');
  const [items, setItems] = useState<(ManagedEvent | ManagedClub)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ContentStatus | 'ALL'>('PENDING'); // Default to PENDING
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({}); // Loading state per item action

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    setActionLoading({}); // Reset action loading on new fetch
    const statusQuery = filterStatus === 'ALL' ? '' : `&status=${filterStatus}`;
    const url = `/api/admin/${activeTab}?page=${page}&limit=10${statusQuery}`; // Add pagination & filter

    try {
      const response = await fetch(url);
      const responseBody = await response.json(); // Read body once

      if (!response.ok) {
        throw new Error(responseBody.message || `Failed to fetch ${activeTab}`);
      }
      // Convert date strings to Date objects
      const formattedData = responseBody.data.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      }));
      setItems(formattedData);
      setPagination({
        page: responseBody.pagination.page,
        totalPages: responseBody.pagination.totalPages,
      });
    } catch (err: any) {
      console.error(`Error fetching ${activeTab}:`, err);
      setError(err.message);
      setItems([]); // Clear items on error
      setPagination({ page: 1, totalPages: 1 }); // Reset pagination
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterStatus]);

  useEffect(() => {
    fetchData(1); // Fetch data when tab or filter changes, reset to page 1
  }, [activeTab, filterStatus, fetchData]); // Dependency includes fetchData now

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber !== pagination.page) {
      fetchData(pageNumber);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: ContentStatus) => {
    setActionLoading(prev => ({ ...prev, [id]: true })); // Set loading for this specific item
    try {
      const response = await fetch(`/api/admin/${activeTab}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const updatedItem = await response.json();
      if (!response.ok) {
        throw new Error(updatedItem.message || `Failed to update status to ${newStatus}`);
      }
      // Update the status in the local state for immediate feedback
      setItems(prevItems => prevItems.map(item => (item.id === id ? { ...item, status: newStatus } : item)));
      // Optionally refetch data if needed, or just rely on local update
      // fetchData(pagination.page);
    } catch (err: any) {
      console.error(`Error updating status for ${id}:`, err);
      setError(`Failed to update ${id}: ${err.message}`); // Show error specific to action
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false })); // Clear loading for this item
    }
  };

  const getStatusBadgeVariant = (status: ContentStatus) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'light';
    }
  };

  // Helper to truncate text
  const truncateText = (text: string | null | undefined, maxLength: number = 100) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const renderPaginationItems = () => {
    const items = [];
    for (let number = 1; number <= pagination.totalPages; number++) {
      items.push(
        <Pagination.Item key={number} active={number === pagination.page} onClick={() => handlePageChange(number)}>
          {number}
        </Pagination.Item>,
      );
    }
    return items;
  };

  return (
    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k as ItemType)} id="manage-content-tabs" className="mb-3">
      <Tab eventKey="events" title="Manage Events">
        {/* Content for Events Tab */}
        <Form.Group className="mb-3" style={{ maxWidth: '200px' }}>
          <Form.Label>Filter by Status</Form.Label>
          <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ContentStatus | 'ALL')}>
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Form.Select>
        </Form.Group>

        {loading && <Spinner animation="border" size="sm" />}
        {error && (
        <Alert variant="danger">
          Error:
          {error}
        </Alert>
        )}
        {!loading && !error && (
        <>
          <Table striped bordered hover responsive size="sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Host Club</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{(item as ManagedEvent).name}</td>
                  <td title={(item as ManagedEvent).description ?? ''}>
                    {truncateText((item as ManagedEvent).description)}
                  </td>
                  <td>{(item as ManagedEvent).hostClub?.name ?? '-'}</td>
                  <td>
                    <Badge bg={getStatusBadgeVariant(item.status)}>
                      {item.status}
                    </Badge>
                  </td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <ButtonGroup size="sm">
                      {item.status !== 'APPROVED' && (
                      <Button variant="outline-success" onClick={() => handleUpdateStatus(item.id, 'APPROVED')} disabled={actionLoading[item.id]}>
                        {actionLoading[item.id] ? <Spinner as="span" animation="border" size="sm" /> : 'Approve'}
                      </Button>
                      )}
                      {item.status !== 'REJECTED' && (
                      <Button variant="outline-danger" onClick={() => handleUpdateStatus(item.id, 'REJECTED')} disabled={actionLoading[item.id]}>
                        {actionLoading[item.id] ? <Spinner as="span" animation="border" size="sm" /> : 'Reject'}
                      </Button>
                      )}
                      {item.status !== 'PENDING' && (
                      <Button variant="outline-secondary" onClick={() => handleUpdateStatus(item.id, 'PENDING')} disabled={actionLoading[item.id]}>
                        {actionLoading[item.id] ? <Spinner as="span" animation="border" size="sm" /> : 'Set Pending'}
                      </Button>
                      )}
                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {pagination.totalPages > 1 && (
          <Pagination>
            <Pagination.Prev onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} />
            {renderPaginationItems()}
            <Pagination.Next onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} />
          </Pagination>
          )}
          {items.length === 0 && <p>No events found matching the criteria.</p>}
        </>
        )}
      </Tab>
      <Tab eventKey="clubs" title="Manage Clubs">
        {/* Content for Clubs Tab - Similar Structure */}
        <Form.Group className="mb-3" style={{ maxWidth: '200px' }}>
          <Form.Label>Filter by Status</Form.Label>
          <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ContentStatus | 'ALL')}>
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Form.Select>
        </Form.Group>

        {loading && <Spinner animation="border" size="sm" />}
        {error && (
        <Alert variant="danger">
          Error:
          {error}
        </Alert>
        )}
        {!loading && !error && (
          <>
            <Table striped bordered hover responsive size="sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Purpose</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{(item as ManagedClub).name}</td>
                    <td title={(item as ManagedClub).purpose ?? ''}>
                      {truncateText((item as ManagedClub).purpose)}
                    </td>
                    <td>{(item as ManagedClub).contactEmail ?? '-'}</td>
                    <td>
                      <Badge bg={getStatusBadgeVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>
                      <ButtonGroup size="sm">
                        {item.status !== 'APPROVED' && (
                        <Button variant="outline-success" onClick={() => handleUpdateStatus(item.id, 'APPROVED')} disabled={actionLoading[item.id]}>
                          {actionLoading[item.id] ? <Spinner as="span" animation="border" size="sm" /> : 'Approve'}
                        </Button>
                        )}
                        {item.status !== 'REJECTED' && (
                        <Button variant="outline-danger" onClick={() => handleUpdateStatus(item.id, 'REJECTED')} disabled={actionLoading[item.id]}>
                          {actionLoading[item.id] ? <Spinner as="span" animation="border" size="sm" /> : 'Reject'}
                        </Button>
                        )}
                        {item.status !== 'PENDING' && (
                        <Button variant="outline-secondary" onClick={() => handleUpdateStatus(item.id, 'PENDING')} disabled={actionLoading[item.id]}>
                          {actionLoading[item.id] ? <Spinner as="span" animation="border" size="sm" /> : 'Set Pending'}
                        </Button>
                        )}
                      </ButtonGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {pagination.totalPages > 1 && (
            <Pagination>
              <Pagination.Prev onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} />
              {renderPaginationItems()}
              <Pagination.Next
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              />
            </Pagination>
            )}
            {items.length === 0 && <p>No clubs found matching the criteria.</p>}
          </>
        )}
      </Tab>
    </Tabs>
  );
}

export default ManageContentStatus;
