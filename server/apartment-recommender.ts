import { db } from "./db";
import { apartments, apartmentPrices } from "@shared/schema";
import { eq, and, lte, gte, desc, sql } from "drizzle-orm";

export interface RecommendationFilters {
  purpose: 'residence' | 'gap_investment';
  maxBudget: number; // 만원 단위
  maxLoanAmount: number; // 만원 단위
  availableCash: number; // 만원 단위
  workLocation?: string;
  preferredArea?: string;
  minArea?: number; // 평수
  maxArea?: number; // 평수
}

export interface ApartmentRecommendation {
  complexNo: number;
  complexName: string;
  dongName: string;
  sigungu: string;
  salePrice: number;
  leasePrice?: number;
  gap?: number;
  leaseRate?: number;
  exclusiveArea: number;
  pyeong: number;
  changeFromPeak: number;
  highestPrice: number;
  latitude?: number;
  longitude?: number;
  score: number;
  reasons: string[];
  commutingTime?: number;
  isPremium: boolean;
}

export class ApartmentRecommender {
  /**
   * 사용자 조건에 맞는 아파트 추천
   */
  static async getRecommendations(
    filters: RecommendationFilters,
    limit: number = 3
  ): Promise<ApartmentRecommendation[]> {
    try {
      // 기본 쿼리 조건 설정
      const baseConditions = [eq(apartmentPrices.transactionType, '매매')];

      // 예산 필터링
      if (filters.purpose === 'gap_investment') {
        // 갭투자: 갭 금액이 사용 가능한 현금 + 대출 이내
        baseConditions.push(lte(apartmentPrices.gap, filters.maxBudget));
      } else {
        // 실거주: 매매가가 총 예산 이내
        baseConditions.push(lte(apartmentPrices.salePrice, filters.maxBudget));
      }

      // 지역 필터링
      if (filters.preferredArea) {
        baseConditions.push(sql`${apartments.sigungu} ILIKE ${`%${filters.preferredArea}%`}`);
      }

      // 면적 필터링
      if (filters.minArea) {
        baseConditions.push(gte(sql`CAST(${apartmentPrices.pyeong} AS NUMERIC)`, filters.minArea));
      }
      if (filters.maxArea) {
        baseConditions.push(lte(sql`CAST(${apartmentPrices.pyeong} AS NUMERIC)`, filters.maxArea));
      }

      // 아파트 데이터 조회
      const candidateApartments = await db
        .select({
          complexNo: apartments.complexNo,
          complexName: apartments.complexName,
          dongName: apartments.dongName,
          sigungu: apartments.sigungu,
          detailAddress: apartments.detailAddress,
          latitude: apartments.latitude,
          longitude: apartments.longitude,
          useApproveYmd: apartments.useApproveYmd,
          totalHouseHoldCount: apartments.totalHouseHoldCount,
          salePrice: apartmentPrices.salePrice,
          leasePrice: apartmentPrices.leasePrice,
          gap: apartmentPrices.gap,
          leaseRate: apartmentPrices.leaseRate,
          changeFromPeak: apartmentPrices.changeFromPeak,
          exclusiveArea: apartmentPrices.exclusiveArea,
          pyeong: apartmentPrices.pyeong,
          highestPrice: apartmentPrices.highestPrice,
        })
        .from(apartments)
        .innerJoin(apartmentPrices, eq(apartments.complexNo, apartmentPrices.complexNo))
        .where(and(...baseConditions))
        .orderBy(desc(apartmentPrices.changeFromPeak))
        .limit(50);

      if (candidateApartments.length === 0) {
        return [];
      }

      // 점수 계산 및 정렬
      const scoredApartments = candidateApartments.map(apt => 
        this.calculateScore(apt, filters)
      );

      // 상위 추천 아파트 선별
      const topApartments = scoredApartments
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return topApartments;

    } catch (error) {
      console.error("Error getting apartment recommendations:", error);
      return [];
    }
  }

  /**
   * 아파트 점수 계산 알고리즘
   */
  private static calculateScore(
    apartment: any,
    filters: RecommendationFilters
  ): ApartmentRecommendation {
    let score = 0;
    const reasons: string[] = [];

    // 1. 가격 점수 (30점 만점)
    const priceScore = this.calculatePriceScore(apartment, filters);
    score += priceScore;
    if (priceScore > 20) {
      reasons.push("예산 대비 합리적인 가격");
    }

    // 2. 시장 회복률 점수 (25점 만점)
    const marketScore = this.calculateMarketScore(apartment);
    score += marketScore;
    if (marketScore > 15) {
      reasons.push("고점 대비 양호한 회복률");
    }

    // 3. 입지 점수 (20점 만점)
    const locationScore = this.calculateLocationScore(apartment, filters);
    score += locationScore;
    if (locationScore > 10) {
      reasons.push("좋은 입지 조건");
    }

    // 4. 목적별 특화 점수 (25점 만점)
    let purposeScore = 0;
    if (filters.purpose === 'gap_investment') {
      purposeScore = this.calculateGapScore(apartment);
      if (purposeScore > 15) {
        reasons.push("갭투자에 유리한 조건");
      }
    } else {
      purposeScore = this.calculateResidenceScore(apartment);
      if (purposeScore > 15) {
        reasons.push("실거주에 적합한 환경");
      }
    }
    score += purposeScore;

    // 출퇴근 시간 추정
    const commutingTime = this.estimateCommutingTime(apartment, filters.workLocation);

    return {
      complexNo: apartment.complexNo,
      complexName: apartment.complexName,
      dongName: apartment.dongName,
      sigungu: apartment.sigungu,
      salePrice: apartment.salePrice || 0,
      leasePrice: apartment.leasePrice || 0,
      gap: apartment.gap || 0,
      leaseRate: parseFloat(apartment.leaseRate) || 0,
      exclusiveArea: parseFloat(apartment.exclusiveArea) || 0,
      pyeong: parseFloat(apartment.pyeong) || 0,
      changeFromPeak: parseFloat(apartment.changeFromPeak) || 0,
      highestPrice: apartment.highestPrice || 0,
      latitude: parseFloat(apartment.latitude) || 0,
      longitude: parseFloat(apartment.longitude) || 0,
      score: Math.round(score * 10) / 10,
      reasons,
      commutingTime,
      isPremium: false // 첫 번째만 무료, 나머지는 프리미엄
    };
  }

