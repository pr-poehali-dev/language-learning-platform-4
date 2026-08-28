"""
Основное API: материалы, календарь, чат, уведомления, рейтинг.
GET  /materials             — список материалов
POST /materials             — добавить материал (teacher)
GET  /calendar              — занятия
POST /calendar              — создать занятие (teacher)
GET  /chat/messages         — история сообщений
POST /chat/messages         — отправить сообщение
GET  /notifications         — уведомления
POST /notifications/read    — прочитать все
GET  /students              — список студентов (teacher)
GET  /leaderboard           — рейтинг
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, Authorization",
    "Access-Control-Max-Age": "86400",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user(token, conn):
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        """SELECT u.id, u.role, u.name FROM sessions s
           JOIN users u ON u.id=s.user_id
           WHERE s.token=%s AND s.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    return row

def resp(status, data):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(data, default=str)}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    token = event.get("headers", {}).get("X-Auth-Token", "")
    conn = get_conn()
    user = get_user(token, conn)
    if not user:
        conn.close()
        return resp(401, {"error": "Не авторизован"})

    user_id, role, user_name = user
    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    path = params.get("p", "")

    try:
        # --- Materials ---
        if path == "materials":
            if method == "GET":
                return get_materials(conn)
            if method == "POST":
                return create_material(event, conn, user_id, role)

        # --- Calendar ---
        if path == "calendar":
            if method == "GET":
                return get_lessons(conn, user_id, role)
            if method == "POST":
                return create_lesson(event, conn, user_id, role)
            if method == "PUT":
                return move_lesson(event, conn, user_id, role)
            if method == "DELETE":
                return delete_lesson(event, conn, user_id, role)

        # --- Chat ---
        if path == "chat":
            if method == "GET":
                return get_messages(event, conn, user_id)
            if method == "POST":
                return send_message(event, conn, user_id, user_name)

        # --- Notifications ---
        if path == "notifications_read" and method == "POST":
            return mark_notifications_read(conn, user_id)
        if path == "notifications" and method == "GET":
            return get_notifications(conn, user_id)

        # --- Students list ---
        if path == "students":
            if method == "GET":
                return get_students(conn)
            if method == "PUT":
                return update_student(event, conn, role)

        # --- Groups ---
        if path == "groups":
            if method == "GET":
                return get_groups(conn, user_id, role)
            if method == "POST":
                return create_group(event, conn, user_id, role)
            if method == "PUT":
                return update_group(event, conn, user_id, role)
            if method == "DELETE":
                return remove_group(event, conn, user_id, role)

        # --- Leaderboard ---
        if path == "leaderboard" and method == "GET":
            return get_leaderboard(conn)

        conn.close()
        return resp(404, {"error": "Not found"})
    except Exception as e:
        conn.close()
        return resp(500, {"error": str(e)})


# ── Materials ──────────────────────────────────────────────────────────────────

def get_materials(conn):
    cur = conn.cursor()
    cur.execute(
        """SELECT m.id, m.title, m.description, m.category,
                  m.file_type, m.file_size, m.file_url, m.created_at,
                  u.name as teacher_name
           FROM materials m JOIN users u ON u.id=m.teacher_id
           ORDER BY m.created_at DESC"""
    )
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return resp(200, {"materials": [dict(zip(cols, r)) for r in rows]})

def create_material(event, conn, user_id, role):
    if role != "teacher":
        conn.close()
        return resp(403, {"error": "Только преподаватель"})
    body = json.loads(event.get("body") or "{}")
    title = body.get("title", "").strip()
    if not title:
        conn.close()
        return resp(400, {"error": "Название обязательно"})
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO materials (teacher_id, title, description, category, file_type, file_size, file_url)
           VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
        (user_id, title, body.get("description"), body.get("category"),
         body.get("file_type"), body.get("file_size"), body.get("file_url"))
    )
    mat_id = cur.fetchone()[0]
    cur.execute("SELECT id FROM users WHERE role='student'")
    for (sid,) in cur.fetchall():
        cur.execute("INSERT INTO notifications (user_id, text, type) VALUES (%s,%s,'material')",
                    (sid, f"Новый материал: {title}"))
    conn.commit(); cur.close(); conn.close()
    return resp(200, {"ok": True, "id": mat_id})


# ── Calendar ───────────────────────────────────────────────────────────────────

