import { useState } from "react";
import { type User } from "@/pages/LoginPage";
import Icon from "@/components/ui/icon";

const profileTabs = ["Профиль", "Статистика", "Рейтинг", "Чат"];

const activityData = [5, 8, 3, 12, 7, 10, 4, 9, 6, 11, 8, 5, 13, 7, 9, 6, 8, 11, 4, 7, 10, 8, 12, 6, 9, 14, 8, 5];

const leaderboard = [
  { name: "Мария Козлова", score: 98, level: "B2", avatar: "МК", streak: 24 },
  { name: "Дмитрий Сорокин", score: 92, level: "B1", avatar: "ДС", streak: 18 },
  { name: "Анна Михайлова", score: 87, level: "B1", avatar: "АМ", isMe: true, streak: 15 },
  { name: "Ольга Петрова", score: 81, level: "A2", avatar: "ОП", streak: 12 },
  { name: "Иван Тихонов", score: 75, level: "A2", avatar: "ИТ", streak: 8 },
  { name: "Светлана Юрьева", score: 68, level: "A1", avatar: "СЮ", streak: 5 },
];

const chatMessages = [
  { from: "teacher", author: "Елена Смирнова", text: "Привет, Анна! Как дела с заданием по Subjuntivo?", time: "10:30" },
  { from: "me", text: "Добрый день! Почти закончила, осталось несколько упражнений.", time: "10:35" },
  { from: "teacher", author: "Елена Смирнова", text: "Отлично! Не забудьте обратить внимание на исключения — yo/él форму глаголов ser, ir, ver.", time: "10:37" },
  { from: "me", text: "Спасибо, записала! А можете скинуть таблицу с исключениями?", time: "10:40" },
  { from: "teacher", author: "Елена Смирнова", text: "Конечно! Уже загрузила в раздел Материалы → Грамматика → Subjuntivo.", time: "10:42" },
];

const achievements = [
  { title: "Первый урок", icon: "🎓", earned: true },
  { title: "10 уроков", icon: "📚", earned: true },
  { title: "Серия 7 дней", icon: "🔥", earned: true },
  { title: "Отличник", icon: "⭐", earned: true },
  { title: "50 уроков", icon: "🏆", earned: false },
  { title: "Разговорник", icon: "💬", earned: false },
];

