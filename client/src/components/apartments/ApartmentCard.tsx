import { Button } from "@/components/ui/button";
import type { ApartmentRecommendation } from "@/lib/types";

interface ApartmentCardProps {
  apartment: ApartmentRecommendation;
  rank: number;
  onOpenMap: () => void;
}

export default function ApartmentCard({ apartment, rank, onOpenMap }: ApartmentCardProps) {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-green-500";
      case 2: return "bg-blue-500";
      case 3: return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(1)}억원`;
    }
    return `${price.toLocaleString()}만원`;
  };

  const getCommutTime = () => {
    // Mock commute time calculation
    const times = ["25분", "35분", "20분"];
    return times[rank - 1] || "30분";
  };

  const getCommutTimeColor = (time: string) => {
    const minutes = parseInt(time);
    if (minutes <= 25) return "text-green-600";
    if (minutes <= 35) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden min-w-[300px] relative ${apartment.isPremium ? 'premium-card' : ''}`}>
      {apartment.isPremium && (
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/20 to-transparent flex items-center justify-center z-10">
          <div className="bg-yellow-400 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
            <i className="fas fa-crown mr-2"></i>프리미엄으로 보기
          </div>
        </div>
      )}
      
      <div className={apartment.isPremium ? 'filter blur-sm' : ''}>
        <div className="relative">
          <img 
            src={`https://images.unsplash.com/photo-${1545324418 + rank}?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200`}
            alt={apartment.complexName}
            className="w-full h-32 object-cover"
          />
          <div className={`absolute top-3 left-3 ${getRankColor(rank)} text-white px-2 py-1 rounded-full text-xs font-semibold`}>
            #{rank} 추천
          </div>
        </div>
        
        <div className="p-4">
          <h4 className="font-bold text-lg text-gray-800 mb-1">{apartment.complexName}</h4>
          <p className="text-sm text-gray-600 mb-3">
            {apartment.sigungu} {apartment.dongName} • {apartment.useApproveYmd ? apartment.useApproveYmd.slice(0, 4) : '2020'}년 • 84㎡
          </p>
          
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">매매가:</span>
              <span className="font-semibold text-gray-800">
                {formatPrice(apartment.salePrice || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">출퇴근 시간:</span>
              <span className={`font-semibold ${getCommutTimeColor(getCommutTime())}`}>
                {getCommutTime()}
              </span>
            </div>
            {apartment.reason && (
              <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                {apartment.reason}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={onOpenMap}
              className="flex-1 bg-accent hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              지도에서 보기
            </Button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <i className="fas fa-heart text-gray-400"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
