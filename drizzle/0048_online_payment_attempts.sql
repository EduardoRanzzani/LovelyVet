CREATE TABLE "online_payment_attempts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "charge_id" uuid NOT NULL,
    "initiated_by" uuid NOT NULL,
    "environment" text NOT NULL,
    "collector_id" text NOT NULL,
    "amount_in_cents" integer NOT NULL,
    "method" text NOT NULL,
    "installments" integer DEFAULT 1 NOT NULL,
    "status" text DEFAULT 'created' NOT NULL,
    "provider_order_id" text,
    "provider_payment_id" text,
    "provider_status" text,
    "provider_status_detail" text,
    "reconciliation_reason" text,
    "expires_at" timestamp,
    "approved_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "online_attempt_ledger_identity_unique" UNIQUE ("id", "charge_id", "amount_in_cents", "method"),
    CONSTRAINT "online_attempt_environment_valid" CHECK ("environment" IN ('test','production')),
    CONSTRAINT "online_attempt_amount_positive" CHECK ("amount_in_cents" > 0),
    CONSTRAINT "online_attempt_method_valid" CHECK ("method" IN ('pix','credit_card','debit_card')),
    CONSTRAINT "online_attempt_installments_valid" CHECK ("installments" BETWEEN 1 AND 24 AND ("method" = 'credit_card' OR "installments" = 1)),
    CONSTRAINT "online_attempt_status_valid" CHECK ("status" IN ('created','processing','pending','approved','rejected','cancelled','expired','review')),
    CONSTRAINT "online_attempt_collector_valid" CHECK (length(btrim("collector_id")) > 0),
    CONSTRAINT "online_attempt_order_id_valid" CHECK ("provider_order_id" IS NULL OR length(btrim("provider_order_id")) > 0),
    CONSTRAINT "online_attempt_payment_id_valid" CHECK ("provider_payment_id" IS NULL OR length(btrim("provider_payment_id")) > 0),
    CONSTRAINT "online_attempt_approval_valid" CHECK ("status" <> 'approved' OR ("provider_order_id" IS NOT NULL AND "provider_payment_id" IS NOT NULL AND "approved_at" IS NOT NULL))
);--> statement-breakpoint
ALTER TABLE "online_payment_attempts" ADD CONSTRAINT "online_payment_attempts_charge_id_appointment_charges_id_fk" FOREIGN KEY ("charge_id") REFERENCES "public"."appointment_charges" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "online_payment_attempts" ADD CONSTRAINT "online_payment_attempts_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;--> statement-breakpoint
CREATE INDEX "online_attempt_charge_idx" ON "online_payment_attempts" USING btree ("charge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "online_attempt_provider_order_unique" ON "online_payment_attempts" USING btree ("environment", "provider_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "online_attempt_provider_payment_unique" ON "online_payment_attempts" USING btree ("environment", "provider_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "online_attempt_one_active_per_charge" ON "online_payment_attempts" USING btree ("charge_id") WHERE "status" IN ('created','processing','pending');--> statement-breakpoint
ALTER TABLE "charge_payments" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "charge_payments" ADD COLUMN "online_payment_attempt_id" uuid;--> statement-breakpoint
ALTER TABLE "charge_payments" ALTER COLUMN "received_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "charge_payments" ADD CONSTRAINT "charge_payment_source_valid" CHECK (("source" = 'manual' AND "received_by" IS NOT NULL AND "online_payment_attempt_id" IS NULL) OR ("source" = 'mercado_pago' AND "received_by" IS NULL AND "online_payment_attempt_id" IS NOT NULL AND "operation_key" = "online_payment_attempt_id"));--> statement-breakpoint
ALTER TABLE "charge_payments" ADD CONSTRAINT "charge_payment_online_attempt_identity_fk" FOREIGN KEY ("online_payment_attempt_id", "charge_id", "amount_in_cents", "method") REFERENCES "public"."online_payment_attempts" ("id", "charge_id", "amount_in_cents", "method") ON DELETE NO ACTION ON UPDATE NO ACTION;--> statement-breakpoint
CREATE UNIQUE INDEX "charge_payments_online_attempt_unique" ON "charge_payments" USING btree ("online_payment_attempt_id");
