'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react'; // Import useSession to get current user ID
import { Table, Button, Badge, Spinner, Alert, Pagination, Form, InputGroup, Row, Col, Card } from 'react-bootstrap';
import ConfirmationModal from './ConfirmationModal'; // Assuming this component exists

// Define interface for User data from API
interface ManagedUser {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  isAdmin: boolean;
  createdAt: string | Date;
}

function ManageUsers() {
  const { data: session } = useSession(); // Get session data on client
  const currentAdminId = session?.user?.id; // ID of the currently logged-in admin

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({}); // Loading state per user action
  const [searchQuery, setSearchQuery] = useState('');

  // State for confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmDetails, setConfirmDetails] = useState<{
    userId: string; makeAdmin: boolean; userName: string } | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const fetchData = useCallback(async (page = 1, search = searchQuery) => {
    setLoading(true);
    setError(null);
    setActionLoading({}); // Reset action loading on new fetch
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const url = `/api/admin/users?page=${page}&limit=15${searchParam}`; // Fetch users

    try {
      const response = await fetch(url);
      const responseBody = await response.json(); // Read body once

      if (!response.ok) {
        throw new Error(responseBody.message || 'Failed to fetch users');
      }
      // Convert date strings to Date objects
      const formattedData = responseBody.data.map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt),
      }));
      setUsers(formattedData);
      setPagination({
        page: responseBody.pagination.page,
        totalPages: responseBody.pagination.totalPages,
      });
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
      setUsers([]); // Clear items on error
      setPagination({ page: 1, totalPages: 1 }); // Reset pagination
    } finally {
      setLoading(false);
    }
  }, [searchQuery]); // Depend on searchQuery

  useEffect(() => {
    fetchData(1); // Fetch data when component mounts or search query changes
  }, [fetchData]); // No need for searchQuery here as fetchData depends on it

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault(); // Prevent form submission if used in a form
    fetchData(1); // Fetch page 1 with the new search query
  };

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= pagination.totalPages && pageNumber !== pagination.page) {
      fetchData(pageNumber);
    }
  };

  // Prepare confirmation
  const handleRoleChangeClick = (userId: string, makeAdmin: boolean, userName: string) => {
    setConfirmDetails({ userId, makeAdmin, userName });
    setConfirmError(null);
    setShowConfirm(true);
  };

  const handleCloseConfirm = () => {
    setShowConfirm(false);
    setConfirmDetails(null);
    setConfirmError(null);
  };

  // Execute role change after confirmation
  const confirmRoleChange = async () => {
    if (!confirmDetails) return;
    const { userId, makeAdmin } = confirmDetails;

    setActionLoading(prev => ({ ...prev, [userId]: true })); // Set loading for this specific user
    setConfirmError(null); // Clear previous confirmation errors
    setError(null); // Clear general errors

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: makeAdmin }),
      });
      const updatedUser = await response.json();
      if (!response.ok) {
        throw new Error(updatedUser.message || 'Failed to update role');
      }
      // Update the status in the local state for immediate feedback
      setUsers(prevUsers => prevUsers.map(user => (user.id === userId ? { ...user, isAdmin: makeAdmin } : user)));
      handleCloseConfirm(); // Close modal on success
    } catch (err: any) {
      console.error(`Error updating role for ${userId}:`, err);
      setConfirmError(err.message); // Show error in the confirmation modal
      // Keep modal open on error
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false })); // Clear loading for this user
    }
  };

  const getUserDisplayName = (user: ManagedUser): string => {
    if (user.name) return user.name;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return user.email; // Fallback to email
  };

  const renderPaginationItems = () => {
    // (Keep pagination rendering logic from ManageContentStatus)
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
    <Card>
      <Card.Header>Manage User Roles</Card.Header>
      <Card.Body>
        {/* Search Input */}
        <Form onSubmit={handleSearchSubmit} className="mb-3">
          <Row>
            <Col>
              <InputGroup>
                <Form.Control
                  type="search"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <Button variant="outline-secondary" type="submit">Search</Button>
              </InputGroup>
            </Col>
          </Row>
        </Form>

        {loading && (
        <div className="text-center p-4">
          <Spinner animation="border" size="sm" />
          {' '}
          Loading users...
        </div>
        )}
        {error && (
        <Alert variant="danger">
          Error fetching users:
          {error}
        </Alert>
        )}
        {!loading && !error && (
        <>
          <Table striped bordered hover responsive size="sm" className="align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Is Admin?</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const displayName = getUserDisplayName(user);
                const isCurrentUser = user.id === currentAdminId; // Check if this row is the logged-in admin
                return (
                  <tr key={user.id}>
                    <td>{displayName}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={user.isAdmin ? 'success' : 'secondary'}>
                        {user.isAdmin ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      {actionLoading[user.id] && (
                      <Spinner as="span" animation="border" size="sm" />
                      )}
                      {!actionLoading[user.id] && user.isAdmin && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRoleChangeClick(user.id, false, displayName)}
                        disabled={isCurrentUser} // Disable if it's the current user
                        title={isCurrentUser ? 'Cannot revoke own admin status' : 'Revoke Admin'}
                      >
                        Revoke Admin
                      </Button>
                      )}
                      {!actionLoading[user.id] && !user.isAdmin && (
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleRoleChangeClick(user.id, true, displayName)}
                        disabled={isCurrentUser}
                      >
                        Make Admin
                      </Button>
                      )}
                      {isCurrentUser && <small className="text-muted ms-2">(You)</small>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {pagination.totalPages > 1 && (
          <Pagination className="justify-content-center">
            <Pagination.Prev onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} />
            {renderPaginationItems()}
            <Pagination.Next
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            />
          </Pagination>
          )}
          {users.length === 0 && (
          <Alert variant="info">
            No users found
            {searchQuery ? ' matching search.' : '.'}
          </Alert>
          )}
        </>
        )}
      </Card.Body>

      {/* Confirmation Modal */}
      {confirmDetails && (
        <ConfirmationModal
          show={showConfirm}
          handleClose={handleCloseConfirm}
          handleConfirm={confirmRoleChange}
          title="Confirm Role Change"
          body={`Are you sure you want to ${
            confirmDetails.makeAdmin ? 'grant' : 'revoke'
          } admin privileges for ${confirmDetails.userName} (${
            users.find(u => u.id === confirmDetails.userId)?.email
          })?`}
          confirmVariant={confirmDetails.makeAdmin ? 'success' : 'danger'}
          confirmText={confirmDetails.makeAdmin ? 'Make Admin' : 'Revoke Admin'}
          isConfirming={actionLoading[confirmDetails.userId]} // Show spinner on confirm button
          error={confirmError}
        />
      )}
    </Card>
  );
}

export default ManageUsers;
