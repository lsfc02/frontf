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

interface Abastecimento { 
  produto: string; 
  valor: number | string;
  situacao: string;
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


async function fetchBaseAbastecimentos(startDate: string, endDate: string): Promise<ApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado.");
  const params = new URLSearchParams({ ini: startDate, fim: endDate, top: '20000' });
  const url = `${import.meta.env.VITE_API_BASE_URL}/fueltec/abastecimentos?${params.toString()}`;
  const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!response.ok) return { abastecimentos: [] };
  return response.json();
}

async function fetchEtanolCorrigido(startDate: string, endDate: string): Promise<ApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado.");
  const params = new URLSearchParams({ data_inicio: startDate, data_fim: endDate });
  const url = `${import.meta.env.VITE_API_BASE_URL}/etanol/vendas?${params.toString()}`;
  const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!response.ok) throw new Error('Falha ao buscar vendas de Etanol.');
  return response.json();
}

async function fetchLojaVendas(startDate: string, endDate: string): Promise<ApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado.");
  const params = new URLSearchParams({ data_inicio: startDate, data_fim: endDate });
  const url = `${import.meta.env.VITE_API_BASE_URL}/loja/vendas?${params.toString()}`;
  const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!response.ok) throw new Error('Falha ao buscar vendas da loja.');
  return response.json();
}

async function fetchRankingColaboradores(startDate: string, endDate: string): Promise<RankingItemApi[]> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado.");
  const params = new URLSearchParams({ data_inicio: startDate, data_fim: endDate });
  const url = `${import.meta.env.VITE_API_BASE_URL}/ranking/colaboradores?${params.toString()}`;
  const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!response.ok) throw new Error('Falha ao buscar o ranking de colaboradores.');
  return response.json();
}

const palavrasChaveLoja = ["ADITIVO", "ARLA", "MASTER", "FLUIDO", "HAVOLINE", "IPIRANGA", "PALHETA", "LUBRIFICANTE"];
const palavrasChaveDiversos = ["PALHETA"];

const mapearProdutoParaCategoria = (nomeProduto: string): string => {
    if (!nomeProduto) return "OUTROS";
    const nomeUpper = nomeProduto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    if (nomeUpper.includes("DIESEL")) return "DIESEL S-10";
    if (nomeUpper.includes("ETANOL")) return "ETANOL COMUM";
    if (nomeUpper.includes("GASOLINA DT CLEAN")) return "GASOLINA DT CLEAN";
    if (nomeUpper.includes("GASOLINA")) return "GASOLINA COMUM";
    if (palavrasChaveLoja.some(palavra => nomeUpper.includes(palavra) && !palavrasChaveDiversos.some(p => nomeUpper.includes(p)))) {
        return "LUBRIFICANTES E ADITIVOS";
    }
    if (palavrasChaveDiversos.some(palavra => nomeUpper.includes(palavra))) {
        return "DIVERSOS";
    }
    return "OUTROS";
};

