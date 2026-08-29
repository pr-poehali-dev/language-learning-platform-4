CREATE TABLE IF NOT EXISTS library_items (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(180) DEFAULT '',
    description TEXT DEFAULT '',
    kind VARCHAR(20) DEFAULT 'book',
    file_url TEXT DEFAULT '',
    file_name VARCHAR(255) DEFAULT '',
    file_key TEXT DEFAULT '',
    mime VARCHAR(120) DEFAULT '',
    size_bytes BIGINT DEFAULT 0,
    duration_sec INTEGER DEFAULT 0,
    cover_url TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_assignments (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    group_id INTEGER,
    assigned_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (item_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_lib_assign_student ON library_assignments (student_id);