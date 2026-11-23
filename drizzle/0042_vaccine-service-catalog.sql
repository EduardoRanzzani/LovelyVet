ALTER TABLE "services" ADD COLUMN "is_vaccine" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vaccines" ADD COLUMN "service_id" uuid;--> statement-breakpoint
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;