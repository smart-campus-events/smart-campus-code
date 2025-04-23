/*
  Warnings:

  - You are about to drop the column `location_address` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "location_address",
ADD COLUMN     "location_campus" VARCHAR(255),
ALTER COLUMN "location_room" SET DATA TYPE TEXT;
