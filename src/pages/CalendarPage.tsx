import { useState } from "react";
import Icon from "@/components/ui/icon";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

const lessons = [
  { date: "2026-05-26", time: "18:00", topic: "Pretérito Indefinido — формы", teacher: "Елена Смирнова", type: "Грамматика", duration: 60 },
  { date: "2026-05-28", time: "19:00", topic: "Subjuntivo presente", teacher: "Елена Смирнова", type: "Грамматика", duration: 60 },
  { date: "2026-05-30", time: "18:00", topic: "Разговорный клуб", teacher: "Группа B1", type: "Практика", duration: 90 },
  { date: "2026-06-02", time: "18:00", topic: "Ser vs Estar — повторение", teacher: "Елена Смирнова", type: "Повторение", duration: 60 },
  { date: "2026-06-04", time: "19:00", topic: "Аудирование: Новости", teacher: "Елена Смирнова", type: "Аудирование", duration: 45 },
];

const typeColors: Record<string, string> = {
  "Грамматика": "bg-primary/15 text-primary border-primary/20",
  "Практика": "bg-green-100 text-green-700 border-green-200",
  "Повторение": "bg-blue-100 text-blue-700 border-blue-200",
  "Аудирование": "bg-purple-100 text-purple-700 border-purple-200",
};

export default function CalendarPage() {
  const today = new Date(2026, 4, 24);
  const [current, setCurrent] = useState({ year: 2026, month: 4 });
  const [selectedDate, setSelectedDate] = useState<string | null>("2026-05-26");

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

  const lessonMap = new Set(lessons.map(l => l.date));

  const selectedLessons = selectedDate
    ? lessons.filter(l => l.date === selectedDate)
    : [];

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

        {/* Calendar */}
        <div className="md:col-span-3 bg-card rounded-xl border border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <button
              onClick={() => {
                if (current.month === 0) setCurrent({ year: current.year - 1, month: 11 });
                else setCurrent({ ...current, month: current.month - 1 });
              }}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Icon name="ChevronLeft" size={18} className="text-muted-foreground" />
            </button>
            <h3 className="font-montserrat font-bold text-foreground">
              {MONTHS[current.month]} {current.year}
            </h3>
            <button
              onClick={() => {
                if (current.month === 11) setCurrent({ year: current.year + 1, month: 0 });
                else setCurrent({ ...current, month: current.month + 1 });
              }}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Icon name="ChevronRight" size={18} className="text-muted-foreground" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS.map(d => (
              <div key={d} className={`py-2 text-center text-xs font-montserrat font-bold ${d === "Сб" || d === "Вс" ? "text-red-400" : "text-muted-foreground"}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-7 p-2 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const key = toKey(day);
              const hasLesson = lessonMap.has(key);
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(key)}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-ibm
                    transition-all duration-150
                    ${isSelected ? "red-accent text-white font-bold shadow-sm" :
                      isToday ? "bg-accent/20 text-foreground font-bold" :
                        "hover:bg-muted text-foreground"}
                  `}
                >
                  {day}
                  {hasLesson && (
                    <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/70" : "bg-primary"}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-4 pb-4 flex items-center gap-4 text-xs text-muted-foreground font-ibm">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span>Есть занятие</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-lg bg-accent/20" />
              <span>Сегодня</span>
            </div>
          </div>
        </div>

        {/* Lesson details */}
        <div className="md:col-span-2 space-y-3">
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
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-montserrat font-medium ${typeColors[l.type] || "bg-muted text-muted-foreground border-border"}`}>
                      {l.type}
                    </span>
                    <span className="font-montserrat font-bold text-primary text-sm">{l.time}</span>
                  </div>
                  <h4 className="font-montserrat font-bold text-foreground text-sm mb-1">{l.topic}</h4>
                  <div className="space-y-1 mt-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon name="User" size={13} />
                      <span className="font-ibm">{l.teacher}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon name="Clock" size={13} />
                      <span className="font-ibm">{l.duration} минут</span>
                    </div>
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

          {/* Upcoming */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="font-montserrat font-bold text-xs text-foreground">Ближайшие 7 дней</p>
            </div>
            <div className="divide-y divide-border">
              {lessons.slice(0, 3).map((l, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="BookOpen" size={14} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate font-ibm">{l.topic}</p>
                    <p className="text-xs text-muted-foreground">{l.date.slice(8)} мая · {l.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
