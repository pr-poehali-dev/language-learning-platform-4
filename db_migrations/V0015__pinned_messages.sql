ALTER TABLE messages ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS lesson_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages (pinned_at);