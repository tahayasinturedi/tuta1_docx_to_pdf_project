import { randomUUID } from "crypto";
import type { Conversion, InsertConversion, UpdateConversion } from "@shared/schema";

// Storage interface - gelecekte farklı database'ler için
export interface IStorage {
  createConversion(conversion: InsertConversion): Promise<Conversion>;
  getConversion(id: string): Promise<Conversion | undefined>;
  getAllConversions(): Promise<Conversion[]>;
  updateConversion(id: string, updates: UpdateConversion): Promise<Conversion | undefined>;
  deleteConversion(id: string): Promise<boolean>;
  getConversionStats(): Promise<{
    totalUploaded: number;
    totalConverted: number;
    avgProcessingTime: string;
  }>;
}

// Memory'de (RAM'de) data saklama - development için
export class MemStorage implements IStorage {
  private conversions: Map<string, Conversion>;

  constructor() {
    this.conversions = new Map();
  }

  async createConversion(insertConversion: InsertConversion): Promise<Conversion> {
    const id = randomUUID();
    const conversion: Conversion = {
      ...insertConversion,
      id,
      createdAt: new Date(),
      completedAt: null,
    };
    this.conversions.set(id, conversion);
    return conversion;
  }

  async getConversion(id: string): Promise<Conversion | undefined> {
    return this.conversions.get(id);
  }

  async getAllConversions(): Promise<Conversion[]> {
    return Array.from(this.conversions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateConversion(id: string, updates: UpdateConversion): Promise<Conversion | undefined> {
    const existing = this.conversions.get(id);
    if (!existing) return undefined;

    const updated: Conversion = {
      ...existing,
      ...updates,
      ...(updates.status === "completed" && !existing.completedAt 
        ? { completedAt: new Date() } 
        : {}),
    };
    
    this.conversions.set(id, updated);
    return updated;
  }

  async deleteConversion(id: string): Promise<boolean> {
    return this.conversions.delete(id);
  }

  async getConversionStats(): Promise<{
    totalUploaded: number;
    totalConverted: number;
    avgProcessingTime: string;
  }> {
    const conversions = Array.from(this.conversions.values());
    const totalUploaded = conversions.length;
    const completed = conversions.filter(c => c.status === "completed");
    const totalConverted = completed.length;

    let avgProcessingTime = "--";
    if (completed.length > 0) {
      const totalTime = completed.reduce((sum, conv) => {
        if (conv.completedAt && conv.createdAt) {
          return sum + (conv.completedAt.getTime() - conv.createdAt.getTime());
        }
        return sum;
      }, 0);
      
      const avgMs = totalTime / completed.length;
      const avgSeconds = Math.round(avgMs / 1000);
      avgProcessingTime = `${avgSeconds}s`;
    }

    return {
      totalUploaded,
      totalConverted,
      avgProcessingTime,
    };
  }
}

// Export storage instance
export const storage = new MemStorage();