def get_lessons(conn, user_id, role):
    cur = conn.cursor()
    if role == "teacher":
        cur.execute(
            """SELECT l.id, l.title, l.topic, l.lesson_date, l.lesson_time,
                      l.duration_min, l.lesson_type
               FROM lessons l WHERE l.teacher_id=%s ORDER BY l.lesson_date, l.lesson_time""",
            (user_id,)
        )
    else:
        cur.execute(
            """SELECT l.id, l.title, l.topic, l.lesson_date, l.lesson_time,
                      l.duration_min, l.lesson_type
               FROM lessons l JOIN lesson_students ls ON ls.lesson_id=l.id
               WHERE ls.student_id=%s ORDER BY l.lesson_date, l.lesson_time""",
            (user_id,)
        )
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    result = []
    for row in rows:
        item = dict(zip(cols, row))
        if item.get("lesson_date"):
            item["lesson_date"] = item["lesson_date"].strftime("%Y-%m-%d")
        if item.get("lesson_time"):
            item["lesson_time"] = str(item["lesson_time"])[:5]
        item["students"] = []
        result.append(item)

    if result:
        by_id = {r["id"]: r for r in result}
        id_list = ",".join(str(i) for i in by_id.keys())
        cur.execute(
            f"""SELECT ls.lesson_id, u.id, u.name, u.avatar
                FROM lesson_students ls JOIN users u ON u.id=ls.student_id
                WHERE ls.lesson_id IN ({id_list}) ORDER BY u.name"""
        )
        for lid, sid, sname, savatar in cur.fetchall():
            if lid in by_id:
                by_id[lid]["students"].append({"id": sid, "name": sname, "avatar": savatar})

    cur.close(); conn.close()
    return resp(200, {"lessons": result})

def create_lesson(event, conn, user_id, role):
    if role != "teacher":
        conn.close()
        return resp(403, {"error": "Только преподаватель"})
    body = json.loads(event.get("body") or "{}")
    topic = body.get("topic", "").strip()
    lesson_date = body.get("lesson_date")
    lesson_time = body.get("lesson_time")
    if not topic or not lesson_date or not lesson_time:
        conn.close()
        return resp(400, {"error": "Тема, дата и время обязательны"})
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO lessons (teacher_id, title, topic, lesson_date, lesson_time, duration_min, lesson_type)
           VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
        (user_id, body.get("title", topic), topic, lesson_date, lesson_time,
         body.get("duration_min", 60), body.get("lesson_type", "Грамматика"))
    )
    lesson_id = cur.fetchone()[0]
    raw_ids = body.get("student_ids") or []
    student_ids = []
    for s in raw_ids:
        try:
            student_ids.append(int(s))
        except (TypeError, ValueError):
            pass
    if student_ids:
        id_list = ",".join(str(i) for i in student_ids)
        cur.execute(f"SELECT id FROM users WHERE role='student' AND id IN ({id_list})")
    else:
        cur.execute("SELECT id FROM users WHERE role='student'")
    for (sid,) in cur.fetchall():
        cur.execute("INSERT INTO lesson_students (lesson_id, student_id) VALUES (%s,%s)", (lesson_id, sid))
        cur.execute("INSERT INTO notifications (user_id, text, type) VALUES (%s,%s,'calendar')",
                    (sid, f"Новое занятие {lesson_date} {lesson_time}: {topic}"))
    conn.commit(); cur.close(); conn.close()
    return resp(200, {"ok": True, "id": lesson_id})