export function PostoTab({ startDate, endDate }: DateProps) {
  const { toast } = useToast();
  const today = new Date();
  
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

  const { data: baseData, isLoading: isLoadingBase } = useQuery({
    queryKey: ['baseAbastecimentos', startDate, endDate],
    queryFn: () => fetchBaseAbastecimentos(startDate, endDate),
  });
  
  const { data: etanolData, isLoading: isLoadingEtanol } = useQuery({
    queryKey: ['etanolCorrigido', startDate, endDate],
    queryFn: () => fetchEtanolCorrigido(startDate, endDate),
  });

  const { data: lojaData, isLoading: isLoadingLoja } = useQuery({
    queryKey: ['lojaVendas', startDate, endDate],
    queryFn: () => fetchLojaVendas(startDate, endDate),
  });

  const { data: rankingApiData, isLoading: isLoadingRanking, isError, error } = useQuery({
    queryKey: ['rankingColaboradores', startDate, endDate],
    queryFn: () => fetchRankingColaboradores(startDate, endDate),
  });

  const isLoading = isLoadingBase || isLoadingEtanol || isLoadingLoja || isLoadingRanking;

  const processedData = useMemo(() => {
    const baseAbastecimentos = baseData?.abastecimentos || [];
    const etanolCorrigido = etanolData?.abastecimentos || [];
    const lojaCorrigida = lojaData?.abastecimentos || [];

    const combustiveisFiltrados = baseAbastecimentos.filter(ab => {
        if (!ab.produto) return false;
        const nomeUpper = ab.produto.toUpperCase();
        const isEtanol = nomeUpper.includes('ETANOL');
        const isLoja = [...palavrasChaveLoja, ...palavrasChaveDiversos].some(p => nomeUpper.includes(p));
        return !isEtanol && !isLoja;
    });

    const todosOsAbastecimentosBrutos = [
        ...combustiveisFiltrados,
        ...etanolCorrigido,
        ...lojaCorrigida
    ];

    const todosOsAbastecimentos = todosOsAbastecimentosBrutos.map(ab => ({
      ...ab,
      valor: Number(ab.valor) || 0,
      litragem: Number(ab.litragem) || 0,
    }));

    devLog("DADOS PARA KPIs E RESUMO:", todosOsAbastecimentos);

    if (todosOsAbastecimentos.length === 0 && !isLoading) {
        return { kpis: { abastecimentos: 0, litragem: 0, faturamento: 0, ticketMedioReal: 0 }, rankingData: [], performanceResumoData: [], chartData: [] };
    }

    const faturamentoTotal = todosOsAbastecimentos.reduce((acc, item) => acc + item.valor, 0);
    const litragemTotal = todosOsAbastecimentos.reduce((acc, item) => acc + item.litragem, 0);
    const totalAbastecimentos = todosOsAbastecimentos.length;
    const ticketMedioReal = totalAbastecimentos > 0 ? faturamentoTotal / totalAbastecimentos : 0;
    
    const faturamentoPorCategoria = todosOsAbastecimentos.reduce((acc, item) => {
      const categoria = mapearProdutoParaCategoria(item.produto || 'OUTROS');
      if (!acc[categoria]) acc[categoria] = 0;
      acc[categoria] += item.valor;
      return acc;
    }, {} as Record<string, number>);

    const end = new Date(endDate);
    const diasCorridos = end.getDate();
    const diasNoMes = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    
    let performanceResumoData = metasPosto.map(meta => {
      const realizado = faturamentoPorCategoria[meta.periodo] || 0;
      const tendencia = (new Date(startDate).getMonth() === today.getMonth()) ? (realizado / diasCorridos) * diasNoMes : realizado;
      const desempenho = meta.meta > 0 ? (realizado / meta.meta - 1) * 100 : 0;
      const faltante = Math.max(0, meta.meta - realizado);
      return { categoria: meta.periodo, metaMensal: meta.meta, realizado, tendencia, desempenho, faltante };
    });

    Object.entries(faturamentoPorCategoria).forEach(([categoria, realizado]) => {
      if (!performanceResumoData.some(p => p.categoria === categoria)) {
          performanceResumoData.push({ categoria, metaMensal: 0, realizado, tendencia: (new Date(startDate).getMonth() === today.getMonth()) ? (realizado / diasCorridos) * diasNoMes : realizado, desempenho: 0, faltante: 0 });
      }
    });

    performanceResumoData = performanceResumoData.filter(item => item.metaMensal > 0 || item.realizado > 0);
    
    const rankingData = (rankingApiData || []).map((item, index) => ({
      position: index + 1,
      name: item.Vendedor.toUpperCase(),
      value: formatNumber(item.Valor, { style: 'currency' }),
      subValue: `${formatNumber(item.Litragem, { maximumFractionDigits: 2 })} L`,
      growth: 0
    }));

    devLog("DADOS DO RANKING (DA API):", rankingData);

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({ name: `${i.toString().padStart(2, '0')}:00`, litros: 0, valor: 0 }));
    todosOsAbastecimentos.forEach(item => {
      if (item.dhRegistro) {
        const hour = new Date(item.dhRegistro).getHours();
        if (hourlyData[hour]) {
          hourlyData[hour].litros += item.litragem;
          hourlyData[hour].valor += item.valor;
        }
      }
    });

    return { kpis: { abastecimentos: totalAbastecimentos, litragem: litragemTotal, faturamento: faturamentoTotal, ticketMedioReal }, rankingData, performanceResumoData, chartData: hourlyData.filter(h => h.litros > 0 || h.valor > 0) };
  }, [baseData, etanolData, lojaData, rankingApiData, startDate, endDate, metasPosto, today]);

  const csvData = useMemo(() => {
    return [];
  }, [processedData]);
  
  const handleAddMeta = () => { setEditingMeta(null); setIsEditFormOpen(true); };
  const handleEditMeta = (item: PerformanceData) => {
    const existingMeta = metasPosto.find(m => m.periodo === item.categoria) 
      || { periodo: item.categoria, meta: 0, realizado: item.realizado, percentual: 0};
    setEditingMeta(existingMeta);
    setIsEditFormOpen(true);
  };
  const handleSaveMeta = (savedMeta: Meta) => {
    const isExisting = metasPosto.some(m => m.periodo === savedMeta.periodo);
    setMetasPosto(prevMetas => isExisting 
      ? prevMetas.map(m => m.periodo === savedMeta.periodo ? savedMeta : m) 
      : [...prevMetas, savedMeta]);
    toast({ title: isExisting ? "Meta atualizada!" : "Nova meta criada!" });
  };
  
  if (isLoading) return <div className="p-8 text-xl text-white">Carregando dados do posto...</div>;
  if (isError) return <div className="p-8 text-xl text-red-500">Erro: {(error as Error)?.message || 'Ocorreu um erro desconhecido.'}</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Posto de Combustíveis</h1>
          <p className="text-text-secondary mt-1">Acompanhe as métricas e performance do posto</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <CSVLink data={csvData} filename={`relatorio_posto_${startDate}_a_${endDate}.csv`}>
            <Button variant="outline" className="gap-2 w-full md:w-auto"><Download className="w-4 h-4" />Exportar CSV</Button>
          </CSVLink>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Abastecimentos" value={processedData.kpis?.abastecimentos || 0} color="cyan" icon={<Car />} subtitle="Total no período" />
        <KPICard title="Litragem Total" value={processedData.kpis?.litragem || 0} format="decimal" unit="L" color="purple" icon={<Fuel />} subtitle="Combustível vendido" />
        <KPICard title="Faturamento" value={processedData.kpis?.faturamento || 0} format="currency" color="green" icon={<DollarSign />} subtitle="Receita total" />
        <KPICard title="Ticket Médio" value={processedData.kpis?.ticketMedioReal || 0} format="currency" color="orange" icon={<Users />} subtitle="Por abastecimento" />
      </div>

      <PerformanceResumo
        titulo="Resumo de Faturamento por Categoria"
        data={processedData.performanceResumoData}
        onAddMeta={handleAddMeta}
        onEditMeta={handleEditMeta}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart title="Tendência - Litros" data={processedData.chartData} lines={[{ dataKey: "litros", color: "hsl(var(--kpi-purple))", name: "Litros" }]} />
        <TrendChart title="Tendência - Faturamento" data={processedData.chartData} lines={[{ dataKey: "valor", color: "hsl(var(--kpi-green))", name: "Valor (R$)" }]} />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="lg:col-span-2">
           <RankingTable title="Ranking de Colaboradores" subtitle="Por faturamento total" data={processedData.rankingData} />
        </div>
      </div>

      <MetaEditForm 
        isOpen={isEditFormOpen} 
        onClose={() => setIsEditFormOpen(false)}
        onSave={handleSaveMeta}
        editingMeta={editingMeta}
      />
    </div>
  );
}
