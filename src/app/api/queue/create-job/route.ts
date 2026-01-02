import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { docClient } from "@/lib/dynamodb";
import { sqsClient } from "@/lib/sqs";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { randomUUID } from "crypto";

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

    const validPrompts = prompts.filter(
      (p: unknown) => typeof p === "string" && p.trim().length > 0
    );

    if (validPrompts.length === 0) {
      return NextResponse.json(
        { error: "No valid prompts to process" },
        { status: 400 }
      );
    }

    const jobIds = await Promise.all(
      validPrompts.map(async (prompt: string) => {
        const normalizedPrompt = prompt.trim();
        const jobId = randomUUID();

        // 1. Check for existing COMPLETED job (Cache Hit)
        // Requires GSI: PromptIndex (Partition Key: prompt)
        try {
          const queryCmd = new QueryCommand({
            TableName: "ImageJobs", // Assumed Table Name
            IndexName: "PromptIndex",
            KeyConditionExpression: "#prompt = :prompt",
            FilterExpression: "#status = :status AND attribute_exists(imageUrl)",
            ExpressionAttributeNames: {
              "#prompt": "prompt",
              "#status": "status",
            },
            ExpressionAttributeValues: {
              ":prompt": normalizedPrompt,
              ":status": "COMPLETED",
            },
            Limit: 1,
            ScanIndexForward: false, // Descending? No timestamp in sort key of GSI usually, but if added...
            // GSI Sort Key: createdAt (if available) to get latest
          });
          
          const existing = await docClient.send(queryCmd);
          
          if (existing.Items && existing.Items.length > 0) {
             const cachedJob = existing.Items[0];
             // Create a new record relying on cached data
             const newJobItem = {
                id: jobId,
                userId: userId,
                prompt: normalizedPrompt,
                status: "COMPLETED",
                imageUrl: cachedJob.imageUrl,
                errorMessage: "Served from cache",
                createdAt: new Date().toISOString(),
             };
             
             await docClient.send(new PutCommand({
                TableName: "ImageJobs",
                Item: newJobItem,
             }));
             return jobId;
          }
        } catch (err) {
            console.error("Cache lookup failed (might be missing GSI), proceeding to create new job:", err);
            // Fallback to creating new job if query fails
        }

        // 2. Create PENDING Job
        const item = {
          id: jobId,
          userId: userId,
          prompt: normalizedPrompt,
          status: "PENDING",
          createdAt: new Date().toISOString(),
        };

        await docClient.send(
          new PutCommand({
            TableName: "ImageJobs",
            Item: item,
          })
        );

        // 3. Send to SQS
        const queueUrl = process.env.AWS_SQS_QUEUE_URL!;
        await sqsClient.send(
          new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify({ jobId, prompt: normalizedPrompt, userId }),
          })
        );

        return jobId;
      })
    );

    return NextResponse.json({ jobIds }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create Job Error:", error);
    return NextResponse.json(
      { error: "Failed to create jobs" },
      { status: 500 }
    );
  }
}
