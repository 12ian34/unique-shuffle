CREATE TABLE IF NOT EXISTS "global_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public_shared_shuffles" (
	"share_code" text PRIMARY KEY NOT NULL,
	"cards" jsonb NOT NULL,
	"patterns" jsonb NOT NULL,
	"achievement_ids" jsonb NOT NULL,
	"display_name" text,
	"profile_hash" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"last_viewed_at" timestamp with time zone
);