export default function ProfilePage({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState("Профиль");
  const [message, setMessage] = useState("");

  const maxActivity = Math.max(...activityData);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Profile header */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="h-24 red-accent relative">
          <div className="absolute inset-0 opacity-20">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute text-white/30 font-montserrat font-black text-4xl" style={{ left: `${i * 14}%`, top: "20%", transform: "rotate(-15deg)" }}>¡Hola!</div>
            ))}
          </div>
        </div>
        <div className="px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-8">
            <div className="w-16 h-16 rounded-2xl red-accent border-4 border-card flex items-center justify-center flex-shrink-0">
              <span className="text-white font-montserrat font-black text-xl">{user.avatar}</span>
            </div>
            <div className="flex-1">
              <h2 className="font-montserrat font-black text-xl text-foreground">{user.name}</h2>
              <p className="text-muted-foreground text-sm font-ibm">Студент · Испанский язык</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="font-montserrat font-black text-lg text-foreground">87</p>
                <p className="text-xs text-muted-foreground font-ibm">баллов</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="font-montserrat font-black text-lg text-foreground">B1</p>
                <p className="text-xs text-muted-foreground font-ibm">уровень</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center flex items-center gap-1">
                <span className="text-base">🔥</span>
                <div>
                  <p className="font-montserrat font-black text-lg text-foreground">15</p>
                  <p className="text-xs text-muted-foreground font-ibm">дней подряд</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-muted/40 rounded-xl p-1 w-fit">
        {profileTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-montserrat font-medium transition-all duration-150 ${
              activeTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Профиль" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
          {/* Info */}
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-montserrat font-bold text-sm text-foreground">Личные данные</h3>
            {[
              { label: "Имя", value: "Анна Михайлова", icon: "User" },
              { label: "Email", value: "anna.m@email.ru", icon: "Mail" },
              { label: "Телефон", value: "+7 (900) 123-45-67", icon: "Phone" },
              { label: "Группа", value: "Среда + Пятница 18:00", icon: "Users" },
              { label: "Преподаватель", value: "Елена Смирнова", icon: "GraduationCap" },
              { label: "Начало обучения", value: "3 февраля 2026", icon: "CalendarDays" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <Icon name={f.icon} size={16} className="text-primary flex-shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-ibm w-32">{f.label}</span>
                  <span className="text-sm text-foreground font-ibm font-medium">{f.value}</span>
                </div>
              </div>
            ))}
            <button className="w-full mt-2 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-montserrat font-medium">
              Редактировать профиль
            </button>
          </div>

          {/* Achievements */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-4">Достижения</h3>
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((a, i) => (
                <div key={i} className={`rounded-xl p-3 text-center border transition-all ${a.earned ? "border-accent/30 bg-accent/5" : "border-border bg-muted/30 opacity-50"}`}>
                  <div className="text-2xl mb-1">{a.icon}</div>
                  <p className="text-xs font-montserrat font-medium text-foreground leading-tight">{a.title}</p>
                </div>
              ))}
            </div>

            {/* Progress to next level */}
            <div className="mt-5 p-4 bg-muted/40 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-montserrat font-bold text-foreground">До уровня B2</span>
                <span className="text-xs text-muted-foreground font-ibm">87 / 150 баллов</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full">
                <div className="progress-bar h-2.5" style={{ width: "58%" }} />
              </div>
              <p className="text-xs text-muted-foreground font-ibm mt-1.5">Осталось 63 балла</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Статистика" && (
        <div className="space-y-5 animate-fade-in">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Всего занятий", value: "24", icon: "BookOpen", sub: "+4 в мае" },
              { label: "Часов обучения", value: "36", icon: "Clock", sub: "В среднем 1.5ч/нед" },
              { label: "Средний балл", value: "4.7", icon: "Star", sub: "Из 5 возможных" },
              { label: "Д/з сдано", value: "18/21", icon: "ClipboardCheck", sub: "86% выполнено" },
            ].map((s, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                  <Icon name={s.icon} size={18} className="text-primary" />
                </div>
                <p className="font-montserrat font-black text-2xl text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground font-ibm">{s.label}</p>
                <p className="text-xs text-primary font-ibm mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Activity chart */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-4">Активность за последние 28 дней</h3>
            <div className="flex items-end gap-1 h-20">
              {activityData.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-sm transition-all"
                    style={{
                      height: `${(v / maxActivity) * 100}%`,
                      background: v > 8 ? "hsl(0 72% 35%)" : v > 5 ? "hsl(0 72% 35% / 0.6)" : "hsl(0 72% 35% / 0.25)",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground font-ibm mt-2">
              <span>28 дней назад</span>
              <span>Сегодня</span>
            </div>
          </div>

          {/* Grades by subject */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-4">Успеваемость по темам</h3>
            <div className="space-y-3">
              {[
                { topic: "Грамматика", score: 92 },
                { topic: "Аудирование", score: 78 },
                { topic: "Письмо", score: 88 },
                { topic: "Разговорная практика", score: 85 },
                { topic: "Словарный запас", score: 91 },
              ].map((t, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-ibm text-foreground">{t.topic}</span>
                    <span className="font-montserrat font-bold text-primary">{t.score}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="progress-bar h-2" style={{ width: `${t.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Рейтинг" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-montserrat font-bold text-sm text-foreground">Рейтинг группы</h3>
            <span className="text-xs text-muted-foreground font-ibm">Май 2026</span>
          </div>
          <div className="divide-y divide-border">
            {leaderboard.map((s, i) => (
              <div key={i} className={`flex items-center gap-4 px-5 py-4 transition-colors ${s.isMe ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                <div className={`w-8 text-center font-montserrat font-black text-lg flex-shrink-0 ${
                  i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"
                }`}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold font-montserrat ${s.isMe ? "red-accent text-white" : "bg-muted text-muted-foreground"}`}>
                  {s.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium font-ibm ${s.isMe ? "text-primary font-bold" : "text-foreground"}`}>{s.name}</p>
                    {s.isMe && <span className="text-xs text-muted-foreground">(вы)</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-montserrat font-bold">{s.level}</span>
                    <span className="text-xs text-muted-foreground font-ibm">🔥 {s.streak} дней</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-montserrat font-black text-lg text-foreground">{s.score}</p>
                  <p className="text-xs text-muted-foreground font-ibm">баллов</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Чат" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in flex flex-col" style={{ height: "500px" }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="w-9 h-9 rounded-full red-accent flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">ЕС</span>
            </div>
            <div>
              <p className="font-montserrat font-bold text-sm text-foreground">Елена Смирнова</p>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-xs text-muted-foreground font-ibm">Онлайн</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.from === "me" ? "flex-row-reverse" : ""}`}>
                {msg.from === "teacher" && (
                  <div className="w-8 h-8 rounded-full red-accent flex items-center justify-center flex-shrink-0 self-end">
                    <span className="text-white text-xs font-bold">ЕС</span>
                  </div>
                )}
                <div className={`max-w-xs rounded-2xl px-4 py-2.5 ${
                  msg.from === "me"
                    ? "red-accent text-white rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  <p className="text-sm font-ibm leading-relaxed">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.from === "me" ? "text-white/60" : "text-muted-foreground"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border flex gap-2">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Icon name="Paperclip" size={18} className="text-muted-foreground" />
            </button>
            <input
              type="text"
              placeholder="Написать сообщение..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="flex-1 bg-muted/50 rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/30 font-ibm transition-colors"
            />
            <button className={`p-2.5 rounded-xl transition-all ${message ? "red-accent text-white" : "bg-muted text-muted-foreground"}`}>
              <Icon name="Send" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}