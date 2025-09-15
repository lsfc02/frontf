import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel?: string;
  color: "cyan" | "purple" | "pink" | "orange" | "green" | "blue";
  icon?: React.ReactNode;
  subtitle?: string;
}

const colorClasses = {
  cyan: "border-t-kpi-cyan",
  purple: "border-t-kpi-purple", 
  pink: "border-t-kpi-pink",
  orange: "border-t-kpi-orange",
  green: "border-t-kpi-green",
  blue: "border-t-kpi-blue",
};

const textColorClasses = {
  cyan: "text-kpi-cyan",
  purple: "text-kpi-purple",
  pink: "text-kpi-pink", 
  orange: "text-kpi-orange",
  green: "text-kpi-green",
  blue: "text-kpi-blue",
};

export function KPICard({ 
  title, 
  value, 
  change, 
  changeLabel = "vs mês anterior",
  color,
  icon,
  subtitle 
}: KPICardProps) {
  const isPositive = change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={cn("kpi-card group", colorClasses[color])}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && (
            <div className={cn("p-2 rounded-lg bg-opacity-20", `bg-${color}`)}>
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
            {subtitle && (
              <p className="text-xs text-text-muted">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Value */}
      <div className="mb-3">
        <div className={cn("text-3xl font-bold", textColorClasses[color])}>
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </div>
      </div>

      {/* Change indicator */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          isPositive 
            ? "bg-green/20 text-green" 
            : "bg-destructive/20 text-destructive"
        )}>
          <TrendIcon className="w-3 h-3" />
          <span>{Math.abs(change)}%</span>
        </div>
        <span className="text-xs text-text-muted">{changeLabel}</span>
      </div>

      {/* Glow effect on hover */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none",
        `bg-${color}`
      )} />
    </div>
  );
}