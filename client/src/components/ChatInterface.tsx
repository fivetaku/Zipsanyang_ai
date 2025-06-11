import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Send, Crown } from "lucide-react";
import ApartmentCard from "./ApartmentCard";
import BudgetAnalysis from "./BudgetAnalysis";

interface ChatInterfaceProps {
  sessionData: any;
  recommendationsData: any;
  onSendMessage: (message: string) => void;
  onActivatePremium: () => void;
  isLoading: boolean;
}

export default function ChatInterface({
  sessionData,
  recommendationsData,
  onSendMessage,
  onActivatePremium,
  isLoading,
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessionData?.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage("");
    }
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    onSendMessage(action);
  };

  const messages = sessionData?.messages || [];
  const session = sessionData?.session;
  const hasRecommendations = !!session?.recommendations;

  return (
    <div className="max-w-md mx-auto px-4 space-y-4">
      {/* Welcome Message */}
      {messages.length === 0 && (
        <div className="flex items-start space-x-3 animate-bounce-in">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">🐱</span>
          </div>
          <Card className="max-w-xs">
            <CardContent className="px-4 py-3">
              <p className="text-gray-800 leading-relaxed">
                안녕하세요! 저는 집사 냥이에요 🏠✨
                <br /><br />
                아파트 매매가 처음이시거나 어려우시죠? 걱정 마세요! 제가 여러분의 상황에 맞는 최적의 아파트를 찾아드릴게요.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Messages */}
      {messages.map((message: any, index: number) => (
        <div
          key={message.id}
          className={`flex items-start space-x-3 animate-slide-up ${
            message.role === "user" ? "justify-end" : ""
          }`}
        >
          {message.role === "assistant" && (
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">🐱</span>
            </div>
          )}
          
          <Card className={`max-w-xs ${
            message.role === "user" 
              ? "bg-gradient-to-r from-accent to-secondary text-white" 
              : "bg-white"
          }`}>
            <CardContent className="px-4 py-3">
              <p className={`leading-relaxed ${
                message.role === "user" ? "text-white" : "text-gray-800"
              }`}>
                {message.content}
              </p>
            </CardContent>
          </Card>

          {message.role === "user" && (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gray-600">👤</span>
            </div>
          )}
        </div>
      ))}

      {/* Budget Analysis */}
      {session?.budgetAnalysis && (
        <BudgetAnalysis budgetAnalysis={session.budgetAnalysis} />
      )}

      {/* Apartment Recommendations */}
      {hasRecommendations && recommendationsData?.recommendations && (
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">🐱</span>
            </div>
            <Card className="max-w-xs">
              <CardContent className="px-4 py-3">
                <p className="text-gray-800 leading-relaxed">
                  예산에 맞는 최적의 아파트 3곳을 찾았어요! 🎯
                </p>
              </CardContent>
            </Card>
          </div>

          {recommendationsData.recommendations.map((apartment: any, index: number) => (
            <ApartmentCard
              key={apartment.complexNo}
              apartment={apartment}
              rank={index + 1}
              isBlurred={apartment.isBlurred}
              isPremium={recommendationsData.isPremium}
            />
          ))}

          {/* Premium Upgrade Prompt */}
          {!recommendationsData.isPremium && (
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">🐱</span>
              </div>
              <div className="space-y-3">
                <Card className="max-w-xs">
                  <CardContent className="px-4 py-3">
                    <p className="text-gray-800 leading-relaxed">
                      더 자세한 정보와 대출 상담을 원하시면 프리미엄을 이용해보세요! ✨
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white min-w-[280px]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg">🌟 프리미엄 혜택</h3>
                      <Badge className="bg-white/20 text-white">7일 무료</Badge>
                    </div>
                    <ul className="text-sm space-y-1 mb-4">
                      <li>✅ 모든 추천 아파트 상세 정보</li>
                      <li>✅ 맞춤형 대출 상품 추천</li>
                      <li>✅ 세부 투자 분석 리포트</li>
                      <li>✅ 1:1 전문가 상담</li>
                    </ul>
                    <Button
                      onClick={onActivatePremium}
                      className="w-full bg-white text-orange-500 hover:bg-gray-100 font-bold"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      7일 무료 체험 시작
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Typing Indicator */}
      {isLoading && (
        <div className="flex items-start space-x-3 animate-pulse">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">🐱</span>
          </div>
          <Card className="bg-gray-200 max-w-xs">
            <CardContent className="px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="집사 냥에게 궁금한 것을 물어보세요..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-accent focus:border-transparent bg-gray-50"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-accent p-1"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="w-12 h-12 bg-accent hover:bg-blue-600 text-white rounded-full shadow-lg"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>

          {/* Quick Suggestions */}
          {!hasRecommendations && (
            <div className="flex space-x-2 mt-3 overflow-x-auto pb-1">
              <Button
                variant="secondary"
                size="sm"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap"
                onClick={() => handleQuickAction("실거주용 아파트를 찾고 있어요")}
              >
                🏠 실거주용 아파트
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap"
                onClick={() => handleQuickAction("갭투자용 아파트를 찾고 있어요")}
              >
                💰 갭투자용 아파트
              </Button>
            </div>
          )}

          {hasRecommendations && (
            <div className="flex space-x-2 mt-3 overflow-x-auto pb-1">
              <Button
                variant="secondary"
                size="sm"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap"
                onClick={() => handleQuickAction("대출 상담을 받고 싶어요")}
              >
                💰 대출 상담
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap"
                onClick={() => handleQuickAction("다른 지역도 추천해주세요")}
              >
                📍 다른 지역 추천
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap"
                onClick={() => handleQuickAction("시장 분석이 궁금해요")}
              >
                📊 시장 분석
              </Button>
            </div>
          )}
        </div>
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
}
