ALTER TABLE "prescription_medicine_items" DROP CONSTRAINT "prescription_medicine_items_prescription_id_prescriptions_id_fk";
--> statement-breakpoint
ALTER TABLE "prescription_medicine_items" DROP CONSTRAINT "prescription_medicine_items_prescription_item_id_prescription_items_id_fk";
--> statement-breakpoint
ALTER TABLE "prescription_medicine_items" ADD CONSTRAINT "prescription_medicine_items_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_medicine_items" ADD CONSTRAINT "prescription_medicine_items_prescription_item_id_prescription_items_id_fk" FOREIGN KEY ("prescription_item_id") REFERENCES "public"."prescription_items"("id") ON DELETE cascade ON UPDATE no action;