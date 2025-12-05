import {z} from "zod";

export interface Conversion {
    id: string;
    filename: string;
    orginalSize: number;
    status: "uploading" | "converting" | "completed" | "failed";
    progress: number;
    s3Key: string;
    pdfS3Key: string | null;
    pdfSize?: number | null;
    error: string | null; 

}