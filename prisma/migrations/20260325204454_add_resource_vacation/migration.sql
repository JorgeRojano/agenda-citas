-- CreateTable
CREATE TABLE "ResourceVacation" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceVacation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceVacation_profileId_idx" ON "ResourceVacation"("profileId");

-- AddForeignKey
ALTER TABLE "ResourceVacation" ADD CONSTRAINT "ResourceVacation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
