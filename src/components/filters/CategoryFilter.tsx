import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, ListGroup, Spinner } from 'react-bootstrap';
import { Funnel } from 'react-bootstrap-icons';

interface Category {
  id: string;
  name: string;
  count?: number;
  clubCount?: number;
  eventCount?: number;
}

interface CategoryFilterProps {
  onApplyFilters: (categories: string[]) => void;
  activeFilters: string[];
  context?: 'clubs' | 'events'; // Optional context prop to determine filtering behavior
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  onApplyFilters, 
  activeFilters, 
  context = 'clubs' // Default to clubs for backward compatibility
}) => {
  const [show, setShow] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(activeFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories when the component mounts or context changes
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch categories with context parameter
        const response = await fetch(`/api/categories?context=${context}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError(err.message || 'Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [context]);

  // Reset selected categories when activeFilters change (external update)
  useEffect(() => {
    setSelectedCategories(activeFilters);
  }, [activeFilters]);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const handleApply = () => {
    onApplyFilters(selectedCategories);
    handleClose();
  };

  const handleClear = () => {
    setSelectedCategories([]);
    onApplyFilters([]);
    handleClose();
  };

  // Determine the appropriate title based on context
  const modalTitle = context === 'events' 
    ? 'Filter Events by Category' 
    : 'Filter Clubs by Category';

  return (
    <>
      <Button
        variant="light"
        onClick={handleShow}
        className="w-100 text-start d-flex align-items-center"
      >
        <Funnel className="me-2" />
        <span className="me-auto">Filter by Category</span>
        {activeFilters.length > 0 && (
          <span className="badge rounded-pill bg-primary ms-1">{activeFilters.length}</span>
        )}
      </Button>

      <Modal show={show} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isLoading && (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading categories...</span>
              </Spinner>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {!isLoading && !error && categories.length === 0 && (
            <p className="text-muted">No categories available.</p>
          )}

          {!isLoading && !error && categories.length > 0 && (
            <Form>
              <ListGroup className="mb-3">
                {categories
                  .sort((a, b) => {
                    // Sort by count (descending) then by name (ascending)
                    if ((b.count || 0) === (a.count || 0)) {
                      return a.name.localeCompare(b.name);
                    }
                    return (b.count || 0) - (a.count || 0);
                  })
                  .map(category => (
                    <ListGroup.Item
                      key={category.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <Form.Check
                        type="checkbox"
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        label={category.name}
                        className="me-2 w-100"
                      />
                      {category.count !== undefined && (
                        <span className="badge bg-secondary rounded-pill ms-2">{category.count}</span>
                      )}
                    </ListGroup.Item>
                  ))}
              </ListGroup>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClear}>
            Clear All
          </Button>
          <Button variant="primary" onClick={handleApply}>
            Apply Filters
            {' '}
            (
            {selectedCategories.length}
            )
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CategoryFilter;
