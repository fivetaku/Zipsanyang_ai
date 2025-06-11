import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, MapPin } from "lucide-react";

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: Array<{
    complexNo: number;
    complexName: string;
    location: string;
    latitude?: number;
    longitude?: number;
  }>;
}

const getRankColor = (index: number) => {
  switch (index) {
    case 0: return "bg-green-500";
    case 1: return "bg-blue-500";
    case 2: return "bg-purple-500";
    default: return "bg-gray-500";
  }
};

export default function MapModal({ isOpen, onClose, recommendations }: MapModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="font-bold text-lg text-gray-800">
            추천 아파트 위치
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        
        <div className="h-96 bg-gray-100 flex items-center justify-center rounded-lg">
          {/* KAKAO MAP INTEGRATION PLACEHOLDER */}
          <div className="text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="font-medium mb-2">Kakao 지도 API</p>
            <p className="text-sm">연동 영역</p>
            
            {recommendations.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-xs font-medium text-gray-600 mb-3">추천 아파트 목록:</p>
                {recommendations.slice(0, 3).map((apt, index) => (
                  <div key={apt.complexNo} className="flex items-center justify-center space-x-2 text-sm">
                    <Badge className={`w-3 h-3 rounded-full p-0 ${getRankColor(index)}`} />
                    <span className="text-gray-700">{apt.complexName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          실제 구현 시 Kakao Maps API를 통해 아파트 위치가 표시됩니다.
        </div>
      </DialogContent>
    </Dialog>
  );
}
