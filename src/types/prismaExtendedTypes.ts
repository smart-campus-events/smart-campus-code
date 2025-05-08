import type {
  Category,
  ClubCategory,
  EventCategory,
  Club as PrismaClub,
  Event as PrismaEvent,
  RSVP,
} from '@prisma/client';

export type EventWithDetails = PrismaEvent & {
  categories: (EventCategory & { category: Category })[];
  organizerClub: { name: string } | null;
  rsvps: RSVP[];
};

export type ClubWithDetails = PrismaClub & {
  categories: (ClubCategory & { category: Category })[];
};
