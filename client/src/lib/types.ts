export interface ChatMessage {
  id?: number;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    apartments?: any[];
    financialAnalysis?: FinancialAnalysis;
    recommendations?: ApartmentRecommendation[];
  };
  createdAt?: string;
}

export interface UserProfile {
  purpose?: 'residence' | 'gap_investment';
  salary?: number;
  cash?: number;
  workLocation?: string;
  preferredArea?: string;
  debt?: number;
}

export interface FinancialAnalysis {
  maxLoan: number;
  maxBudget: number;
  dsr: number;
  ltv: number;
  loanDetails: {
    monthlyPayment: number;
    interestRate: number;
    loanTerm: number;
  };
}

export interface ApartmentRecommendation {
  complexNo: number;
  complexName: string;
  sigungu: string;
  dongName: string;
  detailAddress?: string;
  latitude?: string;
  longitude?: string;
  useApproveYmd?: string;
  salePrice?: number;
  leasePrice?: number;
  gap?: number;
  leaseRate?: number;
  changeFromPeak?: number;
  exclusiveArea?: number;
  highestPrice?: number;
  rank: number;
  score?: number;
  reason?: string;
  isPremium: boolean;
}

export interface ChatSession {
  id: number;
  sessionId: string;
  userProfile?: UserProfile;
  maxBudget?: number;
  maxLoan?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Apartment {
  id: number;
  complexNo: number;
  complexName: string;
  dongName: string;
  sigungu: string;
  detailAddress: string;
  latitude?: string;
  longitude?: string;
  useApproveYmd?: string;
  totalHouseHoldCount?: number;
  totalDongCount?: number;
  city?: string;
  gu?: string;
  dong?: string;
}

export interface ApartmentPrice {
  id: number;
  complexNo: number;
  transactionType: string;
  exclusiveArea?: string;
  pyeong?: string;
  lowFloorPrice?: number;
  salePrice?: number;
  leasePrice?: number;
  gap?: number;
  leaseRate?: string;
  recentSale?: string;
  highestPrice?: number;
  changeFromPeak?: string;
  realPriceFloor?: number;
  realPriceRepresentativeArea?: number;
  realPriceExclusiveArea?: number;
}
