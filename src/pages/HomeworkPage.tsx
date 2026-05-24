import { useState } from "react";
import Icon from "@/components/ui/icon";

const tabs = ["Все", "Новые", "В процессе", "Проверяется", "Выполнено"];

const homework = [
  {
    id: 1, title: "Упражнения §12, стр. 45", subject: "Грамматика",
    due: "25 мая 2026", status: "pending", grade: null,
    desc: "Выполните упражнения 1-10 на стр. 45. Запишите ответы в тетрадь и сфотографируйте.",
    teacher: "Елена Смирнова", isNew: true,
    comments: [],
  },
  {
    id: 2, title: "Перевод текста «La Fiesta Mayor»", subject: "Перевод",
    due: "28 мая 2026", status: "inprogress", grade: null,
    desc: "Переведите текст на стр. 62, выделите незнакомые слова с объяснением.",
    teacher: "Елена Смирнова", isNew: false,
    comments: [{ author: "Елена Смирнова", text: "Не забудьте про контекст слова 'fiesta'!", time: "23 мая" }],
  },
  {
    id: 3, title: "Аудирование: Урок 8 — Диалоги", subject: "Аудирование",
    due: "20 мая 2026", status: "review", grade: null,
    desc: "Прослушайте аудио файл, заполните пропуски в тексте.",
    teacher: "Елена Смирнова", isNew: false,
    comments: [],
  },
  {
    id: 4, title: "Сочинение: «Mi ciudad favorita»", subject: "Письмо",
    due: "15 мая 2026", status: "done", grade: 5,
    desc: "Напишите сочинение 150-200 слов о вашем любимом городе.",
    teacher: "Елена Смирнова", isNew: false,
    comments: [{ author: "Елена Смирнова", text: "Отличная работа! Хороший словарный запас, грамматика верная. Молодец!", time: "16 мая" }],
  },
  {
    id: 5, title: "Диктант: Числа и даты", subject: "Орфография",
    due: "10 мая 2026", status: "done", grade: 4,
    desc: "Запись и написание числительных по аудиодиктанту.",
    teacher: "Елена Смирнова", isNew: false,
    comments: [{ author: "Елена Смирнова", text: "Хорошо! Несколько мелких ошибок в записи дат.", time: "11 мая" }],
  },
];

const statusConfig: Record<string, { label: string; cls: string; icon: string }> = {
  pending: { label: "Новое", cls: "bg-red-100 text-red-700 border-red-200", icon: "AlertCircle" },
  inprogress: { label: "В процессе", cls: "bg-amber-100 text-amber-700 border-amber-200", icon: "Clock" },
  review: { label: "На проверке", cls: "bg-blue-100 text-blue-700 border-blue-200", icon: "Eye" },
  done: { label: "Выполнено", cls: "bg-green-100 text-green-700 border-green-200", icon: "CheckCircle" },
};

const tabMap: Record<string, string | null> = {
  "Все": null,
  "Новые": "pending",
  "В процессе": "inprogress",
  "Проверяется": "review",
  "Выполнено": "done",
};

export default function HomeworkPage() {
  const [activeTab, setActiveTab] = useState("Все");
  const [expanded, setExpanded] = useState<number | null>(1);

  const filtered = homework.filter(hw => {
    const f = tabMap[activeTab];
    return f === null || hw.status === f;
  });

  const counts: Record<string, number> = {};
  tabs.forEach(t => {
    const f = tabMap[t];
    counts[t] = f === null ? homework.length : homework.filter(h => h.status === f).length;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-montserrat font-medium transition-all duration-150 ${
              activeTab === tab
                ? "bg-primary text-white shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold leading-none ${
              activeTab === tab ? "bg-white/20 text-white" : "bg-muted-foreground/10 text-muted-foreground"
            }`}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Homework list */}
      <div className="space-y-3">
        {filtered.map((hw, i) => {
          const sc = statusConfig[hw.status];
          const isOpen = expanded === hw.id;
          return (
            <div
              key={hw.id}
              className={`bg-card rounded-xl border overflow-hidden animate-fade-in transition-all duration-200 ${
                hw.isNew ? "border-accent/40 shadow-sm" : "border-border"
              }`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {/* Header */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(isOpen ? null : hw.id)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${sc.cls}`}>
                  <Icon name={sc.icon} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-montserrat font-bold text-sm text-foreground">{hw.title}</p>
                    {hw.isNew && (
                      <span className="gold-accent text-foreground text-xs font-montserrat font-bold px-1.5 py-0.5 rounded-full">Новое</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground font-ibm">
                    <span>{hw.subject}</span>
                    <span>·</span>
                    <span>до {hw.due}</span>
                    {hw.grade && <span className="text-primary font-bold">· Оценка: {hw.grade}/5</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`hidden sm:block text-xs px-2 py-0.5 rounded-full border font-montserrat font-medium ${sc.cls}`}>{sc.label}</span>
                  <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
                </div>
              </button>

              {/* Expanded */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-border animate-fade-in">
                  <p className="text-sm text-foreground font-ibm mt-4 leading-relaxed">{hw.desc}</p>

                  {/* Comments */}
                  {hw.comments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-montserrat font-bold text-muted-foreground uppercase tracking-wider">Комментарии преподавателя</p>
                      {hw.comments.map((c, ci) => (
                        <div key={ci} className="flex gap-3 bg-muted/40 rounded-lg p-3">
                          <div className="w-7 h-7 rounded-full red-accent flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">ЕС</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-montserrat font-bold text-foreground">{c.author}</p>
                              <p className="text-xs text-muted-foreground">{c.time}</p>
                            </div>
                            <p className="text-sm text-foreground font-ibm mt-0.5">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Grade */}
                  {hw.grade && (
                    <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Icon name="Star" size={18} className="text-amber-500" />
                      <div>
                        <p className="text-sm font-montserrat font-bold text-green-800">Оценка: {hw.grade}/5</p>
                        <p className="text-xs text-green-600 font-ibm">Работа проверена и принята</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-3 flex-wrap">
                    {hw.status === "pending" && (
                      <button className="flex items-center gap-2 px-4 py-2 red-accent text-white rounded-lg text-sm font-montserrat font-medium hover:opacity-90 transition-opacity">
                        <Icon name="Upload" size={15} />
                        Сдать задание
                      </button>
                    )}
                    {hw.status === "inprogress" && (
                      <button className="flex items-center gap-2 px-4 py-2 red-accent text-white rounded-lg text-sm font-montserrat font-medium hover:opacity-90 transition-opacity">
                        <Icon name="Send" size={15} />
                        Отправить на проверку
                      </button>
                    )}
                    <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-montserrat font-medium hover:bg-muted transition-colors">
                      <Icon name="MessageSquare" size={15} />
                      Написать вопрос
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
