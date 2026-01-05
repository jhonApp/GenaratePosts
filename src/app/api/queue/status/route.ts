import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { docClient } from "@/lib/dynamodb";
import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobIds } = await request.json();

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ jobs: [] });
    }

    // DynamoDB BatchGetCommand (Limit 100 items per batch)
    const command = new BatchGetCommand({
      RequestItems: {
        ImageJobs: {
          Keys: jobIds.map((id) => ({ id })),
          ProjectionExpression: "id, #s, imageUrl, errorMessage, userId",
          ExpressionAttributeNames: { "#s": "status" },
        },
      },
    });

    const response = await docClient.send(command);
    const items = response.Responses?.["ImageJobs"] || [];

    // Security: Only return jobs that belong to the current user
    const jobs = items
      .filter((item) => item.userId === userId)
      .map((item) => ({
        id: item.id,
        status: item.status,
        imageUrl: item.imageUrl || null,
        errorMessage: item.errorMessage || null,
      }));

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Status API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job status" },
      { status: 500 }
    );
  }
}
