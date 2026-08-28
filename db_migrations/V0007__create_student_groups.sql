CREATE TABLE IF NOT EXISTS student_groups (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT DEFAULT '',
    color VARCHAR(20) DEFAULT 'primary',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    UNIQUE (group_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_teacher ON student_groups(teacher_id);