-- CreateEnum
CREATE TYPE "CIType" AS ENUM ('SET', 'MINIFIGURE');

-- CreateEnum
CREATE TYPE "CIThemes" AS ENUM ('STARWARS');

-- CreateEnum
CREATE TYPE "CISubthemes" AS ENUM ('STARWARS', 'FOUR_PLUS', 'AHSOKA', 'ANDOR', 'BATTLEFRONT', 'BOOK_PARTS', 'BOOST', 'BUILDABLE_FIGURES', 'COMIC_CON', 'DIORAMA_COLLECTION', 'EMPLOYEE_GIFT', 'EPISODE_I', 'EPISODE_II', 'EPISODE_III', 'EPISODE_IV', 'EPISODE_V', 'EPISODE_VI', 'EXCLUSIVE_MINIFIGS', 'GALAXYS_EDGE', 'HELMET_COLLECTION', 'JEDI_FALLEN_ORDER', 'LEGENDS', 'MAGAZINE_GIFTS', 'MASTER_BUILDER_SERIES', 'MECHS', 'MICROFIGHTERS', 'MINI_BUILDING_SET', 'MISCELLANEOUS', 'OBI_WAN_KENOBI', 'ORIGINAL_CONTENT', 'PLANET_SET', 'PROMOTIONAL', 'REBELS', 'REBUILD_THE_GALAXY', 'RESISTANCE', 'ROGUE_ONE', 'SEASONAL', 'SKELETON_CREW', 'SMART_PLAY', 'SOLO', 'STARSHIP_COLLECTION', 'TECHNIC', 'THE_BAD_BATCH', 'THE_BOOK_OF_BOBA_FETT', 'THE_CLONE_WARS', 'THE_FORCE_AWAKENS', 'THE_LAST_JEDI', 'THE_MANDALORIAN', 'THE_MANDALORIAN_AND_GROGU', 'THE_OLD_REPUBLIC', 'THE_RISE_OF_SKYWALKER', 'ULTIMATE_COLLECTOR_SERIES', 'UP_SCALED_MINIFIGURE', 'VALUE_PACKS', 'YOUNG_JEDI_ADVENTURES');

-- CreateEnum
CREATE TYPE "CIESource" AS ENUM ('BRICKECONOMY', 'BRICKSET', 'EBAY', 'MANUAL', 'CONTRIBUTORS');

-- CreateEnum
CREATE TYPE "CIECurrencies" AS ENUM ('EUR', 'USD');

-- CreateEnum
CREATE TYPE "CIECondition" AS ENUM ('BOXED', 'USED');

-- CreateEnum
CREATE TYPE "CIELocation" AS ENUM ('HOME', 'STORE', 'STOLEN', 'STORAGE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CIDisposition" AS ENUM ('HELD', 'SOLD', 'LAYAWAY', 'RECOVERED');

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "totalSets" INTEGER NOT NULL DEFAULT 0,
    "totalSetsValue" INTEGER NOT NULL DEFAULT 0,
    "totalFigs" INTEGER NOT NULL DEFAULT 0,
    "totalFigsValue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "legoRef" TEXT NOT NULL DEFAULT '',
    "type" "CIType" NOT NULL DEFAULT 'SET',
    "theme" "CIThemes" NOT NULL DEFAULT 'STARWARS',
    "subtheme" "CISubthemes" NOT NULL DEFAULT 'STARWARS',
    "year" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "pieces" INTEGER NOT NULL DEFAULT 2,
    "autoEvaluate" BOOLEAN NOT NULL DEFAULT true,
    "collectionId" TEXT NOT NULL,
    "setId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItemEvaluation" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "source" "CIESource" NOT NULL DEFAULT 'BRICKECONOMY',
    "currency" "CIECurrencies" NOT NULL DEFAULT 'USD',
    "retail" INTEGER NOT NULL DEFAULT 0,
    "value" INTEGER NOT NULL DEFAULT 0,
    "valueLow" INTEGER NOT NULL DEFAULT 0,
    "valueHigh" INTEGER NOT NULL DEFAULT 0,
    "boxed" INTEGER NOT NULL DEFAULT 0,
    "boxedLow" INTEGER NOT NULL DEFAULT 0,
    "boxedHigh" INTEGER NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,
    "usedLow" INTEGER NOT NULL DEFAULT 0,
    "usedHigh" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionItemEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItemEntry" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "condition" "CIECondition" NOT NULL DEFAULT 'USED',
    "location" "CIELocation" NOT NULL DEFAULT 'STORE',
    "disposition" "CIDisposition" NOT NULL DEFAULT 'HELD',
    "isCrack" BOOLEAN NOT NULL DEFAULT false,
    "isBuild" BOOLEAN NOT NULL DEFAULT false,
    "isBuildWOFigs" BOOLEAN NOT NULL DEFAULT false,
    "costPrice" INTEGER NOT NULL DEFAULT 0,
    "displayPrice" INTEGER NOT NULL DEFAULT 0,
    "sellPrice" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionItemEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollectionItemEvaluation_itemId_source_idx" ON "CollectionItemEvaluation"("itemId", "source");

-- CreateIndex
CREATE INDEX "CollectionItemEntry_itemId_idx" ON "CollectionItemEntry"("itemId");

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_setId_fkey" FOREIGN KEY ("setId") REFERENCES "CollectionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItemEvaluation" ADD CONSTRAINT "CollectionItemEvaluation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItemEntry" ADD CONSTRAINT "CollectionItemEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
