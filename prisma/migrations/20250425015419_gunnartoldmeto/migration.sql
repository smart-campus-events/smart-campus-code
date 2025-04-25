/*
  Warnings:

  - You are about to drop the column `categoryDescription` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `contactEmail` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `facebookUrl` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `instagramUrl` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `joinInfo` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `meetingLocation` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `meetingTime` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `primaryContactName` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `submittedByUserId` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `twitterUrl` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `websiteUrl` on the `Club` table. All the data in the column will be lost.
  - The primary key for the `Event` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `allDay` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `attendanceType` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `categoryTags` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `contactEmail` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `contactName` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `costAdmission` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `endDateTime` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `eventPageUrl` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `eventUrl` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `lastScrapedAt` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `locationVirtualUrl` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `organizerClubId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `organizerSponsor` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `startDateTime` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `submittedByUserId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Event` table. All the data in the column will be lost.
  - You are about to alter the column `title` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(512)`.
  - You are about to drop the column `avatarUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `comfortLevel` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailNotifications` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `graduationYear` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `housingStatus` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `onboardingComplete` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClubCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RSVP` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserInterest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[google_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Club` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contact_email` to the `Club` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primary_contact_name` to the `Club` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Club` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_id` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_url` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_scraped_at` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_datetime` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('excellent', 'good', 'fair', 'poor');

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Club" DROP CONSTRAINT "Club_submittedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "ClubCategory" DROP CONSTRAINT "ClubCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ClubCategory" DROP CONSTRAINT "ClubCategory_clubId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_organizerClubId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_submittedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "EventCategory" DROP CONSTRAINT "EventCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "EventCategory" DROP CONSTRAINT "EventCategory_eventId_fkey";

-- DropForeignKey
ALTER TABLE "RSVP" DROP CONSTRAINT "RSVP_eventId_fkey";

-- DropForeignKey
ALTER TABLE "RSVP" DROP CONSTRAINT "RSVP_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserInterest" DROP CONSTRAINT "UserInterest_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "UserInterest" DROP CONSTRAINT "UserInterest_userId_fkey";

-- DropIndex
DROP INDEX "Club_submittedByUserId_idx";

-- DropIndex
DROP INDEX "Event_organizerClubId_idx";

-- DropIndex
DROP INDEX "Event_startDateTime_idx";

-- DropIndex
DROP INDEX "Event_submittedByUserId_idx";

-- DropIndex
DROP INDEX "User_googleId_key";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "Club" DROP COLUMN "categoryDescription",
DROP COLUMN "contactEmail",
DROP COLUMN "createdAt",
DROP COLUMN "facebookUrl",
DROP COLUMN "instagramUrl",
DROP COLUMN "joinInfo",
DROP COLUMN "logoUrl",
DROP COLUMN "meetingLocation",
DROP COLUMN "meetingTime",
DROP COLUMN "primaryContactName",
DROP COLUMN "status",
DROP COLUMN "submittedByUserId",
DROP COLUMN "twitterUrl",
DROP COLUMN "updatedAt",
DROP COLUMN "websiteUrl",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "contact_email" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "facebook_url" TEXT,
ADD COLUMN     "instagram_url" TEXT,
ADD COLUMN     "join_info" TEXT,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "meeting_location" TEXT,
ADD COLUMN     "meeting_time" TEXT,
ADD COLUMN     "primary_contact_name" TEXT NOT NULL,
ADD COLUMN     "twitter_url" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "website_url" TEXT;

-- AlterTable
ALTER TABLE "Event" DROP CONSTRAINT "Event_pkey",
DROP COLUMN "allDay",
DROP COLUMN "attendanceType",
DROP COLUMN "categoryTags",
DROP COLUMN "contactEmail",
DROP COLUMN "contactName",
DROP COLUMN "contactPhone",
DROP COLUMN "costAdmission",
DROP COLUMN "createdAt",
DROP COLUMN "endDateTime",
DROP COLUMN "eventPageUrl",
DROP COLUMN "eventUrl",
DROP COLUMN "id",
DROP COLUMN "lastScrapedAt",
DROP COLUMN "locationVirtualUrl",
DROP COLUMN "organizerClubId",
DROP COLUMN "organizerSponsor",
DROP COLUMN "startDateTime",
DROP COLUMN "status",
DROP COLUMN "submittedByUserId",
DROP COLUMN "updatedAt",
ADD COLUMN     "all_day" BOOLEAN DEFAULT false,
ADD COLUMN     "attendance_type" "AttendanceType" NOT NULL DEFAULT 'IN_PERSON',
ADD COLUMN     "category_tags" TEXT,
ADD COLUMN     "contact_email" VARCHAR(255),
ADD COLUMN     "contact_name" VARCHAR(255),
ADD COLUMN     "contact_phone" VARCHAR(50),
ADD COLUMN     "cost_admission" VARCHAR(255),
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "end_datetime" TIMESTAMPTZ,
ADD COLUMN     "event_id" VARCHAR(255) NOT NULL,
ADD COLUMN     "event_page_url" TEXT,
ADD COLUMN     "event_url" TEXT NOT NULL,
ADD COLUMN     "last_scraped_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "location_virtual_url" TEXT,
ADD COLUMN     "organizer_club_id" TEXT,
ADD COLUMN     "organizer_sponsor" VARCHAR(512),
ADD COLUMN     "start_datetime" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL,
ALTER COLUMN "title" SET DATA TYPE VARCHAR(512),
ADD CONSTRAINT "Event_pkey" PRIMARY KEY ("event_id");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarUrl",
DROP COLUMN "comfortLevel",
DROP COLUMN "createdAt",
DROP COLUMN "emailNotifications",
DROP COLUMN "emailVerified",
DROP COLUMN "firstName",
DROP COLUMN "googleId",
DROP COLUMN "graduationYear",
DROP COLUMN "housingStatus",
DROP COLUMN "isAdmin",
DROP COLUMN "lastName",
DROP COLUMN "onboardingComplete",
DROP COLUMN "updatedAt",
DROP COLUMN "username",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "comfort_level" INTEGER,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email_notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "google_id" TEXT,
ADD COLUMN     "graduation_year" INTEGER,
ADD COLUMN     "housing_status" "HousingStatus",
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ALTER COLUMN "password" SET NOT NULL;

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "ClubCategory";

-- DropTable
DROP TABLE "EventCategory";

-- DropTable
DROP TABLE "RSVP";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "UserInterest";

-- DropTable
DROP TABLE "VerificationToken";

-- CreateTable
CREATE TABLE "Stuff" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "condition" "Condition" NOT NULL DEFAULT 'good',
    "owner" TEXT NOT NULL,

    CONSTRAINT "Stuff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EventRsvps" (
    "A" VARCHAR(255) NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_EventInterests" (
    "A" VARCHAR(255) NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ClubInterests" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_UserInterests" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Interest_name_key" ON "Interest"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_EventRsvps_AB_unique" ON "_EventRsvps"("A", "B");

-- CreateIndex
CREATE INDEX "_EventRsvps_B_index" ON "_EventRsvps"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EventInterests_AB_unique" ON "_EventInterests"("A", "B");

-- CreateIndex
CREATE INDEX "_EventInterests_B_index" ON "_EventInterests"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ClubInterests_AB_unique" ON "_ClubInterests"("A", "B");

-- CreateIndex
CREATE INDEX "_ClubInterests_B_index" ON "_ClubInterests"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_UserInterests_AB_unique" ON "_UserInterests"("A", "B");

-- CreateIndex
CREATE INDEX "_UserInterests_B_index" ON "_UserInterests"("B");

-- CreateIndex
CREATE INDEX "Event_start_datetime_idx" ON "Event"("start_datetime");

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizer_club_id_fkey" FOREIGN KEY ("organizer_club_id") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventRsvps" ADD CONSTRAINT "_EventRsvps_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventRsvps" ADD CONSTRAINT "_EventRsvps_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventInterests" ADD CONSTRAINT "_EventInterests_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventInterests" ADD CONSTRAINT "_EventInterests_B_fkey" FOREIGN KEY ("B") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClubInterests" ADD CONSTRAINT "_ClubInterests_A_fkey" FOREIGN KEY ("A") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClubInterests" ADD CONSTRAINT "_ClubInterests_B_fkey" FOREIGN KEY ("B") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserInterests" ADD CONSTRAINT "_UserInterests_A_fkey" FOREIGN KEY ("A") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserInterests" ADD CONSTRAINT "_UserInterests_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
