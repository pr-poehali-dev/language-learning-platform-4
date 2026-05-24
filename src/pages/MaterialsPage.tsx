import { useState, useEffect } from "react";
import { type User } from "@/pages/LoginPage";
import { apiGetMaterials, apiCreateMaterial, type Material } from "@/lib/api";
import Icon from "@/components/ui/icon";

const categories = ["Все", "Грамматика", "Аудио", "Видео", "Упражнения", "Словари"];

const typeIcons: Record<string, string> = {
  PDF: "FileText", MP3: "Music", MP4: "Video", DOCX: "FileEdit",
};
const typeColors: Record<string, string> = {
  PDF: "bg-red-100 text-red-700", MP3: "bg-purple-100 text-purple-700",
  MP4: "bg-blue-100 text-blue-700", DOCX: "bg-green-100 text-green-700",
};

export default function MaterialsPage({ user }: { user: User }) {
  const [activeCategory, setActiveCategory] = useState("Все");
  const [search, setSearch] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Грамматика", file_type: "PDF", file_size: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGetMaterials().then(res => {
      if (res.materials) setMaterials(res.materials);
      setLoading(false);
    });
  }, []);

  const filtered = materials.filter(m => {
    const matchCat = activeCategory === "Все" || m.category === activeCategory;
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAdd = async () => {
    if (!form.title) return;
    setSaving(true);
    const res = await apiCreateMaterial(form);
    if (res.ok) {
      const updated = await apiGetMaterials();
      if (updated.materials) setMaterials(updated.materials);
      setShowAdd(false);
      setForm({ title: "", description: "", category: "Грамматика", file_type: "PDF", file_size: "" });
    }
    setSaving(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    } catch { return dateStr; }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-card rounded-xl border border-border px-4 py-2.5 flex-1">
          <Icon name="Search" size={16} className="text-muted-foreground flex-shrink-0" />
          <input type="text" placeholder="Поиск материалов..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full font-ibm" />
        </div>
        {user.role === "teacher" && (
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-montserrat font-medium hover:bg-primary/90 transition-colors flex-shrink-0">
            <Icon name="Plus" size={16} />
            Добавить материал
          </button>
        )}
      </div>

      {showAdd && (
        <div className="bg-card rounded-xl border border-border p-5 space-y-3 animate-scale-in">
          <p className="font-montserrat font-bold text-sm text-foreground">Новый материал</p>
          <input type="text" placeholder="Название материала" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40" />
          <textarea placeholder="Описание" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40 resize-none" />
          <div className="grid grid-cols-3 gap-2">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40">
              {categories.filter(c => c !== "Все").map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={form.file_type} onChange={e => setForm({ ...form, file_type: e.target.value })}
              className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40">
              {["PDF", "MP3", "MP4", "DOCX"].map(t => <option key={t}>{t}</option>)}
            </select>
            <input type="text" placeholder="Размер (1.2 МБ)" value={form.file_size}
              onChange={e => setForm({ ...form, file_size: e.target.value })}
              className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40" />
          </div>
          <button onClick={handleAdd} disabled={saving}
            className="px-5 py-2 red-accent text-white rounded-lg text-sm font-montserrat font-medium hover:opacity-90 disabled:opacity-60">
            {saving ? "Сохраняю..." : "Добавить"}
          </button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium font-montserrat transition-all duration-150 ${
              activeCategory === cat ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}>{cat}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
              <div className="flex gap-3"><div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded w-1/2" /></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((m, i) => (
            <div key={m.id} className="bg-card rounded-xl border border-border p-4 card-hover animate-fade-in cursor-pointer group"
              style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[m.file_type] || "bg-muted"}`}>
                  <Icon name={typeIcons[m.file_type] || "File"} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-montserrat font-bold text-sm text-foreground leading-snug">{m.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 font-ibm line-clamp-2">{m.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-ibm">
                  {m.file_size && <span>{m.file_size}</span>}
                  <span>·</span>
                  <span>{formatDate(m.created_at)}</span>
                </div>
                <div className="flex gap-2">
                  <button className="p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                    <Icon name="Download" size={15} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-montserrat font-bold ${typeColors[m.file_type] || "bg-muted text-muted-foreground"}`}>{m.file_type}</span>
                <span className="text-xs text-muted-foreground font-ibm">{m.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-16 text-center">
          <Icon name="SearchX" size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-ibm">Материалов не найдено</p>
        </div>
      )}
    </div>
  );
}
