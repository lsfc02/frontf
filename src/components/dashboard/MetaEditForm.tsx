import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [periodo, setPeriodo] = useState(editingMeta?.periodo || "");
  const [meta, setMeta] = useState(editingMeta?.meta?.toString() || "");
  const [realizado, setRealizado] = useState(editingMeta?.realizado?.toString() || "");
  const [customDate, setCustomDate] = useState<Date>();
  const [useCustomDate, setUseCustomDate] = useState(false);

  const handleSave = () => {
    if (!periodo || !meta || !realizado) return;

    const metaValue = parseFloat(meta.replace(",", "."));
    const realizadoValue = parseFloat(realizado.replace(",", "."));
    const percentual = (realizadoValue / metaValue) * 100;

    const finalPeriodo = useCustomDate && customDate 
      ? format(customDate, "MMMM yyyy", { locale: ptBR })
      : periodo;

    onSave({
      periodo: finalPeriodo,
      meta: metaValue,
      realizado: realizadoValue,
      percentual: percentual,
    });

    // Reset form
    setPeriodo("");
    setMeta("");
    setRealizado("");
    setCustomDate(undefined);
    setUseCustomDate(false);
    onClose();
  };

  const handleClose = () => {
    // Reset form
    setPeriodo("");
    setMeta("");
    setRealizado("");
    setCustomDate(undefined);
    setUseCustomDate(false);
    onClose();
  };

  const quickPeriods = [
    "Hoje",
    "Esta semana", 
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text">
            {editingMeta ? "Editar Meta" : "Nova Meta"}
          </DialogTitle>
          <DialogDescription>
            Configure as metas e valores realizados para acompanhamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Período */}
          <div className="space-y-2">
            <Label htmlFor="periodo">Período</Label>
            
            {/* Quick period buttons */}
            <div className="flex flex-wrap gap-2 mb-2">
              {quickPeriods.map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setPeriodo(period);
                    setUseCustomDate(false);
                  }}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full border transition-colors",
                    periodo === period
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted hover:bg-accent border-border"
                  )}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Custom date picker */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDate ? format(customDate, "PPP", { locale: ptBR }) : "Data personalizada"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDate}
                    onSelect={(date) => {
                      setCustomDate(date);
                      if (date) {
                        setUseCustomDate(true);
                        setPeriodo("");
                      }
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Manual input */}
            <Input
              id="periodo"
              placeholder="Ou digite um período personalizado"
              value={periodo}
              onChange={(e) => {
                setPeriodo(e.target.value);
                setUseCustomDate(false);
              }}
            />
          </div>

          {/* Meta */}
          <div className="space-y-2">
            <Label htmlFor="meta">Meta (R$)</Label>
            <Input
              id="meta"
              type="number"
              placeholder="0,00"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
            />
          </div>

          {/* Realizado */}
          <div className="space-y-2">
            <Label htmlFor="realizado">Realizado (R$)</Label>
            <Input
              id="realizado"
              type="number"
              placeholder="0,00"
              value={realizado}
              onChange={(e) => setRealizado(e.target.value)}
            />
          </div>

          {/* Preview */}
          {meta && realizado && (
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-sm text-text-secondary mb-1">Preview:</div>
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {useCustomDate && customDate 
                    ? format(customDate, "MMMM yyyy", { locale: ptBR })
                    : periodo || "Período"
                  }
                </span>
                <span className={cn(
                  "font-semibold",
                  parseFloat(realizado) >= parseFloat(meta) ? "text-green" : "text-destructive"
                )}>
                  {((parseFloat(realizado) / parseFloat(meta)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={!periodo && !customDate || !meta || !realizado}
            className="flex-1 bg-gradient-primary hover:opacity-90"
          >
            <Check className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button onClick={handleClose} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}