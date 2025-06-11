import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatContainer from "@/components/chat/ChatContainer";
import ChatInput from "@/components/chat/ChatInput";
import FloatingActionButtons from "@/components/ui/FloatingActionButtons";
import MapModal from "@/components/apartments/MapModal";
import { apiRequest } from "@/lib/api";
import type { ChatMessage, FinancialAnalysis, ApartmentRecommendation } from "@/lib/types";

export default function ChatPage() {
  const { sessionId } = useParams();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<ApartmentRecommendation[]>([]);
  const [financialAnalysis, setFinancialAnalysis] = useState<FinancialAnalysis | null>(null);
  const queryClient = useQueryClient();

  // Create session if none exists
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/chat/session");
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.sessionId);
      window.history.replaceState({}, "", `/chat/${data.sessionId}`);
    },
  });

  // Get messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/chat", currentSessionId, "messages"],
    queryFn: async () => {
      if (!currentSessionId) return [];
      const response = await apiRequest("GET", `/api/chat/${currentSessionId}/messages`);
      return response.json();
    },
    enabled: !!currentSessionId,
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!currentSessionId) throw new Error("No session");
      const response = await apiRequest("POST", `/api/chat/${currentSessionId}/message`, {
        message,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.financialAnalysis) {
        setFinancialAnalysis(data.financialAnalysis);
      }
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
      queryClient.invalidateQueries({
        queryKey: ["/api/chat", currentSessionId, "messages"],
      });
    },
  });

  // Initialize session on mount
  useEffect(() => {
    if (!currentSessionId) {
      createSessionMutation.mutate();
    }
  }, []);

  const handleSendMessage = (message: string) => {
    sendMessageMutation.mutate(message);
  };

  const handleOpenMap = () => {
    setIsMapModalOpen(true);
  };

  const handlePremiumUpgrade = () => {
    // TODO: Implement premium upgrade flow
    alert("프리미엄 업그레이드 페이지로 이동합니다!");
  };

  if (!currentSessionId && createSessionMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-chat-bg">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center mb-4 mx-auto animate-bounce">
            <span className="text-white text-2xl">🐱</span>
          </div>
          <p className="text-gray-600">집사 냥과의 채팅을 시작하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chat-bg font-korean">
      <ChatHeader />
      
      <ChatContainer
        messages={messages}
        isLoading={isLoading}
        recommendations={recommendations}
        financialAnalysis={financialAnalysis}
        onOpenMap={handleOpenMap}
      />
      
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={sendMessageMutation.isPending}
      />
      
      <FloatingActionButtons
        onOpenMap={handleOpenMap}
        onPremiumUpgrade={handlePremiumUpgrade}
      />

      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        recommendations={recommendations}
      />
    </div>
  );
}
