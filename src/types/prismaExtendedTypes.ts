import type {
  Event as PrismaEvent,
  Club as PrismaClub,
  Category,
  EventCategory,
  ClubCategory,
} from '@prisma/client';

export type EventWithDetails = PrismaEvent & {
  categories: (EventCategory & { category: Category })[];
  organizerClub: { name: string } | null;
};

export type ClubWithDetails = PrismaClub & {
  categories: (ClubCategory & { category: Category })[];
};