  /**
   * 가격 점수 계산
   */
  private static calculatePriceScore(apartment: any, filters: RecommendationFilters) {
    let score = 0;
    
    if (filters.purpose === 'gap_investment') {
      const gap = apartment.gap || 0;
      const budgetUtilization = gap / filters.maxBudget;
      
      // 예산의 70-95% 사용시 최고점
      if (budgetUtilization >= 0.7 && budgetUtilization <= 0.95) {
        score += 30;
      } else if (budgetUtilization >= 0.5 && budgetUtilization < 0.7) {
        score += 20;
      } else if (budgetUtilization < 0.5) {
        score += 10;
      }
    } else {
      const salePrice = apartment.salePrice || 0;
      const budgetUtilization = salePrice / filters.maxBudget;
      
      // 예산의 80-95% 사용시 최고점
      if (budgetUtilization >= 0.8 && budgetUtilization <= 0.95) {
        score += 30;
      } else if (budgetUtilization >= 0.6 && budgetUtilization < 0.8) {
        score += 20;
      } else if (budgetUtilization < 0.6) {
        score += 10;
      }
    }
    
    return score;
  }

  /**
   * 시장 회복률 점수 계산
   */
  private static calculateMarketScore(apartment: any) {
    const recoveryRate = parseFloat(apartment.changeFromPeak) || 0;
    
    if (recoveryRate >= 90) {
      return 25; // 완전 회복
    } else if (recoveryRate >= 85) {
      return 20; // 양호한 회복
    } else if (recoveryRate >= 80) {
      return 15; // 보통 회복
    } else if (recoveryRate >= 75) {
      return 10; // 낮은 회복
    } else {
      return 5; // 매우 낮은 회복
    }
  }

  /**
   * 입지 점수 계산
   */
  private static calculateLocationScore(apartment: any, filters: RecommendationFilters) {
    let score = 0;
    
    // 구별 프리미엄 점수
    const sigungu = apartment.sigungu || '';
    if (sigungu.includes('강남구') || sigungu.includes('서초구')) {
      score += 15;
    } else if (sigungu.includes('송파구') || sigungu.includes('영등포구')) {
      score += 12;
    } else if (sigungu.includes('마포구') || sigungu.includes('성동구')) {
      score += 10;
    } else {
      score += 8;
    }

    // 출퇴근 지역 근접성
    if (filters.workLocation && sigungu.includes(filters.workLocation)) {
      score += 5;
    }

    return score;
  }

  /**
   * 갭투자 점수 계산
   */
  private static calculateGapScore(apartment: any) {
    let score = 0;
    const leaseRate = parseFloat(apartment.leaseRate) || 0;
    
    // 전세가율이 높을수록 갭투자에 유리
    if (leaseRate >= 75) {
      score += 25;
    } else if (leaseRate >= 70) {
      score += 20;
    } else if (leaseRate >= 65) {
      score += 15;
    } else if (leaseRate >= 60) {
      score += 10;
    } else {
      score += 5;
    }
    
    return score;
  }

  /**
   * 실거주 점수 계산
   */
  private static calculateResidenceScore(apartment: any) {
    let score = 0;
    
    // 전용면적 점수 (실거주는 적당한 크기 선호)
    const pyeong = parseFloat(apartment.pyeong) || 0;
    if (pyeong >= 25 && pyeong <= 35) {
      score += 15; // 25-35평이 실거주에 최적
    } else if (pyeong >= 20 && pyeong <= 40) {
      score += 12;
    } else {
      score += 8;
    }

    // 세대수 점수 (너무 크지 않은 단지 선호)
    const totalHouseHoldCount = apartment.totalHouseHoldCount || 0;
    if (totalHouseHoldCount >= 500 && totalHouseHoldCount <= 2000) {
      score += 10;
    } else if (totalHouseHoldCount < 500 || totalHouseHoldCount > 3000) {
      score += 5;
    } else {
      score += 8;
    }

    return score;
  }

  /**
   * 출퇴근 시간 추정 (임시 구현)
   */
  private static estimateCommutingTime(apartment: any, workLocation?: string): number {
    if (!workLocation) return 35;

    const sigungu = apartment.sigungu || '';
    
    // 간단한 출퇴근 시간 추정 로직
    if (workLocation.includes('강남') && sigungu.includes('강남구')) {
      return 15;
    } else if (workLocation.includes('여의도') && sigungu.includes('영등포구')) {
      return 20;
    } else if (workLocation.includes('종로') && sigungu.includes('성동구')) {
      return 25;
    } else {
      return 35;
    }
  }

  /**
   * 추천 이유 텍스트 생성
   */
  static generateRecommendationReason(apartment: ApartmentRecommendation, filters: RecommendationFilters): string {
    const reasons = apartment.reasons;
    const purpose = filters.purpose === 'residence' ? '실거주' : '갭투자';
    
    let reasonText = `${purpose} 목적에 적합한 아파트입니다. `;
    
    if (reasons.length > 0) {
      reasonText += reasons.slice(0, 2).join(', ') + '이 주요 추천 이유입니다.';
    }
    
    return reasonText;
  }
}