"""
Авторизация: вход, выход, проверка сессии, сброс пароля.
POST /login — вход по email+password, возвращает токен
POST /logout — выход (инвалидация токена)
POST /reset_request — заявка на сброс пароля (студент)
POST /reset_do — сброс пароля преподавателем
GET  /reset_list — список заявок (преподаватель)
GET  / — проверка токена, возвращает данные пользователя
"""
import json
import os
import secrets
import psycopg2
from datetime import datetime, timedelta

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    if method == "POST" and action == "login":
        return login(event)
    if method == "POST" and action == "register":
        return register(event)
    if method == "POST" and action == "logout":
        return logout(event)
    if method == "POST" and action == "reset_request":
        return reset_request(event)
    if method == "POST" and action == "reset_do":
        return reset_do(event)
    if method == "GET":
        params = event.get("queryStringParameters") or {}
        if params.get("p") == "reset_list":
            return reset_list(event)
        return me(event)

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}


def login(event):
    body = json.loads(event.get("body") or "{}")
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Email и пароль обязательны"})}

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, role, level, avatar FROM users WHERE email=%s AND password_hash=%s",
        (email, password)
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный email или пароль"})}

    user_id, name, role, level, avatar = row
    token = secrets.token_hex(32)
    expires = datetime.now() + timedelta(days=30)

    cur.execute(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user_id, token, expires)
    )
    conn.commit()
    cur.close(); conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "token": token,
            "user": {"id": user_id, "name": name, "role": role, "level": level, "avatar": avatar}
        })
    }


def register(event):
    body = json.loads(event.get("body") or "{}")
    name = body.get("name", "").strip()
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")
    role = body.get("role", "student")
    level = body.get("level", "A1")

    if not name or not email or not password:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Имя, email и пароль обязательны"})}
    if len(password) < 6:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Пароль должен быть не менее 6 символов"})}
    if role not in ("student", "teacher"):
        role = "student"

    # Генерируем аватар из первых букв имени
    parts = name.split()
    avatar = (parts[0][0] + (parts[1][0] if len(parts) > 1 else parts[0][1])).upper()

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email=%s", (email,))
    if cur.fetchone():
        cur.close(); conn.close()
        return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Пользователь с таким email уже существует"})}

    cur.execute(
        "INSERT INTO users (email, password_hash, name, role, level, avatar) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
        (email, password, name, role, level if role == "student" else None, avatar)
    )
    user_id = cur.fetchone()[0]

    token = secrets.token_hex(32)
    expires = datetime.now() + timedelta(days=30)
    cur.execute("INSERT INTO sessions (user_id, token, expires_at) VALUES (%s,%s,%s)", (user_id, token, expires))
    conn.commit()
    cur.close(); conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "token": token,
            "user": {"id": user_id, "name": name, "role": role, "level": level if role == "student" else None, "avatar": avatar}
        })
    }


def logout(event):
    token = event.get("headers", {}).get("X-Auth-Token", "")
    if token:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM sessions WHERE token=%s", (token,))
        # просто помечаем как истёкший
        cur.execute("UPDATE sessions SET expires_at=NOW() WHERE token=%s", (token,))
        conn.commit()
        cur.close(); conn.close()
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}


def get_authed_user(event):
    token = event.get("headers", {}).get("X-Auth-Token", "")
    if not token:
        return None, None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=%s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return None, None
    return row[0], row[1]


def reset_request(event):
    body = json.loads(event.get("body") or "{}")
    email = body.get("email", "").strip().lower()
    if not email:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите email"})}
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email=%s", (email,))
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}
    user_id = row[0]
    cur.execute(
        "SELECT id FROM password_resets WHERE user_id=%s AND status='pending'",
        (user_id,)
    )
    if cur.fetchone():
        cur.close(); conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "already": True})}
    cur.execute("INSERT INTO password_resets (user_id) VALUES (%s)", (user_id,))
    conn.commit(); cur.close(); conn.close()
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}


def reset_list(event):
    user_id, role = get_authed_user(event)
    if not user_id or role != "teacher":
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """SELECT r.id, u.id as user_id, u.name, u.email, r.status, r.created_at
           FROM password_resets r JOIN users u ON u.id=r.user_id
           WHERE r.status='pending' ORDER BY r.created_at DESC"""
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    resets = [{"id": r[0], "user_id": r[1], "name": r[2], "email": r[3], "status": r[4], "created_at": r[5].isoformat()} for r in rows]
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"resets": resets})}


def reset_do(event):
    user_id, role = get_authed_user(event)
    if not user_id or role != "teacher":
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}
    body = json.loads(event.get("body") or "{}")
    reset_id = body.get("reset_id")
    target_user_id = body.get("user_id")
    new_password = body.get("new_password", "").strip()
    if not reset_id or not target_user_id or not new_password:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите reset_id, user_id и new_password"})}
    if len(new_password) < 6:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Пароль должен быть не менее 6 символов"})}
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE users SET password_hash=%s WHERE id=%s", (new_password, target_user_id))
    cur.execute("UPDATE password_resets SET status='done', resolved_at=NOW() WHERE id=%s", (reset_id,))
    conn.commit(); cur.close(); conn.close()
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}


def me(event):
    token = event.get("headers", {}).get("X-Auth-Token", "")
    if not token:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """SELECT u.id, u.name, u.role, u.level, u.avatar
           FROM sessions s JOIN users u ON u.id=s.user_id
           WHERE s.token=%s AND s.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()

    if not row:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия истекла"})}

    user_id, name, role, level, avatar = row
    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"user": {"id": user_id, "name": name, "role": role, "level": level, "avatar": avatar}})
    }