/*
  Warnings:

  - You are about to drop the column `category` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `contact_email` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `facebook_url` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `instagram_url` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `join_info` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `logo_url` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `meeting_location` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `meeting_time` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `primary_contact_name` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `twitter_url` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `website_url` on the `Club` table. All the data in the column will be lost.
  - The primary key for the `Event` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `all_day` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `attendance_type` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `category_tags` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `contact_email` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `contact_name` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `contact_phone` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `cost_admission` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `end_datetime` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `event_id` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `event_page_url` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `event_url` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `last_scraped_at` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `location_virtual_url` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `organizer_club_id` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `organizer_sponsor` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `start_datetime` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `about_me` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `age_range` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `avatar_url` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `comfort_level` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email_notifications` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `google_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `graduation_year` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `housing_status` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `onboarding_complete` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Interest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Stuff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ClubInterests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EventInterests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EventRsvps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserInterests` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Club` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Event` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `startDateTime` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_organizer_club_id_fkey";

-- DropForeignKey
ALTER TABLE "_ClubInterests" DROP CONSTRAINT "_ClubInterests_A_fkey";

-- DropForeignKey
ALTER TABLE "_ClubInterests" DROP CONSTRAINT "_ClubInterests_B_fkey";

-- DropForeignKey
ALTER TABLE "_EventInterests" DROP CONSTRAINT "_EventInterests_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventInterests" DROP CONSTRAINT "_EventInterests_B_fkey";

-- DropForeignKey
ALTER TABLE "_EventRsvps" DROP CONSTRAINT "_EventRsvps_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventRsvps" DROP CONSTRAINT "_EventRsvps_B_fkey";

-- DropForeignKey
ALTER TABLE "_UserInterests" DROP CONSTRAINT "_UserInterests_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserInterests" DROP CONSTRAINT "_UserInterests_B_fkey";

-- DropIndex
DROP INDEX "Event_start_datetime_idx";

-- DropIndex
DROP INDEX "User_google_id_key";

-- AlterTable
ALTER TABLE "Club" DROP COLUMN "category",
DROP COLUMN "contact_email",
DROP COLUMN "created_at",
DROP COLUMN "facebook_url",
DROP COLUMN "instagram_url",
DROP COLUMN "join_info",
DROP COLUMN "logo_url",
DROP COLUMN "meeting_location",
DROP COLUMN "meeting_time",
DROP COLUMN "primary_contact_name",
DROP COLUMN "twitter_url",
DROP COLUMN "updated_at",
DROP COLUMN "website_url",
ADD COLUMN     "categoryDescription" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "joinInfo" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "meetingLocation" TEXT,
ADD COLUMN     "meetingTime" TEXT,
ADD COLUMN     "primaryContactName" TEXT,
ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedByUserId" TEXT,
ADD COLUMN     "twitterUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "websiteUrl" TEXT;

-- AlterTable
ALTER TABLE "Event" DROP CONSTRAINT "Event_pkey",
DROP COLUMN "all_day",
DROP COLUMN "attendance_type",
DROP COLUMN "category_tags",
DROP COLUMN "contact_email",
DROP COLUMN "contact_name",
DROP COLUMN "contact_phone",
DROP COLUMN "cost_admission",
DROP COLUMN "created_at",
DROP COLUMN "end_datetime",
DROP COLUMN "event_id",
DROP COLUMN "event_page_url",
DROP COLUMN "event_url",
DROP COLUMN "last_scraped_at",
DROP COLUMN "location_virtual_url",
DROP COLUMN "organizer_club_id",
DROP COLUMN "organizer_sponsor",
DROP COLUMN "start_datetime",
DROP COLUMN "updated_at",
ADD COLUMN     "allDay" BOOLEAN DEFAULT false,
ADD COLUMN     "attendanceType" "AttendanceType" NOT NULL DEFAULT 'IN_PERSON',
ADD COLUMN     "categoryTags" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "costAdmission" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endDateTime" TIMESTAMP(3),
ADD COLUMN     "eventPageUrl" TEXT,
ADD COLUMN     "eventUrl" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "lastScrapedAt" TIMESTAMP(3),
ADD COLUMN     "locationVirtualUrl" TEXT,
ADD COLUMN     "organizerClubId" TEXT,
ADD COLUMN     "organizerSponsor" TEXT,
ADD COLUMN     "startDateTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedByUserId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "title" SET DATA TYPE TEXT,
ADD CONSTRAINT "Event_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "about_me",
DROP COLUMN "age_range",
DROP COLUMN "avatar_url",
DROP COLUMN "comfort_level",
DROP COLUMN "created_at",
DROP COLUMN "email_notifications",
DROP COLUMN "first_name",
DROP COLUMN "google_id",
DROP COLUMN "graduation_year",
DROP COLUMN "housing_status",
DROP COLUMN "last_name",
DROP COLUMN "onboarding_complete",
DROP COLUMN "updated_at",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "comfortLevel" INTEGER,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "graduationYear" INTEGER,
ADD COLUMN     "housingStatus" "HousingStatus",
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- DropTable
DROP TABLE "Interest";

-- DropTable
DROP TABLE "Stuff";

-- DropTable
DROP TABLE "_ClubInterests";

-- DropTable
DROP TABLE "_EventInterests";

-- DropTable
DROP TABLE "_EventRsvps";

-- DropTable
DROP TABLE "_UserInterests";

-- DropEnum
DROP TYPE "Condition";

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RSVP" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RSVP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInterest" (
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("userId","categoryId")
);

-- CreateTable
CREATE TABLE "ClubCategory" (
    "clubId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubCategory_pkey" PRIMARY KEY ("clubId","categoryId")
);

-- CreateTable
CREATE TABLE "EventCategory" (
    "eventId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventCategory_pkey" PRIMARY KEY ("eventId","categoryId")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "RSVP_userId_idx" ON "RSVP"("userId");

-- CreateIndex
CREATE INDEX "RSVP_eventId_idx" ON "RSVP"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "RSVP_userId_eventId_key" ON "RSVP"("userId", "eventId");

-- CreateIndex
CREATE INDEX "UserInterest_userId_idx" ON "UserInterest"("userId");

-- CreateIndex
CREATE INDEX "UserInterest_categoryId_idx" ON "UserInterest"("categoryId");

-- CreateIndex
CREATE INDEX "ClubCategory_clubId_idx" ON "ClubCategory"("clubId");

-- CreateIndex
CREATE INDEX "ClubCategory_categoryId_idx" ON "ClubCategory"("categoryId");

-- CreateIndex
CREATE INDEX "EventCategory_eventId_idx" ON "EventCategory"("eventId");

-- CreateIndex
CREATE INDEX "EventCategory_categoryId_idx" ON "EventCategory"("categoryId");

-- CreateIndex
CREATE INDEX "Club_submittedByUserId_idx" ON "Club"("submittedByUserId");

-- CreateIndex
CREATE INDEX "Event_startDateTime_idx" ON "Event"("startDateTime");

-- CreateIndex
CREATE INDEX "Event_submittedByUserId_idx" ON "Event"("submittedByUserId");

-- CreateIndex
CREATE INDEX "Event_organizerClubId_idx" ON "Event"("organizerClubId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerClubId_fkey" FOREIGN KEY ("organizerClubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubCategory" ADD CONSTRAINT "ClubCategory_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubCategory" ADD CONSTRAINT "ClubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCategory" ADD CONSTRAINT "EventCategory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCategory" ADD CONSTRAINT "EventCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
