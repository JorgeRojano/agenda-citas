/*
  Warnings:

  - You are about to drop the `BusinessSchedule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BusinessSchedule" DROP CONSTRAINT "BusinessSchedule_businessId_fkey";

-- DropTable
DROP TABLE "BusinessSchedule";

-- CreateTable
CREATE TABLE "BusinessTimeSlot" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessTimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessTimeSlot_businessId_dayOfWeek_idx" ON "BusinessTimeSlot"("businessId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "BusinessTimeSlot" ADD CONSTRAINT "BusinessTimeSlot_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
