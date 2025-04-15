'use client';

import React, { ReactNode } from 'react';
import { Card } from 'react-bootstrap';

interface SafeCardProps {
  className?: string;
  children: ReactNode;
}

interface SafeCardImageProps {
  src: string;
  alt: string;
  className?: string;
}

interface SafeCardBodyProps {
  className?: string;
  children: ReactNode;
}

interface SafeCardTitleProps {
  className?: string;
  children: ReactNode;
}

interface SafeCardTextProps {
  className?: string;
  children: ReactNode;
}

export const SafeCard: React.FC<SafeCardProps> = ({ className, children }) => {
  return <Card className={className}>{children}</Card>;
};

export const SafeCardImage: React.FC<SafeCardImageProps> = ({ src, alt, className }) => {
  return (
    <div className="card-img-top-wrapper">
      <img src={src} alt={alt} className={`card-img-top ${className || ''}`} />
    </div>
  );
};

export const SafeCardBody: React.FC<SafeCardBodyProps> = ({ className, children }) => {
  return <div className={`card-body ${className || ''}`}>{children}</div>;
};

export const SafeCardTitle: React.FC<SafeCardTitleProps> = ({ className, children }) => {
  return <h5 className={`card-title ${className || ''}`}>{children}</h5>;
};

export const SafeCardText: React.FC<SafeCardTextProps> = ({ className, children }) => {
  return <p className={`card-text ${className || ''}`}>{children}</p>;
};

// For convenience, export all components as a single object
const SafeCardComponents = {
  Card: SafeCard,
  Image: SafeCardImage,
  Body: SafeCardBody,
  Title: SafeCardTitle,
  Text: SafeCardText,
};

export default SafeCardComponents; 