def move_lesson(event, conn, user_id, role):
    if role != "teacher":
        conn.close()
        return resp(403, {"error": "Только преподаватель"})
    body = json.loads(event.get("body") or "{}")
    lesson_id = body.get("id")
    lesson_date = body.get("lesson_date")
    lesson_time = body.get("lesson_time")
    if not lesson_id or not lesson_date or not lesson_time:
        conn.close()
        return resp(400, {"error": "id, дата и время обязательны"})
    cur = conn.cursor()
    cur.execute("SELECT topic, lesson_date, lesson_time FROM lessons WHERE id=%s AND teacher_id=%s",
                (lesson_id, user_id))
    old = cur.fetchone()
    if not old:
        cur.close(); conn.close()
        return resp(404, {"error": "Занятие не найдено"})
    old_topic, old_date, old_time = old

    topic = (body.get("topic") or "").strip() or old_topic
    lesson_type = body.get("lesson_type")
    duration = body.get("duration_min")

    fields = ["lesson_date=%s", "lesson_time=%s", "topic=%s", "title=%s"]
    values = [lesson_date, lesson_time, topic, topic]
    if lesson_type:
        fields.append("lesson_type=%s"); values.append(lesson_type)
    if duration:
        fields.append("duration_min=%s"); values.append(int(duration))
    values.extend([lesson_id, user_id])
    cur.execute(f"UPDATE lessons SET {', '.join(fields)} WHERE id=%s AND teacher_id=%s", tuple(values))

    cur.execute("SELECT student_id FROM lesson_students WHERE lesson_id=%s", (lesson_id,))
    old_students = set(r[0] for r in cur.fetchall())

    raw_ids = body.get("student_ids")
    new_students = old_students
    if raw_ids is not None:
        new_students = set()
        for s in raw_ids:
            try:
                new_students.add(int(s))
            except (TypeError, ValueError):
                pass
        added = new_students - old_students
        removed = old_students - new_students
        for sid in added:
            cur.execute("INSERT INTO lesson_students (lesson_id, student_id) VALUES (%s,%s)", (lesson_id, sid))
            cur.execute("INSERT INTO notifications (user_id, text, type) VALUES (%s,%s,'calendar')",
                        (sid, f"Вас записали на занятие {lesson_date} {lesson_time}: {topic}"))
        for sid in removed:
            cur.execute("DELETE FROM lesson_students WHERE lesson_id=%s AND student_id=%s", (lesson_id, sid))
            cur.execute("INSERT INTO notifications (user_id, text, type) VALUES (%s,%s,'calendar')",
                        (sid, f"Вас убрали с занятия {old_date} {str(old_time)[:5]}: {old_topic}"))

    changed_time = str(old_date) != str(lesson_date) or str(old_time)[:5] != str(lesson_time)[:5]
    changed_topic = old_topic != topic
    if changed_time or changed_topic:
        stay = new_students & old_students if raw_ids is not None else old_students
        for sid in stay:
            if changed_time:
                text = f"Занятие перенесено на {lesson_date} {lesson_time}: {topic}"
            else:
                text = f"Занятие {lesson_date} {lesson_time} изменено: {topic}"
            cur.execute("INSERT INTO notifications (user_id, text, type) VALUES (%s,%s,'calendar')", (sid, text))

    conn.commit(); cur.close(); conn.close()
    return resp(200, {"ok": True})

def delete_lesson(event, conn, user_id, role):
    if role != "teacher":
        conn.close()
        return resp(403, {"error": "Только преподаватель"})
    params = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}")
    lesson_id = body.get("id") or params.get("id")
    if not lesson_id:
        conn.close()
        return resp(400, {"error": "id обязателен"})
    cur = conn.cursor()
    cur.execute("SELECT topic, lesson_date, lesson_time FROM lessons WHERE id=%s AND teacher_id=%s",
                (lesson_id, user_id))
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return resp(404, {"error": "Занятие не найдено"})
    topic, l_date, l_time = row
    cur.execute("SELECT student_id FROM lesson_students WHERE lesson_id=%s", (lesson_id,))
    student_ids = [r[0] for r in cur.fetchall()]
    cur.execute("DELETE FROM lesson_students WHERE lesson_id=%s", (lesson_id,))
    cur.execute("DELETE FROM lessons WHERE id=%s AND teacher_id=%s", (lesson_id, user_id))
    for sid in student_ids:
        cur.execute("INSERT INTO notifications (user_id, text, type) VALUES (%s,%s,'calendar')",
                    (sid, f"Занятие отменено {l_date} {str(l_time)[:5]}: {topic}"))
    conn.commit(); cur.close(); conn.close()
    return resp(200, {"ok": True})


# ── Chat ───────────────────────────────────────────────────────────────────────

def get_messages(event, conn, user_id):
    params = event.get("queryStringParameters") or {}
    other_id = params.get("with")
    cur = conn.cursor()
    if other_id:
        cur.execute(
            """SELECT m.id, m.from_user_id, m.to_user_id, m.text, m.is_read, m.created_at,
                      u.name as from_name, u.avatar as from_avatar
               FROM messages m JOIN users u ON u.id=m.from_user_id
               WHERE (m.from_user_id=%s AND m.to_user_id=%s)
                  OR (m.from_user_id=%s AND m.to_user_id=%s)
               ORDER BY m.created_at""",
            (user_id, int(other_id), int(other_id), user_id)
        )
    else:
        cur.execute(
            """SELECT m.id, m.from_user_id, m.to_user_id, m.text, m.is_read, m.created_at,
                      u.name as from_name, u.avatar as from_avatar
               FROM messages m JOIN users u ON u.id=m.from_user_id
               WHERE m.from_user_id=%s OR m.to_user_id=%s
               ORDER BY m.created_at""",
            (user_id, user_id)
        )
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return resp(200, {"messages": [dict(zip(cols, r)) for r in rows]})

