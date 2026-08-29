"""
Библиотека: книги и аудиофайлы преподавателя.
GET    /library          — список книг (учитель видит все, ученик — только выданные)
POST   /library          — загрузить книгу или аудио в хранилище
DELETE /library?id=      — удалить книгу вместе с файлом
POST   /library?p=assign — выдать книгу ученику или группе
"""
import json
import os
import base64
import uuid
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-User-Id",
    "Access-Control-Max-Age": "86400",
}

MAX_MB = 60


def resp(code, data):
    return {
        "statusCode": code,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(data, default=str),
        "isBase64Encoded": False,
    }


def s3_client():
    import boto3
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def auth(event, conn):
    token = (event.get("headers") or {}).get("X-Auth-Token") or (event.get("headers") or {}).get("x-auth-token")
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        """SELECT u.id, u.role, u.name FROM sessions s JOIN users u ON u.id=s.user_id
           WHERE s.token=%s AND s.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    return row


def handler(event: dict, context) -> dict:
    """Библиотека книг и аудио: загрузка в хранилище, выдача ученикам и группам."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    user = auth(event, conn)
    if not user:
        conn.close()
        return resp(401, {"error": "Требуется вход"})
    user_id, role, _ = user

    params = event.get("queryStringParameters") or {}
    action = params.get("p") or ""

    try:
        if method == "GET":
            return list_items(conn, user_id, role)
        if method == "POST" and action == "assign":
            return assign_item(event, conn, user_id, role)
        if method == "POST":
            return upload_item(event, conn, user_id, role)
        if method == "DELETE":
            return delete_item(event, conn, user_id, role)
        conn.close()
        return resp(404, {"error": "Неизвестный запрос"})
    except Exception as e:
        conn.close()
        return resp(500, {"error": str(e)})


def list_items(conn, user_id, role):
    cur = conn.cursor()
    if role == "teacher":
        cur.execute(
            """SELECT id, title, author, description, kind, file_url, file_name,
                      mime, size_bytes, duration_sec, created_at
               FROM library_items WHERE teacher_id=%s ORDER BY created_at DESC""",
            (user_id,)
        )
    else:
        cur.execute(
            """SELECT i.id, i.title, i.author, i.description, i.kind, i.file_url, i.file_name,
                      i.mime, i.size_bytes, i.duration_sec, i.created_at
               FROM library_items i JOIN library_assignments a ON a.item_id=i.id
               WHERE a.student_id=%s ORDER BY a.created_at DESC""",
            (user_id,)
        )
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    items = [dict(zip(cols, r)) for r in rows]

    if role == "teacher" and items:
        ids = ",".join(str(i["id"]) for i in items)
        by_id = {i["id"]: i for i in items}
        for it in items:
            it["students"] = []
        cur.execute(
            f"""SELECT a.item_id, u.id, u.name, u.avatar FROM library_assignments a
                JOIN users u ON u.id=a.student_id WHERE a.item_id IN ({ids}) ORDER BY u.name"""
        )
        for item_id, sid, sname, savatar in cur.fetchall():
            if item_id in by_id:
                by_id[item_id]["students"].append({"id": sid, "name": sname, "avatar": savatar})

    cur.close()
    conn.close()
    return resp(200, {"items": items})


def upload_item(event, conn, user_id, role):
    if role != "teacher":
        conn.close()
        return resp(403, {"error": "Только преподаватель"})
    body = json.loads(event.get("body") or "{}")
    title = (body.get("title") or "").strip()
    data_b64 = body.get("file_data")
    if not title:
        conn.close()
        return resp(400, {"error": "Укажите название"})
    if not data_b64:
        conn.close()
        return resp(400, {"error": "Прикрепите файл"})

    raw = base64.b64decode(data_b64.split(",")[-1])
    if len(raw) > MAX_MB * 1024 * 1024:
        conn.close()
        return resp(400, {"error": f"Файл больше {MAX_MB} МБ"})

    file_name = (body.get("file_name") or "file").strip()
    mime = body.get("mime") or "application/octet-stream"
    kind = "audio" if mime.startswith("audio/") else "book"
    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "bin"
    key = f"library/{user_id}/{uuid.uuid4().hex}.{ext}"

    s3_client().put_object(Bucket="files", Key=key, Body=raw, ContentType=mime)
    url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    cur = conn.cursor()
    cur.execute(
        """INSERT INTO library_items
           (teacher_id, title, author, description, kind, file_url, file_name, file_key, mime, size_bytes, duration_sec)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
        (user_id, title, (body.get("author") or "").strip(), (body.get("description") or "").strip(),
         kind, url, file_name, key, mime, len(raw), int(body.get("duration_sec") or 0))
    )
    item_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return resp(200, {"ok": True, "id": item_id, "file_url": url, "kind": kind})


def delete_item(event, conn, user_id, role):
    if role != "teacher":
        conn.close()
        return resp(403, {"error": "Только преподаватель"})
    params = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}")
    item_id = body.get("id") or params.get("id")
    if not item_id:
        conn.close()
        return resp(400, {"error": "Укажите книгу"})

    cur = conn.cursor()
    cur.execute("SELECT file_key FROM library_items WHERE id=%s AND teacher_id=%s", (item_id, user_id))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return resp(404, {"error": "Книга не найдена"})

    if row[0]:
        try:
            s3_client().delete_object(Bucket="files", Key=row[0])
        except Exception:
            pass

    cur.execute("DELETE FROM library_assignments WHERE item_id=%s", (item_id,))
    cur.execute("DELETE FROM library_items WHERE id=%s AND teacher_id=%s", (item_id, user_id))
    conn.commit()
    cur.close()
    conn.close()
    return resp(200, {"ok": True})


def assign_item(event, conn, user_id, role):
    if role != "teacher":
        conn.close()
        return resp(403, {"error": "Только преподаватель"})
    body = json.loads(event.get("body") or "{}")
    item_id = body.get("item_id")
    group_id = body.get("group_id")
    raw_ids = body.get("student_ids") or []
    if not item_id:
        conn.close()
        return resp(400, {"error": "Укажите книгу"})

    cur = conn.cursor()
    cur.execute("SELECT title FROM library_items WHERE id=%s AND teacher_id=%s", (item_id, user_id))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return resp(404, {"error": "Книга не найдена"})
    title = row[0]

    student_ids = []
    if group_id:
        cur.execute("SELECT student_id FROM group_members WHERE group_id=%s", (int(group_id),))
        student_ids = [r[0] for r in cur.fetchall()]
    else:
        for s in raw_ids:
            try:
                student_ids.append(int(s))
            except (TypeError, ValueError):
                pass

    if not student_ids:
        cur.close()
        conn.close()
        return resp(400, {"error": "Выберите ученика или группу"})

    added = 0
    for sid in student_ids:
        cur.execute(
            """INSERT INTO library_assignments (item_id, student_id, group_id, assigned_by)
               VALUES (%s,%s,%s,%s) ON CONFLICT (item_id, student_id) DO NOTHING""",
            (item_id, sid, group_id, user_id)
        )
        cur.execute(
            "INSERT INTO notifications (user_id, text, type) VALUES (%s,%s,'material')",
            (sid, f"Вам выдана книга: {title}")
        )
        added += 1

    conn.commit()
    cur.close()
    conn.close()
    return resp(200, {"ok": True, "assigned": added})
