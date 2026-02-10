/*
  Warnings:

  - A unique constraint covering the columns `[dateTime,status]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "appointment_unique_slot";

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_appointment" ON "Appointment"("dateTime", "status");
