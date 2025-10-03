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


interface Abastecimento { 
  produto: string; 
  valor: number;
  situacao: string; 
  nomeFuncionario: string; 
  dhRegistro: string; 
  litragem: number; 
}

interface ApiResponse { abastecimentos: Abastecimento[]; }

interface Meta { periodo: string; meta: number; realizado: number; percentual: number; }

interface DateProps {
  startDate: string;
  endDate: string;
}

async function fetchAbastecimentos(startDate: string, endDate: string): Promise<ApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token de autenticação não encontrado.");
  
  const params = new URLSearchParams({ ini: startDate, fim: endDate, top: '10000' });

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const url = `${apiUrl}/fueltec/abastecimentos?${params.toString()}`;

  const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!response.ok) throw new Error('Falha ao buscar abastecimentos.');
  return response.json();
}

const mapearProdutoParaCategoria = (nomeProduto: string): string => {
    if (!nomeProduto) return "OUTROS";
    const nomeUpper = nomeProduto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

    if (nomeUpper.includes("DIESEL")) return "DIESEL S-10";
    if (nomeUpper.includes("ETANOL")) return "ETANOL COMUM";

    if (nomeUpper.includes("GASOLINA DT CLEAN")) return "GASOLINA DT CLEAN";
    if (nomeUpper.includes("GASOLINA")) return "GASOLINA COMUM";

    if (["ADITIVO", "FLUIDO", "ARLA", "MASTER", "IPIRANGA MOTO", "HAVOLINE", "ATF"]
        .some(k => nomeUpper.includes(k))) {
        return "LUBRIFICANTES E ADITIVOS";
    }
    if (nomeUpper.includes("PALHETA")) {
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

  const { data: apiData, isLoading, isError, error } = useQuery({
    queryKey: ['abastecimentos', startDate, endDate],
    queryFn: () => fetchAbastecimentos(startDate, endDate),
    refetchInterval: 60000,
  });

  const processedData = useMemo(() => {
    const abastecimentos = apiData?.abastecimentos;
    
    if (import.meta.env.DEV && abastecimentos) {
      console.groupCollapsed("[DEBUG] Análise de Vendas de Etanol");


      const vendasDeEtanol = abastecimentos.filter(ab => 
        ab.produto && ab.produto.toUpperCase().includes("ETANOL")
      );
      console.log(`Encontradas ${vendasDeEtanol.length} vendas que contêm "ETANOL":`, vendasDeEtanol);

      const etanolCancelado = vendasDeEtanol.filter(ab => 
        ab.situacao === 'CANCELADO' || ab.situacao === 'C'
      );
      
      if (etanolCancelado.length > 0) {
        console.warn(`‼️ Encontradas ${etanolCancelado.length} VENDA(S) DE ETANOL CANCELADA(S):`, etanolCancelado);
        
        const vendaSuspeita = etanolCancelado.find(ab => Math.abs(ab.valor - 43.81) < 0.01);
        if (vendaSuspeita) {
          console.error("🔥🔥🔥 ALVO ENCONTRADO! A venda de R$ 43,81 (ou valor próximo) está com status cancelado:", vendaSuspeita);
        }

      } else {
        console.log("✅ Nenhuma venda de Etanol com status 'CANCELADO' ou 'C' foi encontrada.");
      }

      console.groupEnd();
    }
    // FIM DO BLOCO DE LOG

    if (!abastecimentos) return { kpis: null, rankingData: [], performanceResumoData: [], chartData: [] };

    const faturamentoTotal = abastecimentos.reduce((acc, item) => acc + item.valor, 0);
    const litragemTotal = abastecimentos.reduce((acc, item) => acc + item.litragem, 0);
    const totalAbastecimentos = abastecimentos.length;
    const ticketMedioReal = totalAbastecimentos > 0 ? faturamentoTotal / totalAbastecimentos : 0;
    const faturamentoPorCategoria = abastecimentos.reduce((acc, item) => {
      const categoria = mapearProdutoParaCategoria(item.produto || 'OUTROS');
      if (!acc[categoria]) acc[categoria] = 0;
      acc[categoria] += item.valor;
      return acc;
    }, {} as Record<string, number>);

    // ... (resto do seu código 'useMemo' continua exatamente igual)
    const end = new Date(endDate);
    const diasCorridos = end.getDate();
    const diasNoMes = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    let performanceResumoData = metasPosto.map(meta => {
        const realizado = faturamentoPorCategoria[meta.periodo] || 0;
        const tendencia = (new Date(startDate).getMonth() === today.getMonth())
          ? (realizado / diasCorridos) * diasNoMes
          : realizado;
        const desempenho = meta.meta > 0 ? (realizado / meta.meta - 1) * 100 : 0;
        const faltante = Math.max(0, meta.meta - realizado);
        return { categoria: meta.periodo, metaMensal: meta.meta, realizado, tendencia, desempenho, faltante };
    });
    Object.entries(faturamentoPorCategoria).forEach(([categoria, realizado]) => {
        if (!performanceResumoData.some(p => p.categoria === categoria)) {
            performanceResumoData.push({
                categoria,
                metaMensal: 0,
                realizado,
                tendencia: (new Date(startDate).getMonth() === today.getMonth())
                  ? (realizado / diasCorridos) * diasNoMes
                  : realizado,
                desempenho: 0,
                faltante: 0
            });
        }
    });

    performanceResumoData = performanceResumoData.filter(item => item.metaMensal > 0 || item.realizado > 0);

    const salesByCollaborator = abastecimentos.reduce((acc, item) => {
        const name = item.nomeFuncionario || "Não identificado";
        if (!acc[name]) acc[name] = { faturamento: 0, litragem: 0 };
        acc[name].faturamento += item.valor;
        acc[name].litragem += item.litragem;
        return acc;
    }, {} as Record<string, { faturamento: number, litragem: number }>);

    const rankingData = Object.entries(salesByCollaborator)
      .sort(([, a], [, b]) => b.faturamento - a.faturamento)
      .map(([name, data], index) => ({
        position: index + 1, name: name.toUpperCase(),
        value: formatNumber(data.faturamento, { style: 'currency' }),
        subValue: `${formatNumber(data.litragem, { maximumFractionDigits: 2 })} L`,
        growth: 0
      }));
      
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({ name: `${i.toString().padStart(2, '0')}:00`, litros: 0, valor: 0 }));
    abastecimentos.forEach(item => {
      const hour = new Date(item.dhRegistro).getHours();
      if (hourlyData[hour]) {
        hourlyData[hour].litros += item.litragem;
        hourlyData[hour].valor += item.valor;
      }
    });

    return {
      kpis: { abastecimentos: totalAbastecimentos, litragem: litragemTotal, faturamento: faturamentoTotal, ticketMedioReal },
      rankingData,
      performanceResumoData,
      chartData: hourlyData.filter(h => h.litros > 0 || h.valor > 0),
    };
  }, [apiData, startDate, endDate, metasPosto, today]);
  
  const csvData = useMemo(() => {
      if (!apiData || !apiData.abastecimentos) return [];
      const headers = ["Data", "Hora", "Produto", "Litragem", "Valor", "Funcionário", "Status"];
      const dataRows = apiData.abastecimentos.map(ab => [
        new Date(ab.dhRegistro).toLocaleDateString('pt-BR'),
        new Date(ab.dhRegistro).toLocaleTimeString('pt-BR'),
        ab.produto, ab.litragem, ab.valor, ab.nomeFuncionario, ab.situacao
      ]);
      return [headers, ...dataRows];
  }, [apiData]);

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
  if (isError) return <div className="p-8 text-xl text-red-500">Erro: {(error as Error).message}</div>;

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