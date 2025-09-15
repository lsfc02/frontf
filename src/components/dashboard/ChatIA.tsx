import { useState } from "react";
import { Send, MessageSquare, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatIAProps {
  onCommand?: (command: string) => void;
}

export function ChatIA({ onCommand }: ChatIAProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Olá! Sou sua assistente IA para o dashboard. Posso ajudar você a filtrar dados, gerar relatórios e analisar métricas. Experimente comandos como 'mostrar dados de hoje' ou 'comparar vendas do posto vs conveniência'.",
      sender: "ai",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      let aiResponse = "";
      
      // Simple command processing simulation
      const lowerInput = inputText.toLowerCase();
      
      if (lowerInput.includes("hoje") || lowerInput.includes("dados de hoje")) {
        aiResponse = "Aplicando filtro para dados de hoje. Os KPIs foram atualizados para mostrar apenas as métricas do dia atual.";
        onCommand?.("filter_today");
      } else if (lowerInput.includes("semana") || lowerInput.includes("esta semana")) {
        aiResponse = "Filtrando dados da semana atual. Você pode ver os resultados nos gráficos e tabelas atualizados.";
        onCommand?.("filter_week");
      } else if (lowerInput.includes("ranking") || lowerInput.includes("colaboradores")) {
        aiResponse = "Exibindo ranking de colaboradores por performance. Os dados estão ordenados por faturamento total.";
        onCommand?.("show_ranking");
      } else if (lowerInput.includes("meta") || lowerInput.includes("metas")) {
        aiResponse = "Mostrando comparativo de metas vs realizado. Você pode ver o progresso mensal e diário nas tabelas abaixo.";
        onCommand?.("show_goals");
      } else if (lowerInput.includes("posto") && lowerInput.includes("conveniência")) {
        aiResponse = "Comparando performance entre Posto e Conveniência. Os gráficos mostram as tendências de ambos os segmentos.";
        onCommand?.("compare_segments");
      } else {
        aiResponse = "Entendi sua solicitação. Estou processando os dados e aplicando os filtros necessários. Em uma implementação completa, eu integraria com a API do ChatGPT para respostas mais sofisticadas.";
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Assistente IA</h3>
          <p className="text-sm text-text-muted">Comandos inteligentes para o dashboard</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.sender === "ai" && (
                <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-cyan" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.sender === "user"
                    ? "bg-gradient-primary text-white ml-auto"
                    : "bg-muted text-text-primary"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>

              {message.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-purple/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-purple" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-cyan" />
              </div>
              <div className="bg-muted p-3 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite um comando... (ex: mostrar dados de hoje)"
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            size="icon"
            className="bg-gradient-primary hover:opacity-90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Quick commands */}
        <div className="flex flex-wrap gap-2 mt-3">
          {["Dados de hoje", "Ranking colaboradores", "Comparar metas", "Relatório semanal"].map((cmd) => (
            <button
              key={cmd}
              onClick={() => setInputText(cmd)}
              className="px-3 py-1 text-xs bg-muted hover:bg-accent rounded-full transition-colors"
              disabled={isLoading}
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}