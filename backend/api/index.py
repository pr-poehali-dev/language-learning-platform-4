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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
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
    path = event.get("path", "/")

    try:
        # --- Materials ---
        if "/materials" in path:
            if method == "GET":
                return get_materials(conn)
            if method == "POST":
                return create_material(event, conn, user_id, role)

        # --- Calendar ---
        if "/calendar" in path:
            if method == "GET":
                return get_lessons(conn, user_id, role)
            if method == "POST":
                return create_lesson(event, conn, user_id, role)

        # --- Chat ---
        if "/chat/messages" in path:
            if method == "GET":
                return get_messages(event, conn, user_id)
            if method == "POST":
                return send_message(event, conn, user_id, user_name)

        # --- Notifications ---
        if "/notifications/read" in path and method == "POST":
            return mark_notifications_read(conn, user_id)
        if "/notifications" in path and method == "GET":
            return get_notifications(conn, user_id)

        # --- Students list ---
        if "/students" in path and method == "GET":
            return get_students(conn)

        # --- Leaderboard ---
        if "/leaderboard" in path and method == "GET":
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
    cur.close(); conn.close()
    result = []
    for row in rows:
        item = dict(zip(cols, row))
        if item.get("lesson_date"):
            item["lesson_date"] = item["lesson_date"].strftime("%Y-%m-%d")
        if item.get("lesson_time"):
            item["lesson_time"] = str(item["lesson_time"])[:5]
        result.append(item)
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
    cur.execute("SELECT id FROM users WHERE role='student'")
    for (sid,) in cur.fetchall():
        cur.execute("INSERT INTO lesson_students (lesson_id, student_id) VALUES (%s,%s)", (lesson_id, sid))
        cur.execute("INSERT INTO notifications (user_id, text, type) VALUES (%s,%s,'calendar')",
                    (sid, f"Новое занятие {lesson_date} {lesson_time}: {topic}"))
    conn.commit(); cur.close(); conn.close()
    return resp(200, {"ok": True, "id": lesson_id})


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
    cur.execute("SELECT id, name, avatar, level FROM users WHERE role='student' ORDER BY name")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return resp(200, {"students": [{"id": r[0], "name": r[1], "avatar": r[2], "level": r[3]} for r in rows]})

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
