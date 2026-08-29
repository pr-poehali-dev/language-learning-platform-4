import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/pages/LoginPage";
import {
  apiGetChatContacts, apiGetMessages, apiSendMessage, apiEditMessage, apiDeleteMessage,
  type ChatMessage, type ChatContact, type ChatGroup,
} from "@/lib/api";
import { useChatAlerts } from "@/hooks/useChatAlerts";

type Target = { kind: "user"; id: number; name: string; avatar: string }
            | { kind: "group"; id: number; name: string; count: number };

function timeOf(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T"));
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function fmtSec(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function Attachment({ m }: { m: ChatMessage }) {
  if (!m.file_url) return null;
  if (m.file_type === "audio") {
    return (
      <div className="mt-1.5">
        <audio controls src={m.file_url} className="h-9 max-w-full" />
        {!!m.audio_sec && <p className="text-[10px] opacity-70 mt-0.5">{fmtSec(m.audio_sec)}</p>}
      </div>
    );
  }
  if (m.file_type === "image") {
    return (
      <a href={m.file_url} target="_blank" rel="noreferrer" className="block mt-1.5">
        <img src={m.file_url} alt={m.file_name} className="rounded-lg max-h-52 object-cover" />
      </a>
    );
  }
  return (
    <a href={m.file_url} target="_blank" rel="noreferrer"
      className="mt-1.5 flex items-center gap-2 px-2.5 py-2 rounded-lg bg-black/10 hover:bg-black/15 transition-colors">
      <Icon name="Paperclip" size={14} className="flex-shrink-0" />
      <span className="text-xs font-ibm truncate">{m.file_name || "Файл"}</span>
    </a>
  );
}

export default function ChatPage({ user }: { user: User }) {
  const isTeacher = user.role === "teacher";
  const { refresh } = useChatAlerts();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [target, setTarget] = useState<Target | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [listOpen, setListOpen] = useState(true);

  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [delMsg, setDelMsg] = useState<ChatMessage | null>(null);
  const [pending, setPending] = useState<{ name: string; type: string; mime: string; data: string; sec?: number } | null>(null);
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadContacts = useCallback(() => {
    apiGetChatContacts().then(res => {
      if (res.contacts) setContacts(res.contacts);
      if (res.groups) setGroups(res.groups);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadContacts();
    const t = setInterval(loadContacts, 25000);
    return () => clearInterval(t);
  }, [loadContacts]);

  const loadMessages = useCallback(() => {
    if (!target) return;
    if (target.kind === "group") {
      const ids = groups.find(g => g.id === target.id)?.students.map(s => s.id) || [];
      if (!ids.length) { setMessages([]); return; }
      apiGetMessages(ids[0]).then(res => {
        setMessages((res.messages || []).filter(m => m.group_id === target.id));
      }).catch(() => {});
      return;
    }
    apiGetMessages(target.id).then(res => {
      setMessages(res.messages || []);
      refresh();
      loadContacts();
    }).catch(() => {});
  }, [target, groups, refresh, loadContacts]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    if (!target) return;
    const t = setInterval(loadMessages, 8000);
    return () => clearInterval(t);
  }, [target, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toBase64 = (file: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const pickFile = async (f: File) => {
    if (f.size > 15 * 1024 * 1024) { setErr("Файл больше 15 МБ"); return; }
    const data = await toBase64(f);
    setPending({
      name: f.name,
      type: f.type.startsWith("image/") ? "image" : f.type.startsWith("audio/") ? "audio" : "file",
      mime: f.type || "application/octet-stream",
      data,
    });
    setErr("");
  };

  const startRec = async () => {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const data = await toBase64(blob);
        setPending({ name: "Голосовое сообщение", type: "audio", mime: "audio/webm", data, sec: recSec });
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      setRecSec(0);
      timerRef.current = window.setInterval(() => setRecSec(s => s + 1), 1000);
    } catch {
      setErr("Нет доступа к микрофону");
    }
  };

  const stopRec = (save: boolean) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      if (!save) rec.onstop = () => rec.stream.getTracks().forEach(t => t.stop());
      rec.stop();
    }
    setRecording(false);
  };

  const saveEdit = async () => {
    if (editId === null || !editText.trim()) return;
    const res = await apiEditMessage(editId, editText.trim());
    if (res.ok) { setEditId(null); loadMessages(); loadContacts(); }
    else setErr(res.error || "Не удалось изменить");
  };

  const removeMsg = async (scope: "me" | "all") => {
    if (!delMsg) return;
    const res = await apiDeleteMessage(delMsg.id, scope);
    if (res.ok) { setDelMsg(null); loadMessages(); loadContacts(); }
    else setErr(res.error || "Не удалось удалить");
  };

  const send = async () => {
    if (!target) return;
    if (!text.trim() && !pending) return;
    setSending(true);
    setErr("");
    try {
      const res = await apiSendMessage({
        ...(target.kind === "group" ? { group_id: target.id } : { to_user_id: target.id }),
        text: text.trim(),
        ...(pending ? {
          file_data: pending.data, file_name: pending.name,
          file_type: pending.type, mime: pending.mime, audio_sec: pending.sec || 0,
        } : {}),
      });
      if (res.ok) {
        setText(""); setPending(null); setRecSec(0);
        loadMessages(); loadContacts();
      } else setErr(res.error || "Не удалось отправить");
    } catch {
      setErr("Нет связи с сервером");
    } finally {
      setSending(false);
    }
  };

  const targetOnline = target?.kind === "user" && !!contacts.find(c => c.id === target.id)?.online;
  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col md:flex-row h-[calc(100vh-9rem)] min-h-[500px]">

        {/* Список собеседников */}
        <div className={`md:w-72 md:flex-shrink-0 border-b md:border-b-0 md:border-r border-border flex flex-col
          ${listOpen ? "flex" : "hidden md:flex"}`}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isTeacher && filteredGroups.length > 0 && (
              <div className="px-3 pt-3 pb-1">
                <p className="text-[10px] font-montserrat font-bold text-muted-foreground uppercase tracking-wide">Группы</p>
              </div>
            )}
            {isTeacher && filteredGroups.map(g => {
              const active = target?.kind === "group" && target.id === g.id;
              return (
                <button key={"g" + g.id}
                  onClick={() => { setTarget({ kind: "group", id: g.id, name: g.name, count: g.students.length }); setListOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${active ? "bg-muted" : "hover:bg-muted/50"}`}>
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: g.color || "#c0392b" }}>
                    <Icon name="Users" size={16} className="text-white" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-montserrat font-bold text-foreground truncate">{g.name}</span>
                    <span className="block text-xs text-muted-foreground font-ibm">{g.students.length} учеников</span>
                  </span>
                </button>
              );
            })}

            <div className="px-3 pt-3 pb-1">
              <p className="text-[10px] font-montserrat font-bold text-muted-foreground uppercase tracking-wide">
                {isTeacher ? "Ученики" : "Преподаватели"}
              </p>
            </div>
            {filtered.map(c => {
              const active = target?.kind === "user" && target.id === c.id;
              return (
                <button key={c.id}
                  onClick={() => { setTarget({ kind: "user", id: c.id, name: c.name, avatar: c.avatar }); setListOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${active ? "bg-muted" : "hover:bg-muted/50"}`}>
                  <span className="relative flex-shrink-0">
                    <span className="w-9 h-9 rounded-full red-accent flex items-center justify-center">
                      <span className="text-white font-montserrat font-bold text-xs">{c.avatar}</span>
                    </span>
                    {c.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-montserrat font-bold text-foreground truncate">{c.name}</span>
                      {!!c.unread && (
                        <span className="bg-accent text-accent-foreground text-[10px] font-bold px-1.5 rounded-full">{c.unread}</span>
                      )}
                    </span>
                    <span className="block text-xs text-muted-foreground font-ibm truncate">{c.last_text || "Нет сообщений"}</span>
                  </span>
                </button>
              );
            })}
            {!filtered.length && !filteredGroups.length && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground font-ibm">Никого не найдено</p>
            )}
          </div>
        </div>

        {/* Переписка */}
        <div className={`flex-1 flex flex-col min-w-0 ${listOpen ? "hidden md:flex" : "flex"}`}>
          {!target ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <Icon name="MessageSquare" size={40} className="text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground font-ibm">
                Выберите {isTeacher ? "ученика или группу" : "преподавателя"}, чтобы начать переписку
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <button onClick={() => setListOpen(true)} className="md:hidden text-muted-foreground">
                  <Icon name="ChevronLeft" size={20} />
                </button>
                <span className="relative flex-shrink-0">
                  <span className={`w-9 h-9 ${target.kind === "group" ? "rounded-lg" : "rounded-full"} red-accent flex items-center justify-center`}>
                    {target.kind === "group"
                      ? <Icon name="Users" size={16} className="text-white" />
                      : <span className="text-white font-montserrat font-bold text-xs">{target.avatar}</span>}
                  </span>
                  {target.kind === "user" && targetOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-montserrat font-bold text-foreground truncate">{target.name}</p>
                  {target.kind === "group" ? (
                    <p className="text-xs text-muted-foreground font-ibm">Рассылка · {target.count} учеников</p>
                  ) : (
                    <p className={`text-xs font-ibm flex items-center gap-1 ${targetOnline ? "text-green-600" : "text-muted-foreground"}`}>
                      {targetOnline && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                      {targetOnline ? "В сети" : "Не в сети"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {!messages.length && (
                  <p className="text-center text-sm text-muted-foreground font-ibm py-8">
                    {target.kind === "group" ? "Напишите первое сообщение группе" : "Сообщений пока нет"}
                  </p>
                )}
                {messages.map(m => {
                  const mine = m.from_user_id === Number(user.id);
                  const editing = editId === m.id;
                  return (
                    <div key={m.id} className={`group flex items-end gap-1.5 ${mine ? "justify-end" : "justify-start"}`}>
                      {mine && !editing && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!m.file_url && (
                            <button onClick={() => { setEditId(m.id); setEditText(m.text); }} title="Изменить"
                              className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground">
                              <Icon name="Pencil" size={12} />
                            </button>
                          )}
                          <button onClick={() => setDelMsg(m)} title="Удалить"
                            className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-red-600">
                            <Icon name="Trash2" size={12} />
                          </button>
                        </div>
                      )}
                      {!mine && (
                        <button onClick={() => setDelMsg(m)} title="Удалить у себя"
                          className="order-2 w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Icon name="Trash2" size={12} />
                        </button>
                      )}

                      <div className={`max-w-[80%] sm:max-w-md rounded-2xl px-3.5 py-2
                        ${mine ? "red-accent text-white rounded-br-sm" : "bg-card border border-border text-foreground rounded-bl-sm"}`}>
                        {!mine && (
                          <p className="text-[11px] font-montserrat font-bold opacity-70 mb-0.5">{m.from_name}</p>
                        )}

                        {editing ? (
                          <div className="space-y-2 min-w-[200px]">
                            <textarea rows={2} value={editText} onChange={e => setEditText(e.target.value)} autoFocus
                              className="w-full px-2 py-1.5 rounded-lg text-sm font-ibm text-foreground bg-white/95 outline-none resize-none" />
                            <div className="flex gap-1.5">
                              <button onClick={() => setEditId(null)}
                                className="flex-1 py-1 rounded-lg bg-white/20 text-xs font-montserrat font-medium">Отмена</button>
                              <button onClick={saveEdit}
                                className="flex-1 py-1 rounded-lg bg-white text-red-700 text-xs font-montserrat font-bold">Сохранить</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {m.text && <p className="text-sm font-ibm whitespace-pre-wrap break-words">{m.text}</p>}
                            <Attachment m={m} />
                            <p className={`text-[10px] mt-1 flex items-center gap-1 ${mine ? "text-white/70 justify-end" : "text-muted-foreground"}`}>
                              <span>{timeOf(m.created_at)}{m.edited_at ? " · изменено" : ""}</span>
                              {mine && (
                                <span title={m.is_read ? "Прочитано" : "Отправлено"} className="flex items-center">
                                  <Icon name={m.is_read ? "CheckCheck" : "Check"} size={13}
                                    className={m.is_read ? "text-white" : "text-white/60"} />
                                </span>
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Ввод */}
              <div className="border-t border-border p-3">
                {err && <p className="text-xs text-red-600 font-ibm mb-2">{err}</p>}

                {pending && (
                  <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-muted border border-border">
                    <Icon name={pending.type === "audio" ? "Mic" : pending.type === "image" ? "Image" : "Paperclip"}
                      size={14} className="text-primary flex-shrink-0" />
                    <span className="text-xs font-ibm text-foreground truncate flex-1">
                      {pending.name}{pending.sec ? ` · ${fmtSec(pending.sec)}` : ""}
                    </span>
                    <button onClick={() => setPending(null)} className="text-muted-foreground hover:text-foreground">
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                )}

                {recording ? (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-red-200 bg-red-50">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse flex-shrink-0" />
                    <span className="text-sm font-ibm text-red-700 flex-1">Идёт запись · {fmtSec(recSec)}</span>
                    <button onClick={() => stopRec(false)}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs font-montserrat font-medium text-foreground bg-card hover:bg-muted">
                      Отменить
                    </button>
                    <button onClick={() => stopRec(true)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-montserrat font-bold hover:bg-red-700">
                      Готово
                    </button>
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <input ref={fileRef} type="file" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }} />

                    <button onClick={() => fileRef.current?.click()} title="Прикрепить файл"
                      className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0">
                      <Icon name="Paperclip" size={18} />
                    </button>

                    <button onClick={startRec} title="Записать голосовое"
                      className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0">
                      <Icon name="Mic" size={18} />
                    </button>

                    <textarea rows={1} value={text} onChange={e => setText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      placeholder={target.kind === "group" ? `Сообщение группе «${target.name}»` : "Написать сообщение..."}
                      className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40 resize-none max-h-32" />

                    <button onClick={send} disabled={sending || (!text.trim() && !pending)}
                      className="w-10 h-10 rounded-lg red-accent text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0">
                      <Icon name={sending ? "Loader" : "Send"} size={18} className={sending ? "animate-spin" : ""} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {delMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDelMsg(null)} />
          <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-5 animate-scale-in">
            <h2 className="font-montserrat font-bold text-base text-foreground mb-1">Удалить сообщение</h2>
            <p className="text-sm text-muted-foreground font-ibm mb-4 line-clamp-2">
              {delMsg.text || delMsg.file_name || "Вложение"}
            </p>

            <div className="space-y-2">
              <button onClick={() => removeMsg("me")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted transition-colors text-left">
                <Icon name="EyeOff" size={18} className="text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-montserrat font-bold text-foreground">Удалить только у меня</p>
                  <p className="text-xs text-muted-foreground font-ibm">Собеседник продолжит видеть</p>
                </div>
              </button>

              {delMsg.from_user_id === Number(user.id) && (
                <button onClick={() => removeMsg("all")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors text-left">
                  <Icon name="Trash2" size={18} className="text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-montserrat font-bold text-red-600">Удалить у всех</p>
                    <p className="text-xs text-muted-foreground font-ibm">Пропадёт и у получателя</p>
                  </div>
                </button>
              )}

              <button onClick={() => setDelMsg(null)}
                className="w-full py-2 rounded-lg text-sm font-montserrat font-medium text-muted-foreground hover:text-foreground transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}