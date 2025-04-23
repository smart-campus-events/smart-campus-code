-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "purpose" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "primary_contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "website_url" TEXT,
    "instagram_url" TEXT,
    "facebook_url" TEXT,
    "twitter_url" TEXT,
    "meeting_time" TEXT,
    "meeting_location" TEXT,
    "join_info" TEXT,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Club_name_key" ON "Club"("name");
