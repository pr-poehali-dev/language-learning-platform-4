CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  topic VARCHAR(255),
  lesson_date DATE NOT NULL,
  lesson_time TIME NOT NULL,
  duration_min INTEGER DEFAULT 60,
  lesson_type VARCHAR(50) DEFAULT 'Грамматика',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_students (
  lesson_id INTEGER REFERENCES lessons(id),
  student_id INTEGER REFERENCES users(id),
  PRIMARY KEY (lesson_id, student_id)
);