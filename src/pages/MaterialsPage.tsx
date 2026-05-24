import { useState } from "react";
import Icon from "@/components/ui/icon";

const categories = ["Все", "Грамматика", "Аудио", "Видео", "Упражнения", "Словари"];

const materials = [
  {
    id: 1, title: "Грамматика: Subjuntivo presente", category: "Грамматика",
    type: "PDF", size: "1.2 МБ", date: "24 мая 2026", teacher: "Елена Смирнова",
    desc: "Полная таблица форм, правила использования и исключения.", isNew: true,
  },
  {
    id: 2, title: "Аудио: Диалоги в ресторане", category: "Аудио",
    type: "MP3", size: "8.4 МБ", date: "22 мая 2026", teacher: "Елена Смирнова",
    desc: "Два диалога с носителем языка, скорость — средняя.", isNew: false,
  },
  {
    id: 3, title: "Видео: Ser vs Estar — объяснение", category: "Видео",
    type: "MP4", size: "45 МБ", date: "20 мая 2026", teacher: "Елена Смирнова",
    desc: "Видеоурок с примерами, длительность 18 минут.", isNew: false,
  },
  {
    id: 4, title: "Упражнения по теме §12-14", category: "Упражнения",
    type: "DOCX", size: "540 КБ", date: "19 мая 2026", teacher: "Елена Смирнова",
    desc: "30 упражнений с ключами в конце документа.", isNew: false,
  },
  {
    id: 5, title: "Словарь: Тема «Еда и кулинария»", category: "Словари",
    type: "PDF", size: "820 КБ", date: "15 мая 2026", teacher: "Елена Смирнова",
    desc: "200 слов с транскрипцией и переводом.", isNew: false,
  },
  {
    id: 6, title: "Грамматика: Pretérito Indefinido", category: "Грамматика",
    type: "PDF", size: "1.5 МБ", date: "10 мая 2026", teacher: "Елена Смирнова",
    desc: "Правильные и неправильные глаголы, использование, маркеры времени.", isNew: false,
  },
];

const typeIcons: Record<string, string> = {
  PDF: "FileText",
  MP3: "Music",
  MP4: "Video",
  DOCX: "FileEdit",
};

const typeColors: Record<string, string> = {
  PDF: "bg-red-100 text-red-700",
  MP3: "bg-purple-100 text-purple-700",
  MP4: "bg-blue-100 text-blue-700",
  DOCX: "bg-green-100 text-green-700",
};

export default function MaterialsPage() {
  const [activeCategory, setActiveCategory] = useState("Все");
  const [search, setSearch] = useState("");

  const filtered = materials.filter(m => {
    const matchCat = activeCategory === "Все" || m.category === activeCategory;
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-card rounded-xl border border-border px-4 py-2.5 flex-1">
          <Icon name="Search" size={16} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Поиск материалов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full font-ibm"
          />
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-montserrat font-medium hover:bg-primary/90 transition-colors flex-shrink-0">
          <Icon name="Upload" size={16} />
          Загрузить файл
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium font-montserrat transition-all duration-150 ${
              activeCategory === cat
                ? "bg-primary text-white shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Materials grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((m, i) => (
          <div
            key={m.id}
            className="bg-card rounded-xl border border-border p-4 card-hover animate-fade-in cursor-pointer group"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[m.type] || "bg-muted"}`}>
                <Icon name={typeIcons[m.type] || "File"} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-montserrat font-bold text-sm text-foreground leading-snug">{m.title}</h4>
                  {m.isNew && (
                    <span className="gold-accent text-foreground text-xs font-montserrat font-bold px-1.5 py-0.5 rounded-full leading-none">Новое</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-ibm line-clamp-2">{m.desc}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-ibm">
                <span>{m.size}</span>
                <span>·</span>
                <span>{m.date}</span>
              </div>
              <div className="flex gap-2">
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                  <Icon name="Eye" size={15} className="text-muted-foreground" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                  <Icon name="Download" size={15} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded font-montserrat font-bold ${typeColors[m.type] || "bg-muted text-muted-foreground"}`}>{m.type}</span>
              <span className="text-xs text-muted-foreground font-ibm">{m.category}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <Icon name="SearchX" size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-ibm">Материалов не найдено</p>
        </div>
      )}
    </div>
  );
}
