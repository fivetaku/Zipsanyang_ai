import { db } from "./db";
import { apartments, apartmentBaseInfo, apartmentKeyInfo, apartmentPrices } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";

interface Stage3Data {
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

interface Stage4Data {
  complexno: number;
  location: string;
  city: string;
  gu: string;
  dong: string;
  detail: string;
  latitude: number;
  longitude: number;
}

interface Stage5Data {
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

interface PriceListData {
  complexNo: number;
  salePrice: number;
  highestPrice: number;
  changeFromPeak: number;
  avgPrice: number;
  priceDate: string;
}

export async function importCSVData(csvDirectory: string) {
  console.log("Starting CSV data import...");

  try {
    // Import stage3_overview_results.csv
    await importStage3Data(path.join(csvDirectory, "stage3_overview_results.csv"));
    
    // Import stage4_baseinfo_results.csv
    await importStage4Data(path.join(csvDirectory, "stage4_baseinfo_results.csv"));
    
    // Import stage5_keyinfo_results.csv
    await importStage5Data(path.join(csvDirectory, "stage5_keyinfo_results.csv"));
    
    // Import apt_complex_price_list_seoul_filtered.csv
    await importPriceListData(path.join(csvDirectory, "apt_complex_price_list_seoul_filtered.csv"));

    console.log("CSV data import completed successfully!");
  } catch (error) {
    console.error("Error importing CSV data:", error);
    throw error;
  }
}

async function importStage3Data(filePath: string) {
  return new Promise<void>((resolve, reject) => {
    const data: Stage3Data[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        data.push({
          complexNo: parseInt(row.complexNo),
          complexName: row.complexName,
          dong_name: row.dong_name,
          sigungu: row.sigungu,
          detailAddress: row.detailAddress,
          useApproveYmd: row.useApproveYmd,
          totalHouseHoldCount: parseInt(row.totalHouseHoldCount) || 0,
          totalDongCount: parseInt(row.totalDongCount) || 0,
          realPrice_floor: parseFloat(row.realPrice_floor) || 0,
          realPrice_representativeArea: parseFloat(row.realPrice_representativeArea) || 0,
          realPrice_exclusiveArea: parseFloat(row.realPrice_exclusiveArea) || 0,
        });
      })
      .on('end', async () => {
        try {
          console.log(`Importing ${data.length} apartment records...`);
          
          // Insert in batches of 100
          for (let i = 0; i < data.length; i += 100) {
            const batch = data.slice(i, i + 100);
            await db.insert(apartments).values(batch.map(item => ({
              complexNo: item.complexNo,
              complexName: item.complexName,
              dongName: item.dong_name,
              sigungu: item.sigungu,
              detailAddress: item.detailAddress,
              useApproveYmd: item.useApproveYmd,
              totalHouseHoldCount: item.totalHouseHoldCount,
              totalDongCount: item.totalDongCount,
              realPriceFloor: item.realPrice_floor,
              realPriceRepresentativeArea: item.realPrice_representativeArea,
              realPriceExclusiveArea: item.realPrice_exclusiveArea,
            }))).onConflictDoNothing();
          }
          
          console.log("Stage 3 data imported successfully");
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importStage4Data(filePath: string) {
  return new Promise<void>((resolve, reject) => {
    const data: Stage4Data[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        data.push({
          complexno: parseInt(row.complexno),
          location: row.location,
          city: row.city,
          gu: row.gu,
          dong: row.dong,
          detail: row.detail,
          latitude: parseFloat(row.latitude) || 0,
          longitude: parseFloat(row.longitude) || 0,
        });
      })
      .on('end', async () => {
        try {
          console.log(`Importing ${data.length} base info records...`);
          
          for (let i = 0; i < data.length; i += 100) {
            const batch = data.slice(i, i + 100);
            await db.insert(apartmentBaseInfo).values(batch.map(item => ({
              complexNo: item.complexno,
              location: item.location,
              city: item.city,
              gu: item.gu,
              dong: item.dong,
              detail: item.detail,
              latitude: item.latitude,
              longitude: item.longitude,
            }))).onConflictDoNothing();
          }
          
          console.log("Stage 4 data imported successfully");
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importStage5Data(filePath: string) {
  return new Promise<void>((resolve, reject) => {
    const data: Stage5Data[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        data.push({
          complexNo: parseInt(row.complexNo),
          transactionType: row.transactionType,
          exclusiveArea: parseFloat(row.exclusiveArea) || 0,
          pyeong: parseFloat(row.pyeong) || 0,
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
      .on('end', async () => {
        try {
          console.log(`Importing ${data.length} key info records...`);
          
          for (let i = 0; i < data.length; i += 100) {
            const batch = data.slice(i, i + 100);
            await db.insert(apartmentKeyInfo).values(batch.map(item => ({
              complexNo: item.complexNo,
              transactionType: item.transactionType,
              exclusiveArea: item.exclusiveArea,
              pyeong: item.pyeong,
              lowFloorPrice: item.lowFloorPrice,
              salePrice: item.salePrice,
              leasePrice: item.leasePrice,
              gap: item.gap,
              leaseRate: item.leaseRate,
              recentSale: item.recentSale,
              highestPrice: item.highestPrice,
              changeFromPeak: item.changeFromPeak,
            }))).onConflictDoNothing();
          }
          
          console.log("Stage 5 data imported successfully");
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importPriceListData(filePath: string) {
  return new Promise<void>((resolve, reject) => {
    const data: PriceListData[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        data.push({
          complexNo: parseInt(row.complexNo),
          salePrice: parseFloat(row.salePrice) || 0,
          highestPrice: parseFloat(row.highestPrice) || 0,
          changeFromPeak: parseFloat(row.changeFromPeak) || 0,
          avgPrice: parseFloat(row.avgPrice) || 0,
          priceDate: row.priceDate,
        });
      })
      .on('end', async () => {
        try {
          console.log(`Importing ${data.length} price records...`);
          
          for (let i = 0; i < data.length; i += 100) {
            const batch = data.slice(i, i + 100);
            await db.insert(apartmentPrices).values(batch.map(item => ({
              complexNo: item.complexNo,
              salePrice: item.salePrice,
              highestPrice: item.highestPrice,
              changeFromPeak: item.changeFromPeak,
              avgPrice: item.avgPrice,
              priceDate: item.priceDate,
            }))).onConflictDoNothing();
          }
          
          console.log("Price list data imported successfully");
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// CLI tool to run data import
if (import.meta.url === `file://${process.argv[1]}`) {
  const csvDirectory = process.argv[2] || "./attached_assets";
  
  importCSVData(csvDirectory)
    .then(() => {
      console.log("Data import completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Data import failed:", error);
      process.exit(1);
    });
}
