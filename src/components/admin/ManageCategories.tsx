'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import {
  Card,
  Button,
  Spinner,
  Alert,
  Form,
  InputGroup,
  ListGroup,
  Row,
  Col,
} from 'react-bootstrap';
import ConfirmationModal from './ConfirmationModal'; // Reuse confirmation modal

// Interface for Category data
interface Category {
  id: string;
  name: string;
  createdAt: string | Date;
  // Add _count if you want to show usage, but requires API changes
  // _count?: { clubs: number; events: number; userInterests: number };
}

function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch existing categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the public categories API - assumes it exists and is sufficient
      const response = await fetch('/api/categories');
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to fetch categories');
      }
      const data: Category[] = await response.json();
      // Sort categories alphabetically by name for display
      data.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle adding a new category
  const handleAddCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setAddError('Category name cannot be empty.');
      return;
    }
    setIsAdding(true);
    setAddError(null);
    setError(null); // Clear general errors

    try {
      const response = await fetch('/api/admin/categories', { // Use admin route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to add category');
      }
      setNewCategoryName(''); // Clear input on success
      fetchCategories(); // Refresh the list
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  // Handle initiating deletion
  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category);
    setDeleteError(null); // Clear previous error
    setShowDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingCategory(null);
    setDeleteError(null);
  };

  // Handle confirming deletion
  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;

    setIsDeleting(true);
    setDeleteError(null);
    setError(null); // Clear general errors

    try {
      const response = await fetch(`/api/admin/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      });

      // Check for specific error status codes first
      if (response.status === 409) { // Conflict - category in use
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || 'Category is currently in use and cannot be deleted.');
      }
      if (response.status === 404) {
        throw new Error('Category not found.');
      }

      // Check general ok status for 204 No Content
      if (!response.ok && response.status !== 204) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || `Failed to delete category (${response.status})`);
      }

      // Success (204 No Content)
      handleCloseDeleteConfirm();
      fetchCategories(); // Refresh list
    } catch (err: any) {
      setDeleteError(err.message); // Show error in modal
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <Card.Header>Manage Categories</Card.Header>
      <Card.Body>
        <Form onSubmit={handleAddCategory} className="mb-4">
          <Row>
            <Col>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={isAdding}
                  required
                  aria-label="New category name"
                />
                <Button variant="success" type="submit" disabled={isAdding}>
                  {isAdding ? (
                    <>
                      <Spinner size="sm" className="me-1" />
                      {' '}
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-lg me-1" />
                      {' '}
                      Add Category
                    </>
                  )}
                </Button>
              </InputGroup>
              {addError && <Alert variant="danger" className="mt-2 py-1 px-2">{addError}</Alert>}
            </Col>
          </Row>
        </Form>

        <h5 className="mb-3">Existing Categories</h5>
        {loading && (
        <div className="text-center p-3">
          <Spinner animation="border" size="sm" />
          {' '}
          Loading categories...
        </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        {!loading && !error && categories.length === 0 && <Alert variant="info">No categories found.</Alert>}
        {!loading && !error && categories.length > 0 && (
        <ListGroup>
          {categories.map(category => (
            <ListGroup.Item key={category.id} className="d-flex justify-content-between align-items-center">
              <span>{category.name}</span>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleDeleteClick(category)}
                title="Delete Category"
              >
                <i className="bi bi-trash-fill" />
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
        )}
      </Card.Body>

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
      <ConfirmationModal
        show={showDeleteConfirm}
        handleClose={handleCloseDeleteConfirm}
        handleConfirm={confirmDeleteCategory}
        title="Confirm Deletion"
        body={(
          <>
            Are you sure you want to delete the category &quot;
            <strong>{deletingCategory.name}</strong>
            &quot;? This cannot be undone.
            It can only be deleted if it&apos;s not currently linked to any clubs, events, or user interests.
          </>
)}
        confirmVariant="danger"
        confirmText="Delete"
        isConfirming={isDeleting}
        error={deleteError}
      />
      )}
    </Card>
  );
}

export default ManageCategories;
