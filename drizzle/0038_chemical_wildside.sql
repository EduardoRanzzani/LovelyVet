ALTER TABLE "prescription_signatures" ADD COLUMN "certificate_subject" text NOT NULL;--> statement-breakpoint
ALTER TABLE "prescription_signatures" ADD COLUMN "certificate_common_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "prescription_signatures" ADD COLUMN "certificate_issuer" text NOT NULL;--> statement-breakpoint
ALTER TABLE "prescription_signatures" ADD COLUMN "certificate_serial_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "prescription_signatures" ADD COLUMN "certificate_fingerprint_sha256" text NOT NULL;--> statement-breakpoint
ALTER TABLE "prescription_signatures" ADD COLUMN "certificate_valid_from" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "prescription_signatures" ADD COLUMN "certificate_valid_to" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "prescription_signatures" DROP COLUMN "created_at";