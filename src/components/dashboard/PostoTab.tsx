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

interface Venda { 
  produto: string; 
  departamento: string;
  valor: number | string;
  situacao: string;
  nomeFuncionario: string | null;
  nomeVendedor: string | null;
  dhRegistro: string; 
  data: string;
  hora: string;
  litragem: number | string;
  valorUnitario: number | string;
  idVenda: number;
  idProduto: number;
}

interface ApiResponse { 
  abastecimentos: Venda[];
}

interface RankingItemApi {
  Vendedor: string;
  Abastecimentos: number;
  Litragem: number;
  Valor: number;
}

interface Meta { 
  periodo: string; 
  meta: number; 
  realizado: number; 
  percentual: number; 
}

interface DateProps { 
  startDate: string; 
  endDate: string; 
}

// ✅ FUNÇÃO DE MAPEAMENTO - IGUAL AO SCRIPT PYTHON
const mapearDepartamento = (dept: string): string => {
  if (!dept) return "OUTROS";
  const deptUpper = dept.trim().toUpperCase();
  
  if (deptUpper.includes("COMBUSTI") || deptUpper === "COMBUSTÍVEIS") {
    return "COMBUSTÍVEIS";
  }
  if (deptUpper.includes("LUBRIFICANTE")) {
    return "LUBRIFICANTES";
  }
  if (deptUpper.includes("ADITIVO")) {
    return "ADITIVOS";
  }
  if (deptUpper.includes("DIVERSOS") || deptUpper.includes("DIVERSO")) {
    return "DIVERSOS";
  }
  
  return "OUTROS";
};

// ✅ CATEGORIZAÇÃO POR PRODUTO - CORRIGIDO PARA JUNTAR LUBRIFICANTES E ADITIVOS
const categorizarProduto = (produto: string, departamento: string): string => {
  if (!produto) return "OUTROS";
  
  const dept = mapearDepartamento(departamento);
  
  // Se for COMBUSTÍVEL, separa por tipo de produto
  if (dept === "COMBUSTÍVEIS") {
    const prodUpper = produto.trim().toUpperCase();
    
    if (prodUpper.includes("ETANOL")) return "ETANOL COMUM";
    if (prodUpper.includes("DIESEL")) return "DIESEL S-10";
    if (prodUpper.includes("DT CLEAN") || prodUpper.includes("DTCLEAN")) return "GASOLINA DT CLEAN";
    if (prodUpper.includes("GASOLINA")) return "GASOLINA COMUM";
  }
  
  // ✅ JUNTA LUBRIFICANTES E ADITIVOS EM UMA SÓ CATEGORIA
  if (dept === "LUBRIFICANTES" || dept === "ADITIVOS") {
    return "LUBRIFICANTES E ADITIVOS";
  }
  
  // Para outros departamentos, usa o departamento como categoria
  return dept;
};

