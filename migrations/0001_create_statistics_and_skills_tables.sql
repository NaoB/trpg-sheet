CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY NOT NULL,
	"statisticId" uuid NOT NULL,
	"name" text NOT NULL,
	"costPerLevel" integer DEFAULT 1 NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"base" integer DEFAULT 0 NOT NULL,
	"bonus" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statistics" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"name" text NOT NULL,
	"shortName" text NOT NULL,
	"description" text NOT NULL,
	"level" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_statisticId_statistics_id_fk" FOREIGN KEY ("statisticId") REFERENCES "public"."statistics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statistics" ADD CONSTRAINT "statistics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;