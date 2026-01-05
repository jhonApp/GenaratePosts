import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { docClient } from "@/lib/dynamodb";
import { sqsClient } from "@/lib/sqs";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { randomUUID, createHash } from "crypto";

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
        // 1. Normalization & Fingerprint
        const normalizedPrompt = prompt.trim();
        // Create MD5 hash of the normalized prompt (case-insensitive for better hit rate)
        const promptHash = createHash("md5")
          .update(normalizedPrompt.toLowerCase())
          .digest("hex");
          
        const jobId = randomUUID();

        // 2. Exact Semantic Cache Check
        try {
          const queryCmd = new QueryCommand({
            TableName: "ImageJobs",
            IndexName: "PromptHashIndex",
            KeyConditionExpression: "promptHash = :hash",
            FilterExpression: "#status = :status AND attribute_exists(imageUrl)",
            ExpressionAttributeNames: {
              "#status": "status",
            },
            ExpressionAttributeValues: {
              ":hash": promptHash,
              ":status": "COMPLETED",
            },
            Limit: 1,
          });
          
          const existing = await docClient.send(queryCmd);
          
          if (existing.Items && existing.Items.length > 0) {
             const cachedJob = existing.Items[0];
             // CACHE HIT: Return existing data immediately
             // We return a structure that the frontend needs. 
             // Note: The frontend likely expects just IDs or status.
             // But if we want to be "smart", we assume the frontend might poll this ID.
             // If we return the OLD ID, the frontend will poll an old COMPLETED job.
             // If we create a NEW ID pointing to OLD data, we duplicate data but give a fresh handle.
             // The requirement says: "return JSON with { success: true, jobId: id_encontrado ... }"
             // But this map function returns just the ID to the outer array.
             // We'll stick to returning the ID of the EXISTING job so the frontend polls it and gets instant "COMPLETED".
             
             // However, strictly complying with the "return ... immediately" part of the prompt
             // might mean we need to adjust the response structure. 
             // BUT this is inside a map(), so we return the ID to be sent locally.
             
             // Optimization: If we return the OLD ID, ensure the user has permission to view it?
             // Since it's a semantic cache, it's public knowledge? 
             // If userId differs, the other user might not see it if querying by userId.
             // So we MUST create a new "Reference" Job or copy the data to a new Job ID for THIS user.
             // Strategy: Duplicate the success record to a new Job ID for the current user.
             
             const newJobItem = {
                id: jobId,
                userId: userId,
                prompt: normalizedPrompt,
                promptHash: promptHash, // Store hash for future consistency
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
            console.error("Cache lookup failed:", err);
            // Proceed to generate
        }

        // 3. Cache MISS: Create PENDING Job
        const item = {
          id: jobId,
          userId: userId,
          prompt: normalizedPrompt,
          promptHash: promptHash, // Make sure to save the hash!
          status: "PENDING",
          createdAt: new Date().toISOString(),
        };

        await docClient.send(
          new PutCommand({
            TableName: "ImageJobs",
            Item: item,
          })
        );

        // 4. Send to SQS
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