async function fetchVendas(startDate: string, endDate: string): Promise<ApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado.");
  
  const params = new URLSearchParams({ 
    ini: startDate, 
    fim: endDate, 
    top: '20000' 
  });
  
  const url = `${import.meta.env.VITE_API_BASE_URL}/fueltec/vendas?${params.toString()}`;
  
  const response = await fetch(url, { 
    headers: { 'Authorization': `Bearer ${token}` } 
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar vendas: ${response.status}`);
  }
  
  return response.json();
}

async function fetchRankingColaboradores(startDate: string, endDate: string): Promise<RankingItemApi[]> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado.");
  
  const params = new URLSearchParams({ 
    data_inicio: startDate, 
    data_fim: endDate 
  });
  
  const url = `${import.meta.env.VITE_API_BASE_URL}/ranking/colaboradores?${params.toString()}`;
  
  const response = await fetch(url, { 
    headers: { 'Authorization': `Bearer ${token}` } 
  });
  
  if (!response.ok) throw new Error('Falha ao buscar o ranking de colaboradores.');
  
  return response.json();
}

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

  const { data: vendasData, isLoading: isLoadingVendas, isError, error } = useQuery({
    queryKey: ['vendas', startDate, endDate],
    queryFn: () => fetchVendas(startDate, endDate),
    refetchInterval: 60000,
  });
  
  const { data: rankingApiData, isLoading: isLoadingRanking } = useQuery({
    queryKey: ['rankingColaboradores', startDate, endDate],
    queryFn: () => fetchRankingColaboradores(startDate, endDate),
    refetchInterval: 60000,
  });

  const isLoading = isLoadingVendas || isLoadingRanking;

  const processedData = useMemo(() => {
    const vendas = vendasData?.abastecimentos || [];

    const vendasProcessadas = vendas.map(v => ({
      ...v,
      valor: Number(v.valor) || 0,
      litragem: Number(v.litragem) || 0,
      valorUnitario: Number(v.valorUnitario) || 0,
    }));

    devLog("DADOS DE VENDAS PROCESSADOS:", vendasProcessadas);

    if (vendasProcessadas.length === 0 && !isLoading) {
      return { 
        kpis: { abastecimentos: 0, litragem: 0, faturamento: 0, ticketMedioReal: 0 }, 
        rankingData: [], 
        performanceResumoData: [], 
        chartData: [] 
      };
    }

    // ✅ AGRUPAMENTO - Agora junta LUBRIFICANTES E ADITIVOS
    const faturamentoPorCategoria = vendasProcessadas.reduce((acc, item) => {
      const categoria = categorizarProduto(item.produto || '', item.departamento || '');
      if (!acc[categoria]) acc[categoria] = 0;
      acc[categoria] += item.valor;
      return acc;
    }, {} as Record<string, number>);

    const litragemPorCategoria = vendasProcessadas.reduce((acc, item) => {
      const categoria = categorizarProduto(item.produto || '', item.departamento || '');
      if (!acc[categoria]) acc[categoria] = 0;
      acc[categoria] += item.litragem;
      return acc;
    }, {} as Record<string, number>);

    console.log("💰 FATURAMENTO POR CATEGORIA:", faturamentoPorCategoria);
    console.log("⛽ LITRAGEM POR CATEGORIA:", litragemPorCategoria);

    // Cálculo de KPIs
    const faturamentoTotal = vendasProcessadas.reduce((acc, item) => acc + item.valor, 0);
    const litragemTotal = vendasProcessadas.reduce((acc, item) => acc + item.litragem, 0);
    const totalVendas = vendasProcessadas.length;
    const ticketMedioReal = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;

    // Cálculo de tendência e desempenho
    const end = new Date(endDate);
    const diasCorridos = end.getDate();
    const diasNoMes = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    
    let performanceResumoData = metasPosto.map(meta => {
      const realizado = faturamentoPorCategoria[meta.periodo] || 0;
      const litragem = litragemPorCategoria[meta.periodo] || 0;
      const tendencia = (new Date(startDate).getMonth() === today.getMonth()) 
        ? (realizado / diasCorridos) * diasNoMes 
        : realizado;
      const desempenho = meta.meta > 0 ? (realizado / meta.meta - 1) * 100 : 0;
      const faltante = Math.max(0, meta.meta - realizado);
      
      return { 
        categoria: meta.periodo, 
        metaMensal: meta.meta, 
        realizado, 
        litragem, 
        tendencia, 
        desempenho, 
        faltante 
      };
    });

    // Adiciona categorias sem meta mas com vendas
    Object.entries(faturamentoPorCategoria).forEach(([categoria, realizado]) => {
      if (!performanceResumoData.some(p => p.categoria === categoria)) {
        const litragem = litragemPorCategoria[categoria] || 0;
        performanceResumoData.push({ 
          categoria, 
          metaMensal: 0, 
          realizado, 
          litragem, 
          tendencia: (new Date(startDate).getMonth() === today.getMonth()) 
            ? (realizado / diasCorridos) * diasNoMes 
            : realizado, 
          desempenho: 0, 
          faltante: 0 
        });
      }
    });

    // Filtra apenas categorias com dados
    performanceResumoData = performanceResumoData.filter(item => 
      item.metaMensal > 0 || item.realizado > 0
    );
    
    // Ranking de colaboradores
    const rankingData = (rankingApiData || []).map((item, index) => ({
      position: index + 1,
      name: item.Vendedor.toUpperCase(),
      value: formatNumber(item.Valor, { style: 'currency' }),
      subValue: `${formatNumber(item.Litragem, { maximumFractionDigits: 2 })} L`,
      growth: 0
    }));

    // Dados para gráfico de tendência por hora
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({ 
      name: `${i.toString().padStart(2, '0')}:00`, 
      litros: 0, 
      valor: 0 
    }));
    
    vendasProcessadas.forEach(item => {
      if (item.dhRegistro || item.data) {
        const dateStr = item.dhRegistro || item.data;
        const hour = new Date(dateStr).getHours();
        if (hourlyData[hour]) {
          hourlyData[hour].litros += item.litragem;
          hourlyData[hour].valor += item.valor;
        }
      }
    });

    return { 
      kpis: { 
        abastecimentos: totalVendas, 
        litragem: litragemTotal, 
        faturamento: faturamentoTotal, 
        ticketMedioReal 
      }, 
      rankingData, 
      performanceResumoData, 
      chartData: hourlyData.filter(h => h.litros > 0 || h.valor > 0) 
    };
  }, [vendasData, rankingApiData, startDate, endDate, metasPosto, today, isLoading]);

  // Dados para exportação CSV
  const csvData = useMemo(() => {
    const vendas = vendasData?.abastecimentos || [];
    
    const vendasProcessadas = vendas.map(v => ({
      ...v,
      valor: Number(v.valor) || 0,
      litragem: Number(v.litragem) || 0,
    }));

    if (vendasProcessadas.length === 0) return [[]];
  
    const headers = [
      "Data", 
      "Hora", 
      "Produto", 
      "Departamento",
      "Categoria",
      "Litragem", 
      "Valor", 
      "Valor Unitário",
      "Funcionário",
      "Vendedor",
      "Status"
    ];
    
    const dataRows = vendasProcessadas.map(v => [
      v.data || (v.dhRegistro ? new Date(v.dhRegistro).toLocaleDateString('pt-BR') : 'N/A'),
      v.hora || (v.dhRegistro ? new Date(v.dhRegistro).toLocaleTimeString('pt-BR') : 'N/A'),
      v.produto,
      v.departamento,
      categorizarProduto(v.produto, v.departamento),
      v.litragem,
      v.valor,
      v.valorUnitario,
      v.nomeFuncionario || "Não Identificado",
      v.nomeVendedor || "Não Identificado",
      v.situacao
    ]);
    
    return [headers, ...dataRows];
  }, [vendasData]);
  
  const handleAddMeta = () => { 
    setEditingMeta(null); 
    setIsEditFormOpen(true); 
  };
  
  const handleEditMeta = (item: PerformanceData) => {
    const existingMeta = metasPosto.find(m => m.periodo === item.categoria) 
      || { 
        periodo: item.categoria, 
        meta: 0, 
        realizado: item.realizado, 
        litragem: (item as any).litragem, 
        percentual: 0
      };
    setEditingMeta(existingMeta);
    setIsEditFormOpen(true);
  };
  
  const handleSaveMeta = (savedMeta: Meta) => {
    const isExisting = metasPosto.some(m => m.periodo === savedMeta.periodo);
    setMetasPosto(prevMetas => isExisting 
      ? prevMetas.map(m => m.periodo === savedMeta.periodo ? savedMeta : m) 
      : [...prevMetas, savedMeta]);
    toast({ 
      title: isExisting ? "Meta atualizada!" : "Nova meta criada!" 
    });
  };
  
  if (isLoading) {
    return (
      <div className="p-8 text-xl text-white">
        Carregando dados do posto...
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-8 text-xl text-red-500">
        Erro: {(error as Error)?.message || 'Ocorreu um erro desconhecido.'}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            Posto de Combustíveis
          </h1>
          <p className="text-text-secondary mt-1">
            Acompanhe as métricas e performance do posto
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <CSVLink 
            data={csvData} 
            filename={`relatorio_posto_${startDate}_a_${endDate}.csv`}
          >
            <Button variant="outline" className="gap-2 w-full md:w-auto">
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </CSVLink>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Vendas" 
          value={processedData.kpis?.abastecimentos || 0} 
          color="cyan" 
          icon={<Car />} 
          subtitle="Total no período" 
        />
        <KPICard 
          title="Litragem Total" 
          value={processedData.kpis?.litragem || 0} 
          format="decimal" 
          unit="L" 
          color="purple" 
          icon={<Fuel />} 
          subtitle="Combustível vendido" 
        />
        <KPICard 
          title="Faturamento" 
          value={processedData.kpis?.faturamento || 0} 
          format="currency" 
          color="green" 
          icon={<DollarSign />} 
          subtitle="Receita total" 
        />
        <KPICard 
          title="Ticket Médio" 
          value={processedData.kpis?.ticketMedioReal || 0} 
          format="currency" 
          color="orange" 
          icon={<Users />} 
          subtitle="Por venda" 
        />
      </div>

      <PerformanceResumo
        titulo="Resumo de Faturamento por Categoria"
        data={processedData.performanceResumoData}
        onAddMeta={handleAddMeta}
        onEditMeta={handleEditMeta}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart 
          title="Tendência - Litros" 
          data={processedData.chartData} 
          lines={[{ 
            dataKey: "litros", 
            color: "hsl(var(--kpi-purple))", 
            name: "Litros" 
          }]} 
        />
        <TrendChart 
          title="Tendência - Faturamento" 
          data={processedData.chartData} 
          lines={[{ 
            dataKey: "valor", 
            color: "hsl(var(--kpi-green))", 
            name: "Valor (R$)" 
          }]} 
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="lg:col-span-2">
          <RankingTable 
            title="Ranking de Colaboradores" 
            subtitle="Por faturamento total" 
            data={processedData.rankingData} 
          />
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
