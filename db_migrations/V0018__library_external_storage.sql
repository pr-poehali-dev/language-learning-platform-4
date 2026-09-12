ALTER TABLE library_items ADD COLUMN IF NOT EXISTS storage VARCHAR(20) DEFAULT 'internal';
CREATE INDEX IF NOT EXISTS idx_library_items_teacher ON library_items (teacher_id, created_at DESC);
