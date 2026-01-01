import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompts } = body;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { error: "Prompts array is required and cannot be empty" },
        { status: 400 }
      );
    }

    // 1. Process each prompt in PARALLEL (No Transaction)
    // Filter out empty prompts first
    const validPrompts = prompts.filter((p: any) => typeof p === 'string' && p.trim().length > 0);

    if (validPrompts.length === 0) {
        return NextResponse.json({ error: "No valid prompts to process" }, { status: 400 });
    }

    const jobIds = await Promise.all(
      validPrompts.map(async (prompt: string) => {
        const normalizedPrompt = prompt.trim();

        // Check for existing COMPLETED job with this prompt
        // Note: Caching can be global (any user) OR per-user. 
        // For general image generation, global caching is better for efficiency. 
        // But let's create the new record linked to THIS userId.
        const existingJob = await db.imageJob.findFirst({
          where: {
            prompt: normalizedPrompt,
            status: "COMPLETED",
            imageUrl: { not: null },
          },
          orderBy: { createdAt: "desc" }, // Get the most recent one
        });

        if (existingJob) {
          // CACHE HIT: Create a new job record for this user
          const cacheHitJob = await db.imageJob.create({
            data: {
              prompt: normalizedPrompt,
              status: "COMPLETED",
              imageUrl: existingJob.imageUrl,
              userId: userId, // Link to authenticated user
              errorMessage: "Served from cache",
            },
          });
          return cacheHitJob.id;
        } else {
          // CACHE MISS: Create PENDING job
          const newJob = await db.imageJob.create({
            data: {
              prompt: normalizedPrompt,
              status: "PENDING",
              userId: userId, // Link to authenticated user
            },
          });
          return newJob.id;
        }
      })
    );

    // 2. Trigger worker (Fire-and-forget)
    // We trigger unconditionally. The worker effectively handles "nothing to do" or "already processing"
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host");
    const workerUrl = `${protocol}://${host}/api/queue/process`;

    fetch(workerUrl, { method: "POST" }).catch((err) =>
      console.error("Failed to trigger worker:", err)
    );

    return NextResponse.json({ jobIds }, { status: 201 });
  } catch (error: any) {
    console.error("Create Job Error:", error);
    return NextResponse.json(
      { error: "Failed to create jobs" },
      { status: 500 }
    );
  }
}
