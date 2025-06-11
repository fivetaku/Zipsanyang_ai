import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import FinancialInfoForm from "@/components/forms/FinancialInfoForm";
import ApartmentCard from "@/components/apartments/ApartmentCard";
import PremiumUpgrade from "@/components/apartments/PremiumUpgrade";
import type { ChatMessage, FinancialAnalysis, ApartmentRecommendation } from "@/lib/types";

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  recommendations: ApartmentRecommendation[];
  financialAnalysis: FinancialAnalysis | null;
  onOpenMap: () => void;
}

export default function ChatContainer({
  messages,
  isLoading,
  recommendations,
  financialAnalysis,
  onOpenMap,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const shouldShowFinancialForm = messages.length > 2 && !financialAnalysis;
  const shouldShowRecommendations = recommendations.length > 0;
  const shouldShowPremiumUpgrade = recommendations.length > 0;

  return (
    <main className="pt-20 pb-32 px-4 max-w-md mx-auto">
      <div className="space-y-4" id="chatMessages">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id || index}
            message={message}
            isUser={message.role === "user"}
          />
        ))}

        {shouldShowFinancialForm && (
          <div className="flex items-start space-x-3 animate-bounce-in">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">🐱</span>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border max-w-xs">
                <p className="text-gray-800 leading-relaxed">
                  좋아요! 실거주용이시군요 🏡<br /><br />
                  그럼 몇 가지 정보를 알려주세요. 개인정보는 저장하지 않으니 안심하세요!
                </p>
              </div>
              <FinancialInfoForm />
            </div>
          </div>
        )}

        {financialAnalysis && (
          <div className="flex items-start space-x-3 animate-bounce-in">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">🐱</span>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border max-w-xs">
                <p className="text-gray-800 leading-relaxed">
                  분석이 완료되었어요! 📊<br /><br />
                  말씀해주신 조건으로 계산해보니 이런 결과가 나왔어요:
                </p>
              </div>
              <div className="bg-gradient-to-br from-accent to-secondary rounded-xl p-4 text-white shadow-lg min-w-[280px]">
                <h3 className="font-bold text-lg mb-3">💡 예산 분석 결과</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>최대 대출 가능액:</span>
                    <span className="font-semibold">{(financialAnalysis.maxLoan / 10000).toFixed(1)}억원</span>
                  </div>
                  <div className="flex justify-between">
                    <span>월 상환액:</span>
                    <span className="font-semibold">{financialAnalysis.loanDetails.monthlyPayment.toLocaleString()}만원</span>
                  </div>
                  <div className="border-t border-white/20 pt-2 mt-2">
                    <div className="flex justify-between font-bold text-base">
                      <span>총 구매 가능 금액:</span>
                      <span>{(financialAnalysis.maxBudget / 10000).toFixed(1)}억원</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {shouldShowRecommendations && (
          <div className="flex items-start space-x-3 animate-bounce-in">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">🐱</span>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border max-w-xs">
                <p className="text-gray-800 leading-relaxed">
                  예산에 맞는 최적의 아파트 3곳을 찾았어요! 🎯
                </p>
              </div>

              {recommendations.map((apt, index) => (
                <ApartmentCard
                  key={apt.complexNo}
                  apartment={apt}
                  rank={index + 1}
                  onOpenMap={onOpenMap}
                />
              ))}
            </div>
          </div>
        )}

        {shouldShowPremiumUpgrade && (
          <div className="flex items-start space-x-3 animate-bounce-in">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">🐱</span>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border max-w-xs">
                <p className="text-gray-800 leading-relaxed">
                  더 자세한 정보와 대출 상담을 원하시면 프리미엄을 이용해보세요! ✨
                </p>
              </div>
              <PremiumUpgrade />
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-start space-x-3 animate-pulse">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">🐱</span>
            </div>
            <div className="bg-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </main>
  );
}
