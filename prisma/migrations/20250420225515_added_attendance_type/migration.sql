-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "attendance_type" "AttendanceType" NOT NULL DEFAULT 'IN_PERSON';
