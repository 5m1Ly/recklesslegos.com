-- CreateTable
CREATE TABLE "LegoSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setNumber" TEXT NOT NULL DEFAULT '',
    "theme" TEXT NOT NULL DEFAULT 'Star Wars',
    "year" INTEGER NOT NULL DEFAULT 0,
    "pieces" INTEGER NOT NULL DEFAULT 0,
    "retailPrice" INTEGER NOT NULL DEFAULT 0,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'With Bricks & Minifigs',
    "soldPrice" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegoSet_pkey" PRIMARY KEY ("id")
);