def send_message(event, conn, user_id, user_name):
    body = json.loads(event.get("body") or "{}")
    to_id = body.get("to_user_id")
    text = body.get("text", "").strip()
    if not to_id or not text:
        conn.close()
        return resp(400, {"error": "Укажите получателя и текст"})
    cur = conn.cursor()
    cur.execute("INSERT INTO messages (from_user_id, to_user_id, text) VALUES (%s,%s,%s) RETURNING id",
                (user_id, to_id, text))
    msg_id = cur.fetchone()[0]
    cur.execute("INSERT INTO notifications (user_id, text, type) VALUES (%s,%s,'chat')",
                (to_id, f"Новое сообщение от {user_name}"))
    conn.commit(); cur.close(); conn.close()
    return resp(200, {"ok": True, "id": msg_id})


# ── Notifications ──────────────────────────────────────────────────────────────

def get_notifications(conn, user_id):
    cur = conn.cursor()
    cur.execute(
        "SELECT id, text, type, is_read, created_at FROM notifications WHERE user_id=%s ORDER BY created_at DESC LIMIT 20",
        (user_id,)
    )
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    unread = sum(1 for r in rows if not r[3])
    cur.close(); conn.close()
    return resp(200, {"notifications": [dict(zip(cols, r)) for r in rows], "unread": unread})

def mark_notifications_read(conn, user_id):
    cur = conn.cursor()
    cur.execute("UPDATE notifications SET is_read=TRUE WHERE user_id=%s AND is_read=FALSE", (user_id,))
    conn.commit(); cur.close(); conn.close()
    return resp(200, {"ok": True})


# ── Students / Leaderboard ─────────────────────────────────────────────────────

def get_students(conn):
    cur = conn.cursor()
    cur.execute(
        """SELECT u.id, u.name, u.avatar, u.level, u.email,
                  COALESCE(u.phone,''), COALESCE(u.social_name,''),
                  COALESCE(u.social_url,''), COALESCE(u.note,''),
                  (SELECT COUNT(*) FROM lesson_students ls WHERE ls.student_id=u.id) as lessons_count
           FROM users u WHERE u.role='student' ORDER BY u.name"""
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    return resp(200, {"students": [
        {"id": r[0], "name": r[1], "avatar": r[2], "level": r[3], "email": r[4],
         "phone": r[5], "social_name": r[6], "social_url": r[7], "note": r[8],
         "lessons_count": r[9]} for r in rows
    ]})

def update_student(event, conn, role):
    if role != "teacher":
        conn.close()
        return resp(403, {"error": "Только преподаватель"})
    body = json.loads(event.get("body") or "{}")
    student_id = body.get("id")
    email = (body.get("email") or "").strip()
    if not student_id:
        conn.close()
        return resp(400, {"error": "id обязателен"})
    if not email or "@" not in email:
        conn.close()
        return resp(400, {"error": "Укажите корректную электронную почту"})
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email=%s AND id<>%s", (email, student_id))
    if cur.fetchone():
        cur.close(); conn.close()
        return resp(400, {"error": "Эта почта уже занята другим пользователем"})
    fields = ["email=%s", "phone=%s", "social_name=%s", "social_url=%s", "note=%s"]
    values = [email, (body.get("phone") or "").strip(), (body.get("social_name") or "").strip(),
              (body.get("social_url") or "").strip(), (body.get("note") or "").strip()]
    name = (body.get("name") or "").strip()
    if name:
        fields.append("name=%s"); values.append(name)
    level = body.get("level")
    if level is not None:
        fields.append("level=%s"); values.append(str(level).strip())
    values.append(student_id)
    cur.execute(f"UPDATE users SET {', '.join(fields)} WHERE id=%s AND role='student' RETURNING id", tuple(values))
    if not cur.fetchone():
        cur.close(); conn.close()
        return resp(404, {"error": "Ученик не найден"})
    conn.commit(); cur.close(); conn.close()
    return resp(200, {"ok": True})

def _group_ids(raw):
    ids = []
    for s in raw or []:
        try:
            ids.append(int(s))
        except (TypeError, ValueError):
            pass
    return ids

def get_groups(conn, user_id, role):
    if role != "teacher":
        conn.close()
        return resp(403, {"error": "Только преподаватель"})
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, description, color FROM student_groups WHERE teacher_id=%s ORDER BY name",
        (user_id,)
    )
    groups = [{"id": r[0], "name": r[1], "description": r[2] or "", "color": r[3], "students": []}
              for r in cur.fetchall()]
    if groups:
        by_id = {g["id"]: g for g in groups}
        id_list = ",".join(str(i) for i in by_id.keys())
        cur.execute(
            f"""SELECT gm.group_id, u.id, u.name, u.avatar, u.level
                FROM group_members gm JOIN users u ON u.id=gm.student_id
                WHERE gm.group_id IN ({id_list}) ORDER BY u.name"""
        )
        for gid, sid, sname, savatar, slevel in cur.fetchall():
            if gid in by_id:
                by_id[gid]["students"].append({"id": sid, "name": sname, "avatar": savatar, "level": slevel})
    cur.close(); conn.close()
    return resp(200, {"groups": groups})

