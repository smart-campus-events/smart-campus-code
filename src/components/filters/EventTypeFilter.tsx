import React, { useState, useEffect } from 'react';
import { Dropdown } from 'react-bootstrap';
import { Calendar3 } from 'react-bootstrap-icons';

// Define attendance types that match the Prisma schema
const ATTENDANCE_TYPES = [
  { value: 'IN_PERSON', label: 'In Person' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HYBRID', label: 'Hybrid' },
];

interface EventTypeFilterProps {
  onTypeChange: (type: string | null) => void;
  activeType: string | null;
}

const EventTypeFilter: React.FC<EventTypeFilterProps> = ({ onTypeChange, activeType }) => {
  const [selectedType, setSelectedType] = useState<string | null>(activeType);

  // Update local state when props change
  useEffect(() => {
    setSelectedType(activeType);
  }, [activeType]);

  const handleTypeSelect = (eventKey: string | null) => {
    // If clicking the already selected type, deselect it
    const newType = eventKey === selectedType ? null : eventKey;
    setSelectedType(newType);
    onTypeChange(newType);
  };

  // Find the label for the selected type
  const getSelectedTypeLabel = () => {
    if (!selectedType) return 'All Event Types';
    const selected = ATTENDANCE_TYPES.find(type => type.value === selectedType);
    return selected ? selected.label : 'All Event Types';
  };

  return (
    <Dropdown onSelect={handleTypeSelect}>
      <Dropdown.Toggle variant="light" className="w-100 text-start d-flex align-items-center">
        <Calendar3 className="me-2" />
        <span className="me-auto">{getSelectedTypeLabel()}</span>
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item
          eventKey={null as any}
          active={selectedType === null}
          onClick={() => handleTypeSelect(null)}
        >
          All Event Types
        </Dropdown.Item>
        {ATTENDANCE_TYPES.map(type => (
          <Dropdown.Item
            key={type.value}
            eventKey={type.value}
            active={selectedType === type.value}
          >
            {type.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default EventTypeFilter;
