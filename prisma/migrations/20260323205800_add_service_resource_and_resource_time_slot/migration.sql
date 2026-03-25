-- CreateTable
CREATE TABLE "ResourceTimeSlot" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "ResourceTimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceResource" (
    "serviceId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "ServiceResource_pkey" PRIMARY KEY ("serviceId","profileId")
);

-- CreateIndex
CREATE INDEX "ResourceTimeSlot_profileId_idx" ON "ResourceTimeSlot"("profileId");

-- AddForeignKey
ALTER TABLE "ResourceTimeSlot" ADD CONSTRAINT "ResourceTimeSlot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResource" ADD CONSTRAINT "ServiceResource_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResource" ADD CONSTRAINT "ServiceResource_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
