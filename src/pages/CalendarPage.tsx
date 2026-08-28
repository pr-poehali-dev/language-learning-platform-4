import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { apiGetCalendar, apiCreateLesson, type Lesson, type User } from "@/lib/api";

const DAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

const TIME_SLOTS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

const typeColors: Record<string, string> = {
  "Грамматика": "bg-primary/15 text-primary border-primary/20",
  "Практика": "bg-green-100 text-green-700 border-green-200",
  "Повторение": "bg-blue-100 text-blue-700 border-blue-200",
  "Аудирование": "bg-purple-100 text-purple-700 border-purple-200",
};

const lessonTypes = ["Грамматика", "Практика", "Повторение", "Аудирование", "Разговорный клуб"];

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const getMonday = (d: Date) => {
  const date = new Date(d);
  const dow = date.getDay() === 0 ? 7 : date.getDay();
  date.setDate(date.getDate() - (dow - 1));
  date.setHours(12, 0, 0, 0);
  return date;
};

export default function CalendarPage({ user }: { user: User }) {
  const today = new Date();
  const todayKey = toKey(today);
  const currentMonday = getMonday(today);

  const [weekStart, setWeekStart] = useState<Date>(currentMonday);
  const [selected, setSelected] = useState<{ date: string; time: string } | null>(null);
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

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const weekEnd = weekDays[6];
  const isCurrentWeek = toKey(weekStart) === toKey(currentMonday);

  const shiftWeek = (delta: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
    setSelected(null);
  };

  const findLesson = (dateKey: string, time: string) =>
    lessons.find(l => l.lesson_date === dateKey && l.lesson_time.slice(0, 5) === time);

  const selectedLesson = selected ? findLesson(selected.date, selected.time) : null;

  const rangeLabel = `${weekStart.getDate()} ${MONTHS_GEN[weekStart.getMonth()]} - ${weekEnd.getDate()} ${MONTHS_GEN[weekEnd.getMonth()]}`;

  const handleSlotClick = (dateKey: string, time: string) => {
    const lesson = findLesson(dateKey, time);
    setSelected({ date: dateKey, time });
    if (!lesson && user.role === "teacher") {
      setForm({ ...form, lesson_date: dateKey, lesson_time: time });
      setShowAdd(true);
    }
  };

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
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Week schedule */}
        <div className="lg:col-span-3 bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 md:px-5 py-3 border-b border-border flex-wrap">
            <button onClick={() => shiftWeek(-1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs md:text-sm font-montserrat font-medium text-foreground hover:bg-muted transition-colors">
              <Icon name="ChevronLeft" size={15} />
              предыдущая
            </button>

            <div className="flex items-center gap-2">
              <h3 className="font-montserrat font-bold text-foreground text-sm md:text-base">{rangeLabel}</h3>
              {isCurrentWeek ? (
                <span className="text-xs px-2 py-0.5 rounded bg-sky-400 text-white font-montserrat font-medium">Текущая неделя</span>
              ) : (
                <button onClick={() => { setWeekStart(currentMonday); setSelected(null); }}
                  className="text-xs px-2 py-0.5 rounded border border-sky-400 text-sky-500 font-montserrat font-medium hover:bg-sky-50 transition-colors">
                  к текущей
                </button>
              )}
            </div>

            <button onClick={() => shiftWeek(1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs md:text-sm font-montserrat font-medium text-foreground hover:bg-muted transition-colors">
              следующая
              <Icon name="ChevronRight" size={15} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-7 border-b border-border bg-muted/40">
                {weekDays.map((d, i) => {
                  const isToday = toKey(d) === todayKey;
                  const isWeekend = i >= 5;
                  return (
                    <div key={i} className={`py-2 text-center border-r border-border last:border-r-0 ${isToday ? "bg-accent/20" : ""}`}>
                      <span className={`text-xs font-montserrat font-bold ${isWeekend ? "text-red-400" : "text-foreground"}`}>
                        {DAYS[i]} {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-7">
                {weekDays.map((d, di) => {
                  const dateKey = toKey(d);
                  const isPast = dateKey < todayKey;
                  return (
                    <div key={di} className="border-r border-border last:border-r-0 p-1.5 space-y-1.5">
                      {TIME_SLOTS.map(time => {
                        const lesson = findLesson(dateKey, time);
                        const isSelected = selected?.date === dateKey && selected?.time === time;
                        if (isPast && !lesson) {
                          return <div key={time} className="h-8 rounded-md bg-muted/30" />;
                        }
                        return (
                          <button
                            key={time}
                            onClick={() => handleSlotClick(dateKey, time)}
                            className={`w-full h-8 rounded-md text-xs font-montserrat font-bold transition-all duration-150
                              ${lesson
                                ? "bg-orange-300 text-orange-900 hover:bg-orange-400"
                                : "bg-green-500 text-white hover:bg-green-600"}
                              ${isSelected ? "ring-2 ring-offset-1 ring-primary" : ""}`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-4 py-3 flex items-center gap-4 text-xs text-muted-foreground font-ibm border-t border-border flex-wrap">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500" /><span>Свободно</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-300" /><span>Занятие назначено</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted" /><span>Прошло</span></div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-3">
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

          {selected ? (
            <>
              <div className="flex items-center gap-2 px-1">
                <Icon name="CalendarDays" size={16} className="text-primary" />
                <p className="font-montserrat font-bold text-sm text-foreground">
                  {new Date(selected.date + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" })} · {selected.time}
                </p>
              </div>
              {selectedLesson ? (
                <div className="bg-card rounded-xl border border-border p-4 card-hover animate-scale-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-montserrat font-medium ${typeColors[selectedLesson.lesson_type] || "bg-muted text-muted-foreground border-border"}`}>{selectedLesson.lesson_type}</span>
                    <span className="font-montserrat font-bold text-primary text-sm">{selectedLesson.lesson_time}</span>
                  </div>
                  <h4 className="font-montserrat font-bold text-foreground text-sm mb-3">{selectedLesson.topic}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="Clock" size={13} /><span className="font-ibm">{selectedLesson.duration_min} минут</span>
                  </div>
                  <button className="mt-4 w-full py-2 rounded-lg border border-primary text-primary text-sm font-montserrat font-medium hover:bg-primary hover:text-white transition-colors">
                    Присоединиться к уроку
                  </button>
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border p-6 text-center">
                  <Icon name="CalendarPlus" size={32} className="text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm font-ibm">Время свободно</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <Icon name="MousePointerClick" size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm font-ibm">Выберите время в расписании</p>
            </div>
          )}

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="font-montserrat font-bold text-xs text-foreground">Занятия на этой неделе</p>
            </div>
            {loading ? (
              <div className="p-4 text-center text-xs text-muted-foreground font-ibm">Загрузка...</div>
            ) : (() => {
              const from = toKey(weekStart);
              const to = toKey(weekEnd);
              const weekLessons = lessons
                .filter(l => l.lesson_date >= from && l.lesson_date <= to)
                .sort((a, b) => (a.lesson_date + a.lesson_time).localeCompare(b.lesson_date + b.lesson_time));
              if (weekLessons.length === 0) {
                return <div className="p-4 text-center text-xs text-muted-foreground font-ibm">Нет занятий</div>;
              }
              return (
                <div className="divide-y divide-border">
                  {weekLessons.map((l, i) => (
                    <button key={i} onClick={() => setSelected({ date: l.lesson_date, time: l.lesson_time.slice(0, 5) })}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon name="BookOpen" size={14} className="text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate font-ibm">{l.topic}</p>
                        <p className="text-xs text-muted-foreground">{l.lesson_date} · {l.lesson_time}</p>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
