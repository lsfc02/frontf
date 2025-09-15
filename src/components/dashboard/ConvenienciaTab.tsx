import { useState } from "react";
import { KPICard } from "./KPICard";
import { TrendChart } from "./TrendChart";
import { RankingTable } from "./RankingTable";
import { MetasTable } from "./MetasTable";
import { ShoppingCart, Package, DollarSign, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data - em produção viria da API
const mockData = {
  kpis: {
    vendas: { value: 892, change: 9.7 },
    produtos: { value: "2.134", change: 5.2 },
    faturamento: { value: "R$ 42.567", change: 11.8 },
    ticketMedio: { value: "R$ 47", change: 2.3 },
  },
  chartData: [
    { name: "00:00", vendas: 45, valor: 2130 },
    { name: "04:00", vendas: 23, valor: 1080 },
    { name: "08:00", vendas: 78, valor: 3660 },
    { name: "12:00", vendas: 156, valor: 7320 },
    { name: "16:00", vendas: 134, valor: 6290 },
    { name: "20:00", vendas: 89, valor: 4180 },
  ],
  ranking: [
    { position: 1, name: "Pedro Alves", value: "R$ 8.765", growth: 22.1 },
    { position: 2, name: "Julia Mendes", value: "R$ 7.892", growth: 16.7 },
    { position: 3, name: "Roberto Lima", value: "R$ 6.534", growth: 13.4 },
    { position: 4, name: "Carla Ferreira", value: "R$ 5.987", growth: 10.2 },
  ],
  initialMetas: [
    { periodo: "Janeiro", meta: 45000, realizado: 42567, percentual: 94.6 },
    { periodo: "Fevereiro", meta: 48000, realizado: 51230, percentual: 106.7 },
    { periodo: "Hoje", meta: 2500, realizado: 1873, percentual: 74.9 },
  ]
};

export function ConvenienciaTab() {
  const [metas, setMetas] = useState(mockData.initialMetas);

  const handleExportCSV = () => {
    // Implementar exportação CSV
    console.log("Exportando dados da conveniência para CSV...");
  };

  const handleMetasChange = (newMetas: typeof metas) => {
    setMetas(newMetas);
    // Aqui poderia sincronizar com o backend
    console.log("Metas atualizadas:", newMetas);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Conveniência</h1>
          <p className="text-text-secondary mt-1">Acompanhe as vendas e performance da loja</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Vendas"
          value={mockData.kpis.vendas.value}
          change={mockData.kpis.vendas.change}
          color="pink"
          icon={<ShoppingCart className="w-5 h-5 text-kpi-pink" />}
          subtitle="Transações do dia"
        />
        <KPICard
          title="Produtos Vendidos"
          value={mockData.kpis.produtos.value}
          change={mockData.kpis.produtos.change}
          color="blue"
          icon={<Package className="w-5 h-5 text-kpi-blue" />}
          subtitle="Unidades totais"
        />
        <KPICard
          title="Faturamento"
          value={mockData.kpis.faturamento.value}
          change={mockData.kpis.faturamento.change}
          color="green"
          icon={<DollarSign className="w-5 h-5 text-kpi-green" />}
          subtitle="Receita total"
        />
        <KPICard
          title="Ticket Médio"
          value={mockData.kpis.ticketMedio.value}
          change={mockData.kpis.ticketMedio.change}
          color="orange"
          icon={<TrendingUp className="w-5 h-5 text-kpi-orange" />}
          subtitle="Por transação"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart
          title="Tendência Diária - Vendas"
          data={mockData.chartData}
          lines={[
            { dataKey: "vendas", color: "hsl(var(--kpi-pink))", name: "Vendas" }
          ]}
        />
        <TrendChart
          title="Tendência Diária - Faturamento"
          data={mockData.chartData}
          lines={[
            { dataKey: "valor", color: "hsl(var(--kpi-green))", name: "Valor (R$)" }
          ]}
        />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingTable
          title="Ranking de Vendedores"
          subtitle="Por faturamento total"
          data={mockData.ranking}
        />
        <MetasTable
          title="Metas vs Realizado"
          data={metas}
          onDataChange={handleMetasChange}
        />
      </div>
    </div>
  );
}