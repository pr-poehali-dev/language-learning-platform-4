const AUTH_URL = "https://functions.poehali.dev/8e1fb776-5df3-4087-84d5-894ba0980004";
const HOMEWORK_URL = "https://functions.poehali.dev/ada0a99c-976c-4672-bfd4-ae6d47384e64";
const API_URL = "https://functions.poehali.dev/e7c17244-0dc8-4e62-b8d4-2e668d7af9d1";

function getToken(): string {
  return localStorage.getItem("hispania_token") || "";
}

function authHeaders() {
  return { "Content-Type": "application/json", "X-Auth-Token": getToken() };
}

async function request(url: string, options: RequestInit = {}) {
  const res = await fetch(url, { ...options, headers: { ...(options.headers as object), ...authHeaders() } });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }
  // Функция может вернуть body как строку-JSON
  if (typeof data === "string") {
    try { data = JSON.parse(data as string); } catch { /* ok */ }
  }
  return { status: res.status, data };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string) {
  const r = await request(AUTH_URL, {
    method: "POST",
    body: JSON.stringify({ action: "login", email, password }),
  });
  return r.data as { token?: string; user?: ApiUser; error?: string };
}

export async function apiRegister(name: string, email: string, password: string, role: string, level?: string) {
  const r = await request(AUTH_URL, {
    method: "POST",
    body: JSON.stringify({ action: "register", name, email, password, role, level }),
  });
  return r.data as { token?: string; user?: ApiUser; error?: string };
}

export async function apiMe() {
  const r = await request(AUTH_URL);
  return r.data as { user?: ApiUser; error?: string };
}

export async function apiLogout() {
  await request(AUTH_URL, { method: "POST", body: JSON.stringify({ action: "logout" }) });
  localStorage.removeItem("hispania_token");
}

// ── Homework ──────────────────────────────────────────────────────────────────

export async function apiGetHomework() {
  const r = await request(HOMEWORK_URL);
  return r.data as { homework?: HomeworkItem[]; error?: string };
}

export async function apiCreateHomework(data: CreateHomeworkData) {
  const r = await request(HOMEWORK_URL, { method: "POST", body: JSON.stringify(data) });
  return r.data as { ok?: boolean; id?: number; error?: string };
}

export async function apiUpdateHomework(data: UpdateHomeworkData) {
  const r = await request(HOMEWORK_URL + "?p=update", { method: "POST", body: JSON.stringify(data) });
  return r.data as { ok?: boolean; error?: string };
}

export async function apiGetStudents() {
  const r = await request(HOMEWORK_URL + "?p=students");
  return r.data as { students?: StudentInfo[]; error?: string };
}

// ── API (materials, calendar, chat, notifications) ────────────────────────────

export async function apiGetMaterials() {
  const r = await request(API_URL + "?p=materials");
  return r.data as { materials?: Material[]; error?: string };
}

export async function apiCreateMaterial(data: CreateMaterialData) {
  const r = await request(API_URL + "?p=materials", { method: "POST", body: JSON.stringify(data) });
  return r.data as { ok?: boolean; id?: number; error?: string };
}

export async function apiGetCalendar() {
  const r = await request(API_URL + "?p=calendar");
  return r.data as { lessons?: Lesson[]; error?: string };
}

export async function apiCreateLesson(data: CreateLessonData) {
  const r = await request(API_URL + "?p=calendar", { method: "POST", body: JSON.stringify(data) });
  return r.data as { ok?: boolean; id?: number; error?: string };
}

export async function apiGetMessages(withUserId?: number) {
  const url = withUserId ? `${API_URL}?p=chat&with=${withUserId}` : `${API_URL}?p=chat`;
  const r = await request(url);
  return r.data as { messages?: ChatMessage[]; error?: string };
}

export async function apiSendMessage(toUserId: number, text: string) {
  const r = await request(API_URL + "?p=chat", {
    method: "POST",
    body: JSON.stringify({ to_user_id: toUserId, text }),
  });
  return r.data as { ok?: boolean; id?: number; error?: string };
}

export async function apiGetNotifications() {
  const r = await request(API_URL + "?p=notifications");
  return r.data as { notifications?: Notification[]; unread?: number; error?: string };
}

export async function apiMarkNotificationsRead() {
  await request(API_URL + "?p=notifications_read", { method: "POST", body: "{}" });
}

export async function apiGetLeaderboard() {
  const r = await request(API_URL + "?p=leaderboard");
  return r.data as { leaderboard?: LeaderboardEntry[]; error?: string };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: number;
  name: string;
  role: "student" | "teacher";
  level?: string;
  avatar: string;
}

export interface HomeworkItem {
  id: number;
  title: string;
  description: string;
  subject: string;
  due_date: string;
  status: "pending" | "inprogress" | "review" | "done";
  grade?: number;
  teacher_comment?: string;
  student_answer?: string;
  student_name?: string;
  student_avatar?: string;
  teacher_name?: string;
  teacher_avatar?: string;
  created_at: string;
}

export interface CreateHomeworkData {
  student_id: number;
  title: string;
  description?: string;
  subject?: string;
  due_date?: string;
}

export interface UpdateHomeworkData {
  id: number;
  status?: string;
  student_answer?: string;
  grade?: number;
  teacher_comment?: string;
}

export interface StudentInfo {
  id: number;
  name: string;
  avatar: string;
  level?: string;
}

export interface Material {
  id: number;
  title: string;
  description: string;
  category: string;
  file_type: string;
  file_size: string;
  file_url?: string;
  created_at: string;
  teacher_name: string;
}

export interface CreateMaterialData {
  title: string;
  description?: string;
  category?: string;
  file_type?: string;
  file_size?: string;
  file_url?: string;
}

export interface Lesson {
  id: number;
  title: string;
  topic: string;
  lesson_date: string;
  lesson_time: string;
  duration_min: number;
  lesson_type: string;
}

export interface CreateLessonData {
  topic: string;
  lesson_date: string;
  lesson_time: string;
  title?: string;
  duration_min?: number;
  lesson_type?: string;
}

export interface ChatMessage {
  id: number;
  from_user_id: number;
  to_user_id: number;
  text: string;
  is_read: boolean;
  created_at: string;
  from_name: string;
  from_avatar: string;
}

export interface Notification {
  id: number;
  text: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  avatar: string;
  level?: string;
  score: number;
}