-- CreateTable
CREATE TABLE "LegoMinifig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minifigNumber" TEXT NOT NULL DEFAULT '',
    "theme" TEXT NOT NULL DEFAULT 'Star Wars',
    "year" INTEGER NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "retailPrice" INTEGER NOT NULL DEFAULT 0,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'With Bricks & Minifigs',
    "soldPrice" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegoMinifig_pkey" PRIMARY KEY ("id")
);
