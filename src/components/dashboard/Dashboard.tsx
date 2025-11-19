import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { PostoTab } from "./PostoTab";
import { ConvenienciaTab } from "./ConvenienciaTab";
import { ChatIA } from "./ChatIA";
import { Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { formatNumber } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface Venda { 
  valor: number; 
  [key: string]: any; 
}

interface PostoApiResponse { 
  abastecimentos: Venda[];  // Mantém o nome "abastecimentos" para compatibilidade
}

interface ResumoGeral { 
  faturamento: number; 
  [key: string]: any; 
}

interface ConvenienciaApiResponse { 
  resumoGeral: ResumoGeral; 
  [key: string]: any; 
}

// ✅ ATUALIZADO - Agora usa o endpoint /vendas
async function fetchVendasPosto(startDate: string, endDate: string): Promise<PostoApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado.");
  
  const params = new URLSearchParams({ 
    ini: startDate, 
    fim: endDate, 
    top: '20000'  // Aumentado para pegar mais dados
  });
  
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  
  // ✅ MUDANÇA: Endpoint alterado de /abastecimentos para /vendas
  const url = `${apiUrl}/fueltec/vendas?${params.toString()}`;

  const response = await fetch(url, { 
    headers: { 'Authorization': `Bearer ${token}` } 
  });
  
  if (!response.ok) throw new Error('Falha ao buscar dados do posto.');
  
  const data = await response.json();
  
  // Garante que os valores são numéricos
  if (data.abastecimentos) {
    data.abastecimentos = data.abastecimentos.map((item: any) => ({
      ...item,
      valor: Number(item.valor) || 0
    }));
  }
  
  return data;
}

async function fetchConvenienciaData(startDate: string, endDate: string): Promise<ConvenienciaApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado.");
  
  const params = new URLSearchParams({ 
    data_inicio: startDate, 
    data_fim: endDate 
  });
  
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const url = `${apiUrl}/conveniencia/dashboard/conveniencia?${params.toString()}`;

  const response = await fetch(url, { 
    headers: { 'Authorization': `Bearer ${token}` } 
  });
  
  if (!response.ok) throw new Error('Falha ao buscar dados da conveniência.');
  return response.json();
}

interface DateProps {
  startDate: string;
  endDate: string;
}

function OverviewTab({ startDate, endDate }: DateProps) {
  
  const [metaGeral, setMetaGeral] = useState<number>(() => {
    const savedMeta = localStorage.getItem('metaGeral');
    return savedMeta ? JSON.parse(savedMeta) : 280000;
  });

  useEffect(() => {
    localStorage.setItem('metaGeral', JSON.stringify(metaGeral));
  }, [metaGeral]);
  
  // ✅ ATUALIZADO - Agora chama fetchVendasPosto ao invés de fetchAbastecimentos
  const { data: postoData, isLoading: isPostoLoading, isError: isPostoError } = useQuery({
    queryKey: ['vendasPosto', startDate, endDate],  // ✅ QueryKey atualizada
    queryFn: () => fetchVendasPosto(startDate, endDate),  // ✅ Função atualizada
    refetchInterval: 60000,  // Atualiza a cada 1 minuto
  });

  const { data: convenienciaData, isLoading: isConvenienciaLoading, isError: isConvenienciaError } = useQuery({
    queryKey: ['convenienciaDashboard', startDate, endDate], 
    queryFn: () => fetchConvenienciaData(startDate, endDate),
    refetchInterval: 60000,
  });

  const performanceData = useMemo(() => {
    // ✅ Garante conversão para número
    const faturamentoPosto = postoData?.abastecimentos?.reduce(
      (acc, item) => acc + (Number(item.valor) || 0), 
      0
    ) || 0;
    
    const faturamentoConveniencia = Number(convenienciaData?.resumoGeral?.faturamento) || 0;
    const faturamentoTotal = faturamentoPosto + faturamentoConveniencia;
    const progresso = metaGeral > 0 ? (faturamentoTotal / metaGeral) * 100 : 0;

    return { 
      faturamentoPosto, 
      faturamentoConveniencia, 
      faturamentoTotal, 
      progresso 
    };
  }, [postoData, convenienciaData, metaGeral]);
  
  const isLoading = isPostoLoading || isConvenienciaLoading;
  const isError = isPostoError || isConvenienciaError;

  if (isLoading) {
    return (
      <div className="p-8 text-xl text-white">
        Carregando panorama geral...
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-8 text-xl text-red-500">
        Ocorreu um erro ao buscar os dados consolidados.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Visão Geral</h1>
        <p className="text-text-secondary mt-1">Panorama completo do negócio</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Comparativo: Posto vs Conveniência
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-kpi-cyan/10">
              <div className="text-2xl font-bold text-kpi-cyan">
                {formatNumber(performanceData.faturamentoPosto, {style: 'currency'})}
              </div>
              <div className="text-sm text-text-secondary">Posto</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-kpi-pink/10">
              <div className="text-2xl font-bold text-kpi-pink">
                {formatNumber(performanceData.faturamentoConveniencia, {style: 'currency'})}
              </div>
              <div className="text-sm text-text-secondary">Conveniência</div>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Performance Geral
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">Faturamento Total</span>
              <span className="font-semibold text-green-400">
                {formatNumber(performanceData.faturamentoTotal, {style: 'currency'})}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Meta Mensal</span>
              <span className="font-semibold text-text-primary">
                {formatNumber(metaGeral, {style: 'currency'})}
              </span>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between">
                   <span className="text-text-secondary">Progresso</span>
                   <span className="font-semibold text-kpi-cyan">
                     {performanceData.progresso.toFixed(1)}%
                   </span>
               </div>
               <Progress value={performanceData.progresso} className="h-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const today = new Date();
  const [startDate, setStartDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    today.toISOString().split('T')[0]
  );

  const handleChatCommand = (command: string) => {
    let message = "";
    switch (command) {
      case "filter_today": 
        message = "Filtros aplicados para dados de hoje"; 
        break;
      case "filter_week": 
        message = "Visualizando dados da semana atual"; 
        break;
      case "show_ranking": 
        message = "Ranking de colaboradores atualizado"; 
        break;
      case "show_goals": 
        message = "Exibindo comparativo de metas"; 
        break;
      case "compare_segments": 
        message = "Comparando Posto vs Conveniência"; 
        break;
      default: 
        message = "Comando processado com sucesso";
    }
    toast({ 
      title: "IA Dashboard", 
      description: message 
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "posto":
        return <PostoTab startDate={startDate} endDate={endDate} />;
      case "conveniencia":
        return <ConvenienciaTab startDate={startDate} endDate={endDate} />;
      case "overview":
        return <OverviewTab startDate={startDate} endDate={endDate} />;
      case "chat":
        return (
          <div className="h-[calc(100vh-2rem)]">
            <ChatIA onCommand={handleChatCommand} />
          </div>
        );
      case "settings":
        return <SettingsTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return <PostoTab startDate={startDate} endDate={endDate} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-dashboard-bg">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className={cn("flex-1 p-6 overflow-y-auto")}>
        <div className="max-w-7xl mx-auto">
          {["overview", "posto", "conveniencia"].includes(activeTab) && (
            <div className="flex items-center gap-4 mb-6 justify-end">
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="bg-card border-border w-auto"
              />
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="bg-card border-border w-auto"
              />
            </div>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Configurações</h1>
        <p className="text-text-secondary mt-1">
          Gerencie as configurações do sistema
        </p>
      </div>
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Perfil</h1>
        <p className="text-text-secondary mt-1">Informações do usuário</p>
      </div>
    </div>
  );
}
