import { useState, useMemo, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { KPICard } from "./KPICard";
import { TrendChart } from "./TrendChart";
import { RankingTable } from "./RankingTable";
import { MetaEditForm } from "./MetaEditForm";
import { PerformanceResumo, PerformanceData } from "./PerfomanceResumo";
import { Fuel, Car, DollarSign, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/utils";
import { CSVLink } from "react-csv";
import { devLog } from "@/lib/logger";

// =====================================================
// TIPOS
// =====================================================
interface Abastecimento { 
  produto: string; 
  valor: number | string;
  situacao: string | number;
  nomeFuncionario: string | null;
  dhRegistro: string; 
  litragem: number | string; 
}
interface ApiResponse { abastecimentos: Abastecimento[]; }

interface RankingItemApi {
  Vendedor: string;
  Abastecimentos: number;
  Litragem: number;
  Valor: number;
}

interface Meta { periodo: string; meta: number; realizado: number; percentual: number; }
interface DateProps { startDate: string; endDate: string; }


// =====================================================
// FUNÇÃO PRINCIPAL — APENAS /fueltec/vendas
// =====================================================
async function fetchVendasFueltec(startDate: string, endDate: string): Promise<ApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado.");

  const params = new URLSearchParams({
    ini: startDate,
    fim: endDate
  });

  const url = `${import.meta.env.VITE_API_BASE_URL}/fueltec/vendas?${params.toString()}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) return { abastecimentos: [] };
  return response.json();
}


// =====================================================
// RANKING (permanece igual)
// =====================================================
async function fetchRankingColaboradores(startDate: string, endDate: string): Promise<RankingItemApi[]> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado.");

  const params = new URLSearchParams({ data_inicio: startDate, data_fim: endDate });

  const url = `${import.meta.env.VITE_API_BASE_URL}/ranking/colaboradores?${params.toString()}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Falha ao buscar ranking de colaboradores.');
  return response.json();
}


// =====================================================
// CATEGORIZAÇÃO
// =====================================================
const palavrasChaveLoja = ["ADITIVO", "ARLA", "MASTER", "FLUIDO", "HAVOLINE", "IPIRANGA", "LUBRIFICANTE"];
const palavrasChaveDiversos = ["PALHETA"];

const mapearProdutoParaCategoria = (nomeProduto: string): string => {
  if (!nomeProduto) return "OUTROS";
  const nomeUpper = nomeProduto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

  if (nomeUpper.includes("DIESEL")) return "DIESEL S-10";
  if (nomeUpper.includes("ETANOL")) return "ETANOL COMUM";
  if (nomeUpper.includes("GASOLINA DT CLEAN") || nomeUpper.includes("CLEAN")) return "GASOLINA DT CLEAN";
  if (nomeUpper.includes("GASOLINA")) return "GASOLINA COMUM";

  if (palavrasChaveLoja.some(palavra => nomeUpper.includes(palavra)) &&
      !palavrasChaveDiversos.some(p => nomeUpper.includes(p))) {
    return "LUBRIFICANTES E ADITIVOS";
  }

  if (palavrasChaveDiversos.some(palavra => nomeUpper.includes(palavra))) {
    return "DIVERSOS";
  }

  return "OUTROS";
};


// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================
export function PostoTab({ startDate, endDate }: DateProps) {
  const { toast } = useToast();
  const today = new Date();

  // METAS
  const [metasPosto, setMetasPosto] = useState<Meta[]>(() => {
    const saved = localStorage.getItem('postoMetas');
    return saved ? JSON.parse(saved) : [
      { periodo: "DIESEL S-10", meta: 9078, realizado: 0, percentual: 0 },
      { periodo: "ETANOL COMUM", meta: 78650, realizado: 0, percentual: 0 },
      { periodo: "GASOLINA COMUM", meta: 46980, realizado: 0, percentual: 0 },
      { periodo: "GASOLINA DT CLEAN", meta: 60000, realizado: 0, percentual: 0 },
      { periodo: "LUBRIFICANTES E ADITIVOS", meta: 3828, realizado: 0, percentual: 0 },
      { periodo: "DIVERSOS", meta: 130, realizado: 0, percentual: 0 },
    ];
  });

  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);

  useEffect(() => {
    localStorage.setItem('postoMetas', JSON.stringify(metasPosto));
  }, [metasPosto]);

  // =====================================================
  // CONSULTAS
  // =====================================================
  const { data: vendasData, isLoading: isLoadingVendas } = useQuery({
    queryKey: ['fueltecVendas', startDate, endDate],
    queryFn: () => fetchVendasFueltec(startDate, endDate),
  });

  const { data: rankingApiData, isLoading: isLoadingRanking } = useQuery({
    queryKey: ['rankingColaboradores', startDate, endDate],
    queryFn: () => fetchRankingColaboradores(startDate, endDate),
  });

  const isLoading = isLoadingVendas || isLoadingRanking;


  // =====================================================
  // PROCESSAMENTO
  // =====================================================
  const processedData = useMemo(() => {
    const dados = (vendasData?.abastecimentos || []).map(v => ({
      ...v,
      valor: Number(v.valor) || 0,
      litragem: Number(v.litragem) || 0,
    }));

    devLog("DADOS / VENDAS:", dados);

    if (!dados.length) {
      return {
        kpis: { abastecimentos: 0, litragem: 0, faturamento: 0, ticketMedioReal: 0 },
        rankingData: [],
        performanceResumoData: [],
        chartData: []
      };
    }

    const faturamentoTotal = dados.reduce((a, b) => a + b.valor, 0);
    const litragemTotal = dados.reduce((a, b) => a + b.litragem, 0);
    const totalAbastecimentos = dados.length;

    const ticketMedioReal =
      totalAbastecimentos > 0 ? faturamentoTotal / totalAbastecimentos : 0;


    // ======================
    // CATEGORIAS
    // ======================
    const faturamentoPorCategoria: Record<string, number> = {};
    const litragemPorCategoria: Record<string, number> = {};

    dados.forEach(item => {
      const categoria = mapearProdutoParaCategoria(item.produto);
      faturamentoPorCategoria[categoria] =
        (faturamentoPorCategoria[categoria] || 0) + item.valor;

      litragemPorCategoria[categoria] =
        (litragemPorCategoria[categoria] || 0) + item.litragem;
    });


    // ======================
    // RESUMO
    // ======================
    const end = new Date(endDate);
    const diasCorridos = end.getDate();
    const diasNoMes = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();

    let performanceResumoData = metasPosto.map(meta => {
      const realizado = faturamentoPorCategoria[meta.periodo] || 0;

      const tendencia =
        new Date(startDate).getMonth() === today.getMonth()
          ? (realizado / diasCorridos) * diasNoMes
          : realizado;

      const desempenho =
        meta.meta > 0 ? (realizado / meta.meta - 1) * 100 : 0;

      const faltante = Math.max(0, meta.meta - realizado);

      return {
        categoria: meta.periodo,
        metaMensal: meta.meta,
        realizado,
        tendencia,
        desempenho,
        faltante,
        litragem: litragemPorCategoria[meta.periodo] || 0
      };
    });


    // ======================
    // RANKING
    // ======================
    const rankingData = (rankingApiData || []).map((item, index) => ({
      position: index + 1,
      name: item.Vendedor.toUpperCase(),
      value: formatNumber(item.Valor, { style: 'currency' }),
      subValue: `${formatNumber(item.Litragem, { maximumFractionDigits: 2 })} L`,
      growth: 0
    }));


    // ======================
    // HORA A HORA
    // ======================
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      name: `${i.toString().padStart(2, '0')}:00`,
      litros: 0,
      valor: 0
    }));

    dados.forEach(item => {
      if (item.dhRegistro) {
        const hour = new Date(item.dhRegistro).getHours();
        hourlyData[hour].litros += item.litragem;
        hourlyData[hour].valor += item.valor;
      }
    });

    return {
      kpis: { abastecimentos: totalAbastecimentos, litragem: litragemTotal, faturamento: faturamentoTotal, ticketMedioReal },
      rankingData,
      performanceResumoData,
      chartData: hourlyData.filter(h => h.litros > 0 || h.valor > 0)
    };
  }, [vendasData, rankingApiData, startDate, endDate, metasPosto]);


  // =====================================================
  // CSV — opcional
  // =====================================================
  const csvData = useMemo(() => {
    const dados = vendasData?.abastecimentos || [];
    if (!dados.length) return [[]];

    const rows = dados.map(v => [
      v.dhRegistro ? new Date(v.dhRegistro).toLocaleDateString("pt-BR") : "N/A",
      v.dhRegistro ? new Date(v.dhRegistro).toLocaleTimeString("pt-BR") : "N/A",
      v.produto,
      v.litragem,
      v.valor,
      v.nomeFuncionario || "Não Identificado",
      v.situacao
    ]);

    return [
      ["Data", "Hora", "Produto", "Litragem", "Valor", "Funcionário", "Situação"],
      ...rows
    ];
  }, [vendasData]);


  // =====================================================
  // RENDER
  // =====================================================
  if (isLoading)
    return <div className="p-8 text-xl text-white">Carregando dados do posto...</div>;

  return (
    <div className="p-8 space-y-6">

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Posto de Combustíveis</h1>
          <p className="text-text-secondary mt-1">Acompanhe as métricas e performance do posto</p>
        </div>

        <CSVLink data={csvData} filename={`relatorio_posto_${startDate}_a_${endDate}.csv`}>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </CSVLink>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Abastecimentos" value={processedData.kpis.abastecimentos} color="cyan" icon={<Car />} subtitle="Total no período" />
        <KPICard title="Litragem Total" value={processedData.kpis.litragem} format="decimal" unit="L" color="purple" icon={<Fuel />} subtitle="Combustível vendido" />
        <KPICard title="Faturamento" value={processedData.kpis.faturamento} format="currency" color="green" icon={<DollarSign />} subtitle="Receita total" />
        <KPICard title="Ticket Médio" value={processedData.kpis.ticketMedioReal} format="currency" color="orange" icon={<Users />} subtitle="Por abastecimento" />
      </div>

      {/* RESUMO */}
      <PerformanceResumo
        titulo="Resumo de Faturamento por Categoria"
        data={processedData.performanceResumoData}
        onAddMeta={() => { setIsEditFormOpen(true); setEditingMeta(null); }}
        onEditMeta={(item) => {
          const existing = metasPosto.find(m => m.periodo === item.categoria);
          setEditingMeta(existing || { periodo: item.categoria, meta: 0, realizado: item.realizado, percentual: 0 });
          setIsEditFormOpen(true);
        }}
      />

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart title="Tendência - Litros" data={processedData.chartData} 
          lines={[{ dataKey: "litros", color: "hsl(var(--kpi-purple))", name: "Litros" }]} />
        
        <TrendChart title="Tendência - Faturamento" data={processedData.chartData} 
          lines={[{ dataKey: "valor", color: "hsl(var(--kpi-green))", name: "Valor (R$)" }]} />
      </div>

      {/* RANKING */}
      <RankingTable title="Ranking de Colaboradores" subtitle="Por faturamento total" data={processedData.rankingData} />

      {/* MODAL */}
      <MetaEditForm 
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        onSave={(savedMeta: Meta) => {
          const exists = metasPosto.some(m => m.periodo === savedMeta.periodo);
          setMetasPosto(
            exists
              ? metasPosto.map(m => m.periodo === savedMeta.periodo ? savedMeta : m)
              : [...metasPosto, savedMeta]
          );
          toast({ title: exists ? "Meta atualizada!" : "Nova meta criada!" });
        }}
        editingMeta={editingMeta}
      />

    </div>
  );
}
