CREATE TABLE "Offer" (
  "id" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "targetCustomer" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "originalPrice" INTEGER,
  "cost" INTEGER NOT NULL,
  "included" TEXT NOT NULL,
  "bonus" TEXT NOT NULL DEFAULT '',
  "scarcityText" TEXT NOT NULL DEFAULT '',
  "guarantee" TEXT NOT NULL DEFAULT '',
  "upsell" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "badge" TEXT,
  "seasonTags" TEXT[],
  "slotsLimit" INTEGER,
  "slotsClaimed" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OfferEvent" (
  "id" TEXT NOT NULL,
  "offerId" TEXT,
  "type" TEXT NOT NULL,
  "utm" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OfferEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Offer_number_key" ON "Offer"("number");
CREATE UNIQUE INDEX "Offer_slug_key" ON "Offer"("slug");
ALTER TABLE "OfferEvent" ADD CONSTRAINT "OfferEvent_offerId_fkey"
  FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
