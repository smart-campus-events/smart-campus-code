import type {
  Event as PrismaEvent,
  Club as PrismaClub,
  Category,
  EventCategory,
  ClubCategory,
  RSVP,
  User,
} from '@prisma/client';

export type EventWithDetails = PrismaEvent & {
  categories: (EventCategory & { category: Category })[];
  organizerClub: { name: string } | null;
  rsvps: RSVP[];
};

export type ClubWithDetails = PrismaClub & {
  categories: (ClubCategory & { category: Category })[];
  favoritedBy: User[];
};
