import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils"; 

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  format?: 'currency' | 'decimal' | 'integer'; 
  unit?: string;
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

export function KPICard({ title, value, change, format, unit, color, icon, subtitle }: KPICardProps) {
  const isPositive = typeof change === 'number' && change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const formattedValue = () => {
    if (typeof value !== 'number') return value;

    let formattedString: string;
    switch (format) {
      case 'currency':
        formattedString = formatNumber(value, { style: 'currency' });
        break;
      case 'decimal':
        formattedString = formatNumber(value, { maximumFractionDigits: 2 });
        break;
      case 'integer':
        formattedString = formatNumber(value, { maximumFractionDigits: 0 });
        break;
      default:
        formattedString = value.toLocaleString('pt-BR');
    }
    return `${formattedString}${unit || ''}`;
  };

  return (
    <div className={cn("kpi-card group", colorClasses[color])}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <div className="p-2 rounded-lg">{icon}</div>}
          <div>
            <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
            {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className={cn("text-3xl font-bold", textColorClasses[color])}>
          {formattedValue()}
        </div>
      </div>

      {typeof change === 'number' && (
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(change)}%</span>
          </div>
          <span className="text-xs text-text-muted">vs mês anterior</span>
        </div>
      )}
    </div>
  );
}