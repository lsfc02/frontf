import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BarChart3, MessageSquare, User, ChevronLeft, Fuel, Store } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

interface JWTPayload {
  exp: number;
  sub?: string;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "posto", label: "Posto", icon: Fuel },
  { id: "conveniencia", label: "Conveniência", icon: Store },
  { id: "overview", label: "Visão Geral", icon: BarChart3 },
  { id: "chat", label: "Chat IA", icon: MessageSquare },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState<string>("Usuário");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
        navigate("/login");
        return;
    }

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const remaining = decoded.exp - Math.floor(Date.now() / 1000);
      
      if (remaining <= 0) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setTimeLeft(remaining);
      setUsername(decoded.sub || "Usuário");
    } catch (e) {
      console.error("Token inválido ou expirado, redirecionando para login.");
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50", collapsed ? "w-20" : "w-72")}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">DashBoard</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
          <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 p-4 flex flex-col justify-between h-[calc(100%-65px)] overflow-y-auto">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => onTabChange(item.id)} className={cn("flex items-center gap-3 h-12 px-3 rounded-lg w-full text-base font-medium hover:bg-sidebar-accent transition-colors", activeTab === item.id && "bg-sidebar-accent text-white")} title={collapsed ? item.label : undefined}>
              <item.icon className="w-6 h-6 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {collapsed ? (
            <div className="flex items-center justify-center h-12 px-3 text-text-secondary">
              <User className="w-6 h-6 flex-shrink-0" />
            </div>
          ) : (
            <div className="w-full p-3 rounded-lg bg-sidebar-accent text-sm text-white text-left">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-base truncate text-white">{username}</span>
                  <span className="text-xs text-gray-300">⏳ Sessão: {formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}