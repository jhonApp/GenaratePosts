import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateImageService } from "@/services/image-service";
import { JobStatus, ImageJob } from "@prisma/client";

export const maxDuration = 60;

// Helper for delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  console.log("🔥 [DEBUG] Worker route /api/queue/process hit!");
  try {
    let jobs: ImageJob[] = [];
    try {
      jobs = await db.$queryRaw`
        SELECT * FROM "ImageJob"
        WHERE status = 'PENDING'::"JobStatus"
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;
    } catch (dbError) {
      console.error("❌ [DEBUG] Database Query Failed:", dbError);
      throw new Error("Database connection failed");
    }

    const job = jobs[0];

    if (!job) {
      console.log("ℹ️ [DEBUG] No PENDING jobs found.");
      return NextResponse.json({ message: "No pending jobs" });
    }

    const start = Date.now();
    console.log(`[Worker] Picking up job ${job.id}`);

    // Update to PROCESSING
    await db.imageJob.update({
      where: { id: job.id },
      data: { status: "PROCESSING" },
    });

    try {
      // 2. Call Generation Service
      const base64Image = await generateImageService(job.prompt);

      // 3. Save Success
      await db.imageJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          imageUrl: `data:image/png;base64,${base64Image}`,
        },
      });
      console.log(`[Worker] Job ${job.id} completed in ${Date.now() - start}ms`);

      // THROTTLING: Wait 12 seconds to respect Vertex AI Quota
      console.log("[Worker] Throttling for 12s...");
      await sleep(12000);

    } catch (error: any) {
      console.error(`[Worker] Job ${job.id} failed:`, error);

      const errorMessage = error.message || JSON.stringify(error);
      const isRateLimit = errorMessage.includes("429") || 
                          errorMessage.includes("Quota") || 
                          errorMessage.includes("RESOURCE_EXHAUSTED");

      if (isRateLimit) {
        // SMART RETRY: Set back to PENDING and wait
        console.warn("[Worker] Rate Limit hit. Re-queuing job and waiting 20s...");
        await db.imageJob.update({
          where: { id: job.id },
          data: { status: "PENDING" }, // Send back to queue
        });
        await sleep(20000);
      } else {
        // PERMANENT FAILURE
        await db.imageJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            errorMessage: errorMessage || "Unknown error",
          },
        });
      }
    }

    // 4. Recursive Call to process next item
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const workerUrl = `${baseUrl}/api/queue/process`;

    // Fire-and-forget next call
    fetch(workerUrl, { method: "POST" }).catch((e) =>
      console.error("Recursion failed", e)
    );

    return NextResponse.json({ processed: job.id });
  } catch (error: any) {
    console.error("Worker Error:", error);
    return NextResponse.json(
      { error: "Worker failed" },
      { status: 500 }
    );
  }
}
