import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import MaterialsPage from "./pages/MaterialsPage";
import HomeworkPage from "./pages/HomeworkPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage, { type User } from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import { apiMe, apiLogout } from "./lib/api";

export type Page = "dashboard" | "calendar" | "materials" | "homework" | "profile";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  // Восстановить сессию из localStorage
  useEffect(() => {
    const token = localStorage.getItem("hispania_token");
    if (!token) { setChecking(false); return; }
    apiMe().then(res => {
      if (res.user) {
        setUser({ id: res.user.id, name: res.user.name, role: res.user.role, level: res.user.level, avatar: res.user.avatar });
      } else {
        localStorage.removeItem("hispania_token");
      }
      setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    await apiLogout();
    setUser(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl red-accent flex items-center justify-center">
            <span className="font-montserrat font-black text-white">H</span>
          </div>
          <p className="text-muted-foreground text-sm font-ibm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <TooltipProvider>
        <LoginPage onLogin={(u) => { setUser(u); setActivePage("dashboard"); }} />
      </TooltipProvider>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard onNavigate={setActivePage} user={user} />;
      case "calendar": return <CalendarPage user={user} />;
      case "materials": return <MaterialsPage user={user} />;
      case "homework": return <HomeworkPage user={user} />;
      case "profile": return <ProfilePage user={user} />;
      default: return <Dashboard onNavigate={setActivePage} user={user} />;
    }
  };

  return (
    <TooltipProvider>
      <Toaster />
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar
          activePage={activePage}
          onNavigate={(p) => { setActivePage(p); setSidebarOpen(false); }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            activePage={activePage}
            onMenuClick={() => setSidebarOpen(true)}
            user={user}
            onLogout={handleLogout}
            onNavigate={setActivePage}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="animate-fade-in" key={activePage}>
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}