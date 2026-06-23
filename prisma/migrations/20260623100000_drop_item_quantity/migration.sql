-- Copy count is now derived from CollectionItemEntry rows (one per owned copy).

-- AlterTable
ALTER TABLE "CollectionItem" DROP COLUMN "quantity";