def create_group(event, conn, user_id, role):
    if role != "teacher":
        conn.close()
        return resp(403, {"error": "Только преподаватель"})
    body = json.loads(event.get("body") or "{}")
    name = (body.get("name") or "").strip()
    if not name:
        conn.close()
        return resp(400, {"error": "Укажите название группы"})
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO student_groups (teacher_id, name, description, color)
           VALUES (%s,%s,%s,%s) RETURNING id""",
        (user_id, name, (body.get("description") or "").strip(), body.get("color") or "primary")
    )
    group_id = cur.fetchone()[0]
    for sid in _group_ids(body.get("student_ids")):
        cur.execute("INSERT INTO group_members (group_id, student_id) VALUES (%s,%s)", (group_id, sid))
    conn.commit(); cur.close(); conn.close()
    return resp(200, {"ok": True, "id": group_id})

def update_group(event, conn, user_id, role):
    if role != "teacher":
        conn.close()
        return resp(403, {"error": "Только преподаватель"})
    body = json.loads(event.get("body") or "{}")
    group_id = body.get("id")
    name = (body.get("name") or "").strip()
    if not group_id or not name:
        conn.close()
        return resp(400, {"error": "Укажите группу и название"})
    cur = conn.cursor()
    cur.execute(
        """UPDATE student_groups SET name=%s, description=%s, color=%s
           WHERE id=%s AND teacher_id=%s RETURNING id""",
        (name, (body.get("description") or "").strip(), body.get("color") or "primary", group_id, user_id)
    )
    if not cur.fetchone():
        cur.close(); conn.close()
        return resp(404, {"error": "Группа не найдена"})
    if body.get("student_ids") is not None:
        new_ids = set(_group_ids(body.get("student_ids")))
        cur.execute("SELECT student_id FROM group_members WHERE group_id=%s", (group_id,))
        old_ids = set(r[0] for r in cur.fetchall())
        for sid in new_ids - old_ids:
            cur.execute("INSERT INTO group_members (group_id, student_id) VALUES (%s,%s)", (group_id, sid))
        drop = old_ids - new_ids
        if drop:
            drop_list = ",".join(str(i) for i in drop)
            cur.execute(f"DELETE FROM group_members WHERE group_id=%s AND student_id IN ({drop_list})", (group_id,))
    conn.commit(); cur.close(); conn.close()
    return resp(200, {"ok": True})

def remove_group(event, conn, user_id, role):
    if role != "teacher":
        conn.close()
        return resp(403, {"error": "Только преподаватель"})
    params = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}")
    group_id = body.get("id") or params.get("id")
    if not group_id:
        conn.close()
        return resp(400, {"error": "id обязателен"})
    cur = conn.cursor()
    cur.execute("SELECT id FROM student_groups WHERE id=%s AND teacher_id=%s", (group_id, user_id))
    if not cur.fetchone():
        cur.close(); conn.close()
        return resp(404, {"error": "Группа не найдена"})
    cur.execute("DELETE FROM group_members WHERE group_id=%s", (group_id,))
    cur.execute("DELETE FROM student_groups WHERE id=%s AND teacher_id=%s", (group_id, user_id))
    conn.commit(); cur.close(); conn.close()
    return resp(200, {"ok": True})

def get_leaderboard(conn):
    cur = conn.cursor()
    cur.execute(
        """SELECT u.id, u.name, u.avatar, u.level,
                  COUNT(CASE WHEN h.status='done' THEN 1 END) * 10 +
                  COALESCE(SUM(CASE WHEN h.grade IS NOT NULL THEN h.grade * 2 ELSE 0 END), 0) as score
           FROM users u
           LEFT JOIN homework h ON h.student_id=u.id
           WHERE u.role='student'
           GROUP BY u.id, u.name, u.avatar, u.level
           ORDER BY score DESC"""
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    return resp(200, {"leaderboard": [
        {"id": r[0], "name": r[1], "avatar": r[2], "level": r[3], "score": int(r[4] or 0)}
        for r in rows
    ]})