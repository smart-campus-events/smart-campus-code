'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function TestEventsAPI() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [clubEvents, setClubEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form data for creating events
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    location: '',
  });

  // Load clubs on component mount
  useEffect(() => {
    async function fetchClubs() {
      try {
        const response = await fetch('/api/clubs');
        if (!response.ok) throw new Error('Failed to fetch clubs');

        const data = await response.json();
        setClubs(data);
      } catch (err) {
        console.error('Error fetching clubs:', err);
        setError('Failed to load clubs');
      }
    }

    fetchClubs();
  }, []);

  // Function to fetch all events
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all events including pending ones
  const fetchAllEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/events?status=all');
      if (!response.ok) throw new Error('Failed to fetch all events');

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching all events:', err);
      setError('Failed to load all events');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch a single event
  const fetchEvent = async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch event details');

      const data = await response.json();
      setSelectedEvent(data);
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch events for a specific club
  const fetchClubEvents = async (clubId: string) => {
    if (!clubId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clubs/${clubId}/events`);
      if (!response.ok) throw new Error('Failed to fetch club events');

      const data = await response.json();
      setClubEvents(data);
    } catch (err) {
      console.error('Error fetching club events:', err);
      setError('Failed to load club events');
    } finally {
      setLoading(false);
    }
  };

  // Function to create a new event
  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setError('You must be logged in to create events');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }

      await response.json();

      // Reset form and refresh events list
      setNewEvent({
        title: '',
        description: '',
        startDateTime: '',
        endDateTime: '',
        location: '',
      });

      fetchEvents();
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  // Function to create a new event for a specific club
  const createClubEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setError('You must be logged in to create events');
      return;
    }

    if (!selectedClub) {
      setError('Please select a club');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clubs/${selectedClub}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create club event');
      }

      await response.json();

      // Reset form and refresh club events list
      setNewEvent({
        title: '',
        description: '',
        startDateTime: '',
        endDateTime: '',
        location: '',
      });

      fetchClubEvents(selectedClub);
    } catch (err: any) {
      console.error('Error creating club event:', err);
      setError(err.message || 'Failed to create club event');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  // Handle club selection change
  const handleClubChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clubId = e.target.value;
    setSelectedClub(clubId);
    if (clubId) {
      fetchClubEvents(clubId);
    } else {
      setClubEvents([]);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Events API</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Create New Event</h2>
        <form onSubmit={createEvent} className="space-y-4">
          <div>
            <label htmlFor="title" className="block mb-1">Title:</label>
            <input
              id="title"
              type="text"
              name="title"
              value={newEvent.title}
              onChange={handleInputChange}
              className="border p-2 w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block mb-1">Description:</label>
            <textarea
              id="description"
              name="description"
              value={newEvent.description}
              onChange={handleInputChange}
              className="border p-2 w-full"
            />
          </div>
          <div>
            <label htmlFor="startDateTime" className="block mb-1">Start Date/Time:</label>
            <input
              id="startDateTime"
              type="datetime-local"
              name="startDateTime"
              value={newEvent.startDateTime}
              onChange={handleInputChange}
              className="border p-2 w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="endDateTime" className="block mb-1">End Date/Time:</label>
            <input
              id="endDateTime"
              type="datetime-local"
              name="endDateTime"
              value={newEvent.endDateTime}
              onChange={handleInputChange}
              className="border p-2 w-full"
            />
          </div>
          <div>
            <label htmlFor="location" className="block mb-1">Location:</label>
            <input
              id="location"
              type="text"
              name="location"
              value={newEvent.location}
              onChange={handleInputChange}
              className="border p-2 w-full"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Test Event API Operations</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchEvents}
              className="bg-blue-500 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              Fetch Approved Events
            </button>
            <button
              type="button"
              onClick={fetchAllEvents}
              className="bg-green-500 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              Fetch All Events (Including Pending)
            </button>
            {loading && <span className="animate-pulse">Loading...</span>}
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Create Club Event</h2>
            <div className="mb-4">
              <label htmlFor="clubSelect" className="block mb-1">Select Club:</label>
              <select
                id="clubSelect"
                value={selectedClub}
                onChange={handleClubChange}
                className="border p-2 w-full"
              >
                <option value="">-- Select a Club --</option>
                {clubs.map(club => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedClub && (
              <form onSubmit={createClubEvent} className="space-y-4">
                <div>
                  <label htmlFor="clubTitle" className="block mb-1">Title:</label>
                  <input
                    id="clubTitle"
                    type="text"
                    name="title"
                    value={newEvent.title}
                    onChange={handleInputChange}
                    className="border p-2 w-full"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="clubDescription" className="block mb-1">Description:</label>
                  <textarea
                    id="clubDescription"
                    name="description"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    className="border p-2 w-full"
                  />
                </div>
                <div>
                  <label htmlFor="clubStartDateTime" className="block mb-1">Start Date/Time:</label>
                  <input
                    id="clubStartDateTime"
                    type="datetime-local"
                    name="startDateTime"
                    value={newEvent.startDateTime}
                    onChange={handleInputChange}
                    className="border p-2 w-full"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="clubEndDateTime" className="block mb-1">End Date/Time:</label>
                  <input
                    id="clubEndDateTime"
                    type="datetime-local"
                    name="endDateTime"
                    value={newEvent.endDateTime}
                    onChange={handleInputChange}
                    className="border p-2 w-full"
                  />
                </div>
                <div>
                  <label htmlFor="clubLocation" className="block mb-1">Location:</label>
                  <input
                    id="clubLocation"
                    type="text"
                    name="location"
                    value={newEvent.location}
                    onChange={handleInputChange}
                    className="border p-2 w-full"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Club Event'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">All Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(event => (
            <div key={event.id} className="border p-4 rounded">
              <h3 className="font-semibold">{event.title}</h3>
              <p className="text-sm">
                Date:
                {new Date(event.startDateTime).toLocaleString()}
              </p>
              {event.organizerClub && (
                <p className="text-sm">
                  Club:
                  {event.organizerClub.name}
                </p>
              )}
              <button
                type="button"
                onClick={() => fetchEvent(event.id)}
                className="bg-gray-200 px-2 py-1 rounded text-sm mt-2"
              >
                View Details
              </button>
            </div>
          ))}
        </div>

        {events.length === 0 && !loading && (
          <p className="text-gray-500">No events to display. Click &quot;Fetch Events&quot; to load.</p>
        )}
      </div>

      {selectedClub && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Club Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubEvents.map(event => (
              <div key={event.id} className="border p-4 rounded">
                <h3 className="font-semibold">{event.title}</h3>
                <p className="text-sm">
                  Date:
                  {new Date(event.startDateTime).toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={() => fetchEvent(event.id)}
                  className="bg-gray-200 px-2 py-1 rounded text-sm mt-2"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>

          {clubEvents.length === 0 && !loading && (
            <p className="text-gray-500">No events for this club.</p>
          )}
        </div>
      )}

      {selectedEvent && (
        <div className="mb-8 border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Event Details</h2>
          <h3 className="font-bold text-lg">{selectedEvent.title}</h3>
          <p className="mb-2">{selectedEvent.description}</p>
          <p>
            <strong>Start:</strong>
            {' '}
            {new Date(selectedEvent.startDateTime).toLocaleString()}
          </p>
          {selectedEvent.endDateTime && (
            <p>
              <strong>End:</strong>
              {' '}
              {new Date(selectedEvent.endDateTime).toLocaleString()}
            </p>
          )}
          {selectedEvent.location && (
            <p>
              <strong>Location:</strong>
              {' '}
              {selectedEvent.location}
            </p>
          )}
          {selectedEvent.organizerClub && (
            <p>
              <strong>Organized by:</strong>
              {' '}
              {selectedEvent.organizerClub.name}
            </p>
          )}
          <p>
            <strong>Status:</strong>
            {' '}
            {selectedEvent.status}
          </p>

          <div className="mt-2">
            <strong>Categories:</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {selectedEvent.categories?.map((cat: any) => (
                <span key={cat.categoryId} className="bg-blue-100 px-2 py-1 rounded text-sm">
                  {cat.category.name}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedEvent(null)}
            className="bg-gray-200 px-2 py-1 rounded text-sm mt-4"
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  );
}
