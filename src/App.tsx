import { useState } from "react";
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

export type Page = "dashboard" | "calendar" | "materials" | "homework" | "profile";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      case "calendar": return <CalendarPage />;
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
            onLogout={() => setUser(null)}
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
