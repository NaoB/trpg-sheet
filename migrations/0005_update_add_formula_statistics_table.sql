ALTER TABLE "statistics" ADD COLUMN "formulaType" text;--> statement-breakpoint
ALTER TABLE "statistics" ADD COLUMN "formulaStatisticId" uuid;--> statement-breakpoint
ALTER TABLE "statistics" ADD COLUMN "formulaValue" integer;--> statement-breakpoint
ALTER TABLE "statistics" ADD CONSTRAINT "statistics_formulaStatisticId_statistics_id_fk" FOREIGN KEY ("formulaStatisticId") REFERENCES "public"."statistics"("id") ON DELETE no action ON UPDATE no action;