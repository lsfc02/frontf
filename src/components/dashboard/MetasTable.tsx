import { useState } from "react";
import { Target, TrendingUp, TrendingDown, Plus, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MetaEditForm } from "./MetaEditForm";
import { useToast } from "@/hooks/use-toast";

interface MetaItem {
  periodo: string;
  meta: number;
  realizado: number;
  percentual: number;
}

interface MetasTableProps {
  title: string;
  data: MetaItem[];
  onDataChange?: (newData: MetaItem[]) => void;
}

export function MetasTable({ title, data: initialData, onDataChange }: MetasTableProps) {
  const [data, setData] = useState<MetaItem[]>(initialData);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaItem | null>(null);
  const { toast } = useToast();

  const handleSaveMeta = (newMeta: MetaItem) => {
    let updatedData: MetaItem[];
    
    if (editingMeta) {
      // Editing existing meta
      updatedData = data.map(item => 
        item.periodo === editingMeta.periodo ? newMeta : item
      );
      toast({
        title: "Meta atualizada",
        description: `Meta para ${newMeta.periodo} foi atualizada com sucesso.`,
      });
    } else {
      // Adding new meta
      updatedData = [...data, newMeta];
      toast({
        title: "Meta adicionada",
        description: `Nova meta para ${newMeta.periodo} foi criada com sucesso.`,
      });
    }
    
    setData(updatedData);
    onDataChange?.(updatedData);
    setEditingMeta(null);
  };

  const handleEditMeta = (meta: MetaItem) => {
    setEditingMeta(meta);
    setIsEditFormOpen(true);
  };

  const handleDeleteMeta = (periodo: string) => {
    const updatedData = data.filter(item => item.periodo !== periodo);
    setData(updatedData);
    onDataChange?.(updatedData);
    
    toast({
      title: "Meta removida",
      description: `Meta para ${periodo} foi removida com sucesso.`,
    });
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
          
          <Button
            onClick={handleAddMeta}
            size="sm"
            className="bg-gradient-primary hover:opacity-90 gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Meta
          </Button>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => {
            const isAchieved = item.percentual >= 100;
            const isToday = item.periodo === "Hoje";
            
            return (
              <div
                key={`${item.periodo}-${index}`}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-200 group",
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
                    {/* Edit and Delete buttons */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditMeta(item)}
                        className="h-6 w-6 p-0 hover:bg-kpi-cyan/20"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteMeta(item.periodo)}
                        className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {/* Percentage */}
                    <div className="flex items-center gap-1">
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
          
          {data.length === 0 && (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-text-muted">Nenhuma meta cadastrada</p>
              <p className="text-sm text-text-muted mt-1">Clique em "Nova Meta" para começar</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form Modal */}
      <MetaEditForm
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setEditingMeta(null);
        }}
        onSave={handleSaveMeta}
        editingMeta={editingMeta}
      />
    </>
  );
}