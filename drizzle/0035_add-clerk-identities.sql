CREATE TYPE "public"."clerk_environment" AS ENUM('development', 'production');--> statement-breakpoint
CREATE TABLE "clerk_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"environment" "clerk_environment" NOT NULL,
	"clerk_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clerk_identities_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
ALTER TABLE "clerk_identities" ADD CONSTRAINT "clerk_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clerk_identities_user_environment_unique" ON "clerk_identities" USING btree ("user_id","environment");--> statement-breakpoint
CREATE INDEX "clerk_identities_user_id_idx" ON "clerk_identities" USING btree ("user_id");