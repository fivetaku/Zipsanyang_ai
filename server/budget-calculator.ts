import { UserProfile } from "@shared/schema";

export interface BudgetCalculationResult {
  maxLoanAmount: number; // 최대 대출 가능액 (만원)
  maxBudget: number; // 총 구매 가능 금액 (만원)
  ltvRatio: number; // LTV 비율 (%)
  dsrRatio: number; // DSR 비율 (%)
  monthlyPayment: number; // 월 상환액 (만원)
  explanation: string; // 계산 설명
}

export class BudgetCalculator {
  // 기본 설정값
  private static readonly DEFAULT_LTV_RATE = 0.8; // 생애최초 80%
  private static readonly DEFAULT_DSR_LIMIT = 0.4; // DSR 40% 제한
  private static readonly DEFAULT_INTEREST_RATE = 0.045; // 4.5% 금리
  private static readonly DEFAULT_LOAN_TERM = 30; // 30년
  private static readonly STRESS_DSR_ADDITION = 0.015; // 스트레스 DSR 1.5%p 추가

  /**
   * 사용자 프로필을 기반으로 예산을 계산합니다
   */
  static calculateBudget(profile: {
    purpose: string;
    annualSalary: number;
    availableCash: number;
    existingDebt?: number;
  }): BudgetCalculationResult {
    
    const { annualSalary, availableCash, existingDebt = 0, purpose } = profile;

    // 1. DSR 기반 대출 한도 계산
    const maxAnnualRepayment = annualSalary * this.DEFAULT_DSR_LIMIT;
    const availableAnnualRepayment = maxAnnualRepayment - existingDebt;

    // 스트레스 DSR 적용
    const stressInterestRate = this.DEFAULT_INTEREST_RATE + this.STRESS_DSR_ADDITION;
    const monthlyInterestRate = stressInterestRate / 12;
    const totalPayments = this.DEFAULT_LOAN_TERM * 12;

    // 원리금균등상환 공식으로 대출 가능액 계산
    const monthlyRepaymentCapacity = availableAnnualRepayment / 12;
    const loanCapacity = monthlyRepaymentCapacity * 
      ((1 - Math.pow(1 + monthlyInterestRate, -totalPayments)) / monthlyInterestRate);

    // 2. LTV 제한 고려
    const maxBudgetByLTV = availableCash / (1 - this.DEFAULT_LTV_RATE);
    const maxLoanByLTV = maxBudgetByLTV * this.DEFAULT_LTV_RATE;

    // 3. 실제 대출 가능액은 DSR과 LTV 중 낮은 값
    const maxLoanAmount = Math.min(loanCapacity, maxLoanByLTV);
    const maxBudget = availableCash + maxLoanAmount;

    // 4. 목적별 조정 (갭투자의 경우 전세금 고려)
    let adjustedMaxBudget = maxBudget;
    if (purpose === 'gap_investment') {
      // 갭투자의 경우 실제 필요 자금은 갭 금액만큼
      // 여기서는 기본 계산만 하고, 실제 추천에서 전세가를 고려
      adjustedMaxBudget = maxBudget;
    }

    // 5. 월 상환액 계산
    const monthlyPayment = maxLoanAmount > 0 ? 
      maxLoanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) /
      (Math.pow(1 + monthlyInterestRate, totalPayments) - 1) : 0;

    // 6. 설명 생성
    const explanation = this.generateExplanation({
      annualSalary,
      availableCash,
      maxLoanAmount,
      maxBudget: adjustedMaxBudget,
      dsrRatio: (monthlyPayment * 12) / annualSalary,
      ltvRatio: maxLoanAmount / adjustedMaxBudget,
      purpose
    });

    return {
      maxLoanAmount: Math.round(maxLoanAmount / 10000), // 만원 단위
      maxBudget: Math.round(adjustedMaxBudget / 10000), // 만원 단위
      ltvRatio: (maxLoanAmount / adjustedMaxBudget) * 100,
      dsrRatio: ((monthlyPayment * 12) / annualSalary) * 100,
      monthlyPayment: Math.round(monthlyPayment / 10000), // 만원 단위
      explanation
    };
  }

  /**
   * 갭투자용 예산 계산
   */
  static calculateGapInvestmentBudget(
    salePrice: number, 
    leasePrice: number, 
    availableCash: number, 
    maxLoanAmount: number
  ): boolean {
    const gap = salePrice - leasePrice;
    const requiredFunds = gap + (salePrice * 0.03); // 부대비용 3% 추가
    
    return requiredFunds <= (availableCash + maxLoanAmount);
  }

  /**
   * 계산 결과에 대한 설명 생성
   */
  private static generateExplanation(params: {
    annualSalary: number;
    availableCash: number;
    maxLoanAmount: number;
    maxBudget: number;
    dsrRatio: number;
    ltvRatio: number;
    purpose: string;
  }): string {
    const { annualSalary, availableCash, maxLoanAmount, maxBudget, dsrRatio, ltvRatio, purpose } = params;
    
    const salaryText = `연봉 ${Math.round(annualSalary / 10000)}억원`;
    const cashText = `보유현금 ${Math.round(availableCash / 10000)}억원`;
    const loanText = `최대 대출가능액 ${Math.round(maxLoanAmount / 10000)}억원`;
    const budgetText = `총 구매가능 금액 ${Math.round(maxBudget / 10000)}억원`;
    
    let explanation = `${salaryText}, ${cashText}을 기준으로 계산한 결과입니다.\n\n`;
    explanation += `DSR 40% 기준으로 ${loanText}까지 대출이 가능하며, `;
    explanation += `${budgetText}까지 구매하실 수 있습니다.\n\n`;
    
    if (purpose === 'gap_investment') {
      explanation += `갭투자의 경우 전세가를 제외한 갭 금액만 준비하시면 됩니다.`;
    } else {
      explanation += `실거주용으로 안정적인 대출 조건을 적용했습니다.`;
    }
    
    return explanation;
  }

  /**
   * 대출 상품별 상세 계산
   */
  static calculateLoanProducts(loanAmount: number, purpose: string) {
    const products = [];

    // 보금자리론 (정책모기지)
    if (purpose === 'residence' && loanAmount <= 50000) { // 5억 한도
      products.push({
        name: '보금자리론',
        interestRate: 3.2,
        maxAmount: Math.min(loanAmount, 50000),
        features: ['고정금리', '장기상환', '중도상환수수료 없음'],
        eligibility: '무주택자, 연소득 7천만원 이하'
      });
    }

    // 일반 주택담보대출
    products.push({
      name: '일반 주택담보대출',
      interestRate: 4.5,
      maxAmount: loanAmount,
      features: ['변동금리', '금리우대 가능'],
      eligibility: '소득증빙 가능자'
    });

    return products;
  }
}
