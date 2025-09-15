import { KPICard } from "./KPICard";
import { TrendChart } from "./TrendChart";
import { RankingTable } from "./RankingTable";
import { MetasTable } from "./MetasTable";
import { Fuel, Car, DollarSign, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data - em produção viria da API
const mockData = {
  kpis: {
    abastecimentos: { value: 1247, change: 12.5 },
    litragem: { value: "34.567L", change: 8.3 },
    faturamento: { value: "R$ 189.432", change: 15.2 },
    ticketMedio: { value: "R$ 152", change: -2.1 },
  },
  chartData: [
    { name: "00:00", litros: 120, valor: 540 },
    { name: "04:00", litros: 89, valor: 401 },
    { name: "08:00", litros: 235, valor: 1058 },
    { name: "12:00", litros: 432, valor: 1944 },
    { name: "16:00", litros: 398, valor: 1791 },
    { name: "20:00", litros: 312, valor: 1404 },
  ],
  ranking: [
    { position: 1, name: "João Silva", value: "R$ 23.456", growth: 18.5 },
    { position: 2, name: "Maria Santos", value: "R$ 21.234", growth: 12.3 },
    { position: 3, name: "Carlos Oliveira", value: "R$ 19.876", growth: 9.1 },
    { position: 4, name: "Ana Costa", value: "R$ 18.456", growth: 7.8 },
  ],
  metas: [
    { periodo: "Janeiro", meta: 180000, realizado: 189432, percentual: 105.2 },
    { periodo: "Fevereiro", meta: 175000, realizado: 168743, percentual: 96.4 },
    { periodo: "Hoje", meta: 8500, realizado: 6743, percentual: 79.3 },
  ]
};

export function PostoTab() {
  const handleExportCSV = () => {
    // Implementar exportação CSV
    console.log("Exportando dados do posto para CSV...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Posto de Combustíveis</h1>
          <p className="text-text-secondary mt-1">Acompanhe as métricas e performance do posto</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Abastecimentos"
          value={mockData.kpis.abastecimentos.value}
          change={mockData.kpis.abastecimentos.change}
          color="cyan"
          icon={<Car className="w-5 h-5 text-kpi-cyan" />}
          subtitle="Total do dia"
        />
        <KPICard
          title="Litragem Total"
          value={mockData.kpis.litragem.value}
          change={mockData.kpis.litragem.change}
          color="purple"
          icon={<Fuel className="w-5 h-5 text-kpi-purple" />}
          subtitle="Combustível vendido"
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
          icon={<Users className="w-5 h-5 text-kpi-orange" />}
          subtitle="Por abastecimento"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart
          title="Tendência Diária - Litros"
          data={mockData.chartData}
          lines={[
            { dataKey: "litros", color: "hsl(var(--kpi-purple))", name: "Litros" }
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
          title="Ranking de Colaboradores"
          subtitle="Por faturamento total"
          data={mockData.ranking}
        />
        <MetasTable
          title="Metas vs Realizado"
          data={mockData.metas}
        />
      </div>
    </div>
  );
}