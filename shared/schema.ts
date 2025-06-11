import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const apartments = pgTable("apartments", {
  id: serial("id").primaryKey(),
  complexNo: integer("complex_no").notNull().unique(),
  complexName: text("complex_name").notNull(),
  dongName: text("dong_name").notNull(),
  sigungu: text("sigungu").notNull(),
  detailAddress: text("detail_address").notNull(),
  useApproveYmd: text("use_approve_ymd"),
  totalHouseHoldCount: integer("total_house_hold_count"),
  totalDongCount: integer("total_dong_count"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  city: text("city"),
  gu: text("gu"),
  dong: text("dong"),
});

export const apartmentPrices = pgTable("apartment_prices", {
  id: serial("id").primaryKey(),
  complexNo: integer("complex_no").notNull(),
  transactionType: text("transaction_type").notNull(), // "매매" or "전세"
  exclusiveArea: decimal("exclusive_area", { precision: 8, scale: 2 }),
  pyeong: decimal("pyeong", { precision: 8, scale: 2 }),
  lowFloorPrice: integer("low_floor_price"),
  salePrice: integer("sale_price"),
  leasePrice: integer("lease_price"),
  gap: integer("gap"),
  leaseRate: decimal("lease_rate", { precision: 5, scale: 2 }),
  recentSale: text("recent_sale"),
  highestPrice: integer("highest_price"),
  changeFromPeak: decimal("change_from_peak", { precision: 5, scale: 2 }),
  realPriceFloor: integer("real_price_floor"),
  realPriceRepresentativeArea: integer("real_price_representative_area"),
  realPriceExclusiveArea: integer("real_price_exclusive_area"),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userProfile: jsonb("user_profile").$type<{
    purpose?: 'residence' | 'gap_investment';
    salary?: number;
    cash?: number;
    workLocation?: string;
    preferredArea?: string;
    debt?: number;
  }>(),
  maxBudget: integer("max_budget"),
  maxLoan: integer("max_loan"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<{
    apartments?: any[];
    financialAnalysis?: any;
    recommendations?: any[];
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  complexNo: integer("complex_no").notNull(),
  rank: integer("rank").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }),
  reasons: text("reasons").array(),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertApartmentSchema = createInsertSchema(apartments);
export const insertApartmentPriceSchema = createInsertSchema(apartmentPrices);
export const insertChatSessionSchema = createInsertSchema(chatSessions);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertRecommendationSchema = createInsertSchema(recommendations);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Apartment = typeof apartments.$inferSelect;
export type ApartmentPrice = typeof apartmentPrices.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;

export type InsertApartment = z.infer<typeof insertApartmentSchema>;
export type InsertApartmentPrice = z.infer<typeof insertApartmentPriceSchema>;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
