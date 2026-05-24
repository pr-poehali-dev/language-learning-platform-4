import { useState } from "react";
import Icon from "@/components/ui/icon";
import { apiLogin } from "@/lib/api";

export type UserRole = "student" | "teacher";

export interface User {
  id: number;
  name: string;
  role: UserRole;
  level?: string;
  avatar: string;
}

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const DEMO = {
  student: { email: "anna@hispania35.ru", password: "student123" },
  teacher: { email: "elena@hispania35.ru", password: "teacher123" },
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiLogin(email.trim().toLowerCase(), password);
      if (res.error || !res.token || !res.user) {
        setError(res.error || "Неверный email или пароль");
        setLoading(false);
        return;
      }
      localStorage.setItem("hispania_token", res.token);
      onLogin({ id: res.user.id, name: res.user.name, role: res.user.role, level: res.user.level, avatar: res.user.avatar });
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
      setLoading(false);
    }
  };

  const fillDemo = (role: UserRole) => {
    setEmail(DEMO[role].email);
    setPassword(DEMO[role].password);
    setError("");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 red-accent flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 opacity-10">
          {["¡Hola!", "Gracias", "Buenos días", "¿Cómo estás?", "Hasta luego"].map((w, i) => (
            <div
              key={i}
              className="absolute font-montserrat font-black text-white whitespace-nowrap"
              style={{
                fontSize: `${2 + (i % 3)}rem`,
                top: `${10 + i * 18}%`,
                left: `${-5 + (i % 2) * 20}%`,
                transform: "rotate(-8deg)",
                opacity: 0.6,
              }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-accent flex items-center justify-center">
            <span className="font-montserrat font-black text-foreground text-base">H</span>
          </div>
          <div>
            <p className="font-montserrat font-black text-white text-lg leading-none">Hispania 35</p>
            <p className="text-white/60 text-xs font-ibm">Языковая студия</p>
          </div>
        </div>

        {/* Center text */}
        <div className="relative">
          <h1 className="font-montserrat font-black text-white text-4xl leading-tight mb-4">
            Платформа<br />онлайн-обучения
          </h1>
          <p className="text-white/70 font-ibm text-lg leading-relaxed">
            Испанский, немецкий, английский —<br />
            всё в одном месте. Уроки, материалы,<br />
            домашние задания и чат с преподавателем.
          </p>
        </div>

        {/* Stats */}
        <div className="relative flex gap-8">
          {[
            { value: "6", label: "чел. в группе" },
            { value: "3", label: "языка" },
            { value: "112+", label: "учеников" },
          ].map((s, i) => (
            <div key={i}>
              <p className="font-montserrat font-black text-white text-2xl">{s.value}</p>
              <p className="text-white/60 text-xs font-ibm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl red-accent flex items-center justify-center">
              <span className="font-montserrat font-black text-white text-sm">H</span>
            </div>
            <div>
              <p className="font-montserrat font-black text-foreground text-base leading-none">Hispania 35</p>
              <p className="text-muted-foreground text-xs font-ibm">Платформа обучения</p>
            </div>
          </div>

          <h2 className="font-montserrat font-black text-foreground text-2xl mb-1">Вход в систему</h2>
          <p className="text-muted-foreground font-ibm text-sm mb-7">Введите данные для входа в личный кабинет</p>

          {/* Quick demo buttons */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => fillDemo("student")}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-montserrat font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="GraduationCap" size={14} />
              Войти как студент
            </button>
            <button
              type="button"
              onClick={() => fillDemo("teacher")}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-montserrat font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="BookUser" size={14} />
              Войти как преподаватель
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-ibm">или введите вручную</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-montserrat font-bold text-foreground mb-1.5">Email</label>
              <div className="relative">
                <Icon name="Mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="your@email.ru"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-ibm placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-montserrat font-bold text-foreground mb-1.5">Пароль</label>
              <div className="relative">
                <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-ibm placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 animate-scale-in">
                <Icon name="AlertCircle" size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 font-ibm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 red-accent text-white rounded-xl font-montserrat font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Icon name="Loader" size={16} className="animate-spin" />
                  Вхожу...
                </>
              ) : (
                <>
                  Войти
                  <Icon name="ArrowRight" size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground font-ibm mt-6">
            Проблемы со входом? Напишите преподавателю<br />или на{" "}
            <a href="https://hispania35.online" target="_blank" className="text-primary hover:underline">hispania35.online</a>
          </p>
        </div>
      </div>
    </div>
  );
}