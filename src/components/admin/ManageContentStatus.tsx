'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Tab, Table, Button, Badge, Spinner, Alert, Form, Pagination, Modal, ButtonGroup } from 'react-bootstrap';
import type { ContentStatus } from '@prisma/client';
import EventEditor from './EventEditor'; // Import the editor component
// Keep interfaces ManagedEvent, ManagedClub, ItemType

// Define interfaces for the data we expect
interface ManagedEvent {
  id: string;
  title: string; // Changed from name to title
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
  // Keep existing state: activeTab, items, loading, error, filterStatus, pagination, actionLoading
  const [activeTab, setActiveTab] = useState<ItemType>('events');
  const [items, setItems] = useState<(ManagedEvent | ManagedClub)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ContentStatus | 'ALL'>('PENDING'); // Default to PENDING
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({}); // Loading state per item action

  // --- NEW State for Modal ---
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null); // null for create mode

  // --- NEW State for Delete Confirmation ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Keep existing fetchData, handlePageChange,
  // handleUpdateStatus, getStatusBadgeVariant, truncateText, renderPaginationItems ---

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    setDeleteError(null); // Clear delete error on fetch
    setActionLoading({});
    const statusQuery = filterStatus === 'ALL' ? '' : `&status=${filterStatus}`;
    const url = `/api/admin/${activeTab}?page=${page}&limit=10${statusQuery}`;

    try {
      const response = await fetch(url);
      const responseBody = await response.json();

      if (!response.ok) {
        throw new Error(responseBody.message || `Failed to fetch ${activeTab}`);
      }
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
      setItems([]);
      setPagination({ page: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterStatus]); // Removed fetchData from dependency array - should be stable

  useEffect(() => {
    fetchData(1);
  }, [activeTab, filterStatus, fetchData]); // Add fetchData back if needed based on linting/behavior

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= pagination.totalPages && pageNumber !== pagination.page) {
      fetchData(pageNumber);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: ContentStatus) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    setError(null); // Clear general error
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
      setItems(prevItems => prevItems.map(item => (item.id === id ? { ...item, status: newStatus } : item)));
    } catch (err: any) {
      console.error(`Error updating status for ${id}:`, err);
      setError(`Failed status update for ${id}: ${err.message}`); // Show specific error
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
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

  const truncateText = (text: string | null | undefined, maxLength: number = 75) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const renderPaginationItems = () => {
    // Basic pagination display logic - enhance if needed for many pages
    const pageItems = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      pageItems.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
    }

    for (let number = startPage; number <= endPage; number++) {
      pageItems.push(
        <Pagination.Item key={number} active={number === pagination.page} onClick={() => handlePageChange(number)}>
          {number}
        </Pagination.Item>,
      );
    }

    if (endPage < pagination.totalPages) {
      pageItems.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
    }

    return pageItems;
  };

  // --- NEW Handlers for Modal ---
  const handleShowCreateModal = () => {
    setEditingEventId(null);
    setShowEditorModal(true);
  };

  const handleShowEditModal = (id: string) => {
    setEditingEventId(id);
    setShowEditorModal(true);
  };

  const handleCloseEditorModal = () => {
    setShowEditorModal(false);
    setEditingEventId(null); // Reset editing ID
  };

  const handleEditorSave = () => {
    fetchData(pagination.page); // Refetch data on the current page after save
  };

  // --- NEW Handlers for Delete ---
  const handleShowDeleteConfirm = (id: string) => {
    setDeletingItemId(id);
    setShowDeleteConfirm(true);
    setDeleteError(null); // Clear previous delete errors
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingItemId(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deletingItemId) return;
    setIsDeleting(true);
    setDeleteError(null);
    setError(null); // Clear general errors

    try {
      // Only allow deleting events for now, add club logic if needed
      if (activeTab !== 'events') {
        throw new Error('Deletion only implemented for events currently.');
      }

      const response = await fetch(`/api/admin/events/${deletingItemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Handle 204 No Content separately from errors
        if (response.status === 204) {
          // Success
        } else {
          const result = await response.json().catch(() => ({})); // Try parsing error, default empty
          throw new Error(result.message || `Failed to delete item ${deletingItemId}. Status: ${response.status}`);
        }
      }
      // Success (204 or potentially 200/202 if API returns body)
      handleCloseDeleteConfirm();
      fetchData(1); // Refetch data from page 1 after deletion
    } catch (err: any) {
      console.error(`Error deleting ${deletingItemId}:`, err);
      setDeleteError(err.message); // Show error in the confirmation modal
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Main Content Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k as ItemType)}
        id="manage-content-tabs"
        className="mb-3"
      >
        <Tab eventKey="events" title="Manage Events">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Group style={{ maxWidth: '200px' }}>
              <Form.Label className="visually-hidden">Filter by Status</Form.Label>
              {' '}
              {/* Hide label visually */}
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(
                  e.target.value as ContentStatus | 'ALL',
                )}
                aria-label="Filter Events by Status"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </Form.Select>
            </Form.Group>
            <Button variant="success" onClick={handleShowCreateModal}>
              <i className="bi bi-plus-lg me-1" />
              {' '}
              Create New Event
            </Button>
          </div>

          {loading && (
            <div className="text-center p-4">
              <Spinner animation="border" size="sm" />
              {' '}
              Loading...
            </div>
          )}
          {error && (
            <Alert variant="danger">
              Error:
              {error}
            </Alert>
          )}
          {!loading && !error && (
            <>
              <Table striped bordered hover responsive size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>Title</th>
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
                      <td>{(item as ManagedEvent).title}</td>
                      <td title={(item as ManagedEvent).description ?? ''}>
                        {truncateText((item as ManagedEvent).description)}
                      </td>
                      <td>{(item as ManagedEvent).hostClub?.name ?? '-'}</td>
                      <td><Badge bg={getStatusBadgeVariant(item.status)}>{item.status}</Badge></td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>
                        <ButtonGroup size="sm">
                          <Button variant="outline-primary" onClick={() => handleShowEditModal(item.id)} title="Edit">
                            <i className="bi bi-pencil-fill" />
                          </Button>
                          {item.status !== 'APPROVED' && (
                          <Button
                            variant="outline-success"
                            onClick={() => handleUpdateStatus(
                              item.id,
                              'APPROVED',
                            )}
                            disabled={actionLoading[item.id]}
                            title="Approve"
                          >
                            {actionLoading[item.id] ? (
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                              />
                            ) : <i className="bi bi-check-lg" />}
                          </Button>
                          )}
                          {item.status !== 'REJECTED' && (
                          <Button
                            variant="outline-danger"
                            onClick={() => handleUpdateStatus(
                              item.id,
                              'REJECTED',
                            )}
                            disabled={actionLoading[item.id]}
                            title="Reject"
                          >
                            {actionLoading[item.id] ? (
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                              />
                            ) : <i className="bi bi-x-lg" />}
                          </Button>
                          )}
                          {item.status !== 'PENDING' && (
                          <Button
                            variant="outline-secondary"
                            onClick={() => handleUpdateStatus(item.id, 'PENDING')}
                            disabled={actionLoading[item.id]}
                            title="Set Pending"
                          >
                            {actionLoading[item.id] ? (
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                              />
                            ) : <i className="bi bi-arrow-counterclockwise" />}
                          </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            onClick={() => handleShowDeleteConfirm(
                              item.id,
                            )}
                            title="Delete"
                          >
                            <i className="bi bi-trash-fill" />
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {pagination.totalPages > 1 && (
              <Pagination className="justify-content-center">
                <Pagination.Prev
                  onClick={() => handlePageChange(
                    pagination.page - 1,
                  )}
                  disabled={pagination.page === 1}
                />
                {renderPaginationItems()}
                <Pagination.Next
                  onClick={() => handlePageChange(
                    pagination.page + 1,
                  )}
                  disabled={pagination.page === pagination.totalPages}
                />
              </Pagination>
              )}
              {items.length === 0 && <Alert variant="info">No events found matching the criteria.</Alert>}
            </>
          )}
        </Tab>
        <Tab eventKey="clubs" title="Manage Clubs">
          {/* Club Management UI - similar structure */}
          <Form.Group className="mb-3" style={{ maxWidth: '200px' }}>
            <Form.Label className="visually-hidden">Filter by Status</Form.Label>
            <Form.Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(
                e.target.value as ContentStatus | 'ALL',
              )}
              aria-label="Filter Clubs by Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </Form.Select>
          </Form.Group>

          {loading && (
            <div className="text-center p-4">
              <Spinner animation="border" size="sm" />
              {' '}
              Loading...
            </div>
          )}
          {error && (
            <Alert variant="danger">
              Error:
              {error}
            </Alert>
          )}
          {!loading && !error && (
            <>
              <Table striped bordered hover responsive size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Purpose</th>
                    <th>Contact Email</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{(item as ManagedClub).name}</td>
                      <td title={(item as ManagedClub).purpose ?? ''}>{truncateText((item as ManagedClub).purpose)}</td>
                      <td>{(item as ManagedClub).contactEmail ?? '-'}</td>
                      <td><Badge bg={getStatusBadgeVariant(item.status)}>{item.status}</Badge></td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>
                        <ButtonGroup size="sm">
                          {/* Add Edit button for clubs later if needed */}
                          {item.status !== 'APPROVED' && (
                          <Button
                            variant="outline-success"
                            onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                            disabled={actionLoading[item.id]}
                            title="Approve"
                          >
                            {actionLoading[item.id] ? (
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                              />
                            ) : <i className="bi bi-check-lg" />}
                          </Button>
                          )}
                          {item.status !== 'REJECTED' && (
                          <Button
                            variant="outline-danger"
                            onClick={() => handleUpdateStatus(item.id, 'REJECTED')}
                            disabled={actionLoading[item.id]}
                            title="Reject"
                          >
                            {actionLoading[item.id] ? (
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                              />
                            ) : <i className="bi bi-x-lg" />}
                          </Button>
                          )}
                          {item.status !== 'PENDING' && (
                          <Button
                            variant="outline-secondary"
                            onClick={() => handleUpdateStatus(item.id, 'PENDING')}
                            disabled={actionLoading[item.id]}
                            title="Set Pending"
                          >
                            {actionLoading[item.id] ? (
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                              />
                            ) : <i className="bi bi-arrow-counterclockwise" />}
                          </Button>
                          )}
                          {/* Add Delete button for clubs later if needed */}
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {pagination.totalPages > 1 && (
              <Pagination className="justify-content-center">
                <Pagination.Prev
                  onClick={() => handlePageChange(
                    pagination.page - 1,
                  )}
                  disabled={pagination.page === 1}
                />
                {renderPaginationItems()}
                <Pagination.Next
                  onClick={() => handlePageChange(
                    pagination.page + 1,
                  )}
                  disabled={pagination.page === pagination.totalPages}
                />
              </Pagination>
              )}
              {items.length === 0 && <Alert variant="info">No clubs found matching the criteria.</Alert>}
            </>
          )}
        </Tab>
      </Tabs>

      {/* Event Editor Modal */}
      <EventEditor
        show={showEditorModal}
        handleClose={handleCloseEditorModal}
        eventId={editingEventId}
        onSave={handleEditorSave}
      />

      {/* Delete Confirmation Modal (Example Structure - Requires separate component) */}
      {/*
             <ConfirmationModal
                show={showDeleteConfirm}
                handleClose={handleCloseDeleteConfirm}
                handleConfirm={confirmDelete}
                title="Confirm Deletion"
                body={`Are you sure you want to delete this
                ${activeTab === 'events' ? 'event' : 'item'}? This action cannot be undone.`}
                confirmVariant="danger"
                confirmText="Delete"
                isConfirming={isDeleting}
                error={deleteError}
             />
              */}
      {/* --- Simple inline confirmation for now --- */}
      <Modal show={showDeleteConfirm} onHide={handleCloseDeleteConfirm} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && <Alert variant="danger">{deleteError}</Alert>}
          Are you sure you want to delete this
          {' '}
          {activeTab === 'events' ? 'event' : 'item'}
          ? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteConfirm} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>
            {isDeleting ? <Spinner as="span" size="sm" animation="border" /> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

    </>
  );
}

export default ManageContentStatus;
