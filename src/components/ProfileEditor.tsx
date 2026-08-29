import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { apiGetProfile, apiUpdateProfile, type Profile } from "@/lib/api";

const empty: Profile = {
  id: 0, name: "", email: "", role: "",
  phone: "", social_name: "", social_url: "", telegram: "", whatsapp: "", about: "",
  notify_email: true, notify_new_lesson: true, notify_cancel: true,
};

function Toggle({ checked, onChange, title, hint }: {
  checked: boolean; onChange: (v: boolean) => void; title: string; hint: string;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left">
      <span className={`mt-0.5 w-9 h-5 rounded-full flex-shrink-0 transition-colors relative
        ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all
          ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-montserrat font-bold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground font-ibm">{hint}</span>
      </span>
    </button>
  );
}

export default function ProfileEditor({ isTeacher }: { isTeacher: boolean }) {
  const [p, setP] = useState<Profile>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    apiGetProfile()
      .then(res => { if (res.profile) setP({ ...empty, ...res.profile }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => {
    setP(prev => ({ ...prev, [k]: v }));
    if (err) setErr("");
    if (msg) setMsg("");
  };

  const save = async () => {
    if (!p.name.trim()) { setErr("Укажите имя"); return; }
    if (!p.email.trim() || !p.email.includes("@")) { setErr("Укажите корректную почту"); return; }
    setSaving(true);
    try {
      const res = await apiUpdateProfile(p);
      if (res.profile) { setP({ ...empty, ...res.profile }); setMsg("Данные сохранены"); setTimeout(() => setMsg(""), 4000); }
      else setErr(res.error || "Не удалось сохранить");
    } catch {
      setErr("Нет связи с сервером");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="bg-card rounded-xl border border-border p-6 text-center text-sm text-muted-foreground font-ibm">Загрузка...</div>;
  }

  const field = "mt-1 w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40";
  const label = "text-xs font-montserrat font-bold text-muted-foreground";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-montserrat font-bold text-sm text-foreground">Личные данные</h3>

        <div>
          <label className={label}>Имя и фамилия</label>
          <input type="text" value={p.name} onChange={e => set("name", e.target.value)} className={field} />
        </div>

        <div>
          <label className={label}>Электронная почта <span className="text-red-500">*</span></label>
          <input type="email" value={p.email} onChange={e => set("email", e.target.value)}
            placeholder="teacher@mail.ru" className={field} />
          <p className="text-xs text-muted-foreground font-ibm mt-1">На неё приходят уведомления</p>
        </div>

        <div>
          <label className={label}>Мобильный телефон</label>
          <input type="tel" value={p.phone || ""} onChange={e => set("phone", e.target.value)}
            placeholder="+7 900 123-45-67" className={field} />
        </div>

        <div>
          <label className={label}>О себе</label>
          <textarea rows={3} value={p.about || ""} onChange={e => set("about", e.target.value)}
            placeholder="Преподаю испанский 8 лет, готовлю к DELE"
            className={field + " resize-none"} />
        </div>
      </div>

      <div className="space-y-5">
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <h3 className="font-montserrat font-bold text-sm text-foreground">Мессенджеры и соцсети</h3>

          <div>
            <label className={label}>Telegram</label>
            <input type="text" value={p.telegram || ""} onChange={e => set("telegram", e.target.value)}
              placeholder="@username или ссылка" className={field} />
          </div>

          <div>
            <label className={label}>WhatsApp</label>
            <input type="text" value={p.whatsapp || ""} onChange={e => set("whatsapp", e.target.value)}
              placeholder="+7 900 123-45-67" className={field} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={label}>Соцсеть</label>
              <input type="text" value={p.social_name || ""} onChange={e => set("social_name", e.target.value)}
                placeholder="ВКонтакте" className={field} />
            </div>
            <div className="col-span-2">
              <label className={label}>Ссылка на профиль</label>
              <input type="url" value={p.social_url || ""} onChange={e => set("social_url", e.target.value)}
                placeholder="https://vk.com/id123" className={field} />
            </div>
          </div>
        </div>

        {isTeacher && (
          <div className="bg-card rounded-xl border border-border p-5 space-y-2">
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-1">Уведомления на почту</h3>
            <Toggle checked={!!p.notify_email} onChange={v => set("notify_email", v)}
              title="Получать письма" hint="Главный выключатель всех писем" />
            <Toggle checked={!!p.notify_new_lesson} onChange={v => set("notify_new_lesson", v)}
              title="О новых занятиях" hint="Когда занятие поставлено в расписание" />
            <Toggle checked={!!p.notify_cancel} onChange={v => set("notify_cancel", v)}
              title="Об отменах" hint="Ученик заболел или занятие отменено" />
          </div>
        )}

        {err && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
            <Icon name="TriangleAlert" size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-ibm">{err}</p>
          </div>
        )}
        {msg && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
            <Icon name="Check" size={14} className="text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700 font-ibm">{msg}</p>
          </div>
        )}

        <button onClick={save} disabled={saving}
          className="w-full py-2.5 red-accent text-white rounded-lg text-sm font-montserrat font-bold hover:opacity-90 disabled:opacity-60 transition-opacity">
          {saving ? "Сохраняю..." : "Сохранить изменения"}
        </button>
      </div>
    </div>
  );
}
