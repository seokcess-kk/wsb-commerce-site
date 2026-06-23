ALTER TABLE "order_items" ADD COLUMN "stock_deducted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "va_account_number" varchar(40);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "va_bank_code" varchar(10);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "va_customer_name" varchar(80);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "va_due_date" timestamp with time zone;