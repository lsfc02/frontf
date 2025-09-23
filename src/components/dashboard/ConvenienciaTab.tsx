import { useState, useMemo, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { KPICard } from "./KPICard";
import { SecaoTable } from "./SecaoTable";
import { MetaEditForm } from "./MetaEditForm";
import { ShoppingCart, Package, DollarSign, Users, Download, ArrowUp, ArrowDown, Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { CSVLink } from "react-csv";

interface ResumoGeral { faturamento: number; custo: number; ticketMedio: number; tickets: number; quantidadeItens: number; }
interface VendaDiaria { dia: string; faturamento: number; custo: number; margemPercentual: number; }
interface SecaoPerformance { secao: string; faturamento: number; custo: number; margemPercentual: number; participacaoPercentual: number; tickets: number; qtde: number; }
interface ApiResponse { resumoGeral: ResumoGeral; vendasDiaADia: VendaDiaria[]; performancePorSecao: SecaoPerformance[]; }
interface Meta { periodo: string; meta: number; realizado: number; percentual: number; }
interface PerformanceData { categoria: string; metaMensal: number; realizado: number; tendencia: number; desempenho: number; faltante: number; }
interface DateProps {
  startDate: string;
  endDate: string;
}

async function fetchConvenienciaData(startDate: string, endDate: string): Promise<ApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token de autenticação não encontrado.");
  const params = new URLSearchParams({ data_inicio: startDate, data_fim: endDate });
  
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const url = `${apiUrl}/conveniencia/dashboard/conveniencia?${params.toString()}`;

  const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!response.ok) throw new Error('Falha ao buscar dados.');
  return response.json();
}

function PerformanceResumo({ titulo, data, onAddMeta, onEditMeta }: { titulo: string; data: PerformanceData[]; onAddMeta: () => void; onEditMeta: (item: PerformanceData) => void; }) {
    const total = data.reduce((acc, item) => {
        acc.metaMensal += item.metaMensal;
        acc.realizado += item.realizado;
        acc.tendencia += item.tendencia;
        acc.faltante += item.faltante;
        return acc;
    }, { categoria: "TOTAL", metaMensal: 0, realizado: 0, tendencia: 0, desempenho: 0, faltante: 0 });
    total.desempenho = total.metaMensal > 0 ? (total.realizado / total.metaMensal - 1) * 100 : 0;

    const renderDesempenho = (desempenho: number) => {
        if (!isFinite(desempenho) || desempenho === 0) return <span className="font-semibold text-text-secondary">--</span>;
        const isNegative = desempenho < 0;
        return (
            <span className={cn("font-semibold flex items-center justify-end gap-1 text-xs", isNegative ? "text-red-400" : "text-green-400")}>
                {isNegative ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                {desempenho.toFixed(0)}%
            </span>
        );
    };

    return (
        <div className="chart-container col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">{titulo}</h3>
                <Button onClick={onAddMeta} size="sm" className="bg-gradient-primary hover:opacity-90 gap-2"><Plus className="w-4 h-4" /> Nova Meta</Button>
            </div>
            <table className="w-full text-sm">
                <thead className="text-xs text-text-secondary uppercase">
                    <tr>
                        <th className="px-2 py-3 text-left">Categoria</th>
                        <th className="px-2 py-3 text-right">Meta Mensal</th>
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
                            <td className="px-2 py-3 text-right text-text-secondary">{formatNumber(item.metaMensal, { style: 'currency' })}</td>
                            <td className="px-2 py-3 text-right font-semibold">{formatNumber(item.realizado, { style: 'currency' })}</td>
                            <td className="px-2 py-3 text-right text-text-secondary">{formatNumber(item.tendencia, { style: 'currency' })}</td>
                            <td className="px-2 py-3 text-right">{renderDesempenho(item.desempenho)}</td>
                            <td className="px-2 py-3 text-right text-text-secondary">{formatNumber(item.faltante, { style: 'currency' })}</td>
                            <td className="px-2 py-3 text-center">
                                <Button size="sm" variant="ghost" onClick={() => onEditMeta(item)} className="h-6 w-6 p-0 hover:bg-kpi-cyan/20"><Edit className="w-3 h-3" /></Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="font-bold text-text-primary">
                    <tr>
                        <td className="px-2 py-3">{total.categoria}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(total.metaMensal, { style: 'currency' })}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(total.realizado, { style: 'currency' })}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(total.tendencia, { style: 'currency' })}</td>
                        <td className="px-2 py-3 text-right">{renderDesempenho(total.desempenho)}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(total.faltante, { style: 'currency' })}</td>
                        <td className="px-2 py-3"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

