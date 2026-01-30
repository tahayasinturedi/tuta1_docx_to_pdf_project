import {z} from "zod";

export interface Conversion {
    id: string;
    filename: string;
    originalSize: number;
    status: "uploading" | "converting" | "completed" | "failed";
    progress: number;
    s3Key: string;
    pdfS3Key: string | null;
    pdfSize?: number | null;
    error: string | null; 
    createdAt: Date;
    completedAt:Date | null;
}

export type InsertConversion = Omit<Conversion, "id" | "createAt" | "completedAT">;

export type UpdateConversion = Partial<Omit<Conversion, "id" | "createdAt" >>;

export const insertConversionSchema = z.object({
    filename: z.string().min(1),
    originalSize: z.number().positive(),
    status: z.enum(["uploading", "converting", "completed", "failed"]),
    progress: z.number().min(0).max(100),
    s3Key: z.string(),
    pdfS3Key: z.string().nullable(),
    pdfSize: z.number().nullable().optional(),
    error: z.string().nullable(),
});

export const updateConversionSchema = insertConversionSchema.partial();