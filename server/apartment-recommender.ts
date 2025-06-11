import { db } from "./db";
import { apartmentComplexes, apartmentKeyInfo, apartmentBaseInfo, apartmentPriceList } from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

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
    limit: number = 10
  ): Promise<ApartmentRecommendation[]> {
    
    const { purpose, maxBudget, maxLoanAmount, availableCash, workLocation, preferredArea } = filters;
    
    // 1. 기본 필터링 쿼리 작성
    let whereConditions = [];
    
    if (purpose === 'residence') {
      // 실거주: 매매가가 예산 이하
      whereConditions.push(lte(apartmentKeyInfo.salePrice, maxBudget * 10000));
    } else if (purpose === 'gap_investment') {
      // 갭투자: 갭이 가용자금 이하
      whereConditions.push(
        and(
          sql`${apartmentKeyInfo.gap} IS NOT NULL`,
          lte(apartmentKeyInfo.gap, (availableCash + maxLoanAmount) * 10000)
        )
      );
    }
    
    // 거래 타입 필터링 (매매만)
    whereConditions.push(eq(apartmentKeyInfo.transactionType, 'sale'));
    
    // 지역 필터링
    if (preferredArea) {
      whereConditions.push(sql`${apartmentComplexes.sigungu} ILIKE ${`%${preferredArea}%`}`);
    }
    
    // 면적 필터링
    if (filters.minArea) {
      whereConditions.push(gte(apartmentKeyInfo.pyeong, filters.minArea));
    }
    if (filters.maxArea) {
      whereConditions.push(lte(apartmentKeyInfo.pyeong, filters.maxArea));
    }

    // 2. 조인 쿼리 실행
    const apartments = await db
      .select({
        complexNo: apartmentComplexes.complexNo,
        complexName: apartmentComplexes.complexName,
        dongName: apartmentComplexes.dongName,
        sigungu: apartmentComplexes.sigungu,
        salePrice: apartmentKeyInfo.salePrice,
        leasePrice: apartmentKeyInfo.leasePrice,
        gap: apartmentKeyInfo.gap,
        leaseRate: apartmentKeyInfo.leaseRate,
        exclusiveArea: apartmentKeyInfo.exclusiveArea,
        pyeong: apartmentKeyInfo.pyeong,
        changeFromPeak: apartmentKeyInfo.changeFromPeak,
        highestPrice: apartmentKeyInfo.highestPrice,
        latitude: apartmentBaseInfo.latitude,
        longitude: apartmentBaseInfo.longitude,
        recentSale: apartmentKeyInfo.recentSale,
      })
      .from(apartmentComplexes)
      .innerJoin(apartmentKeyInfo, eq(apartmentComplexes.complexNo, apartmentKeyInfo.complexNo))
      .leftJoin(apartmentBaseInfo, eq(apartmentComplexes.complexNo, apartmentBaseInfo.complexNo))
      .where(and(...whereConditions))
      .limit(limit * 2); // 여유분 확보

    // 3. 점수 계산 및 정렬
    const scoredApartments = apartments.map(apt => {
      const recommendation = this.calculateScore(apt, filters);
      return recommendation;
    });

    // 4. 점수순 정렬 및 상위 결과 반환
    const sortedApartments = scoredApartments
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // 5. 프리미엄 여부 설정 (1위는 무료, 나머지는 프리미엄)
    return sortedApartments.map((apt, index) => ({
      ...apt,
      isPremium: index > 0 // 첫 번째만 무료, 나머지는 프리미엄
    }));
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
    
    // 1. 가격 점수 (40점 만점)
    const priceScore = this.calculatePriceScore(apartment, filters);
    score += priceScore.score;
    if (priceScore.reason) reasons.push(priceScore.reason);
    
    // 2. 시장 회복률 점수 (30점 만점)
    const marketScore = this.calculateMarketScore(apartment);
    score += marketScore.score;
    if (marketScore.reason) reasons.push(marketScore.reason);
    
    // 3. 입지 점수 (20점 만점)
    const locationScore = this.calculateLocationScore(apartment, filters);
    score += locationScore.score;
    if (locationScore.reason) reasons.push(locationScore.reason);
    
    // 4. 갭투자 특화 점수 (10점 만점)
    if (filters.purpose === 'gap_investment') {
      const gapScore = this.calculateGapScore(apartment);
      score += gapScore.score;
      if (gapScore.reason) reasons.push(gapScore.reason);
    } else {
      // 실거주 특화 점수
      const residenceScore = this.calculateResidenceScore(apartment);
      score += residenceScore.score;
      if (residenceScore.reason) reasons.push(residenceScore.reason);
    }

    // 출퇴근 시간 계산 (임시 - 실제로는 지도 API 필요)
    const commutingTime = this.estimateCommutingTime(apartment, filters.workLocation);

    return {
      complexNo: apartment.complexNo,
      complexName: apartment.complexName,
      dongName: apartment.dongName,
      sigungu: apartment.sigungu,
      salePrice: Math.round(apartment.salePrice / 10000), // 만원 -> 억원
      leasePrice: apartment.leasePrice ? Math.round(apartment.leasePrice / 10000) : undefined,
      gap: apartment.gap ? Math.round(apartment.gap / 10000) : undefined,
      leaseRate: apartment.leaseRate ? Number(apartment.leaseRate) : undefined,
      exclusiveArea: Number(apartment.exclusiveArea),
      pyeong: Number(apartment.pyeong),
      changeFromPeak: Number(apartment.changeFromPeak),
      highestPrice: Math.round(apartment.highestPrice / 10000),
      latitude: apartment.latitude ? Number(apartment.latitude) : undefined,
      longitude: apartment.longitude ? Number(apartment.longitude) : undefined,
      score: Math.round(score * 10) / 10,
      reasons,
      commutingTime,
      isPremium: false // 나중에 설정
    };
  }

  /**
   * 가격 점수 계산
   */
  private static calculatePriceScore(apartment: any, filters: RecommendationFilters) {
    const { purpose, maxBudget, availableCash, maxLoanAmount } = filters;
    let score = 0;
    let reason = '';

    if (purpose === 'residence') {
      const priceRatio = apartment.salePrice / (maxBudget * 10000);
      if (priceRatio <= 0.7) {
        score = 40;
        reason = '예산 대비 매우 저렴한 가격';
      } else if (priceRatio <= 0.85) {
        score = 30;
        reason = '예산 대비 적정한 가격';
      } else if (priceRatio <= 1.0) {
        score = 20;
        reason = '예산 한도 내 가격';
      }
    } else {
      // 갭투자의 경우 갭 비율로 계산
      const gapRatio = apartment.gap / ((availableCash + maxLoanAmount) * 10000);
      if (gapRatio <= 0.5) {
        score = 40;
        reason = '매우 적은 갭으로 투자 가능';
      } else if (gapRatio <= 0.8) {
        score = 30;
        reason = '적정한 갭으로 투자 가능';
      } else if (gapRatio <= 1.0) {
        score = 20;
        reason = '갭 한도 내 투자 가능';
      }
    }

    return { score, reason };
  }

  /**
   * 시장 회복률 점수 계산
   */
  private static calculateMarketScore(apartment: any) {
    const changeFromPeak = Number(apartment.changeFromPeak) || 0;
    let score = 0;
    let reason = '';

    if (changeFromPeak >= 95) {
      score = 30;
      reason = '전고점 대비 높은 회복률';
    } else if (changeFromPeak >= 85) {
      score = 25;
      reason = '전고점 대비 양호한 회복률';
    } else if (changeFromPeak >= 75) {
      score = 20;
      reason = '전고점 대비 보통 회복률';
    } else if (changeFromPeak >= 65) {
      score = 15;
      reason = '향후 상승 여력 있음';
    } else {
      score = 10;
      reason = '큰 상승 여력 보유';
    }

    return { score, reason };
  }

  /**
   * 입지 점수 계산
   */
  private static calculateLocationScore(apartment: any, filters: RecommendationFilters) {
    let score = 0;
    let reason = '';

    // 지역별 점수 (임시 - 실제로는 더 정교한 로직 필요)
    const premiumAreas = ['강남구', '서초구', '송파구', '강동구'];
    const goodAreas = ['마포구', '용산구', '성동구', '광진구'];
    
    if (premiumAreas.includes(apartment.sigungu)) {
      score = 20;
      reason = '프리미엄 입지';
    } else if (goodAreas.includes(apartment.sigungu)) {
      score = 15;
      reason = '우수한 입지';
    } else {
      score = 10;
      reason = '양호한 입지';
    }

    return { score, reason };
  }

  /**
   * 갭투자 점수 계산
   */
  private static calculateGapScore(apartment: any) {
    const leaseRate = Number(apartment.leaseRate) || 0;
    let score = 0;
    let reason = '';

    if (leaseRate >= 80) {
      score = 10;
      reason = '높은 전세가율로 갭투자 유리';
    } else if (leaseRate >= 70) {
      score = 8;
      reason = '양호한 전세가율';
    } else if (leaseRate >= 60) {
      score = 6;
      reason = '적정한 전세가율';
    } else {
      score = 4;
      reason = '갭투자 가능';
    }

    return { score, reason };
  }

  /**
   * 실거주 점수 계산
   */
  private static calculateResidenceScore(apartment: any) {
    const pyeong = Number(apartment.pyeong) || 0;
    let score = 0;
    let reason = '';

    if (pyeong >= 25) {
      score = 10;
      reason = '넓은 면적으로 실거주 적합';
    } else if (pyeong >= 20) {
      score = 8;
      reason = '적정한 면적';
    } else {
      score = 6;
      reason = '콤팩트한 면적';
    }

    return { score, reason };
  }

  /**
   * 출퇴근 시간 추정 (임시 구현)
   */
  private static estimateCommutingTime(apartment: any, workLocation?: string): number {
    if (!workLocation) return 30; // 기본값

    // 임시 로직 - 실제로는 지도 API 필요
    const workAreas: { [key: string]: number } = {
      '강남': 25,
      '여의도': 35,
      '을지로': 40,
      '종로': 45,
      '강북': 50
    };

    for (const [area, time] of Object.entries(workAreas)) {
      if (workLocation.includes(area)) {
        return time;
      }
    }

    return 35; // 기본값
  }

  /**
   * 추천 이유 텍스트 생성
   */
  static generateRecommendationReason(apartment: ApartmentRecommendation, filters: RecommendationFilters): string {
    const reasons = apartment.reasons;
    const purpose = filters.purpose === 'residence' ? '실거주' : '갭투자';
    
    let text = `${apartment.complexName}은 ${purpose} 목적에 적합한 매물입니다.\n\n`;
    
    reasons.forEach((reason, index) => {
      text += `${index + 1}. ${reason}\n`;
    });
    
    if (apartment.commutingTime) {
      text += `\n출퇴근 시간: 약 ${apartment.commutingTime}분`;
    }
    
    return text;
  }
}
