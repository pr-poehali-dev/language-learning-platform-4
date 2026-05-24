import { type Page } from "@/App";
import Icon from "@/components/ui/icon";

const navItems = [
  { id: "dashboard" as Page, label: "Главная", icon: "LayoutDashboard" },
  { id: "calendar" as Page, label: "Календарь", icon: "CalendarDays" },
  { id: "materials" as Page, label: "Материалы", icon: "BookOpen" },
  { id: "homework" as Page, label: "Домашние задания", icon: "ClipboardList" },
  { id: "profile" as Page, label: "Профиль", icon: "UserCircle" },
];

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-50 md:z-auto
          flex flex-col w-64 h-full sidebar-gradient
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gold-accent flex items-center justify-center flex-shrink-0">
              <span className="text-foreground font-montserrat font-black text-sm">H</span>
            </div>
            <div>
              <p className="font-montserrat font-bold text-sidebar-foreground text-sm leading-tight">Hispania 35</p>
              <p className="text-xs text-sidebar-foreground/50">Платформа обучения</p>
            </div>
          </div>
        </div>

        {/* User badge */}
        <div className="px-4 py-3 mx-3 mt-4 rounded-lg bg-sidebar-accent/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full red-accent flex items-center justify-center flex-shrink-0">
              <span className="text-white font-montserrat font-bold text-xs">АМ</span>
            </div>
            <div className="min-w-0">
              <p className="text-sidebar-foreground font-medium text-xs truncate">Анна Михайлова</p>
              <p className="text-sidebar-foreground/50 text-xs">Студент · Уровень B1</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${isActive
                    ? "bg-sidebar-primary text-white shadow-sm"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                  }
                `}
              >
                <Icon name={item.icon} size={18} className="flex-shrink-0" />
                <span className="font-ibm">{item.label}</span>
                {item.id === "homework" && (
                  <span className="ml-auto bg-accent text-accent-foreground text-xs font-bold px-1.5 py-0.5 rounded-full font-montserrat">3</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-150">
            <Icon name="Settings" size={18} />
            <span className="font-ibm">Настройки</span>
          </button>
        </div>
      </aside>
    </>
  );
}
