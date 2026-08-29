import Icon from "@/components/ui/icon";
import { useChatAlerts } from "@/hooks/useChatAlerts";
import { type Page } from "@/App";

export default function ChatToasts({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { toasts, dismiss } = useChatAlerts();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] space-y-2 w-72 max-w-[calc(100vw-2rem)]">
      {toasts.map(t => (
        <div key={t.id}
          className="bg-card border border-border rounded-xl shadow-xl p-3 flex items-start gap-3 animate-scale-in cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => { onNavigate("chat"); dismiss(t.id); }}>
          <span className="w-9 h-9 rounded-full red-accent flex items-center justify-center flex-shrink-0">
            <Icon name="MessageSquare" size={16} className="text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-montserrat font-bold text-foreground truncate">{t.name}</p>
            <p className="text-xs text-muted-foreground font-ibm line-clamp-2">{t.preview}</p>
          </div>
          <button onClick={e => { e.stopPropagation(); dismiss(t.id); }}
            className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <Icon name="X" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
