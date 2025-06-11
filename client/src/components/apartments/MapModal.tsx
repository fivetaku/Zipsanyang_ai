import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { ApartmentRecommendation } from "@/lib/types";

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: ApartmentRecommendation[];
}

export default function MapModal({ isOpen, onClose, recommendations }: MapModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getMarkerColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-green-500";
      case 2: return "bg-blue-500";
      case 3: return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg text-gray-800">추천 아파트 위치</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <i className="fas fa-times text-xl"></i>
          </Button>
        </div>
        
        <div className="h-96 bg-gray-100 flex items-center justify-center relative">
          {/* Kakao Map will be integrated here */}
          <div className="text-center text-gray-500">
            <i className="fas fa-map text-4xl mb-2"></i>
            <p>Kakao 지도 API<br />연동 영역</p>
            
            <div className="mt-4 space-y-2">
              {recommendations.map((apt, index) => (
                <div key={apt.complexNo} className="flex items-center justify-center space-x-2 text-sm">
                  <div className={`w-3 h-3 ${getMarkerColor(index + 1)} rounded-full`}></div>
                  <span>
                    {apt.complexName} {apt.isPremium && '(프리미엄)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            지도 클릭으로 각 아파트의 상세 정보를 확인할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
