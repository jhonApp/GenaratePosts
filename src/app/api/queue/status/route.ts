import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { docClient } from "@/lib/dynamodb";
import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";

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

    if (jobIds.length === 0) {
        return NextResponse.json({ jobs: [] });
    }

    // DynamoDB BatchGetItem limit is 100 items by default, 
    // but simplified here assuming reasonable batch sizes from frontend polling.
    // Ideally we should chunk if > 100 or use existing library utility.
    // For now, assuming batch size < 100.

    const command = new BatchGetCommand({
      RequestItems: {
        ImageJobs: {
          Keys: jobIds.map((id) => ({ id })),
          ProjectionExpression: "id, #status, imageUrl, errorMessage, userId",
          ExpressionAttributeNames: {
            "#status": "status",
          },
        },
      },
    });

    const response = await docClient.send(command);
    const foundItems = response.Responses?.["ImageJobs"] || [];

    // Filter by userId for security and map to response format
    const jobs = foundItems
      .filter((item) => item.userId === userId)
      .map((item) => ({
        id: item.id,
        status: item.status,
        imageUrl: item.imageUrl,
        errorMessage: item.errorMessage,
      }));

    // Identify missing jobs if necessary, or just return what we found.
    // The previous implementation returned what was found.

    return NextResponse.json({ jobs });
  } catch (error: unknown) {
    console.error("Fetch Job Status Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job statuses" },
      { status: 500 }
    );
  }
}
