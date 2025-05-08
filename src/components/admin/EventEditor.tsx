'use client';

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Alert, CloseButton } from 'react-bootstrap';
import { ContentStatus, AttendanceType } from '@prisma/client'; // Import enums

// Define interfaces for fetched data & form state
interface Category {
  id: string;
  name: string;
}

interface ClubMinimal {
  id: string;
  name: string;
}

interface EventFormData {
  id?: string; // Present only in edit mode
  title: string;
  description: string;
  startDateTime: string; // Store as ISO string compatible with datetime-local
  endDateTime: string; // Store as ISO string compatible with datetime-local
  allDay: boolean;
  attendanceType: AttendanceType;
  location: string;
  locationVirtualUrl: string;
  costAdmission: string;
  organizerSponsor: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  eventUrl: string;
  eventPageUrl: string;
  status: ContentStatus;
  categoryIds: string[]; // Store selected category IDs
  organizerClubId: string; // Store selected club ID ('none' or actual ID)
}

interface EventEditorProps {
  show: boolean;
  handleClose: () => void;
  eventId: string | null; // null for create mode, ID for edit mode
  onSave: () => void; // Callback to refresh the parent list
}

const initialFormData: EventFormData = {
  title: '',
  description: '',
  startDateTime: '',
  endDateTime: '',
  allDay: false,
  attendanceType: AttendanceType.IN_PERSON, // Default value
  location: '',
  locationVirtualUrl: '',
  costAdmission: '',
  organizerSponsor: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  eventUrl: '',
  eventPageUrl: '',
  status: ContentStatus.PENDING, // Default value
  categoryIds: [],
  organizerClubId: 'none', // Default to 'none'
};

// Helper to format Date to datetime-local compatible string (YYYY-MM-DDTHH:mm)
const formatDateTimeLocal = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Adjust for local timezone offset before formatting
    const tzoffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  } catch (e) {
    console.error('Error formatting date:', date, e);
    return '';
  }
};

