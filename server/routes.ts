import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { insertConversionSchema, updateConversionSchema } from "@shared/schema";
import { randomUUID } from "crypto";

// Configure AWS clients
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-north-1", //Possible error. If there is problem you can check here. 
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || "eu-north-1", //Possible error. If there is problem you can check here.
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || "document-converter-tuta-projekt-input";
const LAMBDA_FUNCTION_NAME = process.env.LAMBDA_FUNCTION_NAME || "docx-to-pdf-converter";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      cb(null, true);
    } else {
      cb(new Error("Only .docx files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload endpoint
  app.post("/api/upload", upload.array("files"), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const conversions = [];

      for (const file of files) {
        let conversion;
        try {
          // Create conversion record
          conversion = await storage.createConversion({
            filename: file.originalname,
            originalSize: file.size,
            status: "uploading",
            progress: 0,
            s3Key: "",
            pdfS3Key: null,
            error: null,
            createdAt: new Date()
          });

          // Upload to S3
          const s3Key = `uploads/${conversion.id}/${file.originalname}`;
          const uploadCommand = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
          await s3Client.send(uploadCommand);

          // Update conversion with S3 key and set status to converting
          const updatedConversion = await storage.updateConversion(conversion.id, {
            s3Key,
            status: "converting",
            progress: 25,
          });

          // Trigger Lambda function for conversion
          const lambdaPayload = {
            conversionId: conversion.id,
            s3Bucket: S3_BUCKET,
            s3Key: s3Key,
            outputKey: `converted/${conversion.id}/${file.originalname.replace('.docx', '.pdf')}`,
          };

          const invokeCommand = new InvokeCommand({
            FunctionName: LAMBDA_FUNCTION_NAME,
            InvocationType: "Event", // Async invocation
            Payload: JSON.stringify(lambdaPayload),
          });

          await lambdaClient.send(invokeCommand);

          conversions.push(updatedConversion);
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          if(conversion){
              await storage.updateConversion(conversion.id, {
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error occurred",
            });
          } 
        }
      }

      res.json({ 
        message: "Files uploaded successfully", 
        conversions: conversions.filter(Boolean) 
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Upload failed" 
      });
    }
  });

  // Get all conversions
  app.get("/api/conversions", async (req, res) => {
    try {
      const conversions = await storage.getAllConversions();
      res.json(conversions);
    } catch (error) {
      console.error("Error fetching conversions:", error);
      res.status(500).json({ message: "Failed to fetch conversions" });
    }
  });

  // Get conversion stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getConversionStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Update conversion status (webhook endpoint for Lambda)
  app.post("/api/conversions/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateConversionSchema.parse(req.body);
      
      const conversion = await storage.updateConversion(id, updates);
      if (!conversion) {
        return res.status(404).json({ message: "Conversion not found" });
      }

      res.json(conversion);
    } catch (error) {
      console.error("Error updating conversion status:", error);
      res.status(500).json({ message: "Failed to update conversion status" });
    }
  });

  // Download PDF endpoint
  app.get("/api/download/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const conversion = await storage.getConversion(id);
      
      if (!conversion || !conversion.pdfS3Key) {
        return res.status(404).json({ message: "PDF not found" });
      }

      if (conversion.status !== "completed") {
        return res.status(400).json({ message: "Conversion not completed yet" });
      }

      // Generate presigned URL for download
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: conversion.pdfS3Key,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      
      res.json({ downloadUrl: signedUrl });
    } catch (error) {
      console.error("Error generating download URL:", error);
      res.status(500).json({ message: "Failed to generate download URL" });
    }
  });

  // Delete conversion
  app.delete("/api/conversions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteConversion(id);
      
      if (!success) {
        return res.status(404).json({ message: "Conversion not found" });
      }

      res.json({ message: "Conversion deleted successfully" });
    } catch (error) {
      console.error("Error deleting conversion:", error);
      res.status(500).json({ message: "Failed to delete conversion" });
    }
  });

  // Retry conversion
  app.post("/api/conversions/:id/retry", async (req, res) => {
    try {
      const { id } = req.params;
      const conversion = await storage.getConversion(id);
      
      if (!conversion) {
        return res.status(404).json({ message: "Conversion not found" });
      }

      // Reset conversion status
      const updatedConversion = await storage.updateConversion(id, {
        status: "converting",
        progress: 25,
        error: null,
      });

      // Trigger Lambda function again
      const lambdaPayload = {
        conversionId: conversion.id,
        s3Bucket: S3_BUCKET,
        s3Key: conversion.s3Key,
        outputKey: `converted/${conversion.id}/${conversion.filename.replace('.docx', '.pdf')}`,
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        InvocationType: "Event",
        Payload: JSON.stringify(lambdaPayload),
      });

      await lambdaClient.send(invokeCommand);

      res.json(updatedConversion);
    } catch (error) {
      console.error("Error retrying conversion:", error);
      res.status(500).json({ message: "Failed to retry conversion" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}