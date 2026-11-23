CREATE TABLE "appointment_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"total_in_cents" integer NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"voided_at" timestamp,
	CONSTRAINT "appointment_charges_appointment_id_unique" UNIQUE("appointment_id"),
	CONSTRAINT "appointment_charge_total_positive" CHECK ("appointment_charges"."total_in_cents" > 0),
	CONSTRAINT "appointment_charge_status_valid" CHECK ("appointment_charges"."status" IN ('open', 'void'))
);
--> statement-breakpoint
CREATE TABLE "charge_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"charge_id" uuid NOT NULL,
	"operation_key" uuid NOT NULL,
	"amount_in_cents" integer NOT NULL,
	"method" text NOT NULL,
	"received_by" uuid NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "charge_payment_amount_positive" CHECK ("charge_payments"."amount_in_cents" > 0),
	CONSTRAINT "charge_payment_method_valid" CHECK ("charge_payments"."method" IN ('pix','cash','credit_card','debit_card','transfer'))
);
--> statement-breakpoint
ALTER TABLE "appointment_charges" ADD CONSTRAINT "appointment_charges_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_charges" ADD CONSTRAINT "appointment_charges_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_charges" ADD CONSTRAINT "appointment_charges_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge_payments" ADD CONSTRAINT "charge_payments_charge_id_appointment_charges_id_fk" FOREIGN KEY ("charge_id") REFERENCES "public"."appointment_charges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge_payments" ADD CONSTRAINT "charge_payments_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointment_charges_customer_idx" ON "appointment_charges" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "charge_payments_operation_unique" ON "charge_payments" USING btree ("charge_id","operation_key");--> statement-breakpoint
CREATE INDEX "charge_payments_charge_idx" ON "charge_payments" USING btree ("charge_id");