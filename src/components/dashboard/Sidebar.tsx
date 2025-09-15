import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Car, 
  ShoppingCart, 
  MessageSquare, 
  Settings, 
  User,
  ChevronLeft,
  Fuel,
  Store
} from "lucide-react";

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

const bottomItems = [
  { id: "settings", label: "Configurações", icon: Settings },
  { id: "profile", label: "Perfil", icon: User },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50",
      collapsed ? "w-16" : "w-64",
      "lg:relative lg:translate-x-0", // Always visible on large screens
      "max-lg:translate-x-0" // Mobile handling can be added later
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Fuel className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">FuelTech</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <ChevronLeft className={cn(
            "w-4 h-4 transition-transform",
            collapsed && "rotate-180"
          )} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "sidebar-item w-full",
                  activeTab === item.id && "active"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Bottom items */}
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "sidebar-item w-full",
                  activeTab === item.id && "active"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}