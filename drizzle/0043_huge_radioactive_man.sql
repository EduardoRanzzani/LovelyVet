ALTER TABLE "vaccines" ADD COLUMN "appointment_id" uuid;--> statement-breakpoint
ALTER TABLE "vaccines" ADD COLUMN "operation_key" uuid;--> statement-breakpoint
ALTER TABLE "vaccines" ADD COLUMN "price_at_application_in_cents" integer;--> statement-breakpoint
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_operation_key_unique" UNIQUE("operation_key");