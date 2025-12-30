import { NextResponse } from "next/server";
import { ImageJob } from "@prisma/client";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompts } = body;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { error: "Prompts array is required and cannot be empty" },
        { status: 400 }
      );
    }

    // 1. Create jobs in database
    const createdJobs = await db.$transaction(
      prompts.map((prompt: string) =>
        db.imageJob.create({
          data: {
            prompt,
            status: "PENDING",
            userId: "user-123", // Mocked user ID
          },
        })
      )
    );

    const jobIds = createdJobs.map((job: ImageJob) => job.id);

    // 2. Trigger worker (Fire-and-forget)
    // We construct the absolute URL to call our own API
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host");
    const workerUrl = `${protocol}://${host}/api/queue/process`;

    // Asynchronously call the worker without awaiting result
    fetch(workerUrl, {
      method: "POST",
    }).catch((err) => console.error("Failed to trigger worker:", err));

    return NextResponse.json({ jobIds }, { status: 201 });
  } catch (error: any) {
    console.error("Create Job Error:", error);
    return NextResponse.json(
      { error: "Failed to create jobs" },
      { status: 500 }
    );
  }
}
