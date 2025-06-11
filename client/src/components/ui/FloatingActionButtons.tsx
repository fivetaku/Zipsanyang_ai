import { Button } from "@/components/ui/button";

interface FloatingActionButtonsProps {
  onOpenMap: () => void;
  onPremiumUpgrade: () => void;
}

export default function FloatingActionButtons({ 
  onOpenMap, 
  onPremiumUpgrade 
}: FloatingActionButtonsProps) {
  return (
    <div className="fixed bottom-24 right-4 space-y-3 z-40">
      <Button
        onClick={onOpenMap}
        className="w-14 h-14 bg-secondary hover:bg-teal-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
        title="지도에서 보기"
      >
        <i className="fas fa-map-marker-alt text-xl"></i>
      </Button>
      
      <Button
        onClick={onPremiumUpgrade}
        className="w-14 h-14 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full shadow-lg transition-all hover:scale-110"
        title="프리미엄 업그레이드"
      >
        <i className="fas fa-crown text-xl"></i>
      </Button>
    </div>
  );
}
