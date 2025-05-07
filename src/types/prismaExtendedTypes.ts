import type {
  Category,
  ClubCategory,
  EventCategory,
  Club as PrismaClub,
  Event as PrismaEvent,
  User,
} from '@prisma/client';

export type EventWithDetails = PrismaEvent & {
  categories: (EventCategory & { category: Category })[];
  organizerClub: { name: string } | null;
};

export type ClubWithDetails = PrismaClub & {
  categories: (ClubCategory & { category: Category })[];
  favoritedBy: User[];
};
