import { db } from "../db";
import { apartments, apartmentPrices } from "@shared/schema";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

interface OverviewResult {
  complexNo: number;
  complexName: string;
  dong_name: string;
  sigungu: string;
  detailAddress: string;
  useApproveYmd: string;
  totalHouseHoldCount: number;
  totalDongCount: number;
  realPrice_floor: number;
  realPrice_representativeArea: number;
  realPrice_exclusiveArea: number;
}

interface BaseInfoResult {
  complexno: number;
  location: string;
  city: string;
  gu: string;
  dong: string;
  detail: string;
  latitude: number;
  longitude: number;
}

interface KeyInfoResult {
  complexNo: number;
  transactionType: string;
  exclusiveArea: number;
  pyeong: number;
  lowFloorPrice: number;
  salePrice: number;
  leasePrice: number;
  gap: number;
  leaseRate: number;
  recentSale: string;
  highestPrice: number;
  changeFromPeak: number;
}

interface PriceListResult {
  complexNo: number;
  salePrice: number;
  highestPrice: number;
  changeFromPeak: number;
  avgPrice: number;
  priceDate: string;
}

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Clear existing data
    await db.delete(apartmentPrices);
    await db.delete(apartments);

    console.log("Cleared existing data");

    // Read and process CSV files
    const csvDir = path.join(process.cwd(), "attached_assets");
    
    // Process overview data
    const overviewData: OverviewResult[] = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(csvDir, "stage3_overview_results.csv"))
        .pipe(csv())
        .on("data", (row) => {
          overviewData.push({
            complexNo: parseInt(row.complexNo),
            complexName: row.complexName,
            dong_name: row.dong_name,
            sigungu: row.sigungu,
            detailAddress: row.detailAddress,
            useApproveYmd: row.useApproveYmd,
            totalHouseHoldCount: parseInt(row.totalHouseHoldCount) || 0,
            totalDongCount: parseInt(row.totalDongCount) || 0,
            realPrice_floor: parseInt(row.realPrice_floor) || 0,
            realPrice_representativeArea: parseInt(row.realPrice_representativeArea) || 0,
            realPrice_exclusiveArea: parseInt(row.realPrice_exclusiveArea) || 0,
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // Process base info data
    const baseInfoData: BaseInfoResult[] = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(csvDir, "stage4_baseinfo_results.csv"))
        .pipe(csv())
        .on("data", (row) => {
          baseInfoData.push({
            complexno: parseInt(row.complexno),
            location: row.location,
            city: row.city,
            gu: row.gu,
            dong: row.dong,
            detail: row.detail,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // Process key info data
    const keyInfoData: KeyInfoResult[] = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(csvDir, "stage5_keyinfo_results.csv"))
        .pipe(csv())
        .on("data", (row) => {
          keyInfoData.push({
            complexNo: parseInt(row.complexNo),
            transactionType: row.transactionType,
            exclusiveArea: parseFloat(row.exclusiveArea),
            pyeong: parseFloat(row.pyeong),
            lowFloorPrice: parseInt(row.lowFloorPrice) || 0,
            salePrice: parseInt(row.salePrice) || 0,
            leasePrice: parseInt(row.leasePrice) || 0,
            gap: parseInt(row.gap) || 0,
            leaseRate: parseFloat(row.leaseRate) || 0,
            recentSale: row.recentSale,
            highestPrice: parseInt(row.highestPrice) || 0,
            changeFromPeak: parseFloat(row.changeFromPeak) || 0,
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    console.log(`Loaded ${overviewData.length} overview records`);
    console.log(`Loaded ${baseInfoData.length} base info records`);
    console.log(`Loaded ${keyInfoData.length} key info records`);

    // Merge data and insert apartments
    const apartmentMap = new Map();
    
    // Start with overview data
    overviewData.forEach(overview => {
      apartmentMap.set(overview.complexNo, {
        complexNo: overview.complexNo,
        complexName: overview.complexName,
        dongName: overview.dong_name,
        sigungu: overview.sigungu,
        detailAddress: overview.detailAddress,
        useApproveYmd: overview.useApproveYmd,
        totalHouseHoldCount: overview.totalHouseHoldCount,
        totalDongCount: overview.totalDongCount,
      });
    });

    // Merge with base info data
    baseInfoData.forEach(baseInfo => {
      const existing = apartmentMap.get(baseInfo.complexno);
      if (existing) {
        apartmentMap.set(baseInfo.complexno, {
          ...existing,
          latitude: baseInfo.latitude.toString(),
          longitude: baseInfo.longitude.toString(),
          city: baseInfo.city,
          gu: baseInfo.gu,
          dong: baseInfo.dong,
        });
      }
    });

    // Insert apartments in batches
    const apartmentRecords = Array.from(apartmentMap.values()).filter(apt => 
      apt.complexNo && apt.complexName && apt.sigungu
    );

    console.log(`Inserting ${apartmentRecords.length} apartment records...`);
    
    const batchSize = 100;
    for (let i = 0; i < apartmentRecords.length; i += batchSize) {
      const batch = apartmentRecords.slice(i, i + batchSize);
      try {
        await db.insert(apartments).values(batch);
        console.log(`Inserted apartment batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(apartmentRecords.length/batchSize)}`);
      } catch (error) {
        console.error(`Error inserting apartment batch ${i}-${i + batchSize}:`, error);
      }
    }

    // Insert apartment prices
    const priceRecords = keyInfoData.filter(key => 
      key.complexNo && key.transactionType && apartmentMap.has(key.complexNo)
    ).map(key => ({
      complexNo: key.complexNo,
      transactionType: key.transactionType,
      exclusiveArea: key.exclusiveArea.toString(),
      pyeong: key.pyeong.toString(),
      lowFloorPrice: key.lowFloorPrice,
      salePrice: key.salePrice,
      leasePrice: key.leasePrice,
      gap: key.gap,
      leaseRate: key.leaseRate.toString(),
      recentSale: key.recentSale,
      highestPrice: key.highestPrice,
      changeFromPeak: key.changeFromPeak.toString(),
      realPriceFloor: 0,
      realPriceRepresentativeArea: 0,
      realPriceExclusiveArea: 0,
    }));

    console.log(`Inserting ${priceRecords.length} price records...`);
    
    for (let i = 0; i < priceRecords.length; i += batchSize) {
      const batch = priceRecords.slice(i, i + batchSize);
      try {
        await db.insert(apartmentPrices).values(batch);
        console.log(`Inserted price batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(priceRecords.length/batchSize)}`);
      } catch (error) {
        console.error(`Error inserting price batch ${i}-${i + batchSize}:`, error);
      }
    }

    console.log("Database seeding completed successfully!");
    
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Seeding finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
