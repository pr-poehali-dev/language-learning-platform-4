import { type Page } from "@/App";
import { type User } from "@/pages/LoginPage";
import Icon from "@/components/ui/icon";

interface DashboardProps {
  onNavigate: (page: Page) => void;
  user: User;
}

const stats = [
  { label: "Уроков пройдено", value: "24", icon: "BookOpen", color: "bg-primary/10 text-primary" },
  { label: "Д/з выполнено", value: "18", icon: "ClipboardCheck", color: "bg-green-100 text-green-700" },
  { label: "Средняя оценка", value: "4.7", icon: "Star", color: "bg-accent/20 text-yellow-700" },
  { label: "Дней в студии", value: "112", icon: "CalendarDays", color: "bg-blue-100 text-blue-700" },
];

const upcomingLessons = [
  { day: "Пн", date: "26 мая", time: "18:00", topic: "Pretérito Indefinido", teacher: "Елена Смирнова", type: "Испанский" },
  { day: "Ср", date: "28 мая", time: "19:00", topic: "Subjuntivo presente", teacher: "Елена Смирнова", type: "Испанский" },
  { day: "Пт", date: "30 мая", time: "18:00", topic: "Разговорный клуб", teacher: "Группа B1", type: "Практика" },
];

const recentMaterials = [
  { title: "Грамматика: Subjuntivo", type: "PDF", size: "1.2 МБ", date: "Сегодня" },
  { title: "Аудио: Диалоги в ресторане", type: "MP3", size: "8.4 МБ", date: "Вчера" },
  { title: "Упражнения №15-20", type: "DOCX", size: "540 КБ", date: "23 мая" },
];

const homeworkItems = [
  { title: "Упражнения §12, стр. 45", due: "Завтра", status: "pending", subject: "Испанский" },
  { title: "Перевод текста «Fiesta»", due: "28 мая", status: "inprogress", subject: "Испанский" },
  { title: "Аудирование: Урок 8", due: "30 мая", status: "done", subject: "Практика" },
];

const statusConfig = {
  pending: { label: "Не начато", cls: "bg-red-100 text-red-700" },
  inprogress: { label: "В процессе", cls: "bg-amber-100 text-amber-700" },
  done: { label: "Сдано", cls: "bg-green-100 text-green-700" },
};

const leaderboard = [
  { name: "Мария К.", score: 98, avatar: "МК" },
  { name: "Дмитрий С.", score: 92, avatar: "ДС" },
  { name: "Анна М.", score: 87, avatar: "АМ", isMe: true },
  { name: "Ольга П.", score: 81, avatar: "ОП" },
  { name: "Иван Т.", score: 75, avatar: "ИТ" },
];

export default function Dashboard({ onNavigate, user }: DashboardProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Welcome */}
      <div className="red-accent rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <p className="text-white/70 text-sm font-ibm mb-1">Добро пожаловать обратно 👋</p>
          <h2 className="font-montserrat font-black text-2xl mb-1">{user.name}</h2>
          <p className="text-white/80 font-ibm text-sm">
            {user.role === "teacher" ? "Преподаватель · Hispania 35" : `Испанский язык · Уровень ${user.level} · Группа «Среда-Пятница»`}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div>
              <p className="text-white/60 text-xs font-ibm">Прогресс курса</p>
              <p className="font-montserrat font-bold text-lg">67%</p>
            </div>
            <div className="flex-1 h-2 bg-white/20 rounded-full">
              <div className="h-2 bg-accent rounded-full" style={{ width: "67%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border card-hover animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <Icon name={s.icon} size={18} />
            </div>
            <p className="font-montserrat font-black text-2xl text-foreground">{s.value}</p>
            <p className="text-muted-foreground text-xs mt-0.5 font-ibm">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Upcoming lessons */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-montserrat font-bold text-sm text-foreground">Ближайшие занятия</h3>
            <button onClick={() => onNavigate("calendar")} className="text-primary text-xs font-medium hover:underline">Весь календарь →</button>
          </div>
          <div className="divide-y divide-border">
            {upcomingLessons.map((l, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="text-center w-10 flex-shrink-0">
                  <p className="text-xs text-muted-foreground font-ibm">{l.day}</p>
                  <p className="font-montserrat font-bold text-foreground text-sm leading-tight">{l.date.split(" ")[0]}</p>
                </div>
                <div className="w-px h-8 bg-border flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate font-ibm">{l.topic}</p>
                  <p className="text-xs text-muted-foreground">{l.teacher}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-montserrat font-medium">{l.time}</span>
                  <span className="hidden md:block text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{l.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Homework quick */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-montserrat font-bold text-sm text-foreground">Домашние задания</h3>
            <button onClick={() => onNavigate("homework")} className="text-primary text-xs font-medium hover:underline">Все →</button>
          </div>
          <div className="p-3 space-y-2">
            {homeworkItems.map((hw, i) => {
              const sc = statusConfig[hw.status as keyof typeof statusConfig];
              return (
                <div key={i} className="p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer">
                  <p className="font-ibm text-sm text-foreground font-medium leading-snug">{hw.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">до {hw.due}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-montserrat font-medium ${sc.cls}`}>{sc.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Materials */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-montserrat font-bold text-sm text-foreground">Новые материалы</h3>
            <button onClick={() => onNavigate("materials")} className="text-primary text-xs font-medium hover:underline">Все →</button>
          </div>
          <div className="divide-y divide-border">
            {recentMaterials.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name={m.type === "MP3" ? "Music" : m.type === "PDF" ? "FileText" : "File"} size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate font-ibm">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.size} · {m.date}</p>
                </div>
                <span className="text-xs font-montserrat font-bold text-primary/60 bg-primary/10 px-1.5 py-0.5 rounded">{m.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-montserrat font-bold text-sm text-foreground">Рейтинг группы</h3>
            <span className="text-xs text-muted-foreground font-ibm">Май 2026</span>
          </div>
          <div className="divide-y divide-border">
            {leaderboard.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 px-5 py-3 transition-colors ${s.isMe ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                <div className={`w-5 text-center font-montserrat font-black text-sm flex-shrink-0 ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                  {i + 1}
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold font-montserrat ${s.isMe ? "red-accent text-white" : "bg-muted text-muted-foreground"}`}>
                  {s.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium font-ibm ${s.isMe ? "text-primary" : "text-foreground"}`}>
                    {s.name} {s.isMe && <span className="text-xs text-muted-foreground">(вы)</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-montserrat font-bold text-sm text-foreground">{s.score}</p>
                  <p className="text-xs text-muted-foreground">баллов</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}