function EventEditor({ show, handleClose, eventId, onSave }: EventEditorProps) {
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [clubsList, setClubsList] = useState<ClubMinimal[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Loading event data for edit
  const [isSubmitting, setIsSubmitting] = useState(false); // Form submission
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null); // Errors fetching categories/clubs

  // Fetch Categories and Clubs for selects
  const fetchSelectOptions = useCallback(async () => {
    setFetchError(null);
    try {
      // Fetch categories
      const catRes = await fetch('/api/categories');
      if (!catRes.ok) throw new Error('Failed to fetch categories');
      const catData: Category[] = await catRes.json();
      setCategoriesList(catData);

      // Fetch minimal clubs (approved only)
      const clubRes = await fetch('/api/admin/clubs?minimal=true'); // Assumes this fetches approved clubs
      if (!clubRes.ok) throw new Error('Failed to fetch clubs');
      const clubData: { data: ClubMinimal[] } = await clubRes.json();
      setClubsList(clubData.data);
    } catch (err: any) {
      console.error('Error fetching select options:', err);
      setFetchError(err.message);
    }
  }, []);

  // Fetch event data when editing
  const fetchEventData = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/events/${id}`); // Use correct details path
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch event details');
      }
      // Populate form data, format dates correctly for input type="datetime-local"
      setFormData({
        ...initialFormData, // Start fresh
        ...data, // Overwrite with fetched data
        startDateTime: formatDateTimeLocal(data.startDateTime),
        endDateTime: formatDateTimeLocal(data.endDateTime),
        // categoryIds should already be an array from the API
        categoryIds: data.categoryIds || [],
        organizerClubId: data.organizerClubId || 'none',
      });
    } catch (err: any) {
      console.error('Error fetching event data:', err);
      setError(`Error loading event: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to fetch data when modal opens or eventId changes
  useEffect(() => {
    if (show) {
      fetchSelectOptions(); // Fetch lists every time modal opens
      if (eventId) {
        fetchEventData(eventId);
      } else {
        setFormData(initialFormData); // Reset form for create mode
        setError(null);
        setIsLoading(false);
      }
    } else {
      // Optional: Reset form when modal closes? Or keep state?
      // setFormData(initialFormData);
      setError(null);
    }
  }, [eventId, show, fetchEventData, fetchSelectOptions]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      // Handle category checkboxes
      if (name === 'categoryIds') {
        const categoryId = value;
        setFormData(prev => ({
          ...prev,
          categoryIds: checked
            ? [...prev.categoryIds, categoryId] // Add ID if checked
            : prev.categoryIds.filter(id => id !== categoryId), // Remove ID if unchecked
        }));
      } else {
        // Handle other checkboxes (like 'allDay')
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const apiUrl = eventId ? `/api/admin/events/${eventId}` : '/api/admin/events';
    const method = eventId ? 'PATCH' : 'POST';

    // Prepare payload, ensure dates are valid ISO strings if needed by backend
    // Convert empty strings for dates to null
    const payload = {
      ...formData,
      startDateTime: formData.startDateTime ? new Date(formData.startDateTime).toISOString() : null, // Send ISO or null
      endDateTime: formData.endDateTime ? new Date(formData.endDateTime).toISOString() : null, // Send ISO or null
      organizerClubId: formData.organizerClubId === 'none' ? null : formData.organizerClubId, // Send null if 'none'
    };
    // Don't send ID on create
    if (!eventId) {
      delete payload.id;
    }

    try {
      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `Failed to ${eventId ? 'update' : 'create'} event`);
      }

      onSave(); // Refresh parent list
      handleClose(); // Close modal on success
    } catch (err: any) {
      console.error(`Error ${eventId ? 'updating' : 'creating'} event:`, err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
      <Modal.Header>
        <Modal.Title>{eventId ? 'Edit Event' : 'Create New Event'}</Modal.Title>
        {/* Add CloseButton with better accessibility */}
        <CloseButton onClick={handleClose} aria-label="Close" />
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {isLoading && (
            <div className="text-center">
              <Spinner animation="border" />
              {' '}
              Loading event data...
            </div>
          )}
          {fetchError && (
            <Alert variant="warning">
              Could not load options:
              {fetchError}
            </Alert>
          )}
          {error && <Alert variant="danger">{error}</Alert>}

          {!isLoading && (
            <Row>
              {/* --- Core Details --- */}
              <Col md={12}>
                {' '}
                <h5 className="mb-3 mt-2">Core Details</h5>
                {' '}
              </Col>
              <Form.Group as={Col} md={12} className="mb-3" controlId="eventTitle">
                <Form.Label>
                  Title
                  <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </Form.Group>
              <Form.Group as={Col} md={12} className="mb-3" controlId="eventDescription">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Form.Group>

              {/* --- Date & Time --- */}
              <Col md={12}>
                {' '}
                <h5 className="mb-3 mt-3">Date & Time</h5>
                {' '}
              </Col>
              <Form.Group as={Col} md={6} className="mb-3" controlId="eventStartDateTime">
                <Form.Label>
                  Start Date & Time
                  <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="startDateTime"
                  value={formData.startDateTime}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </Form.Group>
              <Form.Group as={Col} md={6} className="mb-3" controlId="eventEndDateTime">
                <Form.Label>End Date & Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="endDateTime"
                  value={formData.endDateTime}
                  onChange={handleChange}
                  disabled={isSubmitting || formData.allDay} // Disable if all day
                  min={formData.startDateTime || ''}
                />
              </Form.Group>
              <Form.Group as={Col} md={12} className="mb-3" controlId="eventAllDay">
                <Form.Check
                  type="checkbox"
                  label="All Day Event"
                  name="allDay"
                  checked={formData.allDay}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Form.Group>

              {/* --- Location & Attendance --- */}
              <Col md={12}>
                {' '}
                <h5 className="mb-3 mt-3">Location & Attendance</h5>
                {' '}
              </Col>
              <Form.Group as={Col} md={6} className="mb-3" controlId="eventAttendanceType">
                <Form.Label>
                  Attendance Type
                  <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="attendanceType"
                  value={formData.attendanceType}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                >
                  {Object.values(AttendanceType).map(type => (
                    <option key={type} value={type}>{type.replace('_', ' ')}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group as={Col} md={6} className="mb-3" controlId="eventCostAdmission">
                <Form.Label>Cost / Admission</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Free, $10, Students Only"
                  name="costAdmission"
                  value={formData.costAdmission}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Form.Group>
              {formData.attendanceType !== AttendanceType.ONLINE && (
              <Form.Group as={Col} md={12} className="mb-3" controlId="eventLocation">
                <Form.Label>Location (Physical Address)</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Form.Group>
              )}
              {formData.attendanceType !== AttendanceType.IN_PERSON && (
              <Form.Group as={Col} md={12} className="mb-3" controlId="eventLocationVirtualUrl">
                <Form.Label>Virtual URL (Zoom, etc.)</Form.Label>
                <Form.Control
                  type="url"
                  name="locationVirtualUrl"
                  value={formData.locationVirtualUrl}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Form.Group>
              )}

              {/* --- Categories --- */}
              <Col md={12}>
                {' '}
                <h5 className="mb-3 mt-3">Categories</h5>
                {' '}
              </Col>
              <Form.Group as={Col} md={12} className="mb-3" controlId="eventCategories">
                <Form.Label>Select Categories (at least one recommended)</Form.Label>
                <div
                  className="d-flex flex-wrap"
                  style={{ maxHeight: '150px',
                    overflowY: 'auto',
                    border: '1px solid #dee2e6',
                    borderRadius: '.25rem',
                    padding: '.5rem' }}
                >
                  {categoriesList.length > 0 ? categoriesList.map(cat => (
                    <Form.Check
                      key={cat.id}
                      type="checkbox"
                      id={`cat-${cat.id}`}
                      label={cat.name}
                      name="categoryIds" // Name matches the state property
                      value={cat.id}
                      checked={formData.categoryIds.includes(cat.id)}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="me-3 mb-2"
                    />
                  )) : <small className="text-muted">Loading categories...</small>}
                </div>
              </Form.Group>

              {/* --- Organizer & Contact --- */}
              <Col md={12}>
                {' '}
                <h5 className="mb-3 mt-3">Organizer & Contact</h5>
                {' '}
              </Col>
              <Form.Group as={Col} md={6} className="mb-3" controlId="eventOrganizerClubId">
                <Form.Label>Host Club (Optional)</Form.Label>
                <Form.Select
                  name="organizerClubId"
                  value={formData.organizerClubId}
                  onChange={handleChange}
                  disabled={isSubmitting || clubsList.length === 0}
                >
                  <option value="none">-- None --</option>
                  {clubsList.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group as={Col} md={6} className="mb-3" controlId="eventOrganizerSponsor">
                <Form.Label>Organizer/Sponsor Name</Form.Label>
                <Form.Control
                  type="text"
                  name="organizerSponsor"
                  value={formData.organizerSponsor}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Form.Group>
              <Form.Group as={Col} md={4} className="mb-3" controlId="eventContactName">
                <Form.Label>Contact Name</Form.Label>
                <Form.Control
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Form.Group>
              <Form.Group as={Col} md={4} className="mb-3" controlId="eventContactEmail">
                <Form.Label>Contact Email</Form.Label>
                <Form.Control
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Form.Group>
              <Form.Group as={Col} md={4} className="mb-3" controlId="eventContactPhone">
                <Form.Label>Contact Phone</Form.Label>
                <Form.Control
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Form.Group>

              {/* --- Links & Status --- */}
              <Col md={12}>
                {' '}
                <h5 className="mb-3 mt-3">Links & Status</h5>
                {' '}
              </Col>
              <Form.Group as={Col} md={6} className="mb-3" controlId="eventPageUrl">
                <Form.Label>More Info URL</Form.Label>
                <Form.Control
                  type="url"
                  name="eventPageUrl"
                  value={formData.eventPageUrl}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Form.Group>
              <Form.Group as={Col} md={6} className="mb-3" controlId="eventStatus">
                <Form.Label>
                  Status
                  <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                >
                  {Object.values(ContentStatus).map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              {/* Add eventUrl if needed */}

            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Close
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting && (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                {' '}
                Saving...
              </>
            )}
            {!isSubmitting && (eventId ? 'Save Changes' : 'Create Event')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default EventEditor;
