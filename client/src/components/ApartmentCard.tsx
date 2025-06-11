import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart, Crown } from "lucide-react";

interface ApartmentCardProps {
  apartment: {
    complexNo: number;
    complexName: string;
    location: string;
    salePrice: number;
    gap?: number;
    leasePrice?: number;
    score: number;
    reasons: string[];
    commuteTime?: number;
    latitude?: number;
    longitude?: number;
  };
  rank: number;
  isBlurred?: boolean;
  isPremium?: boolean;
}

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1: return "bg-green-500";
    case 2: return "bg-blue-500";
    case 3: return "bg-purple-500";
    default: return "bg-gray-500";
  }
};

const getCommuteColor = (time?: number) => {
  if (!time) return "text-gray-600";
  if (time <= 20) return "text-green-600";
  if (time <= 30) return "text-yellow-600";
  return "text-red-600";
};

export default function ApartmentCard({ apartment, rank, isBlurred, isPremium }: ApartmentCardProps) {
  const formatPrice = (price: number) => {
    return `${(price / 10000).toFixed(1)}억원`;
  };

  return (
    <div className="relative min-w-[300px]">
      <Card className={`overflow-hidden ${isBlurred ? "filter blur-sm" : ""}`}>
        <div className="relative">
          {/* Using a placeholder image service for apartment photos */}
          <img 
            src={`https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200&q=80`}
            alt={apartment.complexName}
            className="w-full h-32 object-cover"
          />
          <Badge className={`absolute top-3 left-3 ${getRankColor(rank)} text-white`}>
            #{rank} 추천
          </Badge>
        </div>
        
        <CardContent className="p-4">
          <h4 className="font-bold text-lg text-gray-800 mb-1">
            {apartment.complexName}
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            {apartment.location} • 84㎡
          </p>
          
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">매매가:</span>
              <span className="font-semibold text-gray-800">
                {formatPrice(apartment.salePrice)}
              </span>
            </div>
            
            {apartment.gap && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">갭:</span>
                <span className="font-semibold text-blue-600">
                  {formatPrice(apartment.gap)}
                </span>
              </div>
            )}
            
            {apartment.commuteTime && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">출퇴근 시간:</span>
                <span className={`font-semibold ${getCommuteColor(apartment.commuteTime)}`}>
                  {apartment.commuteTime}분
                </span>
              </div>
            )}
          </div>

          {!isBlurred && apartment.reasons.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">추천 이유:</p>
              <div className="flex flex-wrap gap-1">
                {apartment.reasons.map((reason, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button 
              className="flex-1 bg-accent hover:bg-blue-600 text-white text-sm"
              disabled={isBlurred}
            >
              <MapPin className="h-4 w-4 mr-1" />
              지도에서 보기
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="px-3"
              disabled={isBlurred}
            >
              <Heart className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Premium Overlay */}
      {isBlurred && !isPremium && (
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/20 to-transparent flex items-center justify-center">
          <Badge className="bg-yellow-400 text-white px-4 py-2 font-semibold shadow-lg">
            <Crown className="h-4 w-4 mr-2" />
            프리미엄으로 보기
          </Badge>
        </div>
      )}
    </div>
  );
}
