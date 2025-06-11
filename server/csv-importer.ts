import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { db } from './db';
import { 
  apartmentComplexes, 
  apartmentBaseInfo, 
  apartmentKeyInfo, 
  apartmentPriceList, 
  apartmentList 
} from '@shared/schema';

export class CSVImporter {
  
  /**
   * 모든 CSV 파일을 가져와서 데이터베이스에 저장
   */
  static async importAllCSVData() {
    try {
      console.log('Starting CSV import...');
      
      // 1. stage3_overview_results.csv - 아파트 복합체 기본 정보
      await this.importOverviewData();
      
      // 2. stage4_baseinfo_results.csv - 아파트 위치 정보
      await this.importBaseInfoData();
      
      // 3. stage5_keyinfo_results.csv - 아파트 핵심 정보
      await this.importKeyInfoData();
      
      // 4. apt_complex_price_list_seoul_filtered.csv - 가격 리스트
      await this.importPriceListData();
      
      // 5. apt_list.csv - 아파트 리스트
      await this.importApartmentListData();
      
      console.log('CSV import completed successfully!');
      
    } catch (error) {
      console.error('CSV import failed:', error);
      throw error;
    }
  }

  /**
   * stage3_overview_results.csv 가져오기
   */
  private static async importOverviewData() {
    const csvPath = path.join(process.cwd(), 'attached_assets', 'stage3_overview_results.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('stage3_overview_results.csv not found, skipping...');
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Importing ${records.length} overview records...`);

    const chunks = this.chunkArray(records, 100);
    
    for (const chunk of chunks) {
      const data = chunk.map((record: any) => ({
        complexNo: parseInt(record.complexNo) || 0,
        complexName: record.complexName || '',
        dongName: record.dong_name || '',
        sigungu: record.sigungu || '',
        detailAddress: record.detailAddress || '',
        useApproveYmd: record.useApproveYmd || '',
        totalHouseHoldCount: parseInt(record.totalHouseHoldCount) || 0,
        totalDongCount: parseInt(record.totalDongCount) || 0,
        realPriceFloor: record.realPrice_floor ? parseFloat(record.realPrice_floor) : null,
        realPriceRepresentativeArea: record.realPrice_representativeArea ? parseFloat(record.realPrice_representativeArea) : null,
        realPriceExclusiveArea: record.realPrice_exclusiveArea ? parseFloat(record.realPrice_exclusiveArea) : null,
      }));

      await db.insert(apartmentComplexes).values(data).onConflictDoNothing();
    }

    console.log('Overview data import completed');
  }

  /**
   * stage4_baseinfo_results.csv 가져오기
   */
  private static async importBaseInfoData() {
    const csvPath = path.join(process.cwd(), 'attached_assets', 'stage4_baseinfo_results.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('stage4_baseinfo_results.csv not found, skipping...');
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Importing ${records.length} base info records...`);

    const chunks = this.chunkArray(records, 100);
    
    for (const chunk of chunks) {
      const data = chunk.map((record: any) => ({
        complexNo: parseInt(record.complexno) || 0,
        location: record.location || '',
        city: record.city || '',
        gu: record.gu || '',
        dong: record.dong || '',
        detail: record.detail || '',
        latitude: record.latitude ? parseFloat(record.latitude) : null,
        longitude: record.longitude ? parseFloat(record.longitude) : null,
      }));

      await db.insert(apartmentBaseInfo).values(data).onConflictDoNothing();
    }

    console.log('Base info data import completed');
  }

  /**
   * stage5_keyinfo_results.csv 가져오기
   */
  private static async importKeyInfoData() {
    const csvPath = path.join(process.cwd(), 'attached_assets', 'stage5_keyinfo_results.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('stage5_keyinfo_results.csv not found, skipping...');
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Importing ${records.length} key info records...`);

    const chunks = this.chunkArray(records, 100);
    
    for (const chunk of chunks) {
      const data = chunk.map((record: any) => ({
        complexNo: parseInt(record.complexNo) || 0,
        transactionType: record.transactionType === '매매' ? 'sale' : 'lease',
        exclusiveArea: record.exclusiveArea ? parseFloat(record.exclusiveArea) : null,
        pyeong: record.pyeong ? parseFloat(record.pyeong) : null,
        lowFloorPrice: record.lowFloorPrice ? parseInt(record.lowFloorPrice) : null,
        salePrice: record.salePrice ? parseInt(record.salePrice) : null,
        leasePrice: record.leasePrice ? parseInt(record.leasePrice) : null,
        gap: record.gap ? parseInt(record.gap) : null,
        leaseRate: record.leaseRate ? parseFloat(record.leaseRate) : null,
        recentSale: record.recentSale || '',
        highestPrice: record.highestPrice ? parseInt(record.highestPrice) : null,
        changeFromPeak: record.changeFromPeak ? parseFloat(record.changeFromPeak) : null,
      }));

      await db.insert(apartmentKeyInfo).values(data).onConflictDoNothing();
    }

    console.log('Key info data import completed');
  }

  /**
   * apt_complex_price_list_seoul_filtered.csv 가져오기
   */
  private static async importPriceListData() {
    const csvPath = path.join(process.cwd(), 'attached_assets', 'apt_complex_price_list_seoul_filtered.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('apt_complex_price_list_seoul_filtered.csv not found, skipping...');
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Importing ${records.length} price list records...`);

    const chunks = this.chunkArray(records, 100);
    
    for (const chunk of chunks) {
      const data = chunk.map((record: any) => ({
        complexNo: parseInt(record.complexNo) || 0,
        salePrice: record.salePrice ? parseFloat(record.salePrice) : null,
        highestPrice: record.highestPrice ? parseFloat(record.highestPrice) : null,
        changeFromPeak: record.changeFromPeak ? parseFloat(record.changeFromPeak) : null,
        avgPrice: record.avgPrice ? parseFloat(record.avgPrice) : null,
        priceDate: record.priceDate || '',
      }));

      await db.insert(apartmentPriceList).values(data).onConflictDoNothing();
    }

    console.log('Price list data import completed');
  }

  /**
   * apt_list.csv 가져오기
   */
  private static async importApartmentListData() {
    const csvPath = path.join(process.cwd(), 'attached_assets', 'apt_list.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('apt_list.csv not found, skipping...');
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Importing ${records.length} apartment list records...`);

    const chunks = this.chunkArray(records, 100);
    
    for (const chunk of chunks) {
      const data = chunk.map((record: any) => ({
        dongName: record.dong_name || '',
        aptName: record.apt_name || '',
      }));

      await db.insert(apartmentList).values(data).onConflictDoNothing();
    }

    console.log('Apartment list data import completed');
  }

  /**
   * 배열을 청크 단위로 나누기
   */
  private static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 데이터베이스 테이블 초기화
   */
  static async clearAllTables() {
    console.log('Clearing all tables...');
    
    await db.delete(apartmentList);
    await db.delete(apartmentPriceList);
    await db.delete(apartmentKeyInfo);
    await db.delete(apartmentBaseInfo);
    await db.delete(apartmentComplexes);
    
    console.log('All tables cleared');
  }
}
