/*
  Warnings:

  - You are about to drop the column `dateTime` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `durationMinutes` on the `Appointment` table. All the data in the column will be lost.
  - The `status` column on the `Appointment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `businessId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `BlockedTime` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STAFF', 'USER');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_serviceId_fkey";

-- DropIndex
DROP INDEX "unique_active_appointment";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "dateTime",
DROP COLUMN "durationMinutes",
ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "BlockedTime" ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "businessId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- CreateIndex
CREATE INDEX "Business_slug_idx" ON "Business"("slug");

-- CreateIndex
CREATE INDEX "Appointment_businessId_idx" ON "Appointment"("businessId");

-- CreateIndex
CREATE INDEX "Appointment_startTime_idx" ON "Appointment"("startTime");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "BlockedTime_businessId_idx" ON "BlockedTime"("businessId");

-- CreateIndex
CREATE INDEX "Service_businessId_idx" ON "Service"("businessId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedTime" ADD CONSTRAINT "BlockedTime_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
