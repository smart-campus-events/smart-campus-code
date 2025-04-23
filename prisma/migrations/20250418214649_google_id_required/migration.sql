/*
  Warnings:

  - You are about to drop the column `organizerClubId` on the `Event` table. All the data in the column will be lost.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `google_id` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_organizerClubId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "organizerClubId",
ADD COLUMN     "organizer_club_id" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL,
ALTER COLUMN "google_id" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizer_club_id_fkey" FOREIGN KEY ("organizer_club_id") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
