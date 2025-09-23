import { Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";


interface RankingItem {
  position: number;
  name: string;
  value: string; // para faturamento
  subValue?: string; // para litragem
  growth: number;
}

interface RankingTableProps {
  title: string;
  subtitle?: string;
  data: RankingItem[];
}

export function RankingTable({ title, subtitle, data }: RankingTableProps) {
  return (
    <div className="chart-container">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="w-5 h-5 text-kpi-orange" />
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          {subtitle && (
            <p className="text-sm text-text-muted">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.position}
            className={cn(
              "flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:bg-card-surface",
              item.position <= 3 && "bg-gradient-to-r from-card-surface/50 to-transparent"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                item.position <= 3 
                  ? "bg-gradient-primary text-white" 
                  : "bg-muted text-text-secondary"
              )}>
                {item.position}
              </div>
              
              <div>
                <p className="font-medium text-text-primary">{item.name}</p>
                <p className="text-sm text-text-secondary">{item.value}</p>
                {item.subValue && (
                    <p className="text-xs text-text-muted mt-1">{item.subValue}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                item.growth >= 0 
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              )}>
                <TrendingUp className="w-3 h-3" />
              
                 <span>{item.growth >= 0 ? '+' : ''}{item.growth}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

