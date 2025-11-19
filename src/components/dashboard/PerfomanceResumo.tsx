import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PerformanceData {
  categoria: string; 
  metaMensal: number;
  realizado: number;
  litragem: number;  // ✅ Campo já existe
  tendencia: number;
  desempenho: number;
  faltante: number;
}

interface PerformanceResumoProps {
  titulo: string;
  data: PerformanceData[];
  onAddMeta: () => void;
  onEditMeta: (item: PerformanceData) => void;
}

export function PerformanceResumo({ titulo, data, onAddMeta, onEditMeta }: PerformanceResumoProps) {
  const total = data.reduce((acc, item) => {
    acc.metaMensal += item.metaMensal;
    acc.realizado += item.realizado;
    acc.litragem += item.litragem;  // ✅ Soma litragem
    acc.tendencia += item.tendencia;
    acc.faltante += item.faltante;
    return acc;
  }, { categoria: "TOTAL", metaMensal: 0, realizado: 0, litragem: 0, tendencia: 0, desempenho: 0, faltante: 0 });
  total.desempenho = total.metaMensal > 0 ? (total.realizado / total.metaMensal - 1) * 100 : 0;

  const renderDesempenho = (desempenho: number) => {
    if(!isFinite(desempenho) || desempenho === 0) return <span className="font-semibold text-text-secondary">--</span>;
    const isNegative = desempenho < 0;
    return (
      <span className={cn("font-semibold flex items-center justify-end gap-1 text-xs", isNegative ? "text-red-400" : "text-green-400")}>
        {isNegative ? <ArrowDown className="w-3 h-3"/> : <ArrowUp className="w-3 h-3"/>}
        {desempenho.toFixed(0)}%
      </span>
    );
  };
  
  return (
    <div className="chart-container col-span-1 lg:col-span-2">
       <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">{titulo}</h3>
          <Button onClick={onAddMeta} size="sm" className="bg-gradient-primary hover:opacity-90 gap-2">
            <Plus className="w-4 h-4" /> Nova Meta
          </Button>
       </div>
       <div className="overflow-x-auto">
         <table className="w-full text-sm">
            <thead className="text-xs text-text-secondary uppercase">
              <tr>
                <th className="px-2 py-3 text-left">Categoria</th>
                <th className="px-2 py-3 text-right">Meta Mensal</th>
                <th className="px-2 py-3 text-right">Litragem</th>  {/* ✅ Nova coluna */}
                <th className="px-2 py-3 text-right">Realizado</th>
                <th className="px-2 py-3 text-right">Tendência</th>
                <th className="px-2 py-3 text-right">Desempenho</th>
                <th className="px-2 py-3 text-right">Faltante</th>
                <th className="px-2 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-text-primary">
              {data.map((item) => (
                <tr key={item.categoria} className="border-b border-border">
                  <td className="px-2 py-3 font-medium">{item.categoria}</td>
                  <td className="px-2 py-3 text-right text-text-secondary">{formatNumber(item.metaMensal, {style: 'currency'})}</td>
                  <td className="px-2 py-3 text-right font-semibold text-kpi-purple">
                    {formatNumber(item.litragem, {maximumFractionDigits: 2})} L
                  </td>  {/* ✅ Mostra litragem */}
                  <td className="px-2 py-3 text-right font-semibold">{formatNumber(item.realizado, {style: 'currency'})}</td>
                  <td className="px-2 py-3 text-right text-text-secondary">{formatNumber(item.tendencia, {style: 'currency'})}</td>
                  <td className="px-2 py-3 text-right">{renderDesempenho(item.desempenho)}</td>
                  <td className="px-2 py-3 text-right text-text-secondary">{formatNumber(item.faltante, {style: 'currency'})}</td>
                  <td className="px-2 py-3 text-center">
                    <Button size="sm" variant="ghost" onClick={() => onEditMeta(item)} className="h-6 w-6 p-0 hover:bg-kpi-cyan/20">
                      <Edit className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="font-bold text-text-primary">
               <tr>
                  <td className="px-2 py-3">{total.categoria}</td>
                  <td className="px-2 py-3 text-right">{formatNumber(total.metaMensal, {style: 'currency'})}</td>
                  <td className="px-2 py-3 text-right text-kpi-purple">
                    {formatNumber(total.litragem, {maximumFractionDigits: 2})} L
                  </td>  {/* ✅ Total de litragem */}
                  <td className="px-2 py-3 text-right">{formatNumber(total.realizado, {style: 'currency'})}</td>
                  <td className="px-2 py-3 text-right">{formatNumber(total.tendencia, {style: 'currency'})}</td>
                  <td className="px-2 py-3 text-right">{renderDesempenho(total.desempenho)}</td>
                  <td className="px-2 py-3 text-right">{formatNumber(total.faltante, {style: 'currency'})}</td>
                  <td className="px-2 py-3"></td>
               </tr>
            </tfoot>
         </table>
       </div>
    </div>
  );
}
