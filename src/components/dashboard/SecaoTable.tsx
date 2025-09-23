import { formatNumber } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import { useMemo } from 'react';

interface SecaoPerformance {
  secao: string;
  faturamento: number;
  custo: number;
  margemPercentual: number;
  participacaoPercentual: number;
}

interface SecaoTableProps {
  title: string;
  data: SecaoPerformance[];
}

export function SecaoTable({ title, data }: SecaoTableProps) {
  const total = useMemo(() => {
    if (!data) return { faturamento: 0, custo: 0 };
    return data.reduce((acc, item) => {
      acc.faturamento += item.faturamento || 0;
      acc.custo += item.custo || 0;
      return acc;
    }, { faturamento: 0, custo: 0 });
  }, [data]);

  return (
    <div className="chart-container">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="w-5 h-5 text-kpi-orange" />
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-muted">Performance por seção</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase bg-card-surface">
            <tr>
              <th scope="col" className="px-6 py-3">Seção</th>
              <th scope="col" className="px-6 py-3 text-right">Faturamento</th>
              <th scope="col" className="px-6 py-3 text-right">Custo</th>
              <th scope="col" className="px-6 py-3 text-right">Margem</th>
              <th scope="col" className="px-6 py-3 text-right">Participação</th>
            </tr>
          </thead>
          <tbody>
            {data && data.map((item) => (
              <tr key={item.secao} className="border-b border-border hover:bg-card-surface">
                <th scope="row" className="px-6 py-4 font-medium text-text-primary whitespace-nowrap">{item.secao || 'N/A'}</th>
                <td className="px-6 py-4 text-right">{formatNumber(item.faturamento || 0, { style: 'currency' })}</td>
                <td className="px-6 py-4 text-right">{formatNumber(item.custo || 0, { style: 'currency' })}</td>
                <td className="px-6 py-4 text-right font-medium text-cyan-400">{(item.margemPercentual || 0).toFixed(2)}%</td>
                <td className="px-6 py-4 text-right">{(item.participacaoPercentual || 0).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-bold text-text-primary bg-card-surface">
            <tr>
              <td className="px-6 py-3">TOTAL</td>
              <td className="px-6 py-3 text-right">{formatNumber(total.faturamento, { style: 'currency' })}</td>
              <td className="px-6 py-3 text-right">{formatNumber(total.custo, { style: 'currency' })}</td>
              <td className="px-6 py-3 text-right">--</td>
              <td className="px-6 py-3 text-right">100.00%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}