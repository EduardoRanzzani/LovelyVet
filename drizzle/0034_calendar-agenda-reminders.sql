CREATE TYPE "public"."calendar_event_type" AS ENUM('personal');--> statement-breakpoint
CREATE TYPE "public"."care_reminder_status" AS ENUM('pending', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."care_reminder_type" AS ENUM('vaccine');--> statement-breakpoint
CREATE TYPE "public"."vaccine_next_dose_type" AS ENUM('booster', 'annual', 'none');--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"type" "calendar_event_type" DEFAULT 'personal' NOT NULL,
	"title" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_events_valid_period_check" CHECK ("calendar_events"."end_time" > "calendar_events"."start_time")
);
--> statement-breakpoint
CREATE TABLE "care_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"type" "care_reminder_type" NOT NULL,
	"title" text NOT NULL,
	"due_date" date NOT NULL,
	"status" "care_reminder_status" DEFAULT 'pending' NOT NULL,
	"source_vaccine_id" uuid,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "vaccines" ADD COLUMN "next_dose_type" "vaccine_next_dose_type";--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_reminders" ADD CONSTRAINT "care_reminders_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_reminders" ADD CONSTRAINT "care_reminders_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_reminders" ADD CONSTRAINT "care_reminders_source_vaccine_id_vaccines_id_fk" FOREIGN KEY ("source_vaccine_id") REFERENCES "public"."vaccines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_events_doctor_start_time_idx" ON "calendar_events" USING btree ("doctor_id","start_time");--> statement-breakpoint
CREATE INDEX "calendar_events_doctor_end_time_idx" ON "calendar_events" USING btree ("doctor_id","end_time");--> statement-breakpoint
CREATE INDEX "care_reminders_doctor_due_date_idx" ON "care_reminders" USING btree ("doctor_id","due_date");--> statement-breakpoint
CREATE INDEX "care_reminders_pet_due_date_idx" ON "care_reminders" USING btree ("pet_id","due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "care_reminders_source_vaccine_id_unique" ON "care_reminders" USING btree ("source_vaccine_id");