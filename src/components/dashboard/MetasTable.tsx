import { useState } from "react";
import { Target, TrendingUp, TrendingDown, Plus, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MetaEditForm } from "./MetaEditForm";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/utils";

interface MetaItem {
  periodo: string;
  meta: number;
  realizado: number;
  percentual: number;
}

interface MetasTableProps {
  title: string;
  data: MetaItem[];
  onDataChange: (newData: MetaItem[]) => void;
}

export function MetasTable({ title, data, onDataChange }: MetasTableProps) {
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaItem | null>(null);
  const { toast } = useToast();

  const handleSaveMeta = (savedMeta: MetaItem) => {
    const isEditing = data.some(item => item.periodo === savedMeta.periodo && item !== editingMeta);
    
    let updatedData: MetaItem[];
    if (editingMeta) { 
      updatedData = data.map(item => 
        item.periodo === editingMeta.periodo ? savedMeta : item
      );
      toast({ title: "Meta atualizada", description: `Meta para ${savedMeta.periodo} foi atualizada.` });
    } else {
      updatedData = [...data, savedMeta];
      toast({ title: "Meta adicionada", description: `Nova meta para ${savedMeta.periodo} foi criada.` });
    }
    
    onDataChange(updatedData);
  };

  const handleEditMeta = (meta: MetaItem) => {
    setEditingMeta(meta);
    setIsEditFormOpen(true);
  };

  const handleDeleteMeta = (periodo: string) => {
    const updatedData = data.filter(item => item.periodo !== periodo);
    onDataChange(updatedData);
    toast({ title: "Meta removida", description: `Meta para ${periodo} foi removida.` });
  };

  const handleAddMeta = () => {
    setEditingMeta(null);
    setIsEditFormOpen(true);
  };

  return (
    <>
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-kpi-cyan" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
              <p className="text-sm text-text-muted">Acompanhamento de performance</p>
            </div>
          </div>
          <Button onClick={handleAddMeta} size="sm" className="bg-gradient-primary hover:opacity-90 gap-2"><Plus className="w-4 h-4" />Nova Meta</Button>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => {
            const isAchieved = item.percentual >= 100;
            const isToday = item.periodo === "Hoje";
            
            return (
              <div key={`${item.periodo}-${index}`} className={cn("p-4 rounded-xl border transition-all duration-200 group", isToday ? "border-kpi-cyan/30 bg-kpi-cyan/5" : "border-border/30 hover:bg-card-surface")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("font-medium", isToday ? "text-kpi-cyan" : "text-text-primary")}>{item.periodo}</span>
                    {isToday && (<span className="px-2 py-1 text-xs rounded-full bg-kpi-cyan/20 text-kpi-cyan">Atual</span>)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditMeta(item)} className="h-6 w-6 p-0 hover:bg-kpi-cyan/20"><Edit className="w-3 h-3" /></Button>
                      {item.periodo !== "Hoje" && (<Button size="sm" variant="ghost" onClick={() => handleDeleteMeta(item.periodo)} className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>)}
                    </div>
                    <div className="flex items-center gap-1">
                      {isAchieved ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                      <span className={cn("font-semibold text-sm", isAchieved ? "text-green-400" : "text-red-400")}>{item.percentual.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-text-secondary">Meta:</span><span className="text-text-primary font-medium">{formatNumber(item.meta, {style: 'currency'})}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-secondary">Realizado:</span><span className={cn("font-medium", isAchieved ? "text-green-400" : "text-text-primary")}>{formatNumber(item.realizado, {style: 'currency'})}</span></div>
                  <Progress value={Math.min(item.percentual, 100)} className="h-2 mt-3" />
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <h4 className="font-semibold">Nenhuma meta cadastrada</h4>
              <p className="text-sm mt-1 opacity-70">Clique em "Nova Meta" para começar a acompanhar.</p>
            </div>
          )}
        </div>
      </div>

      <MetaEditForm isOpen={isEditFormOpen} onClose={() => setIsEditFormOpen(false)} onSave={handleSaveMeta} editingMeta={editingMeta} />
    </>
  );
}