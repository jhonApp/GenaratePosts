import { NextResponse } from "next/server";
import { db } from "@/lib/db";

import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobIds } = await request.json();

    if (!jobIds || !Array.isArray(jobIds)) {
      return NextResponse.json(
        { error: "jobIds array is required" },
        { status: 400 }
      );
    }

    const jobs = await db.imageJob.findMany({
      where: {
        id: { in: jobIds },
        userId: userId, // SECURITY: Only return jobs belonging to the current user
      },
      select: {
        id: true,
        status: true,
        imageUrl: true,
        errorMessage: true,
      },
    });

    return NextResponse.json({ jobs });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch job statuses" },
      { status: 500 }
    );
  }
}
