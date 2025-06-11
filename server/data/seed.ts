import { db } from "../db";
import { apartments, apartmentPrices } from "@shared/schema";
import { sampleApartments, samplePrices } from "./sample-apartments";

export async function seedDatabase() {
  try {
    console.log("Starting database seeding with sample data...");

    // Clear existing data
    await db.delete(apartmentPrices);
    await db.delete(apartments);

    console.log("Cleared existing data");

    // Insert sample apartments
    console.log(`Inserting ${sampleApartments.length} apartment records...`);
    await db.insert(apartments).values(sampleApartments);

    // Insert sample apartment prices
    console.log(`Inserting ${samplePrices.length} price records...`);
    await db.insert(apartmentPrices).values(samplePrices);

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
