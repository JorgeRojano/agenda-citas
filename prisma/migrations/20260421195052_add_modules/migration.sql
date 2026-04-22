-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessModule" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessModule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Module_key_key" ON "Module"("key");

-- CreateIndex
CREATE INDEX "BusinessModule_businessId_idx" ON "BusinessModule"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessModule_businessId_moduleKey_key" ON "BusinessModule"("businessId", "moduleKey");

-- AddForeignKey
ALTER TABLE "BusinessModule" ADD CONSTRAINT "BusinessModule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessModule" ADD CONSTRAINT "BusinessModule_moduleKey_fkey" FOREIGN KEY ("moduleKey") REFERENCES "Module"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
