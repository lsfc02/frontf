import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MetaItem {
  periodo: string;
  meta: number;
  realizado: number;
  percentual: number;
}

interface MetaEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meta: MetaItem) => void;
  editingMeta?: MetaItem | null;
}

export function MetaEditForm({ isOpen, onClose, onSave, editingMeta }: MetaEditFormProps) {
  const [periodo, setPeriodo] = useState("");
  const [meta, setMeta] = useState("");
  const [customDate, setCustomDate] = useState<Date>();
  const [useCustomDate, setUseCustomDate] = useState(false);
  useEffect(() => {
    if (editingMeta) {
      setPeriodo(editingMeta.periodo);
      setMeta(editingMeta.meta.toString());
    } else {
      setPeriodo("Hoje");
      setMeta("");
      setCustomDate(undefined);
      setUseCustomDate(false);
    }
  }, [editingMeta, isOpen]);

  const handleSave = () => {
    const finalPeriodo = useCustomDate && customDate 
      ? format(customDate, "MMMM yyyy", { locale: ptBR })
      : periodo;
      
    if (!finalPeriodo || !meta) return;

    const metaValue = parseFloat(meta.replace(",", "."));
    const realizadoValue = editingMeta?.realizado || 0;
    const percentual = metaValue > 0 ? (realizadoValue / metaValue) * 100 : 0;

    onSave({
      periodo: finalPeriodo,
      meta: metaValue,
      realizado: realizadoValue,
      percentual: percentual,
    });
    onClose();
  };

  const quickPeriods = [ "Hoje", "Esta semana", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro" ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text">{editingMeta ? "Editar Meta" : "Nova Meta"}</DialogTitle>
          <DialogDescription>Configure a meta de faturamento para o período desejado.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {quickPeriods.map((p) => (
                <button key={p} onClick={() => { setPeriodo(p); setUseCustomDate(false); }} className={cn("px-3 py-1 text-xs rounded-full border transition-colors", periodo === p && !useCustomDate ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-accent border-border")}>{p}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta">Meta (R$)</Label>
            <Input id="meta" type="number" placeholder="0,00" value={meta} onChange={(e) => setMeta(e.target.value)} />
          </div>

        </div>
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={(!periodo && !customDate) || !meta} className="flex-1 bg-gradient-primary hover:opacity-90"><Check className="w-4 h-4 mr-2" />Salvar</Button>
          <Button onClick={onClose} variant="outline"><X className="w-4 h-4 mr-2" />Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}