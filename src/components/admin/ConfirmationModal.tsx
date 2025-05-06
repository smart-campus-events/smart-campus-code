'use client';

import React from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';

interface ConfirmationModalProps {
  show: boolean;
  handleClose: () => void;
  handleConfirm: () => void;
  title: string;
  body: React.ReactNode; // Allow JSX in body
  confirmVariant?: string; // e.g., 'danger', 'success', 'primary' (default: 'primary')
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean; // Show loading state on confirm button
  error?: string | null; // Optional error message to display
}

function ConfirmationModal({
  show,
  handleClose,
  handleConfirm,
  title,
  body,
  confirmVariant = 'primary',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming,
  error = null,
}: ConfirmationModalProps) {
  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        {body}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isConfirming}>
          {cancelText}
        </Button>
        <Button variant={confirmVariant} onClick={handleConfirm} disabled={isConfirming}>
          {isConfirming ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              {' '}
              Working...
            </>
          ) : (
            confirmText
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

ConfirmationModal.defaultProps = {
  isConfirming: false,
  error: null,
  confirmVariant: 'primary',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
};

export default ConfirmationModal;
