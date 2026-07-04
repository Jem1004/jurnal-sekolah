CREATE INDEX "class_members_student_idx" ON "class_members" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "holidays_school_date_idx" ON "holidays" USING btree ("school_id","date");--> statement-breakpoint
CREATE INDEX "journal_entries_school_date_idx" ON "journal_entries" USING btree ("school_id","date");--> statement-breakpoint
CREATE INDEX "journal_entries_substitute_idx" ON "journal_entries" USING btree ("substitute_teacher_id");