import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { 
  apartments, 
  apartmentPrices, 
  chatSessions, 
  chatMessages, 
  recommendations,
  insertChatSessionSchema,
  insertChatMessageSchema,
} from "@shared/schema";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { chatGPTService, type UserProfile } from "./openai";
import { ApartmentRecommender, type RecommendationFilters } from "./apartment-recommender";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Start a new chat session
  app.post("/api/chat/session", async (req, res) => {
    try {
      const sessionId = nanoid();
      
      const [session] = await db.insert(chatSessions)
        .values({
          sessionId,
          userProfile: {},
          maxBudget: null,
          maxLoan: null,
        })
        .returning();

      // Add welcome message
      await db.insert(chatMessages).values({
        sessionId,
        role: "assistant",
        content: "안녕하세요! 저는 집사 냥이에요 🏠✨\n\n아파트 매매가 처음이시거나 어려우시죠? 걱정 마세요! 제가 여러분의 상황에 맞는 최적의 아파트를 찾아드릴게요.",
        metadata: {}
      });

      res.json({ sessionId, message: "세션이 생성되었습니다." });
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ error: "세션 생성에 실패했습니다." });
    }
  });

  // Get chat history
  app.get("/api/chat/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const messages = await db.select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(asc(chatMessages.createdAt));

      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "메시지를 불러올 수 없습니다." });
    }
  });

  // Send a message
  app.post("/api/chat/:sessionId/message", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { message } = req.body;

      if (!message?.trim()) {
        return res.status(400).json({ error: "메시지를 입력해주세요." });
      }

      // Get session
      const [session] = await db.select()
        .from(chatSessions)
        .where(eq(chatSessions.sessionId, sessionId));

      if (!session) {
        return res.status(404).json({ error: "세션을 찾을 수 없습니다." });
      }

      // Save user message
      await db.insert(chatMessages).values({
        sessionId,
        role: "user",
        content: message,
        metadata: {}
      });

      // Extract user information from message
      const extractedInfo = await chatGPTService.extractUserInfo(message);
      
      // Update user profile if new info is found
      let updatedProfile = { ...session.userProfile, ...extractedInfo };
      let financialAnalysis = null;
      let apartmentRecommendations = null;

      // If we have enough info for budget calculation
      if (updatedProfile.salary && updatedProfile.cash && updatedProfile.purpose) {
        financialAnalysis = chatGPTService.calculateFinancialAnalysis(updatedProfile as UserProfile);
        
        // Update session with financial analysis
        await db.update(chatSessions)
          .set({
            userProfile: updatedProfile,
            maxBudget: financialAnalysis.maxBudget,
            maxLoan: financialAnalysis.maxLoan,
            updatedAt: new Date(),
          })
          .where(eq(chatSessions.sessionId, sessionId));

        // Get apartment recommendations
        apartmentRecommendations = await getApartmentRecommendations(
          updatedProfile as UserProfile,
          financialAnalysis,
          sessionId
        );
      } else if (Object.keys(extractedInfo).length > 0) {
        // Update profile with partial info
        await db.update(chatSessions)
          .set({
            userProfile: updatedProfile,
            updatedAt: new Date(),
          })
          .where(eq(chatSessions.sessionId, sessionId));
      }

      // Get conversation history
      const history = await db.select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(10);

      const conversationHistory = history.reverse().map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Generate AI response
      const context = {
        financialAnalysis,
        apartmentRecommendations,
        hasEnoughInfo: !!(updatedProfile.salary && updatedProfile.cash && updatedProfile.purpose)
      };

      const aiResponse = await chatGPTService.generateResponse(
        message,
        conversationHistory,
        updatedProfile as UserProfile,
        context
      );

      // Save AI response
      const [savedMessage] = await db.insert(chatMessages).values({
        sessionId,
        role: "assistant",
        content: aiResponse,
        metadata: {
          financialAnalysis,
          recommendations: apartmentRecommendations
        }
      }).returning();

      res.json({
        message: savedMessage,
        financialAnalysis,
        recommendations: apartmentRecommendations
      });

    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ error: "메시지 처리에 실패했습니다." });
    }
  });

  // Get apartment recommendations using enhanced recommender system
  async function getApartmentRecommendations(
    userProfile: UserProfile,
    financialAnalysis: any,
    sessionId: string
  ) {
    try {
      // Create recommendation filters
      const filters: RecommendationFilters = {
        purpose: userProfile.purpose || 'residence',
        maxBudget: financialAnalysis.maxBudget,
        maxLoanAmount: financialAnalysis.maxLoan,
        availableCash: userProfile.cash || 0,
        workLocation: userProfile.workLocation,
        preferredArea: userProfile.preferredArea,
      };

      // Get recommendations using the enhanced algorithm
      const recommendations = await ApartmentRecommender.getRecommendations(filters, 3);

      if (recommendations.length === 0) {
        return [];
      }

      // Set premium status (first recommendation free, rest premium)
      const processedRecommendations = recommendations.map((apt, index) => ({
        ...apt,
        rank: index + 1,
        isPremium: index > 0,
        reason: ApartmentRecommender.generateRecommendationReason(apt, filters)
      }));

      // Save recommendations to database
      if (processedRecommendations.length > 0) {
        const recommendationsToSave = processedRecommendations.map((apt) => ({
          sessionId,
          complexNo: apt.complexNo,
          rank: apt.rank,
          score: apt.score.toString(),
          reasons: apt.reasons,
          isPremium: apt.isPremium,
        }));

        // Note: Skipping recommendations save for now due to schema mismatch
      }

      return processedRecommendations;

    } catch (error) {
      console.error("Error getting apartment recommendations:", error);
      return [];
    }
  }

  // Get apartment details
  app.get("/api/apartments/:complexNo", async (req, res) => {
    try {
      const complexNo = parseInt(req.params.complexNo);
      
      const [apartment] = await db.select({
        complexNo: apartments.complexNo,
        complexName: apartments.complexName,
        sigungu: apartments.sigungu,
        dongName: apartments.dongName,
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
        highestPrice: apartmentPrices.highestPrice,
      })
      .from(apartments)
      .innerJoin(apartmentPrices, eq(apartments.complexNo, apartmentPrices.complexNo))
      .where(and(
        eq(apartments.complexNo, complexNo),
        eq(apartmentPrices.transactionType, '매매')
      ));

      if (!apartment) {
        return res.status(404).json({ error: "아파트를 찾을 수 없습니다." });
      }

      res.json(apartment);
    } catch (error) {
      console.error("Error fetching apartment details:", error);
      res.status(500).json({ error: "아파트 정보를 불러올 수 없습니다." });
    }
  });

  // Search apartments
  app.get("/api/apartments/search", async (req, res) => {
    try {
      const { 
        minPrice, 
        maxPrice, 
        sigungu, 
        purpose = 'residence',
        limit = 20 
      } = req.query;

      let query = db.select({
        complexNo: apartments.complexNo,
        complexName: apartments.complexName,
        sigungu: apartments.sigungu,
        dongName: apartments.dongName,
        detailAddress: apartments.detailAddress,
        salePrice: apartmentPrices.salePrice,
        leasePrice: apartmentPrices.leasePrice,
        gap: apartmentPrices.gap,
        leaseRate: apartmentPrices.leaseRate,
        changeFromPeak: apartmentPrices.changeFromPeak,
      })
      .from(apartments)
      .innerJoin(apartmentPrices, eq(apartments.complexNo, apartmentPrices.complexNo))
      .where(eq(apartmentPrices.transactionType, '매매'));

      // Apply filters
      const conditions = [];
      
      if (minPrice) {
        const field = purpose === 'gap_investment' ? apartmentPrices.gap : apartmentPrices.salePrice;
        conditions.push(gte(field, parseInt(minPrice as string)));
      }
      
      if (maxPrice) {
        const field = purpose === 'gap_investment' ? apartmentPrices.gap : apartmentPrices.salePrice;
        conditions.push(lte(field, parseInt(maxPrice as string)));
      }
      
      if (sigungu) {
        conditions.push(eq(apartments.sigungu, sigungu as string));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query.limit(parseInt(limit as string));
      
      res.json(results);
    } catch (error) {
      console.error("Error searching apartments:", error);
      res.status(500).json({ error: "검색에 실패했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
