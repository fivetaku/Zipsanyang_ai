
# 집사냥 AI 시스템 워크플로우 다이어그램

## 1. 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "Frontend (React)"
        A[모바일 웹앱]
        B[채팅 인터페이스]
        C[지도 모달]
        D[아파트 카드]
    end
    
    subgraph "Backend (Express.js)"
        E[API 라우터]
        F[ChatGPT Service]
        G[Apartment Recommender]
        H[Budget Calculator]
    end
    
    subgraph "External Services"
        I[OpenAI GPT-4o]
        J[Kakao Maps API]
    end
    
    subgraph "Database (PostgreSQL)"
        K[apartments]
        L[apartmentPrices]
        M[chatSessions]
        N[chatMessages]
    end
    
    A --> B
    B --> E
    E --> F
    E --> G
    E --> H
    F --> I
    A --> C
    C --> J
    E --> K
    E --> L
    E --> M
    E --> N
```

## 2. 채팅 메시지 처리 워크플로우

```mermaid
sequenceDiagram
    participant U as 사용자
    participant F as Frontend
    participant API as Express API
    participant AI as OpenAI Service
    participant DB as PostgreSQL
    participant R as Recommender

    U->>F: 메시지 입력
    F->>API: POST /api/chat/:sessionId/message
    
    API->>DB: 사용자 메시지 저장
    API->>API: 세션 정보 조회
    
    API->>AI: extractUserInfo(message)
    AI-->>API: 추출된 사용자 정보
    
    API->>API: 사용자 프로필 업데이트
    
    alt 충분한 정보가 있는 경우
        API->>API: calculateFinancialAnalysis()
        API->>DB: 재정 분석 결과 저장
        API->>R: getApartmentRecommendations()
        R-->>API: Top 3 추천 결과
    end
    
    API->>AI: generateResponse(context)
    AI-->>API: AI 응답
    
    API->>DB: AI 응답 저장
    API-->>F: 응답 + 추천 결과
    F-->>U: 채팅 화면 업데이트
```

## 3. 아파트 추천 알고리즘 상세 워크플로우

```mermaid
flowchart TD
    A[사용자 프로필 입력] --> B{충분한 정보?}
    B -->|아니오| C[추가 정보 요청]
    B -->|예| D[재정 분석 실행]
    
    D --> E[최대 대출액 계산]
    D --> F[최대 예산 산정]
    
    E --> G[1차 필터링: 예산 범위]
    F --> G
    
    G --> H[아파트 후보군 조회]
    H --> I{매매 목적 확인}
    
    I -->|실거주| J[실거주 점수 계산]
    I -->|갭투자| K[갭투자 점수 계산]
    
    J --> L[출퇴근 편의성 가중치]
    J --> M[생활 인프라 가중치]
    L --> N[종합 점수 계산]
    M --> N
    
    K --> O[수익률 가중치]
    K --> P[상승 잠재력 가중치]
    O --> Q[종합 점수 계산]
    P --> Q
    
    N --> R[Top 3 선정]
    Q --> R
    
    R --> S[1위: 무료 공개]
    R --> T[2-3위: 프리미엄]
    
    S --> U[상세 정보 제공]
    T --> V[제한된 정보 제공]
    
    U --> W[추천 이유 생성]
    V --> W
    W --> X[최종 추천 결과]
```

## 4. 정보 추출 및 분석 프로세스

```mermaid
graph LR
    A[사용자 자연어 입력] --> B[OpenAI API 호출]
    B --> C[정보 추출 프롬프트]
    C --> D[구조화된 데이터 반환]
    
    D --> E{추출된 정보}
    E --> F[매매 목적]
    E --> G[연봉]
    E --> H[보유 현금]
    E --> I[출퇴근 지역]
    
    F --> J[사용자 프로필 업데이트]
    G --> J
    H --> J
    I --> J
    
    J --> K{재정 분석 가능?}
    K -->|예| L[LTV/DSR 계산]
    K -->|아니오| M[추가 정보 요청]
    
    L --> N[최대 대출액 산정]
    L --> O[월 상환액 계산]
    L --> P[최대 예산 결정]
```

## 5. 데이터베이스 상호작용 다이어그램

```mermaid
erDiagram
    chatSessions ||--o{ chatMessages : has
    apartments ||--o{ apartmentPrices : has
    chatSessions ||--o{ recommendations : generates
    
    chatSessions {
        string sessionId PK
        object userProfile
        number maxBudget
        number maxLoan
        timestamp createdAt
        timestamp updatedAt
    }
    
    chatMessages {
        number id PK
        string sessionId FK
        string role
        text content
        object metadata
        timestamp createdAt
    }
    
    apartments {
        number complexNo PK
        string complexName
        string sigungu
        string dongName
        number latitude
        number longitude
        number totalHouseHoldCount
    }
    
    apartmentPrices {
        number id PK
        number complexNo FK
        string transactionType
        number salePrice
        number leasePrice
        number gap
        number leaseRate
        number changeFromPeak
    }
```

## 6. 프리미엄 기능 워크플로우

```mermaid
flowchart TD
    A[추천 결과 생성] --> B[순위별 분류]
    B --> C[1위 아파트]
    B --> D[2-3위 아파트]
    
    C --> E[전체 정보 공개]
    E --> F[상세 설명 제공]
    E --> G[지도 위치 표시]
    E --> H[가격 정보 공개]
    
    D --> I[제한된 정보 공개]
    I --> J[단지명만 표시]
    I --> K[위치 블러 처리]
    I --> L[프리미엄 안내 메시지]
    
    L --> M{사용자 반응}
    M -->|관심 표시| N[프리미엄 업그레이드 유도]
    M -->|무시| O[다른 정보 제공]
    
    N --> P[결제 페이지 안내]
    P --> Q[프리미엄 기능 활성화]
```

## 7. 지도 연동 워크플로우

```mermaid
sequenceDiagram
    participant U as 사용자
    participant F as Frontend
    participant K as Kakao Maps
    participant API as Backend API
    
    U->>F: "지도 보기" 클릭
    F->>F: 지도 모달 오픈
    F->>K: Kakao Maps 초기화
    
    F->>API: 추천 아파트 위치 정보 요청
    API-->>F: 위도/경도 데이터
    
    F->>K: 마커 생성 및 표시
    K-->>F: 지도 렌더링 완료
    
    U->>K: 마커 클릭
    K->>F: 마커 클릭 이벤트
    F->>F: 아파트 정보 팝업 표시
    
    U->>F: 지도 닫기
    F->>F: 채팅화면으로 복귀
```

## 8. 성능 최적화 포인트

```mermaid
mindmap
  root((성능 최적화))
    Frontend
      React 메모이제이션
      번들 크기 최적화
      이미지 최적화
      캐싱 전략
    Backend
      DB 쿼리 최적화
      API 응답 캐싱
      연결 풀링
      인덱스 최적화
    AI Service
      프롬프트 최적화
      응답 시간 단축
      토큰 사용량 최적화
      배치 처리
    Database
      쿼리 성능 튜닝
      인덱스 전략
      파티셔닝
      백업 전략
```

이 다이어그램들은 현재 구현된 시스템의 실제 워크플로우를 상세히 보여줍니다. Dify 대신 직접 OpenAI API를 연동하고, 자체 개발한 필터링 및 추천 알고리즘을 사용하는 현재 아키텍처를 정확히 반영했습니다.
