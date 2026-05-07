-- AlterTable
ALTER TABLE "MenuPromotion" ADD COLUMN     "discountPercent" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "MenuPromotionItem" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MenuPromotionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuPromotionItem_promotionId_idx" ON "MenuPromotionItem"("promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuPromotionItem_promotionId_itemId_key" ON "MenuPromotionItem"("promotionId", "itemId");

-- AddForeignKey
ALTER TABLE "MenuPromotionItem" ADD CONSTRAINT "MenuPromotionItem_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "MenuPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPromotionItem" ADD CONSTRAINT "MenuPromotionItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
