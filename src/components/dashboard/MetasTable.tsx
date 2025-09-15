import { Target, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface MetaItem {
  periodo: string;
  meta: number;
  realizado: number;
  percentual: number;
}

interface MetasTableProps {
  title: string;
  data: MetaItem[];
}

export function MetasTable({ title, data }: MetasTableProps) {
  return (
    <div className="chart-container">
      <div className="flex items-center gap-3 mb-4">
        <Target className="w-5 h-5 text-kpi-cyan" />
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-muted">Acompanhamento de performance</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => {
          const isAchieved = item.percentual >= 100;
          const isToday = item.periodo === "Hoje";
          
          return (
            <div
              key={index}
              className={cn(
                "p-4 rounded-xl border transition-all duration-200",
                isToday 
                  ? "border-kpi-cyan/30 bg-kpi-cyan/5" 
                  : "border-border/30 hover:bg-card-surface"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "font-medium",
                    isToday ? "text-kpi-cyan" : "text-text-primary"
                  )}>
                    {item.periodo}
                  </span>
                  {isToday && (
                    <span className="px-2 py-1 text-xs rounded-full bg-kpi-cyan/20 text-kpi-cyan">
                      Atual
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {isAchieved ? (
                    <TrendingUp className="w-4 h-4 text-green" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                  <span className={cn(
                    "font-semibold text-sm",
                    isAchieved ? "text-green" : "text-destructive"
                  )}>
                    {item.percentual.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Meta:</span>
                  <span className="text-text-primary font-medium">
                    R$ {item.meta.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Realizado:</span>
                  <span className={cn(
                    "font-medium",
                    isAchieved ? "text-green" : "text-text-primary"
                  )}>
                    R$ {item.realizado.toLocaleString('pt-BR')}
                  </span>
                </div>
                
                <Progress 
                  value={Math.min(item.percentual, 100)}
                  className="h-2 mt-3"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}