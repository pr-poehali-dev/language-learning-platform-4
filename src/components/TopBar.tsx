import { useState } from "react";
import { type Page } from "@/App";
import Icon from "@/components/ui/icon";

const pageTitles: Record<Page, string> = {
  dashboard: "Главная",
  calendar: "Календарь занятий",
  materials: "Учебные материалы",
  homework: "Домашние задания",
  profile: "Мой профиль",
};

const notifications = [
  { id: 1, text: "Новый урок добавлен: Subjuntivo", time: "5 мин назад", type: "material", read: false },
  { id: 2, text: "Домашнее задание проверено", time: "1 час назад", type: "homework", read: false },
  { id: 3, text: "Завтра занятие в 18:00", time: "3 часа назад", type: "calendar", read: true },
  { id: 4, text: "Новое сообщение от Елены", time: "Вчера", type: "chat", read: true },
];

interface TopBarProps {
  activePage: Page;
  onMenuClick: () => void;
}

export default function TopBar({ activePage, onMenuClick }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-4 md:px-6 gap-4 flex-shrink-0 relative">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-1.5 rounded-md hover:bg-muted transition-colors"
      >
        <Icon name="Menu" size={20} className="text-foreground" />
      </button>

      {/* Title */}
      <div className="flex-1">
        <h1 className="font-montserrat font-bold text-foreground text-base md:text-lg">
          {pageTitles[activePage]}
        </h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 w-48">
        <Icon name="Search" size={15} className="text-muted-foreground" />
        <input
          type="text"
          placeholder="Поиск..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full font-ibm"
        />
      </div>

      {/* Chat */}
      <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
        <Icon name="MessageSquare" size={20} className="text-muted-foreground" />
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
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
              <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Прочитать все</span>
            </div>
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}>
                  <div className="flex gap-3 items-start">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? "bg-accent" : "bg-transparent"}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground font-ibm leading-snug">{n.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full red-accent flex items-center justify-center flex-shrink-0 cursor-pointer">
        <span className="text-white font-montserrat font-bold text-xs">АМ</span>
      </div>

      {/* Close notifications on outside click */}
      {showNotifications && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
      )}
    </header>
  );
}
