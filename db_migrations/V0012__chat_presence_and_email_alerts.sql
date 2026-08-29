ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_chat BOOLEAN DEFAULT TRUE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS email_notified BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages (to_user_id, is_read, email_notified);