CREATE TABLE IF NOT EXISTS lesson_reminders (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    kind VARCHAR(20) NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (lesson_id, student_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_lesson_reminders_lesson ON lesson_reminders(lesson_id);