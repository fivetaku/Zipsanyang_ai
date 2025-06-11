import { Button } from "@/components/ui/button";

export default function PremiumUpgrade() {
  const handleUpgrade = () => {
    // TODO: Implement premium upgrade flow
    alert("7일 무료 체험을 시작합니다!");
  };

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 text-white shadow-lg min-w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg">🌟 프리미엄 혜택</h3>
        <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-semibold">
          7일 무료
        </span>
      </div>
      
      <ul className="text-sm space-y-1 mb-4">
        <li>✅ 모든 추천 아파트 상세 정보</li>
        <li>✅ 맞춤형 대출 상품 추천</li>
        <li>✅ 세부 투자 분석 리포트</li>
        <li>✅ 1:1 전문가 상담</li>
      </ul>
      
      <Button 
        onClick={handleUpgrade}
        className="w-full bg-white text-orange-500 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
      >
        7일 무료 체험 시작
      </Button>
    </div>
  );
}
