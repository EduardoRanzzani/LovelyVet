CREATE TABLE "clerk_identity_link_audit" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "admin_user_id" uuid NOT NULL,
    "admin_clerk_user_id" text NOT NULL,
    "target_user_id" uuid NOT NULL,
    "environment" "clerk_environment" NOT NULL,
    "clerk_user_id" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);
