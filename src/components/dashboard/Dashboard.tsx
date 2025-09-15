import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { PostoTab } from "./PostoTab";
import { ConvenienciaTab } from "./ConvenienciaTab";
import { ChatIA } from "./ChatIA";
import { BarChart3, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("posto");
  const { toast } = useToast();

  const handleChatCommand = (command: string) => {
    // Simulate command processing
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
      description: message,
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "posto":
        return <PostoTab />;
      case "conveniencia":
        return <ConvenienciaTab />;
      case "overview":
        return <OverviewTab />;
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
        return <PostoTab />;
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className={cn(
        "transition-all duration-300",
        "ml-64 lg:ml-64 ml-16", // Responsive sidebar
        "p-4 md:p-6 min-h-screen"
      )}>
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// Overview Tab Component
function OverviewTab() {
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
              <div className="text-2xl font-bold text-kpi-cyan">R$ 189.432</div>
              <div className="text-sm text-text-secondary">Posto</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-kpi-pink/10">
              <div className="text-2xl font-bold text-kpi-pink">R$ 42.567</div>
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
              <span className="font-semibold text-green">R$ 231.999</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Meta Mensal</span>
              <span className="font-semibold text-text-primary">R$ 280.000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Progresso</span>
              <span className="font-semibold text-kpi-cyan">82.9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Configurações</h1>
        <p className="text-text-secondary mt-1">Gerencie as configurações do sistema</p>
      </div>
      
      <div className="chart-container max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-kpi-purple" />
          <h3 className="text-lg font-semibold text-text-primary">Configurações do Sistema</h3>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border/30">
            <h4 className="font-medium text-text-primary mb-2">Integração Backend</h4>
            <p className="text-sm text-text-secondary mb-3">
              Para funcionalidades completas como autenticação e banco de dados, conecte ao Supabase.
            </p>
            <div className="text-xs text-text-muted">
              • Login com credenciais FULTec<br/>
              • Autenticação segura<br/>
              • Integração com API<br/>
              • Níveis de usuário
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Tab Component  
function ProfileTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Perfil</h1>
        <p className="text-text-secondary mt-1">Informações do usuário</p>
      </div>
      
      <div className="chart-container max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-kpi-green" />
          <h3 className="text-lg font-semibold text-text-primary">Dados do Usuário</h3>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border/30">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Nome:</span>
                <span className="text-text-primary">Demo User</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Nível:</span>
                <span className="text-kpi-cyan">Administrador</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">CNPJ:</span>
                <span className="text-text-primary">XX.XXX.XXX/0001-XX</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}