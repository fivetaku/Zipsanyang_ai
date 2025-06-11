import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

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
  reason: string;
  score: number;
  isPremium: boolean;
}

export class ChatGPTService {
  private systemPrompt = `
당신은 "집사 냥"이라는 친근한 아파트 매매 전문가 캐릭터입니다.

역할과 성격:
- 한국의 아파트 매매에 특화된 AI 어드바이저
- 친근하고 신뢰할 수 있는 전문가 톤
- 복잡한 부동산 정보를 쉽게 설명
- 사용자의 재정 상황과 목적에 맞는 맞춤형 조언 제공

전문 분야:
1. 아파트 매매 (실거주/갭투자)
2. 주택담보대출 (LTV/DSR 계산)
3. 부동산 시장 분석
4. 투자 가치 평가

대화 스타일:
- 이모지 적절히 사용 (🏠, 💰, 📊 등)
- 친근한 반말 사용
- 전문적이지만 이해하기 쉬운 설명
- 사용자의 상황에 공감하는 태도

주요 수집 정보:
- 매매 목적 (실거주/갭투자)
- 연봉
- 보유 현금
- 출퇴근 지역
- 선호 지역
- 기존 부채

응답 시 고려사항:
- 항상 사용자의 안전한 투자를 우선
- 리스크에 대한 충분한 안내
- 개인정보는 저장하지 않음을 명시
- 프리미엄 서비스 자연스럽게 안내
`;

  async generateResponse(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    userProfile?: UserProfile,
    context?: any
  ): Promise<string> {
    try {
      const messages: any[] = [
        { role: "system", content: this.systemPrompt }
      ];

      // Add conversation history
      messages.push(...conversationHistory.slice(-10)); // Keep last 10 messages for context

      // Add current user message
      messages.push({ role: "user", content: userMessage });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0].message.content || "죄송해요, 응답을 생성할 수 없어요. 다시 한 번 말씀해 주세요.";
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw new Error("채팅 응답 생성에 실패했습니다.");
    }
  }

  async extractUserInfo(message: string): Promise<Partial<UserProfile>> {
    try {
      const prompt = `
다음 사용자 메시지에서 아파트 매매 관련 정보를 추출해주세요.
추출할 정보:
- purpose: "residence" (실거주) 또는 "gap_investment" (갭투자)
- salary: 연봉 (숫자만, 만원 단위)
- cash: 보유 현금 (숫자만, 만원 단위)
- workLocation: 출퇴근 지역
- preferredArea: 선호 지역
- debt: 기존 부채 (숫자만, 만원 단위)

사용자 메시지: "${message}"

JSON 형태로만 응답해주세요. 정보가 없으면 해당 필드를 제외하세요.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result;
    } catch (error) {
      console.error("Error extracting user info:", error);
      return {};
    }
  }

  calculateFinancialAnalysis(userProfile: UserProfile): FinancialAnalysis {
    const { salary = 0, cash = 0, debt = 0, purpose } = userProfile;
    
    // DSR 계산 (40% 제한)
    const maxAnnualPayment = salary * 0.4 - (debt * 0.1); // 기존 부채의 연간 상환액 고려
    
    // 대출 조건 설정
    const interestRate = 0.05; // 5% 가정
    const loanTerm = 30; // 30년
    const monthlyRate = interestRate / 12;
    const totalPayments = loanTerm * 12;
    
    // 월 상환 가능 금액
    const maxMonthlyPayment = maxAnnualPayment / 12;
    
    // 대출 원금 계산 (PMT 공식의 역계산)
    const maxLoan = maxMonthlyPayment * ((1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate) * 10000; // 만원 단위
    
    // LTV 적용 (무주택자 80% 가정, 최대 6억원)
    const ltvLimit = Math.min(maxLoan, 60000); // 6억원 한도
    
    // 최대 예산 계산
    let maxBudget: number;
    
    if (purpose === 'gap_investment') {
      // 갭투자의 경우: 현금 + 대출 가능액이 갭에 해당
      maxBudget = cash + ltvLimit;
    } else {
      // 실거주의 경우: 현금 + 대출을 통한 전체 구매가
      maxBudget = cash + ltvLimit;
    }
    
    return {
      maxLoan: Math.floor(ltvLimit),
      maxBudget: Math.floor(maxBudget),
      dsr: (maxAnnualPayment / salary) * 100,
      ltv: 80, // 무주택자 기준
      loanDetails: {
        monthlyPayment: Math.floor(maxMonthlyPayment),
        interestRate: interestRate * 100,
        loanTerm: loanTerm
      }
    };
  }

  async generateRecommendationReasons(
    apartment: any,
    userProfile: UserProfile,
    rank: number
  ): Promise<string> {
    try {
      const prompt = `
사용자 프로필:
- 목적: ${userProfile.purpose === 'residence' ? '실거주' : '갭투자'}
- 연봉: ${userProfile.salary}만원
- 현금: ${userProfile.cash}만원
- 출퇴근지: ${userProfile.workLocation}

아파트 정보:
- 이름: ${apartment.complexName}
- 위치: ${apartment.sigungu} ${apartment.dongName}
- 매매가: ${apartment.salePrice}만원
- 전세가: ${apartment.leasePrice}만원
- 갭: ${apartment.gap}만원
- 전세가율: ${apartment.leaseRate}%
- 고점 대비 회복률: ${apartment.changeFromPeak}%

이 아파트가 ${rank}순위로 추천되는 이유를 친근한 톤으로 2-3문장으로 설명해주세요.
사용자의 목적과 재정 상황을 고려한 구체적인 이유를 포함해주세요.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      });

      return response.choices[0].message.content || `${apartment.complexName}는 좋은 투자처예요!`;
    } catch (error) {
      console.error("Error generating recommendation reason:", error);
      return `${apartment.complexName}는 추천드릴 만한 좋은 단지예요!`;
    }
  }
}

export const chatGPTService = new ChatGPTService();
