ALTER TABLE "care_reminders" ADD COLUMN "appointment_id" uuid;--> statement-breakpoint
ALTER TABLE "care_reminders" ADD CONSTRAINT "care_reminders_appointment_id_unique" UNIQUE("appointment_id");--> statement-breakpoint
ALTER TABLE "care_reminders" ADD CONSTRAINT "care_reminders_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;
