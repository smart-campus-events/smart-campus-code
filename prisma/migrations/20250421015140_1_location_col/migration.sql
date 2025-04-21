/*
  Warnings:

  - You are about to drop the column `location_building` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `location_campus` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `location_room` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `location_text` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "location_building",
DROP COLUMN "location_campus",
DROP COLUMN "location_room",
DROP COLUMN "location_text",
ADD COLUMN     "location" TEXT;
