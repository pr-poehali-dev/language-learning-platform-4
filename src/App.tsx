import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import MaterialsPage from "./pages/MaterialsPage";
import HomeworkPage from "./pages/HomeworkPage";
import ProfilePage from "./pages/ProfilePage";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";

export type Page = "dashboard" | "calendar" | "materials" | "homework" | "profile";

export default function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard onNavigate={setActivePage} />;
      case "calendar": return <CalendarPage />;
      case "materials": return <MaterialsPage />;
      case "homework": return <HomeworkPage />;
      case "profile": return <ProfilePage />;
      default: return <Dashboard onNavigate={setActivePage} />;
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
        />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            activePage={activePage}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6" key={activePage}>
            <div className="animate-fade-in">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
