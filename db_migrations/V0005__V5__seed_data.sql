INSERT INTO users (email, password_hash, name, role, avatar) VALUES
  ('elena@hispania35.ru', 'teacher123', 'Елена Смирнова', 'teacher', 'ЕС');

INSERT INTO users (email, password_hash, name, role, level, avatar) VALUES
  ('anna@hispania35.ru',   'student123', 'Анна Михайлова',  'student', 'B1', 'АМ'),
  ('dmitry@hispania35.ru', 'student123', 'Дмитрий Сорокин', 'student', 'B1', 'ДС'),
  ('maria@hispania35.ru',  'student123', 'Мария Козлова',   'student', 'B2', 'МК'),
  ('olga@hispania35.ru',   'student123', 'Ольга Петрова',   'student', 'A2', 'ОП');

INSERT INTO lessons (teacher_id, title, topic, lesson_date, lesson_time, duration_min, lesson_type) VALUES
  (1, 'Урок испанского', 'Pretérito Indefinido — формы', '2026-05-26', '18:00', 60, 'Грамматика'),
  (1, 'Урок испанского', 'Subjuntivo presente',          '2026-05-28', '19:00', 60, 'Грамматика'),
  (1, 'Разговорный клуб', 'Разговорный клуб',            '2026-05-30', '18:00', 90, 'Практика'),
  (1, 'Урок испанского', 'Ser vs Estar — повторение',    '2026-06-02', '18:00', 60, 'Повторение'),
  (1, 'Урок испанского', 'Аудирование: Новости',         '2026-06-04', '19:00', 45, 'Аудирование');

INSERT INTO lesson_students (lesson_id, student_id)
SELECT l.id, u.id FROM lessons l CROSS JOIN users u WHERE u.role = 'student';

INSERT INTO materials (teacher_id, title, description, category, file_type, file_size) VALUES
  (1, 'Грамматика: Subjuntivo presente',  'Полная таблица форм, правила и исключения.',    'Грамматика',  'PDF',  '1.2 МБ'),
  (1, 'Аудио: Диалоги в ресторане',       'Два диалога с носителем, средняя скорость.',    'Аудио',       'MP3',  '8.4 МБ'),
  (1, 'Видео: Ser vs Estar',              'Видеоурок с примерами, 18 минут.',               'Видео',       'MP4',  '45 МБ'),
  (1, 'Упражнения §12-14',                '30 упражнений с ключами.',                       'Упражнения',  'DOCX', '540 КБ'),
  (1, 'Словарь: Еда и кулинария',         '200 слов с транскрипцией и переводом.',          'Словари',     'PDF',  '820 КБ');

INSERT INTO homework (teacher_id, student_id, title, description, subject, due_date, status) VALUES
  (1, 2, 'Упражнения §12, стр. 45',          'Выполните упражнения 1-10 на стр. 45.',                   'Грамматика',  '2026-05-25', 'pending'),
  (1, 2, 'Перевод текста «La Fiesta Mayor»', 'Переведите текст на стр. 62.',                             'Перевод',     '2026-05-28', 'inprogress'),
  (1, 2, 'Аудирование: Урок 8',              'Прослушайте аудио, заполните пропуски.',                   'Аудирование', '2026-05-20', 'review'),
  (1, 2, 'Сочинение: Mi ciudad favorita',    'Напишите сочинение 150-200 слов о любимом городе.', 'Письмо',      '2026-05-15', 'done');

INSERT INTO notifications (user_id, text, type, is_read) VALUES
  (2, 'Новый материал: Subjuntivo presente',       'material', false),
  (2, 'Домашнее задание проверено. Оценка: 5',     'homework', false),
  (2, 'Завтра занятие в 18:00: Pretérito',         'calendar', true),
  (2, 'Новое сообщение от Елены Смирновой',        'chat',     true);

INSERT INTO messages (from_user_id, to_user_id, text) VALUES
  (1, 2, 'Привет, Анна! Как дела с заданием по Subjuntivo?'),
  (2, 1, 'Добрый день! Почти закончила, осталось несколько упражнений.'),
  (1, 2, 'Не забудьте про исключения — yo/él форму глаголов ser, ir, ver.'),
  (2, 1, 'Спасибо! А можете скинуть таблицу с исключениями?'),
  (1, 2, 'Уже загрузила в раздел Материалы → Грамматика → Subjuntivo.');