CREATE TABLE "prescription_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" uuid NOT NULL,
	"signed_by_user_id" uuid NOT NULL,
	"pdf" "bytea" NOT NULL,
	"pdf_sha256" text NOT NULL,
	"signed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prescription_signatures" ADD CONSTRAINT "prescription_signatures_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_signatures" ADD CONSTRAINT "prescription_signatures_signed_by_user_id_users_id_fk" FOREIGN KEY ("signed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "prescription_signatures_prescription_id_unique" ON "prescription_signatures" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX "prescription_signatures_signed_by_user_id_idx" ON "prescription_signatures" USING btree ("signed_by_user_id");
CREATE OR REPLACE FUNCTION prevent_signed_prescription_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "prescription_signatures"
		WHERE "prescription_id" = OLD."id"
	) THEN
		RAISE EXCEPTION
			'Receita assinada digitalmente não pode ser alterada ou excluída';
	END IF;

	IF TG_OP = 'DELETE' THEN
		RETURN OLD;
	END IF;

	RETURN NEW;
END;
$$;
CREATE TRIGGER "prevent_signed_prescription_update"
BEFORE UPDATE ON "prescriptions"
FOR EACH ROW
EXECUTE FUNCTION prevent_signed_prescription_mutation();
CREATE TRIGGER "prevent_signed_prescription_delete"
BEFORE DELETE ON "prescriptions"
FOR EACH ROW
EXECUTE FUNCTION prevent_signed_prescription_mutation();