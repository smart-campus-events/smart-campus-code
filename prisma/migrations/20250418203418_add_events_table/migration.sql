-- CreateTable
CREATE TABLE "Event" (
    "event_id" VARCHAR(255) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "start_datetime" TIMESTAMPTZ NOT NULL,
    "end_datetime" TIMESTAMPTZ,
    "all_day" BOOLEAN DEFAULT false,
    "location_text" TEXT,
    "location_building" VARCHAR(255),
    "location_room" VARCHAR(255),
    "location_address" TEXT,
    "location_virtual_url" TEXT,
    "description" TEXT,
    "category_tags" TEXT,
    "organizer_sponsor" VARCHAR(512),
    "event_url" TEXT NOT NULL,
    "event_page_url" TEXT,
    "cost_admission" VARCHAR(255),
    "contact_name" VARCHAR(255),
    "contact_phone" VARCHAR(50),
    "contact_email" VARCHAR(255),
    "last_scraped_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE INDEX "Event_start_datetime_idx" ON "Event"("start_datetime");
