-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);
