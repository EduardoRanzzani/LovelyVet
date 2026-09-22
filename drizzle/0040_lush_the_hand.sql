ALTER TABLE "prescription_signatures" ADD COLUMN "validation_token" text;--> statement-breakpoint
UPDATE "prescription_signatures"
SET "validation_token" = UPPER(SUBSTRING(REPLACE("id"::text, '-', '') FROM 1 FOR 12));--> statement-breakpoint
ALTER TABLE "prescription_signatures" ALTER COLUMN "validation_token" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "prescription_signatures_validation_token_unique" ON "prescription_signatures" USING btree ("validation_token");
