import { Card, CardContent } from "@/components/ui/card";

interface BudgetAnalysisProps {
  budgetAnalysis: {
    maxLoanAmount: number;
    maxPurchaseAmount: number;
    dsr: number;
    ltv: number;
    recommendedBudgetRange: {
      min: number;
      max: number;
    };
  };
}

export default function BudgetAnalysis({ budgetAnalysis }: BudgetAnalysisProps) {
  const formatAmount = (amount: number) => {
    return `${(amount / 10000).toFixed(1)}억원`;
  };

  return (
    <div className="flex items-start space-x-3 animate-bounce-in">
      <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white text-lg">🐱</span>
      </div>
      <div className="space-y-3">
        <Card className="max-w-xs">
          <CardContent className="px-4 py-3">
            <p className="text-gray-800 leading-relaxed">
              분석이 완료되었어요! 📊<br /><br />
              말씀해주신 조건으로 계산해보니 이런 결과가 나왔어요:
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-accent to-secondary text-white shadow-lg min-w-[280px]">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-3">💡 예산 분석 결과</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>최대 대출 가능액:</span>
                <span className="font-semibold">{formatAmount(budgetAnalysis.maxLoanAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>DSR 비율:</span>
                <span className="font-semibold">{budgetAnalysis.dsr}%</span>
              </div>
              <div className="flex justify-between">
                <span>LTV 비율:</span>
                <span className="font-semibold">{budgetAnalysis.ltv}%</span>
              </div>
              <div className="border-t border-white/20 pt-2 mt-2">
                <div className="flex justify-between font-bold text-base">
                  <span>총 구매 가능 금액:</span>
                  <span>{formatAmount(budgetAnalysis.maxPurchaseAmount)}</span>
                </div>
              </div>
              <div className="text-xs opacity-90 mt-2">
                추천 예산: {formatAmount(budgetAnalysis.recommendedBudgetRange.min)} ~ {formatAmount(budgetAnalysis.recommendedBudgetRange.max)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
