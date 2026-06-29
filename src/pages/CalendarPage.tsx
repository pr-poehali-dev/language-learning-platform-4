import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { apiGetCalendar, apiCreateLesson, type Lesson, type User } from "@/lib/api";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

const typeColors: Record<string, string> = {
  "Грамматика": "bg-primary/15 text-primary border-primary/20",
  "Практика": "bg-green-100 text-green-700 border-green-200",
  "Повторение": "bg-blue-100 text-blue-700 border-blue-200",
  "Аудирование": "bg-purple-100 text-purple-700 border-purple-200",
};

const lessonTypes = ["Грамматика", "Практика", "Повторение", "Аудирование", "Разговорный клуб"];

export default function CalendarPage({ user }: { user: User }) {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ topic: "", lesson_date: "", lesson_time: "18:00", duration_min: 60, lesson_type: "Грамматика" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGetCalendar()
      .then(res => { if (res.lessons) setLessons(res.lessons); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstDay = new Date(current.year, current.month, 1);
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  let startDow = firstDay.getDay();
  if (startDow === 0) startDow = 7;

  const cells: (number | null)[] = [];
  for (let i = 1; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const toKey = (d: number) =>
    `${current.year}-${String(current.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const lessonMap = new Set(lessons.map(l => l.lesson_date));
  const selectedLessons = selectedDate ? lessons.filter(l => l.lesson_date === selectedDate) : [];
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const upcomingLessons = lessons
    .filter(l => l.lesson_date >= todayKey)
    .sort((a, b) => a.lesson_date.localeCompare(b.lesson_date))
    .slice(0, 4);

  const handleAddLesson = async () => {
    if (!form.topic || !form.lesson_date || !form.lesson_time) return;
    setSaving(true);
    try {
      const res = await apiCreateLesson(form);
      if (res.ok) {
        const updated = await apiGetCalendar();
        if (updated.lessons) setLessons(updated.lessons);
        setShowAdd(false);
        setForm({ topic: "", lesson_date: "", lesson_time: "18:00", duration_min: 60, lesson_type: "Грамматика" });
      }
    } catch {
      // сетевая ошибка — просто разблокируем кнопку
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

        {/* Calendar */}
        <div className="md:col-span-3 bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <button onClick={() => {
              if (current.month === 0) setCurrent({ year: current.year - 1, month: 11 });
              else setCurrent({ ...current, month: current.month - 1 });
            }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Icon name="ChevronLeft" size={18} className="text-muted-foreground" />
            </button>
            <h3 className="font-montserrat font-bold text-foreground">
              {MONTHS[current.month]} {current.year}
            </h3>
            <button onClick={() => {
              if (current.month === 11) setCurrent({ year: current.year + 1, month: 0 });
              else setCurrent({ ...current, month: current.month + 1 });
            }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Icon name="ChevronRight" size={18} className="text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-border">
            {DAYS.map(d => (
              <div key={d} className={`py-2 text-center text-xs font-montserrat font-bold ${d === "Сб" || d === "Вс" ? "text-red-400" : "text-muted-foreground"}`}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 p-2 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const key = toKey(day);
              const hasLesson = lessonMap.has(key);
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              return (
                <button key={i} onClick={() => setSelectedDate(key)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-ibm transition-all duration-150
                    ${isSelected ? "red-accent text-white font-bold shadow-sm" : isToday ? "bg-accent/20 text-foreground font-bold" : "hover:bg-muted text-foreground"}`}
                >
                  {day}
                  {hasLesson && <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/70" : "bg-primary"}`} />}
                </button>
              );
            })}
          </div>

          <div className="px-4 pb-4 flex items-center gap-4 text-xs text-muted-foreground font-ibm">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /><span>Есть занятие</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-lg bg-accent/20" /><span>Сегодня</span></div>
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-2 space-y-3">
          {user.role === "teacher" && (
            <button onClick={() => setShowAdd(!showAdd)}
              className="w-full flex items-center justify-center gap-2 py-2.5 red-accent text-white rounded-xl text-sm font-montserrat font-medium hover:opacity-90 transition-opacity">
              <Icon name="Plus" size={16} />
              Добавить занятие
            </button>
          )}

          {showAdd && (
            <div className="bg-card rounded-xl border border-border p-4 space-y-3 animate-scale-in">
              <p className="font-montserrat font-bold text-sm text-foreground">Новое занятие</p>
              <input type="text" placeholder="Тема урока" value={form.topic}
                onChange={e => setForm({ ...form, topic: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={form.lesson_date} onChange={e => setForm({ ...form, lesson_date: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40" />
                <input type="time" value={form.lesson_time} onChange={e => setForm({ ...form, lesson_time: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40" />
              </div>
              <select value={form.lesson_type} onChange={e => setForm({ ...form, lesson_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40">
                {lessonTypes.map(t => <option key={t}>{t}</option>)}
              </select>
              <button onClick={handleAddLesson} disabled={saving}
                className="w-full py-2 red-accent text-white rounded-lg text-sm font-montserrat font-medium hover:opacity-90 disabled:opacity-60">
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
            </div>
          )}

          {selectedDate ? (
            <>
              <div className="flex items-center gap-2 px-1">
                <Icon name="CalendarDays" size={16} className="text-primary" />
                <p className="font-montserrat font-bold text-sm text-foreground">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" })}
                </p>
              </div>
              {selectedLessons.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-6 text-center">
                  <Icon name="CalendarX" size={32} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm font-ibm">Занятий нет</p>
                </div>
              ) : selectedLessons.map((l, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-4 card-hover animate-scale-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-montserrat font-medium ${typeColors[l.lesson_type] || "bg-muted text-muted-foreground border-border"}`}>{l.lesson_type}</span>
                    <span className="font-montserrat font-bold text-primary text-sm">{l.lesson_time}</span>
                  </div>
                  <h4 className="font-montserrat font-bold text-foreground text-sm mb-3">{l.topic}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="Clock" size={13} /><span className="font-ibm">{l.duration_min} минут</span>
                  </div>
                  <button className="mt-4 w-full py-2 rounded-lg border border-primary text-primary text-sm font-montserrat font-medium hover:bg-primary hover:text-white transition-colors">
                    Присоединиться к уроку
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <Icon name="MousePointerClick" size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm font-ibm">Выберите дату в календаре</p>
            </div>
          )}

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="font-montserrat font-bold text-xs text-foreground">Ближайшие занятия</p>
            </div>
            {loading ? (
              <div className="p-4 text-center text-xs text-muted-foreground font-ibm">Загрузка...</div>
            ) : upcomingLessons.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground font-ibm">Нет занятий</div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingLessons.map((l, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="BookOpen" size={14} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate font-ibm">{l.topic}</p>
                      <p className="text-xs text-muted-foreground">{l.lesson_date} · {l.lesson_time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}