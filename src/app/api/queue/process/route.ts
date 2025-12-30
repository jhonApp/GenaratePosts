import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateImageService } from "@/services/image-service";
import { JobStatus, ImageJob } from "@prisma/client";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {

    const jobs: ImageJob[] = await db.$queryRaw`
      SELECT * FROM "ImageJob"
      WHERE status = 'PENDING'::"JobStatus"
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    const job = jobs[0];

    if (!job) {
      return NextResponse.json({ message: "No pending jobs" });
    }

    const start = Date.now();
    console.log(`[Worker] Picking up job ${job.id}`);

    // Update to PROCESSING immediately (though the lock technically holds it, 
    // updating status gives visibility to the UI)
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

    } catch (error: any) {
      console.error(`[Worker] Job ${job.id} failed:`, error);
      
      // 3. Save Failure
      await db.imageJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          errorMessage: error.message || "Unknown error",
        },
      });
    }

    // 4. Recursive Call to process next item
    // We call ourselves again to drain the queue
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host");
    const workerUrl = `${protocol}://${host}/api/queue/process`;

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
