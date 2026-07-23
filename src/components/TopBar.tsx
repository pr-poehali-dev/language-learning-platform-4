import { useState, useEffect } from "react";
import { type Page } from "@/App";
import { type User } from "@/pages/LoginPage";
import { apiGetNotifications, apiMarkNotificationsRead, apiChangePassword, type Notification } from "@/lib/api";
import Icon from "@/components/ui/icon";

const pageTitles: Record<Page, string> = {
  dashboard: "Главная",
  calendar: "Календарь занятий",
  materials: "Учебные материалы",
  homework: "Домашние задания",
  profile: "Мой профиль",
};

interface TopBarProps {
  activePage: Page;
  onMenuClick: () => void;
  user: User;
  onLogout: () => void;
  onNavigate: (page: Page) => void;
}

export default function TopBar({ activePage, onMenuClick, user, onLogout, onNavigate }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    apiGetNotifications().then(res => {
      if (res.notifications) setNotifications(res.notifications);
      if (res.unread !== undefined) setUnread(res.unread);
    });
  }, []);

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
    if (!showNotifications && unread > 0) {
      apiMarkNotificationsRead().then(() => setUnread(0));
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
      if (diff < 60) return `${diff} мин назад`;
      if (diff < 1440) return `${Math.floor(diff/60)} ч назад`;
      return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
    } catch { return ""; }
  };

  const handleChangePassword = async () => {
    setSettingsError("");
    setSettingsSuccess("");
    if (!oldPassword || !newPassword) {
      setSettingsError("Заполните оба поля");
      return;
    }
    if (newPassword.length < 6) {
      setSettingsError("Новый пароль должен быть не менее 6 символов");
      return;
    }
    setSettingsLoading(true);
    try {
      const res = await apiChangePassword(oldPassword, newPassword);
      if (res.error) {
        setSettingsError(res.error);
      } else {
        setSettingsSuccess("Пароль успешно изменён");
        setOldPassword("");
        setNewPassword("");
      }
    } catch {
      setSettingsError("Ошибка соединения");
    }
    setSettingsLoading(false);
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-4 md:px-6 gap-4 flex-shrink-0 relative">
      <button onClick={onMenuClick} className="md:hidden p-1.5 rounded-md hover:bg-muted transition-colors">
        <Icon name="Menu" size={20} className="text-foreground" />
      </button>

      <div className="flex-1">
        <h1 className="font-montserrat font-bold text-foreground text-base md:text-lg">
          {pageTitles[activePage]}
        </h1>
      </div>

      <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 w-48">
        <Icon name="Search" size={15} className="text-muted-foreground" />
        <input
          type="text"
          placeholder="Поиск..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full font-ibm"
        />
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={handleOpenNotifications}
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Icon name="Bell" size={20} className="text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center font-montserrat leading-none">
              {unread}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-montserrat font-bold text-sm text-foreground">Уведомления</span>
              <span
                className="text-xs text-primary font-medium cursor-pointer hover:underline"
                onClick={() => {
                  apiMarkNotificationsRead().then(() => {
                    setUnread(0);
                    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                  });
                }}
              >Прочитать все</span>
            </div>
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground font-ibm">Нет уведомлений</div>
              ) : notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${!n.is_read ? "bg-primary/5" : ""}`}>
                  <div className="flex gap-3 items-start">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? "bg-accent" : "bg-transparent"}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground font-ibm leading-snug">{n.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatTime(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="w-8 h-8 rounded-full red-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white font-montserrat font-bold text-xs">{user.avatar}</span>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-montserrat font-bold text-foreground leading-none">{user.name.split(" ")[0]}</p>
            <p className="text-xs text-muted-foreground font-ibm">{user.role === "teacher" ? "Преподаватель" : "Студент"}</p>
          </div>
          <Icon name="ChevronDown" size={14} className="text-muted-foreground hidden md:block" />
        </button>

        {showUserMenu && (
          <div className="absolute right-0 top-12 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-scale-in">
            <div className="px-4 py-3 border-b border-border">
              <p className="font-montserrat font-bold text-sm text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground font-ibm">{user.role === "teacher" ? "Преподаватель" : `Студент · ${user.level}`}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => { onNavigate("profile"); setShowUserMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors font-ibm"
              >
                <Icon name="UserCircle" size={16} className="text-muted-foreground" />
                Мой профиль
              </button>
              <button
                onClick={() => { setShowSettings(true); setShowUserMenu(false); setSettingsError(""); setSettingsSuccess(""); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors font-ibm"
              >
                <Icon name="Settings" size={16} className="text-muted-foreground" />
                Настройки
              </button>
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-ibm"
                >
                  <Icon name="LogOut" size={16} />
                  Выйти
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {(showNotifications || showUserMenu) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotifications(false); setShowUserMenu(false); }} />
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowSettings(false)} />
          <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-5 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-montserrat font-bold text-base text-foreground">Настройки</h2>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded-md hover:bg-muted transition-colors">
                <Icon name="X" size={18} className="text-muted-foreground" />
              </button>
            </div>

            <p className="text-xs font-montserrat font-bold text-foreground mb-3">Сменить пароль</p>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Текущий пароль"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40"
              />
              <input
                type="password"
                placeholder="Новый пароль (мин. 6 символов)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-ibm outline-none focus:border-primary/40"
              />
              {settingsError && <p className="text-xs text-red-600 font-ibm">{settingsError}</p>}
              {settingsSuccess && <p className="text-xs text-green-600 font-ibm">{settingsSuccess}</p>}
              <button
                onClick={handleChangePassword}
                disabled={settingsLoading}
                className="w-full py-2.5 red-accent text-white rounded-lg text-sm font-montserrat font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {settingsLoading ? "Сохраняю..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}