export function ConvenienciaTab({ startDate, endDate }: DateProps) {
    const { toast } = useToast();
    const today = new Date();
    
    const [metas, setMetas] = useState<Meta[]>(() => {
        const savedMetas = localStorage.getItem('convenienciaMetas');
        return savedMetas ? JSON.parse(savedMetas) : [
            { periodo: "PADARIA", meta: 31500, realizado: 0, percentual: 0 },
            { periodo: "BEBIDAS", meta: 34169, realizado: 0, percentual: 0 },
        ];
    });

    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [editingMeta, setEditingMeta] = useState<Meta | null>(null);

    useEffect(() => {
        localStorage.setItem('convenienciaMetas', JSON.stringify(metas));
    }, [metas]);

    const { data: apiData, isLoading, isError, error } = useQuery({
        queryKey: ['convenienciaDashboard', startDate, endDate], 
        queryFn: () => fetchConvenienciaData(startDate, endDate),
        refetchInterval: 60000,
    });

    const processedData = useMemo(() => {
        const kpisData = apiData?.resumoGeral;
        const secaoData = apiData?.performancePorSecao;
        if (!kpisData || !secaoData) {
            return { kpis: null, secaoTableData: [], performanceResumoData: [] };
        }

        const end = new Date(endDate);
        const diasCorridos = end.getDate();
        const diasNoMes = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();

        const performanceResumoData = secaoData.map(secao => {
            const metaDaSecao = metas.find(m => m.periodo.toUpperCase() === secao.secao.toUpperCase());
            const metaMensal = metaDaSecao?.meta || 0;
            const realizado = secao.faturamento;
            const tendencia = (new Date(startDate).getMonth() === today.getMonth()) ? (realizado / diasCorridos) * diasNoMes : realizado;
            const desempenho = metaMensal > 0 ? (realizado / metaMensal - 1) * 100 : 0;
            const faltante = Math.max(0, metaMensal - realizado);
            return { categoria: secao.secao, metaMensal, realizado, tendencia, desempenho, faltante };
        
        }).filter(item => item.metaMensal > 0 || item.realizado > 0);

        return {
            kpis: { vendas: kpisData.tickets, produtos: kpisData.quantidadeItens, faturamento: kpisData.faturamento, ticketMedio: kpisData.ticketMedio },
            secaoTableData: secaoData,
            performanceResumoData,
        };
    }, [apiData, startDate, endDate, metas, today]);

    const csvData = useMemo(() => {
        if (!apiData) return [];
        const { resumoGeral, vendasDiaADia, performancePorSecao } = apiData;
        if(!resumoGeral || !vendasDiaADia || !performancePorSecao) return [];
        
        return [
            ["RELATÓRIO DE VENDAS DA CONVENIÊNCIA"], ["Período:", `${startDate} a ${endDate}`], [],
            ["TOTAIS GERAIS"], ["Faturamento", "Custo", "Tickets", "Qtd. Itens", "Ticket Médio"],
            [resumoGeral.faturamento, resumoGeral.custo, resumoGeral.tickets, resumoGeral.quantidadeItens, resumoGeral.ticketMedio], [],
            ["VENDAS DIA A DIA"], ["Dia", "Faturamento", "Custo", "Margem %"],
            ...vendasDiaADia.map(d => [d.dia, d.faturamento, d.custo, d.margemPercentual.toFixed(2)]), [],
            ["TOTAIS DAS SEÇÕES"], ["Seção", "Faturamento", "Custo", "Margem %", "Participação %", "Tickets", "Qtd. Itens"],
            ...performancePorSecao.map(s => [s.secao, s.faturamento, s.custo, s.margemPercentual.toFixed(2), s.participacaoPercentual.toFixed(2), s.tickets, s.qtde])
        ];
    }, [apiData, startDate, endDate]);

    const handleAddMeta = () => { setEditingMeta(null); setIsEditFormOpen(true); };
    const handleEditMeta = (metaToEdit: PerformanceData) => {
        const existingMeta = metas.find(m => m.periodo.toUpperCase() === metaToEdit.categoria.toUpperCase()) || { periodo: metaToEdit.categoria, meta: 0, realizado: metaToEdit.realizado, percentual: 0 };
        setEditingMeta(existingMeta);
        setIsEditFormOpen(true);
    };
    const handleSaveMeta = (savedMeta: Meta) => {
        const isExisting = metas.some(m => m.periodo.toUpperCase() === savedMeta.periodo.toUpperCase());
        setMetas(prevMetas => isExisting ? prevMetas.map(m => m.periodo.toUpperCase() === savedMeta.periodo.toUpperCase() ? savedMeta : m) : [...prevMetas, savedMeta]);
        toast({ title: isExisting ? "Meta atualizada!" : "Nova meta criada!" });
    };

    if (isLoading) return <div className="p-8 text-xl text-white">Carregando...</div>;
    if (isError) return <div className="p-s8 text-xl text-red-500">Erro: {(error as Error).message}</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Conveniência</h1>
                    <p className="text-text-secondary mt-1">Acompanhe as vendas e performance da loja</p>
                </div>
                <div className="flex items-center gap-2">
                    <CSVLink data={csvData} filename={`relatorio_conveniencia_${startDate}_a_${endDate}.csv`}>
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />Exportar CSV
                        </Button>
                    </CSVLink>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Vendas" value={processedData.kpis?.vendas || 0} color="pink" icon={<ShoppingCart />} />
                <KPICard title="Produtos Vendidos" value={processedData.kpis?.produtos || 0} format="decimal" color="blue" icon={<Package />} />
                <KPICard title="Faturamento" value={processedData.kpis?.faturamento || 0} format="currency" color="green" icon={<DollarSign />} />
                <KPICard title="Ticket Médio" value={processedData.kpis?.ticketMedio || 0} format="currency" color="orange" icon={<Users />} />
            </div>

            <PerformanceResumo
                titulo="Resumo de Faturamento por Seção"
                data={processedData.performanceResumoData}
                onAddMeta={handleAddMeta}
                onEditMeta={handleEditMeta}
            />

            <div className="grid grid-cols-1 gap-6">
                <div className="lg:col-span-2">
                    <SecaoTable title="Performance por Seção (Dados Brutos)" data={processedData.secaoTableData} />
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