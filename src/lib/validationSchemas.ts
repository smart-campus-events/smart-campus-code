/* import * as Yup from 'yup';

export const AddStuffSchema = Yup.object({
  name: Yup.string().required(),
  quantity: Yup.number().positive().required(),
  condition: Yup.string().oneOf(['excellent', 'good', 'fair', 'poor']).required(),
  owner: Yup.string().required(),
});

export const EditStuffSchema = Yup.object({
  id: Yup.number().required(),
  name: Yup.string().required(),
  quantity: Yup.number().positive().required(),
  condition: Yup.string().oneOf(['excellent', 'good', 'fair', 'poor']).required(),
  owner: Yup.string().required(),
});
*/

import { z } from 'zod';
import { AttendanceType, ContentStatus } from '@prisma/client';

export const EventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').max(100, 'Title is too long'),
  description: z.string().optional(),
  startDateTime: z.string().or(z.date()), // Accepts both string and Date objects
  endDateTime: z.string().or(z.date()).optional(),
  allDay: z.boolean().optional(),
  attendanceType: z.nativeEnum(AttendanceType).optional(),
  location: z.string().optional(),
  locationVirtualUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  eventUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
  eventPageUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
  organizerClubId: z.string().cuid('Invalid club ID format').optional(),
  status: z.nativeEnum(ContentStatus).optional(),
  categoryIds: z.array(z.string().cuid('Invalid category ID format')).optional(),
});

export const UpdateEventSchema = EventSchema.partial().extend({
  id: z.string().cuid('Invalid event ID format'),
});

export const ClubEventSchema = EventSchema.omit({ organizerClubId: true });

// Future schemas for other entities can be added here
